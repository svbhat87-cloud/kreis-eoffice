/* =====================================================================
   KREIS e-Office v35 — teacher.js
   ಶಿಕ್ಷಕರ ವಿಭಾಗ — Teacher dashboard: profile, attendance, marks entry, grade logic, results, mentees, lesson plans
   ===================================================================== */
function isClassTeacherOf(className){ return DB.classTeacherAllocation[className]===CURRENT_USER.name; }

function isClassTeacherAny(){ return Object.values(DB.classTeacherAllocation).includes(CURRENT_USER.name); }

function myClassesAsTeacher(){ return Object.keys(DB.classTeacherAllocation).filter(c=>DB.classTeacherAllocation[c]===CURRENT_USER.name); }

function dashCardsTeacher(ctx){
  const {pendingInward,pendingBills,pendingMsgs,myMovements}=ctx;
  let cards='';

    cards+=statCard(myMovements,'ಪ್ರಸ್ತುತ ಹೊರಗೆ ಇರುವಿರಿ');
    cards+=statCard(DB.messages.filter(m=>m.toStaff===CURRENT_USER.name).length,'ನಿಮಗೆ ಬಂದ ಸಂದೇಶಗಳು');
    if(isExamHead()){
      cards+=statCard(DB.questionPapers.filter(q=>q.status==='Submitted').length,'📋 ಹೊಸ QP ಬಂದಿದೆ');
      cards+=statCard(DB.questionPapers.filter(q=>q.status==='Print Requested').length,'🖨️ FDA ಗೆ ಕಳುಹಿಸಿದ QP');
    }
  
  return cards;
}

function profileSectionsHtml(existing){
  return PROFILE_SECTIONS.map(sec=>`
    <div class="section-title">${esc(sec.title)}</div>
    <div class="form-grid">${sec.fields.map(f=>{
      const id='prof_'+f.key, val=esc(existing[f.key]||'');
      if(f.type==='select'){
        return `<div class="field"><label>${esc(f.label)}</label><select id="${id}"><option value="">—</option>${f.options.map(o=>`<option ${existing[f.key]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
      }
      return `<div class="field"><label>${esc(f.label)}</label><input type="${f.type||'text'}" id="${id}" value="${val}"></div>`;
    }).join('')}</div>`).join('');
}

function renderProfile(){
  const existing=DB.profiles[CURRENT_USER.name]||{};
  const myPhoto=(DB.staffPhotos||{})[CURRENT_USER.hrmsId];
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ (Personal Profile)</h2><div class="desc">ಪ್ರತಿ ಸಿಬ್ಬಂದಿ ಕಡ್ಡಾಯವಾಗಿ ಈ ವಿವರ ಭರ್ತಿ ಮಾಡಬೇಕು. Submit ಮಾಡಿದ ನಂತರ FDA Staff Details ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.</div></div>

    <div class="panel" style="border:2px solid var(--gold);">
      <h3>📷 ನನ್ನ ಫೋಟೋ (My Photo)</h3>
      <div class="note" style="font-size:11.5px;">ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರ (JPEG / PNG) Upload ಮಾಡಿ. ಇದು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು FDA ಯ ಸಿಬ್ಬಂದಿ ವಿವರಗಳಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.</div>
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <div style="text-align:center;">
          ${myPhoto?`<img src="${myPhoto}" style="height:130px;width:104px;object-fit:cover;border:1px solid var(--border);border-radius:6px;background:#fff;">`:
          `<div style="height:130px;width:104px;border:1.5px dashed var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;">ಫೋಟೋ ಇಲ್ಲ</div>`}
        </div>
        <div style="flex:1;min-width:200px;">
          <input type="file" id="myPhotoFile" accept="image/*" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          <div class="form-actions" style="margin-top:8px;justify-content:flex-start;">
            <button class="btn btn-sm btn-primary" onclick="saveMyPhoto()">💾 ಫೋಟೋ Save ಮಾಡಿ</button>
            ${myPhoto?`<button class="btn btn-sm btn-outline" onclick="removeMyPhoto()">🗑 ತೆಗೆಯಿರಿ</button>`:''}
          </div>
        </div>
      </div>
    </div>

    ${existing.status==='Submitted' ? `<div class="note">✅ ಸಲ್ಲಿಸಲಾಗಿದೆ — ${fmtDate(existing.submittedAt)} ರಂದು. ಬೇಕಿದ್ದರೆ ಕೆಳಗೆ ಮಾಹಿತಿ ಬದಲಿಸಿ ಮರುಸಲ್ಲಿಸಬಹುದು.</div>` : ''}
    <div class="panel">
      <div class="kv"><b>ಹೆಸರು</b>${esc(CURRENT_USER.name)}</div>
      <div class="kv"><b>HRMS ID</b>${esc(CURRENT_USER.hrmsId||'—')}</div>
      <div class="kv"><b>ಹುದ್ದೆ</b>${esc(CURRENT_USER.desig)}</div>
      ${profileSectionsHtml(existing)}
      <div class="form-actions"><button class="btn btn-primary" onclick="submitProfile()">✅ Submit</button></div>
    </div>`;
}

function saveMyPhoto(){
  const file=document.getElementById('myPhotoFile')?.files[0];
  if(!file){ showToast('⚠ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  if(!/^image\//.test(file.type)){ showToast('⚠ ಚಿತ್ರ ಫೈಲ್ (JPEG/PNG) ಮಾತ್ರ'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      // crop to 4:5 portrait and shrink (keeps the saved data small)
      const tw=320, th=400; const c=document.createElement('canvas'); c.width=tw; c.height=th;
      const cx=c.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,tw,th);
      const sc=Math.max(tw/img.width,th/img.height); const w=img.width*sc, h=img.height*sc;
      cx.drawImage(img,(tw-w)/2,(th-h)/2,w,h);
      if(!DB.staffPhotos) DB.staffPhotos={};
      DB.staffPhotos[CURRENT_USER.hrmsId]=c.toDataURL('image/jpeg',0.85);
      saveDB(); showToast('✅ ಫೋಟೋ Save ಆಗಿದೆ'); navigate('profile');
    };
    img.onerror=()=>showToast('⚠ ಚಿತ್ರ ತೆರೆಯಲು ಆಗಲಿಲ್ಲ');
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function removeMyPhoto(){
  if(!confirm('ಫೋಟೋ ತೆಗೆಯಬೇಕೇ?')) return;
  if(DB.staffPhotos) delete DB.staffPhotos[CURRENT_USER.hrmsId];
  saveDB(); navigate('profile');
}
function saveMySignature(){
  const fileEl=document.getElementById('mySignFile');
  const file=fileEl?.files[0];
  if(!file){ showToast('⚠ ಸಹಿ Image ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    if(!DB.staffSignatures) DB.staffSignatures={};
    DB.staffSignatures[CURRENT_USER.hrmsId]=e.target.result;
    saveDB();
    showToast('✅ ಸಹಿ Save ಆಗಿದೆ — ಈಗ ಎಲ್ಲಾ E-Sign ಜಾಗದಲ್ಲಿ ಬಳಕೆ ಆಗುತ್ತದೆ');
    navigate('profile');
  };
  reader.readAsDataURL(file);
}

function removeMySignature(){
  if(!confirm('ಸಹಿ ತೆಗೆಯುವುದೇ?')) return;
  if(DB.staffSignatures) delete DB.staffSignatures[CURRENT_USER.hrmsId];
  saveDB(); navigate('profile');
}

function submitProfile(){
  const vals={};
  PROFILE_SECTIONS.forEach(sec=>sec.fields.forEach(f=>{ const el=document.getElementById('prof_'+f.key); vals[f.key]=el?el.value:''; }));
  vals.status='Submitted'; vals.submittedAt=todayStr();
  DB.profiles[CURRENT_USER.name]=vals; saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'ಹೊಸ ಪ್ರೊಫೈಲ್ ಸಲ್ಲಿಕೆ: '+CURRENT_USER.name));
  showToast('✅ ಪ್ರೊಫೈಲ್ ಸಲ್ಲಿಸಲಾಗಿದೆ');
  navigate('profile');
}

function renderStaffDetails(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಸಿಬ್ಬಂದಿ ವಿವರಗಳು (Staff Details)</h2><div class="desc">ಶಿಕ್ಷಕರು ಸಲ್ಲಿಸಿದ ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್‌ಗಳ ಸ್ಥಿತಿ</div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>HRMS ID</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಸ್ಥಿತಿ</th><th>ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ</th><th>Action</th></tr></thead>
    <tbody>${STAFF.map(s=>{ const p=DB.profiles[s.name]; return `<tr><td>${esc(s.hrmsId)}</td><td>${esc(s.name)}</td><td>${esc(s.desig)}</td><td><span class="badge ${p&&p.status==='Submitted'?'badge-ok':'badge-draft'}">${p&&p.status==='Submitted'?'Submitted':'Pending'}</span></td><td>${p?fmtDate(p.submittedAt):'—'}</td><td>${p?`<button class="btn btn-sm btn-outline" onclick="viewStaffProfile('${esc(s.name)}')">View</button>`:''}</td></tr>`; }).join('')}</tbody></table></div></div>
    <div id="staffProfileView"></div>`;
}

function staffProfileSheetHtml(name){
  const st=STAFF.find(x=>x.name===name)||{}; const p=DB.profiles[name]||{}; const photo=(DB.staffPhotos||{})[st.hrmsId]||'';
  const web=location.host||'mdrsshedbarieoffice.in';
  const sec=PROFILE_SECTIONS.map(sc=>`<div style="background:#eef2f8;border:1px solid #1a4d8f;padding:5px 10px;font-weight:700;font-size:14px;margin:14px 0 0;">${esc(sc.title)}</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">${sc.fields.map(f=>`<tr><td style="border:1px solid #999;padding:5px 8px;width:38%;background:#fafafa;">${esc(f.label)}</td><td style="border:1px solid #999;padding:5px 8px;">${esc(p[f.key]||'—')}</td></tr>`).join('')}</table>`).join('');
  return `<div style="width:794px;box-sizing:border-box;padding:36px 44px 30px;background:#fff;color:#000;font-family:Arial,'Nirmala UI','Noto Sans Kannada',sans-serif;">
    <div style="text-align:center;"><div style="font-size:18px;font-weight:700;">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)</div><div style="font-size:13px;">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ (BC-265)</div><div style="font-size:16px;font-weight:700;margin-top:6px;">ಸಿಬ್ಬಂದಿ ವೈಯಕ್ತಿಕ ವಿವರ / Staff Personal Details</div></div>
    <div style="display:flex;gap:12px;margin-top:12px;align-items:stretch;"><table style="flex:1;border-collapse:collapse;font-size:14px;"><tr><td style="border:1px solid #000;padding:8px;"><b>ಹೆಸರು:</b> ${esc(name)}</td></tr><tr><td style="border:1px solid #000;padding:8px;"><b>HRMS ID:</b> ${esc(st.hrmsId||'')}</td></tr>
    <tr><td style="border:1px solid #000;padding:8px;"><b>ಹುದ್ದೆ:</b> ${esc(st.desig||'')}</td></tr></table>
    <div style="width:104px;height:130px;border:1px solid #000;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">${photo?`<img src="${photo}" style="width:100%;height:100%;object-fit:cover;">`:'Photo'}</div></div>
    ${sec}
    <div style="margin-top:18px;font-size:11px;color:#333;border-top:1px solid #000;padding-top:5px;">https://${esc(web)}</div></div>`;
}
async function staffProfileDownload(name,type){
  if(typeof html2canvas==='undefined'){ showToast('⚠ Library ಲೋಡ್ ಆಗಿಲ್ಲ — Internet ಪರಿಶೀಲಿಸಿ',4000); return; }
  showToast('⏳ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...');
  const host=document.createElement('div'); host.style.cssText='position:fixed;left:-10000px;top:0;'; host.innerHTML=staffProfileSheetHtml(name); document.body.appendChild(host);
  const safe=name.replace(/[^A-Za-z0-9]+/g,'_');
  try{
    const canvas=await html2canvas(host.firstElementChild,{scale:2,backgroundColor:'#ffffff',useCORS:true});
    const dl=(blob,fn)=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fn; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); };
    if(type==='jpg'){
      canvas.toBlob(b=>{ dl(b,'Staff_'+safe+'.jpg'); showToast('✅ JPEG Download ಆಯಿತು'); },'image/jpeg',0.92);
    } else {
      if(typeof PDFLib==='undefined'){ showToast('⚠ PDF library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
      const pdf=await PDFLib.PDFDocument.create(); const W=595.28,H=841.89;
      const pageH=Math.floor(canvas.width*H/W); const n=Math.max(1,Math.ceil(canvas.height/pageH));
      for(let i=0;i<n;i++){
        const part=document.createElement('canvas'); part.width=canvas.width; part.height=Math.min(pageH,canvas.height-i*pageH);
        const cx=part.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,part.width,part.height); cx.drawImage(canvas,0,i*pageH,canvas.width,part.height,0,0,canvas.width,part.height);
        const img=await pdf.embedJpg(part.toDataURL('image/jpeg',0.92)); const pg=pdf.addPage([W,H]); const h=W*part.height/part.width;
        pg.drawImage(img,{x:0,y:H-h,width:W,height:h});
      }
      dl(new Blob([await pdf.save()],{type:'application/pdf'}),'Staff_'+safe+'.pdf'); showToast('✅ PDF Download ಆಯಿತು');
    }
  }catch(e){ console.warn(e); showToast('⚠ Download ಆಗಲಿಲ್ಲ: '+e.message,5000); }
  host.remove();
}
function viewStaffProfile(name){
  const p=DB.profiles[name]||{};
  const html=`<div class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;"><h3 style="margin:0;flex:1;">🪪 ${esc(name)}</h3>
    <button class="btn btn-sm btn-gold" onclick="staffProfileDownload('${esc(name).replace(/'/g,"\\'")}','pdf')">⬇ PDF</button>
    <button class="btn btn-sm btn-primary" onclick="staffProfileDownload('${esc(name).replace(/'/g,"\\'")}','jpg')">🖼️ JPEG</button></div>${(()=>{ const st=STAFF.find(x=>x.name===name)||{}; const ph=(DB.staffPhotos||{})[st.hrmsId]; return ph?`<img src="${ph}" style="height:130px;width:104px;object-fit:cover;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;">`:''; })()}${profileSectionsHtml(p)}</div>`;
  const wrap=document.getElementById('staffProfileView');
  wrap.innerHTML=html; wrap.scrollIntoView({behavior:'smooth'});
}

function renderTeacherMessages(){
  const others=STAFF.filter(s=>s.name!==CURRENT_USER.name);
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಶಿಕ್ಷಕರ ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ (Message Box)</h2><div class="desc">Inbox · Sent · Draft · Archive — Approval ಅಗತ್ಯವಿಲ್ಲ</div></div>
    <div class="panel"><h3>✍️ ಹೊಸ ಸಂದೇಶ</h3>
      <div class="form-grid">
        <div class="field"><label>Send To</label><select id="tm_toType" onchange="tmToggleTarget()">
          <option value="All Staff">All Staff</option><option value="Principal">Principal</option><option value="FDA">FDA</option>
          <option value="Particular Staff">Particular Staff</option><option value="Class Teacher">Class Teacher</option><option value="Subject Teacher">Subject Teacher</option>
        </select></div>
        <div class="field" id="tm_targetWrap"><label>ಸಿಬ್ಬಂದಿ</label><select id="tm_targetStaff">${others.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} (${esc(s.desig)})</option>`).join('')}</select></div>
        <div class="field"><label>Subject <span class="req-star">*</span></label><input id="tm_subject"></div>
        <div class="field"><label>📎 Attachment — PDF / Word / Excel (ಐಚ್ಛಿಕ)</label>
          <input type="file" id="tm_attachment_file" accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.png"
            style="padding:6px;border:1.5px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
          <div id="tm_file_info" style="font-size:11px;color:var(--muted);margin-top:3px;"></div>
        </div>
      </div>
      <div class="field"><label>Message</label><textarea id="tm_message" rows="4"></textarea></div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="sendTeacherMsg(true)">💾 Save Draft</button>
        <button class="btn btn-primary" onclick="sendTeacherMsg(false)">📨 Send</button>
      </div>
    </div>
    <div class="folder-tabs">
      ${[['inbox','📥 Inbox'],['sent','📤 Sent'],['draft','📝 Draft'],['archive','🗄 Archive']].map(([k,l])=>`<div class="folder-tab ${TMSG_FOLDER===k?'active':''}" onclick="switchTmsgFolder('${k}')">${l}</div>`).join('')}
    </div>
    <div id="tmsgList"></div>
    <div id="tmsgDetail"></div>`;
  renderTmsgList();
}

function tmToggleTarget(){
  const t=document.getElementById('tm_toType').value;
  const wrap=document.getElementById('tm_targetWrap');
  if(t==='Particular Staff'||t==='Subject Teacher'){
    wrap.style.display=''; wrap.querySelector('label').textContent='ಸಿಬ್ಬಂದಿ'; 
    wrap.innerHTML=`<label>ಸಿಬ್ಬಂದಿ</label><select id="tm_targetStaff">${STAFF.filter(s=>s.name!==CURRENT_USER.name).map(s=>`<option value="${esc(s.name)}">${esc(s.name)} (${esc(s.desig)})</option>`).join('')}</select>`;
  } else if(t==='Class Teacher'){
    wrap.style.display='';
    wrap.innerHTML=`<label>ತರಗತಿ</label><select id="tm_targetStaff">${CLASSES.map(c=>`<option value="${c}">${c}ನೇ ತರಗತಿ</option>`).join('')}</select>`;
  } else { wrap.style.display='none'; }
}

function resolveTmsgTargets(toType,val){
  if(toType==='All Staff') return STAFF.filter(s=>s.name!==CURRENT_USER.name).map(s=>s.name);
  if(toType==='Principal') return staffNamesForRole('principal');
  if(toType==='FDA') return staffNamesForRole('fda');
  if(toType==='Particular Staff'||toType==='Subject Teacher') return val?[val]:[];
  if(toType==='Class Teacher'){ const t=DB.classTeacherAllocation[val]; return t?[t]:[]; }
  return [];
}

function sendTeacherMsg(asDraft){
  const toType=document.getElementById('tm_toType').value;
  const targetEl=document.getElementById('tm_targetStaff');
  const targetVal=targetEl?targetEl.value:'';
  const subject=document.getElementById('tm_subject').value;
  const message=document.getElementById('tm_message').value;
  const fileEl=document.getElementById('tm_attachment_file');
  const file=fileEl?.files[0];
  if(!subject){ showToast('⚠ Subject ಅಗತ್ಯ'); return; }
  const toNames=resolveTmsgTargets(toType,targetVal);
  if(!asDraft && !toNames.length){ showToast('⚠ ಸ್ವೀಕರಿಸುವವರು ಸಿಗಲಿಲ್ಲ'); return; }

  const doSend=(fileData,fileName,fileType)=>{
    const readBy={}, archivedBy={};
    const msg={id:uid(), from:CURRENT_USER.name, toType, targetVal, toNames, subject, message,
      attachment:fileName||'', fileData:fileData||null, fileName:fileName||null, fileType:fileType||null,
      date:todayStr(), ts:Date.now(), status:asDraft?'draft':'sent', readBy, archivedBy};
    DB.teacherMsgs.push(msg); saveDB();
    if(!asDraft) toNames.forEach(n=>pushNotification(n,'✉ ಹೊಸ ಸಂದೇಶ: '+subject+(fileName?' 📎 '+fileName:'')+' ('+CURRENT_USER.name+')'));
    showToast(asDraft?'💾 Draft ಉಳಿಸಲಾಗಿದೆ':'✅ ಕಳುಹಿಸಲಾಗಿದೆ');
    navigate('messages');
  };

  if(file){ const r=new FileReader(); r.onload=e=>doSend(e.target.result,file.name,file.type); r.readAsDataURL(file); }
  else doSend(null,null,null);
}

function switchTmsgFolder(f){ TMSG_FOLDER=f; document.getElementById('tmsgDetail').innerHTML=''; renderTmsgList(); }

function renderTmsgList(){
  let list=[];
  if(TMSG_FOLDER==='inbox') list=DB.teacherMsgs.filter(m=>m.status==='sent'&&m.toNames.includes(CURRENT_USER.name)&&!m.archivedBy[CURRENT_USER.name]);
  else if(TMSG_FOLDER==='sent') list=DB.teacherMsgs.filter(m=>m.status==='sent'&&m.from===CURRENT_USER.name);
  else if(TMSG_FOLDER==='draft') list=DB.teacherMsgs.filter(m=>m.status==='draft'&&m.from===CURRENT_USER.name);
  else list=DB.teacherMsgs.filter(m=>(m.toNames.includes(CURRENT_USER.name)||m.from===CURRENT_USER.name)&&m.archivedBy[CURRENT_USER.name]);
  list=list.slice().sort((a,b)=>b.ts-a.ts);
  const wrap=document.getElementById('tmsgList');
  wrap.innerHTML = list.length ? list.map(m=>{
    const unread = TMSG_FOLDER==='inbox' && !m.readBy[CURRENT_USER.name];
    const who = TMSG_FOLDER==='sent'||TMSG_FOLDER==='draft' ? 'To: '+(m.toNames.join(', ')||m.toType) : 'From: '+m.from;
    return `<div class="msg-row ${unread?'unread':''}" onclick="openTmsgDetail('${m.id}')"><div class="subj">${unread?'🔴 ':''}${esc(m.subject)}</div><div class="meta">${esc(who)} · ${fmtDate(m.date)}</div></div>`;
  }).join('') : `<div class="panel"><div class="small-muted" style="text-align:center;">ಈ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಸಂದೇಶಗಳಿಲ್ಲ.</div></div>`;
}

function openTmsgDetail(id){
  const m=DB.teacherMsgs.find(x=>x.id===id); if(!m) return;
  if(TMSG_FOLDER==='inbox' && !m.readBy[CURRENT_USER.name]){ m.readBy[CURRENT_USER.name]=true; saveDB(); renderTmsgList(); }
  const archived = m.archivedBy[CURRENT_USER.name];
  document.getElementById('tmsgDetail').innerHTML=`<div class="panel">
    <h3>${esc(m.subject)}</h3>
    <div class="small-muted">From: ${esc(m.from)} · To: ${esc(m.toNames.join(', ')||m.toType)} · ${fmtDate(m.date)}</div>
    <p style="white-space:pre-wrap;margin-top:10px;">${esc(m.message)}</p>
    ${m.fileData?`<div style="margin-top:10px;padding:10px;background:var(--surface-2);border-radius:8px;display:flex;align-items:center;gap:10px;">
      <span>📎 <b>${esc(m.fileName||'')}</b></span>
      <button class="btn btn-sm btn-gold" onclick="(function(){const a=document.createElement('a');a.href='${m.fileData}';a.download='${esc(m.fileName||'file')}';a.click();})()">⬇ Download</button>
    </div>`:''}
    <div class="form-actions">
      ${TMSG_FOLDER==='inbox'?`<button class="btn btn-sm btn-outline" onclick="tmReply('${m.id}')">↩ Reply</button><button class="btn btn-sm btn-outline" onclick="tmForward('${m.id}')">↪ Forward</button>`:''}
      <button class="btn btn-sm btn-outline" onclick="tmToggleArchive('${m.id}')">${archived?'📤 Unarchive':'🗄 Archive'}</button>
    </div>
  </div>`;
}

function tmReply(id){
  const m=DB.teacherMsgs.find(x=>x.id===id); if(!m) return;
  document.getElementById('tm_toType').value='Particular Staff'; tmToggleTarget();
  document.getElementById('tm_targetStaff').value=m.from;
  document.getElementById('tm_subject').value='Re: '+m.subject;
  document.getElementById('tm_message').focus();
  window.scrollTo(0,0);
}

function tmForward(id){
  const m=DB.teacherMsgs.find(x=>x.id===id); if(!m) return;
  document.getElementById('tm_toType').value='Particular Staff'; tmToggleTarget();
  document.getElementById('tm_subject').value='Fwd: '+m.subject;
  document.getElementById('tm_message').value='\n\n--- Forwarded from '+m.from+' ('+fmtDate(m.date)+') ---\n'+m.message;
  window.scrollTo(0,0);
}

function tmToggleArchive(id){
  const m=DB.teacherMsgs.find(x=>x.id===id); if(!m) return;
  m.archivedBy[CURRENT_USER.name]=!m.archivedBy[CURRENT_USER.name]; saveDB();
  document.getElementById('tmsgDetail').innerHTML=''; renderTmsgList();
}

function renderAttendance(){
  const myClasses = CURRENT_USER.role==='staff' ? myClassesAsTeacher().filter(c=>ATT_CLASSES.includes(c)) : ATT_CLASSES;
  const canEnter = CURRENT_USER.role==='staff' && myClasses.length>0;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಹಾಜರಾತಿ (Attendance)</h2></div>
    <div id="attViewOnlyWrap"></div>
    ${canEnter?`<div class="panel"><h3>📝 ಹಾಜರಾತಿ ನಮೂದಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ತರಗತಿ</label><select id="att_class">${myClasses.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="att_date" value="${todayStr()}"></div>
      </div>
      <div class="form-actions"><button class="btn btn-outline btn-sm" onclick="loadAttStudents()">ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ ತೋರಿಸಿ</button></div>
      <div id="attGridWrap"></div>
    </div>`: (CURRENT_USER.role==='staff' ? `<div class="note">ನೀವು ಯಾವುದೇ ತರಗತಿಯ Class Teacher ಆಗಿ ನಿಯೋಜಿತರಾಗಿಲ್ಲ.</div>`:'')}
    <div class="panel"><h3>📋 ಹಾಜರಾತಿ ದಾಖಲೆಗಳು</h3>
      <div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>ತರಗತಿ</th><th>Present</th><th>Absent</th><th>ದಾಖಲಿಸಿದವರು</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
      <tbody>${(()=>{
        const list=DB.attendance.filter(a=> CURRENT_USER.role!=='staff' || a.markedBy===CURRENT_USER.name).slice().reverse();
        if(!list.length) return `<tr class="empty-row"><td colspan="7">ದಾಖಲೆಗಳಿಲ್ಲ.</td></tr>`;
        return list.map(a=>{
          const p=a.records.filter(r=>r.status==='Present').length, ab=a.records.filter(r=>r.status==='Absent').length;
          const absentNames=a.records.filter(r=>r.status==='Absent').map(r=>{ const st=(DB.students||[]).find(x=>x.id===r.studentId); return st?st.studentName:'?'; });
          const canEdit = CURRENT_USER.role==='staff' && a.markedBy===CURRENT_USER.name && a.status!=='Approved';
          const btns = (a.status==='Submitted' && CURRENT_USER.role==='principal' ? `<button class="btn btn-sm btn-green" onclick="approveAttendance('${a.id}',true)">Approve</button><button class="btn btn-sm btn-red" onclick="approveAttendance('${a.id}',false)">Reject</button>` : '')
            + (canEdit? `<button class="btn btn-sm btn-outline" onclick="editAttRecord('${a.id}')">✏️ ಹೆಸರುವಾರು View/Edit</button>` : `<button class="btn btn-sm btn-outline" onclick="editAttRecord('${a.id}')">👁 View</button>`);
          return `<tr><td>${fmtDate(a.date)}</td><td>${esc(a.className)}</td><td>${p}</td><td>${ab}${ab?` <span class="small-muted" title="${esc(absentNames.join(', '))}">(${esc(absentNames.slice(0,3).join(', '))}${absentNames.length>3?'…':''})</span>`:''}</td><td>${esc(a.markedBy)}</td><td><span class="badge ${badgeClass(a.status)}">${esc(a.status)}</span></td><td class="actions-cell">${btns}</td></tr>`;
        }).join('');
      })()}</tbody></table></div>
    </div>
    <div class="panel"><h3>📊 ಹಾಜರಾತಿ ವರದಿ (% & Defaulters, &lt;75%)</h3>
      <div class="form-grid"><div class="field"><label>ತರಗತಿ</label><select id="att_report_class" onchange="renderAttReport()">${ATT_CLASSES.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
      <div id="attReportWrap"></div>
    </div>`;
  renderAttReport();
}

function loadAttStudents(){
  const cls=document.getElementById('att_class').value;
  const date=document.getElementById('att_date').value;
  ATT_LOADED_CLASS=cls; ATT_STATE={};
  const students=DB.students.filter(s=>s.className===cls);
  const existing=DB.attendance.find(a=>a.className===cls && a.date===date && a.markedBy===CURRENT_USER.name);
  ATT_LOADED_RECORD_ID = existing? existing.id : null;
  ATT_LOADED_STATUS = existing? existing.status : null;
  students.forEach(s=>{
    const rec=existing && existing.records.find(r=>r.studentId===s.id);
    ATT_STATE[s.id]= rec? rec.status : 'Present';
  });
  renderAttGrid(students);
}

function editAttRecord(id){
  const a=DB.attendance.find(x=>x.id===id); if(!a) return;
  const classSel=document.getElementById('att_class');
  if(!classSel){ viewAttRecordReadOnly(a); return; }
  if(a.status==='Approved'){ showToast('⚠ ಈಗಾಗಲೇ Principal Approve ಮಾಡಿದ್ದಾರೆ — ಬದಲಾಯಿಸಲು ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ'); }
  classSel.value=a.className;
  document.getElementById('att_date').value=a.date;
  loadAttStudents();
  document.getElementById('attGridWrap')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function viewAttRecordReadOnly(a){
  const wrap=document.getElementById('attViewOnlyWrap'); if(!wrap) return;
  const rows=a.records.map(r=>{ const st=(DB.students||[]).find(x=>x.id===r.studentId); return {name:st?st.studentName:'?', admissionNo:st?st.admissionNo:'', status:r.status}; })
    .sort((x,y)=>x.status===y.status?x.name.localeCompare(y.name):(x.status==='Absent'?-1:1));
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--navy);"><h3>👁 ${esc(a.className)}ನೇ ತರಗತಿ — ${fmtDate(a.date)} — ಹೆಸರುವಾರು ಹಾಜರಾತಿ <button class="btn btn-outline btn-sm" style="float:right;" onclick="document.getElementById('attViewOnlyWrap').innerHTML=''">✕ Close</button></h3>
    <div class="table-wrap"><table><thead><tr><th>#</th><th>ಹೆಸರು</th><th>Admission No.</th><th>ಸ್ಥಿತಿ</th></tr></thead>
    <tbody>${rows.map((r,i)=>`<tr style="${r.status==='Absent'?'background:#fde8e8;':''}"><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.admissionNo)}</td><td>${r.status==='Present'?'✅':'❌'} ${esc(r.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
  wrap.scrollIntoView({behavior:'smooth',block:'center'});
}

function renderAttGrid(students){
  const locked = ATT_LOADED_STATUS==='Approved';
  const btn=(s,status,label)=>{ const on=ATT_STATE[s.id]===status; return `<button ${locked?'disabled':''} class="${on?(status==='Present'?'on-present':'on-absent'):''}" onclick="setAtt('${s.id}','${status}')">${label}</button>`; };
  document.getElementById('attGridWrap').innerHTML = students.length ? `
    ${ATT_LOADED_RECORD_ID?`<div class="note" style="margin-top:10px;">${locked?'🔒 ಈ ದಿನ Principal Approve ಮಾಡಿದ್ದಾರೆ — ವೀಕ್ಷಣೆ ಮಾತ್ರ.':'✏️ ಈ ದಿನದ ಈಗಾಗಲೇ ಇರುವ ಹಾಜರಾತಿ ('+esc(ATT_LOADED_STATUS)+') ಲೋಡ್ ಆಗಿದೆ — ಬದಲಾಯಿಸಿ ಮತ್ತೆ Submit ಮಾಡಬಹುದು.'}</div>`:''}
    <div class="form-actions" style="justify-content:flex-start;margin:10px 0;">
      <button class="btn btn-sm btn-outline" ${locked?'disabled':''} onclick="setAllAtt('Present')">✔ Select All Present</button>
      <button class="btn btn-sm btn-outline" ${locked?'disabled':''} onclick="setAllAtt('Absent')">✔ Select All Absent</button>
    </div>
    <div class="att-grid">${students.map((s,idx)=>`<div class="att-row"><div class="att-name">${idx+1}. ${esc(s.studentName)} (${esc(s.admissionNo)})</div><div class="att-toggle" id="att_toggle_${s.id}">
      ${btn(s,'Present','Present')}
      ${btn(s,'Absent','Absent')}
    </div></div>`).join('')}</div>
    ${locked?'':`<div class="form-actions"><button class="btn btn-primary" onclick="submitAttendance()">${ATT_LOADED_RECORD_ID?'ಬದಲಾವಣೆ Submit ಮಾಡಿ':'Submit'}</button></div>`}
  ` : `<div class="small-muted" style="margin-top:10px;">ಈ ತರಗತಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲೆ ಇಲ್ಲ.</div>`;
}

function setAtt(id,status){
  if(ATT_LOADED_STATUS==='Approved') return;
  ATT_STATE[id]=status;
  const t=document.getElementById('att_toggle_'+id);
  t.querySelectorAll('button').forEach(b=>b.classList.remove('on-present','on-absent'));
  t.querySelector(status==='Present'?'button:first-child':'button:last-child').classList.add(status==='Present'?'on-present':'on-absent');
}

function setAllAtt(status){
  if(ATT_LOADED_STATUS==='Approved') return;
  Object.keys(ATT_STATE).forEach(id=>{ ATT_STATE[id]=status; const t=document.getElementById('att_toggle_'+id); if(t){ t.querySelectorAll('button').forEach(b=>b.classList.remove('on-present','on-absent')); t.querySelector(status==='Present'?'button:first-child':'button:last-child').classList.add(status==='Present'?'on-present':'on-absent'); } });
}

function submitAttendance(){
  if(!ATT_LOADED_CLASS){ showToast('⚠ ಮೊದಲು ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ ತೋರಿಸಿ'); return; }
  if(ATT_LOADED_STATUS==='Approved'){ showToast('⚠ Approved ದಿನವನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ'); return; }
  const date=document.getElementById('att_date').value;
  const records=Object.keys(ATT_STATE).map(id=>({studentId:id,status:ATT_STATE[id]}));
  const existing=ATT_LOADED_RECORD_ID ? DB.attendance.find(a=>a.id===ATT_LOADED_RECORD_ID) : DB.attendance.find(a=>a.className===ATT_LOADED_CLASS && a.date===date && a.markedBy===CURRENT_USER.name);
  if(existing){ existing.records=records; existing.status='Submitted'; }
  else DB.attendance.push({id:uid(), className:ATT_LOADED_CLASS, date, markedBy:CURRENT_USER.name, records, status:'Submitted'});
  saveDB(); showToast('✅ ಹಾಜರಾತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'); ATT_LOADED_RECORD_ID=null; ATT_LOADED_STATUS=null; navigate('attendance');
}

function approveAttendance(id,approve){
  const a=DB.attendance.find(x=>x.id===id); if(!a) return;
  a.status=approve?'Approved':'Rejected'; saveDB();
  pushNotification(a.markedBy,'ನಿಮ್ಮ '+fmtDate(a.date)+' ('+a.className+') ಹಾಜರಾತಿ '+(approve?'ಅನುಮೋದಿಸಲಾಗಿದೆ':'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'));
  showToast('✅ ನವೀಕರಿಸಲಾಗಿದೆ'); navigate('attendance');
}

function renderAttReport(){
  const wrap=document.getElementById('attReportWrap'); if(!wrap) return;
  const cls=document.getElementById('att_report_class')?.value || ATT_CLASSES[0];
  const students=DB.students.filter(s=>s.className===cls);
  const records=DB.attendance.filter(a=>a.className===cls && a.status==='Approved');
  if(!students.length || !records.length){ wrap.innerHTML=`<div class="small-muted">ಸಾಕಷ್ಟು ಅನುಮೋದಿತ ದಾಖಲೆಗಳಿಲ್ಲ.</div>`; return; }
  const rows=students.map(s=>{
    let present=0,total=0;
    records.forEach(r=>{ const rec=r.records.find(x=>x.studentId===s.id); if(rec){ total++; if(rec.status==='Present') present++; } });
    const pct = total? Math.round(present/total*100) : 0;
    return {name:s.studentName, admissionNo:s.admissionNo, present, total, pct};
  });
  const defaulters=rows.filter(r=>r.pct<75);
  wrap.innerHTML=`<div class="table-wrap"><table><thead><tr><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ಹಾಜರಾದ ದಿನ</th><th>ಒಟ್ಟು ದಿನ</th><th>%</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.present}</td><td>${r.total}</td><td><b style="color:${r.pct<75?'var(--red)':'var(--green)'}">${r.pct}%</b></td></tr>`).join('')}</tbody></table></div>
    ${defaulters.length?`<div class="note" style="margin-top:12px;">⚠ Defaulter List (&lt;75%): ${defaulters.map(d=>esc(d.name)).join(', ')}</div>`:''}`;
}

function allExamNames(){ return STANDARD_EXAMS.concat(DB.customExams.map(e=>e.name)); }

function getActivatedExams(cls){
  if(!DB.examActivation) DB.examActivation={};
  return DB.examActivation[cls] || STANDARD_EXAMS.slice(); // sensible default before Principal configures
}

function isExamActivated(cls,exam){ return getActivatedExams(cls).includes(exam) || DB.customExams.some(e=>e.name===exam) || (String(cls)==='10' && SSLC_EXAMS.includes(exam)); }

/* Grade scale of the school's KSEAB result sheets.
   100-mark paper : percentage bands  A+ 90 | A 80 | B+ 70 | B 60 | C+ 50 | C 33 | NC below 33
   80-mark paper  : 9-mark bands      A+ 71 | A 62 | B+ 53 | B 44 | C+ 35 | C 26 | NC below 26   (as in the school's sheet)
   other maximums : the percentage bands, rounded up (C: rounded to the nearest mark)  */
const KSEAB_MARKS_80=[71,62,53,44,35,26];
function kseabGradeScale(maxMarks){
  const m=Number(maxMarks)||100;
  const names=['A+','A','B+','B','C+','C'];
  const mins=(m===80)?KSEAB_MARKS_80:KSEAB_BANDS.slice(0,6).map(([g,pct])=>pct===KSEAB_PASS_PCT?Math.round(m*pct/100):Math.ceil(m*pct/100-1e-9));
  return names.map((g,i)=>({g,min:mins[i]})).concat([{g:'NC',min:0}]);
}
function kseabPassMark(maxMarks){ return kseabGradeScale(maxMarks)[5].min; }
function kseabLegendText(){
  return [100,80].map(mx=>mx+' ಅಂಕ: '+kseabRangeText(kseabGradeScale(mx),mx).map(r=>r.g+' '+r.range).join(', ')).join(' &nbsp;|&nbsp; ');
}

function kseabRangeText(grades,maxMarks){
  const mx=Number(maxMarks);
  return grades.map((x,i)=>{ const hi=i===0?mx:grades[i-1].min-1; return {g:x.g,range:(x.min===hi?String(hi):x.min+'–'+hi)}; });
}

function cceDefaultGrades(examType){
  if(usesKseabScale(examType)) return {maxMarks:100, grades:kseabGradeScale(100)};
  if(CCE_FA_EXAMS.includes(examType))
    return {maxMarks:10, grades:[{g:'A+',min:9},{g:'A',min:7},{g:'B+',min:5},{g:'B',min:3},{g:'C',min:1}]};
  if(CCE_SA_EXAMS.includes(examType))
    return {maxMarks:30, grades:[{g:'A+',min:27},{g:'A',min:21},{g:'B+',min:15},{g:'B',min:9},{g:'C',min:1}]};
  return {maxMarks:100, grades:[{g:'A+',min:90},{g:'A',min:70},{g:'B+',min:50},{g:'B',min:30},{g:'C',min:1}]};
}

function calcGradeFromLock(marks,lock){
  if(!lock||marks===''||marks===null||marks===undefined) return '—';
  const m=Number(marks);
  for(const g of (lock.grades||[])){ if(m>=Number(g.min)) return g.g; }
  return '—';
}

function cceGradeBadge(g){
  const cls=g==='A+'?'badge-ok':g==='A'?'badge-info':g==='B+'||g==='B'?'badge-progress':g==='C+'?'badge-progress':g==='NC'?'badge-bad':'badge-draft';
  return `<span class="badge ${cls}">${g}</span>`;
}

function renderGradeLockPanel(cls,subj,exam){
  if(!DB.gradeLocks) DB.gradeLocks={};
  const key=gradeLockKey(cls,subj,exam);
  const lock=DB.gradeLocks[key];
  const locked=lock&&lock.locked;
  const def=cceDefaultGrades(exam);
  const maxMarks=lock?lock.maxMarks:def.maxMarks;
  const grades=lock?lock.grades:def.grades;
  const kseab=usesKseabScale(exam);
  const gradeNames=kseab?KSEAB_BANDS.map(b=>b[0]):['A+','A','B+','B','C'];
  const ranges=kseab?kseabRangeText(grades,maxMarks):null;

  return `<div class="grade-lock-panel ${locked?'locked':''}">
    <div class="gl-head">
      <div>
        <div class="gl-title">${locked?'🔒 Grade Logic — Locked':'⚙️ Grade Logic Setup — ಅಂಕ ನಮೂದಿಸುವ ಮೊದಲು Grade Logic Lock ಮಾಡಿ'}</div>
        <div class="small-muted" style="margin-top:2px;">${cls}ನೇ ತರಗತಿ · ${esc(subj)} · <b>${esc(exam)}</b>${locked?` · Locked: ${fmtDate(lock.lockedAt)} by ${esc(lock.lockedBy)}`:''}</div>
        ${!locked?`<div class="small-muted" style="margin-top:4px;">CCE ಮಾನದಂಡದ ಪ್ರಕಾರ default ಮೌಲ್ಯಗಳು ಭರ್ತಿ ಆಗಿವೆ. ಬೇಕಿದ್ದರೆ ಬದಲಿಸಿ, ಬಳಿಕ Lock ಮಾಡಿ.</div>`:''}
      </div>
      ${locked?`<button class="btn btn-sm btn-outline" onclick="unlockGradeLogic('${key}')">✏️ Unlock &amp; Edit</button>`:''}
    </div>
    <div class="gl-body">
      <div class="gl-thresholds">
        <div class="kv" style="margin-bottom:8px;"><b style="font-size:12px;">Max Marks:</b>&nbsp;
          ${locked?`<b>${maxMarks}</b>`:
            `<input type="number" id="gl_max" value="${maxMarks}" min="1" style="width:70px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;background:var(--surface);" onchange="updateGLPreview('${cls}','${esc(subj)}','${esc(exam)}')">`}
        </div>
        <table>
          ${kseab?`<thead><tr><th>Grade</th><th>ಅಂಕ ವ್ಯಾಪ್ತಿ (Marks)</th></tr></thead>
          <tbody id="glKseabRows">${(ranges||[]).map(r=>`<tr><td>${cceGradeBadge(r.g)}</td><td><b>${r.range}</b></td></tr>`).join('')}</tbody>`:
          `<thead><tr><th>Grade</th><th>Min Score (≥)</th></tr></thead>
          <tbody>${gradeNames.map((gname,i)=>`<tr>
            <td>${cceGradeBadge(gname)}</td>
            <td>${locked?`<b>${grades[i]?grades[i].min:'—'}</b>`:
              `<input type="number" id="gl_g${i}" value="${grades[i]?grades[i].min:''}" min="0" style="width:68px;padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;background:var(--surface);" onchange="updateGLPreview('${cls}','${esc(subj)}','${esc(exam)}')">`}
            </td>
          </tr>`).join('')}</tbody>`}
        </table>
      </div>
      <div class="gl-preview">
        <div class="small-muted" style="margin-bottom:6px;font-family:var(--font-ui);">Live Preview</div>
        <div id="glPreviewBody">${renderGLPreviewRows(grades,maxMarks)}</div>
      </div>
      <div>
        <div class="small-muted" style="margin-bottom:6px;font-family:var(--font-ui);">CCE ಮಾನದಂಡ</div>
        <div>${kseab?'<div class="small-muted">KSEAB ಗ್ರೇಡ್ ಪದ್ಧತಿ (ಎಲ್ಲ ಶಿಕ್ಷಕರಿಗೂ ಒಂದೇ)</div><div>'+kseabLegendText()+'</div>':CCE_FA_EXAMS.includes(exam)?
          '<div class="small-muted">FA (10 ಅಂಕ)</div><div>A+:≥9 | A:≥7 | B+:≥5 | B:≥3 | C:≥1</div>':
          CCE_SA_EXAMS.includes(exam)?
          '<div class="small-muted">SA (30 ಅಂಕ)</div><div>A+:≥27 | A:≥21 | B+:≥15 | B:≥9 | C:≥1</div>':
          '<div class="small-muted">ಕಸ್ಟಮ್ ಪರೀಕ್ಷೆ</div>'
        }</div>
        <div class="small-muted" style="margin-top:8px;">Semester Total (50):<br>A+:≥45 A:≥35 B+:≥25 B:≥15</div>
      </div>
    </div>
    ${!locked?`<div class="form-actions" style="margin-top:14px;">
      <button class="btn btn-gold" onclick="lockGradeLogic('${cls}','${esc(subj)}','${esc(exam)}')">
        🔒 Grade Logic Lock ಮಾಡಿ — ಅಂಕ ನಮೂದಿಗೆ ಮುಂದುವರಿಯಿರಿ
      </button>
    </div>`:''}
  </div>`;
}

function renderGLPreviewRows(grades,maxMarks){
  const samplePcts=[100,80,60,40,20,0];
  return samplePcts.map(p=>{
    const score=Math.round(Number(maxMarks)*p/100);
    const g=grades.find(x=>score>=Number(x.min));
    return `<div class="pv-row"><span>${score}</span>${cceGradeBadge(g?g.g:'—')}</div>`;
  }).join('');
}

function glReadGrades(exam,max){
  if(usesKseabScale(exam)) return kseabGradeScale(max);       // automatic — teachers cannot change the scale
  return ['A+','A','B+','B','C'].map((g,i)=>({g,min:Number(document.getElementById('gl_g'+i)?.value||0)}));
}

function updateGLPreview(cls,subj,exam){
  const max=Number(document.getElementById('gl_max')?.value||10);
  const grades=glReadGrades(exam,max);
  const prev=document.getElementById('glPreviewBody'); if(prev) prev.innerHTML=renderGLPreviewRows(grades,max);
  if(usesKseabScale(exam)){                                    // recompute the range table as Max Marks changes
    const tb=document.getElementById('glKseabRows');
    if(tb) tb.innerHTML=kseabRangeText(grades,max).map(r=>`<tr><td>${cceGradeBadge(r.g)}</td><td><b>${r.range}</b></td></tr>`).join('');
  }
}

function lockGradeLogic(cls,subj,exam){
  if(!DB.gradeLocks) DB.gradeLocks={};
  const maxMarks=Number(document.getElementById('gl_max')?.value||10);
  if(!maxMarks||maxMarks<1){ showToast('⚠ Max Marks ನಮೂದಿಸಿ'); return; }
  const grades=glReadGrades(exam,maxMarks);
  if(!usesKseabScale(exam)){
    for(let i=1;i<grades.length;i++){
      if(grades[i].min>=grades[i-1].min){ showToast('⚠ Grade thresholds ಕ್ರಮದಲ್ಲಿರಬೇಕು (A+>A>B+>B>C)'); return; }
    }
    if(grades[grades.length-1].min<1){ showToast('⚠ C grade Min score ಕನಿಷ್ಠ 1 ಇರಬೇಕು'); return; }
  }
  const key=gradeLockKey(cls,subj,exam);
  DB.gradeLocks[key]={maxMarks,grades,locked:true,lockedAt:todayStr(),lockedBy:CURRENT_USER.name};
  saveDB();
  showToast('✅ Grade Logic Lock ಆಗಿದೆ — ಈಗ ಅಂಕ ನಮೂದಿಸಬಹುದು');
  loadMarksStudents(cls==='null'?null:cls);
}

function unlockGradeLogic(key){
  if(!confirm('Grade Logic Unlock ಮಾಡುವುದೇ? Unlock ಮಾಡಿದ ನಂತರ ಅಂಕ ನಮೂದು ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲುತ್ತದೆ.')) return;
  if(DB.gradeLocks&&DB.gradeLocks[key]) DB.gradeLocks[key].locked=false;
  saveDB(); showToast('✏️ Unlocked — ಬದಲಾವಣೆ ಮಾಡಿ ಮರು Lock ಮಾಡಿ');
  navigate(CURRENT_PAGE);
}

function renderMarksEntry(forcedClass, examList, pageTitle){
  if(CURRENT_USER.role==='fda'){
    document.getElementById('content').innerHTML=`
      <div class="page-head"><h2>🧮 ಅಂಕ ನಮೂದು</h2></div>
      <div class="panel" style="text-align:center;padding:40px;">
        <div style="font-size:40px;margin-bottom:10px;">🚫</div>
        <h3>FDA — View Only</h3>
        <p style="color:var(--muted);">FDA ಗೆ ಅಂಕ ನಮೂದು/ಸಂಪಾದನೆ ಅನುಮತಿ ಇಲ್ಲ. Approved ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಲು "ಫಲಿತಾಂಶ Register (FDA)" ಪುಟಕ್ಕೆ ಹೋಗಿ.</p>
        <button class="btn btn-primary" onclick="navigate('fdaexamregister')" style="margin-top:10px;">📋 ಫಲಿತಾಂಶ Register ಗೆ ಹೋಗಿ</button>
      </div>`;
    return;
  }
  const isTeacher = CURRENT_USER.role==='staff';
  const asg = isTeacher ? getAssignment(CURRENT_USER.hrmsId) : null;
  if(isTeacher && !forcedClass && (!asg.subjects.length || !asg.classes.length)){
    document.getElementById('content').innerHTML=`
      <div class="page-head"><h2>🧮 ಅಂಕ ನಮೂದು</h2></div>
      <div class="note" style="background:#fff3e0;border-color:#e65100;">⚠ Principal ಇನ್ನೂ ನಿಮಗೆ ವಿಷಯ/ತರಗತಿ ನಿಯೋಜಿಸಿಲ್ಲ. "ಶಿಕ್ಷಕ-ವಿಷಯ ನಿಯೋಜನೆ" ಪುಟದಲ್ಲಿ Principal ಅವರನ್ನು ಕೇಳಿ.</div>`;
    return;
  }
  const exams = examList || (isTeacher && !forcedClass ? examNamesForClass(asg.classes.includes('10')?'10':asg.classes[0]||'6') : allExamNames());
  const classes = forcedClass ? [forcedClass] : (isTeacher ? asg.classes : CLASSES);
  const subjOpts = isTeacher ? asg.subjects : SUBJECTS;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>${esc(pageTitle||'ಅಂಕ ನಮೂದು (Marks Entry)')}</h2>
    </div>
    ${consTopHtml()}
    ${!forcedClass && CURRENT_USER.role==='staff' ? `<div class="panel"><h3>➕ Custom Exam Creation</h3>
      <div class="form-grid">
        <div class="field"><label>Exam Name</label><input id="ce_name"></div>
        <div class="field"><label>Maximum Marks</label><input type="number" id="ce_max" value="100"></div>
        <div class="field"><label>Minimum (Pass) Marks</label><input type="number" id="ce_min" value="35"></div>
      </div>
      <div class="form-actions"><button class="btn btn-outline btn-sm" onclick="addCustomExam()">Create Exam</button></div>
    </div>`:''}
    <div class="panel"><h3>📝 ಅಂಕ ನಮೂದಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>Exam</label><select id="mk_exam" onchange="document.getElementById('marksGridWrap').innerHTML=''">${exams.map(e=>`<option>${esc(e)}</option>`).join('')}</select></div>
        <div class="field"><label>ತರಗತಿ</label><select id="mk_class" ${forcedClass?'disabled':''} onchange="document.getElementById('marksGridWrap').innerHTML=''">${classes.map(c=>`<option ${forcedClass===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label>ವಿಷಯ</label>${isTeacher&&subjOpts.length===1?`<input type="hidden" id="mk_subject" value="${esc(subjOpts[0])}"><input value="${esc(subjOpts[0])}" readonly style="background:var(--surface-2);">`:`<select id="mk_subject" onchange="document.getElementById('marksGridWrap').innerHTML=''">${subjOpts.map(s=>`<option>${esc(s)}</option>`).join('')}</select>`}</div>
      </div>
      <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="loadMarksStudents(${forcedClass?`'${forcedClass}'`:'null'})">▶ Grade Logic &amp; ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ ತೋರಿಸಿ</button></div>
      <div id="marksGridWrap"></div>
    </div>
    <div class="panel"><h3>📋 ಸಲ್ಲಿಕೆಗಳ ಪಟ್ಟಿ</h3>
      <div class="table-wrap"><table><thead><tr><th>Exam</th><th>ತರಗತಿ</th><th>ವಿಷಯ</th><th>ಶಿಕ್ಷಕರು</th><th>Max</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
      <tbody>${(()=>{
        let list=DB.marks.filter(m=> forcedClass ? m.className===forcedClass : true);
        if(CURRENT_USER.role==='staff') list=list.filter(m=> m.createdBy===CURRENT_USER.name || isClassTeacherOf(m.className));
        list=list.slice().reverse();
        if(!list.length) return `<tr class="empty-row"><td colspan="7">ದಾಖಲೆಗಳಿಲ್ಲ.</td></tr>`;
        return list.map(m=>{
          const btns=[];
          if(m.createdBy===CURRENT_USER.name && ['Draft','Submitted','Class Teacher Verified'].includes(m.status)) btns.push(`<button class="btn btn-sm btn-outline" onclick="marksEdit('${m.id}')">✏ Edit</button>`);
          if(CURRENT_USER.role==='principal' && ['Approved','FDA Acknowledged'].includes(m.status)) btns.push(`<button class="btn btn-sm btn-gold" onclick="marksReopen('${m.id}')">🔓 Reopen</button>`);
          if(['Approved','FDA Acknowledged'].includes(m.status) && CURRENT_USER.role==='staff' && (m.createdBy===CURRENT_USER.name||isClassTeacherOf(m.className))) btns.push(`<button class="btn btn-sm btn-gold" onclick="marksReopen('${m.id}')">🔓 Reopen — ತಿದ್ದಿ ಮತ್ತೆ Upload</button>`);
          if(m.status==='Class Teacher Verified' && m.reopenedBy && CURRENT_USER.role==='staff' && isClassTeacherOf(m.className)) btns.push(`<button class="btn btn-sm btn-green" onclick="marksClassApprove('${m.id}')">✅ Approve (ಕ್ಲಾಸ್ ಟೀಚರ್)</button>`);
          if(CURRENT_USER.role==='principal' && m.reopenReq && ['Approved','FDA Acknowledged'].includes(m.status)) btns.push(`<span class="badge badge-warn" title="${esc(m.reopenReq.reason)}">⚠ ಕೋರಿಕೆ: ${esc(m.reopenReq.by)} — ${esc(m.reopenReq.reason)}</span>`);
          if(m.status==='Draft' && m.createdBy===CURRENT_USER.name) btns.push(`<button class="btn btn-sm btn-green" onclick="marksTransition('${m.id}','Submitted')">✍️ E-Sign & Submit</button>`);
          if(m.status==='Returned' && m.createdBy===CURRENT_USER.name) btns.push(`<button class="btn btn-sm btn-gold" onclick="loadMarksStudentsForRecord('${m.id}')">✏️ ತಿದ್ದಿ Resubmit</button>`);
          if(m.status==='Submitted' && CURRENT_USER.role==='staff' && isClassTeacherOf(m.className)) btns.push(`<button class="btn btn-sm btn-green" onclick="consVerify('${m.id}')">Verify</button>`);
          btns.push(`<button class="btn btn-sm btn-outline" onclick="viewMarksSignatures('${m.id}')">👁</button>`);
          const lockSt=getGradeLock(m.className,m.subject,m.examName);
          const lockIcon=lockSt&&lockSt.locked?'🔒':'⚠️';
          return `<tr><td>${esc(m.examName)}</td><td>${esc(m.className)}</td><td>${esc(m.subject)}</td><td>${esc(m.createdBy)}</td><td>${m.maxMarks||'—'} ${lockIcon}</td><td><span class="badge ${badgeClass(m.status)}">${esc(consStatusLabel(m.status))}</span></td><td class="actions-cell">${btns.join('')}</td></tr>`;
        }).join('');
      })()}</tbody></table></div>
    </div>
    ${consPanelHtml()}
    ${(CURRENT_USER.role==='staff' && isClassTeacherAny()) || CURRENT_USER.role==='principal' ? `<div class="panel"><h3>📑 CCE Consolidated Sheet (Class Teacher)</h3>
      <div class="note">ಎಲ್ಲಾ 6 Assessments (FA1/FA2/SA1/FA3/FA4/SA2) ನ Sem1, Sem2, Grand Total, % ಮತ್ತು ಫಲಿತಾಂಶ ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕ. ಸ್ಥಿತಿ: Frozen/Approved/FDA Acknowledged ಅಂಕ ಮಾತ್ರ ತೋರಿಸುತ್ತದೆ.</div>
      <div class="form-grid">
        <div class="field"><label>ತರಗತಿ</label><select id="cons_class">${(CURRENT_USER.role==='principal'?CLASSES:myClassesAsTeacher()).map(c=>`<option>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="generateConsolidated()">📊 CCE Consolidated Sheet Generate ಮಾಡಿ</button></div>
      <div id="consolidatedWrap"></div>
    </div>`:''}
  `;
}

function addCustomExam(){
  const name=document.getElementById('ce_name').value, max=Number(document.getElementById('ce_max').value||100);
  const min=Number(document.getElementById('ce_min').value||35);
  if(!name){ showToast('⚠ Exam Name ಅಗತ್ಯ'); return; }
  DB.customExams.push({id:uid(), name, maxMarks:max, minMarks:min, createdBy:CURRENT_USER.name});
  saveDB(); showToast('✅ ಹೊಸ ಪರೀಕ್ಷೆ ಸೃಷ್ಟಿಸಲಾಗಿದೆ'); navigate('marks');
}

function loadMarksStudents(forcedClass){
  const exam=document.getElementById('mk_exam').value;
  const cls=forcedClass||document.getElementById('mk_class').value;
  const subject=document.getElementById('mk_subject').value;
  const students=DB.students.filter(s=>s.className===cls);

  // Exam activation check (staff only — Principal can still work with any exam for admin purposes)
  if(CURRENT_USER.role==='staff' && !isExamActivated(cls,exam)){
    document.getElementById('marksGridWrap').innerHTML=`<div class="note" style="background:#fff3e0;border-color:#e65100;margin-top:10px;">
      ⚠ Principal ಇನ್ನೂ <b>${esc(exam)}</b> ಪರೀಕ್ಷೆಯನ್ನು ${esc(cls)}ನೇ ತರಗತಿಗೆ Activate ಮಾಡಿಲ್ಲ.
    </div>`;
    return;
  }

  // Always show grade lock panel
  const lock=getGradeLock(cls,subject,exam);
  let html=renderGradeLockPanel(cls,subject,exam);

  if(!lock||!lock.locked){
    // Don't show marks table until grade is locked
    document.getElementById('marksGridWrap').innerHTML=html;
    setTimeout(()=>updateGLPreview(cls,subject,exam),80);
    return;
  }

  // Grade locked — show marks entry table
  MARKS_LOADED={exam,cls,subject,recordId:null};
  const existing=DB.marks.find(m=>m.examName===exam&&m.className===cls&&m.subject===subject&&m.createdBy===CURRENT_USER.name);
  if(existing) MARKS_LOADED.recordId=existing.id;
  const marksMap={}, absentMap={}, exemptMap={}, remarksMap={};
  if(existing) existing.entries.forEach(e=>{ marksMap[e.studentId]=e.marks; absentMap[e.studentId]=e.absent||false; exemptMap[e.studentId]=e.exempted||false; remarksMap[e.studentId]=e.remarks||''; });
  const canEdit=!existing||['Draft','Rejected','Returned'].includes(existing.status);

  html+=!canEdit?'':`<div class="form-actions no-print" style="margin-top:12px;">
    <button class="btn btn-sm btn-gold" onclick="downloadMarksTemplate('${cls}','${esc(subject)}','${esc(exam)}',${lock.maxMarks})">⬇ Excel Template Download</button>
    <label class="btn btn-sm btn-outline" style="cursor:pointer;">📂 Excel Bulk Upload
      <input type="file" accept=".xlsx,.xls" style="display:none;" onchange="uploadMarksExcel(this,'${cls}','${gradeLockKey(cls,subject,exam)}')">
    </label>
  </div>`;

  html+= students.length ? (
    !canEdit ? `<div class="note" style="margin-top:10px;">ಈ ದಾಖಲೆ "${esc(existing.status)}" ಸ್ಥಿತಿಯಲ್ಲಿದೆ — ಸಂಪಾದನೆ ಸಾಧ್ಯವಿಲ್ಲ.
      ${existing.teacherSignedAt?`<br>✅ E-Signed: ${esc(existing.teacherSignedDate)} ${esc(existing.teacherSignedAt)}`:''}
      ${consEditHint(existing)}
      ${existing.remarks?`<br>📝 Principal Remarks: <span style="color:var(--red);">${esc(existing.remarks)}</span>`:''}
    </div>` : `
    <div class="table-wrap" style="margin-top:14px;"><table class="marks-table"><thead><tr>
      <th style="width:36px;">#</th><th>ಹೆಸರು</th><th>SATS</th><th>ತಂದೆಯ ಹೆಸರು</th>
      <th>ಅಂಕ <span style="font-weight:400;opacity:.7;">(/ ${lock.maxMarks})</span></th><th>Grade</th>
      <th>Absent</th><th>Exempted</th><th>Remarks</th>
    </tr></thead>
    <tbody>${students.map((s,idx)=>{
      const sv=marksMap[s.id]!==undefined?marksMap[s.id]:'';
      const isAbs=absentMap[s.id]||false, isExempt=exemptMap[s.id]||false;
      const g=isAbs?'AB':isExempt?'EX':(sv!==''?calcGradeFromLock(sv,lock):'—');
      return `<tr>
        <td>${idx+1}</td>
        <td style="font-weight:600;">${esc(s.studentName)}</td>
        <td>${esc(s.satsNo||'—')}</td>
        <td>${esc(s.fatherName||'—')}</td>
        <td><input class="marks-input" type="number" min="0" max="${lock.maxMarks}" id="mk_score_${s.id}" value="${sv}" ${isAbs||isExempt?'disabled':''}
          oninput="updateRowGrade('${s.id}','${gradeLockKey(cls,subject,exam)}')" onchange="validateMark(this,${lock.maxMarks})"></td>
        <td id="mk_grade_${s.id}">${cceGradeBadge(g)}</td>
        <td style="text-align:center;"><input type="checkbox" id="mk_abs_${s.id}" ${isAbs?'checked':''} onchange="toggleAbsExempt('${s.id}','abs','${gradeLockKey(cls,subject,exam)}')"></td>
        <td style="text-align:center;"><input type="checkbox" id="mk_exempt_${s.id}" ${isExempt?'checked':''} onchange="toggleAbsExempt('${s.id}','exempt','${gradeLockKey(cls,subject,exam)}')"></td>
        <td><input id="mk_remarks_${s.id}" value="${esc(remarksMap[s.id]||'')}" style="width:100px;font-size:11px;"></td>
      </tr>`;
    }).join('')}</tbody></table></div>
    <div class="form-actions" style="margin-top:10px;">
      <button class="btn btn-outline" onclick="saveMarksRecord(true)">💾 Save Draft</button>
      <button class="btn btn-primary" onclick="saveMarksRecord(false)">✅ E-Sign & Class Teacher ಗೆ Submit ಮಾಡಿ</button>
    </div>`) : `<div class="small-muted" style="margin-top:12px;">ಈ ತರಗತಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲೆ ಇಲ್ಲ — Student Register ನಲ್ಲಿ ಮೊದಲು ಸೇರಿಸಿ.</div>`;

  document.getElementById('marksGridWrap').innerHTML=html;
}

function loadMarksStudentsForRecord(recordId){
  const m=DB.marks.find(x=>x.id===recordId); if(!m) return;
  const classEl=document.getElementById('mk_class'), examEl=document.getElementById('mk_exam'), subjEl=document.getElementById('mk_subject');
  const ensureOpt=(el,val)=>{ if(el && el.tagName==='SELECT' && ![...el.options].some(o=>o.value===val||o.text===val)){ const o=document.createElement('option'); o.text=val; el.add(o); } };
  ensureOpt(classEl,m.className); ensureOpt(examEl,m.examName); ensureOpt(subjEl,m.subject);
  if(classEl && !classEl.disabled) classEl.value=m.className;
  if(examEl) examEl.value=m.examName;
  if(subjEl) subjEl.value=m.subject;
  loadMarksStudents(classEl?.disabled?m.className:null);
  document.getElementById('marksGridWrap')?.scrollIntoView({behavior:'smooth'});
}

function viewMarksSignatures(id){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  const w=document.createElement('div');
  const passN=m.entries.filter(e=>!e.absent&&!e.exempted&&e.marks>=kseabPassMark(m.maxMarks)).length;
  const failN=m.entries.filter(e=>!e.absent&&!e.exempted&&e.marks<kseabPassMark(m.maxMarks)).length;
  const html=`<div style="max-width:480px;">
    <h3 style="margin-bottom:10px;">${esc(m.subject)} — ${esc(m.className)}ನೇ — ${esc(m.examName)}</h3>
    <div style="font-size:12px;margin-bottom:12px;">ಸ್ಥಿತಿ: ${esc(m.status)} | Entries: ${m.entries.length} | ✅ Pass: ${passN} | ❌ Fail: ${failN}
      ${m.remarks?`<br>📝 Remarks: <span style="color:var(--red);">${esc(m.remarks)}</span>`:''}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${m.teacherSignedAt?`<div><div style="font-size:10px;color:var(--muted);">✍️ Subject Teacher${m.teacherServerTime?' (Server Time)':''}</div>${staffSignatureHTMLByName(m.createdBy,m.teacherSignedAt,fmtDate(m.teacherSignedDate),{alignRight:false})}</div>`:''}
      ${m.classTeacherSignedAt?`<div><div style="font-size:10px;color:var(--muted);">✍️ Class Teacher${m.classTeacherServerTime?' (Server Time)':''}</div>${staffSignatureHTMLByName(m.classTeacherName,m.classTeacherSignedAt,fmtDate(m.classTeacherSignedDate),{alignRight:false})}</div>`:''}
      ${m.principalSignedAt?`<div><div style="font-size:10px;color:var(--muted);">✍️ Principal${m.principalServerTime?' (Server Time)':''}</div>${principalSignatureHTML(m.principalName,m.principalSignedAt,fmtDate(m.principalSignedDate))}</div>`:''}
    </div>
  </div>`;
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:520px;">${html}<div class="form-actions"><button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">✕ ಮುಚ್ಚಿ</button></div></div>`;
}

function toggleAbsExempt(studentId, kind, lockKey){
  const absEl=document.getElementById('mk_abs_'+studentId), exEl=document.getElementById('mk_exempt_'+studentId);
  const scoreEl=document.getElementById('mk_score_'+studentId), gradeEl=document.getElementById('mk_grade_'+studentId);
  if(kind==='abs' && absEl.checked) exEl.checked=false;
  if(kind==='exempt' && exEl.checked) absEl.checked=false;
  const disable=absEl.checked||exEl.checked;
  scoreEl.disabled=disable;
  if(disable) scoreEl.value='';
  gradeEl.innerHTML=cceGradeBadge(absEl.checked?'AB':exEl.checked?'EX':'—');
}

function downloadMarksTemplate(cls,subject,exam,maxMarks){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const nm=s=>String(s.studentNameEn||'').trim();
  const students=DB.students.filter(s=>s.className===cls).slice().sort((a,b)=>{ const x=nm(a),y=nm(b); if(x&&!y) return -1; if(!x&&y) return 1; return (x||a.studentName||'').toLowerCase().localeCompare((y||b.studentName||'').toLowerCase()); });
  const header=['SATS ID','Student Name (English)','Marks (out of '+maxMarks+')'];
  const rows=students.map(s=>[s.satsNo||'',nm(s)||s.studentName||'',''] );
  const noEn=students.filter(s=>!nm(s)).length;
  if(noEn) showToast('⚠ '+noEn+' ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ English ಹೆಸರು ಇಲ್ಲ — ಕನ್ನಡ ಹೆಸರು ಬಳಸಲಾಗಿದೆ (ಕೊನೆಯಲ್ಲಿ)',6000);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Marks Template');
  XLSX.writeFile(wb,`Marks_${cls}_${subject}_${exam}.xlsx`.replace(/\s+/g,'_'));
  showToast('✅ Template Download ಆಯಿತು');
}

function uploadMarksExcel(inputEl,cls,lockKey){
  const file=inputEl.files[0]; if(!file) return;
  if(!document.querySelectorAll('input[id^="mk_score_"]').length){ showToast('⚠ ಅಂಕ ಪಟ್ಟಿ ತೆರೆದಿಲ್ಲ — ಈಗಾಗಲೇ ಸಲ್ಲಿಸಿದ ಅಂಕ ಬದಲಿಸಲು ಮೊದಲು ಪಟ್ಟಿಯಲ್ಲಿ "✏ Edit" ಒತ್ತಿ, ನಂತರ Excel ಅಪ್‌ಲೋಡ್ ಮಾಡಿ'); inputEl.value=''; return; }
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const lock=DB.gradeLocks[lockKey];
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1}).slice(1).filter(r=>r&&r.some(c=>String(c||'').trim()!==''));
    let matched=0, unmatched=[], blank=0;
    rows.forEach(r=>{
      const satsId=String(r[0]||'').trim();
      const name=String(r[1]||'').trim();
      const marks=r[2];
      if(marks===undefined||marks===''){ blank++; return; }
      let student = satsId ? DB.students.find(s=>s.className===cls&&s.satsNo===satsId) : null;
      if(!student && name) student = DB.students.find(s=>s.className===cls&&((s.studentName||'').toLowerCase().trim()===name.toLowerCase()||(s.studentNameEn||'').toLowerCase().trim()===name.toLowerCase()));
      if(!student){ unmatched.push(satsId||name||'?'); return; }
      const scoreEl=document.getElementById('mk_score_'+student.id);
      if(scoreEl){
        scoreEl.value=marks; scoreEl.disabled=false;
        document.getElementById('mk_abs_'+student.id).checked=false;
        document.getElementById('mk_exempt_'+student.id).checked=false;
        updateRowGrade(student.id,lockKey);
        matched++;
      }
    });
    let msg=`✅ ${matched} ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕ Excel ನಿಂದ ಭರ್ತಿಯಾಗಿದೆ — ಪರಿಶೀಲಿಸಿ Save/Submit ಮಾಡಿ`;
    if(unmatched.length) msg+=` | ⚠ ಹೊಂದಾಣಿಕೆಯಾಗದ ${unmatched.length}: ${unmatched.slice(0,5).join(', ')}${unmatched.length>5?'…':''}`;
    showToast(msg, unmatched.length?7000:4000);
    inputEl.value='';
  };
  reader.readAsArrayBuffer(file);
}

function validateMark(input, max){
  const v=Number(input.value);
  if(v>max){ input.value=max; showToast(`⚠ Max marks ${max} ಮೀರಿದೆ`); }
  if(v<0) input.value=0;
}

function updateRowGrade(studentId, lockKey){
  const el=document.getElementById('mk_score_'+studentId);
  const ge=document.getElementById('mk_grade_'+studentId);
  if(!el||!ge) return;
  if(!DB.gradeLocks) return;
  const lock=DB.gradeLocks[lockKey];
  const g=calcGradeFromLock(el.value,lock);
  ge.innerHTML=cceGradeBadge(g);
}

async function saveMarksRecord(asDraft){
  if(!MARKS_LOADED) return;
  const lock=getGradeLock(MARKS_LOADED.cls,MARKS_LOADED.subject,MARKS_LOADED.exam);
  const students=DB.students.filter(s=>s.className===MARKS_LOADED.cls);
  const entries=students.map(s=>{
    const absent=document.getElementById('mk_abs_'+s.id)?.checked||false;
    const exempted=document.getElementById('mk_exempt_'+s.id)?.checked||false;
    const remarks=document.getElementById('mk_remarks_'+s.id)?.value||'';
    const marks=(absent||exempted)?0:Number(document.getElementById('mk_score_'+s.id)?.value||0);
    const grade=absent?'AB':exempted?'EX':calcGradeFromLock(marks,lock);
    return {studentId:s.id, marks, grade, absent, exempted, remarks};
  });
  let rec=MARKS_LOADED.recordId?DB.marks.find(m=>m.id===MARKS_LOADED.recordId):null;
  const isNew=!rec;
  if(rec){ rec.entries=entries; rec.status=asDraft?'Draft':'Submitted'; rec.maxMarks=lock?lock.maxMarks:null; }
  else { rec={id:uid(), academicYear:defaultAcademicYear(), examName:MARKS_LOADED.exam, className:MARKS_LOADED.cls, subject:MARKS_LOADED.subject, createdBy:CURRENT_USER.name, entries, maxMarks:lock?lock.maxMarks:null, status:asDraft?'Draft':'Submitted'}; DB.marks.push(rec); }
  logAudit(isNew?'Create':'Edit','Marks',rec.id,`${MARKS_LOADED.subject} ${MARKS_LOADED.cls} ${MARKS_LOADED.exam}`);
  if(!asDraft){
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    rec.teacherSignedAt=ts.time; rec.teacherSignedDate=ts.date; rec.teacherServerTime=ts.server;
    logAudit('Teacher E-Signature','Marks',rec.id,`${ts.date} ${ts.time}`);
  }
  const _consRes=asDraft?null:consAfterSubmit(rec);
  saveDB();
  showToast(asDraft?'💾 Draft ಉಳಿಸಲಾಗಿದೆ':(_consRes==='auto'?'✅ ಅಂಕ ಸಲ್ಲಿಸಲಾಗಿದೆ — ನೀವೇ ಕ್ಲಾಸ್ ಟೀಚರ್ ಆದ್ದರಿಂದ ಸ್ವಯಂ ಪರಿಶೀಲನೆ ಆಗಿದೆ':'✅ E-Sign ಆಗಿದೆ — ಕ್ಲಾಸ್ ಟೀಚರ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'));
  navigate(CURRENT_PAGE==='sslc'?'sslc':'marks');
}

async function marksTransition(id,to){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  if(to==='Submitted'){
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    m.teacherSignedAt=ts.time; m.teacherSignedDate=ts.date; m.teacherServerTime=ts.server;
    logAudit('Teacher E-Signature','Marks',id,`${ts.date} ${ts.time}`);
  }
  if(to==='Frozen'){
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    m.classTeacherName=CURRENT_USER.name; m.classTeacherSignedAt=ts.time; m.classTeacherSignedDate=ts.date; m.classTeacherServerTime=ts.server;
    logAudit('Teacher E-Signature','Marks',id,`Class Teacher Lock: ${ts.date} ${ts.time}`);
  }
  if(to==='Approved'){
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    m.principalName=CURRENT_USER.name; m.principalSignedAt=ts.time; m.principalSignedDate=ts.date; m.principalServerTime=ts.server;
    logAudit('Principal E-Signature','Marks',id,`${ts.date} ${ts.time}`);
  }
  if(to==='Returned'){
    const reason=prompt('Return For Correction — ಕಾರಣ (ಕಡ್ಡಾಯ):');
    if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
    m.remarks=reason.trim();
    logAudit('Return for Correction','Marks',id,reason);
  }
  m.status=to; if(to==='Submitted') consAfterSubmit(m); saveDB();
  if(to==='Approved') pushNotification(m.createdBy,'ನಿಮ್ಮ '+m.subject+' ('+m.className+') ಅಂಕಗಳು ಅನುಮೋದಿಸಲಾಗಿದೆ');
  if(to==='Rejected') pushNotification(m.createdBy,'ನಿಮ್ಮ '+m.subject+' ('+m.className+') ಅಂಕಗಳು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ');
  showToast('✅ ನವೀಕರಿಸಲಾಗಿದೆ: '+to); navigate(CURRENT_PAGE);
}

function generateConsolidated(){
  const cls=document.getElementById('cons_class').value;
  const wrap=document.getElementById('consolidatedWrap');
  wrap.innerHTML=buildConsolidatedHTML(cls);
}

function buildConsolidatedHTML(cls){
  const students=DB.students.filter(s=>s.className===cls);

  if(!students.length){ return `<div class="small-muted" style="margin-top:10px;">ಈ ತರಗತಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳ ದಾಖಲೆ ಇಲ್ಲ.</div>`; }

  // Gather approved marks for all 6 CCE exams × all subjects
  const approvedStatuses=['Frozen','Approved','FDA Acknowledged'];

  // Build map: subject → exam → {studentId → {marks, grade}}
  const dataMap={}; // dataMap[subject][exam][studentId]
  SUBJECTS.forEach(subj=>{
    dataMap[subj]={};
    CCE_ALL_EXAMS.forEach(exam=>{
      dataMap[subj][exam]={};
      const rec=DB.marks.find(m=>m.className===cls&&m.subject===subj&&m.examName===exam&&approvedStatuses.includes(m.status));
      if(rec) rec.entries.forEach(e=>{ dataMap[subj][exam][e.studentId]={marks:e.marks,grade:e.grade}; });
    });
  });

  // Determine which subjects have any data
  const activeSubjects=SUBJECTS.filter(subj=>CCE_ALL_EXAMS.some(ex=>Object.keys(dataMap[subj][ex]).length>0));

  if(!activeSubjects.length){
    return `<div class="small-muted" style="margin-top:10px;">ಯಾವುದೇ Frozen/Approved ಅಂಕಗಳಿಲ್ಲ. ವಿಷಯ ಶಿಕ್ಷಕರು Freeze ಮಾಡಿದ ನಂತರ ಕಾಣಿಸುತ್ತದೆ.</div>`;
  }

  // Header rows
  let thead=`<tr style="background:var(--navy);color:#fff;">
    <th rowspan="3">#</th><th rowspan="3">ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು</th><th rowspan="3">SATS</th>
    ${activeSubjects.map(s=>`<th colspan="8" style="text-align:center;">${esc(s)}</th>`).join('')}
    <th colspan="2" class="sem-header" rowspan="1">Sem 1</th>
    <th colspan="2" class="sem-header" rowspan="1">Sem 2</th>
    <th colspan="3" class="gt-header" rowspan="1">Grand Total</th>
    <th rowspan="3">Result</th>
  </tr><tr style="background:var(--navy-dark);color:#dce6f0;font-size:11px;">
    ${activeSubjects.map(()=>`
      <th>AS-1<br><small>FA1</small></th><th>Gr</th>
      <th>AS-2<br><small>FA2</small></th><th>Gr</th>
      <th>SA-1</th><th>Gr</th>
      <th>AS-3<br><small>FA3</small></th><th>Gr</th>
    `).join('')}
    <th>Total<br>/50</th><th>Grade</th>
    <th>Total<br>/50</th><th>Grade</th>
    <th>GT<br>/100</th><th>%</th><th>Grade</th>
  </tr><tr style="background:var(--navy-dark);color:#dce6f0;font-size:11px;">
    ${activeSubjects.map(()=>`
      <th>AS-4<br><small>FA4</small></th><th>Gr</th>
      <th>SA-2</th><th>Gr</th><th colspan="2"></th><th colspan="2"></th>
    `).join('')}
    <th colspan="2"></th><th colspan="2"></th><th colspan="3"></th>
  </tr>`;

  // Data rows - two sub-rows per student (row 1: FA1,FA2,SA1,FA3 | row 2: FA4,SA2)
  let tbody='';
  let classTotal=0,classPassCount=0;

  students.forEach((s,idx)=>{
    let sem1=0, sem2=0;
    const subjectCells1=[]; // row1: AS1,Gr,AS2,Gr,SA1,Gr,AS3,Gr
    const subjectCells2=[]; // row2: AS4,Gr,SA2,Gr,empty,empty,empty,empty

    activeSubjects.forEach(subj=>{
      const fa1=dataMap[subj]['FA-1'][s.id];
      const fa2=dataMap[subj]['FA-2'][s.id];
      const sa1=dataMap[subj]['SA-1'][s.id];
      const fa3=dataMap[subj]['FA-3'][s.id];
      const fa4=dataMap[subj]['FA-4'][s.id];
      const sa2=dataMap[subj]['SA-2'][s.id];

      // Subject sem1 = FA1+FA2+SA1, max=50
      const ssubSem1=(fa1?fa1.marks:0)+(fa2?fa2.marks:0)+(sa1?sa1.marks:0);
      const ssubSem2=(fa3?fa3.marks:0)+(fa4?fa4.marks:0)+(sa2?sa2.marks:0);
      sem1+=ssubSem1; sem2+=ssubSem2;

      const cell=(e)=>e?e.marks:'—';
      const gcell=(e)=>e?cceGradeBadge(e.grade||'—'):'—';

      subjectCells1.push(`<td>${cell(fa1)}</td><td>${gcell(fa1)}</td><td>${cell(fa2)}</td><td>${gcell(fa2)}</td><td>${cell(sa1)}</td><td>${gcell(sa1)}</td><td>${cell(fa3)}</td><td>${gcell(fa3)}</td>`);
      subjectCells2.push(`<td>${cell(fa4)}</td><td>${gcell(fa4)}</td><td>${cell(sa2)}</td><td>${gcell(sa2)}</td><td colspan="2"></td><td colspan="2"></td>`);
    });

    const gt=sem1+sem2;
    const pct=Math.round(gt/CCE_GT_MAX*100);
    const result=pct>=35?'<span class="badge badge-ok">Promoted</span>':'<span class="badge badge-bad">Detained</span>';
    classTotal++; if(pct>=35) classPassCount++;

    tbody+=`<tr>
      <td rowspan="2" style="text-align:center;font-weight:700;">${idx+1}</td>
      <td rowspan="2" style="font-weight:600;">${esc(s.studentName)}</td>
      <td rowspan="2">${esc(s.satsNo||'—')}</td>
      ${subjectCells1.join('')}
      <td rowspan="2" style="font-weight:700;text-align:center;">${sem1}</td>
      <td rowspan="2" style="text-align:center;">${cceGradeBadge(semTotalGrade(sem1,50))}</td>
      <td rowspan="2" style="font-weight:700;text-align:center;">${sem2}</td>
      <td rowspan="2" style="text-align:center;">${cceGradeBadge(semTotalGrade(sem2,50))}</td>
      <td rowspan="2" style="font-weight:800;text-align:center;color:var(--navy);">${gt}</td>
      <td rowspan="2" style="text-align:center;">${pct}%</td>
      <td rowspan="2" style="text-align:center;">${cceGradeBadge(semTotalGrade(gt,100))}</td>
      <td rowspan="2" style="text-align:center;">${result}</td>
    </tr><tr>${subjectCells2.join('')}</tr>`;
  });

  const passPct=classTotal?Math.round(classPassCount/classTotal*100):0;

  return `
    <div style="margin-top:14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <h4 style="margin:0;color:var(--navy);">📊 ${cls}ನೇ ತರಗತಿ — CCE Consolidated Sheet</h4>
      <span class="badge badge-ok">${classPassCount}/${classTotal} Promoted (${passPct}%)</span>
      <button class="btn btn-gold btn-sm" onclick="printEl(document.getElementById('cceSheetBox'))">🖨️ Print / PDF</button>
      <button class="btn btn-outline btn-sm" onclick="downloadConsolidatedExcel('${cls}')">⬇ Excel</button>
    </div>
    <div class="table-wrap" id="cceSheetBox"><table class="consolidated-sheet marks-table">
      <thead>${thead}</thead>
      <tbody>${tbody}</tbody>
    </table></div>
    <div class="small-muted" style="margin-top:8px;">Sem1=FA1+FA2+SA1 (Max 50) · Sem2=FA3+FA4+SA2 (Max 50) · GT=Sem1+Sem2 (Max 100) · Pass: ≥35%</div>`;
}

function downloadConsolidatedExcel(cls){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const students=DB.students.filter(s=>s.className===cls);
  const approvedStatuses=['Frozen','Approved','FDA Acknowledged'];
  const header=['Student Name','SATS',...SUBJECTS.flatMap(s=>[s+' Sem1',s+' Sem2']),'Grand Total','%','Result'];
  const rows=students.map(s=>{
    let gt=0; const cells=[];
    SUBJECTS.forEach(subj=>{
      let sem1=0,sem2=0;
      CCE_SEM1.forEach(ex=>{ const rec=DB.marks.find(m=>m.className===cls&&m.subject===subj&&m.examName===ex&&approvedStatuses.includes(m.status)); const e=rec?.entries.find(x=>x.studentId===s.id); if(e) sem1+=e.marks; });
      CCE_SEM2.forEach(ex=>{ const rec=DB.marks.find(m=>m.className===cls&&m.subject===subj&&m.examName===ex&&approvedStatuses.includes(m.status)); const e=rec?.entries.find(x=>x.studentId===s.id); if(e) sem2+=e.marks; });
      gt+=sem1+sem2; cells.push(sem1,sem2);
    });
    const pct=Math.round(gt/CCE_GT_MAX*100);
    return [s.studentName,s.satsNo||'',...cells,gt,pct+'%',pct>=35?'Promoted':'Detained'];
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Consolidated');
  XLSX.writeFile(wb,`Consolidated_${cls}.xlsx`);
  showToast('✅ Excel Download ಆಯಿತು');
}

const RES_CLASSES=['6','7','8','9','10'];
function resExamsFor(cls){
  const ok=['Approved','FDA Acknowledged'];
  const recs=(DB.marks||[]).filter(m=>String(m.className)===String(cls));
  const approved=[], pending=[];
  recs.forEach(m=>{ const n=m.examName; if(ok.includes(m.status)){ if(!approved.includes(n)) approved.push(n); } });
  recs.forEach(m=>{ const n=m.examName; if(!approved.includes(n)&&!pending.includes(n)) pending.push(n); });
  return {approved,pending};
}
function resFill(run){
  const c=document.getElementById('res_class'), e=document.getElementById('res_exam'); if(!c||!e) return;
  const x=resExamsFor(c.value), cur=e.value;
  e.innerHTML=x.approved.map(n=>`<option value="${esc(n)}">${esc(n)} ✓</option>`).join('')+x.pending.map(n=>`<option value="${esc(n)}">${esc(n)} (ಅನುಮೋದನೆ ಬಾಕಿ)</option>`).join('');
  if(!x.approved.length&&!x.pending.length) e.innerHTML='<option value="">— ಅಂಕ ನಮೂದಾಗಿಲ್ಲ —</option>';
  if([...e.options].some(o=>o.value===cur)) e.value=cur;
  if(run) computeResults();
}
function renderResults(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಫಲಿತಾಂಶ ವಿಶ್ಲೇಷಣೆ (Result Analysis)</h2><div class="desc">ಅನುಮೋದಿತ ಅಂಕಗಳಿಂದ ಸ್ವಯಂಚಾಲಿತ ವಿಶ್ಲೇಷಣೆ — ತರಗತಿ ಆರಿಸಿದರೆ ಅಂಕ ನಮೂದಾದ ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳು ಪಟ್ಟಿಯಲ್ಲಿ ಬರುತ್ತವೆ (✓ = ಅನುಮೋದಿತ)</div></div>
    <div class="panel"><div class="form-grid">
      <div class="field"><label>ತರಗತಿ</label><select id="res_class" onchange="resFill(true)">${RES_CLASSES.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Exam</label><select id="res_exam" onchange="computeResults()"></select></div>
      <input type="hidden" id="res_max" value="100">
    </div>
    <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="computeResults()">ವಿಶ್ಲೇಷಿಸಿ</button></div>
    </div>
    <div id="resultsWrap"></div>`;
  const first=RES_CLASSES.find(k=>resExamsFor(k).approved.length)||RES_CLASSES.find(k=>resExamsFor(k).pending.length)||'6';
  document.getElementById('res_class').value=first;
  resFill(true);
}

function computeResults(){
  const exam=document.getElementById('res_exam').value, cls=document.getElementById('res_class').value, maxMarks=Number(document.getElementById('res_max').value||100);
  const students=DB.students.filter(s=>s.className===cls);
  const records=DB.marks.filter(m=>m.className===cls && m.examName===exam && ['Approved','FDA Acknowledged'].includes(m.status));
  const wrap=document.getElementById('resultsWrap');
  if(!records.length || !students.length){
    const all=DB.marks.filter(m=>String(m.className)===String(cls)&&m.examName===exam);
    wrap.innerHTML=`<div class="panel"><div class="small-muted">${all.length?'ಈ ಪರೀಕ್ಷೆ ಇನ್ನೂ ಪ್ರಾಂಶುಪಾಲರಿಂದ ಅನುಮೋದನೆ ಆಗಿಲ್ಲ — ಅನುಮೋದನೆಯ ನಂತರ ವಿಶ್ಲೇಷಣೆ ಕಾಣುತ್ತದೆ.<br>'+all.map(m=>esc(m.subject)+': '+esc(consStatusLabel(m.status))).join(' &nbsp;|&nbsp; '):'ಅನುಮೋದಿತ ಅಂಕಗಳಿಲ್ಲ.'}</div></div>`; return; }

  const barChart=(items)=>{ // items: [{label, value, max, color}]
    const maxV=Math.max(...items.map(i=>i.max||i.value||1));
    return `<div style="display:flex;flex-direction:column;gap:6px;">${items.map(i=>`
      <div style="display:flex;align-items:center;gap:8px;font-size:11px;">
        <div style="width:90px;text-align:right;flex-shrink:0;">${esc(i.label)}</div>
        <div style="flex:1;background:var(--surface-2);border-radius:4px;overflow:hidden;height:16px;">
          <div style="width:${maxV?Math.max(2,(i.value/maxV*100)):0}%;background:${i.color||'var(--navy)'};height:100%;"></div>
        </div>
        <div style="width:44px;font-weight:700;">${i.value}${i.suffix||''}</div>
      </div>`).join('')}</div>`;
  };

  // Subject-wise stats using each record's own actual maxMarks (accurate, not a guess)
  const gradeTiers=['A+','A','B+','B','C+','C','NC'];
  let subjectRows='', subjChartItems=[], gradeAllCounts={A_:0,A:0,B_:0,B:0,C:0}; // placeholder keys unused
  const gradeCountTotal={}; gradeTiers.forEach(g=>gradeCountTotal[g]=0);
  let aboveAvgAll=[], belowAvgAll=[];

  records.forEach(r=>{
    const activeEntries=r.entries.filter(e=>!e.absent&&!e.exempted);
    const scores=activeEntries.map(e=>e.marks);
    if(!scores.length) return;
    const rMax=r.maxMarks||maxMarks;
    const highest=Math.max(...scores), lowest=Math.min(...scores);
    const avg=(scores.reduce((a,b)=>a+b,0)/scores.length);
    const avgRounded=Math.round(avg);
    const passCount=activeEntries.filter(e=>e.grade&&e.grade!=='—'&&e.grade!=='NC').length; // NC (below 35%) is not a pass
    const passPct=Math.round(passCount/activeEntries.length*100);
    subjectRows+=`<tr><td>${esc(r.subject)}</td><td>${highest}/${rMax}</td><td>${lowest}/${rMax}</td><td>${avgRounded}/${rMax}</td><td>${passPct}%</td><td>${100-passPct}%</td></tr>`;
    subjChartItems.push({label:r.subject, value:Math.round(avg/rMax*100), max:100, suffix:'%', color:avg/rMax>=0.6?'var(--green)':avg/rMax>=0.35?'var(--gold)':'var(--red)'});
    gradeTiers.forEach(g=>{ gradeCountTotal[g]+=activeEntries.filter(e=>e.grade===g).length; });
    // above/below average for this subject
    activeEntries.forEach(e=>{
      const student=students.find(s=>s.id===e.studentId);
      if(!student) return;
      if(e.marks>=avg) aboveAvgAll.push(`${student.studentName} (${r.subject})`);
      else belowAvgAll.push(`${student.studentName} (${r.subject})`);
    });
  });

  const totals=students.map(s=>{
    let total=0,count=0;
    records.forEach(r=>{ const e=r.entries.find(x=>x.studentId===s.id); if(e&&!e.absent&&!e.exempted){ total+=e.marks; count+=(r.maxMarks||maxMarks); } });
    const pct = count? Math.round(total/count*100) : 0;
    return {name:s.studentName, pct};
  }).filter(t=>t.pct>0||true);

  const sortedPcts=totals.map(t=>t.pct).sort((a,b)=>a-b);
  const median = sortedPcts.length ? (sortedPcts.length%2 ? sortedPcts[(sortedPcts.length-1)/2] : Math.round((sortedPcts[sortedPcts.length/2-1]+sortedPcts[sortedPcts.length/2])/2)) : 0;
  const overallAvg = totals.length? Math.round(totals.reduce((a,t)=>a+t.pct,0)/totals.length) : 0;
  const overallPassPct = totals.length? Math.round(totals.filter(t=>t.pct>=(usesKseabScale(exam)?KSEAB_PASS_PCT:35)).length/totals.length*100) : 0;

  const bands=[['90-100',90,100],['80-89',80,89],['70-79',70,79],['60-69',60,69],['50-59',50,59],['Below 50',0,49]];
  const bandCounts=bands.map(([label,lo,hi])=>({label,count:totals.filter(t=>t.pct>=lo&&t.pct<=hi).length}));
  const highAchievers=totals.filter(t=>t.pct>=80).map(t=>t.name);
  const avgLearners=totals.filter(t=>t.pct>=50&&t.pct<80).map(t=>t.name);
  const slowLearners=totals.filter(t=>t.pct<50).map(t=>t.name);

  wrap.innerHTML=`
    <div class="cards-grid">
      <div class="stat-card"><div class="n">${overallAvg}%</div><div class="l">Class Average</div></div>
      <div class="stat-card"><div class="n">${median}%</div><div class="l">Median</div></div>
      <div class="stat-card"><div class="n">${overallPassPct}%</div><div class="l">✅ Pass %</div></div>
      <div class="stat-card"><div class="n">${100-overallPassPct}%</div><div class="l">❌ Fail %</div></div>
    </div>

    <div class="panel"><h3>📊 Subject Wise Percentage (Graph)</h3>${barChart(subjChartItems)}</div>

    <div class="panel"><h3>📈 Subject-wise Report</h3><div class="table-wrap"><table><thead><tr><th>ವಿಷಯ</th><th>Highest</th><th>Lowest</th><th>Average</th><th>Pass %</th><th>Fail %</th></tr></thead><tbody>${subjectRows}</tbody></table></div></div>

    <div class="panel"><h3>🏅 Grade Distribution (Graph)</h3>${barChart(gradeTiers.map(g=>({label:g,value:gradeCountTotal[g],max:Math.max(...Object.values(gradeCountTotal),1),color:g==='A+'?'var(--green)':g==='A'?'var(--navy)':g==='NC'?'var(--red)':'var(--gold)'})))}</div>

    <div class="panel"><h3>📐 Marks-wise Distribution (Overall %)</h3>${barChart(bandCounts.map(b=>({label:b.label,value:b.count,max:Math.max(...bandCounts.map(x=>x.count),1)})))}</div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${highAchievers.length}</div><div class="l">🌟 High Achievers (≥80%)</div></div>
      <div class="stat-card"><div class="n">${avgLearners.length}</div><div class="l">📘 Average Learners (50-79%)</div></div>
      <div class="stat-card"><div class="n">${slowLearners.length}</div><div class="l">🐢 Slow Learners (&lt;50%)</div></div>
    </div>
    ${highAchievers.length?`<div class="note" style="background:var(--green-tint);border-color:var(--green);">🌟 High Achievers: ${highAchievers.map(esc).join(', ')}</div>`:''}
    ${slowLearners.length?`<div class="note" style="background:#fde8e8;border-color:var(--red);">🐢 Slow Learners: ${slowLearners.map(esc).join(', ')}</div>`:''}

    ${(CURRENT_USER.role==='principal'||CURRENT_USER.role==='staff')?`<div class="panel"><h3>📝 Teacher Remarks / Suggested Action Plan</h3>
      <textarea id="examremarks_text" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;">${esc((DB.examRemarks||[]).find(r=>r.className===cls&&r.examName===exam)?.remarks||'')}</textarea>
      <div class="form-actions"><button class="btn btn-sm btn-primary" onclick="saveExamRemarks('${cls}','${esc(exam)}')">💾 Save</button></div>
    </div>`:''}
    <div class="form-actions"><button class="btn btn-gold" onclick="downloadResultsExcel('${cls}','${esc(exam)}')">⬇ Excel Export</button></div>
  `;
}

function saveExamRemarks(cls,exam){
  const text=document.getElementById('examremarks_text')?.value||'';
  if(!DB.examRemarks) DB.examRemarks=[];
  let rec=DB.examRemarks.find(r=>r.className===cls&&r.examName===exam);
  if(rec) rec.remarks=text; else DB.examRemarks.push({id:uid(),className:cls,examName:exam,remarks:text,createdBy:CURRENT_USER.name,createdAt:todayStr()});
  logAudit('Edit','ExamRemarks',cls+'-'+exam,'');
  saveDB(); showToast('✅ Save ಆಗಿದೆ');
}

function downloadResultsExcel(cls,exam){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const records=DB.marks.filter(m=>m.className===cls && m.examName===exam && ['Approved','FDA Acknowledged'].includes(m.status));
  const students=DB.students.filter(s=>s.className===cls);
  const header=['Student Name','SATS ID',...records.map(r=>r.subject+' (/'+(r.maxMarks||100)+')'),'Total','%'];
  const rows=students.map(s=>{
    let total=0,max=0;
    const marks=records.map(r=>{
      const e=r.entries.find(x=>x.studentId===s.id);
      if(e&&!e.absent&&!e.exempted){ total+=e.marks; max+=(r.maxMarks||100); return e.marks; }
      return e?(e.absent?'AB':'EX'):'—';
    });
    const pct = max?Math.round(total/max*100):0;
    return [s.studentName,s.satsNo||'',...marks,total,pct+'%'];
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Results');
  XLSX.writeFile(wb,`Results_${cls}_${exam}.xlsx`.replace(/\s+/g,'_'));
  showToast('✅ Excel Download ಆಯಿತು');
}

function renderSSLC(){
  if(CURRENT_USER.role==='staff' && !isClassTeacherOf('10') && CURRENT_USER.role!=='principal'){
    document.getElementById('content').innerHTML=`<div class="page-head"><h2>SSLC ಡ್ಯಾಶ್‌ಬೋರ್ಡ್</h2></div><div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">ಈ ಮಾಡ್ಯೂಲ್ 10ನೇ ತರಗತಿಯ Class Teacher ಗೆ ಮಾತ್ರ.</div></div>`;
    return;
  }
  renderMarksEntry('10', SSLC_EXAMS, 'SSLC ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (10ನೇ ತರಗತಿ)');
}

function getAssignment(hrmsId){
  const saved=(DB.teacherAssignments||{})[hrmsId];
  if(saved) return saved;
  const s=STAFF.find(x=>x.hrmsId===hrmsId);
  const desig=(s?.desig||'').toLowerCase();
  let subjects=[];
  for(const [kw,subj] of EDU_SUBJECT_MAP){ if(desig.includes(kw)){ subjects=[subj]; break; } }
  const isTeaching = s && s.role==='staff' ? !NON_TEACHING_KEYWORDS.some(k=>desig.includes(k)) : false;
  return { subjects, classes: isTeaching?['6','7','8','9','10']:[], isTeaching };
}

function validateEduFile(file){
  const okExt=['doc','docx','pdf'];
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(!okExt.includes(ext)) return {ok:false,msg:'⚠ PDF, DOC ಅಥವಾ DOCX ಫೈಲ್ ಮಾತ್ರ ಅನುಮತಿ (.pdf/.doc/.docx)'};
  if(file.size>10*1024*1024) return {ok:false,msg:'⚠ ಗರಿಷ್ಠ 10 MB ಗಾತ್ರ ಮಾತ್ರ ಅನುಮತಿ'};
  return {ok:true};
}

function renderEduPlan(kind){
  EDU_EDIT_ID=null;
  const L=EDU_LABELS[kind];
  if(!DB[L.store]) DB[L.store]=[];

  // Access control
  if(CURRENT_USER.role==='staff'){
    const asg=getAssignment(CURRENT_USER.hrmsId);
    if(!asg.isTeaching){
      document.getElementById('content').innerHTML=`
        <div class="page-head"><h2>${L.ic} ${L.title}</h2></div>
        <div class="panel" style="text-align:center;padding:40px;">
          <div style="font-size:40px;margin-bottom:10px;">🚫</div>
          <h3>ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ (Access Denied)</h3>
          <p style="color:var(--muted);">ಈ ವಿಭಾಗ ಬೋಧಕ ಸಿಬ್ಬಂದಿ ಮತ್ತು ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಮಾತ್ರ. ನೀವು "ಬೋಧಕೇತರ" ಎಂದು ಗುರುತಿಸಲ್ಪಟ್ಟಿದ್ದೀರಿ.</p>
        </div>`;
      return;
    }
  } else if(CURRENT_USER.role!=='principal'){
    document.getElementById('content').innerHTML=`<div class="panel"><h3>🚫 ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ</h3></div>`;
    return;
  }

  if(CURRENT_USER.role==='principal') renderEduPlanPrincipal(kind);
  else renderEduPlanTeacher(kind);
}

function eduStatusBadge(status){
  const map={Draft:'badge-info',Submitted:'badge-warn',Returned:'badge-warn',Approved:'badge-ok',Rejected:'badge-bad'};
  const labelMap={Draft:'📝 Draft',Submitted:'⏳ Submitted',Returned:'↩ Returned',Approved:'✅ Approved',Rejected:'❌ Rejected'};
  return `<span class="badge ${map[status]||''}">${labelMap[status]||status}</span>`;
}

function renderEduPlanTeacher(kind){
  const L=EDU_LABELS[kind];
  const asg=getAssignment(CURRENT_USER.hrmsId);
  const mine=DB[L.store].filter(p=>p.createdByHrmsId===CURRENT_USER.hrmsId);
  const counts={Draft:0,Submitted:0,Returned:0,Approved:0,Rejected:0};
  mine.forEach(p=>{ if(counts[p.status]!==undefined) counts[p.status]++; });

  const noAssign = !asg.subjects.length || !asg.classes.length;

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>${L.ic} ${L.title}</h2>
    <div class="desc">ನಿಮ್ಮ ವಿಷಯ: <b>${asg.subjects.join(', ')||'—'}</b> | ನಿಮ್ಮ ತರಗತಿ: <b>${asg.classes.join(', ')||'—'}</b></div></div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${counts.Draft}</div><div class="l">📝 Draft</div></div>
      <div class="stat-card"><div class="n">${counts.Submitted}</div><div class="l">⏳ Submitted</div></div>
      <div class="stat-card"><div class="n">${counts.Returned}</div><div class="l">↩ Returned</div></div>
      <div class="stat-card"><div class="n">${counts.Approved}</div><div class="l">✅ Approved</div></div>
      <div class="stat-card"><div class="n">${counts.Rejected}</div><div class="l">❌ Rejected</div></div>
    </div>

    ${noAssign?`<div class="note" style="background:#fff3e0;border-color:#e65100;">⚠ Principal ಇನ್ನೂ ನಿಮಗೆ ವಿಷಯ/ತರಗತಿ ನಿಯೋಜಿಸಿಲ್ಲ. "ಶಿಕ್ಷಕ-ವಿಷಯ ನಿಯೋಜನೆ" ಪುಟದಲ್ಲಿ Principal ಅವರನ್ನು ಕೇಳಿ.</div>`:`
    <div class="panel" id="eduFormPanel">${eduPlanFormHTML(kind, asg)}</div>`}

    <div class="panel">
      <h3>📋 ನನ್ನ ${L.title} ಪಟ್ಟಿ (${mine.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>Plan No.</th><th>ವಿಷಯ</th><th>ತರಗತಿ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಸ್ಥಿತಿ</th><th>ದಿನಾಂಕ</th><th>Action</th>
      </tr></thead><tbody>
        ${mine.length?mine.slice().reverse().map(p=>`<tr>
          <td style="font-size:11px;">${esc(p.planNo)}</td>
          <td>${esc(p.subject)}</td>
          <td>${esc(p.className)}ನೇ</td>
          <td><b>${esc(p.title)}</b></td>
          <td>${eduStatusBadge(p.status)}${p.remarks&&(p.status==='Returned'||p.status==='Rejected')?`<div style="font-size:10px;color:var(--red);margin-top:2px;">${esc(p.remarks)}</div>`:''}</td>
          <td style="font-size:11px;">${fmtDate(p.createdAt)}</td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-outline" onclick="viewEduPlan('${kind}','${p.id}')">👁</button>
            ${(p.status==='Draft'||p.status==='Returned')?`
              <button class="btn btn-sm btn-gold" onclick="editEduPlan('${kind}','${p.id}')">✏️</button>
              <button class="btn btn-sm btn-primary" onclick="submitEduPlan('${kind}','${p.id}')">📤 Submit</button>`:''}
            ${p.status==='Draft'?`<button class="btn btn-sm btn-red" onclick="deleteEduPlan('${kind}','${p.id}')">🗑</button>`:''}
            ${p.fileData?`<button class="btn btn-sm" style="background:#e3f2fd;" onclick="downloadEduFile('${kind}','${p.id}')">⬇</button>`:''}
          </td>
        </tr>`).join(''):`<tr class="empty-row"><td colspan="7">ಯಾವ ${L.title} ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="eduDetailPanel"></div>`;
}

function eduPlanFormHTML(kind, asg, editItem){
  const L=EDU_LABELS[kind];
  const subjOpts = asg.subjects.length===1
    ? `<input type="hidden" id="edu_subject" value="${esc(asg.subjects[0])}"><input value="${esc(asg.subjects[0])}" readonly style="background:var(--surface-2);">`
    : `<select id="edu_subject">${asg.subjects.map(s=>`<option ${editItem?.subject===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const classOpts = `<select id="edu_class">${asg.classes.map(c=>`<option ${editItem?.className===c?'selected':''}>${c}</option>`).join('')}</select>`;
  return `<h3>${editItem?'✏️ Edit':'➕ ಹೊಸ'} ${L.title}</h3>
    <div class="form-grid">
      <div class="field"><label>ವಿಷಯ (Subject)</label>${subjOpts}</div>
      <div class="field"><label>ತರಗತಿ (Class)</label>${classOpts}</div>
      ${kind==='lesson'?`<div class="field"><label>ಅವಧಿ (ದಿನಾಂಕ/ವಾರ/ತಿಂಗಳು)</label><input id="edu_period" value="${esc(editItem?.periodLabel||'')}" placeholder="ಉದಾ: 25-09-2026 ಅಥವಾ 4ನೇ ವಾರ"></div>`:
      `<div class="field"><label>ಶೈಕ್ಷಣಿಕ ವರ್ಷ</label><input id="edu_period" value="${esc(editItem?.periodLabel||defaultAcademicYear())}" readonly style="background:var(--surface-2);"></div>`}
      <div class="field" style="grid-column:1/-1;"><label>ಶೀರ್ಷಿಕೆ / ಪಾಠದ ಹೆಸರು <span class="req-star">*</span></label>
        <input id="edu_title" value="${esc(editItem?.title||'')}" placeholder="ಉದಾ: Chapter 3 - Fractions"></div>
      <div class="field" style="grid-column:1/-1;"><label>ವಿವರ / ಟಿಪ್ಪಣಿ</label>
        <textarea id="edu_desc" rows="4" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;">${esc(editItem?.description||'')}</textarea></div>
      <div class="field" style="grid-column:1/-1;"><label>📎 File Upload — PDF / DOC / DOCX (ಗರಿಷ್ಠ 10MB, ಐಚ್ಛಿಕ)</label>
        <input type="file" id="edu_file" accept=".pdf,.doc,.docx" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
        ${editItem?.fileName?`<div style="font-size:11px;color:var(--muted);margin-top:3px;">ಪ್ರಸ್ತುತ ಫೈಲ್: 📎 ${esc(editItem.fileName)} (ಹೊಸ ಫೈಲ್ Choose ಮಾಡದಿದ್ದರೆ ಇದೇ ಉಳಿಯುತ್ತದೆ)</div>`:''}
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-gold" onclick="saveEduPlan('${kind}',false)">💾 Draft ಆಗಿ Save</button>
      <button class="btn btn-primary" onclick="saveEduPlan('${kind}',true)">📤 Save & Principal ಗೆ Submit</button>
      ${editItem?`<button class="btn btn-outline" onclick="renderEduPlan('${kind}')">✕ Cancel</button>`:''}
    </div>`;
}

function editEduPlan(kind,id){
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  EDU_EDIT_ID=id;
  const asg=getAssignment(CURRENT_USER.hrmsId);
  const panel=document.getElementById('eduFormPanel');
  if(panel) panel.innerHTML=eduPlanFormHTML(kind, asg, item);
  panel?.scrollIntoView({behavior:'smooth'});
}

async function saveEduPlan(kind, submitNow){
  const L=EDU_LABELS[kind];
  const subject=document.getElementById('edu_subject')?.value;
  const className=document.getElementById('edu_class')?.value;
  const periodLabel=document.getElementById('edu_period')?.value||'';
  const title=document.getElementById('edu_title')?.value?.trim();
  const description=document.getElementById('edu_desc')?.value||'';
  const fileEl=document.getElementById('edu_file');
  const file=fileEl?.files[0];
  if(!subject||!className){ showToast('⚠ ವಿಷಯ ಮತ್ತು ತರಗತಿ ಅಗತ್ಯ'); return; }
  if(!title){ showToast('⚠ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ'); return; }
  if(file){ const v=validateEduFile(file); if(!v.ok){ showToast(v.msg); return; } }

  const doSave=async(fileData,fileName,fileType)=>{
    let item;
    const isEdit=!!EDU_EDIT_ID;
    if(isEdit){
      item=DB[L.store].find(x=>x.id===EDU_EDIT_ID);
      if(!item) return;
      item.subject=subject; item.className=className; item.periodLabel=periodLabel;
      item.title=title; item.description=description;
      if(fileData){ item.fileData=fileData; item.fileName=fileName; item.fileType=fileType; }
      item.updatedAt=todayStr();
      logAudit('Edit',kind==='lesson'?'LessonPlan':'YearPlan',item.id,title);
    } else {
      item={
        id:uid(), planNo:L.prefix+'-'+nextSeq(kind+'plan')+'/'+defaultAcademicYear(),
        kind, subject, className, periodLabel, title, description,
        fileData:fileData||null, fileName:fileName||null, fileType:fileType||null,
        status:'Draft', createdBy:CURRENT_USER.name, createdByHrmsId:CURRENT_USER.hrmsId,
        createdAt:todayStr(), updatedAt:todayStr(),
        teacherSignedAt:null, teacherSignedDate:null, teacherServerTime:false,
        principalName:null, principalSignedAt:null, principalSignedDate:null, principalServerTime:false,
        remarks:null, history:[{action:'Created',by:CURRENT_USER.name,at:todayStr()}]
      };
      DB[L.store].push(item);
      logAudit('Create',kind==='lesson'?'LessonPlan':'YearPlan',item.id,title);
    }
    saveDB();
    if(submitNow){ await doSubmitEduPlan(kind,item.id); }
    else { showToast('💾 Draft Save ಆಗಿದೆ'); EDU_EDIT_ID=null; renderEduPlan(kind); }
  };

  if(file){
    const reader=new FileReader();
    reader.onload=e=>{ doSave(e.target.result,file.name,file.type); logAudit('Upload',kind==='lesson'?'LessonPlan':'YearPlan',EDU_EDIT_ID||'new',file.name); };
    reader.readAsDataURL(file);
  } else {
    doSave(null,null,null);
  }
}

async function submitEduPlan(kind,id){ await doSubmitEduPlan(kind,id); }

async function doSubmitEduPlan(kind,id){
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  item.status='Submitted';
  item.teacherSignedAt=ts.time; item.teacherSignedDate=ts.date; item.teacherServerTime=ts.server;
  item.remarks=null;
  item.history.push({action:'Submitted',by:CURRENT_USER.name,at:todayStr()});
  logAudit('Submit',kind==='lesson'?'LessonPlan':'YearPlan',id,item.title);
  logAudit('Teacher E-Signature',kind==='lesson'?'LessonPlan':'YearPlan',id,`${ts.date} ${ts.time} (server=${ts.server})`);
  saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,`📘 ${L.title} ಸಲ್ಲಿಕೆ: ${CURRENT_USER.name} — ${item.subject} (${item.className}ನೇ) | "${L.title}" ನಲ್ಲಿ Review ಮಾಡಿ`);
  showToast('✅ Principal ಗೆ Submit ಆಗಿದೆ — E-Signed');
  EDU_EDIT_ID=null;
  renderEduPlan(kind);
}

function deleteEduPlan(kind,id){
  if(!confirm('ಅಳಿಸುವುದೇ?')) return;
  const L=EDU_LABELS[kind];
  logAudit('Delete',kind==='lesson'?'LessonPlan':'YearPlan',id,'');
  DB[L.store]=DB[L.store].filter(x=>x.id!==id);
  saveDB(); renderEduPlan(kind);
}

function downloadEduFile(kind,id){
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item?.fileData) return;
  logAudit('Download',kind==='lesson'?'LessonPlan':'YearPlan',id,item.fileName);
  saveDB();
  const a=document.createElement('a'); a.href=item.fileData; a.download=item.fileName||'plan'; a.click();
}

function viewEduPlan(kind,id){
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  const panel=document.getElementById('eduDetailPanel'); if(!panel) return;
  panel.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;">${esc(item.planNo)} — ${esc(item.title)}</h3>
      <button class="btn btn-sm btn-outline" onclick="document.getElementById('eduDetailPanel').innerHTML=''">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:14px;">
      <div class="kv"><b>ವಿಷಯ:</b> ${esc(item.subject)}</div>
      <div class="kv"><b>ತರಗತಿ:</b> ${esc(item.className)}ನೇ</div>
      <div class="kv"><b>ಶಿಕ್ಷಕರು:</b> ${esc(item.createdBy)}</div>
      <div class="kv"><b>ಸ್ಥಿತಿ:</b> ${eduStatusBadge(item.status)}</div>
      <div class="kv" style="grid-column:1/-1;"><b>ವಿವರ:</b> ${esc(item.description||'—')}</div>
      ${item.remarks?`<div class="kv" style="grid-column:1/-1;"><b>Principal Remarks:</b> <span style="color:var(--red);">${esc(item.remarks)}</span></div>`:''}
      ${item.fileName?`<div class="kv" style="grid-column:1/-1;"><b>File:</b> 📎 ${esc(item.fileName)} <button class="btn btn-sm btn-gold" onclick="downloadEduFile('${kind}','${item.id}')">⬇ Download</button></div>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      ${item.teacherSignedAt?`<div>
        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">${item.teacherServerTime?'✅ Server Timestamp':'⏱ Device Time (offline fallback)'}</div>
        ${staffSignatureHTMLByName(item.createdBy, item.teacherSignedAt, fmtDate(item.teacherSignedDate), {alignRight:false})}
      </div>`:'<div></div>'}
      ${item.principalSignedAt?`<div>
        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;text-align:right;">${item.principalServerTime?'✅ Server Timestamp':'⏱ Device Time (offline fallback)'}</div>
        ${principalSignatureHTML(item.principalName, item.principalSignedAt, fmtDate(item.principalSignedDate))}
      </div>`:''}
    </div>
  </div>`;
  panel.scrollIntoView({behavior:'smooth'});
}

function renderEduPlanPrincipal(kind){
  const L=EDU_LABELS[kind];
  const all=DB[L.store]||[];
  const fSubject=document.getElementById('eduf_subject')?.value||'';
  const fClass=document.getElementById('eduf_class')?.value||'';
  const fTeacher=document.getElementById('eduf_teacher')?.value||'';
  const fStatus=document.getElementById('eduf_status')?.value||'';

  const counts={Draft:0,Submitted:0,Returned:0,Approved:0,Rejected:0};
  all.forEach(p=>{ if(counts[p.status]!==undefined) counts[p.status]++; });

  const bySubject={}, byTeacher={}, byClass={};
  all.forEach(p=>{
    bySubject[p.subject]=(bySubject[p.subject]||0)+1;
    byTeacher[p.createdBy]=(byTeacher[p.createdBy]||0)+1;
    byClass[p.className]=(byClass[p.className]||0)+1;
  });

  const teachStaff=STAFF.filter(s=>s.role==='staff'&&getAssignment(s.hrmsId).isTeaching);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>${L.ic} ${L.title} — Principal Dashboard</h2>
    <div class="desc">ಎಲ್ಲಾ ಶಿಕ್ಷಕರ ${L.title} ವೀಕ್ಷಿಸಿ, Approve/Reject/Return ಮಾಡಿ</div></div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${all.length}</div><div class="l">ಒಟ್ಟು</div></div>
      <div class="stat-card"><div class="n">${counts.Submitted}</div><div class="l">⏳ Pending Approval</div></div>
      <div class="stat-card"><div class="n">${counts.Approved}</div><div class="l">✅ Approved</div></div>
      <div class="stat-card"><div class="n">${counts.Returned}</div><div class="l">↩ Returned</div></div>
      <div class="stat-card"><div class="n">${counts.Rejected}</div><div class="l">❌ Rejected</div></div>
    </div>

    <div class="panel">
      <h3>📊 Breakdown</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;font-size:12px;">
        <div><b>ವಿಷಯವಾರು (Subject-wise)</b><br>${Object.entries(bySubject).map(([k,v])=>`${esc(k)}: <b>${v}</b>`).join('<br>')||'—'}</div>
        <div><b>ಶಿಕ್ಷಕವಾರು (Teacher-wise)</b><br>${Object.entries(byTeacher).map(([k,v])=>`${esc(k)}: <b>${v}</b>`).join('<br>')||'—'}</div>
        <div><b>ತರಗತಿವಾರು (Class-wise)</b><br>${Object.entries(byClass).map(([k,v])=>`${esc(k)}ನೇ: <b>${v}</b>`).join('<br>')||'—'}</div>
      </div>
    </div>

    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="eduf_teacher" onchange="renderEduPlan('${kind}')"><option value="">ಎಲ್ಲಾ ಶಿಕ್ಷಕರು</option>${teachStaff.map(s=>`<option ${fTeacher===s.name?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
        <select id="eduf_subject" onchange="renderEduPlan('${kind}')"><option value="">ಎಲ್ಲಾ ವಿಷಯ</option>${SUBJECTS.map(s=>`<option ${fSubject===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
        <select id="eduf_class" onchange="renderEduPlan('${kind}')"><option value="">ಎಲ್ಲಾ ತರಗತಿ</option>${['6','7','8','9','10'].map(c=>`<option ${fClass===c?'selected':''}>${c}</option>`).join('')}</select>
        <select id="eduf_status" onchange="renderEduPlan('${kind}')">
          <option value="">ಎಲ್ಲಾ ಸ್ಥಿತಿ</option>
          ${['Draft','Submitted','Returned','Approved','Rejected'].map(s=>`<option value="${s}" ${fStatus===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="table-wrap"><table><thead><tr>
        <th>Plan No.</th><th>ಶಿಕ್ಷಕರು</th><th>ವಿಷಯ</th><th>ತರಗತಿ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಸ್ಥಿತಿ</th><th>ದಿನಾಂಕ</th><th>Action</th>
      </tr></thead><tbody>
        ${(()=>{
          let list=all.slice();
          if(fSubject) list=list.filter(p=>p.subject===fSubject);
          if(fClass) list=list.filter(p=>p.className===fClass);
          if(fTeacher) list=list.filter(p=>p.createdBy===fTeacher);
          if(fStatus) list=list.filter(p=>p.status===fStatus);
          if(!list.length) return `<tr class="empty-row"><td colspan="8">ಯಾವುದೂ ಇಲ್ಲ.</td></tr>`;
          return list.slice().reverse().map(p=>`<tr>
            <td style="font-size:11px;">${esc(p.planNo)}</td>
            <td>${esc(p.createdBy)}</td>
            <td>${esc(p.subject)}</td>
            <td>${esc(p.className)}ನೇ</td>
            <td><b>${esc(p.title)}</b></td>
            <td>${eduStatusBadge(p.status)}</td>
            <td style="font-size:11px;">${fmtDate(p.createdAt)}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="viewEduPlan('${kind}','${p.id}')">👁</button>
              ${p.fileData?`<button class="btn btn-sm" style="background:#e3f2fd;" onclick="downloadEduFile('${kind}','${p.id}')">⬇</button>`:''}
              ${p.status==='Submitted'?`
                <button class="btn btn-sm btn-primary" onclick="approveEduPlan('${kind}','${p.id}')">✅ Approve</button>
                <button class="btn btn-sm btn-gold" onclick="returnEduPlan('${kind}','${p.id}')">↩ Return</button>
                <button class="btn btn-sm btn-red" onclick="rejectEduPlan('${kind}','${p.id}')">❌ Reject</button>`:''}
            </td>
          </tr>`).join('');
        })()}
      </tbody></table></div>
    </div>
    <div id="eduDetailPanel"></div>`;
}

async function approveEduPlan(kind,id){
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  item.status='Approved';
  item.principalName=CURRENT_USER.name; item.principalSignedAt=ts.time; item.principalSignedDate=ts.date; item.principalServerTime=ts.server;
  item.history.push({action:'Approved',by:CURRENT_USER.name,at:todayStr()});
  logAudit('Approve',kind==='lesson'?'LessonPlan':'YearPlan',id,item.title);
  logAudit('Principal E-Signature',kind==='lesson'?'LessonPlan':'YearPlan',id,`${ts.date} ${ts.time} (server=${ts.server})`);
  saveDB();
  pushNotification(item.createdBy,`✅ ${L.title} Approved: ${item.title} — Principal E-Sign ಆಗಿದೆ`);
  showToast('✅ Approved & E-Signed');
  renderEduPlan(kind);
}

function returnEduPlan(kind,id){
  const reason=prompt('Return ಕಾರಣ (ಕಡ್ಡಾಯ — ಶಿಕ್ಷಕರಿಗೆ ಕಾಣಿಸುತ್ತದೆ):');
  if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  item.status='Returned'; item.remarks=reason.trim();
  item.history.push({action:'Returned',by:CURRENT_USER.name,at:todayStr(),note:reason});
  logAudit('Return for Correction',kind==='lesson'?'LessonPlan':'YearPlan',id,reason);
  saveDB();
  pushNotification(item.createdBy,`↩ ${L.title} Return ಆಗಿದೆ: ${item.title} | ಕಾರಣ: ${reason} — ತಿದ್ದಿ ಮತ್ತೆ Submit ಮಾಡಿ`);
  showToast('↩ Return ಮಾಡಲಾಗಿದೆ');
  renderEduPlan(kind);
}

function rejectEduPlan(kind,id){
  const reason=prompt('Reject ಕಾರಣ (ಕಡ್ಡಾಯ):');
  if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  const L=EDU_LABELS[kind];
  const item=DB[L.store].find(x=>x.id===id); if(!item) return;
  item.status='Rejected'; item.remarks=reason.trim();
  item.history.push({action:'Rejected',by:CURRENT_USER.name,at:todayStr(),note:reason});
  logAudit('Reject',kind==='lesson'?'LessonPlan':'YearPlan',id,reason);
  saveDB();
  pushNotification(item.createdBy,`❌ ${L.title} Reject ಆಗಿದೆ: ${item.title} | ಕಾರಣ: ${reason}`);
  showToast('❌ Reject ಮಾಡಲಾಗಿದೆ');
  renderEduPlan(kind);
}

function mentorStatusBadge(status){
  const cls={'Draft':'draft','Sent to Principal':'pend','Pending Acceptance':'pend','Accepted':'ok','Acknowledged':'ok'};
  const lab={'Draft':'ಕರಡು','Sent to Principal':'ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ ಬಾಕಿ','Pending Acceptance':'ಶಿಕ್ಷಕರ Accept ಬಾಕಿ','Accepted':'ಶಿಕ್ಷಕರು Accept ಮಾಡಿದ್ದಾರೆ','Acknowledged':'FDA Acknowledged'};
  return `<span class="gv-st ${cls[status]||'draft'}">${lab[status]||esc(status)}</span>`;
}

async function mentorSignMeta(o,pfx){
  const ts=await getServerTimeStamp();
  o[pfx+'Stamp']=ts&&ts.iso?taStampText(new Date(ts.iso)):taStampText(new Date());
  o[pfx+'Host']=location.host;
  o[pfx+'Device']=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'Mobile':'Computer';
  o[pfx+'Ip']=await taGetIp();
}
function mentorNicBlock(o,pfx,name,desig,reason,fallbackDate){
  if(!name) return '';
  const stamp=o[pfx+'Stamp']||fallbackDate||'';
  return cbDigiSign({signedBy:name,signStamp:stamp,signHost:o[pfx+'Host']||location.host,signIp:o[pfx+'Ip'],signDevice:o[pfx+'Device'],signDesig:desig},'',reason);
}
function mentorOrderSheets(o){
  const students=(DB.mentorAllocations||[]).filter(a=>(o.studentAllocIds||[]).includes(a.id));
  const PER=26; const chunks=[]; for(let i=0;i<students.length;i+=PER) chunks.push(students.slice(i,i+PER)); if(!chunks.length) chunks.push([]);
  if(chunks[chunks.length-1].length>16) chunks.push([]);
  const web=location.host||'mdrsshedbarieoffice.in';
  const accepted=['Accepted','Acknowledged'].includes(o.status), acked=o.status==='Acknowledged';
  const pr=o.principalSigned!==false&&o.principalName&&o.status!=='Draft'&&o.status!=='Sent to Principal';
  const sigs=`<div style="margin-top:14px;display:flex;flex-direction:column;gap:12px;align-items:flex-end;">
    ${pr?mentorNicBlock(o,'pSig',o.principalName,'Principal','Mentor Allocation Order approved',nicStampText(o.principalSignedAt,fmtDate(o.principalSignedAt))):''}
    ${accepted?mentorNicBlock(o,'mSig',o.mentorName,'Mentor Teacher','Mentor allocation accepted',nicStampText(o.acceptedAt,fmtDate(o.acceptedDate))):''}
    ${acked?mentorNicBlock(o,'aSig',o.ackByFDA,'FDA','Acknowledged',fmtDate(o.ackAt)):''}
  </div>`;
  return chunks.map((ch,ci)=>`<div class="reg-sheet reg-port" style="${ci<chunks.length-1?'page-break-after:always;':''}"><div class="reg-body">
    ${regHead('ಮೆಂಟರ್ ಶಿಕ್ಷಕ ಹಂಚಿಕೆ ಆದೇಶ (Mentor Allocation Order)','ಶೈಕ್ಷಣಿಕ ವರ್ಷ: '+esc(o.academicYear))}
    ${ci===0?`<table style="width:100%;font-size:10pt;margin:6px 0 8px;"><tr><td>ಆದೇಶ ಸಂಖ್ಯೆ: <b>${esc(o.orderNo)}</b></td><td style="text-align:right;">ದಿನಾಂಕ: <b>${fmtDate(o.orderDate)}</b></td></tr>
      <tr><td>ಮೆಂಟರ್ ಶಿಕ್ಷಕರು: <b>${esc(o.mentorName)}</b></td><td style="text-align:right;">ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: <b>${o.totalStudents}</b></td></tr></table>`:'<div style="height:6px;"></div>'}
    <table class="reg-tb" style="font-size:9pt;table-layout:auto;"><thead><tr><th style="width:9%">ಕ್ರ.ಸಂ</th><th style="width:22%">SATS ID</th><th>ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು</th><th style="width:12%">ತರಗತಿ</th><th style="width:12%">ಲಿಂಗ</th></tr></thead><tbody>
    ${ch.map((x,i)=>`<tr><td>${ci*PER+i+1}</td><td>${esc(x.satsId||'—')}</td><td style="text-align:left;">${esc(x.studentName)}</td><td>${esc(x.className)}ನೇ</td><td>${esc(x.gender||'—')}</td></tr>`).join('')}
    </tbody></table>
    ${ci===chunks.length-1?sigs:''}
  </div>${regFoot(ci+1,chunks.length)}</div>`).join('');
}
function mentorOrderPrint(orderId){
  const o=DB.mentorOrders.find(x=>x.id===orderId); if(!o) return;
  regPrint('<div class="reg-wrap">'+mentorOrderSheets(o)+'</div>',false);
}
function viewMentorOrder(orderId){
  const order=DB.mentorOrders.find(x=>x.id===orderId); if(!order) return;
  const panel=document.getElementById('mentorDetailPanel'); if(!panel) return;
  panel.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;gap:8px;margin-bottom:10px;" class="no-print">
      <button class="gv-b pri" onclick="mentorOrderPrint('${order.id}')">Print / PDF</button>
      <button class="gv-b" onclick="document.getElementById('mentorDetailPanel').innerHTML=''">ಮುಚ್ಚಿ</button>
    </div>
    <div style="overflow:auto;background:#eee;padding:8px;"><div class="reg-wrap" style="transform-origin:top left;">${mentorOrderSheets(order).replace(/page-break-after:always;/g,'margin-bottom:12px;')}</div></div>
  </div>`;
  panel.scrollIntoView({behavior:'smooth'});
}

function renderMyMentees(){
  const myOrders=(DB.mentorOrders||[]).filter(o=>o.mentorHrmsId===CURRENT_USER.hrmsId&&!['Draft','Sent to Principal'].includes(o.status));
  const pending=myOrders.filter(o=>o.status==='Pending Acceptance');
  const accepted=myOrders.filter(o=>o.status!=='Pending Acceptance');
  const myMentees=(DB.mentorAllocations||[]).filter(a=>a.mentorHrmsId===CURRENT_USER.hrmsId&&a.active);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🧑‍🏫 ನನ್ನ ಮೆಂಟರ್ ವಿದ್ಯಾರ್ಥಿಗಳು (My Mentees)</h2>
    <div class="desc">ಒಟ್ಟು ${myMentees.length} ವಿದ್ಯಾರ್ಥಿಗಳ ಮೆಂಟರ್ ನೀವು</div></div>

    ${pending.map(o=>{
      const students=(DB.mentorAllocations||[]).filter(a=>(o.studentAllocIds||[]).includes(a.id));
      return `<div class="panel" style="border:2px solid var(--red);animation:notifBlink 2s infinite;">
        <h3>🔴 ಹೊಸ ಮೆಂಟರ್ ಆದೇಶ — Accept ಮಾಡಿ!</h3>
        <div style="font-size:12.5px;margin-bottom:10px;">Order: <b>${esc(o.orderNo)}</b> | ದಿನಾಂಕ: ${fmtDate(o.orderDate)} | ${o.totalStudents} ವಿದ್ಯಾರ್ಥಿಗಳು</div>
        <div class="table-wrap"><table style="font-size:12px;"><thead><tr><th>Sl.</th><th>SATS</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th></tr></thead>
        <tbody>${students.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.satsId||'—')}</td><td>${esc(s.studentName)}</td><td>${esc(s.className)}ನೇ</td></tr>`).join('')}</tbody></table></div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="acceptMentorOrder('${o.id}')">✅ Accepted & Acknowledged — E-Sign</button>
        </div>
      </div>`;
    }).join('')}

    <div class="panel">
      <h3>📋 ನನ್ನ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (${myMentees.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>SATS</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>ಲಿಂಗ</th><th>Action</th></tr></thead>
      <tbody>${myMentees.length?myMentees.map(m=>`<tr>
        <td style="font-size:11px;">${esc(m.satsId||'—')}</td><td><b>${esc(m.studentName)}</b></td><td>${esc(m.className)}ನೇ</td><td>${esc(m.gender||'—')}</td>
        <td><button class="btn btn-sm btn-primary" onclick="navigate('mentorprofile');setTimeout(()=>openMentorProfile('${m.studentId}'),100)">📝 Mentor Profile</button></td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="5">ಯಾವ ವಿದ್ಯಾರ್ಥಿ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>

    ${accepted.length?`<div class="panel"><h3>📜 ಹಿಂದಿನ Orders (${accepted.length})</h3>
      <div class="table-wrap"><table style="font-size:12px;"><thead><tr><th>Order No.</th><th>ದಿನಾಂಕ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ಸ್ಥಿತಿ</th></tr></thead>
      <tbody>${accepted.slice().reverse().map(o=>`<tr><td>${esc(o.orderNo)}</td><td>${fmtDate(o.orderDate)}</td><td>${o.totalStudents}</td><td>${mentorStatusBadge(o.status)}</td></tr>`).join('')}</tbody></table></div>
    </div>`:''}`;
}

async function acceptMentorOrder(orderId){
  const order=DB.mentorOrders.find(x=>x.id===orderId); if(!order) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  await mentorSignMeta(order,'mSig');
  order.status='Accepted';
  order.acceptedAt=ts.time; order.acceptedDate=ts.date; order.acceptedServerTime=ts.server;
  logAudit('Approve','MentorOrder',orderId,'Mentor accepted & e-signed');
  saveDB();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`📋 ಮೆಂಟರ್ Accept: ${order.mentorName} — ${order.orderNo} | Received Register ನಲ್ಲಿ ನೋಡಿ`));
  pushNotification(order.createdBy,`✅ ${order.mentorName} ಮೆಂಟರ್ ಆದೇಶ Accept ಮಾಡಿದ್ದಾರೆ — ${order.orderNo}`);
  showToast('✅ Accepted & E-Signed');
  renderMyMentees();
}

function mpChip(profId, field, options, current){
  return `<span class="mp-chipgroup">${options.map(o=>
    `<span class="mp-chip${current===o?' active':''}" onclick="setMentorProfileChip('${profId}','${field}','${esc(o).replace(/'/g,"\\'")}')">${current===o?'☑':'☐'} ${esc(o)}</span>`
  ).join(' ')}</span>`;
}

function setMentorProfileChip(profId, field, value){
  const prof=(DB.mentorProfiles||[]).find(p=>p.id===profId); if(!prof) return;
  prof[field]=(prof[field]===value)?'':value; // click again to unselect
  prof.updatedAt=todayStr();
  saveDB();
  openMentorProfile(prof.studentId);
}

function mpAttendanceRow(prof, month){
  const key='att_'+month;
  const m=prof[key]||{working:'',present:'',absent:'',wk1:'',wk2:'',wk3:'',wk4:'',sign:''};
  return `<tr>
    <td style="padding:4px 6px;">${month}</td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="working" value="${esc(m.working)}" style="width:44px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="present" value="${esc(m.present)}" style="width:44px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="absent" value="${esc(m.absent)}" style="width:44px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="wk1" value="${esc(m.wk1)}" style="width:34px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="wk2" value="${esc(m.wk2)}" style="width:34px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="wk3" value="${esc(m.wk3)}" style="width:34px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="wk4" value="${esc(m.wk4)}" style="width:34px;"></td>
    <td><input class="mp-cell-input" data-month="${month}" data-f="sign" value="${esc(m.sign)}" style="width:60px;"></td>
  </tr>`;
}


function openMentorProfile(studentId){
  try{
    let s=(DB.students||[]).find(x=>x.id===studentId);
    if(!s){   // allocation points to an old/re-created student id — repair it by SATS / name+class
      const al=(DB.mentorAllocations||[]).find(a=>a.studentId===studentId);
      if(al){
        const ns=String(al.satsId||'').replace(/\D/g,'');
        s=(DB.students||[]).find(x=>ns&&String(x.satsNo||'').replace(/\D/g,'')===ns)||(DB.students||[]).find(x=>x.studentName===al.studentName&&String(x.className)===String(al.className));
        if(s){
          DB.mentorAllocations.forEach(a=>{ if(a.studentId===studentId) a.studentId=s.id; });
          (DB.mentorProfiles||[]).forEach(p=>{ if(p.studentId===studentId) p.studentId=s.id; });
          saveDB(); studentId=s.id;
        }
      }
      if(!s){ showToast('⚠ ಈ ವಿದ್ಯಾರ್ಥಿ Student Register ನಲ್ಲಿ ಸಿಗಲಿಲ್ಲ (ಅಳಿಸಿರಬಹುದು). Principal/FDA ರಿಂದ ಮತ್ತೆ ಮೆಂಟರ್ ಹಂಚಿಕೆ ಮಾಡಿಸಿ.',9000); return; }
    }
    return _openMentorProfileInner(studentId);
  }catch(err){ console.error('mentor profile error',err); showToast('❌ ಪ್ರೊಫೈಲ್ ತೆರೆಯಲಾಗಲಿಲ್ಲ: '+(err&&err.message||err),10000); }
}

function _openMentorProfileInner(studentId){
  CURRENT_MENTOR_STUDENT_ID=studentId;
  const s=(DB.students||[]).find(x=>x.id===studentId); if(!s) return;
  let prof=(DB.mentorProfiles||[]).find(p=>p.studentId===studentId);
  if(!prof){
    prof={ id:uid(), studentId, mentorHrmsId:CURRENT_USER.hrmsId, mentorName:CURRENT_USER.name,
      rollNo:'', yearOfAdmission:'', fatherOccupation:'', motherOccupation:'', guardianName:'',
      curVillage:'',curTaluk:'',curDistrict:'',curState:'',curPin:'',curEmergency:'',
      perPin:'',perEmergency:'',
      presentLevel:'', favSubjects:'', supportSubjects:'', readingWriting:'', homeworkStatus:'', specialTalent:'', careerAspiration:'',
      generalHealth:'', vision:'', dental:'', healthIssues:'', allergies:'', medicalCheckup:'', specialAdvice:'',
      confidence:'', participation:'', communication:'', friendsRelation:'', behavior:'', emotionalAdjustment:'', problemFound:'', supportRequired:'',
      hygiene:'', dressing:'', foodHabits:'', sleepRoutine:'', discipline:'', activities:'', roommates:'',
      academicProgress:'', behaviorDiscipline:'', physicalEmotional:'', specialStrengths:'', areasImprovement:'',
      perfAcademic:'', perfAttendance:'', perfDiscipline:'', perfSocial:'', perfHealth:'', perfOverall:'',
      mentorSignedAt:null, mentorSignedDate:null, mentorServerTime:false,
      principalName:null, principalSignedAt:null, principalSignedDate:null, principalServerTime:false,
      createdAt:todayStr(), updatedAt:todayStr() };
    DB.mentorProfiles.push(prof); saveDB();
  }
  const canEdit = CURRENT_USER.hrmsId===prof.mentorHrmsId || CURRENT_USER.role==='principal';
  const fdaView = CURRENT_USER.role==='fda' && prof.sentToFDA;
  if(!canEdit && !fdaView){ document.getElementById('content').innerHTML='<div class="panel"><h3>🚫 ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ</h3></div>'; return; }

  const myInteractions=(DB.parentInteractions||[]).filter(x=>x.studentId===studentId);
  const myFollowUps=(DB.followUps||[]).filter(x=>x.studentId===studentId);
  const months=['June','July','August','September','October','November','December','January','February','March'];
  let totW=0,totP=0,totA=0;
  months.forEach(m=>{ const a=prof['att_'+m]; if(a){ totW+=Number(a.working||0); totP+=Number(a.present||0); totA+=Number(a.absent||0); } });
  const attPct = totW? ((totP/totW)*100).toFixed(1) : '—';

  // Academic Summary auto-fill (bonus panel, not part of the 12 official sections)
  const examMarks=(DB.marks||[]).filter(m=>m.className===s.className);
  const summaryRows=[];
  STANDARD_EXAMS.forEach(exam=>{
    const recs=examMarks.filter(m=>m.examName===exam);
    recs.forEach(r=>{
      const e=(r.entries||[]).find(x=>x.studentId===studentId);
      if(e) summaryRows.push({exam,subject:r.subject,marks:e.marks,max:r.maxMarks||'—',grade:e.grade||''});
    });
  });

  document.getElementById('content').innerHTML=`
  <div class="page-head"><h2>📝 ಮೆಂಟರ್ ಶಿಕ್ಷಕ - ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್</h2>
    <div class="desc">ಮೆಂಟರ್: ${esc(prof.mentorName)} ${prof.mentorSignedAt?`| ✅ ಕೊನೆಯ Sign: ${fmtDate(prof.mentorSignedDate)} ${esc(prof.mentorSignedAt)}`:''}
    <button class="btn btn-sm btn-gold no-print" style="margin-left:10px;" onclick="window.print()">🖨️ Print</button></div>
  </div>

  <div class="letterhead-paper mp-doc" id="printArea">
    <div style="text-align:center;font-family:'Times New Roman',Georgia,serif;">
      <div style="font-weight:800;font-size:14px;">KARNATAKA RESIDENTIAL EDUCATIONAL INSTITUTIONS SOCIETY, BENGALURU</div>
      <div style="font-weight:800;font-size:16px;margin-top:2px;">MORARJI DESAI RESIDENTIAL SCHOOL, SHEDABARI</div>
      <div style="font-weight:700;font-size:13px;margin-top:2px;">Tq: Bhatkal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Dist: Uttara Kannada</div>
      <div style="font-weight:800;font-size:17px;margin-top:8px;letter-spacing:0.5px;">MENTOR TEACHER – STUDENT PROFILE</div>
      <div style="font-weight:700;font-size:12px;margin-top:4px;font-family:Arial,sans-serif;">Academic Year: ${esc(defaultAcademicYear())}</div>
    </div>

    <table class="mp-table">
      <tr><td colspan="4" class="mp-sec">A. STUDENT INFORMATION</td></tr>
      <tr><td class="mp-label">Student Name</td><td colspan="3" class="mp-val ro">${esc(s.studentName)}</td></tr>
      <tr><td class="mp-label">Admission No.</td><td class="mp-val ro">${esc(s.admissionNo||'—')}</td><td class="mp-label">Class</td><td class="mp-val ro">${esc(s.className)}ನೇ</td></tr>
      <tr><td class="mp-label">Roll No.</td><td class="mp-val"><input id="mp_rollno" value="${esc(prof.rollNo)}"></td><td class="mp-label">Date of Birth</td><td class="mp-val ro">${fmtDate(s.dob)}</td></tr>
      <tr><td class="mp-label">Category</td><td class="mp-val ro">${esc(s.category||'—')}</td><td class="mp-label">SATS NO</td><td class="mp-val ro">${esc(s.satsNo||'—')}</td></tr>
      <tr><td class="mp-label">Year of Admission / Class</td><td class="mp-val"><input id="mp_yoa" value="${esc(prof.yearOfAdmission)}"></td><td class="mp-label">Aadhar Card No</td><td class="mp-val ro">${esc(s.aadharNo||'—')}</td></tr>

      <tr><td colspan="4" class="mp-sec">B. PARENT / GUARDIAN INFORMATION</td></tr>
      <tr><td class="mp-label">Father's Name</td><td class="mp-val ro">${esc(s.fatherName||'—')}</td><td class="mp-label">Occupation</td><td class="mp-val"><input id="mp_focc" value="${esc(prof.fatherOccupation)}"></td></tr>
      <tr><td class="mp-label">Mother's Name</td><td class="mp-val ro">${esc(s.motherName||'—')}</td><td class="mp-label">Occupation</td><td class="mp-val"><input id="mp_mocc" value="${esc(prof.motherOccupation)}"></td></tr>
      <tr><td class="mp-label">Guardian's Name</td><td class="mp-val"><input id="mp_guardian" value="${esc(prof.guardianName)}"></td><td class="mp-label">Father/Guardian Mobile No.</td><td class="mp-val ro">${esc(s.mobile||'—')}</td></tr>

      <tr><td colspan="2" class="mp-sec">C. ADDRESS</td><td colspan="2" class="mp-sec"></td></tr>
      <tr><td colspan="2" class="mp-label" style="text-align:center;">Current Address</td><td colspan="2" class="mp-label" style="text-align:center;">Permanent Address</td></tr>
      <tr><td class="mp-label">Village :</td><td class="mp-val"><input id="mp_curvillage" value="${esc(prof.curVillage)}"></td><td class="mp-label">Village :</td><td class="mp-val ro">${esc(s.village||'—')}</td></tr>
      <tr><td class="mp-label">Taluk</td><td class="mp-val"><input id="mp_curtaluk" value="${esc(prof.curTaluk)}"></td><td class="mp-label">Taluk</td><td class="mp-val ro">${esc(s.addrTaluk||s.taluk||'—')}</td></tr>
      <tr><td class="mp-label">District</td><td class="mp-val"><input id="mp_curdist" value="${esc(prof.curDistrict)}"></td><td class="mp-label">District</td><td class="mp-val ro">${esc(s.addrDistrict||s.district||'—')}</td></tr>
      <tr><td class="mp-label">State</td><td class="mp-val"><input id="mp_curstate" value="${esc(prof.curState)}"></td><td class="mp-label">State</td><td class="mp-val ro">${esc(s.state||'—')}</td></tr>
      <tr><td class="mp-label">PIN Code</td><td class="mp-val"><input id="mp_curpin" value="${esc(prof.curPin)}"></td><td class="mp-label">PIN Code</td><td class="mp-val"><input id="mp_perpin" value="${esc(prof.perPin)}"></td></tr>
      <tr><td class="mp-label">Emergency Contact No.</td><td class="mp-val"><input id="mp_curemg" value="${esc(prof.curEmergency)}"></td><td class="mp-label">Emergency Contact No.</td><td class="mp-val"><input id="mp_peremg" value="${esc(prof.perEmergency)}"></td></tr>

      <tr><td colspan="4" class="mp-sec">D. EDUCATIONAL STATUS</td></tr>
      <tr><td class="mp-label">Present Academic Level</td><td colspan="3" class="mp-val">${mpChip(prof.id,'presentLevel',['Excellent','Good','Average','Needs Support'],prof.presentLevel)}</td></tr>
      <tr><td class="mp-label">Favorite Subjects</td><td colspan="3" class="mp-val"><input id="mp_favsub" value="${esc(prof.favSubjects)}"></td></tr>
      <tr><td class="mp-label">Subjects Needing Support</td><td colspan="3" class="mp-val"><input id="mp_supsub" value="${esc(prof.supportSubjects)}"></td></tr>
      <tr><td class="mp-label">Reading & Writing Skills</td><td colspan="3" class="mp-val">${mpChip(prof.id,'readingWriting',['Good','Average','Needs Support'],prof.readingWriting)}</td></tr>
      <tr><td class="mp-label">Homework/Assignment Status</td><td colspan="3" class="mp-val">${mpChip(prof.id,'homeworkStatus',['Regular','Sometimes','Irregular'],prof.homeworkStatus)}</td></tr>
      <tr><td class="mp-label">Special Talent / Hobbies</td><td colspan="3" class="mp-val"><input id="mp_talent" value="${esc(prof.specialTalent)}"></td></tr>
      <tr><td class="mp-label">Career Aspiration</td><td colspan="3" class="mp-val"><input id="mp_career" value="${esc(prof.careerAspiration)}"></td></tr>

      ${summaryRows.length?`<tr><td colspan="4" style="padding:6px;background:#eef3fb;font-size:10.5px;">
        <b>📊 Academic Summary (Auto-filled from Marks Entry):</b>
        ${summaryRows.map(r=>`${esc(r.exam)}-${esc(r.subject)}: <b>${r.marks}/${r.max}</b>${r.grade?' ('+esc(r.grade)+')':''}`).join(' &nbsp;|&nbsp; ')}
      </td></tr>`:''}
    </table>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="9" class="mp-sec">E. ATTENDANCE RECORD</td></tr>
      <tr class="mp-subhead"><td>Month</td><td>Working<br>Days</td><td>Present</td><td>Absent</td><td colspan="4" style="text-align:center;">Interaction With Student (weekly)</td><td>Student<br>Sign</td></tr>
      <tr class="mp-subhead"><td></td><td></td><td></td><td></td><td>1st wk</td><td>2nd wk</td><td>3rd wk</td><td>4th wk</td><td></td></tr>
      ${months.map(m=>mpAttendanceRow(prof,m)).join('')}
      <tr style="font-weight:700;"><td>Total</td><td>${totW||'—'}</td><td>${totP||'—'}</td><td>${totA||'—'}</td><td colspan="4"></td><td>Attn %: ${attPct}${attPct!=='—'?'%':''}</td></tr>
    </table>
    <div class="form-actions no-print" style="margin-top:6px;"><button class="btn btn-sm btn-gold" onclick="autoFillAttendance('${prof.id}','${s.id}','${s.className}')">🔄 Attendance Register ಇಂದ Auto-fill</button></div>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="2" class="mp-sec">F. PHYSICAL HEALTH PROFILE</td></tr>
      <tr><td class="mp-label">General Health</td><td class="mp-val">${mpChip(prof.id,'generalHealth',['Good','Average','Needs Attention'],prof.generalHealth)}</td></tr>
      <tr><td class="mp-label">Height</td><td class="mp-val ro">${esc(s.height||'—')} cm</td></tr>
      <tr><td class="mp-label">Weight</td><td class="mp-val ro">${esc(s.weight||'—')} kg</td></tr>
      <tr><td class="mp-label">Vision</td><td class="mp-val">${mpChip(prof.id,'vision',['Normal','Needs Check-up'],prof.vision)}</td></tr>
      <tr><td class="mp-label">Dental Health</td><td class="mp-val">${mpChip(prof.id,'dental',['Good','Needs Attention'],prof.dental)}</td></tr>
      <tr><td class="mp-label">Health Issues</td><td class="mp-val"><input id="mp_healthissues" value="${esc(prof.healthIssues)}"></td></tr>
      <tr><td class="mp-label">Allergies (if any)</td><td class="mp-val"><input id="mp_allergies" value="${esc(prof.allergies)}"></td></tr>
      <tr><td class="mp-label">Medical Check-up</td><td class="mp-val">${mpChip(prof.id,'medicalCheckup',['Regular','Required'],prof.medicalCheckup)}</td></tr>
      <tr><td class="mp-label">Special Medical Advice</td><td class="mp-val"><input id="mp_medadvice" value="${esc(prof.specialAdvice)}"></td></tr>

      <tr><td colspan="2" class="mp-sec">G. MENTAL & EMOTIONAL WELL-BEING</td></tr>
      <tr><td class="mp-label">Confidence</td><td class="mp-val">${mpChip(prof.id,'confidence',['High','Moderate','Low'],prof.confidence)}</td></tr>
      <tr><td class="mp-label">Classroom Participation</td><td class="mp-val">${mpChip(prof.id,'participation',['Active','Moderate','Needs Encouragement'],prof.participation)}</td></tr>
      <tr><td class="mp-label">Communication</td><td class="mp-val">${mpChip(prof.id,'communication',['Good','Average','Needs Support'],prof.communication)}</td></tr>
      <tr><td class="mp-label">Relationship with Friends</td><td class="mp-val">${mpChip(prof.id,'friendsRelation',['Good','Average','Needs Support'],prof.friendsRelation)}</td></tr>
      <tr><td class="mp-label">Behavior</td><td class="mp-val">${mpChip(prof.id,'behavior',['Good','Satisfactory','Needs Attention'],prof.behavior)}</td></tr>
      <tr><td class="mp-label">Emotional Adjustment</td><td class="mp-val">${mpChip(prof.id,'emotionalAdjustment',['Good','Moderate','Needs Support'],prof.emotionalAdjustment)}</td></tr>
      <tr><td class="mp-label">Any Problem found</td><td class="mp-val"><input id="mp_problem" value="${esc(prof.problemFound)}"></td></tr>
      <tr><td class="mp-label">Support/Guidance Required</td><td class="mp-val"><input id="mp_supportreq" value="${esc(prof.supportRequired)}"></td></tr>

      <tr><td colspan="2" class="mp-sec">H. HOSTEL / DAILY LIFE OBSERVATION</td></tr>
      <tr><td class="mp-label">Personal Hygiene</td><td class="mp-val">${mpChip(prof.id,'hygiene',['Good','Moderate','Needs Improvement'],prof.hygiene)}</td></tr>
      <tr><td class="mp-label">Dressing & Neatness</td><td class="mp-val">${mpChip(prof.id,'dressing',['Good','Moderate','Needs Improvement'],prof.dressing)}</td></tr>
      <tr><td class="mp-label">Food Habits</td><td class="mp-val">${mpChip(prof.id,'foodHabits',['Good','Moderate','Needs Improvement'],prof.foodHabits)}</td></tr>
      <tr><td class="mp-label">Sleep Routine</td><td class="mp-val">${mpChip(prof.id,'sleepRoutine',['Good','Moderate','Needs Improvement'],prof.sleepRoutine)}</td></tr>
      <tr><td class="mp-label">Discipline</td><td class="mp-val">${mpChip(prof.id,'discipline',['Good','Moderate','Needs Improvement'],prof.discipline)}</td></tr>
      <tr><td class="mp-label">Participation in Activities</td><td class="mp-val">${mpChip(prof.id,'activities',['Good','Moderate','Needs Improvement'],prof.activities)}</td></tr>
      <tr><td class="mp-label">Interaction with Roommates</td><td class="mp-val">${mpChip(prof.id,'roommates',['Good','Moderate','Needs Improvement'],prof.roommates)}</td></tr>
    </table>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="5" class="mp-sec">I. PARENT / GUARDIAN INTERACTION RECORD</td></tr>
      <tr class="mp-subhead"><td>Date</td><td>Mode of Contact</td><td>Main Discussion</td><td>Action Taken / Follow Up</td><td>Mentor Signature</td></tr>
      ${myInteractions.length?myInteractions.slice().reverse().map(x=>`<tr>
        <td style="font-size:10px;">${fmtDate(x.date)}</td><td style="font-size:10px;">☑ ${esc(x.mode||x.type||'')}</td>
        <td style="font-size:10.5px;">${esc(x.discussion)}</td>
        <td style="font-size:10.5px;">${esc(x.actionTaken)}${x.followUp?' | Follow Up: '+esc(x.followUp):''}</td>
        <td style="font-size:9px;">✓ ${esc(x.mentorName||prof.mentorName)}</td>
      </tr>`).join(''):`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:8px;">ಯಾವುದೂ ಇಲ್ಲ</td></tr>`}
    </table>
    <div class="panel no-print" style="margin-top:6px;padding:10px;">
      <div class="form-grid">
        <div class="field"><label>Mode of Contact</label><select id="pi_type"><option>Meeting</option><option>Phone Call</option><option>Home Visit</option></select></div>
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="pi_date" value="${todayStr()}"></div>
        <div class="field" style="grid-column:1/-1;"><label>Main Discussion</label><input id="pi_discussion"></div>
        <div class="field" style="grid-column:1/-1;"><label>Action Taken</label><input id="pi_action"></div>
        <div class="field"><label>Follow Up</label><input id="pi_followup"></div>
      </div>
      <div class="form-actions"><button class="btn btn-sm btn-primary" onclick="addParentInteraction('${studentId}')">➕ Add</button></div>
    </div>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="2" class="mp-sec">J. MENTOR TEACHER OBSERVATION</td></tr>
      <tr><td class="mp-label">Academic Progress</td><td class="mp-val"><input id="mp_acadprogress" value="${esc(prof.academicProgress)}"></td></tr>
      <tr><td class="mp-label">Behaviour & Discipline</td><td class="mp-val"><input id="mp_behdisc" value="${esc(prof.behaviorDiscipline)}"></td></tr>
      <tr><td class="mp-label">Physical / Emotional Well-being</td><td class="mp-val"><input id="mp_physemot" value="${esc(prof.physicalEmotional)}"></td></tr>
      <tr><td class="mp-label">Special Strengths / Talents</td><td class="mp-val"><input id="mp_strengths" value="${esc(prof.specialStrengths)}"></td></tr>
      <tr><td class="mp-label">Areas Requiring Improvement</td><td class="mp-val"><input id="mp_areasimp" value="${esc(prof.areasImprovement)}"></td></tr>
    </table>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="5" class="mp-sec">K. FOLLOW-UP / ACTION PLAN</td></tr>
      <tr class="mp-subhead"><td>Date</td><td>Issue / Need Identified</td><td>Support / Action Taken</td><td>Follow-up Date</td><td>Status</td></tr>
      ${myFollowUps.length?myFollowUps.slice().reverse().map(x=>`<tr>
        <td style="font-size:10px;">${fmtDate(x.date)}</td><td style="font-size:10.5px;">${esc(x.issue)}</td><td style="font-size:10.5px;">${esc(x.actionTaken)}</td>
        <td style="font-size:10px;">${fmtDate(x.followUpDate)}</td>
        <td style="font-size:10px;cursor:pointer;" onclick="toggleFollowUpStatus('${x.id}')">${x.status==='Completed'?'☑ Completed':'☐ Pending'}</td>
      </tr>`).join(''):`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:8px;">ಯಾವುದೂ ಇಲ್ಲ</td></tr>`}
    </table>
    <div class="panel no-print" style="margin-top:6px;padding:10px;">
      <div class="form-grid">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="fu_date" value="${todayStr()}"></div>
        <div class="field" style="grid-column:1/-1;"><label>Issue / Need Identified</label><input id="fu_issue"></div>
        <div class="field" style="grid-column:1/-1;"><label>Support / Action Taken</label><input id="fu_action"></div>
        <div class="field"><label>Follow-up Date</label><input type="date" id="fu_followupdate"></div>
      </div>
      <div class="form-actions"><button class="btn btn-sm btn-primary" onclick="addFollowUp('${studentId}')">➕ Add</button></div>
    </div>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="2" class="mp-sec">L. OVERALL MENTOR ASSESSMENT</td></tr>
      <tr><td class="mp-label">Academic Performance</td><td class="mp-val">${mpChip(prof.id,'perfAcademic',['Excellent','Good','Average','Needs Support'],prof.perfAcademic)}</td></tr>
      <tr><td class="mp-label">Attendance</td><td class="mp-val">${mpChip(prof.id,'perfAttendance',['Excellent','Good','Average','Needs Support'],prof.perfAttendance)}</td></tr>
      <tr><td class="mp-label">Discipline</td><td class="mp-val">${mpChip(prof.id,'perfDiscipline',['Excellent','Good','Average','Needs Support'],prof.perfDiscipline)}</td></tr>
      <tr><td class="mp-label">Social Skills</td><td class="mp-val">${mpChip(prof.id,'perfSocial',['Excellent','Good','Average','Needs Support'],prof.perfSocial)}</td></tr>
      <tr><td class="mp-label">Health & Hygiene</td><td class="mp-val">${mpChip(prof.id,'perfHealth',['Excellent','Good','Average','Needs Support'],prof.perfHealth)}</td></tr>
      <tr><td class="mp-label">Overall Development</td><td class="mp-val">${mpChip(prof.id,'perfOverall',['Excellent','Good','Average','Needs Support'],prof.perfOverall)}</td></tr>
    </table>

    <table class="mp-table" style="margin-top:10px;">
      <tr><td colspan="2" class="mp-sec">AUTHENTICATION</td></tr>
      <tr><td class="mp-label">Mentor Teacher Name</td><td class="mp-val ro">${esc(prof.mentorName)}</td></tr>
      <tr><td class="mp-label">Designation</td><td class="mp-val ro">${esc(staffByName(prof.mentorName)?.desig||'')}</td></tr>
      <tr><td class="mp-label">Signature</td><td class="mp-val" style="padding:8px;">${prof.mentorSignedAt?staffSignatureHTMLByName(prof.mentorName, prof.mentorSignedAt, fmtDate(prof.mentorSignedDate),{alignRight:false}):'<span style="color:var(--muted);font-size:11px;">ಇನ್ನೂ Sign ಆಗಿಲ್ಲ</span>'}</td></tr>
      <tr><td class="mp-label">Headmaster/Principal Signature</td><td class="mp-val" style="padding:8px;">${prof.principalSignedAt?principalSignatureHTML(prof.principalName, prof.principalSignedAt, fmtDate(prof.principalSignedDate),{alignRight:false}):'<span style="color:var(--muted);font-size:11px;">ಇನ್ನೂ Sign ಆಗಿಲ್ಲ</span>'}</td></tr>
    </table>
  </div>

  <div class="form-actions no-print" style="margin-top:14px;">
    ${canEdit?`<button class="btn btn-gold" onclick="saveMentorProfile('${studentId}',false)">💾 Save</button>`:''}
    <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
    ${CURRENT_USER.hrmsId===prof.mentorHrmsId&&CURRENT_USER.role!=='fda'?`<button class="btn btn-outline" onclick="sendMentorProfileToFDA('${studentId}')">${prof.sentToFDA?'FDA ಗೆ ಮತ್ತೆ ಕಳುಹಿಸಿ':'FDA ಗೆ ಫೈಲಿಂಗ್‌ಗೆ ಕಳುಹಿಸಿ'}</button>`:''}
    ${fdaView?`<button class="btn btn-primary" onclick="fileMentorProfileFDA('${studentId}')" ${prof.filedByFDA?'disabled':''}>${prof.filedByFDA?'Filed — '+fmtDate(prof.filedAt):'📁 Filed ಎಂದು ಗುರುತಿಸಿ'}</button>`:''}
    ${CURRENT_USER.hrmsId===prof.mentorHrmsId?`<button class="btn btn-primary" onclick="saveMentorProfile('${studentId}',true)">✅ Save & Mentor E-Sign</button>`:''}
    ${CURRENT_USER.role==='principal'?`<button class="btn btn-primary" onclick="signMentorProfilePrincipal('${studentId}')">✅ Principal E-Sign</button>`:''}
  </div>`;
}

function autoFillAttendance(profId, studentId, className){
  const prof=(DB.mentorProfiles||[]).find(p=>p.id===profId); if(!prof) return;
  const months=['June','July','August','September','October','November','December','January','February','March'];
  const monthIdx={June:5,July:6,August:7,September:8,October:9,November:10,December:11,January:0,February:1,March:2};
  let found=0;
  months.forEach(m=>{
    const recs=(DB.attendance||[]).filter(a=>a.className===className && new Date(a.date).getMonth()===monthIdx[m]);
    let present=0, absent=0;
    recs.forEach(r=>{
      const rec=(r.records||[]).find(x=>x.studentId===studentId);
      if(rec){ if(rec.status==='Present') present++; else if(rec.status==='Absent') absent++; }
    });
    if(present+absent>0){
      prof['att_'+m]={working:present+absent, present, absent, wk1:'',wk2:'',wk3:'',wk4:'',sign:''};
      found++;
    }
  });
  saveDB();
  showToast(found?`✅ ${found} ತಿಂಗಳ Attendance Auto-fill ಆಗಿದೆ`:'⚠ Attendance Register ನಲ್ಲಿ ಈ ವಿದ್ಯಾರ್ಥಿಗೆ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ');
  openMentorProfile(studentId);
}

function addParentInteraction(studentId){
  const mode=document.getElementById('pi_type')?.value;
  const date=document.getElementById('pi_date')?.value;
  const discussion=document.getElementById('pi_discussion')?.value;
  const actionTaken=document.getElementById('pi_action')?.value;
  const followUp=document.getElementById('pi_followup')?.value;
  if(!discussion){ showToast('⚠ ಚರ್ಚೆ ನಮೂದಿಸಿ'); return; }
  if(!DB.parentInteractions) DB.parentInteractions=[];
  DB.parentInteractions.push({id:uid(),studentId,mentorHrmsId:CURRENT_USER.hrmsId,mentorName:CURRENT_USER.name,mode,type:mode,date,discussion,actionTaken,followUp,createdAt:todayStr()});
  logAudit('Create','ParentInteraction',studentId,mode);
  saveDB(); openMentorProfile(studentId);
}

function addFollowUp(studentId){
  const date=document.getElementById('fu_date')?.value;
  const issue=document.getElementById('fu_issue')?.value;
  const actionTaken=document.getElementById('fu_action')?.value;
  const followUpDate=document.getElementById('fu_followupdate')?.value;
  if(!issue){ showToast('⚠ ಸಮಸ್ಯೆ ನಮೂದಿಸಿ'); return; }
  if(!DB.followUps) DB.followUps=[];
  DB.followUps.push({id:uid(),studentId,mentorHrmsId:CURRENT_USER.hrmsId,date,issue,actionTaken,followUpDate,status:'Pending',createdAt:todayStr()});
  logAudit('Create','FollowUp',studentId,issue);
  saveDB(); openMentorProfile(studentId);
}

function toggleFollowUpStatus(id){
  const f=(DB.followUps||[]).find(x=>x.id===id); if(!f) return;
  f.status=f.status==='Pending'?'Completed':'Pending';
  saveDB(); openMentorProfile(CURRENT_MENTOR_STUDENT_ID);
}

async function saveMentorProfile(studentId, doSign){
  const prof=(DB.mentorProfiles||[]).find(p=>p.studentId===studentId); if(!prof) return;
  const g=id=>document.getElementById(id)?.value||'';
  prof.rollNo=g('mp_rollno'); prof.yearOfAdmission=g('mp_yoa');
  prof.fatherOccupation=g('mp_focc'); prof.motherOccupation=g('mp_mocc'); prof.guardianName=g('mp_guardian');
  prof.curVillage=g('mp_curvillage'); prof.curTaluk=g('mp_curtaluk'); prof.curDistrict=g('mp_curdist'); prof.curState=g('mp_curstate');
  prof.curPin=g('mp_curpin'); prof.perPin=g('mp_perpin'); prof.curEmergency=g('mp_curemg'); prof.perEmergency=g('mp_peremg');
  prof.favSubjects=g('mp_favsub'); prof.supportSubjects=g('mp_supsub'); prof.specialTalent=g('mp_talent'); prof.careerAspiration=g('mp_career');
  prof.healthIssues=g('mp_healthissues'); prof.allergies=g('mp_allergies'); prof.specialAdvice=g('mp_medadvice');
  prof.problemFound=g('mp_problem'); prof.supportRequired=g('mp_supportreq');
  prof.academicProgress=g('mp_acadprogress'); prof.behaviorDiscipline=g('mp_behdisc'); prof.physicalEmotional=g('mp_physemot');
  prof.specialStrengths=g('mp_strengths'); prof.areasImprovement=g('mp_areasimp');
  // Attendance monthly cells
  document.querySelectorAll('.mp-cell-input').forEach(inp=>{
    const month=inp.dataset.month, f=inp.dataset.f;
    if(!prof['att_'+month]) prof['att_'+month]={working:'',present:'',absent:'',wk1:'',wk2:'',wk3:'',wk4:'',sign:''};
    prof['att_'+month][f]=inp.value;
  });
  prof.updatedAt=todayStr();
  logAudit('Edit','MentorProfile',studentId,'');
  if(doSign){
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    prof.mentorSignedAt=ts.time; prof.mentorSignedDate=ts.date; prof.mentorServerTime=ts.server;
    logAudit('Teacher E-Signature','MentorProfile',studentId,`${ts.date} ${ts.time}`);
  }
  saveDB();
  showToast(doSign?'✅ Save & E-Signed':'💾 Save ಆಗಿದೆ');
  openMentorProfile(studentId);
}

function sendMentorProfileToFDA(studentId,silent){
  const prof=(DB.mentorProfiles||[]).find(p=>p.studentId===studentId); if(!prof) return false;
  if(!prof.mentorSignedAt){ if(!silent) showToast('⚠ ಮೊದಲು "Save & Mentor E-Sign" ಮಾಡಿ'); return false; }
  prof.sentToFDA=true; prof.sentToFDAAt=todayStr(); prof.filedByFDA=null; prof.filedAt=null;
  logAudit('Send','MentorProfile',studentId,'Mentor → FDA filing');
  if(!silent){
    const st=(DB.students||[]).find(x=>x.id===studentId);
    staffNamesForRole('fda').forEach(n=>pushNotification(n,`📁 ಮೆಂಟರ್ ಪ್ರೊಫೈಲ್ ಫೈಲಿಂಗ್‌ಗೆ: ${prof.mentorName} — ${st?st.studentName:''}`));
    saveDB(); showToast('✅ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); openMentorProfile(studentId);
  }
  return true;
}
function sendAllMentorProfilesToFDA(){
  const mine=(DB.mentorProfiles||[]).filter(p=>p.mentorHrmsId===CURRENT_USER.hrmsId&&p.mentorSignedAt&&!p.sentToFDA);
  if(!mine.length){ showToast('⚠ ಕಳುಹಿಸಲು E-Sign ಆದ ಹೊಸ ಪ್ರೊಫೈಲ್ ಇಲ್ಲ'); return; }
  if(!confirm(mine.length+' ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು FDA ಗೆ ಫೈಲಿಂಗ್‌ಗೆ ಕಳುಹಿಸುವುದೇ?')) return;
  mine.forEach(p=>sendMentorProfileToFDA(p.studentId,true));
  staffNamesForRole('fda').forEach(n=>pushNotification(n,`📁 ${CURRENT_USER.name}: ${mine.length} ಮೆಂಟರ್ ಪ್ರೊಫೈಲ್‌ಗಳು ಫೈಲಿಂಗ್‌ಗೆ`));
  saveDB(); showToast('✅ '+mine.length+' ಪ್ರೊಫೈಲ್ FDA ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderMentorProfilePage();
}
function fileMentorProfileFDA(studentId){
  if(CURRENT_USER.role!=='fda') return;
  const prof=(DB.mentorProfiles||[]).find(p=>p.studentId===studentId); if(!prof) return;
  prof.filedByFDA=CURRENT_USER.name; prof.filedAt=todayStr();
  logAudit('File','MentorProfile',studentId,'');
  saveDB(); showToast('✅ Filed'); openMentorProfile(studentId);
}

async function signMentorProfilePrincipal(studentId){
  const prof=(DB.mentorProfiles||[]).find(p=>p.studentId===studentId); if(!prof) return;
  showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
  const ts=await getServerTimeStamp();
  prof.principalName=CURRENT_USER.name; prof.principalSignedAt=ts.time; prof.principalSignedDate=ts.date; prof.principalServerTime=ts.server;
  logAudit('Principal E-Signature','MentorProfile',studentId,`${ts.date} ${ts.time}`);
  saveDB();
  showToast('✅ Principal E-Signed');
  openMentorProfile(studentId);
}

;(window.__LOADED=window.__LOADED||[]).push('teacher');
