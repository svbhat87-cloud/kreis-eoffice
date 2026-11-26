const CHUNK = 300000;
const MAX_CHARS = 8000000;
const ID_RE = /^[A-Za-z0-9_\-]{1,120}$/;

function splitSafe(text) {
  const parts = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + CHUNK, text.length);
    if (end < text.length) {
      const c = text.charCodeAt(end - 1);
      if (c >= 0xD800 && c <= 0xDBFF) end--;
    }
    parts.push(text.slice(i, end));
    i = end;
  }
  if (!parts.length) parts.push('');
  return parts;
}

function corsInfo(request, env) {
  const origin = request.headers.get('Origin') || '';
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'X-Updated-At',
    'Access-Control-Max-Age': '7200',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
  if (!list.length) headers['Access-Control-Allow-Origin'] = '*';
  else if (origin && list.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return { headers, blocked: !!(list.length && origin && !list.includes(origin)) };
}

function reply(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function isAdmin(request, url, env) {
  if (!env.ADMIN_TOKEN) return false;
  const h = request.headers.get('Authorization') || '';
  const given = h.startsWith('Bearer ') ? h.slice(7) : (url.searchParams.get('token') || '');
  return given === env.ADMIN_TOKEN;
}

async function getData(env, id) {
  const [m, c] = await env.DB.batch([
    env.DB.prepare('SELECT updated_at, nparts FROM meta WHERE id = ?').bind(id),
    env.DB.prepare('SELECT body FROM chunks WHERE id = ? ORDER BY n').bind(id),
  ]);
  const meta = m.results[0];
  if (!meta) return null;
  const rows = c.results;
  if (rows.length !== meta.nparts) throw new Error('stored data is incomplete for ' + id);
  return { updated_at: meta.updated_at, text: rows.length === 1 ? rows[0].body : rows.map(r => r.body).join('') };
}

async function putData(env, id, text, updatedAt) {
  const parts = splitSafe(text);
  const stmts = [env.DB.prepare('DELETE FROM chunks WHERE id = ?').bind(id)];
  parts.forEach((p, n) => stmts.push(env.DB.prepare('INSERT INTO chunks (id, n, body) VALUES (?, ?, ?)').bind(id, n, p)));
  stmts.push(env.DB.prepare(
    'INSERT INTO meta (id, updated_at, nparts) VALUES (?, ?, ?) ' +
    'ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, nparts = excluded.nparts'
  ).bind(id, updatedAt, parts.length));
  await env.DB.batch(stmts);
}

// ======================= WhatsApp OTP + ಸಂಖ್ಯೆ ಕ್ಯಾಪ್ಚಾ =======================
// Secrets (Worker > Settings > Variables and Secrets):
//   OTP_SECRET (ಕಡ್ಡಾಯ, ಯಾದೃಚ್ಛಿಕ ಉದ್ದ ಪಠ್ಯ), WA_TOKEN, WA_PHONE_ID, WA_TEMPLATE (ಉದಾ: mdrs_otp)
// ಐಚ್ಛಿಕ: WA_API_VERSION (ಡೀಫಾಲ್ಟ್ v21.0), OTP_DRY_RUN=1 (ಪರೀಕ್ಷೆಗೆ ಮಾತ್ರ), OTP_DEBUG=1,
//         OTP_DAILY_CAP (ಡೀಫಾಲ್ಟ್ 400), OTP_IP_CAP (ಡೀಫಾಲ್ಟ್ 150)
const OTP_TTL = 300;       // ಸೆಕೆಂಡ್ (5 ನಿಮಿಷ)
const CAPTCHA_TTL = 120;   // ಸೆಕೆಂಡ್
const SESSION_TTL = 12 * 3600;
const PROOF_TTL = 300;
const COOLDOWN = 30;       // ಒಂದೇ ಮೊಬೈಲ್+ಉದ್ದೇಶಕ್ಕೆ ಎರಡು OTP ನಡುವೆ ಸೆಕೆಂಡ್
const MOBILE_RE = /^[6-9]\d{9}$/;
// ಉದ್ದೇಶ -> ದಿನಕ್ಕೆ ಒಂದು ಮೊಬೈಲ್‌ಗೆ ಗರಿಷ್ಠ OTP
const OTP_LIMITS = { login: 8, verify_doc: 2, parent_marks: 5, sign: 80, batch: 40, cl_submit: 30, approve: 80 };
const PUBLIC_PURPOSES = ['login', 'verify_doc', 'parent_marks']; // ಕ್ಯಾಪ್ಚಾ ಬೇಕು
let OTP_READY = false;

const te = new TextEncoder();
const nowS = () => Math.floor(Date.now() / 1000);
const istDay = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uText = (s) => b64u(te.encode(s));
function fromB64uText(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
}
async function hmac(env, text) {
  const key = await crypto.subtle.importKey('raw', te.encode(env.OTP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, te.encode(text)));
}
async function sha256(text) { return b64u(await crypto.subtle.digest('SHA-256', te.encode(text))); }
async function signToken(env, obj) { const p = b64uText(JSON.stringify(obj)); return p + '.' + await hmac(env, p); }
async function readToken(env, tok) {
  if (typeof tok !== 'string' || tok.indexOf('.') < 1) return null;
  const [p, s] = tok.split('.');
  if (s !== await hmac(env, p)) return null;
  let o; try { o = JSON.parse(fromB64uText(p)); } catch (e) { return null; }
  return (o && o.exp > nowS()) ? o : null;
}
function rnd(n) { return crypto.getRandomValues(new Uint32Array(1))[0] % n; }

async function otpEnsure(env) {
  if (OTP_READY) return;
  const s = (q) => env.DB.prepare(q);
  await env.DB.batch([
    s('CREATE TABLE IF NOT EXISTS otp_captcha (id TEXT PRIMARY KEY, ans TEXT, exp INTEGER, used INTEGER DEFAULT 0)'),
    s('CREATE TABLE IF NOT EXISTS otp_codes (id TEXT PRIMARY KEY, mobile TEXT, purpose TEXT, ref TEXT, hash TEXT, exp INTEGER, tries INTEGER DEFAULT 0, used INTEGER DEFAULT 0)'),
    s('CREATE TABLE IF NOT EXISTS otp_log (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT, mobile TEXT, purpose TEXT, ip TEXT, ts INTEGER)'),
    s('CREATE INDEX IF NOT EXISTS otp_log_m ON otp_log (day, mobile, purpose)'),
    s('CREATE INDEX IF NOT EXISTS otp_log_d ON otp_log (day)'),
  ]);
  OTP_READY = true;
}

function captchaSvg(digits) {
  const W = 170, Hh = 56; let g = '';
  for (let i = 0; i < 7; i++) g += `<line x1="${rnd(W)}" y1="${rnd(Hh)}" x2="${rnd(W)}" y2="${rnd(Hh)}" stroke="#${['8a8a8a', '9aa7c7', 'c79a9a', '9ac7a5'][rnd(4)]}" stroke-width="${1 + rnd(2)}"/>`;
  for (let i = 0; i < 40; i++) g += `<circle cx="${rnd(W)}" cy="${rnd(Hh)}" r="1" fill="#999"/>`;
  [...digits].forEach((d, i) => {
    const x = 18 + i * 29, y = 38 + rnd(8) - 4, r = rnd(41) - 20;
    g += `<text x="${x}" y="${y}" font-size="${30 + rnd(7)}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" fill="#${['1a237e', '4a148c', '1b5e20', '880e4f', '263238'][rnd(5)]}" transform="rotate(${r} ${x} ${y})">${d}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><rect width="${W}" height="${Hh}" fill="#f3f4f6"/>${g}</svg>`;
}

async function sendWhatsApp(env, mobile, code) {
  const ver = env.WA_API_VERSION || 'v21.0';
  const body = {
    messaging_product: 'whatsapp', to: '91' + mobile, type: 'template',
    template: {
      name: env.WA_TEMPLATE || 'mdrs_otp', language: { code: env.WA_LANG || 'en' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ],
    },
  };
  const r = await fetch(`https://graph.facebook.com/${ver}/${env.WA_PHONE_ID}/messages`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + env.WA_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j.error && j.error.message) || ('HTTP ' + r.status)); e.waCode = j.error && j.error.code; throw e; }
}

async function otpRoute(request, url, env, H, path) {
  if (!env.OTP_SECRET) return reply({ ok: false, error: 'OTP ಸೇವೆ ಸಿದ್ಧವಾಗಿಲ್ಲ', code: 'not_configured' }, 503, H);
  await otpEnsure(env);
  const t = nowS(), day = istDay();

  if (request.method === 'GET' && path === '/api/otp/captcha') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM otp_captcha WHERE exp < ?').bind(t - 3600),
      env.DB.prepare('DELETE FROM otp_codes WHERE exp < ?').bind(t - 3600),
      env.DB.prepare('DELETE FROM otp_log WHERE day < ?').bind(new Date(Date.now() + 19800000 - 8 * 86400000).toISOString().slice(0, 10)),
    ]);
    const digits = Array.from({ length: 5 }, () => rnd(10)).join('');
    const cid = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO otp_captcha (id, ans, exp) VALUES (?, ?, ?)').bind(cid, digits, t + CAPTCHA_TTL).run();
    return reply({ ok: true, cid, svg: captchaSvg(digits), expires_in: CAPTCHA_TTL }, 200, H);
  }

  if (request.method !== 'POST') return reply({ error: 'not found' }, 404, H);
  let b; try { b = await request.json(); } catch (e) { return reply({ ok: false, error: 'bad request' }, 400, H); }
  if (!b || typeof b !== 'object') return reply({ ok: false, error: 'bad request' }, 400, H);

  // ---------- OTP ಕಳುಹಿಸು ----------
  if (path === '/api/otp/send') {
    const purpose = String(b.purpose || ''), mobile = String(b.mobile || '').replace(/\D/g, '').slice(-10), ref = String(b.ref || '').slice(0, 120);
    if (!(purpose in OTP_LIMITS)) return reply({ ok: false, error: 'ಅಮಾನ್ಯ ಉದ್ದೇಶ', code: 'bad_purpose' }, 400, H);
    if (!MOBILE_RE.test(mobile)) return reply({ ok: false, error: 'ಮಾನ್ಯ 10 ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ', code: 'bad_mobile' }, 400, H);

    if (PUBLIC_PURPOSES.includes(purpose)) {
      const cid = String(b.cid || ''), cans = String(b.cans || '').trim();
      const row = cid ? await env.DB.prepare('SELECT ans, exp, used FROM otp_captcha WHERE id = ?').bind(cid).first() : null;
      if (row) await env.DB.prepare('UPDATE otp_captcha SET used = 1 WHERE id = ?').bind(cid).run(); // ಒಮ್ಮೆ ಮಾತ್ರ
      if (!row || row.used || row.exp < t || row.ans !== cans) return reply({ ok: false, error: 'ಕ್ಯಾಪ್ಚಾ ತಪ್ಪಾಗಿದೆ. ಹೊಸ ಚಿತ್ರ ನೋಡಿ ಮತ್ತೆ ನಮೂದಿಸಿ', code: 'bad_captcha' }, 400, H);
    } else {
      const s = await readToken(env, b.session);
      if (!s || s.m !== mobile) return reply({ ok: false, error: 'ಸೆಷನ್ ಮುಗಿದಿದೆ. ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಿ', code: 'no_session' }, 401, H);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'x';
    const cnt = async (q, ...a) => ((await env.DB.prepare(q).bind(...a).first()) || {}).n || 0;
    if (await cnt('SELECT COUNT(*) AS n FROM otp_log WHERE mobile = ? AND purpose = ? AND ts > ?', mobile, purpose, t - COOLDOWN))
      return reply({ ok: false, error: 'ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ (30 ಸೆಕೆಂಡ್) ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', code: 'cooldown' }, 429, H);
    if (await cnt('SELECT COUNT(*) AS n FROM otp_log WHERE day = ? AND mobile = ? AND purpose = ?', day, mobile, purpose) >= OTP_LIMITS[purpose])
      return reply({ ok: false, error: purpose === 'verify_doc' ? 'ಈಗಾಗಲೇ ಈ ದಿನ ಗರಿಷ್ಠ ಮಿತಿ (2 OTP) ಬಳಸಿದ್ದೀರಿ. ನಾಳೆ ಪ್ರಯತ್ನಿಸಿ' : 'ಇಂದಿನ OTP ಮಿತಿ ಮುಗಿದಿದೆ. ನಾಳೆ ಪ್ರಯತ್ನಿಸಿ', code: 'daily_limit' }, 429, H);
    if (await cnt('SELECT COUNT(*) AS n FROM otp_log WHERE day = ? AND ip = ?', day, ip) >= Number(env.OTP_IP_CAP || 150))
      return reply({ ok: false, error: 'ಈ ನೆಟ್‌ವರ್ಕ್‌ನಿಂದ ಹೆಚ್ಚು ವಿನಂತಿಗಳು. ನಂತರ ಪ್ರಯತ್ನಿಸಿ', code: 'ip_limit' }, 429, H);
    if (await cnt('SELECT COUNT(*) AS n FROM otp_log WHERE day = ?', day) >= Number(env.OTP_DAILY_CAP || 400))
      return reply({ ok: false, error: 'ಇಂದಿನ ಒಟ್ಟು OTP ಮಿತಿ ಮುಗಿದಿದೆ', code: 'global_cap' }, 429, H);

    const code = String(rnd(1000000)).padStart(6, '0'), oid = crypto.randomUUID();
    const hash = await sha256(env.OTP_SECRET + ':' + oid + ':' + code);
    const lg = await env.DB.prepare('INSERT INTO otp_log (day, mobile, purpose, ip, ts) VALUES (?, ?, ?, ?, ?)').bind(day, mobile, purpose, ip, t).run();
    await env.DB.prepare('INSERT INTO otp_codes (id, mobile, purpose, ref, hash, exp) VALUES (?, ?, ?, ?, ?, ?)').bind(oid, mobile, purpose, ref, hash, t + OTP_TTL).run();
    if (env.OTP_DRY_RUN === '1') return reply({ ok: true, oid, expires_in: OTP_TTL, dev_code: code }, 200, H);
    try { await sendWhatsApp(env, mobile, code); }
    catch (e) {
      await env.DB.batch([env.DB.prepare('DELETE FROM otp_codes WHERE id = ?').bind(oid), env.DB.prepare('DELETE FROM otp_log WHERE id = ?').bind(lg.meta.last_row_id)]);
      console.error('otp send failed', e.message);
      return reply({ ok: false, error: 'WhatsApp OTP ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ನಂತರ ಪ್ರಯತ್ನಿಸಿ', code: 'send_failed', detail: env.OTP_DEBUG === '1' ? e.message : undefined }, 502, H);
    }
    return reply({ ok: true, oid, expires_in: OTP_TTL }, 200, H);
  }

  // ---------- OTP ಪರಿಶೀಲಿಸು ----------
  if (path === '/api/otp/verify') {
    const oid = String(b.oid || ''), code = String(b.code || '').trim();
    if (!oid || !/^\d{6}$/.test(code)) return reply({ ok: false, error: '6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ', code: 'bad_code' }, 400, H);
    const row = await env.DB.prepare('SELECT mobile, purpose, ref, hash, exp, tries, used FROM otp_codes WHERE id = ?').bind(oid).first();
    if (!row || row.used || row.exp < t) return reply({ ok: false, error: 'OTP ಅವಧಿ ಮುಗಿದಿದೆ. ಹೊಸ OTP ಪಡೆಯಿರಿ', code: 'expired' }, 400, H);
    if (row.tries >= 3) return reply({ ok: false, error: 'ತುಂಬಾ ತಪ್ಪು ಪ್ರಯತ್ನಗಳು. ಹೊಸ OTP ಪಡೆಯಿರಿ', code: 'too_many' }, 429, H);
    await env.DB.prepare('UPDATE otp_codes SET tries = tries + 1 WHERE id = ?').bind(oid).run();
    if (row.hash !== await sha256(env.OTP_SECRET + ':' + oid + ':' + code)) return reply({ ok: false, error: 'OTP ತಪ್ಪಾಗಿದೆ', code: 'wrong', left: 2 - row.tries }, 400, H);
    const done = await env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ? AND used = 0').bind(oid).run();
    if (!done.meta.changes) return reply({ ok: false, error: 'OTP ಈಗಾಗಲೇ ಬಳಕೆಯಾಗಿದೆ', code: 'used' }, 400, H);
    const out = { ok: true, purpose: row.purpose, ref: row.ref, proof: await signToken(env, { o: oid, m: row.mobile, p: row.purpose, r: row.ref, exp: t + PROOF_TTL }) };
    if (row.purpose === 'login') out.session = await signToken(env, { m: row.mobile, exp: t + SESSION_TTL });
    return reply(out, 200, H);
  }

  // ---------- proof ಮಾನ್ಯವೇ ----------
  if (path === '/api/otp/proof') {
    const p = await readToken(env, b.proof);
    return reply({ ok: !!p, purpose: p && p.p, ref: p && p.r }, 200, H);
  }
  return reply({ error: 'not found' }, 404, H);
}

export default {
  async fetch(request, env) {
    const cors = corsInfo(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors.headers });
    if (cors.blocked) return reply({ error: 'origin not allowed' }, 403, cors.headers);

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const id = url.searchParams.get('id') || '';
    const H = cors.headers;

    try {
      if (path.startsWith('/api/otp/')) return await otpRoute(request, url, env, H, path);
      if (request.method === 'GET') {
        if (path === '/' || path === '/api/ping') return reply({ ok: true, store: 'cloudflare-d1', now: new Date().toISOString() }, 200, H);
        if (path === '/api/time') return reply({ now: new Date().toISOString() }, 200, H);

        if (path === '/api/meta') {
          if (!ID_RE.test(id)) return reply({ error: 'bad id' }, 400, H);
          const row = await env.DB.prepare('SELECT updated_at FROM meta WHERE id = ?').bind(id).first();
          return row ? reply({ id, updated_at: row.updated_at }, 200, H) : reply({ error: 'not found' }, 404, H);
        }

        if (path === '/api/data') {
          if (!ID_RE.test(id)) return reply({ error: 'bad id' }, 400, H);
          const got = await getData(env, id);
          if (!got) return reply({ error: 'not found' }, 404, H);
          return new Response(got.text, { status: 200, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8', 'X-Updated-At': got.updated_at } });
        }

        if (path === '/api/count') {
          const prefix = (url.searchParams.get('prefix') || '').replace(/[\\%_]/g, '\\$&');
          const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM meta WHERE id LIKE ? ESCAPE '\\'").bind(prefix + '%').first();
          return reply({ count: row ? row.n : 0 }, 200, H);
        }

        if (path === '/api/stats') {
          if (!isAdmin(request, url, env)) return reply({ error: 'admin token required' }, 401, H);
          const rows = await env.DB.prepare(
            'SELECT m.id AS id, m.updated_at AS updated_at, m.nparts AS nparts, ' +
            '(SELECT SUM(LENGTH(c.body)) FROM chunks c WHERE c.id = m.id) AS chars FROM meta m ORDER BY m.id'
          ).all();
          return reply({ rows: rows.results, total: rows.results.length }, 200, H);
        }
      }

      if (request.method === 'POST') {
        if (path === '/api/put' || path === '/api/import') {
          if (!ID_RE.test(id)) return reply({ error: 'bad id' }, 400, H);
          let updatedAt = new Date().toISOString();
          if (path === '/api/import') {
            if (!isAdmin(request, url, env)) return reply({ error: 'admin token required' }, 401, H);
            const given = url.searchParams.get('updated_at');
            if (given && /^\d{4}-\d{2}-\d{2}T/.test(given)) updatedAt = given;
          }
          const text = await request.text();
          if (text.length > MAX_CHARS) return reply({ error: 'value too large' }, 413, H);
          const first = text.trimStart()[0];
          if (first !== '{' && first !== '[') return reply({ error: 'body must be JSON' }, 400, H);
          await putData(env, id, text, updatedAt);
          return reply({ ok: true, id, updated_at: updatedAt, chars: text.length }, 200, H);
        }

        if (path === '/api/delete') {
          if (!ID_RE.test(id)) return reply({ error: 'bad id' }, 400, H);
          await env.DB.batch([
            env.DB.prepare('DELETE FROM chunks WHERE id = ?').bind(id),
            env.DB.prepare('DELETE FROM meta WHERE id = ?').bind(id),
          ]);
          return reply({ ok: true }, 200, H);
        }
      }

      return reply({ error: 'not found' }, 404, H);
    } catch (e) {
      return reply({ error: String((e && e.message) || e) }, 500, H);
    }
  },
};