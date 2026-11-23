/* =====================================================================
   KREIS e-Office v35 — students-staff.js
   ವಿದ್ಯಾರ್ಥಿ / ಸಿಬ್ಬಂದಿ — Student register & staff movement
   ===================================================================== */
function normGender(v){
  const t=String(v||'').trim().toLowerCase();
  if(!t) return 'other';
  if(t[0]==='m'||t.indexOf('boy')>=0||t.indexOf('ಗಂಡು')>=0) return 'boy';
  if(t[0]==='f'||t.indexOf('girl')>=0||t.indexOf('ಹೆಣ್ಣು')>=0) return 'girl';
  return 'other';
}

function classwiseGenderSummary(){
  const byClass={};
  ['6','7','8','9','10'].forEach(c=>{ byClass[c]={boy:0,girl:0,other:0,total:0}; });
  DB.students.forEach(s=>{
    const cls=s.className||'—';
    if(!byClass[cls]) byClass[cls]={boy:0,girl:0,other:0,total:0};
    const g=normGender(s.gender);
    byClass[cls][g]++; byClass[cls].total++;
  });
  const classes=Object.keys(byClass).sort((a,b)=>{
    const na=Number(a), nb=Number(b);
    if(!isNaN(na)&&!isNaN(nb)) return na-nb;
    return a.localeCompare(b);
  });
  const grand={boy:0,girl:0,other:0,total:0};
  classes.forEach(c=>{ grand.boy+=byClass[c].boy; grand.girl+=byClass[c].girl; grand.other+=byClass[c].other; grand.total+=byClass[c].total; });
  return {byClass, classes, grand};
}

function renderStudents(){
  const canEdit=['fda','principal'].includes(CURRENT_USER.role);
  const sum=classwiseGenderSummary();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🧑‍🎓 ದಾಖಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (ತರಗತಿವಾರು)</h2><div class="desc">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಭಟ್ಕಳ</div></div>

    <div class="panel"><h3>📊 ತರಗತಿವಾರು ಹಾಗೂ ಲಿಂಗವಾರು ಸಾರಾಂಶ</h3>
      <div class="table-wrap"><table><thead><tr><th>ತರಗತಿ</th><th>ಗಂಡು (Boys)</th><th>ಹೆಣ್ಣು (Girls)</th>${sum.grand.other?'<th>ಇತರೆ</th>':''}<th>ಒಟ್ಟು</th></tr></thead>
      <tbody>${sum.classes.map(c=>`<tr><td>${esc(c)}ನೇ ತರಗತಿ</td><td>${sum.byClass[c].boy}</td><td>${sum.byClass[c].girl}</td>${sum.grand.other?`<td>${sum.byClass[c].other}</td>`:''}<td><b>${sum.byClass[c].total}</b></td></tr>`).join('')}
      <tr style="font-weight:800;background:var(--surface-2);"><td>ಒಟ್ಟು (Total)</td><td>${sum.grand.boy}</td><td>${sum.grand.girl}</td>${sum.grand.other?`<td>${sum.grand.other}</td>`:''}<td><b>${sum.grand.total}</b></td></tr>
      </tbody></table></div>
    </div>

    <div class="panel"><h3>📋 ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ (${DB.students.length})</h3>
      ${canEdit?`<div class="note" style="margin-bottom:10px;background:#fff4f2;border-color:#e0b4ae;">
        <b>🗑 ಅಳಿಸುವ ಆಯ್ಕೆಗಳು</b> — ಅಳಿಸಿದವರು ♻️ Recycle Bin ನಲ್ಲಿ ಇರುತ್ತಾರೆ; ಅಲ್ಲಿಂದ ಮರಳಿ ತರಬಹುದು.
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
          <button class="btn btn-sm btn-red" onclick="stuDeleteSelected()">🗑 ಆಯ್ಕೆ ಮಾಡಿದವರನ್ನು ಅಳಿಸಿ (${STU_SEL.size})</button>
          <select id="stuDelClass" style="padding:6px;"><option value="">ತರಗತಿ ಆಯ್ಕೆ…</option>${[...new Set(DB.students.map(s=>s.className).filter(Boolean))].sort((x,y)=>String(x).localeCompare(String(y),undefined,{numeric:true})).map(c=>`<option value="${esc(c)}">${esc(c)}ನೇ ತರಗತಿ (${DB.students.filter(s=>s.className===c).length})</option>`).join('')}</select>
          <button class="btn btn-sm btn-red" onclick="stuDeleteClass()">🗑 ಈ ತರಗತಿಯ ಎಲ್ಲರನ್ನೂ ಅಳಿಸಿ</button>
          <button class="btn btn-sm btn-red" onclick="stuDeleteAll()">⚠ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಅಳಿಸಿ</button>
        </div></div>`:''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
        <select id="stu_cls" onchange="renderStudents()" style="padding:8px;"><option value="">ಎಲ್ಲಾ ತರಗತಿ</option>${[...new Set(['6','7','8','9','10'].concat(DB.students.map(s=>s.className).filter(Boolean)))].sort((x,y)=>String(x).localeCompare(String(y),undefined,{numeric:true})).map(c=>`<option value="${esc(c)}" ${document.getElementById('stu_cls')?.value===String(c)?'selected':''}>${esc(c)}ನೇ ತರಗತಿ (${DB.students.filter(s=>s.className===c).length})</option>`).join('')}</select>
        <select id="stu_gen" onchange="renderStudents()" style="padding:8px;"><option value="">ಗಂಡು + ಹೆಣ್ಣು (ಪ್ರತ್ಯೇಕ)</option><option value="boy" ${document.getElementById('stu_gen')?.value==='boy'?'selected':''}>ಗಂಡು ಮಕ್ಕಳು ಮಾತ್ರ</option><option value="girl" ${document.getElementById('stu_gen')?.value==='girl'?'selected':''}>ಹೆಣ್ಣು ಮಕ್ಕಳು ಮಾತ್ರ</option></select>
        ${canEdit?`<button class="btn btn-gold btn-sm" onclick="navigate('newadmission')">➕ ಹೊಸ ಪ್ರವೇಶ</button>`:''}
      </div>
      <input id="stu_search" placeholder="🔍 ಹೆಸರು (ಕನ್ನಡ/English) ಅಥವಾ SATS ಸಂಖ್ಯೆ ಮೂಲಕ ಹುಡುಕಿ..." oninput="renderStudents()" value="${esc(document.getElementById('stu_search')?.value||'')}" style="margin-bottom:12px;">
      ${(()=>{
        const q=(document.getElementById('stu_search')?.value||'').trim().toLowerCase();
        const _c=document.getElementById('stu_cls')?.value||'';
        const _g=document.getElementById('stu_gen')?.value||'';
        const base=_c?DB.students.filter(s=>s.className===_c):DB.students;
        const filtered=!q?base: base.filter(s=>
          (s.studentName||'').toLowerCase().includes(q) ||
          (s.studentNameEn||'').toLowerCase().includes(q) ||
          (s.satsNo||'').toLowerCase().includes(q));
        const rowOf=(s)=>{
        const existingCard=DB.progressCards.find(c=>c.studentId===s.id && c.status!=='Cancelled');
        return `<tr>${canEdit?`<td><input type="checkbox" class="stuSel" value="${s.id}" ${STU_SEL.has(s.id)?'checked':''} onchange="stuSelOne('${s.id}',this.checked)"></td>`:''}<td>${esc(s.admissionNo)}</td><td><b>${esc(s.studentName)}</b>${s.studentNameEn?`<br><span class="small-muted" style="font-size:10.5px;">${esc(s.studentNameEn)}</span>`:''}</td><td>${esc(s.className)}</td><td>${esc(s.gender)}</td><td>${esc(s.fatherName)}</td><td>${esc(s.satsNo)}</td><td>${fmtDate(s.admissionDate)}</td>${canEdit?`<td class="actions-cell">
            <button class="btn btn-sm btn-outline" onclick="uploadStudentDoc('${s.id}')">📎 Upload Doc</button>
            ${(DB.studentDocs||[]).find(d=>d.studentId===s.id)?`<button class="btn btn-sm btn-primary" onclick="viewStudentDoc('${s.id}')">📄 View</button>`:''}
          <button class="btn btn-sm btn-outline" onclick="deleteStudent('${s.id}')">🗑</button>
        </td>`:''}</tr>`;
      };
        const byNo=(x,y)=>String(x.className).localeCompare(String(y.className),undefined,{numeric:true})||String(x.studentName).localeCompare(String(y.studentName),'kn');
        const groups=[['boy','👦 ಗಂಡು ಮಕ್ಕಳು (Boys)'],['girl','👧 ಹೆಣ್ಣು ಮಕ್ಕಳು (Girls)'],['other','ಇತರೆ']].filter(g=>!_g||_g===g[0]);
        const out=groups.map(([k,title])=>{
          const list=filtered.filter(s=>normGender(s.gender)===k).sort(byNo);
          if(!list.length&&k==='other') return '';
          return `<h4 style="margin:14px 0 6px;color:var(--navy);">${title} — ${list.length}</h4>
            <div class="table-wrap"><table><thead><tr>${canEdit?'<th><input type="checkbox" title="ಎಲ್ಲಾ ಆಯ್ಕೆ" onchange="stuSelAll(this.checked)"></th>':''}<th>ದಾಖಲಾತಿ ಸಂಖ್ಯೆ</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>ಲಿಂಗ</th><th>ತಂದೆಯ ಹೆಸರು</th><th>SATS</th><th>ಪ್ರವೇಶ ದಿನಾಂಕ</th>${canEdit?'<th>Action</th>':''}</tr></thead><tbody>${list.length?list.map(rowOf).join(''):`<tr class="empty-row"><td colspan="${canEdit?9:7}">ಯಾರೂ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>`;
        }).join('');
        return out;
      })()}
    </div>
    <div id="certPreviewWrap"></div>`;
}

function addStudent(){
  const vals=readFields(STUDENT_FIELDS,'student');
  if(!vals.studentName){ showToast('⚠ ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು ಅಗತ್ಯ'); return; }
  vals.id=uid(); vals.admissionNo='ADM-'+nextSeq('student');
  DB.students.push(vals); saveDB();
  showToast('✅ ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಲಾಗಿದೆ');
  navigate('newadmission');
}

var STU_SEL=window.STU_SEL||(window.STU_SEL=new Set());
function stuSelOne(id,on){ on?STU_SEL.add(id):STU_SEL.delete(id); }
function stuSelAll(on){ document.querySelectorAll('.stuSel').forEach(c=>{c.checked=on; on?STU_SEL.add(c.value):STU_SEL.delete(c.value);}); }
function stuRemoveIds(ids){
  const set=new Set(ids); const n=DB.students.filter(s=>set.has(s.id)).length;
  DB.students=DB.students.filter(s=>!set.has(s.id)); ids.forEach(i=>STU_SEL.delete(i));
  saveDB(); showToast('🗑 '+n+' ವಿದ್ಯಾರ್ಥಿ(ಗಳು) ಅಳಿಸಲಾಗಿದೆ — Recycle Bin ನಲ್ಲಿ ಇದ್ದಾರೆ'); navigate('students');
}
function deleteStudent(id){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const s=DB.students.find(x=>x.id===id); if(!s) return;
  if(!confirm('"'+(s.studentName||'')+'" ('+(s.className||'')+'ನೇ) ಅವರನ್ನು ಅಳಿಸುವುದೇ?\n(Recycle Bin ನಲ್ಲಿ ಉಳಿಯುತ್ತಾರೆ)'))return;
  stuRemoveIds([id]);
}
function stuDeleteSelected(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const ids=[...STU_SEL].filter(i=>DB.students.some(s=>s.id===i));
  if(!ids.length){ showToast('⚠ ಮೊದಲು ಪಟ್ಟಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಟಿಕ್ ಮಾಡಿ'); return; }
  if(!confirm(ids.length+' ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಅಳಿಸುವುದೇ?\n(Recycle Bin ನಲ್ಲಿ ಉಳಿಯುತ್ತಾರೆ)'))return;
  stuRemoveIds(ids);
}
function stuDeleteClass(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const c=document.getElementById('stuDelClass')?.value;
  if(!c){ showToast('⚠ ತರಗತಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
  const ids=DB.students.filter(s=>s.className===c).map(s=>s.id);
  if(!confirm(c+'ನೇ ತರಗತಿಯ ಎಲ್ಲಾ '+ids.length+' ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಅಳಿಸುವುದೇ?'))return;
  const t=prompt('ಖಚಿತಪಡಿಸಲು ತರಗತಿ ಸಂಖ್ಯೆ "'+c+'" ಎಂದು ಟೈಪ್ ಮಾಡಿ:');
  if((t||'').trim()!==String(c)){ showToast('ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ'); return; }
  stuRemoveIds(ids);
}
function stuDeleteAll(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const ids=DB.students.map(s=>s.id); if(!ids.length) return;
  if(!confirm('⚠ ಎಲ್ಲಾ '+ids.length+' ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಅಳಿಸುವುದೇ?'))return;
  const t=prompt('ಖಚಿತಪಡಿಸಲು DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿ:');
  if((t||'').trim()!=='DELETE'){ showToast('ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ'); return; }
  stuRemoveIds(ids);
}

function generateStudyCertificate(id){
  const s=DB.students.find(x=>x.id===id); if(!s) return;
  const ay=prompt('ಶೈಕ್ಷಣಿಕ ಸಾಲು (ಉದಾ: '+defaultAcademicYear()+'):', defaultAcademicYear());
  if(ay===null) return;
  const no='ಮೊದೇವಶಾ/ಅಧ್ಯನ ಪ್ರಮಾಣ ಪತ್ರ/'+nextSeq('studycert')+'/'+ay;
  const cert={id:uid(), no, date:todayStr(), studentId:s.id, academicYear:ay};
  DB.studyCertificates.push(cert); saveDB();
  showToast('✅ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ ಸೃಷ್ಟಿಸಲಾಗಿದೆ');
  showStudyCert(cert.id);
}
function scGet(id){ return (DB.studyCertificates||[]).find(x=>x.id===id); }
function showStudyCert(id){
  const cert=scGet(id); if(!cert) return; const s=stuAny(cert.studentId); if(!s) { showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (ಅಳಿಸಲಾಗಿದೆ)'); return; }
  const wrap=document.getElementById('certPreviewWrap'); if(!wrap) return;
  const st=cert.status||'Generated', fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  let b=`<button class="btn btn-gold" onclick="scPrint()">🖨 Print / PDF</button>`;
  if(st!=='Signed'){
    if(fda&&st!=='Submitted') b+=`<button class="btn btn-primary" onclick="scSend('${cert.id}')">📤 ಪ್ರಾಂಶುಪಾಲರ ಡಿಜಿಟಲ್ ಸಹಿಗೆ ಕಳುಹಿಸಿ</button>`;
    if(fda&&st==='Submitted') b+=`<span class="badge badge-warn">⏳ ಸಹಿ ಬಾಕಿ</span>`;
    if(pr) b+=`<button class="btn btn-primary" onclick="scSign('${cert.id}')">✍ ಡಿಜಿಟಲ್ ಸಹಿ / ಅನುಮೋದಿಸಿ</button>`;
  } else b+=`<span class="badge badge-ok">✅ ಡಿಜಿಟಲ್ ಸಹಿ ಆಗಿದೆ</span>`;
  b+=`<button class="btn btn-outline" onclick="document.getElementById('certPreviewWrap').innerHTML=''">✕</button>`;
  wrap.innerHTML=`<div class="panel"><div class="form-actions no-print" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">${b}</div>${studyCertHtml(cert,s)}</div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}
function scPrint(){
  const el=document.getElementById('scPaper'); if(!el){ showToast('⚠ Print ಮಾಡಲು ಏನೂ ಇಲ್ಲ'); return; }
  const o=document.getElementById('scPageStyle'); if(o) o.remove();
  const stl=document.createElement('style'); stl.id='scPageStyle'; stl.textContent='@page{size:A4 portrait;margin:14mm;}'; document.head.appendChild(stl);
  const done=()=>{ const x=document.getElementById('scPageStyle'); if(x) x.remove(); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done); setTimeout(done,90000);
  printEl(el);
}
function scSend(id){
  const c=scGet(id); if(!c||CURRENT_USER.role!=='fda') return;
  if(!confirm('ಈ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ಪ್ರಾಂಶುಪಾಲರ ಡಿಜಿಟಲ್ ಸಹಿಗೆ ಕಳುಹಿಸಬೇಕೇ?')) return;
  c.status='Submitted'; c.submittedBy=CURRENT_USER.name; c.submittedAt=todayStr();
  const s=DB.students.find(x=>x.id===c.studentId);
  STAFF.filter(x=>x.role==='principal').forEach(p=>pushNotification(p.name,'📤 ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ ಸಹಿಗೆ: '+(s?s.studentName:'')));
  saveDB(); showToast('✅ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderStuCerts(); showStudyCert(id);
}
async function scSign(id){
  const c=scGet(id); if(!c||CURRENT_USER.role!=='principal') return;
  if(!confirm('ಈ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರಕ್ಕೆ ಡಿಜಿಟಲ್ ಸಹಿ ಮಾಡಬೇಕೇ?')) return;
  const ts=await getServerTimeStamp();
  c.status='Signed'; c.signedBy=CURRENT_USER.name; c.signedAt=ts.time; c.signedDate=ts.date; await cbSignMeta(c,ts);
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರಕ್ಕೆ ಪ್ರಾಂಶುಪಾಲರು ಸಹಿ ಮಾಡಿದ್ದಾರೆ'));
  saveDB(); showToast('✅ ಸಹಿ ಮಾಡಲಾಗಿದೆ'); renderStuCerts(); showStudyCert(id);
}
function studyCertListHtml(){
  const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  let list=(DB.studyCertificates||[]).slice().reverse();
  if(pr) list=list.filter(c=>c.status==='Submitted'||c.status==='Signed');
  if(!list.length) return '';
  const lab={Generated:['ಸೃಷ್ಟಿಸಲಾಗಿದೆ','var(--muted)'],Submitted:['⏳ ಸಹಿ ಬಾಕಿ','#b26a00'],Signed:['✅ ಸಹಿ ಆಗಿದೆ','var(--green)']};
  return `<div class="panel no-print"><h3>🎓 ${pr?'ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರಗಳು — ಅನುಮೋದನೆ':'ಸೃಷ್ಟಿಸಿದ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರಗಳು'}</h3>
    <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಸಂಖ್ಯೆ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
    ${list.slice(0,30).map((c,i)=>{ const s=DB.students.find(x=>x.id===c.studentId)||{}; const t=lab[c.status||'Generated']; return `<tr><td>${i+1}</td><td>${esc(c.no)}</td><td><b>${esc(s.studentName||'—')}</b></td><td>${fmtDate(c.date)}</td><td style="font-weight:700;color:${t[1]};">${t[0]}</td><td><button class="btn btn-sm btn-outline" onclick="showStudyCert('${c.id}')">👁 ನೋಡಿ</button>${pr&&c.status==='Submitted'?` <button class="btn btn-sm btn-primary" onclick="scSign('${c.id}')">✍ ಅನುಮೋದಿಸಿ</button>`:''}${fda&&(c.status||'Generated')==='Generated'?` <button class="btn btn-sm btn-primary" onclick="scSend('${c.id}')">📤 ಕಳುಹಿಸಿ</button>`:''}</td></tr>`; }).join('')}
    </tbody></table></div></div>`;
}

function studyCertHtml(cert,s){
  const parent=[s.fatherName,s.motherName].filter(Boolean).join(' / ')||'—';
  return `<div class="letterhead-paper sc-paper" id="scPaper">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
        ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ<br>
        <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320<br>
        ದೂರವಾಣಿ: +91 97413 84751<br>
        ಇ-ಮೇಲ್: mdrsbhatkal@gmail.com | kreismdrs265@gmail.com
      </div>
    </div>
    <div class="lh-meta"><span>ಸಂ: ${esc(cert.no)}</span><span>ದಿನಾಂಕ: ${fmtDate(cert.date)}</span></div>
    <div class="lh-subject" style="text-align:center;">ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ<br><span style="font-weight:500;">(STUDY CERTIFICATE)</span></div>
    <div class="lh-body">ಪ್ರಮಾಣೀಕರಿಸುವುದೇನೆಂದರೆ,
<b>${esc(s.studentName)}</b>, ತಂದೆ/ತಾಯಿ: <b>${esc(parent)}</b>, ಇವರ ದಾಖಲಾತಿ ಸಂಖ್ಯೆ: <b>${esc(s.admissionNo)}</b>, SATS ಸಂಖ್ಯೆ: <b>${esc(s.satsNo||'—')}</b> ಜನ್ಮ ದಿನಾಂಕ: <b>${esc(fmtDate(s.dob))}</b> ಆಗಿದ್ದು, ಇವರು <b>${esc(cert.academicYear)}</b>ನೇ ಶೈಕ್ಷಣಿಕ ಸಾಲಿನಲ್ಲಿ <b>${esc(s.className||'—')}ನೇ</b> ತರಗತಿಯಲ್ಲಿ ಈ ಶಾಲೆಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದಾರೆ.

ಶಾಲೆಯ ದಾಖಲಾತಿ ಪುಸ್ತಕದಲ್ಲಿರುವ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ಮೇಲ್ಕಂಡ ವಿದ್ಯಾರ್ಥಿಯ/ವಿದ್ಯಾರ್ಥಿನಿಯ ವಿವರಗಳು ಸತ್ಯ ಹಾಗೂ ಸರಿಯಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸಲಾಗುತ್ತದೆ.

ಈ ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರವನ್ನು ವಿದ್ಯಾರ್ಥಿಯ/ಪಾಲಕರ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ನೀಡಲಾಗಿದೆ.</div>
    ${cert.status==='Signed'?`<div style="margin-top:26px;">${cbDigiSign(cert,'','Study Certificate approved')}<div style="text-align:right;font-size:12px;margin-top:6px;line-height:1.5;">ಪ್ರಾಂಶುಪಾಲರು<br>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)<br>ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ – 581320</div></div>`:`<div style="margin-top:26px;text-align:right;font-size:13px;line-height:1.6;">ಪ್ರಾಂಶುಪಾಲರು<br>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)<br>ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ<br>ಉತ್ತರ ಕನ್ನಡ – 581320</div>`}
  </div>`;
}

function renderMovement(){
  const isStaff=CURRENT_USER.role==='staff';
  const list = isStaff? DB.staffMovement.filter(m=>m.staffName===CURRENT_USER.name) : DB.staffMovement;
  const canCreate = CURRENT_USER.role==='staff' || CURRENT_USER.role==='fda';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಸಿಬ್ಬಂದಿ ಚಲನಾವಲನ ವಹಿ (Staff Movement Register)</h2></div>
    ${canCreate?`<div class="panel"><h3>🚶 ಹೊರಹೋಗುವುದನ್ನು ದಾಖಲಿಸಿ</h3>
    <div class="form-grid">
      <div class="field"><label>ಸಿಬ್ಬಂದಿ ಹೆಸರು</label><input id="mv_name" value="${esc(CURRENT_USER.name)}" ${CURRENT_USER.role==='staff'?'readonly':''}></div>
      <div class="field"><label>ಹುದ್ದೆ</label><input id="mv_desig" value="${esc(CURRENT_USER.desig)}" readonly></div>
      <div class="field"><label>ಹೊರಹೋಗುವ ಕಾರಣ</label><input id="mv_reason"></div>
      <div class="field"><label>ಹೊರಹೋಗುವ ಸಮಯ</label><input id="mv_outtime" type="time"></div>
      <div class="field"><label>ನಿರೀಕ್ಷಿತ ಮರಳುವ ಸಮಯ</label><input id="mv_exp" type="time"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" onclick="addMovement()">ದಾಖಲಿಸಿ</button></div>
    </div>`:''}
    <div class="panel"><h3>📋 ಪಟ್ಟಿ (${list.length})</h3>
    <div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಕಾರಣ</th><th>ಹೊರಹೋದ ಸಮಯ</th><th>ಮರಳಿದ ಸಮಯ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
    <tbody>${list.length? list.slice().reverse().map(m=>`<tr>
      <td>${fmtDate(m.date)}</td><td>${esc(m.staffName)}</td><td>${esc(m.desig)}</td><td>${esc(m.reason)}</td><td>${esc(m.outtime||'—')}</td><td>${esc(m.returnTime||'—')}</td>
      <td><span class="badge ${badgeClass(m.status)}">${esc(m.status)}</span></td>
      <td class="actions-cell">
        ${m.status==='Out' && (CURRENT_USER.name===m.staffName || CURRENT_USER.role==='fda') ? `<button class="btn btn-sm btn-green" onclick="returnMovement('${m.id}')">ಹಿಂದಿರುಗಿದ್ದನ್ನು ದಾಖಲಿಸಿ</button>`:''}
        ${m.status==='Returned' && CURRENT_USER.role==='principal' ? `<button class="btn btn-sm btn-green" onclick="approveMovement('${m.id}')">Approve/Close</button>`:''}
      </td></tr>`).join('') : `<tr class="empty-row"><td colspan="8">ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ.</td></tr>`}</tbody></table></div></div>`;
}

function addMovement(){
  const name=document.getElementById('mv_name').value, desig=document.getElementById('mv_desig').value;
  const reason=document.getElementById('mv_reason').value, outtime=document.getElementById('mv_outtime').value, exp=document.getElementById('mv_exp').value;
  if(!reason){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  DB.staffMovement.push({id:uid(), date:todayStr(), staffName:name, desig, reason, outtime, expReturn:exp, status:'Out'});
  saveDB(); showToast('✅ ದಾಖಲಿಸಲಾಗಿದೆ'); navigate('movement');
}

function returnMovement(id){
  const m=DB.staffMovement.find(x=>x.id===id); if(!m) return;
  const remarks=prompt('ಭೇಟಿ ಮಾಡಿದ ಕಚೇರಿ / ಕೆಲಸದ ವರದಿ:')||'';
  m.returnDate=todayStr(); m.returnTime=new Date().toTimeString().slice(0,5); m.remarks=remarks; m.status='Returned';
  saveDB(); showToast('✅ ಹಿಂದಿರುಗಿದ್ದನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ'); navigate('movement');
}

function approveMovement(id){
  const m=DB.staffMovement.find(x=>x.id===id); if(!m) return;
  m.status='Closed'; saveDB(); showToast('✅ ಅನುಮೋದಿಸಲಾಗಿದೆ'); navigate('movement');
}

function downloadStudentTemplate(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ — refresh ಮಾಡಿ'); return; }
  const wb=XLSX.utils.book_new();
  // Header row
  const header=BULK_COLS.map(c=>c.label);
  // Sample rows
  const sample=[
    ['ರಾಹುಲ್ ಕುಮಾರ್ ನಾಯ್ಕ','Rahul Kumar Naik','ಗಂಡು','2011-05-15','8','ಕುಮಾರ್ ನಾಗಪ್ಪ ನಾಯ್ಕ','Kumar Nagappa Naik','ಸವಿತಾ ಕುಮಾರ್ ನಾಯ್ಕ','Savitha Kumar Naik','123456789','987654321098','152','48','B+','Shedabari, Heble, Bhatkal','9876543210','Bhatkal','Bhatkal','Uttara Kannada','Hindu','Namadhari','PEN123','2024-06-10'],
    ['ಪ್ರಿಯಾ ಗಣೇಶ್ ನಾಯ್ಕ','Priya Ganesh Naik','ಹೆಣ್ಣು','2012-03-20','7','ಗಣೇಶ್ ನಾಯ್ಕ','Ganesh Naik','ಲಲಿತಾ ನಾಯ್ಕ','Lalitha Naik','','','148','42','O+','Heble, Bhatkal','','Bhatkal','Bhatkal','Uttara Kannada','Hindu','Namdhari','','2024-06-10'],
  ];
  const ws=XLSX.utils.aoa_to_sheet([header,...sample]);
  // Column widths
  ws['!cols']=BULK_COLS.map(()=>({wch:28}));
  XLSX.utils.book_append_sheet(wb,ws,'Students');
  XLSX.writeFile(wb,'MDRS_Student_Upload_Template.xlsx');
  showToast('✅ Template Download ಆಯಿತು — Excel ನಲ್ಲಿ ತುಂಬಿ Upload ಮಾಡಿ');
}

function handleStudentExcelUpload(input){
  const file=input.files[0]; if(!file) return;
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const wrap=document.getElementById('bulkPreviewWrap');
  wrap.innerHTML=`<div class="small-muted" style="margin:10px 0;">⏳ ಫೈಲ್ ಓದುತ್ತಿದೆ...</div>`;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'binary'});
      const ws=wb.Sheets['Data Entry']||wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ wrap.innerHTML=`<div class="verify-card bad">⚠ ಯಾವುದೇ data ಇಲ್ಲ.</div>`; return; }
      const uh=udfIsFormat(rows);
      if(uh>=0){ BULK_PREVIEW_DATA=udfParse(rows,uh); renderBulkPreview(); return; }
      // Detect header row
      const headerRow=rows[0];
      // Map column index to key
      const colMap={};
      BULK_COLS.forEach((c,ci)=>{
        // Try to find by label or by key
        const idx=headerRow.findIndex(h=>{
          const hs=String(h||'').toLowerCase().trim();
          return hs===c.label.toLowerCase().trim() || hs.includes(c.key.toLowerCase()) ||
                 hs.includes(c.label.split('(')[0].trim().toLowerCase());
        });
        if(idx>=0) colMap[c.key]=idx;
        else colMap[c.key]=ci; // fallback: positional
      });
      // Parse data rows
      const dataRows=rows.slice(1).filter(r=>r.some(v=>String(v||'').trim()));
      BULK_PREVIEW_DATA=dataRows.map((row,ri)=>{
        const obj={_row:ri+2};
        BULK_COLS.forEach(c=>{ obj[c.key]=String(row[colMap[c.key]]||'').trim(); });
        obj._valid=!!obj.studentName && !!obj.className;
        obj._error=!obj.studentName?'ಹೆಸರು ಇಲ್ಲ':!obj.className?'ತರಗತಿ ಇಲ್ಲ':'';
        return obj;
      });
      renderBulkPreview();
    }catch(err){
      wrap.innerHTML=`<div class="verify-card bad">⚠ File ಓದಲಾಗಲಿಲ್ಲ: ${esc(err.message)}</div>`;
    }
  };
  reader.readAsBinaryString(file);
}

function renderBulkPreview(){
  const wrap=document.getElementById('bulkPreviewWrap'); if(!wrap) return;
  const valid=BULK_PREVIEW_DATA.filter(r=>r._valid).length;
  const invalid=BULK_PREVIEW_DATA.length-valid;
  BULK_PREVIEW_DATA.forEach(r=>{
    r._existingMatch = r._valid && r.satsNo ? DB.students.find(s=>normSats(s.satsNo)===normSats(r.satsNo)) : null;
    // A same-class match is a normal, safe update. A DIFFERENT-class match means this SATS ID
    // already belongs to another class's student — importing it would silently rename/move that
    // other student into this class, which is almost always a data-entry mistake in the source file.
    r._classConflict = !!(r._existingMatch && r.className && r._existingMatch.className && String(r._existingMatch.className)!==String(r.className));
    if(r._classConflict && r._keepAnyway===undefined) r._keepAnyway=false;
  });
  const existing=BULK_PREVIEW_DATA.filter(r=>r._existingMatch && !r._classConflict);
  const conflicts=BULK_PREVIEW_DATA.filter(r=>r._classConflict);
  const conflictsPending=conflicts.filter(r=>!r._keepAnyway);
  wrap.innerHTML=`
    <div class="cards-grid" style="margin-bottom:12px;">
      <div class="stat-card"><div class="n">${BULK_PREVIEW_DATA.length}</div><div class="l">ಒಟ್ಟು Rows</div></div>
      <div class="stat-card"><div class="n" style="color:var(--green)">${valid}</div><div class="l">✅ Valid</div></div>
      <div class="stat-card"><div class="n" style="color:var(--red)">${invalid}</div><div class="l">❌ Error (skip)</div></div>
      <div class="stat-card"><div class="n" style="color:var(--gold)">${existing.length}</div><div class="l">⚠ SATS ಈಗಾಗಲೇ ಇದೆ (ಅದೇ ತರಗತಿ)</div></div>
      <div class="stat-card"><div class="n" style="color:var(--red)">${conflicts.length}</div><div class="l">🛑 ಬೇರೆ ತರಗತಿಯ SATS</div></div>
    </div>
    ${existing.length?`<div class="note">⚠ ${existing.length} ವಿದ್ಯಾರ್ಥಿಗಳ SATS No ಈಗಾಗಲೇ ಅದೇ ತರಗತಿಯಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ — Import ಆದರೆ ಅವರ data ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.</div>`:''}
    ${conflicts.length?`<div class="note" style="background:#fde8e8;border-color:var(--red);">🛑 ${conflicts.length} ಸಾಲುಗಳಲ್ಲಿ SATS ID ಈಗಾಗಲೇ <b>ಬೇರೆ ತರಗತಿಯ</b> ವಿದ್ಯಾರ್ಥಿಗೆ ಸೇರಿದೆ. ಇವು ಫೈಲ್‌ನಲ್ಲಿ SATS ID ತಪ್ಪಾಗಿ ನಮೂದಾದ ಸಾಧ್ಯತೆ ಹೆಚ್ಚು — Import ಮಾಡಿದರೆ ಆ ಬೇರೆ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು/ವಿವರ ಈ ಸಾಲಿನ ಡೇಟಾದಿಂದ ಬದಲಾಗುತ್ತದೆ. ಕೆಳಗಿನ ಕೆಂಪು ಸಾಲುಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ — ಸರಿ ಎಂದಾದರೆ ಮಾತ್ರ "ಹೌದು, ಬದಲಿಸಿ" ಗುರುತು ಹಾಕಿ, ಇಲ್ಲದಿದ್ದರೆ ಫೈಲ್‌ನಲ್ಲಿ SATS ID ಸರಿಪಡಿಸಿ ಮತ್ತೆ Upload ಮಾಡಿ.</div>`:''}
    <div class="table-wrap" style="max-height:340px;overflow-y:auto;">
      <table class="preview-tbl"><thead><tr>
        <th>#</th><th>ಸ್ಥಿತಿ</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>ಲಿಂಗ</th><th>ತಂದೆಯ ಹೆಸರು</th><th>SATS</th><th>DOB</th><th>Mobile</th>
      </tr></thead>
      <tbody>${BULK_PREVIEW_DATA.map((r,i)=>{
        if(r._classConflict){
          return `<tr style="background:#fde8e8;">
            <td>${r._row}</td>
            <td>🛑 SATS ${esc(r.satsNo)} ಈಗಾಗಲೇ <b>${esc(r._existingMatch.className)}ನೇ ತರಗತಿ</b> ವಿದ್ಯಾರ್ಥಿ <b>${esc(r._existingMatch.studentName)}</b> ಗೆ ಸೇರಿದೆ<br>
              <label style="font-size:11px;font-weight:600;"><input type="checkbox" ${r._keepAnyway?'checked':''} onchange="toggleBulkConflict(${i},this.checked)"> ಹೌದು, ಇದು ಸರಿ — ಬದಲಿಸಿ (${esc(r._existingMatch.studentName)} ರವರನ್ನು ಈ ಸಾಲಿನ ಡೇಟಾದಿಂದ ಬದಲಿಸಿ ${esc(r.className)}ನೇ ತರಗತಿಗೆ ಸರಿಸಿ)</label></td>
            <td>${esc(r.studentName||'—')}</td>
            <td>${esc(r.className||'—')}</td>
            <td>${esc(r.gender||'—')}</td>
            <td>${esc(r.fatherName||'—')}</td>
            <td>${esc(r.satsNo||'—')}</td>
            <td>${esc(r.dob||'—')}</td>
            <td>${esc(r.mobile||'—')}</td>
          </tr>`;
        }
        return `<tr class="${r._valid?'row-ok':'row-err'}">
        <td>${r._row}</td>
        <td>${r._valid?'✅':'❌ '+esc(r._error)}</td>
        <td>${esc(r.studentName||'—')}</td>
        <td>${esc(r.className||'—')}</td>
        <td>${esc(r.gender||'—')}</td>
        <td>${esc(r.fatherName||'—')}</td>
        <td>${esc(r.satsNo||'—')}</td>
        <td>${esc(r.dob||'—')}</td>
        <td>${esc(r.mobile||'—')}</td>
      </tr>`;
      }).join('')}
      </tbody></table>
    </div>
    <div class="form-actions" style="margin-top:12px;">
      <button class="btn btn-outline" onclick="document.getElementById('bulkPreviewWrap').innerHTML='';BULK_PREVIEW_DATA=[];document.getElementById('bulkExcelInput').value=''">✕ Cancel</button>
      ${valid>0?(conflictsPending.length?`<button class="btn btn-primary" disabled title="ಮೇಲಿನ 🛑 ಸಾಲುಗಳನ್ನು ಮೊದಲು ಪರಿಶೀಲಿಸಿ">✅ ${valid-conflictsPending.length} ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು Import ಮಾಡಿ (${conflictsPending.length} 🛑 ಬಾಕಿ)</button>`:`<button class="btn btn-primary" onclick="confirmBulkImport()">✅ ${valid} ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು Import ಮಾಡಿ</button>`):''}
    </div>`;
}

function toggleBulkConflict(idx,checked){
  BULK_PREVIEW_DATA[idx]._keepAnyway=checked;
  renderBulkPreview();
}

function confirmBulkImport(){
  const pendingConflict=BULK_PREVIEW_DATA.find(r=>r._valid&&r._classConflict&&!r._keepAnyway);
  if(pendingConflict){ showToast('🛑 ಬೇರೆ ತರಗತಿಯ SATS conflict ಇರುವ ಸಾಲುಗಳನ್ನು ಮೊದಲು ಪರಿಶೀಲಿಸಿ'); return; }
  const valid=BULK_PREVIEW_DATA.filter(r=>r._valid);
  if(!valid.length){ showToast('⚠ Valid data ಇಲ್ಲ'); return; }
  let added=0, updated=0, moved=0;
  valid.forEach(r=>{
    if(r._udf){ if(r._classConflict) moved++; if(udfApplyRow(r)==='added') added++; else updated++; return; }
    const existing=r.satsNo ? DB.students.find(s=>normSats(s.satsNo)===normSats(r.satsNo)) : null;
    if(existing){
      if(r._classConflict) moved++;
      // Update existing
      Object.assign(existing, {
        studentName:r.studentName||existing.studentName,
        gender:r.gender||existing.gender,
        dob:r.dob||existing.dob,
        className:r.className||existing.className,
        fatherName:r.fatherName||existing.fatherName,
        motherName:r.motherName||existing.motherName,
        aadharNo:r.aadharNo||existing.aadharNo,
        height:r.height||existing.height,
        weight:r.weight||existing.weight,
        bloodGroup:r.bloodGroup||existing.bloodGroup,
        address:r.address||existing.address,
        mobile:r.mobile||existing.mobile,
        placeOfBirth:r.placeOfBirth||existing.placeOfBirth,
        taluk:r.taluk||existing.taluk,
        district:r.district||existing.district,
        religion:r.religion||existing.religion,
        caste:r.caste||existing.caste,
        penNo:r.penNo||existing.penNo,
      });
      updated++;
    } else {
      DB.students.push({
        id:uid(),
        admissionNo:'ADM-'+nextSeq('student'),
        studentName:r.studentName,
        gender:r.gender||'ಗಂಡು',
        dob:r.dob||'',
        className:r.className,
        fatherName:r.fatherName||'',
        motherName:r.motherName||'',
        satsNo:r.satsNo||'',
        aadharNo:r.aadharNo||'',
        height:r.height||'',
        weight:r.weight||'',
        bloodGroup:r.bloodGroup||'',
        address:r.address||'',
        mobile:r.mobile||'',
        placeOfBirth:r.placeOfBirth||'',
        taluk:r.taluk||'',
        district:r.district||'',
        religion:r.religion||'',
        caste:r.caste||'',
        penNo:r.penNo||'',
        admissionDate:r.admissionDate||todayStr(),
        bankAcc:'', ifsc:'', subcaste:'',
      });
      added++;
    }
  });
  saveDB();
  BULK_PREVIEW_DATA=[];
  showToast(`✅ ${added} ಹೊಸ ವಿದ್ಯಾರ್ಥಿಗಳು ಸೇರಿಸಲಾಗಿದೆ, ${updated} ಅಪ್‌ಡೇಟ್ ಮಾಡಲಾಗಿದೆ${moved?` (${moved} ಬೇರೆ ತರಗತಿಯಿಂದ ಸರಿಸಲಾಗಿದೆ — ಖಚಿತಪಡಿಸಿದ್ದೀರಿ)`:''}`,6000);
  navigate('students');
}

function downloadStudentList(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const wb=XLSX.utils.book_new();
  const header=BULK_COLS.map(c=>c.label);
  const rows=DB.students.map(s=>BULK_COLS.map(c=>s[c.key]||''));
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  ws['!cols']=BULK_COLS.map(()=>({wch:24}));
  XLSX.utils.book_append_sheet(wb,ws,'Students');
  XLSX.writeFile(wb,'MDRS_Students_'+todayStr()+'.xlsx');
  showToast('✅ Export ಆಯಿತು');
}

function uploadStudentDoc(studentId){
  const input = document.createElement('input');
  input.type='file'; input.accept='.pdf,.jpg,.jpeg,.png';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      if(!DB.studentDocs) DB.studentDocs=[];
      const existing = DB.studentDocs.findIndex(x=>x.studentId===studentId);
      const docEntry = {id:uid(), studentId, fileName:file.name, fileData:ev.target.result, fileType:file.type, uploadedAt:todayStr(), uploadedBy:CURRENT_USER.name};
      if(existing>=0) DB.studentDocs[existing]=docEntry;
      else DB.studentDocs.push(docEntry);
      saveDB(); showToast('✅ ದಾಖಲೆ Upload ಆಯಿತು: '+file.name);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function viewStudentDoc(studentId){
  const doc=(DB.studentDocs||[]).find(x=>x.studentId===studentId);
  if(!doc){ showToast('⚠ ಯಾವ ದಾಖಲೆ Upload ಆಗಿಲ್ಲ'); return; }
  const a=document.createElement('a'); a.href=doc.fileData; a.download=doc.fileName; a.target='_blank'; a.click();
}

function generateAdmissionApp(studentId){
  const s=DB.students.find(x=>x.id===studentId); if(!s) return;
  let app=(DB.admissionApplications||[]).find(a=>a.studentId===studentId);
  if(!app){
    app={
      id:uid(), studentId, appNo:'ADM-APP-'+nextSeq('admapp')+'/'+defaultAcademicYear(),
      generatedAt:todayStr(), generatedBy:CURRENT_USER.name,
      status:'Draft', signedFileData:null, signedFileName:null, signedUploadedAt:null,
      principalSigned:false, principalName:null, principalSignedAt:null
    };
    DB.admissionApplications.push(app); saveDB();
  }
  showAdmissionAppPreview(app.id);
}

function showAdmissionAppPreview(appId){
  const app=DB.admissionApplications.find(x=>x.id===appId); if(!app) return;
  const s=stuAny(app.studentId); if(!s) { showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (ಅಳಿಸಲಾಗಿದೆ)'); return; }
  const wrap=document.getElementById('certPreviewWrap'); if(!wrap) return;
  const canSign=CURRENT_USER.role==='principal'&&!app.principalSigned;
  wrap.innerHTML=`<div class="panel" style="border:2px solid #0d47a1;">
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF</button>
      ${canSign?`<button class="btn btn-primary" onclick="signAdmissionApp('${app.id}')">✍ ಡಿಜಿಟಲ್ ಸಹಿ / ಅನುಮೋದಿಸಿ</button>`:''}
      ${app.status!=='Signed'?`
      <label class="btn btn-primary" style="cursor:pointer;">
        📎 Signed Copy Upload (ಪೋಷಕರ ಸಹಿ ಆದ ನಂತರ)
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" onchange="uploadSignedAdmission('${app.id}',this)">
      </label>`:`<button class="btn btn-sm btn-gold" onclick="downloadSignedAdmission('${app.id}')">⬇ Signed Copy Download</button>
      <span class="badge badge-ok">✅ Signed Copy Uploaded — ${fmtDate(app.signedUploadedAt)}</span>`}
      <button class="btn btn-outline" onclick="document.getElementById('certPreviewWrap').innerHTML=''">✕</button>
    </div>
    ${admissionAppHTML(app,s)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

async function signAdmissionApp(appId){
  const app=DB.admissionApplications.find(x=>x.id===appId); if(!app||CURRENT_USER.role!=='principal') return;
  const ts=await getServerTimeStamp(); await cbSignMeta(app,ts);
  app.principalSigned=true; app.principalName=CURRENT_USER.name; app.principalSignedAt=todayStr();
  saveDB();
  showToast('✅ Principal E-Signed');
  showAdmissionAppPreview(appId);
}

function admissionAppHTML(app,s){
  const row=(l,v)=>`<div style="display:flex;border-bottom:1px dotted #ccc;padding:3px 0;"><div style="min-width:150px;font-size:11.5px;color:#444;">${esc(l)}</div><div style="flex:1;font-size:12px;font-weight:600;">${esc(v||'—')}</div></div>`;
  return `<div class="letterhead-paper" id="printArea" style="font-size:12px;">
    <div class="lh-top"><div class="lh-org" style="text-align:center;">
      <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
      ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ, ಬೆಂಗಳೂರು<br>
      <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಹೆಬಳೆ</b><br>
      ತಾ: ಭಟ್ಕಳ, ಜಿ: ಉತ್ತರ ಕನ್ನಡ – 581320 | e-mail: kreismdrs265@gmail.com | ದೂ: 97413 84751
    </div></div>
    <div style="text-align:center;font-weight:800;font-size:14px;margin:10px 0;">
      ${defaultAcademicYear()}ನೇ ಸಾಲಿನ ${esc(s.className||'')}ನೇ ತರಗತಿ ದಾಖಲಾತಿ ಅರ್ಜಿ<br>
      <span style="font-size:11px;font-weight:500;">(ವಸತಿ ಶಾಲಾ ಸಂಕೇತ: BC-265)</span>
    </div>
    <table style="width:100%;margin-bottom:10px;font-size:11.5px;">
      <tr><td>ಅರ್ಜಿ ಸಂಖ್ಯೆ: <b>${esc(app.appNo)}</b></td><td style="text-align:right;">ದಾಖಲಾತಿ ದಿನಾಂಕ: <b>${fmtDate(s.admissionDate)}</b></td></tr>
      <tr><td>Admission No: <b>${esc(s.admissionNo)}</b></td><td style="text-align:right;">ದಾಖಲಾತಿ ಸಂಖ್ಯೆ(ADM No): <b>${esc(s.admissionNo)}</b></td></tr>
    </table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px;">
      <div>
        ${row('ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು', s.studentName)}
        ${row('ತಂದೆಯ ಹೆಸರು', s.fatherName)}
        ${row('ತಾಯಿಯ ಹೆಸರು', s.motherName)}
        ${row('ಜನ್ಮ ದಿನಾಂಕ', fmtDate(s.dob))}
        ${row('ರಾಷ್ಟ್ರೀಯತೆ', s.nationality||'ಭಾರತೀಯ')}
        ${row('ಧರ್ಮ', s.religion)}
        ${row('ಹುಟ್ಟಿದ ಸ್ಥಳ', s.placeOfBirth)}
        ${row('ಜಾತಿ', s.caste)}
        ${row('ಪ್ರವರ್ಗ (Category)', s.category)}
        ${row('ಉಪಜಾತಿ', s.subcaste)}
        ${row('ವಿಕಲಚೇತನರೆ?', s.disability||'ಇಲ್ಲ')}
        ${row('ಲಿಂಗ (Gender)', s.gender)}
        ${row('ಮಾತೃಭಾಷೆ', s.motherTongue)}
        ${row('ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', s.mobile)}
        ${row("ತಂದೆಯ ವೃತ್ತಿ", s.fatherOccupation)}
      </div>
      <div>
        ${row('Admission Number', s.admissionNo)}
        ${row('Admission Date', fmtDate(s.admissionDate))}
        ${row('SATS Number', s.satsNo)}
        ${row('Student PEN', s.penNo)}
        ${row('APAAR ID', s.aadharNo)}
        ${row('TC Number', s.tcNo)}
        ${row('TC Date', fmtDate(s.tcDate))}
        ${row('Previous School', s.previousSchool)}
        ${row('Bank Account', s.bankAcc)}
        ${row('IFSC Number', s.ifsc)}
        ${row('Bank Name', s.bankName)}
        ${row('ವಿದ್ಯಾರ್ಥಿಯ ಖಾಯಂ ವಿಳಾಸ', s.address)}
        ${row('ಗ್ರಾಮ/ಊರು', s.village)}
        ${row('ತಾಲ್ಲೂಕು / ಜಿಲ್ಲೆ', (s.taluk||'')+' / '+(s.district||''))}
        ${row('ರಾಜ್ಯ', s.state)}
      </div>
    </div>

    <div style="margin-top:16px;border-top:1px solid #000;padding-top:8px;">
      <b style="font-size:11.5px;">ಸಲ್ಲಿಸಬೇಕಾದ ದಾಖಲೆಗಳು:</b>
      <div style="font-size:10.5px;line-height:1.9;margin-top:4px;">
        1) ಕೌನ್ಸೆಲಿಂಗ್ ಪತ್ರ/HALL TICKET &nbsp; 2) ಮೂಲ ವರ್ಗಾವಣೆ ಪತ್ರ (TC) &nbsp; 3) ಹಿಂದಿನ ತರಗತಿ ಅಂಕಪಟ್ಟಿ ಜೆರಾಕ್ಸ್ &nbsp;
        4) ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರ ಜೆರಾಕ್ಸ್ &nbsp; 5) ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಜೆರಾಕ್ಸ್ &nbsp; 6) ಆಧಾರ್ ಜೆರಾಕ್ಸ್ (ವಿದ್ಯಾರ್ಥಿ, ತಂದೆ, ತಾಯಿ) &nbsp;
        7) ಬ್ಯಾಂಕ್ ಪಾಸ್ ಪುಸ್ತಕ ಜೆರಾಕ್ಸ್ &nbsp; 8) ರೇಷನ್ ಕಾರ್ಡ್ ಜೆರಾಕ್ಸ್
      </div>
    </div>

    <div style="margin-top:14px;padding:10px;border:1px solid #999;border-radius:6px;font-size:10px;line-height:1.7;">
      <b>ಮುಚ್ಚಳಿಕೆ ಪತ್ರ (ವಿದ್ಯಾರ್ಥಿಯ ಮುಚ್ಚಳಿಕೆ):</b> ನಾನು ಶಾಲೆಯ ವ್ಯಾಸಂಗದ ಅವಧಿಯಲ್ಲಿ ಕವಶಿಸ ಸಂಘದ ಕಛೇರಿಯ ಎಲ್ಲಾ ಆಡಳಿತ/ಶೈಕ್ಷಣಿಕ/ಪರೀಕ್ಷಾ ನಿಯಮಗಳಿಗೆ ಬದ್ಧನಾಗಿರುತ್ತೇನೆಂದು ಒಪ್ಪಿರುತ್ತೇನೆ. ನಾನು ಶಾಲೆಯ ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳಲ್ಲಿ ಶಿಸ್ತಿನಿಂದ ನಡೆದುಕೊಳ್ಳುತ್ತೇನೆ. ಒಂದು ವೇಳೆ ಅಶಿಸ್ತಿನಿಂದ ವರ್ತಿಸಿದ್ದಲ್ಲಿ / ವಸತಿ ಶಾಲೆಯ ಆಸ್ತಿಪಾಸ್ತಿಗೆ ಹಾನಿ ಮಾಡಿದ್ದಲ್ಲಿ ಅದರಿಂದಾದ ನಷ್ಟವನ್ನು ನಾನೇ ತುಂಬಿಕೊಡುವುದಾಗಿ ಒಪ್ಪಿರುತ್ತೇನೆ. ವಸತಿ ಶಾಲೆಯ ಕಾರ್ಯ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಂಭವಿಸುವ ಆಕಸ್ಮಿಕಗಳಿಗೆ ಶಾಲೆ ಜವಾಬ್ದಾರವಾಗಿರುವುದಿಲ್ಲ ಎಂಬುದನ್ನು ಒಪ್ಪುತ್ತೇನೆ.
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:35px;font-size:11px;">
      <div style="text-align:center;min-width:200px;">
        <div style="margin-bottom:45px;"></div>
        <div style="border-top:1px solid #000;padding-top:4px;">ವಿದ್ಯಾರ್ಥಿ / ಪೋಷಕರ ಸಹಿ</div>
      </div>
      ${app.principalSigned?
        cbDigiSign({signedBy:app.principalName,signStamp:app.signStamp||fmtDate(app.principalSignedAt),signHost:app.signHost,signIp:app.signIp,signDevice:app.signDevice},'','Admission Application approved'):
        `<div style="text-align:center;min-width:200px;">
          <div style="height:34px;"></div>
          <div style="border-top:1.5px solid #000;padding-top:4px;font-size:11px;">
            ಪ್ರಾಂಶುಪಾಲರು<br>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ ಹೆಬಳೆ<br>ತಾ: ಭಟ್ಕಳ, ಜಿ: ಉತ್ತರ ಕನ್ನಡ
          </div>
        </div>`}
    </div>
  </div>`;
}

function uploadSignedAdmission(appId, inputEl){
  const file=inputEl.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const app=DB.admissionApplications.find(x=>x.id===appId); if(!app) return;
    app.signedFileData=e.target.result; app.signedFileName=file.name;
    app.status='Signed'; app.signedUploadedAt=todayStr(); app.signedUploadedBy=CURRENT_USER.name;
    if(!DB.studentDocs) DB.studentDocs=[];
    DB.studentDocs.push({
      id:uid(), studentId:app.studentId, docType:'Admission Application (Signed)',
      fileData:e.target.result, fileName:file.name, uploadedBy:CURRENT_USER.name, uploadedAt:todayStr()
    });
    saveDB();
    showToast('✅ Signed Copy Save ಆಗಿದೆ — Student Docs ನಲ್ಲೂ Filed');
    showAdmissionAppPreview(appId);
  };
  reader.readAsDataURL(file);
}

function downloadSignedAdmission(appId){
  const app=DB.admissionApplications.find(x=>x.id===appId); if(!app?.signedFileData) return;
  const a=document.createElement('a'); a.href=app.signedFileData; a.download=app.signedFileName||'Admission_Signed'; a.click();
}

function generateTCRequestLetter(studentId){
  const s=DB.students.find(x=>x.id===studentId); if(!s) return;
  if(!s.previousSchool){
    showToast('⚠ ಮೊದಲು ವಿದ್ಯಾರ್ಥಿಯ "ಹಿಂದಿನ ಶಾಲೆ" ಮಾಹಿತಿ ಭರ್ತಿ ಮಾಡಿ (Edit ಮಾಡಿ)');
    return;
  }
  let letter=(DB.tcRequestLetters||[]).find(l=>l.studentId===studentId);
  if(!letter){
    letter={
      id:uid(), studentId, letterNo:'ಮೊದೇವಶಾ/ಪ್ರವೇಶ/ಸಿ.ಆರ್-'+nextSeq('tcreq')+'/'+defaultAcademicYear(),
      letterDate:todayStr(), createdBy:CURRENT_USER.name,
      principalSigned:false, principalName:null, principalSignedAt:null
    };
    DB.tcRequestLetters.push(letter); saveDB();
  }
  showTCRequestPreview(letter.id);
}

function showTCRequestPreview(letterId){
  const letter=DB.tcRequestLetters.find(x=>x.id===letterId); if(!letter) return;
  const s=stuAny(letter.studentId); if(!s) { showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (ಅಳಿಸಲಾಗಿದೆ)'); return; }
  const wrap=document.getElementById('certPreviewWrap'); if(!wrap) return;
  const canSign=CURRENT_USER.role==='principal'&&!letter.principalSigned;
  wrap.innerHTML=`<div class="panel" style="border:2px solid #e65100;">
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF</button>
      ${canSign?`<button class="btn btn-primary" onclick="signTCRequestLetter('${letter.id}')">✍ ಡಿಜಿಟಲ್ ಸಹಿ / ಅನುಮೋದಿಸಿ</button>`:''}
      <button class="btn btn-outline" onclick="document.getElementById('certPreviewWrap').innerHTML=''">✕</button>
    </div>
    ${tcRequestLetterHTML(letter,s)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function tcRequestLetterHTML(letter,s){
  return `<div class="letterhead-paper" id="printArea" style="font-size:13px;line-height:1.9;">
    <div class="lh-top"><div class="lh-org" style="text-align:center;">
      <div class="l1">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</div>
      ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಕಲ್ಯಾಣ ಇಲಾಖೆ<br>
      <b>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</b><br>
      ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320<br>
      ದೂರವಾಣಿ: 97413 84751 | ಇ-ಮೇಲ್: mdrsbhatkal@gmail.com | kreismdrs265@gmail.com
    </div></div>
    <table style="width:100%;margin:10px 0;font-size:12px;">
      <tr><td>ಪತ್ರ ಸಂಖ್ಯೆ: <b>${esc(letter.letterNo)}</b></td><td style="text-align:right;">ದಿನಾಂಕ: <b>${fmtDate(letter.letterDate)}</b></td></tr>
    </table>

    <div style="margin-bottom:14px;">
      <b>ಗೆ,</b><br>
      ${esc(s.previousSchool)}<br>
      ${s.previousSchoolAddress?esc(s.previousSchoolAddress)+'<br>':''}
      ${s.previousSchoolDise?'Dise: '+esc(s.previousSchoolDise)+'<br>':''}
    </div>

    <div style="margin-bottom:10px;">
      <b>ವಿಷಯ : ಕು/ಚಿ. ${esc(s.studentName)}, ${esc(s.previousClass||s.className)}ನೇ ತರಗತಿ ವಿದ್ಯಾರ್ಥಿ/ವಿದ್ಯಾರ್ಥಿನಿಯ ಮೂಲ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC) ಹಾಗೂ ಸಂಬಂಧಿತ ದಾಖಲಾತಿಗಳನ್ನು ಕಳುಹಿಸಿಕೊಡುವ ಕುರಿತು.</b>
    </div>

    <div style="margin-bottom:10px;">ಮಾನ್ಯರೇ,</div>

    <div style="text-align:justify;margin-bottom:14px;">
      ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ${esc(defaultAcademicYear())}ನೇ ಶೈಕ್ಷಣಿಕ ಸಾಲಿನಲ್ಲಿ ನಮ್ಮ ಶಾಲೆಯ <b>${esc(s.className)}ನೇ ತರಗತಿಗೆ</b> ದಾಖಲಾತಿ ಪಡೆದಿರುವ <b>${esc(s.studentName)}</b> ಅವರು ಈ ಹಿಂದೆ ತಮ್ಮ ಶಾಲೆಯಲ್ಲಿ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿದ್ದರು. ವಿದ್ಯಾರ್ಥಿ/ವಿದ್ಯಾರ್ಥಿನಿಯ ದಾಖಲಾತಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸುವ ಸಲುವಾಗಿ ಮೂಲ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC) ಹಾಗೂ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳನ್ನು ಆದಷ್ಟು ಶೀಘ್ರವಾಗಿ ಕಳುಹಿಸಿಕೊಡುವಂತೆ ವಿನಂತಿಸಿಕೊಳ್ಳಲಾಗಿದೆ.
    </div>

    <div style="margin-bottom:20px;padding-left:10px;">
      1. ಮೂಲ ವರ್ಗಾವಣೆ ಪ್ರಮಾಣ ಪತ್ರ (TC)<br>
      2. SATS ದಾಖಲೆ<br>
      3. PEN ವಿವರ<br>
      4. APAAR ID ವಿವರ<br>
      5. ಆರೋಗ್ಯ ಕಾರ್ಡ್<br>
      6. ಪ್ರಗತಿ ವರದಿ<br>
      7. ಇತರೆ ಸಂಬಂಧಿತ ದಾಖಲೆಗಳು
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:20px;">
      ${letter.principalSigned?
        cbDigiSign({signedBy:letter.principalName,signStamp:letter.signStamp||fmtDate(letter.principalSignedAt),signHost:letter.signHost,signIp:letter.signIp,signDevice:letter.signDevice},'','TC Request Letter approved'):
        `<div style="text-align:center;min-width:200px;">
          <div style="height:34px;"></div>
          <div style="border-top:1.5px solid #000;padding-top:4px;font-size:11px;">
            ಪ್ರಾಂಶುಪಾಲರು<br>ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)
          </div>
        </div>`}
    </div>
  </div>`;
}

async function signTCRequestLetter(letterId){
  const letter=DB.tcRequestLetters.find(x=>x.id===letterId); if(!letter||CURRENT_USER.role!=='principal') return;
  const ts=await getServerTimeStamp(); await cbSignMeta(letter,ts);
  letter.principalSigned=true; letter.principalName=CURRENT_USER.name; letter.principalSignedAt=todayStr();
  saveDB();
  showToast('✅ E-Signed — Print ಮಾಡಬಹುದು');
  showTCRequestPreview(letterId);
}


/* ---------- v47: FDA — ತರಗತಿವಾರು ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ Excel (ಹೆಸರು, DOB, SATS) ---------- */
function stuClassSort(a,b){ const na=Number(a), nb=Number(b); return (!isNaN(na)&&!isNaN(nb))?na-nb:String(a).localeCompare(String(b)); }
function stuExportRows(list){
  return list.slice().sort((x,y)=>String(x.studentName||'').localeCompare(String(y.studentName||''),'kn')).map((s,i)=>[
    i+1, s.className||'', s.studentName||'', s.studentNameEn||'', (normGender(s.gender)==='boy'?'ಗಂಡು':normGender(s.gender)==='girl'?'ಹೆಣ್ಣು':(s.gender||'')),
    s.dob?fmtDate(s.dob):'', String(s.satsNo||''), s.admissionNo||'', s.fatherName||'', s.motherName||'']);
}
const STU_EXP_HEAD=['ಕ್ರ.ಸಂ','ತರಗತಿ','ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು','Name (English)','ಲಿಂಗ','ಜನ್ಮ ದಿನಾಂಕ (DOB)','SATS ಸಂಖ್ಯೆ','ದಾಖಲಾತಿ ಸಂ','ತಂದೆ','ತಾಯಿ'];
function stuCheckSheet(){
  const rows=[['ತೊಂದರೆ','ತರಗತಿ','ಹೆಸರು','SATS','DOB','ವಿವರ']];
  const cnt={}; DB.students.forEach(s=>{ const k=normSats(s.satsNo); if(k) cnt[k]=(cnt[k]||0)+1; });
  DB.students.forEach(s=>{
    const add=(t,d)=>rows.push([t,s.className||'',s.studentName||'',String(s.satsNo||''),s.dob?fmtDate(s.dob):'',d||'']);
    if(!normSats(s.satsNo)) add('SATS ಇಲ್ಲ');
    else if(cnt[normSats(s.satsNo)]>1) add('SATS ಪುನರಾವರ್ತನೆ','ಇದೇ SATS ಇನ್ನೊಬ್ಬರಿಗೂ ಇದೆ');
    if(!s.dob) add('DOB ಇಲ್ಲ');
    if(normGender(s.gender)==='other') add('ಲಿಂಗ ಗೊತ್ತಿಲ್ಲ');
    if(!s.className) add('ತರಗತಿ ಇಲ್ಲ');
  });
  if(rows.length===1) rows.push(['ಯಾವುದೇ ತೊಂದರೆ ಇಲ್ಲ','','','','','']);
  return rows;
}
function renderStudentExport(){
  const sum=classwiseGenderSummary();
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🎓 ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ Excel (ತರಗತಿವಾರು)</h2>
    <div class="desc">ಹೆಸರು, ಜನ್ಮ ದಿನಾಂಕ, SATS ಸಂಖ್ಯೆ, ತರಗತಿವಾರು. ಗಂಡು/ಹೆಣ್ಣು ಒಟ್ಟಿಗೆ ಅಥವಾ ಬೇರೆ ಬೇರೆ.</div></div>
    <div class="panel"><h3>📊 ಈಗಿನ ಸಂಖ್ಯೆ</h3>
      <div class="table-wrap"><table><thead><tr><th>ತರಗತಿ</th><th>ಗಂಡು</th><th>ಹೆಣ್ಣು</th>${sum.grand.other?'<th>ಇತರೆ</th>':''}<th>ಒಟ್ಟು</th></tr></thead><tbody>
      ${sum.classes.map(c=>`<tr><td>${esc(c)}</td><td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('${esc(c)}','boy')">${sum.byClass[c].boy}</a></td><td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('${esc(c)}','girl')">${sum.byClass[c].girl}</a></td>${sum.grand.other?`<td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('${esc(c)}','other')">${sum.byClass[c].other}</a></td>`:''}<td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('${esc(c)}','')">${sum.byClass[c].total}</a></td></tr>`).join('')}
      <tr style="font-weight:800;"><td>ಒಟ್ಟು</td><td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('','boy')">${sum.grand.boy}</a></td><td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('','girl')">${sum.grand.girl}</a></td>${sum.grand.other?`<td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('','other')">${sum.grand.other}</a></td>`:''}<td><a class="cnt-link" style="cursor:pointer;color:var(--navy);text-decoration:underline;font-weight:700;" onclick="stuCountList('','')">${sum.grand.total}</a></td></tr></tbody></table></div>
      <div class="helper">👆 ಯಾವುದೇ ಸಂಖ್ಯೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿದರೆ ಆ ವಿದ್ಯಾರ್ಥಿಗಳ ಪಟ್ಟಿ ಕೆಳಗೆ ತೆರೆಯುತ್ತದೆ.</div>
      <div id="stuCountList"></div>
      <div class="helper">ಯಾವುದಾದರೂ ತರಗತಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿ ಕಡಿಮೆ ಇದ್ದರೆ ಇಲ್ಲಿನ ಸಂಖ್ಯೆಯನ್ನು ನಿಮ್ಮ ನಿಜವಾದ ಹಾಜರಾತಿ ಪಟ್ಟಿಯೊಂದಿಗೆ ಹೋಲಿಸಿ.</div></div>
    ${stuRecoveryPanel()}
    <div class="panel"><h3>⬇ Download</h3>
      <div class="form-grid">
        <div class="form-group"><label>ತರಗತಿ</label><select id="stuexp_cls"><option value="">ಎಲ್ಲಾ ತರಗತಿ</option>${sum.classes.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
        <div class="form-group"><label>ಗಂಡು / ಹೆಣ್ಣು</label><select id="stuexp_g"><option value="together">ಒಟ್ಟಿಗೆ (ಒಂದೇ ಪಟ್ಟಿ)</option><option value="separate">ಬೇರೆ ಬೇರೆ (ಗಂಡು / ಹೆಣ್ಣು ಪ್ರತ್ಯೇಕ ಶೀಟ್)</option></select></div>
      </div>
      <div class="form-actions"><button class="btn btn-green" onclick="stuExportExcel()">⬇ Excel Download</button></div>
      <div class="helper">Excel ನಲ್ಲಿ "ಸಾರಾಂಶ" ಮತ್ತು "ಪರಿಶೀಲನೆ" ಶೀಟ್ ಕೂಡ ಇರುತ್ತದೆ — SATS ಇಲ್ಲದ ಅಥವಾ ಪುನರಾವರ್ತಿತ SATS ಇರುವ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.</div></div>`;
}
function stuExportExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const cls=(document.getElementById('stuexp_cls')||{}).value||'', mode=(document.getElementById('stuexp_g')||{}).value||'together';
  const all=DB.students.filter(s=>!cls||String(s.className)===cls);
  if(!all.length){ showToast('⚠ ವಿದ್ಯಾರ್ಥಿಗಳಿಲ್ಲ'); return; }
  const classes=Array.from(new Set(all.map(s=>s.className||'—'))).sort(stuClassSort);
  const wb=XLSX.utils.book_new();
  const addSheet=(name,list)=>{
    const ws=XLSX.utils.aoa_to_sheet([STU_EXP_HEAD,...stuExportRows(list)]);
    ws['!cols']=[6,8,28,24,8,14,16,12,22,22].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws,name.replace(/[\\\/\?\*\[\]:]/g,'').slice(0,31));
  };
  const sm=[['ತರಗತಿ','ಗಂಡು','ಹೆಣ್ಣು','ಇತರೆ','ಒಟ್ಟು']]; let tb=0,tg=0,to=0;
  classes.forEach(c=>{ const l=all.filter(s=>(s.className||'—')===c), b=l.filter(s=>normGender(s.gender)==='boy').length, g=l.filter(s=>normGender(s.gender)==='girl').length, o=l.length-b-g; sm.push([c,b,g,o,l.length]); tb+=b;tg+=g;to+=o; });
  sm.push(['ಒಟ್ಟು',tb,tg,to,all.length]);
  const wsS=XLSX.utils.aoa_to_sheet(sm); wsS['!cols']=[10,10,10,10,10].map(w=>({wch:w})); XLSX.utils.book_append_sheet(wb,wsS,'ಸಾರಾಂಶ');
  if(mode==='together'){
    addSheet('All Classes',all);
    classes.forEach(c=>addSheet('Class '+c,all.filter(s=>(s.className||'—')===c)));
  } else {
    addSheet('All Boys',all.filter(s=>normGender(s.gender)==='boy')); addSheet('All Girls',all.filter(s=>normGender(s.gender)==='girl'));
    if(all.some(s=>normGender(s.gender)==='other')) addSheet('Other',all.filter(s=>normGender(s.gender)==='other'));
    classes.forEach(c=>{ const l=all.filter(s=>(s.className||'—')===c); addSheet(c+' Boys',l.filter(s=>normGender(s.gender)==='boy')); addSheet(c+' Girls',l.filter(s=>normGender(s.gender)==='girl')); });
  }
  const wsC=XLSX.utils.aoa_to_sheet(stuCheckSheet()); wsC['!cols']=[22,8,28,16,14,30].map(w=>({wch:w})); XLSX.utils.book_append_sheet(wb,wsC,'ಪರಿಶೀಲನೆ');
  XLSX.writeFile(wb,'MDRS_Students_'+(cls?('Class'+cls+'_'):'AllClasses_')+(mode==='together'?'Together':'BoysGirls')+'_'+todayStr()+'.xlsx');
  showToast('✅ Excel ಸಿದ್ಧ');
}


function stuRecoveryPanel(){
  const live=new Set((DB.students||[]).map(s=>s.id)), liveSats=new Set((DB.students||[]).map(s=>normSats(s.satsNo)).filter(Boolean));
  const bin=(DB.studentBin||[]).filter(b=>!live.has(b._origId)&&!(normSats(b.satsNo)&&liveSats.has(normSats(b.satsNo)))).slice().reverse();
  const tomb={}; Object.keys(DB.deletedIds||{}).filter(k=>k.indexOf('students:')===0).forEach(k=>{ const d=new Date(DB.deletedIds[k]).toLocaleDateString('en-IN'); tomb[d]=(tomb[d]||0)+1; });
  const log=DB.studentCountLog||{}; const days=Object.keys(log).sort().slice(-14);
  return `<div class="panel"><h3>♻️ ಕಾಣೆಯಾದ / ಅಳಿಸಿದ ವಿದ್ಯಾರ್ಥಿಗಳು (ಮರಳಿ ತರಲು)</h3>
    ${bin.length?`<div class="table-wrap"><table><thead><tr><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>SATS</th><th>DOB</th><th>ಅಳಿದ ದಿನಾಂಕ</th><th></th></tr></thead><tbody>
    ${bin.map(b=>`<tr><td>${esc(b.studentName)}</td><td>${esc(b.className)}</td><td>${esc(b.satsNo||'')}</td><td>${b.dob?esc(fmtDate(b.dob)):''}</td><td>${new Date(b._deletedAt).toLocaleDateString('en-IN')}</td><td><button class="btn btn-green btn-sm" onclick="stuRestore('${b.id}')">♻️ ಮರಳಿ ಸೇರಿಸಿ</button></td></tr>`).join('')}</tbody></table></div>`
    :`<div class="helper">ಈ ಸಾಧನದಲ್ಲಿ ಕಾಣೆಯಾದ ವಿದ್ಯಾರ್ಥಿಗಳು ದಾಖಲಾಗಿಲ್ಲ. (ಈ ವ್ಯವಸ್ಥೆ v48 ನಿಂದ ಆರಂಭ — ಇನ್ನು ಮುಂದೆ ಅಳಿದರೆ ಇಲ್ಲಿ ಕಾಣುತ್ತಾರೆ.)</div>`}
    ${Object.keys(tomb).length?`<div class="note" style="margin-top:8px;">ಅಳಿಸಲ್ಪಟ್ಟ ದಾಖಲೆಗಳ ಲೆಕ್ಕ (ವಿವರ ಲಭ್ಯವಿಲ್ಲ): ${Object.keys(tomb).map(d=>d+' → '+tomb[d]+' ವಿದ್ಯಾರ್ಥಿ').join(' · ')}</div>`:''}
    ${days.length?`<div class="helper">ದಿನವಾರು ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು: ${days.map(d=>d.slice(5)+': <b>'+log[d]+'</b>').join(' · ')}</div>`:''}
    <div class="form-actions"><button class="btn btn-outline" onclick="stuFullBackup()">💾 ಪೂರ್ಣ ಬ್ಯಾಕಪ್ (JSON) Download</button></div>
  </div>`;
}
function stuRestore(binId){
  const b=(DB.studentBin||[]).find(x=>x.id===binId); if(!b) return;
  if(b.satsNo&&DB.students.some(s=>normSats(s.satsNo)===normSats(b.satsNo))){ showToast('⚠ ಇದೇ SATS ಇರುವ ವಿದ್ಯಾರ್ಥಿ ಈಗಾಗಲೇ ಇದ್ದಾರೆ'); return; }
  const r=Object.assign({},b); delete r._origId; delete r._deletedAt; delete r._mt; r.id=uid();   // ಹೊಸ id — ಹಳೆಯ ಅಳಿಸುವ ಗುರುತು ಪುನಃ ಅಳಿಸದಂತೆ
  DB.students.push(r); DB.studentBin=DB.studentBin.filter(x=>x.id!==binId);
  logAudit('Restore','Student',r.studentName||'',r.className||''); saveDB(); showToast('✅ ವಿದ್ಯಾರ್ಥಿ ಮರಳಿ ಸೇರಿಸಲಾಗಿದೆ'); renderStudentExport();
}
function stuFullBackup(){
  const blob=new Blob([JSON.stringify(DB)],{type:'application/json'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='KREIS_FullBackup_'+todayStr()+'.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}


/* ---------- v54: "Students_Upload_Format.xlsx" (Data Entry sheet, ತಲೆಬರಹ ಸಾಲು 2) ಬೆಂಬಲ ---------- */
const UDF_COLS=[["Application No", "applicationNo"], ["Application Date", "applicationDate:d"], ["Class", "className"], ["Admission Number", "admissionNo"], ["Admission Date", "admissionDate:d"], ["SATS Number", "satsNo"], ["Student PEN", "penNo"], ["APAAR ID", "apaarId"], ["CET Reg", "cetReg"], ["CET Marks", "cetMarks"], ["Rank", "cetRank"], ["Student Name", "studentNameEn"], ["Student Name (Kannada)", "studentName"], ["Father Name", "fatherNameEn"], ["Father Name (Kannada)", "fatherName"], ["Mother Name", "motherNameEn"], ["Mother Name (Kannada)", "motherName"], ["Date of Birth", "dob:d"], ["Gender", "gender:g"], ["Nationality", "nationality"], ["Religion", "religionEn"], ["Religion (Kannada)", "religion"], ["Birth Place", "placeOfBirthEn"], ["Birth Place (Kannada)", "placeOfBirth"], ["Birth Taluk", "taluk"], ["Birth District", "district"], ["Caste", "casteEn"], ["Caste (Kannada)", "caste"], ["Sub Caste", "subcasteEn"], ["Sub Caste (Kannada)", "subcaste"], ["Category", "category"], ["Disabled?", "disability"], ["No. of Dependents", "dependents"], ["Blood Group", "bloodGroup"], ["Mother Tongue", "motherTongue"], ["Permanent Address", "addressEn"], ["Address (Kannada)", "address"], ["Taluk", "addrTaluk"], ["Taluk (Kannada)", "addrTalukKn"], ["District", "addrDistrict"], ["District (Kannada)", "addrDistrictKn"], ["Pin Code", "pinCode"], ["Mobile Number", "mobile"], ["Caste RD Number", "casteRdNo"], ["Income RD Number", "incomeRdNo"], ["SPL Category", "splCategory"], ["Name as per Aadhaar", "aadhaarName"], ["Student Aadhaar", "aadharNo"], ["Father Aadhaar", "fatherAadhaar"], ["Mother Aadhaar", "motherAadhaar"], ["Father's Occupation", "fatherOccupation"], ["Father's Income", "fatherIncome"], ["Mother's Occupation", "motherOccupation"], ["Mother's Income", "motherIncome"], ["Previous School Details", "previousSchool"], ["TC Number", "tcNo"], ["TC Date", "tcDate:d"], ["Transfer Letter No & Date", "transferLetter"], ["Transferred School DISE Code", "previousSchoolDise"], ["Transferred Academic Year", "transferredYear"], ["Documents Attached (Nos)", "docsAttached"], ["Bank Account", "bankAcc"], ["IFSC Number", "ifsc"], ["Bank Name", "bankName"], ["Promoted? (Yes/No)", "promoted"], ["Fees Paid? (Yes/No)", "feesPaid"], ["Fee Concession", "feeConcession"], ["Scholarship", "scholarship"], ["Medically Examined? (Yes/No)", "medicallyExamined"], ["Date of Admission to Class", "admissionClassDate:d"], ["Last Attendance Date", "lastAttendanceDate:d"], ["TC Application Date", "tcApplicationDate:d"], ["School Days", "schoolDays"], ["Days Attended", "daysAttended"], ["Conduct", "conduct"], ["TC Issued No", "tcIssuedNo"], ["TC Issue Date", "tcIssueDate:d"], ["Study Cert No", "studyCertNo"], ["Study Cert Date", "studyCertDate:d"], ["TC Request No", "tcRequestNo"], ["TC Request Date", "tcRequestDate:d"]];
function udfNorm(s){ return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9ಀ-೿]/g,''); }
function udfISO(v){
  if(v===null||v===undefined||v==='') return '';
  if(typeof v==='number'&&v>20000&&v<80000){ const d=new Date(Math.round((v-25569)*86400000)); return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0'); }
  if(v instanceof Date){ return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0'); }
  const t=String(v).trim(); let m;
  if((m=t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  if((m=t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  return t;
}
function udfGender(v){ const t=String(v||'').trim().toLowerCase(); if(!t) return ''; if(/^f/.test(t)||t.indexOf('girl')>=0||t.indexOf('ಹೆಣ್ಣು')>=0||t.indexOf('ಹುಡುಗಿ')>=0||t.indexOf('ಬಾಲಕಿ')>=0||t.indexOf('ಮಹಿಳೆ')>=0) return 'ಹೆಣ್ಣು'; if(/^m/.test(t)||t.indexOf('boy')>=0||t.indexOf('ಗಂಡು')>=0||t.indexOf('ಹುಡುಗ')>=0||t.indexOf('ಬಾಲಕ')>=0) return 'ಗಂಡು'; return 'ಇತರ'; }
function udfIsFormat(rows){
  for(let i=0;i<Math.min(4,rows.length);i++){ const n=(rows[i]||[]).map(udfNorm); if(n.includes('admissionnumber')&&n.includes('studentname')&&n.includes('class')) return i; }
  return -1;
}
function udfParse(rows,hi){
  const hdr=rows[hi].map(udfNorm); const colOf={};
  UDF_COLS.forEach(([h,k])=>{ const i=hdr.indexOf(udfNorm(h)); if(i>=0) colOf[k.split(':')[0]]={i,t:k.split(':')[1]||''}; });
  const out=[]; const seenSats={}, seenAdm={};
  rows.slice(hi+1).forEach((row,ri)=>{
    if(!row||!row.some(v=>String(v==null?'':v).trim()!=='')) return;
    const d={};
    Object.keys(colOf).forEach(k=>{ const c=colOf[k]; let v=row[c.i]; if(c.t==='d') v=udfISO(v); else if(c.t==='g') v=udfGender(v); else v=String(v==null?'':v).trim(); if(v!=='') d[k]=v; });
    ['religion','placeOfBirth','caste','subcaste','address'].forEach(k=>{ if(!d[k]&&d[k+'En']) d[k]=d[k+'En']; });
    d.studentName=d.studentName||d.studentNameEn||''; d.fatherName=d.fatherName||d.fatherNameEn||''; d.motherName=d.motherName||d.motherNameEn||'';
    Object.keys(d).forEach(k=>{ if(d[k]==='') delete d[k]; });
    if(d.className) d.className=String(d.className).replace(/\D/g,'')||d.className;
    const r=Object.assign({_row:ri+hi+2,_udf:true,_data:d},{studentName:d.studentName,className:d.className||'',gender:d.gender||'',dob:d.dob||'',fatherName:d.fatherName||'',satsNo:d.satsNo||'',mobile:d.mobile||''});
    const err=[];
    if(!d.className) err.push('ತರಗತಿ ಇಲ್ಲ'); else if(!['6','7','8','9','10'].includes(d.className)) err.push('ತರಗತಿ 6–10 ಮಾತ್ರ');
    if(!d.studentName) err.push('ಹೆಸರು ಇಲ್ಲ');
    if(!d.gender) err.push('Gender ಇಲ್ಲ');
    const ks=normSats(d.satsNo); if(ks){ if(seenSats[ks]) err.push('SATS ಫೈಲ್‌ನಲ್ಲಿ ಪುನರಾವರ್ತನೆ (ಸಾಲು '+seenSats[ks]+')'); else seenSats[ks]=r._row; }
    const ka=String(d.admissionNo||'').toLowerCase(); if(ka){ if(seenAdm[ka]) err.push('Admission No ಪುನರಾವರ್ತನೆ (ಸಾಲು '+seenAdm[ka]+')'); else seenAdm[ka]=r._row; }
    r._valid=!err.length; r._error=err.join(', ');
    out.push(r);
  });
  return out;
}
function udfFindExisting(d){
  if(d.satsNo){ const e=DB.students.find(s=>normSats(s.satsNo)===normSats(d.satsNo)); if(e) return e; }
  if(d.admissionNo){ const e=DB.students.find(s=>String(s.admissionNo||'').toLowerCase()===String(d.admissionNo).toLowerCase()&&String(s.className)===String(d.className)); if(e) return e; }
  return null;
}
function udfApplyRow(r){
  const d=Object.assign({},r._data); const ex=udfFindExisting(d);
  if(ex){ Object.assign(ex,d); return 'updated'; }
  if(!d.admissionNo){ if(!DB.seq) DB.seq={}; DB.seq.student=(DB.seq.student||0)+1; d.admissionNo='ADM-'+DB.seq.student; }   // Admission Number ಖಾಲಿ ಇದ್ದರೆ ಸ್ವಯಂ ಸಂಖ್ಯೆ
  DB.students.push(Object.assign({id:uid(),admissionDate:todayStr()},d)); return 'added';
}
function udfSheetRows(){
  const ymd=v=>{ const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/); return m?m[3]+'-'+m[2]+'-'+m[1]:(v||''); };
  return DB.students.slice().sort((a,b)=>(Number(a.className)-Number(b.className))||String(a.studentNameEn||a.studentName||'').localeCompare(String(b.studentNameEn||b.studentName||''))).map(s=>UDF_COLS.map(([h,k])=>{
    const key=k.split(':')[0], t=k.split(':')[1]||''; let v=s[key];
    if(key==='studentName') v=s.studentName; if(key==='admissionNo') v=s.admissionNo;
    if(t==='d') return ymd(v); if(t==='g') return v==='ಗಂಡು'?'MALE':v==='ಹೆಣ್ಣು'?'FEMALE':(v||'');
    return v==null?'':v; }));
}
function udfWrite(withData){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const title=['MDRS Hebale (BC-265) - Student Data. Row 2 = headings (do not change). Enter students from row 3. Dates as dd-mm-yyyy.'];
  const aoa=[title,UDF_COLS.map(c=>c[0])]; if(withData) udfSheetRows().forEach(r=>aoa.push(r));
  const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!cols']=UDF_COLS.map(()=>({wch:22}));
  const ins=XLSX.utils.aoa_to_sheet([['1. Fill students in sheet "Data Entry" from row 3 (do not change row 2 headings).'],['2. Compulsory: Class, Student Name, Gender. Admission Number may be left blank (auto-generated).'],['3. Class: 6,7,8,9,10. Dates: dd-mm-yyyy. Gender: MALE/FEMALE.'],['4. Save as .xlsx.'],['5. In software: Students tab > Excel upload > choose this file.']]);
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Data Entry'); XLSX.utils.book_append_sheet(wb,ins,'Instructions');
  XLSX.writeFile(wb,withData?('Students_Data_'+todayStr()+'.xlsx'):'Students_Upload_Format.xlsx');
  showToast('✅ Excel ಸಿದ್ಧ');
}

;(window.__LOADED=window.__LOADED||[]).push('students-staff');


/* ---------- v63: ಪ್ರಮಾಣ ಪತ್ರಗಳು — ಪ್ರತ್ಯೇಕ ಟ್ಯಾಬ್‌ಗಳು ---------- */
var STUCERT_TAB=window.STUCERT_TAB||'marks', STUCERT_ID=null;
const STUCERT_TABS=[
  ['marks','📄 ಅಂಕ ಪತ್ರಿಕೆ (Marks Card)','openGenerateCardModal',['fda']],
  ['study','🎓 ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ (Study Certificate)','generateStudyCertificate',['fda','principal']],
  ['tcreq','📨 TC ಕೋರಿಕೆ ಪತ್ರ','generateTCRequestLetter',['fda','principal']],
  ['adm','📝 ಪ್ರವೇಶ ಅರ್ಜಿ','generateAdmissionApp',['fda','principal']]
];
function stucertTab(t){ STUCERT_TAB=t; renderStuCerts(); }
function renderPrincipalCerts(){
  const nm=id=>{ const s=stuAny(id); return s?s.studentName:'—'; };
  const items=[
    ...(DB.studyCertificates||[]).filter(c=>c.status==='Submitted'||c.status==='Signed').map(c=>({t:'ಅಧ್ಯಯನ ಪ್ರಮಾಣ ಪತ್ರ',no:c.no,date:c.date,stu:nm(c.studentId),done:c.status==='Signed',view:`showStudyCert('${c.id}')`,sign:`scSign('${c.id}')`})),
    ...(DB.tcRequestLetters||[]).map(l=>({t:'TC ಕೋರಿಕೆ ಪತ್ರ',no:l.letterNo,date:l.letterDate,stu:nm(l.studentId),done:!!l.principalSigned,view:`showTCRequestPreview('${l.id}')`,sign:`signTCRequestLetter('${l.id}')`})),
    ...(DB.admissionApplications||[]).map(a=>({t:'ಪ್ರವೇಶ ಅರ್ಜಿ',no:a.appNo||a.applicationNo||'',date:a.generatedAt||'',stu:nm(a.studentId),done:!!a.principalSigned,view:`showAdmissionAppPreview('${a.id}')`,sign:`signAdmissionApp('${a.id}')`}))
  ];
  const orphans=items.filter(i=>!i.done&&i.stu==='—');
  const pend=items.filter(i=>!i.done&&i.stu!=='—'), done=items.filter(i=>i.done).slice(-20).reverse();
  const row=(i,n,p)=>`<tr><td class="c">${n+1}</td><td>${esc(i.t)}</td><td>${esc(i.no||'—')}</td><td><b>${esc(i.stu)}</b></td><td>${i.date?fmtDate(i.date):''}</td><td><button class="btn btn-sm btn-outline" onclick="${i.view}">👁 ವೀಕ್ಷಿಸಿ</button>${p?` <button class="btn btn-sm btn-primary" onclick="${i.sign}">✍ ಅನುಮೋದಿಸಿ</button>`:''}</td></tr>`;
  const tbl=(l,p)=>`<div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಾಖಲೆ</th><th>ಸಂಖ್ಯೆ</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ದಿನಾಂಕ</th><th>Action</th></tr></thead><tbody>${l.map((i,n)=>row(i,n,p)).join('')}</tbody></table></div>`;
  document.getElementById('content').innerHTML=`<div class="page-head"><h2>📑 ಪ್ರಮಾಣ ಪತ್ರಗಳು — ಅನುಮೋದನೆ</h2></div>
    <div class="panel no-print" style="border:2px solid var(--navy);"><h3>✍ ಅನುಮೋದನೆಗೆ ಬಾಕಿ (${pend.length})</h3>${pend.length?tbl(pend,true):'<div class="small-muted">ಅನುಮೋದನೆಗೆ ಯಾವುದೂ ಬಾಕಿ ಇಲ್ಲ ✅</div>'}</div>
    ${orphans.length?`<div class="panel no-print" style="border:1px solid var(--gold);"><h3>⚠ ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಇಲ್ಲದ ಅರ್ಜಿಗಳು (${orphans.length})</h3><div class="small-muted" style="margin-bottom:8px;">ಈ ದಾಖಲೆಗಳ ವಿದ್ಯಾರ್ಥಿ ಈಗ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ — ತೆರೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ. ಬೇಕಿಲ್ಲದಿದ್ದರೆ ತೆಗೆದುಹಾಕಿ.</div><div class="small-muted" style="margin-bottom:8px;">${orphans.map(i=>esc(i.t)+' '+esc(i.no||'')).join(' · ')}</div><button class="btn btn-sm btn-outline" onclick="purgeOrphanCerts()">🗑 ಇವನ್ನು ತೆಗೆದುಹಾಕಿ</button></div>`:''}
    ${done.length?`<div class="panel no-print"><h3>✅ ಅನುಮೋದಿಸಿದವು</h3>${tbl(done,false)}</div>`:''}
    <div id="certPreviewWrap"></div>`;
}
function purgeOrphanCerts(){
  if(CURRENT_USER.role!=='principal') return;
  const gone=id=>!stuAny(id);
  const na=(DB.admissionApplications||[]).filter(a=>!a.principalSigned&&gone(a.studentId)).length;
  const nt=(DB.tcRequestLetters||[]).filter(l=>!l.principalSigned&&gone(l.studentId)).length;
  if(!na&&!nt) return;
  if(!confirm('ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಇಲ್ಲದ '+na+' ಪ್ರವೇಶ ಅರ್ಜಿ ಮತ್ತು '+nt+' TC ಕೋರಿಕೆ ಪತ್ರಗಳನ್ನು ತೆಗೆದುಹಾಕುವುದೇ?')) return;
  DB.admissionApplications=(DB.admissionApplications||[]).filter(a=>a.principalSigned||!gone(a.studentId));
  DB.tcRequestLetters=(DB.tcRequestLetters||[]).filter(l=>l.principalSigned||!gone(l.studentId));
  logAudit('Delete','OrphanCerts','-',na+' admission apps, '+nt+' TC request letters (student record missing)');
  saveDB(); showToast('🗑 ತೆಗೆದುಹಾಕಲಾಗಿದೆ'); renderPrincipalCerts();
}
function renderStuCerts(){
  if(CURRENT_USER.role==='principal') return renderPrincipalCerts();
  const tabs=STUCERT_TABS.filter(t=>t[3].includes(CURRENT_USER.role));
  if(!tabs.find(t=>t[0]===STUCERT_TAB)) STUCERT_TAB=tabs[0][0];
  const cur=tabs.find(t=>t[0]===STUCERT_TAB);
  const q=(document.getElementById('sc_q')?.value||'').trim().toLowerCase();
  let cls=document.getElementById('sc_cls')?.value||'';
  const classes=[...new Set(['6','7','8','9','10'].concat(DB.students.map(s=>s.className).filter(Boolean)))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
  let list=DB.students.filter(s=>(!cls||s.className===cls)&&(!q||(s.studentName||'').toLowerCase().includes(q)||(s.studentNameEn||'').toLowerCase().includes(q)||(s.satsNo||'').toLowerCase().includes(q)||(s.admissionNo||'').toLowerCase().includes(q)));
  if(STUCERT_ID && !q && !cls){ const one=DB.students.find(s=>s.id===STUCERT_ID); if(one) list=[one]; }
  list=list.slice().sort((a,b)=>String(a.className).localeCompare(String(b.className),undefined,{numeric:true})||String(a.studentNameEn||a.studentName).localeCompare(String(b.studentNameEn||b.studentName)));
  const shown=list;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📑 ಪ್ರಮಾಣ ಪತ್ರಗಳು</h2><div class="desc">ಪ್ರತಿಯೊಂದು ದಾಖಲೆಗೂ ಪ್ರತ್ಯೇಕ ಟ್ಯಾಬ್ — ವಿದ್ಯಾರ್ಥಿ ಆಯ್ಕೆ ಮಾಡಿ ಸಿದ್ಧಪಡಿಸಿ. (TC ನೀಡಲು: SC / TC ಪುಟ ಬಳಸಿ)</div></div>
    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">${tabs.map(t=>`<button class="btn ${t[0]===STUCERT_TAB?'btn-primary':'btn-outline'}" onclick="stucertTab('${t[0]}')">${t[1]}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <select id="sc_cls" onchange="STUCERT_ID=null;renderStuCerts()" style="padding:8px;"><option value="">ಎಲ್ಲಾ ತರಗತಿ</option>${classes.map(c=>`<option value="${esc(c)}" ${c===cls?'selected':''}>${esc(c)}ನೇ ತರಗತಿ</option>`).join('')}</select>
        <input id="sc_q" placeholder="🔍 ಹೆಸರು / SATS / ದಾಖಲಾತಿ ಸಂಖ್ಯೆ" value="${esc(q)}" oninput="STUCERT_ID=null;renderStuCerts()" style="flex:1;min-width:200px;">
        ${STUCERT_ID?`<button class="btn btn-sm btn-outline" onclick="STUCERT_ID=null;renderStuCerts()">ಎಲ್ಲರನ್ನೂ ತೋರಿಸಿ</button>`:''}
      </div>
      <h3 style="margin:6px 0;">${cur[1]} <span class="small-muted">(${list.length} ವಿದ್ಯಾರ್ಥಿಗಳು)</span></h3>
      <div class="table-wrap"><table><thead><tr><th>ದಾಖಲಾತಿ</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>SATS</th><th>Action</th></tr></thead><tbody>
      ${shown.length?shown.map(s=>`<tr><td>${esc(s.admissionNo)}</td><td><b>${esc(s.studentName)}</b>${s.studentNameEn?`<br><span class="small-muted">${esc(s.studentNameEn)}</span>`:''}</td><td>${esc(s.className)}</td><td>${esc(s.satsNo)}</td><td><button class="btn btn-sm btn-primary" onclick="${cur[2]}('${s.id}')">${cur[1].split(' (')[0]} — ತಯಾರಿಸಿ</button></td></tr>`).join(''):'<tr class="empty-row"><td colspan="5">ಯಾರೂ ಸಿಗಲಿಲ್ಲ.</td></tr>'}
      </tbody></table></div>
      
    </div>
    ${STUCERT_TAB==='study'?studyCertListHtml():''}
    <div id="certPreviewWrap"></div>`;
}


/* ---------- v64: ಹೊಸ ಪ್ರವೇಶ — ಪ್ರತ್ಯೇಕ ಪುಟ ---------- */
function renderNewAdmission(){
  const canEdit=['fda','principal'].includes(CURRENT_USER.role);
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>➕ ಹೊಸ ಪ್ರವೇಶ (New Admission)</h2><div class="desc">ಹೊಸ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಒಬ್ಬೊಬ್ಬರಾಗಿ ಅಥವಾ Excel ಮೂಲಕ ಒಟ್ಟಿಗೆ ಸೇರಿಸಿ. ದಾಖಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳ ತರಗತಿವಾರು ಪಟ್ಟಿ "ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ" ಪುಟದಲ್ಲಿದೆ.</div></div>
    ${canEdit?`
    <div class="panel">
      <h3>📤 Bulk Upload — Excel ಮೂಲಕ ಒಟ್ಟಿಗೆ ಅಪ್‌ಲೋಡ್</h3>
      <div class="note" style="margin-bottom:12px;">
        1️⃣ Template Download ಮಾಡಿ &nbsp;→&nbsp; 2️⃣ Excel ನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ ತುಂಬಿ &nbsp;→&nbsp; 3️⃣ Upload ಮಾಡಿ &nbsp;→&nbsp; 4️⃣ Preview ನೋಡಿ Import ಮಾಡಿ
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <button class="btn btn-gold" onclick="udfWrite(false)">⬇ Students_Upload_Format.xlsx (ಖಾಲಿ)</button>
        <button class="btn btn-outline btn-sm" onclick="downloadStudentTemplate()">⬇ ಹಳೆಯ Template</button>
        <label class="btn btn-primary" style="cursor:pointer;">
          📂 Excel File Upload
          <input type="file" id="bulkExcelInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleStudentExcelUpload(this)">
        </label>
        <button class="btn btn-outline btn-sm" onclick="downloadStudentList()">⬇ ಇಂದಿನ ಪಟ್ಟಿ Export</button>
        <button class="btn btn-outline btn-sm" onclick="udfWrite(true)">⬇ ಇಂದಿನ ಪಟ್ಟಿ (Upload Format ನಲ್ಲಿ)</button>
      </div>
      <div id="bulkPreviewWrap"></div>
    </div>

    <div class="panel"><h3>➕ ಒಬ್ಬ ವಿದ್ಯಾರ್ಥಿ ಪ್ರವೇಶ</h3>
      <div class="form-grid">${STUDENT_FIELDS.map(f=>fieldHtml(f,'student')).join('')}</div>
      <div class="form-actions"><button class="btn btn-primary" onclick="addStudent()">Save</button></div>
    </div>`:''}
`;
}


/* ---------- v65: ಸಂಖ್ಯೆ ಕ್ಲಿಕ್ → ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ ---------- */
function stuCountList(cls,g){
  const list=DB.students.filter(s=>(!cls||(s.className||'—')===cls)&&(!g||normGender(s.gender)===g))
    .sort((a,b)=>String(a.className).localeCompare(String(b.className),undefined,{numeric:true})||String(a.studentNameEn||a.studentName).localeCompare(String(b.studentNameEn||b.studentName)));
  const gl={boy:'ಗಂಡು',girl:'ಹೆಣ್ಣು',other:'ಇತರೆ'};
  const title=(cls?cls+'ನೇ ತರಗತಿ':'ಎಲ್ಲಾ ತರಗತಿ')+' — '+(g?gl[g]:'ಒಟ್ಟು')+' ('+list.length+')';
  const w=document.getElementById('stuCountList'); if(!w) return;
  w.innerHTML=`<div style="margin-top:14px;border-top:2px solid var(--navy);padding-top:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><h3 style="margin:0;">📋 ${esc(title)}</h3>
    <span><button class="btn btn-sm btn-green" onclick="stuCountExcel('${cls||''}','${g||''}')">⬇ Excel</button> <button class="btn btn-sm btn-outline" onclick="document.getElementById('stuCountList').innerHTML=''">✕ ಮುಚ್ಚಿ</button></span></div>
    <div class="table-wrap"><table><thead><tr><th>#</th><th>ಹೆಸರು</th><th>ತರಗತಿ</th><th>ಲಿಂಗ</th><th>ಜನ್ಮ ದಿನಾಂಕ</th><th>SATS</th></tr></thead><tbody>
    ${list.map((s,i)=>`<tr><td>${i+1}</td><td><b>${esc(s.studentName)}</b>${s.studentNameEn?`<br><span class="small-muted">${esc(s.studentNameEn)}</span>`:''}</td><td>${esc(s.className)}</td><td>${esc(s.gender)}</td><td>${s.dob?esc(fmtDate(s.dob)):''}</td><td>${esc(s.satsNo)}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="6">ಯಾರೂ ಇಲ್ಲ</td></tr>'}
    </tbody></table></div></div>`;
  w.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function stuCountExcel(cls,g){
  const list=DB.students.filter(s=>(!cls||(s.className||'—')===cls)&&(!g||normGender(s.gender)===g));
  const rows=[['#','ಹೆಸರು','Name (English)','ತರಗತಿ','ಲಿಂಗ','ಜನ್ಮ ದಿನಾಂಕ','SATS']].concat(list.map((s,i)=>[i+1,s.studentName||'',s.studentNameEn||'',s.className||'',s.gender||'',s.dob||'',s.satsNo||'']));
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Students');
  XLSX.writeFile(wb,'Students_'+(cls||'All')+'_'+(g||'total')+'.xlsx');
}
