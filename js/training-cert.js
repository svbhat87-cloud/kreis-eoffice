/* ================= ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ (Teacher Training Attendance Certificate) ================= */
var ATT_TR=null, ATT_TAB='draft';
const ATT_DATES={'ಕನ್ನಡ':'2026-11-18','ವಿಜ್ಞಾನ':'2026-11-19'};
const ATT_SCHOOL='ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ';
const ATT_DEF={
  letterNo:'ಮೊದೇವಶಾ/ತರಬೇತಿ/ಸಿ.ಆರ್11/2026-27', principalName:'ನಾಗಾರಾಜ ಹೆದ್ದಾರಿಮನೆ',
  subjectText:'2026-27ನೇ ಸಾಲಿನ ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ. ಪರೀಕ್ಷೆಯಲ್ಲಿ ಶೇ.100ರಷ್ಟು ಉತ್ತೀರ್ಣತೆಯೊಂದಿಗೆ ಗುಣಮಟ್ಟದ ಫಲಿತಾಂಶ ಸಾಧಿಸುವ ಉದ್ದೇಶದಿಂದ ವಿಷಯ ಶಿಕ್ಷಕರಿಗೆ ಜಿಲ್ಲಾ ಹಂತದಲ್ಲಿ ತರಬೇತಿ ನೀಡುವ ಕುರಿತು.',
  refs:'ಮಾನ್ಯ ಕಾರ್ಯನಿರ್ವಾಹಕ ನಿರ್ದೇಶಕರ ಅಧಿಕೃತ ಜ್ಞಾಪನ ಸಂಖ್ಯೆ: KREIS/EDN/OTH/154/2026-EDU-374897 ದಿನಾಂಕ: 16-11-2026.',
  trainingDate:'2026-11-19',
  purpose:'10ನೇ ತರಗತಿಯ ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ. ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ ಸುಧಾರಣೆಯ ಉದ್ದೇಶದಿಂದ ಆಯೋಜಿಸಲಾದ',
  topic:'ಕನ್ನಡ ವಿಷಯದ ಜಿಲ್ಲಾ ಮಟ್ಟದ ತರಬೇತಿ ಕಾರ್ಯಾಗಾರದಲ್ಲಿ', subject:'ಕನ್ನಡ',
  body3:'ಸದರಿ ಕಾರ್ಯಾಗಾರದಲ್ಲಿ ಕನ್ನಡ ವಿಷಯದ ಬೋಧನಾ ವಿಧಾನಗಳು, ವಿಷಯ ನಿರ್ದಿಷ್ಟ ವಿಧಾನ (Subject Specific Approach), ಸಂಪನ್ಮೂಲ ಸಾಹಿತ್ಯ, ಸೂಕ್ಷ್ಮ ಯೋಜನೆ, ಪರೀಕ್ಷಾ ಸಿದ್ಧತೆ ಹಾಗೂ ವಿದ್ಯಾರ್ಥಿಗಳ ಕಲಿಕಾ ಫಲಿತಾಂಶ ಸುಧಾರಣೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ತರಬೇತಿ ನೀಡಲಾಗಿರುತ್ತದೆ. ಸದರಿ ಶಿಕ್ಷಕರು ತರಬೇತಿ ಕಾರ್ಯಾಗಾರದಲ್ಲಿ ಭಾಗವಹಿಸಿರುವುದನ್ನು ದೃಢೀಕರಿಸಿ ಈ ಹಾಜರಾತಿ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ನೀಡಲಾಗಿದೆ.',
  place:'ಶೇಡಬರಿ, ಭಟ್ಕಳ', totalDays:1
};
function attTDate(sub){ return (DB.attDates&&DB.attDates[sub])||ATT_DATES[sub]||'2026-11-19'; }
function attDD(d){ if(!d) return ''; const m=String(d).match(/^(\d{4})-(\d{2})-(\d{2})/); return m?m[3]+'-'+m[2]+'-'+m[1]:String(d); }
function attAY(d){ const m=String(d||todayStr()).match(/^(\d{4})-(\d{2})/); let y=+m[1]; if(+m[2]<5) y--; return y+'-'+String((y+1)%100).padStart(2,'0'); }
function attTrs(){ return DB.attTrainings||(DB.attTrainings=[]); }
function attCerts(){ return DB.attCerts||(DB.attCerts=[]); }
function attTr(id){ return attTrs().find(t=>t.id===id); }
function attPct(c){ const t=+c.total||0, a=+c.attended||0; return t>0?Math.round(a/t*1000)/10:0; }
function attPrincipal(){ const p=STAFF.find(x=>x.role==='principal'); return p?p.name:'ಪ್ರಾಂಶುಪಾಲರು'; }


/* ---------- Code 128 (set B) barcode -> PNG data URL ---------- */
const C128=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
function c128Bars(text){
  const codes=[104]; let sum=104;
  for(let i=0;i<text.length;i++){ const v=text.charCodeAt(i)-32; if(v<0||v>94) throw new Error('Code128 char'); codes.push(v); sum+=v*(i+1); }
  codes.push(sum%103); codes.push(106);
  return codes.map(c=>C128[c]).join('');
}
function attBarcodeUrl(text){
  const bars=c128Bars(text), mod=3, quiet=10, h=70;
  let w=0; for(const ch of bars) w+=(+ch); 
  const cv=document.createElement('canvas'); cv.width=(w+quiet*2)*mod; cv.height=h;
  const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,cv.width,h); g.fillStyle='#000';
  let x=quiet*mod, bar=true;
  for(const ch of bars){ const wd=(+ch)*mod; if(bar) g.fillRect(x,0,wd,h); x+=wd; bar=!bar; }
  return cv.toDataURL('image/png');
}
function attQrUrl(url){
  try{
    const box=document.createElement('div'); box.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(box);
    new QRCode(box,{text:url,width:240,height:240,correctLevel:QRCode.CorrectLevel.M});
    const cv=box.querySelector('canvas'); let out='';
    if(cv) out=cv.toDataURL('image/png'); else { const im=box.querySelector('img'); out=im?im.src:''; }
    box.remove(); return out;
  }catch(e){ return ''; }
}
function attVerifyUrl(certNo){
  const base=window.location.href.split('?')[0].split('#')[0];
  return base+'?verify='+encodeURIComponent(certNo)+'&type=attendance';
}

/* ---------- Certificate page (replica of the Word template, A4 portrait) ---------- */
function attCertHtml(c,tr){
  const fin=c.status==='Issued';
  const d=attDD(attTDate(attCertSub(c)));
  const refs=ATT_DEF.refs;
  const B=(t)=>'<b>'+esc(t)+'</b>';
  const qr=fin?attQrUrl(attVerifyUrl(c.certNo)):'', bc=fin?attBarcodeUrl(c.certNo):'';
  const topicHtml='<b>'+esc(attCertSub(c))+'</b> ವಿಷಯದ ಜಿಲ್ಲಾ ಮಟ್ಟದ ತರಬೇತಿ ಕಾರ್ಯಾಗಾರದಲ್ಲಿ';
  const pName=tr.principalName||ATT_DEF.principalName;
  const strip=fin?`
    <table style="width:100%;border-collapse:collapse"><tr>
      <td style="width:60%;vertical-align:top"><img src="${bc}" style="width:240px;height:54px;display:block"><div style="font-size:9pt;margin-top:3px">ಪರಿಶೀಲನೆಗಾಗಿ ಪತ್ರ ಸಂಖ್ಯೆ: <b>${esc(c.certNo)}</b></div></td>
      <td style="width:40%;vertical-align:top;text-align:right"><img src="${qr}" style="width:90px;height:90px;display:inline-block"></td>
    </tr></table>
    <div style="font-size:9pt;margin-top:8px;line-height:1.6">ಇದು ಗಣಕೀಕೃತವಾಗಿ ಸೃಷ್ಟಿಸಲಾದ ಪ್ರಮಾಣಪತ್ರವಾಗಿದ್ದು, ಸಹಿಯ ಅವಶ್ಯಕತೆ ಇರುವುದಿಲ್ಲ.<br>ಪರಿಶೀಲಿಸಲು: <b>www.mdrsshedbarieoffice.in</b></div>`
   :`<div style="text-align:center;font-size:9pt;color:#9A7025;padding:8px 0">ಕರಡು (Draft) — ಅನುಮೋದನೆಯ ನಂತರ ಪತ್ರ ಸಂಖ್ಯೆ, ಬಾರ್‌ಕೋಡ್ ಮತ್ತು QR ಕೋಡ್ ಸೇರಿಸಲಾಗುವುದು.</div>`;
  return `<div class="att-page" style="position:relative;width:794px;height:1123px;box-sizing:border-box;padding:58px 68px;background:#fff;color:#000;font-family:'Nirmala UI','Noto Sans Kannada',sans-serif;overflow:hidden">
  <div style="text-align:center;font-size:17pt;margin-bottom:2pt">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ</div>
  <div style="text-align:center;font-size:10pt;margin-bottom:1pt">KARNATAKA RESIDENTIAL EDUCATIONAL INSTITUTIONS SOCIETY</div>
  <div style="text-align:center;font-size:15pt;margin-bottom:1pt">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ</div>
  <div style="text-align:center;font-size:11pt;margin-bottom:5pt">ಉತ್ತರ ಕನ್ನಡ ಜಿಲ್ಲೆ – 581320</div>
  <div style="border-bottom:2.25pt solid #9A7025;height:2px;margin-bottom:12pt"></div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14pt"><tr>
    <td style="font-size:10pt">ಪತ್ರ ಸಂಖ್ಯೆ: ${esc(tr.letterNo)}</td>
    <td style="text-align:right;font-size:10pt">ದಿನಾಂಕ: ${d}</td></tr></table>
  <div style="text-align:center;font-weight:700;font-size:21pt;line-height:1.3">ಹಾಜರಾತಿ ಪ್ರಮಾಣ ಪತ್ರ</div>
  <div style="text-align:center;font-weight:700;font-size:11pt;margin-bottom:12pt">ATTENDANCE CERTIFICATE</div>
  <div style="margin-bottom:5pt;line-height:1.5;text-align:justify"><b style="font-size:11pt">ವಿಷಯ</b><span style="font-size:11pt">: </span><span style="font-size:10.5pt">${esc(ATT_DEF.subjectText)}</span></div>
  <div style="margin-bottom:18pt;line-height:1.5;text-align:justify"><b style="font-size:11pt">ಉಲ್ಲೇಖ:</b><span style="font-size:10.5pt"> ${esc(refs)}</span></div>
  <div style="font-size:12pt;line-height:1.75;text-align:justify;margin-bottom:8pt">&nbsp;&nbsp;&nbsp;&nbsp;ಇದರಿಂದ ಪ್ರಮಾಣೀಕರಿಸುವುದೇನೆಂದರೆ, ಶ್ರೀ/ಶ್ರೀಮತಿ ${B(c.name)} ಇವರು ${B(c.desig)} (ಹುದ್ದೆ) ಯಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿದ್ದು, ಇವರ HRMS ID ಸಂಖ್ಯೆ ${B(c.hrmsId||'—')} ಆಗಿರುತ್ತದೆ. ಇವರು ${B(c.school)} (ಶಾಲೆಯ ಹೆಸರು) ಇಲ್ಲಿ ಕರ್ತವ್ಯ ನಿರ್ವಹಿಸುತ್ತಿದ್ದು, ${B('ದಿನಾಂಕ '+d)} ರಂದು ${esc(ATT_DEF.purpose)} ${topicHtml} ಹಾಜರಾಗಿ ಸಕ್ರಿಯವಾಗಿ ಭಾಗವಹಿಸಿರುತ್ತಾರೆ.</div>
  <div style="text-align:right;margin-top:40pt;line-height:1.6">${fin&&c.approvedStamp?`<div style="font-weight:700;font-size:12pt">Sd/-</div><div style="font-size:8.5pt;color:#333">Date &amp; Time: ${esc(c.approvedStamp)} &nbsp;|&nbsp; IP: ${esc(c.approvedIp||'—')}</div>`:''}<div style="font-weight:700;font-size:12pt">(${esc(pName)})</div><div style="font-size:12pt">ಪ್ರಾಂಶುಪಾಲರು</div><div style="font-size:11pt">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ</div><div style="font-size:11pt">ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ</div></div>
  <div style="position:absolute;left:68px;right:68px;bottom:44px;border-top:1.5px solid #9A7025;padding-top:10px">${strip}</div>
</div>`;
}

/* ---------- PDF (A4) ---------- */
async function attPdfBytes(c){
  if(typeof html2canvas==='undefined'||typeof PDFLib==='undefined') throw new Error('PDF library not loaded');
  const tr=attTr(c.trainingId); if(!tr) throw new Error('training missing');
  const host=document.createElement('div'); host.style.cssText='position:fixed;left:-10000px;top:0;background:#fff';
  host.innerHTML=attCertHtml(c,tr); document.body.appendChild(host);
  try{
    if(document.fonts&&document.fonts.ready) await document.fonts.ready;
    await Promise.all([...host.querySelectorAll('img')].map(im=>im.complete?1:new Promise(r=>{im.onload=im.onerror=r;})));
    const cv=await html2canvas(host.firstElementChild,{scale:2.5,backgroundColor:'#ffffff',useCORS:true,logging:false});
    const pdf=await PDFLib.PDFDocument.create(); const pg=pdf.addPage([595.28,841.89]);
    const img=await pdf.embedJpg(cv.toDataURL('image/jpeg',0.95));
    pg.drawImage(img,{x:0,y:0,width:595.28,height:841.89});
    pdf.setTitle('Attendance Certificate '+c.certNo); pdf.setAuthor('MDRS Shedabari, Bhatkal');
    return await pdf.save();
  } finally { host.remove(); }
}
function attFileName(c){ return (String(c.certNo).replace(/[^A-Za-z0-9\-]+/g,'-')+'_'+(c.hrmsId||c.mobile||'guest')+'.pdf'); }
function attSaveBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000); }
async function attDownloadOne(id){
  const c=attCerts().find(x=>x.id===id); if(!c||c.status!=='Issued'){ showToast('⚠ ಅನುಮೋದನೆಯ ನಂತರ ಮಾತ್ರ PDF ಲಭ್ಯ'); return; }
  if(c.type==='ಅತಿಥಿ'&&!(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&(CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal'))){ showToast('⚠ ಅತಿಥಿ ಶಿಕ್ಷಕರ ಪ್ರಮಾಣಪತ್ರ FDA/Principal ಲಾಗಿನ್‌ನಿಂದ ಮಾತ್ರ'); return; }
  showToast('⏳ PDF ತಯಾರಾಗುತ್ತಿದೆ…');
  try{ const b=await attPdfBytes(c); attSaveBlob(new Blob([b],{type:'application/pdf'}),attFileName(c)); showToast('✅ PDF ಡೌನ್‌ಲೋಡ್ ಆಯಿತು'); }
  catch(e){ showToast('⚠ PDF ತಯಾರಿಸಲಾಗಲಿಲ್ಲ: '+e.message); }
}
async function attDownloadZip(ids){
  const list=ids.map(i=>attCerts().find(x=>x.id===i)).filter(c=>c&&c.status==='Issued');
  if(!list.length){ showToast('⚠ ಅನುಮೋದಿತ ಪ್ರಮಾಣಪತ್ರ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(typeof JSZip==='undefined'){ showToast('⚠ ZIP library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  try{
    const z=new JSZip(); let n=0;
    for(const c of list){ showToast('⏳ PDF '+(++n)+'/'+list.length); z.file(attFileName(c),await attPdfBytes(c)); }
    attSaveBlob(await z.generateAsync({type:'blob'}),'Attendance_Certificates_'+todayStr()+'.zip'); showToast('✅ ZIP ಡೌನ್‌ಲೋಡ್ ಆಯಿತು ('+list.length+')');
  }catch(e){ showToast('⚠ ZIP ವಿಫಲ: '+e.message); }
}

/* ---------- Preview modal ---------- */
function attPreview(id){
  const c=attCerts().find(x=>x.id===id); if(!c) return; const tr=attTr(c.trainingId); if(!tr) return;
  let bg=document.getElementById('attPrevBg'); if(!bg){ bg=document.createElement('div'); bg.id='attPrevBg'; bg.className='modal-bg'; document.body.appendChild(bg); }
  const role=CURRENT_USER&&CURRENT_USER.role;
  bg.innerHTML=`<div style="background:#fff;border-radius:8px;max-width:860px;width:100%;max-height:94vh;display:flex;flex-direction:column">
    <div style="padding:8px 12px;border-bottom:1px solid #ddd;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="flex:1">${esc(c.name)} — ${esc(c.status==='Issued'?c.certNo:'ಕರಡು ಮುನ್ನೋಟ')}</b>
      ${c.status==='Issued'?`<button class="gv-b pri" onclick="attDownloadOne('${c.id}')">⬇ PDF</button>`:''}
      ${role==='principal'&&c.status==='Sent to Principal'?`<button class="gv-b ok" onclick="attApproveIds(['${c.id}']);attClosePrev()">✔ ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="attReturnIds(['${c.id}']);attClosePrev()">↩ ಹಿಂದಿರುಗಿಸಿ</button>`:''}
      <button class="gv-b" onclick="attClosePrev()">✕ ಮುಚ್ಚಿ</button></div>
    <div style="overflow:auto;padding:10px;background:#eee"><div style="width:794px;margin:0 auto;box-shadow:0 0 6px #888">${attCertHtml(c,tr)}</div></div></div>`;
  bg.classList.add('show');
}
function attClosePrev(){ const b=document.getElementById('attPrevBg'); if(b) b.classList.remove('show'); }

/* ---------- Training setup ---------- */


function attCertSub(c){ return c.subject||((attRegs().find(r=>r.id===c.regId)||{}).subject)||((attTr(c.trainingId)||{}).subject)||'ಕನ್ನಡ'; }
function attSubCount(sub){
  if(ATT_TAB==='mat') return attMatRows(sub).length;
  if(ATT_TAB==='pend') return attCerts().filter(c=>c.status==='Sent to Principal'&&attCertSub(c)===sub).length;
  if(ATT_TAB==='rpend') return attLists().filter(l=>l.status==='Sent to Principal'&&l.subject===sub).length;
  if(ATT_TAB==='reg') return attCerts().filter(c=>c.status==='Issued'&&attCertSub(c)===sub).length;
  return attListRegs(sub).length;
}
function attSubBar(){
  return `<div class="gv-tabs" style="margin:0 0 10px;border-bottom:3px solid #9A7025">${ATT_SUBS.map(x=>`<button class="gv-tab ${ATT_SUB===x?'on':''}" style="font-size:14px" onclick="attSubSet('${x}')">${x==='ಕನ್ನಡ'?'📘':'🔬'} ${x} ವಿಷಯ (${attSubCount(x)})</button>`).join('')}</div>`;
}
function attTrForm(mode){
  const box=document.getElementById('attTrBox'); if(!box) return;
  if(!mode){ box.innerHTML=''; return; }
  const t=mode==='edit'&&attTr(ATT_TR)?attTr(ATT_TR):Object.assign({},ATT_DEF);
  const f=(id,l,v,type)=>`<div class="field" style="margin:4px 0"><label style="font-size:12px;font-weight:600">${l}</label><input id="${id}" ${type?'type="'+type+'"':''} value="${esc(v)}" style="width:100%"></div>`;
  box.innerHTML=`<div class="panel" style="border:2px solid var(--navy)"><h3>${mode==='edit'?'✏ ತರಬೇತಿ ವಿವರ ತಿದ್ದಿ':'➕ ಹೊಸ ತರಬೇತಿ'}</h3>
    <div class="note">ಪ್ರಮಾಣಪತ್ರದ ಪಠ್ಯ ನಿಮ್ಮ Word ಟೆಂಪ್ಲೇಟ್‌ನಂತೆ ಸ್ಥಿರವಾಗಿದೆ — ಬದಲಾಗುವುದಿಲ್ಲ. ಶಿಕ್ಷಕರ ಹೆಸರು, ಹುದ್ದೆ, HRMS ID, ಶಾಲೆ ಮತ್ತು ವಿಷಯ ಮಾತ್ರ ಸ್ವಯಂ ತುಂಬುತ್ತದೆ.</div>
    ${f('atT_letterNo','ಪತ್ರ ಸಂಖ್ಯೆ',t.letterNo)}${f('atT_dK','ಕನ್ನಡ ತರಬೇತಿ ದಿನಾಂಕ',attTDate('ಕನ್ನಡ'),'date')}${f('atT_dS','ವಿಜ್ಞಾನ ತರಬೇತಿ ದಿನಾಂಕ',attTDate('ವಿಜ್ಞಾನ'),'date')}${f('atT_pn','ಪ್ರಾಂಶುಪಾಲರ ಹೆಸರು',t.principalName||ATT_DEF.principalName)}
    <button class="gv-b pri" onclick="attTrSave('${mode}')">💾 ಉಳಿಸಿ</button> <button class="gv-b" onclick="attTrForm()">ರದ್ದು</button></div>`;
}
function attTrSave(mode){
  const g=i=>document.getElementById(i).value.trim();
  const o={letterNo:g('atT_letterNo'),trainingDate:g('atT_dS'),principalName:g('atT_pn')||ATT_DEF.principalName,totalDays:1};
  if(!o.letterNo||!g('atT_dK')||!g('atT_dS')){ showToast('⚠ ಪತ್ರ ಸಂಖ್ಯೆ ಮತ್ತು ಎರಡೂ ದಿನಾಂಕ ಅಗತ್ಯ'); return; }
  DB.attDates={'ಕನ್ನಡ':g('atT_dK'),'ವಿಜ್ಞಾನ':g('atT_dS')};
  if(mode==='edit'&&attTr(ATT_TR)){ Object.assign(attTr(ATT_TR),o); }
  else { const t=Object.assign({id:uid(),createdAt:todayStr(),createdBy:CURRENT_USER.name},o); attTrs().push(t); ATT_TR=t.id; }
  saveDB(); showToast('✅ ಉಳಿಸಲಾಗಿದೆ'); renderAttCert();
}
function attTrPick(id){ ATT_TR=id; renderAttCert(); }

/* ---------- FDA: generate / submit ---------- */

function attChecked(){ return [...document.querySelectorAll('.attChk:checked')].map(x=>x.value); }
function attSendSel(){
  const ids=attChecked().filter(i=>{const c=attCerts().find(x=>x.id===i);return c&&['Draft','Returned'].includes(c.status);});
  if(!ids.length){ showToast('⚠ ಕರಡು / ಹಿಂದಿರುಗಿದ ಪ್ರಮಾಣಪತ್ರ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(!confirm(ids.length+' ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿದ್ದೀರಾ?\n\nOK ಒತ್ತಿದರೆ Principal ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.')) return;
  ids.forEach(i=>{ const c=attCerts().find(x=>x.id===i); c.status='Sent to Principal'; c.sentAt=todayStr(); c.sentBy=CURRENT_USER.name; delete c.remarks; });
  const p=STAFF.find(x=>x.role==='principal'); if(p) pushNotification(p.name,'📋 ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅನುಮೋದನೆ ಅಗತ್ಯ: '+ids.length+' ಶಿಕ್ಷಕರು');
  logAudit('Attendance certs sent to Principal','attcert',ids.join(','),ids.length+'');
  saveDB(); showToast('📤 Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderAttCert();
}
function attDeleteSel(){
  const ids=attChecked().filter(i=>{const c=attCerts().find(x=>x.id===i);return c&&['Draft','Returned'].includes(c.status);});
  if(!ids.length){ showToast('⚠ ಕರಡು ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(!confirm(ids.length+' ಕರಡು ಅಳಿಸಬೇಕೇ?')) return;
  DB.attCerts=attCerts().filter(c=>!ids.includes(c.id)); if(!DB.deletedIds) DB.deletedIds={}; ids.forEach(i=>DB.deletedIds['attCerts:'+i]=Date.now());
  saveDB(); renderAttCert();
}
function attZipSel(){ attDownloadZip(attChecked()); }
function attAll(el){ document.querySelectorAll('.attChk').forEach(x=>x.checked=el.checked); }
function attAllSel(el){ document.querySelectorAll('.attSel:not(:disabled)').forEach(x=>x.checked=el.checked); }

/* ---------- Principal: approve / return ---------- */
async function attGetIp(){
  try{ const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),3500);
    const r=await fetch('https://api.ipify.org?format=json',{signal:ctl.signal}); clearTimeout(t); const j=await r.json(); return String(j.ip||''); }catch(e){ return ''; }
}
async function attApproveIds(ids){
  const list=ids.map(i=>attCerts().find(x=>x.id===i)).filter(c=>c&&c.status==='Sent to Principal');
  if(!list.length){ showToast('⚠ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇಲ್ಲ'); return; }
  const ay=attAY(todayStr()), ip=await attGetIp(), stamp=attNowStr();
  list.forEach(c=>{
    const sc=attCertSub(c)==='ವಿಜ್ಞಾನ'?'SCI':'KAN';
    c.certNo='ATC/'+sc+'/'+ay+'/'+String(nextSeq('attcert_'+sc+'_'+ay)).padStart(4,'0');
    c.status='Issued'; c.issuedAt=todayStr(); c.approvedBy=CURRENT_USER.name; c.approvedAt=todayStr(); c.approvedStamp=stamp; c.approvedIp=ip||'—';
    DB.docIssueRegister.push({id:uid(),docNo:c.certNo,dateIssued:c.issuedAt,studentName:c.name,satsNo:'',admissionNo:c.hrmsId,className:'ಶಿಕ್ಷಕರು',docType:'ಹಾಜರಾತಿ ಪ್ರಮಾಣ ಪತ್ರ (ತರಬೇತಿ — '+attCertSub(c)+')',issuedTo:c.name,issuedBy:CURRENT_USER.name,cardId:c.id});
  });
  const f=STAFF.find(x=>x.role==='fda'); if(f) pushNotification(f.name,'✅ ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅನುಮೋದಿತ: '+list.length+' — PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದು');
  logAudit('Attendance certs approved','attcert',list.map(c=>c.certNo).join(','),list.length+'');
  saveDB(); showToast('✅ '+list.length+' ಪ್ರಮಾಣಪತ್ರ ಅನುಮೋದಿಸಲಾಗಿದೆ'); renderAttCert();
}
function attApproveSel(){ attApproveIds(attChecked()); }
function attReturnIds(ids){
  const list=ids.map(i=>attCerts().find(x=>x.id===i)).filter(c=>c&&c.status==='Sent to Principal'); if(!list.length) return;
  const r=prompt('ಹಿಂದಿರುಗಿಸಲು ಕಾರಣ (FDA ಗೆ ತೋರಿಸಲಾಗುತ್ತದೆ):'); if(r===null) return;
  list.forEach(c=>{ c.status='Returned'; c.remarks=r||'ಪರಿಷ್ಕರಿಸಿ'; });
  const f=STAFF.find(x=>x.role==='fda'); if(f) pushNotification(f.name,'↩ ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಹಿಂದಿರುಗಿದೆ: '+list.length+' — '+(r||''));
  saveDB(); showToast('↩ ಹಿಂದಿರುಗಿಸಲಾಗಿದೆ'); renderAttCert();
}
function attReturnSel(){ attReturnIds(attChecked()); }

/* ---------- Page ---------- */
function attTabSet(t){ ATT_TAB=t; renderAttCert(); }
function attRows(list,mode){
  const L={'Draft':['draft','ಕರಡು'],'Sent to Principal':['pend','Principal ಬಳಿ'],'Returned':['draft','ಹಿಂದಿರುಗಿದೆ'],'Issued':['ok','ಅನುಮೋದಿತ']};
  return list.map(c=>{ const s=L[c.status]||['draft',c.status]; const tr=attTr(c.trainingId)||{};
    return `<tr><td><input type="checkbox" class="attChk" value="${c.id}"></td><td><b>${esc(c.name)}</b>${c.type==='ಅತಿಥಿ'?' <span style="background:#fff3cd;color:#8a6d00;border-radius:4px;padding:0 5px;font-size:11px;font-weight:700">ಅತಿಥಿ</span>':''}<br><span class="small-muted">${esc(c.desig)}</span></td><td>${esc(c.hrmsId)}</td>
      <td>${esc(attCertSub(c))} ವಿಷಯ<br><span class="small-muted">${attDD(attTDate(attCertSub(c)))}</span></td><td>${esc(c.attended)}/${esc(c.total)} (${attPct(c)}%)</td>
      <td><span class="gv-st ${s[0]}">${s[1]}</span>${c.remarks?`<br><span class="small-muted">${esc(c.remarks)}</span>`:''}</td><td>${c.certNo?esc(c.certNo):'—'}</td>
      <td><button class="gv-b lnk" onclick="attPreview('${c.id}')">👁 ನೋಡಿ</button>${c.status==='Issued'?` <button class="gv-b lnk" onclick="attDownloadOne('${c.id}')">⬇ PDF</button>`:''}</td></tr>`; }).join('');
}


/* ---------- Public: verify + teacher download ---------- */
function attFindCert(q){ const n=String(q||'').trim().toLowerCase(); return n?attCerts().find(c=>c.status==='Issued'&&String(c.certNo).toLowerCase()===n):null; }
function attVerifyHtml(q){
  const c=attFindCert(q); if(!c) return '';
  const t=attTr(c.trainingId)||{};
  return `<div class="verify-card good">✅ ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಮಾನ್ಯ (Certificate Valid)<br><b>${esc(c.name)}</b> · ${esc(c.desig)}<br>HRMS ID: ${esc(c.hrmsId)} · ${esc(c.school)}<br>ತರಬೇತಿ: ${esc(attCertSub(c))} ವಿಷಯ · ದಿನಾಂಕ ${attDD(attTDate(attCertSub(c)))}<br>ಪ್ರಮಾಣಪತ್ರ ಸಂ: <b>${esc(c.certNo)}</b> · ವಿತರಣೆ: ${attDD(c.issuedAt)}</div>`;
}



/* ===== v2: public registration, registration lists, certificate generation from registrations ===== */
var ATT_SUB='ಕನ್ನಡ';
const ATT_SUBS=['ಕನ್ನಡ','ವಿಜ್ಞಾನ'];
function attRegs(){ return DB.attRegs||(DB.attRegs=[]); }
function attLists(){ return DB.attRegLists||(DB.attRegLists=[]); }
function attMobileOf(c){ const m=pwDigits(c.mobile); if(m.length===10) return m; const st=staffByHrms(c.hrmsId); const m2=pwDigits(st&&st.mobile); return m2.length===10?m2:''; }
function attRegSchoolLine(r){ return (r.school||'')+(r.address?', '+r.address:''); }

/* ----- public menu / registration form ----- */
function attModal(id){ let bg=document.getElementById(id); if(!bg){ bg=document.createElement('div'); bg.id=id; bg.className='modal-bg'; document.body.appendChild(bg); } return bg; }
function attPubMenu(){
  const bg=attModal('attPubBg');
  bg.innerHTML=`<div class="modal" style="max-width:420px;text-align:center"><h3 style="margin:0 0 10px">🎓 ಶಿಕ್ಷಕರ ತರಬೇತಿ</h3>
   <button class="btn btn-green btn-block" style="margin:6px 0;padding:12px" onclick="attRegForm()">📝 ತರಬೇತಿಗೆ ನೋಂದಾಯಿಸಿ</button>
   <button class="btn btn-block" style="margin:6px 0;padding:12px;background:#1F4E79;color:#fff" onclick="attMatPublicOpen()">📦 ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ</button>
   <button class="btn btn-gold btn-block" style="margin:6px 0;padding:12px" onclick="attPublicOpen()">🎓 ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್</button>
   <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="document.getElementById('attPubBg').classList.remove('show')">ಮುಚ್ಚಿ</button></div>`;
  bg.classList.add('show');
}
function attRegForm(editId){
  const r=editId?attRegs().find(x=>x.id===editId):null, staffMode=!!(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&editId);
  const bg=attModal(staffMode?'attRegBg':'attPubBg');
  const v=k=>esc(r?(r[k]||''):'');
  bg.innerHTML=`<div class="modal" style="max-width:470px;max-height:92vh;overflow:auto"><h3 style="margin:0 0 8px">📝 ${r?'ನೋಂದಣಿ ತಿದ್ದಿ':'ತರಬೇತಿಗೆ ನೋಂದಣಿ'}</h3>
   <div style="font-size:11.5px;color:#b3261e;margin:-2px 0 6px">ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಕನ್ನಡದಲ್ಲೇ ತುಂಬಿ.</div>
   <div class="field"><label>ಶಿಕ್ಷಕರ ಪ್ರಕಾರ *</label><select id="atR_type" style="width:100%" onchange="attRegTypeChg()"><option value="ಖಾಯಂ" ${r&&r.type==='ಅತಿಥಿ'?'':'selected'}>ಖಾಯಂ ಶಿಕ್ಷಕರು</option><option value="ಅತಿಥಿ" ${r&&r.type==='ಅತಿಥಿ'?'selected':''}>ಅತಿಥಿ ಶಿಕ್ಷಕರು</option></select></div>
   <div class="field"><label>ವಿಷಯ *</label><select id="atR_sub" style="width:100%" onchange="attRegSubChg()">${ATT_SUBS.map(x=>`<option ${r&&r.subject===x?'selected':''}>${x}</option>`).join('')}</select></div>
   <div class="field"><label>ಶಿಕ್ಷಕರ ಹೆಸರು *</label><div style="color:#b3261e;font-size:11px;margin-top:1px">ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲೇ ತುಂಬಿ</div><input id="atR_name" value="${v('name')}" style="width:100%"></div>
   <div class="field"><label>ಹುದ್ದೆ</label><div style="color:#b3261e;font-size:11px;margin-top:1px">ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲೇ ತುಂಬಿ</div><input id="atR_desig" value="${v('desig')}" placeholder="ಉದಾ: ಸಹ ಶಿಕ್ಷಕರು" style="width:100%"></div>
   <div class="field"><label>ಶಾಲೆಯ ಹೆಸರು *</label><div style="color:#b3261e;font-size:11px;margin-top:1px">ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲೇ ತುಂಬಿ</div><input id="atR_school" value="${v('school')}" style="width:100%"></div>
   <div class="field"><label>ಶಾಲೆಯ ಕೋಡ್</label><input id="atR_scode" value="${v('schoolCode')}" style="width:100%"></div>
   <div class="field"><label>ಶಾಲೆಯ ವಿಳಾಸ *</label><div style="color:#b3261e;font-size:11px;margin-top:1px">ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲೇ ತುಂಬಿ</div><textarea id="atR_addr" rows="2" style="width:100%">${v('address')}</textarea></div>
   <div class="field" id="atR_hrmsBox"><label>HRMS ID (ಐಚ್ಛಿಕ)</label><input id="atR_hrms" value="${v('hrmsId')}" style="width:100%"></div>
   <div class="field"><label>ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *</label><input id="atR_mob" value="${v('mobile')}" maxlength="10" inputmode="numeric" style="width:100%"></div>
   <div id="atR_msg" style="color:#b3261e;font-size:12px;min-height:16px"></div>
   <div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-green" onclick="attRegSubmit('${editId||''}')">${r?'💾 ಉಳಿಸಿ':'✔ ನೋಂದಾಯಿಸಿ'}</button><button class="btn btn-outline" onclick="this.closest('.modal-bg').classList.remove('show')">ರದ್ದು</button></div></div>`;
  bg.classList.add('show');
  if(!r){ const d=document.getElementById('atR_desig'); d.addEventListener('input',()=>{d.dataset.auto='0';}); attRegSubChg(); }
  attRegTypeChg(true);
}
function attSyncWarn(){}
function attSrvMsg(html,color){ const bg=document.getElementById('attPubBg'); if(!bg||!bg.classList.contains('show')) return; const m=bg.querySelector('.modal'); if(!m) return; let d=document.getElementById('attSrvMsg'); if(!d){ d=document.createElement('div'); d.id='attSrvMsg'; d.style.cssText='font-size:12.5px;margin:6px 0;font-weight:600'; m.insertBefore(d,m.firstChild.nextSibling); } d.style.color=color; d.innerHTML=html; }
async function attShardTrack(r){
  attSrvMsg('⏳ ಸರ್ವರ್‌ಗೆ ಉಳಿಸಲಾಗುತ್ತಿದೆ… ದಯವಿಟ್ಟು ಈ ಪುಟ ಮುಚ್ಚಬೇಡಿ.','#8a6d00');
  for(let i=0;i<6;i++){
    const ok=await attShardPush(r);
    if(ok){ attSrvMsg('✔ ನೋಂದಣಿ ಸರ್ವರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.','#1e8e3e'); return true; }
    attSrvMsg('⚠ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ದುರ್ಬಲವಾಗಿದೆ — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲಾಗುತ್ತಿದೆ (ಈ ಪುಟ ಮುಚ್ಚಬೇಡಿ)…','#b3261e');
    await new Promise(z=>setTimeout(z,6000));
  }
  attSrvMsg('⚠ ಸರ್ವರ್‌ಗೆ ತಲುಪಿಸಲು ಆಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಸರಿಯಾದ ಮೇಲೆ ಮತ್ತೆ ನೋಂದಾಯಿಸಿ ಅಥವಾ ಶಾಲೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.','#b3261e'); return false;
}
function attWaLink(r){ const t='ತರಬೇತಿ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ.\nಹೆಸರು: '+r.name+'\nವಿಷಯ: '+r.subject+'\nತರಬೇತಿ ದಿನಾಂಕ: '+attDD(attTDate(r.subject))+'\nಮೊಬೈಲ್: '+r.mobile+'\n\nತರಬೇತಿಯ ನಂತರ ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್: '+ATT_SITE+'\n— ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ'; return 'https://wa.me/91'+String(r.mobile).replace(/\D/g,'').slice(-10)+'?text='+encodeURIComponent(t); }
function attRegDone(r){
  const bg=attModal('attPubBg');
  bg.innerHTML=`<div class="modal" style="max-width:420px;max-height:92vh;overflow:auto;text-align:center">${attMatFormHtml(r,'<div style="font-size:40px;color:#1e8e3e;line-height:1">✔</div><h3 style="margin:2px 0 6px;color:#1e8e3e">ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ</h3><a class="btn btn-outline btn-sm" style="display:inline-block;margin-bottom:10px;text-decoration:none;color:#128C7E;border-color:#128C7E" target="_blank" rel="noopener" href="'+attWaLink(r)+'">💬 WhatsApp ನಲ್ಲಿ ದೃಢೀಕರಣ ಪಡೆಯಿರಿ</a>')}</div>`;
  bg.classList.add('show'); attShardTrack(r);
}
var ATT_BUSY=false;
function attRegSubmit(editId){
  if(ATT_BUSY) return; ATT_BUSY=true; setTimeout(()=>{ATT_BUSY=false;},1500);
  attRegSubmit0(editId);
}
function attRegSubChg(){ const d=document.getElementById('atR_desig'); if(!d) return; const sub=document.getElementById('atR_sub').value, gt=(document.getElementById('atR_type')||{}).value==='ಅತಿಥಿ'; if(!d.value.trim()||d.dataset.auto==='1'){ d.value=sub+(gt?' ಅತಿಥಿ ಶಿಕ್ಷಕರು':' ಶಿಕ್ಷಕರು'); d.dataset.auto='1'; } }
function attRegTypeChg(init){ const t=document.getElementById('atR_type'); if(!t) return; const g=t.value==='ಅತಿಥಿ', b=document.getElementById('atR_hrmsBox'); if(b) b.style.display=g?'none':''; if(g){ const h=document.getElementById('atR_hrms'); if(h) h.value=''; } if(!init) attRegSubChg(); else if(g){ } }
function attRegSubmit0(editId){
  const g=i=>document.getElementById(i).value.trim(), msg=document.getElementById('atR_msg');
  const o={subject:g('atR_sub'),name:g('atR_name'),desig:g('atR_desig'),school:g('atR_school'),schoolCode:g('atR_scode'),address:g('atR_addr'),hrmsId:g('atR_type')==='ಅತಿಥಿ'?'':g('atR_hrms'),type:g('atR_type')==='ಅತಿಥಿ'?'ಅತಿಥಿ':'ಖಾಯಂ',mobile:pwDigits(g('atR_mob'))};
  if(!o.name||!o.school||!o.address){ msg.textContent='ಎಲ್ಲಾ * ಕ್ಷೇತ್ರಗಳನ್ನು ತುಂಬಿ.'; return; }
  if(!/^\d{10}$/.test(g('atR_mob'))){ msg.textContent='ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿ ಇರಬೇಕು.'; return; }
  if(attRegs().some(x=>x.id!==editId&&x.subject===o.subject&&((o.hrmsId&&x.hrmsId&&x.hrmsId.toLowerCase()===o.hrmsId.toLowerCase())||x.mobile===o.mobile))){ msg.textContent='ಈ HRMS ID / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ '+o.subject+' ವಿಷಯಕ್ಕೆ ನೋಂದಾಯಿತವಾಗಿದೆ.'; return; }
  if(editId){ Object.assign(attRegs().find(x=>x.id===editId),o); attCerts().forEach(c=>{ if(c.regId===editId){ c.type=o.type; if(c.status!=='Issued'){ c.hrmsId=o.hrmsId; c.name=o.name; c.desig=o.desig||c.desig; c.school=attRegSchoolLine(o); c.mobile=o.mobile; } else { c.mobile=o.mobile; if(o.type!=='ಅತಿಥಿ'&&o.hrmsId) c.hrmsId=o.hrmsId; } } }); }
  else { var NR=Object.assign({id:uid(),at:todayStr(),ts:Date.now()},o); attRegs().push(NR); }
  saveDB();
  document.querySelectorAll('#attPubBg,#attRegBg').forEach(b=>b.classList.remove('show'));
  if(editId){ showToast('✅ ಉಳಿಸಲಾಗಿದೆ'); renderAttCert(); }
  else if(typeof CURRENT_USER!=='undefined'&&CURRENT_USER&&CURRENT_PAGE==='attcert'){ showToast('✅ ಸೇರಿಸಲಾಗಿದೆ'); renderAttCert(); }
  else { attRegDone(NR); const f=STAFF.find(x=>x.role==='fda'); if(f) pushNotification(f.name,'📝 ತರಬೇತಿ ನೋಂದಣಿ: '+o.name+' ('+o.subject+')'); }
}

/* ----- public: certificate download by HRMS ID or mobile ----- */
function attPublicOpen(){
  const bg=attModal('attPubBg');
  bg.innerHTML=`<div class="modal" style="max-width:440px"><h3 style="margin:0 0 6px">🎓 ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್</h3>
   <div style="font-size:12px;color:#555;margin-bottom:8px">ನೋಂದಣಿ ಸಮಯದಲ್ಲಿ ನೀಡಿದ <b>HRMS ID</b> ಅಥವಾ <b>ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</b> ನಮೂದಿಸಿ.</div>
   <div class="field"><label>HRMS ID / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</label><input id="attPubQ" style="width:100%" onkeydown="if(event.key==='Enter')attPublicFind()"></div>
   <div id="attPubR" style="margin:8px 0"></div>
   <div style="display:flex;gap:8px"><button class="btn btn-green" onclick="attPublicFind()">⬇ ಹುಡುಕಿ / ಡೌನ್‌ಲೋಡ್</button><button class="btn btn-outline" onclick="document.getElementById('attPubBg').classList.remove('show')">ಮುಚ್ಚಿ</button></div></div>`;
  bg.classList.add('show');
}
async function attPublicFind(){
  const r=document.getElementById('attPubR'), q=document.getElementById('attPubQ').value.trim().toLowerCase().replace(/\s+/g,''), qd=pwDigits(q);
  if(!q){ r.innerHTML='<div class="verify-card bad">HRMS ID ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.</div>'; return; }
  r.innerHTML='<div style="padding:8px;color:#555">⏳ ಸರ್ವರ್‌ನಿಂದ ಇತ್ತೀಚಿನ ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ…</div>';
  let fresh=true; try{ const u=await loadFromSupabase(); if(u){ migrateDB(); } if(CLOUD_STATE==='offline'||navigator.onLine===false) fresh=false; }catch(e){ fresh=false; }
  const hit=c=>(c.hrmsId&&String(c.hrmsId).toLowerCase().replace(/\s+/g,'')===q)||(qd.length===10&&attMobileOf(c)===qd);
  const all0=attCerts().filter(c=>c.status==='Issued'&&hit(c));
  const mine=all0.filter(c=>c.type!=='ಅತಿಥಿ');
  const stale=fresh?'':'<br><small>⚠ ಸರ್ವರ್ ಸಂಪರ್ಕ ಆಗಲಿಲ್ಲ — ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.</small>';
  if(!mine.length&&all0.length){ r.innerHTML='<div class="verify-card bad">ℹ ಅತಿಥಿ ಶಿಕ್ಷಕರ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಇಲ್ಲಿಂದ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲಾಗುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಶಾಲೆಯ ಪ್ರಾಂಶುಪಾಲರನ್ನು ಸಂಪರ್ಕಿಸಿ.<br><small>(ಪ್ರಮಾಣಪತ್ರ ಸಂ: '+all0.map(c=>esc(c.certNo)).join(', ')+')</small></div>'; return; }
  if(!mine.length){
    const pend=attCerts().filter(c=>c.status!=='Issued'&&hit(c)), regd=attRegs().filter(x=>(x.hrmsId&&String(x.hrmsId).toLowerCase().replace(/\s+/g,'')===q)||(qd.length===10&&attMobileOf(x)===qd));
    const msg=pend.length?'⏳ ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರ ತಯಾರಾಗಿದೆ, ಆದರೆ ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ ಬಾಕಿ ಇದೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
      :regd.length?'⏳ ನಿಮ್ಮ ನೋಂದಣಿ ಇದೆ, ಆದರೆ ಪ್ರಮಾಣಪತ್ರ ಇನ್ನೂ ತಯಾರಾಗಿಲ್ಲ.'
      :'❌ ಈ ಸಂಖ್ಯೆಯ ನೋಂದಣಿ/ಪ್ರಮಾಣಪತ್ರ ಕಂಡುಬಂದಿಲ್ಲ. ನೋಂದಣಿ ವೇಳೆ ನೀಡಿದ HRMS ID ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನೇ ನಮೂದಿಸಿ.';
    r.innerHTML='<div class="verify-card bad">'+msg+stale+'</div>'; return; }
  r.innerHTML=mine.map(c=>{const t=attTr(c.trainingId)||{};return `<div class="verify-card good" style="text-align:left"><b>${esc(c.name)}</b><br>${esc(attCertSub(c))} ವಿಷಯ · ${attDD(attTDate(attCertSub(c)))}<br>ಸಂ: ${esc(c.certNo)}<br><button class="btn btn-green btn-sm" style="margin-top:4px" onclick="attDownloadOne('${c.id}')">⬇ PDF ಡೌನ್‌ಲೋಡ್</button></div>`;}).join('');
}

/* ----- registration list: print / PDF / Word ----- */
function attListHtml(sub,regs,approved){
  const rows=regs.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(r.name)}</td><td>${esc(attRegSchoolLine(r))}</td><td style="text-align:center">${esc(r.schoolCode)}</td><td style="text-align:center">${esc(r.hrmsId)}</td><td style="text-align:center">${esc(r.mobile)}</td><td style="width:22%">&nbsp;</td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center">—</td></tr>';
  return `<div style="font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#000">
   <div style="text-align:center;font-weight:700;font-size:15pt;color:#1F4E79">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ</div>
   <div style="text-align:center;font-weight:700;font-size:13pt;color:#1F4E79">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ – 581320</div>
   <div style="text-align:center;font-weight:700;font-size:13pt;margin:8px 0 10px;border-top:2px solid #9A7025;border-bottom:2px solid #9A7025;padding:4px">ಶಿಕ್ಷಕರ ತರಬೇತಿ ನೋಂದಣಿ ಪಟ್ಟಿ — ${esc(sub)} ವಿಷಯ</div>
   <table border="1" cellspacing="0" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:10.5pt"><thead><tr style="background:#e8eef5"><th style="width:6%">ಕ್ರ.ಸಂ</th><th style="width:22%">ಶಿಕ್ಷಕರ ಹೆಸರು</th><th>ಶಾಲೆ</th><th style="width:10%">ಶಾಲೆ ಕೋಡ್</th><th style="width:13%">HRMS ID</th><th style="width:13%">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</th><th>ಸಹಿ</th></tr></thead><tbody>${rows}</tbody></table>
   <div style="margin-top:22px;text-align:right;font-weight:700;font-size:11pt;page-break-inside:avoid">ಪ್ರಾಂಶುಪಾಲರು<br><span style="font-weight:400;font-size:10pt">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ${approved?'<br>ಅನುಮೋದಿತ: '+attDD(approved):''}</span></div>
   <div style="margin-top:10px;border-top:1px solid #444;padding-top:4px;text-align:center;font-size:9pt;page-break-inside:avoid">ವೆಬ್ ವಿಳಾಸ: www.mdrsshedbarieoffice.in &nbsp;|&nbsp; ಮುದ್ರಣ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ: ${esc(attNowStr())}</div></div>`;
}
function attListRegs(sub){ return attRegs().filter(r=>r.subject===sub); }
function attListPrint(sub){
  const w=window.open('','_blank'); if(!w){ showToast('⚠ Pop-up ಅನುಮತಿಸಿ'); return; }
  w.document.write('<html><head><meta charset="utf-8"><title>ನೋಂದಣಿ ಪಟ್ಟಿ</title><style>@page{size:A4 portrait;margin:10mm}body{margin:0}tr{page-break-inside:avoid}</style></head><body>'+attListHtml(sub,attListRegs(sub))+'<script>setTimeout(function(){window.print()},400)<\/script></body></html>');
  w.document.close();
}
function attListWord(sub){
  const h='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:21cm 29.7cm;mso-page-orientation:portrait;margin:1.2cm}</style></head><body>'+attListHtml(sub,attListRegs(sub))+'</body></html>';
  attSaveBlob(new Blob(['\ufeff'+h],{type:'application/msword'}),'Training_Registration_'+(sub==='ಕನ್ನಡ'?'Kannada':'Science')+'_'+todayStr()+'.doc');
}
function attRegDel(id){ if(!confirm('ಈ ನೋಂದಣಿ ಅಳಿಸಬೇಕೇ?')) return; DB.attRegs=attRegs().filter(r=>r.id!==id); if(!DB.deletedIds) DB.deletedIds={}; DB.deletedIds['attRegs:'+id]=Date.now(); saveDB(); renderAttCert(); }
function attListSend(sub){
  const done=new Set(); attLists().filter(l=>l.subject===sub&&l.status!=='Returned').forEach(l=>l.regIds.forEach(i=>done.add(i)));
  const regs=attListRegs(sub).filter(r=>!done.has(r.id));
  if(!regs.length){ showToast('ℹ ಎಲ್ಲಾ ನೋಂದಣಿಗಳನ್ನು ಈಗಾಗಲೇ ಕಳುಹಿಸಲಾಗಿದೆ — ಹೊಸ ನೋಂದಣಿ ಇಲ್ಲ'); return; }
  if(!confirm(sub+' ವಿಷಯದ '+regs.length+' ಹೊಸ ನೋಂದಣಿಗಳನ್ನು Principal ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಬೇಕೇ?')) return;
  attLists().push({id:uid(),subject:sub,status:'Sent to Principal',sentAt:todayStr(),sentBy:CURRENT_USER.name,regIds:regs.map(r=>r.id),count:regs.length});
  const p=STAFF.find(x=>x.role==='principal'); if(p) pushNotification(p.name,'📋 ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ — ತರಬೇತಿ ನೋಂದಣಿ ಪಟ್ಟಿ ('+sub+', '+regs.length+') ಅನುಮೋದನೆ ಅಗತ್ಯ');
  saveDB(); showToast('📤 Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderAttCert();
}
function attListView(id){
  const l=attLists().find(x=>x.id===id); if(!l) return;
  const regs=attRegs().filter(r=>l.regIds.includes(r.id));
  const bg=attModal('attPrevBg'); const isP=CURRENT_USER&&CURRENT_USER.role==='principal';
  bg.innerHTML=`<div style="background:#fff;border-radius:8px;max-width:980px;width:100%;max-height:94vh;display:flex;flex-direction:column"><div style="padding:8px 12px;border-bottom:1px solid #ddd;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><b style="flex:1">${esc(l.subject)} — ನೋಂದಣಿ ಪಟ್ಟಿ (${regs.length})</b>
   ${isP&&l.status==='Sent to Principal'?`<button class="gv-b ok" onclick="attListDecide('${id}',true)">✔ ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="attListDecide('${id}',false)">↩ ಹಿಂದಿರುಗಿಸಿ</button>`:''}<button class="gv-b" onclick="attClosePrev()">✕ ಮುಚ್ಚಿ</button></div>
   <div style="overflow:auto;padding:14px">${attListHtml(l.subject,regs,l.status==='Approved'?l.approvedAt:'')}</div></div>`;
  bg.classList.add('show');
}
function attListDecide(id,ok){
  const l=attLists().find(x=>x.id===id); if(!l) return;
  if(ok){ l.status='Approved'; l.approvedAt=todayStr(); l.approvedBy=CURRENT_USER.name; }
  else { const r=prompt('ಹಿಂದಿರುಗಿಸಲು ಕಾರಣ:'); if(r===null) return; l.status='Returned'; l.remarks=r; }
  const f=STAFF.find(x=>x.role==='fda'); if(f) pushNotification(f.name,(ok?'✅ ':'↩ ')+'ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ — ನೋಂದಣಿ ಪಟ್ಟಿ ('+l.subject+') '+(ok?'ಅನುಮೋದಿತ':'ಹಿಂದಿರುಗಿದೆ'));
  saveDB(); attClosePrev(); renderAttCert();
}
function attSubSet(s){ ATT_SUB=s; ATT_MDATE=''; renderAttCert(); }

/* ----- training form (adds subject) ----- */



/* ----- generate certificates from registrations ----- */
function attGenerate(){
  const tr=attTr(ATT_TR); if(!tr){ showToast('⚠ ಮೊದಲು ತರಬೇತಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const picks=[...document.querySelectorAll('.attSel:checked')].map(x=>x.value); if(!picks.length){ showToast('⚠ ಶಿಕ್ಷಕರ ಹೆಸರಿನ ಮುಂದೆ ಟಿಕ್ ಮಾಡಿ'); return; }
  let n=0, skipped=0;
  picks.forEach(id=>{
    const r=attRegs().find(x=>x.id===id); if(!r) return;
    if(attCerts().some(c=>c.trainingId===tr.id&&(c.regId===r.id||attSame({subject:attCertSub(c),hrmsId:c.hrmsId,mobile:c.mobile},r)))){ skipped++; return; }
    let att=+(document.getElementById('attDays_'+id)||{}).value; if(!(att>=0)) att=tr.totalDays; if(att>tr.totalDays) att=tr.totalDays;
    attCerts().push({id:uid(),trainingId:tr.id,regId:r.id,subject:r.subject,type:r.type||'ಖಾಯಂ',hrmsId:r.hrmsId,name:r.name,desig:r.desig||'ಶಿಕ್ಷಕರು',school:attRegSchoolLine(r),mobile:r.mobile,total:tr.totalDays,attended:att,status:'Draft',createdAt:todayStr(),createdBy:CURRENT_USER.name}); n++;
  });
  saveDB(); showToast(n?'✅ '+n+' ಕರಡು ತಯಾರಾಗಿದೆ'+(skipped?' ('+skipped+' ಈಗಾಗಲೇ ಇದೆ)':'')+' — ಕೆಳಗೆ "ಪ್ರಮಾಣಪತ್ರಗಳು" ನೋಡಿ':'ℹ ಆಯ್ದವರಿಗೆ ಈಗಾಗಲೇ ಪ್ರಮಾಣಪತ್ರ ಇದೆ (ಕೆಳಗೆ ನೋಡಿ)'); renderAttCert();
}
function attSelSub(sub,el){ document.querySelectorAll('.attSel[data-sub="'+sub+'"]:not(:disabled)').forEach(x=>x.checked=el.checked); }

/* ----- main page ----- */
function renderAttCert(){
  const role=CURRENT_USER.role, isP=role==='principal';
  if(!isP&&role!=='fda'){ document.getElementById('content').innerHTML='<div class="panel">ಪ್ರವೇಶವಿಲ್ಲ</div>'; return; }
  if(!window._attShardOnce){ window._attShardOnce=1; attShardPull().then(n=>{ if(n&&CURRENT_PAGE==='attcert') renderAttCert(); }).catch(()=>{}); }
  if(!ATT_TAB||['draft','pend','list','rpend','reg','mat'].indexOf(ATT_TAB)<0) ATT_TAB=isP?'pend':'list';
  if(isP&&['draft','list','mat'].includes(ATT_TAB)) ATT_TAB='pend';
  if(!isP&&['pend','rpend'].includes(ATT_TAB)) ATT_TAB='list';
  const trs=attTrs(); if(!ATT_TR||!attTr(ATT_TR)) ATT_TR=trs.length?trs[trs.length-1].id:null;
  const tr=attTr(ATT_TR), all=attCerts();
  const head=`<div class="page-head"><h2>🎓 ತರಬೇತಿ ನೋಂದಣಿ & ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ</h2><div class="desc">${isP?'ನೋಂದಣಿ ಪಟ್ಟಿ ಹಾಗೂ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸಿ — ಅನುಮೋದನೆಯ ನಂತರವೇ ಅಧಿಕೃತ ಸಂಖ್ಯೆ, QR, ಬಾರ್‌ಕೋಡ್ ಸಹಿತ PDF ಸಿದ್ಧ':'ಮುಖಪುಟದಲ್ಲಿ ನೋಂದಣಿ → ನೋಂದಣಿ ಪಟ್ಟಿ → Principal ಅನುಮೋದನೆ → ಟಿಕ್ ಮಾಡಿ ಪ್ರಮಾಣಪತ್ರ Generate → Principal ಅನುಮೋದನೆ → ಶಿಕ್ಷಕರು ಮುಖಪುಟದಲ್ಲಿ ಡೌನ್‌ಲೋಡ್'}</div></div>`;
  const nl=attLists().filter(l=>l.status==='Sent to Principal').length;
  const tabs=`<div class="gv-tabs">${(isP?[['pend','ಪ್ರಮಾಣಪತ್ರ ಅನುಮೋದನೆ'],['rpend','ನೋಂದಣಿ ಪಟ್ಟಿ ಅನುಮೋದನೆ'+(nl?' ('+nl+')':'')],['reg','ವಿತರಣಾ ವಹಿ']]:[['list','ನೋಂದಣಿ ಪಟ್ಟಿ'],['mat','ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ'],['draft','ಪ್ರಮಾಣಪತ್ರ Generate'],['reg','ವಿತರಣಾ ವಹಿ']]).map(t=>`<button class="gv-tab ${ATT_TAB===t[0]?'on':''}" onclick="attTabSet('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
  let body='';
  if(ATT_TAB==='reg'){
    const iss=all.filter(c=>c.status==='Issued'&&attCertSub(c)===ATT_SUB).slice().reverse();
    body=`<div class="panel"><h3>📒 ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ವಿತರಣಾ ವಹಿ (${iss.length})</h3><div class="note">ಇವೆಲ್ಲವೂ "ದಾಖಲಾತಿ ವಿತರಣಾ ವಹಿ"ಯಲ್ಲೂ ಸ್ವಯಂ ದಾಖಲಾಗುತ್ತವೆ.</div>
     <div class="table-wrap"><table class="gov-table"><thead><tr><th></th><th>ಶಿಕ್ಷಕರು</th><th>HRMS</th><th>ತರಬೇತಿ</th><th>ಹಾಜರಾತಿ</th><th>ಸ್ಥಿತಿ</th><th>ಪ್ರಮಾಣಪತ್ರ ಸಂ.</th><th>ವಿತರಣೆ</th></tr></thead><tbody>${iss.length?iss.map(c=>{const t=attTr(c.trainingId)||{};return `<tr><td><input type="checkbox" class="attChk" value="${c.id}"></td><td><b>${esc(c.name)}</b></td><td>${esc(c.hrmsId)}</td><td>${esc(t.letterNo||'')}<br><span class="small-muted">${attDD(attTDate(attCertSub(c)))}</span></td><td>${c.attended}/${c.total} (${attPct(c)}%)</td><td><span class="gv-st ok">ಅನುಮೋದಿತ</span></td><td>${esc(c.certNo)}</td><td>${attDD(c.issuedAt)}<br><span class="small-muted">${esc(c.approvedBy||'')}</span> <button class="gv-b lnk" onclick="attPreview('${c.id}')">👁</button> <button class="gv-b lnk" onclick="attDownloadOne('${c.id}')">⬇</button></td></tr>`;}).join(''):'<tr><td colspan="8" style="text-align:center">ಯಾವುದೂ ಇಲ್ಲ</td></tr>'}</tbody></table></div>
     <div style="margin-top:8px"><label><input type="checkbox" onclick="attAll(this)"> ಎಲ್ಲಾ ಆಯ್ಕೆ</label> <button class="gv-b pri" onclick="attZipSel()">⬇ ಆಯ್ದವುಗಳ ZIP (ಪ್ರತ್ಯೇಕ PDF)</button> ${!isP?'<button class="gv-b" onclick="attRestoreBackup()">♻ ಸರ್ವರ್ ಬ್ಯಾಕಪ್‌ನಿಂದ ಮರುಸ್ಥಾಪಿಸಿ</button> <button class="gv-b" onclick="attRestorePick()">♻ ಡೌನ್‌ಲೋಡ್ PDF ಗಳಿಂದ ಮರುಸ್ಥಾಪಿಸಿ</button>':''}</div></div>`;
  } else if(ATT_TAB==='mat'){
    body=attMatTabHtml();
  } else if(ATT_TAB==='rpend'){
    const ls=attLists().filter(l=>l.subject===ATT_SUB).slice().reverse();
    body=`<div class="panel"><h3>📋 ನೋಂದಣಿ ಪಟ್ಟಿಗಳು</h3>${ls.length?`<div class="table-wrap"><table class="gov-table"><thead><tr><th>ದಿನಾಂಕ</th><th>ವಿಷಯ</th><th>ಶಿಕ್ಷಕರು</th><th>ಸ್ಥಿತಿ</th><th></th></tr></thead><tbody>${ls.map(l=>`<tr><td>${attDD(l.sentAt)}</td><td>${esc(l.subject)}</td><td>${l.count}</td><td><span class="gv-st ${l.status==='Approved'?'ok':'pend'}">${l.status==='Approved'?'ಅನುಮೋದಿತ':l.status==='Returned'?'ಹಿಂದಿರುಗಿದೆ':'ಬಾಕಿ'}</span></td><td><button class="gv-b pri" onclick="attListView('${l.id}')">👁 ನೋಡಿ${l.status==='Sent to Principal'?' / ಅನುಮೋದಿಸಿ':''}</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="small-muted">ಯಾವುದೂ ಇಲ್ಲ.</div>'}</div>`;
  } else if(ATT_TAB==='list'){
    const regs=attListRegs(ATT_SUB), lastL=attLists().filter(l=>l.subject===ATT_SUB).pop();
    body=`<div class="panel"><h3>📝 ${ATT_SUB} ವಿಷಯ — ನೋಂದಣಿ ಪಟ್ಟಿ</h3>
     <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><button class="gv-b pri" onclick="attRegForm0()">➕ ಸೇರಿಸಿ</button><button class="gv-b" onclick="attListPrint('${ATT_SUB}')">🖨 Print / PDF</button><button class="gv-b" onclick="attListWord('${ATT_SUB}')">📄 Word</button><button class="gv-b ok" onclick="attListSend('${ATT_SUB}')">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button></div>
     ${lastL?`<div class="note">ಕೊನೆಯ ಪಟ್ಟಿ: ${attDD(lastL.sentAt)} — <b>${lastL.status==='Approved'?'ಅನುಮೋದಿತ '+attDD(lastL.approvedAt):lastL.status==='Returned'?'ಹಿಂದಿರುಗಿದೆ: '+esc(lastL.remarks||''):'Principal ಬಳಿ ಬಾಕಿ'}</b></div>`:''}
     <div class="table-wrap"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಶಿಕ್ಷಕರ ಹೆಸರು</th><th>ಶಾಲೆ</th><th>HRMS ID</th><th>ಮೊಬೈಲ್</th><th>ಸಹಿ</th><th></th></tr></thead><tbody>${regs.length?regs.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.name)}</b><br><span class="small-muted">${esc(r.desig||'')}</span></td><td>${esc(attRegSchoolLine(r))}${r.schoolCode?'<br><span class="small-muted">ಶಾಲೆ ಕೋಡ್: '+esc(r.schoolCode)+'</span>':''}</td><td>${esc(r.hrmsId)}</td><td>${esc(r.mobile)}</td><td></td><td><button class="gv-b lnk" onclick="attRegForm('${r.id}')">✏</button> <button class="gv-b lnk" onclick="attRegDel('${r.id}')">🗑</button></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center">ಇನ್ನೂ ನೋಂದಣಿ ಇಲ್ಲ — ಶಿಕ್ಷಕರು ಮುಖಪುಟದಲ್ಲಿ "ತರಬೇತಿಗೆ ನೋಂದಾಯಿಸಿ" ಒತ್ತಬೇಕು</td></tr>'}</tbody></table></div></div>`;
  } else if(isP){
    const pend=all.filter(c=>c.status==='Sent to Principal'&&attCertSub(c)===ATT_SUB);
    body=`<div class="panel"><h3>📋 ಅನುಮೋದನೆಗೆ ಬಾಕಿ (${pend.length})</h3>${pend.length?`<div class="table-wrap"><table class="gov-table"><thead><tr><th><input type="checkbox" onclick="attAll(this)"></th><th>ಶಿಕ್ಷಕರು</th><th>HRMS</th><th>ತರಬೇತಿ</th><th>ಹಾಜರಾತಿ</th><th>ಸ್ಥಿತಿ</th><th>ಸಂ.</th><th></th></tr></thead><tbody>${attRows(pend)}</tbody></table></div>
      <div style="margin-top:8px"><button class="gv-b ok" onclick="attApproveSel()">✔ ಆಯ್ದವನ್ನು ಅನುಮೋದಿಸಿ</button> <button class="gv-b" onclick="attReturnSel()">↩ ಆಯ್ದವನ್ನು ಹಿಂದಿರುಗಿಸಿ</button></div>`:'<div class="small-muted">ಅನುಮೋದನೆಗೆ ಯಾವುದೂ ಬಾಕಿ ಇಲ್ಲ.</div>'}</div>`;
  } else {
    const mine=all.filter(c=>c.trainingId===ATT_TR&&attCertSub(c)===ATT_SUB);
    const have=new Set(all.filter(c=>c.trainingId===ATT_TR).map(c=>c.regId||String(c.hrmsId).toLowerCase()));
    body=`<div class="panel"><h3>1️⃣ ತರಬೇತಿ</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select onchange="attTrPick(this.value)" style="min-width:260px">${trs.length?trs.map(t=>`<option value="${t.id}" ${t.id===ATT_TR?'selected':''}>${esc(t.letterNo)}</option>`).join(''):'<option>— ತರಬೇತಿ ಇಲ್ಲ —</option>'}</select>
      <button class="gv-b pri" onclick="attTrForm('new')">➕ ಹೊಸ ತರಬೇತಿ</button>${tr?`<button class="gv-b" onclick="attTrForm('edit')">✏ ತಿದ್ದಿ</button>`:''}</div><div id="attTrBox"></div></div>
     ${tr?`<div class="panel"><h3>2️⃣ ನೋಂದಾಯಿತ ಶಿಕ್ಷಕರು — ಹೆಸರಿನ ಮುಂದೆ ಟಿಕ್ ಮಾಡಿ (ಒಬ್ಬರು ಅಥವಾ ಎಲ್ಲರು)</h3>
      ${[ATT_SUB].map(sub=>{const rs=attListRegs(sub);return `<div style="margin:6px 0 2px;font-weight:700">${sub} ವಿಷಯ (${rs.length})</div><div class="table-wrap"><table class="gov-table"><thead><tr><th><input type="checkbox" title="ಎಲ್ಲಾ" onclick="attSelSub('${sub}',this)"></th><th>ಹೆಸರು</th><th>ಶಾಲೆ</th><th>HRMS ID</th><th>ಮೊಬೈಲ್</th><th>ಹಾಜರಾದ ದಿನ (ಒಟ್ಟು ${tr.totalDays})</th></tr></thead><tbody>${rs.length?rs.map(r=>{const has=have.has(r.id)||(r.hrmsId&&have.has(r.hrmsId.toLowerCase()));return `<tr><td><input type="checkbox" class="attSel" data-sub="${sub}" value="${r.id}" ${has?'disabled checked':''}></td><td><b>${esc(r.name)}</b>${r.type==='ಅತಿಥಿ'?' <span style="background:#fff3cd;color:#8a6d00;border-radius:4px;padding:0 5px;font-size:11px;font-weight:700">ಅತಿಥಿ</span>':''}${has?' <span class="gv-st ok">ತಯಾರಾಗಿದೆ</span>':''}</td><td>${esc(attRegSchoolLine(r))}${r.schoolCode?'<br><span class="small-muted">ಶಾಲೆ ಕೋಡ್: '+esc(r.schoolCode)+'</span>':''}</td><td>${esc(r.hrmsId)}</td><td>${esc(r.mobile)}</td><td><input type="number" id="attDays_${r.id}" min="0" max="${tr.totalDays}" value="${tr.totalDays}" style="width:70px" ${has?'disabled':''}></td></tr>`;}).join(''):'<tr><td colspan="6" style="text-align:center">ನೋಂದಣಿ ಇಲ್ಲ</td></tr>'}</tbody></table></div>`;}).join('')}
      <div style="margin-top:8px"><button class="gv-b pri" onclick="attGenerate()">⚙ ಟಿಕ್ ಮಾಡಿದವರಿಗೆ ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ ಕರಡು (Generate)</button></div></div>
     <div class="panel"><h3>3️⃣ ಪ್ರಮಾಣಪತ್ರಗಳು (${mine.length})</h3>${mine.length?`<div class="table-wrap"><table class="gov-table"><thead><tr><th><input type="checkbox" onclick="attAll(this)"></th><th>ಶಿಕ್ಷಕರು</th><th>HRMS</th><th>ತರಬೇತಿ</th><th>ಹಾಜರಾತಿ</th><th>ಸ್ಥಿತಿ</th><th>ಸಂ.</th><th></th></tr></thead><tbody>${attRows(mine)}</tbody></table></div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="gv-b pri" onclick="attSendSel()">📤 ಆಯ್ದವನ್ನು Principal ಗೆ ಕಳುಹಿಸಿ</button><button class="gv-b" onclick="attZipSel()">⬇ ಆಯ್ದ ಅನುಮೋದಿತ — ZIP</button><button class="gv-b" onclick="attDeleteSel()">🗑 ಕರಡು ಅಳಿಸಿ</button></div>`:'<div class="small-muted">ಇನ್ನೂ ಯಾವುದೂ ಇಲ್ಲ.</div>'}</div>`:'<div class="note">ಮೇಲೆ "ಹೊಸ ತರಬೇತಿ" ಒತ್ತಿ ವಿವರ ಉಳಿಸಿ.</div>'}`;
  }
  const nd=attDupRegIds().length+attDupCertIds().length;
  const info=`<div class="note" style="margin:0 0 8px">ಒಟ್ಟು ನೋಂದಣಿ: ಕನ್ನಡ <b>${attListRegs('ಕನ್ನಡ').length}</b> · ವಿಜ್ಞಾನ <b>${attListRegs('ವಿಜ್ಞಾನ').length}</b> — ಮೇಲಿನ ವಿಷಯ ಟ್ಯಾಬ್ ಬದಲಿಸಿ ನೋಡಿ.${nd?` <button class="gv-b" style="margin-left:8px" onclick="attDedupe()">🧹 ಪುನರಾವರ್ತಿತ ${nd} ತೆಗೆಯಿರಿ</button>`:''}${CURRENT_USER.role==='fda'?' <button class="gv-b" style="margin-left:8px" onclick="attRefresh()">🔄 ಹೊಸ ನೋಂದಣಿ ತರಿಸಿ</button> <button class="gv-b" style="margin-left:8px;color:#b3261e;border-color:#b3261e" onclick="attWipeAll()">🗑 ಎಲ್ಲಾ ಅಳಿಸಿ</button>':''}</div>`;
  document.getElementById('content').innerHTML=head+tabs+attSubBar()+info+body;
}
function attRegForm0(){ attRegForm(); }
function attWipeAll(){
  if(!CURRENT_USER||CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ'); return; }
  const w=prompt('⚠ ತರಬೇತಿ ನೋಂದಣಿ, ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ, ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರಗಳು (ಅನುಮೋದಿತ ಸಹ) ಮತ್ತು ವಿತರಣಾ ವಹಿ ನಮೂದುಗಳು ಸರ್ವರ್ ಮತ್ತು ಎಲ್ಲಾ ಲಾಗಿನ್‌ಗಳಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಯುತ್ತವೆ.\n\nಮುಂದುವರಿಯಲು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ:');
  if(w===null) return; if(String(w).trim().toUpperCase()!=='DELETE'){ showToast('ರದ್ದು — DELETE ಟೈಪ್ ಮಾಡಿಲ್ಲ'); return; }
  try{ const bk={attRegs:attRegs(),attRegLists:attLists(),attCerts:attCerts(),attMats:attMats()}; const u=URL.createObjectURL(new Blob([JSON.stringify(bk,null,1)],{type:'application/json'})); const l=document.createElement('a'); l.href=u; l.download='BACKUP_training_'+todayStr()+'.json'; document.body.appendChild(l); l.click(); l.remove(); }
  catch(e){ if(!confirm('ಬ್ಯಾಕಪ್ ಆಗಲಿಲ್ಲ. ಆದರೂ ಅಳಿಸಬೇಕೇ?')) return; }
  const ids=new Set(attCerts().map(c=>c.id)), n=attRegs().length+attLists().length+attCerts().length+attMats().length;
  DB.deletedIds=DB.deletedIds||{}; const tm=Date.now();
  ['attRegs','attRegLists','attCerts','attMats'].forEach(k=>(DB[k]||[]).forEach(o=>{DB.deletedIds[k+':'+o.id]=tm;}));
  (DB.docIssueRegister||[]).filter(d=>ids.has(d.cardId)).forEach(d=>{DB.deletedIds['docIssueRegister:'+d.id]=tm;});
  DB.attRegs=[]; DB.attRegLists=[]; DB.attCerts=[]; DB.attMats=[];
  DB.docIssueRegister=(DB.docIssueRegister||[]).filter(d=>!ids.has(d.cardId));
  window.ALLOW_SHRINK=true; saveDB(); attShardClear(); showToast('🗑 '+n+' ನಮೂದುಗಳು ಅಳಿಸಲಾಗಿದೆ'); renderAttCert();
}
/* --- safe concurrent registration: each registration is also written to a small shard row (by last 2 digits of mobile), verified, retried --- */
function attShardId(m){ return SB_ID+'_areg_'+String(m).slice(-2); }
function attShardRegs(g){ const a=g&&g.data&&g.data.data&&g.data.data.regs; return Array.isArray(a)?a:[]; }
async function attShardPush(r){
  const sb=getSB(), id=attShardId(r.mobile);
  for(let i=0;i<8;i++){
    try{
      const g=await sb.from('school_data').select('data').eq('id',id).maybeSingle();
      let arr=attShardRegs(g); if(!arr.some(x=>x.id===r.id)) arr=arr.concat([r]);
      const u=await sb.from('school_data').upsert({id,data:{regs:arr}}); if(u.error) throw u.error;
      await new Promise(z=>setTimeout(z,400+Math.random()*900));
      const v=await sb.from('school_data').select('data').eq('id',id).maybeSingle();
      if(attShardRegs(v).some(x=>x.id===r.id)) return true;
    }catch(e){ await new Promise(z=>setTimeout(z,800+Math.random()*1200)); }
  }
  return false;
}
async function attShardPull(){
  const sb=getSB(); let added=0; const dead=DB.deletedIds||{};
  const ids=[]; for(let i=0;i<100;i++) ids.push(SB_ID+'_areg_'+String(i).padStart(2,'0'));
  for(let i=0;i<ids.length;i+=10){
    const res=await Promise.all(ids.slice(i,i+10).map(id=>sb.from('school_data').select('data').eq('id',id).maybeSingle().catch(()=>null)));
    res.forEach(g=>attShardRegs(g).forEach(r=>{ if(r&&r.id&&!dead['attRegs:'+r.id]&&!attRegs().some(x=>x.id===r.id||attSame(x,r))){ DB.attRegs.push(r); added++; } }));
  }
  if(added) saveDB();
  return added;
}
async function attShardClear(){ const sb=getSB(); for(let i=0;i<100;i++){ try{ await sb.from('school_data').delete().eq('id',SB_ID+'_areg_'+String(i).padStart(2,'0')); }catch(e){} } }
async function attRefresh(){ showToast('⏳ ಸರ್ವರ್‌ನಿಂದ ತರಿಸಲಾಗುತ್ತಿದೆ…'); try{ const u=await loadFromSupabase(); if(u){ migrateDB(); } }catch(e){} let n=0; try{ n=await attShardPull(); }catch(e){} renderAttCert(); showToast('✅ ನವೀಕರಿಸಲಾಗಿದೆ'+(n?' — '+n+' ಹೊಸ ನೋಂದಣಿ ಸೇರಿದೆ':'')); }
function attSame(a,b){ return a.subject===b.subject&&((a.hrmsId&&b.hrmsId&&String(a.hrmsId).toLowerCase()===String(b.hrmsId).toLowerCase())||(a.mobile&&a.mobile===b.mobile)); }
function attDupRegIds(){
  const keep=[], dup=[]; attRegs().slice().sort((a,b)=>(a.ts||0)-(b.ts||0)).forEach(r=>{ const k=keep.find(x=>attSame(x,r)); if(k) dup.push([r,k]); else keep.push(r); });
  return dup;
}
function attDupCertIds(){
  const out=[], seen=[];
  attCerts().slice().sort((a,b)=>({'Issued':0,'Sent to Principal':1,'Returned':2,'Draft':3}[a.status]-({'Issued':0,'Sent to Principal':1,'Returned':2,'Draft':3}[b.status]))).forEach(c=>{
    const cs=attCertSub(c), f=seen.find(x=>x.trainingId===c.trainingId&&attCertSub(x)===cs&&((x.hrmsId&&c.hrmsId&&String(x.hrmsId).toLowerCase()===String(c.hrmsId).toLowerCase())||(x.mobile&&x.mobile===c.mobile)));
    if(f){ if(c.status!=='Issued') out.push(c.id); } else seen.push(c); });
  // exact duplicates of an already-issued certificate (same certificate number): keep one (prefer the copy that has a training), drop the rest
  const byNo={};
  attCerts().filter(c=>c.status==='Issued'&&c.certNo).forEach(c=>{ (byNo[c.certNo]=byNo[c.certNo]||[]).push(c); });
  Object.keys(byNo).forEach(no=>{ const g=byNo[no]; if(g.length<2) return; g.sort((a,b)=>(b.trainingId?1:0)-(a.trainingId?1:0)); g.slice(1).forEach(c=>{ if(out.indexOf(c.id)<0) out.push(c.id); }); });
  return out;
}
function attDedupe(){
  const dr=attDupRegIds(), dc=attDupCertIds();
  if(!dr.length&&!dc.length){ showToast('ℹ ಪುನರಾವರ್ತನೆ ಇಲ್ಲ'); return; }
  if(!confirm(dr.length+' ಪುನರಾವರ್ತಿತ ನೋಂದಣಿ ಮತ್ತು '+dc.length+' ಪುನರಾವರ್ತಿತ ಕರಡು ತೆಗೆಯಬೇಕೇ? (ಮೊದಲ ನೋಂದಣಿ ಉಳಿಯುತ್ತದೆ)')) return;
  if(!DB.deletedIds) DB.deletedIds={};
  dr.forEach(([r,k])=>{ attMats().forEach(m=>{ if(m.regId===r.id){ if(attMats().some(x=>x.regId===k.id)){ DB.deletedIds['attMats:'+m.id]=Date.now(); m._del=1; } else m.regId=k.id; } });
    attCerts().forEach(c=>{ if(c.regId===r.id&&!dc.includes(c.id)) c.regId=k.id; });
    DB.deletedIds['attRegs:'+r.id]=Date.now(); });
  const rid=new Set(dr.map(x=>x[0].id));
  DB.attRegs=attRegs().filter(r=>!rid.has(r.id)); DB.attMats=attMats().filter(m=>!m._del);
  dc.forEach(i=>DB.deletedIds['attCerts:'+i]=Date.now()); DB.attCerts=attCerts().filter(c=>!dc.includes(c.id)); DB.docIssueRegister=(DB.docIssueRegister||[]).filter(d=>{ if(dc.includes(d.cardId)){ DB.deletedIds['docIssueRegister:'+d.id]=Date.now(); return false; } return true; });
  saveDB(); showToast('✅ ಪುನರಾವರ್ತನೆ ತೆಗೆಯಲಾಗಿದೆ'); renderAttCert();
}


;(window.__LOADED=window.__LOADED||[]).push('training-cert');
