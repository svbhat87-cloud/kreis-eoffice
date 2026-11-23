/* =====================================================================
   KREIS e-Office v35 — principal.js
   ಪ್ರಾಂಶುಪಾಲರು — Principal dashboard and principal-only screens
   ===================================================================== */
/* ===== Principal's approval inbox (message box on the dashboard): everything waiting for the Principal ===== */
var PI_ALL=false;
function principalPendingItems(){
  const out=[], add=(ic,kind,title,from,at,page)=>out.push({ic,kind,title:String(title||'').trim(),from:from||'',at:at||'',page});
  const sp=x=>x&&x.status==='Sent to Principal';
  (DB.leaveApplications||[]).filter(sp).forEach(l=>add('📅','ರಜೆ ಅರ್ಜಿ',(l.staffName||'')+' — '+String(l.leaveType||'').split(' ')[0]+' · '+fmtDate(l.fromDate)+(l.toDate&&l.toDate!==l.fromDate?' → '+fmtDate(l.toDate):'')+' ('+l.days+' ದಿನ)',l.staffName,l.createdAt,'leaveapprove'));
  (DB.inward||[]).filter(sp).forEach(i=>add('📥','ಒಳಬರುವ ಪತ್ರ',i.subject||i.letterNo||'Inward',i.createdBy||'FDA',i.createdAt||i.receivedDate,'inward'));
  (DB.outward||[]).filter(sp).forEach(o=>add('📤','ಹೊರಹೋಗುವ ಪತ್ರ',o.subject||'Outward',o.createdBy||'FDA',o.createdAt||o.date,'outward'));
  (DB.messages||[]).filter(sp).forEach(m=>add('💬','ಆಂತರಿಕ ಸಂದೇಶ',m.subject||m.text||'ಸಂದೇಶ',m.createdBy||m.fromName||'FDA',m.createdAt||m.sentAt,'messages'));
  (DB.bills||[]).filter(sp).forEach(b=>add('🧾','ಬಿಲ್ ಪಾವತಿ (DC Bill)',(b.payee||'—')+' — '+money(b.amount),b.createdBy||'FDA',b.createdAt||b.date,'bills'));
  (DB.cashbookSigns||[]).filter(x=>x.status==='Submitted').forEach(x=>add('💵','ನಗದು ಪುಸ್ತಕ',(typeof cbMonthLabel==='function'?cbMonthLabel(x.month):x.month)+' — ಅನುಮೋದನೆ ಬಾಕಿ',x.submittedBy||'FDA',x.submittedAt,'cashbook'));
  (DB.cashbookRangeSigns||[]).filter(x=>x.status==='Submitted').forEach(x=>add('💵','ನಗದು ಪುಸ್ತಕ',(x.from?fmtDate(x.from)+' → '+fmtDate(x.to):'ದಿನಾಂಕ ಶ್ರೇಣಿ')+' — ಅನುಮೋದನೆ ಬಾಕಿ',x.submittedBy||'FDA',x.submittedAt,'cashbook'));
  (DB.dutyAllotments||[]).filter(sp).forEach(d=>add('📋','ಕರ್ತವ್ಯ ನಿಯೋಜನೆ',(d.staffName||'')+' — '+(d.dutyType||''),d.createdBy||'FDA',d.createdAt,'dutyapprove'));
  (DB.progressCards||[]).filter(sp).forEach(c=>add('📄','ಪ್ರಗತಿ ಪತ್ರಿಕೆ',(c.studentName||'')+' ('+c.className+'ನೇ)',c.classTeacherName||'',c.classTeacherSignedAt,'pcsign'));
  (DB.stDocuments||[]).filter(sp).forEach(d=>add('📜',d.docType||'SC/TC',d.studentName||'',d.sentBy||'FDA',d.sentAt,'sctcsign'));
  (DB.stockMonthly||[]).filter(sp).forEach(m=>add('📦','ಸಾಮಗ್ರಿ ವಹಿ',typeof stkRecLabel==='function'?stkRecLabel(m):m.month,m.sentBy||'FDA',m.sentAt,'stock'));
  (DB.foodIndents||[]).filter(sp).forEach(i=>add('🍱','ಆಹಾರ ಇಂಡೆಂಟ್',(i.indentType||'')+(i.purpose?' — '+i.purpose:''),i.createdBy||'ವಾರ್ಡನ್',i.createdAt,'foodindent'));
  (DB.beedigaPatti||[]).filter(sp).forEach(b=>add('📊','ಮಾಸಿಕ ಬೀಡಿಕೆ ಪಟ್ಟಿ',(b.month||'')+'-'+(b.year||'')+' — '+money(b.totalExpense),b.createdBy||'ವಾರ್ಡನ್',b.createdAt,'foodmonthly'));
  (DB.taBills||[]).filter(b=>b.status==='Submitted'&&b.pStage==='Sent').forEach(b=>add('🚌','TA ಬಿಲ್',(b.staffName||'')+' — '+(typeof taBillLabel==='function'?taBillLabel(b):'')+(typeof taBillTotals==='function'?' · ₹'+taMoney(taBillTotals(b).total):''),b.staffName||b.pSentBy||'FDA',b.pSentAt||b.submittedDate||b.createdAt,'tabillregister'));
  (DB.sslcAdoptions||[]).filter(sp).forEach(a=>add('🤝','SSLC Adoption',(a.studentName||'')+' → '+(a.assignedToName||''),a.assignedByName||'',a.createdAt,'sslc'));
  (DB.elApps||[]).filter(a=>a.status==='Submitted'&&a.pStage==='Sent').forEach(a=>add('📄','EL ಅರ್ಜಿ',(a.nameKn||a.staffName||'')+' — '+(typeof elLeaveText==='function'?elLeaveText(a):''),a.staffName||a.nameKn||'',a.pSentAt||a.submittedDate,'elregister'));
  (DB.assets||[]).filter(sp).forEach(a=>add('🪑','ಚರಾಸ್ತಿ ವಹಿ',(a.description||'')+(a.purchaseQty?' — '+a.purchaseQty+' × ₹'+(a.rate||0):''),a.createdBy||'FDA',a.createdAt||a.purchaseDate,'assets'));
  (DB.meetings||[]).filter(sp).forEach(m=>add('🤝','ಸಭೆ ಮಿನಿಟ್ಸ್',(m.title||m.subject||m.type||m.meetingType||'ಸಭೆ')+(m.date?' — '+fmtDate(m.date):''),m.createdBy||m.sentBy||'FDA',m.sentAt||m.createdAt||m.date,'mtgsign'));
  (()=>{ const g={}; (DB.marks||[]).filter(m=>m.status==='Frozen').forEach(m=>{ const k=m.className+'||'+m.examName; if(!g[k]) g[k]={c:m.className,e:m.examName,n:0,at:m.frozenAt||m.updatedAt||m.createdAt||''}; g[k].n++; }); Object.values(g).forEach(x=>add('📊','ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ',x.c+'ನೇ ತರಗತಿ — '+x.e,'ಕ್ಲಾಸ್ ಟೀಚರ್',x.at,'consolidated')); })();
  (DB.studyCertificates||[]).filter(c=>c.status==='Submitted').forEach(c=>{ const st=(DB.students||[]).find(x=>x.id===c.studentId); add('🎓','ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ',(st?st.studentName:'')+(c.no?' — '+c.no:''),c.submittedBy||'FDA',c.submittedAt||c.date,'stucerts'); });
  (DB.tcRequestLetters||[]).filter(l=>!l.principalSigned&&stuAny(l.studentId)).forEach(l=>{ const st=stuAny(l.studentId); add('📨','TC ಕೋರಿಕೆ ಪತ್ರ',(st?st.studentName:'')+(l.letterNo?' — '+l.letterNo:''),'FDA',l.letterDate||l.createdAt,'stucerts'); });
  (DB.admissionApplications||[]).filter(a=>!a.principalSigned&&stuAny(a.studentId)).forEach(a=>{ const st=stuAny(a.studentId); add('📝','ಪ್ರವೇಶ ಅರ್ಜಿ',(st?st.studentName:'')+((a.appNo||a.applicationNo)?' — '+(a.appNo||a.applicationNo):''),'FDA',a.generatedAt,'stucerts'); });
  (DB.lessonPlans||[]).filter(x=>x.status==='Submitted').forEach(x=>add('📘','ಲೆಸನ್ ಪ್ಲಾನ್',(x.subject||'')+(x.className?' ('+x.className+'ನೇ)':''),x.createdBy||'',x.submittedAt||x.createdAt,'lessonplan'));
  (DB.yearPlans||[]).filter(x=>x.status==='Submitted').forEach(x=>add('🗓️','ಇಯರ್ ಪ್ಲಾನ್',(x.subject||'')+(x.className?' ('+x.className+'ನೇ)':''),x.createdBy||'',x.submittedAt||x.createdAt,'yearplan'));
  (DB.mentorOrders||[]).filter(sp).forEach(o=>add('🧑‍🏫','ಮೆಂಟರ್ ಆದೇಶ',(o.mentorName||'')+(o.orderNo?' — '+o.orderNo:''),o.createdBy||'FDA',o.createdAt,'mentorallocation'));
  (DB.attRegLists||[]).filter(sp).forEach(l=>add('📝','ತರಬೇತಿ ನೋಂದಣಿ ಪಟ್ಟಿ',(l.subject||'')+' — '+(l.count||0)+' ಶಿಕ್ಷಕರು',l.sentBy||'FDA',l.sentAt,'attcert'));
  (DB.attCerts||[]).filter(sp).forEach(c=>add('🎓','ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ',(c.name||'')+' — '+(c.hrmsId||''),c.sentBy||'FDA',c.sentAt,'attcert'));
  return out.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
}
function piToggle(){ PI_ALL=!PI_ALL; navigate('dashboard'); }
function principalInboxHTML(){
  const items=principalPendingItems();
  if(!items.length) return `<div class="panel" style="border-left:4px solid var(--green);padding:12px 16px;display:flex;align-items:center;gap:10px;"><span style="font-size:18px;">✅</span><div style="font-family:var(--font-kn);"><b>ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇರುವ ಕಡತಗಳಿಲ್ಲ</b></div></div>`;
  const show=PI_ALL?items:items.slice(0,6);
  const kinds={}; items.forEach(i=>{ kinds[i.kind]=(kinds[i.kind]||0)+1; });
  return `<div class="panel" style="border-left:4px solid var(--navy);padding:0;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;background:var(--surface-2);border-bottom:1px solid var(--border);">
      <span style="font-size:18px;">📨</span><b style="font-family:var(--font-kn);font-size:15px;">ಅನುಮೋದನೆಗಾಗಿ ಬಂದಿರುವ ಸಂದೇಶಗಳು</b>
      <span class="badge badge-warn" style="font-weight:800;">${items.length}</span>
      <span style="margin-left:auto;font-size:11px;color:var(--muted);">${Object.entries(kinds).map(([k,v])=>esc(k)+' '+v).join(' · ')}</span></div>
    <div class="table-wrap" style="border:0;border-radius:0;"><table class="gov-table" style="width:100%;table-layout:fixed;border-collapse:collapse;">
      <colgroup><col style="width:5%"><col style="width:20%"><col style="width:38%"><col style="width:17%"><col style="width:12%"><col style="width:8%"></colgroup>
      <thead><tr><th style="text-align:center;">ಕ್ರ.ಸಂ</th><th>ಪ್ರಕಾರ</th><th>ವಿವರ</th><th>ಕಳುಹಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th style="text-align:center;">ಕ್ರಮ</th></tr></thead>
      <tbody>${show.map((i,n)=>`<tr onclick="navigate('${i.page}')" style="cursor:pointer;border-bottom:1px solid var(--border);">
        <td style="text-align:center;font-size:12px;color:var(--muted);">${n+1}</td>
        <td style="font-family:var(--font-kn);font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="margin-right:6px;">${i.ic}</span>${esc(i.kind)}</td>
        <td style="font-family:var(--font-kn);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(i.title)}">${esc(i.title)}</td>
        <td style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.from?esc(i.from):'—'}</td>
        <td style="font-size:12px;white-space:nowrap;">${i.at?fmtDate(i.at):'—'}</td>
        <td style="text-align:center;"><button class="btn btn-sm btn-primary" onclick="event.stopPropagation();navigate('${i.page}')">ತೆರೆಯಿರಿ</button></td></tr>`).join('')}</tbody></table></div>
    ${items.length>6?`<div style="padding:8px 16px;text-align:center;"><button class="btn btn-sm btn-outline" onclick="piToggle()">${PI_ALL?'ಕಡಿಮೆ ತೋರಿಸಿ ▲':'ಎಲ್ಲಾ '+items.length+' ತೋರಿಸಿ ▼'}</button></div>`:''}
  </div>`;
}

function dashCardsPrincipal(ctx){
  const {pendingInward,pendingBills,pendingMsgs,myMovements}=ctx;
  let cards='';

    cards+=statCard(DB.students.length,'ವಿದ್ಯಾರ್ಥಿಗಳು');
    cards+=statCard(DB.inward.length,'ಒಳಬರುವ ಪತ್ರಗಳು');
    cards+=statCard(DB.outward.length,'ಹೊರಹೋಗುವ ಪತ್ರಗಳು');
    cards+=statCard(DB.bills.length,'ಒಟ್ಟು ಬಿಲ್‌ಗಳು');
  
 cards+=statCard(principalPendingItems().length, 'ನಿಮ್ಮ ಅನುಮೋದನೆಗೆ ಬಾಕಿ'); 
  return cards;
}

function renderExamActivation(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🎯 ಪರೀಕ್ಷೆ Activation (Exam Activation)</h2>
    <div class="desc">ಪ್ರತಿ ತರಗತಿಗೆ ಯಾವ ಪರೀಕ್ಷೆಗಳು ಸಕ್ರಿಯ ಎಂದು ಆಯ್ಕೆ ಮಾಡಿ — ಸಕ್ರಿಯಗೊಳಿಸಿದ ಪರೀಕ್ಷೆ ಮಾತ್ರ ವಿಷಯ ಶಿಕ್ಷಕರ Marks Entry ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ</div></div>
    ${['6','7','8','9','10'].map(cls=>{
      const exams=examNamesForClass(cls);
      const active=getActivatedExams(cls);
      return `<div class="panel">
        <h3>${cls}ನೇ ತರಗತಿ</h3>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${exams.map(ex=>`<label style="display:flex;align-items:center;gap:4px;font-size:12px;border:1px solid var(--border);border-radius:6px;padding:4px 10px;cursor:pointer;background:${active.includes(ex)?'var(--green-tint)':''};">
            <input type="checkbox" class="ea_${cls}" value="${esc(ex)}" ${active.includes(ex)?'checked':''}> ${esc(ex)}
          </label>`).join('')}
        </div>
        <div class="form-actions"><button class="btn btn-sm btn-primary" onclick="saveExamActivation('${cls}')">💾 Save</button></div>
      </div>`;
    }).join('')}`;
}

function saveExamActivation(cls){
  const active=[...document.querySelectorAll('.ea_'+cls+':checked')].map(el=>el.value);
  if(!DB.examActivation) DB.examActivation={};
  DB.examActivation[cls]=active;
  logAudit('Assignment Change','ExamActivation',cls,active.join(', '));
  saveDB();
  showToast('✅ '+cls+'ನೇ ತರಗತಿ Exam Activation Save ಆಗಿದೆ');
}

function renderClassAlloc(){
  const teachers=staffNamesForRole('staff');
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ತರಗತಿ ಶಿಕ್ಷಕ ನಿಯೋಜನೆ (Class Teacher Allocation)</h2></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>ತರಗತಿ</th><th>ಪ್ರಸ್ತುತ Class Teacher</th><th>ಬದಲಿಸಿ</th></tr></thead>
    <tbody>${CLASSES.map(c=>`<tr><td>${c}ನೇ ತರಗತಿ</td><td>${esc(DB.classTeacherAllocation[c]||'—')}</td><td>
      <select id="ca_${c}"><option value="">— None —</option>${teachers.map(t=>`<option value="${esc(t)}" ${DB.classTeacherAllocation[c]===t?'selected':''}>${esc(t)}</option>`).join('')}</select>
      <button class="btn btn-sm btn-primary" onclick="assignClassTeacher('${c}')">Assign</button>
    </td></tr>`).join('')}</tbody></table></div></div>`;
}

function assignClassTeacher(cls){
  const val=document.getElementById('ca_'+cls).value;
  if(val) DB.classTeacherAllocation[cls]=val; else delete DB.classTeacherAllocation[cls];
  saveDB();
  if(val) pushNotification(val,'ನೀವು '+cls+'ನೇ ತರಗತಿಯ Class Teacher ಆಗಿ ನಿಯೋಜಿತರಾಗಿದ್ದೀರಿ');
  showToast('✅ ನಿಯೋಜಿಸಲಾಗಿದೆ'); navigate('classalloc');
}

function renderSCTCSign(){
  const pending = DB.stDocuments.filter(d=>d.status==='Sent to Principal');
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✍️ SC / TC Approve (Principal)</h2>
    </div>
    <div id="sctcPreviewWrap"></div>
    ${!pending.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">Approve ಅಗತ್ಯವಿರುವ ಯಾವುದೇ ದಾಖಲೆ ಇಲ್ಲ.</div></div>':''}
    ${pending.map(d=>`<div class="panel">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div>
          <span class="badge ${d.docType==='SC'?'badge-ok':'badge-info'}" style="font-size:13px;">${d.docType}</span>
          <h3 style="margin:4px 0;">${esc(d.studentName)} — ${esc(d.className)}ನೇ ತರಗತಿ</h3>
          <div class="small-muted">Generated: ${fmtDate(d.createdAt)} by ${esc(d.createdBy)}${d.sentAt?' · ಕಳುಹಿಸಿದ ದಿನಾಂಕ: '+fmtDate(d.sentAt):''}</div>
          <div style="margin-top:6px;">${sctcStepper(d,true)}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="viewSCTCDoc('${d.id}')">👁 View</button>
      </div>
      <div class="form-actions">
        <div class="field" style="margin-bottom:8px;"><label>ಟಿಪ್ಪಣಿ / Reject ಕಾರಣ</label><input id="sctc_rem_${d.id}" placeholder="Reject ಆದರೆ ಕಾರಣ ಕಡ್ಡಾಯ..."></div>
        <button class="btn btn-outline btn-sm" onclick="viewSCTCDoc('${d.id}')">👁 Full Preview</button>
        <button class="btn btn-primary" onclick="approveSCTC('${d.id}')">✅ Approve & E-Sign</button>
        <button class="btn btn-red btn-sm" onclick="rejectSCTCWithReason('${d.id}')">✕ Reject (ಕಾರಣ ಕಡ್ಡಾಯ)</button>
      </div>
    </div>`).join('')}`;
}

function approveSCTC(docId){
  const d = DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  d.principalSigned=true; d.principalSignedAt=todayStr(); d.principalName=CURRENT_USER.name;
  d.status='Ready to Issue'; saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ '+d.docType+' Ready to Issue: '+d.studentName+' — SC/TC Generate ನಲ್ಲಿ Issue ಮಾಡಿ'));
  showToast('✅ E-Signed — FDA ಗೆ Ready to Issue ಕಳುಹಿಸಲಾಗಿದೆ');
  navigate('sctcsign');
}

function rejectSCTCWithReason(docId){
  const d=DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  const reason=document.getElementById('sctc_rem_'+docId)?.value?.trim()||'';
  if(!reason){ showToast('⚠ Reject ಕಾರಣ ಬರೆಯಿರಿ (ಕಡ್ಡಾಯ)'); document.getElementById('sctc_rem_'+docId)?.focus(); return; }
  d.status='Rejected'; d.remarks=reason; saveDB();
  pushNotification(d.createdBy, d.docType+' Rejected: '+d.studentName+' — '+reason);
  showToast('↩ Reject: '+reason); navigate('sctcsign');
}

function renderWardenCharge(){
  if(!DB.wardenCharge) DB.wardenCharge=[];
  const activeCharge = DB.wardenCharge.filter(wc=>wc.active);
  const history = DB.wardenCharge.filter(wc=>!wc.active);
  const eligibleStaff = STAFF.filter(s=>s.role==='staff');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🔑 ವಾರ್ಡನ್ ಪ್ರಭಾರ ನಿಯೋಜನೆ</h2>
    <div class="desc">Principal — ಯಾವ ಸಿಬ್ಬಂದಿಗೆ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಬೇಕು ಎಂದು ಆಯ್ಕೆ ಮಾಡಿ. ಆ ಸಿಬ್ಬಂದಿ ತಮ್ಮ HRMS ID ಮತ್ತು Password ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ ವಾರ್ಡನ್ ಕಾರ್ಯ ನಿರ್ವಹಿಸಬಹುದು.</div></div>

    ${activeCharge.length?`<div class="note" style="background:var(--green-tint);border-color:var(--green);">
      ✅ ಪ್ರಸ್ತುತ ವಾರ್ಡನ್ ಪ್ರಭಾರ: <b>${activeCharge.map(wc=>wc.staffName).join(', ')}</b>
    </div>`:'<div class="note">⚠ ಪ್ರಸ್ತುತ ಯಾರಿಗೂ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಲಾಗಿಲ್ಲ.</div>'}

    <div class="panel"><h3>👤 ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ — ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಿ</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>HRMS ID</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಪ್ರಭಾರ ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${eligibleStaff.map(s=>{
        const charge=DB.wardenCharge.find(wc=>wc.staffHrmsId===s.hrmsId&&wc.active);
        return `<tr>
          <td><code>${esc(s.hrmsId)}</code></td>
          <td><b>${esc(s.name)}</b></td>
          <td>${esc(s.desig)}</td>
          <td>${charge?`<span class="badge badge-ok">✅ ಪ್ರಭಾರ ನೀಡಿದ್ದಾರೆ (${fmtDate(charge.assignedAt)})</span>`:'<span class="small-muted">—</span>'}</td>
          <td class="actions-cell">
            ${!charge?`<button class="btn btn-sm btn-primary" onclick="openAssignWardenModal('${s.hrmsId}','${esc(s.name)}')">🔑 ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಿ</button>`:
            `<button class="btn btn-sm btn-red" onclick="stopWardenCharge('${charge.id}')">🛑 ಪ್ರಭಾರ ನಿಲ್ಲಿಸಿ</button>`}
          </td>
        </tr>`;
      }).join('')}
      </tbody></table></div>
    </div>

    ${history.length?`<div class="panel"><h3>📋 ಇತಿಹಾಸ (${history.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಸಿಬ್ಬಂದಿ</th><th>ನಿಯೋಜಿಸಿದ ದಿನ</th><th>ಆದೇಶ ಸಂಖ್ಯೆ</th><th>ನಿಲ್ಲಿಸಿದ ದಿನ</th><th>ನಿಲ್ಲಿಸಿದ ಆದೇಶ</th>
      </tr></thead>
      <tbody>${history.map(wc=>`<tr>
        <td>${esc(wc.staffName)}</td>
        <td>${fmtDate(wc.assignedAt)}</td>
        <td>${esc(wc.orderNo)}</td>
        <td>${fmtDate(wc.stoppedAt)||'—'}</td>
        <td>${esc(wc.stopOrderNo||'—')}</td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>`:''}`;
}

function openAssignWardenModal(hrmsId, staffName){
  const orderNo='ಮೊದೇವಶಾ/ವಾ.ಪ್ರ/'+nextSeq('wardencharge')+'/'+(new Date().getFullYear());
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:480px;">
    <h3>🔑 ವಾರ್ಡನ್ ಪ್ರಭಾರ ನಿಯೋಜನೆ</h3>
    <div class="kv"><b>ಸಿಬ್ಬಂದಿ</b>${esc(staffName)}</div>
    <div class="kv"><b>HRMS ID</b><code>${esc(hrmsId)}</code></div>
    <div class="kv"><b>ಆದೇಶ ಸಂಖ್ಯೆ</b>${esc(orderNo)}</div>
    <div class="field"><label>ಪ್ರಭಾರ ಪ್ರಾರಂಭ ದಿನಾಂಕ</label><input id="wc_from" type="date" value="${todayStr()}"></div>
    <div class="field"><label>ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)</label><input id="wc_note" placeholder="ಉದಾ: ವಾರ್ಡನ್ ರಜೆ ಕಾರಣ ಪ್ರಭಾರ"></div>
    <div class="note" style="margin-top:10px;">
      ✅ ಈ ಸಿಬ್ಬಂದಿ ತಮ್ಮ HRMS ID <code>${esc(hrmsId)}</code> ಮತ್ತು ಅವರ Password ಮೂಲಕ<br>
      ಲಾಗಿನ್ ಆಗಿ ವಾರ್ಡನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನಿರ್ವಹಿಸಬಹುದು.
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Cancel</button>
      <button class="btn btn-primary" onclick="assignWardenCharge('${hrmsId}','${esc(staffName)}','${esc(orderNo)}')">✅ ಪ್ರಭಾರ ನೀಡಿ & ಆದೇಶ ಹೊರಡಿಸಿ</button>
    </div>
  </div>`;
}

function assignWardenCharge(hrmsId, staffName, orderNo){
  if(!DB.wardenCharge) DB.wardenCharge=[];
  // Deactivate any existing charge for this staff
  DB.wardenCharge.filter(wc=>wc.staffHrmsId===hrmsId&&wc.active).forEach(wc=>{
    wc.active=false; wc.stoppedAt=todayStr(); wc.stoppedBy=CURRENT_USER.name;
  });
  const fromDate=document.getElementById('wc_from')?.value||todayStr();
  const note=document.getElementById('wc_note')?.value||'';
  DB.wardenCharge.push({
    id:uid(), staffName, staffHrmsId:hrmsId,
    assignedBy:CURRENT_USER.name, assignedAt:fromDate,
    orderNo, note, active:true,
    stoppedAt:null, stoppedBy:null, stopOrderNo:null
  });
  saveDB();
  pushNotification(staffName,'🔑 ನಿಮಗೆ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಲಾಗಿದೆ (ಆದೇಶ: '+orderNo+') — ನಿಮ್ಮ HRMS ID ಮತ್ತು Password ಮೂಲಕ Login ಮಾಡಿ ವಾರ್ಡನ್ ಕಾರ್ಯ ನಿರ್ವಹಿಸಿ');
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ '+staffName+' ಗೆ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನೀಡಲಾಗಿದೆ — ಅವರು Login ಆದಾಗ ವಾರ್ಡನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕಾಣಿಸುತ್ತದೆ');
  navigate('wardencharge');
}

function stopWardenCharge(chargeId){
  const wc=DB.wardenCharge.find(x=>x.id===chargeId); if(!wc) return;
  const reason=prompt('ಪ್ರಭಾರ ನಿಲ್ಲಿಸುವ ಕಾರಣ ಮತ್ತು ಆದೇಶ ಸಂಖ್ಯೆ:')||'ಪ್ರಭಾರ ಮುಕ್ತಾಯ';
  const stopOrder='ಮೊದೇವಶಾ/ವಾ.ಪ್ರ.ಮು/'+nextSeq('wardenstop')+'/'+(new Date().getFullYear());
  wc.active=false; wc.stoppedAt=todayStr(); wc.stoppedBy=CURRENT_USER.name;
  wc.stopOrderNo=stopOrder; wc.stopNote=reason;
  saveDB();
  pushNotification(wc.staffName,'🛑 ನಿಮ್ಮ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನಿಲ್ಲಿಸಲಾಗಿದೆ (ಆದೇಶ: '+stopOrder+')');
  showToast('✅ ವಾರ್ಡನ್ ಪ್ರಭಾರ ನಿಲ್ಲಿಸಲಾಗಿದೆ — ಆದೇಶ: '+stopOrder);
  navigate('wardencharge');
}

function renderDutyApprove(){
  if(!DB.dutyAllotments) DB.dutyAllotments=[];
  const pending=DB.dutyAllotments.filter(d=>d.status==='Sent to Principal');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✅ ಕರ್ತವ್ಯ ಅನುಮೋದನೆ (Duty Approval)</h2>
    <div class="desc">Principal — FDA ಕಳುಹಿಸಿದ ಕರ್ತವ್ಯ ಆದೇಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ E-Sign ಮಾಡಿ</div></div>

    ${!pending.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">✅ Approve ಅಗತ್ಯವಿರುವ ಯಾವ ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಇಲ್ಲ.</div></div>':''}
    ${pending.map(d=>`<div class="panel">
      <h3>${esc(d.orderNo)} — ${esc(d.staffName)}</h3>
      <div class="form-grid">
        <div class="kv"><b>ಸಿಬ್ಬಂದಿ</b>${esc(d.staffName)} (${esc(d.staffDesig||'')})</div>
        <div class="kv"><b>HRMS</b>${esc(d.staffHrmsId)}</div>
        <div class="kv"><b>ಕರ್ತವ್ಯ</b>${esc(d.dutyType)}</div>
        <div class="kv"><b>ವಿವರ</b>${esc(d.desc||'—')}</div>
        <div class="kv"><b>ದಿನಾಂಕ</b>${fmtDate(d.fromDate)}${d.toDate?' → '+fmtDate(d.toDate):' (ಮುಂದಿನ ಆದೇಶದ ವರೆಗೆ)'}</div>
        <div class="kv"><b>FDA</b>${esc(d.createdBy)} (${fmtDate(d.createdAt)})</div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline btn-sm" onclick="previewDutyOrder('${d.id}')">👁 Preview</button>
        <button class="btn btn-primary" onclick="approveDutyOrder('${d.id}')">✍️ E-Sign & Approve → FDA ಗೆ</button>
        <button class="btn btn-red btn-sm" onclick="rejectDutyOrder('${d.id}')">✕ Reject</button>
      </div>
    </div>`).join('')}`;
}

function approveDutyOrder(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  d.status='Approved'; d.principalSigned=true;
  d.principalName=CURRENT_USER.name; d.principalSignedAt=todayStr();
  saveDB();
  pushNotification(d.createdBy,'✅ ಕರ್ತವ್ಯ Approved: '+d.staffName+' — '+d.dutyType+' | "ಕರ್ತವ್ಯ ನಿಯೋಜನೆ" ನಲ್ಲಿ Staff ಗೆ ಕಳುಹಿಸಿ');
  // Show WhatsApp notify option
  const staffM=STAFF.find(x=>x.hrmsId===d.staffHrmsId);
  if(staffM?.mobile&&staffM.mobile!=='—'){
    const waMsg=`ಪ್ರಿಯ ${d.staffName},\n\nKREIS e-Office ನಲ್ಲಿ ನಿಮ್ಮ ಕರ್ತವ್ಯ ಆದೇಶ Approved ಆಗಿದೆ.\n📋 ${d.orderNo} | ${d.dutyType}\nFDA Login ಮಾಡಿ ಕಳುಹಿಸುತ್ತಾರೆ.\nhttp://mdrsshedbariesoffice.in`;
    const waURL=`https://wa.me/91${staffM.mobile.replace(/\D/g,'')}?text=${encodeURIComponent(waMsg)}`;
    setTimeout(()=>{ if(confirm('📱 '+d.staffName+' ಗೆ WhatsApp ಮೂಲಕ ತಿಳಿಸಲೇ?')) window.open(waURL,'_blank'); },400);
  }
  showToast('✅ E-Signed — FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  navigate('dutyapprove');
}

function rejectDutyOrder(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  const reason=prompt('Reject ಕಾರಣ (ಕಡ್ಡಾಯ):')||'';
  if(!reason){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  d.status='Rejected'; d.rejectReason=reason; saveDB();
  pushNotification(d.createdBy,'❌ ಕರ್ತವ್ಯ Rejected: '+d.staffName+' — '+reason);
  showToast('↩ Rejected: '+reason); navigate('dutyapprove');
}

function renderAdminCharge(){
  if(!DB.adminCharges) DB.adminCharges=[];
  const allStaff=STAFF.filter(s=>s.role==='staff');
  const today=todayStr();
  const active=DB.adminCharges.filter(c=>c.active && c.toDate>=today);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🏛️ ಆಡಳಿತ ಪ್ರಭಾರ ನಿಯೋಜನೆ</h2>
    <div class="desc">Principal ರಜೆಯಲ್ಲಿ ಇರುವಾಗ — ಆಡಳಿತ ಜವಾಬ್ದಾರಿ (Inward/Outward/Office Orders) ನಿರ್ದಿಷ್ಟ ಸಿಬ್ಬಂದಿಗೆ ನೀಡಿ</div></div>

    ${active.length?`<div class="note" style="background:var(--green-tint);border-color:var(--green);">
      ✅ ಪ್ರಸ್ತುತ ಆಡಳಿತ ಪ್ರಭಾರ: <b>${active.map(c=>c.staffName+' ('+fmtDate(c.fromDate)+' → '+fmtDate(c.toDate)+')').join(', ')}</b>
    </div>`:''}

    <div class="panel"><h3>➕ ಆಡಳಿತ ಪ್ರಭಾರ ನೀಡಿ</h3>
      <div class="note">⚠ ಆಡಳಿತ ಪ್ರಭಾರ ಪಡೆದ ಸಿಬ್ಬಂದಿ — ಇಂದಿನಿಂದ ನಿರ್ದಿಷ್ಟ ದಿನಾಂಕದ ವರೆಗೆ Inward, Outward, Office Orders ಮತ್ತು ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅನ್ನು ಮಾಡಬಹುದು. ಅಂತ್ಯ ದಿನ ರಾತ್ರಿ 12 ಗಂಟೆ ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಕ್ತಾಯ.</div>
      <div class="form-grid">
        <div class="field"><label>ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ</label>
          <select id="ac_staff">${allStaff.map(s=>`<option value="${s.hrmsId}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ಪ್ರಭಾರ ಪ್ರಾರಂಭ ದಿನಾಂಕ</label><input type="date" id="ac_from" value="${today}"></div>
        <div class="field"><label>ಪ್ರಭಾರ ಅಂತ್ಯ ದಿನಾಂಕ</label><input type="date" id="ac_to"></div>
        <div class="field"><label>ಕಾರಣ (Principal ರಜೆ ವಿವರ)</label><input id="ac_reason" placeholder="ಉದಾ: CL 3 ದಿನ"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="assignAdminCharge()">🏛️ ಆಡಳಿತ ಪ್ರಭಾರ ನೀಡಿ</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ಆಡಳಿತ ಪ್ರಭಾರ ಇತಿಹಾಸ (${DB.adminCharges.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಸಿಬ್ಬಂದಿ</th><th>ಪ್ರಾರಂಭ</th><th>ಅಂತ್ಯ</th><th>ಕಾರಣ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${DB.adminCharges.length ? DB.adminCharges.slice().reverse().map(c=>`<tr>
        <td><b>${esc(c.staffName)}</b></td>
        <td>${fmtDate(c.fromDate)}</td>
        <td>${fmtDate(c.toDate)}</td>
        <td>${esc(c.reason||'—')}</td>
        <td><span class="badge ${c.active&&c.toDate>=today?'badge-ok':'badge-warn'}">${c.active&&c.toDate>=today?'ಸಕ್ರಿಯ':'ಮುಗಿದಿದೆ'}</span></td>
        <td>${c.active&&c.toDate>=today?`<button class="btn btn-sm btn-red" onclick="stopAdminCharge('${c.id}')">🛑 ನಿಲ್ಲಿಸಿ</button>`:'—'}</td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="6">ಯಾವ ಪ್ರಭಾರ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>`;
}

function assignAdminCharge(){
  const hrmsId=document.getElementById('ac_staff').value;
  const s=STAFF.find(x=>x.hrmsId===hrmsId); if(!s) return;
  const fromDate=document.getElementById('ac_from').value;
  const toDate=document.getElementById('ac_to').value;
  const reason=document.getElementById('ac_reason').value;
  if(!fromDate||!toDate){ showToast('⚠ ದಿನಾಂಕ ನಮೂದಿಸಿ'); return; }
  if(!DB.adminCharges) DB.adminCharges=[];
  // Deactivate existing for same staff
  DB.adminCharges.filter(c=>c.staffHrmsId===hrmsId&&c.active).forEach(c=>c.active=false);
  DB.adminCharges.push({
    id:uid(), staffName:s.name, staffHrmsId:hrmsId, staffDesig:s.desig||'',
    fromDate, toDate, reason, active:true,
    assignedBy:CURRENT_USER.name, assignedAt:todayStr()
  });
  saveDB();
  pushNotification(s.name,'🏛️ ಆಡಳಿತ ಪ್ರಭಾರ ನಿಯೋಜನೆ: '+fmtDate(fromDate)+' ರಿಂದ '+fmtDate(toDate)+' ವರೆಗೆ. ನಿಮ್ಮ Login ನಲ್ಲಿ ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕಾಣಿಸುತ್ತದೆ.');
  showToast('✅ ಆಡಳಿತ ಪ್ರಭಾರ ನೀಡಲಾಗಿದೆ — '+s.name+' ('+fmtDate(fromDate)+' → '+fmtDate(toDate)+')');
  navigate('admincharge');
}

function stopAdminCharge(id){
  const c=DB.adminCharges.find(x=>x.id===id); if(!c) return;
  c.active=false; c.expiredAt=todayStr(); saveDB();
  pushNotification(c.staffName,'🛑 ಆಡಳಿತ ಪ್ರಭಾರ ನಿಲ್ಲಿಸಲಾಗಿದೆ');
  showToast('✅ ಪ್ರಭಾರ ನಿಲ್ಲಿಸಲಾಗಿದೆ'); navigate('admincharge');
}

function renderTeacherAssign(){
  const teachStaff=STAFF.filter(s=>s.role==='staff');
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📚 ಶಿಕ್ಷಕ-ವಿಷಯ ನಿಯೋಜನೆ (Teacher-Subject / Class Assignment)</h2>
    <div class="desc">ಪ್ರತಿ ಶಿಕ್ಷಕರಿಗೆ ಯಾವ ವಿಷಯ(ಗಳು) ಮತ್ತು ಯಾವ ತರಗತಿ(ಗಳು) ಎಂದು ನಿಗದಿಪಡಿಸಿ. Lesson/Year Plan ರಚಿಸುವಾಗ ಶಿಕ್ಷಕರಿಗೆ ಇಲ್ಲಿ ನಿಗದಿಪಡಿಸಿದ ವಿಷಯ/ತರಗತಿ ಮಾತ್ರ ಕಾಣಿಸುತ್ತದೆ. "ಬೋಧಕೇತರ" ಗುರುತಿಸಿದ ಸಿಬ್ಬಂದಿಗೆ Lesson/Year Plan ಸಿಗುವುದಿಲ್ಲ.</div></div>

    ${teachStaff.map(s=>{
      const asg=getAssignment(s.hrmsId);
      return `<div class="panel" style="border-left:4px solid ${asg.isTeaching?'var(--green)':'var(--muted)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <h3 style="margin:0;">${esc(s.name)} <span style="font-size:11px;color:var(--muted);font-weight:400;">— ${esc(s.desig||'')}</span></h3>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="ta_teaching_${s.hrmsId}" ${asg.isTeaching?'checked':''}>
            ಬೋಧಕ ಸಿಬ್ಬಂದಿ (Teaching Staff) — Lesson/Year Plan Access
          </label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <b style="font-size:12px;">ವಿಷಯ(ಗಳು):</b>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
              ${SUBJECTS.map(sub=>`<label style="display:flex;align-items:center;gap:4px;font-size:12px;border:1px solid var(--border);border-radius:6px;padding:3px 8px;cursor:pointer;">
                <input type="checkbox" class="ta_subj_${s.hrmsId}" value="${esc(sub)}" ${asg.subjects.includes(sub)?'checked':''}> ${esc(sub)}
              </label>`).join('')}
            </div>
          </div>
          <div>
            <b style="font-size:12px;">ತರಗತಿ(ಗಳು):</b>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
              ${['6','7','8','9','10'].map(c=>`<label style="display:flex;align-items:center;gap:4px;font-size:12px;border:1px solid var(--border);border-radius:6px;padding:3px 8px;cursor:pointer;">
                <input type="checkbox" class="ta_class_${s.hrmsId}" value="${c}" ${asg.classes.includes(c)?'checked':''}> ${c}ನೇ
              </label>`).join('')}
            </div>
          </div>
        </div>
        <div class="form-actions"><button class="btn btn-sm btn-primary" onclick="saveTeacherAssign('${s.hrmsId}')">💾 Save</button></div>
      </div>`;
    }).join('')}`;
}

function saveTeacherAssign(hrmsId){
  const isTeaching=document.getElementById('ta_teaching_'+hrmsId)?.checked||false;
  const subjects=[...document.querySelectorAll('.ta_subj_'+hrmsId+':checked')].map(el=>el.value);
  const classes=[...document.querySelectorAll('.ta_class_'+hrmsId+':checked')].map(el=>el.value);
  if(!DB.teacherAssignments) DB.teacherAssignments={};
  DB.teacherAssignments[hrmsId]={subjects,classes,isTeaching};
  logAudit('Assignment Change','TeacherAssignment',hrmsId,
    `isTeaching=${isTeaching}; subjects=${subjects.join(',')}; classes=${classes.join(',')}`);
  saveDB();
  const s=STAFF.find(x=>x.hrmsId===hrmsId);
  if(s) pushNotification(s.name,'📚 ನಿಮ್ಮ ವಿಷಯ/ತರಗತಿ ನಿಯೋಜನೆ ಬದಲಾಗಿದೆ — "ಲೆಸನ್ ಪ್ಲಾನ್" ನಲ್ಲಿ ನೋಡಿ');
  showToast('✅ Save ಆಗಿದೆ: '+(s?.name||hrmsId));
}

function renderAuditLog(){
  const logs=(DB.auditLogs||[]).filter(l=>['LessonPlan','YearPlan','TeacherAssignment'].includes(l.entityType));
  const fAction=document.getElementById('alf_action')?.value||'';
  const fEntity=document.getElementById('alf_entity')?.value||'';
  const fStaff=document.getElementById('alf_staff')?.value||'';

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🔍 Audit Log — Lesson/Year Plan</h2>
    <div class="desc">Create, Edit, Upload, Submit, Approve, Reject, Return, Download, E-Sign, Delete, Assignment Changes — ಎಲ್ಲಾ ದಾಖಲೆ (Read-only)</div></div>
    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="alf_entity" onchange="renderAuditLog()">
          <option value="">ಎಲ್ಲಾ Entity</option>
          <option value="LessonPlan" ${fEntity==='LessonPlan'?'selected':''}>Lesson Plan</option>
          <option value="YearPlan" ${fEntity==='YearPlan'?'selected':''}>Year Plan</option>
          <option value="TeacherAssignment" ${fEntity==='TeacherAssignment'?'selected':''}>Teacher Assignment</option>
        </select>
        <select id="alf_action" onchange="renderAuditLog()">
          <option value="">ಎಲ್ಲಾ Action</option>
          ${[...new Set(logs.map(l=>l.action))].map(a=>`<option ${fAction===a?'selected':''}>${a}</option>`).join('')}
        </select>
        <select id="alf_staff" onchange="renderAuditLog()">
          <option value="">ಎಲ್ಲಾ Staff</option>
          ${[...new Set(logs.map(l=>l.byName))].map(n=>`<option ${fStaff===n?'selected':''}>${esc(n)}</option>`).join('')}
        </select>
      </div>
      <div class="table-wrap"><table style="font-size:11.5px;"><thead><tr>
        <th>ದಿನಾಂಕ/ಸಮಯ</th><th>Action</th><th>Entity</th><th>By</th><th>Details</th>
      </tr></thead><tbody>
        ${(()=>{
          let list=logs.slice();
          if(fEntity) list=list.filter(l=>l.entityType===fEntity);
          if(fAction) list=list.filter(l=>l.action===fAction);
          if(fStaff) list=list.filter(l=>l.byName===fStaff);
          if(!list.length) return `<tr class="empty-row"><td colspan="5">ಯಾವ Log ಇಲ್ಲ.</td></tr>`;
          return list.slice().reverse().slice(0,300).map(l=>`<tr>
            <td>${fmtDate(l.at)} ${esc(l.time||'')}</td>
            <td><span class="badge badge-info" style="font-size:10px;">${esc(l.action)}</span></td>
            <td>${esc(l.entityType)}</td>
            <td>${esc(l.byName)}</td>
            <td style="font-size:10.5px;color:var(--muted);">${esc(l.details||'')}</td>
          </tr>`).join('');
        })()}
      </tbody></table></div>
      <div class="note" style="font-size:10.5px;margin-top:8px;">ℹ ಈ Log Read-only — ಯಾರೂ (Principal ಸೇರಿ) UI ಮೂಲಕ ಇಲ್ಲಿ Edit/Delete ಮಾಡಲಾಗುವುದಿಲ್ಲ.</div>
    </div>`;
}

var MA_TAB='manual', MA_MENTOR='';
function maSetTab(t){ MA_TAB=t; renderMentorAllocation(); }

function maMentorOptions(sel){
  return STAFF.filter(s=>['staff','warden','fda','principal'].includes(s.role)).map(s=>`<option value="${s.hrmsId}" ${sel===s.hrmsId?'selected':''}>${esc(s.name)} — ${esc(s.desig||'')}</option>`).join('');
}

function maFormsHtml(){
  const isP=CURRENT_USER.role==='principal';
  const note=isP?'ಪ್ರಾಂಶುಪಾಲರು ರಚಿಸಿದ ಆದೇಶ ನೇರವಾಗಿ ಆಯಾ ಶಿಕ್ಷಕರಿಗೆ ಹೋಗುತ್ತದೆ.':'ರಚಿಸಿದ ಆದೇಶ "ಕರಡು" ಆಗಿ ಉಳಿಯುತ್ತದೆ. ಕೆಳಗಿನ ಪಟ್ಟಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ.';
  const manual=`
    <div class="form-grid">
      <div class="field"><label>ಮೆಂಟರ್ ಶಿಕ್ಷಕರು <span class="req-star">*</span></label><select id="ma_mentor"><option value="">— ಆರಿಸಿ —</option>${maMentorOptions(MA_MENTOR)}</select></div>
      <div class="field"><label>ವಿದ್ಯಾರ್ಥಿ (ತರಗತಿ 6–10) <span class="req-star">*</span></label>
        <select id="ma_student"><option value="">— ಆರಿಸಿ —</option>${(DB.students||[]).filter(s=>['6','7','8','9','10'].includes(String(s.className))).map(s=>`<option value="${s.id}">${esc(s.studentName)} — ${esc(s.className)}ನೇ — SATS:${esc(s.satsNo||'—')}</option>`).join('')}</select></div>
    </div>
    <div class="form-actions"><button class="gv-b" onclick="addToMentorCart()">ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ</button></div>
    ${MENTOR_CART.length?`
    <table class="gov-table" style="margin-top:10px;"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ತರಗತಿ</th><th>SATS</th><th></th></tr></thead><tbody>
      ${MENTOR_CART.map((c,i)=>`<tr><td class="c">${i+1}</td><td>${esc(c.studentName)}</td><td class="c">${esc(c.className)}ನೇ</td><td class="c">${esc(c.satsId||'—')}</td><td class="c"><button class="gv-b" onclick="removeFromMentorCart(${i})">ತೆಗೆಯಿರಿ</button></td></tr>`).join('')}
    </tbody></table>
    <div class="form-actions"><button class="gv-b pri" onclick="createMentorOrder()">ಆದೇಶ ರಚಿಸಿ (${MENTOR_CART.length} ವಿದ್ಯಾರ್ಥಿ)</button><button class="gv-b" onclick="MENTOR_CART=[];renderMentorAllocation();">ಪಟ್ಟಿ ಖಾಲಿ ಮಾಡಿ</button></div>`:''}`;
  const excel=`
    <div class="note" style="font-size:12px;">ಕಾಲಂಗಳು: <b>Sl No | SATS No | Student Name | DOB</b>. ತರಗತಿ, ಲಿಂಗ ಮುಂತಾದವು ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿಯಿಂದ ತಾನಾಗಿ ಬರುತ್ತವೆ. ಒಬ್ಬ ಶಿಕ್ಷಕರಿಗೆ ಒಂದು ಫೈಲ್ — ಮೆಂಟರ್ ಅನ್ನು ಕೆಳಗಿನ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ.</div>
    <div class="form-grid" style="margin-top:8px;">
      <div class="field"><label>ಈ ಫೈಲ್‌ನ ಮೆಂಟರ್ ಶಿಕ್ಷಕರು <span class="req-star">*</span></label>
        <select id="ma_excel_mentor"><option value="">— ಆರಿಸಿ —</option>${maMentorOptions()}</select></div>
      <div class="field"><label>Excel ಫೈಲ್</label><input type="file" id="ma_excel" accept=".xlsx,.xls" onchange="autoPickMentorFromFilename(this)"></div>
    </div>
    <div class="form-actions"><button class="gv-b lnk" onclick="downloadMentorTemplate()">Template ಡೌನ್‌ಲೋಡ್</button><button class="gv-b pri" onclick="previewMentorExcel()">ಪರಿಶೀಲಿಸಿ (Preview)</button></div>
    <div id="ma_excel_preview"></div>`;
  return `<div class="gv-tabs" style="margin-bottom:10px;">
      <button class="gv-tab ${MA_TAB==='manual'?'on':''}" onclick="maSetTab('manual')">ಕೈಯಾರೆ ಆಯ್ಕೆ</button>
      <button class="gv-tab ${MA_TAB==='excel'?'on':''}" onclick="maSetTab('excel')">Excel ಅಪ್‌ಲೋಡ್</button></div>
    <div class="note" style="font-size:12px;margin-bottom:8px;">${note}</div>
    ${MA_TAB==='excel'?excel:manual}`;
}

function maOrdersTable(list,emptyMsg){
  const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  return `<table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಆದೇಶ ಸಂಖ್ಯೆ</th><th>ಮೆಂಟರ್ ಶಿಕ್ಷಕರು</th><th>ವಿದ್ಯಾರ್ಥಿಗಳು</th><th>ತಯಾರಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ಕ್ರಮ</th></tr></thead><tbody>
    ${list.length?list.map((o,i)=>`<tr>
      <td class="c">${i+1}</td><td>${esc(o.orderNo)}</td><td>${esc(o.mentorName)}</td><td class="c">${o.totalStudents}</td>
      <td>${esc(o.createdBy||'')}</td><td class="c">${fmtDate(o.sentToPrincipalAt||o.orderDate)}</td><td class="c">${mentorStatusBadge(o.status)}${o.returnNote&&o.status==='Draft'?`<div style="font-size:11px;color:var(--red);">ಹಿಂತಿರುಗಿಸಿದ ಕಾರಣ: ${esc(o.returnNote)}</div>`:''}</td>
      <td class="c" style="white-space:nowrap;">
        <button class="gv-b" onclick="viewMentorOrder('${o.id}')">ವೀಕ್ಷಿಸಿ</button>
        <button class="gv-b" onclick="mentorOrderPrint('${o.id}')">Print / PDF</button>
        ${!['Draft','Sent to Principal'].includes(o.status)?dscBtns('mentororder',o.id,o.orderNo):''}
        ${fda&&o.status==='Accepted'?`<button class="gv-b ok" onclick="ackMentorOrderFDA('${o.id}')">Acknowledge</button>`:''}
        ${fda&&o.status==='Draft'?`<button class="gv-b pri" onclick="sendMentorOrderToPrincipal('${o.id}')">ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button>`:''}
        ${pr&&o.status==='Sent to Principal'?`<button class="gv-b ok" onclick="approveMentorOrder('${o.id}')">ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="returnMentorOrder('${o.id}')">ಹಿಂತಿರುಗಿಸಿ</button>`:''}
        ${(fda&&o.status==='Draft')||(['Pending Acceptance'].includes(o.status))?`<button class="gv-b" onclick="cancelMentorOrder('${o.id}')">ರದ್ದುಗೊಳಿಸಿ</button>`:''}
      </td></tr>`).join(''):`<tr><td colspan="8" class="c" style="color:var(--muted);">${emptyMsg}</td></tr>`}
  </tbody></table>`;
}

function renderMentorAllocation(){
  const isP=CURRENT_USER.role==='principal';
  const all=DB.mentorOrders||[];
  const orders=isP?all.filter(o=>o.status!=='Draft'):all;      // drafts are the FDA's private working copies
  const allocs=DB.mentorAllocations||[];
  const activeAllocs=allocs.filter(a=>a.active);
  const allocatedIds=new Set(activeAllocs.map(a=>a.studentId));
  const eligible=(DB.students||[]).filter(s=>['6','7','8','9','10'].includes(String(s.className)));
  const unallocated=eligible.filter(s=>!allocatedIds.has(s.id));
  const drafts=all.filter(o=>o.status==='Draft'), sent=all.filter(o=>o.status==='Sent to Principal');
  const waiting=all.filter(o=>o.status==='Pending Acceptance').length;
  const done=all.filter(o=>['Accepted','Acknowledged'].includes(o.status)).length;
  const byMentor={};
  activeAllocs.forEach(a=>{ byMentor[a.mentorName]=(byMentor[a.mentorName]||0)+1; });
  const stat=(n,l)=>`<div class="stat-card"><div class="n">${n}</div><div class="l">${l}</div></div>`;

  const wipe=`<details style="margin-top:14px;"><summary style="cursor:pointer;font-size:12px;color:var(--muted);">ಎಲ್ಲಾ ಮೆಂಟರ್ ಡೇಟಾ ಅಳಿಸಿ (ಎಚ್ಚರಿಕೆ)</summary>
    <div class="panel" style="border:1px solid #b71c1c;margin-top:8px;">
      <div class="note" style="font-size:12px;">ಹಂಚಿಕೆಗಳು (${allocs.length}), ಆದೇಶಗಳು (${all.length}), ಮೆಂಟರ್ ಪ್ರೊಫೈಲ್‌ಗಳು (${(DB.mentorProfiles||[]).length}) ಎಲ್ಲಾ ಲಾಗಿನ್‌ಗಳಿಂದ ಅಳಿಯುತ್ತವೆ. ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಉಳಿಯುತ್ತಾರೆ.</div>
      <button class="gv-b" style="color:#b71c1c;border-color:#b71c1c;" onclick="mentorWipeAll()">ಎಲ್ಲಾ ಮೆಂಟರ್ ಡೇಟಾ ಅಳಿಸಿ</button></div></details>`;

  const summary=`<div class="panel"><h3>ಮೆಂಟರ್‌ವಾರು ವಿದ್ಯಾರ್ಥಿಗಳ ಸಂಖ್ಯೆ</h3>
    <table class="gov-table"><thead><tr><th>ಮೆಂಟರ್ ಶಿಕ್ಷಕರು</th><th>ವಿದ್ಯಾರ್ಥಿಗಳು</th></tr></thead><tbody>
    ${Object.keys(byMentor).length?Object.entries(byMentor).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="c">${v}</td></tr>`).join(''):'<tr><td colspan="2" class="c" style="color:var(--muted);">ಅನುಮೋದಿತ ಹಂಚಿಕೆ ಇಲ್ಲ</td></tr>'}</tbody></table></div>`;

  let body='';
  if(isP){
    body=`
    <div class="cards-grid">${stat(sent.length,'ಅನುಮೋದನೆಗೆ ಬಾಕಿ')}${stat(waiting,'ಶಿಕ್ಷಕರ Accept ಬಾಕಿ')}${stat(done,'Accept ಆಗಿದೆ')}${stat(activeAllocs.length,'ಹಂಚಿಕೆಯಾದ ವಿದ್ಯಾರ್ಥಿಗಳು')}${stat(unallocated.length,'ಹಂಚಿಕೆಯಾಗದವರು')}</div>
    <div class="panel"><h3>FDA ಯಿಂದ ಬಂದ ಆದೇಶಗಳು — ಅನುಮೋದನೆಗೆ ಬಾಕಿ (${sent.length})</h3>
      ${sent.length?`<div class="form-actions" style="margin:0 0 8px;"><button class="gv-b ok" onclick="approveAllMentorOrders()">ಎಲ್ಲವನ್ನೂ ಅನುಮೋದಿಸಿ</button></div>`:''}
      ${maOrdersTable(sent,'ಅನುಮೋದನೆಗೆ ಯಾವುದೇ ಆದೇಶ ಬಾಕಿ ಇಲ್ಲ.')}
    </div>
    <div id="mentorDetailPanel"></div>
    <div class="panel"><h3>ಅನುಮೋದಿತ ಆದೇಶಗಳು</h3>${maOrdersTable(orders.filter(o=>o.status!=='Sent to Principal'),'ಇನ್ನೂ ಯಾವುದೇ ಆದೇಶ ಇಲ್ಲ.')}</div>
    ${summary}
    <details><summary style="cursor:pointer;font-size:13px;font-weight:700;margin:6px 0;">ಪ್ರಾಂಶುಪಾಲರಾಗಿ ನೇರವಾಗಿ ಆದೇಶ ರಚಿಸಿ</summary><div class="panel">${maFormsHtml()}</div></details>
    ${wipe}`;
  } else {
    body=`
    <div class="cards-grid">${stat(drafts.length,'ಕರಡು (ಕಳುಹಿಸಬೇಕು)')}${stat(sent.length,'ಪ್ರಾಂಶುಪಾಲರ ಬಳಿ ಬಾಕಿ')}${stat(waiting,'ಶಿಕ್ಷಕರ Accept ಬಾಕಿ')}${stat(activeAllocs.length,'ಹಂಚಿಕೆಯಾದ ವಿದ್ಯಾರ್ಥಿಗಳು')}${stat(unallocated.length,'ಹಂಚಿಕೆಯಾಗದವರು')}</div>
    <div class="panel"><h3>ಹಂತ 1 — ಆದೇಶ ತಯಾರಿಸಿ</h3>${maFormsHtml()}</div>
    <div class="panel"><h3>ಹಂತ 2 — ತಯಾರಿಸಿದ ಆದೇಶಗಳು ಮತ್ತು ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸುವುದು</h3>
      ${drafts.length?`<div class="form-actions" style="margin:0 0 8px;"><button class="gv-b pri" onclick="sendAllMentorDrafts()">ಎಲ್ಲಾ ಕರಡುಗಳನ್ನು ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ (${drafts.length})</button></div>`:''}
      ${all.filter(o=>o.status==='Accepted').length?`<div class="form-actions" style="margin:0 0 8px;"><button class="gv-b ok" onclick="ackAllMentorOrders()">ಶಿಕ್ಷಕರು Accept ಮಾಡಿದ ಎಲ್ಲವನ್ನೂ Acknowledge ಮಾಡಿ (${all.filter(o=>o.status==='Accepted').length})</button></div>`:''}
      ${maOrdersTable(all.slice().reverse(),'ಇನ್ನೂ ಯಾವುದೇ ಆದೇಶ ತಯಾರಿಸಿಲ್ಲ.')}
    </div>
    <div id="mentorDetailPanel"></div>
    ${summary}
    ${wipe}`;
  }
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಮೆಂಟರ್ ಶಿಕ್ಷಕ ಹಂಚಿಕೆ ಆದೇಶಗಳು</h2>
    <div class="desc">${isP?'FDA ಯಿಂದ ಬಂದ ಆದೇಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅನುಮೋದಿಸಿ — ಅನುಮೋದನೆಯ ನಂತರ ಆಯಾ ಶಿಕ್ಷಕರ ಲಾಗಿನ್‌ಗೆ ಹೋಗುತ್ತದೆ':'ಆದೇಶ ತಯಾರಿಸಿ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ — ಅನುಮೋದನೆಯ ನಂತರ ಆಯಾ ಶಿಕ್ಷಕರಿಗೆ ತಲುಪುತ್ತದೆ'}</div></div>
    ${body}`;
}

function addToMentorCart(){
  const studentId=document.getElementById('ma_student')?.value;
  MA_MENTOR=document.getElementById('ma_mentor')?.value||MA_MENTOR;
  const s=(DB.students||[]).find(x=>x.id===studentId); if(!s){ showToast('⚠ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಆರಿಸಿ'); return; }
  if(MENTOR_CART.find(c=>c.studentId===studentId)){ showToast('⚠ ಈಗಾಗಲೇ Cart ನಲ್ಲಿ ಇದೆ'); return; }
  MENTOR_CART.push({studentId, studentName:s.studentName, satsId:s.satsNo||'', className:s.className, gender:s.gender||''});
  renderMentorAllocation();
}

function removeFromMentorCart(i){ MENTOR_CART.splice(i,1); renderMentorAllocation(); }

function createMentorOrder(){
  const mentorHrmsId=document.getElementById('ma_mentor')?.value;
  const mentor=STAFF.find(x=>x.hrmsId===mentorHrmsId);
  if(!mentor){ showToast('⚠ ಮೆಂಟರ್ ಶಿಕ್ಷಕರನ್ನು ಆರಿಸಿ'); return; }
  if(!MENTOR_CART.length){ showToast('⚠ ಮೊದಲು ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ'); return; }
  buildMentorOrder(mentor, MENTOR_CART.slice());
  MENTOR_CART=[]; MA_MENTOR='';
  showToast(CURRENT_USER.role==='principal'?('✅ Order ರಚಿಸಲಾಗಿದೆ & '+mentor.name+' ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'):'✅ Order ತಯಾರಾಗಿದೆ — ಪರಿಶೀಲಿಸಿ "ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ" ಒತ್ತಿ');
  renderMentorAllocation();
}

function buildMentorOrder(mentor, studentList){
  const orderId=uid();
  const orderNo='MENTOR/'+defaultAcademicYear()+'/'+nextSeq('mentororder');
  const byPrincipal=CURRENT_USER.role==='principal';   // principal-made orders go straight to the mentor; FDA-made ones are drafts
  if(byPrincipal) studentList.forEach(st=>{
    (DB.mentorAllocations||[]).forEach(a=>{ if(a.studentId===st.studentId && a.active) a.active=false; });
  });
  const allocIds=[];
  studentList.forEach(st=>{
    const alloc={
      id:uid(), orderId, studentId:st.studentId, satsId:st.satsId, studentName:st.studentName,
      className:st.className, gender:st.gender, mentorHrmsId:mentor.hrmsId, mentorName:mentor.name,
      academicYear:defaultAcademicYear(), active:byPrincipal, createdAt:todayStr()
    };
    DB.mentorAllocations.push(alloc); allocIds.push(alloc.id);
  });
  const order={
    id:orderId, orderNo, orderDate:todayStr(), academicYear:defaultAcademicYear(),
    mentorHrmsId:mentor.hrmsId, mentorName:mentor.name,
    studentAllocIds:allocIds, totalStudents:studentList.length,
    principalSigned:CURRENT_USER.role==='principal', principalName:CURRENT_USER.role==='principal'?CURRENT_USER.name:null, principalSignedAt:CURRENT_USER.role==='principal'?todayStr():null,
    preparedByRole:CURRENT_USER.role,
    status:byPrincipal?'Pending Acceptance':'Draft',
    acceptedAt:null, acceptedDate:null, acceptedServerTime:false,
    ackByFDA:null, ackAt:null,
    createdBy:CURRENT_USER.name, createdAt:todayStr()
  };
  DB.mentorOrders.push(order);
  logAudit('Create','MentorOrder',orderId,mentor.name+' — '+studentList.length+' students');

  if(!byPrincipal){ saveDB(); return; }   // draft: nothing goes to the mentor until the principal approves
  // Notify mentor + notice board
  pushNotification(mentor.name, `🧑‍🏫 ಮೆಂಟರ್ ಆದೇಶ: ${orderNo} — ${studentList.length} ವಿದ್ಯಾರ್ಥಿಗಳು ನಿಯೋಜಿತ | "ನನ್ನ ಮೆಂಟರ್ ವಿದ್ಯಾರ್ಥಿಗಳು" ನಲ್ಲಿ Accept ಮಾಡಿ`);
  if(!DB.noticeBoard) DB.noticeBoard=[];
  DB.noticeBoard.push({
    id:uid(), to:mentor.hrmsId, toName:mentor.name,
    fromName:CURRENT_USER.name, fromHrmsId:CURRENT_USER.hrmsId,
    text:`🧑‍🏫 ಮೆಂಟರ್ ಆದೇಶ: ${orderNo}\n${studentList.length} ವಿದ್ಯಾರ್ಥಿಗಳ ಮೆಂಟರ್ ಆಗಿ ನಿಯೋಜಿಸಲಾಗಿದೆ. Accept & E-Sign ಮಾಡಿ.`,
    fileData:null, fileName:null, createdAt:todayStr(), dismissedBy:[]
  });
  saveDB();
}

function cancelMentorOrder(orderId){
  if(!confirm('ಈ Order Cancel ಮಾಡುವುದೇ? ವಿದ್ಯಾರ್ಥಿಗಳ Mentor Allocation ತೆಗೆಯಲಾಗುತ್ತದೆ.')) return;
  const order=DB.mentorOrders.find(x=>x.id===orderId); if(!order) return;
  const wasDraft=['Draft','Sent to Principal'].includes(order.status);
  (order.studentAllocIds||[]).forEach(aid=>{
    const a=DB.mentorAllocations.find(x=>x.id===aid); if(a) a.active=false;
  });
  if(wasDraft) DB.mentorAllocations=DB.mentorAllocations.filter(a=>!(order.studentAllocIds||[]).includes(a.id));
  DB.mentorOrders=DB.mentorOrders.filter(x=>x.id!==orderId);
  logAudit('Delete','MentorOrder',orderId,'Cancelled by '+(CURRENT_USER.role==='fda'?'FDA':'Principal'));
  saveDB(); renderMentorAllocation();
}

function downloadMentorTemplate(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const pickedHrms=document.getElementById('ma_excel_mentor')?.value||'';
  const pickedMentor=pickedHrms?STAFF.find(s=>s.hrmsId===pickedHrms):null;
  const wb=XLSX.utils.book_new();
  const header=['Sl No','SATS No','Student Name','DOB'];
  const sample1=[1,'123456789','ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು 1',new Date(2015,0,1)];
  const sample2=[2,'','ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು 2','2012-11-03'];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([header,sample1,sample2]),'Mentor Allocation');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಸಿಬ್ಬಂದಿ ಹೆಸರುಗಳು (Mentor Teacher ಕಾಲಂನಲ್ಲಿ ಇವುಗಳಲ್ಲಿ ಒಂದನ್ನು ಬಳಸಿ)'],...STAFF.filter(s=>['staff','warden','fda','principal'].includes(s.role)).map(s=>[s.name])]),'Staff List');
  XLSX.writeFile(wb,'Mentor_Allocation_Template'+(pickedMentor?('_'+pickedMentor.name.replace(/\s+/g,'_')):'')+'.xlsx');
}

function autoPickMentorFromFilename(input){
  const f=input.files&&input.files[0]; if(!f) return;
  const base=f.name.replace(/\.(xlsx|xls|csv)$/i,'').replace(/[_\-]+/g,' ').trim().toLowerCase();
  const sel=document.getElementById('ma_excel_mentor'); if(!sel||sel.value) return;
  const hit=STAFF.filter(s=>['staff','warden','fda','principal'].includes(s.role)).find(s=>{
    const n=s.name.toLowerCase();
    return base===n || base.indexOf(n)>=0 || n.indexOf(base)>=0;
  });
  if(hit) sel.value=hit.hrmsId;
}

function findMentorHeaderRow(rows){
  const limit=Math.min(rows.length,8);
  for(let ri=0; ri<limit; ri++){
    const cells=(rows[ri]||[]).map(c=>String(c||'').trim().toLowerCase());
    const hasSats=cells.some(c=>c.indexOf('sats')>=0);
    const hasName=cells.some(c=>c.indexOf('name')>=0||c.indexOf('ಹೆಸರು')>=0);
    if(hasSats||hasName){
      const cols={};
      cells.forEach((c,ci)=>{
        for(const key in MENTOR_HDR_KEYS){
          if(cols[key]===undefined && MENTOR_HDR_KEYS[key].some(kw=>c.indexOf(kw)>=0)) cols[key]=ci;
        }
      });
      return {headerRow:ri, cols};
    }
  }
  return null; // no recognizable header — file is probably just raw name/class rows with no header at all
}

function findMentorNameInSheet(rows,limit){
  // Only trust a line that explicitly has a ":" or "-" after "Mentor Teacher"/"ಮೆಂಟರ್", AND whose
  // captured text actually matches a real staff member — never guess from an unrelated title line.
  for(let ri=0; ri<Math.min(rows.length,limit||6); ri++){
    const line=(rows[ri]||[]).map(c=>String(c||'').trim()).join(' ').trim();
    const m=line.match(/mentor\s*teacher\s*[:\-]\s*(?:tr\.?\s*)?(.+)$/i) || line.match(/ಮೆಂಟರ್\s*[:\-]\s*(.+)$/i);
    if(!m || !m[1].trim()) continue;
    const cand=m[1].trim().toLowerCase();
    const hit=STAFF.find(s=>['staff','warden','fda','principal'].includes(s.role)&&(s.name.toLowerCase()===cand || s.name.toLowerCase().indexOf(cand)>=0 || cand.indexOf(s.name.toLowerCase())>=0));
    if(hit) return hit.name;
  }
  return null;
}

function previewMentorExcel(){
  const fileEl=document.getElementById('ma_excel');
  const file=fileEl?.files[0];
  if(!file){ showToast('⚠ Excel file ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const pickedHrms=document.getElementById('ma_excel_mentor')?.value||'';
  const pickedMentor=pickedHrms?STAFF.find(s=>s.hrmsId===pickedHrms):null;
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const allRows=XLSX.utils.sheet_to_json(ws,{header:1}).filter(r=>r.length&&r.some(c=>String(c||'').trim()!==''));
    const hdr=findMentorHeaderRow(allRows);
    const cols = hdr? hdr.cols : {sats:0, name:1, className:2, gender:3, mentor:4}; // no header row found: assume plain SATS|Name|Class|Gender[|Mentor] columns
    const dataRows = hdr? allRows.slice(hdr.headerRow+1) : allRows;
    // Fallback mentor for the whole file, used whenever a row's own Mentor cell (if any) is blank:
    // prefer the dropdown the person picked, else try to read it off a "Mentor Teacher: ..." line in the sheet.
    const fileWideMentorName = pickedMentor ? pickedMentor.name : findMentorNameInSheet(allRows,hdr?hdr.headerRow:6);
    const seenSats=new Set(), seenNames=new Set();
    const results=[]; let titleSkipped=0;
    dataRows.forEach((r,i)=>{
      const cell=(idx)=>idx==null?'':String(r[idx]||'').trim();
      const satsId=cell(cols.sats), name=cell(cols.name), className=cell(cols.className), gender=cell(cols.gender);
      const dobIso=(typeof xlDate==='function'&&cols.dob!==undefined)?xlDate(r[cols.dob]):'';
      const nsats=v=>String(v||'').replace(/\D/g,'');
      const rowMentorName='mentor' in cols ? cell(cols.mentor) : '';
      // Skip rows that carry no identifying data at all (title lines, "Mentor Teacher: ..." lines, blank spacer rows)
      if(!satsId && !name){ titleSkipped++; return; }
      const mentorName = rowMentorName || fileWideMentorName || '';
      let status='ok', msg='';
      if(!mentorName){ status='error'; msg='ಮೇಲಿನ "ಈ ಫೈಲ್‌ನ ಮೆಂಟರ್" ಪಟ್ಟಿಯಿಂದ ಶಿಕ್ಷಕರನ್ನು ಆರಿಸಿ, ನಂತರ ಮತ್ತೆ Preview ಒತ್ತಿ'; }
      let studentMatch=null, dup=false, ambiguous=null;
      if(status==='ok' && satsId){
        if(seenSats.has(nsats(satsId))) dup=true;
        seenSats.add(nsats(satsId));
        if(!dup){
          studentMatch=(DB.students||[]).find(s=>nsats(s.satsNo)&&nsats(s.satsNo)===nsats(satsId));
          if(!studentMatch){ status='error'; msg='SATS No Student Register ನಲ್ಲಿ ಸಿಗಲಿಲ್ಲ'; }
          else if(dobIso&&studentMatch.dob&&String(studentMatch.dob).slice(0,10)!==dobIso){ status='error'; msg='SATS ಸಿಕ್ಕಿತು ಆದರೆ ಜನ್ಮ ದಿನಾಂಕ ಹೊಂದುತ್ತಿಲ್ಲ ('+studentMatch.studentName+' — '+String(studentMatch.dob).slice(0,10)+') — ಪರಿಶೀಲಿಸಿ'; }
        }
      } else if(status==='ok' && name){
        const key=name.toLowerCase()+'|'+className.toLowerCase()+'|'+dobIso;
        if(seenNames.has(key)) dup=true;
        seenNames.add(key);
        if(!dup){
          const nm=name.toLowerCase().trim().replace(/\s+/g,' ');
          let matches=(DB.students||[]).filter(s=>[s.studentName,s.studentNameEn].some(x=>String(x||'').toLowerCase().trim().replace(/\s+/g,' ')===nm) && (!className||String(s.className)===className));
          if(matches.length>1&&dobIso){ const m2=matches.filter(s=>String(s.dob||'').slice(0,10)===dobIso); if(m2.length) matches=m2; }
          else if(matches.length===1&&dobIso&&matches[0].dob&&String(matches[0].dob).slice(0,10)!==dobIso){ matches=[]; }
          if(matches.length===0){ status='error'; msg='ಈ ಹೆಸರಿನ ವಿದ್ಯಾರ್ಥಿ Student Register ನಲ್ಲಿ ಸಿಗಲಿಲ್ಲ'; }
          else if(matches.length>1){ status='error'; msg=matches.length+' ವಿದ್ಯಾರ್ಥಿಗಳಲ್ಲಿ ಯಾರು ಎಂದು ಆರಿಸಿ'; ambiguous=matches; }
          else studentMatch=matches[0];
        }
      } else if(status==='ok'){
        status='error'; msg='SATS ID ಅಥವಾ ಹೆಸರು ಇಲ್ಲ';
      }
      if(dup){ status='dup'; msg='ಈ ಫೈಲ್‌ನಲ್ಲಿ ಪುನರಾವರ್ತನೆ — ಬಿಟ್ಟಿದೆ'; }
      const mentorMatch=STAFF.find(s=>['staff','warden','fda','principal'].includes(s.role)&&s.name.toLowerCase().trim()===mentorName.toLowerCase().trim());
      if(status==='ok'&&!mentorMatch){ status='error'; msg='Mentor Teacher "'+mentorName+'" Staff List ನಲ್ಲಿ ಸಿಗಲಿಲ್ಲ'; }
      let reassign=false;
      if(status==='ok'&&studentMatch&&mentorMatch){
        const existing=(DB.mentorAllocations||[]).find(a=>a.studentId===studentMatch.id&&a.active);
        if(existing&&existing.mentorHrmsId!==mentorMatch.hrmsId) reassign=true;
      }
      results.push({rowNum:(hdr?hdr.headerRow:0)+i+2, satsId, name, className, gender, dobIso, mentorName, status, msg, studentMatch, mentorMatch, reassign, ambiguous, noHeader:!hdr});
    });
    window._mentorImportResults=results;
    window._mentorImportTitleSkipped=titleSkipped;
    renderMentorPreviewResults();
  };
  reader.readAsArrayBuffer(file);
}

function mentorFixRow(idx,hrmsId){
  const r=(window._mentorImportResults||[])[idx]; if(!r) return;
  const staff=STAFF.find(s=>s.hrmsId===hrmsId); if(!staff) return;
  r.mentorMatch=staff; r.mentorName=staff.name;
  if(r.studentMatch){
    r.status='ok'; r.msg='';
    const existing=(DB.mentorAllocations||[]).find(a=>a.studentId===r.studentMatch.id&&a.active);
    r.reassign = !!(existing&&existing.mentorHrmsId!==staff.hrmsId);
  }
  renderMentorPreviewResults();
}

function mentorFixStudentPick(idx,studentId){
  const r=(window._mentorImportResults||[])[idx]; if(!r) return;
  const st=(DB.students||[]).find(s=>s.id===studentId); if(!st) return;
  r.studentMatch=st; r.satsId=st.satsNo||r.satsId;
  if(r.mentorMatch){
    r.status='ok'; r.msg='';
    const existing=(DB.mentorAllocations||[]).find(a=>a.studentId===st.id&&a.active);
    r.reassign = !!(existing&&existing.mentorHrmsId!==r.mentorMatch.hrmsId);
  } else { r.status='error'; r.msg='ಮೇಲಿನ "ಈ ಫೈಲ್‌ನ ಮೆಂಟರ್" ಪಟ್ಟಿಯಿಂದ ಶಿಕ್ಷಕರನ್ನು ಆರಿಸಿ, ನಂತರ ಮತ್ತೆ Preview ಒತ್ತಿ'; }
  renderMentorPreviewResults();
}

function mentorFixSearch(idx){
  const r=(window._mentorImportResults||[])[idx]; if(!r) return;
  const q=(document.getElementById('mf_search_'+idx)?.value||'').trim().toLowerCase();
  if(!q){ showToast('⚠ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ'); return; }
  const matches=(DB.students||[]).filter(s=>s.studentName.toLowerCase().indexOf(q)>=0);
  r.ambiguous = matches.length? matches : null;
  if(matches.length===1){ mentorFixStudentPick(idx, matches[0].id); return; }
  if(!matches.length){ r.msg='"'+q+'" ಎಂಬ ಹೆಸರಿನ ವಿದ್ಯಾರ್ಥಿ ಸಿಗಲಿಲ್ಲ'; }
  renderMentorPreviewResults();
}

function skipMentorRow(idx){
  const r=(window._mentorImportResults||[])[idx]; if(!r) return;
  r.status='dup'; r.msg='ಕೈಯಾರೆ ಬಿಟ್ಟಿದೆ'; renderMentorPreviewResults();
}

function renderMentorPreviewResults(){
  const results=window._mentorImportResults||[]; const titleSkipped=window._mentorImportTitleSkipped||0;
  const okCount=results.filter(r=>r.status==='ok').length;
  const errCount=results.filter(r=>r.status==='error').length;
  const dupCount=results.filter(r=>r.status==='dup').length;
  const reassignCount=results.filter(r=>r.reassign).length;
  const noHeaderWarn=results.length&&results[0].noHeader;
  document.getElementById('ma_excel_preview').innerHTML=`
    ${noHeaderWarn?`<div class="note" style="background:var(--gold-tint);border-color:var(--gold);margin-top:10px;">⚠ ಫೈಲ್‌ನಲ್ಲಿ ಗುರುತಿಸಬಹುದಾದ column header ಸಿಗಲಿಲ್ಲ — SATS ID | Student Name | Class | Gender ಎಂಬ ಕ್ರಮದಲ್ಲಿ ಇದೆ ಎಂದು ಭಾವಿಸಲಾಗಿದೆ.</div>`:''}
    <div class="note" style="background:var(--green-tint);border-color:var(--green);margin-top:10px;">
      ✅ Valid: ${okCount} | ❌ ಸರಿಪಡಿಸಬೇಕಾದದ್ದು: ${errCount} | ⏭ ಪುನರಾವರ್ತನೆ/ಬಿಟ್ಟಿದೆ: ${dupCount} | 🔄 Reassignments: ${reassignCount}${titleSkipped?` | ಶೀರ್ಷಿಕೆ ಸಾಲುಗಳು ಸ್ವಯಂ ಬಿಟ್ಟಿದೆ: ${titleSkipped}`:''}
    </div>
    ${errCount?`<div class="note" style="background:#fde8e8;border-color:var(--red);margin-top:6px;font-size:11.5px;">ಕೆಳಗಿನ ❌ ಸಾಲುಗಳಲ್ಲಿ ಸರಿಯಾದ ಮೆಂಟರ್/ವಿದ್ಯಾರ್ಥಿ ಆರಿಸಿ ಸರಿಪಡಿಸಬಹುದು, ಅಥವಾ 🚫 ಬಿಟ್ಟುಬಿಡಿ ಒತ್ತಿ ಆ ಸಾಲನ್ನು ಕೈಬಿಡಿ. ಸರಿಪಡಿಸಿದ ಕೂಡಲೇ ಅದು ✅ ಆಗಿ Import ಆಗುತ್ತದೆ.</div>`:''}
    <div class="table-wrap" style="max-height:340px;overflow-y:auto;margin-top:8px;"><table style="font-size:11px;"><thead><tr>
      <th>Row</th><th>SATS</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>Mentor</th><th>ಸ್ಥಿತಿ / ಸರಿಪಡಿಕೆ</th>
    </tr></thead><tbody>
      ${results.map((r,idx)=>{
        const rowBg=r.status==='error'?'background:#fde8e8;':r.status==='dup'?'background:#f0f0f0;color:var(--muted);':r.reassign?'background:#fff3e0;':'';
        let action;
        if(r.status==='ok') action=r.reassign?'🔄 Reassign':'✅ OK';
        else if(r.status==='dup') action=`⏭ ${esc(r.msg)}`;
        else {
          const parts=[`❌ ${esc(r.msg)}`];
          if(!r.mentorMatch){
            parts.push(`<select style="font-size:10.5px;margin-top:3px;" onchange="mentorFixRow(${idx},this.value)"><option value="">— ಸರಿಯಾದ Mentor ಆರಿಸಿ —</option>${STAFF.filter(s=>['staff','warden','fda','principal'].includes(s.role)).map(s=>`<option value="${s.hrmsId}">${esc(s.name)}</option>`).join('')}</select>`);
          } else if(!r.studentMatch){
            if(r.ambiguous&&r.ambiguous.length){
              parts.push(`<select style="font-size:10.5px;margin-top:3px;" onchange="mentorFixStudentPick(${idx},this.value)"><option value="">— ಸರಿಯಾದ ವಿದ್ಯಾರ್ಥಿ ಆರಿಸಿ —</option>${r.ambiguous.map(s=>`<option value="${s.id}">${esc(s.studentName)} — ${esc(s.className)}ನೇ — SATS:${esc(s.satsNo||'—')}</option>`).join('')}</select>`);
            } else {
              parts.push(`<div style="display:flex;gap:4px;margin-top:3px;"><input id="mf_search_${idx}" placeholder="ಹೆಸರು ಟೈಪಿಸಿ" style="font-size:10.5px;padding:2px 5px;flex:1;"><button class="btn btn-outline btn-sm" style="padding:2px 6px;" onclick="mentorFixSearch(${idx})">🔍</button></div>`);
            }
          }
          if(r.status==='error') parts.push(`<button class="btn btn-outline btn-sm" style="padding:2px 6px;margin-top:3px;" onclick="skipMentorRow(${idx})">🚫 ಈ ಸಾಲು ಬಿಟ್ಟುಬಿಡಿ</button>`);
          action=parts.join('<br>');
        }
        return `<tr style="${rowBg}"><td>${r.rowNum}</td><td>${esc(r.satsId||(r.studentMatch?r.studentMatch.satsNo:'—'))}</td><td>${esc(r.studentMatch?r.studentMatch.studentName:(r.name||''))}${r.studentMatch&&r.studentMatch.dob?'<br><span class="small-muted">'+esc(String(r.studentMatch.dob).slice(0,10))+'</span>':''}</td><td>${esc(r.studentMatch?r.studentMatch.className:(r.className||''))}</td><td>${esc(r.mentorName)}</td><td>${action}</td></tr>`;
      }).join('')}
    </tbody></table></div>
    <div class="form-actions" style="margin-top:8px;">
      <button class="btn btn-primary" ${okCount?'':'disabled'} onclick="importMentorExcel()">✅ ${okCount} ಸರಿಯಾದ Rows Import ಮಾಡಿ & Orders ರಚಿಸಿ</button>
    </div>
  `;
}

function importMentorExcel(){
  const results=(window._mentorImportResults||[]).filter(r=>r.status==='ok');
  if(!results.length) return;
  const byMentor={};
  results.forEach(r=>{
    const key=r.mentorMatch.hrmsId;
    if(!byMentor[key]) byMentor[key]={mentor:r.mentorMatch, students:[]};
    byMentor[key].students.push({
      studentId:r.studentMatch.id, studentName:r.studentMatch.studentName,
      satsId:r.studentMatch.satsNo||r.satsId, className:r.studentMatch.className, gender:r.studentMatch.gender
    });
  });
  let orderCount=0;
  Object.values(byMentor).forEach(({mentor,students})=>{
    buildMentorOrder(mentor, students);
    orderCount++;
  });
  showToast(`✅ ${orderCount} Mentor Order(s) ರಚಿಸಲಾಗಿದೆ — ${results.length} ವಿದ್ಯಾರ್ಥಿಗಳು`+(CURRENT_USER.role==='principal'?'':' (ಕರಡು — ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ)'));
  document.getElementById('ma_excel_preview').innerHTML='';
  renderMentorAllocation();
}

;(window.__LOADED=window.__LOADED||[]).push('principal');


function sendMentorOrderToPrincipal(id,silent){
  const o=DB.mentorOrders.find(x=>x.id===id); if(!o||!['Draft'].includes(o.status)) return false;
  o.status='Sent to Principal'; o.sentToPrincipalAt=todayStr(); o.sentBy=CURRENT_USER.name;
  logAudit('Send','MentorOrder',id,'FDA → Principal');
  if(!silent){
    staffNamesForRole('principal').forEach(n=>pushNotification(n,`🧑‍🏫 ಮೆಂಟರ್ ಆದೇಶ ಅನುಮೋದನೆಗೆ: ${o.orderNo} — ${o.mentorName} (${o.totalStudents} ವಿದ್ಯಾರ್ಥಿಗಳು)`));
    saveDB(); showToast('✅ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderMentorAllocation();
  }
  return true;
}
function sendAllMentorDrafts(){
  if(CURRENT_USER.role!=='fda') return;
  let n=0; (DB.mentorOrders||[]).filter(o=>o.status==='Draft').forEach(o=>{ if(sendMentorOrderToPrincipal(o.id,true)) n++; });
  if(n) staffNamesForRole('principal').forEach(x=>pushNotification(x,`🧑‍🏫 ${n} ಮೆಂಟರ್ ಆದೇಶಗಳು ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇವೆ`));
  saveDB(); showToast('✅ '+n+' ಆದೇಶ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderMentorAllocation();
}
async function approveMentorOrder(id,silent){
  if(CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ'); return false; }
  const o=DB.mentorOrders.find(x=>x.id===id); if(!o||o.status!=='Sent to Principal') return false;
  const mine=new Set(o.studentAllocIds||[]);
  const sids=new Set((DB.mentorAllocations||[]).filter(a=>mine.has(a.id)).map(a=>a.studentId));
  (DB.mentorAllocations||[]).forEach(a=>{ if(sids.has(a.studentId)&&a.active&&!mine.has(a.id)) a.active=false; });
  (DB.mentorAllocations||[]).forEach(a=>{ if(mine.has(a.id)) a.active=true; });
  o.principalSigned=true; o.principalName=CURRENT_USER.name; o.principalSignedAt=todayStr();
  await mentorSignMeta(o,'pSig');
  o.status='Pending Acceptance'; o.orderDate=todayStr();
  logAudit('Approve','MentorOrder',id,'Principal approved');
  pushNotification(o.mentorName,`🧑‍🏫 ಮೆಂಟರ್ ಆದೇಶ: ${o.orderNo} — ${o.totalStudents} ವಿದ್ಯಾರ್ಥಿಗಳು ನಿಯೋಜಿತ | "ನನ್ನ ಮೆಂಟರ್ ವಿದ್ಯಾರ್ಥಿಗಳು" ಪುಟದಲ್ಲಿ Accept & E-Sign ಮಾಡಿ`);
  if(!DB.noticeBoard) DB.noticeBoard=[];
  const m=STAFF.find(x=>x.hrmsId===o.mentorHrmsId);
  DB.noticeBoard.push({id:uid(),to:o.mentorHrmsId,toName:o.mentorName,fromName:CURRENT_USER.name,fromHrmsId:CURRENT_USER.hrmsId,
    text:`🧑‍🏫 ಮೆಂಟರ್ ಆದೇಶ: ${o.orderNo}\n${o.totalStudents} ವಿದ್ಯಾರ್ಥಿಗಳ ಮೆಂಟರ್ ಆಗಿ ನಿಯೋಜಿಸಲಾಗಿದೆ. Accept & E-Sign ಮಾಡಿ.`,fileData:null,fileName:null,createdAt:todayStr(),dismissedBy:[]});
  if(o.createdBy&&o.createdBy!==CURRENT_USER.name) pushNotification(o.createdBy,`✅ ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ್ದಾರೆ: ${o.orderNo} — ${o.mentorName}`);
  if(!silent){ saveDB(); showToast('✅ ಅನುಮೋದಿಸಲಾಗಿದೆ — '+o.mentorName+' ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderMentorAllocation(); }
  return true;
}
async function approveAllMentorOrders(){
  if(CURRENT_USER.role!=='principal') return;
  if(!confirm('ಪರಿಶೀಲನೆಗೆ ಬಾಕಿ ಇರುವ ಎಲ್ಲಾ ಮೆಂಟರ್ ಆದೇಶಗಳನ್ನು ಅನುಮೋದಿಸುವುದೇ?')) return;
  let n=0; for(const o of (DB.mentorOrders||[]).filter(o=>o.status==='Sent to Principal')){ if(await approveMentorOrder(o.id,true)) n++; }
  saveDB(); showToast('✅ '+n+' ಆದೇಶ ಅನುಮೋದಿಸಲಾಗಿದೆ'); renderMentorAllocation();
}
function returnMentorOrder(id){
  if(CURRENT_USER.role!=='principal') return;
  const o=DB.mentorOrders.find(x=>x.id===id); if(!o||o.status!=='Sent to Principal') return;
  const why=prompt('ಹಿಂತಿರುಗಿಸಲು ಕಾರಣ (ಐಚ್ಛಿಕ):'); if(why===null) return;
  o.status='Draft'; o.returnNote=why||'';
  pushNotification(o.createdBy,`↩ ಮೆಂಟರ್ ಆದೇಶ ಹಿಂತಿರುಗಿದೆ: ${o.orderNo}${why?' — '+why:''}`);
  logAudit('Return','MentorOrder',id,why||'');
  saveDB(); showToast('↩ FDA ಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ'); renderMentorAllocation();
}

function mentorWipeAll(){
  if(!CURRENT_USER||!['fda','principal'].includes(CURRENT_USER.role)){ showToast('⚠ FDA / ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ'); return; }
  const word=prompt('⚠ ಎಲ್ಲಾ ಮೆಂಟರ್ ಹಂಚಿಕೆ, ಆದೇಶ ಮತ್ತು ಪ್ರೊಫೈಲ್‌ಗಳು ಎಲ್ಲಾ ಲಾಗಿನ್‌ಗಳಿಂದ ಅಳಿಯುತ್ತವೆ. ಹಿಂತಿರುಗಿಸಲಾಗುವುದಿಲ್ಲ.\nಮುಂದುವರಿಯಲು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ:');
  if(word===null) return;
  if(String(word).trim().toUpperCase()!=='DELETE'){ showToast('ರದ್ದು — DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿಲ್ಲ'); return; }
  try{
    const bk={mentorAllocations:DB.mentorAllocations,mentorOrders:DB.mentorOrders,mentorProfiles:DB.mentorProfiles};
    const u=URL.createObjectURL(new Blob([JSON.stringify(bk,null,1)],{type:'application/json'}));
    const l=document.createElement('a'); l.href=u; l.download='BACKUP_mentors_'+todayStr()+'.json'; document.body.appendChild(l); l.click(); l.remove();
  }catch(e){ if(!confirm('ಬ್ಯಾಕಪ್ ಆಗಲಿಲ್ಲ. ಆದರೂ ಅಳಿಸಬೇಕೇ?')) return; }
  const n=(DB.mentorAllocations||[]).length+(DB.mentorOrders||[]).length+(DB.mentorProfiles||[]).length;
  DB.mentorAllocations=[]; DB.mentorOrders=[]; DB.mentorProfiles=[];
  saveDB();
  showToast('🗑 '+n+' ಮೆಂಟರ್ ನಮೂದುಗಳು ಅಳಿಸಲಾಗಿದೆ');
  navigate('mentorallocation');
}
