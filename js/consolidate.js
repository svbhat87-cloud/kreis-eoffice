/* =====================================================================
   KREIS e-Office v38 — consolidate.js
   ಕ್ಲಾಸ್ ಟೀಚರ್ ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ (Consolidate) ಮತ್ತು ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ
   Class-teacher verification + consolidation + principal approval (KSEAB-style result sheets)

   Flow:  subject teacher  --Submit-->  class teacher (Verify / Return)
          class teacher    --Consolidate--> sees what is missing --Send-->  principal
          principal        --Approve / Return (whole class + exam at once)
   The class teacher's own subject is verified automatically.
   ===================================================================== */
const CONS_CORE=['Kannada','English','Hindi','Mathematics','Science','Social Science'];
const CONS_RANK={'Draft':1,'Returned':2,'Submitted':3,'Class Teacher Verified':4,'Frozen':5,'Approved':6,'FDA Acknowledged':7};
const CONS_OK=['Class Teacher Verified','Frozen','Approved','FDA Acknowledged'];
const CONS_GRADES=['A+','A','B+','B','C+','C','NC','Ab'];
const CONS_AB=['A+','A','B+','B'];                       // "grades A and B" of the qualitative result
const CONS_STATUS_KN={
  missing:'ನಮೂದಿಸಿಲ್ಲ', draft:'ಶಿಕ್ಷಕರು ಇನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ (Draft)', pending:'ಪರಿಶೀಲನೆ ಬಾಕಿ', returned:'ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ',
  ok:'ಪರಿಶೀಲಿಸಲಾಗಿದೆ ✓', frozen:'ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ ಬಾಕಿ', approved:'ಅನುಮೋದಿತ ✓'};
var CONS_CUR=null;

function consStatusLabel(st){
  return ({'Draft':'ಕರಡು (Draft)','Submitted':'ಕ್ಲಾಸ್ ಟೀಚರ್ ಪರಿಶೀಲನೆ ಬಾಕಿ','Class Teacher Verified':'ಕ್ಲಾಸ್ ಟೀಚರ್ ಪರಿಶೀಲಿಸಿದ್ದಾರೆ ✓','Returned':'ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ','Frozen':'ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ ಬಾಕಿ','Approved':'ಅನುಮೋದಿತ ✓','FDA Acknowledged':'ಅನುಮೋದಿತ ✓'})[st]||st;
}
/* ------------------------------------------------------------------ exams that can be consolidated */
function consExamOptions(cls){
  const seen=[]; const add=(e)=>{ if(e&&!seen.includes(e)) seen.push(e); };
  DB.marks.filter(m=>String(m.className)===String(cls)).forEach(m=>add(m.examName));       // exams that really have marks
  if(String(cls)==='10') SSLC_EXAMS.forEach(add);                                         // exams of the SSLC dashboard
  examNamesForClass(String(cls)).forEach(add); allExamNames().forEach(add);
  return seen;
}
function consDefaultExam(cls){
  const pri={'Frozen':1,'Class Teacher Verified':2,'Submitted':3,'Returned':4,'Draft':5,'Approved':6,'FDA Acknowledged':6};
  const best=DB.marks.filter(m=>String(m.className)===String(cls)).sort((a,b)=>(pri[a.status]||9)-(pri[b.status]||9))[0];
  return best?best.examName:consExamOptions(cls)[0];
}
function consFillExams(){
  const c=document.getElementById('cons_cls'), e=document.getElementById('cons_exam'); if(!c||!e) return;
  const cur=e.value, opts=consExamOptions(c.value);
  e.innerHTML=opts.map(x=>`<option ${x===cur?'selected':''}>${esc(x)}</option>`).join('');
  if(!opts.includes(cur)) e.value=consDefaultExam(c.value);
}
/* ------------------------------------------------------------------ data helpers */
function consKey(cls,exam){ return cls+'||'+exam; }
function consSubjectList(cls,exam){
  const saved=(DB.consSubjects||{})[consKey(cls,exam)];
  const base=(saved&&saved.length)?saved:CONS_CORE;
  const withRec=SUBJECTS.filter(s=>DB.marks.some(m=>m.className===cls&&m.examName===exam&&m.subject===s));
  return SUBJECTS.filter(s=>base.includes(s)||withRec.includes(s));
}
function consPickRecord(cls,exam,subject){
  const recs=DB.marks.filter(m=>m.className===cls&&m.examName===exam&&m.subject===subject);
  if(!recs.length) return null;
  return recs.slice().sort((a,b)=>(CONS_RANK[b.status]||0)-(CONS_RANK[a.status]||0))[0];
}
function consTeachersFor(cls,subject){
  return STAFF.filter(s=>s.role==='staff').filter(s=>{ const a=getAssignment(s.hrmsId); return a&&(a.subjects||[]).includes(subject)&&(a.classes||[]).includes(cls); }).map(s=>s.name);
}
function consClassOf(pct){ return pct>=85?'Dist.':pct>=60?'1st CLASS':pct>=50?'2nd CLASS':'3rd CLASS'; }
function consStudentsOf(cls){
  return DB.students.filter(s=>String(s.className)===String(cls)).slice()
    .sort((a,b)=>String(a.studentNameEn||a.studentName||'').localeCompare(String(b.studentNameEn||b.studentName||''),'en'));
}
function consRound2(x){ return (Math.round(x*100)/100).toFixed(2); }

/* ------------------------------------------------------------------ the maths (pure: works on a model, no DOM) */
function consCompute(m){
  const gradeOf=(marks,max)=>calcGradeFromLock(marks,{grades:kseabGradeScale(max)});
  const nSub=m.subjects.length, usable=m.subjects.filter(s=>s.usable);
  m.rows=m.students.map(st=>{
    const g=(typeof normGender==='function'&&normGender(st.gender)==='girl')?'G':'B';
    const cells=m.subjects.map(s=>{
      if(!s.usable) return {state:'na'};
      const e=s.entries[st.id];
      if(!e) return {state:'noentry'};
      if(e.absent||e.grade==='AB') return {state:'ab',grade:'Ab'};
      if(e.exempted||e.grade==='EX') return {state:'ex',grade:'EX'};
      const marks=Number(e.marks)||0; return {state:'ok',marks,grade:gradeOf(marks,s.max),max:s.max};
    });
    const row={student:st,g,cells,complete:nSub>0&&cells.every(c=>['ok','ab','ex'].includes(c.state))};
    if(row.complete){
      const ok=cells.filter(c=>c.state==='ok');
      row.total=ok.reduce((a,c)=>a+c.marks,0); row.maxSum=ok.reduce((a,c)=>a+c.max,0);
      row.allAb=cells.every(c=>c.state==='ab');
      row.anyAb=cells.some(c=>c.state==='ab'); row.anyNC=ok.some(c=>c.grade==='NC');
      row.fail=!row.allAb&&(row.anyAb||row.anyNC);
      row.pct=row.maxSum?row.total/row.maxSum*100:0;
      row.grade=row.allAb?'Ab':row.fail?'NC':mvOverallGrade(row.pct);
      row.klass=row.allAb?'Ab':row.fail?'FAIL':consClassOf(row.pct);
    }
    return row;
  });
  // rank among those who passed (equal totals share a rank, the next rank is skipped)
  const passed=m.rows.filter(r=>r.complete&&!r.fail&&!r.allAb).sort((a,b)=>b.total-a.total);
  let last=null,rank=0; passed.forEach((r,i)=>{ if(last===null||r.total!==last){ rank=i+1; last=r.total; } r.rank=rank; });

  // ----- per subject
  m.subjects.forEach((s,si)=>{
    if(!s.usable){ s.stats=null; return; }
    const z=()=>({B:0,G:0});
    const gc={}; CONS_GRADES.forEach(g=>gc[g]=z());
    const cl={'Dist.':z(),'1st CLASS':z(),'2nd CLASS':z(),'3rd CLASS':z(),'FAIL':z(),'Ab':z()};
    const st={students:z(),appeared:z(),total:z(),passed:z()};
    m.rows.forEach(r=>{
      st.students[r.g]++;
      const c=r.cells[si];
      if(c.state==='ab'){ gc['Ab'][r.g]++; cl['Ab'][r.g]++; return; }
      if(c.state!=='ok') return;
      st.appeared[r.g]++; st.total[r.g]+=c.marks; gc[c.grade][r.g]++;
      const p=c.marks/s.max*100;
      if(c.grade==='NC') cl['FAIL'][r.g]++; else { st.passed[r.g]++; cl[consClassOf(p)][r.g]++; }
    });
    const T=(o)=>o.B+o.G;
    const appeared=T(st.appeared), total=T(st.total), passedN=T(st.passed);
    const abCount=CONS_AB.reduce((a,g)=>a+T(gc[g]),0);
    const q={ avgPct:appeared?total/(appeared*s.max)*100:0, resultPct:appeared?passedN/appeared*100:0, abCount, abPct:appeared?abCount/appeared*100:0 };
    q.w1=q.avgPct*0.4; q.w2=q.resultPct*0.4; q.w3=q.abPct*0.2; q.total=q.w1+q.w2+q.w3;
    s.stats={gc,cl,...st,appearedT:appeared,totalT:total,passedT:passedN,q,
      avg:{B:st.appeared.B?st.total.B/st.appeared.B:0,G:st.appeared.G?st.total.G/st.appeared.G:0,T:appeared?total/appeared:0},
      resPct:{B:st.appeared.B?st.passed.B/st.appeared.B*100:0,G:st.appeared.G?st.passed.G/st.appeared.G*100:0,T:q.resultPct}};
  });

  // ----- whole class (only students whose every subject is available)
  const done=m.rows.filter(r=>r.complete&&!r.allAb);
  const z=()=>({B:0,G:0});
  const gc={}; CONS_GRADES.forEach(g=>gc[g]=z());
  const cl={'Dist.':z(),'1st CLASS':z(),'2nd CLASS':z(),'3rd CLASS':z(),'FAIL':z(),'Ab':z()};
  const ap=z(), pa=z();
  m.rows.forEach(r=>{ if(!r.complete) return; if(r.allAb){ gc['Ab'][r.g]++; cl['Ab'][r.g]++; return; }
    ap[r.g]++; gc[r.grade][r.g]++; cl[r.klass][r.g]++; if(!r.fail) pa[r.g]++; });
  const T=(o)=>o.B+o.G;
  const totMarks=done.reduce((a,r)=>a+r.total,0), totMax=done.reduce((a,r)=>a+r.maxSum,0);
  const abCount=CONS_AB.reduce((a,g)=>a+T(gc[g]),0);
  const q={ passPct:T(ap)?T(pa)/T(ap)*100:0, avgPct:totMax?totMarks/totMax*100:0, abCount, abPct:T(ap)?abCount/T(ap)*100:0 };
  q.w1=q.passPct*0.4; q.w2=q.avgPct*0.4; q.w3=q.abPct*0.2; q.total=q.w1+q.w2+q.w3;
  m.overall={gc,cl,appeared:ap,passed:pa,appearedT:T(ap),passedT:T(pa),totMarks,totMax,q,
    incomplete:m.rows.filter(r=>!r.complete).length,
    resPct:{B:ap.B?pa.B/ap.B*100:0,G:ap.G?pa.G/ap.G*100:0,T:q.passPct}};
  m.complete=nSub>0&&usable.length===nSub&&m.overall.incomplete===0;
  return m;
}

/* build the model from the live database */
function consModel(cls,exam){
  const students=consStudentsOf(cls);
  const subjects=consSubjectList(cls,exam).map(name=>{
    const rec=consPickRecord(cls,exam,name);
    const lock=getGradeLock(cls,name,exam);
    const max=Number(rec&&rec.maxMarks)||Number(lock&&lock.maxMarks)||(rec?Number(cceDefaultGrades(exam).maxMarks)||null:null);
    let state='missing';
    if(rec){ state=rec.status==='Draft'?'draft':rec.status==='Returned'?'returned':rec.status==='Submitted'?'pending':rec.status==='Frozen'?'frozen':(rec.status==='Approved'||rec.status==='FDA Acknowledged')?'approved':'ok'; }
    const usable=!!rec&&CONS_OK.includes(rec.status)&&!!max;
    const entries={}; if(rec) (rec.entries||[]).forEach(e=>{ entries[e.studentId]=e; });
    const entered=rec?students.filter(s=>entries[s.id]).length:0;
    return {name,rec,max,state,usable,entries,entered,teacher:rec?rec.createdBy:'',teachers:rec?[rec.createdBy]:consTeachersFor(cls,name)};
  });
  return consCompute({cls,exam,year:(DB.marks.find(x=>x.className===cls&&x.examName===exam)||{}).academicYear||defaultAcademicYear(),students,subjects});
}

/* ------------------------------------------------------------------ report (screen + print) */
const CONS_CSS=`
.consrep{font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#1b2a3a;font-size:12px;}
.consrep h4{margin:14px 0 6px;color:#1f3a5f;font-size:13.5px;}
.consrep .ch{text-align:center;border:1.5px solid #1f3a5f;padding:6px;margin-top:16px;background:#ffeaa7;}
.consrep .ch .a{font-weight:700;font-size:12px;color:#b3261e;} .consrep .ch .b{font-weight:700;font-size:13px;} .consrep .ch .c{font-weight:700;font-size:12px;}
.consrep table{border-collapse:collapse;width:100%;margin-top:4px;}
.consrep th,.consrep td{border:1px solid #9fb0c4;padding:3px 5px;text-align:center;}
.consrep th{background:#dbe7f4;font-size:11px;} .consrep td.l{text-align:left;}
.consrep tr.tot td{background:#eef3f9;font-weight:700;}
.consrep .miss{background:#ffe3e0!important;color:#b3261e;} .consrep .na{background:#fff3cd;color:#8a6100;}
.consrep .fail{color:#b3261e;font-weight:700;} .consrep .g{font-weight:700;}
.consrep .warn{border:1.5px solid #e6b3ae;background:#fdeceb;color:#7a1f1a;padding:8px 10px;border-radius:6px;margin:8px 0;}
.consrep .pgbreak{page-break-before:always;} .consrep .land{page:cons-land;}
.consrep .two{display:flex;gap:12px;flex-wrap:wrap;} .consrep .two>div{flex:1;min-width:260px;}
.consrep .bar{display:flex;align-items:center;gap:6px;margin:3px 0;} .consrep .bar i{display:block;height:14px;background:#2f6fdc;border-radius:2px;} .consrep .bar span{font-size:11px;}
@page cons-land{size:A4 landscape;margin:8mm;}
`;
function consCell(c){ 
  if(c.state==='ok') return `<td>${c.marks}</td><td class="g ${c.grade==='NC'?'fail':''}">${c.grade}</td>`;
  if(c.state==='ab') return `<td class="fail">AB</td><td class="fail">Ab</td>`;
  if(c.state==='ex') return `<td>EX</td><td>EX</td>`;
  if(c.state==='noentry') return `<td class="na">—</td><td class="na">ಬಾಕಿ</td>`;
  return `<td class="miss">—</td><td class="miss">—</td>`;
}
function consHead(m,title){
  return `<div class="ch"><div class="a">MORARJI DESSAI RESIDENTIAL SCHOOL SHEDABARI HEBLE, BHATKAL TQ. UTTARA KANNADA DIST.</div>
  <div class="b">${esc(m.exam)} ${esc(m.year)} &nbsp;|&nbsp; CLASS: ${esc(m.cls)}</div><div class="c">${esc(title)}</div></div>`;
}
function consListHtml(m){
  const subs=m.subjects;
  const head=`<tr><th rowspan="2">S.No</th><th rowspan="2">Name of the student</th><th rowspan="2">B/G</th>
    ${subs.map(s=>`<th colspan="2" class="${s.usable?'':'miss'}">${esc(s.name)}<br>${s.max?'('+s.max+')':'(—)'}${s.usable?'':'<br>ಬಾಕಿ'}</th>`).join('')}
    <th rowspan="2">TOTAL<br>(${(m.rows.find(r=>r.complete)||{}).maxSum||'—'})</th><th rowspan="2">RESULT</th><th rowspan="2">%age</th><th rowspan="2">Grade</th><th rowspan="2">Class</th><th rowspan="2">Rank</th></tr>
    <tr>${subs.map(()=>`<th>Marks</th><th>Gr</th>`).join('')}</tr>`;
  const body=m.rows.map((r,i)=>{
    const tail=r.complete?`<td><b>${r.total}</b></td><td class="${r.fail?'fail':''}">${r.allAb?'ABSENT':r.fail?'FAIL':'PASS'}</td><td>${r.fail?'':consRound2(r.pct)}</td><td class="g ${r.fail?'fail':''}">${r.grade}</td><td class="${r.fail?'fail':''}">${r.klass}</td><td>${r.fail||r.allAb?'F':r.rank}</td>`
      :`<td class="na" colspan="6">ಅಪೂರ್ಣ — ಎಲ್ಲ ವಿಷಯಗಳ ಅಂಕ ಬಂದಿಲ್ಲ</td>`;
    const nm=esc(r.student.studentNameEn||r.student.studentName);
    return `<tr><td>${i+1}</td><td class="l">${nm}</td><td>${r.g}</td>${r.cells.map(consCell).join('')}${tail}</tr>`;
  }).join('');
  return `<div class="land">${consHead(m,'KSEAB CONSOLIDATED MARKS LIST')}<table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}
function consMatrixHtml(m){
  const subs=m.subjects.filter(s=>s.usable);
  const hdr=`<tr><th rowspan="2">GRADE</th>${subs.map(s=>`<th colspan="3">${esc(s.name)}</th>`).join('')}<th colspan="3">Total (class)</th></tr><tr>${subs.map(()=>'<th>B</th><th>G</th><th>T</th>').join('')}<th>B</th><th>G</th><th>T</th></tr>`;
  const line=(label,pick,ov)=>`<tr><td class="l"><b>${label}</b></td>${subs.map(s=>{ const o=pick(s.stats); return `<td>${o.B}</td><td>${o.G}</td><td><b>${o.B+o.G}</b></td>`; }).join('')}<td>${ov.B}</td><td>${ov.G}</td><td><b>${ov.B+ov.G}</b></td></tr>`;
  const g=CONS_GRADES.map(x=>line(x,st=>st.gc[x],m.overall.gc[x])).join('');
  const c=['Dist.','1st CLASS','2nd CLASS','3rd CLASS','FAIL','Ab'].map(x=>line(x,st=>st.cl[x],m.overall.cl[x])).join('');
  const extra=[['APPEARED STUDENTS',st=>st.appeared,m.overall.appeared],['PASSED STUDENTS',st=>st.passed,m.overall.passed]].map(([l,p,ov])=>line(l,p,ov)).join('');
  const res=`<tr class="tot"><td class="l">RESULT %</td>${subs.map(s=>`<td>${consRound2(s.stats.resPct.B)}</td><td>${consRound2(s.stats.resPct.G)}</td><td>${consRound2(s.stats.resPct.T)}</td>`).join('')}<td>${consRound2(m.overall.resPct.B)}</td><td>${consRound2(m.overall.resPct.G)}</td><td>${consRound2(m.overall.resPct.T)}</td></tr>`;
  return `<div class="pgbreak">${consHead(m,'RESULT ANALYSIS — GRADE-WISE & CLASS-WISE (ALL SUBJECTS)')}<table><thead>${hdr}</thead><tbody>${g}<tr><td colspan="${1+subs.length*3+3}" style="background:#f4f6f9"></td></tr>${c}${extra}${res}</tbody></table></div>`;
}
function consAggregateHtml(m){
  const subs=m.subjects.filter(s=>s.usable), o=m.overall, q=o.q;
  const t=`<table><thead><tr><th>SUBJECT</th>${subs.map(s=>`<th>${esc(s.name)}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    <tr><td class="l">Total marks</td>${subs.map(s=>`<td>${s.stats.appearedT*s.max}</td>`).join('')}<td>${o.totMax}</td></tr>
    <tr><td class="l">Obtained marks</td>${subs.map(s=>`<td>${s.stats.totalT}</td>`).join('')}<td>${o.totMarks}</td></tr>
    <tr><td class="l">Average (marks per student)</td>${subs.map(s=>`<td>${consRound2(s.stats.avg.T)}</td>`).join('')}<td>${consRound2(subs.reduce((a,s)=>a+s.stats.avg.T,0))}</td></tr>
    <tr class="tot"><td class="l">Aggregate %</td>${subs.map(s=>`<td>${consRound2(s.stats.q.avgPct)}</td>`).join('')}<td>${consRound2(q.avgPct)}</td></tr></tbody></table>`;
  const qual=`<table><thead><tr><th>S.No</th><th>Weightage</th><th>Appeared</th><th>Passed</th><th>%</th><th>Weightage (marks)</th></tr></thead><tbody>
    <tr><td>1</td><td class="l">Percentage of students passed (40%)</td><td>${o.appearedT}</td><td>${o.passedT}</td><td>${consRound2(q.passPct)}</td><td>${consRound2(q.w1)}</td></tr>
    <tr><td>2</td><td class="l">Aggregate of all subjects (40%)</td><td>${o.appearedT}</td><td></td><td>${consRound2(q.avgPct)}</td><td>${consRound2(q.w2)}</td></tr>
    <tr><td>3</td><td class="l">Students with grades A and B (20%)</td><td>${o.appearedT}</td><td>${q.abCount}</td><td>${consRound2(q.abPct)}</td><td>${consRound2(q.w3)}</td></tr>
    <tr class="tot"><td colspan="5" class="l">QUALITATIVE RESULT — TOTAL</td><td>${consRound2(q.total)}</td></tr></tbody></table>`;
  return `<div class="pgbreak">${consHead(m,'AGGREGATE OF SUBJECTS & QUALITATIVE RESULT')}${t}<h4>Qualitative result (class)</h4>${qual}</div>`;
}
function consPieSvg(items){
  const total=items.reduce((a,i)=>a+i.v,0); if(!total) return '<div class="warn">ಅಂಕಿ ಇಲ್ಲ</div>';
  const col=['#4f81bd','#c0504d','#9bbb59','#8064a2','#4bacc6','#f79646','#7f7f7f','#2c4d75'];
  let a0=-Math.PI/2, paths=''; const R=90,cx=100,cy=100;
  items.forEach((it,i)=>{ if(!it.v) return; const a1=a0+it.v/total*2*Math.PI; const large=a1-a0>Math.PI?1:0;
    if(it.v===total) paths+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${col[i%8]}"/>`;
    else paths+=`<path d="M${cx},${cy} L${cx+R*Math.cos(a0)},${cy+R*Math.sin(a0)} A${R},${R} 0 ${large} 1 ${cx+R*Math.cos(a1)},${cy+R*Math.sin(a1)} Z" fill="${col[i%8]}"/>`;
    a0=a1; });
  const legend=items.map((it,i)=>`<div><span style="display:inline-block;width:10px;height:10px;background:${col[i%8]};margin-right:5px;"></span>${esc(it.l)}: <b>${it.v}</b> (${Math.round(it.v/total*100)}%)</div>`).join('');
  return `<div style="display:flex;gap:14px;align-items:center;"><svg width="200" height="200" viewBox="0 0 200 200">${paths}</svg><div>${legend}</div></div>`;
}
function consBarsHtml(items,max){
  return items.map(it=>`<div class="bar"><span style="width:110px;display:inline-block;">${esc(it.l)}</span><i style="width:${Math.max(2,it.v/max*220)}px"></i><span>${consRound2(it.v)}</span></div>`).join('');
}
function consGraphHtml(m){
  const o=m.overall, subs=m.subjects.filter(s=>s.usable);
  const cls=['Dist.','1st CLASS','2nd CLASS','3rd CLASS','FAIL'].map(k=>({l:k,v:o.cl[k].B+o.cl[k].G}));
  const gr=['A+','A','B+','B','C+','C','NC'].map(k=>({l:k,v:o.gc[k].B+o.gc[k].G}));
  return `<div class="pgbreak">${consHead(m,'GRAPHICAL REPRESENTATION')}<div class="two"><div><h4>Class-wise</h4>${consPieSvg(cls)}</div><div><h4>Grade-wise</h4>${consPieSvg(gr)}</div></div>
    <h4>Aggregate of subjects (%)</h4>${consBarsHtml(subs.map(s=>({l:s.name,v:s.stats.q.avgPct})),100)}</div>`;
}
function consSubjectHtml(m,si){
  const s=m.subjects[si]; if(!s.usable) return '';
  const st=s.stats, T=(o)=>o.B+o.G;
  const list=m.rows.map((r,i)=>{ const c=r.cells[si]; let k='';
    if(c.state==='ok') k=c.grade==='NC'?'FAIL':consClassOf(c.marks/s.max*100);
    return `<tr><td>${i+1}</td><td class="l">${esc(r.student.studentNameEn||r.student.studentName)}</td><td>${r.g}</td><td>${c.state==='ok'?c.marks:c.state==='ab'?'AB':'—'}</td><td class="g ${c.grade==='NC'?'fail':''}">${c.grade||'—'}</td><td class="${k==='FAIL'?'fail':''}">${k}</td></tr>`; }).join('');
  const bands=KSEAB_BANDS.map(([g,pct],i)=>({g,label:i===0?'90% - 100%':(i===KSEAB_BANDS.length-1?'BELOW '+KSEAB_PASS_PCT+'%':pct+'% - '+(KSEAB_BANDS[i-1][1]-1)+'%')}));
  const dist=bands.map(b=>`<tr><td class="l">${b.label}</td><td class="g">${b.g}</td><td>${st.gc[b.g].B}</td><td>${st.gc[b.g].G}</td><td><b>${T(st.gc[b.g])}</b></td></tr>`).join('')+
    `<tr><td class="l">Absentees</td><td class="g">Ab</td><td>${st.gc['Ab'].B}</td><td>${st.gc['Ab'].G}</td><td><b>${T(st.gc['Ab'])}</b></td></tr>`;
  const sum=[['NUMBER OF STUDENTS APPEARED',st.appeared.B,st.appeared.G,st.appearedT],['TOTAL MARKS',st.total.B,st.total.G,st.totalT],['SUBJECT AVERAGE',consRound2(st.avg.B),consRound2(st.avg.G),consRound2(st.avg.T)],['PASSED',st.passed.B,st.passed.G,st.passedT],['RESULT IN PERCENTAGE',consRound2(st.resPct.B),consRound2(st.resPct.G),consRound2(st.resPct.T)]]
    .map(r=>`<tr class="tot"><td colspan="2" class="l">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const clr=['Dist.','1st CLASS','2nd CLASS','3rd CLASS','FAIL','Ab'].map(k=>`<tr><td class="l">${k}</td><td>${st.cl[k].B}</td><td>${st.cl[k].G}</td><td><b>${T(st.cl[k])}</b></td></tr>`).join('');
  const q=st.q;
  const qual=`<table><thead><tr><th>S.No</th><th>Weightage</th><th>Appeared</th><th>Passed</th><th>%</th><th>Weightage</th></tr></thead><tbody>
    <tr><td>1</td><td class="l">Percentage of subject (40%)</td><td>${st.appearedT}</td><td></td><td>${consRound2(q.avgPct)}</td><td>${consRound2(q.w1)}</td></tr>
    <tr><td>2</td><td class="l">Aggregate of subject — passed (40%)</td><td>${st.appearedT}</td><td>${st.passedT}</td><td>${consRound2(q.resultPct)}</td><td>${consRound2(q.w2)}</td></tr>
    <tr><td>3</td><td class="l">Students with grades A and B (20%)</td><td>${st.appearedT}</td><td>${q.abCount}</td><td>${consRound2(q.abPct)}</td><td>${consRound2(q.w3)}</td></tr>
    <tr class="tot"><td colspan="5" class="l">TOTAL (QUALITATIVE RESULT)</td><td>${consRound2(q.total)}</td></tr></tbody></table>`;
  return `<div class="pgbreak">${consHead(m,'KSEAB MARKS LIST — SUBJECT: '+s.name.toUpperCase()+' (Max '+s.max+')')}
    <table><thead><tr><th>S.No</th><th>Name of the student</th><th>B/G</th><th>Marks</th><th>Grade</th><th>Class</th></tr></thead><tbody>${list}</tbody></table></div>
    <div class="pgbreak">${consHead(m,'RESULT ANALYSIS — '+s.name.toUpperCase())}
    <div class="two"><div><table><thead><tr><th>MARKS DISTRIBUTION</th><th>GRADE</th><th>BOYS</th><th>GIRLS</th><th>TOTAL</th></tr></thead><tbody>${dist}${sum}</tbody></table></div>
    <div><table><thead><tr><th>CLASS</th><th>BOYS</th><th>GIRLS</th><th>TOTAL</th></tr></thead><tbody>${clr}</tbody></table><h4>Qualitative result</h4>${qual}</div></div></div>`;
}
function consBoardHtml(m,canAct){
  const rows=m.subjects.map(s=>{
    const kn=CONS_STATUS_KN[s.state==='ok'?'ok':s.state]||s.state;
    const col=s.state==='ok'||s.state==='approved'?'#1b7f3b':s.state==='frozen'?'#2457b5':s.state==='pending'?'#8a6100':'#b3261e';
    const who=(s.teachers&&s.teachers.length)?s.teachers.filter(Boolean).join(', '):'—';
    const acts=(canAct&&s.state==='pending'&&s.rec)?`<button class="btn btn-sm btn-green" onclick="consVerify('${s.rec.id}')">✓ Verify</button> <button class="btn btn-sm btn-gold" onclick="consReturn('${s.rec.id}')">↩ ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿಸಿ</button>`:'';
    return `<tr><td class="l"><b>${esc(s.name)}</b></td><td class="l">${esc(who)}</td><td style="color:${col};font-weight:700;">${kn}</td><td>${s.rec?`${s.entered}/${m.students.length}`:'—'}</td><td>${s.max||'—'}</td><td>${acts}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="consrep" style="width:100%"><thead><tr><th>ವಿಷಯ</th><th>ಶಿಕ್ಷಕರು</th><th>ಸ್ಥಿತಿ</th><th>ನಮೂದು</th><th>Max</th><th>ಕ್ರಿಯೆ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function consReportHtml(m){
  const pending=m.subjects.filter(s=>!s.usable);
  const noEntry=m.subjects.filter(s=>s.usable&&s.entered<m.students.length);
  let warn='';
  if(pending.length) warn+=`<div class="warn"><b>⚠ ಈ ವಿಷಯಗಳ ಅಂಕ ಇನ್ನೂ ಬಂದಿಲ್ಲ / ಪರಿಶೀಲನೆ ಆಗಿಲ್ಲ:</b> ${pending.map(s=>esc(s.name)+' ('+(CONS_STATUS_KN[s.state==='ok'?'ok':s.state]||s.state)+')').join(', ')}</div>`;
  if(noEntry.length) warn+=`<div class="warn"><b>⚠ ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕ ಇಲ್ಲ:</b> ${noEntry.map(s=>esc(s.name)+' ('+s.entered+'/'+m.students.length+')').join(', ')}</div>`;
  if(m.overall.incomplete) warn+=`<div class="warn">${m.overall.incomplete} ವಿದ್ಯಾರ್ಥಿಗಳ ಫಲಿತಾಂಶ ಅಪೂರ್ಣ (ಎಲ್ಲ ವಿಷಯಗಳ ಅಂಕ ಬಂದ ಮೇಲೆ ಲೆಕ್ಕ ಆಗುತ್ತದೆ).</div>`;
  const usable=m.subjects.filter(s=>s.usable);
  const parts=[warn,consListHtml(m)];
  if(usable.length&&m.overall.appearedT){ parts.push(consMatrixHtml(m),consAggregateHtml(m),consGraphHtml(m)); }
  m.subjects.forEach((s,i)=>parts.push(consSubjectHtml(m,i)));
  return `<div class="consrep" id="consReport">${parts.join('')}</div>`;
}

/* ------------------------------------------------------------------ screens */
function consPanelBody(){
  const role=CURRENT_USER.role;
  const isCT=role==='staff'&&isClassTeacherAny();
  if(!isCT&&role!=='principal'&&role!=='fda') return '';
  const classes=(role==='principal'||role==='fda')?CLASSES.filter(c=>DB.students.some(s=>String(s.className)===c)):myClassesAsTeacher();
  const pendingGroups=role==='principal'?Object.values(DB.marks.filter(m=>m.status==='Frozen').reduce((a,m)=>{ const k=consKey(m.className,m.examName); (a[k]=a[k]||{cls:m.className,exam:m.examName}); return a; },{})):[];
  const cur=CONS_CUR||(pendingGroups[0]?{cls:pendingGroups[0].cls,exam:pendingGroups[0].exam}:{cls:classes[0]});
  if(!cur.exam&&cur.cls) cur.exam=consDefaultExam(cur.cls);
  const exams=consExamOptions(cur.cls||classes[0]);
  // show the report straight away (the principal sees every format while approving; the class teacher sees what is pending)
  setTimeout(()=>{ try{ if(document.getElementById('cons_exam')&&cur.cls&&cur.exam) consOpen(cur.cls,cur.exam); }catch(e){} },0);
  let pend='';
  if(role==='principal'){
    const groups={}; DB.marks.filter(m=>m.status==='Frozen').forEach(m=>{ const k=consKey(m.className,m.examName); (groups[k]=groups[k]||{cls:m.className,exam:m.examName,recs:[]}).recs.push(m); });
    const list=Object.values(groups);
    pend=`<h4 style="margin:12px 0 6px;">⏳ ಅನುಮೋದನೆ ಬಾಕಿ ಇರುವ ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿಗಳು (ಕ್ಲಾಸ್ ಟೀಚರ್ ಕಳುಹಿಸಿದ್ದು)</h4>`+(list.length?`<div class="table-wrap"><table><thead><tr><th>ತರಗತಿ</th><th>ಪರೀಕ್ಷೆ</th><th>ಕ್ಲಾಸ್ ಟೀಚರ್</th><th>ವಿಷಯಗಳು</th><th>ಕ್ರಿಯೆ</th></tr></thead><tbody>${list.map(g=>`<tr><td>${esc(g.cls)}</td><td>${esc(g.exam)}</td><td>${esc(DB.classTeacherAllocation[g.cls]||'—')}</td><td>${g.recs.map(r=>esc(r.subject)).join(', ')}</td>
      <td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="consOpen('${esc(g.cls)}','${esc(g.exam)}')">👁 ನೋಡಿ</button> <button class="btn btn-sm btn-green" onclick="consApprove('${esc(g.cls)}','${esc(g.exam)}')">✅ Approve</button> <button class="btn btn-sm btn-gold" onclick="consPrincipalReturn('${esc(g.cls)}','${esc(g.exam)}')">↩ Return</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="small-muted">ಈಗ ಅನುಮೋದನೆ ಬಾಕಿ ಇಲ್ಲ.</div>`);
  }
  return `<div class="panel" id="consPanel"><h3>📊 ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ — Consolidate ${role==='principal'?'(ಪ್ರಾಂಶುಪಾಲರು)':role==='fda'?'(FDA — ನೋಡಲು / Print / Excel)':'(ಕ್ಲಾಸ್ ಟೀಚರ್)'}</h3>
    <div class="note">${role==='principal'?'ಕ್ಲಾಸ್ ಟೀಚರ್ ಒಟ್ಟುಗೂಡಿಸಿ ಕಳುಹಿಸಿದ ಪಟ್ಟಿಯನ್ನು ಇಡೀ ತರಗತಿಗೆ ಒಮ್ಮೆಲೇ Approve ಮಾಡಬಹುದು. ವಿಷಯವಾರು ಅನುಮೋದನೆ ಬೇಕಿಲ್ಲ.':'ವಿಷಯ ಶಿಕ್ಷಕರು ಕಳುಹಿಸಿದ ಅಂಕಗಳನ್ನು Verify ಮಾಡಿ, ನಂತರ Consolidate ಒತ್ತಿ. ಯಾವ ವಿಷಯದ ಅಂಕ ಬಾಕಿ ಇದೆ ಎಂದು ತೋರುತ್ತದೆ. ಎಲ್ಲವೂ ಪರಿಶೀಲನೆ ಆದ ಮೇಲೆ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ. ನಿಮ್ಮ ಸ್ವಂತ ವಿಷಯ ತಾನಾಗಿ ಪರಿಶೀಲನೆ ಆಗುತ್ತದೆ.'}</div>
    ${pend}
    <div class="form-grid" style="margin-top:10px;">
      <div class="field"><label>ಪರೀಕ್ಷೆ</label><select id="cons_exam">${exams.map(e=>`<option ${cur.exam===e?'selected':''}>${esc(e)}</option>`).join('')}</select></div>
      <div class="field"><label>ತರಗತಿ</label><select id="cons_cls" onchange="consFillExams()">${classes.map(c=>`<option ${cur.cls===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="consRun()">📊 Consolidate</button></div>
    <div id="consWrap"></div></div>`;
}
function consPanelHtml(){ return CURRENT_USER.role==='principal'?'':consPanelBody(); }          // class teacher: lower on the page
function consTopHtml(){                                                                          // principal: at the very top
  if(CURRENT_USER.role==='principal') return consPanelBody();
  if(CURRENT_USER.role==='staff'&&isClassTeacherAny()) return `<div class="note" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span>ವಿಷಯ ಶಿಕ್ಷಕರ ಅಂಕ ಪರಿಶೀಲನೆ ಮತ್ತು ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ ಕೆಳಗಿದೆ →</span><button class="btn btn-primary btn-sm" onclick="(document.getElementById('consPanel')||{scrollIntoView(){}}).scrollIntoView({behavior:'smooth'})">📊 Consolidate ಗೆ ಹೋಗಿ</button></div>`;
  return '';
}
function consOpen(cls,exam){
  CONS_CUR={cls,exam};
  const c=document.getElementById('cons_cls'), e=document.getElementById('cons_exam');
  if(c){ if(c.options&&![...c.options].some(o=>o.value===cls||o.text===cls)){ const o=document.createElement('option'); o.text=cls; c.add(o); } c.value=cls; }
  if(c&&e) consFillExams();
  if(e){ if(e.options&&![...e.options].some(o=>o.value===exam||o.text===exam)){ const o=document.createElement('option'); o.text=exam; e.add(o); } e.value=exam; }
  consRun();
}
function consRun(){
  const wrap=document.getElementById('consWrap');
  try{ consRunInner(); }
  catch(err){ console.error('consolidate error',err); if(wrap) wrap.innerHTML='<div style="border:1.5px solid #e6b3ae;background:#fdeceb;color:#7a1f1a;padding:10px;border-radius:6px;">⚠ ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ ತೋರಿಸುವಾಗ ತೊಂದರೆ ಆಗಿದೆ: <b>'+esc(String(err&&err.message||err))+'</b><br><span style="font-size:11px;">ಈ ಸಂದೇಶದ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಕಳುಹಿಸಿ.</span></div>'; }
}
function consRunInner(){
  const exam=document.getElementById('cons_exam').value, cls=document.getElementById('cons_cls').value;
  if(!cls||!exam){ showToast('⚠ ಪರೀಕ್ಷೆ ಮತ್ತು ತರಗತಿ ಆರಿಸಿ'); return; }
  CONS_CUR={cls,exam};
  const wrap=document.getElementById('consWrap'); if(!wrap) return;
  const m=consModel(cls,exam);
  const role=CURRENT_USER.role, isCT=role==='staff'&&isClassTeacherOf(cls);
  const sel=SUBJECTS.map(s=>{ const has=DB.marks.some(x=>x.className===cls&&x.examName===exam&&x.subject===s); const on=m.subjects.some(x=>x.name===s);
    return `<label style="margin-right:12px;white-space:nowrap;"><input type="checkbox" ${on?'checked':''} ${(has||!isCT)?'disabled':''} onchange="consToggleSubject('${esc(cls)}','${esc(exam)}','${esc(s)}',this.checked)"> ${esc(s)}</label>`; }).join('');
  const sent=m.subjects.length&&m.subjects.every(s=>['frozen','approved'].includes(s.state));
  const allVerified=m.subjects.length&&m.subjects.every(s=>s.usable);
  const filled=m.subjects.every(s=>!s.usable||s.entered>=m.students.length);
  const approvedAll=m.subjects.length&&m.subjects.every(s=>s.state==='approved');
  let sendBtn='';
  if(isCT){
    if(approvedAll) sendBtn=`<span class="badge badge-ok">✅ ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ್ದಾರೆ</span>`;
    else if(sent) sendBtn=`<span class="badge badge-progress">⏳ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಅನುಮೋದನೆ ಬಾಕಿ</span> <button class="btn btn-gold btn-sm" onclick="consRecall('${esc(cls)}','${esc(exam)}')">↩ Recall (ಹಿಂಪಡೆಯಿರಿ)</button>`;
    else if(allVerified&&filled) sendBtn=`<button class="btn btn-green btn-sm" onclick="consSend('${esc(cls)}','${esc(exam)}')">📤 ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button>`;
    else sendBtn=`<button class="btn btn-sm" disabled style="opacity:.55;cursor:not-allowed;">📤 ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button> <span class="small-muted">ಎಲ್ಲ ವಿಷಯಗಳ ಅಂಕ ಪರಿಶೀಲನೆ ಆದ ಮೇಲೆ ಮಾತ್ರ ಕಳುಹಿಸಬಹುದು.</span>`;
  }
  if(role==='principal'&&m.subjects.some(s=>s.state==='frozen')) sendBtn=`<button class="btn btn-green btn-sm" onclick="consApprove('${esc(cls)}','${esc(exam)}')">✅ Approve</button> <button class="btn btn-gold btn-sm" onclick="consPrincipalReturn('${esc(cls)}','${esc(exam)}')">↩ Return</button>`;
  wrap.innerHTML=`<div class="consrep"><h4>${esc(cls)}ನೇ ತರಗತಿ — ${esc(exam)}</h4>
    <div style="margin:6px 0;"><b>ವಿಷಯಗಳು:</b> ${sel}</div>${consBoardHtml(m,isCT)}</div>
    <div class="form-actions" style="margin:10px 0;">${sendBtn} <button class="btn btn-gold btn-sm" onclick="consPrint()">🖨 Print / PDF</button> <button class="btn btn-outline btn-sm" onclick="consExcel()">⬇ Excel</button></div>
    ${consReportHtml(m)}
    ${(role==='principal'&&m.subjects.some(x=>x.state==='frozen'))?`<div class="form-actions" style="margin:12px 0;"><button class="btn btn-green btn-sm" onclick="consApprove('${esc(cls)}','${esc(exam)}')">✅ Approve</button> <button class="btn btn-gold btn-sm" onclick="consPrincipalReturn('${esc(cls)}','${esc(exam)}')">↩ Return</button></div>`:''}`;
  if(!document.getElementById('consCss')){ const st=document.createElement('style'); st.id='consCss'; st.textContent=CONS_CSS; document.head.appendChild(st); }
}
function consToggleSubject(cls,exam,subject,on){
  if(!DB.consSubjects) DB.consSubjects={};
  const cur=new Set(consSubjectList(cls,exam)); if(on) cur.add(subject); else cur.delete(subject);
  DB.consSubjects[consKey(cls,exam)]=SUBJECTS.filter(s=>cur.has(s)); saveDB(); consRun();
}
function consRefresh(){ const cur=CONS_CUR; navigate(CURRENT_PAGE); if(cur) setTimeout(()=>{ CONS_CUR=cur; const e=document.getElementById('cons_exam'),c=document.getElementById('cons_cls'); if(e&&c){ e.value=cur.exam; c.value=cur.cls; consRun(); } },0); }

/* ------------------------------------------------------------------ actions */
function consAfterSubmit(rec){
  const ct=(DB.classTeacherAllocation||{})[rec.className];
  if(ct&&ct===CURRENT_USER.name){          // class teacher's own subject: no need to send to himself
    rec.status='Class Teacher Verified'; rec.autoVerified=true; rec.classTeacherName=ct;
    rec.classTeacherVerifiedDate=todayStr(); rec.classTeacherVerifiedAt=new Date().toLocaleTimeString('en-IN');
    return 'auto';
  }
  if(ct) pushNotification(ct,`ಅಂಕ ಪರಿಶೀಲನೆಗೆ ಬಂದಿದೆ: ${rec.subject} (${rec.className}ನೇ ತರಗತಿ, ${rec.examName}) — ${CURRENT_USER.name}`);
  return 'sent';
}
async function consVerify(id){
  const m=DB.marks.find(x=>x.id===id); if(!m||m.status!=='Submitted') return;
  if(!(CURRENT_USER.role==='staff'&&isClassTeacherOf(m.className))){ showToast('⚠ ಕ್ಲಾಸ್ ಟೀಚರ್ ಮಾತ್ರ Verify ಮಾಡಬಹುದು'); return; }
  const ts=await getServerTimeStamp();
  m.status='Class Teacher Verified'; m.classTeacherName=CURRENT_USER.name; m.classTeacherVerifiedDate=ts.date; m.classTeacherVerifiedAt=ts.time;
  logAudit('Class Teacher Verify','Marks',m.id,`${m.subject} ${m.className} ${m.examName}`);
  saveDB(); showToast('✅ '+m.subject+' ಪರಿಶೀಲಿಸಲಾಗಿದೆ'); consRefresh();
}
function consReturn(id){
  const m=DB.marks.find(x=>x.id===id); if(!m||m.status!=='Submitted') return;
  const reason=prompt('ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿಸಲು ಕಾರಣ (ಕಡ್ಡಾಯ):'); if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ಬೇಕು'); return; }
  m.status='Returned'; m.remarks=reason.trim();
  logAudit('Return for Correction','Marks',m.id,reason);
  pushNotification(m.createdBy,`ಅಂಕ ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿದೆ: ${m.subject} (${m.className}ನೇ ತರಗತಿ, ${m.examName}) — ${reason.trim()}`);
  saveDB(); showToast('↩ ಶಿಕ್ಷಕರಿಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ'); consRefresh();
}
async function consSend(cls,exam){
  if(!(CURRENT_USER.role==='staff'&&isClassTeacherOf(cls))){ showToast('⚠ ಕ್ಲಾಸ್ ಟೀಚರ್ ಮಾತ್ರ ಕಳುಹಿಸಬಹುದು'); return; }
  const m=consModel(cls,exam);
  const bad=m.subjects.filter(s=>!s.usable); if(bad.length){ showToast('⚠ ಬಾಕಿ: '+bad.map(s=>s.name).join(', ')); return; }
  const gaps=m.subjects.filter(s=>s.entered<m.students.length); if(gaps.length){ showToast('⚠ ಕೆಲವು ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕ ಇಲ್ಲ: '+gaps.map(s=>s.name).join(', ')); return; }
  const ts=await getServerTimeStamp(); let n=0;
  m.subjects.forEach(s=>{ const r=s.rec; if(r&&r.status==='Class Teacher Verified'){ r.status='Frozen'; r.classTeacherName=CURRENT_USER.name; r.classTeacherSignedDate=ts.date; r.classTeacherSignedAt=ts.time; r.sentToPrincipalDate=ts.date; n++; } });
  if(!n){ showToast('ℹ ಈಗಾಗಲೇ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  logAudit('Consolidated sent to Principal','Marks',consKey(cls,exam),`${n} subjects`);
  STAFF.filter(s=>s.role==='principal').forEach(p=>pushNotification(p.name,`ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ ಅನುಮೋದನೆಗೆ: ${cls}ನೇ ತರಗತಿ — ${exam} (ಕ್ಲಾಸ್ ಟೀಚರ್: ${CURRENT_USER.name})`));
  saveDB(); showToast('📤 ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); consRefresh();
}
async function consApprove(cls,exam){
  if(CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ'); return; }
  const recs=DB.marks.filter(m=>m.className===cls&&m.examName===exam&&m.status==='Frozen'); if(!recs.length) return;
  const ts=await getServerTimeStamp();
  recs.forEach(m=>{ m.status='Approved'; m.principalName=CURRENT_USER.name; m.principalSignedDate=ts.date; m.principalSignedAt=ts.time; m.principalServerTime=ts.server; });
  logAudit('Principal approved consolidated','Marks',consKey(cls,exam),`${recs.length} subjects`);
  const names=new Set(recs.map(r=>r.createdBy)); const ct=DB.classTeacherAllocation[cls]; if(ct) names.add(ct);
  names.forEach(n=>pushNotification(n,`ಅಂಕ ಅನುಮೋದಿಸಲಾಗಿದೆ: ${cls}ನೇ ತರಗತಿ — ${exam}`));
  saveDB(); showToast('✅ '+cls+'ನೇ ತರಗತಿ — '+exam+' ಅನುಮೋದಿಸಲಾಗಿದೆ'); consRefresh();
}
function consPrincipalReturn(cls,exam){
  if(CURRENT_USER.role!=='principal') return;
  const recs=DB.marks.filter(m=>m.className===cls&&m.examName===exam&&m.status==='Frozen'); if(!recs.length) return;
  const reason=prompt('ಕ್ಲಾಸ್ ಟೀಚರ್‌ಗೆ ಹಿಂತಿರುಗಿಸಲು ಕಾರಣ (ಕಡ್ಡಾಯ):'); if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ಬೇಕು'); return; }
  recs.forEach(m=>{ m.status='Class Teacher Verified'; m.remarks=reason.trim(); });
  logAudit('Principal returned consolidated','Marks',consKey(cls,exam),reason);
  const ct=DB.classTeacherAllocation[cls]; if(ct) pushNotification(ct,`ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ ಹಿಂತಿರುಗಿದೆ: ${cls}ನೇ ತರಗತಿ — ${exam} — ${reason.trim()}`);
  saveDB(); showToast('↩ ಕ್ಲಾಸ್ ಟೀಚರ್‌ಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ'); consRefresh();
}

/* ------------------------------------------------------------------ edit / recall / reopen
   Subject teacher : may Edit (and re-upload Excel) while the marks are with the class teacher
                     (Submitted / Class Teacher Verified) - they go back to Draft and must be submitted again.
   Class teacher   : may Recall a consolidated list that is waiting for the principal.
   Principal       : may Reopen approved marks (reason compulsory) - they go back to the subject teacher.      */
function consEditHint(rec){
  if(!rec) return '';
  const mine=rec.createdBy===CURRENT_USER.name;
  if(mine&&(rec.status==='Submitted'||rec.status==='Class Teacher Verified'))
    return `<br><button class="btn btn-sm btn-gold" style="margin-top:6px;" onclick="marksEdit('${rec.id}')">✏ Edit — ಅಂಕ ಬದಲಿಸಿ / Excel ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ</button>`;
  if(rec.status==='Frozen') return `<br><span class="small-muted">ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಬದಲಿಸಲು ಕ್ಲಾಸ್ ಟೀಚರ್ "Recall" ಮಾಡಬೇಕು.</span>`;
  if(rec.status==='Approved'||rec.status==='FDA Acknowledged') return `<br><span class="small-muted">ಅನುಮೋದಿತ — ಬದಲಿಸಲು ಪ್ರಾಂಶುಪಾಲರು "Reopen" ಮಾಡಬೇಕು.</span>${(rec.createdBy===CURRENT_USER.name||isClassTeacherOf(rec.className))?` <button class="btn btn-sm btn-gold" onclick="marksReopen('${rec.id}')">🔓 Reopen — ತಿದ್ದಿ ಮತ್ತೆ Upload</button>`:''}`;
  return '';
}
function marksEdit(id){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  if(m.createdBy!==CURRENT_USER.name){ showToast('⚠ ಈ ಅಂಕಗಳನ್ನು ಸಲ್ಲಿಸಿದ ಶಿಕ್ಷಕರು ಮಾತ್ರ ಬದಲಿಸಬಹುದು'); return; }
  if(['Draft','Returned','Rejected'].includes(m.status)){ loadMarksStudentsForRecord(id); return; }
  if(m.status==='Submitted'||m.status==='Class Teacher Verified'){
    if(!confirm('ಈ ಅಂಕಗಳನ್ನು ಹಿಂಪಡೆದು ಬದಲಿಸುವಿರಾ?\nಬದಲಿಸಿದ ನಂತರ ಮತ್ತೆ ಕ್ಲಾಸ್ ಟೀಚರ್‌ಗೆ ಸಲ್ಲಿಸಬೇಕು.')) return;
    const was=m.status; m.status='Draft';
    ['classTeacherVerifiedAt','classTeacherVerifiedDate','autoVerified','teacherSignedAt','teacherSignedDate','teacherServerTime'].forEach(k=>{ delete m[k]; });
    logAudit('Marks recalled for editing','Marks',m.id,`${m.subject} ${m.className} ${m.examName} (was ${was})`);
    const ct=(DB.classTeacherAllocation||{})[m.className];
    if(ct&&ct!==CURRENT_USER.name) pushNotification(ct,`ಅಂಕ ಬದಲಾವಣೆಗಾಗಿ ಹಿಂಪಡೆಯಲಾಗಿದೆ: ${m.subject} (${m.className}ನೇ ತರಗತಿ, ${m.examName}) — ${CURRENT_USER.name}`);
    saveDB();
    const page=CURRENT_PAGE; navigate(page); setTimeout(()=>loadMarksStudentsForRecord(id),0);
    showToast('✏ ಈಗ ಅಂಕ ಬದಲಿಸಬಹುದು ಅಥವಾ Excel ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು. ನಂತರ E-Sign & Submit ಮಾಡಿ.');
    return;
  }
  if(m.status==='Frozen') showToast('⚠ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಕ್ಲಾಸ್ ಟೀಚರ್ "Recall" ಮಾಡಿದ ನಂತರ ಬದಲಿಸಿ');
  else showToast('⚠ ಅನುಮೋದಿತ ಅಂಕ — ಬದಲಿಸಲು ಪ್ರಾಂಶುಪಾಲರು "Reopen" ಮಾಡಬೇಕು');
}
function consRecall(cls,exam){
  if(!(CURRENT_USER.role==='staff'&&isClassTeacherOf(cls))){ showToast('⚠ ಕ್ಲಾಸ್ ಟೀಚರ್ ಮಾತ್ರ'); return; }
  const recs=DB.marks.filter(m=>m.className===cls&&m.examName===exam&&m.status==='Frozen'); if(!recs.length){ showToast('ℹ ಹಿಂಪಡೆಯಲು ಏನೂ ಇಲ್ಲ'); return; }
  if(!confirm('ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿದ ಪಟ್ಟಿಯನ್ನು ಹಿಂಪಡೆಯುವಿರಾ?')) return;
  recs.forEach(m=>{ m.status='Class Teacher Verified'; delete m.sentToPrincipalDate; delete m.classTeacherSignedAt; delete m.classTeacherSignedDate; });
  logAudit('Consolidated recalled from Principal','Marks',consKey(cls,exam),`${recs.length} subjects`);
  STAFF.filter(s=>s.role==='principal').forEach(p=>pushNotification(p.name,`ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ ಹಿಂಪಡೆಯಲಾಗಿದೆ: ${cls}ನೇ ತರಗತಿ — ${exam} (${CURRENT_USER.name})`));
  saveDB(); showToast('↩ ಹಿಂಪಡೆಯಲಾಗಿದೆ — ಈಗ ಶಿಕ್ಷಕರು ಬದಲಿಸಬಹುದು (ಬೇಕಿದ್ದರೆ "ತಿದ್ದುಪಡಿಗೆ ಹಿಂತಿರುಗಿಸಿ")'); consRefresh();
}
async function marksClassApprove(id){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  if(!(CURRENT_USER.role==='staff'&&isClassTeacherOf(m.className))){ showToast('⚠ ಕ್ಲಾಸ್ ಟೀಚರ್ ಮಾತ್ರ'); return; }
  if(m.status!=='Class Teacher Verified'||!m.reopenedBy){ showToast('⚠ ಇದು ತಿದ್ದುಪಡಿ ಮಾಡಿದ (Reopen) ಅಂಕವಲ್ಲ'); return; }
  if(!confirm(m.subject+' ('+m.className+'ನೇ, '+m.examName+') — ತಿದ್ದಿದ ಅಂಕಗಳನ್ನು ನೀವೇ ಅನುಮೋದಿಸುವಿರಾ?')) return;
  const ts=await getServerTimeStamp();
  m.status='Approved'; m.approvedByClassTeacher=CURRENT_USER.name; m.classTeacherApprovedDate=ts.date; m.classTeacherApprovedAt=ts.time;
  m.remarks='ತಿದ್ದುಪಡಿ — ಕ್ಲಾಸ್ ಟೀಚರ್ ಅನುಮೋದಿಸಿದ್ದಾರೆ: '+CURRENT_USER.name; delete m.reopenReq;
  logAudit('Class Teacher approved corrected marks','Marks',m.id,`${m.subject} ${m.className} ${m.examName}`);
  const p=STAFF.find(x=>x.role==='principal'); if(p) pushNotification(p.name,`ℹ ${CURRENT_USER.name} ತಿದ್ದಿದ ಅಂಕ ಅನುಮೋದಿಸಿದರು: ${m.subject} (${m.className}ನೇ, ${m.examName})`);
  if(m.createdBy&&m.createdBy!==CURRENT_USER.name) pushNotification(m.createdBy,`ನಿಮ್ಮ ತಿದ್ದಿದ ಅಂಕ ಅನುಮೋದಿಸಲಾಗಿದೆ: ${m.subject} (${m.className}ನೇ, ${m.examName})`);
  saveDB(); showToast('✅ ಅನುಮೋದಿಸಲಾಗಿದೆ'); navigate(CURRENT_PAGE);
}
function marksReopenRequest(id){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  if(!['Approved','FDA Acknowledged'].includes(m.status)){ showToast('⚠ ಇದು ಅನುಮೋದಿತ ಸ್ಥಿತಿಯಲ್ಲಿಲ್ಲ'); return; }
  const reason=prompt('Reopen ಕೋರಿಕೆಗೆ ಕಾರಣ (ಉದಾ: ಯಾವ ವಿದ್ಯಾರ್ಥಿಯ ಅಂಕ ತಪ್ಪು) — ಕಡ್ಡಾಯ:'); if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ಬೇಕು'); return; }
  m.reopenReq={by:CURRENT_USER.name,reason:reason.trim(),date:todayStr()};
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,`🔓 ಅಂಕ Reopen ಕೋರಿಕೆ: ${m.subject} (${m.className}ನೇ, ${m.examName}) — ${CURRENT_USER.name}: ${reason.trim()} | "ಅಂಕ ನಮೂದು" ಪಟ್ಟಿಯಲ್ಲಿ 🔓 Reopen ಒತ್ತಿ`);
  logAudit('Reopen requested','Marks',m.id,`${m.subject} ${m.className} ${m.examName} — ${reason.trim()}`);
  saveDB(); showToast('✅ ಕೋರಿಕೆ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); navigate(CURRENT_PAGE);
}
function marksReopen(id){
  const m=DB.marks.find(x=>x.id===id); if(!m) return;
  const own=CURRENT_USER.role==='principal'||m.createdBy===CURRENT_USER.name||(DB.classTeacherAllocation||{})[m.className]===CURRENT_USER.name;
  if(!own){ showToast('⚠ ಈ ಅಂಕ ಸಲ್ಲಿಸಿದ ಶಿಕ್ಷಕರು / ಕ್ಲಾಸ್ ಟೀಚರ್ / ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ'); return; }
  if(!['Approved','FDA Acknowledged'].includes(m.status)) return;
  const reason=(m.reopenReq&&m.reopenReq.reason&&confirm('ಕೋರಿಕೆ: '+m.reopenReq.by+' — '+m.reopenReq.reason+'\n\nಇದೇ ಕಾರಣದಿಂದ ಮತ್ತೆ ತೆರೆಯುವುದೇ?'))?m.reopenReq.reason:prompt('ಅನುಮೋದಿತ ಅಂಕವನ್ನು ಬದಲಾವಣೆಗಾಗಿ ಮತ್ತೆ ತೆರೆಯಲು ಕಾರಣ (ಕಡ್ಡಾಯ):'); if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ಬೇಕು'); return; }
  const was=m.status; m.status='Returned'; m.remarks='Reopened by '+(CURRENT_USER.role==='principal'?'Principal':CURRENT_USER.name)+': '+reason.trim();
  m.reopenedBy=CURRENT_USER.name; m.reopenedDate=todayStr(); delete m.reopenReq;
  ['principalName','principalSignedAt','principalSignedDate','principalServerTime'].forEach(k=>{ delete m[k]; });
  logAudit('Approved marks reopened','Marks',m.id,`${m.subject} ${m.className} ${m.examName} (was ${was}) — ${reason.trim()}`);
  const names=new Set([m.createdBy,(DB.classTeacherAllocation||{})[m.className]].filter(Boolean));
  names.forEach(n=>pushNotification(n,`ಅನುಮೋದಿತ ಅಂಕ ಬದಲಾವಣೆಗಾಗಿ ತೆರೆಯಲಾಗಿದೆ: ${m.subject} (${m.className}ನೇ ತರಗತಿ, ${m.examName}) — ${reason.trim()}`));
  if(CURRENT_USER.role!=='principal'){ const p=STAFF.find(x=>x.role==='principal'); if(p) pushNotification(p.name,`ℹ ${CURRENT_USER.name} ಅನುಮೋದಿತ ಅಂಕ ತೆರೆದರು: ${m.subject} (${m.className}ನೇ, ${m.examName}) — ${reason.trim()}`); }
  saveDB(); showToast('🔓 ಮತ್ತೆ ತೆರೆಯಲಾಗಿದೆ — ಶಿಕ್ಷಕರು ತಿದ್ದಿ ಮತ್ತೆ ಸಲ್ಲಿಸಬೇಕು'); navigate(CURRENT_PAGE);
}

/* ------------------------------------------------------------------ print & Excel */
function printEl(el){
  // same-page print (no pop-up window): only `el` is visible while printing
  if(!el){ showToast('⚠ Print ಮಾಡಲು ಏನೂ ಇಲ್ಲ'); return; }
  const old=el.id; el.id='printArea'; document.body.classList.add('print-only-area');
  const done=()=>{ document.body.classList.remove('print-only-area'); if(old) el.id=old; else el.removeAttribute('id'); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done); setTimeout(()=>{ try{ window.print(); }catch(e){ done(); showToast('❌ Print ಆಗಲಿಲ್ಲ: '+e.message); } },100);
  setTimeout(()=>{ if(document.body.classList.contains('print-only-area')) done(); },60000);
}
function consPrint(){
  if(!CONS_CUR) return; const el=document.getElementById('consReport'); if(!el){ showToast('⚠ ಮೊದಲು "Consolidate" ಒತ್ತಿ'); return; }
  if(!document.getElementById('consCss')){ const st=document.createElement('style'); st.id='consCss'; st.textContent=CONS_CSS; document.head.appendChild(st); }
  printEl(el);
}
function consExcelBook(wb,m,suffix){
  const head=['S.No','Name','B/G',...m.subjects.flatMap(s=>[s.name+(s.max?' ('+s.max+')':''),s.name+' Grade']),'Total','Result','%','Grade','Class','Rank'];
  const rows=m.rows.map((r,i)=>[i+1,r.student.studentNameEn||r.student.studentName,r.g,...r.cells.flatMap(c=>c.state==='ok'?[c.marks,c.grade]:c.state==='ab'?['AB','Ab']:['','']),
    r.complete?r.total:'',r.complete?(r.fail?'FAIL':'PASS'):'INCOMPLETE',r.complete&&!r.fail?Number(consRound2(r.pct)):'',r.complete?r.grade:'',r.complete?r.klass:'',r.complete&&!r.fail?r.rank:'']);
  const nm=(suffix?suffix+' ':'');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([head,...rows]),(nm+'Marks').slice(0,31));
  const an=[['Subject','Max','Appeared','Passed','Result %','Average','Aggregate %','Qualitative total']];
  m.subjects.filter(s=>s.usable).forEach(s=>an.push([s.name,s.max,s.stats.appearedT,s.stats.passedT,Number(consRound2(s.stats.resPct.T)),Number(consRound2(s.stats.avg.T)),Number(consRound2(s.stats.q.avgPct)),Number(consRound2(s.stats.q.total))]));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(an),(nm+'Analysis').slice(0,31));
}
function consExcel(){
  if(!CONS_CUR) return; if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  try{
    const m=consModel(CONS_CUR.cls,CONS_CUR.exam);
    const wb=XLSX.utils.book_new();
    consExcelBook(wb,m,'');
    XLSX.writeFile(wb,`Consolidated_${m.cls}_${String(m.exam).replace(/[^A-Za-z0-9]+/g,'_')}.xlsx`);
    showToast('✅ Excel Download ಆಗಿದೆ');
  }catch(err){ console.error(err); showToast('❌ Excel ಆಗಲಿಲ್ಲ: '+(err&&err.message||err),8000); }
}

function renderConsolidatedPage(){
  const role=CURRENT_USER.role;
  const cce=(typeof CLASSES!=='undefined'?CLASSES.filter(c=>DB.students.some(s=>String(s.className)===c)):[]);
  const cceClasses=(role==='staff'&&!(role==='principal'||role==='fda'))?myClassesAsTeacher():cce;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📊 ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ (Consolidated) & CCE</h2>
    <div class="desc">ಕ್ಲಾಸ್ ಟೀಚರ್/ಶಿಕ್ಷಕರು ಅಂಕ ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ನಂತರ ತರಗತಿವಾರು KSEAB Consolidated ಮತ್ತು CCE Consolidated Sheet ಇಲ್ಲಿ ನೋಡಬಹುದು — Print / Excel Download ಸಹ ಇದೆ.</div></div>
    ${consPanelBody()}
    <div class="panel"><h3>📑 CCE Consolidated Sheet (FA1/FA2/SA1/FA3/FA4/SA2)</h3>
      <div class="note">Frozen / Approved / FDA Acknowledged ಅಂಕ ಮಾತ್ರ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ.</div>
      <div class="form-grid"><div class="field"><label>ತರಗತಿ</label><select id="cons_class">${cceClasses.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
      <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="generateConsolidated()">📊 CCE Consolidated Sheet Generate ಮಾಡಿ</button></div>
      <div id="consolidatedWrap"></div></div>`;
}

;(window.__LOADED=window.__LOADED||[]).push('consolidate');
