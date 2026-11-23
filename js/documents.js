/* =====================================================================
   KREIS e-Office v35 — documents.js
   ಪ್ರಗತಿ ಪತ್ರ & ದಾಖಲೆಗಳು — Progress card, SC/TC, document issue
   ===================================================================== */
function getStudentGrade(studentId,cls,subj,exam){
  const rec=DB.marks.find(m=>m.className===cls&&m.subject===subj&&m.examName===exam&&['Frozen','Approved','FDA Acknowledged'].includes(m.status));
  if(!rec) return '—';
  const e=rec.entries.find(x=>x.studentId===studentId);
  return e?(e.grade||'—'):'—';
}

function getStudentMarksNum(studentId,cls,subj,exam){
  const rec=DB.marks.find(m=>m.className===cls&&m.subject===subj&&m.examName===exam&&['Frozen','Approved','FDA Acknowledged'].includes(m.status));
  if(!rec) return 0;
  const e=rec.entries.find(x=>x.studentId===studentId);
  return e?Number(e.marks||0):0;
}

function getMonthlyAtt(studentId,cls,y,m){
  const recs=DB.attendance.filter(a=>a.className===cls&&a.status==='Approved'&&a.date&&Number(a.date.slice(0,4))===y&&Number(a.date.slice(5,7))===m);
  const working=recs.length;
  const present=recs.filter(a=>{const r=a.records.find(x=>x.studentId===studentId); return r&&r.status==='Present';}).length;
  return {working,present};
}

function renderMarksCard(){
  const students=DB.students;
  const pending=DB.progressCards.filter(c=>c.status==='Principal Signed'||c.status==='Ready to Issue').length;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📄 ಪ್ರಗತಿ ಪತ್ರಿಕೆ Generate (Progress Card)</h2>
    </div>
    ${pending?`<div class="note">🔔 ${pending} ಪ್ರಗತಿ ಪತ್ರಿಕೆ(ಗಳು) Ready to Issue — ಕೆಳಗೆ "ಪ್ರಗತಿ ಪತ್ರಿಕೆ ಪಟ್ಟಿ" ನೋಡಿ.</div>`:''}
    <div class="panel"><h3>👤 ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ (${students.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ದಾಖಲಾತಿ ಸಂಖ್ಯೆ</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>SATS</th><th>PC Status</th><th>Action</th></tr></thead>
      <tbody>${students.length?students.map(s=>{
        const card=DB.progressCards.filter(c=>c.studentId===s.id).sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt))[0];
        const st=card?card.status:'—';
        return `<tr>
          <td>${esc(s.admissionNo)}</td><td><b>${esc(s.studentName)}</b></td>
          <td>${esc(s.className)}</td><td>${esc(s.satsNo||'—')}</td>
          <td>${card?`<span class="badge ${badgeClass(st)}">${esc(st)}</span>`:'<span class="small-muted">ಇಲ್ಲ</span>'}</td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-primary" onclick="openGenerateCardModal('${s.id}')">📄 ${card?'Re-generate':'Generate'}</button>
            ${card&&(card.status==='Ready to Issue'||card.status==='Principal Signed')?`<button class="btn btn-sm btn-gold" onclick="viewAndIssueCard('${card.id}')">🖨️ View &amp; Issue</button>`:''}
            ${card&&card.status==='Issued'?`<button class="btn btn-sm btn-outline" onclick="viewCardById('${card.id}')">👁 View</button>`:''}
            ${card&&card.status==='Generated'?`<button class="btn btn-sm btn-outline" onclick="viewCardById('${card.id}')">👁 View / Print</button><button class="btn btn-sm btn-primary" onclick="sendCardToClassTeacher('${card.id}')">📤 Class Teacher ಗೆ</button>`:''}
          </td>
        </tr>`;
      }).join(''):`<tr class="empty-row"><td colspan="6">ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div class="panel"><h3>📋 ಎಲ್ಲಾ ಪ್ರಗತಿ ಪತ್ರಿಕೆ ಸ್ಥಿತಿ (${DB.progressCards.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ತರಗತಿ</th><th>Generate ದಿನಾಂಕ</th><th>Class Teacher Sign</th><th>Principal Sign</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
      <tbody>${DB.progressCards.length?DB.progressCards.slice().reverse().map(c=>{
        const s=DB.students.find(x=>x.id===c.studentId);
        return `<tr>
          <td><b>${esc(c.studentName)}</b></td>
          <td>${esc(c.className)}</td>
          <td>${fmtDate(c.generatedAt)}</td>
          <td>${c.classTeacherSigned?`✅ ${esc(c.classTeacherName)} (${fmtDate(c.classTeacherSignedAt)})`:'⏳ ಬಾಕಿ'}</td>
          <td>${c.principalSigned?`✅ ${esc(c.principalName)} (${fmtDate(c.principalSignedAt)})`:'⏳ ಬಾಕಿ'}</td>
          <td><span class="badge ${badgeClass(c.status)}">${esc(c.status)}</span></td>
          <td class="actions-cell">
            ${(c.status==='Ready to Issue'||c.status==='Principal Signed')?`<button class="btn btn-sm btn-gold" onclick="viewAndIssueCard('${c.id}')">🖨️ Issue</button>`:''}
            ${c.status==='Generated'?`<button class="btn btn-sm btn-primary" onclick="sendCardToClassTeacher('${c.id}')">📤 Class Teacher ಗೆ</button>`:''}
            <button class="btn btn-sm btn-outline" onclick="viewCardById('${c.id}')">👁</button>
          </td>
        </tr>`;
      }).join(''):`<tr class="empty-row"><td colspan="7">ಪ್ರಗತಿ ಪತ್ರಿಕೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="pcPreviewWrap"></div>`;
}

function renderPCSign(){
  const myCards = CURRENT_USER.role==='principal'
    ? DB.progressCards.filter(c=>c.status==='Sent to Principal')
    : CURRENT_USER.role==='staff'
      ? DB.progressCards.filter(c=>c.status==='Sent to Class Teacher' && DB.classTeacherAllocation[c.className]===CURRENT_USER.name)
      : DB.progressCards;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✍️ ಪ್ರಗತಿ ಪತ್ರಿಕೆ E-Sign</h2>
    <div class="desc">${CURRENT_USER.role==='principal'?'Principal — E-Sign ಕಾಯುತ್ತಿರುವ ಪ್ರಗತಿ ಪತ್ರಿಕೆಗಳು':'Class Teacher — ನಿಮ್ಮ ತರಗತಿಯ ಪ್ರಗತಿ ಪತ್ರಿಕೆಗಳಿಗೆ E-Sign ಮಾಡಿ ಮತ್ತು Part B ನಮೂದಿಸಿ'}</div></div>
    ${!myCards.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಈಗ E-Sign ಅಗತ್ಯವಿರುವ ಯಾವುದೇ ಪ್ರಗತಿ ಪತ್ರಿಕೆ ಇಲ್ಲ.</div></div>':''}
    ${myCards.map(c=>{
      const s=DB.students.find(x=>x.id===c.studentId);
      const isClassTeacher=CURRENT_USER.role==='staff';
      return `<div class="panel"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div><h3 style="margin:0;">📄 ${esc(c.studentName)} — ${c.className}ನೇ ತರಗತಿ</h3>
          <div class="small-muted">SATS: ${esc(c.satsNo||'—')} · ${c.academicYear} · Generated: ${fmtDate(c.generatedAt)}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="viewCardById('${c.id}')">👁 Preview Card</button>
      </div>
      ${isClassTeacher?`<div class="form-grid" style="margin-bottom:10px;">
        <div class="field"><label>ಫಲಿತಾಂಶ (Result Grade)</label><select id="pcsign_result_${c.id}">
          ${['A+','A','B+','B','C+','C'].map(g=>`<option ${c.result===g?'selected':''}>${g}</option>`).join('')}
        </select></div>
        <div class="field"><label>ಷರಾ / Remarks</label><input id="pcsign_remarks_${c.id}" value="${esc(c.remarks||'')}"></div>
      </div>
      <div class="panel" style="background:var(--surface-2);padding:12px;"><h4 style="margin:0 0 8px;font-size:12.5px;">Part B — Non Scholastic Subjects (SA1 | SA2)</h4>
        <div class="form-grid">${NS_ITEMS.map(n=>`<div class="field"><label style="font-size:11px;">${n.kn}<br>${n.en}</label>
          <div style="display:flex;gap:6px;">
            <select id="ns_sa1_${c.id}_${n.key}" style="flex:1;padding:5px;">
              ${['A+','A','B+','B','C'].map(g=>`<option ${(c.nonScholastic&&c.nonScholastic[n.key]&&c.nonScholastic[n.key].sa1===g)?'selected':''}>${g}</option>`).join('')}
            </select>
            <select id="ns_sa2_${c.id}_${n.key}" style="flex:1;padding:5px;">
              ${['A+','A','B+','B','C'].map(g=>`<option ${(c.nonScholastic&&c.nonScholastic[n.key]&&c.nonScholastic[n.key].sa2===g)?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
        </div>`).join('')}</div>
      </div>`:''}
      ${CURRENT_USER.role==='principal'?`<div class="field" style="margin:10px 0 0;"><label>ಟಿಪ್ಪಣಿ / Reject ಕಾರಣ (Remarks)</label><input id="pc_remark_${c.id}" placeholder="Approve ಅಥವಾ Reject ಕಾರಣ ಬರೆಯಿರಿ"></div>`:''}
      <div class="form-actions">
        <button class="btn btn-outline btn-sm" onclick="viewCardById('${c.id}')">👁 Full Preview</button>
        ${isClassTeacher?`<button class="btn btn-primary" onclick="signCard('${c.id}','classTeacher')">✍ ಅನುಮೋದಿಸಿ → ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button>`:
        `<button class="btn btn-primary" onclick="signCard('${c.id}','principal')">✅ ಅಂತಿಮ ಅನುಮೋದನೆ (Digital Sign)</button>
         <button class="btn btn-red btn-sm" onclick="rejectCardPrincipal('${c.id}')">✕ Reject (ಕಾರಣ ಕಡ್ಡಾಯ)</button>`}
      </div></div>`;
    }).join('')}`;
}

function rejectCardPrincipal(cardId){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c) return;
  const reason=document.getElementById('pc_remark_'+cardId)?.value?.trim()||'';
  if(!reason){ showToast('⚠ Reject ಕಾರಣ ಬರೆಯಿರಿ (mandatory)'); document.getElementById('pc_remark_'+cardId)?.focus(); return; }
  c.status='Sent to Class Teacher'; c.principalSigned=false; c.classTeacherSigned=false;
  c.remarks=(c.remarks?c.remarks+' | ':'')+'Principal Rejected: '+reason;
  saveDB();
  const clsTeacher=DB.classTeacherAllocation[c.className];
  if(clsTeacher) pushNotification(clsTeacher,'❌ ಪ್ರಗತಿ ಪತ್ರಿಕೆ Reject: '+c.studentName+' — '+reason);
  showToast('↩ Reject: '+reason); navigate('pcsign');
}

async function signCard(cardId, role){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c) return;
  if(role==='classTeacher'){
    // Save non-scholastic
    const ns={};
    NS_ITEMS.forEach(n=>{
      ns[n.key]={
        sa1:document.getElementById(`ns_sa1_${cardId}_${n.key}`)?.value||'A',
        sa2:document.getElementById(`ns_sa2_${cardId}_${n.key}`)?.value||'A'
      };
    });
    c.nonScholastic=ns;
    c.result=document.getElementById(`pcsign_result_${cardId}`)?.value||'';
    c.remarks=document.getElementById(`pcsign_remarks_${cardId}`)?.value||'';
    c.classTeacherSigned=true; c.classTeacherSignedAt=todayStr(); c.classTeacherName=CURRENT_USER.name;
    { const ts=await getServerTimeStamp(); const m={}; await cbSignMeta(m,ts); c.ctStamp=m.signStamp; c.ctHost=m.signHost; c.ctIp=m.signIp; c.ctDevice=m.signDevice; }
    c.status='Sent to Principal';
    const principal=STAFF.find(s=>s.role==='principal');
    if(principal) pushNotification(principal.name,'📄 ಪ್ರಗತಿ ಪತ್ರಿಕೆ E-Sign: '+c.studentName+' ('+c.className+'ನೇ) — Principal E-Sign ಅಗತ್ಯ');
    showToast('✅ E-Signed — Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  } else {
    c.principalSigned=true; c.principalSignedAt=todayStr(); c.principalName=CURRENT_USER.name;
    { const ts=await getServerTimeStamp(); const m={}; await cbSignMeta(m,ts); c.prStamp=m.signStamp; c.prHost=m.signHost; c.prIp=m.signIp; c.prDevice=m.signDevice; }
    c.status='Ready to Issue';
    staffNamesForRole('fda').forEach(n=>pushNotification(n,'📄 ಪ್ರಗತಿ ಪತ್ರಿಕೆ Ready to Issue: '+c.studentName+' ('+c.className+'ನೇ) — FDA Print &amp; Issue ಮಾಡಿ'));
    showToast('✅ Principal E-Signed — FDA ಗೆ Ready to Issue ಎಂದು ಕಳುಹಿಸಲಾಗಿದೆ');
  }
  pcRegSync(c); saveDB(); navigate('pcsign');
}

function viewAndIssueCard(cardId){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c) return;
  const s=stuForCard(c); if(!s) { showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (ಅಳಿಸಲಾಗಿದೆ)'); return; }
  const html=buildProgressCardHTML(s,c);
  const wrap=document.getElementById('pcPreviewWrap')||document.getElementById('content');
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div class="progress-card-preview-btns" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="btn btn-gold" onclick="pcPrint()">🖨️ Print (4 Pages)</button>
      ${c.status!=='Issued'?`<button class="btn btn-primary" onclick="issueCard('${cardId}')">✅ ವಿತರಿಸಿ (Issue) &amp; Doc Register ನಲ್ಲಿ ನಮೂದಿಸಿ</button>`:''}
      <button class="btn btn-outline" onclick="navigate('markscard')">✕ ಮುಚ್ಚಿ</button>
    </div>
    ${html}
  </div>`;
  pcMakeQRs(wrap);
  wrap.scrollIntoView({behavior:'smooth'});
}

function viewCardById(cardId){
  if((DB.attCerts||[]).some(x=>x.id===cardId)) return attPreview(cardId);
  if(DB.stDocuments.some(x=>x.id===cardId)) return viewSCTCDoc(cardId);
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c){ showToast('⚠ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ'); return; }
  const s=stuForCard(c); if(!s) { showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (ಅಳಿಸಲಾಗಿದೆ)'); return; }
  const html=buildProgressCardHTML(s,c);
  const target=document.getElementById('pcPreviewWrap')||document.getElementById('content');
  target.innerHTML=`<div class="panel" id="printArea">
    <div class="progress-card-preview-btns" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn btn-gold" onclick="pcPrint()">🖨️ Print / PDF</button>
      ${(c.status==='Generated'&&CURRENT_USER.role==='fda')?`<button class="btn btn-primary" onclick="sendCardToClassTeacher('${c.id}')">📤 Class Teacher ಗೆ ಕಳುಹಿಸಿ</button>`:''}
      <button class="btn btn-outline" onclick="navigate(CURRENT_PAGE)">✕ ಮುಚ್ಚಿ</button>
    </div>
    ${html}
  </div>`;
  pcMakeQRs(target);
  target.scrollIntoView({behavior:'smooth'});
}

function issueCard(cardId){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c) return;
  const issuedTo=prompt('ವಿದ್ಯಾರ್ಥಿ / ಪಾಲಕರ ಹೆಸರು (Issued To):')||c.studentName;
  const s0=DB.students.find(x=>x.id===c.studentId)||{};
  const docNo=c.docNo||pcDocNo(c,s0);
  c.status='Issued'; c.issuedAt=todayStr(); c.issuedBy=CURRENT_USER.name; c.issuedTo=issuedTo; c.docNo=docNo;
  pcRegSync(c);
  saveDB();
  showToast('✅ ಪ್ರಗತಿ ಪತ್ರಿಕೆ Issue ಮಾಡಲಾಗಿದೆ! Doc No: '+docNo+' — ದಾಖಲಾತಿ ವಿತರಣಾ ವಹಿಯಲ್ಲಿ ನಮೂದಾಗಿದೆ');
  navigate('markscard');
}


/* ===== Progress card (v114): layout as per the society's progress report card ===== */
const PC_LOGO_GOV='data:image/jpeg;base64,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';
const PC_LOGO_SOC='data:image/jpeg;base64,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';
const PC_C128="212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232".split(' ');
function pcBarcode(text,h){
  // Code 128-B barcode as inline SVG
  const codes=[104]; let sum=104;
  String(text).split('').forEach((ch,i)=>{ let v=ch.charCodeAt(0)-32; if(v<0||v>95) v=0; codes.push(v); sum+=v*(i+1); });
  codes.push(sum%103);
  let bars='', x=0;
  codes.forEach(c=>{ const p=PC_C128[c]; for(let i=0;i<6;i++){ const w=+p[i]; if(i%2===0) bars+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`; x+=w; } });
  const stop='2331112'; for(let i=0;i<7;i++){ const w=+stop[i]; if(i%2===0) bars+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`; x+=w; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px;display:block;" fill="#000">${bars}</svg>`;
}
function pcMakeQRs(root){
  (root||document).querySelectorAll('.pcx-qr[data-url]').forEach(el=>{
    el.innerHTML=''; try{ new QRCode(el,{text:el.getAttribute('data-url'),width:62,height:62,correctLevel:QRCode.CorrectLevel.M}); }catch(e){}
  });
}
function pcDocNo(card,s){
  const ay=String(card.academicYear||'').match(/(\d{4})\D+(\d{2,4})/);
  const yy=ay?(ay[1]+'-'+ay[2].slice(-2)):String(card.academicYear||'');
  return 'PR-'+(s.satsNo||s.admissionNo||card.studentId)+'-'+yy;
}
function pcPrint(){
  const w=document.querySelector('.pcx-wrap'); if(!w){ window.print(); return; }
  const host=document.createElement('div'); host.id='pcxHost'; host.innerHTML=w.outerHTML; document.body.appendChild(host);
  pcMakeQRs(host);
  document.body.classList.add('pcx-printing');
  const oldTitle=document.title; document.title=location.host||'mdrsshedbarieoffice.in';
  const done=()=>{ document.body.classList.remove('pcx-printing'); host.remove(); document.title=oldTitle; window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  setTimeout(()=>{ window.print(); setTimeout(()=>{ if(document.body.classList.contains('pcx-printing')) done(); },60000); },350);
}
function pcRegSync(c){
  // auto issue-register entry: created when the card is generated, status follows the workflow
  if(!DB.docIssueRegister) DB.docIssueRegister=[];
  if(!c.docNo) return;
  let e=DB.docIssueRegister.find(d=>d.cardId===c.id||d.docNo===c.docNo);
  if(!e){ e={id:uid(), docNo:c.docNo, cardId:c.id}; DB.docIssueRegister.push(e); }
  const st=c.status==='Issued'?'Issued':(c.principalSigned?'Approved':'Generated');
  Object.assign(e,{ dateIssued:c.issuedAt||c.generatedAt||todayStr(), studentName:c.studentName, satsNo:c.satsNo||'', admissionNo:c.admissionNo||'',
    className:c.className, docType:'ಪ್ರಗತಿ ಪತ್ರಿಕೆ (Progress Report Card)', issuedTo:c.issuedTo||'', issuedBy:c.issuedBy||c.generatedBy||'',
    academicYear:c.academicYear, regStatus:st });
}
function pcDmy(d){ d=String(d||''); return /^\d{4}-\d{2}-\d{2}$/.test(d)?(d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4)):d; }

function buildProgressCardHTML(s,c){
  function grade(subj,exam){ return getStudentGrade(s.id,s.className,subj,exam); }
  function marksN(subj,exam){ return getStudentMarksNum(s.id,s.className,subj,exam); }
  function semGradeCalc(subj,sem){
    const exams=sem===1?['FA-1','FA-2','SA-1']:['FA-3','FA-4','SA-2'];
    let total=0; exams.forEach(ex=>total+=marksN(subj,ex));
    if(!total) return 'NE';
    return semTotalGrade(total,50);
  }
  const g=(subj,ex)=>{ const v=grade(subj,ex); return (v===''||v==null||v==='—')?'NE':v; };
  const sy=(String(c.academicYear||'').match(/(\d{4})/)||[])[1]; const startY=sy?+sy:2025;
  let totalWorking=0,totalPresent=0;
  const monthRows=PC_MONTHS.map(m=>{
    const y=m.m>=6?startY:startY+1;
    const a=getMonthlyAtt(s.id,s.className,y,m.m);
    totalWorking+=a.working; totalPresent+=a.present;
    return `<tr><td>${m.label}-${y}</td><td class="c">${a.working||''}</td><td class="c">${a.present||''}</td></tr>`;
  }).join('');
  const ns=c.nonScholastic||{};
  const docNo=c.docNo||pcDocNo(c,s);
  const web=location.host||'mdrsshedbarieoffice.in';
  const gen=pcDmy(c.generatedAt||todayStr())+(c.generatedTime?(' '+c.generatedTime):'');
  const url=getVerifyURL(docNo,'progresscard');
  const ayTxt=(String(c.academicYear||'').match(/(\d{4})\D+(\d{2,4})/)||null);
  const ayShow=ayTxt?(ayTxt[1]+'-'+ayTxt[2].slice(-2)):(c.academicYear||'');
  const subjKn={'Mathematics':'ಗಣಿತ','Drawing':'ಎಸ್.ಯು.ಪಿ.ಡಬ್ಲ್ಯೂ'};
  const head=`<div class="pcx-top"><span>SATS No. <b>${esc(s.satsNo||'')}</b></span><span>${pcDmy(c.generatedAt||todayStr())}</span></div>`;
  const foot=(n)=>`<div class="pcx-foot">
      <div class="pcx-bc"><div>${pcBarcode(docNo,34)}</div><div class="pcx-bcn">${esc(docNo)}</div></div>
      <div class="pcx-gen">Generated on ${esc(gen)}<br>${esc(web)}</div>
      <div class="pcx-qr" data-url="${esc(url)}"></div>
      <div class="pcx-pg">Page ${n} of 4</div>
    </div>`;
  const addr='<div class="pcx-addr">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265), ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320 | ದೂರವಾಣಿ: +91 97413 84751 | ಇ-ಮೇಲ್: mdrsbhatkal@gmail.com</div>';
  const page=(n,body,brk)=>`<div class="pcx-sheet${brk?' pcx-brk':''}"><div class="pcx-page">${head}${body}${foot(n)}</div>${addr}</div>`;
  const kv=(kn,en,v)=>`<tr><td class="pcx-l" colspan="1">${kn}<br><span>${en}</span></td><td colspan="5">${v}</td></tr>`;
  const p1=`<div class="pcx-logos"><img src="${PC_LOGO_GOV}" alt=""><div class="pcx-soc"><div class="k">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ</div><div class="e">Karnataka Residential Educational Institutions Society</div></div><img src="${PC_LOGO_SOC}" alt=""></div>
    <div class="pcx-school">MORARJI DESAAI RESIDENTIAL SCHOOL, HEBLE<br><span>SHEDBARI HEBLE</span></div>
    <div class="pcx-t1">ಪ್ರಗತಿ ಪತ್ರಿಕೆ</div><div class="pcx-t2">PROGRESS REPORT ${esc(ayShow)}</div>
    <div class="pcx-cls"><span>ತರಗತಿ : <u>&nbsp;&nbsp;${esc(s.className)}&nbsp;&nbsp;</u></span><span>Class : <u>&nbsp;&nbsp;${esc(s.className)}&nbsp;&nbsp;</u></span></div>
    <table class="pcx-tb"><colgroup>${'<col style="width:8.333%">'.repeat(12)}</colgroup>
      <tr><td class="pcx-l" colspan="3">ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು<br><span>Student Name</span></td><td colspan="9">${esc(s.studentNameEn||s.studentName)}</td></tr>
      <tr><td class="pcx-l" colspan="3">ತಂದೆಯ ಹೆಸರು<br><span>Father's Name</span></td><td colspan="9">${esc(s.fatherName||'')}</td></tr>
      <tr><td class="pcx-l" colspan="3">ತಾಯಿಯ ಹೆಸರು<br><span>Mother's Name</span></td><td colspan="9">${esc(s.motherName||'')}</td></tr>
      <tr><td class="pcx-l" colspan="3">ಜನ್ಮ ದಿನಾಂಕ<br><span>Date of Birth</span></td><td colspan="9">${esc(s.dob||'')}</td></tr>
      <tr><td class="pcx-l" colspan="3">ದಾಖಲಾತಿ ಸಂಖ್ಯೆ<br><span>Admission No.</span></td><td colspan="3">${esc(s.admissionNo||'')}</td><td class="pcx-l" colspan="3">ಎಸ್.ಎ.ಟಿ.ಎಸ್. ಸಂಖ್ಯೆ<br><span>SATS No.</span></td><td colspan="3">${esc(s.satsNo||'')}</td></tr>
      <tr><td class="pcx-l" colspan="2">ಎತ್ತರ<br><span>Height</span></td><td colspan="2">${s.height?esc(s.height)+' cm':''}</td><td class="pcx-l" colspan="2">ತೂಕ<br><span>Weight</span></td><td colspan="2">${s.weight?esc(s.weight)+' kg':''}</td><td class="pcx-l" colspan="2">ರಕ್ತದ ಗುಂಪು<br><span>Blood Group</span></td><td colspan="2">${esc(s.bloodGroup||'')}</td></tr>
    </table>`;
  const p2=`<div class="pcx-bar">Subject wise Results</div>
    <table class="pcx-tb pcx-m"><colgroup><col style="width:28%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:9%"></colgroup><thead>
      <tr><th style="text-align:left;">ಸೆಮಿಸ್ಟರ್ Semester</th><th colspan="4">ಪ್ರಥಮ First</th><th colspan="4">ಎರಡನೇ Second</th></tr>
      <tr><th style="text-align:left;width:26%;">ವಿಷಯ Subject</th><th>ಎಫ್‌ಎ<br>1<br>FA1</th><th>ಎಫ್‌ಎ<br>2<br>FA2</th><th>ಸಂ.ಮೌ<br>1<br>SA1</th><th>ಒಟ್ಟು ಶ್ರೇಣಿ/<br>Total grade</th><th>ಎಫ್‌ಎ<br>3<br>FA3</th><th>ಎಫ್‌ಎ<br>4<br>FA4</th><th>ಸಂ.ಮೌ<br>2<br>SA2</th><th>ಒಟ್ಟು ಶ್ರೇಣಿ/<br>Total grade</th></tr></thead>
      <tbody>${PC_SUBJECTS.map(sj=>`<tr><td class="sj">${subjKn[sj.key]||sj.kn} / ${sj.en}</td><td class="c">${g(sj.key,'FA-1')}</td><td class="c">${g(sj.key,'FA-2')}</td><td class="c">${g(sj.key,'SA-1')}</td><td class="c">${semGradeCalc(sj.key,1)}</td><td class="c">${g(sj.key,'FA-3')}</td><td class="c">${g(sj.key,'FA-4')}</td><td class="c">${g(sj.key,'SA-2')}</td><td class="c">${semGradeCalc(sj.key,2)}</td></tr>`).join('')}</tbody></table>
    <div class="pcx-key">A+ -90 to 100%, A -70 to 89%, B+ -50 to 69%, B -30 to 49%, C -below 30% NE - Not Entered</div>
    <table class="pcx-tb" style="margin-top:0;"><colgroup><col style="width:22%"><col style="width:66%"><col style="width:12%"></colgroup>
      <tr><td class="pcx-l" style="font-weight:400;">ಫಲಿತಾಂಶ RESULT</td><td colspan="2" class="c">${esc(c.result||'NE')}</td></tr>
      <tr><td class="pcx-l" rowspan="2" style="font-weight:400;">ಹಾಜರಿ ATTENDANCE</td><td>ಕೆಲಸದ ದಿನಗಳ ಒಟ್ಟು ಸಂಖ್ಯೆ / Total no of working Days</td><td class="c">${totalWorking}</td></tr>
      <tr><td>ವಿದ್ಯಾರ್ಥಿ ಹಾಜರಾದ ಒಟ್ಟು ದಿನಗಳ ಸಂಖ್ಯೆ / Total No. of days student attended</td><td class="c">${totalPresent}</td></tr></table>`;
  const p3=`<div class="pcx-bar">PART B – Non scholastic subjects</div>
    <table class="pcx-tb pcx-m"><thead><tr><th style="text-align:left;">ವಿಷಯಗಳು / Subjects</th><th style="width:22%;">ಪ್ರಥಮ ಸೆಮಿಸ್ಟರ್/<br>SA1</th><th style="width:22%;">ದ್ವಿತೀಯ ಸೆಮಿಸ್ಟರ್ /<br>SA2</th></tr></thead>
      <tbody>${NS_ITEMS.map(n=>`<tr><td class="sj">${n.kn} / ${n.en}</td><td class="c">${(ns[n.key]&&ns[n.key].sa1)||''}</td><td class="c">${(ns[n.key]&&ns[n.key].sa2)||''}</td></tr>`).join('')}</tbody></table>`;
  const sigCt=c.classTeacherSigned?cbDigiSign({signedBy:c.classTeacherName,signStamp:c.ctStamp||fmtDate(c.classTeacherSignedAt),signHost:c.ctHost,signIp:c.ctIp,signDevice:c.ctDevice,signDesig:'Class Teacher'},'','Progress Card verified'):'';
  const sigPr=c.principalSigned?cbDigiSign({signedBy:c.principalName,signStamp:c.prStamp||fmtDate(c.principalSignedAt),signHost:c.prHost,signIp:c.prIp,signDevice:c.prDevice},'','Progress Card approved'):'';
  const p4=`<div class="pcx-bar" style="font-size:13pt;">ಮಾಸಿಕ ಹಾಜರಾತಿ / Monthly Attendance</div>
    <table class="pcx-tb pcx-m"><thead><tr><th style="text-align:left;">ತಿಂಗಳು ವರ್ಷ / Month - Year</th><th style="width:27%;">ಕೆಲಸದ ದಿನಗಳ ಒಟ್ಟು<br>ಸಂಖ್ಯೆ<br>Total no of working Days</th><th style="width:33%;">ವಿದ್ಯಾರ್ಥಿ ಹಾಜರಾದ ಒಟ್ಟು ದಿನಗಳ<br>ಸಂಖ್ಯೆ<br>Total No. of days student attended</th></tr></thead>
      <tbody>${monthRows}<tr><td style="text-align:right;">Total</td><td class="c">${totalWorking}</td><td class="c">${totalPresent}</td></tr></tbody></table>
    <div class="pcx-note">IN PROGRESS REPORT CARD MAY MONTH ATTENDANCE INFORMATION IS NOT INCLUDED</div>
    <table class="pcx-tb" style="margin-top:26px;"><tr>
      <td style="width:50%;height:120px;vertical-align:bottom;text-align:center;">${sigCt?`<div style="display:flex;justify-content:center;margin-bottom:6px;">${sigCt}</div>`:''}ವರ್ಗ ಶಿಕ್ಷಕರ ರುಜು &nbsp;Class teacher signature</td>
      <td style="width:50%;vertical-align:bottom;text-align:center;">${sigPr?`<div style="display:flex;justify-content:center;margin-bottom:6px;">${sigPr}</div>`:''}ಮುಖ್ಯ ಗುರುಗಳ ರುಜು &nbsp;HM signature</td></tr></table>`;
  return `<div class="pcx-wrap">${page(1,p1,true)}${page(2,p2,true)}${page(3,p3,true)}${page(4,p4,false)}</div>`;
}

function renderDocIssue(){
  const reg=DB.docIssueRegister.slice().reverse();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📒 ದಾಖಲಾತಿ ವಿತರಣಾ ವಹಿ (Documents Issue Register)</h2>
    <div class="desc">ಶಾಲೆಯಿಂದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿತರಿಸಿದ ಎಲ್ಲಾ ದಾಖಲೆಗಳ ಅಧಿಕೃತ ವಹಿ — Home Page ನಲ್ಲಿ SATS/ದಾಖಲಾತಿ ಸಂಖ್ಯೆ ಮೂಲಕ ಪರಿಶೀಲಿಸಬಹುದು</div></div>
    <div class="note">🔗 Home Page → "Document Verification" ನಲ್ಲಿ SATS ಸಂಖ್ಯೆ ಅಥವಾ ದಾಖಲಾತಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ದಾಖಲೆ ವಿತರಣಾ ಸ್ಥಿತಿ ತಕ್ಷಣ ಪರಿಶೀಲಿಸಬಹುದು.</div>
    <div class="panel"><h3>📋 ವಿತರಿಸಿದ ದಾಖಲೆಗಳ ಪಟ್ಟಿ (${reg.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ದಾಖಲೆ ಸಂಖ್ಯೆ</th><th>ವಿತರಣಾ ದಿನಾಂಕ</th><th>ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು</th>
        <th>ತರಗತಿ</th><th>SATS</th><th>ದಾಖಲಾತಿ ಸಂ.</th>
        <th>ದಾಖಲೆ ಪ್ರಕಾರ</th><th>ವಿತರಿಸಿದ ವ್ಯಕ್ತಿ</th><th>FDA</th><th>Action</th>
      </tr></thead>
      <tbody>${reg.length? reg.map((d,i)=>`<tr>
        <td><span class="doc-issue-badge">${esc(d.docNo)}</span></td>
        <td>${fmtDate(d.dateIssued)}</td>
        <td><b>${esc(d.studentName)}</b></td>
        <td>${esc(d.className)}</td>
        <td>${esc(d.satsNo||'—')}</td>
        <td>${esc(d.admissionNo||'—')}</td>
        <td>${esc(d.docType)}</td>
        <td>${esc(d.issuedTo||'—')}</td>
        <td>${esc(d.issuedBy)}</td>
        <td><button class="btn btn-sm btn-outline" onclick="viewCardById('${d.cardId}')">👁 View Card</button></td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="10">ಯಾವುದೇ ದಾಖಲೆ ವಿತರಿಸಲಾಗಿಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="pcPreviewWrap"></div>`;
}

function renderSCTC(){
  const students = DB.students;
  const myDocs = DB.stDocuments.slice().reverse();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📜 SC / TC Generate</h2>
    <div style="margin:6px 0;"><button class="btn btn-gold" onclick="navigate('certimport')">⬆️ Offline Excel Upload (ಪರಿಶೀಲನೆಗಾಗಿ)</button></div>
    </div>

    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <h3 style="margin:0;">👤 ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (${students.length})</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-outline" onclick="downloadClassStudents('all')">⬇ All Excel</button>
          ${['6','7','8','9','10'].map(c=>`<button class="btn btn-sm btn-outline" onclick="downloadClassStudents('${c}')">⬇ ${c}ನೇ</button>`).join('')}
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr>
        <th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>SATS</th><th>ದಾಖಲಾತಿ ಸಂ.</th><th>Action</th>
      </tr></thead>
      <tbody>${students.length ? students.map(s=>{
        const sc = DB.stDocuments.filter(d=>d.studentId===s.id&&d.docType==='SC').pop();
        const tc = DB.stDocuments.filter(d=>d.studentId===s.id&&d.docType==='TC').pop();
        return `<tr>
          <td><b>${esc(s.studentName)}</b></td>
          <td>${esc(s.className)}</td>
          <td>${esc(s.satsNo||'—')}</td>
          <td>${esc(s.admissionNo||'—')}</td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-gold" onclick="openSCModal('${s.id}')">📜 ${sc?'SC (Re-gen)':'SC Generate'}</button>
            <button class="btn btn-sm btn-primary" onclick="openTCModal('${s.id}')">📋 ${tc?'TC (Re-gen)':'TC Generate'}</button>
            ${sc&&sc.status==='Ready to Issue'?`<button class="btn btn-sm btn-green" onclick="issueSCTC('${sc.id}')">✅ SC Issue</button>`:''}
            ${tc&&tc.status==='Ready to Issue'?`<button class="btn btn-sm btn-green" onclick="issueSCTC('${tc.id}')">✅ TC Issue</button>`:''}
          </td>
        </tr>`;
      }).join('') : `<tr class="empty-row"><td colspan="5">ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>

    <div class="panel"><h3>📋 ಎಲ್ಲಾ SC/TC ದಾಖಲೆಗಳ ಸ್ಥಿತಿ (${myDocs.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಪ್ರಕಾರ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ತರಗತಿ</th><th>Generate ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ (ಹಂತ)</th><th>ಡಾಕ್ ಸಂ.</th><th>Action</th>
      </tr></thead>
      <tbody>${myDocs.length ? myDocs.map(d=>`<tr>
        <td><span class="badge ${d.docType==='SC'?'badge-ok':'badge-info'}">${d.docType}</span></td>
        <td><b>${esc(d.studentName)}</b></td>
        <td>${esc(d.className)}</td>
        <td>${fmtDate(d.createdAt)}</td>
        <td>${sctcStepper(d,true)}</td>
        <td>${esc(d.docNo||'—')}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="viewSCTCDoc('${d.id}')">👁 ${d.status==='Sent to Principal'&&CURRENT_USER.role==='principal'?'View & Approve':'View / Print'}</button>
          ${d.status==='Draft'?`<button class="btn btn-sm btn-primary" onclick="sendSCTCToPrincipal('${d.id}')">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button> <button class="btn btn-sm btn-red" onclick="deleteSCTCDraft('${d.id}')">🗑</button>`:''}
          ${d.status==='Ready to Issue'?`<button class="btn btn-sm btn-green" onclick="issueSCTC('${d.id}')">✅ Issue</button>`:''}
          ${d.status==='Rejected'&&d.remarks?`<div class="small-muted" style="color:var(--red);">↩ ${esc(d.remarks)}</div>`:''}
        </td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="7">ಯಾವುದೇ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="sctcPreviewWrap"></div>`;
}

function openSCModal(studentId){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return;
  document.getElementById('pwModalBg').classList.add('show');
  const ay = defaultAcademicYear();
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:500px;">
    <h3>📜 ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ (SC) — ${esc(s.studentName)}</h3>
    <div class="kv"><b>ತರಗತಿ</b>${esc(s.className)}</div>
    <div class="kv"><b>ತಂದೆ/ತಾಯಿ</b>${esc([s.fatherName,s.motherName].filter(Boolean).join(' / ')||'—')}</div>
    <div class="kv"><b>SATS</b>${esc(s.satsNo||'—')}</div>
    <div class="kv"><b>DOB</b>${esc(fmtDate(s.dob))}</div>
    <div class="field"><label>ಶೈಕ್ಷಣಿಕ ಸಾಲು</label>
      <input id="sc_ay" value="${ay}"></div>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Cancel</button>
      <button class="btn btn-primary" onclick="generateSCDoc('${studentId}')">📜 Generate → Principal ಗೆ ಕಳುಹಿಸಿ</button>
      <button class="btn btn-gold" onclick="previewSCOnly('${studentId}')">👁 Preview</button>
    </div>
  </div>`;
}

function previewSCOnly(studentId){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return;
  const ay = document.getElementById('sc_ay')?.value || defaultAcademicYear();
  const fakeDoc = {id:'preview', docType:'SC', docNo:'PREVIEW', createdAt:todayStr(), academicYear:ay, principalSigned:false, principalSignedAt:null, principalName:null};
  document.getElementById('pwModalBg').classList.remove('show');
  const wrap = document.getElementById('sctcPreviewWrap');
  wrap.innerHTML = `<div class="panel" id="printArea">
    <div class="progress-card-preview-btns" style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-outline" onclick="navigate('sctc')">✕ ಮುಚ್ಚಿ</button>
    </div>
    ${buildSCHTML(s, fakeDoc)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function generateSCDoc(studentId){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return;
  const ay = document.getElementById('sc_ay')?.value || defaultAcademicYear();
  const doc = {
    id:uid(), docType:'SC', studentId, studentName:s.studentName,
    className:s.className, satsNo:s.satsNo||'', admissionNo:s.admissionNo||'',
    academicYear:ay, createdAt:todayStr(), createdBy:CURRENT_USER.name,
    status:'Draft', principalSigned:false, principalSignedAt:null,
    principalName:null, issuedAt:null, issuedBy:null, docNo:null
  };
  DB.stDocuments.push(doc); saveDB();
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ SC ಕರಡು (Draft) ಸಿದ್ಧ — ಪರಿಶೀಲಿಸಿ, Print ಮಾಡಿ, ನಂತರ Principal ಗೆ ಕಳುಹಿಸಿ');
  navigate('sctc'); viewSCTCDoc(doc.id);
}

function openTCModal(studentId){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return;
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:560px;max-height:80vh;overflow-y:auto;">
    <h3>📋 ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC) — ${esc(s.studentName)}</h3>
    <div class="form-grid">
      <div class="field"><label>ದಾಖಲಾತಿ ಸಂಖ್ಯೆ</label><input id="tc_adm" value="${esc(s.admissionNo||'')}"></div>
      <div class="field"><label>SATS ಸಂಖ್ಯೆ</label><input id="tc_sats" value="${esc(s.satsNo||'')}"></div>
      <div class="field"><label>ಪೂರ್ಣ ಹೆಸರು</label><input id="tc_name" value="${esc(s.studentName)}"></div>
      <div class="field"><label>ಜನ್ಮ ಸ್ಥಳ</label><input id="tc_birth" value="${esc(s.placeOfBirth||'')}"></div>
      <div class="field"><label>ತಾಲ್ಲೂಕು</label><input id="tc_taluk" value="${esc(s.taluk||'Bhatkal')}"></div>
      <div class="field"><label>ಜಿಲ್ಲೆ</label><input id="tc_dist" value="${esc(s.district||'Uttara Kannada')}"></div>
      <div class="field"><label>ರಾಜ್ಯ</label><input id="tc_state" value="Karnataka"></div>
      <div class="field"><label>ಲಿಂಗ</label><select id="tc_sex"><option ${s.gender==='ಗಂಡು'?'selected':''}>Male</option><option ${s.gender==='ಹೆಣ್ಣು'?'selected':''}>Female</option></select></div>
      <div class="field"><label>ರಾಷ್ಟ್ರೀಯತೆ</label><input id="tc_nat" value="Indian"></div>
      <div class="field"><label>ಧರ್ಮ</label><input id="tc_rel" value="${esc(s.religion||'')}"></div>
      <div class="field"><label>ಜಾತಿ</label><input id="tc_caste" value="${esc(s.caste||'')}"></div>
      <div class="field"><label>SC/ST?</label><select id="tc_scst"><option>No</option><option>Yes - SC</option><option>Yes - ST</option></select></div>
      <div class="field"><label>ತಂದೆಯ ಹೆಸರು</label><input id="tc_father" value="${esc(s.fatherName||'')}"></div>
      <div class="field"><label>ತಾಯಿಯ ಹೆಸರು</label><input id="tc_mother" value="${esc(s.motherName||'')}"></div>
      <div class="field"><label>ಜನ್ಮ ದಿನಾಂಕ</label><input id="tc_dob" value="${esc(s.dob||'')}"></div>
      <div class="field"><label>ತರಗತಿ (ಪದಗಳಲ್ಲಿ)</label><input id="tc_class" value="${esc(s.className?s.className+'th Standard':'')}" placeholder="e.g. Ninth Standard"></div>
      <div class="field"><label>ಕೊನೆಯ ಹಾಜರಾತಿ ದಿನಾಂಕ</label><input id="tc_lastatt" type="date" value="${todayStr()}"></div>
      <div class="field"><label>TC ಅರ್ಜಿ ದಿನಾಂಕ</label><input id="tc_appdate" type="date" value="${todayStr()}"></div>
      <div class="field"><label>ಒಟ್ಟು ಕೆಲಸದ ದಿನಗಳು</label><input id="tc_wdays" type="number" placeholder="e.g. 239"></div>
      <div class="field"><label>ಹಾಜರಾದ ದಿನಗಳು</label><input id="tc_adays" type="number" placeholder="e.g. 198"></div>
      <div class="field"><label>ಸ್ವಭಾವ/ನಡವಳಿಕೆ</label><input id="tc_char" value="Good"></div>
      <div class="field"><label>ಮಾಧ್ಯಮ</label><input id="tc_medium" value="English"></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Cancel</button>
      <button class="btn btn-primary" onclick="generateTCDoc('${studentId}')">📋 Generate → Principal ಗೆ</button>
    </div>
  </div>`;
}

function generateTCDoc(studentId){
  const s = DB.students.find(x=>x.id===studentId); if(!s) return;
  const g = id => document.getElementById(id)?.value||'';
  const tcData = {
    admNo:g('tc_adm'), satsNo:g('tc_sats'), name:g('tc_name'),
    placeOfBirth:g('tc_birth'), taluk:g('tc_taluk'), district:g('tc_dist'), state:g('tc_state'),
    sex:g('tc_sex'), nationality:g('tc_nat'), religion:g('tc_rel'), caste:g('tc_caste'),
    scst:g('tc_scst'), fatherName:g('tc_father'), motherName:g('tc_mother'),
    dob:g('tc_dob'), className:g('tc_class'), lastAttDate:g('tc_lastatt'),
    tcAppDate:g('tc_appdate'), workingDays:g('tc_wdays'), attendedDays:g('tc_adays'),
    character:g('tc_char'), medium:g('tc_medium')
  };
  const doc = {
    id:uid(), docType:'TC', studentId, studentName:s.studentName,
    className:s.className, satsNo:s.satsNo||'', admissionNo:s.admissionNo||'',
    createdAt:todayStr(), createdBy:CURRENT_USER.name,
    status:'Draft', tcData,
    principalSigned:false, principalSignedAt:null, principalName:null,
    issuedAt:null, issuedBy:null, docNo:null
  };
  DB.stDocuments.push(doc); saveDB();
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ TC ಕರಡು (Draft) ಸಿದ್ಧ — ಪರಿಶೀಲಿಸಿ, Print ಮಾಡಿ, ನಂತರ Principal ಗೆ ಕಳುಹಿಸಿ');
  navigate('sctc'); viewSCTCDoc(doc.id);
}

function issueSCTC(docId){
  const d = DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  const s = stuAny(d.studentId); if(!s) return;
  const issuedTo = prompt('ವಿತರಿಸಿದ ವ್ಯಕ್ತಿ ಹೆಸರು (Issued To):')||d.studentName;
  const docNo = 'ಮೊದೇವಶಾ/'+(d.docType==='SC'?'ಅಧ್ಯನ ಪ್ರಮಾಣ ಪತ್ರ':'ವರ್ಗಾ ಪ್ರಮಾಣ ಪತ್ರ')+'/'+nextSeq(d.docType.toLowerCase()+'cert')+'/'+(new Date().getFullYear()+'-'+(new Date().getFullYear()+1-2000));
  d.status='Issued'; d.issuedAt=todayStr(); d.issuedBy=CURRENT_USER.name; d.issuedTo=issuedTo; d.docNo=docNo;
  DB.docIssueRegister.push({
    id:uid(), docNo, dateIssued:todayStr(),
    studentName:d.studentName, satsNo:d.satsNo||'', admissionNo:d.admissionNo||'',
    className:d.className, docType:(d.docType==='SC'?'ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ (SC)':'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)'),
    issuedTo, issuedBy:CURRENT_USER.name, cardId:docId
  });
  saveDB();
  showToast('✅ '+d.docType+' Issue ಆಯಿತು! '+docNo);
  tcAfterIssue(d);
  viewSCTCDoc(docId);
}

function sctcStepper(d,compact){
  const L={'Draft':'ಕರಡು','Sent to Principal':'Principal ಬಳಿ','Ready to Issue':'ಅನುಮೋದಿತ','Issued':'ನೀಡಲಾಗಿದೆ','Rejected':'ತಿರಸ್ಕೃತ'};
  return `<span class="small-muted">${esc(L[d.status]||d.status||'')}</span>`;
}
function sctcStepperOld(d,compact){
  const steps=[['Draft','ಕರಡು'],['Sent to Principal','Principal'],['Ready to Issue','ಅನುಮೋದಿತ'],['Issued','ನೀಡಲಾಗಿದೆ']];
  const rej=d.status==='Rejected'; const idx=rej?1:Math.max(0,steps.findIndex(s=>s[0]===d.status));
  return `<div class="sctc-steps ${compact?'sm':''}">${steps.map((s,i)=>`<span class="st ${rej&&i===1?'rej':i<idx?'done':i===idx?'cur':''}">${rej&&i===1?'✕ Rejected':(i<idx?'✓ ':'')+s[1]}</span>`).join('<i>›</i>')}</div>`;
}
function sendSCTCToPrincipal(docId){
  const d=DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  if(!['Draft','Rejected'].includes(d.status)) return;
  if(!confirm('"'+d.studentName+'" — '+d.docType+' ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿದ್ದೀರಾ?\n\nOK ಒತ್ತಿದರೆ Principal ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.')) return;
  d.status='Sent to Principal'; d.sentAt=todayStr(); d.sentBy=CURRENT_USER.name; delete d.remarks;
  saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📋 '+d.docType+' Approve ಅಗತ್ಯ: '+d.studentName+' ('+d.className+'ನೇ) — SC/TC Approve ನಲ್ಲಿ View ಮಾಡಿ Approve ಮಾಡಿ');
  logAudit('SC/TC sent to Principal',d.docType,d.id,d.studentName);
  showToast('📤 Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); navigate('sctc');
}
function deleteSCTCDraft(docId){
  const d=DB.stDocuments.find(x=>x.id===docId); if(!d||d.status!=='Draft') return;
  if(!confirm('ಈ ಕರಡನ್ನು ಅಳಿಸುವುದೇ?')) return;
  DB.stDocuments=DB.stDocuments.filter(x=>x.id!==docId); saveDB(); showToast('🗑 ಕರಡು ಅಳಿಸಲಾಗಿದೆ'); navigate('sctc');
}
function viewSCTCDoc(docId){
  const d = DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  const s = stuAny(d.studentId); if(!s) return;
  const html = d.docType==='SC' ? buildSCHTML(s,d) : buildTCHTML(s,d);
  const wrap = document.getElementById('sctcPreviewWrap') || document.getElementById('content');
  const isP=CURRENT_USER.role==='principal', isF=CURRENT_USER.role==='fda';
  const draft=d.status==='Draft'||d.status==='Rejected';
  const btns=[`<button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>`];
  if(isF&&(d.status==='Draft'||d.status==='Rejected')) btns.push(`<button class="btn btn-primary" onclick="sendSCTCToPrincipal('${d.id}')">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button>`);
  if(isP&&d.status==='Sent to Principal') btns.push(`<button class="btn btn-green" onclick="approveSCTC('${d.id}')">✅ Approve & E-Sign</button>`,`<button class="btn btn-red" onclick="rejectSCTC('${d.id}')">✕ Reject</button>`);
  if(d.status==='Ready to Issue'&&(isF||isP)) btns.push(`<button class="btn btn-green" onclick="issueSCTC('${d.id}')">✅ Issue ${d.docType}</button>`);
  btns.push(`<button class="btn btn-outline" onclick="navigate(CURRENT_PAGE)">✕ ಮುಚ್ಚಿ</button>`);
  const note=(isF&&draft)?`<div class="note" style="margin-bottom:10px;">📝 <b>FDA ಪರಿಶೀಲನೆ:</b> ಕೆಳಗಿನ ವಿವರಗಳನ್ನು (ಹೆಸರು, ದಿನಾಂಕ, SATS, ತರಗತಿ ಇತ್ಯಾದಿ) ಸರಿಯಾಗಿ ಪರಿಶೀಲಿಸಿ. ತಪ್ಪಿದ್ದರೆ ಪಟ್ಟಿಯಲ್ಲಿ "Re-gen" ಮಾಡಿ. ಸರಿಯಿದ್ದರೆ Print ತೆಗೆದು "Principal ಗೆ ಕಳುಹಿಸಿ" ಒತ್ತಿ.${d.remarks?`<br><b style="color:var(--red);">Principal ಹಿಂತಿರುಗಿಸಿದ ಕಾರಣ: ${esc(d.remarks)}</b>`:''}</div>`
    :(isP&&d.status==='Sent to Principal')?`<div class="note" style="margin-bottom:10px;">✍️ <b>Principal:</b> ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ "Approve & E-Sign" ಅಥವಾ "Reject" ಮಾಡಿ.</div>`:'';
  wrap.innerHTML = `<div class="panel" id="printArea">
    <div class="progress-card-preview-btns sctc-bar">
      <div class="sctc-bar-top"><b>${d.docType==='SC'?'📜 ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ (SC)':'📋 ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)'} — ${esc(d.studentName)}</b></div>
      <div class="sctc-bar-btns">${btns.join('')}</div>
    </div>
    <div style="position:relative;">${html}</div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function buildSCHTML(s, doc){
  const parent = [s.fatherName,s.motherName].filter(Boolean).join(' / ')||'—';
  const issued = doc.status==='Issued' ? `<div style="text-align:right;color:green;font-size:10px;border:1px solid green;padding:3px 8px;display:inline-block;border-radius:4px;margin-bottom:8px;">✅ Issued: ${fmtDate(doc.issuedAt)} · ${esc(doc.docNo||'')}</div>` : '';
  return `<div class="letterhead-paper">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
        ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ &nbsp;|&nbsp; ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)<br>
        <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320<br>
        ದೂರವಾಣಿ: +91 97413 84751 &nbsp;|&nbsp; mdrsbhatkal@gmail.com
      </div>
    </div>
    ${issued}
    <div class="lh-meta"><span>ಸಂ: ${esc(doc.docNo||'ಮೊದೇವಶಾ/ಅಧ್ಯನ ಪ್ರಮಾಣ ಪತ್ರ/__/__')}</span><span>ದಿನಾಂಕ: ${fmtDate(doc.issuedAt||todayStr())}</span></div>
    <div class="lh-subject" style="text-align:center;font-size:17px;">ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ<br><span style="font-size:13px;font-weight:500;">(STUDY CERTIFICATE)</span></div>
    <div class="lh-body" style="line-height:2.2;font-size:14px;">
      ಪ್ರಮಾಣೀಕರಿಸುವುದೇನೆಂದರೆ, <b>${esc(s.studentName)}</b>, ತಂದೆ/ತಾಯಿ: <b>${esc(parent)}</b>, ಇವರ ದಾಖಲಾತಿ ಸಂಖ್ಯೆ: <b>${esc(s.admissionNo||'—')}</b>, SATS ಸಂಖ್ಯೆ: <b>${esc(s.satsNo||'—')}</b> ಜನ್ಮ ದಿನಾಂಕ: <b>${esc(fmtDate(s.dob)||'—')}</b> ಆಗಿದ್ದು, ಇವರು <b>${esc(doc.academicYear||defaultAcademicYear())}</b>ನೇ ಶೈಕ್ಷಣಿಕ ಸಾಲಿನಲ್ಲಿ <b>${esc(s.className||'—')}ನೇ</b> ತರಗತಿಯಲ್ಲಿ ಈ ಶಾಲೆಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ.<br><br>
      ಶಾಲೆಯ ದಾಖಲಾತಿ ಪುಸ್ತಕದಲ್ಲಿರುವ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ಮೇಲ್ಕಂಡ ವಿದ್ಯಾರ್ಥಿಯ ವಿವರಗಳು ಸತ್ಯ ಹಾಗೂ ಸರಿಯಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸಲಾಗುತ್ತದೆ.<br><br>
      ಈ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ವಿದ್ಯಾರ್ಥಿಯ/ಪಾಲಕರ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ನೀಡಲಾಗಿದೆ.
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:20px;align-items:flex-end;">
      <div>
        ${doc.docNo?`<div id="qr_sc_${doc.id}" style="margin-bottom:8px;width:90px;height:90px;"></div>
        <div style="font-size:9px;color:#666;">Scan to verify</div>`:''}
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;align-items:flex-end;">
      <div style="font-size:11px;color:#555;">
        ${doc.principalSigned?principalSignatureHTML(doc.principalName, doc.principalSignedAt, fmtDate(doc.principalSignedAt)):''}
      </div>
      <div style="text-align:center;min-width:220px;">
        <div style="margin-bottom:30px;"></div>
        <div style="border-top:1px solid #000;padding-top:5px;font-size:12px;">
          ಪ್ರಾಂಶುಪಾಲರು<br>
          ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)<br>
          ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ<br>
          ಉತ್ತರ ಕನ್ನಡ – 581320
        </div>
      </div>
    </div>
  </div>`;
}

function buildTCHTML(s, doc){
  const tc = doc.tcData||{};
  const issued = doc.status==='Issued' ? `<div style="color:green;font-size:10px;">✅ TC No: ${esc(doc.docNo||'')} | Issued: ${fmtDate(doc.issuedAt)}</div>` : '';
  return `<div class="letterhead-paper" style="font-family:Arial,sans-serif;font-size:12px;">
    <div style="text-align:right;font-size:10px;">Education-80 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ORIGINAL COPY</div>
    ${issued}
    <div style="text-align:center;font-size:16px;font-weight:bold;margin:8px 0;">SCHOOL TRANSFER CERTIFICATE</div>
    <div style="text-align:center;margin-bottom:8px;">TC No: <b>${esc(doc.docNo||'__________')}</b></div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
      ${tcRow('1. Name of the School','Morarji Desai Residential School (BC-265), Shedbari, Heble, Bhatkal, Uttara Kannada – 581320')}
      ${tcRow('2. Admission No',tc.admNo||s.admissionNo||'—')}
      ${tcRow('3. SATS / PEN No',tc.satsNo||s.satsNo||'—')}
      ${tcRow('4. Name of the pupil in full','<b>'+(tc.name||s.studentName)+'</b>')}
      ${tcRow('5. Place of Birth',tc.placeOfBirth||s.placeOfBirth||'—')}
      ${tcRow('6. Taluk',tc.taluk||s.taluk||'Bhatkal')}
      ${tcRow('7. District',tc.district||s.district||'Uttara Kannada')}
      ${tcRow('8. State',tc.state||'Karnataka')}
      ${tcRow('9. Sex &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 10. Nationality &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 11. Religion',(tc.sex||'—')+' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '+(tc.nationality||'Indian')+' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '+(tc.religion||s.religion||'—'))}
      ${tcRow('12. Caste',tc.caste||s.caste||'—')}
      ${tcRow("14. Father's Name",'<b>'+(tc.fatherName||s.fatherName||'—')+'</b>')}
      ${tcRow("Mother's Name",'<b>'+(tc.motherName||s.motherName||'—')+'</b>')}
      ${tcRow('15. Whether Scheduled Caste or Scheduled Tribe',tc.scst||'No')}
      ${tcRow('16. Qualified for promotion to higher standard','Yes')}
      ${tcRow('17. Date of Birth (in figures)','<b>'+(tc.dob?fmtDate(tc.dob):fmtDate(s.dob)||'—')+'</b>')}
      ${tcRow('18. Standard at time of leaving (in words)','<b>'+(tc.className||s.className+'th Standard'||'—')+'</b>')}
      ${tcRow('19. Subjects studied','Languages: Kannada, English, Hindi &nbsp; | &nbsp; Optional: Mathematics, Science, Social Science')}
      ${tcRow('20. Medium of Instruction',tc.medium||'English')}
      ${tcRow('21. Date of admission/promotion to that class',fmtDate(s.admissionDate)||'—')}
      ${tcRow('22. Whether paid all fees?','Yes')}
      ${tcRow('23. Fee Concession','As per Government norms')}
      ${tcRow('24. Scholarships','As per Government norms')}
      ${tcRow('25. Medical Examination','Done')}
      ${tcRow('26. Last day of attendance',fmtDate(tc.lastAttDate)||'—')}
      ${tcRow('27. Date of application for TC',fmtDate(tc.tcAppDate)||fmtDate(todayStr()))}
      ${tcRow('28. Date of issue of TC',fmtDate(doc.issuedAt||todayStr()))}
      ${tcRow('29. No. of working days up to leaving',tc.workingDays||'—')}
      ${tcRow('30. No. of days student attended',tc.attendedDays||'—')}
      ${tcRow('31. Character and Conduct',tc.character||'Good')}
    </table>
    ${doc.principalSigned?principalSignatureHTML(doc.principalName, doc.principalSignedAt, fmtDate(doc.principalSignedAt)):''}
    <div style="display:flex;justify-content:space-between;margin-top:32px;font-size:11px;">
      <div>Place: Shedbari, Bhatkal<br>Date: ${fmtDate(doc.issuedAt||todayStr())}</div>
      <div style="text-align:center;">
        <div style="margin-bottom:24px;"></div>
        <div style="border-top:1px solid #000;padding-top:4px;">Principal<br>Morarji Desai Residential School (BC-265)<br>Shedbari, Heble, Bhatkal</div>
      </div>
    </div>
  </div>`;
}

function tcRow(label, value){
  return `<tr><td style="padding:4px 8px;border:1px solid #ccc;width:55%;font-weight:600;">${label} :</td><td style="padding:4px 8px;border:1px solid #ccc;">${value}</td></tr>`;
}

function downloadClassStudents(cls){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const students = cls==='all' ? DB.students : DB.students.filter(s=>String(s.className)===String(cls));
  if(!students.length){ showToast('⚠ '+cls+'ನೇ ತರಗತಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಲ್ಲ'); return; }
  const header=['#','ದಾಖಲಾತಿ ಸಂ.','ಹೆಸರು','ಲಿಂಗ','ಜನ್ಮ ದಿನಾಂಕ','ತರಗತಿ','ತಂದೆ ಹೆಸರು','ತಾಯಿ ಹೆಸರು','ಮೊಬೈಲ್','SATS ಸಂ.','ಆಧಾರ್','PEN','ಜಾತಿ','ವರ್ಗ','ರಕ್ತ ಗುಂಪು','ಗ್ರಾಮ','ತಾಲ್ಲೂಕು','ಜಿಲ್ಲೆ','ಬ್ಯಾಂಕ್ ಖಾತೆ','IFSC'];
  const rows=students.map((s,i)=>[
    i+1,s.admissionNo||'',s.studentName||'',s.gender||'',s.dob||'',s.className||'',
    s.fatherName||'',s.motherName||'',s.mobile||'',s.satsNo||'',
    s.aadharNo||'',s.penNo||'',s.caste||'',s.category||'',
    s.bloodGroup||'',s.village||'',s.taluk||'',s.district||'',
    s.bankAcc||'',s.ifsc||''
  ]);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  ws['!cols']=header.map(()=>({wch:18}));
  XLSX.utils.book_append_sheet(wb,ws,'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ');
  XLSX.writeFile(wb,'MDRS_Students_Class_'+(cls==='all'?'All':cls)+'_'+todayStr()+'.xlsx');
  showToast('✅ Excel Download: Class '+cls);
}

function renderDocFiles(){
  const cat=DOC_FILE_CATS;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🗂️ ದಾಖಲೆ ಕಡತಗಳು (Document Files)</h2>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:20px;">
      ${cat.map(c=>{
        const items=(DB[c.key]||[]).length;
        return `<div class="panel" style="cursor:pointer;border-top:4px solid ${c.color};" onclick="viewDocFile('${c.key}')">
          <div style="font-size:36px;margin-bottom:8px;">${c.ic}</div>
          <div style="font-weight:700;font-size:14px;color:${c.color};font-family:var(--font-kn);">${c.label.split('(')[0]}</div>
          <div style="font-size:11.5px;color:var(--muted);">${c.label.split('(')[1]?.replace(')','')}</div>
          <div style="font-size:22px;font-weight:800;color:${c.color};margin-top:8px;">${items}</div>
          <div style="font-size:11px;color:var(--muted);">ದಾಖಲೆಗಳು</div>
        </div>`;
      }).join('')}
    </div>
    <div id="docFileDetail"></div>`;
}

function viewDocFile(key){
  const cat=DOC_FILE_CATS.find(c=>c.key===key); if(!cat) return;
  let items=DB[key]||[];
  let rows='';
  if(key==='leaveLettersFile'){
    rows=items.slice().reverse().map((f,i)=>{
      const l=(DB.leaveApplications||[]).find(x=>x.id===f.leaveId)||{};
      return `<tr>
        <td>${esc(f.fileNo||('LF-'+(i+1)))}</td>
        <td><b>${esc(f.staffName||l.staffName||'—')}</b></td>
        <td>${esc(f.leaveType||l.leaveType||'—')}</td>
        <td>${fmtDate(f.fromDate||l.fromDate)} → ${fmtDate(f.toDate||l.toDate)}</td>
        <td><b>${f.days||l.days||'—'}</b></td>
        <td>${fmtDate(f.approvedAt||f.addedAt)}</td>
        <td><span class="badge badge-ok">✅ Approved</span></td>
        <td><button class="btn btn-sm btn-gold" onclick="printLeaveLetterById('${f.leaveId}')">🖨️ Print</button> <button class="btn btn-sm btn-primary" onclick="leaveLetterPdf('${f.leaveId}')">⬇ PDF</button> ${dscBtns('leave',f.leaveId,(f.staffName||'')+' '+(f.leaveType||''))}</td>
      </tr>`;
    }).join('');
    if(!rows) rows='<tr class="empty-row"><td colspan="8">ಕಡತದಲ್ಲಿ ದಾಖಲೆ ಇಲ್ಲ. Principal Approve ಆದ ನಂತರ ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತ ಸೇರ್ಪಡೆ.</td></tr>';
    document.getElementById('docFileDetail').innerHTML=`<div class="panel"><h3>${cat.ic} ${cat.label.split('(')[0]}</h3>
      <div class="note" style="font-size:11px;">Principal Approve ಆದ ಎಲ್ಲಾ ರಜೆ ಅರ್ಜಿಗಳ Copy ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸೇರ್ಪಡೆಯಾಗುತ್ತದೆ — FDA ಮತ್ತು Principal ಇಬ್ಬರೂ ನೋಡಬಹುದು</div>
      <div class="table-wrap"><table><thead><tr><th>ಕಡತ ಸಂ.</th><th>ಸಿಬ್ಬಂದಿ</th><th>ರಜೆ ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ದಿನ</th><th>Approved ದಿನ</th><th>ಸ್ಥಿತಿ</th><th>Print</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
  } else {
    // For inward-linked doc files
    rows=items.map((f,i)=>{
      const inw=(DB.inward||[]).find(x=>x.id===f.inwardId)||{};
      return `<tr><td>${i+1}</td><td><b>${esc(f.fileNo||'—')}</b></td><td>${esc(f.subject||inw.subject||'—')}</td><td>${fmtDate(f.addedAt)}</td><td>${esc(f.addedBy||'—')}</td>
        <td><span class="badge badge-ok">${esc(f.status||'Filed')}</span></td></tr>`;
    }).join('');
    if(!rows) rows='<tr class="empty-row"><td colspan="6">ಕಡತದಲ್ಲಿ ಯಾವ ಪತ್ರ ಇಲ್ಲ. Inward → Principal Sign → FDA Transfer ಆದ ನಂತರ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.</td></tr>';
    document.getElementById('docFileDetail').innerHTML=`<div class="panel"><h3>${cat.ic} ${cat.label.split('(')[0]}</h3>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary" onclick="addToDocFile('${key}')">➕ ಪತ್ರ ಸೇರಿಸಿ (Inward ಮೂಲಕ)</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ಕಡತ ಸಂ.</th><th>ವಿಷಯ</th><th>ಸೇರಿಸಿದ ದಿನ</th><th>FDA</th><th>ಸ್ಥಿತಿ</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
  }
  document.getElementById('docFileDetail').scrollIntoView({behavior:'smooth'});
}

function addToDocFile(key){
  const cat=DOC_FILE_CATS.find(c=>c.key===key); if(!cat) return;
  // Show inward items that are closed/approved and not yet filed
  const filedInwardIds=(DB[key]||[]).map(f=>f.inwardId).filter(Boolean);
  const eligible=(DB.inward||[]).filter(i=>(i.status==='Closed'||i.status==='Replied')&&!filedInwardIds.includes(i.id));
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:560px;max-height:80vh;overflow-y:auto;">
    <h3>${cat.ic} ${cat.label.split('(')[0]} — ಪತ್ರ ಸೇರಿಸಿ</h3>
    ${eligible.length?`<div class="table-wrap"><table><thead><tr><th>Inward ಸಂ.</th><th>ವಿಷಯ</th><th>ದಿನಾಂಕ</th><th>Action</th></tr></thead>
    <tbody>${eligible.map(i=>`<tr>
      <td>${esc(i.inwardNo||'—')}</td>
      <td>${esc((i.subject||'').slice(0,40))}</td>
      <td>${fmtDate(i.receivedDate)}</td>
      <td><button class="btn btn-sm btn-primary" onclick="fileInwardDoc('${key}','${i.id}')">📂 File</button></td>
    </tr>`).join('')}</tbody></table></div>`:'<div class="small-muted" style="padding:20px;text-align:center;">File ಮಾಡಲು ಯೋಗ್ಯ Inward ಪತ್ರ ಇಲ್ಲ.<br>Inward → Principal Sign → Closed ಆಗಬೇಕು.</div>'}
    <div class="form-actions"><button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Close</button></div>
  </div>`;
}

function fileInwardDoc(key,inwardId){
  if(!DB[key]) DB[key]=[];
  const inw=(DB.inward||[]).find(x=>x.id===inwardId)||{};
  const fileNo=(DB[key].length+1).toString().padStart(3,'0')+'/'+new Date().getFullYear();
  DB[key].push({
    id:uid(), inwardId, fileNo:'F-'+fileNo,
    subject:inw.subject||'', status:'Filed',
    addedAt:todayStr(), addedBy:CURRENT_USER.name
  });
  saveDB();
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ ಕಡತಕ್ಕೆ ಸೇರಿಸಲಾಗಿದೆ — F-'+fileNo);
  viewDocFile(key);
}


/* ---------- v60: TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (TC Issued Students) ---------- */
function stuForCard(c){
  let s=stuAny(c.studentId); if(s) return s;
  const norm=x=>String(x||'').replace(/\s+/g,'').toLowerCase();
  s=(DB.students||[]).find(x=>c.satsNo&&norm(x.satsNo)===norm(c.satsNo))||(DB.students||[]).find(x=>norm(x.studentName)===norm(c.studentName)&&String(x.className)===String(c.className));
  if(s) return Object.assign({},s,{id:c.studentId});
  const t=(DB.tcIssuedStudents||[]).find(x=>(c.satsNo&&norm(x.satsNo)===norm(c.satsNo))||(norm(x.studentName)===norm(c.studentName)&&String(x.className)===String(c.className)));
  if(t) return Object.assign({},t,{id:c.studentId});
  return {id:c.studentId,studentName:c.studentName,className:c.className,satsNo:c.satsNo||'',admissionNo:c.admissionNo||''};
}
function stuAny(id){
  const s=DB.students.find(x=>x.id===id); if(s) return s;
  const t=(DB.tcIssuedStudents||[]).find(x=>x._origId===id); if(!t) return null;
  return Object.assign({},t,{id:t._origId});
}
function tcAfterIssue(d){
  if(!d||d.docType!=='TC') return;
  if(!DB.students.some(x=>x.id===d.studentId)) return;
  if(!confirm('TC ನೀಡಲಾಗಿದೆ.\n\n"'+d.studentName+'" ಅವರನ್ನು ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಯಿಂದ ತೆಗೆದು "TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ"ಗೆ ಸರಿಸುವುದೇ?')) return;
  tcMoveStudent(d);
}
function tcMoveStudent(d){
  const i=DB.students.findIndex(x=>x.id===d.studentId); if(i<0) return;
  const s=DB.students[i]; if(!DB.tcIssuedStudents) DB.tcIssuedStudents=[];
  const rec=Object.assign({},s,{id:'tci_'+s.id,_origId:s.id,tcDocId:d.id,tcIssuedNo:d.docNo||'',tcIssueDate:d.issuedAt||todayStr(),tcIssuedBy:d.issuedBy||CURRENT_USER.name,tcIssuedTo:d.issuedTo||'',lastClass:s.className,movedAt:todayStr(),movedBy:CURRENT_USER.name});
  DB.tcIssuedStudents.push(rec); DB.students.splice(i,1);
  logAudit('TC Issued — student moved','Students',s.id,`${s.studentName} (${s.className}) ${d.docNo||''}`);
  saveDB(); showToast('✅ '+s.studentName+' — "TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ"ಗೆ ಸರಿಸಲಾಗಿದೆ');
}
function renderTCIssued(){
  const list=(DB.tcIssuedStudents||[]).slice().sort((a,b)=>String(b.tcIssueDate||'').localeCompare(String(a.tcIssueDate||'')));
  const q=((document.getElementById('tci_q')||{}).value||'').trim().toLowerCase();
  const cf=(document.getElementById('tci_c')||{}).value||'';
  const rows=list.filter(s=>(!cf||String(s.lastClass)===cf)&&(!q||[s.studentName,s.studentNameEn,s.satsNo,s.admissionNo,s.tcIssuedNo].join(' ').toLowerCase().includes(q)));
  const canEdit=CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🚪 TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳು (${list.length})</h2>
    <div class="desc">TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳು ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಯಿಂದ ಇಲ್ಲಿಗೆ ಬರುತ್ತಾರೆ. ತರಗತಿ ಸಂಖ್ಯೆ, ಹಾಜರಾತಿ, ಅಂಕ ಪಟ್ಟಿಗಳಲ್ಲಿ ಇನ್ನು ಕಾಣುವುದಿಲ್ಲ.</div></div>
    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <input id="tci_q" placeholder="🔍 ಹೆಸರು / SATS / TC ಸಂಖ್ಯೆ" value="${esc(q)}" oninput="renderTCIssued();document.getElementById('tci_q').focus()" style="flex:1;min-width:200px;">
        <select id="tci_c" onchange="renderTCIssued()"><option value="">ಎಲ್ಲಾ ತರಗತಿ</option>${['6','7','8','9','10'].map(c=>`<option ${cf===c?'selected':''}>${c}</option>`).join('')}</select>
        <button class="btn btn-green" onclick="tcIssuedExcel()">⬇ Excel</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>SATS</th><th>ದಾಖಲಾತಿ ಸಂ.</th><th>TC ಸಂಖ್ಯೆ</th><th>TC ದಿನಾಂಕ</th><th>ನೀಡಿದವರು</th><th>Action</th></tr></thead>
      <tbody>${rows.length?rows.map((s,i)=>`<tr><td>${i+1}</td><td><b>${esc(s.studentName)}</b>${s.studentNameEn?`<br><span class="small-muted">${esc(s.studentNameEn)}</span>`:''}</td><td>${esc(s.lastClass||s.className||'')}</td><td>${esc(s.satsNo||'—')}</td><td>${esc(s.admissionNo||'—')}</td><td>${esc(s.tcIssuedNo||'—')}</td><td>${fmtDate(s.tcIssueDate)}</td><td>${esc(s.tcIssuedBy||'')}</td>
        <td class="actions-cell">${s.tcDocId?`<button class="btn btn-sm btn-outline" onclick="viewSCTCDoc('${s.tcDocId}')">👁 TC</button>`:''}${canEdit?` <button class="btn btn-sm btn-gold" onclick="tcReadmit('${s.id}')">↩ ಮತ್ತೆ ಸೇರಿಸಿ</button>`:''}</td></tr>`).join(''):`<tr class="empty-row"><td colspan="9">ಯಾವುದೇ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div><div id="sctcPreviewWrap"></div>`;
}
function tcReadmit(binId){
  const t=(DB.tcIssuedStudents||[]).find(x=>x.id===binId); if(!t) return;
  if(!confirm('"'+t.studentName+'" ಅವರನ್ನು ಮತ್ತೆ ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಗೆ ಸೇರಿಸುವುದೇ? (ಹಳೆಯ ಅಂಕ/ಹಾಜರಾತಿ ದಾಖಲೆಗಳು ಹೊಸ ದಾಖಲೆಗೆ ಜೋಡಣೆಯಾಗುವುದಿಲ್ಲ)')) return;
  if(t.satsNo&&DB.students.some(s=>normSats(s.satsNo)===normSats(t.satsNo))){ showToast('⚠ ಇದೇ SATS ಇರುವ ವಿದ್ಯಾರ್ಥಿ ಈಗಾಗಲೇ ಇದ್ದಾರೆ'); return; }
  const r=Object.assign({},t); ['id','_origId','tcDocId','tcIssuedNo','tcIssueDate','tcIssuedBy','tcIssuedTo','lastClass','movedAt','movedBy','_mt'].forEach(k=>delete r[k]); r.id=uid();
  DB.students.push(r); DB.tcIssuedStudents=DB.tcIssuedStudents.filter(x=>x.id!==binId);
  logAudit('TC student re-admitted','Students',r.id,r.studentName); saveDB(); showToast('✅ ಮತ್ತೆ ಸೇರಿಸಲಾಗಿದೆ'); renderTCIssued();
}
function tcIssuedExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const L=(DB.tcIssuedStudents||[]).slice().sort((a,b)=>String(a.tcIssueDate||'').localeCompare(String(b.tcIssueDate||'')));
  const aoa=[['ಕ್ರ.ಸಂ','ಹೆಸರು (ಕನ್ನಡ)','Name (English)','ತರಗತಿ','ಲಿಂಗ','SATS','ದಾಖಲಾತಿ ಸಂ.','ಜನ್ಮ ದಿನಾಂಕ','ತಂದೆ','ತಾಯಿ','TC ಸಂಖ್ಯೆ','TC ದಿನಾಂಕ','ನೀಡಿದವರು','ಪಡೆದವರು']];
  L.forEach((s,i)=>aoa.push([i+1,s.studentName||'',s.studentNameEn||'',s.lastClass||s.className||'',s.gender||'',String(s.satsNo||''),s.admissionNo||'',s.dob?fmtDate(s.dob):'',s.fatherName||'',s.motherName||'',s.tcIssuedNo||'',s.tcIssueDate?fmtDate(s.tcIssueDate):'',s.tcIssuedBy||'',s.tcIssuedTo||'']));
  const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!cols']=[6,26,24,8,8,14,12,12,22,22,30,12,18,18].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'TC Issued'); XLSX.writeFile(wb,'TC_Issued_Students_'+todayStr()+'.xlsx');
}

;(window.__LOADED=window.__LOADED||[]).push('documents');
