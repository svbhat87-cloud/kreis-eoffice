/* =====================================================================
   KREIS e-Office — alumni.js
   ಹಳೆ ವಿದ್ಯಾರ್ಥಿಗಳ ನೋಂದಣಿ (Alumni Registration — public form)
   ===================================================================== */

function openAlumniNewTab(){
  const base=location.href.split('#')[0];
  window.open(base+'#alumni','_blank','noopener');
}

function alumniResetForm(){
  ['al_name','al_father','al_mother','al_gender','al_dob','al_aadhar','al_sats','al_admyear','al_passyear',
   'al_sslcno','al_sslcpct','al_classteacher','al_address','al_mobile','al_whatsapp','al_email',
   'al_qualification','al_college','al_course','al_gradyear','al_status','al_designation','al_orgname',
   'al_worklocation','al_assoc','al_event','al_suggestion','al_place'
  ].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
  const err=document.getElementById('alumniErr'); if(err) err.textContent='';
  alumniStatusChange();
}

function alumniStatusChange(){
  const status=document.getElementById('al_status').value;
  const isStudent=(status==='ವಿದ್ಯಾರ್ಥಿ');
  ['al_designation','al_orgname','al_worklocation'].forEach(id=>{
    const e=document.getElementById(id);
    if(!e) return;
    e.disabled=isStudent;
    if(isStudent) e.value='';
  });
}

function alumniValidate(){
  const g=id=>document.getElementById(id).value.trim();
  const req=[
    ['al_name','ಹಳೆ ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು'],['al_father','ತಂದೆಯ ಹೆಸರು'],['al_mother','ತಾಯಿಯ ಹೆಸರು'],
    ['al_gender','ಲಿಂಗ'],['al_dob','ಜನ್ಮ ದಿನಾಂಕ'],['al_admyear','ಶಾಲೆಗೆ ದಾಖಲಾದ ವರ್ಷ'],
    ['al_passyear','10ನೇ ತರಗತಿ ಉತ್ತೀರ್ಣರಾದ ವರ್ಷ'],['al_sslcno','SSLC ನೋಂದಣಿ ಸಂಖ್ಯೆ'],['al_sslcpct','SSLC ಅಂಕಗಳ ಶೇಕಡಾವಾರು / ಗ್ರೇಡ್'],
    ['al_address','ಪ್ರಸ್ತುತ ವಾಸದ ವಿಳಾಸ'],['al_mobile','ಮೊಬೈಲ್ ಸಂಖ್ಯೆ'],['al_status','ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ'],
    ['al_assoc','ಹಳೆ ವಿದ್ಯಾರ್ಥಿಗಳ ಸಂಘದ ಸದಸ್ಯತ್ವ'],['al_event','ಕಾರ್ಯಕ್ರಮ ಭಾಗವಹಿಸುವಿಕೆ'],['al_place','ಸ್ಥಳ']
  ];
  for(const [id,label] of req){ if(!g(id)) return 'ದಯವಿಟ್ಟು "'+label+'" ನಮೂದಿಸಿ.'; }
  if(!/^\d{10}$/.test(g('al_mobile'))) return 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿ ಇರಬೇಕು.';
  if(g('al_whatsapp') && !/^\d{10}$/.test(g('al_whatsapp'))) return 'ವಾಟ್ಸಾಪ್ ಸಂಖ್ಯೆ 10 ಅಂಕಿ ಇರಬೇಕು.';
  if(g('al_aadhar') && !/^\d{12}$/.test(g('al_aadhar'))) return 'ಆಧಾರ್ ಸಂಖ್ಯೆ 12 ಅಂಕಿ ಇರಬೇಕು (ಅಥವಾ ಖಾಲಿ ಬಿಡಿ).';
  const status=g('al_status');
  if(status!=='ವಿದ್ಯಾರ್ಥಿ'){
    if(!g('al_designation')) return 'ದಯವಿಟ್ಟು "ಹುದ್ದೆ / ಉದ್ಯೋಗದ ಹೆಸರು" ನಮೂದಿಸಿ.';
    if(!g('al_orgname')) return 'ದಯವಿಟ್ಟು "ಸಂಸ್ಥೆ / ಕಚೇರಿಯ ಹೆಸರು" ನಮೂದಿಸಿ.';
  }
  return '';
}

function alumniCollect(){
  const g=id=>document.getElementById(id).value.trim();
  return {
    name:g('al_name'), father:g('al_father'), mother:g('al_mother'), gender:g('al_gender'), dob:g('al_dob'), aadhar:g('al_aadhar'),
    sats:g('al_sats'), admyear:g('al_admyear'), passyear:g('al_passyear'), sslcno:g('al_sslcno'), sslcpct:g('al_sslcpct'), classteacher:g('al_classteacher'),
    address:g('al_address'), mobile:g('al_mobile'), whatsapp:g('al_whatsapp')||g('al_mobile'), email:g('al_email'),
    qualification:g('al_qualification'), college:g('al_college'), course:g('al_course'), gradyear:g('al_gradyear'),
    status:g('al_status'), designation:g('al_designation'), orgname:g('al_orgname'), worklocation:g('al_worklocation'),
    assoc:g('al_assoc'), event:g('al_event'), suggestion:g('al_suggestion'), place:g('al_place')
  };
}

function alumniPreviewRow(label,val){
  return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px;">'
    +'<span class="small-muted">'+esc(label)+'</span><b style="text-align:right;">'+(esc(val)||'—')+'</b></div>';
}

function alumniPreview(){
  const err=alumniValidate();
  const errEl=document.getElementById('alumniErr');
  if(err){ errEl.textContent=err; showToast('⚠ '+err); return; }
  errEl.textContent='';
  const d=alumniCollect();
  let html='<h4 style="margin:6px 0 10px;">👁 ಪರಿಶೀಲಿಸಿ — ಸಲ್ಲಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ:</h4>';
  html+=alumniPreviewRow('ಹೆಸರು',d.name)+alumniPreviewRow('ತಂದೆಯ ಹೆಸರು',d.father)+alumniPreviewRow('ತಾಯಿಯ ಹೆಸರು',d.mother);
  html+=alumniPreviewRow('ಲಿಂಗ',d.gender)+alumniPreviewRow('ಜನ್ಮ ದಿನಾಂಕ',fmtDate?fmtDate(d.dob):d.dob)+alumniPreviewRow('ಆಧಾರ್ ಸಂಖ್ಯೆ',d.aadhar);
  html+=alumniPreviewRow('SATS ಸಂಖ್ಯೆ',d.sats)+alumniPreviewRow('ದಾಖಲಾದ ವರ್ಷ',d.admyear)+alumniPreviewRow('10ನೇ ಉತ್ತೀರ್ಣ ವರ್ಷ',d.passyear);
  html+=alumniPreviewRow('SSLC ನೋಂದಣಿ ಸಂಖ್ಯೆ',d.sslcno)+alumniPreviewRow('SSLC %/ಗ್ರೇಡ್',d.sslcpct)+alumniPreviewRow('ತರಗತಿ ಶಿಕ್ಷಕರು',d.classteacher);
  html+=alumniPreviewRow('ವಿಳಾಸ',d.address)+alumniPreviewRow('ಮೊಬೈಲ್',d.mobile)+alumniPreviewRow('ವಾಟ್ಸಾಪ್',d.whatsapp)+alumniPreviewRow('ಇ-ಮೇಲ್',d.email);
  html+=alumniPreviewRow('ಪ್ರಸ್ತುತ ವಿದ್ಯಾರ್ಹತೆ',d.qualification)+alumniPreviewRow('ಕಾಲೇಜು/ಸಂಸ್ಥೆ',d.college)+alumniPreviewRow('ಕೋರ್ಸ್/ಪದವಿ',d.course)+alumniPreviewRow('ಪದವಿ ಪೂರ್ಣ ವರ್ಷ',d.gradyear);
  html+=alumniPreviewRow('ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ',d.status);
  if(d.status!=='ವಿದ್ಯಾರ್ಥಿ'){ html+=alumniPreviewRow('ಹುದ್ದೆ',d.designation)+alumniPreviewRow('ಸಂಸ್ಥೆ',d.orgname)+alumniPreviewRow('ಕಾರ್ಯಸ್ಥಳ',d.worklocation); }
  html+=alumniPreviewRow('ಸಂಘದ ಸದಸ್ಯತ್ವ ಆಸಕ್ತಿ',d.assoc)+alumniPreviewRow('ಕಾರ್ಯಕ್ರಮ ಭಾಗವಹಿಸುವಿಕೆ',d.event);
  if(d.suggestion) html+=alumniPreviewRow('ಸಲಹೆ',d.suggestion);
  html+=alumniPreviewRow('ಸ್ಥಳ',d.place)+alumniPreviewRow('ದಿನಾಂಕ',fmtDate?fmtDate(todayStr()):todayStr());
  document.getElementById('alumniPreviewContent').innerHTML=html;
  document.getElementById('alumniFormView').style.display='none';
  document.getElementById('alumniPreviewView').style.display='';
}

function alumniBackToForm(){
  document.getElementById('alumniFormView').style.display='';
  document.getElementById('alumniPreviewView').style.display='none';
}

function alumniFinalSubmit(){
  const d=alumniCollect();
  const appNo=String(nextSeq('alumni')).padStart(4,'0');
  DB.alumni.push(Object.assign({id:uid(), appNo, submittedAt:todayStr(), submittedTs:Date.now()}, d));
  saveDB();
  document.getElementById('alumniFormView').style.display='none';
  document.getElementById('alumniPreviewView').style.display='none';
  document.getElementById('alumniDoneAppNo').textContent=appNo;
  document.getElementById('alumniDoneView').style.display='';
}

function alumniBackToNewForm(){
  alumniResetForm();
  document.getElementById('alumniDoneView').style.display='none';
  document.getElementById('alumniFormView').style.display='';
  document.getElementById('alumniPreviewView').style.display='none';
}

;(window.__LOADED=window.__LOADED||[]).push('alumni');
