/* =====================================================================
   KREIS e-Office v35 — common.js
   ಹಂಚಿಕೆ ಕೋಡ್ / Shared helpers used by several menu sections
   ===================================================================== */
function money(n){ n=Number(n||0); return '₹'+n.toLocaleString('en-IN',{maximumFractionDigits:2}); }

function badgeClass(status){
  if(!status) return 'badge-draft';
  const s=status.toLowerCase();
  if(s.includes('reject')) return 'badge-bad';
  if(s.includes('close')||s.includes('approved')||s.includes('paid')||s.includes('dispatch')) return 'badge-ok';
  if(s.includes('draft')) return 'badge-draft';
  return 'badge-progress';
}

function fieldHtml(f,scope){
  const id=`fld_${scope}_${f.key}`;
  if(f.type==='select'){
    const opts=(typeof f.options==='function'?f.options():f.options)||[];
    return `<div class="field"><label>${esc(f.label)}</label><select id="${id}">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;
  }
  if(f.type==='textarea'){
    return `<div class="field" style="grid-column:1/-1;"><label>${esc(f.label)}</label><textarea id="${id}" rows="3">${esc(f.default||'')}</textarea></div>`;
  }
  if(f.type==='file_upload'){
    return `<div class="field" style="grid-column:1/-1;"><label>${esc(f.label)}</label>
      <input type="file" id="${id}" accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.png"
        style="padding:6px;border:1.5px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
      <div id="${id}_info" style="font-size:11px;color:var(--muted);margin-top:3px;"></div>
    </div>`;
  }
  return `<div class="field"><label>${esc(f.label)}</label><input type="${f.type||'text'}" id="${id}" value="${esc(typeof f.default==='function'?f.default():(f.default||''))}"></div>`;
}

function readFields(fields,scope){
  const out={}; const promises=[];
  fields.forEach(f=>{
    const el=document.getElementById(`fld_${scope}_${f.key}`);
    if(f.type==='file_upload'){
      out[f.key]=''; out[f.key+'_fileData']=null; out[f.key+'_fileName']=null; out[f.key+'_fileType']=null;
      if(el?.files?.[0]){
        const file=el.files[0]; if(file.size>5*1024*1024){ showToast('⚠ ಫೈಲ್ 5 MB ಗಿಂತ ದೊಡ್ಡದು — ಚಿಕ್ಕ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ'); el.value=''; return; } out[f.key]=file.name;
        promises.push(new Promise(res=>{
          const r=new FileReader();
          r.onload=e=>{ out[f.key+'_fileData']=e.target.result; out[f.key+'_fileName']=file.name; out[f.key+'_fileType']=file.type; res(); };
          r.readAsDataURL(file);
        }));
      }
    } else {
      out[f.key]=el?el.value:'';
    }
  });
  out._filePromises=promises;
  return out;
}

function staffSignatureHTML(hrmsId, signedAt, signedDate, opts={}){
  const st=STAFF.find(x=>x.hrmsId===hrmsId);
  return cbDigiSign({signedBy:opts.name||st?.name||'',signStamp:opts.stamp||nicStampText(signedAt,signedDate),signHost:opts.host||location.host,signIp:opts.ip,signDevice:opts.device,signDesig:opts.desig||st?.desig||'Staff'},'',opts.reason||'Submitted');
}

function staffSignatureHTMLByName(name, signedAt, signedDate, opts={}){
  const s=staffByName(name);
  return staffSignatureHTML(s?.hrmsId, signedAt, signedDate, Object.assign({name:name, desig:s?.desig||''},opts));
}

function semTotalGrade(total,max){
  if(max===50){
    if(total>=45) return 'A+'; if(total>=35) return 'A'; if(total>=25) return 'B+'; if(total>=15) return 'B'; if(total>=1) return 'C'; return '—';
  }
  // Grand total 100
  if(total>=90) return 'A+'; if(total>=70) return 'A'; if(total>=50) return 'B+'; if(total>=30) return 'B'; return 'C';
}

function defaultAcademicYear(){
  const d=new Date(); const y=d.getFullYear(); const m=d.getMonth()+1;
  return m>=6 ? `${y}-${String(y+1).slice(2)}` : `${y-1}-${String(y).slice(2)}`;
}

function monthIdx(date){ return (+date.slice(5,7)+8)%12; }

function printHeaderHtml(title,sub){
  return `<div class="print-only" style="text-align:center;margin-bottom:8px;"><div style="font-weight:800;font-size:14px;">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಭಟ್ಕಳ (BC-265)</div><div style="font-weight:700;font-size:12px;">${esc(title)}${sub?' — '+esc(sub):''}</div></div>`;
}

function openGenerateCardModal(studentId){
  const s=DB.students.find(x=>x.id===studentId); if(!s) return;
  const clsTeacher=DB.classTeacherAllocation[s.className];
  document.getElementById('pwModalBg').classList.add('show');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:480px;">
    <h3>📄 ಪ್ರಗತಿ ಪತ್ರಿಕೆ Generate — ${esc(s.studentName)}</h3>
    <div class="kv"><b>ತರಗತಿ</b>${esc(s.className)}</div>
    <div class="kv"><b>SATS</b>${esc(s.satsNo||'—')}</div>
    <div class="kv"><b>Class Teacher</b>${esc(clsTeacher||'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ')}</div>
    
    <div class="field" style="margin-top:10px;"><label>ಶೈಕ್ಷಣಿಕ ಸಾಲು</label><input id="pc_acyear" value="2025-2026" readonly></div>
    <div class="form-grid">
      <div class="field"><label>ಎತ್ತರ (Height cm)</label><input id="pc_height" value="${esc(s.height||'')}"></div>
      <div class="field"><label>ತೂಕ (Weight kg)</label><input id="pc_weight" value="${esc(s.weight||'')}"></div>
      <div class="field"><label>ರಕ್ತದ ಗುಂಪು</label><select id="pc_blood">
        ${['','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=>`<option ${(s.bloodGroup||'')==v?'selected':''}>${v}</option>`).join('')}
      </select></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Cancel</button>
      <button class="btn btn-primary" onclick="generateCard('${studentId}')">📄 Generate</button>
    </div>
  </div>`;
}

function generateCard(studentId){
  const s=DB.students.find(x=>x.id===studentId); if(!s) return;
  const acyear=document.getElementById('pc_acyear').value;
  const height=document.getElementById('pc_height').value;
  const weight=document.getElementById('pc_weight').value;
  const bloodGroup=document.getElementById('pc_blood').value;
  // Update student physical data
  s.height=height; s.weight=weight; s.bloodGroup=bloodGroup;
  const card={
    id:uid(), studentId, studentName:s.studentName, className:s.className, satsNo:s.satsNo||'',
    admissionNo:s.admissionNo||'', academicYear:acyear,
    status:'Generated', generatedBy:CURRENT_USER.name, generatedAt:todayStr(),
    classTeacherSigned:false, classTeacherSignedAt:null, classTeacherName:null,
    principalSigned:false, principalSignedAt:null, principalName:null,
    issuedAt:null, issuedBy:null, issuedTo:'', docNo:null,
    nonScholastic: Object.fromEntries(NS_ITEMS.map(n=>[n.key,{sa1:'A',sa2:'A'}])),
    result:'', remarks:''
  };
  card.docNo=pcDocNo(card,s);
  try{ const ts=getServerTimeStamp(); card.generatedTime=ts&&ts.time?ts.time:new Date().toTimeString().slice(0,8); }catch(e){ card.generatedTime=new Date().toTimeString().slice(0,8); }
  DB.progressCards.push(card); pcRegSync(card); saveDB();
  document.getElementById('pwModalBg').classList.remove('show');
  showToast('✅ ಪ್ರಗತಿ ಪತ್ರಿಕೆ Generate ಆಗಿದೆ');
  navigate('markscard'); viewCardById(card.id);
}
function sendCardToClassTeacher(cardId){
  const c=DB.progressCards.find(x=>x.id===cardId); if(!c||CURRENT_USER.role!=='fda') return;
  const t=DB.classTeacherAllocation[c.className];
  if(!t){ showToast('⚠ ಈ ತರಗತಿಗೆ Class Teacher ನಿಯೋಜಿಸಿ (Principal → Class Teacher Allocation)',5000); return; }
  if(!confirm(c.studentName+' — ಪ್ರಗತಿ ಪತ್ರಿಕೆಯನ್ನು Class Teacher '+t+' ಅವರಿಗೆ ಕಳುಹಿಸಬೇಕೇ?')) return;
  c.status='Sent to Class Teacher'; c.sentToTeacherAt=todayStr();
  pushNotification(t,'📄 ಪ್ರಗತಿ ಪತ್ರಿಕೆ ಪರಿಶೀಲನೆ / ಅನುಮೋದನೆಗೆ: '+c.studentName+' ('+c.className+'ನೇ)');
  saveDB(); showToast('✅ '+t+' ಅವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); navigate('markscard');
}

function cacheServerOffset(ts){
  if(!ts||!ts.server) return;
  const dev=todayStr();
  SERVER_DATE_OFFSET = (Date.parse(ts.date+'T00:00:00Z')-Date.parse(dev+'T00:00:00Z'))/86400000;
}

async function getServerTimeStamp(){
  try{
    const sb=getSB();
    if(sb){
      const {data,error}=await Promise.race([sb.rpc('get_server_time'), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),3000))]);
      if(!error && data){
        const d=new Date(data);
        const ts={iso:d.toISOString(), date:d.toISOString().slice(0,10), time:d.toLocaleTimeString('en-IN'), server:true};
        cacheServerOffset(ts);
        return ts;
      }
    }
  }catch(e){}
  const d=new Date();
  return {iso:d.toISOString(), date:d.toISOString().slice(0,10), time:d.toLocaleTimeString('en-IN'), server:false};
}

;(window.__LOADED=window.__LOADED||[]).push('common');
