/* =====================================================================
   KREIS e-Office v35 — meetings.js
   ಸಭೆ ನೋಂದಣಿ — Meeting registers
   ===================================================================== */
function renderMeetingReg(type){
  const label=type==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ';
  const icon=type==='parents'?'👥':'🏛️';
  const myMeetings=DB.meetings.filter(m=>m.meetingType===type).slice().reverse();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>${icon} ${label} ರಿಜಿಸ್ಟರ್</h2>
    </div>

    <div class="panel"><h3>➕ ಹೊಸ ಸಭೆ ನಮೂದಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಸಭೆ ದಿನಾಂಕ</label><input type="date" id="mtg_date" value="${todayStr()}"></div>
        <div class="field"><label>ಸಭೆ ಸಮಯ</label><input id="mtg_time" placeholder="ಉದಾ: 10:00 AM"></div>
        <div class="field"><label>ಸ್ಥಳ/ವೇದಿಕೆ</label><input id="mtg_venue" placeholder="ಶಾಲೆ ಸಭಾಂಗಣ"></div>
        <div class="field"><label>ಅಧ್ಯಕ್ಷತೆ</label><input id="mtg_chair" value="ಪ್ರಾಂಶುಪಾಲರು"></div>
        <div class="field" style="grid-column:1/-1;"><label>ಚರ್ಚಿಸಿದ ವಿಷಯಗಳು (Agenda)</label>
          <textarea id="mtg_agenda" rows="4" placeholder="1. ಮೊದಲ ವಿಷಯ&#10;2. ಎರಡನೇ ವಿಷಯ&#10;3. ..." style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font-kn);font-size:13px;"></textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>ತೆಗೆದ ನಿರ್ಣಯ/ಮಿನಿಟ್ಸ್</label>
          <textarea id="mtg_minutes" rows="4" placeholder="ಸಭೆಯಲ್ಲಿ ತೆಗೆದ ನಿರ್ಣಯಗಳು..." style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font-kn);font-size:13px;"></textarea></div>
        ${type==='parents'?`<div class="field" style="grid-column:1/-1;"><label>ಹಾಜರಿದ್ದ ಪಾಲಕರ ಸಂಖ್ಯೆ</label><input id="mtg_parents" type="number" placeholder="ಪಾಲಕರ ಸಂಖ್ಯೆ"></div>`:''}
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="createMeeting('${type}')">✅ ಸಭೆ ಸೃಷ್ಟಿಸಿ → ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ಹಿಂದಿನ ${label}ಗಳು (${myMeetings.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ದಿನಾಂಕ</th><th>ಸ್ಥಳ</th><th>Agenda</th><th>Sign ಸ್ಥಿತಿ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${myMeetings.length ? myMeetings.map(m=>{
        const signedCount=Object.values(m.staffSignatures||{}).filter(s=>s.signed).length;
        const totalStaff=STAFF.filter(s=>s.role==='staff').length;
        return `<tr>
          <td>${fmtDate(m.date)}</td>
          <td>${esc(m.venue)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(m.agenda||'').slice(0,50)}...</td>
          <td>${signedCount}/${totalStaff+1} signed</td>
          <td><span class="badge ${badgeClass(m.status)}">${esc(m.status)}</span></td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-outline" onclick="viewMeeting('${m.id}')">👁 View</button>
            ${m.status==='Closed'?`<button class="btn btn-sm btn-gold" onclick="printMeeting('${m.id}')">🖨️ Print</button>`:''}
          </td>
        </tr>`;
      }).join('') : `<tr class="empty-row"><td colspan="6">ಯಾವ ${label} ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="mtgPreviewWrap"></div>`;
}

function createMeeting(type){
  const date=document.getElementById('mtg_date').value;
  const time=document.getElementById('mtg_time').value;
  const venue=document.getElementById('mtg_venue').value;
  const chair=document.getElementById('mtg_chair').value;
  const agenda=document.getElementById('mtg_agenda').value;
  const minutes=document.getElementById('mtg_minutes').value;
  const parentsCount=document.getElementById('mtg_parents')?.value||'';
  if(!date||!agenda){ showToast('⚠ ದಿನಾಂಕ ಮತ್ತು Agenda ಅಗತ್ಯ'); return; }

  const staffList=STAFF.filter(s=>s.role==='staff');
  const signatures={};
  staffList.forEach(s=>{ signatures[s.name]={signed:false, signedAt:null}; });

  const mtg={
    id:uid(), meetingType:type, date, time, venue, chair, agenda, minutes, parentsCount,
    createdBy:CURRENT_USER.name, createdAt:todayStr(),
    status:'Staff Signing',
    staffSignatures:signatures,
    principalSigned:false, principalSignedAt:null, principalName:null,
    closedAt:null
  };
  DB.meetings.push(mtg); saveDB();

  // Notify all staff
  staffList.forEach(s=>pushNotification(s.name,'✍️ '+(type==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ')+' Sign ಅಗತ್ಯ: '+fmtDate(date)+' — "ಸಭೆ ಸ್ವೀಕೃತಿ" ನಲ್ಲಿ Sign ಮಾಡಿ'));
  showToast('✅ ಸಭೆ ರಿಜಿಸ್ಟರ್ ಸೃಷ್ಟಿಸಲಾಗಿದೆ — '+staffList.length+' ಸಿಬ್ಬಂದಿ ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  type==='parents'?navigate('parentsmtg'):navigate('staffmtg');
}

function renderMtgSign(){
  const myPending = CURRENT_USER.role==='principal'
    ? DB.meetings.filter(m=>m.status==='Sent to Principal')
    : DB.meetings.filter(m=>m.staffSignatures&&m.staffSignatures[CURRENT_USER.name]&&!m.staffSignatures[CURRENT_USER.name].signed&&m.status==='Staff Signing');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✍️ ಸಭೆ ಸ್ವೀಕೃತಿ (Meeting Sign)</h2>
    <div class="desc">${CURRENT_USER.role==='principal'?'Principal — ಸಭೆ ಮಿನಿಟ್ಸ್ ಅನುಮೋದಿಸಿ E-Sign ಮಾಡಿ':'ನಿಮ್ಮ ಹೆಸರಿನ ಮೇಲೆ ಸಭೆ ಮಿನಿಟ್ಸ್ ಓದಿ Sign ಮಾಡಿ'}</div></div>

    ${!myPending.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">Sign ಅಗತ್ಯವಿರುವ ಯಾವ ಸಭೆ ಇಲ್ಲ ✅</div></div>':''}
    ${myPending.map(m=>{
      const typeLabel=m.meetingType==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ';
      const signedCount=Object.values(m.staffSignatures||{}).filter(s=>s.signed).length;
      const totalStaff=Object.keys(m.staffSignatures||{}).length;
      return `<div class="panel">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <div>
            <h3 style="margin:0;">${typeLabel} — ${fmtDate(m.date)}</h3>
            <div class="small-muted">${esc(m.venue)} · ${esc(m.time)} · ಅಧ್ಯಕ್ಷ: ${esc(m.chair)}</div>
            <div class="small-muted">${signedCount}/${totalStaff} ಸಿಬ್ಬಂದಿ Sign ಆಗಿದ್ದಾರೆ</div>
          </div>
        </div>
        <div style="background:var(--surface-2);padding:12px;border-radius:8px;margin-bottom:12px;">
          <div style="font-weight:700;margin-bottom:6px;">Agenda:</div>
          <div style="white-space:pre-wrap;font-family:var(--font-kn);font-size:13px;">${esc(m.agenda)}</div>
          ${m.minutes?`<div style="font-weight:700;margin:8px 0 4px;">ನಿರ್ಣಯ/ಮಿನಿಟ್ಸ್:</div>
          <div style="white-space:pre-wrap;font-family:var(--font-kn);font-size:13px;">${esc(m.minutes)}</div>`:''}
        </div>
        <div class="form-actions">
          ${CURRENT_USER.role==='principal'?
            `<button class="btn btn-primary" onclick="signMeetingPrincipal('${m.id}')">✍️ E-Sign & ಮುಚ್ಚಿ → FDA ಗೆ Print ಗೆ ಕಳುಹಿಸಿ</button>`:
            `<button class="btn btn-primary" onclick="signMeetingStaff('${m.id}')">✍️ ನಾನು ಓದಿ ಸಹಿ ಮಾಡಿದ್ದೇನೆ (E-Sign)</button>`}
        </div>
      </div>`;
    }).join('')}`;
}

function signMeetingStaff(mtgId){
  const m=DB.meetings.find(x=>x.id===mtgId); if(!m) return;
  if(!m.staffSignatures[CURRENT_USER.name]) m.staffSignatures[CURRENT_USER.name]={};
  m.staffSignatures[CURRENT_USER.name].signed=true;
  m.staffSignatures[CURRENT_USER.name].signedAt=todayStr();
  // Check if all staff signed
  const allSigned=Object.values(m.staffSignatures).every(s=>s.signed);
  if(allSigned){
    m.status='Sent to Principal';
    const p=STAFF.find(x=>x.role==='principal');
    if(p) pushNotification(p.name,'✍️ '+(m.meetingType==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ')+' ('+fmtDate(m.date)+') ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ Sign ಆಗಿದ್ದಾರೆ — Principal Sign ಅಗತ್ಯ');
  }
  saveDB(); showToast('✅ ನಿಮ್ಮ E-Sign ದಾಖಲಾಗಿದೆ'+(allSigned?' — ಎಲ್ಲಾ Signed! Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ':''));
  navigate('mtgsign');
}

function signMeetingPrincipal(mtgId){
  const m=DB.meetings.find(x=>x.id===mtgId); if(!m) return;
  m.principalSigned=true; m.principalSignedAt=todayStr(); m.principalName=CURRENT_USER.name;
  m.status='Closed'; m.closedAt=todayStr(); saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ '+(m.meetingType==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ')+' ('+fmtDate(m.date)+') Principal Sign ಆಗಿ ಮುಚ್ಚಲಾಗಿದೆ — Print ಮಾಡಬಹುದು'));
  showToast('✅ Sign ಆಗಿ ಮುಚ್ಚಲಾಗಿದೆ — FDA Print ಮಾಡಬಹುದು');
  navigate('mtgsign');
}

function viewMeeting(mtgId){
  const m=DB.meetings.find(x=>x.id===mtgId); if(!m) return;
  const typeLabel=m.meetingType==='parents'?'ಪಾಲಕರ ಸಭೆ':'ಸಿಬ್ಬಂದಿ ಸಭೆ';
  const staffSigs=Object.entries(m.staffSignatures||{}).map(([name,s])=>`
    <tr><td>${esc(name)}</td><td>${s.signed?`✅ ${fmtDate(s.signedAt)}`:'⏳ ಬಾಕಿ'}</td></tr>`).join('');

  const html=`<div class="letterhead-paper">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ — ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</div>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320
      </div>
    </div>
    <div style="text-align:center;font-size:16px;font-weight:800;margin:10px 0;">${typeLabel} ರಿಜಿಸ್ಟರ್</div>
    <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px;">
      <tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:700;width:35%;">ಸಭೆ ದಿನಾಂಕ</td><td style="padding:5px 8px;border:1px solid #ccc;">${fmtDate(m.date)}</td>
          <td style="padding:5px 8px;border:1px solid #ccc;font-weight:700;">ಸಮಯ</td><td style="padding:5px 8px;border:1px solid #ccc;">${esc(m.time)}</td></tr>
      <tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:700;">ಸ್ಥಳ</td><td style="padding:5px 8px;border:1px solid #ccc;">${esc(m.venue)}</td>
          <td style="padding:5px 8px;border:1px solid #ccc;font-weight:700;">ಅಧ್ಯಕ್ಷ</td><td style="padding:5px 8px;border:1px solid #ccc;">${esc(m.chair)}</td></tr>
      ${m.parentsCount?`<tr><td style="padding:5px 8px;border:1px solid #ccc;font-weight:700;">ಹಾಜರಿದ್ದ ಪಾಲಕರ ಸಂಖ್ಯೆ</td><td style="padding:5px 8px;border:1px solid #ccc;" colspan="3">${esc(m.parentsCount)}</td></tr>`:''}
    </table>
    <div style="font-weight:700;margin-bottom:6px;font-size:12px;">ಸಿಬ್ಬಂದಿ ಸಹಿ:</div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:12px;">
      <thead><tr style="background:#f0f0f0;"><th style="padding:4px 8px;border:1px solid #ccc;text-align:left;">ಹೆಸರು</th><th style="padding:4px 8px;border:1px solid #ccc;">ಸಹಿ / ದಿನಾಂಕ</th></tr></thead>
      <tbody>${staffSigs}</tbody>
    </table>
    <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:4px;">
      <div style="font-weight:700;margin-bottom:6px;">ಚರ್ಚಿಸಿದ ವಿಷಯಗಳು (Agenda):</div>
      <div style="white-space:pre-wrap;font-family:var(--font-kn);font-size:13px;line-height:1.8;">${esc(m.agenda)}</div>
    </div>
    ${m.minutes?`<div style="border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:4px;">
      <div style="font-weight:700;margin-bottom:6px;">ತೆಗೆದ ನಿರ್ಣಯ/ಮಿನಿಟ್ಸ್:</div>
      <div style="white-space:pre-wrap;font-family:var(--font-kn);font-size:13px;line-height:1.8;">${esc(m.minutes)}</div>
    </div>`:''}
    ${m.principalSigned?principalSignatureHTML(m.principalName, m.principalSignedAt, fmtDate(m.principalSignedAt)):''}
    <div style="display:flex;justify-content:flex-end;margin-top:28px;font-size:12px;">
      <div style="text-align:right;">${typeof PRINCIPAL_SIGN!=='undefined'?`<div style="height:34px;"></div><div style="border-top:1.5px solid #000;padding-top:4px;font-size:10px;font-family:var(--font-kn);text-align:right;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ | MDRS Bhatkal</div>`:`<div style="margin-bottom:40px;border-top:1.5px solid #000;padding-top:4px;font-size:11px;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div>`}</div>
    </div>
  </div>`;

  const wrap=document.getElementById('mtgPreviewWrap')||document.getElementById('content');
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print PDF</button>
      <button class="btn btn-outline" onclick="navigate(CURRENT_PAGE)">✕ ಮುಚ್ಚಿ</button>
    </div>
    ${html}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
  // Init QR codes
  setTimeout(()=>{
    if(d.docNo&&d.verifyURL) makeQRCode('qr_sc_'+d.id, d.verifyURL||getVerifyURL(d.docNo,d.docType));
    if(d.docNo&&!d.verifyURL) makeQRCode('qr_sc_'+d.id, getVerifyURL(d.docNo,d.docType));
  },100);
}

function printMeeting(id){ viewMeeting(id); setTimeout(()=>window.print(),500); }

;(window.__LOADED=window.__LOADED||[]).push('meetings');
