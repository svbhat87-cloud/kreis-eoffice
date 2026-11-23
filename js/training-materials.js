/* ===== ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ (training materials receipt register) ===== */
var ATT_MDATE='';
const ATT_SITE='www.mdrsshedbarieoffice.in';
function attMats(){ return DB.attMats||(DB.attMats=[]); }
/* --- recovery: rebuild issued certificates (same numbers) from already-downloaded PDF file names --- */
function attRestorePick(){ let i=document.getElementById('attRestIn'); if(!i){ i=document.createElement('input'); i.type='file'; i.id='attRestIn'; i.multiple=true; i.accept='.pdf'; i.style.display='none'; i.onchange=function(){ attRestoreRun([...i.files]); i.value=''; }; document.body.appendChild(i); } i.click(); }
function attRestoreRun(files){
  if(!CURRENT_USER||CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ'); return; }
  const pr=(STAFF.find(x=>x.role==='principal')||{}).name||'';
  let add=0, skip=0, bad=[], noreg=[];
  files.forEach(f=>{
    const m=String(f.name).match(/ATC-(KAN|SCI)-(\d{4}-\d{2})-(\d{4})_(\w+)/i);
    if(!m){ bad.push(f.name); return; }
    const sc=m[1].toUpperCase(), ay=m[2], no=+m[3], key=m[4], sub=sc==='SCI'?'ವಿಜ್ಞಾನ':'ಕನ್ನಡ';
    const certNo='ATC/'+sc+'/'+ay+'/'+String(no).padStart(4,'0');
    if(attCerts().some(c=>c.certNo===certNo)){ skip++; return; }
    const r=attRegs().find(x=>(x.subject||'ಕನ್ನಡ')===sub&&(String(x.mobile)===key||String(x.hrmsId||'').toLowerCase()===key.toLowerCase()));
    if(!r){ noreg.push(f.name); return; }
    const tr=attTrs().find(t=>t.subject===sub)||attTrs()[attTrs().length-1]||{};
    const d=new Date(f.lastModified||Date.now()), p=x=>String(x).padStart(2,'0');
    const iso=d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
    const c={id:uid(),trainingId:tr.id,regId:r.id,subject:sub,type:r.type||'ಖಾಯಂ',hrmsId:r.hrmsId,name:r.name,desig:r.desig||'ಶಿಕ್ಷಕರು',school:attRegSchoolLine(r),mobile:r.mobile,total:tr.totalDays||1,attended:tr.totalDays||1,status:'Issued',createdAt:iso,createdBy:CURRENT_USER.name,certNo:certNo,issuedAt:iso,approvedBy:pr,approvedAt:iso,approvedStamp:p(d.getDate())+'-'+p(d.getMonth()+1)+'-'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes()),approvedIp:'—',restored:1};
    attCerts().push(c);
    DB.docIssueRegister.push({id:uid(),docNo:certNo,dateIssued:iso,studentName:c.name,satsNo:'',admissionNo:c.hrmsId,className:'ಶಿಕ್ಷಕರು',docType:'ಹಾಜರಾತಿ ಪ್ರಮಾಣ ಪತ್ರ (ತರಬೇತಿ — '+sub+')',issuedTo:c.name,issuedBy:pr,cardId:c.id});
    const sk='attcert_'+sc+'_'+ay; if(!DB.seq) DB.seq={}; if((DB.seq[sk]||0)<no) DB.seq[sk]=no;
    add++;
  });
  saveDB();
  alert('ಮರುಸ್ಥಾಪಿತ: '+add+'\nಈಗಾಗಲೇ ಇದ್ದವು: '+skip+(noreg.length?'\nನೋಂದಣಿ ಸಿಗದ ಫೈಲ್‌ಗಳು ('+noreg.length+'):\n'+noreg.slice(0,15).join('\n'):'')+(bad.length?'\nಹೆಸರು ಹೊಂದದ ಫೈಲ್‌ಗಳು ('+bad.length+')':''));
  renderAttCert();
}
async function attRestoreBackup(){
  if(!CURRENT_USER||CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ'); return; }
  const sb=getSB(); const out=[];
  for(let i=0;i<8;i++){ try{ const g=await sb.from('school_data').select('data,updated_at').eq('id',SB_ID+'_bak'+i).maybeSingle(); if(g&&g.data&&g.data.data&&Object.keys(g.data.data).length>5) out.push({i,t:g.data.updated_at,d:g.data.data}); }catch(e){} }
  if(!out.length){ alert('ಸರ್ವರ್‌ನಲ್ಲಿ ಬ್ಯಾಕಪ್ ಇನ್ನೂ ಇಲ್ಲ.'); return; }
  out.sort((a,b)=>String(b.t).localeCompare(String(a.t)));
  const ln=out.map((o,k)=>(k+1)+') '+new Date(o.t).toLocaleString('en-IN')+' — ಪ್ರಮಾಣಪತ್ರ '+((o.d.attCerts||[]).length)+', ನೋಂದಣಿ '+((o.d.attRegs||[]).length)).join('\n');
  const w=prompt('ಯಾವ ಬ್ಯಾಕಪ್ ಮರಳಿ ತರಬೇಕು? ಸಂಖ್ಯೆ ಟೈಪ್ ಮಾಡಿ:\n\n'+ln); if(!w) return; const o=out[(+w)-1]; if(!o){ showToast('ರದ್ದು'); return; }
  const inc=await resolveBlobs(sb,JSON.parse(JSON.stringify(o.d))); delete inc.deletedIds;
  if(!DB.deletedIds) DB.deletedIds={};
  Object.keys(inc).forEach(k=>{ if(Array.isArray(inc[k])) inc[k].forEach(x=>{ if(x&&x.id!=null) delete DB.deletedIds[k+':'+x.id]; }); });
  mergeDBInPlace(inc);
  if(inc.users) DB.users=Object.assign({},DB.users,inc.users);
  if(inc.seq) DB.seq=Object.assign({},DB.seq,inc.seq);
  saveDB(); alert('ಮರುಸ್ಥಾಪನೆ ಆಯಿತು.'); renderAttCert();
}
function attNowStr(){ const n=new Date(),p=x=>String(x).padStart(2,'0'); return p(n.getDate())+'-'+p(n.getMonth()+1)+'-'+n.getFullYear()+' '+p(n.getHours())+':'+p(n.getMinutes()); }
function attMatFormHtml(r,withTitle){
  const have=attMats().find(m=>m.regId===r.id);
  const opt=(id,lbl,yes)=>`<div class="field" style="margin:6px 0"><label>${lbl}</label><select id="${id}" style="width:100%"><option value="1" selected>${yes}</option><option value="0">ಸ್ವೀಕರಿಸಿಲ್ಲ</option></select></div>`;
  return `${withTitle||''}<h3 style="margin:6px 0 6px;font-size:15px">📦 ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ</h3>
   <div style="font-size:12.5px;line-height:1.7;background:#f3f6fa;border-radius:6px;padding:6px 10px;text-align:left"><b>${esc(r.name)}</b><br>ಹುದ್ದೆ: ${esc(r.desig||'—')}<br>ಮೊಬೈಲ್: ${esc(r.mobile)} · ${esc(r.subject)} ವಿಷಯ</div>
   ${have?`<div class="verify-card good" style="margin-top:8px">✅ ಸಾಮಗ್ರಿ ಈಗಾಗಲೇ ಸ್ವೀಕರಿಸಲಾಗಿದೆ (${esc(have.date)})</div>`:`
   <div style="text-align:left">${opt('atM_pen','ಪೆನ್ನು','ಪೆನ್ನು — 1')}${opt('atM_nb','ನೋಟ್‌ಬುಕ್','ನೋಟ್‌ಬುಕ್ — 1')}${opt('atM_xr','ಜೆರಾಕ್ಸ್ ಪ್ರತಿ','ಜೆರಾಕ್ಸ್ ಪ್ರತಿ — 1 ಸೆಟ್')}</div>
   <div style="font-size:11px;color:#555;margin:4px 0">"ಸ್ವೀಕರಿಸಿ" ಒತ್ತಿದರೆ ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಸಹಿ (ಹೆಸರು, ದಿನಾಂಕ, ಸಮಯ) ದಾಖಲಾಗುತ್ತದೆ.</div>
   <button class="btn btn-green" style="min-width:140px" onclick="attMatSubmit('${r.id}')">✔ ಸ್ವೀಕರಿಸಿ</button>`}
   <button class="btn btn-outline" style="margin-left:6px" onclick="document.getElementById('attPubBg').classList.remove('show')">ಮುಚ್ಚಿ</button>`;
}
function attMatSubmit(regId){
  const r=attRegs().find(x=>x.id===regId); if(!r) return;
  if(attMats().some(m=>m.regId===regId)){ showToast('ℹ ಈಗಾಗಲೇ ಸ್ವೀಕರಿಸಲಾಗಿದೆ'); return; }
  const v=i=>+document.getElementById(i).value;
  const ts=attNowStr();
  attMats().push({id:uid(),regId,subject:r.subject,hrmsId:r.hrmsId,name:r.name,desig:r.desig||'',mobile:r.mobile,pen:v('atM_pen'),notebook:v('atM_nb'),xerox:v('atM_xr'),date:ts.slice(0,10),signedAt:ts,signedBy:r.name,ts:Date.now()});
  const f=STAFF.find(x=>x.role==='fda'); if(f) pushNotification(f.name,'📦 ತರಬೇತಿ ನೋಂದಣಿ — ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ: '+r.name+' ('+r.subject+')');
  saveDB();
  const bg=attModal('attPubBg');
  bg.innerHTML=`<div class="modal" style="max-width:400px;text-align:center"><div style="font-size:46px;color:#1e8e3e">✔</div><h3 style="margin:4px 0 8px;color:#1e8e3e">ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ದಾಖಲಾಗಿದೆ</h3><div style="font-size:13px">ಡಿಜಿಟಲ್ ಸಹಿ: <b>${esc(r.name)}</b><br>${ts}</div><button class="btn btn-green" style="margin-top:12px;min-width:110px" onclick="document.getElementById('attPubBg').classList.remove('show')">ಸರಿ</button></div>`;
}
function attMatPublicOpen(){
  const bg=attModal('attPubBg');
  bg.innerHTML=`<div class="modal" style="max-width:420px"><h3 style="margin:0 0 6px">📦 ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ</h3><div style="font-size:12px;color:#555;margin-bottom:8px">ನೋಂದಣಿ ಮಾಡಿದ HRMS ID ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.</div>
   <div class="field"><input id="attMQ" style="width:100%" onkeydown="if(event.key==='Enter')attMatFind()"></div><div id="attMR"></div>
   <div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-green" onclick="attMatFind()">ಮುಂದುವರಿಸಿ</button><button class="btn btn-outline" onclick="document.getElementById('attPubBg').classList.remove('show')">ಮುಚ್ಚಿ</button></div></div>`;
  bg.classList.add('show');
}
function attMatFind(){
  const q=document.getElementById('attMQ').value.trim().toLowerCase(), qd=pwDigits(q);
  const rs=attRegs().filter(r=>q&&(r.hrmsId.toLowerCase()===q||(qd.length===10&&r.mobile===qd)));
  if(!rs.length){ document.getElementById('attMR').innerHTML='<div class="verify-card bad">❌ ನೋಂದಣಿ ಕಂಡುಬಂದಿಲ್ಲ. ಮೊದಲು "ತರಬೇತಿಗೆ ನೋಂದಾಯಿಸಿ".</div>'; return; }
  const r=rs.find(x=>!attMats().some(m=>m.regId===x.id))||rs[0];
  attModal('attPubBg').innerHTML=`<div class="modal" style="max-width:420px;text-align:center">${attMatFormHtml(r)}</div>`;
}
/* ---- register sheet (PDF / print / Excel) ---- */
function attMatRows(sub){ return attMats().filter(m=>m.subject===sub).slice().sort((a,b)=>a.ts-b.ts); }
function attMatSheetHtml(sub,rows,signed,dateTxt){
  const N=Math.max(20,Math.ceil(rows.length/20)*20), td='border:1px solid #000;padding:3px 4px;text-align:center;font-size:9.5pt';
  let tr='';
  for(let i=0;i<N;i++){ const m=rows[i];
    tr+=`<tr style="height:25px"><td style="${td}">${i+1}</td><td style="${td};text-align:left">${m?esc(m.name):''}</td><td style="${td}">${m?esc(m.desig):''}</td><td style="${td}">${m?esc(m.mobile):''}</td><td style="${td}">${m?m.pen:''}</td><td style="${td}">${m?m.notebook:''}</td><td style="${td}">${m?(m.xerox?'1 ಸೆಟ್':'0'):''}</td><td style="${td}">${m?esc(m.date):''}</td><td style="${td};font-size:7.5pt;line-height:1.2">${m&&signed?'✔ ಡಿಜಿಟಲ್ ಸಹಿ<br>'+esc(m.signedBy)+'<br>'+esc(m.signedAt):''}</td></tr>`; }
  const th='border:1px solid #000;background:#d9e8f7;padding:3px;font-size:9.5pt;text-align:center';
  return `<div style="font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#000;width:100%">
   <div style="text-align:center;font-weight:700;font-size:13pt">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ</div>
   <div style="text-align:center;font-weight:700;font-size:11pt">ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ ಜಿಲ್ಲೆ – 581320</div>
   <div style="text-align:center;font-size:11pt;margin:8px 0">ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ</div>
   <div style="font-size:10.5pt;margin-bottom:6px">ತರಬೇತಿ ವಿಷಯ: <b>${esc(sub)} ವಿಷಯ</b> &nbsp;&nbsp;&nbsp;&nbsp; ದಿನಾಂಕ: <b>${esc(dateTxt)}</b></div>
   <table style="width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:5.5%"><col style="width:18.5%"><col style="width:12%"><col style="width:12%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:12%"><col style="width:15%"></colgroup>
   <thead><tr><th style="${th}">ಕ್ರ.<br>ಸಂ.</th><th style="${th}">ಶಿಕ್ಷಕರ ಹೆಸರು</th><th style="${th}">ಹುದ್ದೆ</th><th style="${th}">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</th><th style="${th}">ಪೆನ್ನು<br>(1)</th><th style="${th}">ನೋಟ್‌ಬುಕ್<br>(1)</th><th style="${th}">ಜೆರಾಕ್ಸ್ ಪ್ರತಿ<br>(1 ಸೆಟ್)</th><th style="${th}">ಸ್ವೀಕೃತಿ ದಿನಾಂಕ</th><th style="${th}">ಶಿಕ್ಷಕರ ಸಹಿ</th></tr></thead><tbody>${tr}</tbody></table>
   <div style="text-align:right;font-size:10.5pt;margin-top:22px;line-height:2.4">ಸಾಮಗ್ರಿ ವಿತರಿಸಿದವರ ಸಹಿ: ____________________<br>ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ: ____________________</div>
   <div style="margin-top:14px;border-top:1px solid #666;padding-top:5px;font-size:8.5pt;line-height:1.6">ವೆಬ್‌ಸೈಟ್: ${ATT_SITE}<br>ಮುದ್ರಣ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ: ${attNowStr()}${signed?'':' &nbsp;|&nbsp; (ಸಹಿ ಇಲ್ಲದ ಪ್ರತಿ)'}</div></div>`;
}
function attMatDateTxt(){ return attDD(ATT_MDATE||attTDate(ATT_SUB)); }
function attMatPrint(signed){
  const w=window.open('','_blank'); if(!w){ showToast('⚠ Pop-up ಅನುಮತಿಸಿ'); return; }
  w.document.write('<html><head><meta charset="utf-8"><title>ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ</title><style>@page{size:A4 portrait;margin:12mm}body{margin:0}</style></head><body>'+attMatSheetHtml(ATT_SUB,attMatRows(ATT_SUB),signed,attMatDateTxt())+'<script>setTimeout(function(){window.print()},400)<\/script></body></html>');
  w.document.close();
}
function attMatExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const rows=attMatRows(ATT_SUB);
  const aoa=[['ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ ಜಿಲ್ಲೆ – 581320'],['ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ'],['ತರಬೇತಿ ವಿಷಯ: '+ATT_SUB+' ವಿಷಯ','','','','','','ದಿನಾಂಕ: '+attMatDateTxt()],[],
   ['ಕ್ರ.ಸಂ.','ಶಿಕ್ಷಕರ ಹೆಸರು','ಹುದ್ದೆ','ಮೊಬೈಲ್ ಸಂಖ್ಯೆ','ಪೆನ್ನು (1)','ನೋಟ್‌ಬುಕ್ (1)','ಜೆರಾಕ್ಸ್ ಪ್ರತಿ (1 ಸೆಟ್)','ಸ್ವೀಕೃತಿ ದಿನಾಂಕ','ಶಿಕ್ಷಕರ ಸಹಿ (ಡಿಜಿಟಲ್)']];
  rows.forEach((m,i)=>aoa.push([i+1,m.name,m.desig,m.mobile,m.pen,m.notebook,m.xerox?'1 ಸೆಟ್':0,m.date,'ಡಿಜಿಟಲ್ ಸಹಿ: '+m.signedBy+' '+m.signedAt]));
  aoa.push([],['','','','','','','ಸಾಮಗ್ರಿ ವಿತರಿಸಿದವರ ಸಹಿ: __________'],['','','','','','','ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ: __________'],[],['ವೆಬ್‌ಸೈಟ್: '+ATT_SITE+''],['ಮುದ್ರಣ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ: '+attNowStr()]);
  const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!cols']=[{wch:7},{wch:26},{wch:18},{wch:14},{wch:10},{wch:12},{wch:16},{wch:14},{wch:34}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,ATT_SUB); XLSX.writeFile(wb,'Training_Materials_Register_'+(ATT_SUB==='ಕನ್ನಡ'?'Kannada':'Science')+'_'+todayStr()+'.xlsx');
}
function attMatDateSet(v){ ATT_MDATE=v; renderAttCert(); }
function attMatTabHtml(){
  const rows=attMatRows(ATT_SUB), dv=ATT_MDATE||attTDate(ATT_SUB);
  return `<div class="panel"><h3>📦 ತರಬೇತಿ ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ — ${ATT_SUB} ವಿಷಯ</h3>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><label>ದಿನಾಂಕ: <input type="date" value="${dv}" onchange="attMatDateSet(this.value)"></label>
    <button class="gv-b pri" onclick="attMatPrint(true)">🖨 PDF (ಡಿಜಿಟಲ್ ಸಹಿ ಸಹಿತ)</button><button class="gv-b" onclick="attMatPrint(false)">🖨 PDF (ಸಹಿ ಇಲ್ಲದೆ)</button><button class="gv-b ok" onclick="attMatExcel()">📊 Excel</button></div>
   <div class="table-wrap"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಶಿಕ್ಷಕರ ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಮೊಬೈಲ್</th><th>ಪೆನ್ನು</th><th>ನೋಟ್‌ಬುಕ್</th><th>ಜೆರಾಕ್ಸ್</th><th>ಸ್ವೀಕೃತಿ ದಿನಾಂಕ</th><th>ಡಿಜಿಟಲ್ ಸಹಿ</th></tr></thead><tbody>${rows.length?rows.map((m,i)=>`<tr><td>${i+1}</td><td><b>${esc(m.name)}</b></td><td>${esc(m.desig)}</td><td>${esc(m.mobile)}</td><td>${m.pen}</td><td>${m.notebook}</td><td>${m.xerox?'1 ಸೆಟ್':0}</td><td>${esc(m.date)}</td><td><span class="gv-st ok">✔ ${esc(m.signedAt)}</span></td></tr>`).join(''):'<tr><td colspan="9" style="text-align:center">ಇನ್ನೂ ಸ್ವೀಕೃತಿ ಇಲ್ಲ</td></tr>'}</tbody></table></div></div>`;
}

function makeQRCode(containerId, url){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = '';
  try {
    new QRCode(el, {text:url, width:90, height:90, correctLevel:QRCode.CorrectLevel.M});
  } catch(e){
    // Fallback: show URL if QRCode library not available
    el.innerHTML = `<div style="font-size:8px;word-break:break-all;width:90px;border:1px solid #ccc;padding:4px;">${url}</div>`;
  }
}

function getVerifyURL(certNo, type){
  const base = window.location.href.split('?')[0].split('#')[0];
  return base + '?verify=' + certNo + '&type=' + type;
}

function renderMarksVerification(){
  document.getElementById('marksVerifySection').innerHTML=`
    <div class="panel" style="max-width:500px;margin:0 auto;">
      <h3>🎓 ವಿದ್ಯಾರ್ಥಿ ಅಂಕ ತಪಾಸಣೆ (Student Marks Verification)</h3>
      <p style="font-size:12px;color:var(--muted);">ವಿದ್ಯಾರ್ಥಿಯ SATS ಸಂಖ್ಯೆ, ಜನ್ಮ ದಿನಾಂಕ ಮತ್ತು ತರಗತಿ ನಮೂದಿಸಿ ಫಲಿತಾಂಶ ಪರಿಶೀಲಿಸಿ</p>
      <div class="form-grid">
        <div class="field"><label>SATS ಸಂಖ್ಯೆ</label><input id="mv_sats" placeholder="SATS Number"></div>
        <div class="field"><label>ಜನ್ಮ ದಿನಾಂಕ (DOB)</label><input type="date" id="mv_dob"></div>
        <div class="field"><label>ತರಗತಿ (Class)</label>
          <select id="mv_class"><option value="">-- ಆಯ್ಕೆ ಮಾಡಿ --</option>
            ${['6','7','8','9','10'].map(c=>`<option value="${c}">${c}ನೇ ತರಗತಿ</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="verifyStudentMarks()">🔍 ತಪಾಸಣೆ ಮಾಡಿ</button></div>
      <div id="mv_result" style="margin-top:12px;"></div>
    </div>`;
}

function mvDobText(d){ const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?(m[3]+'-'+m[2]+'-'+m[1]):(d||'—'); }

function mvGradeCls(g){ return g==='NC'||g==='AB'?'nc':(g==='A+'||g==='A')?'ap':''; }

function mvOverallGrade(pct){ for(const b of KSEAB_BANDS){ if(pct>=b[1]) return b[0]; } return 'NC'; }

function mvCollectExams(student,recs){
  const byExam={};
  recs.forEach(m=>{
    const e=(m.entries||[]).find(x=>x.studentId===student.id); if(!e) return;
    const lock=(typeof getGradeLock==='function')?getGradeLock(m.className,m.subject,m.examName):null;
    const max=Number(m.maxMarks||(lock&&lock.maxMarks)||0)||null;
    (byExam[m.examName]=byExam[m.examName]||[]).push({
      subject:m.subject, max, marks:Number(e.marks||0), grade:(max&&usesKseabScale(m.examName)&&!(e.absent||e.exempted||e.grade==='AB'||e.grade==='EX'))?calcGradeFromLock(Number(e.marks||0),{grades:kseabGradeScale(max)}):(e.grade||'—'),   // KSEAB exams: always graded by the school's table
      absent:!!e.absent||e.grade==='AB', exempted:!!e.exempted||e.grade==='EX'});
  });
  const order=examNamesForClass(String(student.className));
  const exams=Object.keys(byExam).sort((a,b)=>{ const ia=order.indexOf(a), ib=order.indexOf(b); return (ia<0?999:ia)-(ib<0?999:ib)||a.localeCompare(b); });
  return exams.map(ex=>({exam:ex, rows:byExam[ex].sort((a,b)=>{ const ia=SUBJECTS.indexOf(a.subject), ib=SUBJECTS.indexOf(b.subject); return (ia<0?99:ia)-(ib<0?99:ib); })}));
}

function mvExamSummary(ex){
  const kseab=usesKseabScale(ex.exam);
  let total=0,maxSum=0; const fails=[];
  ex.rows.forEach(r=>{
    const need=r.max?kseabPassMark(r.max):null;               // pass mark in every subject
    if(!r.absent&&!r.exempted&&r.max){ total+=r.marks; maxSum+=r.max; }
    const failed=!r.exempted&&(r.absent||(need!==null?r.marks<need:(r.grade==='NC'||r.grade==='—')));
    r.failed=failed; if(failed&&kseab) fails.push(r.subject);
  });
  const pct=maxSum?total/maxSum*100:null;
  return {kseab,total,maxSum,pct,fails};
}

function mvExamHtml(ex,idx){
  const sm=mvExamSummary(ex);
  const rows=ex.rows.map((r,i)=>{
    const shownMarks=r.absent?'AB':r.exempted?'EX':r.marks;
    const g=r.absent?'AB':r.exempted?'EX':r.grade;
    return `<tr><td>${i+1}</td><td class="l">${esc(r.subject)}</td><td>${r.max??'—'}</td><td><b>${shownMarks}</b></td><td><span class="g ${mvGradeCls(g)}">${esc(g)}</span></td></tr>`;
  }).join('');
  const pctTxt=sm.pct===null?'—':(Math.round(sm.pct*100)/100).toFixed(2)+'%';
  const totRow=`<tr class="tot"><td></td><td class="l">ಒಟ್ಟು (Total)</td><td>${sm.maxSum||'—'}</td><td>${sm.maxSum?sm.total:'—'}</td><td>${sm.kseab&&sm.pct!==null&&!sm.fails.length?`<span class="g ${mvGradeCls(mvOverallGrade(sm.pct))}">${mvOverallGrade(sm.pct)}</span>`:''}</td></tr>`;
  const result=sm.kseab?`<div class="mv-res ${sm.fails.length?'fail':'pass'}">ಶೇಕಡಾ: ${pctTxt} &nbsp;|&nbsp; ಫಲಿತಾಂಶ: ${sm.fails.length?`ಅನುತ್ತೀರ್ಣ (FAIL) — ${sm.fails.map(esc).join(', ')}`:'ಉತ್ತೀರ್ಣ (PASS)'}</div>`
    :`<div class="mv-res" style="background:#f3f6fa;">ಶೇಕಡಾ: ${pctTxt}</div>`;
  return `<div class="mv-exam"><div class="mv-exam-title">${esc(ex.exam)}</div>
    <table class="mv-t"><thead><tr><th style="width:8%">ಕ್ರ.ಸಂ</th><th>ವಿಷಯ (Subject)</th><th style="width:16%">ಗರಿಷ್ಠ ಅಂಕ</th><th style="width:18%">ಗಳಿಸಿದ ಅಂಕ</th><th style="width:14%">ಗ್ರೇಡ್</th></tr></thead>
    <tbody>${rows}${totRow}</tbody></table>${result}</div>`;
}

function mvSSLCCardHtml(student,recs){
  const exams=mvCollectExams(student,recs);
  if(!exams.length) return '';
  const nameEn=student.studentNameEn?` <span style="color:#44566b;">(${esc(student.studentNameEn)})</span>`:'';
  const fatherEn=student.fatherNameEn?` <span style="color:#44566b;">(${esc(student.fatherNameEn)})</span>`:'';
  const legend=kseabLegendText();
  return `<style id="mvCardCss">${MV_CARD_CSS}</style>
  <div class="mvcard" id="mv_card">
    <div class="mv-head"><div class="a">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS) · ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
      <div class="b">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ</div>
      <div class="c">ಅಂಕಗಳ ಪಟ್ಟಿ — 10ನೇ ತರಗತಿ (SSLC) — ${exams.map(e=>esc(e.exam)).join(', ')}</div></div>
    <table class="mv-info"><tbody>
      <tr><td class="k">ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು</td><td><b>${esc(student.studentName)}</b>${nameEn}</td><td class="k">SATS ಸಂಖ್ಯೆ</td><td><b>${esc(student.satsNo||'—')}</b></td></tr>
      <tr><td class="k">ತಂದೆಯ ಹೆಸರು</td><td>${esc(student.fatherName||'—')}${fatherEn}</td><td class="k">ಜನ್ಮ ದಿನಾಂಕ</td><td>${esc(mvDobText(student.dob))}</td></tr>
    </tbody></table>
    ${exams.map(mvExamHtml).join('')}
    <div class="mv-legend"><b>ಗ್ರೇಡ್ ಪದ್ಧತಿ:</b> ${legend}</div>
    <div class="mv-note">* AB = ಗೈರುಹಾಜರು, EX = ವಿನಾಯಿತಿ. ಪ್ರತಿ ವಿಷಯದಲ್ಲಿ ಕನಿಷ್ಠ ${KSEAB_PASS_PCT}% ಅಂಕ ಇದ್ದರೆ ಉತ್ತೀರ್ಣ.</div>
  </div>
  <div style="margin-top:10px;text-align:right;"><button class="btn btn-outline" onclick="mvPrintCard()">🖨 ಮುದ್ರಿಸಿ / PDF</button></div>`;
}

function mvPrintCard(){
  const el=document.getElementById('mv_card'); if(!el) return;
  const w=window.open('','_blank'); if(!w){ showToast('⚠ Pop-up ಅನುಮತಿಸಿ (ಬ್ರೌಸರ್ ತಡೆದಿದೆ)'); return; }
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Marks Statement</title><style>'+MV_CARD_CSS+'@page{size:A4;margin:12mm}body{margin:0;padding:8px;background:#fff;}</style></head><body>'+el.outerHTML+'</body></html>');
  w.document.close(); setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} },400);
}

function verifyStudentMarks(){
  const sats = normSats(document.getElementById('mv_sats').value);
  const dob = document.getElementById('mv_dob').value;
  const cls = document.getElementById('mv_class').value;
  const out = document.getElementById('mv_result');
  if(!sats||!dob||!cls){ showToast('⚠ ಎಲ್ಲಾ ಮಾಹಿತಿ ನಮೂದಿಸಿ'); return; }
  const student = DB.students.find(s=>normSats(s.satsNo)===sats && s.dob===dob && String(s.className)===cls);
  if(!student){
    out.innerHTML=`<div class="note" style="background:var(--red-tint);border-color:var(--red);">❌ ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ಸರಿಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮರು ಪರಿಶೀಲಿಸಿ.</div>`;
    return;
  }
  const marksRecs = DB.marks.filter(m=>String(m.className)===String(student.className) && MV_PUBLISHED.includes(m.status));
  if(!marksRecs.length){
    out.innerHTML=`<div class="note">ℹ ಈ ವಿದ್ಯಾರ್ಥಿಗೆ ಅಂಕಗಳು ಇನ್ನೂ ಪ್ರಕಟಗೊಂಡಿಲ್ಲ.</div>`; return;
  }
  if(String(student.className)==='10'){                    // class 10: full SSLC-style marks statement
    const card=mvSSLCCardHtml(student,marksRecs);
    out.innerHTML=card||`<div class="note">ℹ ಈ ವಿದ್ಯಾರ್ಥಿಗೆ ಅಂಕಗಳು ಇನ್ನೂ ಪ್ರಕಟಗೊಂಡಿಲ್ಲ.</div>`;
    return;
  }
  // other classes: grades only (as before)
  const grades = {};
  marksRecs.forEach(m=>{
    if(!m.entries) return;
    const entry = m.entries.find(e=>e.studentId===student.id);
    if(!entry) return;
    if(!grades[m.subject]) grades[m.subject]={};
    grades[m.subject][m.examName] = entry.grade||'—';
  });
  const rows = Object.entries(grades).map(([sub,exams])=>`
    <tr><td><b>${esc(sub)}</b></td>${Object.entries(exams).map(([ex,g])=>`<td>${esc(ex)}: <b style="color:var(--navy)">${esc(g)}</b></td>`).join('')}</tr>`).join('');
  out.innerHTML=`
    <div style="background:var(--green-tint);border:1px solid var(--green);border-radius:8px;padding:12px;">
      <div style="font-weight:700;margin-bottom:8px;">✅ ${esc(student.studentName)} — ${esc(student.className)}ನೇ ತರಗತಿ</div>
      <table style="width:100%;font-size:12px;"><tbody>${rows}</tbody></table>
      <div style="font-size:10px;color:var(--muted);margin-top:8px;">* Grade ಮಾತ್ರ ತೋರಿಸಲಾಗಿದೆ. ಅಂಕಗಳಿಗಾಗಿ ಶಾಲೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.</div>
    </div>`;
}


/* ---------- v56: government-portal style homepage (banner, ticker, link cards, gallery) ---------- */
var HB_IDX=0, HB_TIMER=null, HB_PAUSED=false, HB_SIG='';
function homeGo(sec){ const tab=Array.from(document.querySelectorAll('.nav-tab')).find(t=>(t.getAttribute('onclick')||'').indexOf("'"+sec+"'")>=0); homeNav(sec,tab); window.scrollTo({top:0,behavior:'smooth'}); }
function homeFocus(id){ const home=Array.from(document.querySelectorAll('.nav-tab'))[0]; homeNav('home',home); setTimeout(()=>{ const el=document.getElementById(id); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); try{ el.focus(); }catch(e){} } },80); }
function homeFont(d){ let n=Number(localStorage.getItem('hfs')||0); n=d===0?0:Math.max(-2,Math.min(3,n+d)); try{ localStorage.setItem('hfs',n); }catch(e){} document.getElementById('loginScreen').style.fontSize=(14.5+n*1.5)+'px'; }
function homeTheme(){ const r=document.documentElement; const dark=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches); r.setAttribute('data-theme',dark?'light':'dark'); }
function hbSlides(){
  const g=(DB&&DB.downloads||[]).filter(f=>!f.deleted&&f.category==='gallery'&&f.fileData).slice(-6).reverse().map(f=>({src:f.fileData,t:f.title||''}));
  if(g.length) return g;
  const bg=document.getElementById('schoolBgPhoto'); return (bg&&bg.getAttribute('src'))?[{src:bg.getAttribute('src'),t:''}]:[];
}
function hbRender(){
  const tr=document.getElementById('hbTrack'), dots=document.getElementById('hbDots'); if(!tr) return;
  const sl=hbSlides(); HB_IDX=0;
  tr.innerHTML=sl.map((x,i)=>`<div class="hb-slide ${i===0?'on':''}"><img src="${x.src}" alt="${esc(x.t)}"></div>`).join('')||'<div class="hb-slide on hb-none"></div>';
  dots.innerHTML=sl.length>1?sl.map((x,i)=>`<i class="${i===0?'on':''}" onclick="hbGo(${i})"></i>`).join(''):'';
  document.querySelectorAll('#hBanner .hb-arrow,#hbPause').forEach(b=>b.style.display=sl.length>1?'':'none');
  hbStart();
}
function hbGo(i){ const s=document.querySelectorAll('#hbTrack .hb-slide'), d=document.querySelectorAll('#hbDots i'); if(!s.length) return; HB_IDX=(i+s.length)%s.length; s.forEach((x,k)=>x.classList.toggle('on',k===HB_IDX)); d.forEach((x,k)=>x.classList.toggle('on',k===HB_IDX)); }
function hbMove(n){ hbGo(HB_IDX+n); }
function hbStart(){ clearInterval(HB_TIMER); if(!HB_PAUSED) HB_TIMER=setInterval(()=>{ if(document.getElementById('hbTrack')) hbMove(1); },5000); }
function hbToggle(){ HB_PAUSED=!HB_PAUSED; document.getElementById('hbPause').textContent=HB_PAUSED?'▶':'❚❚'; hbStart(); }
function homeDynamic(force){
  const dl=(DB&&DB.downloads||[]).filter(f=>!f.deleted);
  const sig=dl.map(f=>f.id+(f.category||'')).join(',');
  if(!force&&sig===HB_SIG) return; HB_SIG=sig;
  hbRender();
  const notices=dl.filter(f=>f.category==='notices').slice(-5).reverse();
  const mv=document.getElementById('htMove');
  if(mv&&notices.length) mv.innerHTML=notices.map(f=>'📌 '+esc(f.title)+(f.uploadedAt?' ('+fmtDate(f.uploadedAt)+')':'')).join(' &nbsp;&nbsp;•&nbsp;&nbsp; ');
  const docs=dl.filter(f=>f.category==='downloads'||f.category==='notices').slice(-6).reverse();
  const ul=document.getElementById('hcDocs');
  if(ul) ul.innerHTML=docs.length?docs.map(f=>`<li onclick="downloadUploadedFile('${f.id}')">${esc(f.title)}</li>`).join(''):'<li class="hc-empty" onclick="homeGo(\'downloads\')">ಯಾವ ಫೈಲ್ ಇಲ್ಲ — Downloads ನೋಡಿ</li>';
  const imgs=dl.filter(f=>f.category==='gallery'&&f.fileData).slice(-6).reverse();
  const gs=document.getElementById('hGallerySec'), gl=document.getElementById('hGal');
  if(gs&&gl){ gs.style.display=imgs.length?'':'none'; gl.innerHTML=imgs.map(f=>`<figure><img class="gal-img" src="${f.fileData}" alt="${esc(f.title||'')}"><figcaption>${esc(f.title||'')}</figcaption></figure>`).join(''); }
}
(function(){ try{ const n=Number(localStorage.getItem('hfs')||0); if(n){ const ls=document.getElementById('loginScreen'); if(ls) ls.style.fontSize=(14.5+n*1.5)+'px'; } }catch(e){}
  const tick=()=>{ try{ if(document.getElementById('hbTrack')&&typeof DB!=='undefined'&&DB) homeDynamic(false); }catch(e){} };
  setTimeout(tick,600); setTimeout(tick,3000); setInterval(tick,8000); })();


/* ---------- Photo gallery lightbox: click a photo to enlarge (prev/next, keyboard, swipe) ---------- */
(function(){
  var list=[], idx=0, box=null, startX=null;
  function build(){
    if(box) return;
    box=document.createElement('div'); box.id='galLb';
    box.innerHTML='<button class="lb-x" aria-label="Close">&times;</button><button class="lb-p" aria-label="Previous">&#8249;</button><img class="lb-img" alt=""><div class="lb-cap"></div><div class="lb-cnt"></div><button class="lb-n" aria-label="Next">&#8250;</button>';
    document.body.appendChild(box);
    box.addEventListener('click',function(e){
      if(e.target===box||e.target.classList.contains('lb-x')) close();
      else if(e.target.classList.contains('lb-p')) step(-1);
      else if(e.target.classList.contains('lb-n')) step(1);
      else if(e.target.classList.contains('lb-img')) e.target.classList.toggle('zoomed');
    });
    box.addEventListener('touchstart',function(e){ startX=e.touches[0].clientX; },{passive:true});
    box.addEventListener('touchend',function(e){
      if(startX===null) return;
      var dx=e.changedTouches[0].clientX-startX; startX=null;
      if(Math.abs(dx)>50) step(dx<0?1:-1);
    });
  }
  function show(){
    var it=list[idx], im=box.querySelector('.lb-img');
    im.classList.remove('zoomed'); im.src=it.src; im.alt=it.t;
    box.querySelector('.lb-cap').textContent=it.t||'';
    box.querySelector('.lb-cnt').textContent=(idx+1)+' / '+list.length;
    var multi=list.length>1;
    box.querySelector('.lb-p').style.display=multi?'':'none';
    box.querySelector('.lb-n').style.display=multi?'':'none';
  }
  function step(d){ idx=(idx+d+list.length)%list.length; show(); }
  function close(){ if(box){ box.classList.remove('open'); box.querySelector('.lb-img').src=''; } document.body.style.overflow=''; }
  window.openGalleryLightbox=function(img){
    build();
    var wrap=img.closest('.hgal,.gal-grid')||document;
    var imgs=[].slice.call(wrap.querySelectorAll('img.gal-img'));
    list=imgs.map(function(i){ return {src:i.src,t:i.alt||''}; });
    idx=Math.max(0,imgs.indexOf(img));
    box.classList.add('open'); document.body.style.overflow='hidden';
    show();
  };
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t&&t.tagName==='IMG'&&t.classList.contains('gal-img')){ e.preventDefault(); window.openGalleryLightbox(t); }
  });
  document.addEventListener('keydown',function(e){
    if(!box||!box.classList.contains('open')) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') step(-1);
    else if(e.key==='ArrowRight') step(1);
  });
})();

var HLANG_D=[["⏭ ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ", "⏭ Skip to main content"], ["🔑 ಸ್ಟಾಫ್ ಲಾಗಿನ್", "🔑 Staff Login"], ["🔍 ದಾಖಲೆ ಪರಿಶೀಲನೆ", "🔍 Verify Document"], ["📞 ಸಂಪರ್ಕ", "📞 Contact"], ["ಶ್ರೀ ಡಿ.ಕೆ. ಶಿವಕುಮಾರ್", "Sri D.K. Shivakumar"], ["ಮಾನ್ಯ ಮುಖ್ಯಮಂತ್ರಿ | ಕರ್ನಾಟಕ ಸರ್ಕಾರ", "Hon'ble Chief Minister | Government of Karnataka"], ["ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ", "Backward Classes Welfare Department"], ["ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ", "Karnataka Residential Educational Institutions Society (KREIS)"], ["ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)", "Morarji Desai Residential School (BC-265)"], ["ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320", "Shedabari, Heble, Bhatkal, Uttara Kannada – 581320"], ["ಶ್ರೀ ಶಿವರಾಜ ತಂಗಡಗಿ", "Sri Shivaraj Tangadagi"], ["ಮಾನ್ಯ ಸಚಿವರು | ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ", "Hon'ble Minister | Backward Classes Welfare Department"], ["🏠 ಮುಖಪುಟ", "🏠 Home"], ["🏛 ನಮ್ಮ ಬಗ್ಗೆ", "🏛 About Us"], ["📖 ಶೈಕ್ಷಣಿಕ", "📖 Academics"], ["🏢 ಸೌಲಭ್ಯಗಳು", "🏢 Facilities"], ["🖼 ಗ್ಯಾಲರಿ", "🖼 Gallery"], ["⬇ ಡೌನ್‌ಲೋಡ್‌ಗಳು", "⬇ Downloads"], ["🎓 ಅಂಕ ಪರಿಶೀಲನೆ", "🎓 Marks Verify"], ["📞 ಸಂಪರ್ಕಿಸಿ", "📞 Contact Us"], ["ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ", "Morarji Desai Residential School, Shedabari"], ["ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)", "Karnataka Residential Educational Institutions Society (KREIS)"], ["📢 ಸುದ್ದಿ ಮತ್ತು ಸೂಚನೆಗಳು", "📢 News & Notices"], ["ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ ಇ-ಕಚೇರಿ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ", "Welcome to the e-Office Portal of Morarji Desai Residential School, Shedabari, Bhatkal"], ["ಮತ್ತಷ್ಟು ಓದಿ ›", "Read more ›"], ["ಪ್ರವೇಶ", "ACCESS"], ["ಸ್ಟಾಫ್ ಲಾಗಿನ್ ಮತ್ತು ದಾಖಲೆ ಪರಿಶೀಲನೆ", "Staff Login & Document Verification"], ["🔒 ಸ್ಟಾಫ್ ಲಾಗಿನ್ (Staff Login)", "🔒 Staff Login"], ["ಪ್ರಾಂಶುಪಾಲರು, FDA, ವಾರ್ಡನ್ ಹಾಗೂ ಶಿಕ್ಷಕರು ತಮ್ಮ ಅಧಿಕೃತ ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಲಾಗಿನ್ ಆಗಿ.", "Principal, FDA, Warden and teachers: log in with your official user ID and password."], ["ಬಳಕೆದಾರ ID / HRMS ID", "User ID / HRMS ID"], ["ಪಾಸ್‌ವರ್ಡ್", "Password"], ["ಲಾಗಿನ್ ಮಾಡಿ (Login) →", "Login →"], ["ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರುವಿರಾ?", "Forgot Password?"], ["📋 ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ (Document Verification)", "📋 Document Verification"], ["ಪ್ರಮಾಣ ಪತ್ರದಲ್ಲಿರುವ", "Scan the"], ["ಅಥವಾ", "or"], ["ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಅಥವಾ", "on the certificate, or enter the"], ["ಪ್ರಮಾಣ ಪತ್ರ / Barcode ಸಂಖ್ಯೆ", "Certificate / Barcode number"], ["ನಮೂದಿಸಿ — ಪ್ರಮಾಣ ಪತ್ರ ಮಾನ್ಯವಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ. (SATS / Application No ನಿಂದ ಪತ್ರ ರವಾನೆ ಸ್ಥಿತಿಯನ್ನೂ ನೋಡಬಹುದು.)", "— to check whether the certificate is valid. (Letter dispatch status can also be checked with SATS / Application No.)"], ["ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ / Barcode ಸಂಖ್ಯೆ / SATS / Application No", "Certificate No / Barcode No / SATS / Application No"], ["🔍 ಪರಿಶೀಲಿಸಿ (Verify)", "🔍 Verify"], ["📷 QR / Barcode ಸ್ಕ್ಯಾನ್", "📷 Scan QR / Barcode"], ["ಸಂಪನ್ಮೂಲಗಳು", "RESOURCES"], ["ದಾಖಲೆಗಳು ಮತ್ತು ಪ್ರಮುಖ ಲಿಂಕ್‌ಗಳು", "Documents & Important Links"], ["ಪರಿಚಯ", "Introduction"], ["ಶಾಲೆಯ ಬಗ್ಗೆ (About Us)", "About the School"], ["ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ (Academics)", "Academic Information"], ["ಸೌಲಭ್ಯಗಳು (Facilities)", "Facilities"], ["ಫೋಟೋ ಗ್ಯಾಲರಿ", "Photo Gallery"], ["ಸೇವೆಗಳು", "Services"], ["ಪ್ರಮಾಣ ಪತ್ರ ಪರಿಶೀಲನೆ", "Certificate Verification"], ["ಅಂಕಗಳ ಪರಿಶೀಲನೆ (Marks Verify)", "Marks Verification"], ["ಸೂಚನೆ / ಸುತ್ತೋಲೆಗಳು", "Notices / Circulars"], ["ಪತ್ರ / ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", "Submit Letter / Application"], ["ಆನ್‌ಲೈನ್ ಸೇವೆಗಳು", "Online Services"], ["ಇ-ಕಚೇರಿ ಸ್ಟಾಫ್ ಲಾಗಿನ್", "e-Office Staff Login"], ["QR / Barcode ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", "Scan QR / Barcode"], ["ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಪರಿಶೀಲಿಸಿ", "Enter Number & Verify"], ["ಸಂಪರ್ಕ ಮತ್ತು ವಿಚಾರಣೆ", "Contact & Enquiry"], ["ಶಾಲಾ ದಾಖಲೆಗಳು", "School Documents"], ["ಯಾವ ಫೈಲ್ ಇಲ್ಲ", "No files yet"], ["ಯಾವ ಫೈಲ್ ಇಲ್ಲ — Downloads ನೋಡಿ", "No files yet — see Downloads"], ["ಚಿತ್ರಗಳು", "PHOTOS"], ["ಗ್ಯಾಲರಿ", "Gallery"], ["ಎಲ್ಲವನ್ನು ವೀಕ್ಷಿಸಿ ›", "View all ›"], ["📸 ಫೋಟೋ ಗ್ಯಾಲರಿ", "📸 Photo Gallery"], ["📚 ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ", "📚 Academic Information"], ["🏫 ಸೌಲಭ್ಯಗಳು", "🏫 Facilities"], ["ಈ ವಿಭಾಗಕ್ಕೆ ಇನ್ನೂ ಮಾಹಿತಿ ಸೇರಿಸಲಾಗಿಲ್ಲ.", "No information has been added to this section yet."], ["ಈ ವಿಭಾಗಕ್ಕೆ ಮಾಹಿತಿ ಶೀಘ್ರದಲ್ಲೇ ಸೇರಿಸಲಾಗುವುದು.", "Information will be added to this section soon."], ["ಯಾವ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.", "No photos uploaded yet."], ["ಈ ವಿಭಾಗಕ್ಕೆ ಯಾವ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.", "No files uploaded to this section yet."], ["ಯಾವ ಸೂಚನೆ ಇಲ್ಲ.", "No notices."], ["📢 ಸೂಚನೆ / ಸುತ್ತೋಲೆಗಳು (Notices & Circulars)", "📢 Notices & Circulars"], ["ಶೀರ್ಷಿಕೆ", "Title"], ["ವಿಭಾಗ", "Category"], ["ದಿನಾಂಕ", "Date"]];
var HLANG_PH=[["ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಅಥವಾ Barcode ಸ್ಕ್ಯಾನ್ ಮಾಡಿ", "Enter number or scan barcode"]];
var HLANG=(function(){ try{ return localStorage.getItem('hlang')||'kn'; }catch(e){ return 'kn'; } })();
function hlNorm(s){ return String(s||'').replace(/[‌‍]/g,'').replace(/\s+/g,' ').trim(); }
var HLANG_MAP=null;
function hlBuild(){ HLANG_MAP={kn:{},en:{}}; HLANG_D.forEach(([k,e])=>{ HLANG_MAP.en[hlNorm(k)]=e; HLANG_MAP.kn[hlNorm(e)]=k; }); }
function homeApplyLang(){
  if(!HLANG_MAP) hlBuild();
  const map=HLANG_MAP[HLANG==='en'?'en':'kn'];
  ['loginScreen','contactModalBg'].forEach(id=>{
    const root=document.getElementById(id); if(!root) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null); const nodes=[]; let n;
    while((n=w.nextNode())){ const p=n.parentNode&&n.parentNode.nodeName; if(p==='SCRIPT'||p==='STYLE') continue; nodes.push(n); }
    nodes.forEach(t=>{ const raw=t.nodeValue, key=hlNorm(raw); if(!key) return; const to=map[key]; if(to!==undefined&&to!==key){ const lead=raw.match(/^\s*/)[0], trail=raw.match(/\s*$/)[0]; t.nodeValue=lead+to+trail; } });
    root.querySelectorAll('[placeholder]').forEach(el=>{ const k=hlNorm(el.getAttribute('placeholder')); HLANG_PH.forEach(([kn,en])=>{ if(HLANG==='en'&&k===hlNorm(kn)) el.setAttribute('placeholder',en); else if(HLANG!=='en'&&k===hlNorm(en)) el.setAttribute('placeholder',kn); }); });
  });
  const b=document.getElementById('langBtn'); if(b) b.textContent=HLANG==='en'?'🌐 ಕನ್ನಡ':'🌐 English';
  document.documentElement.setAttribute('lang',HLANG==='en'?'en':'kn');
}
function homeLang(){ HLANG=HLANG==='en'?'kn':'en'; try{ localStorage.setItem('hlang',HLANG); }catch(e){} homeApplyLang(); }
(function(){
  const _nav=homeNav; homeNav=function(){ _nav.apply(this,arguments); homeApplyLang(); };
  const _dyn=homeDynamic; homeDynamic=function(){ _dyn.apply(this,arguments); homeApplyLang(); };
  const _open=openContactModal; openContactModal=function(){ _open.apply(this,arguments); homeApplyLang(); };
  const go=()=>homeApplyLang(); if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else setTimeout(go,0); setTimeout(go,800);
})();




;(window.__LOADED=window.__LOADED||[]).push('training-materials');
