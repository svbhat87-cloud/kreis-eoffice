/* =====================================================================
   KREIS e-Office v35 — other.js
   ಇತರೆ — Functions not reached from any menu page (kept so nothing is lost)
   ===================================================================== */
function inwardCfg(){
  const cfg={
    key:'inward', storeKey:'inward', title:'ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ (Inward Register)',
    subtitle:'FDA Entry → Principal E-Sign → (ಐಚ್ಛಿಕ) ಸಿಬ್ಬಂದಿಗೆ → Close. Save ಮಾಡಿದ ಕೂಡಲೇ ಸ್ವೀಕೃತಿ ವಹಿಯಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತ ದಾಖಲೆ ಆಗುತ್ತದೆ.',
    newLabel:'ಒಳಬರುವ ಪತ್ರ ದಾಖಲಿಸಿ',
    createRoles:['fda'],
    fields:[
      {key:'receivedDate', label:'ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ', type:'date', default:todayStr, required:true},
      {key:'sentFromOffice', label:'ಕಳುಹಿಸಿದ ಕಚೇರಿ', type:'select', options:OFFICES, required:true},
      {key:'letterNo', label:'ಪತ್ರ ಸಂಖ್ಯೆ (ಕಳುಹಿಸಿದವರ)', type:'text'},
      {key:'letterDate', label:'ಪತ್ರ ದಿನಾಂಕ', type:'date'},
      {key:'subject', label:'ವಿಷಯ', type:'text', required:true},
      {key:'attachments', label:'ಲಗತ್ತುಗಳು', type:'text'},
    ],
    columns:[
      {key:'inwardNo', label:'ಒಳಬರುವ ಸಂಖ್ಯೆ'}, {key:'receivedDate', label:'ದಿನಾಂಕ', render:i=>fmtDate(i.receivedDate)},
      {key:'sentFromOffice', label:'ಕಚೇರಿ'}, {key:'letterNo', label:'ಪತ್ರ ಸಂಖ್ಯೆ'}, {key:'subject', label:'ವಿಷಯ'},
      {key:'assignedStaff', label:'ನಿಯೋಜಿತ ಸಿಬ್ಬಂದಿ'},
    ],
    workflowSteps:['Draft','Sent to Principal','Principal Signed','Sent to Staff','Staff Signed','Action Taken','Closed'],
    steps:[
      {from:'Draft',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Sent to Principal',to:'Principal Signed',role:'principal',btn:'E-Sign & Approve'},
      {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
      {from:'Principal Signed',to:'Sent to Staff',role:'fda',btn:'ಸಿಬ್ಬಂದಿಗೆ ಕಳುಹಿಸಿ', needsField:{key:'assignedStaff',label:'ಸಿಬ್ಬಂದಿ ಹೆಸರು'}},
      {from:'Principal Signed',to:'Closed',role:'fda',btn:'ನೇರವಾಗಿ Close ಮಾಡಿ'},
      {from:'Sent to Staff',to:'Staff Signed',role:'staff',btn:'E-Sign / Acknowledge'},
      {from:'Staff Signed',to:'Action Taken',role:'staff',btn:'Action Taken', needsField:{key:'staffRemarks',label:'Remarks'}},
      {from:'Action Taken',to:'Closed',role:'fda',btn:'Close Entry'},
    ],
    onCreate:(item)=>{ item.inwardNo='IN-'+nextSeq('inward'); item.ackNo='ACK-'+nextSeq('ack'); },
    filterVisible:(item)=> CURRENT_USER.role!=='staff' || item.assignedStaff===CURRENT_USER.name,
    canDelete:(item)=> item.status==='Draft' && (CURRENT_USER.role==='fda'),
  };
  MODULE_CFGS.inward=cfg;
  return cfg;
}

function rejectCard(cardId){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c) return;
  const reason=prompt('Reject ಕಾರಣ:')||'—';
  c.status='Sent to Class Teacher'; c.principalSigned=false; c.classTeacherSigned=false;
  c.remarks=(c.remarks?c.remarks+' | ':'')+'Principal Rejected: '+reason;
  saveDB();
  const clsTeacher=DB.classTeacherAllocation[c.className];
  if(clsTeacher) pushNotification(clsTeacher,'❌ ಪ್ರಗತಿ ಪತ್ರಿಕೆ Reject: '+c.studentName+' — '+reason);
  showToast('↩ Reject ಮಾಡಿ Class Teacher ಗೆ ಹಿಂದಿರುಗಿಸಲಾಗಿದೆ');
  navigate('pcsign');
}

function rejectSCTC(docId){
  const d = DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  const reason = (prompt('Reject ಕಾರಣ (ಕಡ್ಡಾಯ):')||'').trim();
  if(!reason){ showToast('⚠ Reject ಕಾರಣ ಕಡ್ಡಾಯ'); return; }
  d.status='Rejected'; d.remarks=reason; saveDB();
  pushNotification(d.createdBy, d.docType+' Rejected: '+d.studentName+' — '+reason);
  showToast('↩ Rejected'); navigate('sctcsign');
}

function initFoodItems(){
  if(!DB.foodItems || DB.foodItems.length===0){
    DB.foodItems = FOOD_ITEMS_MASTER.map(f=>({...f, currentStock:0, lastUpdated:''}));
    saveDB();
  }
}

function getItemName(f){ return f.kn+(f.en?' ('+f.en+')':''); }

function approveBeedigaPatti(id){
  const b=DB.beedigaPatti.find(x=>x.id===id); if(!b) return;
  b.principalSigned=true; b.principalSignedAt=todayStr(); b.principalName=CURRENT_USER.name;
  b.status='Ready to Close'; saveDB();
  pushNotification(b.createdBy,'📊 ಬೀಡಿಕೆ ಪಟ್ಟಿ Sign ಆಗಿದೆ — ಮುಚ್ಚಿ Print ಮಾಡಿ');
  showToast('✅ ಬೀಡಿಕೆ ಪಟ್ಟಿ Sign ಆಗಿದೆ — Warden ಗೆ ತಿಳಿಸಲಾಗಿದೆ');
  navigate('foodmonthly');
}

function renderPrincipalBeedigaApproval(){
  const pending=DB.beedigaPatti.filter(b=>b.status==='Sent to Principal');
  if(!pending.length) return '';
  const months=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
  return `<div class="panel"><h3>📊 ಬೀಡಿಕೆ ಪಟ್ಟಿ — Sign ಅಗತ್ಯ (${pending.length})</h3>
    ${pending.map(b=>`<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;">
      <div style="font-weight:700;margin-bottom:6px;">${months[b.month]}-${b.year} ತಿಂಗಳ ಬೀಡಿಕೆ ಪಟ್ಟಿ</div>
      <div class="small-muted">Created by: ${esc(b.createdBy)} | ಒಟ್ಟು ಖರ್ಚು: ₹${b.totalExpense.toFixed(2)}</div>
      <div class="form-actions" style="margin-top:8px;">
        <button class="btn btn-sm btn-outline" onclick="viewBeedigaPatti('${b.id}')">👁 View</button>
        <button class="btn btn-sm btn-primary" onclick="approveBeedigaPatti('${b.id}')">✍️ Approve & Sign</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderPrincipalIndentApprovals(){
  const pending=(DB.foodIndents||[]).filter(x=>x.status==='Sent to Principal');
  if(!pending.length) return '';
  return `<div class="panel"><h3>📋 ಆಹಾರ Indent Approval (${pending.length})</h3>
    ${pending.map(ind=>`<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;">
      <div><b>${ind.indentType==='daily'?'ದೈನಂದಿನ':'ಮಾಸಿಕ'} Indent</b> — ${fmtDate(ind.date)}</div>
      <div class="small-muted">ಒಟ್ಟು: ₹${Number(ind.totalAmt||0).toFixed(0)} | ${ind.items.length} ಪದಾರ್ಥಗಳು | ${esc(ind.purpose||'')}</div>
      <div class="form-actions" style="margin-top:8px;">
        <button class="btn btn-sm btn-outline" onclick="viewIndent('${ind.id}')">👁 View</button>
        <button class="btn btn-sm btn-primary" onclick="approveIndent('${ind.id}')">✅ Approve</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function issueSCTCNew(docId){
  const d=DB.stDocuments.find(x=>x.id===docId); if(!d) return;
  const s=stuAny(d.studentId); if(!s) return;
  const issuedTo=prompt('ವಿತರಿಸಿದ ವ್ಯಕ್ತಿ ಹೆಸರು:')||d.studentName;
  const certNo=genCertNo(d.docType.toLowerCase());
  d.status='Issued'; d.issuedAt=todayStr(); d.issuedBy=CURRENT_USER.name;
  d.issuedTo=issuedTo; d.docNo=certNo;
  const verifyURL=getVerifyURL(certNo, d.docType);
  d.verifyURL=verifyURL;
  DB.docIssueRegister.push({
    id:uid(), docNo:certNo, dateIssued:todayStr(),
    studentName:d.studentName, satsNo:d.satsNo||'', admissionNo:d.admissionNo||'',
    className:d.className, docType:(d.docType==='SC'?'ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ (SC)':'ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)'),
    issuedTo, issuedBy:CURRENT_USER.name, cardId:docId
  });
  saveDB();
  showToast('✅ '+d.docType+' Issue ಆಯಿತು! '+certNo);
  viewSCTCDoc(docId);
}

function saveAndPrintDuty(){
  const hrmsId=document.getElementById('da_staff').value;
  const s=STAFF.find(x=>x.hrmsId===hrmsId); if(!s) return;
  const dutyType=document.getElementById('da_type').value;
  const desc=document.getElementById('da_desc').value;
  const fromDate=document.getElementById('da_from').value;
  const toDate=document.getElementById('da_to').value||'';
  const note=document.getElementById('da_note').value;
  const orderNo='ಮೊದೇವಶಾ/ಕ.ನಿ/'+nextSeq('duty')+'/'+(new Date().getFullYear());

  const duty={
    id:uid(), orderNo, staffName:s.name, staffHrmsId:s.hrmsId,
    staffDesig:s.desig||'', dutyType, desc, fromDate, toDate, note,
    assignedBy:CURRENT_USER.name, assignedAt:todayStr(), active:true,
    stoppedAt:null, stoppedBy:null, stopOrderNo:null
  };
  DB.dutyAllotments.push(duty); saveDB();
  pushNotification(s.name,'📋 ಕರ್ತವ್ಯ ನಿಯೋಜನೆ: '+dutyType+' (ಆದೇಶ: '+orderNo+')');
  showToast('✅ ಕರ್ತವ್ಯ ನಿಯೋಜಿಸಲಾಗಿದೆ — '+s.name);
  printDutyOrder(duty.id);
  navigate('dutyallot');
}

function stopDuty(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  const stopOrder='ಮೊದೇವಶಾ/ಕ.ನಿ.ಮು/'+nextSeq('dutystop')+'/'+(new Date().getFullYear());
  d.active=false; d.stoppedAt=todayStr(); d.stoppedBy=CURRENT_USER.name; d.stopOrderNo=stopOrder;
  saveDB();
  pushNotification(d.staffName,'🛑 ಕರ್ತವ್ಯ ಮುಗಿದಿದೆ: '+d.dutyType+' (ಆದೇಶ: '+stopOrder+')');
  showToast('✅ ಕರ್ತವ್ಯ ನಿಲ್ಲಿಸಲಾಗಿದೆ — '+stopOrder);
  navigate('dutyallot');
}

function printDutyOrder(id){ previewDutyOrder(id); }

function staffESignDuty(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  if(d.staffSigned){ showToast('ಈಗಾಗಲೇ E-Sign ಮಾಡಿದ್ದೀರಿ'); return; }
  d.staffSigned=true; d.staffSignedAt=todayStr(); d.staffSignedBy=CURRENT_USER.name;
  d.status='Staff Acknowledged';
  saveDB();
  // Notify FDA
  staffNamesForRole('fda').forEach(n=>pushNotification(n,
    '✍️ ಕರ್ತವ್ಯ ಆದೇಶ Staff ಸ್ವೀಕೃತಿ: '+d.staffName+' — '+d.dutyType+' | ಆದೇಶ: '+d.orderNo
  ));
  // Also notify principal
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'✍️ '+d.staffName+' ಕರ್ತವ್ಯ E-Sign ಮಾಡಿದ್ದಾರೆ: '+d.dutyType);
  showToast('✅ E-Sign ಆಯಿತು — FDA ಮತ್ತು Principal ಗೆ ತಿಳಿಸಲಾಗಿದೆ');
  navigate('myduties');
}

function getWhatsAppLink(mobile, message){
  const num = mobile.replace(/\D/g,'');
  const formattedNum = num.startsWith('91') ? num : '91'+num;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${formattedNum}?text=${encodedMsg}`;
}

function whatsAppReminder(staffName, reason){
  const s=STAFF.find(x=>x.name===staffName);
  if(!s||!s.mobile||s.mobile==='—'||s.mobile===''){
    showToast('⚠ '+staffName+' ಮೊಬೈಲ್ ನಂಬರ್ ಇಲ್ಲ. Profile ನಲ್ಲಿ ಸೇರಿಸಿ.'); return;
  }
  const siteURL='http://mdrsshedbariesoffice.in';
  const msg=`ಪ್ರಿಯ ${staffName},\n\nKREIS e-Office (${siteURL}) ನಲ್ಲಿ ನಿಮ್ಮ Login ನಲ್ಲಿ ${reason} ಕಾಯುತ್ತಿದೆ.\n\nದಯವಿಟ್ಟು Login ಆಗಿ ಪರಿಶೀಲಿಸಿ.\n\nHRMS ID: ${s.hrmsId}\nPassword: ನಿಮ್ಮ Password\n\nMDRS Bhatkal (BC-265)`;
  window.open(getWhatsAppLink(s.mobile, msg), '_blank');
}

function renderMyDuties(){
  if(!DB.dutyAllotments) DB.dutyAllotments=[];
  const allMy=DB.dutyAllotments.filter(d=>d.staffHrmsId===CURRENT_USER.hrmsId);
  const active=allMy.filter(d=>d.status==='Sent to Staff'||d.status==='Staff Acknowledged');
  const past=allMy.filter(d=>d.status==='Closed');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📄 ನನ್ನ ಕರ್ತವ್ಯ ಆದೇಶಗಳು (My Duty Orders)</h2>
    <div class="desc">Principal E-Sign ಆದ ಡಿಜಿಟಲ್ ಆದೇಶಗಳು — ನೋಡಿ E-Sign ಮಾಡಿ ಸ್ವೀಕರಿಸಿ</div></div>

    ${!allMy.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ ಕರ್ತವ್ಯ ಆದೇಶ ಇಲ್ಲ.</div></div>':''}

    ${active.length?`<div class="panel"><h3 style="color:var(--green);">✅ ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ಕರ್ತವ್ಯಗಳು (${active.length})</h3>
      ${active.map(d=>`<div style="border:2px solid ${d.staffSigned?'var(--green)':'var(--gold)'};border-radius:10px;padding:14px;margin-bottom:12px;background:${d.staffSigned?'var(--green-tint)':'#fffbf0'};">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <div>
            ${d.staffSigned?'<span class="badge badge-ok">✅ E-Sign ಆಗಿದೆ</span>':'<span class="badge badge-warn">⏳ E-Sign ಬಾಕಿ</span>'}
            <b style="font-size:14px;color:var(--navy);margin-left:6px;">${esc(d.dutyType)}</b>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-gold" onclick="previewDutyOrder('${d.id}')">🖨️ Print</button>
            ${!d.staffSigned?`<button class="btn btn-sm btn-primary" onclick="staffESignDuty('${d.id}')">✍️ E-Sign ಸ್ವೀಕರಿಸಿ</button>`:''}
          </div>
        </div>
        <div style="font-size:12.5px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div class="kv"><b>ಆದೇಶ ಸಂ.</b>${esc(d.orderNo)}</div>
          <div class="kv"><b>ದಿನಾಂಕ</b>${fmtDate(d.fromDate)}${d.toDate?' → '+fmtDate(d.toDate):' (ಮುಂದಿನ ಆದೇಶ ವರೆಗೆ)'}</div>
          <div class="kv" style="grid-column:1/-1;">${principalSignatureHTML(d.principalName, d.principalSignedAt, fmtDate(d.principalSignedAt))}</div>
          ${d.staffSigned?`<div class="kv" style="grid-column:1/-1;">${staffSignatureHTMLByName(d.staffSignedBy||CURRENT_USER.name, d.staffSignedAt, fmtDate(d.staffSignedAt))}</div>`:''}
          <div class="kv"><b>ವಿವರ</b>${esc(d.desc||'—')}</div>
        </div>
      </div>`).join('')}
    </div>`:''}

    ${past.length?`<div class="panel"><h3>📋 ಹಿಂದಿನ ಕರ್ತವ್ಯಗಳು</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಆದೇಶ ಸಂ.</th><th>ಕರ್ತವ್ಯ</th><th>ದಿನಾಂಕ</th><th>ಅಂತ್ಯ</th><th>Action</th>
      </tr></thead>
      <tbody>${past.map(d=>`<tr>
        <td>${esc(d.orderNo)}</td><td>${esc(d.dutyType)}</td>
        <td>${fmtDate(d.fromDate)}</td><td>${fmtDate(d.stoppedAt||d.toDate||'')}</td>
        <td><button class="btn btn-sm btn-outline" onclick="previewDutyOrder('${d.id}')">👁 View</button></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>`:''}
    <div id="dutyPrintWrap"></div>`;
}

function renderWhatsAppPanel(){
  const pending=DB.dutyAllotments.filter(d=>d.status==='Sent to Staff'&&!d.staffSigned);
  if(!pending.length) return '';
  return `<div class="panel"><h3>📱 WhatsApp ನೆನಪಿಸಿ (ಇನ್ನೂ E-Sign ಮಾಡದ Staff)</h3>
    <div class="table-wrap"><table><thead><tr>
      <th>ಸಿಬ್ಬಂದಿ</th><th>ಕರ್ತವ್ಯ</th><th>ಕಳುಹಿಸಿದ ದಿನ</th><th>Mobile</th><th>WhatsApp</th>
    </tr></thead>
    <tbody>${pending.map(d=>{
      const sm=STAFF.find(x=>x.hrmsId===d.staffHrmsId);
      return `<tr>
        <td><b>${esc(d.staffName)}</b></td>
        <td>${esc(d.dutyType)}</td>
        <td>${fmtDate(d.sentToStaffAt)}</td>
        <td>${esc(sm?.mobile||'—')}</td>
        <td>${mkWA(sm?.mobile||'',d.staffName,'ಕರ್ತವ್ಯ ಆದೇಶ E-Sign ಬಾಕಿ ('+d.orderNo+')')}</td>
      </tr>`;
    }).join('')}
    </tbody></table></div>
  </div>`;
}

function getActiveAdminCharge(){
  if(!DB.adminCharges) return null;
  const today=todayStr();
  return DB.adminCharges.find(c=>c.active && c.staffHrmsId===CURRENT_USER.hrmsId && c.fromDate<=today && c.toDate>=today);
}

function renderLeaveMgmt(){
  if(!DB.leaveApplications) DB.leaveApplications=[];
  const myLeaves=DB.leaveApplications.filter(l=>l.hrmsId===CURRENT_USER.hrmsId).slice().reverse();
  const today=todayStr(); const yr=today.slice(0,4);

  // Count approved leaves by type this year
  const counts={};
  LEAVE_TYPES.forEach(t=>{ counts[t]=myLeaves.filter(l=>l.leaveType===t&&l.status==='Approved'&&l.fromDate&&l.fromDate.startsWith(yr)).reduce((a,l)=>a+Number(l.days||0),0); });

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📅 ರಜೆ ನಿರ್ವಹಣೆ (Leave Management)</h2>
    </div>

    <div class="cards-grid">
      ${LEAVE_TYPES.slice(0,4).map(t=>{
        const limit=LEAVE_LIMITS[t]||0;
        const used=counts[t]||0;
        const rem=limit-used;
        return `<div class="stat-card" style="min-width:120px;border-top:3px solid ${rem>0?'var(--green)':'var(--red)'};">
          <div class="n" style="font-size:24px;color:${rem>0?'var(--green)':'var(--red)'};">${rem}</div>
          <div class="l" style="font-size:10px;">${esc(t.split(' ')[0])} ಉಳಿದ (${yr})</div>
          <div style="font-size:9px;color:var(--muted);">${used}/${limit} ಬಳಸಿದ</div>
        </div>`;
      }).join('')}
    </div>

    <div class="panel"><h3>➕ ಹೊಸ ರಜೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ರಜೆ ಪ್ರಕಾರ <span class="req-star">*</span></label>
          <select id="lv_type">${LEAVE_TYPES_GEN.map(t=>`<option>${esc(t)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ಪ್ರಾರಂಭ ದಿನಾಂಕ <span class="req-star">*</span></label>
          <input type="date" id="lv_from" value="${today}" onchange="calcLeaveDays()"></div>
        <div class="field"><label>ಅಂತ್ಯ ದಿನಾಂಕ <span class="req-star">*</span></label>
          <input type="date" id="lv_to" value="${today}" onchange="calcLeaveDays()"></div>
        <div class="field"><label>ಒಟ್ಟು ದಿನಗಳು</label>
          <input id="lv_days" value="1" readonly style="background:var(--surface-2);font-weight:700;"></div>
        <div class="field" style="grid-column:1/-1;"><label>ರಜೆ ಕಾರಣ <span class="req-star">*</span></label>
          <input id="lv_reason" placeholder="ವೈಯಕ್ತಿಕ ಕಾರಣ / ಅನಾರೋಗ್ಯ / ಕುಟುಂಬ ಕಾರ್ಯಕ್ರಮ..."></div>
        <div class="field"><label>ಸ್ಥಳ (Place)</label>
          <input id="lv_place" placeholder="ಊರು/ನಗರ"></div>
        <div class="field"><label>ರಜೆ ಅವಧಿಯಲ್ಲಿ ಸಂಪರ್ಕ ನಂ.</label>
          <input id="lv_contact" value="${CURRENT_USER.mobile||''}"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="submitLeaveApplication()">📤 ರಜೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (Principal ಗೆ)</button>
        <button class="btn btn-outline" onclick="previewLeaveLetterNew()">👁 Preview Letter</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ನನ್ನ ರಜೆ ಅರ್ಜಿಗಳು (${myLeaves.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಅರ್ಜಿ ಸಂ.</th><th>ರಜೆ ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ದಿನಗಳು</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${myLeaves.length ? myLeaves.map(l=>`<tr>
        <td><b>${esc(l.appNo||'—')}</b></td>
        <td>${esc(l.leaveType)}</td>
        <td>${fmtDate(l.fromDate)} → ${fmtDate(l.toDate)}</td>
        <td><b>${l.days}</b></td>
        <td><span class="badge ${l.status==='Approved'?'badge-ok':l.status==='Rejected'?'badge-bad':l.status==='Sent to Principal'?'badge-info':'badge-warn'}">${esc(l.status)}</span>
          ${l.principalSigned?`<br><span style="font-size:9px;color:var(--green);">✅ ${esc(l.principalName)}</span>`:''}
        </td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-gold" onclick="printLeaveLetterById('${l.id}')">🖨️ Print</button>
          ${l.status==='Approved'?`<button class="btn btn-sm btn-primary" onclick="leaveLetterPdf('${l.id}')">⬇ PDF</button>`:''}
          ${l.status==='Approved'&&dscFor('leave',l.id).length?`<button class="gv-b ok" onclick="dscView('${dscFor('leave',l.id)[0].id}')">DSC ಸಹಿ ಪ್ರತಿ</button>`:''}
        </td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="6">ಯಾವ ರಜೆ ಅರ್ಜಿ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="leavePrintWrap"></div>`;
}

function calcLeaveDays(){
  const from=document.getElementById('lv_from')?.value;
  const to=document.getElementById('lv_to')?.value;
  if(from&&to&&to>=from){
    const d1=new Date(from), d2=new Date(to);
    const days=Math.round((d2-d1)/(86400000))+1;
    const el=document.getElementById('lv_days'); if(el) el.value=days;
  }
}

function submitLeaveApplication(){
  const leaveType=document.getElementById('lv_type').value;
  const fromDate=document.getElementById('lv_from').value;
  const toDate=document.getElementById('lv_to').value;
  const days=document.getElementById('lv_days').value;
  const reason=document.getElementById('lv_reason').value;
  const place=document.getElementById('lv_place').value;
  const contact=document.getElementById('lv_contact').value;
  if(!fromDate||!toDate||!reason){ showToast('⚠ ಎಲ್ಲಾ ಕಡ್ಡಾಯ ಮಾಹಿತಿ ನಮೂದಿಸಿ'); return; }
  if(typeof leaveDupCheck==='function'&&leaveDupCheck(fromDate,toDate)) return;
  if(!DB.leaveApplications) DB.leaveApplications=[];
  const appNo='ಮೊದೇವಶಾ/ರಜೆ/'+nextSeq('leave')+'/'+(new Date().getFullYear());
  const leave={
    id:uid(), appNo, hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
    staffDesig:CURRENT_USER.desig||'', leaveType, fromDate, toDate,
    days:Number(days), reason, place, contact,
    createdAt:todayStr(), status:'Sent to Principal',
    principalSigned:false, principalName:null, principalSignedAt:null,
    rejectedReason:null
  };
  DB.leaveApplications.push(leaveStaffSign(leave)); saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📅 ರಜೆ ಅರ್ಜಿ: '+CURRENT_USER.name+' — '+leaveType+' | '+fmtDate(fromDate)+' ರಿಂದ '+fmtDate(toDate)+' ('+days+' ದಿನ) | "ರಜೆ ಅನುಮೋದನೆ" ನಲ್ಲಿ Sign ಮಾಡಿ');
  showToast('✅ ರಜೆ ಅರ್ಜಿ ಕಳುಹಿಸಲಾಗಿದೆ — '+appNo);
  navigate('leavemgmt');
}

function previewLeaveLetterNew(){
  const leaveType=document.getElementById('lv_type')?.value||'';
  const fromDate=document.getElementById('lv_from')?.value||'';
  const toDate=document.getElementById('lv_to')?.value||'';
  const days=document.getElementById('lv_days')?.value||'1';
  const reason=document.getElementById('lv_reason')?.value||'ವೈಯಕ್ತಿಕ ಕಾರಣ';
  const place=document.getElementById('lv_place')?.value||'';
  const fakeLeave={id:'preview',appNo:'PREVIEW',hrmsId:CURRENT_USER.hrmsId,
    staffName:CURRENT_USER.name,staffDesig:CURRENT_USER.desig||'',
    leaveType,fromDate,toDate,days,reason,place,
    createdAt:todayStr(),status:'Draft',principalSigned:false};
  window._fakeLv=fakeLeave;
  const wrap=document.getElementById('leavePrintWrap'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-primary" onclick="LEAVE_PREVIEW=leaveStaffSign(Object.assign({},window._fakeLv));leaveLetterPdf('preview')">⬇ PDF Download</button>
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-outline" onclick="document.getElementById('leavePrintWrap').innerHTML=''">✕</button>
    </div>
    ${buildLeaveLetterHTML(fakeLeave)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function renderAdminChargeDash(){
  const today=todayStr();
  const ac=(DB.adminCharges||[]).find(c=>c.staffHrmsId===CURRENT_USER.hrmsId&&c.active&&c.fromDate<=today&&c.toDate>=today);
  if(!ac){ document.getElementById('content').innerHTML=`<div class="panel"><div class="small-muted" style="text-align:center;padding:30px;">ℹ ಆಡಳಿತ ಪ್ರಭಾರ ಅವಧಿ ಮುಗಿದಿದೆ.</div></div>`; return; }
  const pendingInward=(DB.inward||[]).filter(i=>i.status==='Draft'||i.status==='Pending').length;
  const pendingOutward=(DB.outward||[]).filter(o=>o.status==='Draft').length;
  const daysLeft=Math.ceil((new Date(ac.toDate)-new Date(today))/(86400000))+1;

  document.getElementById('content').innerHTML=`
    <div class="page-head">
      <h2>🏛️ ಆಡಳಿತ ಪ್ರಭಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್</h2>
      <div class="desc">I/C Principal — ಇಂದಿನಿಂದ ${fmtDate(ac.toDate)} ವರೆಗೆ ✅ (${daysLeft} ದಿನ ಬಾಕಿ) | ಕಾರಣ: ${esc(ac.reason||'Principal ರಜೆ')}</div>
    </div>
    <div class="note" style="background:#fff3cd;border-color:#ffc107;">
      ⚠ ಈ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ <b>${fmtDate(ac.toDate)}</b> ರ ಮಧ್ಯರಾತ್ರಿ 12 ಗಂಟೆ ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಚ್ಚುತ್ತದೆ.
      ಎಲ್ಲಾ ದಾಖಲೆಗಳು FDA Login ಗೆ ವರ್ಗಾಯಿಸಲ್ಪಡುತ್ತವೆ.
    </div>
    <div class="cards-grid">
      <div class="stat-card" style="cursor:pointer" onclick="navigate('inward')"><div class="n">${pendingInward}</div><div class="l">Inward ಬಾಕಿ</div></div>
      <div class="stat-card" style="cursor:pointer" onclick="navigate('outward')"><div class="n">${pendingOutward}</div><div class="l">Outward ಡ್ರಾಫ್ಟ್</div></div>
      <div class="stat-card"><div class="n">${(DB.inward||[]).filter(i=>i.signedBy===CURRENT_USER.name).length}</div><div class="l">ನಾನು Sign ಮಾಡಿದ</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:16px;">
      ${[
        {key:'inward', ic:'📥', label:'ಒಳಬರುವ ಪತ್ರ (Inward)'},
        {key:'outward', ic:'📤', label:'ಹೊರಹೋಗುವ ಪತ್ರ (Outward)'},
        {key:'letterhead', ic:'📝', label:'ಕಚೇರಿ ಪತ್ರ ಬರೆಯಿರಿ'},
        {key:'docfiles', ic:'🗂️', label:'ದಾಖಲೆ ಕಡತಗಳು'},
        {key:'leavemgmt', ic:'📅', label:'ರಜೆ ನಿರ್ವಹಣೆ'},
        {key:'leaveapprove', ic:'✅', label:'ರಜೆ ಅನುಮೋದನೆ'},
      ].map(m=>`<div class="panel" style="cursor:pointer;text-align:center;padding:20px;" onclick="navigate('${m.key}')">
        <div style="font-size:32px;">${m.ic}</div>
        <div style="font-size:12px;font-weight:700;margin-top:6px;font-family:var(--font-kn);">${m.label}</div>
      </div>`).join('')}
    </div>`;
}

function getAdminRoles(){ 
  return CURRENT_USER.role==='principal' || CURRENT_USER.hasAdminCharge;
}

function getLeaveBalance(hrmsId, year){
  const bal={};
  LEAVE_TYPES.forEach(t=>{
    const used=(DB.leaveApplications||[])
      .filter(l=>l.hrmsId===hrmsId&&l.leaveType===t&&l.status==='Approved'&&(l.fromDate||'').startsWith(year))
      .reduce((a,l)=>a+Number(l.days||0),0);
    let limit=LEAVE_LIMITS[t]||0;
    // EL: FDA sets manually from physical register
    if(t==='EL (Earned Leave)') limit=Number((DB.elBalances||{})[hrmsId]||30);
    bal[t]={used, limit, remaining: limit-used};
  });
  return bal;
}

function sendFileToStaffDocFiles(targetHrmsId, targetName, category, title, fileData, fileName, fileType){
  if(!DB.staffFiles) DB.staffFiles=[];
  DB.staffFiles.push({
    id:uid(), hrmsId:targetHrmsId, staffName:targetName,
    category, title, fileData:fileData||null, fileName:fileName||null, fileType:fileType||null,
    fromName:CURRENT_USER.name, savedAt:todayStr()
  });
  saveDB();
  pushNotification(targetName,'🗂️ ನಿಮ್ಮ My Files ಗೆ ಹೊಸ ಫೈಲ್: '+title+' | "ನನ್ನ ಫೈಲ್‌ಗಳು" ನಲ್ಲಿ ನೋಡಿ');
}

function sendMsgWithFile(){
  const toEl=document.getElementById('msg_to');
  const textEl=document.getElementById('msg_text');
  const fileEl=document.getElementById('msg_file');
  const to=toEl?.value; const text=textEl?.value?.trim();
  if(!to||!text){ showToast('⚠ ಸ್ಟಾಫ್ ಮತ್ತು ಸಂದೇಶ ಅಗತ್ಯ'); return; }
  const file=fileEl?.files[0];
  const doSend=(fd,fn,ft)=>{
    if(!DB.messages) DB.messages=[];
    DB.messages.push({
      id:uid(), fromName:CURRENT_USER.name, toStaff:to,
      text, fileData:fd||null, fileName:fn||null, fileType:ft||null,
      status:'Sent', sentAt:todayStr()
    });
    saveDB();
    pushNotification(to,'✉ '+CURRENT_USER.name+' ಸಂದೇಶ: '+text.slice(0,60)+(fd?' 📎 '+fn:''));
    showToast('✅ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ → '+to);
    if(toEl) toEl.value=''; if(textEl) textEl.value=''; if(fileEl) fileEl.value='';
    navigate('messages');
  };
  if(file){ const r=new FileReader(); r.onload=e=>doSend(e.target.result,file.name,file.type); r.readAsDataURL(file); }
  else doSend(null,null,null);
}

function renderSSLCAdopt(){
  if(!DB.sslcAdoptions) DB.sslcAdoptions=[];
  const students10=DB.students.filter(s=>String(s.className)==='10'||s.className===10);
  const myAdoptions=DB.sslcAdoptions.filter(a=>a.assignedByHrmsId===CURRENT_USER.hrmsId&&a.academicYear===CURRENT_ACADEMIC_YEAR);
  const allStaff=STAFF.filter(s=>s.role==='staff'&&s.hrmsId!==CURRENT_USER.hrmsId);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🤝 SSLC Adopted Students</h2>
    </div>
    <div class="note">ಶೈಕ್ಷಣಿಕ ವರ್ಷ: <b>${CURRENT_ACADEMIC_YEAR}</b> | Academic year ಮುಗಿದ ನಂತರ ಈ Data Archive ಆಗುತ್ತದೆ</div>

    ${students10.length?`<div class="panel"><h3>➕ ವಿದ್ಯಾರ್ಥಿ Assign ಮಾಡಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಿದ್ಯಾರ್ಥಿ ಆಯ್ಕೆ (10ನೇ ತರಗತಿ) <span class="req-star">*</span></label>
          <select id="sa_student" style="width:100%">
            ${students10.map(s=>`<option value="${s.id}">${esc(s.studentName)} — SATS: ${esc(s.satsNo||'—')}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ನಿಯೋಜಿತ ಸಿಬ್ಬಂದಿ <span class="req-star">*</span></label>
          <select id="sa_staff">
            ${allStaff.map(s=>`<option value="${s.hrmsId}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಟಿಪ್ಪಣಿ (ಯಾವ ವಿಷಯ ಗಮನಿಸಬೇಕು)</label>
          <input id="sa_note" placeholder="ಉದಾ: Maths, Science special attention..."></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="assignSSLCStudent()">📤 Principal ಗೆ Approval ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>`:`<div class="panel"><div class="note">10ನೇ ತರಗತಿ ವಿದ್ಯಾರ್ಥಿಗಳ ಡೇಟಾ ಇಲ್ಲ — ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಮಾಡಿ.</div></div>`}

    <div class="panel"><h3>📋 Adoption ಪಟ್ಟಿ (${myAdoptions.length})</h3>
    ${!myAdoptions.length?`<div class="small-muted" style="text-align:center;padding:16px;">ಯಾವ Assignment ಇಲ್ಲ.</div>`:''}
    <div class="table-wrap"><table><thead><tr>
      <th>ವಿದ್ಯಾರ್ಥಿ</th><th>SATS</th><th>ಸಿಬ್ಬಂದಿ</th><th>ಟಿಪ್ಪಣಿ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
    </tr></thead>
    <tbody>${myAdoptions.length?myAdoptions.slice().reverse().map(a=>{
      const stu=DB.students.find(s=>s.id===a.studentId)||{};
      return `<tr>
        <td><b>${esc(a.studentName||stu.studentName||'—')}</b></td>
        <td style="font-size:11px;">${esc(stu.satsNo||'—')}</td>
        <td>${esc(a.assignedToName)}</td>
        <td style="font-size:11px;">${esc(a.note||'—')}</td>
        <td><span class="badge ${a.status==='Approved'?'badge-ok':a.status==='Rejected'?'badge-bad':'badge-warn'}">${esc(a.status)}</span></td>
        <td>${a.status==='Sent to Principal'?`<button class="btn btn-sm btn-red" onclick="cancelSSLCAdopt('${a.id}')">Cancel</button>`:''}</td>
      </tr>`;
    }).join('') : `<tr class="empty-row"><td colspan="6">ಯಾವ Assignment ಇಲ್ಲ.</td></tr>`}
    </tbody></table></div>
    </div>`;
}

function assignSSLCStudent(){
  const stuId=document.getElementById('sa_student')?.value;
  const staffHrmsId=document.getElementById('sa_staff')?.value;
  const note=document.getElementById('sa_note')?.value||'';
  if(!stuId||!staffHrmsId){ showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const stu=DB.students.find(s=>s.id===stuId);
  const staff=STAFF.find(s=>s.hrmsId===staffHrmsId);
  if(!stu||!staff) return;
  if(!DB.sslcAdoptions) DB.sslcAdoptions=[];
  DB.sslcAdoptions.push({
    id:uid(), studentId:stuId, studentName:stu.studentName, satsNo:stu.satsNo||'',
    assignedToHrmsId:staffHrmsId, assignedToName:staff.name,
    assignedByHrmsId:CURRENT_USER.hrmsId, assignedByName:CURRENT_USER.name,
    note, status:'Sent to Principal', createdAt:todayStr(),
    academicYear:CURRENT_ACADEMIC_YEAR,
    approvedBy:null, approvedAt:null
  });
  saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'🤝 SSLC Adoption Approval: '+stu.studentName+' → '+staff.name+' | "ಕರ್ತವ್ಯ ಅನುಮೋದನೆ" ನಲ್ಲಿ Approve ಮಾಡಿ');
  showToast('✅ '+stu.studentName+' → '+staff.name+' | Principal Approval ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  navigate('sslcadopt');
}

function cancelSSLCAdopt(id){
  DB.sslcAdoptions=(DB.sslcAdoptions||[]).filter(a=>a.id!==id); saveDB(); navigate('sslcadopt');
}

function renderSSLCApprovalList(){
  const pending=(DB.sslcAdoptions||[]).filter(a=>a.status==='Sent to Principal');
  if(!pending.length) return '<div class="note">ℹ SSLC Adoption Approval ಬಾಕಿ ಇಲ್ಲ.</div>';
  return `<div class="panel"><h3>🤝 SSLC Adoption Approval (${pending.length})</h3>
    ${pending.map(a=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center;">
      <div><b>${esc(a.studentName)}</b> → ${esc(a.assignedToName)} (${esc(a.note||'')})<br>
      <span style="font-size:11px;color:var(--muted);">By: ${esc(a.assignedByName)} | ${fmtDate(a.createdAt)}</span></div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm btn-primary" onclick="approveSSLCAdopt('${a.id}')">✅ Approve</button>
        <button class="btn btn-sm btn-red" onclick="rejectSSLCAdopt('${a.id}')">✕ Reject</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function approveSSLCAdopt(id){
  const a=DB.sslcAdoptions.find(x=>x.id===id); if(!a) return;
  a.status='Approved'; a.approvedBy=CURRENT_USER.name; a.approvedAt=todayStr(); saveDB();
  pushNotification(a.assignedToName,'🤝 SSLC Adoption Approved: '+a.studentName+' | ನಿಮ್ಮ SSLC Achievement ನಲ್ಲಿ ನೋಡಿ');
  pushNotification(a.assignedByName,'✅ SSLC Adoption Approved: '+a.studentName+' → '+a.assignedToName);
  // Notify all staff about the achievement record
  STAFF.forEach(s=>{ if(s.role!=='principal') pushNotification(s.name,'🏆 SSLC Achievement Update: '+a.studentName+' Adopted by '+a.assignedToName+' | "SSLC Achievement" ನಲ್ಲಿ ನೋಡಿ'); });
  showToast('✅ Approved: '+a.studentName); navigate('leaveapprove');
}

function rejectSSLCAdopt(id){
  const a=DB.sslcAdoptions.find(x=>x.id===id); if(!a) return;
  const reason=prompt('Reject ಕಾರಣ:')||'';
  a.status='Rejected'; a.rejectedReason=reason; saveDB();
  pushNotification(a.assignedByName,'❌ SSLC Adoption Rejected: '+a.studentName+' — '+reason);
  showToast('↩ Rejected'); navigate('leaveapprove');
}

function renderSSLCAchieve(){
  if(!DB.sslcAdoptions) DB.sslcAdoptions=[];
  // Show only current academic year approved adoptions
  const now=new Date();
  const yearEnd=new Date(now.getFullYear()+(now.getMonth()>=5?1:0),2,31); // March 31
  const isActive=new Date()<=yearEnd;
  const approved=DB.sslcAdoptions.filter(a=>a.status==='Approved'&&a.academicYear===CURRENT_ACADEMIC_YEAR);

  // Staff-wise grouping
  const byStaff={};
  approved.forEach(a=>{ if(!byStaff[a.assignedToName]) byStaff[a.assignedToName]=[]; byStaff[a.assignedToName].push(a); });

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🏆 SSLC Achievement (${CURRENT_ACADEMIC_YEAR})</h2>
    <div class="desc">Adopted ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ — ${isActive?'Academic Year ಚಾಲ್ತಿಯಲ್ಲಿದೆ (March 31 ವರೆಗೆ ಕಾಣಿಸುತ್ತದೆ)':'Academic Year ಮುಗಿದಿದೆ'}</div></div>

    ${!approved.length?`<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ SSLC Adoption Approved ಆಗಿಲ್ಲ.</div></div>`:''}

    ${Object.entries(byStaff).map(([staffName,adoptions])=>`
      <div class="panel">
        <h3>👤 ${esc(staffName)} — (${adoptions.length} ವಿದ್ಯಾರ್ಥಿ)</h3>
        <div class="table-wrap"><table><thead><tr>
          <th>#</th><th>ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು</th><th>SATS ಸಂ.</th><th>Assigned By</th><th>ವಿಶೇಷ ಗಮನ</th><th>Approved ದಿನ</th>
        </tr></thead>
        <tbody>${adoptions.map((a,i)=>`<tr>
          <td>${i+1}</td>
          <td><b>${esc(a.studentName)}</b></td>
          <td style="font-size:11px;">${esc(a.satsNo||'—')}</td>
          <td style="font-size:11px;">${esc(a.assignedByName)}</td>
          <td style="font-size:11px;">${esc(a.note||'—')}</td>
          <td style="font-size:11px;">${fmtDate(a.approvedAt)}</td>
        </tr>`).join('')}
        </tbody></table></div>
      </div>`).join('')}

    ${CURRENT_USER.role==='principal'?renderSSLCApprovalList():''}`;
}

function renderMentorProfilePage(){
  const isP=CURRENT_USER.role==='principal';
  const all=(DB.mentorAllocations||[]).filter(a=>a.active);
  const mine=all.filter(a=>a.mentorHrmsId===CURRENT_USER.hrmsId);
  const q=(document.getElementById('mp_q')?.value||'').trim().toLowerCase();
  const show=(isP&&document.getElementById('mp_all')?.checked?all:mine).filter(a=>!q||(a.studentName||'').toLowerCase().includes(q)||String(a.satsId||'').includes(q));
  const prof=a=>(DB.mentorProfiles||[]).find(p=>p.studentId===a.studentId);
  const wasAll=document.getElementById('mp_all')?.checked;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📝 ಡಿಜಿಟಲ್ ಮೆಂಟರ್ ಶಿಕ್ಷಕ - ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್</h2>
    <div class="desc">ವಿದ್ಯಾರ್ಥಿಯ ಮುಂದಿನ "📝 Mentor Profile" ಒತ್ತಿ ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ (ಒಟ್ಟು ${mine.length} ವಿದ್ಯಾರ್ಥಿಗಳು ನಿಮ್ಮ ಮೆಂಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ)</div></div>
    <div class="panel">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <input id="mp_q" placeholder="🔍 ಹೆಸರು / SATS" value="${esc(q)}" oninput="renderMentorProfilePage()" style="flex:1;min-width:200px;">
        ${CURRENT_USER.role!=='fda'?`<button class="btn btn-outline" onclick="sendAllMentorProfilesToFDA()">E-Sign ಆದ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು FDA ಗೆ ಕಳುಹಿಸಿ</button>`:''}
        ${isP?`<label style="font-size:12px;"><input type="checkbox" id="mp_all" ${wasAll?'checked':''} onchange="renderMentorProfilePage()"> ಎಲ್ಲಾ ಮೆಂಟರ್‌ಗಳ ವಿದ್ಯಾರ್ಥಿಗಳು</label>`:''}
      </div>
      ${show.length?`<div class="table-wrap"><table><thead><tr><th>#</th><th>SATS</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th>${isP?'<th>ಮೆಂಟರ್</th>':''}<th>ಪ್ರೊಫೈಲ್ ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
      ${show.map((a,i)=>{ const pr=prof(a); return `<tr><td>${i+1}</td><td>${esc(a.satsId||'')}</td><td><b>${esc(a.studentName)}</b></td><td>${esc(a.className)}</td>${isP?`<td>${esc(a.mentorName)}</td>`:''}<td>${pr?(pr.mentorSignedAt?'✅ Sign ಆಗಿದೆ':'📝 ಬರೆಯುತ್ತಿದೆ'):'—  ಇನ್ನೂ ಇಲ್ಲ'}</td><td><button class="btn btn-sm btn-primary" onclick="openMentorProfile('${a.studentId}')">📝 Mentor Profile</button></td></tr>`; }).join('')}
      </tbody></table></div>`:`<div class="small-muted" style="text-align:center;padding:20px;">ನಿಮಗೆ ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಇನ್ನೂ ಮೆಂಟರ್ ಆಗಿ ನಿಯೋಜಿಸಿಲ್ಲ (ಅಥವಾ ಹುಡುಕಾಟಕ್ಕೆ ಯಾರೂ ಸಿಗಲಿಲ್ಲ). ಹೊಸ ಆದೇಶ ಬಂದಿದ್ದರೆ "ನನ್ನ ಮೆಂಟರ್ ವಿದ್ಯಾರ್ಥಿಗಳು" ಪುಟದಲ್ಲಿ Accept ಮಾಡಿ.</div>`}
    </div>`;
  if(q){ const el=document.getElementById('mp_q'); if(el){ el.focus(); el.setSelectionRange(q.length,q.length); } }
}

async function stampPdfWithStaffSign(pdfDataUrl, signedDate, signedAt, position){
  return stampPdfNicSign(pdfDataUrl,{principalName:CURRENT_USER.name,desig:CURRENT_USER.desig||'Staff',signStamp:nicStampText(signedAt,signedDate),signHost:location.host,reason:'Submitted'});
}

function renderSupabasePanel(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>☁️ ಸಿಂಕ್ ಸ್ಥಿತಿ (Cloud Status)</h2>
    <div class="desc">ಡೇಟಾ ತಾನಾಗಿಯೇ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ತಾನಾಗಿಯೇ ಎಲ್ಲ ಸಾಧನಗಳಿಗೆ ತಲುಪುತ್ತದೆ — ಯಾವುದೇ ಬಟನ್ ಒತ್ತುವ ಅಗತ್ಯವಿಲ್ಲ.</div></div>
    <div class="panel">
      <div class="cards-grid">
        <div class="stat-card"><div class="n" style="font-size:15px;">${CLOUD_STATE==='ok'?'✓ ಸಿಂಕ್ ಆಗಿದೆ':CLOUD_STATE==='busy'?'⟳ ಉಳಿಸಲಾಗುತ್ತಿದೆ':CLOUD_STATE==='loading'?'⟳ ಲೋಡ್ ಆಗುತ್ತಿದೆ':'⚠ ಸಂಪರ್ಕ ಇಲ್ಲ'}</div><div class="l">ಈಗಿನ ಸ್ಥಿತಿ</div></div>
        <div class="stat-card"><div class="n" style="font-size:15px;">${CLOUD_LAST_OK?CLOUD_LAST_OK.toLocaleTimeString('en-IN'):'—'}</div><div class="l">ಕೊನೆಯ ಸಿಂಕ್</div></div>
        <div class="stat-card"><div class="n" style="font-size:15px;">${SYNC_DIRTY?'ಹೌದು':'ಇಲ್ಲ'}</div><div class="l">ಉಳಿಯದ ಬದಲಾವಣೆ</div></div>
        <div class="stat-card"><div class="n" style="font-size:15px;">${esc(SYNC_VER)}</div><div class="l">ಆವೃತ್ತಿ</div></div>
      </div>
      <div class="form-actions"><button class="btn btn-outline" onclick="checkSupabaseStatus()">🔍 ಸಂಪರ್ಕ ಪರೀಕ್ಷೆ (ತಾಂತ್ರಿಕ)</button></div>
      <div id="sbStatus" style="margin-top:12px;font-size:12px;"></div>
    </div>`;
}

async function checkSupabaseStatus(){
  const out=document.getElementById('sbStatus');
  const sb=getSB();
  if(!sb){ out.innerHTML='<span style="color:var(--red);">❌ Supabase library ಲೋಡ್ ಆಗಿಲ್ಲ (Internet ಪರಿಶೀಲಿಸಿ)</span>'; return; }
  const lines=[];
  const show=()=>{ out.innerHTML=lines.join('<br>'); };
  const ok=(t)=>lines.push('<span style="color:var(--green);">✅ '+esc(t)+'</span>');
  const bad=(t,e)=>{
    const msg=(e&&(e.message||e.details))||String(e||'');
    const code=(e&&e.code)||'';
    let hint='';
    if(code==='42P01'||/relation .* does not exist|Could not find the table/i.test(msg)) hint=' → Table ಇಲ್ಲ. supabase_setup.sql ಚಲಾಯಿಸಿ.';
    else if(code==='42501'||/row-level security|permission denied/i.test(msg)) hint=' → Permission/RLS ಸಮಸ್ಯೆ. supabase_setup.sql ಚಲಾಯಿಸಿ.';
    else if(code==='PGRST202'||/Could not find the function/i.test(msg)) hint=' → get_server_time function ಇಲ್ಲ. supabase_setup.sql ಚಲಾಯಿಸಿ.';
    else if(code==='57014'||/statement timeout/i.test(msg)) hint=' → Timeout. supabase_setup.sql ನಲ್ಲಿರುವ statement_timeout ಸಾಲು ಚಲಾಯಿಸಿ.';
    lines.push('<span style="color:var(--red);">❌ '+esc(t)+': '+esc(msg)+esc(code?(' ['+code+']'):'')+esc(hint)+'</span>');
  };
  lines.push('⏳ ಪರೀಕ್ಷೆ ನಡೆಯುತ್ತಿದೆ...'); show(); lines.length=0;
  // 1. read main row
  try{
    const t0=Date.now();
    const {data,error}=await sb.from('school_data').select('data,updated_at').eq('id',SB_ID).maybeSingle();
    if(error) throw error;
    if(data){
      const kb=Math.round(JSON.stringify(data.data).length/1024);
      ok('Main data ಓದಲಾಯಿತು — '+kb+' KB, '+Object.keys(data.data||{}).length+' keys, '+(Date.now()-t0)+' ms, last sync: '+(data.updated_at?new Date(data.updated_at).toLocaleString('en-IN'):'?'));
    } else lines.push('<span style="color:var(--gold);">⚠ Table ಇದೆ, ಆದರೆ ಇನ್ನೂ data ಇಲ್ಲ (ಮೊದಲ Upload ಮಾಡಿ)</span>');
  }catch(e){ bad('Data ಓದಲು',e); }
  show();
  // 2. write test
  try{
    const {error}=await sb.from('school_data').upsert({id:SB_ID+'_test',data:{t:Date.now()},updated_at:new Date().toISOString()});
    if(error) throw error;
    ok('Data ಬರೆಯಲು (write) ಸಾಧ್ಯ');
    await sb.from('school_data').delete().eq('id',SB_ID+'_test');
  }catch(e){ bad('Data ಬರೆಯಲು',e); }
  show();
  // 3. server time
  try{
    const {data,error}=await sb.rpc('get_server_time');
    if(error) throw error;
    ok('Server time ಕೆಲಸ ಮಾಡುತ್ತಿದೆ: '+new Date(data).toLocaleString('en-IN'));
  }catch(e){ bad('get_server_time',e); }
  show();
  // 4. file rows
  try{
    const {count,error}=await sb.from('school_data').select('id',{count:'exact',head:true}).like('id',SB_ID+'_b%');
    if(error) throw error;
    ok('Files ಪ್ರತ್ಯೇಕ rows: '+(count||0));
  }catch(e){ bad('File rows',e); }
  show();
  lines.push('<span style="color:var(--muted);">Version '+SYNC_VER+' | Device: '+esc(navigator.onLine?'online':'offline')+'</span>');
  show();
}

;(window.__LOADED=window.__LOADED||[]).push('other');
