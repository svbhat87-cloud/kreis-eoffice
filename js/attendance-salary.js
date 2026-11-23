/* =====================================================================
   KREIS e-Office v35 — attendance-salary.js
   ಹಾಜರಾತಿ / ವೇತನ / ಪ್ರಶ್ನೆ ಪತ್ರ — Staff attendance, salary slips, question papers
   ===================================================================== */
function renderQPUpload(){
  const myQPs=DB.questionPapers.filter(q=>q.createdBy===CURRENT_USER.name).slice().reverse();
  QP_FILE_DATA=null;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📝 ಪ್ರಶ್ನೆ ಪತ್ರ ಸಲ್ಲಿಕೆ (Question Paper)</h2>
    </div>
    <div class="panel"><h3>➕ ಹೊಸ ಪ್ರಶ್ನೆ ಪತ್ರ</h3>
      <div class="form-grid">
        <div class="field"><label>ತರಗತಿ <span class="req-star">*</span></label>
          <select id="qp_class">${QP_CLASSES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>ವಿಷಯ <span class="req-star">*</span></label>
          <select id="qp_subject">${SUBJECTS.map(s=>`<option>${esc(s)}</option>`).join('')}</select></div>
        <div class="field"><label>ಪರೀಕ್ಷೆ <span class="req-star">*</span></label>
          <select id="qp_exam">${QP_EXAMS_LIST.map(e=>`<option>${esc(e)}</option>`).join('')}</select></div>
        <div class="field"><label>ಅಧ್ಯಾಯ / ಅಂಕ ವಿವರ (ಐಚ್ಛಿಕ)</label>
          <input id="qp_unit" placeholder="ಉದಾ: Chapter 1-3, Max Marks 20"></div>
      </div>

      <div class="qp-type-tabs">
        <div class="qp-type-tab active" id="qtab_type" onclick="switchQPTab('type')">✏️ ಆನ್‌ಲೈನ್ ಟೈಪ್ ಮಾಡಿ</div>
        <div class="qp-type-tab" id="qtab_upload" onclick="switchQPTab('upload')">📎 PDF / Word ಅಪ್‌ಲೋಡ್ ಮಾಡಿ</div>
      </div>

      <div id="qp_type_panel">
        <div class="field"><label>ಪ್ರಶ್ನೆ ಪತ್ರ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ</label>
        <textarea class="qp-online-editor" id="qp_content" placeholder="ಇಲ್ಲಿ ಪ್ರಶ್ನೆ ಪತ್ರ ಟೈಪ್ ಮಾಡಿ...

ಉದಾ:
Section A — ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ 1 ಅಂಕ                    (10 × 1 = 10)
1.
2.

Section B — ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ 2 ಅಂಕ                    (5 × 2 = 10)
3.
4."></textarea></div>
      </div>

      <div id="qp_upload_panel" style="display:none;">
        <div class="qp-upload-zone" onclick="document.getElementById('qp_file_input').click()">
          <input type="file" id="qp_file_input" accept=".pdf,.doc,.docx" onchange="onQPFileSelect(this)">
          <div style="font-size:28px;margin-bottom:8px;">📎</div>
          <div style="font-weight:700;font-size:13.5px;">PDF ಅಥವಾ Word ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ</div>
          <div class="small-muted" style="margin-top:4px;">Click ಮಾಡಿ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ</div>
        </div>
        <div id="qp_file_display" style="margin-top:8px;min-height:22px;"></div>
        <div class="note" style="margin-top:8px;">⚠ ಗರಿಷ್ಠ ಗಾತ್ರ: 1.5 MB. ದೊಡ್ಡ ಫೈಲ್ compress ಮಾಡಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.</div>
      </div>

      <div class="form-actions" style="margin-top:14px;">
        <button class="btn btn-primary" onclick="submitQP()">✅ ಪ್ರಶ್ನೆ ಪತ್ರ ಸಲ್ಲಿಸಿ → Examination Incharge ಗೆ</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ನನ್ನ ಸಲ್ಲಿಕೆಗಳು (${myQPs.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ತರಗತಿ</th><th>ವಿಷಯ</th><th>ಪರೀಕ್ಷೆ</th><th>ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>
      ${myQPs.length? myQPs.map(q=>`<tr>
        <td><b>${esc(q.className)}ನೇ</b></td><td>${esc(q.subject)}</td><td>${esc(q.examType)}</td>
        <td>${q.fileData?'📎 '+esc(q.fileName):'✏️ Typed'}</td>
        <td>${fmtDate(q.submittedAt)}</td>
        <td><span class="badge ${q.status==='Print Requested'||q.status==='FDA Printed'?'badge-ok':q.status==='Submitted'?'badge-progress':'badge-draft'}">${esc(q.status)}</span></td>
        <td>${q.status==='Submitted'?`<button class="btn btn-sm btn-red" onclick="deleteQP('${q.id}')">🗑</button>`:'<span class="small-muted">—</span>'}</td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="7">ಇನ್ನೂ ಯಾವುದೇ ಸಲ್ಲಿಕೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>`;
}

function switchQPTab(tab){
  QP_UPLOAD_TAB=tab;
  document.getElementById('qp_type_panel').style.display = tab==='type' ? '' : 'none';
  document.getElementById('qp_upload_panel').style.display = tab==='upload' ? '' : 'none';
  document.getElementById('qtab_type').classList.toggle('active', tab==='type');
  document.getElementById('qtab_upload').classList.toggle('active', tab==='upload');
  if(tab==='type') QP_FILE_DATA=null;
}

function onQPFileSelect(input){
  const file=input.files[0]; if(!file){ QP_FILE_DATA=null; return; }
  if(file.size > 1.5*1024*1024){
    showToast('⚠ ಫೈಲ್ ಗಾತ್ರ 1.5MB ಮೀರಿದೆ — ದಯವಿಟ್ಟು compress ಮಾಡಿ');
    input.value=''; QP_FILE_DATA=null;
    document.getElementById('qp_file_display').textContent='';
    return;
  }
  document.getElementById('qp_file_display').innerHTML=`<span class="small-muted">⏳ ಲೋಡ್ ಆಗುತ್ತಿದೆ...</span>`;
  const reader=new FileReader();
  reader.onload=e=>{
    QP_FILE_DATA={name:file.name, data:e.target.result, type:file.type};
    document.getElementById('qp_file_display').innerHTML=`<span style="color:var(--green);font-weight:700;">✅ ${esc(file.name)} (${(file.size/1024).toFixed(1)} KB) — ಸಿದ್ಧ</span>`;
  };
  reader.onerror=()=>{ showToast('⚠ ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ'); };
  reader.readAsDataURL(file);
}

function submitQP(){
  const cls=document.getElementById('qp_class').value;
  const subject=document.getElementById('qp_subject').value;
  const exam=document.getElementById('qp_exam').value;
  const unit=document.getElementById('qp_unit').value;
  let content='', fileName='', fileData='';
  if(QP_UPLOAD_TAB==='type'){
    content=(document.getElementById('qp_content').value||'').trim();
    if(!content){ showToast('⚠ ಪ್ರಶ್ನೆ ಪತ್ರ ಟೈಪ್ ಮಾಡಿ'); return; }
  } else {
    if(!QP_FILE_DATA){ showToast('⚠ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಲೋಡ್ ಆಗಲು ಕಾಯಿರಿ'); return; }
    fileName=QP_FILE_DATA.name; fileData=QP_FILE_DATA.data;
  }
  const qp={
    id:uid(), className:cls, subject, examType:exam, unit,
    content, fileName, fileData,
    createdBy:CURRENT_USER.name, submittedAt:todayStr(),
    status:'Submitted', printRequestedAt:null, printedAt:null
  };
  DB.questionPapers.push(qp); saveDB();
  const examHead=STAFF.find(s=>s.hrmsId===EXAM_HEAD_HRMS);
  if(examHead) pushNotification(examHead.name,'📋 ಹೊಸ QP ಸ್ವೀಕರಿಸಿದೆ: '+cls+'ನೇ '+subject+' ('+exam+') — '+CURRENT_USER.name);
  QP_FILE_DATA=null;
  showToast('✅ ಪ್ರಶ್ನೆ ಪತ್ರ ಸಲ್ಲಿಸಲಾಗಿದೆ — Examination Incharge Praveen Naik ಗೆ ತಲುಪಿದೆ');
  navigate('qpupload');
}

function renderQPDashboard(){
  const amHead=isExamHead(), amPrincipal=CURRENT_USER.role==='principal', amFDA=CURRENT_USER.role==='fda';
  const showAll=amHead||amPrincipal||amFDA;
  const allQPs=DB.questionPapers.slice().reverse();
  const displayQPs=showAll ? allQPs : allQPs.filter(q=>q.createdBy===CURRENT_USER.name);
  const newQPs=allQPs.filter(q=>q.status==='Submitted').length;
  const sentToFDA=allQPs.filter(q=>q.status==='Print Requested').length;
  const printed=allQPs.filter(q=>q.status==='FDA Printed').length;

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 QP ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Examination Head)</h2>
    <div class="desc">${amHead?'Examination Incharge — Praveen Naik (0100139283)':showAll?'Principal / FDA — ಎಲ್ಲಾ QP ವೀಕ್ಷಣೆ':'ನಿಮ್ಮ ಸಲ್ಲಿಕೆಗಳ ಸ್ಥಿತಿ'}</div></div>

    ${showAll?`<div class="cards-grid">
      <div class="stat-card"><div class="n">${newQPs}</div><div class="l">📥 ಹೊಸ QP ಬಂದಿವೆ</div></div>
      <div class="stat-card"><div class="n">${sentToFDA}</div><div class="l">🖨️ FDA ಗೆ ಕಳುಹಿಸಿದ</div></div>
      <div class="stat-card"><div class="n">${printed}</div><div class="l">✅ ಮುದ್ರಣ ಆಗಿದೆ</div></div>
      <div class="stat-card"><div class="n">${allQPs.length}</div><div class="l">ಒಟ್ಟು QP ಗಳು</div></div>
    </div>`:''}

    <div class="panel"><h3>${amHead?'📥 ಬಂದ ಪ್ರಶ್ನೆ ಪತ್ರಗಳ ಪಟ್ಟಿ':'📋 ಸ್ಥಿತಿ'} (${displayQPs.length})</h3>
    <div class="table-wrap"><table><thead><tr>
      <th>ತರಗತಿ</th><th>ವಿಷಯ</th><th>ಪರೀಕ್ಷೆ</th><th>ಶಿಕ್ಷಕರು</th><th>ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
    </tr></thead><tbody>
    ${displayQPs.length? displayQPs.map(q=>`<tr>
      <td><b>${esc(q.className)}ನೇ</b></td>
      <td>${esc(q.subject)}</td>
      <td>${esc(q.examType)}</td>
      <td>${esc(q.createdBy)}</td>
      <td>${q.fileData?`<span class="badge badge-info">📎 ${esc(q.fileName)}</span>`:'<span class="badge badge-draft">✏️ Typed</span>'}</td>
      <td>${fmtDate(q.submittedAt)}</td>
      <td><span class="badge ${q.status==='FDA Printed'?'badge-ok':q.status==='Print Requested'?'badge-ok':q.status==='Submitted'?'badge-progress':'badge-draft'}">${esc(q.status)}</span></td>
      <td class="actions-cell">
        ${q.content?`<button class="btn btn-sm btn-outline" onclick="previewTypedQP('${q.id}')">👁 Preview</button>`:''}
        ${amHead && q.status==='Submitted'?`
          <div class="qp-print-btn-wrap">
            <button class="btn btn-gold" onclick="requestQPPrint('${q.id}')">🖨️ ಮುದ್ರಣಕ್ಕಾಗಿ FDA ಗೆ ಕಳುಹಿಸಿ</button>
            <div class="qp-print-hint">ಈ ಬಟನ್ ಒತ್ತಿದರೆ ಈ ಪ್ರಶ್ನೆ ಪತ್ರ FDA ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಮುದ್ರಣಕ್ಕಾಗಿ ಕಳುಹಿಸಲಾಗುತ್ತದೆ</div>
          </div>`:''}
        ${q.status==='Print Requested'?'<span class="badge badge-ok">✅ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ</span>':''}
        ${q.status==='FDA Printed'?'<span class="badge badge-ok">✅ ಮುದ್ರಣ ಮಾಡಿದ್ದಾರೆ</span>':''}
        ${(amPrincipal||amFDA||amHead)?`<button class="btn btn-sm btn-red" onclick="deleteQP('${q.id}')">🗑</button>`:''}
      </td>
    </tr>`).join('') : `<tr class="empty-row"><td colspan="8">ಯಾವುದೇ ಪ್ರಶ್ನೆ ಪತ್ರ ಇಲ್ಲ.</td></tr>`}
    </tbody></table></div></div>
    <div id="qpPreviewWrap"></div>`;
}

function deleteQP(qpId){
  const qp=DB.questionPapers.find(q=>q.id===qpId); if(!qp) return;
  const isOwner=qp.createdBy===CURRENT_USER.name;
  const isAdmin=CURRENT_USER.role==='principal'||CURRENT_USER.role==='fda'||isExamHead();
  if(!isAdmin && !(isOwner && qp.status==='Submitted')){
    showToast('⚠ ಇದನ್ನು ಅಳಿಸುವ ಅನುಮತಿ ನಿಮಗಿಲ್ಲ');
    return;
  }
  if(!confirm(`"${qp.className}ನೇ ${qp.subject} (${qp.examType})" ಪ್ರಶ್ನೆ ಪತ್ರ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ? ಇದನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಆಗುವುದಿಲ್ಲ.`)) return;
  logAudit('Delete','QuestionPaper',qpId,`${qp.className}ನೇ ${qp.subject} (${qp.examType}) — ${qp.createdBy}`);
  DB.questionPapers=DB.questionPapers.filter(q=>q.id!==qpId);
  saveDB();
  showToast('🗑 ಅಳಿಸಲಾಗಿದೆ');
  navigate(CURRENT_PAGE);
}

function requestQPPrint(qpId){
  const qp=DB.questionPapers.find(q=>q.id===qpId); if(!qp) return;
  if(!confirm(`"${qp.className}ನೇ ${qp.subject} (${qp.examType})" ಪ್ರಶ್ನೆ ಪತ್ರ FDA ಗೆ ಮುದ್ರಣಕ್ಕಾಗಿ ಕಳುಹಿಸುವುದೇ?`)) return;
  qp.status='Print Requested'; qp.printRequestedAt=todayStr(); saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'🖨️ QP ಮುದ್ರಣ ವಿನಂತಿ — '+qp.className+'ನೇ '+qp.subject+' ('+qp.examType+') — Exam Head ಅನುಮೋದಿಸಿದ್ದಾರೆ. FDA Dashboard ನಲ್ಲಿ Download ಮಾಡಿ.'));
  showToast('✅ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — FDA ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ Download ಲಭ್ಯ');
  navigate('qpdashboard');
}

function previewTypedQP(qpId){
  const qp=DB.questionPapers.find(q=>q.id===qpId); if(!qp||!qp.content) return;
  document.getElementById('qpPreviewWrap').innerHTML=`<div class="panel" id="printArea">
    <div class="letterhead-paper" style="min-height:auto;">
      <div class="lh-top" style="border-bottom:2px solid #173657;padding-bottom:10px;margin-bottom:12px;">
                <div class="lh-org">
          <div class="l1">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</div>
          ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320
        </div>
      </div>
      <div style="text-align:center;font-weight:700;font-size:14.5px;margin-bottom:14px;">
        ${esc(qp.className)}ನೇ ತರಗತಿ | ${esc(qp.subject)} | ${esc(qp.examType)}
        ${qp.unit?'<br><span style="font-weight:500;font-size:12.5px;">'+esc(qp.unit)+'</span>':''}
      </div>
      <pre style="white-space:pre-wrap;font-family:var(--font-kn);font-size:13.5px;line-height:1.9;">${esc(qp.content)}</pre>
    </div>
    <div class="form-actions">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF ಆಗಿ ಉಳಿಸಿ</button>
      <button class="btn btn-outline" onclick="document.getElementById('qpPreviewWrap').innerHTML=''">✕ ಮುಚ್ಚಿ</button>
    </div>
  </div>`;
  document.getElementById('qpPreviewWrap').scrollIntoView({behavior:'smooth'});
}

function renderQPFDA(){
  let html=`<div class="page-head"><h2>🖨️ ಪ್ರಶ್ನೆ ಪತ್ರ ಮುದ್ರಣ — FDA Dashboard</h2>
    <div class="desc">Examination Head ಒಪ್ಪಿಗೆ ಕೊಟ್ಟ ನಂತರ ಮಾತ್ರ ಡೌನ್‌ಲೋಡ್ / ಮುದ್ರಣ ಲಭ್ಯ. ತರಗತಿ ಮತ್ತು ವಿಷಯ ಪ್ರಕಾರ ವಿಂಗಡಿಸಲಾಗಿದೆ.</div></div>`;

  if(!DB.questionPapers.length){
    html+=`<div class="panel"><div class="small-muted" style="text-align:center;padding:30px;">ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಪತ್ರ ಸ್ವೀಕರಿಸಿಲ್ಲ.</div></div>`;
    document.getElementById('content').innerHTML=html; return;
  }

  QP_CLASSES.forEach(cls=>{
    const clsQPs=DB.questionPapers.filter(q=>q.className===cls);
    if(!clsQPs.length) return;
    const readyCt=clsQPs.filter(q=>q.status==='Print Requested').length;
    html+=`<div class="panel"><h3>${cls}ನೇ ತರಗತಿ ${readyCt>0?`<span class="badge badge-ok">${readyCt} ಮುದ್ರಣಕ್ಕೆ ಸಿದ್ಧ</span>`:''}</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ವಿಷಯ</th><th>ಪರೀಕ್ಷೆ</th><th>ಶಿಕ್ಷಕರು</th><th>ಪ್ರಕಾರ</th><th>ಅಂಕ ವಿವರ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>
      ${clsQPs.map(q=>`<tr>
        <td><b>${esc(q.subject)}</b></td>
        <td>${esc(q.examType)}</td>
        <td>${esc(q.createdBy)}</td>
        <td>${q.fileData?'📎 '+esc(q.fileName):'✏️ Typed'}</td>
        <td>${esc(q.unit||'—')}</td>
        <td><span class="badge ${q.status==='Print Requested'?'badge-ok':q.status==='FDA Printed'?'badge-ok':'badge-progress'}">${esc(q.status)}</span></td>
        <td class="actions-cell">
          ${q.status==='Print Requested'?
            `<button class="btn btn-primary btn-sm" onclick="downloadQP('${q.id}')">⬇ Download</button>
             <button class="btn btn-green btn-sm" onclick="markQPPrinted('${q.id}')">✅ ಮುದ್ರಣ ಆಯ್ತು</button>`:
          q.status==='FDA Printed'?
            `<button class="btn btn-outline btn-sm" onclick="downloadQP('${q.id}')">⬇ Re-Download</button>
             <span class="badge badge-ok">✅ Printed ${fmtDate(q.printedAt)}</span>`:
            `<span class="download-waiting">⏳ Exam Head ಅನುಮೋದನೆ ಬಾಕಿ</span>`}
          <button class="btn btn-sm btn-red" onclick="deleteQP('${q.id}')">🗑</button>
        </td>
      </tr>`).join('')}
      </tbody></table></div></div>`;
  });

  document.getElementById('content').innerHTML=html;
}

function downloadQP(qpId){
  const qp=DB.questionPapers.find(q=>q.id===qpId); if(!qp) return;
  if(qp.fileData){
    const a=document.createElement('a');
    a.href=qp.fileData;
    a.download=qp.fileName||('QP_Class'+qp.className+'_'+qp.subject+'.pdf');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('✅ Download ಆರಂಭ — '+qp.fileName);
  } else if(qp.content){
    const bodyHtml=`<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;600;700&display=swap">
<style>body{font-family:'Noto Sans Kannada',sans-serif;padding:48px;font-size:14px;line-height:1.9;color:#111;}
.hd{text-align:center;border-bottom:3px double #173657;padding-bottom:14px;margin-bottom:20px;}
.hd h1{font-size:17px;margin:4px 0;color:#173657;} .hd h2{font-size:14px;margin:4px 0;font-weight:600;}
pre{white-space:pre-wrap;font-family:inherit;font-size:13.5px;}
@media print{body{padding:20px;}}</style></head>
<body><div class="hd">
<h1>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</h1>
<h2>ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320</h2>
<h2>${esc(qp.className)}ನೇ ತರಗತಿ | ${esc(qp.subject)} | ${esc(qp.examType)}${qp.unit?' | '+esc(qp.unit):''}</h2>
</div><pre>${esc(qp.content)}</pre></body></html>`;
    const blob=new Blob([bodyHtml],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`QP_${qp.className}_${qp.subject}_${qp.examType}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    showToast('✅ HTML ರೂಪದಲ್ಲಿ Download ಆಗುತ್ತಿದೆ — Browser ನಲ್ಲಿ Print ಮಾಡಿ PDF ಆಗಿ ಉಳಿಸಿ');
  }
}

function markQPPrinted(qpId){
  const qp=DB.questionPapers.find(q=>q.id===qpId); if(!qp) return;
  qp.status='FDA Printed'; qp.printedAt=todayStr(); saveDB();
  const examHead=STAFF.find(s=>s.hrmsId===EXAM_HEAD_HRMS);
  if(examHead) pushNotification(examHead.name,'✅ FDA '+qp.className+'ನೇ '+qp.subject+' QP ಮುದ್ರಣ ಮಾಡಿದ್ದಾರೆ');
  showToast('✅ ಮುದ್ರಣ ದಾಖಲಿಸಲಾಗಿದೆ'); navigate('qpfda');
}

function serverTodayStr(){
  if(SERVER_DATE_OFFSET==null) return todayStr();
  const d=new Date(); d.setUTCDate(d.getUTCDate()+SERVER_DATE_OFFSET);
  return d.toISOString().slice(0,10);
}

function salaryMonthLabel(ym){ // ym = 'YYYY-MM'
  if(!ym) return '—';
  const [y,m]=ym.split('-');
  const idx=Number(m)-1;
  return (KN_MONTHS[idx]||m)+' '+y;
}

function defaultSalaryMonth(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

function salaryStatusBadge(status){
  return status==='Acknowledged'
    ? '<span class="badge badge-ok">✅ ಸ್ವೀಕೃತಿ ಆಗಿದೆ</span>'
    : '<span class="badge badge-warn">⏳ Pending ಸ್ವೀಕೃತಿ</span>';
}

function downloadSalarySlip(id){
  const slip=(DB.salarySlips||[]).find(s=>s.id===id); if(!slip||!slip.fileData) return;
  const a=document.createElement('a'); a.href=slip.fileData;
  a.download=slip.fileName||('Salary_'+slip.staffName+'_'+slip.month+'.pdf');
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  logAudit('Download','SalarySlip',id,slip.staffName+' — '+salaryMonthLabel(slip.month));
  saveDB();
  showToast('⬇ Download ಆಗುತ್ತಿದೆ');
}

/* ================= TA / DA BILL (ಪ್ರಯಾಣ ಭತ್ಯೆ ಬಿಲ್ಲು) =================
   Staff / Warden / Principal / FDA: enter own bill (My TA Bill)
   FDA (+Principal view): register of every staff bill, per-bill print, DA & fare rate settings
   Data: DB.taBills[] (one bill per staff per period), DB.taSettings{daRate,fareRate,perPage}
============================================================================ */
const TA_SCHOOL_LINE='ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ (ಉ.ಕ)';
let TA_EDIT_ID=null, TA_FILTER={staff:'',month:''};

function taSettings(){
  if(!DB.taSettings||typeof DB.taSettings!=='object') DB.taSettings={};
  const s=DB.taSettings;
  return { daRate:Number(s.daRate!=null?s.daRate:300), fareRate:Number(s.fareRate!=null?s.fareRate:10), perPage:Number(s.perPage||10) };
}
function taNum(v){ const n=parseFloat(v); return isNaN(n)?0:n; }
function taMoney(n){ return (Math.round((Number(n)||0)*100)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function taDMY(d){ if(!d) return ''; const m=String(d).match(/^(\d{4})-(\d{2})-(\d{2})/); return m?`${m[3]}-${m[2]}-${m[1]}`:String(d); }
function taTime(t){ if(!t) return ''; const m=String(t).match(/^(\d{1,2}):(\d{2})/); if(!m) return String(t); let h=+m[1]; const ap=h>=12?'PM':'AM'; h=h%12||12; return `${String(h).padStart(2,'0')}:${m[2]} ${ap}`; }

function taNewLeg(){ return {date:'',from:'',depTime:'',to:'',arrDate:'',arrTime:'',mode:'',km:'',auto:'',lodge:''}; }
function taNewEntry(){ return {id:uid(),purpose:'',remarks:'',daOverride:'',legs:[taNewLeg(),taNewLeg()]}; }

// ---- calculations (same rules as the Excel software) ----
function taEntryCalc(b,e){
  const fare=e.legs.map(l=>taNum(l.km)*b.fareRate);
  const dates=[];
  const okD=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&+d.slice(0,4)>=2000&&+d.slice(0,4)<=2100;
  e.legs.forEach(l=>{ if(okD(l.date)) dates.push(l.date); if(okD(l.arrDate)) dates.push(l.arrDate); });
  let days=0;
  if(dates.length){ dates.sort(); days=Math.round((new Date(dates[dates.length-1]+'T00:00:00')-new Date(dates[0]+'T00:00:00'))/86400000)+1; }
  let da=days*b.daRate;
  if(e.daOverride!==''&&e.daOverride!=null&&!isNaN(parseFloat(e.daOverride))) da=parseFloat(e.daOverride);
  const auto=e.legs.reduce((a,l)=>a+taNum(l.auto),0), lodge=e.legs.reduce((a,l)=>a+taNum(l.lodge),0);
  const fareSum=fare[0]+fare[1];
  return {fare, fareSum, da, days, auto, lodge, total:fareSum+da+auto+lodge};
}
function taEntryHasData(e){
  return !!(e.purpose||e.remarks||e.legs.some(l=>l.date||l.from||l.to||l.arrDate||l.km!==''&&l.km!=null||l.auto||l.lodge||l.mode||l.depTime||l.arrTime));
}
function taBillTotals(b){
  const t={fare:0,da:0,auto:0,lodge:0,total:0};
  b.entries.filter(taEntryHasData).forEach(e=>{ const c=taEntryCalc(b,e); t.fare+=c.fareSum; t.da+=c.da; t.auto+=c.auto; t.lodge+=c.lodge; t.total+=c.total; });
  return t;
}
function taBillLabel(b){
  if(b.fromDate||b.toDate) return `${taDMY(b.fromDate)||'…'} ರಿಂದ ${taDMY(b.toDate)||'…'}`;
  return 'ಅವಧಿ ನಮೂದಿಸಿಲ್ಲ';
}

// ---- create / save / delete ----
function taCreateBill(){
  const st=staffByName(CURRENT_USER.name)||{};
  const mine=(DB.taBills||[]).filter(x=>x.hrmsId===CURRENT_USER.hrmsId).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const prev=mine[0]||{};
  const s=taSettings();
  const b={ id:uid(), hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name, desig:st.desig||'',
    payScale:prev.payScale||'', hq:prev.hq||'ಭಟ್ಕಳ', fromDate:'', toDate:'',
    daRate:s.daRate, fareRate:s.fareRate, entries:[taNewEntry()], createdAt:new Date().toISOString() };
  if(!DB.taBills) DB.taBills=[];
  DB.taBills.push(b); saveDB();
  TA_EDIT_ID=b.id; renderTABillEditor();
}
function taDeleteBill(id){
  const b=(DB.taBills||[]).find(x=>x.id===id); if(!b) return;
  if(!confirm(`"${b.staffName}" — ${taBillLabel(b)} TA ಬಿಲ್ ಅಳಿಸುವುದೇ?`)) return;
  DB.taBills=DB.taBills.filter(x=>x.id!==id); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ');
  navigate(CURRENT_PAGE);
}
function taStatus(b){ return b.status==='Submitted'?'Submitted':'Draft'; }
function taCanEdit(b){ return !!b && (CURRENT_USER.role==='fda' || (b.hrmsId===CURRENT_USER.hrmsId && taStatus(b)!=='Submitted')); }
function taStatusBadge(b){ return taStatus(b)==='Submitted'?`<span class="badge badge-ok">✅ FDA ಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ</span><div style="font-size:10px;color:var(--muted);">${esc(b.submittedDate?taDMY(b.submittedDate):'')} ${esc(b.submittedAt||'')}</div>`:`<span class="badge badge-warn">ಕರಡು (Draft)</span>`; }
async function taApprove(id){
  const b=taGet(id); if(!b||b.hrmsId!==CURRENT_USER.hrmsId||taStatus(b)==='Submitted') return;
  const rows=b.entries.filter(taEntryHasData);
  if(!rows.length){ showToast('⚠ ಕನಿಷ್ಠ ಒಂದು ಪ್ರಯಾಣ ನಮೂದಿಸಿ'); return; }
  if(!b.fromDate||!b.toDate){ showToast('⚠ ಬಿಲ್ ಅವಧಿ (ಇಂದ / ವರೆಗೆ) ನಮೂದಿಸಿ'); return; }
  const t=taBillTotals(b);
  if(!confirm(`ಒಟ್ಟು ₹${taMoney(t.total)} (${rows.length} ಪ್ರಯಾಣ) — ಅನುಮೋದಿಸಿ FDA ಗೆ ಕಳುಹಿಸುವುದೇ?\n(ಕಳುಹಿಸಿದ ನಂತರ ನೀವು ಬದಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ; ಬೇಕಾದರೆ "ಮತ್ತೆ ತೆರೆಯಿರಿ" ಬಳಸಿ.)`)) return;
  showToast('⏳ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...');
  let ts={time:'',date:new Date().toISOString().slice(0,10),server:false};
  try{ ts=await getServerTimeStamp(); }catch(e){}
  b.status='Submitted'; b.submittedAt=ts.time; b.submittedDate=ts.date; b.submittedServerTime=!!ts.server;
  b.signText=taStampText(ts.iso?new Date(ts.iso):new Date());
  b.signHost=location.host||'';
  b.signDevice=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)?'Mobile':'Computer';
  b.signIp=await taGetIp();
  logAudit('Approve','TABill',id,`${b.staffName} TA bill ${taBillLabel(b)} ₹${taMoney(t.total)}`);
  saveDB();
  staffNamesForRole('fda').filter(n=>n!==CURRENT_USER.name).forEach(n=>pushNotification(n,`🚌 ${b.staffName} — TA ಬಿಲ್ (${taBillLabel(b)}) ₹${taMoney(t.total)} ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಿದ್ದಾರೆ`));
  showToast('✅ ಅನುಮೋದಿಸಿ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  renderTABillEditor();
}
function taReopen(id){
  const b=taGet(id); if(!b||b.hrmsId!==CURRENT_USER.hrmsId||taStatus(b)!=='Submitted') return;
  if(!confirm('ಬಿಲ್ ಮತ್ತೆ ಬದಲಿಸಲು ತೆರೆಯುವುದೇ? FDA ವಹಿಯಿಂದ ಇದು ಮರೆಯಾಗುತ್ತದೆ; ಮತ್ತೆ ಅನುಮೋದಿಸಬೇಕು.')) return;
  b.status='Draft'; delete b.submittedAt; delete b.submittedDate; delete b.signText; delete b.signHost; delete b.signDevice; delete b.signIp; ['pStage','pName','pStamp','pHost','pIp','pDevice','pReturnReason'].forEach(k=>delete b[k]); saveDB(); renderTABillEditor();
}
function taOpen(id){ TA_EDIT_ID=id; renderTABillEditor(); }

// ---- staff page: my bills ----
function renderTABill(){
  TA_EDIT_ID=null;
  const mine=(DB.taBills||[]).filter(x=>x.hrmsId===CURRENT_USER.hrmsId).slice().sort((a,b)=>(b.fromDate||b.createdAt||'').localeCompare(a.fromDate||a.createdAt||''));
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🚌 ನನ್ನ ಪ್ರಯಾಣ ಭತ್ಯೆ ಬಿಲ್ (My TA Bill)</h2>
    <div class="desc">ನಿಮ್ಮ ಪ್ರಯಾಣದ ವಿವರ ನಮೂದಿಸಿ — ಫೇರ್, DA ಮತ್ತು ಒಟ್ಟು ಮೊತ್ತ ತಾನಾಗಿ ಲೆಕ್ಕವಾಗುತ್ತದೆ. FDA ನಿಮ್ಮ ಬಿಲ್ ಪ್ರಿಂಟ್ ತೆಗೆಯುತ್ತಾರೆ.</div></div>
    <div class="panel">
      <div class="form-actions" style="margin-bottom:10px;"><button class="btn btn-primary" onclick="taCreateBill()">➕ ಹೊಸ TA ಬಿಲ್</button></div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ಅವಧಿ</th><th>ಪ್ರಯಾಣಗಳು</th><th style="text-align:right;">ಒಟ್ಟು ಮೊತ್ತ (₹)</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
      ${mine.length?mine.map((b,i)=>{ const t=taBillTotals(b); return `<tr>
        <td>${i+1}</td><td><b>${esc(taBillLabel(b))}</b></td><td>${b.entries.filter(taEntryHasData).length}</td>
        <td style="text-align:right;font-weight:700;">${taMoney(t.total)}</td><td>${taStatusBadge(b)}</td>
        <td class="actions-cell"><button class="btn btn-sm btn-primary" onclick="taOpen('${b.id}')">${taStatus(b)==='Submitted'?'👁 ನೋಡಿ':'✏️ ತೆರೆಯಿರಿ / ಬದಲಿಸಿ'}</button>
        <button class="btn btn-sm btn-gold" onclick="taPrintView('${b.id}')">🖨️ Print</button>
        ${taStatus(b)==='Submitted'&&CURRENT_USER.role!=='fda'?'':`<button class="btn btn-sm btn-outline" onclick="taDeleteBill('${b.id}')">🗑</button>`}</td></tr>`; }).join('')
      :`<tr class="empty-row"><td colspan="6">ಇನ್ನೂ ಯಾವುದೇ TA ಬಿಲ್ ಇಲ್ಲ. "ಹೊಸ TA ಬಿಲ್" ಒತ್ತಿ.</td></tr>`}
      </tbody></table></div>
    </div>`;
}

// ---- bill editor (same columns as the paper form, 2 rows per journey) ----
function taInp(type,val,onchange,w,extra){
  return `<input type="${type}" value="${esc(val)}" onchange="${onchange}" style="width:${w||'100%'};padding:3px 4px;font-size:12px;border:1px solid var(--border);border-radius:4px;box-sizing:border-box;${extra||''}">`;
}
function renderTABillEditor(){
  const b=(DB.taBills||[]).find(x=>x.id===TA_EDIT_ID); if(!b){ navigate(CURRENT_PAGE); return; }
  const can=taCanEdit(b), id=b.id;
  const dis=can?'':'disabled';
  const hdrIn=(label,field,type)=>`<div><label style="font-size:11px;color:var(--muted);">${label}</label><input type="${type||'text'}" ${type==='date'?'min="2000-01-01" max="2100-12-31"':''} value="${esc(b[field]||'')}" ${dis} onchange="taSetHdr('${id}','${field}',this.value)" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:5px;box-sizing:border-box;"></div>`;
  const cards=b.entries.map((e,ei)=>taEditorRows(b,e,ei,can)).join('');
  const back=CURRENT_PAGE==='tabillregister'?'tabillregister':'tabill';
  const sumBox=(label,idd,extra)=>`<div style="flex:1;min-width:110px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);"><div style="font-size:11px;color:var(--muted);">${label}</div><div id="${idd}" style="font-size:16px;font-weight:800;${extra||''}"></div></div>`;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🚌 TA ಬಿಲ್ — ${esc(b.staffName)}</h2>
    <div class="desc">ಪ್ರತಿ ಪ್ರಯಾಣಕ್ಕೆ ಎರಡು ಭಾಗ: ಹೋಗುವ ಮತ್ತು ಹಿಂದಿರುಗುವ ಪ್ರಯಾಣ. ಫೇರ್, DA ಮತ್ತು ಒಟ್ಟು ತಾನಾಗಿ ಲೆಕ್ಕವಾಗುತ್ತದೆ. ಬದಲಾವಣೆ ತಾನಾಗಿ ಉಳಿಯುತ್ತದೆ.</div></div>
    <div class="panel">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-bottom:10px;">
        <div><label style="font-size:11px;color:var(--muted);">ಹೆಸರು (Name)</label><div style="padding:6px;border:1px solid var(--border);border-radius:5px;background:var(--surface-2);">${esc(b.staffName)}</div></div>
        ${hdrIn('ಹುದ್ದೆ (Designation)','desig')}${hdrIn('ವೇತನ ಶ್ರೇಣಿ (Pay Scale)','payScale')}${hdrIn('ಕೇಂದ್ರಸ್ಥಾನ (Head quarters)','hq')}
        ${hdrIn('ಅವಧಿ — ಇಂದ (From)','fromDate','date')}${hdrIn('ಅವಧಿ — ವರೆಗೆ (To)','toDate','date')}
      </div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px;">ದರ: DA ₹${taMoney(b.daRate)} / ದಿನ &nbsp;|&nbsp; ಫೇರ್ ₹${taMoney(b.fareRate)} / ಕಿ.ಮೀ &nbsp;(FDA ನಿಗದಿಪಡಿಸಿದ ದರ)</div>
      ${taStatus(b)==='Submitted'?`<div style="font-size:12px;margin-bottom:8px;">${taStatusBadge(b)}</div>`:''}
      ${cards}
      ${can?`<button class="btn btn-primary" onclick="taAddEntry('${id}')" style="margin-bottom:12px;">➕ ಇನ್ನೊಂದು ಪ್ರಯಾಣ ಸೇರಿಸಿ</button>`:''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px;">
        ${sumBox('ಫೇರ್ (Fare)','taT-fare')}${sumBox('DA','taT-da')}${sumBox('Auto','taT-auto')}${sumBox('Lodge','taT-lodge')}${sumBox('ಒಟ್ಟು ಮೊತ್ತ (Grand Total)','taT-total','color:#b00020;font-size:19px;')}
      </div>
      <div class="form-actions">
        <button class="btn btn-gold" onclick="taPrintView('${id}')">🖨️ Print Preview</button>
        ${b.hrmsId===CURRENT_USER.hrmsId&&taStatus(b)!=='Submitted'?`<button class="btn btn-primary" style="background:#1F7A4D;" onclick="taApprove('${id}')">✅ ಅನುಮೋದಿಸಿ — FDA ಗೆ ಕಳುಹಿಸಿ (Approve)</button>`:''}
        ${b.hrmsId===CURRENT_USER.hrmsId&&taStatus(b)==='Submitted'?`<button class="btn btn-outline" onclick="taReopen('${id}')">↩ ಮತ್ತೆ ತೆರೆಯಿರಿ</button>`:''}
        <button class="btn btn-outline" onclick="navigate('${back}')">⬅ ಹಿಂದೆ</button>
      </div>
    </div>`;
  taRecalcDOM(b);
}
function taEditorRows(b,e,ei,can){
  const id=b.id, d=can?'':'disabled';
  const fld=(li,field,type,label)=>`<div><label style="display:block;font-size:10.5px;color:var(--muted);margin-bottom:2px;">${label}</label><input type="${type}" ${type==='date'?'min="2000-01-01" max="2100-12-31"':''} ${type==='number'?'min="0" step="any" inputmode="decimal"':''} value="${esc(e.legs[li][field])}" ${d} onchange="taSetLeg('${id}',${ei},${li},'${field}',this.value)" style="width:100%;padding:6px 7px;font-size:13px;border:1px solid #e0c86a;border-radius:5px;box-sizing:border-box;"></div>`;
  const grid='display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;';
  const legBox=(li,title)=>`<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:700;margin-bottom:4px;">${title} <span id="taF-${ei}-${li}" style="font-weight:600;color:var(--muted);font-size:11.5px;"></span></div>
      <div style="${grid}">
        ${fld(li,'date','date','Date (ದಿನಾಂಕ)')}${fld(li,'from','text','From (ಇಂದ)')}${fld(li,'depTime','time','Dep. Time')}
        ${fld(li,'to','text','To (ಗೆ)')}${fld(li,'arrDate','date','Arrival Date')}${fld(li,'arrTime','time','Arr. Time')}
        ${fld(li,'mode','text','Mode (ವಾಹನ)')}${fld(li,'km','number','Distance (KM) ✱')}${fld(li,'auto','number','Auto (₹)')}${fld(li,'lodge','number','Lodge (₹)')}
      </div></div>`;
  return `<div style="border:1px solid var(--border);border-left:4px solid #e0c86a;border-radius:8px;padding:10px 12px;margin-bottom:12px;background:#fff;">
    <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-bottom:8px;">
      <div style="font-weight:800;font-size:14px;min-width:70px;">ಪ್ರಯಾಣ ${ei+1}</div>
      <div style="flex:2;min-width:180px;"><label style="display:block;font-size:10.5px;color:var(--muted);">Purpose (ಉದ್ದೇಶ)</label><input type="text" value="${esc(e.purpose)}" ${d} onchange="taSetEntry('${id}',${ei},'purpose',this.value)" style="width:100%;padding:6px 7px;font-size:13px;border:1px solid #e0c86a;border-radius:5px;box-sizing:border-box;"></div>
      <div style="flex:1;min-width:140px;"><label style="display:block;font-size:10.5px;color:var(--muted);">Remarks (ಷರಾ)</label><input type="text" value="${esc(e.remarks)}" ${d} onchange="taSetEntry('${id}',${ei},'remarks',this.value)" style="width:100%;padding:6px 7px;font-size:13px;border:1px solid #e0c86a;border-radius:5px;box-sizing:border-box;"></div>
      ${can?`<button class="btn btn-sm btn-outline" title="ಈ ಪ್ರಯಾಣ ಅಳಿಸಿ" onclick="taDelEntry('${id}',${ei})">🗑 ಅಳಿಸಿ</button>`:''}
    </div>
    ${legBox(0,'➡ ಹೋಗುವ ಪ್ರಯಾಣ (Onward)')}${legBox(1,'⬅ ಹಿಂದಿರುಗುವ ಪ್ರಯಾಣ (Return)')}
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;background:var(--surface-2);border-radius:6px;padding:8px 10px;">
      <div style="min-width:150px;"><label style="display:block;font-size:10.5px;color:var(--muted);">DA (ಸ್ವಯಂ — ಬೇಕಿದ್ದರೆ ಬದಲಿಸಿ)</label><input type="number" min="0" step="any" ${d} value="${esc(e.daOverride)}" placeholder="auto" onchange="taSetEntry('${id}',${ei},'daOverride',this.value)" style="width:100%;padding:6px 7px;font-size:13px;border:1px solid #e0c86a;border-radius:5px;box-sizing:border-box;"></div>
      <div style="font-size:12px;">DA: <b id="taDA-${ei}"></b> <span id="taD-${ei}" style="color:var(--muted);font-size:11px;"></span></div>
      <div style="margin-left:auto;font-size:14px;">ಈ ಪ್ರಯಾಣದ ಒಟ್ಟು: <b id="taTot-${ei}" style="color:#b00020;"></b></div>
    </div></div>`;
}
function taRecalcDOM(b){
  b.entries.forEach((e,ei)=>{
    const c=taEntryCalc(b,e), set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    set(`taF-${ei}-0`,c.fare[0]?`— ಫೇರ್ ₹${taMoney(c.fare[0])}`:''); set(`taF-${ei}-1`,c.fare[1]?`— ಫೇರ್ ₹${taMoney(c.fare[1])}`:'');
    set(`taD-${ei}`,c.days?`(${c.days} ದಿನ × ₹${taMoney(b.daRate)})`:''); set(`taDA-${ei}`,c.da?'₹'+taMoney(c.da):'—');
    set(`taTot-${ei}`,taEntryHasData(e)?'₹'+taMoney(c.total):'—');
  });
  const t=taBillTotals(b);
  [['fare',t.fare],['da',t.da],['auto',t.auto],['lodge',t.lodge],['total',t.total]].forEach(([k,v])=>{ const el=document.getElementById('taT-'+k); if(el) el.textContent='₹'+taMoney(v); });
}
function taGet(id){ return (DB.taBills||[]).find(x=>x.id===id); }
function taSetHdr(id,field,v){ const b=taGet(id); if(!b||!taCanEdit(b)) return; b[field]=v; saveDB(); }
function taSetEntry(id,ei,field,v){ const b=taGet(id); if(!b||!taCanEdit(b)) return; b.entries[ei][field]=v; saveDB(); taRecalcDOM(b); }
function taSetLeg(id,ei,li,field,v){
  const b=taGet(id); if(!b||!taCanEdit(b)) return;
  const en=b.entries[ei], leg=en.legs[li]; leg[field]=v;
  const before=JSON.stringify(en.legs.map(l=>Object.assign({},l)));
  // convenience: arrival date follows departure date, return leg mirrors the onward leg
  if(field==='date'&&!leg.arrDate) leg.arrDate=v;
  if(li===0){
    const r=en.legs[1];
    if(field==='from'&&!r.to) r.to=v;
    if(field==='to'&&!r.from) r.from=v;
    if(field==='mode'&&!r.mode) r.mode=v;
    if(field==='km'&&(r.km===''||r.km==null)) r.km=v;
  }
  saveDB();
  const auto=JSON.stringify(en.legs.map(l=>Object.assign({},l)))!==before;
  if(auto) renderTABillEditor(); else taRecalcDOM(b);   // re-render only when a mirrored cell changed
}
function taAddEntry(id){ const b=taGet(id); if(!b||!taCanEdit(b)) return; b.entries.push(taNewEntry()); saveDB(); renderTABillEditor(); }
function taDelEntry(id,ei){
  const b=taGet(id); if(!b||!taCanEdit(b)) return;
  if(taEntryHasData(b.entries[ei])&&!confirm('ಈ ಪ್ರಯಾಣದ ಸಾಲು ಅಳಿಸುವುದೇ?')) return;
  b.entries.splice(ei,1); if(!b.entries.length) b.entries.push(taNewEntry());
  saveDB(); renderTABillEditor();
}

// ---- FDA register + settings ----
function renderTABillRegister(){
  TA_EDIT_ID=null;
  const s=taSettings(), isFda=CURRENT_USER.role==='fda';
  const isPr=CURRENT_USER.role==='principal';
  let list=(DB.taBills||[]).filter(b=>taStatus(b)==='Submitted'&&(!isPr||b.pStage==='Sent'||b.pStage==='Approved'));
  if(TA_FILTER.staff) list=list.filter(b=>b.hrmsId===TA_FILTER.staff);
  if(TA_FILTER.month) list=list.filter(b=>(b.fromDate||'').slice(0,7)===TA_FILTER.month||(b.toDate||'').slice(0,7)===TA_FILTER.month);
  list.sort((a,b)=>(b.fromDate||b.createdAt||'').localeCompare(a.fromDate||a.createdAt||''));
  const staffOpts=[...new Map((DB.taBills||[]).filter(b=>taStatus(b)==='Submitted').map(b=>[b.hrmsId,b.staffName])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  const grand=list.reduce((a,b)=>a+taBillTotals(b).total,0);
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🚌 TA ಬಿಲ್ ವಹಿ (Staff TA Bills)</h2>
    <div class="desc">ಸಿಬ್ಬಂದಿ ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಿದ TA ಬಿಲ್‌ಗಳು. ${isFda?'ಪ್ರತಿ ಬಿಲ್‌ನ Print / PDF ತೆಗೆಯಬಹುದು.':'ವೀಕ್ಷಣೆಗೆ ಮಾತ್ರ.'}</div></div>
    <div class="panel">
      <h3 style="margin:0 0 8px;font-size:14px;">⚙️ ದರಗಳು (Settings)</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;align-items:end;">
        <div><label style="font-size:11px;color:var(--muted);">DA ದರ (₹ / ದಿನ)</label><input id="taSetDA" type="number" value="${s.daRate}" ${isFda?'':'disabled'} style="width:100%;padding:6px;border:1px solid var(--border);border-radius:5px;box-sizing:border-box;"></div>
        <div><label style="font-size:11px;color:var(--muted);">ಫೇರ್ ದರ (₹ / ಕಿ.ಮೀ)</label><input id="taSetFare" type="number" value="${s.fareRate}" ${isFda?'':'disabled'} style="width:100%;padding:6px;border:1px solid var(--border);border-radius:5px;box-sizing:border-box;"></div>
        <div><label style="font-size:11px;color:var(--muted);">ಒಂದು ಪುಟದಲ್ಲಿ ಪ್ರಯಾಣಗಳು (Print)</label><select id="taSetPer" ${isFda?'':'disabled'} style="width:100%;padding:6px;border:1px solid var(--border);border-radius:5px;box-sizing:border-box;">${[5,10,15,20].map(n=>`<option ${n===s.perPage?'selected':''}>${n}</option>`).join('')}</select></div>
        ${isFda?`<div><button class="btn btn-primary" onclick="taSaveSettings()">💾 ಉಳಿಸಿ</button></div>`:''}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;">ಹೊಸದಾಗಿ ರಚಿಸುವ ಬಿಲ್‌ಗಳಿಗೆ ಈ ದರ ಅನ್ವಯವಾಗುತ್ತದೆ. ಹಳೆಯ ಬಿಲ್‌ಗಳ ದರ ಬದಲಾಗುವುದಿಲ್ಲ; ಅಗತ್ಯವಿದ್ದರೆ ಬಿಲ್‌ನ "ದರ ಬದಲಿಸಿ" ಬಳಸಿ.</div>
    </div>
    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <select onchange="TA_FILTER.staff=this.value;renderTABillRegister()" style="padding:6px;"><option value="">ಎಲ್ಲ ಸಿಬ್ಬಂದಿ</option>${staffOpts.map(([h,n])=>`<option value="${esc(h)}" ${TA_FILTER.staff===h?'selected':''}>${esc(n)}</option>`).join('')}</select>
        <input type="month" value="${esc(TA_FILTER.month)}" onchange="TA_FILTER.month=this.value;renderTABillRegister()" style="padding:6px;">
        <button class="btn btn-sm btn-outline" onclick="TA_FILTER={staff:'',month:''};renderTABillRegister()">ತೆರವು</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ಸಿಬ್ಬಂದಿ</th><th>ಹುದ್ದೆ</th><th>ಅವಧಿ</th><th>ಪ್ರಯಾಣಗಳು</th><th>ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ</th><th style="text-align:right;">ಒಟ್ಟು (₹)</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
      ${list.length?list.map((b,i)=>{ const t=taBillTotals(b); return `<tr>
        <td>${i+1}</td><td><b>${esc(b.staffName)}</b></td><td style="font-size:11.5px;">${esc(b.desig)}</td><td>${esc(taBillLabel(b))}</td>
        <td>${b.entries.filter(taEntryHasData).length}</td><td style="font-size:11.5px;">${esc(taDMY(b.submittedDate))} ${esc(b.submittedAt||'')}</td><td style="text-align:right;font-weight:700;">${taMoney(t.total)}</td>
        <td style="font-size:11.5px;white-space:normal;">${b.pStage==='Approved'?`<span class="badge badge-ok">✅ ಅನುಮೋದಿತ</span><div style="font-size:10px;color:var(--muted);">${esc(b.pStamp||'')}</div>`:b.pStage==='Sent'?'<span class="badge badge-warn">ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ</span>':(b.pReturnReason?`<span class="badge badge-warn">ಹಿಂದಿರುಗಿಸಿದೆ</span><div style="font-size:10px;color:var(--red);">${esc(b.pReturnReason)}</div>`:'<span class="badge">FDA ಪರಿಶೀಲನೆ</span>')}</td>
        <td class="actions-cell"><button class="btn btn-sm btn-gold" onclick="taPrintView('${b.id}')">🖨️ Print / ⬇ PDF</button>
        ${isPr&&b.pStage==='Sent'?`<button class="btn btn-sm btn-primary" onclick="taPrincipalApprove('${b.id}')">✍ ಅನುಮೋದಿಸಿ</button><button class="btn btn-sm btn-outline" onclick="taPrincipalReturn('${b.id}')">↩ ಹಿಂದಿರುಗಿಸಿ</button>`:''}
        ${isFda&&b.pStage!=='Sent'&&b.pStage!=='Approved'?`<button class="btn btn-sm btn-primary" onclick="taSendPrincipal('${b.id}')">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button>`:''}
        ${isFda&&b.pStage==='Sent'?`<button class="btn btn-sm btn-outline" onclick="taRecallPrincipal('${b.id}')">↩ ಹಿಂತೆಗೆ</button>`:''}
        ${b.pStage==='Approved'?dscBtns('tabill',b.id,b.staffName+' '+taBillLabel(b)):''}
        <button class="btn btn-sm btn-outline" onclick="taOpen('${b.id}')">${isFda&&b.pStage!=='Sent'&&b.pStage!=='Approved'?'✏️ ತೆರೆಯಿರಿ':'👁 ನೋಡಿ'}</button>
        ${isFda&&b.pStage!=='Approved'?`<button class="btn btn-sm btn-outline" onclick="taDeleteBill('${b.id}')">🗑</button>`:''}</td></tr>`; }).join('')
      :`<tr class="empty-row"><td colspan="9">ಯಾವುದೇ TA ಬಿಲ್ ಇಲ್ಲ.</td></tr>`}
      </tbody>${list.length?`<tfoot><tr style="font-weight:800;background:var(--surface-2);"><td colspan="6" style="text-align:right;">ಒಟ್ಟು</td><td style="text-align:right;">${taMoney(grand)}</td><td></td><td></td></tr></tfoot>`:''}</table></div>
    </div>`;
}
function taSendPrincipal(id){
  const b=taGet(id); if(!b||CURRENT_USER.role!=='fda') return;
  if(!confirm(b.staffName+' — TA ಬಿಲ್ ಪರಿಶೀಲಿಸಿದ್ದೀರಾ? ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸುವುದೇ?')) return;
  b.pStage='Sent'; b.pSentBy=CURRENT_USER.name; b.pSentAt=todayStr(); delete b.pReturnReason;
  staffNamesForRole('principal').forEach(n=>pushNotification(n,`🚌 TA ಬಿಲ್ ಅನುಮೋದನೆಗೆ: ${b.staffName} (${taBillLabel(b)})`));
  saveDB(); showToast('✅ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderTABillRegister();
}
function taRecallPrincipal(id){
  const b=taGet(id); if(!b||CURRENT_USER.role!=='fda'||b.pStage!=='Sent') return;
  delete b.pStage; saveDB(); renderTABillRegister();
}
async function taPrincipalApprove(id){
  const b=taGet(id); if(!b||CURRENT_USER.role!=='principal'||b.pStage!=='Sent') return;
  if(!confirm(b.staffName+' — TA ಬಿಲ್ (₹ '+taMoney(taBillTotals(b).total)+') ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಿ ಅನುಮೋದಿಸುವುದೇ?')) return;
  const ts=await getServerTimeStamp(); const m={}; await cbSignMeta(m,ts);
  b.pStage='Approved'; b.pName=CURRENT_USER.name; b.pStamp=m.signStamp; b.pHost=m.signHost; b.pIp=m.signIp; b.pDevice=m.signDevice;
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✅ TA ಬಿಲ್ ಅನುಮೋದನೆ: ${b.staffName} (${taBillLabel(b)})`));
  saveDB(); showToast('✅ ಅನುಮೋದಿಸಲಾಗಿದೆ'); renderTABillRegister();
}
function taPrincipalReturn(id){
  const b=taGet(id); if(!b||CURRENT_USER.role!=='principal'||b.pStage!=='Sent') return;
  const r=prompt('ಹಿಂದಿರುಗಿಸಲು ಕಾರಣ (ಕಡ್ಡಾಯ):'); if(!r||!r.trim()) return;
  delete b.pStage; b.pReturnReason=r.trim();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`↩ TA ಬಿಲ್ ಹಿಂದಿರುಗಿದೆ: ${b.staffName} — ${r.trim()}`));
  saveDB(); showToast('ಹಿಂದಿರುಗಿಸಲಾಗಿದೆ'); renderTABillRegister();
}
function taSaveSettings(){
  if(CURRENT_USER.role!=='fda') return;
  DB.taSettings={ daRate:taNum(document.getElementById('taSetDA').value), fareRate:taNum(document.getElementById('taSetFare').value), perPage:taNum(document.getElementById('taSetPer').value)||10 };
  saveDB(); showToast('✅ ದರಗಳು ಉಳಿದಿವೆ'); renderTABillRegister();
}
function taSetBillRates(id){
  const b=taGet(id); if(!b||CURRENT_USER.role!=='fda') return;
  const da=prompt('ಈ ಬಿಲ್‌ಗೆ DA ದರ (₹ / ದಿನ):',b.daRate); if(da===null) return;
  const fr=prompt('ಈ ಬಿಲ್‌ಗೆ ಫೇರ್ ದರ (₹ / ಕಿ.ಮೀ):',b.fareRate); if(fr===null) return;
  b.daRate=taNum(da); b.fareRate=taNum(fr); saveDB(); showToast('✅ ಈ ಬಿಲ್‌ನ ದರ ಬದಲಾಯಿತು'); taPrintView(id,TA_PER_PAGE);
}

// ---- print (same layout as the paper form, A4 landscape, N journeys per page) ----
let TA_PER_PAGE=null;
function taPrintView(id,perPage){
  const b=taGet(id); if(!b) return;
  if(perPage) TA_PER_PAGE=Number(perPage); if(!TA_PER_PAGE) TA_PER_PAGE=taSettings().perPage;
  const per=TA_PER_PAGE, entries=b.entries.filter(taEntryHasData);
  const pages=Math.max(1,Math.ceil(entries.length/per));
  const fs=per<=5?12.5:per<=10?11:per<=15?10:9, pad=per<=5?'9px 3px':per<=10?'5px 3px':per<=15?'3px 2px':'1.5px 2px';
  const td=`border:1px solid #000;padding:${pad};text-align:center;vertical-align:middle;word-wrap:break-word;white-space:normal;`;
  const th=`border:1px solid #000;padding:3px 2px;text-align:center;background:#eee;font-weight:600;white-space:normal;text-transform:none;letter-spacing:0;color:#000;font-family:inherit;font-size:inherit;`;
  const cw=[4,8,7.5,7.5,7.5,8,7.5,6,11,5,6,7,5,5,7.5,7], cwSum=cw.reduce((a,x)=>a+x,0), cols=cw.map(w=>`<col style="width:${(w*100/cwSum).toFixed(2)}%">`).join('');
  const period=`${b.fromDate?taDMY(b.fromDate):'__________'} ರಿಂದ ${b.toDate?taDMY(b.toDate):'__________'} ರವರೆಗಿನ ಪ್ರಯಾಣ ಭತ್ಯೆ ಬಿಲ್ಲು`;
  let grand={fare:0,da:0,auto:0,lodge:0,total:0}, html='';
  for(let p=0;p<pages;p++){
    const slice=entries.slice(p*per,(p+1)*per);
    const pt={fare:0,da:0,auto:0,lodge:0,total:0};
    let body='';
    for(let i=0;i<(entries.length?slice.length:2);i++){   // no empty filler rows
      const e=slice[i];
      if(!e){ body+=`<tr><td style="${td}" rowspan="2">&nbsp;</td>${('<td style="'+td+'"></td>').repeat(7)}<td style="${td}" rowspan="2"></td><td style="${td}"></td><td style="${td}"></td><td style="${td}" rowspan="2"></td><td style="${td}"></td><td style="${td}"></td><td style="${td}" rowspan="2"></td><td style="${td}" rowspan="2"></td></tr><tr>${('<td style="'+td+'"></td>').repeat(7)}<td style="${td}"></td><td style="${td}"></td><td style="${td}"></td><td style="${td}"></td></tr>`; continue; }
      const c=taEntryCalc(b,e); const idx=p*per+i+1;
      pt.fare+=c.fareSum; pt.da+=c.da; pt.auto+=c.auto; pt.lodge+=c.lodge; pt.total+=c.total;
      const L=e.legs.map(l=>`<td style="${td}">${esc(taDMY(l.date))}</td><td style="${td}">${esc(l.from)}</td><td style="${td}">${esc(taTime(l.depTime))}</td><td style="${td}">${esc(l.to)}</td><td style="${td}">${esc(taDMY(l.arrDate))}</td><td style="${td}">${esc(taTime(l.arrTime))}</td><td style="${td}">${esc(l.mode)}</td>`);
      const km=e.legs.map(l=>l.km!==''&&l.km!=null&&!isNaN(parseFloat(l.km))?String(parseFloat(l.km)):''), fr=c.fare.map(f=>f?taMoney(f):'');
      const am=e.legs.map(l=>`<td style="${td}">${l.auto?taMoney(taNum(l.auto)):''}</td><td style="${td}">${l.lodge?taMoney(taNum(l.lodge)):''}</td>`);
      body+=`<tr style="page-break-inside:avoid;"><td style="${td}" rowspan="2">${idx}</td>${L[0]}<td style="${td}text-align:left;" rowspan="2">${esc(e.purpose)}</td><td style="${td}">${km[0]}</td><td style="${td}">${fr[0]}</td><td style="${td}" rowspan="2">${c.da?taMoney(c.da):''}</td>${am[0]}<td style="${td}font-weight:700;" rowspan="2">${taMoney(c.total)}</td><td style="${td}text-align:left;" rowspan="2">${esc(e.remarks)}</td></tr><tr style="page-break-inside:avoid;">${L[1]}<td style="${td}">${km[1]}</td><td style="${td}">${fr[1]}</td>${am[1]}</tr>`;
    }
    Object.keys(grand).forEach(k=>grand[k]+=pt[k]);
    const multi=pages>1, last=p===pages-1;
    const totRow=(label,t,bg)=>`<tr style="font-weight:800;${bg?'background:'+bg+';':''}"><td colspan="10" style="${td}text-align:right;padding-right:8px;">${label}</td><td style="${td}">${taMoney(t.fare)}</td><td style="${td}">${taMoney(t.da)}</td><td style="${td}">${taMoney(t.auto)}</td><td style="${td}">${taMoney(t.lodge)}</td><td style="${td}">${taMoney(t.total)}</td><td style="${td}"></td></tr>`;
    html+=`<div class="ta-page" style="${last?'':'page-break-after:always;break-after:page;'}">
      <div style="text-align:center;line-height:1.45;margin-bottom:6px;"><div style="font-size:${fs+6}px;font-weight:800;">${TA_SCHOOL_LINE}</div><div style="font-size:${fs+3}px;font-weight:700;">${esc(period)}</div></div>
      <div style="display:flex;justify-content:space-between;font-size:${fs+1}px;margin-bottom:5px;"><div><div>Name: <b>${esc(b.staffName)}</b></div><div>Designation: <b>${esc(b.desig)}</b></div></div>
        <div style="text-align:left;min-width:42%;"><div>Pay Scale: <b>${esc(b.payScale)}</b></div><div>Head quarters: <b>${esc(b.hq)}</b></div></div></div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:${fs}px;color:#000;"><colgroup>${cols}</colgroup>
        <thead><tr><th style="${th}" rowspan="2">Sl.No</th><th style="${th}" rowspan="2">Date</th><th style="${th}" colspan="2">Departure</th><th style="${th}" colspan="3">Arrival</th><th style="${th}" rowspan="2">Mode of journey</th><th style="${th}" rowspan="2">Purpose</th><th style="${th}" rowspan="2">Distance (in km)</th><th style="${th}" rowspan="2">Fare</th><th style="${th}" rowspan="2">DA</th><th style="${th}" colspan="2">Amount</th><th style="${th}" rowspan="2">Total</th><th style="${th}" rowspan="2">Remarks</th></tr>
        <tr><th style="${th}">From</th><th style="${th}">Time</th><th style="${th}">To</th><th style="${th}">Date</th><th style="${th}">Time</th><th style="${th}">Auto</th><th style="${th}">Lodge</th></tr></thead>
        <tbody>${body}${totRow(multi?'ಪುಟದ ಒಟ್ಟು':'ಒಟ್ಟು',pt)}${multi&&last?totRow('ಒಟ್ಟು ಮೊತ್ತ',grand,'#fff2cc'):''}</tbody></table>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px;"><div style="font-size:${fs+1}px;line-height:1.45;text-align:left;">${taSignHtml(b)}</div><div style="font-size:9px;text-align:right;">${(last&&b.pStage==='Approved')?`<div style="margin-bottom:4px;">${cbDigiSign({signedBy:b.pName,signStamp:b.pStamp,signHost:b.pHost,signIp:b.pIp,signDevice:b.pDevice},'','TA Bill approved')}</div>`:''}${multi?`Page ${p+1} of ${pages}`:''}</div></div></div>`;
  }
  const st=document.createElement('style'); st.id='taPageStyle'; st.textContent='@page{size:A4 landscape;margin:7mm;}';
  const old=document.getElementById('taPageStyle'); if(old) old.remove(); document.head.appendChild(st);
  const isFda=CURRENT_USER.role==='fda';
  document.getElementById('content').innerHTML=`<div class="panel" id="printArea" style="max-width:1120px;margin:0 auto;font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;background:#fff;color:#000;">
    <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print (A4 Landscape)</button>
      <button class="btn btn-primary" onclick="taDownloadPdf('${id}')">⬇ PDF Download</button>
      <label style="font-size:12px;">ಒಂದು ಪುಟದಲ್ಲಿ ಪ್ರಯಾಣಗಳು:
        <select onchange="taPrintView('${id}',this.value)" style="padding:5px;">${[5,10,15,20].map(n=>`<option ${n===per?'selected':''}>${n}</option>`).join('')}</select></label>
      ${isFda?`<button class="btn btn-outline" onclick="taSetBillRates('${id}')">⚙ ದರ ಬದಲಿಸಿ (DA ₹${taMoney(b.daRate)} · ಫೇರ್ ₹${taMoney(b.fareRate)})</button>`:''}
      <button class="btn btn-outline" onclick="taClosePrint()">✕ ಮುಚ್ಚಿ</button>
    </div>${html}</div>`;
}
function taSignHtml(b){
  if(taStatus(b)!=='Submitted'||!b.signText) return '';
  return `<div>Digitally signed by</div><div style="font-weight:800;text-transform:uppercase;">${esc(b.staffName)}</div><div>Date: ${esc(b.signText.split(' ')[0])}</div><div>${esc(b.signText.split(' ')[1]||'')}</div>
    <div style="font-size:${'0.85em'};margin-top:3px;">${esc(b.signHost||'')}${b.signIp?` &nbsp;|&nbsp; IP: ${esc(b.signIp)}${b.signDevice?' ('+esc(b.signDevice)+')':''}`:(b.signDevice?` &nbsp;|&nbsp; ${esc(b.signDevice)}`:'')}</div>`;
}
function taStampText(d){
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(d).reduce((a,x)=>{a[x.type]=x.value;return a;},{});
  return `${p.day}-${p.month}-${p.year} ${p.hour==='24'?'00':p.hour}:${p.minute}:${p.second}`;
}
async function taGetIp(){
  try{
    const r=await Promise.race([fetch('https://api.ipify.org?format=json'),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),4000))]);
    const j=await r.json(); return (j&&j.ip)||'';
  }catch(e){ return ''; }
}
function taDownloadPdf(id){
  const b=taGet(id); if(!b) return;
  const old=document.title, nm='TA_Bill_'+String(b.staffName||'').replace(/[^A-Za-z0-9]+/g,'_')+'_'+(b.fromDate||'')+'_to_'+(b.toDate||'');
  document.title=nm;
  const done=()=>{ document.title=old; window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  showToast('ತೆರೆಯುವ ಕಿಟಕಿಯಲ್ಲಿ Destination: "Save as PDF" ಆರಿಸಿ → Save',5000);
  setTimeout(()=>{ try{ window.print(); }catch(e){ done(); } },300);
  setTimeout(done,90000);
}
function taClosePrint(){ const o=document.getElementById('taPageStyle'); if(o) o.remove(); navigate(CURRENT_PAGE); }

/* ================= EL ARJI (ರಜಾ ಅರ್ಜಿ ಪ್ರಪತ್ರ 1ಎ — Earned Leave application) =================
   Staff / Warden / Principal / FDA fill PAGE 1 only (all entries in Kannada), then Approve -> goes to FDA.
   FDA (+Principal view): register, print both pages (A4 portrait) as PDF or MS Word (.doc).
   Data: DB.elApps[]
================================================================================================ */
let EL_EDIT_ID=null;
const EL_FIELDS_KN=['nameKn','post','office','pay','leaveType','reason','prevLeave','leaveAddr'];
const EL_LABEL={nameKn:'ಅರ್ಜಿದಾರನ ಹೆಸರು',post:'ಧಾರಣ ಮಾಡಿದ ಹುದ್ದೆ',office:'ಇಲಾಖೆ ಇಲ್ಲವೆ ಕಛೇರಿ',pay:'ವೇತನ',leaveType:'ರಜೆಯ ಪ್ರಭಾವ',reason:'ರಜೆಗೆ ಅರ್ಜಿ ಹಾಕಿದ್ದಕ್ಕೆ ಕಾರಣಗಳು',prevLeave:'ಕಳೆದ ರಜೆ ವಿವರ',leaveAddr:'ರಜಾ ಅವಧಿಯಲ್ಲಿ ವಿಳಾಸ',fromDate:'ರಜೆ ಆರಂಭ ದಿನಾಂಕ',toDate:'ರಜೆ ಕೊನೆಯ ದಿನಾಂಕ'};

function elGet(id){ return (DB.elApps||[]).find(x=>x.id===id); }
function elStatus(a){ return a.status==='Submitted'?'Submitted':'Draft'; }
function elCanEdit(a){ return !!a && (CURRENT_USER.role==='fda' || (a.hrmsId===CURRENT_USER.hrmsId && elStatus(a)!=='Submitted')); }
function elHasLatin(s){ return /[A-Za-z]/.test(String(s==null?'':s)); }
function elDays(a){
  const ok=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&+d.slice(0,4)>=2000&&+d.slice(0,4)<=2100;
  if(!ok(a.fromDate)||!ok(a.toDate)) return 0;
  const n=Math.round((new Date(a.toDate+'T00:00:00')-new Date(a.fromDate+'T00:00:00'))/86400000)+1;
  return n>0?n:0;
}
function elLeaveText(a){
  const days=elDays(a), f=taDMY(a.fromDate), t=taDMY(a.toDate);
  let s=a.leaveType||'';
  if(days) s+=(s?', ':'')+days+' ದಿನಗಳು';
  if(f) s+=` (${f} ರಿಂದ${t?' '+t+' ರವರೆಗೆ':''})`;
  return s;
}
function elStatusBadge(a){
  return elStatus(a)==='Submitted'?`<span class="badge badge-ok">✅ FDA ಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ</span><div style="font-size:10px;color:var(--muted);">${esc(a.signText||'')}</div>`:`<span class="badge badge-warn">ಕರಡು (Draft)</span>`;
}

// ---------- staff: list ----------
function renderELList(){
  EL_EDIT_ID=null;
  const mine=(DB.elApps||[]).filter(x=>x.hrmsId===CURRENT_USER.hrmsId).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📄 EL ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (ರಜಾ ಅರ್ಜಿ ಪ್ರಪತ್ರ 1ಎ)</h2>
    <div class="desc">ಗಳಿಕೆ ರಜೆ (Earned Leave) ಅರ್ಜಿಯ ಪುಟ 1 ಅನ್ನು ಕನ್ನಡದಲ್ಲಿ ತುಂಬಿ, ಅನುಮೋದಿಸಿ FDA ಗೆ ಕಳುಹಿಸಿ.</div></div>
    <div class="panel">
      <div class="form-actions" style="margin-bottom:10px;"><button class="btn btn-primary" onclick="elCreate()">➕ ಹೊಸ EL ಅರ್ಜಿ</button></div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ರಜೆ ವಿವರ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
      ${mine.length?mine.map((a,i)=>`<tr><td>${i+1}</td><td style="white-space:normal;">${esc(elLeaveText(a)||'—')}</td><td>${elStatusBadge(a)}</td>
        <td class="actions-cell"><button class="btn btn-sm btn-primary" onclick="elOpen('${a.id}')">${elStatus(a)==='Submitted'?'👁 ನೋಡಿ':'✏️ ತೆರೆಯಿರಿ / ಬದಲಿಸಿ'}</button>
        <button class="btn btn-sm btn-gold" onclick="elPrintView('${a.id}')">🖨️ Preview</button>
        ${elStatus(a)==='Submitted'?'':`<button class="btn btn-sm btn-outline" onclick="elDelete('${a.id}')">🗑</button>`}</td></tr>`).join('')
      :`<tr class="empty-row"><td colspan="4">ಇನ್ನೂ ಯಾವುದೇ EL ಅರ್ಜಿ ಇಲ್ಲ. "ಹೊಸ EL ಅರ್ಜಿ" ಒತ್ತಿ.</td></tr>`}
      </tbody></table></div>
    </div>`;
}
function elCreate(){
  const mine=(DB.elApps||[]).filter(x=>x.hrmsId===CURRENT_USER.hrmsId).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const p=mine[0]||{};
  const a={id:uid(),hrmsId:CURRENT_USER.hrmsId,staffName:CURRENT_USER.name,nameKn:p.nameKn||'',post:p.post||'',office:p.office||'',pay:p.pay||'',
    leaveType:'ಗಳಿಕೆ ರಜೆ',fromDate:'',toDate:'',reason:'',prevLeave:'---',leaveAddr:'',createdAt:new Date().toISOString()};
  if(!DB.elApps) DB.elApps=[]; DB.elApps.push(a); saveDB();
  EL_EDIT_ID=a.id; renderELEditor();
}
function elOpen(id){ EL_EDIT_ID=id; renderELEditor(); }
function elDelete(id){
  const a=elGet(id); if(!a) return;
  if(!confirm('ಈ EL ಅರ್ಜಿ ಅಳಿಸುವುದೇ?')) return;
  DB.elApps=DB.elApps.filter(x=>x.id!==id); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); navigate(CURRENT_PAGE);
}

// ---------- editor: PAGE 1 only (rows 2, 6, 10 locked) ----------
function elSet(id,field,v,el){
  const a=elGet(id); if(!a||!elCanEdit(a)) return;
  a[field]=v; saveDB();
  if(el) elLive(el);
  if(field==='fromDate'||field==='toDate'){ const d=document.getElementById('elDays'); if(d) d.textContent=elDays(a)?elDays(a)+' ದಿನಗಳು':''; }
  if(EL_FIELDS_KN.includes(field)&&elHasLatin(v)) showToast('⚠ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಬರೆಯಿರಿ (English ಅಕ್ಷರ ಬೇಡ)',3500);
}
function elLive(el){ el.style.borderColor=elHasLatin(el.value)?'#c62828':'#e0c86a'; el.style.background=elHasLatin(el.value)?'#fdecea':'#fff'; }
function renderELEditor(){
  const a=elGet(EL_EDIT_ID); if(!a){ navigate(CURRENT_PAGE); return; }
  const can=elCanEdit(a), id=a.id, d=can?'':'disabled';
  const back=CURRENT_PAGE==='elregister'?'elregister':'elarji';
  const inS='width:100%;padding:6px 7px;font-size:14px;border:1px solid #e0c86a;border-radius:5px;box-sizing:border-box;font-family:inherit;';
  const inp=(f,ph)=>`<input type="text" value="${esc(a[f])}" ${d} placeholder="${ph||''}" oninput="elLive(this)" onchange="elSet('${id}','${f}',this.value,this)" style="${inS}">`;
  const ta=(f,h)=>`<textarea ${d} oninput="elLive(this)" onchange="elSet('${id}','${f}',this.value,this)" style="${inS}height:${h||70}px;">${esc(a[f])}</textarea>`;
  const lock=(t)=>`<td style="background:#f1f1f1;color:#333;">🔒 ${t}</td>`;
  const lab=(t)=>`<td style="background:#f1f1f1;color:#333;">🔒 ${t}</td>`;
  const labE=(t)=>`<td>${t}</td>`;
  const dt=(f)=>`<input type="date" min="2000-01-01" max="2100-12-31" value="${esc(a[f])}" ${d} onchange="elSet('${id}','${f}',this.value,this)" style="${inS}">`;
  const rowS='style="vertical-align:top;"';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📄 EL ಅರ್ಜಿ — ರಜಾ ಅರ್ಜಿ ಪ್ರಪತ್ರ 1ಎ (ಪುಟ 1)</h2>
    <div class="desc">ಹಳದಿ ಅಂಚಿನ ಕೋಶಗಳನ್ನು <b>ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ</b> ತುಂಬಿ (ಹೆಸರು ಸೇರಿ). 🔒 ಬೂದು ಬಣ್ಣದ ಬಾಬ್ತುಗಳು 2, 6 ಮತ್ತು 10 ಬದಲಿಸಲಾಗದು.</div></div>
    <div class="panel">
      ${elStatus(a)==='Submitted'?`<div style="margin-bottom:8px;">${elStatusBadge(a)}</div>`:''}
      <div style="text-align:center;font-weight:700;margin-bottom:6px;">ರಜಾ ಅರ್ಜಿ ಪ್ರಪತ್ರ — ಟಿಪ್ಪಣಿ: 1 ರಿಂದ 9 ರವರೆಗಿನ ಬಾಬ್ತುಗಳನ್ನು ಎಲ್ಲಾ ಅರ್ಜಿದಾರರೂ ತುಂಬತಕ್ಕದ್ದು.</div>
      <div class="table-wrap" style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;min-width:640px;">
        <colgroup><col style="width:6%"><col style="width:40%"><col style="width:54%"></colgroup>
        <tbody style="white-space:normal;">
        <tr ${rowS}><td>01.</td>${labE('ಅರ್ಜಿದಾರನ ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ) ✱')}<td>${inp('nameKn','ಉದಾ: ಪಲ್ಲವಿ ಡಿ.ಎಂ.')}</td></tr>
        <tr ${rowS}><td>02.</td>${lab('ಅನ್ವಯವಾಗುವ ರಜಾ ನಿಯಮಗಳು, ಅಂದರೆ ಎಂ.ಎಸ್. ನಿಯಮಾವಳಿ / ಬಿಸಿಎಸ್ ನಿಯಮಾವಳಿ / ಮದ್ರಾಸು / ಕೇಂದ್ರ ರಜಾ ನಿಯಮಾವಳಿ / ಎಸ್‌ಸಿಎಸ್ ನಿಯಮಾವಳಿ / ಎಂಸಿಎಸ್ ನಿಯಮಾವಳಿ')}${lock('ಕೆ.ಸಿ.ಎಸ್.ಆರ್')}</tr>
        <tr ${rowS}><td>03.</td>${labE('ಧಾರಣ ಮಾಡಿದ ಹುದ್ದೆ ✱')}<td>${inp('post','ಉದಾ: ಸಹ ಶಿಕ್ಷಕರು (ಹಿಂದಿ)')}</td></tr>
        <tr ${rowS}><td>04.</td>${labE('ಇಲಾಖೆ ಇಲ್ಲವೆ ಕಛೇರಿ ✱')}<td>${inp('office','ಉದಾ: ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಭಟ್ಕಳ')}</td></tr>
        <tr ${rowS}><td>05.</td>${labE('ವೇತನ ✱')}<td>${inp('pay','ಉದಾ: 49050-9250 / ಮೂಲ ವೇತನ ರೂ. 52000')}</td></tr>
        <tr ${rowS}><td>06.</td>${lab('ಈ ಹುದ್ದೆಯಲ್ಲಿ ಪಡೆಯುವ ಮನೆ ಬಾಡಿಗೆ ಭತ್ಯೆ, ವಾಹನ ಭತ್ಯೆ ಅಥವಾ ಇತರ ಪರಿಹಾರ ಭತ್ಯೆಗಳು')}${lock('ನಿಯಮಾವಳಿ ಅನ್ವಯ')}</tr>
        <tr ${rowS}><td>07.</td>${labE('ಅರ್ಜಿ ಹಾಕಿದ ರಜೆಯ ಪ್ರಭಾವ ಮತ್ತು ಅವಧಿ ಮತ್ತು ಯಾವ ದಿನಾಂಕದಿಂದ ಬೇಕಾಗಿದೆ ✱')}
          <td><div style="margin-bottom:5px;"><label style="font-size:11px;color:var(--muted);">ರಜೆಯ ಪ್ರಭಾವ</label>${inp('leaveType')}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"><div><label style="font-size:11px;color:var(--muted);">ಇಂದ (ದಿನಾಂಕ)</label>${dt('fromDate')}</div><div><label style="font-size:11px;color:var(--muted);">ವರೆಗೆ (ದಿನಾಂಕ)</label>${dt('toDate')}</div></div>
              <div id="elDays" style="font-size:12px;font-weight:700;margin-top:4px;">${elDays(a)?elDays(a)+' ದಿನಗಳು':''}</div></td></tr>
        <tr ${rowS}><td>08.</td>${labE('ರಜೆಗೆ ಅರ್ಜಿ ಹಾಕಿದ್ದಕ್ಕೆ ಕಾರಣಗಳು ✱')}<td>${ta('reason',90)}</td></tr>
        <tr ${rowS}><td>09.</td>${labE('ಕಳೆದ ರಜೆಯಿಂದ ಹಿಂತಿರುಗಿ ಬಂದ ದಿನಾಂಕ ಮತ್ತು ಆ ರಜೆಯ ಪ್ರಭಾವ ಮತ್ತು ಅವಧಿ')}<td>${ta('prevLeave',50)}</td></tr>
        <tr ${rowS}><td></td>${labE('(ಎ) ರಜಾ ಅವಧಿಯಲ್ಲಿ ವಿಳಾಸ ✱')}<td>${ta('leaveAddr',70)}</td></tr>
        <tr ${rowS}><td>10.</td>${lab('(ಎ) ರಜೆಯ ಮುಕ್ತಾಯದ ಹೊತ್ತಿಗೆ ಇಲ್ಲವೆ ರಜೆಯು ಸಲ್ಲುತ್ತಿರುವಾಗ ನಾನು ನಿವೃತ್ತನಾದ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿವರ್ತಿತ ರಜಾ ಅವಧಿಯಲ್ಲಿ ಪಡೆದ ರಜಾ ಸಂಬಳ ಮತ್ತು ಅರ್ಧ ವೇತನ ರಜಾ ಅವಧಿಯಲ್ಲಿ ಅನುಮತಿಸುವ ರಜಾ ಸಂಬಳ ಇವುಗಳ ನಡುವಣ ಅಂತರವನ್ನು ಮರುಪಾವತಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.')}${lock('-----')}</tr>
        <tr ${rowS}><td></td>${lab('(ಬ) ನಾನು ಉಪಯೋಗಿಸಿಕೊಂಡ ಬಾಕಿಯಿಲ್ಲದ ರಜೆಯ ಮೊತ್ತಕ್ಕೆ ಕಡಿಮೆಯಿಲ್ಲದಷ್ಟು ಅರ್ಧ ವೇತನ ರಜೆಯನ್ನು ಗಳಿಸುವುದರೊಳಗಾಗಿ ನನ್ನ ನಿವೃತ್ತಿಯಾದ ಇಲ್ಲವೆ ನಾನು ರಾಜೀನಾಮೆ ಇತ್ತ ಸಂದರ್ಭದಲ್ಲಿ "ಬಾಕಿಯಿಲ್ಲದ ರಜಾ" ಅವಧಿಯಲ್ಲಿ ಅನುಮತಿಸಲು ಬಾರದಂಥ, ನಾನು ಪಡೆದ ರಜಾ ಸಂಬಳವನ್ನು ಮರುಪಾವತಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.')}${lock('-----')}</tr>
        </tbody></table></div>
      <div style="font-size:12px;color:var(--muted);margin:8px 0;">ದಿನಾಂಕ ಮತ್ತು "ಅರ್ಜಿದಾರನ ಸಹಿ" — ಅನುಮೋದಿಸಿದಾಗ ತಾನಾಗಿ ಡಿಜಿಟಲ್ ಸಹಿಯೊಂದಿಗೆ ಬರುತ್ತದೆ.</div>
      <div class="form-actions" style="margin-top:8px;">
        <button class="btn btn-gold" onclick="elPrintView('${id}')">🖨️ Preview</button>
        ${a.hrmsId===CURRENT_USER.hrmsId&&elStatus(a)!=='Submitted'?`<button class="btn btn-primary" style="background:#1F7A4D;" onclick="elApprove('${id}')">✅ ಅನುಮೋದಿಸಿ — FDA ಗೆ ಕಳುಹಿಸಿ (Approve)</button>`:''}
        ${a.hrmsId===CURRENT_USER.hrmsId&&elStatus(a)==='Submitted'?`<button class="btn btn-outline" onclick="elReopen('${id}')">↩ ಮತ್ತೆ ತೆರೆಯಿರಿ</button>`:''}
        <button class="btn btn-outline" onclick="navigate('${back}')">⬅ ಹಿಂದೆ</button>
      </div>
    </div>`;
}

// ---------- approve / reopen ----------
function elProblems(a){
  const miss=[], lat=[];
  ['nameKn','post','office','pay','leaveType','reason','leaveAddr','fromDate','toDate'].forEach(f=>{ if(!String(a[f]||'').trim()) miss.push(EL_LABEL[f]); });
  EL_FIELDS_KN.forEach(f=>{ if(elHasLatin(a[f])) lat.push(EL_LABEL[f]); });
  if(a.fromDate&&a.toDate&&!elDays(a)) miss.push('ದಿನಾಂಕ ಸರಿಯಿಲ್ಲ (ವರೆಗೆ ದಿನಾಂಕ ಇಂದ ದಿನಾಂಕಕ್ಕಿಂತ ಮೊದಲು ಇರಬಾರದು)');
  return {miss,lat};
}
async function elApprove(id){
  const a=elGet(id); if(!a||a.hrmsId!==CURRENT_USER.hrmsId||elStatus(a)==='Submitted') return;
  if(!String(a.prevLeave||'').trim()){ a.prevLeave='---'; }
  const pr=elProblems(a);
  if(pr.miss.length){ alert('ಈ ಬಾಬ್ತುಗಳನ್ನು ತುಂಬಿ:\n• '+pr.miss.join('\n• ')); return; }
  if(pr.lat.length){ alert('ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಬರೆಯಬೇಕು. ಈ ಬಾಬ್ತುಗಳಲ್ಲಿ English ಅಕ್ಷರಗಳಿವೆ:\n• '+pr.lat.join('\n• ')); return; }
  if(!confirm(`"${elLeaveText(a)}" — ಈ ರಜಾ ಅರ್ಜಿಯನ್ನು ಅನುಮೋದಿಸಿ FDA ಗೆ ಕಳುಹಿಸುವುದೇ?\n(ಕಳುಹಿಸಿದ ನಂತರ ಬದಲಿಸಲು "ಮತ್ತೆ ತೆರೆಯಿರಿ" ಬಳಸಿ.)`)) return;
  showToast('⏳ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...');
  let ts={time:'',date:new Date().toISOString().slice(0,10),server:false};
  try{ ts=await getServerTimeStamp(); }catch(e){}
  a.status='Submitted'; a.submittedAt=ts.time; a.submittedDate=ts.date; a.submittedServerTime=!!ts.server;
  a.signText=taStampText(ts.iso?new Date(ts.iso):new Date());
  a.signHost=location.host||'';
  a.signDevice=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)?'Mobile':'Computer';
  a.signIp=await taGetIp();
  logAudit('Approve','ELApplication',id,`${a.staffName} EL application ${elLeaveText(a)}`);
  saveDB();
  staffNamesForRole('fda').filter(n=>n!==CURRENT_USER.name).forEach(n=>pushNotification(n,`📄 ${a.staffName} — EL ಅರ್ಜಿ (${elLeaveText(a)}) ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಿದ್ದಾರೆ`));
  showToast('✅ ಅನುಮೋದಿಸಿ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  renderELEditor();
}
function elReopen(id){
  const a=elGet(id); if(!a||a.hrmsId!==CURRENT_USER.hrmsId||elStatus(a)!=='Submitted') return;
  if(!confirm('ಅರ್ಜಿ ಮತ್ತೆ ಬದಲಿಸಲು ತೆರೆಯುವುದೇ? FDA ವಹಿಯಿಂದ ಇದು ಮರೆಯಾಗುತ್ತದೆ; ಮತ್ತೆ ಅನುಮೋದಿಸಬೇಕು.')) return;
  a.status='Draft'; ['submittedAt','submittedDate','signText','signHost','signDevice','signIp'].forEach(k=>delete a[k]); saveDB(); renderELEditor();
}

// ---------- FDA register ----------
function renderELRegister(){
  EL_EDIT_ID=null;
  const isFda=CURRENT_USER.role==='fda';
  const list=(DB.elApps||[]).filter(a=>elStatus(a)==='Submitted').slice().sort((a,b)=>(b.signText||'').split(' ')[0].split('-').reverse().join('').localeCompare((a.signText||'').split(' ')[0].split('-').reverse().join('')));
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 EL ಅರ್ಜಿ ವಹಿ (Earned Leave Applications)</h2>
    <div class="desc">ಸಿಬ್ಬಂದಿ ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಿದ ರಜಾ ಅರ್ಜಿಗಳು. ${isFda?'ಪ್ರತಿ ಅರ್ಜಿಯ PDF / Word (A4 ಪೋರ್ಟ್ರೇಟ್, ಪುಟ 1 ಮತ್ತು 2) ತೆಗೆಯಬಹುದು.':'ವೀಕ್ಷಣೆಗೆ ಮಾತ್ರ.'}</div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>ಅರ್ಜಿದಾರರು</th><th>ಹುದ್ದೆ</th><th>ರಜೆ ವಿವರ</th><th>ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ</th><th>ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ</th><th>Action</th></tr></thead><tbody>
      ${list.length?list.map((a,i)=>`<tr><td>${i+1}</td><td><b>${esc(a.nameKn||a.staffName)}</b></td><td style="white-space:normal;font-size:12px;">${esc(a.post)}</td>
        <td style="white-space:normal;font-size:12px;">${esc(elLeaveText(a))}</td><td style="font-size:11.5px;">${esc(a.signText||'')}</td>
        <td style="font-size:11.5px;white-space:normal;">${a.pStage==='Approved'?`<span class="badge badge-ok">✅ ಅನುಮೋದಿತ</span><div style="font-size:10px;color:var(--muted);">${esc(a.pStamp||'')}</div>`:a.pStage==='Sent'?`<span class="badge badge-warn">⏳ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ</span>`:(a.pReturnReason?`<span class="badge badge-draft">↩ ಹಿಂದಿರುಗಿದೆ</span><div style="font-size:10px;color:var(--muted);">${esc(a.pReturnReason)}</div>`:'—')}</td>
        <td class="actions-cell">${CURRENT_USER.role==='principal'&&a.pStage==='Sent'?`<button class="btn btn-sm btn-primary" onclick="elPrincipalApprove('${a.id}')">✍ ಅನುಮೋದಿಸಿ</button><button class="btn btn-sm btn-outline" onclick="elPrincipalReturn('${a.id}')">↩ ಹಿಂದಿರುಗಿಸಿ</button>`:''}
        ${isFda&&a.pStage!=='Sent'&&a.pStage!=='Approved'?`<button class="btn btn-sm btn-primary" onclick="elSendPrincipal('${a.id}')">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button>`:''}
        ${isFda&&a.pStage==='Sent'?`<button class="btn btn-sm btn-outline" onclick="elRecallPrincipal('${a.id}')">↩ ಹಿಂತೆಗೆ</button>`:''}<button class="btn btn-sm btn-gold" onclick="elPrintView('${a.id}')">🖨️ Print / PDF / Word</button>
        ${dscBtns('elapp',a.id,(a.nameKn||a.staffName||'')+' EL')}
        <button class="btn btn-sm btn-outline" onclick="elOpen('${a.id}')">${isFda?'✏️ ತೆರೆಯಿರಿ':'👁 ನೋಡಿ'}</button>
        ${isFda?`<button class="btn btn-sm btn-outline" onclick="elDelete2('${a.id}')">🗑</button>`:''}</td></tr>`).join('')
      :`<tr class="empty-row"><td colspan="7">ಯಾವುದೇ EL ಅರ್ಜಿ ಬಂದಿಲ್ಲ.</td></tr>`}
    </tbody></table></div></div>`;
}
function elSendPrincipal(id){
  const a=elGet(id); if(!a||CURRENT_USER.role!=='fda') return;
  a.pStage='Sent'; a.pSentBy=CURRENT_USER.name; a.pSentAt=todayStr(); delete a.pReturnReason;
  staffNamesForRole('principal').forEach(n=>pushNotification(n,`📄 EL ಅರ್ಜಿ ಅನುಮೋದನೆಗೆ: ${a.nameKn||a.staffName}`));
  saveDB(); showToast('📤 Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderELRegister();
}
function elRecallPrincipal(id){
  const a=elGet(id); if(!a||CURRENT_USER.role!=='fda'||a.pStage!=='Sent') return;
  delete a.pStage; saveDB(); renderELRegister();
}
async function elPrincipalApprove(id){
  const a=elGet(id); if(!a||CURRENT_USER.role!=='principal'||a.pStage!=='Sent') return;
  if(!confirm((a.nameKn||a.staffName)+' — EL ಅರ್ಜಿ ಅನುಮೋದಿಸುವುದೇ?')) return;
  const ts=await getServerTimeStamp(); const m={}; await cbSignMeta(m,ts);
  a.pStage='Approved'; a.pName=CURRENT_USER.name; a.pStamp=m.signStamp; a.pHost=m.signHost; a.pIp=m.signIp; a.pDevice=m.signDevice;
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✅ EL ಅರ್ಜಿ ಅನುಮೋದನೆ: ${a.nameKn||a.staffName}`));
  saveDB(); showToast('✅ ಅನುಮೋದಿಸಲಾಗಿದೆ'); renderELRegister();
}
function elPrincipalReturn(id){
  const a=elGet(id); if(!a||CURRENT_USER.role!=='principal'||a.pStage!=='Sent') return;
  const r=prompt('ಹಿಂದಿರುಗಿಸಲು ಕಾರಣ (ಕಡ್ಡಾಯ):'); if(!r||!r.trim()) return;
  delete a.pStage; a.pReturnReason=r.trim();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`↩ EL ಅರ್ಜಿ ಹಿಂದಿರುಗಿದೆ: ${a.nameKn||a.staffName} — ${r.trim()}`));
  saveDB(); showToast('ಹಿಂದಿರುಗಿಸಲಾಗಿದೆ'); renderELRegister();
}
function elDelete2(id){ if(CURRENT_USER.role!=='fda') return; elDelete(id); }

// ---------- the form itself (shared by print preview, PDF and Word) ----------
function elSignHtml(a){
  // manual signature: only the applicant's name is printed (no digital-signature block)
  return `<div style="height:22px;"></div><div><b>${esc(a.nameKn||a.staffName||'')}</b></div>`;
}
function elFormHtml(a,both){
  const B='border:1px solid #000;';
  const td=`${B}padding:5px 7px;vertical-align:top;font-size:11pt;line-height:1.45;white-space:normal;text-transform:none;letter-spacing:0;word-wrap:break-word;overflow-wrap:anywhere;text-align:left;font-weight:normal;`;
  const PG='font-family:"Nirmala UI","Noto Sans Kannada","Tunga",Arial,sans-serif;color:#000;text-transform:none;';
  const nl=x=>esc(x||'').replace(/\n/g,'<br>');
  const row=(no,label,val,h)=>`<tr${h?` style="height:${h}px;"`:''}><td width="6%" style="${td}width:6%;">${no}</td><td width="46%" style="${td}width:46%;">${label}</td><td width="48%" style="${td}width:48%;">${val}</td></tr>`;
  const dateTxt='';
  const page1=`<style>.el-page td{white-space:normal!important;text-transform:none!important;letter-spacing:0!important;}.el-page table{table-layout:fixed;}</style>
  <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:4px;"><tr>
    <td style="width:35%;vertical-align:top;">" ಪ್ರಪತ್ರ 1ಎ"<br>( ನಿಯಮ 175 ನೋಡಿ)</td><td style="width:35%;text-align:center;vertical-align:top;font-weight:bold;">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</td><td style="width:30%;">&nbsp;</td></tr></table>
  <div style="text-align:center;font-size:11.5pt;font-weight:bold;text-decoration:underline;margin:6px 0;">ರಜಾ ಅರ್ಜಿ ಪ್ರಪತ್ರ.</div>
  <div style="font-size:10pt;line-height:1.35;margin-bottom:5px;">ಟಿಪ್ಪಣಿ:- &nbsp;1 ರಿಂದ 9 ರವರೆಗಿನ ಬಾಬ್ತುಗಳನ್ನು ಎಲ್ಲಾ ಅರ್ಜಿದಾರರೂ ಗೆಜೆಟೆಡ್ ಆಗಿರಲಿ, ನಾನ್ ಗೆಜೆಟೆಡ್ ಆಗಿರಲಿ ತುಂಬತಕ್ಕದ್ದು.<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;12ನೆಯ ಬಾಬ್ತು ಗೆಜೆಟೆಡ್ ಅಧಿಕಾರಿಗಳ ಸಂದರ್ಭದಲ್ಲಿ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ. 13ನೆಯ ಮತ್ತು 14ನೆಯ ಬಾಬ್ತುಗಳು ನಾನ್-ಗೆಜೆಟೆಡ್ ಅಧಿಕಾರಿಗಳ ಸಂದರ್ಭದಲ್ಲಿ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ.</div>
  <table width="100%" border="1" cellspacing="0" cellpadding="3" style="width:100%;border-collapse:collapse;table-layout:fixed;${B}"><colgroup><col width="6%" style="width:6%"><col width="46%" style="width:46%"><col width="48%" style="width:48%"></colgroup>
    ${row('01.','ಅರ್ಜಿದಾರನ ಹೆಸರು ..',nl(a.nameKn),24)}
    ${row('02.','ಅನ್ವಯವಾಗುವ ರಜಾ ನಿಯಮಗಳು, ಅಂದರೆ ಎಂ.ಎಸ್. ನಿಯಮಾವಳಿ / ಬಿಸಿಎಸ್ ನಿಯಮಾವಳಿ / ಮದ್ರಾಸು / ಕೇಂದ್ರ ರಜಾ ನಿಯಮಾವಳಿ / ಎಸ್‌ಸಿಎಸ್ ನಿಯಮಾವಳಿ / ಎಂಸಿಎಸ್ ನಿಯಮಾವಳಿ ..','ಕೆ.ಸಿ.ಎಸ್.ಆರ್')}
    ${row('03.','ಧಾರಣ ಮಾಡಿದ ಹುದ್ದೆ ..',nl(a.post))}
    ${row('04.','ಇಲಾಖೆ ಇಲ್ಲವೆ ಕಛೇರಿ ..',nl(a.office),44)}
    ${row('05.','ವೇತನ ..',nl(a.pay))}
    ${row('06.','ಈ ಹುದ್ದೆಯಲ್ಲಿ ಪಡೆಯುವ ಮನೆ ಬಾಡಿಗೆ ಭತ್ಯೆ, ವಾಹನ ಭತ್ಯೆ ಅಥವಾ ಇತರ ಪರಿಹಾರ ಭತ್ಯೆಗಳು ..','ನಿಯಮಾವಳಿ ಅನ್ವಯ')}
    ${row('07.','ಅರ್ಜಿ ಹಾಕಿದ ರಜೆಯ ಪ್ರಭಾವ ಮತ್ತು ಅವಧಿ ಮತ್ತು ಯಾವ ದಿನಾಂಕದಿಂದ ಬೇಕಾಗಿದೆ ..',esc(elLeaveText(a)),56)}
    ${row('08.','ರಜೆಗೆ ಅರ್ಜಿ ಹಾಕಿದ್ದಕ್ಕೆ ಕಾರಣಗಳು ..',nl(a.reason),44)}
    ${row('09.','ಕಳೆದ ರಜೆಯಿಂದ ಹಿಂತಿರುಗಿ ಬಂದ ದಿನಾಂಕ ಮತ್ತು ಆ ರಜೆಯ ಪ್ರಭಾವ ಮತ್ತು ಅವಧಿ ..',`<div style="text-align:center;">${nl(a.prevLeave||'---')}</div>`)}
    ${row('','(ಎ) ರಜಾ ಅವಧಿಯಲ್ಲಿ ವಿಳಾಸ ..',nl(a.leaveAddr),50)}
    ${row('10.','(ಎ) ರಜೆಯ ಮುಕ್ತಾಯದ ಹೊತ್ತಿಗೆ ಇಲ್ಲವೆ ರಜೆಯು ಸಲ್ಲುತ್ತಿರುವಾಗ ನಾನು ನಿವೃತ್ತನಾದ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿವರ್ತಿತ ರಜಾ ಅವಧಿಯಲ್ಲಿ ಪಡೆದ ರಜಾ ಸಂಬಳ ಮತ್ತು ಅರ್ಧ ವೇತನ ರಜಾ ಅವಧಿಯಲ್ಲಿ ಅನುಮತಿಸುವ ರಜಾ ಸಂಬಳ ಇವುಗಳ ನಡುವಣ ಅಂತರವನ್ನು ಮರುಪಾವತಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.','<div style="text-align:center;">-----</div>')}
    ${row('','(ಬ) ನಾನು ಉಪಯೋಗಿಸಿಕೊಂಡ ಬಾಕಿಯಿಲ್ಲದ ರಜೆಯ ಮೊತ್ತಕ್ಕೆ ಕಡಿಮೆಯಿಲ್ಲದಷ್ಟು ಅರ್ಧ ವೇತನ ರಜೆಯನ್ನು ಗಳಿಸುವುದರೊಳಗಾಗಿ ನನ್ನ ನಿವೃತ್ತಿಯಾದ ಇಲ್ಲವೆ ನಾನು ರಾಜೀನಾಮೆ ಇತ್ತ ಸಂದರ್ಭದಲ್ಲಿ " ಬಾಕಿಯಿಲ್ಲದ ರಜಾ " ಅವಧಿಯಲ್ಲಿ ಅನುಮತಿಸಲು ಬಾರದಂಥ, ನಾನು ಪಡೆದ ರಜಾ ಸಂಬಳವನ್ನು ಮರುಪಾವತಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.','<div style="text-align:center;">-----</div>')}
  </table>
  <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:14px;font-size:10.5pt;"><tr>
    <td style="width:50%;vertical-align:bottom;">ದಿನಾಂಕ: ${dateTxt}</td>
    <td style="width:50%;vertical-align:bottom;text-align:right;"><div style="text-align:right;font-size:9.5pt;line-height:1.3;">${elSignHtml(a)}</div><div style="margin-top:4px;">ಅರ್ಜಿದಾರನ ಸಹಿ.</div></td></tr></table>`;
  if(!both) return `<div class="el-page" style="${PG}">${page1}</div>`;
  const T2=`${B}padding:5px 7px;vertical-align:top;font-size:11pt;line-height:1.45;white-space:normal;text-transform:none;letter-spacing:0;word-wrap:break-word;overflow-wrap:anywhere;text-align:left;font-weight:normal;`;
  const page2=`
  <div style="text-align:center;font-size:10.5pt;margin-bottom:6px;">-: 2 :-</div>
  <table width="100%" border="1" cellspacing="0" cellpadding="4" style="width:100%;border-collapse:collapse;table-layout:fixed;${B}"><colgroup><col width="6%" style="width:6%"><col width="46%" style="width:46%"><col width="48%" style="width:48%"></colgroup>
    <tr><td width="6%" style="${T2}width:6%;height:80px;">11.</td><td width="46%" style="${T2}width:46%;">ನಿಯಂತ್ರಣ ಅಧಿಕಾರಿಯ ಷರಾ ಮತ್ತು / ಅಥವಾ ಶಿಫಾರಸು.<br><br><br>ದಿನಾಂಕ:</td><td width="48%" style="${T2}width:48%;"><br><br>ಸಹಿ:<br><br>ಪದನಾಮ:</td></tr>
    <tr><td style="${T2}height:80px;">12.</td><td style="${T2}">ಪರಿಶೋಧನ ಅಧಿಕಾರಿಯ ವರದಿ<br><br><br>ದಿನಾಂಕ:</td><td style="${T2}"><br><br>ಸಹಿ:<br><br>ಪದನಾಮ:</td></tr>
    <tr><td style="${T2}" rowspan="2">13.</td><td style="${T2}">ಈ ಅರ್ಜಿಗೆ ಮುಂಚೆ ಅರ್ಜಿದಾರನಿಗೆ ಮಂಜೂರಾದ ರಜೆಯ ವಿವರಣೆ</td><td style="${T2}">&nbsp;</td></tr>
    <tr><td style="${T2}">ರಜೆಯ ಸ್ವರೂಪ<br>ವಿಶೇಷ ಹಕ್ಕಿನ ರಜೆ / ಅರ್ಜಿತ ರಜೆ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:<br>ಸರಾಸರಿ ವೇತನದ ಮೇಲೆ ಫರ್ಲೋ ರಜ / ವೈದ್ಯ ಪ್ರಮಾಣ ಪತ್ರದ ರಜ ಮೇಲೆ ಸರಾಸರಿ ವೇತನದ ರಜ / ಪರಿವರ್ತಿತ ರಜ &nbsp;&nbsp;:<br>ಅರ್ಧ ಸರಾಸರಿ ವೇತನ ರಜ / ಅರ್ಧ ವೇತನ ರಜ &nbsp;&nbsp;&nbsp;:<br>ಬಾಕಿಯಿಲ್ಲದ ರಜ &nbsp;&nbsp;&nbsp;:<br>ಅಸಾಧಾರಣ ರಜ &nbsp;&nbsp;&nbsp;:</td>
      <td style="${T2}">ಚಾಲ್ತಿ ವರ್ಷ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ಕಳೆದ ವರ್ಷ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ಒಟ್ಟು<br><br><br><br><br><br><br>ಒಟ್ಟು:</td></tr>
  </table>
  <table width="100%" border="1" cellspacing="0" cellpadding="4" style="width:100%;border-collapse:collapse;table-layout:fixed;${B}margin-top:-1px;"><colgroup><col width="6%" style="width:6%"><col width="94%" style="width:94%"></colgroup>
    <tr><td width="6%" style="${T2}width:6%;">14.</td><td style="${T2}">ಈ ನಿಯಮಾವಳಿ ಮೇರೆಗೆ &nbsp;&nbsp;:<br><br>-------------200 &nbsp;&nbsp;ರಿಂದ ---------------200 &nbsp;&nbsp;ರವರೆಗೆ<br><br>-----------------ತಿಂಗಳು ------------------ದಿನಗಳ ವಿಶೇಷ ಹಕ್ಕಿನ ರಜೆ / ಅರ್ಜಿತ ರಜೆ ಅನುಮತಿಸಬಹುದಾಗಿದೆಯೆಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸಲಾಗಿದೆ.<br><br><table width="100%" cellspacing="0" cellpadding="0" style="width:100%;"><tr><td style="width:40%;">ದಿನಾಂಕ:</td><td style="width:30%;">ಸಹಿ:<br>ಪದನಾಮ:</td><td></td></tr></table></td></tr>
    <tr><td style="${T2}">15.</td><td style="${T2}height:130px;">ಮಂಜೂರು ಮಾಡುವ ಅಧಿಕಾರಿಯ ಆದೇಶ :<br><br><br><br><div style="text-align:center;">ಸಹಿ:</div><br><table width="100%" cellspacing="0" cellpadding="0" style="width:100%;"><tr><td style="width:50%;">ದಿನಾಂಕ:</td><td>ಪದನಾಮ :</td></tr></table></td></tr>
  </table>
  <div style="margin:14px 0 0 33%;font-size:10.5pt;line-height:1.4;">ಅರ್ಜಿದಾರನು ಯಾವುದೇ ಪರಿಹಾರ ಭತ್ಯವನ್ನು ಪಡೆಯುತ್ತಿದ್ದರೆ ರಜೆಯು ಮುಕ್ತಾಯವಾಗುತ್ತಲೇ ಅವರು ಅದೇ ಹುದ್ದೆಗೆ ಅಥವಾ ಅದೇ ಬಗೆಯ ಭತ್ಯ ಹೊಂದಿರುವ ಇನ್ನೊಂದು ಹುದ್ದೆಗೆ ಅವನು ಮರಳುವ ಸಂಭವವಿದೆಯೋ ಹೇಗೆ ಎಂಬುದನ್ನು ಮಂಜೂರು ಮಾಡುವ ಅಧಿಕಾರಿಯು ಸ್ಪಷ್ಟಪಡಿಸಬೇಕು.</div>`;
  return `<div class="el-page" style="${PG}page-break-after:always;break-after:page;">${page1}</div><div class="el-page" style="${PG}">${page2}</div>`;
}

// ---------- print / PDF / Word (A4 portrait) ----------
function elPrintView(id){
  const a=elGet(id); if(!a) return;
  const both=CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal';
  const st=document.createElement('style'); st.id='elPageStyle'; st.textContent='@page{size:A4 portrait;margin:0;}';
  const old=document.getElementById('elPageStyle'); if(old) old.remove(); document.head.appendChild(st);
  document.getElementById('content').innerHTML=`<div class="panel" id="printArea" style="max-width:800px;margin:0 auto;font-family:'Nirmala UI','Noto Sans Kannada','Tunga',Arial,sans-serif;background:#fff;color:#000;">
    <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
      <button class="btn btn-gold" onclick="elPrint()">🖨️ Print (A4 Portrait)</button>
      ${both?`<button class="btn btn-primary" onclick="elDownloadPdf('${id}')">⬇ PDF Download</button><button class="btn btn-primary" style="background:#1565c0;" onclick="elDownloadWord('${id}')">📝 MS Word (.doc)</button>`:`<span style="font-size:12px;color:var(--muted);">ಪುಟ 1 ಮಾತ್ರ ಪೂರ್ವವೀಕ್ಷಣೆ</span>`}
      <button class="btn btn-outline" onclick="elClosePrint()">✕ ಮುಚ್ಚಿ</button>
    </div>${elSheets(a,both)}</div>`;
}
function elSheets(a,both){
  // A4 portrait sheets (2 pages for FDA/principal) with the web address in the footer
  const html=elFormHtml(a,both);
  const parts=html.split('</div><div class="el-page"');
  const pages=parts.map((p,i)=>(i===0?p+(parts.length>1?'</div>':''):'<div class="el-page"'+p));
  const web=location.host||'mdrsshedbarieoffice.in';
  return `<div class="el-wrap">${pages.map((p,i)=>`<div class="el-sheet"><div class="el-body">${p.replace('page-break-after:always;break-after:page;','')}</div><div class="el-foot"><span>https://${esc(web)}</span><span>Page ${i+1} of ${pages.length}</span></div></div>`).join('')}</div>`;
}
function elPrint(){
  const w=document.querySelector('.el-wrap'); if(!w){ window.print(); return; }
  const host=document.createElement('div'); host.id='elHost'; host.innerHTML=w.outerHTML; document.body.appendChild(host);
  document.body.classList.add('el-printing');
  const done=()=>{ document.body.classList.remove('el-printing'); host.remove(); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  setTimeout(()=>{ window.print(); setTimeout(()=>{ if(document.body.classList.contains('el-printing')) done(); },60000); },300);
}
function elClosePrint(){ const o=document.getElementById('elPageStyle'); if(o) o.remove(); navigate(CURRENT_PAGE); }
function elFileName(a){ return 'EL_Arji_'+String(a.staffName||'').replace(/[^A-Za-z0-9]+/g,'_')+'_'+(a.fromDate||''); }
function elDownloadPdf(id){
  const a=elGet(id); if(!a) return;
  const old=document.title; document.title=elFileName(a);
  const done=()=>{ document.title=old; window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  showToast('ತೆರೆಯುವ ಕಿಟಕಿಯಲ್ಲಿ Destination: "Save as PDF" ಆರಿಸಿ → Save',5000);
  setTimeout(()=>{ try{ elPrint(); }catch(e){ done(); } },300);
  setTimeout(done,90000);
}
function elDownloadWord(id){
  const a=elGet(id); if(!a) return;
  const html='﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>'+esc(elFileName(a))+'</title>'
   +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
   +'<style>@page Section1{size:21.0cm 29.7cm;margin:1.5cm 1.5cm 1.5cm 1.5cm;mso-page-orientation:portrait;} div.Section1{page:Section1;} body{font-family:"Nirmala UI","Tunga","Noto Sans Kannada",serif;font-size:10.5pt;} table{border-collapse:collapse;}</style></head><body><div class="Section1">'
   +elFormHtml(a,true)+'</div></body></html>';
  const blob=new Blob([html],{type:'application/msword'});
  const url=URL.createObjectURL(blob), l=document.createElement('a');
  l.href=url; l.download=elFileName(a)+'.doc'; document.body.appendChild(l); l.click(); l.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  showToast('📝 Word ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಯಿತು');
}

function renderMySalary(){
  const mySlips=(DB.salarySlips||[]).filter(s=>s.hrmsId===CURRENT_USER.hrmsId).slice().sort((a,b)=>b.month.localeCompare(a.month));
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>💰 ನನ್ನ ಸಂಬಳ ಚೀಟಿ (My Salary Slip)</h2>
    <div class="desc">FDA Upload ಮಾಡಿದ ನಿಮ್ಮ ಸಂಬಳ ಚೀಟಿಗಳು — Download ಮಾಡಿ, ಸ್ವೀಕರಿಸಿದ ನಂತರ E-Sign ಮಾಡಿ</div></div>

    <div class="panel">
      <div class="table-wrap"><table><thead><tr>
        <th>ತಿಂಗಳು</th><th>Upload ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>
        ${mySlips.length?mySlips.map(s=>`<tr>
          <td><b>${salaryMonthLabel(s.month)}</b></td>
          <td style="font-size:11.5px;">${fmtDate(s.uploadedAt)}</td>
          <td>${salaryStatusBadge(s.status)}${s.status==='Acknowledged'?`<div style="font-size:10px;color:var(--muted);">${fmtDate(s.ackDate)} ${esc(s.ackAt||'')}</div>`:''}</td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-gold" onclick="downloadSalarySlip('${s.id}')">⬇ Download</button>
            ${s.status!=='Acknowledged'?`<button class="btn btn-sm btn-primary" onclick="acknowledgeSalarySlip('${s.id}')">✅ ಸ್ವೀಕರಿಸಿದೆ — E-Sign</button>`:`<span style="font-size:11px;color:var(--green);">✅ Signed</span>`}
          </td>
        </tr>`).join(''):`<tr class="empty-row"><td colspan="4">ಇನ್ನೂ ಯಾವುದೇ ಸಂಬಳ ಚೀಟಿ Upload ಆಗಿಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="salaryDetailWrap"></div>`;
}

async function acknowledgeSalarySlip(id){
  const slip=(DB.salarySlips||[]).find(s=>s.id===id); if(!slip) return;
  if(!confirm(`"${salaryMonthLabel(slip.month)}" ಸಂಬಳ ಚೀಟಿ ಸ್ವೀಕರಿಸಿದ್ದೀರಿ ಎಂದು ಖಚಿತಪಡಿಸಿ E-Sign ಮಾಡುವುದೇ?`)) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  slip.status='Acknowledged'; slip.ackAt=ts.time; slip.ackDate=ts.date; slip.ackServerTime=ts.server;
  logAudit('Approve','SalarySlip',id,`${slip.staffName} acknowledged — ${salaryMonthLabel(slip.month)}`);
  logAudit('Teacher E-Signature','SalarySlip',id,`${ts.date} ${ts.time}`);
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✅ ${slip.staffName} — ${salaryMonthLabel(slip.month)} ಸಂಬಳ ಚೀಟಿ ಸ್ವೀಕರಿಸಿ Sign ಮಾಡಿದ್ದಾರೆ`));
  showToast('✅ ಸ್ವೀಕೃತಿ ದಾಖಲಾಗಿದೆ — E-Signed');
  renderMySalary();
}

function attBadge(status){
  if(!status) return '<span class="small-muted">—</span>';
  const cls = status==='Present'?'badge-ok' : status==='Absent'?'badge-bad' : ['OD','OOD'].includes(status)?'badge-info':'badge-warn';
  return `<span class="badge ${cls}">${esc(ATT_STATUS_LABELS[status]||status)}</span>`;
}


// ===== Monthly attendance register (NIC e-Office style, A4) =====
function regPrint(html,landscape){
  const host=document.createElement('div'); host.id='regHost'; host.innerHTML=html; document.body.appendChild(host);
  document.body.classList.add('reg-printing'); document.body.classList.toggle('reg-land',!!landscape);
  const done=()=>{ document.body.classList.remove('reg-printing','reg-land'); host.remove(); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  setTimeout(()=>{ window.print(); setTimeout(()=>{ if(document.body.classList.contains('reg-printing')) done(); },60000); },300);
}
function regCode(rec,d){
  if(!rec||!rec.morningStatus){ return new Date(d+'T00:00:00').getDay()===0?'S':''; }
  const c=x=>x==='Present'?'P':x==='Absent'?'A':(x||'');
  const m=c(rec.morningStatus), a=c(rec.afternoonStatus||rec.morningStatus);
  return m===a?m:(m+'/'+a);
}
function regHead(title,sub){
  return `<div class="reg-hd"><div class="reg-k">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)</div><div class="reg-s">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ (BC-265)</div><div class="reg-t">${title}</div><div class="reg-s">${sub}</div></div>`;
}
function regFoot(n,total){ const web=location.host||'mdrsshedbarieoffice.in'; return `<div class="reg-ft"><span>https://${esc(web)}</span><span>Page ${n} of ${total}</span></div>`; }
function regPrincipalSign(rec){
  if(!rec||rec.status!=='Approved') return '';
  return cbDigiSign({signedBy:rec.principalName,signStamp:rec.pStamp||((rec.principalSignedDate?fmtDate(rec.principalSignedDate):'')+' '+(rec.principalSignedAt||'')),signHost:rec.pHost,signIp:rec.pIp,signDevice:rec.pDevice},'','Monthly Attendance Register approved');
}
// All-staff matrix register (FDA / Principal)
function printMonthlyMatrix(id){
  if(!attAllStaffRole()) return;
  const rec=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec) return;
  const [y,m]=rec.month.split('-'); const dim=new Date(+y,+m,0).getDate();
  const days=Array.from({length:dim},(_,i)=>i+1);
  const rows=STAFF.map((st,i)=>{
    let p=0,l=0,a=0;
    const cells=days.map(d=>{ const ds=rec.month+'-'+String(d).padStart(2,'0'); const r=getAttendanceRecord(ds,st.hrmsId); const c=regCode(r,ds);
      if(r&&r.morningStatus){ const ms=r.morningStatus; if(ms==='Present') p++; else if(ms==='Absent') a++; else l++; }
      return `<td class="${c==='S'?'sun':''}">${esc(c)}</td>`; }).join('');
    return `<tr><td>${i+1}</td><td class="nm">${esc(st.name)}<br><span>${esc(st.desig||'')}</span></td>${cells}<td><b>${p}</b></td><td><b>${l}</b></td><td><b>${a}</b></td></tr>`;
  }).join('');
  const html=`<div class="reg-wrap"><div class="reg-sheet"><div class="reg-body">
    ${regHead('ಸಿಬ್ಬಂದಿ ಮಾಸಿಕ ಹಾಜರಾತಿ ವಹಿ / Staff Monthly Attendance Register', esc(salaryMonthLabel(rec.month)))}
    <table class="reg-tb"><thead><tr><th style="width:6mm">Sl</th><th style="width:44mm">ಹೆಸರು / Name</th>${days.map(d=>`<th>${d}</th>`).join('')}<th style="width:8mm">P</th><th style="width:8mm">L</th><th style="width:8mm">A</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="reg-key">P – Present (ಹಾಜರು) &nbsp; A – Absent &nbsp; S – Sunday &nbsp; CL/RH/EL/ML/HPL/MatL – Leave &nbsp; OD/OOD – On Duty &nbsp; L – Leave/OD days</div>
    <div class="reg-sg"><div style="flex:1;"></div>${regPrincipalSign(rec)}</div>
  </div>${regFoot(1,1)}</div></div>`;
  regPrint(html,true);
}
// One staff member, date-wise register (staff page)
function printMyMonthRegister(){
  const month=document.getElementById('att_month')?.value||serverTodayStr().slice(0,7);
  const [y,m]=month.split('-'); const dim=new Date(+y,+m,0).getDate();
  const wd=['ಭಾನು','ಸೋಮ','ಮಂಗಳ','ಬುಧ','ಗುರು','ಶುಕ್ರ','ಶನಿ'];
  let p=0,l=0,a=0;
  const rows=Array.from({length:dim},(_,i)=>{
    const d=i+1, ds=month+'-'+String(d).padStart(2,'0'); const r=getAttendanceRecord(ds,CURRENT_USER.hrmsId);
    const dow=new Date(ds+'T00:00:00').getDay();
    const sg=(ses)=>{ if(!r||!r[ses+'Status']) return ''; const g=r[ses+'Sig']; const t=g?g.stamp:(r[ses+'SignedAt']||''); const st=r[ses+'Status']; return (st==='Present'?'Present':(ATT_STATUS_LABELS&&ATT_STATUS_LABELS[st])||st)+(t?`<br><span>${esc(t)}</span>`:''); };
    if(r&&r.morningStatus){ const ms=r.morningStatus; if(ms==='Present') p++; else if(ms==='Absent') a++; else l++; }
    return `<tr class="${dow===0?'sun':''}"><td>${d}</td><td>${wd[dow]}</td><td>${dow===0&&!(r&&r.morningStatus)?'ಭಾನುವಾರ / Sunday':sg('morning')}</td><td>${dow===0&&!(r&&r.morningStatus)?'':sg('afternoon')}</td></tr>`;
  }).join('');
  const html=`<div class="reg-wrap"><div class="reg-sheet reg-port"><div class="reg-body">
    ${regHead('ಸಿಬ್ಬಂದಿ ಹಾಜರಾತಿ ವಹಿ / Staff Attendance Register', esc(salaryMonthLabel(month)))}
    <table class="reg-tb reg-info"><tr><td><b>ಹೆಸರು / Name:</b> ${esc(CURRENT_USER.name)}</td><td><b>ಹುದ್ದೆ / Designation:</b> ${esc(CURRENT_USER.desig||'')}</td><td><b>HRMS ID:</b> ${esc(CURRENT_USER.hrmsId)}</td></tr></table>
    <table class="reg-tb reg-day"><thead><tr><th style="width:10mm">Date</th><th style="width:16mm">Day</th><th>Morning (Digitally signed)</th><th>Afternoon (Digitally signed)</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="reg-key">Present: ${p} &nbsp; Leave/OD: ${l} &nbsp; Absent: ${a}</div>
  </div>${regFoot(1,1)}</div></div>`;
  regPrint(html,false);
}

function renderStaffAttendance(){
  if(SERVER_DATE_OFFSET==null && !window.__attOffsetFetching){
    window.__attOffsetFetching=true;
    getServerTimeStamp().then(()=>{ window.__attOffsetFetching=false; if(CURRENT_PAGE==='staffattendance') renderStaffAttendance(); }).catch(()=>{ window.__attOffsetFetching=false; });
  }
  const today=serverTodayStr();
  const rec=getAttendanceRecord(today, CURRENT_USER.hrmsId);
  const now=new Date();
  const month=document.getElementById('att_month')?.value || (today.slice(0,7));
  const monthRecs=(DB.dailyAttendance||[]).filter(a=>a.hrmsId===CURRENT_USER.hrmsId && a.date.startsWith(month)).sort((a,b)=>a.date.localeCompare(b.date));
  const myReports=(DB.attendanceReports||[]).filter(r=>r.status==='Approved').sort((a,b)=>b.month.localeCompare(a.month));

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🕐 ಹಾಜರಾತಿ ವಹಿ (Staff Attendance Register)</h2>
    <div class="desc">ಇಂದಿನ ದಿನಾಂಕ: ${fmtDate(today)} | Morning ಮತ್ತು Afternoon ಪ್ರತ್ಯೇಕವಾಗಿ Sign ಮಾಡಬೇಕು</div></div>

    ${rec && rec.enteredBy==='fda' && rec.staffResponse==='Pending'?`
    <div class="panel" style="border:2px solid #e65100;background:#fff3e0;">
      <h3>⚠ FDA ಪರವಾಗಿ ನಮೂದಿಸಲಾಗಿದೆ</h3>
      <div style="font-size:12.5px;">ದಿನಾಂಕ: ${fmtDate(rec.date)} | ಪ್ರಕಾರ: ${attBadge(rec.morningStatus)} | ಕಾರಣ: ${esc(rec.reason||'—')}</div>
      <div class="form-actions" style="margin-top:10px;">
        <button class="btn btn-primary btn-sm" onclick="respondToFDAAttendance('${rec.id}','Accepted')">✅ ಒಪ್ಪಿಗೆ</button>
        <button class="btn btn-gold btn-sm" onclick="requestAttendanceCorrection('${rec.id}')">✏️ ತಿದ್ದುಪಡಿ ಕೋರಿಕೆ</button>
      </div>
    </div>`:''}

    <div class="panel">
      <h3>📅 ಇಂದಿನ ಹಾಜರಾತಿ</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🌅 Morning</div>
          ${rec?.morningStatus?(rec.morningSig&&rec.morningStatus==='Present'?`<div style="display:flex;justify-content:center;">${cbDigiSign({signedBy:CURRENT_USER.name,signStamp:rec.morningSig.stamp,signHost:rec.morningSig.host,signIp:rec.morningSig.ip,signDevice:rec.morningSig.device,signDesig:CURRENT_USER.desig},'','Attendance - Morning')}</div>`:`${attBadge(rec.morningStatus)}<div style="font-size:10px;color:var(--muted);margin-top:6px;">${fmtDate(rec.morningSignedDate)} ${esc(rec.morningSignedAt||'')}${rec.enteredBy==='fda'?' (FDA Entry)':''}</div>`):
          `<button class="btn btn-primary" onclick="staffSignAttendance('morning')">✍️ Digitally Sign (Morning)</button>`}
        </div>
        <div style="border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🌇 Afternoon</div>
          ${rec?.afternoonStatus?(rec.afternoonSig&&rec.afternoonStatus==='Present'?`<div style="display:flex;justify-content:center;">${cbDigiSign({signedBy:CURRENT_USER.name,signStamp:rec.afternoonSig.stamp,signHost:rec.afternoonSig.host,signIp:rec.afternoonSig.ip,signDevice:rec.afternoonSig.device,signDesig:CURRENT_USER.desig},'','Attendance - Afternoon')}</div>`:`${attBadge(rec.afternoonStatus)}<div style="font-size:10px;color:var(--muted);margin-top:6px;">${fmtDate(rec.afternoonSignedDate)} ${esc(rec.afternoonSignedAt||'')}${rec.enteredBy==='fda'?' (FDA Entry)':''}</div>`):
          `<button class="btn btn-primary" onclick="staffSignAttendance('afternoon')">✍️ Digitally Sign (Afternoon)</button>`}
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>🗓 ಹಿಂದಿನ ದಿನಾಂಕದ ಹಾಜರಾತಿ ನಮೂದಿಸಿ (Previous Date)</h3>
      <div class="small-muted" style="margin-bottom:8px;">ಮರೆತುಹೋದ ಹಿಂದಿನ ದಿನದ ಹಾಜರಾತಿಯನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಿ. (ಕಳೆದ 180 ದಿನಗಳೊಳಗೆ.) FDA ಗೆ ಸೂಚನೆ ಹೋಗುತ್ತದೆ; ಅನುಮೋದಿತ ತಿಂಗಳಿಗೆ ನಮೂದಿಸಿದರೆ FDA ವರದಿಯನ್ನು ಮರು-ಲೆಕ್ಕ ಹಾಕಬೇಕಾಗುತ್ತದೆ.</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div class="field" style="margin:0;"><label>ದಿನಾಂಕ</label><input type="date" id="att_past_date" max="${esc(addDaysStr(today,-1))}" min="${esc(addDaysStr(today,-180))}"></div>
        <label style="display:flex;gap:5px;align-items:center;font-size:13px;"><input type="checkbox" id="att_past_m" checked> 🌅 Morning</label>
        <label style="display:flex;gap:5px;align-items:center;font-size:13px;"><input type="checkbox" id="att_past_a" checked> 🌇 Afternoon</label>
        <div class="field" style="margin:0;flex:1;min-width:200px;"><label>ಕಾರಣ / ಷರಾ (ಐಚ್ಛಿಕ)</label><input id="att_past_reason" placeholder="ಉದಾ: Sign ಮಾಡಲು ಮರೆತಿದ್ದೆ"></div>
        <button class="btn btn-primary" onclick="staffSignPastAttendance()">✍️ ಸಹಿ ಮಾಡಿ ನಮೂದಿಸಿ</button>
      </div>
    </div>

    <div class="panel">
      <h3>📆 ಮಾಸಿಕ ಹಾಜರಾತಿ (Monthly)</h3>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;"><input type="month" id="att_month" value="${esc(month)}" onchange="renderStaffAttendance()" style="max-width:200px;"><button class="btn btn-sm btn-gold" onclick="printMyMonthRegister()">🖨️ ಮಾಸಿಕ ಹಾಜರಾತಿ ವಹಿ (Print / PDF)</button></div>
      <div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>Morning</th><th>Afternoon</th><th>ನಮೂದಿಸಿದವರು</th></tr></thead>
      <tbody>${monthRecs.length?monthRecs.map(r=>`<tr>
        <td>${fmtDate(r.date)}</td><td>${attBadge(r.morningStatus)}</td><td>${attBadge(r.afternoonStatus)}</td>
        <td style="font-size:11px;">${r.enteredBy==='fda'?'FDA':r.enteredBy==='leave'?'Leave Approval':r.enteredBy==='self'?(r.backdated?'ಸ್ವಂತ (ಹಿಂದಿನ ದಿನಾಂಕ)':'ಸ್ವಂತ'):'—'}</td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="4">ಈ ತಿಂಗಳು ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>

    ${(()=>{ const me=attMyRow({rows:computeMonthlyReportRows(month)}); if(!me) return '';
      return `<div class="panel"><h3>📊 ${salaryMonthLabel(month)} — ನನ್ನ ಹಾಜರಾತಿ ಸಾರಾಂಶ</h3>
      <div class="table-wrap"><table><thead><tr><th>Working Days</th><th>Present</th><th>CL</th><th>RH</th><th>EL</th><th>ML</th><th>OD</th><th>OOD</th><th>Absent</th><th>%</th></tr></thead>
      <tbody><tr><td>${me.workingDays}</td><td>${me.present}</td><td>${me.cl}</td><td>${me.rh}</td><td>${me.el}</td><td>${me.ml}</td><td>${me.od}</td><td>${me.ood}</td><td>${me.absent}</td><td><b>${me.attPct}%</b></td></tr></tbody></table></div>
      <div class="small-muted" style="margin-top:6px;">ಇದು ಮೇಲಿನ ತಿಂಗಳ ಈಗಿನ ದಾಖಲೆಗಳ ಲೆಕ್ಕ (ಅನುಮೋದಿತ ವರದಿ ಅಲ್ಲ).</div></div>`; })()}

    ${myReports.length?`<div class="panel"><h3>📋 ಅನುಮೋದಿತ ಮಾಸಿಕ ವರದಿಗಳು</h3>
      <div class="table-wrap"><table><thead><tr><th>ತಿಂಗಳು</th><th>ಹಾಜರಾತಿ %</th><th>Action</th></tr></thead>
      <tbody>${myReports.map(r=>{
        const my=attMyRow(r);
        return `<tr><td>${salaryMonthLabel(r.month)}</td><td>${my?my.attPct+'%':'—'}</td>
        <td><button class="btn btn-sm btn-outline" onclick="viewAttendanceReport('${r.id}')">👁 View</button></td></tr>`;
      }).join('')}</tbody></table></div>
    </div>`:''}
    <div id="attReportDetailWrap"></div>`;
}

function addDaysStr(d,n){ const t=new Date(d+'T00:00:00'); t.setDate(t.getDate()+n); return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'); }
async function staffSignPastAttendance(){
  if(_signBusy) return;
  const date=document.getElementById('att_past_date')?.value||'';
  const wantM=document.getElementById('att_past_m')?.checked, wantA=document.getElementById('att_past_a')?.checked;
  const reason=(document.getElementById('att_past_reason')?.value||'').trim();
  const today=serverTodayStr();
  if(!date){ showToast('⚠ ದಿನಾಂಕ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(date>=today){ showToast('⚠ ಹಿಂದಿನ ದಿನಾಂಕ ಮಾತ್ರ ಆಯ್ಕೆ ಮಾಡಬಹುದು'); return; }
  if(date<addDaysStr(today,-180)){ showToast('⚠ 180 ದಿನಗಳಿಗಿಂತ ಹಿಂದಿನ ದಿನಾಂಕಕ್ಕೆ FDA ಅನ್ನು ಸಂಪರ್ಕಿಸಿ'); return; }
  if(!wantM&&!wantA){ showToast('⚠ Morning ಅಥವಾ Afternoon ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const apprMonth=(DB.attendanceReports||[]).some(r=>r.month===date.slice(0,7)&&r.status==='Approved');
  if(apprMonth&&!confirm('ಆ ತಿಂಗಳ ವರದಿ ಈಗಾಗಲೇ ಅನುಮೋದನೆ ಆಗಿದೆ. ನಮೂದಿಸಿದರೆ FDA ವರದಿಯನ್ನು ಮರು-ಲೆಕ್ಕ ಹಾಕಬೇಕಾಗುತ್ತದೆ. ಮುಂದುವರಿಸುವುದೇ?')) return;
  const ex=getAttendanceRecord(date,CURRENT_USER.hrmsId);
  const sessions=[wantM?'morning':null,wantA?'afternoon':null].filter(Boolean).filter(x=>!(ex&&ex[x+'Status']));
  if(!sessions.length){ showToast('⚠ ಆ ದಿನಾಂಕಕ್ಕೆ ಈಗಾಗಲೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ'); return; }
  _signBusy=true;
  try{
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    const rec=getOrCreateAttendance(date, CURRENT_USER.hrmsId, CURRENT_USER.name);
    for(const ses of sessions){
      rec[ses+'Status']='Present';
      const m={}; await cbSignMeta(m,ts); rec[ses+'Sig']={stamp:m.signStamp,host:m.signHost,ip:m.signIp,device:m.signDevice};
      rec[ses+'SignedAt']=ts.time; rec[ses+'SignedDate']=ts.date; rec[ses+'ServerTime']=ts.server;
    }
    if(!rec.enteredBy) rec.enteredBy='self';
    rec.backdated=true; rec.backdatedOn=ts.date+' '+ts.time; if(reason) rec.backdatedReason=reason;
    logAudit('Teacher E-Signature','Attendance',rec.id,'Previous date '+date+' ('+sessions.join('+')+') entered on '+ts.date+' '+ts.time+(reason?' — '+reason:''));
    staffNamesForRole('fda').forEach(n=>pushNotification(n,`🗓 ${CURRENT_USER.name} — ${fmtDate(date)} ಹಿಂದಿನ ದಿನಾಂಕದ ಹಾಜರಾತಿ ನಮೂದಿಸಿದ್ದಾರೆ`+(apprMonth?' (ಅನುಮೋದಿತ ವರದಿ — ಮರು-ಲೆಕ್ಕ ಅಗತ್ಯ)':'')));
    saveDB(); showToast('✅ '+fmtDate(date)+' ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ');
    renderStaffAttendance();
  }catch(e){ console.error(e); showToast('❌ Sign ಆಗಲಿಲ್ಲ: '+(e&&e.message?e.message:e),6000); }
  finally{ _signBusy=false; }
}

async function staffSignAttendance(session){
  if(_signBusy) return;
  _signBusy=true;
  try{
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    if(!ts.server) showToast('⚠ ಸರ್ವರ್ ಸಮಯ ಸಿಗಲಿಲ್ಲ — ಫೋನ್ ಸಮಯ ಬಳಸಲಾಗುತ್ತಿದೆ',5000);
    const rec=getOrCreateAttendance(ts.date, CURRENT_USER.hrmsId, CURRENT_USER.name);
    rec[session+'Status']='Present';
    { const m={}; await cbSignMeta(m,ts); rec[session+'Sig']={stamp:m.signStamp,host:m.signHost,ip:m.signIp,device:m.signDevice}; }
    rec[session+'SignedAt']=ts.time; rec[session+'SignedDate']=ts.date; rec[session+'ServerTime']=ts.server;
    if(!rec.enteredBy) rec.enteredBy='self';
    logAudit('Teacher E-Signature','Attendance',rec.id,`${session} sign — ${ts.date} ${ts.time}`);
    saveDB();
    showToast('✅ '+(session==='morning'?'Morning':'Afternoon')+' Sign ಆಗಿದೆ');
    renderStaffAttendance();
  }catch(e){
    console.error('Attendance sign failed',e);
    showToast('❌ Sign ಆಗಲಿಲ್ಲ: '+(e&&e.message?e.message:e),6000);
  }finally{ _signBusy=false; }
}

async function respondToFDAAttendance(id, response){
  const rec=(DB.dailyAttendance||[]).find(a=>a.id===id); if(!rec) return;
  showToast('⏳ ...');
  const ts=await getServerTimeStamp();
  rec.staffResponse=response; rec.staffResponseAt=ts.time+' '+ts.date;
  logAudit('Approve','Attendance',id,'Staff accepted FDA manual entry');
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✅ ${rec.staffName} — ${fmtDate(rec.date)} ಹಾಜರಾತಿ ಒಪ್ಪಿಗೆ ನೀಡಿದ್ದಾರೆ`));
  showToast('✅ ಒಪ್ಪಿಗೆ ದಾಖಲಾಗಿದೆ');
  renderStaffAttendance();
}

function requestAttendanceCorrection(id){
  const note=prompt('ತಿದ್ದುಪಡಿ ಕೋರಿಕೆ — ಕಾರಣ ಬರೆಯಿರಿ:');
  if(!note||!note.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  const rec=(DB.dailyAttendance||[]).find(a=>a.id===id); if(!rec) return;
  rec.staffResponse='CorrectionRequested'; rec.staffResponseNote=note.trim(); rec.staffResponseAt=todayStr();
  logAudit('Return for Correction','Attendance',id,note);
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✏️ ${rec.staffName} — ${fmtDate(rec.date)} ಹಾಜರಾತಿ ತಿದ್ದುಪಡಿ ಕೋರಿದ್ದಾರೆ: ${note}`));
  showToast('✏️ ತಿದ್ದುಪಡಿ ಕೋರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  renderStaffAttendance();
}

function attRegDate(){ return document.getElementById('areg_date')?.value || serverTodayStr(); }

function shiftAttRegDate(delta){
  const d=new Date(attRegDate()+'T00:00:00'); d.setDate(d.getDate()+delta);
  CURRENT_AREG_DATE=d.toISOString().slice(0,10); renderAttendanceRegister();
}

function attRegData(date){
  const staffSorted=[...STAFF].sort((a,b)=>(ROLE_ORDER[a.role]||9)-(ROLE_ORDER[b.role]||9) || a.name.localeCompare(b.name));
  const enteredLabel=r=>r?(r.enteredBy==='fda'?'FDA':r.enteredBy==='leave'?'Leave Approval':r.enteredBy==='self'?'ಸ್ವಂತ':'—'):'—';
  let mP=0,mTot=0,aP=0,aTot=0;
  const rows=staffSorted.map((st,i)=>{
    const r=getAttendanceRecord(date,st.hrmsId);
    if(r&&r.morningStatus){ mTot++; if(r.morningStatus==='Present') mP++; }
    if(r&&r.afternoonStatus){ aTot++; if(r.afternoonStatus==='Present') aP++; }
    const lab=x=>x?(ATT_STATUS_LABELS[x]||x).replace(/^✅\s*/,''):'—';
    return {i:i+1,st,r,m:lab(r&&r.morningStatus),mt:r&&r.morningSignedAt?r.morningSignedAt:'',a:lab(r&&r.afternoonStatus),at:r&&r.afternoonSignedAt?r.afternoonSignedAt:'',by:enteredLabel(r),reason:(r&&r.reason)||''};
  });
  return {rows,mP,aP,mTot:mTot||staffSorted.length,aTot:aTot||staffSorted.length};
}
function attRegPrint(date){
  const D=attRegData(date), web=location.host||'mdrsshedbarieoffice.in';
  const PER=30, chunks=[]; for(let i=0;i<D.rows.length;i+=PER) chunks.push(D.rows.slice(i,i+PER));
  const html='<div class="reg-wrap">'+chunks.map((ch,ci)=>`<div class="reg-sheet reg-port" style="${ci<chunks.length-1?'page-break-after:always;':''}"><div class="reg-body">
    ${regHead('ದಿನವಾರು ಹಾಜರಾತಿ ವಹಿ (Daily Attendance Register)','ದಿನಾಂಕ: <b>'+fmtDate(date)+'</b>')}
    <table class="reg-tb" style="table-layout:auto;margin-top:6px;font-size:8.5pt;"><thead><tr><th rowspan="2" style="width:5%">ಕ್ರ.ಸಂ</th><th rowspan="2">ಹೆಸರು / ಪದನಾಮ</th><th colspan="2">ಬೆಳಗ್ಗೆ (Morning)</th><th colspan="2">ಮಧ್ಯಾಹ್ನ (Afternoon)</th><th rowspan="2" style="width:11%">ನಮೂದಿಸಿದವರು</th><th rowspan="2" style="width:14%">ಟಿಪ್ಪಣಿ</th></tr>
    <tr><th style="width:9%">ಸ್ಥಿತಿ</th><th style="width:9%">ಸಮಯ</th><th style="width:9%">ಸ್ಥಿತಿ</th><th style="width:9%">ಸಮಯ</th></tr></thead><tbody>
    ${ch.map(x=>`<tr><td>${x.i}</td><td style="text-align:left;">${esc(x.st.name)}<br><span style="font-size:6.5pt;">${esc(x.st.desig||'')}</span></td><td>${esc(x.m)}</td><td style="font-size:7pt;">${esc(x.mt)}</td><td>${esc(x.a)}</td><td style="font-size:7pt;">${esc(x.at)}</td><td style="font-size:7.5pt;">${esc(x.by)}</td><td style="text-align:left;font-size:7pt;">${esc(x.reason)}</td></tr>`).join('')}
    ${ci===chunks.length-1?`<tr><td colspan="2" style="text-align:right;"><b>ಒಟ್ಟು ಹಾಜರಾತಿ</b></td><td colspan="2"><b>${D.mP}/${D.mTot}</b></td><td colspan="2"><b>${D.aP}/${D.aTot}</b></td><td colspan="2"></td></tr>`:''}
    </tbody></table>
    ${ci===chunks.length-1?`<div style="display:flex;justify-content:space-between;margin-top:26px;font-size:9.5pt;"><div>ಸಿದ್ಧಪಡಿಸಿದವರು: <b>${esc(CURRENT_USER.name)}</b><br>${esc(CURRENT_USER.role==='fda'?'FDA':CURRENT_USER.desig||'')}</div><div style="text-align:right;">ಪ್ರಾಂಶುಪಾಲರು<br>MDRS Bhatkal (BC-265)</div></div>`:''}
  </div>${regFoot(ci+1,chunks.length)}</div>`).join('')+'</div>';
  regPrint(html,false);
}
function renderAttendanceRegister(){
  const date=CURRENT_AREG_DATE||attRegDate(); CURRENT_AREG_DATE=null;
  const D=attRegData(date);
  const rowsHtml=D.rows.map(x=>`<tr><td class="c">${x.i}</td><td>${esc(x.st.hrmsId)}</td><td><b>${esc(x.st.name)}</b></td><td>${esc(x.st.desig||'')}</td>
      <td class="c">${x.r&&x.r.morningStatus?attBadge(x.r.morningStatus):'—'}</td><td class="c" style="font-size:11px;">${x.mt?fmtDate(x.r.morningSignedDate)+' '+esc(x.mt):'—'}</td>
      <td class="c">${x.r&&x.r.afternoonStatus?attBadge(x.r.afternoonStatus):'—'}</td><td class="c" style="font-size:11px;">${x.at?fmtDate(x.r.afternoonSignedDate)+' '+esc(x.at):'—'}</td>
      <td class="c">${esc(x.by)}</td><td>${esc(x.reason||'—')}</td></tr>`).join('');
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ದಿನವಾರು ಹಾಜರಾತಿ ವಹಿ (Daily Attendance Register)</h2></div>
    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <button class="gv-b" onclick="shiftAttRegDate(-1)">◀ ಹಿಂದಿನ ದಿನ</button>
        <input type="date" id="areg_date" value="${esc(date)}" onchange="renderAttendanceRegister()" style="max-width:170px;">
        <button class="gv-b" onclick="shiftAttRegDate(1)">ಮುಂದಿನ ದಿನ ▶</button>
        <b style="margin-left:8px;">ದಿನಾಂಕ: ${fmtDate(date)}</b>
        <button class="gv-b pri" style="margin-left:auto;" onclick="attRegPrint('${esc(date)}')">Print / PDF</button>
        <button class="gv-b" onclick="downloadAttendanceRegisterExcel('${esc(date)}')">Excel</button>
      </div>
      <div class="table-wrap"><table class="gov-table"><thead><tr>
        <th rowspan="2">ಕ್ರ.ಸಂ</th><th rowspan="2">HRMS ID</th><th rowspan="2">ಹೆಸರು</th><th rowspan="2">ಪದನಾಮ</th>
        <th colspan="2">ಬೆಳಗ್ಗೆ (Morning)</th><th colspan="2">ಮಧ್ಯಾಹ್ನ (Afternoon)</th><th rowspan="2">ನಮೂದಿಸಿದವರು</th><th rowspan="2">ಕಾರಣ / ಟಿಪ್ಪಣಿ</th></tr>
        <tr><th>ಸ್ಥಿತಿ</th><th>ಸಮಯ</th><th>ಸ್ಥಿತಿ</th><th>ಸಮಯ</th></tr></thead>
      <tbody>${rowsHtml||`<tr><td colspan="10" class="c" style="color:var(--muted);">ಸಿಬ್ಬಂದಿ ಇಲ್ಲ.</td></tr>`}</tbody>
      <tfoot><tr style="font-weight:700;"><td colspan="4" style="text-align:right;">ಒಟ್ಟು ಹಾಜರಾತಿ:</td><td colspan="2" class="c">${D.mP}/${D.mTot}</td><td colspan="2" class="c">${D.aP}/${D.aTot}</td><td colspan="2"></td></tr></tfoot>
      </table></div>
    </div>`;
}

function downloadAttendanceRegisterExcel(date){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const staffSorted=[...STAFF].sort((a,b)=>(ROLE_ORDER[a.role]||9)-(ROLE_ORDER[b.role]||9) || a.name.localeCompare(b.name));
  const enteredLabel=r=>r?(r.enteredBy==='fda'?'FDA':r.enteredBy==='leave'?'Leave Approval':r.enteredBy==='self'?'ಸ್ವಂತ':'—'):'—';
  const rows=staffSorted.map((st,i)=>{
    const r=getAttendanceRecord(date,st.hrmsId);
    return [i+1,st.hrmsId,st.name,st.desig||'',(r&&r.morningStatus)||'—',(r&&r.afternoonStatus)||'—',enteredLabel(r),(r&&r.reason)||''];
  });
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಕ್ರ.ಸಂ','HRMS ID','ಹೆಸರು','ಪದನಾಮ','Morning','Afternoon','ನಮೂದಿಸಿದವರು','ಕಾರಣ/ಟಿಪ್ಪಣಿ'],...rows]),'Attendance');
  XLSX.writeFile(wb,'MDRS_Daily_Attendance_'+date+'.xlsx');
}

function computeMonthlyReportRows(month){
  const [y,m]=month.split('-');
  const daysInMonth=new Date(Number(y),Number(m),0).getDate();
  return STAFF.map(st=>{
    let present=0, cl=0, rh=0, el=0, ml=0, hpl=0, matl=0, od=0, ood=0, absent=0, workingDays=0;
    for(let d=1;d<=daysInMonth;d++){
      const dateStr=month+'-'+String(d).padStart(2,'0');
      const rec=getAttendanceRecord(dateStr, st.hrmsId);
      if(!rec||!rec.morningStatus) continue;
      workingDays++;
      const s=rec.morningStatus;
      if(s==='Present') present++;
      else if(s==='CL') cl++; else if(s==='RH') rh++; else if(s==='EL') el++;
      else if(s==='ML') ml++; else if(s==='HPL') hpl++; else if(s==='MatL') matl++;
      else if(s==='OD') od++; else if(s==='OOD') ood++; else if(s==='Absent') absent++;
    }
    const attPct = workingDays? Math.round((present+cl+rh+el+ml+hpl+matl+od+ood)/workingDays*100) : 0;
    const closingEL = (DB.elBalances||{})[st.hrmsId] ?? '—';
    return { hrmsId:st.hrmsId, name:st.name, desig:st.desig||'', workingDays, present, cl, rh, el, ml, hpl, matl, od, ood, absent, attPct, closingEL };
  });
}

function reportRowsMatch(a,b){
  if(!a||!b||a.length!==b.length) return false;
  const k=['workingDays','present','cl','rh','el','ml','od','ood','absent'];
  return a.every((r,i)=> k.every(f=>Number(r[f]||0)===Number((b[i]||{})[f]||0)) && r.hrmsId===b[i].hrmsId);
}

function renderAttendanceReport(){
  const month=document.getElementById('atr_month')?.value || defaultSalaryMonth();
  const existing=(DB.attendanceReports||[]).find(r=>r.month===month);
  const live=computeMonthlyReportRows(month);
  const stale = existing && !reportRowsMatch(existing.rows,live);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📊 ಮಾಸಿಕ ಹಾಜರಾತಿ ವರದಿ (Monthly Attendance Report)</h2>
    </div>

    <div class="panel">
      <input type="month" id="atr_month" value="${esc(month)}" onchange="renderAttendanceReport()" style="max-width:200px;">
      ${existing?`<div style="margin-top:8px;">${salaryStatusBadgeGeneric(existing.status)} <span class="small-muted">(ಕೊನೆಯ ಬಾರಿ ತಯಾರಿಸಿದ್ದು: ${fmtDate(existing.generatedAt)})</span></div>`:''}
      ${stale?`<div style="margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--gold-tint);color:var(--gold);font-weight:700;font-size:12.5px;">⚠ ಈ ವರದಿ ತಯಾರಿಸಿದ ನಂತರ ಹಾಜರಾತಿಯಲ್ಲಿ ಬದಲಾವಣೆಯಾಗಿದೆ (ಹೊಸ Sign ಸೇರಿದೆ ಅಥವಾ ತಿದ್ದುಪಡಿಯಾಗಿದೆ). ${existing.status==='Draft'?'ಕೆಳಗಿನ ಮರು-ಲೆಕ್ಕ ಹಾಕಿ ಬಟನ್ ಒತ್ತಿ.':'ಇದನ್ನು ಸೇರಿಸಲು ಮೊದಲು ಈ ವರದಿಯನ್ನು ಡ್ರಾಫ್ಟ್‌ಗೆ ಹಿಂತಿರುಗಿಸಬೇಕು.'}</div>`:''}
      <div class="form-actions" style="margin-top:10px;">
        ${!existing||existing.status==='Draft'?`<button class="btn btn-primary" onclick="generateMonthlyReport('${month}')">📊 Report ${existing?'ಮರು-ಲೆಕ್ಕ ಹಾಕಿ':'ರಚಿಸಿ'}</button>`:''}
        ${existing&&existing.status==='Draft'?`<button class="btn btn-gold" onclick="sendReportForApproval('${existing.id}')">📤 Principal ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಿ</button>`:''}
        ${existing&&existing.status==='Pending Principal Approval'?`<button class="btn btn-outline" onclick="recallAttendanceReport('${existing.id}')">↩ ಡ್ರಾಫ್ಟ್‌ಗೆ ಹಿಂತಿರುಗಿಸಿ</button>`:''}
        ${existing&&existing.status==='Pending Principal Approval'&&CURRENT_USER.role==='principal'?`<button class="btn btn-primary" onclick="approveAttendanceReport('${existing.id}')">✅ Approve & Sign</button>`:''}
        ${existing&&existing.status==='Approved'&&CURRENT_USER.role==='principal'?`<button class="btn btn-outline" onclick="recallAttendanceReport('${existing.id}')">🔓 Approval ರದ್ದು ಮಾಡಿ</button>`:''}
        ${existing?`<button class="btn btn-outline" onclick="downloadAttendanceReportExcel('${existing.id}')">⬇ Excel</button>
        <button class="btn btn-outline" onclick="viewAttendanceReport('${existing.id}')">👁 View</button>`:''}
      </div>
    </div>
    <div class="panel"><h3>👤 ಸಿಬ್ಬಂದಿವಾರು ಹಾಜರಾತಿ ವರದಿ (Staff-wise Report)</h3>
      <div class="small-muted" style="margin-bottom:8px;">ಮೇಲೆ ಆಯ್ಕೆ ಮಾಡಿದ ತಿಂಗಳಿಗೆ — ಒಬ್ಬ ಸಿಬ್ಬಂದಿ ಅಥವಾ ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿಯ ದಿನಾಂಕವಾರು ಹಾಜರಾತಿ (ಪ್ರತಿ ಸಿಬ್ಬಂದಿಗೆ ಒಂದು ಪುಟ / ಒಂದು Excel ಶೀಟ್).</div>
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
        <div class="field" style="margin:0;min-width:260px;"><label>ಸಿಬ್ಬಂದಿ</label><select id="atr_staff"><option value="">ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ (All Staff)</option>${attStaffList().map(st=>`<option value="${esc(st.hrmsId)}">${esc(st.name)} (${esc(st.hrmsId)})</option>`).join('')}</select></div>
        <button class="btn btn-gold" onclick="attStaffPrint()">🖨️ PDF (Print)</button>
        <button class="btn btn-primary" onclick="attStaffExcel()">⬇ Excel</button>
      </div>
    </div>
    <div id="attReportDetailWrap"></div>`;
}

function recallAttendanceReport(id){
  const rec=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec) return;
  if(rec.status==='Approved' && CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ Approval ರದ್ದು ಮಾಡಬಹುದು'); return; }
  if(!confirm('ಈ ವರದಿಯನ್ನು ಡ್ರಾಫ್ಟ್‌ಗೆ ಹಿಂತಿರುಗಿಸಬೇಕೇ? ಮತ್ತೆ ಮರು-ಲೆಕ್ಕ ಹಾಕಿ ಕಳುಹಿಸಬೇಕಾಗುತ್ತದೆ.')) return;
  rec.status='Draft'; rec.sentAt=null; rec.principalName=null; rec.principalSignedAt=null; rec.principalSignedDate=null; rec.principalServerTime=false;
  logAudit('Recall','AttendanceReport',id,salaryMonthLabel(rec.month));
  saveDB(); showToast('↩ ಡ್ರಾಫ್ಟ್‌ಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ'); renderAttendanceReport();
}

function salaryStatusBadgeGeneric(status){
  const map={'Draft':'badge-draft','Pending Principal Approval':'badge-warn','Approved':'badge-ok'};
  return `<span class="badge ${map[status]||''}">${esc(status)}</span>`;
}

function generateMonthlyReport(month){
  const rows=computeMonthlyReportRows(month);
  let rec=(DB.attendanceReports||[]).find(r=>r.month===month);
  if(rec){ rec.rows=rows; rec.generatedAt=todayStr(); }
  else {
    rec={ id:uid(), month, rows, status:'Draft', generatedAt:todayStr(), generatedBy:CURRENT_USER.name,
      sentAt:null, principalName:null, principalSignedAt:null, principalSignedDate:null, principalServerTime:false };
    DB.attendanceReports.push(rec);
  }
  logAudit('Create','AttendanceReport',rec.id,salaryMonthLabel(month));
  saveDB();
  showToast('✅ Report ರಚಿಸಲಾಗಿದೆ ('+rows.length+' ಸಿಬ್ಬಂದಿ)');
  renderAttendanceReport();
  viewAttendanceReport(rec.id);
}

function sendReportForApproval(id){
  const rec=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec) return;
  rec.status='Pending Principal Approval'; rec.sentAt=todayStr();
  logAudit('Submit','AttendanceReport',id,salaryMonthLabel(rec.month));
  saveDB();
  staffNamesForRole('principal').forEach(n=>pushNotification(n,`📊 ${salaryMonthLabel(rec.month)} ಮಾಸಿಕ ಹಾಜರಾತಿ ವರದಿ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇದೆ`));
  showToast('📤 Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  renderAttendanceReport();
}

async function approveAttendanceReport(id){
  const rec=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec) return;
  if(!confirm(salaryMonthLabel(rec.month)+' ಹಾಜರಾತಿ ವರದಿ Approve & Sign ಮಾಡುವುದೇ?')) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  rec.status='Approved'; rec.principalName=CURRENT_USER.name;
  rec.principalSignedAt=ts.time; rec.principalSignedDate=ts.date; rec.principalServerTime=ts.server;
  { const m={}; await cbSignMeta(m,ts); rec.pStamp=m.signStamp; rec.pHost=m.signHost; rec.pIp=m.signIp; rec.pDevice=m.signDevice; }
  logAudit('Approve','AttendanceReport',id,salaryMonthLabel(rec.month));
  logAudit('Principal E-Signature','AttendanceReport',id,`${ts.date} ${ts.time}`);
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`✅ ${salaryMonthLabel(rec.month)} ಹಾಜರಾತಿ ವರದಿ Principal Approve ಮಾಡಿದ್ದಾರೆ`));
  STAFF.forEach(st=>pushNotification(st.name,`📋 ${salaryMonthLabel(rec.month)} ಅನುಮೋದಿತ ಹಾಜರಾತಿ ವರದಿ ಲಭ್ಯ — "ಹಾಜರಾತಿ ವಹಿ" ನಲ್ಲಿ ನೋಡಿ`));
  showToast('✅ Approved & E-Signed — ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  renderAttendanceReport();
  viewAttendanceReport(id);
}

function attMyRow(rec){
  const n=x=>String(x==null?'':x).trim().toLowerCase();
  const rows=(rec&&rec.rows)||[];
  return rows.find(r=>n(r.hrmsId)===n(CURRENT_USER.hrmsId))||rows.find(r=>n(r.name)===n(CURRENT_USER.name));
}
function attAllStaffRole(){ return CURRENT_USER&&(CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal'); }
function viewAttendanceReport(id){
  const rec0=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec0) return;
  const all=attAllStaffRole();
  // consolidated (all-staff) report only for FDA / Principal; everyone else sees only their own row
  const _mine=all?null:attMyRow(rec0);
  const rec=all?rec0:Object.assign({},rec0,{rows:_mine?[_mine]:[]});
  const wrap=document.getElementById('attReportDetailWrap'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <h3 style="margin:0;flex:1;">${salaryMonthLabel(rec.month)} — ಹಾಜರಾತಿ ವರದಿ</h3>
      ${all?`<button class="btn btn-sm btn-gold" onclick="printMonthlyMatrix('${rec.id}')">🖨️ ಮಾಸಿಕ ಹಾಜರಾತಿ ವಹಿ (A4 Landscape)</button>
      ${rec.status==='Approved'?dscBtns('attreport',rec.id,salaryMonthLabel(rec.month)):''}`:''}
      <button class="btn btn-sm btn-outline" onclick="document.getElementById('attReportDetailWrap').innerHTML=''">✕</button>
    </div>
    <div class="table-wrap" id="printArea"><table style="font-size:11px;"><thead><tr>
      <th>HRMS ID</th><th>ಹೆಸರು</th><th>Working Days</th><th>Present</th><th>CL</th><th>RH</th><th>EL</th><th>ML</th><th>OD</th><th>OOD</th><th>Absent</th><th>%</th><th>Closing EL</th>
    </tr></thead><tbody>
      ${rec.rows.length?rec.rows.map(r=>`<tr>
        <td>${esc(r.hrmsId)}</td><td><b>${esc(r.name)}</b></td><td>${r.workingDays}</td><td>${r.present}</td>
        <td>${r.cl}</td><td>${r.rh}</td><td>${r.el}</td><td>${r.ml}</td><td>${r.od}</td><td>${r.ood}</td><td>${r.absent}</td>
        <td><b>${r.attPct}%</b></td><td>${r.closingEL}</td>
      </tr>`).join(''):'<tr class="empty-row"><td colspan="13">ನಿಮ್ಮ ದಾಖಲೆ ಈ ವರದಿಯಲ್ಲಿ ಇಲ್ಲ.</td></tr>'}
    </tbody></table>
    ${rec.status==='Approved'?`<div style="display:flex;justify-content:flex-end;margin-top:16px;">
      ${regPrincipalSign(rec)}
    </div>`:''}
    </div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}


// ===== Staff-wise attendance report (FDA / Principal): PDF (print) and Excel =====
function attStaffList(){ return (STAFF||[]).filter(s=>s.role!=='admin'); }
function attSelectedStaff(){
  const v=document.getElementById('atr_staff')?.value||'';
  const all=attStaffList();
  return v?all.filter(s=>s.hrmsId===v):all;
}
function attDayData(st,month){
  const [y,m]=month.split('-'); const dim=new Date(+y,+m,0).getDate();
  const wdE=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], wdK=['ಭಾನು','ಸೋಮ','ಮಂಗಳ','ಬುಧ','ಗುರು','ಶುಕ್ರ','ಶನಿ'];
  const lab=x=>x?(x==='Present'?'Present':((typeof ATT_STATUS_LABELS!=='undefined'&&ATT_STATUS_LABELS[x])||x)):'';
  const days=[]; let present=0,leave=0,absent=0,work=0;
  for(let d=1;d<=dim;d++){
    const ds=month+'-'+String(d).padStart(2,'0'); const r=getAttendanceRecord(ds,st.hrmsId); const dow=new Date(ds+'T00:00:00').getDay();
    if(r&&r.morningStatus){ work++; const ms=r.morningStatus; if(ms==='Present') present++; else if(ms==='Absent') absent++; else leave++; }
    const stamp=ses=>{ if(!r||!r[ses+'Status']) return ''; const g=r[ses+'Sig']; return g?g.stamp:((r[ses+'SignedDate']?fmtDate(r[ses+'SignedDate'])+' ':'')+(r[ses+'SignedAt']||'')); };
    days.push({d,ds,dow,dayE:wdE[dow],dayK:wdK[dow],morning:lab(r&&r.morningStatus),afternoon:lab(r&&(r.afternoonStatus||null)),mSig:stamp('morning'),aSig:stamp('afternoon'),
      by:r?(r.enteredBy==='fda'?'FDA':r.enteredBy==='leave'?'Leave Approval':r.enteredBy==='self'?(r.backdated?'Self (previous date)':'Self'):''):'',note:r?(r.reason||r.backdatedReason||r.odPlace||''):''});
  }
  return {days,present,leave,absent,work};
}
function attStaffSheetHTML(st,month,n,total){
  const D=attDayData(st,month);
  const rows=D.days.map(x=>{ const sun=x.dow===0&&!x.morning;
    const c=(v,t)=>v?`${esc(v)}${t?`<br><span style="font-size:6pt;">${esc(t)}</span>`:''}`:'';
    return `<tr class="${sun?'sun':''}"><td>${x.d}</td><td>${x.dayK}</td><td>${sun?'ಭಾನುವಾರ / Sunday':c(x.morning,x.mSig)}</td><td>${sun?'':c(x.afternoon,x.aSig)}</td><td style="font-size:6.5pt;">${esc(x.by)}</td></tr>`; }).join('');
  return `<div class="reg-sheet reg-port" style="${n<total?'page-break-after:always;':''}"><div class="reg-body">
    ${regHead('ಸಿಬ್ಬಂದಿ ಹಾಜರಾತಿ ವಹಿ / Staff Attendance Register', esc(salaryMonthLabel(month)))}
    <table class="reg-tb reg-info"><tr><td><b>ಹೆಸರು / Name:</b> ${esc(st.name)}</td><td><b>ಹುದ್ದೆ / Designation:</b> ${esc(st.desig||'')}</td><td><b>HRMS ID:</b> ${esc(st.hrmsId)}</td></tr></table>
    <table class="reg-tb reg-day"><thead><tr><th style="width:9mm">Date</th><th style="width:14mm">Day</th><th>Morning (Digitally signed)</th><th>Afternoon (Digitally signed)</th><th style="width:24mm">Entered by</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="reg-key">Working Days: ${D.work} &nbsp; Present: ${D.present} &nbsp; Leave/OD: ${D.leave} &nbsp; Absent: ${D.absent}</div>
  </div>${regFoot(n,total)}</div>`;
}
function attStaffPrint(){
  if(!attAllStaffRole()) return;
  const month=document.getElementById('atr_month')?.value||defaultSalaryMonth();
  const list=attSelectedStaff(); if(!list.length){ showToast('⚠ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ'); return; }
  regPrint('<div class="reg-wrap">'+list.map((st,i)=>attStaffSheetHTML(st,month,i+1,list.length)).join('')+'</div>',false);
}
function attStaffExcel(){
  if(!attAllStaffRole()) return;
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const month=document.getElementById('atr_month')?.value||defaultSalaryMonth();
  const list=attSelectedStaff(); if(!list.length){ showToast('⚠ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ'); return; }
  const wb=XLSX.utils.book_new(); const used={};
  const sum=computeMonthlyReportRows(month).filter(r=>list.some(s=>s.hrmsId===r.hrmsId));
  const sh=['HRMS ID','Name','Designation','Working Days','Present','CL','RH','EL','ML','HPL','MatL','OD','OOD','Absent','Attendance %'];
  const sws=XLSX.utils.aoa_to_sheet([['Staff Attendance Summary — '+salaryMonthLabel(month)],[],sh,...sum.map(r=>[r.hrmsId,r.name,r.desig,r.workingDays,r.present,r.cl,r.rh,r.el,r.ml,r.hpl,r.matl,r.od,r.ood,r.absent,r.attPct+'%'])]);
  sws['!cols']=sh.map((h,i)=>({wch:i===1?26:i===2?20:12}));
  XLSX.utils.book_append_sheet(wb,sws,'Summary');
  list.forEach(st=>{
    const D=attDayData(st,month);
    const hdr=['Date','Day','Morning','Morning Signed','Afternoon','Afternoon Signed','Entered By','Remarks'];
    const aoa=[['Staff Attendance Register — '+salaryMonthLabel(month)],['Name: '+st.name,'','Designation: '+(st.desig||''),'','HRMS ID: '+st.hrmsId],[],hdr,
      ...D.days.map(x=>[fmtDate(x.ds),x.dayE,(x.dow===0&&!x.morning)?'Sunday':x.morning,x.mSig,(x.dow===0&&!x.morning)?'':x.afternoon,x.aSig,x.by,x.note]),
      [],['Working Days',D.work,'Present',D.present,'Leave/OD',D.leave,'Absent',D.absent]];
    const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!cols']=[{wch:13},{wch:6},{wch:12},{wch:30},{wch:12},{wch:30},{wch:20},{wch:24}];
    let nm=String(st.name).replace(/[\\\/\?\*\[\]:]/g,'').slice(0,28)||'Staff'; used[nm]=(used[nm]||0)+1; if(used[nm]>1) nm=nm.slice(0,26)+'_'+used[nm];
    XLSX.utils.book_append_sheet(wb,ws,nm);
  });
  XLSX.writeFile(wb,'Staffwise_Attendance_'+month+(list.length===1?'_'+String(list[0].name).replace(/\s+/g,'_'):'')+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

function downloadAttendanceReportExcel(id){
  if(!attAllStaffRole()) return;
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const rec=(DB.attendanceReports||[]).find(r=>r.id===id); if(!rec) return;
  const header=['HRMS ID','Name','Designation','Working Days','Present','CL','RH','EL','ML','HPL','MatL','OD','OOD','Absent','Attendance %','Closing EL'];
  const rows=rec.rows.map(r=>[r.hrmsId,r.name,r.desig,r.workingDays,r.present,r.cl,r.rh,r.el,r.ml,r.hpl,r.matl,r.od,r.ood,r.absent,r.attPct+'%',r.closingEL]);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Attendance Report');
  XLSX.writeFile(wb,'Attendance_Report_'+rec.month+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

;(window.__LOADED=window.__LOADED||[]).push('attendance-salary');
