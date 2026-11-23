/* =====================================================================
   KREIS e-Office v35 — administration.js
   ಆಡಳಿತ — Duties, leave, STI, MOD, notice board, staff files
   ===================================================================== */
function renderDutyAllot(){
  if(!DB.dutyAllotments) DB.dutyAllotments=[];
  const allStaff=STAFF.filter(s=>s.role==='staff'||s.role==='warden');
  const myDrafts=DB.dutyAllotments.slice().reverse();
  const pendingCount=DB.dutyAllotments.filter(d=>d.status==='Sent to Principal').length;
  const approvedCount=DB.dutyAllotments.filter(d=>d.status==='Approved'&&!d.sentToStaff).length;
  const activeCount=DB.dutyAllotments.filter(d=>d.status==='Sent to Staff'&&d.active).length;
  const canCreate=CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal';

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 ಕರ್ತವ್ಯ ನಿಯೋಜನೆ (Duty Allotment)</h2>
    </div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${pendingCount}</div><div class="l">Principal Approval ಬಾಕಿ</div></div>
      <div class="stat-card"><div class="n" style="color:var(--green)">${approvedCount}</div><div class="l">Approved — Staff ಗೆ ಕಳುಹಿಸಲು</div></div>
      <div class="stat-card"><div class="n">${activeCount}</div><div class="l">ಸಕ್ರಿಯ ಕರ್ತವ್ಯಗಳು</div></div>
    </div>

    ${approvedCount>0?`<div class="note" style="background:var(--green-tint);border-color:var(--green);">✅ ${approvedCount} ಕರ್ತವ್ಯ Approved — Staff ಗೆ ಕಳುಹಿಸಲು ಸಿದ್ಧ. ಕೆಳಗಿನ ಪಟ್ಟಿಯಲ್ಲಿ "📤 Staff ಗೆ ಕಳುಹಿಸಿ" ಒತ್ತಿ.</div>`:''}

    <div class="panel"><h3>➕ ಹೊಸ ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ತಯಾರಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ <span class="req-star">*</span></label>
          <select id="da_staff">
            ${allStaff.map(s=>`<option value="${s.hrmsId}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಕರ್ತವ್ಯ ಪ್ರಕಾರ <span class="req-star">*</span></label>
          <select id="da_type">${DUTY_TYPES.map(t=>`<option>${esc(t)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ಕರ್ತವ್ಯ ವಿವರ</label>
          <input id="da_desc" placeholder="ಕರ್ತವ್ಯದ ಸಂಕ್ಷಿಪ್ತ ವಿವರ..."></div>
        <div class="field"><label>ಪ್ರಾರಂಭ ದಿನಾಂಕ <span class="req-star">*</span></label>
          <input type="date" id="da_from" value="${todayStr()}"></div>
        <div class="field"><label>ಅಂತ್ಯ ದಿನಾಂಕ (ಐಚ್ಛಿಕ)</label>
          <input type="date" id="da_to"></div>
        <div class="field"><label>ಟಿಪ್ಪಣಿ</label>
          <input id="da_note" placeholder="ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿ..."></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="createDutyDraft()">
          ${CURRENT_USER.role==='principal'?'✅ E-Sign & Staff ಗೆ ಕಳುಹಿಸಿ':'📤 Principal Approval ಗೆ ಕಳುಹಿಸಿ'}
        </button>
      </div>
    </div>

    <div class="panel"><h3>📋 ಎಲ್ಲಾ ಕರ್ತವ್ಯ ನಿಯೋಜನೆಗಳು (${myDrafts.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಆದೇಶ ಸಂ.</th><th>ಸಿಬ್ಬಂದಿ</th><th>ಕರ್ತವ್ಯ</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${myDrafts.length ? myDrafts.map(d=>`<tr>
        <td><b>${esc(d.orderNo||'—')}</b></td>
        <td><b>${esc(d.staffName)}</b><br><span class="small-muted">${esc(d.staffDesig||'')}</span></td>
        <td>${esc(d.dutyType)}<br><span class="small-muted">${esc(d.desc||'')}</span></td>
        <td>${fmtDate(d.fromDate)}${d.toDate?'<br><span class="small-muted">→ '+fmtDate(d.toDate)+'</span>':''}</td>
        <td>
          <span class="badge ${d.status==='Draft'?'badge-warn':d.status==='Sent to Principal'?'badge-info':d.status==='Approved'?'badge-ok':d.status==='Sent to Staff'?'badge-ok':'badge-bad'}">${esc(d.status)}</span>
          ${d.principalSigned?`<br><span class="small-muted" style="font-size:9px;">✅ ${esc(d.principalName)}</span>`:''}
        </td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="previewDutyOrder('${d.id}')">👁 View</button>
          ${d.status==='Approved'&&!d.sentToStaff?`<button class="btn btn-sm btn-primary" onclick="sendDutyToStaff('${d.id}')">📤 Staff ಗೆ ಕಳುಹಿಸಿ</button>`:''}
          ${d.status==='Sent to Staff'&&d.active?`<button class="btn btn-sm btn-red" onclick="stopDutyOrder('${d.id}')">🛑 ನಿಲ್ಲಿಸಿ</button>`:''}
        </td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="6">ಯಾವ ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="dutyPrintWrap"></div>`;
}

function createDutyDraft(){
  const hrmsId=document.getElementById('da_staff').value;
  const s=STAFF.find(x=>x.hrmsId===hrmsId); if(!s){ showToast('⚠ ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const dutyType=document.getElementById('da_type').value;
  const desc=document.getElementById('da_desc').value;
  const fromDate=document.getElementById('da_from').value;
  const toDate=document.getElementById('da_to').value||'';
  const note=document.getElementById('da_note').value;
  if(!fromDate){ showToast('⚠ ದಿನಾಂಕ ನಮೂದಿಸಿ'); return; }
  const orderNo='ಮೊದೇವಶಾ/ಕ.ನಿ/'+nextSeq('duty')+'/'+(new Date().getFullYear());
  if(!DB.dutyAllotments) DB.dutyAllotments=[];

  // If PRINCIPAL is creating — auto E-Sign and send directly to staff
  if(CURRENT_USER.role==='principal'){
    const duty={
      id:uid(), orderNo, staffName:s.name, staffHrmsId:s.hrmsId,
      staffDesig:s.desig||'', dutyType, desc, fromDate, toDate, note,
      createdBy:CURRENT_USER.name, createdAt:todayStr(),
      status:'Approved', active:false,
      principalSigned:true, principalName:CURRENT_USER.name, principalSignedAt:todayStr(),
      sentToStaff:false, sentToStaffAt:null, sentBy:null
    };
    DB.dutyAllotments.push(duty); saveDB();
    showToast('✅ E-Signed: '+orderNo+' — Staff ಗೆ ಕಳುಹಿಸಲು ಕೆಳಗಿನ "📤 Staff ಗೆ ಕಳುಹಿಸಿ" ಒತ್ತಿ');
    navigate('dutyallot');
    return;
  }

  // FDA creates → sends to Principal for approval
  const duty={
    id:uid(), orderNo, staffName:s.name, staffHrmsId:s.hrmsId,
    staffDesig:s.desig||'', dutyType, desc, fromDate, toDate, note,
    createdBy:CURRENT_USER.name, createdAt:todayStr(),
    status:'Sent to Principal', active:false,
    principalSigned:false, principalName:null, principalSignedAt:null,
    sentToStaff:false, sentToStaffAt:null, sentBy:null
  };
  DB.dutyAllotments.push(duty); saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📋 ಕರ್ತವ್ಯ ನಿಯೋಜನೆ Approval: '+s.name+' — '+dutyType+' | "ಕರ್ತವ್ಯ ಅನುಮೋದನೆ" ನಲ್ಲಿ Sign ಮಾಡಿ');
  showToast('✅ Principal Approval ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ: '+orderNo);
  navigate('dutyallot');
}

function sendDutyToStaff(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  d.sentToStaff=true; d.sentToStaffAt=todayStr(); d.sentBy=CURRENT_USER.name;
  d.status='Sent to Staff'; d.active=true;

  // 1. AUTO-ENTRY in OUTWARD REGISTER (duty order going out from school to staff)
  if(!DB.outward) DB.outward=[];
  const outNo='OUT-'+nextSeq('outward');
  DB.outward.push({
    id:uid(), outwardNo:outNo, dateDispatched:todayStr(),
    toOffice:d.staffName+' ('+esc(d.staffDesig||'')+') — MDRS Bhatkal',
    subject:'ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಆದೇಶ — '+d.dutyType+' | ಆದೇಶ: '+d.orderNo,
    refNo:d.orderNo, letterNo:d.orderNo, dispatchMode:'Internal', remarks:'ಕರ್ತವ್ಯ ನಿಯೋಜನೆ',
    status:'Dispatched', createdBy:CURRENT_USER.name, createdAt:todayStr(),
    dutyId:id, principalSigned:true, principalName:d.principalName,
    history:[{status:'Dispatched',by:CURRENT_USER.name,at:todayStr()}]
  });

  // 2. AUTO-ENTRY in INWARD REGISTER for FDA (copy reference)
  if(!DB.inward) DB.inward=[];
  const inNo='IN-'+nextSeq('inward');
  DB.inward.push({
    id:uid(), inwardNo:inNo, ackNo:'ACK-'+nextSeq('ack'),
    receivedDate:todayStr(), sentFromOffice:'MDRS Bhatkal (ಆಂತರಿಕ)',
    letterNo:d.orderNo, letterDate:todayStr(),
    subject:'ಕರ್ತವ್ಯ ನಿಯೋಜನೆ (Copy) — '+d.staffName+' → '+d.dutyType,
    attachments:'Principal E-Sign ಸಮೇತ', status:'Principal Signed',
    principalName:d.principalName, principalSignedAt:d.principalSignedAt||todayStr(),
    createdBy:CURRENT_USER.name, createdAt:todayStr(), assignedStaff:'FDA',
    dutyId:id, isCopy:true,
    history:[{status:'Principal Signed',by:d.principalName||'Principal',at:d.principalSignedAt||todayStr()}]
  });

  saveDB();

  // 3. NOTIFY STAFF — will show as FIRST THING in their dashboard
  pushNotification(d.staffName,
    '🔴 ಕರ್ತವ್ಯ ಆದೇಶ ಸ್ವೀಕರಿಸಿ | '+d.orderNo+
    ' | '+d.dutyType+
    ' | '+fmtDate(d.fromDate)+(d.toDate?' → '+fmtDate(d.toDate):' (ಮುಂದಿನ ಆದೇಶ ವರೆಗೆ)')+
    ' | Principal E-Sign: '+d.principalName+
    ' | "ನನ್ನ ಕರ್ತವ್ಯ ಆದೇಶಗಳು" ನಲ್ಲಿ E-Sign ಮಾಡಿ'
  );

  // 4. NOTIFY FDA — copy received
  staffNamesForRole('fda').forEach(n=>{
    if(n!==CURRENT_USER.name) pushNotification(n,
      '📋 ಕರ್ತವ್ಯ Copy: '+d.staffName+' — '+d.dutyType+
      ' | Outward: '+outNo+' | Inward Copy: '+inNo
    );
  });

  // 5. SHOW WHATSAPP OPTION
  const staffMember=STAFF.find(x=>x.hrmsId===d.staffHrmsId);
  const waMsg=`ಪ್ರಿಯ ${d.staffName},\n\nKREIS e-Office: ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಆದೇಶ ಜಾರಿ ಆಗಿದೆ.\n\n📋 ಆದೇಶ: ${d.orderNo}\nಕರ್ತವ್ಯ: ${d.dutyType}\nದಿನಾಂಕ: ${fmtDate(d.fromDate)}${d.toDate?' ರಿಂದ '+fmtDate(d.toDate):''}\nPrincipal E-Sign: ${d.principalName}\n\nLogin ಆಗಿ E-Sign ಮಾಡಿ:\nhttp://mdrsshedbariesoffice.in\n\nMDRS Bhatkal (BC-265)`;

  showToast('✅ ಡಿಜಿಟಲ್ ಆದೇಶ '+d.staffName+' ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ | Outward: '+outNo);

  // Show WhatsApp confirm
  if(staffMember?.mobile&&staffMember.mobile!=='—'){
    const waURL=`https://wa.me/91${staffMember.mobile.replace(/\D/g,'')}?text=${encodeURIComponent(waMsg)}`;
    const wrap=document.getElementById('dutyPrintWrap');
    if(wrap) wrap.innerHTML=`<div class="panel" style="border:2px solid #25D366;">
      <h3 style="color:#25D366;">📱 WhatsApp ಮೂಲಕ ತಿಳಿಸಲೇ?</h3>
      <p style="font-family:var(--font-kn);font-size:13px;">${d.staffName} (${staffMember.mobile}) ಗೆ WhatsApp ಕಳುಹಿಸಿ:</p>
      <div class="form-actions">
        <a href="${waURL}" target="_blank" class="btn" style="background:#25D366;color:#fff;text-decoration:none;">📱 WhatsApp ಮೂಲಕ ಕಳುಹಿಸಿ</a>
        <button class="btn btn-gold" onclick="previewDutyOrder('${id}')">🖨️ Print Order</button>
        <button class="btn btn-outline" onclick="document.getElementById('dutyPrintWrap').innerHTML=''">✕</button>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;">
        ✅ Outward Register: <b>${outNo}</b> | Inward Copy (FDA): <b>${inNo}</b>
      </div>
    </div>`;
  } else {
    previewDutyOrder(id);
  }
  navigate('dutyallot');
}

function stopDutyOrder(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  const stopOrder='ಮೊದೇವಶಾ/ಕ.ನಿ.ಮು/'+nextSeq('dutystop')+'/'+(new Date().getFullYear());
  d.active=false; d.stoppedAt=todayStr(); d.stoppedBy=CURRENT_USER.name; d.stopOrderNo=stopOrder; d.status='Closed';
  saveDB();
  pushNotification(d.staffName,'🛑 ಕರ್ತವ್ಯ ಮುಗಿದಿದೆ: '+d.dutyType+' (ಆದೇಶ: '+stopOrder+')');
  showToast('✅ ಕರ್ತವ್ಯ ನಿಲ್ಲಿಸಲಾಗಿದೆ — '+stopOrder); navigate('dutyallot');
}

function previewDutyOrder(id){
  const d=DB.dutyAllotments.find(x=>x.id===id); if(!d) return;
  const html=buildDutyOrderHTML(d);
  const wrap=document.getElementById('dutyPrintWrap')||document.createElement('div');
  if(!document.getElementById('dutyPrintWrap')){
    wrap.id='dutyPrintWrap'; document.getElementById('content').appendChild(wrap);
  }
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF</button>
      <button class="btn btn-outline" onclick="document.getElementById('dutyPrintWrap').innerHTML=''">✕</button>
    </div>
    ${html}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function buildDutyOrderHTML(d){
  return `<div class="letterhead-paper">
    <div class="lh-top">
      <div class="lh-org">
        <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
        ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ<br>
        ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)<br>
        <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320<br>
        ದೂರವಾಣಿ: +91 97413 84751
      </div>
    </div>
    <div class="lh-meta"><span>ಸಂಖ್ಯೆ: ${esc(d.orderNo)}</span><span>ದಿನಾಂಕ: ${fmtDate(d.principalSignedAt||d.createdAt)}</span></div>
    <div style="text-align:center;font-size:15px;font-weight:800;color:var(--navy);margin:12px 0 6px;font-family:var(--font-kn);">ಕರ್ತವ್ಯ ನಿಯೋಜನೆ ಆದೇಶ</div>
    <div style="text-align:center;font-size:12px;color:#555;margin-bottom:16px;">Duty Allotment Order</div>
    <div class="lh-body" style="line-height:2.4;font-size:13.5px;font-family:var(--font-kn);">
      ಶ್ರೀ/ಶ್ರೀಮತಿ <b>${esc(d.staffName)}</b>, ${esc(d.staffDesig)}, HRMS ಸಂ: <b>${esc(d.staffHrmsId)}</b>, ಇವರನ್ನು <b>${fmtDate(d.fromDate)}</b> ರಿಂದ${d.toDate?' <b>'+fmtDate(d.toDate)+'</b> ರ ವರೆಗೆ':' ಮುಂದಿನ ಆದೇಶದ ವರೆಗೆ'} <b>${esc(d.dutyType)}</b> ಆಗಿ ಪ್ರಭಾರ ನಿಯೋಜಿಸಲಾಗಿದೆ.
      ${d.desc?`\n\nಕರ್ತವ್ಯ ವಿವರ: ${esc(d.desc)}`:''}
      ${d.note?`\n\nಟಿಪ್ಪಣಿ: ${esc(d.note)}`:''}
    </div>
    ${d.status==='Closed'?`<div style="color:var(--red);font-size:11px;margin-top:8px;">ಕರ್ತವ್ಯ ನಿಲ್ಲಿಸಿದ ದಿನ: ${fmtDate(d.stoppedAt)} | ಆದೇಶ: ${esc(d.stopOrderNo||'')}</div>`:''}
    <div style="margin-top:30px;display:flex;justify-content:flex-end;">
      ${d.principalSigned?
        principalSignatureHTML(d.principalName, d.principalSignedAt, fmtDate(d.principalSignedAt)):
        `<div style="text-align:center;min-width:200px;">
          <div style="height:34px;"></div>
          <div style="border-top:1.5px solid #000;padding-top:4px;font-size:12px;font-family:var(--font-kn);">
            ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ<br>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)
          </div>
        </div>`}
    </div>
    <div style="margin-top:18px;font-size:11.5px;color:#555;border-top:1px dashed #ccc;padding-top:10px;">
      ಪ್ರತಿ: <b>${esc(d.staffName)}</b>, ${esc(d.dutyType)}, ನೋಟಿಸ್ ಬೋರ್ಡ್, ಇ-ಆಫೀಸ್
    </div>
  </div>`;
}

function renderNoticeBoard(){
  if(!DB.noticeBoard) DB.noticeBoard=[];
  const myNotices=DB.noticeBoard.filter(n=>{
    if(!(n.to==='all'||n.to===CURRENT_USER.hrmsId)) return false;
    const dismissed=(n.dismissedBy||[]);
    return !dismissed.includes(CURRENT_USER.hrmsId);
  }).slice(0,5);

  const canPost=CURRENT_USER.role==='fda';

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📌 ನೋಟಿಸ್ ಬೋರ್ಡ್ (Notice Board)</h2>
    <div class="desc">FDA ಕಳುಹಿಸಿದ Notices/Orders — Remove ಮಾಡಿದ ನಂತರ My Files ಗೆ Save ಆಗುತ್ತದೆ</div></div>

    ${canPost?`<div class="panel"><h3>📤 Notice / Order ಕಳುಹಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಕಳುಹಿಸುವ ಸ್ಥಳ</label>
          <select id="nb_to">
            <option value="all">📢 ಎಲ್ಲಾ Staff ಗೆ (All Staff)</option>
            ${STAFF.filter(s=>s.role!=='principal'&&s.role!=='fda').map(s=>`<option value="${s.hrmsId}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಸಂದೇಶ / ಆದೇಶ <span class="req-star">*</span></label>
          <textarea id="nb_text" rows="3" placeholder="Notice/Order text ಬರೆಯಿರಿ..." style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:var(--font-kn);"></textarea>
        </div>
        <div class="field"><label>📎 File Upload (PDF/Word/Excel — ಐಚ್ಛಿಕ)</label>
          <input type="file" id="nb_file" accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.png"
            style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="postNotice()">📌 Notice Board ಗೆ Post ಮಾಡಿ</button>
      </div>
    </div>`:''}

    <div class="panel">
      <h3>📌 ಪ್ರಸ್ತುತ Notices (${myNotices.length}/5)</h3>
      ${myNotices.length?myNotices.map(n=>`<div style="border:2px solid var(--gold);border-radius:10px;padding:14px;margin-bottom:12px;background:#fffbf0;position:relative;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <div style="font-size:10px;color:var(--muted);margin-bottom:6px;">
              📤 ${esc(n.fromName)} | ${fmtDate(n.createdAt)} | ${n.to==='all'?'ಎಲ್ಲಾ Staff':'ನಿಮಗೆ ಮಾತ್ರ'}
            </div>
            <div style="font-size:13.5px;font-family:var(--font-kn);white-space:pre-wrap;">${esc(n.text)}</div>
            ${n.fileData?`<div style="margin-top:8px;">
              <button class="btn btn-sm btn-gold" onclick="downloadNoticFile('${n.id}')">⬇ ${esc(n.fileName||'File')}</button>
            </div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
            <button class="btn btn-sm btn-red" onclick="dismissNotice('${n.id}',false)" title="Remove">✕ Remove</button>
            <button class="btn btn-sm btn-outline" onclick="dismissNotice('${n.id}',true)" title="Save & Remove" style="font-size:10px;">💾 Save & Remove</button>
          </div>
        </div>
      </div>`).join('') : `<div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ Notice ಇಲ್ಲ.</div>`}
      ${myNotices.length>=5?`<div class="note" style="font-size:11px;">⚠ ಗರಿಷ್ಠ 5 Notices — ಹಳೆಯ Notice Remove ಮಾಡಿ ಹೊಸದು ಕಾಣಿಸುತ್ತದೆ.</div>`:''}
    </div>`;
}

function postNotice(){
  const to=document.getElementById('nb_to').value;
  const text=document.getElementById('nb_text').value.trim();
  const fileEl=document.getElementById('nb_file');
  const file=fileEl?.files[0];
  if(!text){ showToast('⚠ ಸಂದೇಶ ಬರೆಯಿರಿ'); return; }

  const doPost=(fileData,fileName,fileType)=>{
    if(!DB.noticeBoard) DB.noticeBoard=[];
    const notice={
      id:uid(), to, toName:to==='all'?'All Staff':(STAFF.find(s=>s.hrmsId===to)?.name||to),
      fromName:CURRENT_USER.name, fromHrmsId:CURRENT_USER.hrmsId,
      text, fileData:fileData||null, fileName:fileName||null, fileType:fileType||null,
      createdAt:todayStr(), dismissedBy:[]
    };
    DB.noticeBoard.push(notice); saveDB();
    // Notify
    const targets=to==='all'?STAFF.filter(s=>s.role!=='principal'&&s.hrmsId!==CURRENT_USER.hrmsId):STAFF.filter(s=>s.hrmsId===to);
    targets.forEach(s=>pushNotification(s.name,'📌 Notice Board: '+text.slice(0,60)+(text.length>60?'...':'')));
    showToast('✅ Notice Post ಆಗಿದೆ — '+(to==='all'?'ಎಲ್ಲಾ Staff':''))
    navigate('noticeboard');
  };

  if(file){ const r=new FileReader(); r.onload=e=>doPost(e.target.result,file.name,file.type); r.readAsDataURL(file); }
  else doPost(null,null,null);
}

function downloadNoticFile(id){
  const n=DB.noticeBoard.find(x=>x.id===id); if(!n||!n.fileData) return;
  const a=document.createElement('a'); a.href=n.fileData; a.download=n.fileName||'notice'; a.click();
}

function renderStaffDocFiles(){
  if(!DB.staffFiles) DB.staffFiles=[];
  if(!DB.staffInward) DB.staffInward=[];
  const showBin=document.getElementById('sf_showbin')?.checked||false;
  const myFiles=DB.staffFiles.filter(f=>f.hrmsId===CURRENT_USER.hrmsId && !f.deleted);
  const binFiles=DB.staffFiles.filter(f=>f.hrmsId===CURRENT_USER.hrmsId && f.deleted);
  const myInbox=DB.staffInward.filter(m=>m.hrmsId===CURRENT_USER.hrmsId && m.status!=='Saved' && m.status!=='Acknowledged').sort((a,b)=>b.sentAt.localeCompare(a.sentAt));

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🗂️ ನನ್ನ ಫೈಲ್‌ಗಳು (My Files)</h2>
    <div class="desc">ನಿಮ್ಮ ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಆದೇಶ, KREIS ಆದೇಶ, ಶಿಕ್ಷಣ ಇಲಾಖೆ ಪತ್ರ, ಇತರ ಪತ್ರಗಳು ಇಲ್ಲಿ ಸೇರಿಸಿ — ಯಾವಾಗಲೂ ನೋಡಬಹುದು</div></div>

    ${myInbox.length?`<div class="panel" style="border:2px solid #e65100;">
      <h3>📥 ಹೊಸ ಸಂದೇಶಗಳು — Folder ಆಯ್ಕೆ ಮಾಡಿ Save ಮಾಡಿ (${myInbox.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ವಿಷಯ</th><th>ವಿಭಾಗ</th><th>ಕಳುಹಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
      <tbody>${myInbox.map(m=>`<tr>
        <td><b>${esc(m.subject)}</b>${m.body?`<div class="small-muted" style="font-size:10.5px;">${esc(m.body.slice(0,60))}</div>`:''}</td>
        <td style="font-size:11px;">${esc(STAFF_FILE_CATS.find(c=>c.key===m.category)?.label||m.category)}</td>
        <td style="font-size:11px;">${esc(m.sentBy)}</td>
        <td style="font-size:11px;">${fmtDate(m.sentAt)}</td>
        <td><span class="badge ${m.status==='Unread'?'badge-warn':'badge-info'}">${esc(m.status)}</span></td>
        <td class="actions-cell">
          ${m.fileData?`<button class="btn btn-sm btn-outline" onclick="downloadStaffInwardFile('${m.id}')">⬇</button>`:''}
          <select id="sf_folder_${m.id}" style="font-size:11px;padding:2px;">
            ${STAFF_FILE_CATS.filter(c=>c.key!=='notices').map(c=>`<option value="${c.key}" ${m.category===c.key?'selected':''}>${c.ic} ${c.label}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-primary" onclick="saveStaffInwardToFolder('${m.id}')">💾 Save</button>
        </td>
      </tr>`).join('')}</tbody></table></div>
    </div>`:''}

    <div class="panel"><h3>➕ ಹೊಸ ಫೈಲ್ Upload ಮಾಡಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಿಭಾಗ</label>
          <select id="sf_cat">
            ${STAFF_FILE_CATS.filter(c=>c.key!=='notices').map(c=>`<option value="${c.key}">${c.ic} ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ / ಆದೇಶ ಸಂಖ್ಯೆ <span class="req-star">*</span></label>
          <input id="sf_title" placeholder="ಉದಾ: GO No. ED 45/2026, KREIS Letter No..."></div>
        <div class="field"><label>ದಿನಾಂಕ</label>
          <input type="date" id="sf_date" value="${todayStr()}"></div>
        <div class="field"><label>📎 File Upload (PDF / Word / Excel)</label>
          <input type="file" id="sf_file" accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.png"
            style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveStaffFile()">💾 Save to My Files</button>
      </div>
    </div>

    ${STAFF_FILE_CATS.map(cat=>{
      const catFiles=myFiles.filter(f=>f.category===cat.key);
      if(!catFiles.length) return `<div class="panel" style="border-left:4px solid ${cat.color};"><h3>${cat.ic} ${cat.label} (0)</h3><div class="small-muted">ಯಾವ ಫೈಲ್ ಇಲ್ಲ.</div></div>`;
      return `<div class="panel" style="border-left:4px solid ${cat.color};">
        <h3>${cat.ic} ${cat.label} (${catFiles.length})</h3>
        <div class="table-wrap"><table><thead><tr>
          <th>#</th><th>ಶೀರ್ಷಿಕೆ</th><th>ದಿನಾಂಕ</th><th>Source</th><th>Action</th>
        </tr></thead>
        <tbody>${catFiles.slice().reverse().map((f,i)=>`<tr>
          <td>${catFiles.length-i}</td>
          <td><b>${esc(f.title)}</b></td>
          <td>${fmtDate(f.date||f.savedAt)}</td>
          <td style="font-size:11px;">${esc(f.fromName||CURRENT_USER.name)}</td>
          <td class="actions-cell">
            ${f.fileData?`<button class="btn btn-sm btn-gold" onclick="downloadStaffFile('${f.id}')">⬇ ${esc(f.fileName?.split('.').pop()?.toUpperCase()||'FILE')}</button>`:''}
            <button class="btn btn-sm btn-red" onclick="deleteStaffFile('${f.id}')">🗑</button>
          </td>
        </tr>`).join('')}
        </tbody></table></div>
      </div>`;
    }).join('')}

    <div class="panel">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" id="sf_showbin" ${showBin?'checked':''} onchange="renderStaffDocFiles()"> 🗑 Recycle Bin ತೋರಿಸಿ (${binFiles.length})
      </label>
      ${showBin?`<div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>ಶೀರ್ಷಿಕೆ</th><th>ವಿಭಾಗ</th><th>ಅಳಿಸಿದ ದಿನಾಂಕ</th><th>Action</th></tr></thead>
      <tbody>${binFiles.length?binFiles.map(f=>`<tr>
        <td><b>${esc(f.title)}</b></td>
        <td style="font-size:11px;">${esc(STAFF_FILE_CATS.find(c=>c.key===f.category)?.label||f.category)}</td>
        <td style="font-size:11px;">${fmtDate(f.deletedAt)}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-primary" onclick="restoreStaffFile('${f.id}')">♻️ Restore</button>
          <button class="btn btn-sm btn-red" onclick="permanentlyDeleteStaffFile('${f.id}')">❌ ಶಾಶ್ವತ ಅಳಿಸಿ</button>
        </td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="4">Recycle Bin ಖಾಲಿ ಇದೆ.</td></tr>`}</tbody></table></div>`:''}
    </div>`;
}

function saveStaffFile(){
  const cat=document.getElementById('sf_cat')?.value;
  const title=document.getElementById('sf_title')?.value?.trim();
  const date=document.getElementById('sf_date')?.value;
  const fileEl=document.getElementById('sf_file');
  const file=fileEl?.files[0];
  if(!title){ showToast('⚠ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ'); return; }
  const doSave=(fd,fn,ft)=>{
    if(!DB.staffFiles) DB.staffFiles=[];
    DB.staffFiles.push({
      id:uid(), hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
      category:cat, title, date, fileData:fd||null, fileName:fn||null, fileType:ft||null,
      fromName:CURRENT_USER.name, savedAt:todayStr()
    });
    saveDB(); showToast('✅ Save ಆಗಿದೆ: '+title); navigate('staffdocfiles');
  };
  if(file){ const r=new FileReader(); r.onload=e=>doSave(e.target.result,file.name,file.type); r.readAsDataURL(file); }
  else doSave(null,null,null);
}

function downloadStaffFile(id){
  const f=(DB.staffFiles||[]).find(x=>x.id===id); if(!f||!f.fileData) return;
  const a=document.createElement('a'); a.href=f.fileData; a.download=f.fileName||'file'; a.click();
}

function deleteStaffFile(id){
  if(!confirm('🗑 Recycle Bin ಗೆ ಸ್ಥಳಾಂತರಿಸುವುದೇ? (ಆಮೇಲೆ Restore ಮಾಡಬಹುದು)')) return;
  const f=(DB.staffFiles||[]).find(x=>x.id===id); if(!f) return;
  f.deleted=true; f.deletedAt=todayStr();
  logAudit('Delete','StaffFile',id,f.title);
  saveDB(); navigate('staffdocfiles');
}

function restoreStaffFile(id){
  const f=(DB.staffFiles||[]).find(x=>x.id===id); if(!f) return;
  f.deleted=false; f.deletedAt=null;
  logAudit('Edit','StaffFile',id,'Restored: '+f.title);
  saveDB(); showToast('♻️ Restore ಆಗಿದೆ'); navigate('staffdocfiles');
}

function permanentlyDeleteStaffFile(id){
  if(!confirm('⚠ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ? ಇದನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಲು ಆಗುವುದಿಲ್ಲ.')) return;
  const f=(DB.staffFiles||[]).find(x=>x.id===id);
  logAudit('Delete','StaffFile',id,'Permanently deleted: '+(f?.title||''));
  DB.staffFiles=(DB.staffFiles||[]).filter(x=>x.id!==id); saveDB(); navigate('staffdocfiles');
}

function renderMOD(){
  if(!DB.modEntries) DB.modEntries=[];
  const months=[...new Set(DB.modEntries.map(m=>m.month))].sort().reverse();

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 MOD ನೋಂದಣಿ (Month-wise)</h2>
    </div>

    ${CURRENT_USER.role==='principal'?`<div class="panel"><h3>➕ ಹೊಸ MOD Upload</h3>
      <div class="form-grid">
        <div class="field"><label>ತಿಂಗಳು / ವರ್ಷ <span class="req-star">*</span></label>
          <input id="mod_month" placeholder="ಉದಾ: September 2026" value="${new Date().toLocaleString('en',{month:'long'})} ${new Date().getFullYear()}"></div>
        <div class="field"><label>MOD ದಿನಾಂಕ (Default for all staff)</label>
          <input type="date" id="mod_date" value="${todayStr()}"></div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ</label>
          <input id="mod_title" placeholder="MOD Title / Instructions..."></div>
        <div class="field"><label>📎 Upload PDF (ಆದೇಶ) ಅಥವಾ Excel (Staff+Date List)</label>
          <input type="file" id="mod_file" accept=".pdf,.xlsx,.xls,.docx,.doc"
            style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          <div id="mod_file_info" style="font-size:11px;color:var(--muted);margin-top:3px;"></div>
        </div>
      </div>
      <div class="note" style="font-size:11px;">
        Excel format: Column A=Sl.No, Column B=Designation, Column C=Name (Staff Name), Column D=MOD Date<br>
        PDF upload ಮಾಡಿದರೆ ಎಲ್ಲಾ staff ಗೆ ಒಂದೇ ದಿನಾಂಕ ಅನ್ವಯಿಸುತ್ತದೆ.
      </div>
      <div id="mod_excel_preview" style="margin-top:10px;"></div>
      <div class="form-actions">
        <button class="btn btn-gold" onclick="previewMODExcel()">👁 Excel Preview</button>
        <button class="btn btn-primary" onclick="saveMOD()">✅ E-Sign & Send to All Staff</button>
      </div>
    </div>`:''}

    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h3 style="margin:0;">📋 MOD ಪಟ್ಟಿ (${DB.modEntries.length})</h3>
        ${DB.modEntries.length?`<button class="btn btn-sm btn-gold" onclick="downloadMODReport()">⬇ MOD Report Download</button>`:''}
      </div>
      ${!DB.modEntries.length?`<div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ MOD Entry ಇಲ್ಲ.</div>`:''}
      ${months.map(month=>{
        const mods=DB.modEntries.filter(m=>m.month===month);
        return `<div style="margin-bottom:16px;">
          <h4 style="color:var(--navy);border-bottom:1px solid var(--border);padding-bottom:6px;">${esc(month)}</h4>
          ${mods.map(mod=>{
            const ackCount=(mod.acknowledgements||[]).filter(a=>a.signed).length;
            const totalStaff=(mod.staffList||[]).length||(STAFF.filter(s=>s.role!=='principal').length);
            return `<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div>
                  <b>${esc(mod.title||'MOD — '+mod.month)}</b>
                  <div style="font-size:11px;color:var(--muted);margin-top:3px;">
                    Upload: ${fmtDate(mod.uploadedAt)} | ✅ Signed: ${ackCount}/${totalStaff}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${mod.fileData?`<button class="btn btn-sm btn-gold" onclick="downloadMODFile('${mod.id}')">⬇ ${esc((mod.fileName||'').split('.').pop().toUpperCase())}</button>`:''}
                  <button class="btn btn-sm btn-primary" onclick="viewMODAck('${mod.id}')">📋 Acknowledgement</button>
                </div>
              </div>
              ${mod.staffList?.length?`<div style="margin-top:8px;font-size:11px;">
                <b>Staff List:</b> ${mod.staffList.map(s=>`${s.name} (${fmtDate(s.modDate)})`).join(', ')}
              </div>`:''}
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
    </div>
    <div id="modAckPanel"></div>`;

  document.getElementById('mod_file')?.addEventListener('change', e=>{
    const f=e.target.files[0];
    const el=document.getElementById('mod_file_info');
    if(f&&el) el.innerHTML=`📎 <b>${f.name}</b> (${(f.size/1024).toFixed(1)} KB)`;
  });
}

function previewMODExcel(){
  const fileEl=document.getElementById('mod_file');
  const file=fileEl?.files[0];
  if(!file||!file.name.match(/\.xlsx?$/i)){ showToast('⚠ Excel file ಆಯ್ಕೆ ಮಾಡಿ (.xlsx/.xls)'); return; }
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{header:1});
    const rows=data.filter(r=>r.length>0).slice(0,20);
    const preview=document.getElementById('mod_excel_preview');
    if(!preview) return;
    preview.innerHTML=`<div class="panel" style="background:var(--surface-2);"><b>Excel Preview (ಮೊದಲ 20 ಸಾಲು):</b>
      <div class="table-wrap" style="margin-top:8px;"><table style="font-size:12px;"><thead>
        <tr><th>Sl.No</th><th>Designation</th><th>Name</th><th>MOD Date</th></tr>
      </thead><tbody>
        ${rows.map(r=>`<tr><td>${r[0]||''}</td><td>${r[1]||''}</td><td>${r[2]||''}</td><td>${r[3]||''}</td></tr>`).join('')}
      </tbody></table></div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;">✅ Column C (Name) ಅನ್ನು Staff ಮ್ಯಾಚ್ ಮಾಡಲಾಗುತ್ತದೆ</div>
    </div>`;
    window._modPreviewData=rows;
  };
  reader.readAsArrayBuffer(file);
}

function saveMOD(){
  const month=document.getElementById('mod_month')?.value?.trim();
  const defaultDate=document.getElementById('mod_date')?.value||todayStr();
  const title=document.getElementById('mod_title')?.value||'MOD — '+month;
  const fileEl=document.getElementById('mod_file');
  const file=fileEl?.files[0];
  if(!month){ showToast('⚠ ತಿಂಗಳು ನಮೂದಿಸಿ'); return; }

  const doSave=(fileData,fileName,fileType,staffList)=>{
    if(!DB.modEntries) DB.modEntries=[];
    const mod={
      id:uid(), month, title, defaultDate, fileData, fileName, fileType,
      staffList, uploadedBy:CURRENT_USER.name, uploadedAt:todayStr(),
      principalSigned:true, principalName:CURRENT_USER.name, principalSignedAt:todayStr(),
      status:'Sent to Staff', acknowledgements:[]
    };
    DB.modEntries.push(mod); saveDB();
    // Notify each staff
    const targets=staffList?.length?staffList:STAFF.filter(s=>s.role!=='principal');
    targets.forEach(s=>{
      const name=s.name||s.staffName;
      const modDate=s.modDate||defaultDate;
      pushNotification(name,
        '📋 MOD Scheduled: '+title+' | ದಿನಾಂಕ: '+fmtDate(modDate)+
        ' | 8 PM ನಂತರ GPS Photo ಸಮೇತ Sign ಮಾಡಿ | "MOD ಕರ್ತವ್ಯ" ನಲ್ಲಿ ನೋಡಿ'
      );
      // Add to notice board
      DB.noticeBoard.push({
        id:uid(), to:s.hrmsId||s.hrmsid||'all', toName:name,
        fromName:CURRENT_USER.name, fromHrmsId:CURRENT_USER.hrmsId,
        text:'📋 MOD: '+title+' — ದಿನಾಂಕ: '+fmtDate(modDate)+'\n8 PM ನಂತರ GPS Photo ಸಮೇತ ✅ Sign ಮಾಡಿ',
        fileData:null, fileName:null, createdAt:todayStr(), dismissedBy:[], isMod:true, modId:mod.id
      });
    });
    saveDB();
    showToast('✅ MOD E-Signed & '+targets.length+' staff ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
    navigate('mod');
  };

  // Parse Excel if provided
  if(file&&file.name.match(/\.xlsx?$/i)&&typeof XLSX!=='undefined'){
    const reader=new FileReader();
    reader.onload=e=>{
      const wb=XLSX.read(e.target.result,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(ws,{header:1}).filter(r=>r[2]);
      const staffList=data.slice(1).map(r=>{
        const nameInExcel=String(r[2]||'').trim();
        const matchedStaff=STAFF.find(s=>s.name.toLowerCase().includes(nameInExcel.toLowerCase())||nameInExcel.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
        return {
          slNo:r[0], designation:r[1]||'', name:nameInExcel,
          hrmsId:matchedStaff?.hrmsId||'', modDate:r[3]?parseExcelDate(r[3]):defaultDate
        };
      }).filter(s=>s.name);
      const reader2=new FileReader();
      reader2.onload=e2=>doSave(e2.target.result,file.name,file.type,staffList);
      reader2.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
  } else if(file){
    const reader=new FileReader();
    const allStaff=STAFF.filter(s=>s.role!=='principal').map(s=>({name:s.name,hrmsId:s.hrmsId,designation:s.desig||'',modDate:defaultDate}));
    reader.onload=e=>doSave(e.target.result,file.name,file.type,allStaff);
    reader.readAsDataURL(file);
  } else {
    const allStaff=STAFF.filter(s=>s.role!=='principal').map(s=>({name:s.name,hrmsId:s.hrmsId,designation:s.desig||'',modDate:defaultDate}));
    doSave(null,null,null,allStaff);
  }
}

function parseExcelDate(val){
  if(!val) return todayStr();
  if(typeof val==='number'){ const d=new Date((val-25569)*86400000); return d.toISOString().slice(0,10); }
  const s=String(val);
  const m=s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if(m){ const y=m[3].length===2?'20'+m[3]:m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  return todayStr();
}

function downloadMODFile(id){
  const mod=DB.modEntries.find(x=>x.id===id); if(!mod?.fileData) return;
  const a=document.createElement('a'); a.href=mod.fileData; a.download=mod.fileName||'MOD'; a.click();
}

function viewMODAck(id){
  const mod=DB.modEntries.find(x=>x.id===id); if(!mod) return;
  const acks=mod.acknowledgements||[];
  const staffList=mod.staffList||STAFF.filter(s=>s.role!=='principal').map(s=>({name:s.name,hrmsId:s.hrmsId,designation:s.desig,modDate:mod.defaultDate}));
  const panel=document.getElementById('modAckPanel');
  panel.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
      <h3 style="margin:0;">📋 ${esc(mod.title||mod.month)} — Acknowledgement</h3>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm btn-gold" onclick="downloadMODReport('${mod.id}')">⬇ Download Report</button>
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('modAckPanel').innerHTML=''">✕</button>
      </div>
    </div>
    <div class="table-wrap"><table><thead><tr>
      <th>Sl.</th><th>Designation</th><th>ಹೆಸರು</th><th>MOD ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Sign ಸಮಯ</th><th>GPS Photo</th>
    </tr></thead>
    <tbody>${staffList.map((s,i)=>{
      const ack=acks.find(a=>a.staffName===s.name||a.hrmsId===s.hrmsId)||{};
      return `<tr>
        <td>${s.slNo||i+1}</td>
        <td style="font-size:11px;">${esc(s.designation||'')}</td>
        <td><b>${esc(s.name)}</b></td>
        <td>${fmtDate(s.modDate)}</td>
        <td>${ack.signed?'<span class="badge badge-ok">✅ Signed</span>':'<span class="badge badge-warn">⏳ Pending</span>'}</td>
        <td style="font-size:11px;">${esc(ack.signedAt||'—')}</td>
        <td>${ack.gpsPhoto?`<img src="${ack.gpsPhoto}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="viewGPS('${mod.id}','${s.name}')">`:''}</td>
      </tr>`;
    }).join('')}
    </tbody></table></div>
  </div>`;
  panel.scrollIntoView({behavior:'smooth'});
}

function viewGPS(modId, staffName){
  const mod=DB.modEntries.find(x=>x.id===modId);
  const ack=(mod?.acknowledgements||[]).find(a=>a.staffName===staffName);
  if(!ack?.gpsPhoto) return;
  const w=window.open(''); w.document.write(`<img src="${ack.gpsPhoto}" style="max-width:100%;max-height:100vh;">`);
}

function downloadMODReport(modId){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const mods=modId?[DB.modEntries.find(x=>x.id===modId)].filter(Boolean):DB.modEntries;
  const header=['Sl.','Designation','ಹೆಸರು','MOD ದಿನಾಂಕ','ತಿಂಗಳು','ಸ್ಥಿತಿ','Sign ಸಮಯ','GPS Photo'];
  const rows=[];
  mods.forEach(mod=>{
    const staffList=mod.staffList||[];
    staffList.forEach((s,i)=>{
      const ack=(mod.acknowledgements||[]).find(a=>a.staffName===s.name)||{};
      rows.push([i+1,s.designation||'',s.name,s.modDate,mod.month,ack.signed?'Signed':'Pending',ack.signedAt||'—',ack.gpsPhoto?'Photo Uploaded':'—']);
    });
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'MOD Report');
  XLSX.writeFile(wb,'MOD_Report_'+todayStr()+'.xlsx');
  showToast('✅ MOD Report Downloaded');
}

function renderStaffMOD(){
  if(!DB.modEntries) DB.modEntries=[];
  const today=todayStr();
  const myMODs=DB.modEntries.filter(mod=>{
    const staffList=mod.staffList||[];
    return staffList.some(s=>s.hrmsId===CURRENT_USER.hrmsId||s.name===CURRENT_USER.name);
  });

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 MOD — ನನ್ನ ಕರ್ತವ್ಯ</h2>
    <div class="desc">Principal Schedule ಮಾಡಿದ MOD ದಿನಾಂಕ ಮತ್ತು Instructions ನೋಡಿ — 8 PM ನಂತರ GPS Photo ಸಮೇತ Sign ಮಾಡಿ</div></div>

    ${!myMODs.length?`<div class="panel"><div class="small-muted" style="text-align:center;padding:30px;">ಯಾವ MOD ಕರ್ತವ್ಯ Schedule ಆಗಿಲ್ಲ.</div></div>`:''}

    ${myMODs.map(mod=>{
      const staffEntry=(mod.staffList||[]).find(s=>s.hrmsId===CURRENT_USER.hrmsId||s.name===CURRENT_USER.name)||{};
      const myModDate=staffEntry.modDate||mod.defaultDate;
      const ack=(mod.acknowledgements||[]).find(a=>a.hrmsId===CURRENT_USER.hrmsId||a.staffName===CURRENT_USER.name)||{};
      const isPast=myModDate<=today;
      const isToday=myModDate===today;
      return `<div style="border:2px solid ${isToday?'var(--red)':isPast?'var(--gold)':'var(--border)'};border-radius:10px;padding:14px;margin-bottom:14px;background:${isToday?'#fff3f3':isPast?'#fffbf0':'var(--surface)'};">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <div>
            ${isToday?'<span class="badge" style="background:var(--red);color:#fff;animation:notifBlink 1s infinite;">🔴 ಇಂದು MOD!</span>':isPast?'<span class="badge badge-warn">⏰ ಹಿಂದಿನ MOD</span>':'<span class="badge badge-info">📅 ಮುಂಬರುವ</span>'}
            <b style="font-size:14px;color:var(--navy);margin-left:8px;">${esc(mod.title||mod.month)}</b>
          </div>
          ${mod.fileData?`<button class="btn btn-sm btn-gold" onclick="downloadMODFile('${mod.id}')">⬇ MOD Document</button>`:''}
        </div>
        <div style="font-size:12.5px;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
          <div class="kv"><b>ನನ್ನ MOD ದಿನಾಂಕ:</b> <b style="color:var(--navy)">${fmtDate(myModDate)}</b></div>
          <div class="kv"><b>Designation:</b> ${esc(staffEntry.designation||CURRENT_USER.desig||'')}</div>
          <div class="kv"><b>ತಿಂಗಳು:</b> ${esc(mod.month)}</div>
          <div class="kv"><b>Principal:</b> ✅ ${esc(mod.principalName||'')}</div>
        </div>
        ${ack.signed?`<div style="background:var(--green-tint);border:1px solid var(--green);border-radius:8px;padding:10px;font-size:12.5px;">
          ✅ <b>MOD Sign ಆಗಿದೆ</b> — ${esc(ack.signedAt)}<br>
          ${ack.gpsPhoto?`<img src="${ack.gpsPhoto}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;margin-top:6px;">`:''}</div>`:`
        ${isPast||isToday?`<div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;">
          <h4 style="margin-bottom:10px;">✅ MOD Complete ಮಾಡಿ Sign ಮಾಡಿ</h4>
          <div class="form-grid">
            <div class="field"><label>📸 GPS Photo Upload <span class="req-star">*</span></label>
              <input type="file" id="gps_${mod.id}" accept="image/*"
                style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
              <div style="font-size:10px;color:var(--muted);margin-top:3px;">📍 GPS ಸಮೇತ ಫೋಟೋ (ಕ್ಯಾಮೆರಾ GPS ON ಇಟ್ಟುಕೊಳ್ಳಿ) — 8 PM ನಂತರ ಮಾತ್ರ</div>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="signMOD('${mod.id}','${myModDate}')">✍️ Sign & GPS Photo ಕಳುಹಿಸಿ</button>
          </div>
        </div>`:`<div class="note">📅 MOD ದಿನಾಂಕ: <b>${fmtDate(myModDate)}</b> — ಆ ದಿನ 8 PM ನಂತರ Sign ಮಾಡಿ</div>`}
        `}
      </div>`;
    }).join('')}`;
}

function signMOD(modId, myModDate){
  // Check 8 PM
  const now=new Date();
  const hour=now.getHours();
  if(hour<20){ showToast('⚠ 8:00 PM (20:00) ನಂತರ ಮಾತ್ರ Sign ಮಾಡಬಹುದು. ಈಗ: '+String(hour).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')); return; }
  const fileEl=document.getElementById('gps_'+modId);
  const file=fileEl?.files[0];
  if(!file){ showToast('⚠ GPS Photo Upload ಮಾಡಿ (ಕಡ್ಡಾಯ)'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const mod=DB.modEntries.find(x=>x.id===modId); if(!mod) return;
    if(!mod.acknowledgements) mod.acknowledgements=[];
    const existing=mod.acknowledgements.findIndex(a=>a.hrmsId===CURRENT_USER.hrmsId||a.staffName===CURRENT_USER.name);
    const ackEntry={
      hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
      staffDesig:CURRENT_USER.desig||'', signed:true,
      signedAt:new Date().toLocaleString('en-IN'), gpsPhoto:e.target.result,
      gpsPhotoName:file.name, modDate:myModDate
    };
    if(existing>=0) mod.acknowledgements[existing]=ackEntry;
    else mod.acknowledgements.push(ackEntry);
    saveDB();
    // Notify Principal
    const p=STAFF.find(x=>x.role==='principal');
    if(p) pushNotification(p.name,'✅ MOD Sign: '+CURRENT_USER.name+' — '+mod.month+' | GPS Photo Uploaded | Acknowledgement Register ನಲ್ಲಿ ನೋಡಿ');
    staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ MOD: '+CURRENT_USER.name+' — Sign ಆಗಿದೆ ('+mod.month+')'));
    showToast('✅ MOD Sign ಆಗಿದೆ — GPS Photo Uploaded!');
    navigate('modstaffview');
  };
  reader.readAsDataURL(file);
}

function renderMODAcknowledge(){
  if(!DB.modEntries) DB.modEntries=[];
  const months=[...new Set(DB.modEntries.map(m=>m.month))].sort().reverse();

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✅ MOD Acknowledgement Register</h2>
    <div class="desc">Month-wise MOD Sign Register — GPS Photos ಸಮೇತ</div></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="btn btn-gold" onclick="downloadMODReport()">⬇ ಸಂಪೂರ್ಣ MOD Report Download</button>
    </div>
    ${months.map(month=>{
      const mods=DB.modEntries.filter(m=>m.month===month);
      const totalAck=mods.reduce((a,m)=>(m.acknowledgements||[]).filter(x=>x.signed).length+a,0);
      const totalStaff=mods.reduce((a,m)=>(m.staffList||[]).length+a,0);
      return `<div class="panel">
        <h3>${esc(month)} — ✅ ${totalAck}/${totalStaff} Signed</h3>
        ${mods.map(mod=>{
          const staffList=mod.staffList||[];
          const acks=mod.acknowledgements||[];
          const signedCount=acks.filter(a=>a.signed).length;
          return `<div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
              <b>${esc(mod.title||mod.month)}</b>
              <span class="badge ${signedCount===staffList.length?'badge-ok':'badge-warn'}">${signedCount}/${staffList.length} Signed</span>
            </div>
            <div class="table-wrap"><table style="font-size:12px;"><thead><tr>
              <th>Sl.</th><th>Designation</th><th>ಹೆಸರು</th><th>MOD ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Sign ಸಮಯ</th><th>GPS Photo</th>
            </tr></thead>
            <tbody>${staffList.map((s,i)=>{
              const ack=acks.find(a=>a.staffName===s.name||a.hrmsId===s.hrmsId)||{};
              return `<tr>
                <td>${s.slNo||i+1}</td>
                <td style="font-size:10px;">${esc(s.designation||'')}</td>
                <td><b>${esc(s.name)}</b></td>
                <td>${fmtDate(s.modDate)}</td>
                <td>${ack.signed?'<span class="badge badge-ok" style="font-size:10px;">✅</span>':'<span class="badge badge-warn" style="font-size:10px;">⏳</span>'}</td>
                <td style="font-size:10px;">${esc(ack.signedAt||'—')}</td>
                <td>${ack.gpsPhoto?`<img src="${ack.gpsPhoto}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="viewGPS('${mod.id}','${s.name}')">`:''}</td>
              </tr>`;
            }).join('')}
            </tbody></table></div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}
    ${!months.length?`<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ MOD Entry ಇಲ್ಲ.</div></div>`:''}`;
}

function renderSTI(){
  if(!DB.stiEntries) DB.stiEntries=[];
  const months=[...new Set(DB.stiEntries.map(e=>e.month))].sort().reverse();
  const allStaff=STAFF.filter(s=>s.role==='staff'||s.role==='warden');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📚 STI ನೋಂದಣಿ (Study Time Incharge)</h2>
    </div>

    ${CURRENT_USER.role==='principal'?`<div class="panel"><h3>➕ ಹೊಸ STI Duty ಹಂಚಿಕೆ</h3>
      <div class="form-grid">
        <div class="field"><label>ತಿಂಗಳು/ವರ್ಷ <span class="req-star">*</span></label>
          <input id="sti_month" placeholder="ಉದಾ: September 2026" value="${new Date().toLocaleString('en',{month:'long'})} ${new Date().getFullYear()}"></div>
        <div class="field"><label>ದಿನಾಂಕ <span class="req-star">*</span></label>
          <input type="date" id="sti_date" value="${todayStr()}"></div>
        <div class="field"><label>ಸ್ಟಡಿ ಟೈಮ್ ಸಿಬ್ಬಂದಿ <span class="req-star">*</span></label>
          <select id="sti_staff">${allStaff.map(s=>`<option value="${s.hrmsId}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ಸುತ್ತೋಲೆ ಪ್ರಕಾರ ಹುದ್ದೆ</label>
          <input id="sti_desig" placeholder="ಸುತ್ತೋಲೆ ಪ್ರಕಾರ ಹುದ್ದೆ..."></div>
        <div class="field"><label>ಟಿಪ್ಪಣಿ</label>
          <input id="sti_note" placeholder="ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿ..."></div>
      </div>
      <div class="note" style="font-size:11px;">Principal E-Sign ಮಾಡಿ Send ಮಾಡಿದಾಗ Staff ಗೆ Notification ಹೋಗುತ್ತದೆ. ಆ ದಿನ 8 PM ನಂತರ Staff 2 GPS Photos ಸಮೇತ Sign ಮಾಡಬೇಕು.</div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="createSTIDuty()">✅ E-Sign & Staff ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ಈ ತಿಂಗಳ STI List — Bulk Add</h3>
      <p style="font-size:12px;color:var(--muted);">ಒಂದೇ ಬಾರಿ ತಿಂಗಳ ಎಲ್ಲಾ ದಿನಗಳಿಗೆ Duty ಹಂಚಲು ಕೆಳಗೆ Excel Upload ಮಾಡಿ</p>
      <div class="field"><label>📎 STI Excel Upload (Sl.No | Date | Day | Designation | Name)</label>
        <input type="file" id="sti_excel" accept=".xlsx,.xls" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
      </div>
      <div class="form-actions">
        <button class="btn btn-gold" onclick="importSTIExcel()">📥 Excel Import & Send to All</button>
      </div>
      <div id="sti_import_preview"></div>
    </div>`:''}

    <div class="panel">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <h3 style="margin:0;">📋 STI ಪಟ್ಟಿ (${DB.stiEntries.length})</h3>
        ${DB.stiEntries.length?`<div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-gold" onclick="downloadSTIReport('excel')">⬇ Excel Report</button>
          <button class="btn btn-sm btn-outline" onclick="printSTIRegister()">🖨️ Print/PDF</button>
        </div>`:''}
      </div>
      ${months.length?months.map(month=>{
        const entries=DB.stiEntries.filter(e=>e.month===month);
        const signed=entries.filter(e=>e.staffSigned).length;
        return `<div style="margin-bottom:12px;">
          <h4 style="color:var(--navy);border-bottom:1px solid var(--border);padding-bottom:4px;">${esc(month)} — ${signed}/${entries.length} ✅</h4>
          <div class="table-wrap"><table style="font-size:12px;"><thead><tr>
            <th>Sl.</th><th>ದಿನಾಂಕ</th><th>ವಾರ</th><th>ಹುದ್ದೆ</th><th>ಸಿಬ್ಬಂದಿ</th><th>Principal Sign</th><th>Staff Sign</th><th>GPS</th><th>Action</th>
          </tr></thead>
          <tbody>${entries.sort((a,b)=>a.dutyDate.localeCompare(b.dutyDate)).map((e,i)=>`<tr>
            <td>${e.slNo||i+1}</td>
            <td>${fmtDate(e.dutyDate)}</td>
            <td>${getDayName(e.dutyDate)}</td>
            <td style="font-size:10px;">${esc(e.designation||'')}</td>
            <td><b>${esc(e.staffName)}</b></td>
            <td>${e.principalSigned?`<span class="badge badge-ok" style="font-size:9px;">✅ ${esc(e.principalName||'')}</span>`:'<span class="badge badge-warn" style="font-size:9px;">⏳</span>'}</td>
            <td>${e.staffSigned?`<span class="badge badge-ok" style="font-size:9px;">✅ ${esc(e.staffSignedAt||'')}</span>`:'<span class="badge badge-warn" style="font-size:9px;">⏳</span>'}</td>
            <td>${e.gpsPhoto1?`<img src="${e.gpsPhoto1}" style="width:35px;height:35px;object-fit:cover;border-radius:3px;cursor:pointer;" onclick="viewSTIGPS('${e.id}',1)">`:''} ${e.gpsPhoto2?`<img src="${e.gpsPhoto2}" style="width:35px;height:35px;object-fit:cover;border-radius:3px;cursor:pointer;" onclick="viewSTIGPS('${e.id}',2)">`:''}</td>
            <td>${CURRENT_USER.role==='principal'&&!e.principalSigned?`<button class="btn btn-sm btn-red" onclick="deleteSTIEntry('${e.id}')">🗑</button>`:''}
              ${(CURRENT_USER.role==='principal'||CURRENT_USER.role==='fda')&&e.staffSigned?`<button class="btn btn-sm btn-outline" onclick="viewSTIDetail('${e.id}')">👁</button>`:''}
            </td>
          </tr>`).join('')}
          </tbody></table></div>
        </div>`;
      }).join('') : `<div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ STI Entry ಇಲ್ಲ.</div>`}
    </div>
    <div id="stiPrintArea"></div>`;
}

function getDayName(dateStr){
  if(!dateStr) return '';
  const days=['ಭಾನು','ಸೋಮ','ಮಂಗಳ','ಬುಧ','ಗುರು','ಶುಕ್ರ','ಶನಿ'];
  return days[new Date(dateStr).getDay()];
}

function createSTIDuty(){
  const month=document.getElementById('sti_month')?.value?.trim();
  const dutyDate=document.getElementById('sti_date')?.value;
  const staffHrmsId=document.getElementById('sti_staff')?.value;
  const designation=document.getElementById('sti_desig')?.value||'';
  const note=document.getElementById('sti_note')?.value||'';
  if(!month||!dutyDate||!staffHrmsId){ showToast('⚠ ತಿಂಗಳು, ದಿನಾಂಕ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const s=STAFF.find(x=>x.hrmsId===staffHrmsId); if(!s) return;
  const slNo=(DB.stiEntries||[]).filter(e=>e.month===month).length+1;
  addSTIEntry(slNo,month,dutyDate,s,designation,note);
  showToast('✅ STI Duty: '+s.name+' — '+fmtDate(dutyDate));
  navigate('sti');
}

function addSTIEntry(slNo,month,dutyDate,staffObj,designation,note){
  if(!DB.stiEntries) DB.stiEntries=[];
  const entry={
    id:uid(), slNo, month, dutyDate, staffName:staffObj.name,
    staffHrmsId:staffObj.hrmsId, staffDesig:staffObj.desig||'',
    designation, note,
    principalSigned:true, principalName:CURRENT_USER.name, principalSignedAt:todayStr(),
    staffSigned:false, staffSignedAt:null,
    gpsPhoto1:null, gpsPhoto2:null, createdAt:todayStr(), createdBy:CURRENT_USER.name
  };
  DB.stiEntries.push(entry); saveDB();
  // Notify staff
  pushNotification(staffObj.name,
    '📚 STI Duty: ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್ | ದಿನಾಂಕ: '+fmtDate(dutyDate)+
    ' | 8 PM ನಂತರ 2 GPS Photos ಸಮೇತ Sign ಮಾಡಿ | "STI ಕರ್ತವ್ಯ" ನಲ್ಲಿ ನೋಡಿ'
  );
  // Add to notice board
  DB.noticeBoard.push({
    id:uid(), to:staffObj.hrmsId, toName:staffObj.name,
    fromName:CURRENT_USER.name, fromHrmsId:CURRENT_USER.hrmsId,
    text:'📚 STI Duty: '+fmtDate(dutyDate)+' — ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್\n8 PM ನಂತರ 2 GPS Photos ಸಮೇತ Sign ಮಾಡಿ',
    fileData:null, fileName:null, createdAt:todayStr(), dismissedBy:[]
  });
  saveDB();
}

function importSTIExcel(){
  const fileEl=document.getElementById('sti_excel');
  const file=fileEl?.files[0];
  if(!file){ showToast('⚠ Excel file ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const month=document.getElementById('sti_month')?.value||new Date().toLocaleString('en',{month:'long'})+' '+new Date().getFullYear();
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{header:1,raw:false});
    let count=0;
    const preview=[];
    data.forEach((row,idx)=>{
      if(idx<3||!row[1]||!row[4]) return;
      const dateVal=row[1]; let dateStr='';
      if(dateVal&&dateVal.includes('/')){
        const parts=dateVal.split('/');
        dateStr=parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0');
      } else if(dateVal&&dateVal.includes('-')){ dateStr=dateVal; }
      else return;
      const nameInExcel=String(row[4]||'').trim();
      if(!nameInExcel) return;
      const matchedStaff=STAFF.find(s=>s.name.toLowerCase().includes(nameInExcel.toLowerCase().split(' ')[0])||nameInExcel.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
      if(matchedStaff){
        addSTIEntry(row[0]||count+1, month, dateStr, matchedStaff, row[3]||'', '');
        count++;
        preview.push(`${fmtDate(dateStr)} → ${matchedStaff.name}`);
      }
    });
    document.getElementById('sti_import_preview').innerHTML=count?
      `<div class="note" style="background:var(--green-tint);border-color:var(--green);">✅ ${count} ದಿನಗಳ STI Duty Import ಆಯಿತು:<br>${preview.slice(0,10).join(' | ')}${preview.length>10?`... +${preview.length-10} more`:''}</div>`:
      `<div class="note">⚠ Staff Name ಮ್ಯಾಚ್ ಆಗಲಿಲ್ಲ. Excel Column E ನಲ್ಲಿ Staff Name ಸರಿಯಾಗಿ ಇದೆಯೇ?</div>`;
  };
  reader.readAsArrayBuffer(file);
}

function deleteSTIEntry(id){
  if(!confirm('ಅಳಿಸುವುದೇ?')) return;
  DB.stiEntries=(DB.stiEntries||[]).filter(x=>x.id!==id); saveDB(); navigate('sti');
}

function renderMySTI(){
  if(!DB.stiEntries) DB.stiEntries=[];
  const today=todayStr();
  const mySTIs=DB.stiEntries.filter(e=>e.staffHrmsId===CURRENT_USER.hrmsId);
  const pending=mySTIs.filter(e=>!e.staffSigned&&e.dutyDate<=today);
  const upcoming=mySTIs.filter(e=>!e.staffSigned&&e.dutyDate>today);
  const done=mySTIs.filter(e=>e.staffSigned);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📚 STI ಕರ್ತವ್ಯ (Study Time Incharge)</h2>
    <div class="desc">Principal ಹಂಚಿದ ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್ Duty — 8 PM ನಂತರ 2 GPS Photos ಸಮೇತ Sign ಮಾಡಿ</div></div>

    ${pending.map(e=>`<div style="border:2px solid ${e.dutyDate===today?'var(--red)':'var(--gold)'};border-radius:10px;padding:14px;margin-bottom:14px;background:${e.dutyDate===today?'#fff3f3':'#fffbf0'};">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div>
          ${e.dutyDate===today?'<span class="badge" style="background:var(--red);color:#fff;animation:notifBlink 1s infinite;">🔴 ಇಂದು STI!</span>':'<span class="badge badge-warn">⏰ Sign ಮಾಡಿ</span>'}
          <b style="font-size:14px;color:var(--navy);margin-left:6px;">📚 ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್</b>
        </div>
      </div>
      <div style="font-size:12.5px;margin-bottom:12px;">
        <b>ದಿನಾಂಕ:</b> ${fmtDate(e.dutyDate)} (${getDayName(e.dutyDate)})<br>
        <b>ತಿಂಗಳು:</b> ${esc(e.month)}<br>
        <b>Principal E-Sign:</b> ✅ ${esc(e.principalName||'')}<br>
        ${e.designation?`<b>ಹುದ್ದೆ:</b> ${esc(e.designation)}`:''}
      </div>
      ${e.dutyDate<=today?`<div style="border-top:1px solid var(--border);padding-top:12px;">
        <h4 style="margin-bottom:8px;">✍️ STI Duty ಮುಗಿಸಿ Sign ಮಾಡಿ (8 PM ನಂತರ ಮಾತ್ರ)</h4>
        <div class="form-grid">
          <div class="field"><label>📸 GPS Photo 1 <span class="req-star">*</span></label>
            <input type="file" id="sti_gps1_${e.id}" accept="image/*" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          </div>
          <div class="field"><label>📸 GPS Photo 2 <span class="req-star">*</span></label>
            <input type="file" id="sti_gps2_${e.id}" accept="image/*" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="signSTIDuty('${e.id}')">✍️ Sign & 2 GPS Photos ಕಳುಹಿಸಿ</button>
        </div>
      </div>`:`<div class="note">📅 ${fmtDate(e.dutyDate)} ದಿನ 8 PM ನಂತರ Sign ಮಾಡಿ</div>`}
    </div>`).join('')}

    ${upcoming.length?`<div class="panel"><h3>📅 ಮುಂಬರುವ STI Duty (${upcoming.length})</h3>
      ${upcoming.sort((a,b)=>a.dutyDate.localeCompare(b.dutyDate)).map(e=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
        <div><b>${fmtDate(e.dutyDate)}</b> (${getDayName(e.dutyDate)}) — ${esc(e.month)}<br>
        <span style="font-size:11px;color:var(--muted);">Principal: ${esc(e.principalName||'')}</span></div>
        <span class="badge badge-info">ಮುಂಬರುವ</span>
      </div>`).join('')}
    </div>`:''}

    ${done.length?`<div class="panel"><h3>✅ ಪೂರ್ಣ STI Duty (${done.length})</h3>
      <div class="table-wrap"><table style="font-size:12px;"><thead><tr><th>ದಿನಾಂಕ</th><th>Sign ಸಮಯ</th><th>GPS Photos</th></tr></thead>
      <tbody>${done.sort((a,b)=>b.dutyDate.localeCompare(a.dutyDate)).map(e=>`<tr>
        <td>${fmtDate(e.dutyDate)}</td>
        <td style="font-size:10px;">${esc(e.staffSignedAt||'')}</td>
        <td>${e.gpsPhoto1?`<img src="${e.gpsPhoto1}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">`:''} ${e.gpsPhoto2?`<img src="${e.gpsPhoto2}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">`:''}</td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>`:''}

    ${!mySTIs.length?`<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ STI Duty Schedule ಆಗಿಲ್ಲ.</div></div>`:''}`;
}

function stiCompressPhoto(file,maxDim=900,q=0.6){
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onerror=()=>reject(new Error('ಫೋಟೋ ಓದಲಾಗಲಿಲ್ಲ'));
    fr.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('ಇದು ಫೋಟೋ ಅಲ್ಲ / ತೆರೆಯಲಾಗಲಿಲ್ಲ'));
      img.onload=()=>{
        try{
          let w=img.width,h=img.height;
          const sc=Math.min(1,maxDim/Math.max(w,h));
          w=Math.round(w*sc); h=Math.round(h*sc);
          const c=document.createElement('canvas'); c.width=w; c.height=h;
          c.getContext('2d').drawImage(img,0,0,w,h);
          resolve(c.toDataURL('image/jpeg',q));
        }catch(err){ reject(err); }
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

async function signSTIDuty(id){
  try{
    const hour=new Date().getHours();
    if(hour<20){ showToast('⚠ 8:00 PM (20:00) ನಂತರ ಮಾತ್ರ Sign ಮಾಡಬಹುದು. ಈಗ: '+String(hour).padStart(2,'0')+':00'); return; }
    const gps1El=document.getElementById('sti_gps1_'+id);
    const gps2El=document.getElementById('sti_gps2_'+id);
    if(!gps1El?.files[0]||!gps2El?.files[0]){ showToast('⚠ 2 GPS Photos ಕಡ್ಡಾಯ — ಎರಡೂ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
    const entry=(DB.stiEntries||[]).find(x=>x.id===id);
    if(!entry){ showToast('❌ STI Entry ಸಿಗಲಿಲ್ಲ — ಪುಟ ರಿಫ್ರೆಶ್ ಮಾಡಿ',8000); return; }
    showToast('⏳ ಫೋಟೋ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…',4000);
    const [p1,p2]=await Promise.all([stiCompressPhoto(gps1El.files[0]),stiCompressPhoto(gps2El.files[0])]);
    entry.staffSigned=true; entry.staffSignedAt=new Date().toLocaleString('en-IN');
    entry.gpsPhoto1=p1; entry.gpsPhoto2=p2;
    try{ saveDB(); }catch(err){ console.error(err); }
    const p=STAFF.find(x=>x.role==='principal');
    if(p) pushNotification(p.name,'✅ STI Sign: '+CURRENT_USER.name+' — '+fmtDate(entry.dutyDate)+' | GPS Photos Uploaded | STI Register ನಲ್ಲಿ ನೋಡಿ');
    staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ STI: '+CURRENT_USER.name+' — '+fmtDate(entry.dutyDate)+' Sign ಆಗಿದೆ'));
    showToast('✅ STI Duty Sign ಆಗಿದೆ — 2 GPS Photos Uploaded!');
    navigate('mystistaffview');
  }catch(err){
    console.error(err);
    showToast('❌ Sign ಆಗಲಿಲ್ಲ: '+(err&&err.message||err),10000);
  }
}

function viewSTIGPS(id, photoNum){
  const e=DB.stiEntries.find(x=>x.id===id);
  const photo=photoNum===1?e?.gpsPhoto1:e?.gpsPhoto2;
  if(!photo) return;
  const w=window.open(''); w.document.write(`<img src="${photo}" style="max-width:100%;max-height:100vh;">`);
}

function viewSTIDetail(id){
  const e=DB.stiEntries.find(x=>x.id===id); if(!e) return;
  const wrap=document.getElementById('stiPrintArea');
  if(!wrap) return;
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--green);">
    <h3>${esc(e.staffName)} — STI: ${fmtDate(e.dutyDate)}</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;font-size:13px;">
      <div class="kv"><b>ದಿನಾಂಕ:</b> ${fmtDate(e.dutyDate)}</div>
      <div class="kv"><b>ತಿಂಗಳು:</b> ${esc(e.month)}</div>
      <div class="kv"><b>Principal E-Sign:</b> ✅ ${esc(e.principalName||'')}</div>
      <div class="kv"><b>Staff Sign:</b> ✅ ${esc(e.staffSignedAt||'')}</div>
    </div>
    <div style="display:flex;gap:10px;">
      ${e.gpsPhoto1?`<div><b>GPS Photo 1:</b><br><img src="${e.gpsPhoto1}" style="width:150px;height:150px;object-fit:cover;border-radius:8px;"></div>`:''}
      ${e.gpsPhoto2?`<div><b>GPS Photo 2:</b><br><img src="${e.gpsPhoto2}" style="width:150px;height:150px;object-fit:cover;border-radius:8px;"></div>`:''}
    </div>
    <div class="form-actions"><button class="btn btn-outline" onclick="document.getElementById('stiPrintArea').innerHTML=''">✕</button></div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function renderSTIRegister(){
  if(!DB.stiEntries) DB.stiEntries=[];
  const months=[...new Set(DB.stiEntries.map(e=>e.month))].sort().reverse();

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📊 STI Register (Principal & FDA)</h2>
    <div class="desc">Study Time Incharge Register — GPS Photos ಸಮೇತ</div></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="btn btn-gold" onclick="downloadSTIReport('excel')">⬇ Excel Report</button>
      <button class="btn btn-outline" onclick="printSTIRegister()">🖨️ Print/PDF</button>
    </div>
    ${months.map(month=>{
      const entries=DB.stiEntries.filter(e=>e.month===month).sort((a,b)=>a.dutyDate.localeCompare(b.dutyDate));
      const signed=entries.filter(e=>e.staffSigned).length;
      return `<div class="panel">
        <h3>${esc(month)} — ✅ ${signed}/${entries.length} Signed</h3>
        <div class="table-wrap"><table style="font-size:11px;"><thead><tr>
          <th>Sl.</th><th>ದಿನಾಂಕ</th><th>ವಾರ</th><th>ಹುದ್ದೆ</th><th>ಸಿಬ್ಬಂದಿ</th><th>Principal E-Sign</th><th>Staff Sign</th><th>ಸಮಯ</th><th>GPS 1</th><th>GPS 2</th>
        </tr></thead>
        <tbody>${entries.map((e,i)=>`<tr>
          <td>${e.slNo||i+1}</td>
          <td>${fmtDate(e.dutyDate)}</td>
          <td>${getDayName(e.dutyDate)}</td>
          <td style="font-size:9px;">${esc(e.designation||'')}</td>
          <td><b>${esc(e.staffName)}</b></td>
          <td>${e.principalSigned?`<span style="color:var(--green);font-size:9px;">✅ ${esc(e.principalName||'')}</span>`:'⏳'}</td>
          <td>${e.staffSigned?'<span style="color:var(--green);font-size:9px;">✅</span>':'<span style="color:var(--red);">⏳</span>'}</td>
          <td style="font-size:9px;">${esc(e.staffSignedAt||'—')}</td>
          <td>${e.gpsPhoto1?`<img src="${e.gpsPhoto1}" style="width:40px;height:40px;object-fit:cover;border-radius:3px;cursor:pointer;" onclick="viewSTIGPS('${e.id}',1)">`:''}</td>
          <td>${e.gpsPhoto2?`<img src="${e.gpsPhoto2}" style="width:40px;height:40px;object-fit:cover;border-radius:3px;cursor:pointer;" onclick="viewSTIGPS('${e.id}',2)">`:''}</td>
        </tr>`).join('')}
        </tbody></table></div>
      </div>`;
    }).join('')}
    ${!months.length?`<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಯಾವ STI Entry ಇಲ್ಲ.</div></div>`:''}
    <div id="stiPrintArea"></div>`;
}

function downloadSTIReport(type){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const entries=(DB.stiEntries||[]).sort((a,b)=>a.month.localeCompare(b.month)||a.dutyDate.localeCompare(b.dutyDate));
  const header=['Sl.','ತಿಂಗಳು','ದಿನಾಂಕ','ವಾರ','ಹುದ್ದೆ','ಸಿಬ್ಬಂದಿ ಹೆಸರು','Principal E-Sign','Staff Sign','Sign ಸಮಯ','GPS Photo 1','GPS Photo 2'];
  const rows=entries.map((e,i)=>[
    e.slNo||i+1, e.month, e.dutyDate, getDayName(e.dutyDate), e.designation||'',
    e.staffName, e.principalSigned?'✅ '+e.principalName:'⏳',
    e.staffSigned?'✅':'⏳', e.staffSignedAt||'—',
    e.gpsPhoto1?'Photo Uploaded':'—', e.gpsPhoto2?'Photo Uploaded':'—'
  ]);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([
    ['ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265) — STI (ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್) Register'],
    [], header, ...rows
  ]);
  ws['!cols']=header.map(()=>({wch:20}));
  XLSX.utils.book_append_sheet(wb,ws,'STI Register');
  XLSX.writeFile(wb,'STI_Register_'+todayStr()+'.xlsx');
  showToast('✅ STI Excel Report Download ಆಯಿತು');
}

function printSTIRegister(){
  const entries=(DB.stiEntries||[]).sort((a,b)=>a.dutyDate.localeCompare(b.dutyDate));
  const months=[...new Set(entries.map(e=>e.month))];
  const html=`<div class="letterhead-paper" id="printArea">
    <div class="lh-top"><div class="lh-org">
      <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
      ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)<br>
      <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320
    </div></div>
    <div style="text-align:center;font-size:14px;font-weight:800;margin:8px 0;">STI (ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್) ನೋಂದಣಿ</div>
    ${months.map(month=>{
      const mes=entries.filter(e=>e.month===month);
      return `<b style="font-size:13px;">${esc(month)}</b>
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px;">
        <thead><tr style="background:#1a3a5c;color:#fff;">
          <th style="padding:3px 5px;">Sl.</th><th style="padding:3px 5px;">ದಿನಾಂಕ</th><th style="padding:3px 5px;">ವಾರ</th><th style="padding:3px 5px;">ಹುದ್ದೆ</th><th style="padding:3px 5px;">ಸಿಬ್ಬಂದಿ ಹೆಸರು</th><th style="padding:3px 5px;">Principal Sign</th><th style="padding:3px 5px;">Staff Sign</th><th style="padding:3px 5px;">ಸಮಯ</th>
        </tr></thead>
        <tbody>${mes.map((e,i)=>`<tr style="${i%2?'background:#f8f8f8':''}">
          <td style="padding:3px 5px;">${e.slNo||i+1}</td>
          <td style="padding:3px 5px;">${fmtDate(e.dutyDate)}</td>
          <td style="padding:3px 5px;">${getDayName(e.dutyDate)}</td>
          <td style="padding:3px 5px;font-size:9px;">${esc(e.designation||'')}</td>
          <td style="padding:3px 5px;font-weight:700;">${esc(e.staffName)}</td>
          <td style="padding:3px 5px;color:green;">${e.principalSigned?'✅':''}</td>
          <td style="padding:3px 5px;color:${e.staffSigned?'green':'red'};">${e.staffSigned?'✅':'⏳'}</td>
          <td style="padding:3px 5px;font-size:9px;">${esc(e.staffSignedAt||'')}</td>
        </tr>`).join('')}
        </tbody>
      </table>`;
    }).join('')}
  </div>`;
  const wrap=document.getElementById('stiPrintArea'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel"><button class="btn btn-gold" onclick="window.print()">🖨️ Print/PDF</button><button class="btn btn-outline" onclick="document.getElementById('stiPrintArea').innerHTML=''">✕</button>${html}</div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function downloadStaffInwardFile(id){
  const m=(DB.staffInward||[]).find(x=>x.id===id); if(!m||!m.fileData) return;
  if(m.status==='Unread') m.status='Opened', m.openedAt=todayStr();
  m.downloadedAt=todayStr();
  const a=document.createElement('a'); a.href=m.fileData; a.download=m.fileName||'document'; a.click();
  saveDB();
  renderStaffDocFiles();
}

function saveStaffInwardToFolder(id){
  const m=(DB.staffInward||[]).find(x=>x.id===id); if(!m) return;
  const folder=document.getElementById('sf_folder_'+id)?.value || m.category;
  if(!DB.staffFiles) DB.staffFiles=[];
  DB.staffFiles.push({
    id:uid(), hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
    category:folder, title:m.subject, date:m.sentAt, fileData:m.fileData||null, fileName:m.fileName||null,
    fromName:m.sentBy, savedAt:todayStr(), deleted:false
  });
  m.status='Saved'; m.savedAt=todayStr(); m.savedFolder=folder;
  logAudit('Edit','StaffInward',id,'Saved to folder: '+folder);
  saveDB();
  showToast('✅ '+esc(STAFF_FILE_CATS.find(c=>c.key===folder)?.label||folder)+' ಗೆ Save ಆಗಿದೆ');
  renderStaffDocFiles();
}

;(window.__LOADED=window.__LOADED||[]).push('administration');
