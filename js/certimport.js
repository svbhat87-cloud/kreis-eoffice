/* =====================================================================
   KREIS e-Office v45 — certimport.js
   ಪ್ರಮಾಣ ಪತ್ರ Excel Import (FDA) ಮತ್ತು ಸಾರ್ವಜನಿಕ ಪರಿಶೀಲನೆ (QR / Barcode / ಸಂಖ್ಯೆ)

   Offline software  --(Excel: ALL printed fields)-->  FDA login "ಪ್ರಮಾಣ ಪತ್ರ Excel Import"
   -->  Home page: scan QR / scan barcode / type certificate or barcode number  -->  full details

   Excel format (sheet "Certificates", one row per certificate):
     CertificateType | CertificateNo | BarcodeNo | QRData | VerificationURL | IssueStatus | IssueDate | <every other printed field, one column each>
   Optional sheet "Fields" (long format):  CertificateNo | Order | Field | Value
   Certificates of different types may have different columns; empty cells are ignored.
   ===================================================================== */
function certNorm(s){ return String(s==null?'':s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu,''); }
const CERT_ALIASES={
  type:['certificatetype','certtype','type','doctype','documenttype','ಪ್ರಮಾಣಪತ್ರಪ್ರಕಾರ','ಪ್ರಕಾರ'],
  no:['certificateno','certificatenumber','certno','certnumber','certificateid','ಪ್ರಮಾಣಪತ್ರಸಂಖ್ಯೆ','ಪ್ರಮಾಣಪತ್ರಸಂ'],
  barcode:['barcodeno','barcodenumber','barcode','barcodedata','ಬಾರ್ಕೋಡ್ಸಂಖ್ಯೆ'],
  qr:['qrdata','qrcodedata','qrcode','qrtext'],
  url:['verificationurl','verifyurl','verificationlink','url'],
  status:['issuestatus','certificatestatus','status','ಸ್ಥಿತಿ'],
  issue:['issuedate','dateofissue','issueddate','dateissued','ವಿತರಣಾದಿನಾಂಕ'],
  name:['studentname','nameofthestudent','nameofstudent','name','ವಿದ್ಯಾರ್ಥಿಹೆಸರು','ವಿದ್ಯಾರ್ಥಿಯಹೆಸರು'],
  sats:['satsno','satsnumber','sats','satsid','studentsatsno'],
  adm:['admissionno','admissionnumber','admno','ದಾಖಲಾತಿಸಂಖ್ಯೆ','ದಾಖಲಾತಿಸಂ'],
  cls:['class','classstudying','lastclass','classatleaving','standard','ತರಗತಿ']
};
const CERT_FLD_ALIASES={no:CERT_ALIASES.no,field:['field','fieldname','label','particulars','item','ವಿವರ'],value:['value','data','details','ಮೌಲ್ಯ'],order:['order','sno','slno','seq','sequence']};
function certRole(h,map){ const n=certNorm(h); if(!n) return ''; for(const r in (map||CERT_ALIASES)) if((map||CERT_ALIASES)[r].includes(n)) return r; return ''; }
function certIsCancelled(st){ const s=String(st||'').toLowerCase(); return /cancel|revok|invalid|duplicate\s*issued|ರದ್ದು/.test(s); }
function certCell(v){ return String(v==null?'':v).replace(/\s+/g,' ').trim(); }

/* ------------------------------------------------------------------ parsing (rows = array of arrays) */

/* ---- MDRS-CERT-EXPORT-1 (offline software's own export): sheet "Certificates", one row per printed copy ---- */
function certIsMDRS(head){ const h=head.map(x=>String(x||'').trim().toLowerCase()); return h.includes('fields_json')||h.includes('record_key')||(h.includes('barcode_text')&&h.includes('cert_type')); }
function certParseMDRS(rows){
  const out={certs:[],errors:[],warnings:[]};
  const H=rows[0].map(x=>String(x==null?'':x).trim().toLowerCase());
  const ix=n=>H.indexOf(n);
  if(ix('barcode_text')<0&&ix('serial_no')<0){ out.errors.push('"barcode_text" / "serial_no" ಕಾಲಂ ಕಂಡುಬಂದಿಲ್ಲ.'); return out; }
  const by={}, order=[];
  rows.slice(1).forEach((r,ri)=>{
    const g=n=>{ const i=ix(n); return i>=0?certCell(r[i]):''; }; const gn=n=>{ const v=g(n); return v==='None'?'':v; };
    const type=gn('cert_type'), serial=gn('serial_no');
    const barcode=gn('barcode_text')||((type&&serial)?type+'-'+serial:'');
    if(!barcode){ out.errors.push('ಸಾಲು '+(ri+2)+': barcode_text ಖಾಲಿ — ಬಿಟ್ಟಿದೆ'); return; }
    let fl=[]; try{ fl=JSON.parse(String(r[ix('fields_json')]||'[]')); }catch(e){ out.warnings.push('ಸಾಲು '+(ri+2)+': fields_json ಓದಲಾಗಲಿಲ್ಲ'); }
    const copy={no:Number(g('copy_no'))||1,label:gn('copy_label'),status:gn('status')||'Issued',cancelReason:gn('cancel_reason'),printedText:String(r[ix('printed_text')]||''),fl,
      typeKn:gn('cert_type_kn'),typeEn:gn('cert_type_en'),issueDate:gn('issue_date'),row:r,g:gn};
    const k=certNorm(barcode);
    if(!by[k]){ by[k]={barcode,type,serial,copies:[]}; order.push(k); }
    by[k].copies.push(copy);
  });
  order.forEach(k=>{
    const b=by[k]; b.copies.sort((x,y)=>x.no-y.no);
    const first=b.copies[0], last=b.copies[b.copies.length-1], gn=first.g;
    const cancelled=b.copies.some(c=>certIsCancelled(c.status));
    const status=cancelled?'Cancelled':'Issued';
    const typeName=[first.typeKn,first.typeEn].filter(Boolean).join(' / ')||b.type;
    const nameKn=gn('student_name_kn'), nameEn=gn('student_name_en');
    const fields=[]; const add=(kk,v,key)=>{ if(v!==undefined&&v!==null&&String(v).trim()!==''&&String(v)!=='None') fields.push({k:kk,v:String(v),key:!!key}); };
    add('ಪ್ರಮಾಣ ಪತ್ರ ಪ್ರಕಾರ / Type',typeName,1);
    add('ಸ್ಥಿತಿ / Status',cancelled?('ರದ್ದು (Cancelled)'+(first.cancelReason?' — '+first.cancelReason:'')):'ಮಾನ್ಯ (Issued)',1);
    add('ಶೈಕ್ಷಣಿಕ ವರ್ಷ / Academic year',gn('academic_year'),1);
    add('ವಿತರಣಾ ದಿನಾಂಕ / Issue date',gn('issue_date'),1);
    (first.fl||[]).forEach(f=>{ const lab=[f.label_kn,f.label_en].filter(x=>x&&String(x).trim()).filter((x,i,a)=>a.indexOf(x)===i).join(' / ')||('Field '+f.no); add(lab,f.value,/name|ಹೆಸರು|class|ತರಗತಿ|admission|ಪ್ರವೇಶ|sats|dob|birth|ಜನ್ಮ/i.test(lab)); });
    add('ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು (ಕನ್ನಡ)',nameKn,1); add('Student name (English)',nameEn,1);
    add('ಪ್ರವೇಶ ಸಂಖ್ಯೆ / Admission No',gn('admission_no'),1); add('SATS No',gn('sats_no'),1); add('PEN No',gn('pen_no'));
    add('ಜನ್ಮ ದಿನಾಂಕ / DOB',gn('dob'),1); add('ತರಗತಿ / Class',gn('class'),1); add('ಪೋಷಕರು / Parent',gn('parent'));
    ['school_gov','school_dept','school_name','school_address','school_phone','school_email'].forEach(n=>add('ಶಾಲೆ',gn(n)));
    add('DISE No',gn('school_dise')); add('ಸಹಿ ಮಾಡಿದವರು / Signatory',[gn('signatory_designation_kn'),gn('signatory_designation_en')].filter(Boolean).join(' / '));
    add('ಕಚೇರಿ',gn('signatory_office')); add('ಮುದ್ರಿತ ಟಿಪ್ಪಣಿ',gn('printed_note'));
    // data_json extras (not already printed as a field)
    try{ const dj=JSON.parse(String(first.row[ix('data_json')]||'{}')); void dj; }catch(e){}
    const copies=b.copies.map(c=>({no:c.no,label:c.label||(c.no>1?'DUPLICATE COPY':'ORIGINAL COPY'),status:c.status,issueDate:c.issueDate}));
    const cert={ certNo:b.barcode, barcodeNo:b.barcode, type:typeName, status,
      issueDate:first.issueDate, studentName:nameKn||nameEn, satsNo:gn('sats_no'), admissionNo:gn('admission_no'), className:gn('class'),
      qrData:gn('qr_text'), verifyUrl:gn('verify_url'), fields, copies, printedText:last.printedText.slice(0,6000), serialNo:b.serial, format:'MDRS-CERT-EXPORT-1' };
    out.certs.push(cert);
  });
  if(!out.certs.length&&!out.errors.length) out.errors.push('ಯಾವುದೇ ಪ್ರಮಾಣ ಪತ್ರ ಸಾಲು ಕಂಡುಬಂದಿಲ್ಲ.');
  return out;
}

function certParse(rows,longRows){
  const out={certs:[],errors:[],warnings:[]};
  rows=(rows||[]).filter(r=>r&&r.some(c=>certCell(c)!==''));
  if(!rows.length){ out.errors.push('Excel ನಲ್ಲಿ ಯಾವುದೇ ಮಾಹಿತಿ ಇಲ್ಲ.'); return out; }
  if(certIsMDRS(rows[0])) return certParseMDRS(rows);
  const head=rows[0].map(h=>certCell(h));
  const roles=head.map(h=>certRole(h));
  const iNo=roles.indexOf('no');
  if(iNo<0){ out.errors.push('"CertificateNo" (ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ) ಕಾಲಂ ಕಂಡುಬಂದಿಲ್ಲ. ಮೊದಲ ಸಾಲು ಶೀರ್ಷಿಕೆ (header) ಆಗಿರಬೇಕು.'); return out; }
  const seen={};
  rows.slice(1).forEach((r,ri)=>{
    const line=ri+2, g=i=>i>=0?certCell(r[i]):'';
    const pick=role=>{ const i=roles.indexOf(role); return g(i); };
    const certNo=g(iNo);
    if(!certNo){ out.errors.push('ಸಾಲು '+line+': ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ ಖಾಲಿ — ಬಿಟ್ಟಿದೆ'); return; }
    const key=certNorm(certNo);
    if(seen[key]) out.warnings.push('ಸಾಲು '+line+': ಸಂಖ್ಯೆ '+certNo+' ಈ ಫೈಲ್‌ನಲ್ಲಿ ಮತ್ತೆ ಬಂದಿದೆ — ಕೊನೆಯದನ್ನು ಬಳಸಲಾಗಿದೆ');
    const fields=[];
    head.forEach((h,i)=>{ const v=g(i); if(h&&v!=='') fields.push({k:h,v}); });
    const c={ certNo, barcodeNo:pick('barcode')||certNo, type:pick('type')||'ಪ್ರಮಾಣ ಪತ್ರ', status:pick('status')||'Issued',
      issueDate:pick('issue'), studentName:pick('name'), satsNo:pick('sats'), admissionNo:pick('adm'), className:pick('cls'),
      qrData:pick('qr'), verifyUrl:pick('url'), fields };
    seen[key]=c;
  });
  const certs=Object.keys(seen).map(k=>seen[k]);
  // optional long-format sheet "Fields"
  if(longRows&&longRows.length){
    const lr=longRows.filter(r=>r&&r.some(c=>certCell(c)!==''));
    if(lr.length){
      const lh=lr[0].map(h=>certRole(h,CERT_FLD_ALIASES));
      const a=lh.indexOf('no'), b=lh.indexOf('field'), v=lh.indexOf('value'), o=lh.indexOf('order');
      if(a>=0&&b>=0&&v>=0){
        const byNo={}; certs.forEach(c=>byNo[certNorm(c.certNo)]=c);
        const rowsL=lr.slice(1).map((r,i)=>({no:certCell(r[a]),k:certCell(r[b]),v:certCell(r[v]),o:o>=0&&certCell(r[o])!==''?Number(r[o]):i}));
        rowsL.sort((x,y)=>(isNaN(x.o)||isNaN(y.o))?0:x.o-y.o);
        rowsL.forEach(x=>{ const c=byNo[certNorm(x.no)]; if(!c||!x.k||x.v==='') return; const f=c.fields.find(q=>certNorm(q.k)===certNorm(x.k)); if(f) f.v=x.v; else c.fields.push({k:x.k,v:x.v}); });
      } else out.warnings.push('"Fields" ಶೀಟ್‌ನ ಶೀರ್ಷಿಕೆ (CertificateNo, Field, Value) ಗುರುತಿಸಲಾಗಲಿಲ್ಲ — ಬಿಟ್ಟಿದೆ');
    }
  }
  certs.forEach(c=>{
    const pickF=(roles)=>{ const f=c.fields.find(q=>roles.includes(certRole(q.k))); return f?f.v:''; };
    if(!c.studentName) c.studentName=pickF(['name']);
    if(!c.satsNo) c.satsNo=pickF(['sats']);
    if(!c.admissionNo) c.admissionNo=pickF(['adm']);
    if(!c.className) c.className=pickF(['cls']);
  });
  out.certs=certs; return out;
}

function certApply(parsed,fileName){
  if(!DB.importedCerts) DB.importedCerts=[];
  let added=0, updated=0;
  parsed.certs.forEach(c=>{
    const key=certNorm(c.certNo), old=DB.importedCerts.find(x=>certNorm(x.certNo)===key);
    if(old){ Object.assign(old,c,{id:old.id,importedAt:old.importedAt,updatedAt:todayStr(),updatedBy:CURRENT_USER.name}); updated++; }
    else { DB.importedCerts.push(Object.assign({id:uid(),importedAt:todayStr(),importedBy:CURRENT_USER.name},c)); added++; }
  });
  if(!DB.certImportLog) DB.certImportLog=[];
  DB.certImportLog.push({id:uid(),date:todayStr(),by:CURRENT_USER.name,file:fileName||'',added,updated});
  logAudit('Import','Certificates',fileName||'',`added ${added}, updated ${updated}`);
  saveDB(); return {added,updated};
}

/* ------------------------------------------------------------------ verification display (also used on the public home page) */
function certFind(q){ const n=certNorm(q); if(!n) return null; return (DB.importedCerts||[]).find(c=>certNorm(c.certNo)===n||certNorm(c.barcodeNo)===n)||null; }
function certKeyField(k){ return ['type','no','barcode','status','issue','name','sats','adm','cls'].includes(certRole(k)); }
function certResultHtml(c,forceAll){
  const cancelled=certIsCancelled(c.status);
  const all=forceAll||((DB.certPublicMode||'all')==='all');
  const fields=(c.fields||[]).filter(f=>!['qr','url'].includes(certRole(f.k))&&(all||f.key||certKeyField(f.k)));
  const col=cancelled?'#b3261e':'#155724', bg=cancelled?'#f8d7da':'#d4edda', bd=cancelled?'#dc3545':'#28a745';
  return `<div class="verify-card" style="background:${bg};border:1px solid ${bd};text-align:left;">
    <div style="color:${col};font-weight:700;font-size:15px;">${cancelled?'⛔ ಈ ಪ್ರಮಾಣ ಪತ್ರ ರದ್ದುಪಡಿಸಲಾಗಿದೆ (Certificate Cancelled)':'✅ ಪ್ರಮಾಣ ಪತ್ರ ಮಾನ್ಯ (Certificate Valid)'}</div>
    <div style="font-size:12.5px;margin:6px 0;"><b>${esc(c.type)}</b> · ಸಂಖ್ಯೆ: <b>${esc(c.certNo)}</b>${c.barcodeNo&&certNorm(c.barcodeNo)!==certNorm(c.certNo)?' · Barcode: <b>'+esc(c.barcodeNo)+'</b>':''}<br>
      ಶಾಲೆ: ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265), ಶೆಡಬರಿ, ಭಟ್ಕಳ</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff;"><tbody>
      ${fields.map(f=>`<tr><td style="border:1px solid #cfd8dc;padding:4px 6px;width:42%;font-weight:600;vertical-align:top;">${esc(f.k)}</td><td style="border:1px solid #cfd8dc;padding:4px 6px;">${esc(f.v)}</td></tr>`).join('')}
    </tbody></table>
    ${(c.copies&&c.copies.length>0)?`<div style="font-size:12px;margin-top:6px;"><b>ನೀಡಿದ ಪ್ರತಿಗಳು:</b> ${c.copies.map(x=>esc(x.label)+(certIsCancelled(x.status)?' (ರದ್ದು)':'')+(x.issueDate?' — '+esc(x.issueDate):'')).join(' · ')}</div>`:''}
    <div style="font-size:10.5px;color:#444;margin-top:6px;">ಮೇಲಿನ ವಿವರಗಳನ್ನು ನಿಮ್ಮ ಬಳಿ ಇರುವ ಮೂಲ ಪ್ರಮಾಣ ಪತ್ರದೊಂದಿಗೆ ಹೋಲಿಸಿ ನೋಡಿ. ವ್ಯತ್ಯಾಸ ಕಂಡರೆ ಶಾಲೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.</div></div>`;
}
function certLegacyHtml(q){
  const ql=String(q).toLowerCase();
  const ah=attVerifyHtml(q); if(ah) return ah;
  const di=(DB.docIssueRegister||[]).find(d=>String(d.docNo).toLowerCase()===ql||(d.satsNo&&d.satsNo.toLowerCase()===ql)||(d.admissionNo&&d.admissionNo.toLowerCase()===ql));
  if(di&&di.regStatus&&di.regStatus!=='Issued') return `<div class="verify-card ${di.regStatus==='Approved'?'good':''}">${di.regStatus==='Approved'?'✅ ಪ್ರಾಂಶುಪಾಲರಿಂದ ಅನುಮೋದಿತ — ವಿತರಣೆ ಬಾಕಿ':'⏳ ವಿತರಣಾ ವಹಿಯಲ್ಲಿ ದಾಖಲಾಗಿದೆ — ಇನ್ನೂ ಅನುಮೋದನೆ/ವಿತರಣೆ ಆಗಿಲ್ಲ'}<br><b>${esc(di.studentName)}</b> · ತರಗತಿ ${esc(di.className||'—')}<br>ಸಂ: <b>${esc(di.docNo)}</b> · ${esc(di.docType)}</div>`;
  if(di) return `<div class="verify-card good">✅ ದಾಖಲಾತಿ ವಿತರಣೆ ದಾಖಲಾಗಿದೆ<br><b>${esc(di.studentName)}</b> · ತರಗತಿ ${esc(di.className||'—')}<br>ದಾಖಲೆ ಪ್ರಕಾರ: <b>${esc(di.docType)}</b><br>ದಾಖಲೆ ಸಂಖ್ಯೆ: <b>${esc(di.docNo)}</b> · ವಿತರಿಸಿದ ದಿನಾಂಕ: ${fmtDate(di.dateIssued)}</div>`;
  const sd=(DB.stDocuments||[]).find(d=>d.docNo&&String(d.docNo).toLowerCase()===ql&&d.status==='Issued');
  if(sd) return `<div class="verify-card good">✅ ಪ್ರಮಾಣ ಪತ್ರ ಮಾನ್ಯ<br><b>${esc(sd.studentName)}</b> · ${esc(sd.docType)} · ಸಂ: <b>${esc(sd.docNo)}</b> · ${fmtDate(sd.issuedAt)}</div>`;
  const pc=(DB.progressCards||[]).find(d=>d.docNo&&String(d.docNo).toLowerCase()===ql);
  if(pc) return `<div class="verify-card good">✅ ಪ್ರಗತಿ ಪತ್ರ ಮಾನ್ಯ<br><b>${esc(pc.studentName||'')}</b> · ಸಂ: <b>${esc(pc.docNo)}</b></div>`;
  const o=(DB.outward||[]).find(it=>it.applicationNo&&it.applicationNo.toLowerCase()===ql);
  if(o){ const disp=o.status==='Dispatched'||o.status==='Closed';
    return `<div class="verify-card ${disp?'good':o.status==='Rejected'?'bad':''}"><b>${esc(o.subject)}</b> (${esc(o.letterType)})<br>ಸ್ಥಿತಿ: <b>${esc(o.status)}</b>${o.outwardNo?(' · Out No: '+esc(o.outwardNo)):''}<br>${disp?'✅ '+fmtDate(o.dispatchDate||o.date)+' ರಂದು ರವಾನೆ':o.status==='Rejected'?'❌ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ':'⏳ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ'}</div>`; }
  return '';
}
function certVerifyHtml(q){
  q=String(q||'').trim();
  if(!q) return `<div class="verify-card bad">⚠ ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ / Barcode ಸಂಖ್ಯೆ / SATS ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಅಥವಾ QR / Barcode ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.</div>`;
  q=certExtract(q);
  const c=certFind(q); if(c) return certResultHtml(c);
  const l=certLegacyHtml(q); if(l) return l;
  return `<div class="verify-card bad">❌ ಈ ಸಂಖ್ಯೆಗೆ ಯಾವುದೇ ಪ್ರಮಾಣ ಪತ್ರ ಕಂಡುಬಂದಿಲ್ಲ. (No record found — ಸಂಖ್ಯೆ ಸರಿಯಾಗಿ ನಮೂದಿಸಿ ಅಥವಾ ಶಾಲೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ)<br><span style="font-size:11px;">${esc(q)}</span></div>`;
}
function certExtract(q){            // a scanned QR may carry the whole verification URL
  try{ if(/^https?:\/\//i.test(q)){ const u=new URL(q); const v=u.searchParams.get('verify')||u.searchParams.get('cert')||u.searchParams.get('no'); if(v) return v.trim(); } }catch(e){}
  return q;
}
function doVerify(){
  const inp=document.getElementById('verifySats'), box=document.getElementById('verifyResult'); if(!box) return;
  box.innerHTML=certVerifyHtml(inp?inp.value:'');
}
function checkURLVerification(attempt){
  attempt=attempt||0;
  const q=new URLSearchParams(window.location.search).get('verify'); if(!q) return;
  const inp=document.getElementById('verifySats'), box=document.getElementById('verifyResult');
  if(!box){ if(attempt<20) setTimeout(()=>checkURLVerification(attempt+1),400); return; }
  if(inp) inp.value=q;
  const html=certVerifyHtml(q), found=!/No record found/.test(html);
  if(found||attempt>=6){ box.innerHTML=html; try{ box.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
  else { box.innerHTML='<div class="verify-card">⏳ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...</div>'; setTimeout(()=>checkURLVerification(attempt+1),[1500,2500,3500,5000,7000,9000][attempt]||3000); }
}

/* ------------------------------------------------------------------ camera scan (QR + barcode) */
var CERT_SCAN={stream:null,timer:null};
function certScanStop(){
  if(CERT_SCAN.timer){ clearInterval(CERT_SCAN.timer); CERT_SCAN.timer=null; }
  if(CERT_SCAN.stream){ CERT_SCAN.stream.getTracks().forEach(t=>t.stop()); CERT_SCAN.stream=null; }
  const o=document.getElementById('certScanOverlay'); if(o) o.remove();
}
function certScanStart(){
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    showToast('ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್ ಇಲ್ಲ — ಫೋನ್ ಕ್ಯಾಮೆರಾದಿಂದ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಅಥವಾ ಸಂಖ್ಯೆ ಟೈಪ್ ಮಾಡಿ / Barcode scanner ಬಳಸಿ',6000); return;
  }
  certScanStop();
  const ov=document.createElement('div'); ov.id='certScanOverlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;';
  ov.innerHTML='<div style="color:#fff;font-weight:700;">📷 QR ಅಥವಾ Barcode ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಹಿಡಿಯಿರಿ</div><video id="certScanVideo" playsinline muted style="width:min(92vw,520px);border-radius:10px;background:#000;"></video><button class="btn btn-gold" onclick="certScanStop()">✕ ಮುಚ್ಚಿ</button>';
  document.body.appendChild(ov);
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(stream=>{
    CERT_SCAN.stream=stream;
    const v=document.getElementById('certScanVideo'); if(!v){ certScanStop(); return; }
    v.srcObject=stream; v.play().catch(()=>{});
    const det=new BarcodeDetector({formats:['qr_code','code_128','code_39','code_93','ean_13','ean_8','itf','codabar','upc_a','upc_e','data_matrix']});
    let busy=false;
    CERT_SCAN.timer=setInterval(()=>{
      if(busy||!v.videoWidth) return; busy=true;
      det.detect(v).then(res=>{
        if(res&&res.length){ const val=certExtract(String(res[0].rawValue||'').trim());
          certScanStop(); const inp=document.getElementById('verifySats'); if(inp) inp.value=val; doVerify(); }
      }).catch(()=>{}).then(()=>{ busy=false; });
    },350);
  }).catch(()=>{ certScanStop(); showToast('⚠ ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ — ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ Camera ಅನುಮತಿಸಿ',5000); });
}

/* ------------------------------------------------------------------ FDA page */
var CERT_PARSED=null, CERT_FILE='';
function renderCertImport(){
  if(!DB.importedCerts) DB.importedCerts=[];
  const q=(document.getElementById('cert_search')||{}).value||'';
  const list=DB.importedCerts.filter(c=>!q||certNorm([c.certNo,c.barcodeNo,c.studentName,c.satsNo,c.admissionNo,c.type].join(' ')).includes(certNorm(q))).slice().reverse();
  const mode=DB.certPublicMode||'all';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📥 ಪ್ರಮಾಣ ಪತ್ರ Excel Import (Offline ಸಾಫ್ಟ್‌ವೇರ್ ನಿಂದ)</h2>
    <div class="desc">Offline ಸಾಫ್ಟ್‌ವೇರ್‌ನಲ್ಲಿ ಪ್ರಮಾಣ ಪತ್ರ ವಿತರಿಸಿದ ನಂತರ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ Excel ಅನ್ನು ಇಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಂತರ ಯಾರಾದರೂ ವೆಬ್‌ಸೈಟ್‌ನ ಮುಖಪುಟದಲ್ಲಿ QR / Barcode ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಪ್ರಮಾಣ ಪತ್ರ ಪರಿಶೀಲಿಸಬಹುದು.</div></div>

    <div class="panel"><h3>1️⃣ Excel ಆಯ್ಕೆ ಮಾಡಿ</h3>
      <div class="form-actions" style="flex-wrap:wrap;gap:8px;">
        <label class="btn btn-gold" style="cursor:pointer;">📎 Excel ಫೈಲ್ ಆಯ್ಕೆ (.xlsx)
          <input type="file" accept=".xlsx,.xls,.csv" style="display:none;" onchange="certReadFile(this)"></label>
        <button class="btn btn-outline" onclick="certTemplate()">⬇ ಮಾದರಿ (Template) Excel</button>
      </div>
      <div class="helper">ಮೊದಲ ಶೀಟ್ "Certificates": ಒಂದು ಸಾಲು = ಒಂದು ಪ್ರಮಾಣ ಪತ್ರ. ಅಗತ್ಯ ಕಾಲಂ: <b>CertificateNo</b>. ಉಳಿದ ಪ್ರತಿ ಕಾಲಂ (ವಿದ್ಯಾರ್ಥಿ, ಪೋಷಕರು, ದಿನಾಂಕಗಳು, ಶಾಲೆ, ಸಹಿ, QR/Barcode ಇತ್ಯಾದಿ — ಪ್ರಮಾಣ ಪತ್ರದಲ್ಲಿ ಮುದ್ರಿತವಾದ ಎಲ್ಲವೂ) ತಾನಾಗಿ ಸೇರುತ್ತದೆ. ವಿವಿಧ ರೀತಿಯ ಪ್ರಮಾಣ ಪತ್ರಗಳಿಗೆ ಬೇರೆ ಬೇರೆ ಕಾಲಂ ಇರಬಹುದು.</div>
      <div id="certPreview">${certPreviewHtml()}</div>
    </div>

    <div class="panel"><h3>⚙️ ಸಾರ್ವಜನಿಕ ಪರಿಶೀಲನೆಯಲ್ಲಿ ತೋರಿಸುವ ವಿವರ</h3>
      <select onchange="DB.certPublicMode=this.value;saveDB();showToast('✅ ಉಳಿಸಲಾಗಿದೆ')">
        <option value="all" ${mode==='all'?'selected':''}>ಪ್ರಮಾಣ ಪತ್ರದ ಎಲ್ಲಾ ವಿವರಗಳು</option>
        <option value="key" ${mode==='key'?'selected':''}>ಮುಖ್ಯ ವಿವರ ಮಾತ್ರ (ಹೆಸರು, ತರಗತಿ, SATS, ಸಂಖ್ಯೆ, ದಿನಾಂಕ, ಸ್ಥಿತಿ)</option>
      </select>
      <div class="helper">ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ ಊಹಿಸಬಹುದಾದಂತಿದ್ದರೆ (ಉದಾ: ದಿನಾಂಕ+ಕ್ರಮಸಂಖ್ಯೆ) ಇತರರು ವಿದ್ಯಾರ್ಥಿಗಳ ವೈಯಕ್ತಿಕ ವಿವರ ನೋಡಬಹುದು. ಸುರಕ್ಷತೆಗಾಗಿ "ಮುಖ್ಯ ವಿವರ ಮಾತ್ರ" ಆಯ್ಕೆ ಮಾಡಬಹುದು.</div>
    </div>

    <div class="panel"><h3>2️⃣ Import ಆದ ಪ್ರಮಾಣ ಪತ್ರಗಳು (${DB.importedCerts.length})</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <input id="cert_search" placeholder="🔍 ಸಂಖ್ಯೆ / ಹೆಸರು / SATS ಹುಡುಕಿ..." value="${esc(q)}" oninput="certSearchLater()" style="flex:1;min-width:200px;">
        <button class="btn btn-outline btn-sm" onclick="certExportAll()">⬇ ಎಲ್ಲಾ Excel</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>ಸಂಖ್ಯೆ</th><th>Barcode</th><th>ಪ್ರಕಾರ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ತರಗತಿ</th><th>SATS</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ವಿವರ</th><th>Action</th></tr></thead>
      <tbody>${list.length?list.slice(0,300).map(c=>`<tr><td><b>${esc(c.certNo)}</b></td><td>${esc(c.barcodeNo)}</td><td>${esc(c.type)}</td><td>${esc(c.studentName||'—')}</td><td>${esc(c.className||'—')}</td><td>${esc(c.satsNo||'—')}</td><td>${esc(c.issueDate||'—')}</td>
        <td>${certIsCancelled(c.status)?'<span class="badge badge-bad">ರದ್ದು</span>':'<span class="badge badge-ok">'+esc(c.status)+'</span>'}</td><td>${(c.fields||[]).length} ಕ್ಷೇತ್ರ</td>
        <td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="certView('${c.id}')">👁</button> <button class="btn btn-sm btn-gold" onclick="certToggle('${c.id}')">${certIsCancelled(c.status)?'↩ ಮರುಸ್ಥಾಪಿಸಿ':'⛔ ರದ್ದು'}</button> <button class="btn btn-sm btn-red" onclick="certDelete('${c.id}')">🗑</button></td></tr>`).join(''):'<tr class="empty-row"><td colspan="10">ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಮಾಣ ಪತ್ರ Import ಆಗಿಲ್ಲ.</td></tr>'}</tbody></table></div>
      ${list.length>300?'<div class="small-muted">ಮೊದಲ 300 ತೋರಿಸಲಾಗಿದೆ — ಹುಡುಕಿ.</div>':''}
    </div>
    <div id="certViewWrap"></div>`;
}
var _certSearchT=null;
function certSearchLater(){ clearTimeout(_certSearchT); _certSearchT=setTimeout(()=>{ const q=(document.getElementById('cert_search')||{}).value||''; renderCertImport(); const e=document.getElementById('cert_search'); if(e){ e.value=q; e.focus(); e.setSelectionRange(q.length,q.length); } },350); }
function certPreviewHtml(){
  const p=CERT_PARSED; if(!p) return '';
  const exist=c=>(DB.importedCerts||[]).some(x=>certNorm(x.certNo)===certNorm(c.certNo));
  const nNew=p.certs.filter(c=>!exist(c)).length, nUpd=p.certs.length-nNew;
  return `<div style="margin-top:12px;border-top:1px dashed var(--border);padding-top:10px;">
    <div><b>${esc(CERT_FILE)}</b> — ${p.certs.length} ಪ್ರಮಾಣ ಪತ್ರ ಕಂಡುಬಂದಿದೆ (ಹೊಸದು: <b>${nNew}</b>, ಈಗಾಗಲೇ ಇದ್ದು ನವೀಕರಣ: <b>${nUpd}</b>)</div>
    ${p.errors.length?`<div class="note" style="background:#fdeceb;border-color:#e6b3ae;">${p.errors.map(esc).join('<br>')}</div>`:''}
    ${p.warnings.length?`<div class="note">${p.warnings.map(esc).join('<br>')}</div>`:''}
    ${p.certs.length?`<div class="table-wrap"><table><thead><tr><th>ಸಂಖ್ಯೆ</th><th>Barcode</th><th>ಪ್ರಕಾರ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ಸ್ಥಿತಿ</th><th>ಕ್ಷೇತ್ರಗಳು</th><th></th></tr></thead><tbody>${p.certs.slice(0,15).map(c=>`<tr><td>${esc(c.certNo)}</td><td>${esc(c.barcodeNo)}</td><td>${esc(c.type)}</td><td>${esc(c.studentName||'—')}</td><td>${esc(c.status)}</td><td>${c.fields.length}</td><td>${exist(c)?'ನವೀಕರಣ':'ಹೊಸದು'}</td></tr>`).join('')}</tbody></table></div>
    ${p.certs.length>15?'<div class="small-muted">ಮೊದಲ 15 ತೋರಿಸಲಾಗಿದೆ.</div>':''}
    <div class="form-actions"><button class="btn btn-green" onclick="certConfirmImport()">✅ ${p.certs.length} ಪ್ರಮಾಣ ಪತ್ರ Import ಮಾಡಿ</button> <button class="btn btn-outline" onclick="CERT_PARSED=null;renderCertImport()">ರದ್ದು</button></div>`:''}</div>`;
}
function certReadFile(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ — ಪುಟ ರಿಫ್ರೆಶ್ ಮಾಡಿ'); return; }
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'});
      const names=wb.SheetNames;
      const mainName=names.find(n=>/^cert/i.test(n))||names[0];
      const fldName=names.find(n=>/^field/i.test(n)&&n!==mainName);
      const toRows=n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''});
      CERT_PARSED=certParse(toRows(mainName),fldName?toRows(fldName):null); CERT_FILE=f.name;
    }catch(err){ CERT_PARSED={certs:[],errors:['ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ: '+(err&&err.message||err)],warnings:[]}; CERT_FILE=f.name; }
    inp.value=''; const p=document.getElementById('certPreview'); if(p) p.innerHTML=certPreviewHtml();
  };
  rd.readAsArrayBuffer(f);
}
function certConfirmImport(){
  if(!CERT_PARSED||!CERT_PARSED.certs.length) return;
  const r=certApply(CERT_PARSED,CERT_FILE); CERT_PARSED=null;
  showToast('✅ Import ಆಯಿತು — ಹೊಸದು '+r.added+', ನವೀಕರಣ '+r.updated); renderCertImport();
}
function certView(id){
  const c=(DB.importedCerts||[]).find(x=>x.id===id); if(!c) return;
  const w=document.getElementById('certViewWrap'); if(!w) return;
  const url=c.verifyUrl||getVerifyURL(c.certNo,'');
  w.innerHTML=`<div class="panel"><h3>👁 ${esc(c.type)} — ${esc(c.certNo)}</h3>${certResultHtml(c,true)}
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:10px;"><div id="certQrBox"></div><div style="font-size:11px;word-break:break-all;"><b>QR / ಪರಿಶೀಲನಾ ಲಿಂಕ್:</b><br>${esc(c.qrData||url)}<br><b>Barcode:</b> ${esc(c.barcodeNo)}</div></div></div>`;
  try{ makeQRCode('certQrBox',c.qrData||url); }catch(e){}
  w.scrollIntoView({behavior:'smooth'});
}
function certToggle(id){
  const c=(DB.importedCerts||[]).find(x=>x.id===id); if(!c) return;
  if(certIsCancelled(c.status)){ if(!confirm('ಈ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ಮರುಸ್ಥಾಪಿಸುವುದೇ?')) return; c.status='Issued'; }
  else { if(!confirm('ಈ ಪ್ರಮಾಣ ಪತ್ರ ರದ್ದು ಮಾಡುವುದೇ? ಪರಿಶೀಲಿಸಿದಾಗ "ರದ್ದುಪಡಿಸಲಾಗಿದೆ" ಎಂದು ತೋರುತ್ತದೆ.')) return; c.status='Cancelled'; }
  logAudit('Edit','Certificates',c.certNo,'status → '+c.status); saveDB(); renderCertImport();
}
function certDelete(id){
  const c=(DB.importedCerts||[]).find(x=>x.id===id); if(!c) return;
  if(!confirm('ಈ ದಾಖಲೆ ಅಳಿಸುವುದೇ? '+c.certNo+' — ಪರಿಶೀಲನೆಯಲ್ಲಿ ಇನ್ನು ಕಾಣುವುದಿಲ್ಲ.')) return;
  DB.importedCerts=DB.importedCerts.filter(x=>x.id!==id); logAudit('Delete','Certificates',c.certNo,''); saveDB(); renderCertImport();
}
function certExportAll(){
  if(typeof XLSX==='undefined') return; const list=DB.importedCerts||[]; if(!list.length){ showToast('ℹ ಏನೂ ಇಲ್ಲ'); return; }
  const cols=['CertificateType','CertificateNo','BarcodeNo','IssueStatus']; const extra=[];
  list.forEach(c=>(c.fields||[]).forEach(f=>{ if(!['type','no','barcode','status'].includes(certRole(f.k))&&!extra.includes(f.k)) extra.push(f.k); }));
  const rows=list.map(c=>{ const m={}; (c.fields||[]).forEach(f=>m[f.k]=f.v); return [c.type,c.certNo,c.barcodeNo,c.status].concat(extra.map(k=>m[k]||'')); });
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([cols.concat(extra)].concat(rows)),'Certificates');
  XLSX.writeFile(wb,'Imported_Certificates_'+todayStr()+'.xlsx');
}
function certTemplate(){
  if(typeof XLSX==='undefined') return;
  const head=['CertificateType','CertificateNo','BarcodeNo','QRData','VerificationURL','IssueStatus','IssueDate','School Name','School Code','Student Name','SATS No','Admission No','Class','Academic Year','Father Name','Mother Name','Date of Birth','Date of Admission','Date of Leaving','Reason for Leaving','Conduct','Signatory Name','Signatory Designation'];
  const base=location.href.split('?')[0].split('#')[0];
  const r1=['Transfer Certificate','202610220001','202610220001',base+'?verify=202610220001',base+'?verify=202610220001','Issued','22-10-2026','Morarji Desai Residential School, Shedabari, Bhatkal','BC-265','SAMPLE STUDENT','1234567890','123','10','2026-27','SAMPLE FATHER','SAMPLE MOTHER','01-01-2012','15-06-2021','22-10-2026','Parent request','Good','Principal Name','Principal'];
  const r2=['Study Certificate','202610220002','202610220002',base+'?verify=202610220002',base+'?verify=202610220002','Issued','22-10-2026','Morarji Desai Residential School, Shedabari, Bhatkal','BC-265','SAMPLE STUDENT 2','9876543210','124','9','2026-27','','','','','','','','Principal Name','Principal'];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([head,r1,r2]),'Certificates');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಸೂಚನೆ / Instructions'],['1. "Certificates" ಶೀಟ್: ಒಂದು ಸಾಲು = ಒಂದು ಪ್ರಮಾಣ ಪತ್ರ. ಮೊದಲ ಸಾಲು ಶೀರ್ಷಿಕೆ.'],['2. CertificateNo ಕಡ್ಡಾಯ. BarcodeNo ಖಾಲಿ ಇದ್ದರೆ CertificateNo ಬಳಕೆ.'],['3. ಪ್ರಮಾಣ ಪತ್ರದಲ್ಲಿ ಮುದ್ರಿತವಾದ ಪ್ರತಿ ವಿವರಕ್ಕೂ ಒಂದು ಕಾಲಂ ಸೇರಿಸಿ. ಬೇರೆ ಬೇರೆ ಪ್ರಕಾರದ ಪ್ರಮಾಣ ಪತ್ರಕ್ಕೆ ಬೇರೆ ಕಾಲಂ ಇರಬಹುದು; ಖಾಲಿ ಕೋಶ ಬಿಡಲಾಗುತ್ತದೆ.'],['4. IssueStatus: Issued / Cancelled.'],['5. ಮಾದರಿ ಸಾಲುಗಳನ್ನು (SAMPLE) ಅಳಿಸಿ ನಿಜವಾದ ಮಾಹಿತಿ ಹಾಕಿ.'],['6. ಐಚ್ಛಿಕ: "Fields" ಶೀಟ್ (CertificateNo | Order | Field | Value) ಬಳಸಿಯೂ ವಿವರ ಸೇರಿಸಬಹುದು.']]),'Instructions');
  XLSX.writeFile(wb,'Certificate_Import_Template.xlsx');
}

;(window.__LOADED=window.__LOADED||[]).push('certimport');
