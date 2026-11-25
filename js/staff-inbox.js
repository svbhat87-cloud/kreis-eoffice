/* =====================================================================
   KREIS e-Office — staff-inbox.js
   ಸಿಬ್ಬಂದಿ / ವಾರ್ಡನ್ / FDA ಲಾಗಿನ್: "ನಿಮ್ಮ ಸಹಿ / ಕ್ರಮಕ್ಕಾಗಿ ಬಂದಿರುವ ಸಂದೇಶಗಳು" (NIC e-Office "Pending for action" ಶೈಲಿ)
   Dashboard table of everything that is waiting for THIS user's signature / action.
   ===================================================================== */
(window.__LOADED=window.__LOADED||[]).push('staff-inbox');

function staffPendingItems(){
  const me=CURRENT_USER; if(!me) return [];
  const out=[], add=(ic,kind,title,from,at,page,action)=>out.push({ic,kind,title:String(title||'').trim(),from:from||'',at:at||'',page,action:action||'ಸಹಿ ಮಾಡಿ'});
  const mine=x=>x===me.name;
  // 1. Duty orders (Principal-signed, waiting for my E-Sign)
  (DB.dutyAllotments||[]).filter(d=>d.staffHrmsId===me.hrmsId&&(d.status==='Sent to Staff'||d.status==='Staff Acknowledged')&&!d.staffSigned&&d.active)
    .forEach(d=>add('📋','ಕರ್ತವ್ಯ ಆದೇಶ',(d.orderNo||'')+' — '+(d.dutyType||''),d.principalName||'Principal',d.principalSignedAt||d.createdAt,'myduties'));
  // 2. Inward letters assigned to me
  (DB.inward||[]).filter(i=>i.status==='Sent to Staff'&&mine(i.assignedStaff))
    .forEach(i=>add('📥','ಒಳಬರುವ ಪತ್ರ',(i.inwardNo||'')+' — '+(i.subject||''),'FDA',i.assignedAt||i.receivedDate,'inward','ತೆರೆಯಿರಿ'));
  // 3. Letters / messages addressed to me
  (DB.outward||[]).filter(o=>o.status==='Sent to Staff'&&mine(o.toStaff))
    .forEach(o=>add('📤','ಪತ್ರ (ಸಹಿ/ಉತ್ತರ)',o.subject||'',o.createdBy||'FDA',o.createdAt||o.date,'outward'));
  (DB.messages||[]).filter(m=>m.status==='Sent to Staff'&&mine(m.toStaff))
    .forEach(m=>add('💬','ಆಂತರಿಕ ಸಂದೇಶ',m.subject||m.text||'ಸಂದೇಶ',m.createdBy||m.fromName||'FDA',m.createdAt||m.sentAt,'messages'));
  // 4. Salary slips not yet acknowledged
  (DB.salarySlips||[]).filter(s=>s.hrmsId===me.hrmsId&&s.status!=='Acknowledged')
    .forEach(s=>add('💰','ಸಂಬಳ ಚೀಟಿ',(typeof salaryMonthLabel==='function'?salaryMonthLabel(s.month):s.month)+' — ಸ್ವೀಕೃತಿ ಬಾಕಿ','FDA',s.uploadedAt,'mysalary','ಸ್ವೀಕರಿಸಿ'));
  // 5. MOD duty — date reached, not yet signed
  (DB.modEntries||[]).forEach(mod=>{
    const se=(mod.staffList||[]).find(s=>s.hrmsId===me.hrmsId||s.name===me.name); if(!se) return;
    const d=se.modDate||mod.defaultDate; if(!d||d>todayStr()) return;
    const ack=(mod.acknowledgements||[]).find(a=>a.hrmsId===me.hrmsId||a.staffName===me.name);
    if(!(ack&&ack.signed)) add('📋','MOD ಕರ್ತವ್ಯ',(mod.title||mod.month||'')+' — '+fmtDate(d),'Principal',d,'modstaffview');
  });
  // 6. Staff-meeting minutes waiting for my signature
  (DB.meetings||[]).filter(m=>m.status==='Staff Signing'&&m.staffSignatures&&m.staffSignatures[me.name]&&!m.staffSignatures[me.name].signed)
    .forEach(m=>add('🏛️','ಸಭೆ ಮಿನಿಟ್ಸ್',(m.title||m.subject||'ಸಭೆ')+(m.date?' — '+fmtDate(m.date):''),m.createdBy||'FDA',m.sentAt||m.date,'mtgsign'));
  // 7. Class teacher: progress cards and marks to verify
  if(me.role==='staff'){
    (DB.progressCards||[]).filter(c=>c.status==='Sent to Class Teacher'&&(DB.classTeacherAllocation||{})[c.className]===me.name)
      .forEach(c=>add('📄','ಪ್ರಗತಿ ಪತ್ರಿಕೆ',(c.studentName||'')+' ('+c.className+'ನೇ)','FDA',c.generatedAt,'pcsign'));
    const g={}; (DB.marks||[]).filter(m=>m.status==='Submitted'&&(DB.classTeacherAllocation||{})[m.className]===me.name&&m.createdBy!==me.name).forEach(m=>{ const k=m.className+'|'+m.examName; (g[k]=g[k]||{c:m.className,e:m.examName,n:0,at:m.submittedAt||m.updatedAt||''}).n++; });
    Object.values(g).forEach(x=>add('📊','ಅಂಕ ಪರಿಶೀಲನೆ',x.c+'ನೇ ತರಗತಿ — '+x.e+' ('+x.n+' ದಾಖಲೆ)','ವಿಷಯ ಶಿಕ್ಷಕರು',x.at,'marks','ಪರಿಶೀಲಿಸಿ'));
  }
  // 8. FDA: mentor orders accepted by the principal waiting for FDA acknowledgement
  if(me.role==='fda') (DB.mentorOrders||[]).filter(o=>o.status==='Accepted').forEach(o=>add('🧑‍🏫','ಮೆಂಟರ್ ಆದೇಶ',(o.mentorName||'')+(o.orderNo?' — '+o.orderNo:''),'Principal',o.approvedAt||o.createdAt,'mentorallocation','ಸ್ವೀಕರಿಸಿ'));
  return out.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')));   // oldest first, like a file-movement queue
}

var SI_ALL=false;
function siToggle(){ SI_ALL=!SI_ALL; navigate('dashboard'); }
function siDays(at){ if(!at) return '—'; const d=Math.floor((new Date(todayStr()+'T00:00:00')-new Date(String(at).slice(0,10)+'T00:00:00'))/86400000); return isNaN(d)?'—':(d<=0?'ಇಂದು':d+' ದಿನ'); }
function staffInboxHTML(){
  const items=staffPendingItems();
  if(!items.length) return `<div class="panel" style="border-left:4px solid var(--green);padding:12px 16px;display:flex;align-items:center;gap:10px;"><span style="font-size:18px;">✅</span><div style="font-family:var(--font-kn);"><b>ನಿಮ್ಮ ಸಹಿ / ಕ್ರಮಕ್ಕೆ ಬಾಕಿ ಇರುವ ಕಡತಗಳಿಲ್ಲ</b></div></div>`;
  const show=SI_ALL?items:items.slice(0,6);
  const kinds={}; items.forEach(i=>{ kinds[i.kind]=(kinds[i.kind]||0)+1; });
  return `<div class="panel" style="border-left:4px solid var(--red,#b3261e);padding:0;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;background:var(--surface-2);border-bottom:1px solid var(--border);">
      <span style="font-size:18px;">📨</span><b style="font-family:var(--font-kn);font-size:15px;">ನಿಮ್ಮ ಸಹಿ / ಕ್ರಮಕ್ಕಾಗಿ ಬಂದಿರುವ ಸಂದೇಶಗಳು</b>
      <span class="badge badge-warn" style="font-weight:800;">${items.length}</span>
      <span style="margin-left:auto;font-size:11px;color:var(--muted);">${Object.entries(kinds).map(([k,v])=>esc(k)+' '+v).join(' · ')}</span></div>
    <div class="table-wrap" style="border:0;border-radius:0;"><table class="gov-table" style="width:100%;table-layout:fixed;border-collapse:collapse;">
      <colgroup><col style="width:5%"><col style="width:17%"><col style="width:34%"><col style="width:13%"><col style="width:10%"><col style="width:8%"><col style="width:13%"></colgroup>
      <thead><tr><th style="text-align:center;">ಕ್ರ.ಸಂ</th><th>ಪ್ರಕಾರ</th><th>ವಿವರ</th><th>ಕಳುಹಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>ಬಾಕಿ</th><th style="text-align:center;">ಕ್ರಮ</th></tr></thead>
      <tbody>${show.map((i,n)=>`<tr onclick="navigate('${i.page}')" style="cursor:pointer;border-bottom:1px solid var(--border);">
        <td style="text-align:center;font-size:12px;color:var(--muted);">${n+1}</td>
        <td style="font-family:var(--font-kn);font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="margin-right:6px;">${i.ic}</span>${esc(i.kind)}</td>
        <td style="font-family:var(--font-kn);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(i.title)}">${esc(i.title)}</td>
        <td style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.from?esc(i.from):'—'}</td>
        <td style="font-size:12px;white-space:nowrap;">${i.at?fmtDate(i.at):'—'}</td>
        <td style="font-size:12px;white-space:nowrap;color:var(--red,#b3261e);font-weight:700;">${siDays(i.at)}</td>
        <td style="text-align:center;"><button class="btn btn-sm btn-primary" onclick="event.stopPropagation();navigate('${i.page}')">${esc(i.action)}</button></td></tr>`).join('')}</tbody></table></div>
    ${items.length>6?`<div style="padding:8px 16px;text-align:center;"><button class="btn btn-sm btn-outline" onclick="siToggle()">${SI_ALL?'ಕಡಿಮೆ ತೋರಿಸಿ ▲':'ಎಲ್ಲಾ '+items.length+' ತೋರಿಸಿ ▼'}</button></div>`:''}
  </div>`;
}
