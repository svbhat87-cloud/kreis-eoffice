/* =====================================================================
   KREIS e-Office v35 — correspondence.js
   ಪತ್ರ ವ್ಯವಹಾರ — Inward / outward / letterhead / messages
   ===================================================================== */
function renderGenericModule(cfg){
  const list = DB[cfg.storeKey];
  const visible = cfg.filterVisible ? list.filter(it=>cfg.filterVisible(it)) : list;
  const canCreate = cfg.createRoles.includes(CURRENT_USER.role);

  let formHtml='';
  if(canCreate){
    formHtml = `<div class="panel"><h3>➕ ${esc(cfg.newLabel||'ಹೊಸ ನಮೂದು')}</h3>
      <div class="form-grid">${cfg.fields.map(f=>fieldHtml(f,cfg.storeKey)).join('')}</div>
      <div class="form-actions"><button class="btn btn-primary" onclick="genericCreate('${cfg.key}')">Save</button></div>
    </div>`;
  }

  let rowsHtml='';
  if(!visible.length){
    rowsHtml=`<tr class="empty-row"><td colspan="${cfg.columns.length+2}">ಯಾವುದೇ ನಮೂದುಗಳಿಲ್ಲ. ${canCreate?'ಮೇಲಿನ ಫಾರ್ಮ್ ಬಳಸಿ ಸೇರಿಸಿ.':''}</td></tr>`;
  } else {
    rowsHtml = visible.slice().reverse().map(item=>{
      const steps = cfg.steps.filter(s=>s.from===item.status && s.role===CURRENT_USER.role);
      const btns = steps.map(s=>`<button class="btn btn-sm ${s.to.toLowerCase().includes('reject')?'btn-red':'btn-green'}" onclick="genericTransition('${cfg.key}','${item.id}','${esc(s.to)}', ${s.needsField?`'${s.needsField.key}'`:'null'})">${esc(s.btn)}</button>`).join('');
      const del = (cfg.canDelete && cfg.canDelete(item)) ? `<button class="btn btn-sm btn-outline" onclick="genericDelete('${cfg.key}','${item.id}')">🗑</button>` : '';
      return `<tr>
        <td>${cfg.columns.map(c=>`<div>${c.render?c.render(item):esc(item[c.key]??'—')}</div>`).join('')}</td>
        <td><span class="badge ${badgeClass(item.status)}">${esc(item.status)}</span>
        </td>
        <td class="actions-cell">${btns}${del}</td>
      </tr>`;
    }).join('');
  }

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>${esc(cfg.title)}</h2><div class="desc">${esc(cfg.subtitle||'')}</div></div>
    ${formHtml}
    <div class="panel"><h3>📋 ಪಟ್ಟಿ (${visible.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>${cfg.columns.map(c=>esc(c.label)).join('</th><th>')}</th>
        <th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table></div>
    </div>`;
}

function clearFields(fields,scope){
  fields.forEach(f=>{ const el=document.getElementById(`fld_${scope}_${f.key}`); if(el && f.type!=='select') el.value = (typeof f.default==='function'?f.default():(f.default||'')); });
}

function genericCreate(cfgKey){
  const cfg=MODULE_CFGS[cfgKey];
  const vals=readFields(cfg.fields,cfg.storeKey);
  for(const f of cfg.fields){ if(f.required && !vals[f.key] && f.type!=='file_upload'){ showToast('⚠ ಎಲ್ಲಾ ಅಗತ್ಯ ಮಾಹಿತಿ ಭರ್ತಿ ಮಾಡಿ'); return; } }
  const doCreate=()=>{
    delete vals._filePromises;
    const item=Object.assign({id:uid(), status:cfg.workflowSteps[0], createdBy:CURRENT_USER.name, createdAt:todayStr(), history:[{status:cfg.workflowSteps[0], by:CURRENT_USER.name, at:todayStr()}]}, vals);
    if(cfg.onCreate) cfg.onCreate(item);
    DB[cfg.storeKey].push(item);
    saveDB();
    clearFields(cfg.fields,cfg.storeKey);
    showToast('✅ ಉಳಿಸಲಾಗಿದೆ');
    navigate(CURRENT_PAGE);
  };
  const promises=vals._filePromises||[];
  if(promises.length) Promise.all(promises).then(doCreate); else doCreate();
}

function genericTransition(cfgKey,itemId,toStatus,needsFieldKey){
  const cfg=MODULE_CFGS[cfgKey];
  const item=DB[cfg.storeKey].find(i=>i.id===itemId);
  if(!item) return;
  if(needsFieldKey){
    const stepCfg = cfg.steps.find(s=>s.from===item.status && s.to===toStatus && s.role===CURRENT_USER.role);
    const val=prompt(stepCfg.needsField.label+':');
    if(val===null) return;
    item[stepCfg.needsField.key]=val;
  }
  item.status=toStatus;
  item.history.push({status:toStatus, by:CURRENT_USER.name, at:todayStr()});
  if(cfg.onTransition) cfg.onTransition(item,toStatus);
  saveDB();
  showToast('✅ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ: '+toStatus);
  navigate(CURRENT_PAGE);
}

function genericDelete(cfgKey,itemId){
  if(!confirm('ಅಳಿಸುವುದೇ?')) return;
  const cfg=MODULE_CFGS[cfgKey];
  DB[cfg.storeKey]=DB[cfg.storeKey].filter(i=>i.id!==itemId);
  saveDB(); navigate(CURRENT_PAGE);
}

function renderAck(){
  const rows=DB.inward.slice().reverse();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಸ್ವೀಕೃತಿ ವಹಿ (Acknowledgement Register)</h2><div class="desc">ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿಯಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ (Auto Entry) ಸೃಷ್ಟಿಯಾಗುತ್ತದೆ — ಪ್ರತ್ಯೇಕ ನಮೂದು ಅಗತ್ಯವಿಲ್ಲ.</div></div>
    <div class="note">ಪ್ರತಿ Inward Entry Save ಆದ ತಕ್ಷಣ ಈ ಪಟ್ಟಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಸೇರ್ಪಡೆಯಾಗುತ್ತದೆ.</div>
    <div class="panel"><h3>📋 ಪಟ್ಟಿ (${rows.length})</h3>
    <div class="table-wrap"><table><thead><tr>
      <th>ಸ್ವೀಕೃತಿ ಸಂಖ್ಯೆ</th><th>ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ</th><th>ಒಳಬರುವ ಸಂಖ್ಯೆ</th><th>ಪತ್ರ ಸಂಖ್ಯೆ</th><th>ಕಳುಹಿಸಿದ ಕಚೇರಿ</th><th>ವಿಷಯ</th><th>ಸ್ಥಿತಿ</th>
    </tr></thead><tbody>
    ${rows.length? rows.map(i=>`<tr><td>${esc(i.ackNo)}</td><td>${fmtDate(i.receivedDate)}</td><td>${esc(i.inwardNo)}</td><td>${esc(i.letterNo||'—')}</td><td>${esc(i.sentFromOffice)}</td><td>${esc(i.subject)}</td><td><span class="badge ${badgeClass(i.status)}">${esc(i.status)}</span></td></tr>`).join('') : `<tr class="empty-row"><td colspan="7">ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ.</td></tr>`}
    </tbody></table></div></div>`;
}

/* attachment helpers: open / download a file stored on a register entry (visible to every role that can see the entry) */
function attDocLink(item,key){
  const d=item&&item[key+'_fileData']; const n=item&&(item[key+'_fileName']||item[key]);
  if(!d&&!n) return '—';
  if(!d) return esc(n||'—');
  return '<a href="#" onclick="attDocOpen(\''+item.id+'\',\''+key+'\');return false;" style="font-weight:600;color:var(--navy,#1a365d)">📎 '+esc(n||'ದಾಖಲೆ')+'</a>';
}
function attDocOpen(id,key){
  let it=null; Object.keys(DB).forEach(k=>{ if(!it&&Array.isArray(DB[k])) it=DB[k].find(x=>x&&x.id===id&&x[key+'_fileData']); });
  if(!it){ showToast('⚠ ಫೈಲ್ ಸಿಗಲಿಲ್ಲ'); return; }
  const d=it[key+'_fileData'], n=it[key+'_fileName']||'document';
  try{
    const b=atob(d.split(',')[1]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([u],{type:it[key+'_fileType']||'application/octet-stream'}));
    if(/^(application\/pdf|image\/)/.test(it[key+'_fileType']||'')){ window.open(url,'_blank'); }
    else { const a=document.createElement('a'); a.href=url; a.download=n; document.body.appendChild(a); a.click(); a.remove(); }
  }catch(e){ showToast('⚠ ಫೈಲ್ ತೆರೆಯಲಾಗಲಿಲ್ಲ'); }
}
function outwardCfg(){
  const cfg={
    key:'outward', storeKey:'outward', title:'ಹೊರಹೋಗುವ ಪತ್ರಗಳ ವಹಿ (Outward Register)',
    subtitle:'Draft → Principal E-Sign → Outward No Generate → Dispatch → Close',
    newLabel:'ಹೊಸ ಪತ್ರ ಕರಡು',
    createRoles:['fda','staff'],
    fields:[
      {key:'date', label:'ದಿನಾಂಕ', type:'date', default:todayStr, required:true},
      {key:'letterType', label:'ಪತ್ರದ ಪ್ರಕಾರ', type:'select', options:LETTER_TYPES, required:true},
      {key:'subject', label:'ವಿಷಯ', type:'text', required:true},
      {key:'applicationNo', label:'ಅರ್ಜಿ ಸಂಖ್ಯೆ / SATS ಸಂಖ್ಯೆ (ಪರಿಶೀಲನೆಗಾಗಿ, ಐಚ್ಛಿಕ)', type:'text'},
      {key:'sentTo', label:'ಕಳುಹಿಸಿದವರಿಗೆ (ಹೆಸರು/ಹುದ್ದೆ)', type:'text'},
      {key:'office', label:'ಕಚೇರಿ', type:'select', options:OFFICES},
      {key:'attachments', label:'ಲಗತ್ತುಗಳು (ಟಿಪ್ಪಣಿ)', type:'text'},
      {key:'doc', label:'📎 ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ — PDF / ಫೋಟೋ / Word / Excel (ಗರಿಷ್ಠ 5 MB; ಪ್ರಾಂಶುಪಾಲರಿಗೂ ಕಾಣುತ್ತದೆ)', type:'file_upload'},
    ],
    columns:[
      {key:'outwardNo', label:'ಹೊರಹೋಗುವ ಸಂಖ್ಯೆ', render:i=>i.outwardNo||'—'}, {key:'date', label:'ದಿನಾಂಕ', render:i=>fmtDate(i.date)},
      {key:'letterType', label:'ಪ್ರಕಾರ'}, {key:'subject', label:'ವಿಷಯ'}, {key:'applicationNo', label:'ಅರ್ಜಿ ಸಂಖ್ಯೆ', render:i=>i.applicationNo||'—'}, {key:'office', label:'ಕಚೇರಿ'}, {key:'doc', label:'ದಾಖಲೆ', render:i=>attDocLink(i,'doc')},
    ],
    workflowSteps:['Draft','Sent to Principal','Principal Signed','Outward No Generated','Dispatched','Closed'],
    steps:[
      {from:'Draft',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Draft',to:'Sent to Principal',role:'staff',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Sent to Principal',to:'Principal Signed',role:'principal',btn:'E-Sign & Approve'},
      {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
      {from:'Principal Signed',to:'Outward No Generated',role:'fda',btn:'Outward No Generate'},
      {from:'Outward No Generated',to:'Dispatched',role:'fda',btn:'Dispatch'},
      {from:'Dispatched',to:'Closed',role:'fda',btn:'Close Entry'},
    ],
    onTransition:(item,to)=>{ if(to==='Outward No Generated'){ item.outwardNo='OUT-'+nextSeq('outward'); item.letterNo=item.letterNo||('MDRS/BC265/'+new Date().getFullYear()+'/'+DB.seq.outward); } if(to==='Dispatched'){ item.dispatchDate=todayStr(); } },
    canDelete:(item)=> item.status==='Draft',
  };
  MODULE_CFGS.outward=cfg;
  return cfg;
}

function messageCfg(){
  const cfg={
    key:'messages', storeKey:'messages', title:'ಆಂತರಿಕ ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ (Internal Message Box)',
    subtitle:'FDA → Principal (Remarks) → FDA → Staff → FDA Close',
    newLabel:'ಹೊಸ ಸಂದೇಶ',
    createRoles:['fda','principal'],
    fields:[
      {key:'subject', label:'Subject', type:'text', required:true},
      {key:'message', label:'Message Content', type:'textarea', required:true},
      {key:'attachment', label:'📎 File Attach — PDF / Word / Excel (ಐಚ್ಛಿಕ)', type:'file_upload'},
    ],
    columns:[
      {key:'msgNo', label:'Msg No'}, {key:'createdAt', label:'Date', render:i=>fmtDate(i.createdAt)},
      {key:'subject', label:'Subject'}, {key:'createdBy', label:'From'}, {key:'toStaff', label:'To Staff', render:i=>i.toStaff||'—'}, {key:'attachment', label:'📎', render:i=>attDocLink(i,'attachment')},
    ],
    workflowSteps:['Draft','Sent to Principal','Returned to FDA','Sent to Staff','Staff Acknowledged','Reply Received','Closed'],
    steps:[
      {from:'Draft',to:'Sent to Principal',role:'fda',btn:'Send to Principal'},
      {from:'Sent to Principal',to:'Returned to FDA',role:'principal',btn:'Approve + Add Remarks', needsField:{key:'principalRemarks',label:'Principal Remarks'}},
      {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
      {from:'Returned to FDA',to:'Sent to Staff',role:'fda',btn:'Select Staff & Send', needsField:{key:'toStaff',label:'Staff Name'}},
      {from:'Sent to Staff',to:'Staff Acknowledged',role:'staff',btn:'E-Sign'},
      {from:'Staff Acknowledged',to:'Reply Received',role:'staff',btn:'Send Reply', needsField:{key:'staffReply',label:'Reply'}},
      {from:'Reply Received',to:'Closed',role:'fda',btn:'Close'},
    ],
    onCreate:(item)=>{ item.msgNo='MSG-'+nextSeq('msg'); },
    filterVisible:(item)=> CURRENT_USER.role!=='staff' || item.toStaff===CURRENT_USER.name,
    canDelete:(item)=> item.status==='Draft',
  };
  MODULE_CFGS.messages=cfg;
  return cfg;
}

function renderLetterhead(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಪತ್ರಲೇಖನ / ಕಚೇರಿ ಆದೇಶ</h2><div class="desc">ಅಧಿಕೃತ ಖಾಲಿ ಲೆಟರ್‌ಹೆಡ್ ಮಾದರಿ — ಸಂಖ್ಯೆ ನೀವೇ ನಮೂದಿಸಿ, ದಿನಾಂಕ ಸ್ವಯಂಚಾಲಿತ. ಟೈಪ್ ಮಾಡಿ Print ಮಾಡಬಹುದು</div></div>
    <div class="panel"><h3>✍️ ಹೊಸ ಪತ್ರ</h3>
      <div class="form-grid">
        <div class="field"><label>ಪತ್ರ ಸಂಖ್ಯೆ (ಸಂ) <span class="req-star">*</span></label><input id="lh_no" placeholder="ಉದಾ: ಮೊದೇವಶಾ/2026-27/____"></div>
        <div class="field"><label>ದಿನಾಂಕ (Auto)</label><input id="lh_date" value="${fmtDate(todayStr())}" readonly></div>
        <div class="field"><label>ಪತ್ರದ ಪ್ರಕಾರ</label><select id="lh_type">${LETTER_TYPES.map(t=>`<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label>ವಿಷಯ</label><input id="lh_subject"></div>
      </div>
      <div class="field"><label>ಪತ್ರದ ವಿವರ</label><textarea id="lh_body" rows="8" placeholder="ಇಲ್ಲಿ ಪತ್ರದ ವಿಷಯ ಟೈಪ್ ಮಾಡಿ..."></textarea></div>
      <div class="form-actions"><button class="btn btn-primary" onclick="generateLetter()">Generate Letter</button></div>
    </div>
    <div id="lhPreviewWrap"></div>
    <div class="panel"><h3>📋 ಈ ಹಿಂದೆ ಸೃಷ್ಟಿಸಿದ ಪತ್ರಗಳು (${DB.letterheads.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ಪತ್ರ ಸಂಖ್ಯೆ</th><th>ದಿನಾಂಕ</th><th>ಪ್ರಕಾರ</th><th>ವಿಷಯ</th><th></th></tr></thead>
      <tbody>${DB.letterheads.length? DB.letterheads.slice().reverse().map(l=>`<tr><td>${esc(l.no)}</td><td>${fmtDate(l.date)}</td><td>${esc(l.type)}</td><td>${esc(l.subject)}</td><td><button class="btn btn-sm btn-outline" onclick="viewLetter('${l.id}')">View / Print</button></td></tr>`).join('') : `<tr class="empty-row"><td colspan="5">ಯಾವುದೇ ಪತ್ರಗಳಿಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>`;
}

function letterPaperHtml(l){
  return `<div class="letterhead-paper" id="printArea">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
        ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ<br>
        ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)<br>
        <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಸೂಸಗಡಿ ಹೋಬಳಿ, ಭಟ್ಕಳ ತಾಲ್ಲೂಕು, ಉತ್ತರ ಕನ್ನಡ ಜಿಲ್ಲೆ – 581320<br>
        ದೂರವಾಣಿ : 97413 84751 ಇ-ಮೇಲ್ : kreismdrs265@gmail.com | mdrsbhatkal@gmail.com
      </div>
    </div>
    <div class="lh-meta"><span>ಸಂಖ್ಯೆ: ${esc(l.no)}</span><span>ದಿನಾಂಕ: ${fmtDate(l.date)}</span></div>
    <div class="lh-subject">ವಿಷಯ: ${esc(l.subject)} (${esc(l.type)})</div>
    <div class="lh-body">${esc(l.body)}</div>
  </div>`;
}

function generateLetter(){
  const no=document.getElementById('lh_no').value.trim();
  const type=document.getElementById('lh_type').value, subject=document.getElementById('lh_subject').value, body=document.getElementById('lh_body').value;
  if(!no){ showToast('⚠ ಪತ್ರ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'); return; }
  if(!subject){ showToast('⚠ ವಿಷಯ ಅಗತ್ಯ'); return; }
  const l={id:uid(), no, date:todayStr(), type, subject, body};
  DB.letterheads.push(l); saveDB();
  showToast('✅ ಪತ್ರ ಸೃಷ್ಟಿಸಲಾಗಿದೆ');
  document.getElementById('lhPreviewWrap').innerHTML=`<div class="panel">${letterPaperHtml(l)}<div class="form-actions"><button class="btn btn-gold" onclick="window.print()">🖨 Print / Save as PDF</button></div></div>`;
  navigate.__skip=true;
}

function viewLetter(id){
  const l=DB.letterheads.find(x=>x.id===id); if(!l) return;
  document.getElementById('lhPreviewWrap').innerHTML=`<div class="panel">${letterPaperHtml(l)}<div class="form-actions"><button class="btn btn-gold" onclick="window.print()">🖨 Print / Save as PDF</button></div></div>`;
  document.getElementById('lhPreviewWrap').scrollIntoView({behavior:'smooth'});
}

function autoFileInward(inwardId){
  const inw=(DB.inward||[]).find(x=>x.id===inwardId); if(!inw) return null;
  const subj=(inw.subject||'').toLowerCase()+' '+(inw.sentFromOffice||'').toLowerCase();
  for(const rule of INWARD_FILE_MAP){
    if(rule.keywords.some(k=>subj.includes(k.toLowerCase()))){
      return rule.file;
    }
  }
  return 'otherDeptFile'; // default
}

function transferAndFileInward(inwardId, targetStaff){
  // Find and update inward
  const inw=DB.inward.find(x=>x.id===inwardId); if(!inw) return;
  inw.transferredTo=targetStaff; inw.transferredAt=todayStr(); inw.status='Transferred';
  // Notify staff
  pushNotification(targetStaff, '📥 ಒಳಬರುವ ಪತ್ರ ನಿಮಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ: '+inw.subject);
  // Auto-file into appropriate doc file
  const fileKey=autoFileInward(inwardId);
  if(fileKey){
    if(!DB[fileKey]) DB[fileKey]=[];
    const fileNo=String(DB[fileKey].length+1).padStart(3,'0')+'/'+new Date().getFullYear();
    const prefix=fileKey==='govtOrdersFile'?'GO':fileKey==='kreisLettersFile'?'KR':fileKey==='eduDeptFile'?'ED':'OT';
    DB[fileKey].push({
      id:uid(), inwardId, fileNo:prefix+'-'+fileNo,
      subject:inw.subject||'', status:'Filed',
      transferredTo:targetStaff,
      addedAt:todayStr(), addedBy:CURRENT_USER.name
    });
    showToast('✅ ವರ್ಗಾಯಿಸಲಾಗಿದೆ → '+getDocFileLabel(fileKey)+' ('+prefix+'-'+fileNo+')');
  }
  saveDB();
}

function getDocFileLabel(key){
  const cat=DOC_FILE_CATS.find(c=>c.key===key);
  return cat ? cat.label.split('(')[0].trim() : key;
}

function renderInward(){
  if(!DB.inward) DB.inward=[];
  const canCreate=CURRENT_USER.role==='fda'||(CURRENT_USER.hasAdminCharge&&CURRENT_USER.role!=='principal');
  const items = CURRENT_USER.role==='staff' && !CURRENT_USER.hasAdminCharge
    ? DB.inward.filter(i=>i.assignedStaff===CURRENT_USER.name)
    : DB.inward.slice().reverse();
  const pending=DB.inward.filter(i=>i.status==='Sent to Principal').length;

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📥 ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ (Inward Register)</h2>
    </div>

    ${pending&&(CURRENT_USER.role==='principal'||CURRENT_USER.hasAdminCharge)?`<div class="note" style="background:var(--gold-tint);border-color:var(--gold);">🔔 ${pending} ಒಳಬರುವ ಪತ್ರ(ಗಳು) Approval ಗಾಗಿ ಕಾಯುತ್ತಿದೆ — ಕೆಳಗೆ "Sent to Principal" ನೋಡಿ</div>`:''}

    ${canCreate?`<div class="panel"><h3>➕ ಒಳಬರುವ ಪತ್ರ ದಾಖಲಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ <span class="req-star">*</span></label>
          <input type="date" id="iw_date" value="${todayStr()}"></div>
        <div class="field"><label>ಕಳುಹಿಸಿದ ಕಚೇರಿ <span class="req-star">*</span></label>
          <select id="iw_office">${OFFICES.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>
        <div class="field"><label>ಪತ್ರ ಸಂಖ್ಯೆ (ಕಳುಹಿಸಿದವರ)</label>
          <input id="iw_letterno" placeholder="ಪತ್ರ ಸಂ."></div>
        <div class="field"><label>ಪತ್ರ ದಿನಾಂಕ</label>
          <input type="date" id="iw_letterdate" value="${todayStr()}"></div>
        <div class="field" style="grid-column:1/-1"><label>ವಿಷಯ <span class="req-star">*</span></label>
          <input id="iw_subject" placeholder="ಪತ್ರದ ವಿಷಯ ಬರೆಯಿರಿ..."></div>
        <div class="field"><label>ಲಗತ್ತುಗಳ ವಿವರ</label>
          <input id="iw_attach" placeholder="ಉದಾ: 2 ದಾಖಲೆಗಳು"></div>
        <div class="field"><label>📎 ಡಾಕ್ಯುಮೆಂಟ್ Upload (PDF / Word / Excel)</label>
          <input type="file" id="iw_file" accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png"
            style="padding:6px;border:1.5px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          <div id="iw_file_preview" style="font-size:11px;color:var(--muted);margin-top:4px;"></div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveInwardEntry()">💾 Save & Principal ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>`:''}

    <div class="panel">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <h3 style="margin:0;">📋 ಪಟ್ಟಿ (${items.length})</h3>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select id="iw_filter" onchange="renderInward()" style="font-size:12px;padding:4px 8px;border-radius:6px;border:1px solid var(--border);">
            <option value="">ಎಲ್ಲಾ</option>
            ${['Draft','Sent to Principal','Principal Signed','Rejected','Sent to Staff','Closed'].map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="table-wrap"><table><thead><tr>
        <th>IN ಸಂ.</th><th>ದಿನಾಂಕ</th><th>ಕಚೇರಿ</th><th>ಪತ್ರ ಸಂ.</th><th>ವಿಷಯ</th><th>ಡಾಕ್.</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${(()=>{
        const fv=document.getElementById('iw_filter')?.value||'';
        const filtered=fv?items.filter(i=>i.status===fv):items;
        if(!filtered.length) return `<tr class="empty-row"><td colspan="8">ಯಾವ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`;
        return filtered.map(item=>{
          const btns=[];
          // Principal: view full detail button
          if((CURRENT_USER.role==='principal'||CURRENT_USER.hasAdminCharge)&&item.status==='Sent to Principal'){
            btns.push(`<button class="btn btn-sm btn-primary" onclick="viewInwardDetail('${item.id}')">📄 View & Sign</button>`);
          }
          if(CURRENT_USER.role==='fda'&&item.status==='Draft'){
            btns.push(`<button class="btn btn-sm btn-gold" onclick="sendInwardToPrincipal('${item.id}')">📤 Principal ಗೆ</button>`);
            btns.push(`<button class="btn btn-sm btn-outline" onclick="deleteInward('${item.id}')">🗑</button>`);
          }
          if(CURRENT_USER.role==='fda'&&item.status==='Principal Signed'){
            btns.push(`<button class="btn btn-sm btn-primary" onclick="openAssignStaff('${item.id}')">👤 Staff ಗೆ</button>`);
            btns.push(`<button class="btn btn-sm btn-outline" onclick="closeInward('${item.id}')">✓ Close</button>`);
          }
          if(item.status!=='Draft'&&item.status!=='Sent to Principal'){
            btns.push(`<button class="btn btn-sm btn-outline" onclick="viewInwardDetail('${item.id}')">👁 View</button>`);
          }
          if(item.fileData){
            btns.push(`<button class="btn btn-sm" style="background:#e8f4fd;color:#1a6fa8;" onclick="downloadInwardFile('${item.id}')">⬇ ${esc(item.fileName?.split('.').pop().toUpperCase()||'FILE')}</button>`);
          }
          return `<tr>
            <td><b>${esc(item.inwardNo||'—')}</b></td>
            <td>${fmtDate(item.receivedDate)}</td>
            <td style="font-size:11px;">${esc((item.sentFromOffice||'').slice(0,20))}</td>
            <td style="font-size:11px;">${esc(item.letterNo||'—')}</td>
            <td><b>${esc((item.subject||'').slice(0,40))}</b>${item.subject?.length>40?'…':''}</td>
            <td style="text-align:center;">${item.fileData?`<span title="${esc(item.fileName||'')}">📎</span>`:''}</td>
            <td>
              <span class="badge ${badgeClass(item.status)}">${esc(item.status)}</span>
              ${item.principalName?`<br><span style="font-size:9px;color:var(--green);">✅ ${esc(item.principalName)}</span>`:''}
              ${item.rejectReason?`<br><span style="font-size:9px;color:var(--red);">❌ ${esc(item.rejectReason.slice(0,30))}</span>`:''}
            </td>
            <td class="actions-cell">${btns.join('')}</td>
          </tr>`;
        }).join('');
      })()}
      </tbody></table></div>
    </div>
    <div id="inwardDetailPanel"></div>`;

  // File preview listener
  document.getElementById('iw_file')?.addEventListener('change', e=>{
    const f=e.target.files[0];
    const pv=document.getElementById('iw_file_preview');
    if(f&&pv) pv.innerHTML=`📎 <b>${f.name}</b> (${(f.size/1024).toFixed(1)} KB)`;
  });
}

function saveInwardEntry(){
  const receivedDate=document.getElementById('iw_date').value;
  const sentFromOffice=document.getElementById('iw_office').value;
  const letterNo=document.getElementById('iw_letterno').value;
  const letterDate=document.getElementById('iw_letterdate').value;
  const subject=document.getElementById('iw_subject').value.trim();
  const attachments=document.getElementById('iw_attach').value;
  if(!receivedDate||!subject){ showToast('⚠ ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ ಮತ್ತು ವಿಷಯ ಅಗತ್ಯ'); return; }

  const fileEl=document.getElementById('iw_file');
  const file=fileEl?.files[0];

  const doSave=(fileData, fileName, fileType)=>{
    if(!DB.inward) DB.inward=[];
    const item={
      id:uid(), inwardNo:'IN-'+nextSeq('inward'), ackNo:'ACK-'+nextSeq('ack'),
      receivedDate, sentFromOffice, letterNo, letterDate, subject, attachments,
      fileData:fileData||null, fileName:fileName||null, fileType:fileType||null,
      status:'Sent to Principal', createdBy:CURRENT_USER.name, createdAt:todayStr(),
      history:[{status:'Sent to Principal',by:CURRENT_USER.name,at:todayStr()}]
    };
    DB.inward.push(item); saveDB();
    const p=STAFF.find(x=>x.role==='principal');
    if(p) pushNotification(p.name,'📥 ಒಳಬರುವ ಪತ್ರ: '+subject+' ('+item.inwardNo+')'+
      (fileName?' | 📎 '+fileName:'')+ ' | "ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ" ನಲ್ಲಿ Sign ಮಾಡಿ');
    showToast('✅ ದಾಖಲಿಸಲಾಗಿದೆ — '+item.inwardNo);
    navigate('inward');
  };

  if(file){
    const reader=new FileReader();
    reader.onload=e=>doSave(e.target.result, file.name, file.type);
    reader.readAsDataURL(file);
  } else {
    doSave(null,null,null);
  }
}

function viewInwardDetail(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  const canSign=(CURRENT_USER.role==='principal'||CURRENT_USER.hasAdminCharge)&&item.status==='Sent to Principal';
  const ext=item.fileName?.split('.').pop()?.toLowerCase()||'';
  const isImg=['jpg','jpeg','png'].includes(ext);
  const isPDF=ext==='pdf';

  const panel=document.getElementById('inwardDetailPanel');
  panel.innerHTML=`<div class="panel" style="border:2px solid var(--gold);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;">📄 ${esc(item.inwardNo)} — ವಿವರ</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${isPDF?`<a class="btn btn-sm btn-outline inw-open" target="_blank" rel="noopener" href="#">↗ ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ</a>`:''}
        ${item.fileData?`<button class="btn btn-sm btn-gold" onclick="downloadInwardFile('${item.id}')">⬇ Download ${esc(item.fileName||'File')}</button>`:''}
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('inwardDetailPanel').innerHTML=''">✕ ಮುಚ್ಚಿ</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:16px;">
      <div class="kv"><b>IN ಸಂಖ್ಯೆ:</b> ${esc(item.inwardNo)}</div>
      <div class="kv"><b>ACK ಸಂಖ್ಯೆ:</b> ${esc(item.ackNo||'—')}</div>
      <div class="kv"><b>ಸ್ವೀಕರಿಸಿದ ದಿನಾಂಕ:</b> ${fmtDate(item.receivedDate)}</div>
      <div class="kv"><b>ಪತ್ರ ದಿನಾಂಕ:</b> ${fmtDate(item.letterDate)}</div>
      <div class="kv"><b>ಕಳುಹಿಸಿದ ಕಚೇರಿ:</b> ${esc(item.sentFromOffice)}</div>
      <div class="kv"><b>ಪತ್ರ ಸಂಖ್ಯೆ:</b> ${esc(item.letterNo||'—')}</div>
      <div class="kv" style="grid-column:1/-1"><b>ವಿಷಯ:</b> <b style="color:var(--navy);">${esc(item.subject)}</b></div>
      ${item.attachments?`<div class="kv"><b>ಲಗತ್ತುಗಳು:</b> ${esc(item.attachments)}</div>`:''}
      ${item.fileName?`<div class="kv"><b>ಡಾಕ್ಯುಮೆಂಟ್:</b> 📎 ${esc(item.fileName)}</div>`:''}
      ${item.assignedStaff?`<div class="kv"><b>ನಿಯೋಜಿತ ಸಿಬ್ಬಂದಿ:</b> ${esc(item.assignedStaff)}</div>`:''}
      ${item.principalName?`<div class="kv" style="grid-column:1/-1;"><b>Digital Signature:</b><br>${cbDigiSign({signedBy:item.principalName,signStamp:item.signStamp||fmtDate(item.principalSignedAt),signHost:item.signHost,signIp:item.signIp,signDevice:item.signDevice},'','Inward letter approved')}</div>`:''}
      ${item.rejectReason?`<div class="kv" style="grid-column:1/-1"><b>Reject ಕಾರಣ:</b> <span style="color:var(--red);">${esc(item.rejectReason)}</span></div>`:''}
    </div>

    ${item.fileData&&(isImg||isPDF)?`
      <div style="margin-bottom:14px;border:1px solid var(--border);border-radius:8px;overflow:hidden;${isPDF?'':'max-height:400px;overflow-y:auto;'}">
        ${isImg?`<img src="${item.fileData}" style="width:100%;max-width:100%;display:block;" alt="Document">`:
        isPDF?`<iframe id="inwPdfFrame" style="width:100%;height:78vh;border:none;background:#fff;"></iframe>`:''}
      </div>`:''}
    ${item.fileData&&!isImg&&!isPDF?`<div class="note">📎 ${esc(item.fileName)} — ⬇ Download ಒತ್ತಿ ತೆರೆಯಿರಿ</div>`:''}

    ${canSign?`
      <div style="border-top:2px solid var(--gold);padding-top:14px;margin-top:8px;">
        <h4 style="margin-bottom:10px;">ಅನುಮೋದನೆ / Approval</h4>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="approveInward('${item.id}')">✅ Digitally Sign & Approve</button>
          <button class="btn btn-red" onclick="rejectInward('${item.id}')">❌ Reject (ಕಾರಣ ಕಡ್ಡಾಯ)</button>
        </div>
      </div>`:''}
  </div>`;
  if(isPDF&&item.fileData){
    try{
      const b64=item.fileData.split(',')[1]||''; const bin=atob(b64); const u8=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
      const url=URL.createObjectURL(new Blob([u8],{type:'application/pdf'}));
      const fr=document.getElementById('inwPdfFrame'); if(fr) fr.src=url;
      const bar=panel.querySelector('.inw-open'); if(bar) bar.href=url;
    }catch(e){ console.warn(e); }
  }
  panel.scrollIntoView({behavior:'smooth'});
}

async function approveInward(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  item.status='Principal Signed'; item.principalName=CURRENT_USER.name;
  item.principalSignedAt=todayStr();
  if(!item.history) item.history=[];
  item.history.push({status:'Principal Signed',by:CURRENT_USER.name,at:todayStr()});
  // NIC e-Office style: "Digitally signed by" block stamped on page 1 (left side) of the uploaded PDF
  { const ts=await getServerTimeStamp(); const m={}; await cbSignMeta(m,ts);
    item.signStamp=m.signStamp; item.signHost=m.signHost; item.signIp=m.signIp; item.signDevice=m.signDevice; }
  if(item.fileData && item.fileData.includes('application/pdf')){
    showToast('⏳ PDF ಗೆ Digital Signature ಸೇರಿಸಲಾಗುತ್ತಿದೆ...');
    if(!item.originalFileData) item.originalFileData=item.fileData; // keep an untouched copy
    const stamped = await stampPdfNicSign(item.originalFileData, item);
    if(stamped===item.originalFileData){
      showToast('⚠ PDF ಗೆ Digital Signature ಸೇರಿಸಲಾಗಲಿಲ್ಲ (Internet/Library ಸಮಸ್ಯೆ) — ಅನುಮೋದನೆ ದಾಖಲಾಗಿದೆ',5000);
    } else { item.fileData = stamped; }
  }
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,
    '✅ Inward Signed: '+item.inwardNo+' — '+item.subject+' | "ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ" ನಲ್ಲಿ Staff ಗೆ ಕಳುಹಿಸಿ ಅಥವಾ Close ಮಾಡಿ'
  ));
  showToast('✅ E-Sign ಆಗಿದೆ — PDF ಒಳಗೂ ಸಹಿ Insert ಆಗಿದೆ — '+item.inwardNo);
  navigate('inward');
}

function rejectInward(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  const reason=prompt('Reject ಕಾರಣ (ಕಡ್ಡಾಯ):');
  if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  item.status='Rejected'; item.rejectReason=reason.trim();
  item.rejectedBy=CURRENT_USER.name; item.rejectedAt=todayStr();
  if(!item.history) item.history=[];
  item.history.push({status:'Rejected',by:CURRENT_USER.name,at:todayStr(),reason:reason.trim()});
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,
    '❌ Inward Rejected: '+item.inwardNo+' — '+item.subject+' | ಕಾರಣ: '+reason
  ));
  showToast('↩ Reject ಆಗಿದೆ — ಕಾರಣ: '+reason);
  navigate('inward');
}

function sendInwardToPrincipal(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  item.status='Sent to Principal';
  if(!item.history) item.history=[];
  item.history.push({status:'Sent to Principal',by:CURRENT_USER.name,at:todayStr()});
  saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📥 ಒಳಬರುವ ಪತ್ರ: '+item.subject+' | "ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ" ನಲ್ಲಿ Sign ಮಾಡಿ');
  showToast('✅ Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); navigate('inward');
}

function openAssignStaff(id){
  const allStaff=STAFF.filter(s=>s.role==='staff');
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:420px;">
    <h3>👤 ಸಿಬ್ಬಂದಿಗೆ ನಿಯೋಜಿಸಿ</h3>
    <div class="field"><label>ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ</label>
      <select id="iw_assign_staff">
        ${allStaff.map(s=>`<option value="${s.name}">${s.name} — ${esc(s.desig||'')}</option>`).join('')}
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" onclick="assignInwardToStaff('${id}')">✅ ಕಳುಹಿಸಿ</button>
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Cancel</button>
    </div>
  </div>`;
}

function assignInwardToStaff(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  const staffName=document.getElementById('iw_assign_staff').value;
  item.assignedStaff=staffName; item.status='Sent to Staff';
  item.sentToStaffAt=todayStr();
  if(!item.history) item.history=[];
  item.history.push({status:'Sent to Staff',by:CURRENT_USER.name,at:todayStr(),to:staffName});
  saveDB();
  pushNotification(staffName,'📥 ಒಳಬರುವ ಪತ್ರ ನಿಮಗೆ: '+item.subject+' ('+item.inwardNo+')');
  // Auto-file in appropriate doc file
  transferAndFileInward(id, staffName);
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ '+staffName+' ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — Doc File ನಲ್ಲಿ Auto-save'); navigate('inward');
}

function closeInward(id){
  const item=DB.inward.find(x=>x.id===id); if(!item) return;
  item.status='Closed'; item.closedAt=todayStr(); item.closedBy=CURRENT_USER.name;
  saveDB(); showToast('✅ Closed: '+item.inwardNo); navigate('inward');
}

function deleteInward(id){
  if(!confirm('ಅಳಿಸುವುದೇ?')) return;
  DB.inward=DB.inward.filter(x=>x.id!==id); saveDB(); navigate('inward');
}

function downloadInwardFile(id){
  const item=DB.inward.find(x=>x.id===id); if(!item||!item.fileData) return;
  const a=document.createElement('a'); a.href=item.fileData; a.download=item.fileName||'document';
  a.click(); showToast('⬇ '+item.fileName);
}

async function stampPdfNicSign(pdfDataUrl, item){
  try{
    if(typeof PDFLib==='undefined') return pdfDataUrl;
    const pdfDoc=await PDFLib.PDFDocument.load(pdfDataUrl.split(',')[1],{ignoreEncryption:true});
    const pg=pdfDoc.getPages()[0]; if(!pg) return pdfDataUrl;
    const fb=await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold), fn=await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const nm=String(item.principalName||'').replace(/[^\x20-\x7E]/g,''), rgb=PDFLib.rgb;
    const lines=[['Digitally signed by',fn,7,rgb(.3,.3,.3)],[nm||'Principal',fb,9,rgb(0,0,0)],[(String(item.desig||'Principal').replace(/[^\x20-\x7E]/g,'')||'Principal')+', MDRS Bhatkal (BC-265)',fn,7.5,rgb(0,0,0)],
      ['Date: '+(item.signStamp||'')+' IST',fn,7.5,rgb(0,0,0)],['Reason: '+(item.reason||'Inward letter approved'),fn,7.5,rgb(0,0,0)],
      [[item.signHost||'', item.signIp?('IP: '+item.signIp):''].filter(Boolean).join(' | '),fn,6.5,rgb(.3,.3,.3)]];
    const bw=190, bh=lines.length*10.5+8, x=24, y=24;
    pg.drawRectangle({x:x,y:y,width:bw,height:bh,color:rgb(1,1,1),opacity:.92,borderColor:rgb(.75,.75,.75),borderWidth:.5});
    pg.drawRectangle({x:x+3,y:y+3,width:2.5,height:bh-6,color:rgb(.1,.3,.56)});
    let ty=y+bh-12;
    lines.forEach(l=>{ pg.drawText(l[0].slice(0,46),{x:x+11,y:ty,size:l[2],font:l[1],color:l[3]}); ty-=10.5; });
    const bytes=new Uint8Array(await pdfDoc.save()); let bin=''; for(let i=0;i<bytes.length;i+=0x8000) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
    return 'data:application/pdf;base64,'+btoa(bin);
  }catch(e){ console.warn('NIC stamp failed',e); return pdfDataUrl; }
}
async function stampPdfWithSignature(pdfDataUrl, signImageDataUrl, signerName, signerLine2, dateStr, timeStr, position){
  try{
    if(typeof PDFLib==='undefined'){ console.warn('pdf-lib ಲೋಡ್ ಆಗಿಲ್ಲ'); return pdfDataUrl; }
    if(!pdfDataUrl || !pdfDataUrl.includes('application/pdf')) return pdfDataUrl; // only stamp actual PDFs
    if(!signImageDataUrl) return pdfDataUrl; // no signature uploaded yet — nothing to stamp

    const base64=pdfDataUrl.split(',')[1];
    const pdfDoc = await PDFLib.PDFDocument.load(base64, {ignoreEncryption:true});
    const pages = pdfDoc.getPages();
    if(!pages.length) return pdfDataUrl;
    const lastPage = pages[pages.length-1];
    const {width} = lastPage.getSize();

    let sigImage;
    if(signImageDataUrl.includes('image/png')) sigImage = await pdfDoc.embedPng(signImageDataUrl);
    else sigImage = await pdfDoc.embedJpg(signImageDataUrl);

    const sigW=95, sigH=sigImage.height/sigImage.width*sigW;
    const marginX=24, marginY=24;
    const boxW=190, boxH=sigH+46;
    const boxX = position==='left' ? marginX : (width - boxW - marginX);
    const boxY = marginY;

    lastPage.drawRectangle({ x:boxX, y:boxY, width:boxW, height:boxH, borderColor:PDFLib.rgb(0.18,0.49,0.20), borderWidth:1.2, color:PDFLib.rgb(0.93,1,0.93) });
    lastPage.drawImage(sigImage, { x: boxX+(boxW-sigW)/2, y: boxY+boxH-sigH-10, width: sigW, height: sigH });

    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const fontN = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    lastPage.drawText('DIGITALLY SIGNED', { x: boxX+10, y: boxY+boxH-sigH-22, size:7, font, color:PDFLib.rgb(0.18,0.49,0.20) });
    lastPage.drawText((signerName||'').slice(0,30), { x: boxX+10, y: boxY+20, size:9, font, color:PDFLib.rgb(0,0,0) });
    if(signerLine2) lastPage.drawText(signerLine2.slice(0,34), { x: boxX+10, y: boxY+10, size:7, font:fontN, color:PDFLib.rgb(0.3,0.3,0.3) });
    lastPage.drawText(`${dateStr||''} ${timeStr||''}`, { x: boxX+10, y: boxY+1, size:7, font:fontN, color:PDFLib.rgb(0.3,0.3,0.3) });

    const outBytes = await pdfDoc.save();
    const bytes = new Uint8Array(outBytes);
    let binary=''; const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk){ binary+=String.fromCharCode.apply(null, bytes.subarray(i,i+chunk)); }
    return 'data:application/pdf;base64,'+btoa(binary);
  }catch(e){
    console.warn('PDF signature stamp failed, keeping original file:', e);
    return pdfDataUrl;
  }
}

async function stampPdfWithPrincipalSign(pdfDataUrl, signedDate, signedAt, position){
  return stampPdfNicSign(pdfDataUrl,{principalName:CURRENT_USER.name,desig:'Principal',signStamp:nicStampText(signedAt,signedDate),signHost:location.host,reason:'Approved'});
}

;(window.__LOADED=window.__LOADED||[]).push('correspondence');
