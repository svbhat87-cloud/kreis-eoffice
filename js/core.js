/* =====================================================================
   KREIS e-Office v35 — core.js
   ಮೂಲ ಕೋಡ್ / Core: settings, data, cloud sync, login, menu & navigation, dashboard frame, common helpers
   ===================================================================== */
const STORE_KEY='kreisErpDB_v1';

const CF_API='https://gentle-morning-40a3.svbhat87.workers.dev';

const SB_ID='mdrs_bc265';

const SESSION_TOK_KEY='kreisSessTok_v1';
let SESSION_TOKEN=null;
function loadSessionToken(){ try{ SESSION_TOKEN=sessionStorage.getItem(SESSION_TOK_KEY)||null; }catch(e){ SESSION_TOKEN=null; } }
function saveSessionToken(tok){ SESSION_TOKEN=tok||null; try{ if(tok) sessionStorage.setItem(SESSION_TOK_KEY,tok); else sessionStorage.removeItem(SESSION_TOK_KEY); }catch(e){} }

async function cfCall(method,path,params,body,ms){
  if(CF_API.indexOf('REPLACE')>=0) return {error:{message:'Worker URL is not set in index.html (CF_API)'}};
  const u=new URL(CF_API.replace(/\/+$/,'')+path);
  for(const k in (params||{})) u.searchParams.set(k,params[k]);
  u.searchParams.set('_',Date.now());                              // defeat any caching
  const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),ms||30000);
  try{
    const init={method,signal:ctl.signal};
    if(body!==undefined){ init.body=body; init.headers={'Content-Type':'text/plain;charset=UTF-8'}; }   // "simple" request: no CORS preflight
    if(SESSION_TOKEN){ init.headers=Object.assign({},init.headers,{'Authorization':'Bearer '+SESSION_TOKEN}); }
    return {res:await fetch(u.toString(),init)};
  }catch(e){
    return {error:{message:(e&&e.name==='AbortError')?'timeout':String((e&&e.message)||e)}};
  }finally{ clearTimeout(timer); }
}

// ಲಾಗಿನ್ ಪರಿಶೀಲನೆ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾವಣೆ ಈಗ ಸರ್ವರ್‌ನಲ್ಲೇ ಆಗುತ್ತದೆ (ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅಲ್ಲ) — ಇದು "simple request" ಆಗಿರುವಂತೆ
// text/plain ಕಳುಹಿಸುತ್ತೇವೆ, ಹಾಗಾಗಿ CORS ಪ್ರೀಫ್ಲೈಟ್ ಬೇಕಾಗುವುದಿಲ್ಲ (Worker ಅದನ್ನೇ JSON ಎಂದು parse ಮಾಡುತ್ತದೆ).
async function cfSessionCall(path,bodyObj,ms){
  const u=new URL(CF_API.replace(/\/+$/,'')+path); u.searchParams.set('_',Date.now());
  const init={method:'POST',body:JSON.stringify(bodyObj),headers:{'Content-Type':'text/plain;charset=UTF-8'}};
  if(SESSION_TOKEN) init.headers['Authorization']='Bearer '+SESSION_TOKEN;
  const ctl=new AbortController(); const timer=setTimeout(()=>ctl.abort(),ms||15000);
  init.signal=ctl.signal;
  try{
    const res=await fetch(u.toString(),init);
    let j={}; try{ j=await res.json(); }catch(e){}
    if(!res.ok) return {ok:false,error:j.error||('HTTP '+res.status),code:j.code,status:res.status};
    return j;
  }catch(e){
    return {ok:false,error:(e&&e.name==='AbortError')?'timeout':String((e&&e.message)||e)};
  }finally{ clearTimeout(timer); }
}

async function cfFail(res){
  let msg=''; try{ const j=await res.json(); msg=(j&&j.error)||''; }catch(e){}
  return {message:'HTTP '+res.status+(msg?': '+msg:'')};
}

class CFQuery{
  constructor(table){ this.table=table; this.op=null; this.cols=''; this.opts={}; this.f={}; this.row=null; }
  select(cols,opts){ if(this.op==='upsert') return this; this.op='select'; this.cols=cols||'*'; this.opts=opts||{}; return this; }
  upsert(row){ this.op='upsert'; this.row=row; return this; }
  delete(){ this.op='delete'; return this; }
  eq(col,val){ this.f.eq=[col,val]; return this; }
  like(col,pat){ this.f.like=[col,pat]; return this; }
  maybeSingle(){ return this._run(); }
  then(ok,bad){ return this._run().then(ok,bad); }
  async _run(){
    const id=this.f.eq?this.f.eq[1]:(this.row&&this.row.id);
    if(this.op==='select'){
      if(this.opts.head&&this.opts.count){                          // count rows whose id starts with a prefix
        const prefix=String(this.f.like?this.f.like[1]:'').replace(/%$/,'');
        const c=await cfCall('GET','/api/count',{prefix},undefined,15000);
        if(c.error) return {data:null,count:null,error:c.error};
        if(!c.res.ok) return {data:null,count:null,error:await cfFail(c.res)};
        const j=await c.res.json(); return {data:null,count:j.count,error:null};
      }
      const onlyStamp=(String(this.cols).replace(/\s/g,'')==='updated_at');   // tiny "did anything change?" check
      const c=await cfCall('GET',onlyStamp?'/api/meta':'/api/data',{id},undefined,onlyStamp?10000:30000);
      if(c.error) return {data:null,error:c.error};
      if(c.res.status===404) return {data:null,error:null};
      if(!c.res.ok) return {data:null,error:await cfFail(c.res)};
      if(onlyStamp){ const j=await c.res.json(); return {data:{updated_at:j.updated_at},error:null}; }
      const stamp=c.res.headers.get('X-Updated-At');
      const text=await c.res.text();
      let parsed; try{ parsed=JSON.parse(text); }catch(e){ return {data:null,error:{message:'bad data from server'}}; }
      return {data:{data:parsed,updated_at:stamp},error:null};
    }
    if(this.op==='upsert'){
      const c=await cfCall('POST','/api/put',{id},JSON.stringify(this.row.data),60000);
      if(c.error) return {data:null,error:c.error};
      if(!c.res.ok) return {data:null,error:await cfFail(c.res)};
      const j=await c.res.json(); return {data:[{updated_at:j.updated_at}],error:null};
    }
    if(this.op==='delete'){
      const c=await cfCall('POST','/api/delete',{id},'{}',15000);
      if(c.error) return {data:null,error:c.error};
      if(!c.res.ok) return {data:null,error:await cfFail(c.res)};
      return {data:null,error:null};
    }
    return {data:null,error:{message:'unsupported call'}};
  }
}

let _sb=null;

function getSB(){
  if(!_sb) _sb={
    from(table){ return new CFQuery(table); },
    async rpc(name){
      if(name!=='get_server_time') return {data:null,error:{message:'unknown rpc '+name}};
      const c=await cfCall('GET','/api/time',{},undefined,8000);
      if(c.error) return {data:null,error:c.error};
      if(!c.res.ok) return {data:null,error:await cfFail(c.res)};
      const j=await c.res.json(); return {data:j.now,error:null};
    },
    channel(){ const ch={on(){return ch;},subscribe(){return ch;},unsubscribe(){}}; return ch; }   // no live push; the 20-second check does the job
  };
  return _sb;
}

const SESSION_KEY='kreisErpSession_v1';

const STAFF = [
 {hrmsId:'0100143557', name:'Nagaraj Heddarimane', role:'principal', desig:'Principal / ಪ್ರಾಂಶುಪಾಲರು', mobile:'—'},
 {hrmsId:'0100141352', name:'Subrahmanya', role:'fda', desig:'First Division Assistant Cum Computer Operator', mobile:'9449380252'},
 {hrmsId:'0123456789', name:'Nagendra Nagesh Naik', role:'warden', desig:'Warden / ವಾರ್ಡನ್', mobile:'—'},
 {hrmsId:'0100139281', name:'Pallavi D M', role:'staff', desig:'Assistant Teacher Hindi', mobile:'—'},
 {hrmsId:'0100139283', name:'Praveen Naik', role:'staff', desig:'Assistant Teacher English', mobile:'—'},
 {hrmsId:'0100140325', name:'Gururaj Irappa Naik', role:'staff', desig:'Assistant Teacher Maths', mobile:'—'},
 {hrmsId:'0100140811', name:'Santoshakumar', role:'staff', desig:'Assistant Teacher Social Science', mobile:'—'},
 {hrmsId:'0100141218', name:'Gajanan Naik', role:'staff', desig:'Assistant Teacher Science', mobile:'—'},
 {hrmsId:'9916009143', name:'Aruj Naik', role:'staff', desig:'PE Teacher', mobile:'—'},
 {hrmsId:'9164738352', name:'Madevi Naik', role:'staff', desig:'Computer Science', mobile:'—'},
 {hrmsId:'6360851945', name:'Laxmi Sukru Harikantra', role:'staff', desig:'Staff Nurse', mobile:'—'},
 {hrmsId:'8431612371', name:'Revati Moger', role:'staff', desig:'Kannada Teacher', mobile:'—'},
 {hrmsId:'0100145950', name:'Nagendra Nagesh Naik', role:'staff', desig:'Assistant Teacher Art & Craft / Drawing', mobile:'—'},
];

function staffByHrms(id){ return STAFF.find(s=>s.hrmsId.toLowerCase()===String(id||'').trim().toLowerCase()); }

const ROLE_LABEL={fda:'FDA',principal:'Principal / ಪ್ರಾಂಶುಪಾಲರು',warden:'Warden / ವಾರ್ಡನ್',staff:'Staff / ಸಿಬ್ಬಂದಿ'};

const BUDGET_HEADS=['ಆಹಾರ ವೆಚ್ಚ','ವಿದ್ಯುತ್ ಶುಲ್ಕ','ಕಚೇರಿ ವೆಚ್ಚ','ವೈದ್ಯಕೀಯ ವೆಚ್ಚ','ಗ್ರಂಥಾಲಯ','ಪ್ರಯೋಗಾಲಯ','ಪರೀಕ್ಷಾ ವೆಚ್ಚ','ಕ್ರೀಡೆ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳು','ರಾಷ್ಟ್ರೀಯ ಹಬ್ಬಗಳು','ದೂರವಾಣಿ ಮತ್ತು ಇಂಟರ್ನೆಟ್','ಕ್ಷೌರ ವೆಚ್ಚ','ನ್ಯಾಪ್ಕಿನ್ ವೆಚ್ಚ','ಚಿತ್ರಕಲೆ ಸಾಮಗ್ರಿ','SSLC ಸಾರಿಗೆ ವೆಚ್ಚ','ಇತರೆ ವೆಚ್ಚಗಳು'];

const QUARTERS=[{k:'Q1',label:'Q1 (ಏಪ್ರಿಲ್–ಜೂನ್)'},{k:'Q2',label:'Q2 (ಜುಲೈ–ಸೆಪ್ಟೆಂಬರ್)'},{k:'Q3',label:'Q3 (ಅಕ್ಟೋಬರ್–ಡಿಸೆಂಬರ್)'},{k:'Q4',label:'Q4 (ಜನವರಿ–ಮಾರ್ಚ್)'}];

const MONTHS=['ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್','ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್'];

const ACCOUNTS={
  main:{id:'6407670183', name:'ಮುಖ್ಯ ಶಾಲಾ ಖಾತೆ', heads:['ವಿದ್ಯುತ್ ಶುಲ್ಕ (Electricity)','ಆಹಾರ ವೆಚ್ಚ (Food)','ಕಚೇರಿ ವೆಚ್ಚ (Office Expenditure)','ರಾಷ್ಟ್ರೀಯ ಹಬ್ಬಗಳು (National Festival)','ಚಿತ್ರಕಲೆ (Drawing)','ಕ್ಷೌರ (Hair Cutting)','ನ್ಯಾಪ್ಕಿನ್ (Napkins)','ಕ್ರೀಡೆ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳು (Sports & Culture)','ವೈದ್ಯಕೀಯ (Medical)','ಗ್ರಂಥಾಲಯ (Library)','ದೂರವಾಣಿ (Telephone)','ಪರೀಕ್ಷೆ (Exam)','SSLC ಸಾರಿಗೆ (SSLC Transportation)','ಪ್ರಯೋಗಾಲಯ (Laboratory)','ಇತರೆ (Others)']},
  joint:{id:'64108678116', name:'ವೇತನ / ಸಿಬ್ಬಂದಿ ಖಾತೆ (ವಾರ್ಡನ್-ಪ್ರಾಂಶುಪಾಲರ ಜಂಟಿ ಖಾತೆ)', heads:['ವಿದ್ಯುತ್ ಶುಲ್ಕ (Electricity)','ಹೊರಗುತ್ತಿಗೆ ಸಿಬ್ಬಂದಿ ವೇತನ (Outsource Salary)','DA ಬಾಕಿ (DA Arrears)','EL ನಗದೀಕರಣ (EL)','ವೈದ್ಯಕೀಯ ಮರುಪಾವತಿ (Medical Reimbursement)','ಇತರೆ ಬಾಕಿಗಳು (Other Arrears)','ಇತರೆ (Others)']}
};

const STATIONERY_ITEMS=['SL Long Note Book','UR Long Note Book','Normal Size Note Book','2L Small Note Book','3L Small Note Book','4L Small Note Book','Graph Book','Answer Papers (Ruled)','Answer Papers (Unruled)','Cursive Writing Book','Geometry Box','Blue Pen','Red Pen','Pencil','Practical Record','Refill Blue','A4 Sheets','Sketch Pen Box','Normal File with Clip','Eraser','Sharpener','Plastic Scale','Book Wrappers','Book Labels','Colour Pencil Box'];

const STOCK_CATS=[
  {key:'stationery', label:'ಲೇಖನ ಸಾಮಗ್ರಿ', ic:'✏️', items:STATIONERY_ITEMS, recipientLabel:'ವಿದ್ಯಾರ್ಥಿ / ಸಿಬ್ಬಂದಿ ಹೆಸರು'},
  {key:'notebook', label:'ನೋಟ್ ಬುಕ್', ic:'📒', items:null, recipientLabel:'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು'},
  {key:'textbook', label:'ಪಠ್ಯಪುಸ್ತಕ', ic:'📚', items:null, recipientLabel:'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು'},
  {key:'uniform', label:'ಸಮವಸ್ತ್ರ', ic:'👕', items:null, recipientLabel:'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು'},
  {key:'shoe', label:'ಶೂ', ic:'👞', items:['Shoe'], recipientLabel:'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು'},
  {key:'socks', label:'ಸಾಕ್ಸ್', ic:'🧦', items:['Socks'], recipientLabel:'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು'},
  {key:'general', label:'ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು', ic:'🗂️', items:null, hidden:true, recipientLabel:'ಹೆಸರು'},
];

const LETTER_TYPES=['ಕೋರಿಕೆ ಪತ್ರ','ಉಲ್ಲೇಖ ಪತ್ರ','ಮಾಹಿತಿ ಪತ್ರ','ವರದಿ ಪತ್ರ','ಅನುಮತಿ ಪತ್ರ','ರಜೆ ಪತ್ರ','ನೆನಪು ಪತ್ರ','ಕಚೇರಿ ಆದೇಶ','ಸೂಚನೆ','ಸಭೆ ನಡಾವಳಿ','ಪ್ರಮಾಣ ಪತ್ರ','ಇತರೆ'];

const OFFICES=['ಕಾರ್ಯನಿರ್ವಾಹಕ ನಿರ್ದೇಶಕರು, KREIS','ಉಪ ನಿರ್ದೇಶಕರು, KREIS','AEE, KREIS','ಕ್ಷೇತ್ರ ಶಿಕ್ಷಣಾಧಿಕಾರಿಗಳು','DDPI','BEO','ತಹಶೀಲ್ದಾರ್','ಪಂಚಾಯತ್','ಪೊಲೀಸ್ ಇಲಾಖೆ','ಆರೋಗ್ಯ ಇಲಾಖೆ','ತೋಟಗಾರಿಕೆ ಇಲಾಖೆ','ಇತರೆ'];

const CLASSES=['1','2','3','4','5','6','7','8','9','10','11','12'];

const ENTITLEMENT_CLASSES=['6','7','8','9','10','11','12'];

const SUBJECTS=['Kannada','English','Hindi','Mathematics','Science','Social Science','Computer','Physical Education','Drawing'];

const STANDARD_EXAMS=['FA-1','FA-2','SA-1','FA-3','FA-4','SA-2'];

const SSLC_EXAMS=['Midterm','Preparatory Exam','KSEAB Preparatory','KREIS Practice Test','Model Exam','Unit Test'];

const EXAM_HEAD_HRMS='0100139283';

const QP_CLASSES=['6','7','8','9','10'];

const QP_EXAMS_LIST=['FA-1','FA-2','SA-1','FA-3','FA-4','SA-2','ಮಧ್ಯಮಾಸಿಕ (Midterm)','ವಾರ್ಷಿಕ (Annual)','ಅಭ್ಯಾಸ (Practice Test)','Unit Test'];

let QP_UPLOAD_TAB='type', QP_FILE_DATA=null;

function isExamHead(){ return CURRENT_USER && CURRENT_USER.hrmsId===EXAM_HEAD_HRMS; }

const CLASS_ENTITLEMENT={
 'SL Long Note Book':{6:8,7:8,8:8,9:8,10:9,11:0,12:0},
 'UR Long Note Book':{6:0,7:0,8:1,9:1,10:1,11:16,12:18},
 'Normal Size Note Book':{6:12,7:12,8:14,9:14,10:14,11:0,12:0},
 '2L Small Note Book':{6:2,7:2,8:2,9:0,10:0,11:0,12:0},
 '3L Small Note Book':{6:2,7:2,8:2,9:0,10:0,11:0,12:0},
 '4L Small Note Book':{6:2,7:2,8:0,9:0,10:0,11:0,12:0},
 'Graph Book':{6:0,7:0,8:1,9:1,10:1,11:2,12:2},
 'Answer Papers (Ruled)':{6:150,7:150,8:150,9:150,10:150,11:0,12:0},
 'Answer Papers (Unruled)':{6:0,7:0,8:0,9:50,10:50,11:200,12:200},
 'Cursive Writing Book':{6:1,7:1,8:0,9:0,10:0,11:0,12:0},
 'Geometry Box':{6:1,7:1,8:1,9:1,10:1,11:1,12:1},
 'Blue Pen':{6:10,7:10,8:10,9:10,10:10,11:10,12:10},
 'Red Pen':{6:5,7:5,8:5,9:5,10:5,11:5,12:5},
 'Pencil':{6:5,7:5,8:5,9:5,10:5,11:5,12:5},
 'Practical Record':{6:0,7:0,8:0,9:0,10:1,11:4,12:4},
 'Refill Blue':{6:10,7:10,8:10,9:10,10:10,11:10,12:10},
 'A4 Sheets':{6:50,7:50,8:50,9:50,10:50,11:50,12:50},
 'Sketch Pen Box':{6:1,7:1,8:1,9:1,10:1,11:1,12:1},
 'Normal File with Clip':{6:10,7:10,8:10,9:10,10:10,11:10,12:10},
 'Eraser':{6:2,7:2,8:2,9:2,10:2,11:2,12:2},
 'Sharpener':{6:2,7:2,8:2,9:2,10:2,11:2,12:2},
 'Plastic Scale':{6:1,7:0,8:0,9:1,10:0,11:1,12:0},
 'Book Wrappers':{6:4,7:4,8:4,9:4,10:4,11:4,12:4},
 'Book Labels':{6:1,7:1,8:1,9:1,10:1,11:1,12:1},
 'Colour Pencil Box':{6:1,7:1,8:1,9:1,10:1,11:0,12:0},
};

function defaultDB(){
  const users={};
  STAFF.forEach(s=>{ users[s.name]={password:'1234'}; });
  const budget={};
  BUDGET_HEADS.forEach((h,i)=>{ budget[i]={}; QUARTERS.forEach(q=>{ budget[i][q.k]={ob:0,credit:0,expense:0,locked:false}; }); });
  return {
    users, seq:{}, students:[], staffMovement:[],
    inward:[], outward:[], assets:[], messages:[],
    stock:{ stationery:{receive:[],issue:[]}, notebook:{receive:[],issue:[]}, textbook:{receive:[],issue:[]}, uniform:{receive:[],issue:[]}, shoe:{receive:[],issue:[]}, socks:{receive:[],issue:[]} },
    bills:[], receipts:{main:[],joint:[]}, cashNoTxn:[], cashbookSigns:[], cashbookRangeSigns:[], expenseEntries:[], cashOpening:{main:0,joint:0}, bankBalances:[],
    budget, letterheads:[], studyCertificates:[], tcDocuments:[], stDocuments:[], attTrainings:[], attCerts:[], attRegs:[], attRegLists:[], attMats:[], foodItems:[], foodStock:[], foodIssue:[], foodMonthly:[], hostelItems:[], hostelStock:[], hostelIssue:[],
    profiles:{}, teacherMsgs:[], lessonPlans:[], yearPlans:[], attendance:[], marks:[],
    customExams:[], classTeacherAllocation:{}, notifications:[], questionPapers:[], gradeLocks:{},
    progressCards:[], docIssueRegister:[]
  };
}

let DB;

function mergeDBInPlace(incoming,keepLocalKeys){
  if(!incoming || typeof incoming!=='object') return;
  // Deletion tombstones ("key:id" -> timestamp) so deleted items never come back
  if(!DB.deletedIds || typeof DB.deletedIds!=='object') DB.deletedIds={};
  if(incoming.deletedIds && typeof incoming.deletedIds==='object') Object.assign(DB.deletedIds, incoming.deletedIds);
  const dead=DB.deletedIds;
  // NOTE: local keys missing on the server are kept (they may be new records not pushed yet, e.g. attendance)
  Object.keys(incoming).forEach(k=>{
    if(k==='deletedIds') return;
    const inVal=incoming[k];
    if(Array.isArray(inVal)){
      if(!Array.isArray(DB[k])) DB[k]=[];
      for(let i=DB[k].length-1;i>=0;i--){ const x=DB[k][i]; if(x&&x.id!=null&&dead[k+':'+x.id]) DB[k].splice(i,1); }
      const existingById=new Map(DB[k].filter(x=>x&&x.id!=null).map(x=>[x.id,x]));
      if(!ITEM_SNAP) ITEM_SNAP={};
      const sm=ITEM_SNAP[k]||(ITEM_SNAP[k]=new Map());
      inVal.forEach(item=>{
        if(item && item.id!=null && dead[k+':'+item.id]) return;
        if(item && item.id!=null && existingById.has(item.id)){
          const ex=existingById.get(item.id);
          if(k==='questionPapers'){
            // Workflow only moves forward: Submitted -> Print Requested -> FDA Printed.
            // A stale copy on another phone must never push it backwards (also immune to phone clock differences).
            const RK={'Draft':0,'Submitted':1,'Print Requested':2,'FDA Printed':3};
            const lr=(RK[ex.status]===undefined?-1:RK[ex.status]), ir=(RK[item.status]===undefined?-1:RK[item.status]);
            if(lr>ir) return;
            if(ir>lr){ Object.assign(ex,item); sm.set(item.id,itemStr(ex)); return; }
          }
          if((ex._mt||0)>(item._mt||0)) return; // local copy is newer — keep it
          Object.assign(ex, item);
          sm.set(item.id,itemStr(ex));
        } else if(item && item.id!=null){
          DB[k].push(item);
          sm.set(item.id,itemStr(item));
        }
      });
      // Note: items present locally but absent from `incoming` are kept as-is
      // (could be not-yet-synced local work) — never silently dropped here.
    } else if(inVal && typeof inVal==='object'){
      if(!DB[k] || typeof DB[k]!=='object' || Array.isArray(DB[k])) DB[k]={};
      if(MAP_EXCLUDE.has(k)){ Object.assign(DB[k], inVal); }
      else {
        if(!ITEM_SNAP) ITEM_SNAP={};
        const mk='map:'+k; const sm2=ITEM_SNAP[mk]||(ITEM_SNAP[mk]=new Map());
        Object.keys(inVal).forEach(ck=>{
          const iv=inVal[ck], lv=DB[k][ck];
          if(isPlainObj(iv) && isPlainObj(lv)){
            if((lv._mt||0)>(iv._mt||0)) return;   // local entry is newer (e.g. just-changed password)
            DB[k][ck]=iv; sm2.set(ck,itemStr(iv));
          } else {
            DB[k][ck]=iv; if(isPlainObj(iv)) sm2.set(ck,itemStr(iv));
          }
        });
      }
    } else {
      DB[k]=inVal;
    }
  });
  try{ migrateDB(); }catch(e){}
  LAST_IDS=snapIds();
}

async function loadFromSupabase(){
  const sb=getSB(); if(!sb) return false;
  try{
    const {data,error}=await sb.from('school_data').select('data,updated_at').eq('id',SB_ID).maybeSingle();
    if(error){ console.warn('Supabase load error:',error.message); setSyncBadge(false,'load: '+error.message); return false; }
    // Only overwrite if data has actual content (not empty {})
    if(data&&data.data&&Object.keys(data.data).length>5){
      const raw=JSON.stringify(data.data);
      if(DB && raw===LAST_SERVER_STR) return false; // nothing new on server
      const full=await resolveBlobs(sb,data.data);
      if(!DB){ DB=full; snapItems(); } else mergeDBInPlace(full);
      LAST_SERVER_STR=raw;
      LAST_UPDATED_AT=data.updated_at;
      window.LAST_SRV_LEN=raw.length;
      try{ localStorage.setItem('kreis_synced_once','1'); }catch(e){}
      setSyncBadge(true,'synced');
      try{ localStorage.setItem(STORE_KEY,JSON.stringify(DB)); }catch(qe){ console.warn('local cache full (quota) — server copy is safe'); }
      return true;
    }
    // If Supabase is empty, push local data to Supabase
    if(data&&(!data.data||Object.keys(data.data).length<=5)){
      console.log('Supabase empty — pushing local data...');
      pushToServer();
    }
  }catch(e){ console.warn('Cloud load exception:',e); setSyncBadge(false,String((e&&e.message)||e)); }
  return false;
}

function migrateDB(){
  if(!DB||!DB.users) DB=defaultDB();
  if(!DB.nurseLoginV1){ DB.nurseLoginV1=true; if(!DB.users) DB.users={}; DB.users['Laxmi Sukru Harikantra']={password:'1234'}; }
  if(!DB.stockMonthly) DB.stockMonthly=[];
  if(!DB.bankBalances) DB.bankBalances=[];
  if(!DB.importedCerts) DB.importedCerts=[];
  if(!DB.tcIssuedStudents) DB.tcIssuedStudents=[];
  if(DB.stock) Object.keys(DB.stock).forEach(k=>{ const c=DB.stock[k]; if(c&&c.issue) c.issue.forEach(i=>{ if(i.status==='Sent to Principal') i.status='Closed'; }); });
  if(!DB.studyCertificates) DB.studyCertificates=[];
  if(!DB.tcDocuments) DB.tcDocuments=[];
  if(!DB.stDocuments) DB.stDocuments=[];
  if(!DB.attTrainings) DB.attTrainings=[];
  if(!DB.attCerts) DB.attCerts=[];
  if(!DB.attRegs) DB.attRegs=[];
  if(!DB.attMats) DB.attMats=[];
  if(!DB.attRegLists) DB.attRegLists=[];
  if(!DB.foodItems) DB.foodItems=[];
  if(!DB.foodStock) DB.foodStock=[];
  if(!DB.foodIssue) DB.foodIssue=[];
  if(!DB.foodMonthly) DB.foodMonthly=[];
  if(!DB.hostelItems) DB.hostelItems=[];
  if(!DB.hostelStock) DB.hostelStock=[];
  if(!DB.hostelIssue) DB.hostelIssue=[];
  if(!DB.meetings) DB.meetings=[];
  if(!DB.beedigaPatti) DB.beedigaPatti=[];
  if(!DB.wardenCharge) DB.wardenCharge=[];
  if(!DB.foodIndents) DB.foodIndents=[];
  if(!DB.downloads) DB.downloads=[];
  if(!DB.studentDocs) DB.studentDocs=[];
  if(!DB.dutyAllotments) DB.dutyAllotments=[];
  if(!DB.noticeBoard) DB.noticeBoard=[];
  if(!DB.modEntries) DB.modEntries=[];
  if(!DB.stiEntries) DB.stiEntries=[];
  if(!DB.sslcAdoptions) DB.sslcAdoptions=[];
  if(!DB.staffFiles) DB.staffFiles=[];
  if(!DB.elBalances) DB.elBalances={};
  if(!DB.staffMsgAttachments) DB.staffMsgAttachments=[];
  if(!DB.leaveApplications) DB.leaveApplications=[];
  if(!DB.adminCharges) DB.adminCharges=[];
  if(!DB.leaveLettersFile) DB.leaveLettersFile=[];
  if(!DB.govtOrdersFile) DB.govtOrdersFile=[];
  if(!DB.kreisLettersFile) DB.kreisLettersFile=[];
  if(!DB.eduDeptFile) DB.eduDeptFile=[];
  if(!DB.otherDeptFile) DB.otherDeptFile=[];
  if(!DB.profiles) DB.profiles={};
  if(!DB.teacherMsgs) DB.teacherMsgs=[];
  if(!DB.lessonPlans) DB.lessonPlans=[];
  if(!DB.yearPlans) DB.yearPlans=[];
  if(!DB.mentorOrders) DB.mentorOrders=[];
  if(!DB.leaveRegOpen) DB.leaveRegOpen=[];
  if(!DB.dscFiles) DB.dscFiles=[];
  if(!DB.leaveRegEntries) DB.leaveRegEntries=[];
  if(!DB.mentorAllocations) DB.mentorAllocations=[];
  if(!DB.mentorProfiles) DB.mentorProfiles=[];
  if(!DB.taBills) DB.taBills=[];
  if(!DB.elApps) DB.elApps=[];
  if(!DB.sitePageBlocks) DB.sitePageBlocks=[];
  if(!DB.pwRequests) DB.pwRequests=[];
  if(!DB.taSettings) DB.taSettings={};
  if(!DB.parentInteractions) DB.parentInteractions=[];
  if(!DB.followUps) DB.followUps=[];
  if(!DB.examActivation) DB.examActivation={};
  if(!DB.consSubjects) DB.consSubjects={};
  if(!DB.examRemarks) DB.examRemarks=[];
  if(!DB.attendance) DB.attendance=[];
  if(!DB.marks) DB.marks=[];
  if(!DB.customExams) DB.customExams=[];
  if(!DB.classTeacherAllocation) DB.classTeacherAllocation={};
  if(!DB.notifications) DB.notifications=[];
  if(!DB.questionPapers) DB.questionPapers=[];
  if(!DB.gradeLocks) DB.gradeLocks={};
  if(!DB.progressCards) DB.progressCards=[];
  if(!DB.docIssueRegister) DB.docIssueRegister=[];
  if(!DB.seq) DB.seq={};
  if(!DB.inward) DB.inward=[];
  if(!DB.outward) DB.outward=[];
  if(!DB.ack) DB.ack=[];
  if(!DB.bills) DB.bills=[];
  if(!DB.receipts) DB.receipts=[];
  if(!Array.isArray(DB.cashNoTxn)) DB.cashNoTxn=[];
  if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[];
  if(!Array.isArray(DB.cashbookSigns)) DB.cashbookSigns=[];
  if(!Array.isArray(DB.cashbookRangeSigns)) DB.cashbookRangeSigns=[];
  if(!DB.budget) DB.budget=[];
  if(!DB.students) DB.students=[];
  if(!DB.assets) DB.assets=[];
  if(!DB.messages) DB.messages=[];
  if(!DB.staffSignatures) DB.staffSignatures={}; if(!DB.staffPhotos) DB.staffPhotos={};
  if(!DB.admissionApplications) DB.admissionApplications=[];
  if(!DB.tcRequestLetters) DB.tcRequestLetters=[];
  if(!DB.teacherAssignments) DB.teacherAssignments={};
  if(!DB.auditLogs) DB.auditLogs=[];
  if(!DB.lessonPlans) DB.lessonPlans=[];
  if(!DB.yearPlans) DB.yearPlans=[];
  if(!DB.salarySlips) DB.salarySlips=[];
  if(!DB.dailyAttendance) DB.dailyAttendance=[];
  if(!DB.attendanceReports) DB.attendanceReports=[];
  if(!DB.fdaMessages) DB.fdaMessages=[];
  if(!DB.staffInward) DB.staffInward=[];
  STAFF.forEach(s=>{ if(!DB.users[s.name]) DB.users[s.name]={password:'1234'}; });
}

function loadDB(){
  try{ const raw=localStorage.getItem(STORE_KEY); DB = raw? JSON.parse(raw): defaultDB(); }
  catch(e){ DB=defaultDB(); }
  migrateDB();
  LAST_IDS=snapIds();
  snapItems();
}

var LAST_IDS=null;

function snapIds(){
  const o={};
  Object.keys(DB||{}).forEach(k=>{ if(Array.isArray(DB[k])) o[k]=new Set(DB[k].filter(x=>x&&x.id!=null).map(x=>x.id)); });
  return o;
}

function trackDeletions(){
  if(!DB.deletedIds || typeof DB.deletedIds!=='object') DB.deletedIds={};
  const now=Date.now();
  if(LAST_IDS){
    Object.keys(LAST_IDS).forEach(k=>{
      if(!Array.isArray(DB[k])) return;
      const cur=new Set(DB[k].filter(x=>x&&x.id!=null).map(x=>x.id));
      LAST_IDS[k].forEach(id=>{ if(!cur.has(id)) DB.deletedIds[k+':'+id]=now; });
      cur.forEach(id=>{ if(DB.deletedIds[k+':'+id]) delete DB.deletedIds[k+':'+id]; });
    });
  }
  const cutoff=now-90*24*3600*1000;
  Object.keys(DB.deletedIds).forEach(t=>{ if(DB.deletedIds[t]<cutoff) delete DB.deletedIds[t]; });
  // v47: ವಿದ್ಯಾರ್ಥಿ Recycle Bin — ಅಳಿದ/ಕಾಣೆಯಾದ ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ವಿವರ ಉಳಿಸಿ ಮರಳಿ ತರಲು
  try{
    const curS=new Map((DB.students||[]).filter(s=>s&&s.id!=null).map(s=>[s.id,s]));
    if(LAST_STU){
      if(!Array.isArray(DB.studentBin)) DB.studentBin=[];
      LAST_STU.forEach((s,id)=>{ if(!curS.has(id) && !(DB.tcIssuedStudents||[]).some(t=>t._origId===id) && !DB.studentBin.some(b=>b._origId===id)) DB.studentBin.push(Object.assign({},s,{id:'bin_'+id,_origId:id,_deletedAt:now})); });
      const c180=now-180*24*3600*1000;
      DB.studentBin=DB.studentBin.filter(b=>(b._deletedAt||0)>c180).slice(-300);
    }
    LAST_STU=new Map(Array.from(curS.entries()).map(([id,s])=>[id,Object.assign({},s)]));
    const d=new Date().toISOString().slice(0,10);
    if(!DB.studentCountLog||typeof DB.studentCountLog!=='object') DB.studentCountLog={};
    if(curS.size) DB.studentCountLog[d]=curS.size;
    Object.keys(DB.studentCountLog).sort().slice(0,-40).forEach(k=>delete DB.studentCountLog[k]);
  }catch(e){ console.warn('studentBin',e); }
  LAST_IDS=snapIds();
}
var LAST_STU=null;

var ITEM_SNAP=null;

function itemStr(it){ const r=Object.assign({},it); delete r._mt; return JSON.stringify(r); }

const MAP_EXCLUDE=new Set(['seq','cashOpening','deletedIds']);

function isPlainObj(v){ return v!==null && typeof v==='object' && !Array.isArray(v); }

function isDefaultUser(k,v){ return k==='users' && itemStr(v)==='{"password":"1234"}'; }

function snapItems(){
  ITEM_SNAP={};
  Object.keys(DB||{}).forEach(k=>{
    if(Array.isArray(DB[k])){
      const m=new Map();
      DB[k].forEach(x=>{ if(x&&typeof x==='object'&&x.id!=null) m.set(x.id,itemStr(x)); });
      ITEM_SNAP[k]=m;
    } else if(isPlainObj(DB[k]) && !MAP_EXCLUDE.has(k)){
      const m=new Map();
      Object.keys(DB[k]).forEach(ck=>{ if(isPlainObj(DB[k][ck])) m.set(ck,itemStr(DB[k][ck])); });
      ITEM_SNAP['map:'+k]=m;
    }
  });
}

function stampChanges(){
  if(!ITEM_SNAP){ snapItems(); return; }
  const now=Date.now();
  Object.keys(DB).forEach(k=>{
    if(Array.isArray(DB[k])){
      let m=ITEM_SNAP[k]; if(!m){ m=new Map(); ITEM_SNAP[k]=m; }
      DB[k].forEach(x=>{
        if(!x||typeof x!=='object'||x.id==null) return;
        const str=itemStr(x);
        if(m.get(x.id)!==str){ x._mt=now; m.set(x.id,str); }
      });
    } else if(isPlainObj(DB[k]) && !MAP_EXCLUDE.has(k)){
      const mk='map:'+k;
      let m=ITEM_SNAP[mk]; if(!m){ m=new Map(); ITEM_SNAP[mk]=m; }
      Object.keys(DB[k]).forEach(ck=>{
        const v=DB[k][ck]; if(!isPlainObj(v)) return;
        const str=itemStr(v);
        if(m.get(ck)!==str){
          if(!isDefaultUser(k,v)) v._mt=now; // untouched default '1234' entries never override a real password
          m.set(ck,str);
        }
      });
    }
  });
}

const BLOB_MIN=30000, BLOB_PREFIX='@@blob:';

var BLOB_CACHE=new Map(), BLOB_KEY_OF=new Map(), BLOB_UPLOADED=new Set();

try{ JSON.parse(localStorage.getItem('kreis_blob_up_cf')||'[]').forEach(k=>BLOB_UPLOADED.add(k)); }catch(e){}

function saveBlobUploaded(){ try{ localStorage.setItem('kreis_blob_up_cf',JSON.stringify([...BLOB_UPLOADED])); }catch(e){} }

function blobKeyFor(str){
  let k=BLOB_KEY_OF.get(str);
  if(k) return k;
  let h1=0x811c9dc5, h2=5381;
  for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); h1^=c; h1=Math.imul(h1,16777619); h2=(Math.imul(h2,33)^c)|0; }
  k='b'+(h1>>>0).toString(36)+(h2>>>0).toString(36)+str.length.toString(36);
  BLOB_KEY_OF.set(str,k); BLOB_CACHE.set(k,str);
  return k;
}

function externalize(v,blobs){
  if(typeof v==='string'){
    if(v.length>=BLOB_MIN && v.startsWith('data:')){ const k=blobKeyFor(v); blobs.add(k); return BLOB_PREFIX+k; }
    return v;
  }
  if(Array.isArray(v)) return v.map(x=>externalize(x,blobs));
  if(v && typeof v==='object'){ const o={}; for(const k in v) o[k]=externalize(v[k],blobs); return o; }
  return v;
}

function collectBlobKeys(v,set){
  if(typeof v==='string'){ if(v.startsWith(BLOB_PREFIX)) set.add(v.slice(BLOB_PREFIX.length)); }
  else if(Array.isArray(v)) v.forEach(x=>collectBlobKeys(x,set));
  else if(v && typeof v==='object') for(const k in v) collectBlobKeys(v[k],set);
}

function inflateBlobs(v){
  if(typeof v==='string'){
    if(v.startsWith(BLOB_PREFIX)){ const d=BLOB_CACHE.get(v.slice(BLOB_PREFIX.length)); return d===undefined?null:d; }
    return v;
  }
  if(Array.isArray(v)) return v.map(inflateBlobs);
  if(v && typeof v==='object'){ const o={}; for(const k in v) o[k]=inflateBlobs(v[k]); return o; }
  return v;
}

var IDB_P=null;

function idb(){
  if(!IDB_P) IDB_P=new Promise((res)=>{
    try{
      const r=indexedDB.open('kreis_blobs_cf',1);
      r.onupgradeneeded=()=>{ r.result.createObjectStore('b'); };
      r.onsuccess=()=>res(r.result);
      r.onerror=()=>res(null);
    }catch(e){ res(null); }
  });
  return IDB_P;
}

async function idbGet(k){
  try{
    const db=await idb(); if(!db) return undefined;
    return await new Promise(res=>{ const q=db.transaction('b','readonly').objectStore('b').get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>res(undefined); });
  }catch(e){ return undefined; }
}

async function idbSet(k,v){
  try{
    const db=await idb(); if(!db) return;
    await new Promise(res=>{ const t=db.transaction('b','readwrite'); t.objectStore('b').put(v,k); t.oncomplete=()=>res(); t.onerror=()=>res(); t.onabort=()=>res(); });
  }catch(e){}
}

async function resolveBlobs(sb,data){
  const keys=new Set(); collectBlobKeys(data,keys);
  let missing=[...keys].filter(k=>!BLOB_CACHE.has(k));
  for(const k of missing){
    const c=await idbGet(k);
    if(typeof c==='string'){ BLOB_CACHE.set(k,c); BLOB_KEY_OF.set(c,k); BLOB_UPLOADED.add(k); }
  }
  missing=missing.filter(k=>!BLOB_CACHE.has(k));
  for(let i=0;i<missing.length;i+=3){
    await Promise.all(missing.slice(i,i+3).map(async k=>{
      const {data:row,error}=await sb.from('school_data').select('data').eq('id',SB_ID+'_'+k).maybeSingle();
      if(error) throw error;
      if(row&&row.data&&typeof row.data.d==='string'){ BLOB_CACHE.set(k,row.data.d); BLOB_KEY_OF.set(row.data.d,k); BLOB_UPLOADED.add(k); idbSet(k,row.data.d); }
      else BLOB_CACHE.set(k,null); // file row genuinely missing - don't retry forever
    }));
  }
  if(missing.length) saveBlobUploaded();
  return inflateBlobs(data);
}

var LAST_SERVER_STR=null, LAST_SYNC_ERR_TOAST=0, PUSH_RETRY=null;

var LAST_UPDATED_AT=null;

async function serverChanged(){
  const sb=getSB(); if(!sb) return {changed:false,error:'Supabase not loaded'};
  try{
    const {data,error}=await sb.from('school_data').select('updated_at').eq('id',SB_ID).maybeSingle();
    if(error) return {changed:false,error:error.message||String(error)};
    if(!data) return {changed:false,error:null};
    return {changed:data.updated_at!==LAST_UPDATED_AT,error:null};
  }catch(e){ return {changed:false,error:String((e&&e.message)||e)}; }
}

async function fetchServerData(sb){
  const {data,error}=await sb.from('school_data').select('data,updated_at').eq('id',SB_ID).maybeSingle();
  if(error) throw error;
  if(!(data&&data.data&&Object.keys(data.data).length>5)) return null;
  LAST_UPDATED_AT=data.updated_at;
  return await resolveBlobs(sb,data.data);
}

function reportSyncError(e){
  const msg=(e&&e.message)?e.message:String(e);
  console.warn('Supabase sync error:',msg);
  if(Date.now()-LAST_SYNC_ERR_TOAST>30000){
    LAST_SYNC_ERR_TOAST=Date.now();
    try{ showToast('⚠ Cloud sync failed: '+msg+' — saved on this device only, will retry',7000); }catch(x){}
  }
}

var SYNC_VER='v95';

var CLOUD_LAST_OK=null, CLOUD_STATE='loading', CLOUD_MSG='', SYNC_DIRTY=false;

function paintCloudChip(){
  const el=document.getElementById('cloudChip'); if(!el) return;
  const txt={ok:'✓ ಸಿಂಕ್ ಆಗಿದೆ',busy:'⟳ ಉಳಿಸಲಾಗುತ್ತಿದೆ…',loading:'⟳ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',offline:'⚠ ಸಂಪರ್ಕ ಇಲ್ಲ — ತಾನಾಗಿ ಮರುಪ್ರಯತ್ನಿಸುತ್ತದೆ'}[CLOUD_STATE]||'';
  el.className='cloud-chip '+CLOUD_STATE;
  const t=el.querySelector('.cc-txt'); if(t) t.textContent=txt;
  el.title=(CLOUD_LAST_OK?('ಕೊನೆಯ ಸಿಂಕ್: '+CLOUD_LAST_OK.toLocaleTimeString('en-IN')):'ಇನ್ನೂ ಸಿಂಕ್ ಆಗಿಲ್ಲ')+' · '+SYNC_VER+(CLOUD_STATE==='offline'&&CLOUD_MSG?(' · '+CLOUD_MSG):'');
}

function setSyncBadge(ok,msg){
  try{
    const m=String(msg||'');
    if(!ok) CLOUD_STATE='offline';
    else if(/^saving/i.test(m)) CLOUD_STATE='busy';
    else if(/^loading/i.test(m)) CLOUD_STATE='loading';
    else { CLOUD_STATE='ok'; CLOUD_LAST_OK=new Date(); }
    CLOUD_MSG=ok?'':m;
    paintCloudChip();
    // tiny, discreet version tag (the error text appears here only when something is wrong)
    let el=document.getElementById('syncBadge');
    if(!el){ el=document.createElement('div'); el.id='syncBadge';
      el.style.cssText='position:fixed;bottom:2px;left:6px;z-index:99999;font-size:10px;padding:0 5px;border-radius:6px;background:rgba(255,255,255,.7);pointer-events:none;';
      document.body.appendChild(el); }
    el.style.color=ok?'#9aa5b1':'#b3261e';
    el.textContent=SYNC_VER+(ok?'':' · '+m)+(window.SYNC_STAT?' · '+window.SYNC_STAT:'');
  }catch(e){}
}

var PUSHING=false, PUSH_AGAIN=false;

async function pushToServer(){
  const sb=getSB(); if(!sb) return {error:{message:'Supabase not loaded'}};
  if(PUSHING){ PUSH_AGAIN=true; return {error:null,queued:true}; }
  PUSHING=true; setSyncBadge(true,'saving'); const _t0=Date.now();
  let result={error:null};
  try{
    do{
      PUSH_AGAIN=false;
      // 1) get latest server copy and merge (newest record wins)
      let srv=null;
      const chk=await serverChanged();
      if(chk.error) throw new Error(chk.error);
      if(chk.changed || LAST_UPDATED_AT===null) srv=await fetchServerData(sb);
      // SAFETY: a device that has never loaded the server copy must never overwrite it with its own (empty/default) data
      let _once=false; try{ _once=!!localStorage.getItem('kreis_synced_once'); }catch(e){}
      if(!srv && !_once && !(LAST_UPDATED_AT)) throw new Error('ಸರ್ವರ್ ಡೇಟಾ ಇನ್ನೂ ಲೋಡ್ ಆಗಿಲ್ಲ — ಅಳಿಸದೆ ಕಾಯುತ್ತಿದೆ');
      if(srv){ try{ localStorage.setItem('kreis_synced_once','1'); }catch(e){}
        // rolling server-side backup of the pre-merge server copy (every 6 h, 8 slots; never a much smaller copy)
        try{
          const nowT=Date.now(), lastT=+(localStorage.getItem('kreis_bak_t')||0), lastL=+(localStorage.getItem('kreis_bak_len')||0);
          const lt=externalize(JSON.parse(JSON.stringify(srv)),new Set()), len=JSON.stringify(lt).length;
          if(nowT-lastT>6*3600*1000 && len>=lastL*0.6){
            const slot=Math.floor(nowT/(6*3600*1000))%8;
            const {error:be}=await sb.from('school_data').upsert({id:SB_ID+'_bak'+slot, data:lt, updated_at:new Date().toISOString()});
            if(!be){ localStorage.setItem('kreis_bak_t',String(nowT)); localStorage.setItem('kreis_bak_len',String(len)); }
          }
        }catch(e){ console.warn('backup failed',e); }
      }
      if(srv) mergeDBInPlace(srv,true);
      try{ localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }catch(e){}
      // 2) upload any new large files as their own rows
      const blobs=new Set(); const light=externalize(DB,blobs);
      let up=false;
      for(const k of blobs){
        if(BLOB_UPLOADED.has(k)) continue;
        const {error}=await sb.from('school_data').upsert({id:SB_ID+'_'+k, data:{d:BLOB_CACHE.get(k)}, updated_at:new Date().toISOString()});
        if(error) throw error;
        BLOB_UPLOADED.add(k); up=true; idbSet(k,BLOB_CACHE.get(k));
      }
      if(up) saveBlobUploaded();
      // SAFETY: refuse a write that would shrink the server copy drastically (e.g. a device with empty/default data)
      try{ const _len=JSON.stringify(light).length; if(!window.ALLOW_SHRINK && (window.LAST_SRV_LEN||0)>30000 && _len<(window.LAST_SRV_LEN||0)*0.4){ throw new Error('ಸುರಕ್ಷತೆ: ಸರ್ವರ್ ಡೇಟಾ ಹೆಚ್ಚು ಕುಗ್ಗುತ್ತಿದೆ — ಉಳಿಸುವುದನ್ನು ತಡೆಯಲಾಗಿದೆ'); } window._pendLen=_len; }catch(se){ if(String(se.message).indexOf('ಸುರಕ್ಷತೆ')===0) throw se; }
      // 3) push the small main row
      const {data:upd,error}=await sb.from('school_data').upsert({id:SB_ID, data:light, updated_at:new Date().toISOString()}).select('updated_at');
      if(error) throw error;
      if(upd&&upd[0]) LAST_UPDATED_AT=upd[0].updated_at;
      LAST_SERVER_STR=null; if(window._pendLen) window.LAST_SRV_LEN=window._pendLen; window.ALLOW_SHRINK=false;
      try{ window.SYNC_STAT=Math.round(JSON.stringify(light).length/1024)+'KB · '+((Date.now()-_t0)/1000).toFixed(1)+'s'; }catch(e){}
      setSyncBadge(true,'saved');
    }while(PUSH_AGAIN);
    SYNC_DIRTY=false;
  }catch(e){
    result={error:e}; reportSyncError(e); setSyncBadge(false,(e&&e.message)||'error');
    if(!PUSH_RETRY){ PUSH_RETRY=setTimeout(()=>{ PUSH_RETRY=null; pushToServer(); },10000); }
  }finally{ PUSHING=false; }
  return result;
}

function saveDB(){
  SYNC_DIRTY=true;
  try{ trackDeletions(); }catch(e){ console.warn('trackDeletions failed',e); }
  try{ stampChanges(); }catch(e){ console.warn('stampChanges failed',e); }
  // Save locally first (instant)
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch(e){}
  // Merge latest server copy + push to Supabase in background (non-blocking)
  pushToServer();
}

function nextSeq(key){ DB.seq[key]=(DB.seq[key]||0)+1; saveDB(); return DB.seq[key]; }

const AUTO_SYNC_SAFE_PAGES=['dashboard','qpfda','qpdashboard','inward','outward','ack',
  'fdaexamregister','noticeboard','fdamentorregister','results','auditlog','fdauploads',
  'salaryupload','salaryregister','mysalary','stockaccept'];

function refreshVisibleUI(){
  if(CURRENT_USER) renderNotifBadge(); // always recompute the badge directly from DB.notifications — never gate this on a staff lookup
  if(CURRENT_USER && staffByName(CURRENT_USER.name)){
    if(AUTO_SYNC_SAFE_PAGES.includes(CURRENT_PAGE)) navigate(CURRENT_PAGE);
  } else {
    const homeMain=document.getElementById('homeMain');
    if(homeMain && CURRENT_HOME_SECTION && CURRENT_HOME_SECTION!=='home'){
      homeNav(CURRENT_HOME_SECTION);
    }
  }
}

let REALTIME_CHANNEL=null;

function startRealtimeSync(){
  const sb=getSB(); if(!sb || REALTIME_CHANNEL) return;
  try{
    REALTIME_CHANNEL = sb.channel('school_data_changes')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'school_data', filter:`id=eq.${SB_ID}` },
        (payload)=>{
          try{
            if(payload?.new?.data && Object.keys(payload.new.data).length>5){
              resolveBlobs(sb,payload.new.data).then(full=>{
                if(!DB){ DB=full; snapItems(); } else mergeDBInPlace(full);
                localStorage.setItem(STORE_KEY, JSON.stringify(DB));
                migrateDB();
                refreshVisibleUI();
              }).catch(e=>console.warn('Realtime resolve failed:',e));
            }
          }catch(e){ console.warn('Realtime apply failed:',e); }
        })
      .subscribe();
  }catch(e){ console.warn('Realtime subscribe failed:',e); }
}

let AUTO_SYNC_TIMER=null;

async function pollOnce(){
  if(document.hidden) return;                       // never poll from a background/forgotten tab
  const r=await serverChanged();
  if(r.error){ setSyncBadge(false,'poll: '+r.error); return; }
  if(!r.changed){ setSyncBadge(true,'synced'); return; }
  const updated=await loadFromSupabase();
  if(updated){ migrateDB(); refreshVisibleUI(); }
}

function startAutoSync(){
  if(AUTO_SYNC_TIMER) return;
  startRealtimeSync();
  AUTO_SYNC_TIMER=setInterval(()=>{ if(navigator.onLine!==false) pollOnce().catch(()=>{}); }, 15000);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) pollOnce().catch(()=>{}); });
  window.addEventListener('online',()=>{ setSyncBadge(true,'loading'); pollOnce().catch(()=>{}); if(SYNC_DIRTY) pushToServer(); });
  window.addEventListener('offline',()=>setSyncBadge(false,'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಕಡಿತವಾಗಿದೆ'));
  window.addEventListener('beforeunload',e=>{ if(SYNC_DIRTY||PUSHING){ e.preventDefault(); e.returnValue='ಕೆಲವು ಬದಲಾವಣೆಗಳು ಇನ್ನೂ ಉಳಿದಿಲ್ಲ.'; return e.returnValue; } });
}

let CURRENT_USER=null;

function loadSession(){
  try{ const raw=sessionStorage.getItem(SESSION_KEY); if(raw) CURRENT_USER=JSON.parse(raw); }catch(e){}
  loadSessionToken();
}

function saveSession(){ try{ sessionStorage.setItem(SESSION_KEY, JSON.stringify(CURRENT_USER)); }catch(e){} }

function esc(s){ return (s===undefined||s===null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function todayStr(){ return new Date().toISOString().slice(0,10); }

function fmtDate(d){ if(!d) return '—'; try{ const dt=new Date(d+'T00:00:00'); return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }catch(e){ return d; } }

function showToast(msg, duration=2600){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window._toastT); window._toastT=setTimeout(()=>t.classList.remove('show'),duration); }

function staffByName(name){ return STAFF.find(s=>s.name===name); }

function staffNamesForRole(role){ return STAFF.filter(s=>s.role===role).map(s=>s.name); }

function pushNotification(toName,text){
  DB.notifications.push({id:uid(), to:toName, text, date:todayStr(), ts:Date.now(), read:false});
  saveDB();
}

let LOGIN_CAPTCHA_SUM=0;
function newLoginCaptcha(){
  const a=1+Math.floor(Math.random()*9);
  const b=1+Math.floor(Math.random()*9);
  LOGIN_CAPTCHA_SUM=a+b;
  const q=document.getElementById('loginCaptchaQ');
  const ans=document.getElementById('loginCaptchaA');
  if(q) q.textContent=a+' + '+b+' =';
  if(ans) ans.value='';
}

async function doLogin(){
  const hrmsId=document.getElementById('loginHrms').value.trim();
  const pass=document.getElementById('loginPass').value;
  const errBox=document.getElementById('loginErr');
  if(!hrmsId){ errBox.textContent='HRMS ID ನಮೂದಿಸಿ. (Enter your HRMS ID)'; return; }
  const s=staffByHrms(hrmsId);
  if(!s){ errBox.textContent='HRMS ID ಕಂಡುಬಂದಿಲ್ಲ. (HRMS ID not found)'; return; }
  const captchaAns=document.getElementById('loginCaptchaA');
  const givenCaptcha=captchaAns ? Number(captchaAns.value) : NaN;
  if(!captchaAns || captchaAns.value===''  || givenCaptcha!==LOGIN_CAPTCHA_SUM){
    errBox.style.color='';
    errBox.textContent='ಸಂಖ್ಯೆ ಪರಿಶೀಲನೆ ತಪ್ಪಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. (Security check incorrect)';
    newLoginCaptcha();
    return;
  }
  // Force a fresh pull from Supabase right now — a background timer on a
  // locked/backgrounded phone may not have refreshed in time, so someone's
  // just-changed password could otherwise look "wrong" on another device.
  const loginBtn=document.getElementById('loginBtn');
  errBox.style.color=''; errBox.textContent='⏳ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...';
  if(loginBtn) loginBtn.disabled=true;
  let syncFailed=false;
  try{
    await Promise.race([loadFromSupabase(), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),8000))]);
    migrateDB();
  }catch(e){ syncFailed=true; console.warn('Pre-login sync failed:',e); }
  if(loginBtn) loginBtn.disabled=false;
  if(syncFailed){
    errBox.style.color='var(--gold)';
    errBox.textContent='⚠ ಇತ್ತೀಚಿನ ಡೇಟಾ ಸಿಂಕ್ ಆಗಲಿಲ್ಲ (ನೆಟ್‌ವರ್ಕ್ ಪರಿಶೀಲಿಸಿ) — ಈ ಫೋನ್‌ನಲ್ಲಿ ಈಗಾಗಲೇ ಇರುವ ಡೇಟಾದಿಂದ ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ. ಇತ್ತೀಚೆಗೆ ಬದಲಾದ ಪಾಸ್‌ವರ್ಡ್ ಕೆಲಸ ಮಾಡದಿದ್ದರೆ, ನೆಟ್‌ವರ್ಕ್ ಸರಿಪಡಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
  }
  // Safety: ensure DB.users exists (local cache only — real password check happens on the server now)
  if(!DB.users) DB.users={};
  STAFF.forEach(st=>{ if(!DB.users[st.name]) DB.users[st.name]={password:'1234'}; });
  errBox.style.color=''; errBox.textContent='⏳ ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...';
  if(loginBtn) loginBtn.disabled=true;
  const authRes=await cfSessionCall('/api/session/login',{id:SB_ID,name:s.name,password:pass});
  if(loginBtn) loginBtn.disabled=false;
  if(!authRes || !authRes.ok){
    errBox.style.color='';
    errBox.textContent = authRes && authRes.code==='locked'
      ? 'ಹೆಚ್ಚು ತಪ್ಪು ಪ್ರಯತ್ನಗಳು ಆಗಿವೆ. 15 ನಿಮಿಷ ಬಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
      : (authRes && authRes.code==='not_configured'
          ? '⚠ ಸರ್ವರ್ ಸಿದ್ಧವಾಗಿಲ್ಲ (OTP_SECRET ಇಲ್ಲ). FDA ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
          : 'ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ. (Incorrect password)');
    newLoginCaptcha();
    return;
  }
  saveSessionToken(authRes.session);
  const rec=Object.assign({},DB.users[s.name],{mustChange:!!authRes.mustChange});
  DB.users[s.name]=rec;
  // Check warden charge
  let effectiveRole = s.role;
  let effectiveDesig = s.desig;
  let hasAdminCharge = false;
  if(s.role==='staff' && DB.wardenCharge){
    const activeWarden = DB.wardenCharge.find(wc=>wc.staffHrmsId===s.hrmsId && wc.active);
    if(activeWarden){ effectiveRole='warden'; effectiveDesig='ವಾರ್ಡನ್ ಪ್ರಭಾರ ('+s.desig+')'; }
  }
  // Check admin charge (Principal gave temp admin to this staff)
  if(s.role==='staff' && DB.adminCharges){
    const today2=todayStr();
    const ac=DB.adminCharges.find(c=>c.staffHrmsId===s.hrmsId&&c.active&&c.fromDate<=today2&&c.toDate>=today2);
    if(ac){ hasAdminCharge=true; effectiveDesig='ಆಡಳಿತ ಪ್ರಭಾರ (I/C Principal — '+s.desig+')'; }
  }
  CURRENT_USER={name:s.name, role:effectiveRole, originalRole:s.role, desig:effectiveDesig, mobile:s.mobile, hrmsId:s.hrmsId, hasAdminCharge};
  saveSession();
  errBox.textContent='';
  resetSessionTimer(); // Start inactivity timer
  enterApp();
  if(rec.mustChange) setTimeout(()=>{ openPwModal(); showToast('🔑 ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿದ್ದೀರಿ — ಹಳೆಯ ಪಾಸ್‌ವರ್ಡ್ ಜಾಗದಲ್ಲಿ ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ ಹಾಕಿ ಹೊಸದನ್ನು ಇಡಿ',7000); },700);
}

function doLogout(){
  clearTimeout(SESSION_WARN_ID);
  clearTimeout(SESSION_OUT_ID);
  CURRENT_USER=null;
  saveSessionToken(null);
  try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){}
  document.getElementById('app').classList.remove('show');
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginPass').value='';
  document.getElementById('loginHrms').value='';
  newLoginCaptcha();
}

let CURRENT_HOME_SECTION='home';

function updateClock(){
  const el=document.getElementById('navClock'); if(!el) return;
  const now=new Date();
  const d=now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
  const t=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
  el.textContent=`Date : ${d}   Time : ${t}`;
}

function loadHeaderImages(){
  Object.keys(IMAGES).forEach(key=>{
    document.querySelectorAll(`img[data-key="${key}"]`).forEach(img=>{ img.src=IMAGES[key]; });
  });
  // Set school building background photo
  const bgPhoto=document.getElementById('schoolBgPhoto');
  if(bgPhoto&&typeof SCHOOL_PHOTO!=='undefined') bgPhoto.src=SCHOOL_PHOTO;
}

function enterApp(){
  checkAdminChargeExpiry(); // Check if any admin charges expired
  setTimeout(checkMODReminder, 800); // Check MOD reminders
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').classList.add('show');
  renderWelcome();
  renderSidebar();
  renderNotifBadge();
  navigate('dashboard');
}

function renderWelcome(){
  document.getElementById('welcomeBox').innerHTML=
    `Welcome: <b>${esc(CURRENT_USER.name)}</b> <span class="role-badge">${esc(ROLE_LABEL[CURRENT_USER.role])}</span>`;
}

function myNotifications(){ return DB.notifications.filter(n=>n.to===CURRENT_USER.name).sort((a,b)=>b.ts-a.ts); }

function renderNotifBadge(){
  const n=myNotifications().filter(x=>!x.read).length;
  const badge=document.getElementById('notifBadge');
  const btn=badge?.parentElement;
  if(!badge) return;
  if(n>0){
    badge.style.display='inline-block'; badge.textContent=n;
    if(btn) btn.classList.add('notif-blink-btn');
  } else {
    badge.style.display='none';
    if(btn) btn.classList.remove('notif-blink-btn');
  }
}

function toggleNotifDropdown(){
  const dd=document.getElementById('notifDropdown');
  const willShow=!dd.classList.contains('show');
  dd.classList.toggle('show', willShow);
  if(willShow){
    const items=myNotifications();
    dd.innerHTML = items.length ? items.slice(0,25).map(n=>{
      const page=getNotifTargetPage(n.text);
      return `<div class="notif-item ${n.read?'':'unread'}" style="cursor:pointer;" onclick="openNotifItem('${n.id}','${page}')">
        <div style="line-height:1.5;">${esc(n.text)}</div>
        <div class="t">${fmtDate(n.date)}${page?` · <span style="color:var(--navy);font-weight:700;">👉 ಕ್ಲಿಕ್ ಮಾಡಿ ತೆರೆಯಿರಿ</span>`:''}</div>
      </div>`;
    }).join('') +
    `<div class="form-actions" style="margin-top:6px;">
      <button class="btn btn-outline btn-sm" onclick="markAllNotifRead()">✅ ಎಲ್ಲಾ ಓದಿದ್ದೆಂದು ಗುರುತಿಸಿ</button>
    </div>` :
    `<div class="notif-empty">ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.</div>`;
  }
}

function openNotifItem(id, page){
  // Mark as read
  const n=myNotifications().find(x=>x.id===id);
  if(n&&!n.read){ n.read=true; saveDB(); renderNotifBadge(); }
  // Close dropdown
  const dd=document.getElementById('notifDropdown');
  if(dd) dd.style.display='none';
  // Navigate to target page
  if(page) navigate(page);
}

function getNotifTargetPage(text){
  if(!text) return '';
  const t=text;
  const role=CURRENT_USER?.role||'';

  // DUTY ORDERS — staff gets: go to myduties
  if(t.includes('ಕರ್ತವ್ಯ ಆದೇಶ ಸ್ವೀಕರಿಸಿ')||
     t.includes('ನನ್ನ ಕರ್ತವ್ಯ ಆದೇಶ')||
     t.includes('E-Sign ಮಾಡಿ')&&t.includes('ಕರ್ತವ್ಯ')||
     t.includes('My Duty')||t.includes('myduties')){
    if(role==='staff'||role==='warden') return 'myduties';
  }
  // DUTY — FDA/Principal notifications about duty
  if(t.includes('ಕರ್ತವ್ಯ Approved')||t.includes('ಕರ್ತವ್ಯ ಅನುಮೋದನೆ')){
    return role==='fda'?'dutyallot':'dutyapprove';
  }
  if(t.includes('ಕರ್ತವ್ಯ Copy')||t.includes('Outward:')||
     (t.includes('ಕರ್ತವ್ಯ')&&(role==='fda'||role==='principal')&&t.includes('ಕಳುಹಿಸಿ'))){
    return 'dutyallot';
  }
  if(t.includes('ಕರ್ತವ್ಯ ನಿಯೋಜನೆ Approval')||(role==='principal'&&t.includes('ಕರ್ತವ್ಯ')&&t.includes('Sign'))){
    return 'dutyapprove';
  }
  // DUTY E-SIGN ACKNOWLEDGED
  if(t.includes('ಕರ್ತವ್ಯ ಸ್ವೀಕೃತಿ')||t.includes('Staff Acknowledged')||
     (t.includes('E-Sign')&&t.includes('ಕರ್ತವ್ಯ'))){
    return role==='staff'?'myduties':'dutyallot';
  }
  // LEAVE
  if(t.includes('ರಜೆ ಮಂಜೂರು')||t.includes('ರಜೆ ತಿರಸ್ಕರಿಸ')||
     t.includes('ರಜೆ ಅರ್ಜಿ')&&role==='staff') return 'leavemgmt';
  if(t.includes('ರಜೆ ಅರ್ಜಿ Approval')||t.includes('leaveapprove')||
     (t.includes('ರಜೆ')&&(role==='principal'||role==='fda')&&t.includes('Sign'))) return 'leaveapprove';
  if(t.includes('ರಜೆ Copy')||t.includes('Monthly Report')||t.includes('Leave Register')) return role==='fda'?'leavereport':'messages';
  // INWARD / OUTWARD
  if(t.includes('ಒಳಬರುವ ಪತ್ರ')||t.includes('Inward')||t.includes('IN-')) return 'inward';
  if(t.includes('ಹೊರಹೋಗುವ')||t.includes('Outward')||t.includes('OUT-')) return 'outward';
  // MESSAGES
  if(t.includes('ಸಂದೇಶ')||t.includes('Message')||t.includes('ಹೊಸ ಸಂದೇಶ')) return 'messages';
  // MOD
  if(t.includes('MOD')) return (role==='staff'||role==='warden')?'modstaffview':'modacknowledge';
  if(t.includes('ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ')||t.includes('ತರಬೇತಿ ನೋಂದಣಿ')) return 'attcert';
  // STOCK (materials)
  if(t.includes('ಸಾಮಗ್ರಿ ಮಾಸಿಕ')||t.includes('ಸಾಮಗ್ರಿ ವಹಿ')) return 'stock';
  if(t.includes('ಸಾಮಗ್ರಿ ವಿತರಣೆ')) return role==='fda'?'stock':'stockaccept';
  // NOTICE BOARD
  if(t.includes('Notice Board')||t.includes('ನೋಟಿಸ್ ಬೋರ್ಡ್')||t.includes('📌')) return 'dashboard';
  // MY FILES
  if(t.includes('My Files')||t.includes('ನನ್ನ ಫೈಲ್')) return 'staffdocfiles';
  // EL BALANCE
  if(t.includes('EL Balance')) return role==='fda'?'elupdatefda':'leavemgmt';
  // PROGRESS CARD
  if(t.includes('ಪ್ರಗತಿ ಪತ್ರಿಕೆ')||t.includes('Progress Card')) return 'pcsign';
  // SC / TC
  if(t.includes('SC')||t.includes('TC')||t.includes('ಪ್ರಮಾಣ ಪತ್ರ')) return 'sctc';
  // ASSET
  if(t.includes('ಚರಾಸ್ತಿ')||t.includes('Asset')) return 'assets';
  // SSLC
  if(t.includes('SSLC')||t.includes('Adoption')) return 'sslcachieve';
  // FOOD
  if(t.includes('ಬೀಡಿಕೆ')||t.includes('food')||t.includes('ಆಹಾರ')) return 'foodmonthly';
  // DOC FILES
  if(t.includes('ದಾಖಲೆ ಕಡತ')||t.includes('Doc File')) return 'docfiles';
  // WARDEN CHARGE
  if(t.includes('ವಾರ್ಡನ್ ಪ್ರಭಾರ')) return 'wardencharge';
  if(t.includes('ಆಡಳಿತ ಪ್ರಭಾರ')) return 'admincharge';
  return '';
}

function markAllNotifRead(){
  DB.notifications.forEach(n=>{ if(n.to===CURRENT_USER.name) n.read=true; });
  saveDB(); renderNotifBadge(); toggleNotifDropdown(); toggleNotifDropdown();
}

document.addEventListener('click', e=>{
  const wrap=document.querySelector('.notif-wrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('notifDropdown')?.classList.remove('show');
});


/* =====================================================================
   Forgot password: request from login page -> FDA/Principal resets -> user must change at first login
   Data: DB.pwRequests[{id,hrmsId,name,mobileOk,at,status}]
   ===================================================================== */
function pwDigits(x){ return String(x||'').replace(/\D/g,'').slice(-10); }
function openForgotPw(){
  const v=(document.getElementById('loginHrms')||{}).value||'';
  document.getElementById('fp_hrms').value=v.trim(); document.getElementById('fp_mobile').value=''; document.getElementById('fp_err').textContent='';
  document.getElementById('forgotModalBg').classList.add('show');
}
function closeForgotPw(){ document.getElementById('forgotModalBg').classList.remove('show'); }
function submitForgotPw(){
  const err=document.getElementById('fp_err'); err.style.color='';
  const hr=document.getElementById('fp_hrms').value.trim(), mob=pwDigits(document.getElementById('fp_mobile').value);
  if(!hr){ err.textContent='HRMS ID ನಮೂದಿಸಿ.'; return; }
  const st=staffByHrms(hr);
  if(!st){ err.textContent='HRMS ID ಕಂಡುಬಂದಿಲ್ಲ.'; return; }
  if(!DB.pwRequests) DB.pwRequests=[];
  if(DB.pwRequests.some(r=>r.hrmsId===st.hrmsId&&r.status==='Pending')){ err.style.color='var(--green)'; err.textContent='ಈಗಾಗಲೇ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ — FDA ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'; return; }
  const reg=pwDigits(st.mobile);
  const mobileOk=!!(reg.length===10&&mob===reg);
  if(reg.length===10&&!mobileOk){ err.textContent='ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು FDA ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'; return; }
  DB.pwRequests.push({id:uid(),hrmsId:st.hrmsId,name:st.name,mobileOk,at:todayStr(),ts:Date.now(),status:'Pending'});
  const notify=st.role==='fda'?staffNamesForRole('principal'):staffNamesForRole('fda');
  notify.forEach(n=>pushNotification(n,`🔑 ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ವಿನಂತಿ: ${st.name} (${st.hrmsId})${mobileOk?' — ಮೊಬೈಲ್ ಪರಿಶೀಲಿತ':' — ಮೊಬೈಲ್ ಪರಿಶೀಲಿಸಿಲ್ಲ'}`));
  saveDB();
  closeForgotPw();
  showToast('✅ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ — ಕಚೇರಿ ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ ನೀಡುತ್ತದೆ',6000);
}
function pwGenTemp(){
  const U='ABCDEFGHJKLMNPQRSTUVWXYZ', L='abcdefghijkmnpqrstuvwxyz', N='23456789', S='!@#$%';
  const rnd=()=>crypto.getRandomValues(new Uint32Array(1))[0];
  const pick=x=>x[rnd()%x.length];
  const a=[pick(U),pick(L),pick(L),pick(N),pick(N),pick(S)];
  for(let i=a.length-1;i>0;i--){ const j=rnd()%(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a.join('');
}
let PW_LAST=null;
function pwCanReset(st){
  /* FDA (site admin) resets everyone, incl. Principal. Principal can only reset the FDA's own account (fallback if FDA forgets). */
  if(CURRENT_USER.role==='fda') return st.name!==CURRENT_USER.name;
  if(CURRENT_USER.role==='principal') return st.role==='fda';
  return false;
}
function pwDoReset(hrmsId){
  const st=staffByHrms(hrmsId); if(!st||!pwCanReset(st)){ showToast('⚠ ಈ ಬಳಕೆದಾರರ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಲು ಅನುಮತಿ ಇಲ್ಲ'); return; }
  if(!confirm(st.name+' ಅವರ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸುವುದೇ?')) return;
  const temp=pwGenTemp();
  if(!DB.users) DB.users={};
  DB.users[st.name]={password:temp,mustChange:true,resetBy:CURRENT_USER.name,resetAt:todayStr()};
  (DB.pwRequests||[]).forEach(r=>{ if(r.hrmsId===st.hrmsId&&r.status==='Pending'){ r.status='Done'; r.doneBy=CURRENT_USER.name; r.doneAt=todayStr(); } });
  logAudit('Password Reset','User',st.hrmsId,st.name+' — reset by '+CURRENT_USER.name);
  saveDB(); PW_LAST={name:st.name,hrms:st.hrmsId,temp};
  renderPwReset();
}
function renderPwReset(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const reqs=(DB.pwRequests||[]).filter(r=>r.status==='Pending').sort((a,b)=>(b.ts||0)-(a.ts||0));
  const done=(DB.pwRequests||[]).filter(r=>r.status==='Done').sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,10);
  const q=(document.getElementById('pw_q')?.value||'').trim().toLowerCase();
  const list=STAFF.filter(st=>st.role!=='admin'&&(!q||st.name.toLowerCase().includes(q)||st.hrmsId.toLowerCase().includes(q)));
  const last=PW_LAST; PW_LAST=null;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🔑 ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ (Password Reset)</h2>
    <div class="desc">ಪಾಸ್‌ವರ್ಡ್ ಮರೆತ ಸಿಬ್ಬಂದಿಗೆ ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ ನೀಡಿ. ಅವರು ಮೊದಲ ಲಾಗಿನ್‌ನಲ್ಲಿ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಇಡಬೇಕು. ${CURRENT_USER.role==='principal'?'(ಪ್ರಾಂಶುಪಾಲರು FDA ಅವರ ಪಾಸ್‌ವರ್ಡ್ ಮಾತ್ರ ಮರುಹೊಂದಿಸಬಹುದು; ಉಳಿದವರದ್ದು FDA ಮಾಡುತ್ತಾರೆ.)':'(FDA — ಸೈಟ್ ನಿರ್ವಾಹಕರು — ಎಲ್ಲರ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಬಹುದು.)'}</div></div>
    ${last?`<div class="panel" style="border:2px solid var(--green);background:#f1faf3;"><h3>✅ ${esc(last.name)} (${esc(last.hrms)}) — ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್</h3>
      <div style="font-size:26px;font-weight:800;letter-spacing:2px;font-family:monospace;margin:8px 0;">${esc(last.temp)}</div>
      <div class="small-muted">ಇದನ್ನು ಈಗ ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತದೆ — ನೇರವಾಗಿ ಸಂಬಂಧಿತ ವ್ಯಕ್ತಿಗೆ ತಿಳಿಸಿ. ಅವರು ಲಾಗಿನ್ ಆದ ತಕ್ಷಣ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಇಡಲು ಕೇಳಲಾಗುತ್ತದೆ.</div></div>`:''}
    <div class="panel"><h3>📨 ಬಾಕಿ ವಿನಂತಿಗಳು (${reqs.length})</h3>
      ${reqs.length?`<div class="table-wrap"><table><thead><tr><th>ಹೆಸರು</th><th>HRMS ID</th><th>ದಿನಾಂಕ</th><th>ಮೊಬೈಲ್</th><th>Action</th></tr></thead><tbody>${reqs.map(r=>{ const st=staffByHrms(r.hrmsId);
        return `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.hrmsId)}</td><td>${fmtDate(r.at)}</td><td>${r.mobileOk?'<span class="badge badge-ok">✅ ಹೊಂದಿಕೆ</span>':'<span class="badge badge-warn">ಪರಿಶೀಲಿಸಿಲ್ಲ</span>'}</td>
        <td class="actions-cell">${st&&pwCanReset(st)?`<button class="btn btn-sm btn-primary" onclick="pwDoReset('${esc(r.hrmsId)}')">🔑 ಮರುಹೊಂದಿಸಿ</button>`:'<span class="small-muted">'+(CURRENT_USER.role==='fda'?'ಪ್ರಾಂಶುಪಾಲರು ಮಾಡಬೇಕು':'FDA ಮಾಡುತ್ತಾರೆ')+'</span>'}
        ${st&&pwCanReset(st)?`<button class="btn btn-sm btn-outline" onclick="pwDismiss('${r.id}')">ತಿರಸ್ಕರಿಸಿ</button>`:''}</td></tr>`; }).join('')}</tbody></table></div>`:'<p class="small-muted">ಯಾವುದೇ ಬಾಕಿ ವಿನಂತಿ ಇಲ್ಲ.</p>'}
    </div>
    <div class="panel"><h3>👥 ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ</h3>
      <div style="margin-bottom:8px;"><input id="pw_q" value="${esc(q)}" placeholder="ಹೆಸರು ಅಥವಾ HRMS ID ಹುಡುಕಿ" onchange="renderPwReset()" style="max-width:320px;"></div>
      <div class="table-wrap"><table><thead><tr><th>ಹೆಸರು</th><th>HRMS ID</th><th>ಹುದ್ದೆ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
        ${list.map(st=>{ const u=(DB.users||{})[st.name]||{}; return `<tr><td><b>${esc(st.name)}</b></td><td>${esc(st.hrmsId)}</td><td style="font-size:11.5px;white-space:normal;">${esc(st.desig||'')}</td>
          <td>${u.mustChange?`<span class="badge badge-warn">ತಾತ್ಕಾಲಿಕ ಪಾಸ್‌ವರ್ಡ್ — ಬದಲಾಗಿಲ್ಲ</span>`:(u.password==='1234'?'<span class="badge badge-draft">ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್</span>':'<span class="badge badge-ok">ಸ್ವಂತ ಪಾಸ್‌ವರ್ಡ್</span>')}</td>
          <td class="actions-cell">${pwCanReset(st)?`<button class="btn btn-sm btn-outline" onclick="pwDoReset('${esc(st.hrmsId)}')">🔑 ಮರುಹೊಂದಿಸಿ</button>`:''}</td></tr>`; }).join('')||'<tr class="empty-row"><td colspan="5">ಯಾರೂ ಕಂಡುಬಂದಿಲ್ಲ.</td></tr>'}
      </tbody></table></div></div>
    ${done.length?`<div class="panel"><h3>✅ ಇತ್ತೀಚಿನ ಮರುಹೊಂದಿಕೆಗಳು</h3><div class="small-muted">${done.map(r=>esc(r.name)+' — '+fmtDate(r.doneAt||r.at)+' ('+esc(r.doneBy||'')+')').join(' · ')}</div></div>`:''}`;
}
function pwDismiss(id){ const r=(DB.pwRequests||[]).find(x=>x.id===id); if(!r) return; const st=staffByHrms(r.hrmsId); if(!st||!pwCanReset(st)) return; r.status='Dismissed'; saveDB(); renderPwReset(); }

function openPwModal(){ document.getElementById('pwModalBg').classList.add('show'); document.getElementById('pwErr').textContent=''; }

function closePwModal(){ document.getElementById('pwModalBg').classList.remove('show'); ['pwOld','pwNew','pwConfirm'].forEach(id=>document.getElementById(id).value=''); }

async function submitPwChange(){
  const oldP=document.getElementById('pwOld').value, newP=document.getElementById('pwNew').value, conf=document.getElementById('pwConfirm').value;
  const errBox=document.getElementById('pwErr');
  if(!oldP){ errBox.textContent='ಹಳೆಯ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.'; return; }
  if(!newP){ errBox.textContent='ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.'; return; }
  if(newP.length<4||newP.length>8){ errBox.textContent='ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ 4 ರಿಂದ 8 ಅಕ್ಷರಗಳ ಒಳಗೆ ಇರಬೇಕು.'; return; }
  if(!/[A-Z]/.test(newP)){ errBox.textContent='ಕನಿಷ್ಠ 1 Capital Letter (A-Z) ಇರಬೇಕು.'; return; }
  if(!/[0-9]/.test(newP)){ errBox.textContent='ಕನಿಷ್ಠ 1 ಸಂಖ್ಯೆ (0-9) ಇರಬೇಕು.'; return; }
  if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newP)){ errBox.textContent='ಕನಿಷ್ಠ 1 Special Character (!@#$%... ) ಇರಬೇಕು.'; return; }
  if(newP===oldP){ errBox.textContent='ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಹಳೆಯದಕ್ಕಿಂತ ಬೇರೆ ಇರಬೇಕು.'; return; }
  if(newP!==conf){ errBox.textContent='ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.'; return; }
  errBox.style.color=''; errBox.textContent='⏳ ಉಳಿಸಲಾಗುತ್ತಿದೆ...';
  const res=await cfSessionCall('/api/session/change-password',{id:SB_ID,oldPassword:oldP,newPassword:newP});
  if(!res || !res.ok){
    errBox.textContent = (res&&res.code==='bad_old') ? 'ಹಳೆಯ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ.' : 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಲು ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
    return;
  }
  if(!DB.users) DB.users={};
  DB.users[CURRENT_USER.name]=Object.assign({},DB.users[CURRENT_USER.name],{password:(newP==='1234'?'1234':'********'),mustChange:false});
  closePwModal();
  showToast('✅ ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ — ಈಗಲೇ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಮೂಲಕ Login ಆಗಬಹುದು');
}

const NAV=[
 {group:'', items:[ {key:'dashboard', label:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', ic:'🏠', roles:['fda','principal','warden','staff']} ]},
 {group:'ವಿದ್ಯಾರ್ಥಿ / ಸಿಬ್ಬಂದಿ', items:[
   {key:'students', label:'ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ', ic:'🧑‍🎓', roles:['fda']},
   {key:'newadmission', label:'ಹೊಸ ಪ್ರವೇಶ (New Admission / Bulk Upload)', ic:'➕', roles:['fda']},
   {key:'stucerts', label:'ಪ್ರಮಾಣ ಪತ್ರಗಳು (ಅಂಕ ಪತ್ರ / ಅಧ್ಯಯನ / TC ಪತ್ರ)', ic:'📑', roles:['fda','principal']},
   {key:'studentexport', label:'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ Excel (ತರಗತಿವಾರು)', ic:'🎓', roles:['fda']},
   {key:'movement', label:'ಸಿಬ್ಬಂದಿ ಚಲನಾವಲನ ವಹಿ', ic:'🚶', roles:['fda','principal','staff']},
 ]},
 {group:'ಸಾಮಗ್ರಿ / ಸ್ಟಾಕ್', items:[
   {key:'stock', label:'ಸಾಮಗ್ರಿ ಸ್ಟಾಕ್ & ವಿತರಣೆ', ic:'📦', roles:['fda','principal']},
   {key:'stockaccept', label:'ನನಗೆ ವಿತರಿಸಿದ ಸಾಮಗ್ರಿ', ic:'🎁', roles:['fda','principal','warden','staff']},
   {key:'assets', label:'ಚರಾಸ್ತಿ ವಹಿ', ic:'🪑', roles:['fda','principal']},
 ]},
 {group:'ಹಣಕಾಸು', items:[
   {key:'bills', label:'ಬಿಲ್ ಪಾವತಿ (DC Bill)', ic:'🧾', roles:['fda','principal','warden']},
   {key:'cashbook', label:'ನಗದು ಪುಸ್ತಕ', ic:'💵', roles:['fda','principal']},
   {key:'bankrecon', label:'ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ (Bank Reconciliation)', ic:'🏦', roles:['fda','principal']},
   {key:'budget', label:'ಬಜೆಟ್ ವಾಚ್ ರಿಜಿಸ್ಟರ್', ic:'📊', roles:['fda','principal']},
   {key:'monthexp', label:'ಮಾಸಿಕ ಖರ್ಚು ವಹಿ', ic:'📅', roles:['fda']},
 ]},
 {group:'ಪತ್ರ ವ್ಯವಹಾರ', items:[
   {key:'inward', label:'ಒಳಬರುವ ಪತ್ರಗಳ ವಹಿ', ic:'📥', roles:['fda','principal','staff']},
   {key:'ack', label:'ಸ್ವೀಕೃತಿ ವಹಿ', ic:'✅', roles:['fda']},
   {key:'outward', label:'ಹೊರಹೋಗುವ ಪತ್ರಗಳ ವಹಿ', ic:'📤', roles:['fda','principal','staff']},
   {key:'letterhead', label:'ಪತ್ರಲೇಖನ / ಕಚೇರಿ ಆದೇಶ', ic:'📝', roles:['fda']},
   {key:'messages', label:'ಆಂತರಿಕ ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ', ic:'💬', roles:['fda','principal','staff']},
 ]},
 {group:'ಶಿಕ್ಷಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Teacher Dashboard)', items:[
   {key:'profile', label:'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ (Profile)', ic:'🪪', roles:['fda','principal','warden','staff']},
   {key:'tmsg', label:'ಶಿಕ್ಷಕರ ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ', ic:'✉️', roles:['fda','principal','warden','staff']},
   {key:'lessonplan', label:'ಲೆಸನ್ ಪ್ಲಾನ್', ic:'📘', roles:['staff','principal']},
   {key:'yearplan', label:'ಇಯರ್ ಪ್ಲಾನ್', ic:'🗓️', roles:['staff','principal']},
   {key:'teacherassign', label:'ಶಿಕ್ಷಕ-ವಿಷಯ ನಿಯೋಜನೆ (Subject/Class Assign)', ic:'📚', roles:['principal']},
   {key:'mentorallocation', label:'🧑‍🏫 ಮೆಂಟರ್ ಹಂಚಿಕೆ (Mentor Allocation)', ic:'🧑‍🏫', roles:['principal','fda']},
   {key:'mymentees', label:'🧑‍🏫 ನನ್ನ ಮೆಂಟರ್ ವಿದ್ಯಾರ್ಥಿಗಳು (My Mentees)', ic:'🧑‍🏫', roles:['staff','warden','fda','principal']},
   {key:'mentorprofile', label:'📝 ಮೆಂಟರ್ ಪ್ರೊಫೈಲ್ (ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ)', ic:'📝', roles:['staff','warden','fda','principal']},
   {key:'fdamentorregister', label:'📋 ಮೆಂಟರ್ Received Register', ic:'📋', roles:['fda']},
   {key:'auditlog', label:'Audit Log (Lesson/Year Plan)', ic:'🔍', roles:['principal']},
   {key:'attendance', label:'ಹಾಜರಾತಿ (Attendance)', ic:'📝', roles:['staff','principal','fda']},
   {key:'consolidated', label:'📊 ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ (Consolidated & CCE)', ic:'📊', roles:['fda','principal']},
   {key:'marks', label:'ಅಂಕ ನಮೂದು (Marks Entry)', ic:'🧮', roles:['staff','principal']},
   {key:'examactivation', label:'🎯 ಪರೀಕ್ಷೆ Activation', ic:'🎯', roles:['principal']},
   {key:'fdaexamregister', label:'📋 ಫಲಿತಾಂಶ Register (FDA)', ic:'📋', roles:['fda']},
   {key:'results', label:'ಫಲಿತಾಂಶ ವಿಶ್ಲೇಷಣೆ', ic:'📈', roles:['staff','principal','fda']},
   {key:'sslc', label:'SSLC ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', ic:'🎓', roles:['staff','principal']},
   {key:'classalloc', label:'ತರಗತಿ ಶಿಕ್ಷಕ ನಿಯೋಜನೆ', ic:'🏷️', roles:['principal']},
   {key:'staffdetails', label:'ಸಿಬ್ಬಂದಿ ವಿವರಗಳು (Staff Details)', ic:'🗂️', roles:['fda','principal']},
 ]},
 {group:'ಪ್ರಶ್ನೆ ಪತ್ರ (Question Paper)', items:[
   {key:'fdamessagecentre', label:'📨 ಸಂದೇಶ ಕೇಂದ್ರ (Message Centre)', ic:'📨', roles:['fda']},
   {key:'staffattendance', label:'🕐 ಹಾಜರಾತಿ ವಹಿ (My Attendance)', ic:'🕐', roles:['staff','warden','fda','principal']},
   {key:'fdamanualattendance', label:'✍️ ಹಸ್ತಚಾಲಿತ ಹಾಜರಾತಿ (Manual Entry)', ic:'✍️', roles:['fda']},
   {key:'attendancereport', label:'📊 ಮಾಸಿಕ ಹಾಜರಾತಿ ವರದಿ', ic:'📊', roles:['fda','principal']},
   {key:'attendanceregister', label:'📖 ದಿನವಾರು ಹಾಜರಾತಿ ವಹಿ (Daily Register)', ic:'📖', roles:['fda','principal']},
   {key:'dscregister', label:'🔏 DSC ಸಹಿ ಪ್ರತಿಗಳು (DSC Signed Copies)', ic:'🔏', roles:['fda','principal']},
   {key:'salaryupload', label:'💰 ಸಂಬಳ ಚೀಟಿ ಅಪ್‌ಲೋಡ್ (Salary Upload)', ic:'💰', roles:['fda']},
   {key:'salaryregister', label:'📋 ಸಂಬಳ ಚೀಟಿ ಸ್ವೀಕೃತಿ ನೋಂದಣಿ', ic:'📋', roles:['fda']},
   {key:'mysalary', label:'💰 ನನ್ನ ಸಂಬಳ ಚೀಟಿ (My Salary Slip)', ic:'💵', roles:['staff','warden','fda','principal']},
   {key:'tabill', label:'🚌 ನನ್ನ TA ಬಿಲ್ (My TA Bill)', ic:'🚌', roles:['staff','warden','fda','principal']},
   {key:'tabillregister', label:'🚌 TA ಬಿಲ್ ವಹಿ (Staff TA Bills)', ic:'🧾', roles:['fda','principal']},
   {key:'leavestaffreg', label:'📒 ಸಿಬ್ಬಂದಿ ರಜೆ ವಹಿ & CL/RH ಮಾಸಿಕ ವರದಿ', ic:'📒', roles:['principal','fda']},
   {key:'clregister', label:'📅 CL / RH ರಜೆ ಅರ್ಜಿ & ನನ್ನ ವಹಿ', ic:'📅', roles:['staff','warden','fda','principal']},
   {key:'elarji', label:'📄 EL ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', ic:'📄', roles:['staff','warden','fda','principal']},
   {key:'elregister', label:'📋 EL ಅರ್ಜಿ ವಹಿ (FDA)', ic:'📋', roles:['fda','principal']},
   {key:'qpupload', label:'QP ಅಪ್‌ಲೋಡ್ / ಟೈಪ್', ic:'📝', roles:['staff','principal']},
   {key:'qpdashboard', label:'QP ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Exam Head)', ic:'📋', roles:['staff','principal']},
   {key:'qpfda', label:'QP ಮುದ್ರಣ / Download (FDA)', ic:'🖨️', roles:['fda']},
 ]},
 {group:'ಆಡಳಿತ (Administration)', items:[
   {key:'wardencharge', label:'ವಾರ್ಡನ್ ಪ್ರಭಾರ ನಿಯೋಜನೆ', ic:'🔑', roles:['principal']},
   {key:'admincharge', label:'ಆಡಳಿತ ಪ್ರಭಾರ ನಿಯೋಜನೆ (Admin Charge)', ic:'🏛️', roles:['principal']},
   {key:'leaveapprove', label:'ರಜೆ ಅರ್ಜಿ ಅನುಮೋದನೆ (Leave Approve)', ic:'✅', roles:['principal']},
   {key:'dutyallot', label:'ಕರ್ತವ್ಯ ನಿಯೋಜನೆ (Duty Allotment)', ic:'📋', roles:['principal','fda']},
   {key:'dutyapprove', label:'ಕರ್ತವ್ಯ ಅನುಮೋದನೆ (Duty Approve)', ic:'✅', roles:['principal']},
   {key:'sti', label:'📚 STI ನೋಂದಣಿ (Study Time Incharge)', ic:'📚', roles:['principal','fda']},
   {key:'stiregister', label:'📊 STI Register (GPS Report)', ic:'📊', roles:['principal','fda']},
   {key:'mystistaffview', label:'📚 STI ಕರ್ತವ್ಯ (Study Time)', ic:'📚', roles:['staff','warden']},
   {key:'mod', label:'📋 MOD ನೋಂದಣಿ', ic:'📋', roles:['principal','fda']},
   {key:'modstaffview', label:'📋 MOD ಕರ್ತವ್ಯ', ic:'📋', roles:['staff','warden']},
   {key:'modacknowledge', label:'✅ MOD Acknowledgement', ic:'✅', roles:['principal','fda']},
   {key:'staffdocfiles', label:'🗂️ ನನ್ನ ಫೈಲ್‌ಗಳು (My Files)', ic:'🗂️', roles:['staff','warden','fda','principal']},
   {key:'elupdatefda', label:'📊 EL Balance Update', ic:'📊', roles:['fda']},
   {key:'leavereport', label:'📒 Leave Register (ರಜೆ ನೋಂದಣಿ)', ic:'📊', roles:['fda']},
 ]},
 {group:'ಪ್ರಗತಿ ಪತ್ರಿಕೆ & ದಾಖಲಾತಿ (Progress Card & Documents)', items:[
   {key:'markscard', label:'ಪ್ರಗತಿ ಪತ್ರಿಕೆ Generate (FDA)', ic:'📄', roles:['fda','principal']},
   {key:'pcsign', label:'ಪ್ರಗತಿ ಪತ್ರಿಕೆ E-Sign', ic:'✍️', roles:['staff','principal']},
   {key:'sctc', label:'SC / TC Generate (FDA)', ic:'📜', roles:['fda','principal']},
   {key:'attcert', label:'ತರಬೇತಿ ನೋಂದಣಿ & ಹಾಜರಾತಿ ಪ್ರಮಾಣಪತ್ರ', ic:'🎓', roles:['fda','principal']},
   {key:'fdauploads', label:'ಅಪ್‌ಲೋಡ್ ಕೇಂದ್ರ (Gallery/Notices)', ic:'📤', roles:['fda']},
   {key:'sitecontent', label:'ವೆಬ್‌ಸೈಟ್ ವಿಷಯ ಬರೆಯಿರಿ (Website Pages)', ic:'📝', roles:['fda','principal']},
   {key:'pwreset', label:'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ (Password Reset)', ic:'🔑', roles:['fda','principal']},
   {key:'docfiles', label:'ದಾಖಲೆ ಕಡತಗಳು (Document Files)', ic:'🗂️', roles:['fda','principal']},
   {key:'sctcsign', label:'SC / TC Approve', ic:'✍️', roles:['principal']},
   {key:'docissue', label:'ದಾಖಲಾತಿ ವಿತರಣಾ ವಹಿ', ic:'📒', roles:['fda','principal']},
   {key:'tcissued', label:'TC ನೀಡಿದ ವಿದ್ಯಾರ್ಥಿಗಳು', ic:'🚪', roles:['fda','principal']},
   {key:'certimport', label:'📥 ಪ್ರಮಾಣ ಪತ್ರ Upload (Offline Excel)', ic:'⬆️', roles:['fda']},
 ]},
 {group:'ವಾರ್ಡನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Warden)', items:[
   {key:'fooddash', label:'ಆಹಾರ ಸಾಮಗ್ರಿ & ದರ ನಿರ್ವಹಣೆ', ic:'🍱', roles:['warden','principal']},
   {key:'foodindent', label:'ದೈನಂದಿನ / ಮಾಸಿಕ ಇಂಡೆಂಟ್', ic:'📋', roles:['warden','principal']},
   {key:'foodissue', label:'ದೈನಂದಿನ ಆಹಾರ ಖರ್ಚು ದಾಖಲು', ic:'🍽️', roles:['warden','principal']},
   {key:'foodmonthly', label:'ಮಾಸಿಕ ಬೀಡಿಕೆ ಪಟ್ಟಿ', ic:'📊', roles:['warden','principal']},
   {key:'hostelitreg', label:'ವಸತಿ ವಸ್ತು ರಿಜಿಸ್ಟರ್', ic:'🛏️', roles:['warden','principal']},
 ]},
 {group:'ಸಭೆ ರಿಜಿಸ್ಟರ್ (Meeting Registers)', items:[
   {key:'parentsmtg', label:'ಪಾಲಕರ ಸಭೆ ರಿಜಿಸ್ಟರ್', ic:'👥', roles:['fda','principal']},
   {key:'staffmtg', label:'ಸಿಬ್ಬಂದಿ ಸಭೆ ರಿಜಿಸ್ಟರ್', ic:'🏛️', roles:['fda','principal']},
   {key:'mtgsign', label:'ಸಭೆ ಸ್ವೀಕೃತಿ (Sign)', ic:'✍️', roles:['staff','principal','warden']},
 ]},
];

let CURRENT_PAGE='dashboard';

// Non-teaching staff (nurse, security, cook ...) do not get teacher-work modules
const TEACHER_ONLY_KEYS=['lessonplan','yearplan','mymentees','mentorprofile','attendance','marks','results','sslc','qpupload','qpdashboard','pcsign','tmsg','mystistaffview','modstaffview','inward','outward'];
function isNonTeachingUser(u){
  if(!u||u.role!=='staff'||u.originalRole&&u.originalRole!=='staff') return false;
  const d=String(u.desig||'').toLowerCase();
  return NON_TEACHING_KEYWORDS.some(k=>d.includes(k));
}
function renderSidebar(){
  const sb=document.getElementById('sidebar');
  let html=`<div class="brand"><div class="mark">🏫</div><div class="txt">KREIS e-Office<small>MDRS Bhatkal (BC-265)</small></div></div>`;
  NAV.forEach(sec=>{
    const visible=sec.items.filter(it=>{
      if(isNonTeachingUser(CURRENT_USER)&&TEACHER_ONLY_KEYS.includes(it.key)) return false;
      if(it.roles.includes(CURRENT_USER.role)) return true;
      if(it.roles.includes('admin_charge') && CURRENT_USER.hasAdminCharge) return true;
      // Staff with admin charge also gets inward/outward/letterhead
      if(CURRENT_USER.hasAdminCharge && CURRENT_USER.role==='staff' &&
         ['inward','outward','ack','letterhead','leavemgmt','docfiles'].includes(it.key)) return true;
      return false;
    });
    if(!visible.length) return;
    if(sec.group) html+=`<div class="navgroup">${esc(sec.group)}</div>`;
    visible.forEach(it=>{
      html+=`<a class="navitem ${CURRENT_PAGE===it.key?'active':''}" onclick="navigate('${it.key}')"><span class="ic">${it.ic}</span>${esc(it.label)}</a>`;
    });
  });
  sb.innerHTML=html;
}

function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); }

function navigate(page){
  // Check admin charge expiry on every navigation
  checkAdminChargeExpiry();
  // If admin charge expired, refresh current user's hasAdminCharge
  if(CURRENT_USER && CURRENT_USER.hasAdminCharge){
    const today=todayStr();
    const ac=DB.adminCharges&&DB.adminCharges.find(c=>c.staffHrmsId===CURRENT_USER.hrmsId&&c.active&&c.fromDate<=today&&c.toDate>=today);
    if(!ac){ CURRENT_USER.hasAdminCharge=false; saveSession(); showToast('ℹ ಆಡಳಿತ ಪ್ರಭಾರ ಅವಧಿ ಮುಗಿದಿದೆ'); }
  }
  CURRENT_PAGE=page;
  document.getElementById('sidebar').classList.remove('open');
  renderSidebar();
  const el=document.getElementById('content');
  const renderers={
    dashboard:renderDashboard, students:renderStudents, movement:renderMovement,
    attcert:renderAttCert, stock:renderStockHub, stockaccept:renderStockAccept, assets:renderAssetsRegister,
    bills:renderBills, cashbook:renderCashbook, bankrecon:renderBankRecon, budget:renderBudget, monthexp:renderMonthExp,
    inward:renderInward, ack:renderAck, outward:()=>renderGenericModule(outwardCfg()),
    letterhead:renderLetterhead, messages:()=>renderGenericModule(messageCfg()),
    profile:renderProfile, tmsg:renderTeacherMessages,
    lessonplan:()=>renderEduPlan('lesson'), yearplan:()=>renderEduPlan('year'),
    teacherassign:renderTeacherAssign, auditlog:renderAuditLog,
    mentorallocation:renderMentorAllocation, consolidated:renderConsolidatedPage, mymentees:renderMyMentees,
    fdamentorregister:renderFDAMentorRegister, mentorprofile:renderMentorProfilePage,
    attendance:renderAttendance, marks:renderMarksEntry, results:renderResults,
    examactivation:renderExamActivation, fdaexamregister:renderFDAExamRegister,
    sslc:renderSSLC, classalloc:renderClassAlloc, staffdetails:renderStaffDetails,
    qpupload:renderQPUpload, qpdashboard:renderQPDashboard, qpfda:renderQPFDA,
    salaryupload:renderSalaryUpload, salaryregister:renderSalaryRegister, mysalary:renderMySalary, tabill:renderTABill, tabillregister:renderTABillRegister, elarji:renderELList, elregister:renderELRegister,
    staffattendance:renderStaffAttendance, fdamanualattendance:renderFDAManualAttendance, attendancereport:renderAttendanceReport,
    attendanceregister:renderAttendanceRegister, dscregister:renderDscRegister,
    fdamessagecentre:renderFDAMessageCentre,
    markscard:renderMarksCard, pcsign:renderPCSign, docissue:renderDocIssue, certimport:renderCertImport, studentexport:renderStudentExport, stucerts:renderStuCerts, newadmission:renderNewAdmission, tcissued:renderTCIssued,
    sctc:renderSCTC, sctcsign:renderSCTCSign,
    fooddash:renderFoodDash, foodindent:renderFoodIndent, foodissue:renderFoodIssue, foodmonthly:renderFoodMonthly, hostelitreg:renderHostelItems,
    parentsmtg:()=>renderMeetingReg('parents'), staffmtg:()=>renderMeetingReg('staff'), mtgsign:renderMtgSign,
    wardencharge:renderWardenCharge,
    dutyallot:renderDutyAllot,
    dutyapprove:renderDutyApprove,
    myduties:renderMyDuties,
    admincharge:renderAdminCharge,
    leavemgmt:renderLeaveMgmt,
    clregister:renderClRegister,
    leavestaffreg:renderLeaveStaffReg,
    leaveapprove:renderLeaveApprove,
    docfiles:renderDocFiles,
    fdauploads:renderFDAUploads, sitecontent:renderSiteContent, pwreset:renderPwReset,
    adminDash:renderAdminChargeDash,
    supabase:renderSupabasePanel,
    // STI — Study Time Incharge
    sti:renderSTI,
    stiregister:renderSTIRegister,
    mystistaffview:renderMySTI,
    // MOD
    mod:renderMOD,
    modstaffview:renderStaffMOD,
    modacknowledge:renderMODAcknowledge,
    // Notice Board, My Files, Leave Report, EL Update
    noticeboard:renderNoticeBoard,
    staffdocfiles:renderStaffDocFiles,
    leavereport:renderLeaveReport,
    elupdatefda:renderELUpdate,
    // SSLC Adoption & Achievement
    sslcadopt:renderSSLCAdopt,
    sslcachieve:renderSSLCAchieve,
    // My Duties (Staff)
    myduties:renderMyDuties,
  };
  el.innerHTML='';
  (renderers[page]||renderDashboard)();
  renderNotifBadge();
  window.scrollTo(0,0);
}

function renderDashboard(){
  const r=CURRENT_USER.role;
  const pendingInward = DB.inward.filter(i=>i.status==='Sent to Principal').length;
  const pendingBills = DB.bills.filter(b=> (r==='principal'&&(b.status==='Sent to Principal')) || (r==='warden'&&b.status==='Sent to Warden') ).length;
  const pendingMsgs = DB.messages.filter(m=>m.status==='Sent to Principal').length;
  const myMovements = DB.staffMovement.filter(m=>m.staffName===CURRENT_USER.name && m.status==='Out').length;

  let cards=dashCards(r,{pendingInward,pendingBills,pendingMsgs,myMovements});

  const modules = NAV.flatMap(s=>s.items).filter(it=>it.key!=='dashboard' && it.roles.includes(r) && !(isNonTeachingUser(CURRENT_USER)&&TEACHER_ONLY_KEYS.includes(it.key)));

  // Leave balance for this year
  const yr=todayStr().slice(0,4);
  const myLeaves=(DB.leaveApplications||[]).filter(l=>l.hrmsId===CURRENT_USER.hrmsId);
  const myPending=myLeaves.filter(l=>l.status==='Sent to Principal').length;
  const myApproved=myLeaves.filter(l=>l.status==='Approved'&&(l.fromDate||'').startsWith(yr)).length;

  document.getElementById('content').innerHTML=`
    ${CURRENT_USER.role==='principal'?principalInboxHTML():''}
    ${CURRENT_USER.role!=='principal'&&typeof staffInboxHTML==='function'?staffInboxHTML():''}
    ${(()=>{
      // DUTY ORDER BANNER — appears FIRST before everything
      if(!DB.dutyAllotments) return '';
      const pendingDuties=DB.dutyAllotments.filter(d=>
        d.staffHrmsId===CURRENT_USER.hrmsId &&
        (d.status==='Sent to Staff'||d.status==='Staff Acknowledged') && !d.staffSigned && d.active
      );
      if(!pendingDuties.length) return '';
      return pendingDuties.map(d=>`
        <div style="background:var(--navy);color:#fff;border-radius:12px;padding:16px;margin-bottom:14px;animation:notifBlink 2s infinite;cursor:pointer;" onclick="navigate('myduties')">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="font-size:16px;font-weight:800;margin-bottom:6px;">📋 ಕರ್ತವ್ಯ ಆದೇಶ — E-Sign ಮಾಡಿ!</div>
              <div style="font-size:13px;font-family:var(--font-kn);line-height:1.8;">
                <b>${esc(d.orderNo)}</b> | ${esc(d.dutyType)}<br>
                ${fmtDate(d.fromDate)}${d.toDate?' → '+fmtDate(d.toDate):' (ಮುಂದಿನ ಆದೇಶ ವರೆಗೆ)'}<br>
                ✅ Principal E-Sign: ${esc(d.principalName||'')}
              </div>
            </div>
            <button class="btn" style="background:#fff;color:var(--navy);font-weight:700;padding:10px 18px;" onclick="navigate('myduties')">✍️ E-Sign ಮಾಡಿ →</button>
          </div>
        </div>`).join('');
    })()}
    <div class="page-head"><h2>ಡ್ಯಾಶ್‌ಬೋರ್ಡ್</h2><div class="desc">${esc(CURRENT_USER.desig)}${CURRENT_USER.mobile&&CURRENT_USER.mobile!=='—'?' · '+esc(CURRENT_USER.mobile):''}</div></div>
    <div class="cards-grid">${cards}</div>

    <!-- NOTICE BOARD — always visible for all staff (except principal) -->
    <!-- MOD + STI Pending Widget -->
    ${(CURRENT_USER.role==='staff'||CURRENT_USER.role==='warden')?renderMODDashWidget():''}


    ${(()=>{ // MOD Today reminder
      if(!DB.modEntries) return '';
      const today=todayStr();
      const myModToday=DB.modEntries.find(mod=>(mod.staffList||[]).some(s=>(s.hrmsId===CURRENT_USER.hrmsId||s.name===CURRENT_USER.name)&&s.modDate===today&&!(mod.acknowledgements||[]).some(a=>a.hrmsId===CURRENT_USER.hrmsId||a.staffName===CURRENT_USER.name)));
      if(!myModToday) return '';
      return `<div style="background:var(--red);color:#fff;border-radius:10px;padding:14px;margin-bottom:14px;animation:notifBlink 1.5s infinite;cursor:pointer;" onclick="navigate('modstaffview')">
        <b style="font-size:15px;">🔴 ಇಂದು MOD ದಿನ!</b><br>
        ${esc(myModToday.title||myModToday.month)} — 8 PM ನಂತರ GPS Photo ಸಮೇತ Sign ಮಾಡಿ → <u>MOD ಕರ್ತವ್ಯ ಕ್ಲಿಕ್ ಮಾಡಿ</u>
      </div>`;
    })()}
    <div class="panel"><h3>ಮಾಡ್ಯೂಲ್‌ಗಳು</h3>
      <div class="mod-grid">${modules.map(m=>`<div class="mod-card" onclick="navigate('${m.key}')"><div class="ic">${m.ic}</div><div class="t">${esc(m.label)}</div></div>`).join('')}</div>
    </div>
    <div id="dashLeavePrintWrap"></div>`;

  updateDashLeaveBalance();
}

function dashCards(r,ctx){
  if(r==='fda') return dashCardsFDA(ctx);
  if(r==='principal') return dashCardsPrincipal(ctx);
  if(r==='warden') return dashCardsWarden(ctx);
  if(r==='staff') return dashCardsTeacher(ctx);
  return '';
}

function statCard(n,l){ return `<div class="stat-card"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`; }

const MODULE_CFGS={};

const PROFILE_SECTIONS=[
 {title:'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ', fields:[
   {key:'fatherName', label:'ತಂದೆಯ ಹೆಸರು'},
   {key:'motherName', label:'ತಾಯಿಯ ಹೆಸರು'},
   {key:'spouseName', label:'ಪತಿ / ಪತ್ನಿಯ ಹೆಸರು'},
   {key:'childrenNames', label:'ಮಕ್ಕಳ ಹೆಸರು(ಗಳು)'},
   {key:'dob', label:'ಜನ್ಮ ದಿನಾಂಕ', type:'date'},
   {key:'gender', label:'ಲಿಂಗ', type:'select', options:['ಗಂಡು','ಹೆಣ್ಣು']},
 ]},
 {title:'ದಾಖಲೆ ಮಾಹಿತಿ', fields:[
   {key:'aadhaar', label:'Aadhaar Number'},
   {key:'pan', label:'PAN Number'},
   {key:'voterId', label:'Voter ID'},
   {key:'rationCard', label:'Ration Card Number'},
 ]},
 {title:'ಸಂಪರ್ಕ ಮಾಹಿತಿ', fields:[
   {key:'mobile2', label:'Mobile Number'},
   {key:'email', label:'Email ID'},
   {key:'permAddr', label:'Permanent Address'},
   {key:'presAddr', label:'Present Address'},
 ]},
 {title:'ಬ್ಯಾಂಕ್ ಮಾಹಿತಿ', fields:[
   {key:'bankName', label:'Bank Name'},
   {key:'accNo', label:'Account Number'},
   {key:'ifsc2', label:'IFSC Code'},
   {key:'branch', label:'Branch'},
 ]},
 {title:'ಮೀಸಲಾತಿ ಮಾಹಿತಿ', fields:[
   {key:'caste', label:'Caste'},
   {key:'category', label:'Category', type:'select', options:['General','OBC','SC','ST','Category-1','Category-2A','Category-2B','Category-3A','Category-3B']},
 ]},
];

let TMSG_FOLDER='inbox';

const ATT_CLASSES=['6','7','8','9','10'];

let ATT_STATE={}, ATT_LOADED_CLASS=null, ATT_LOADED_RECORD_ID=null, ATT_LOADED_STATUS=null;

let MARKS_LOADED=null;

const KREIS_CLASS10_EXAMS=['KSEAB SA-1','KREIS PRACTICE TEST-1','KREIS PRACTICE TEST-2','KREIS PRACTICE TEST-3','KREIS COMMON TEST','KSEAB PREPARATORY EXAM-1','KSEAB PREPARATORY EXAM-2','KSEAB PREPARATORY EXAM-3'];

function examNamesForClass(cls){ return cls==='10' ? STANDARD_EXAMS.concat(KREIS_CLASS10_EXAMS) : STANDARD_EXAMS.slice(); }

const CCE_FA_EXAMS=['FA-1','FA-2','FA-3','FA-4'];

const CCE_SA_EXAMS=['SA-1','SA-2'];

const CCE_SEM1=['FA-1','FA-2','SA-1'];

const CCE_SEM2=['FA-3','FA-4','SA-2'];

const CCE_ALL_EXAMS=[...CCE_SEM1,...CCE_SEM2];

const CCE_SEM1_MAX=50, CCE_SEM2_MAX=50, CCE_GT_MAX=100;

const KSEAB_PASS_PCT=33;   // school pass mark = 33% of the maximum (rounded to the nearest whole mark: 26/80, 33/100)
const KSEAB_BANDS=[['A+',90],['A',80],['B+',70],['B',60],['C+',50],['C',KSEAB_PASS_PCT],['NC',0]];

function usesKseabScale(exam){ return !CCE_FA_EXAMS.includes(exam) && !CCE_SA_EXAMS.includes(exam); }

function gradeLockKey(cls,subj,exam){ return cls+'||'+subj+'||'+exam; }

function getGradeLock(cls,subj,exam){
  if(!DB.gradeLocks) DB.gradeLocks={};
  return DB.gradeLocks[gradeLockKey(cls,subj,exam)];
}

const STUDENT_FIELDS=[
 // ---- ವಿದ್ಯಾರ್ಥಿ ಮೂಲ ಮಾಹಿತಿ ----
 {key:'studentName', label:'ವಿದ್ಯಾರ್ಥಿ ಪೂರ್ಣ ಹೆಸರು — ಕನ್ನಡ (Student Name — Kannada)', type:'text', required:true},
 {key:'studentNameEn', label:'Student Full Name — English', type:'text'},
 {key:'gender', label:'ಲಿಂಗ (Gender)', type:'select', options:['ಗಂಡು','ಹೆಣ್ಣು','ಇತರ']},
 {key:'dob', label:'ಜನ್ಮ ದಿನಾಂಕ (Date of Birth)', type:'date'},
 {key:'placeOfBirth', label:'ಜನ್ಮಸ್ಥಳ (Place of Birth)', type:'text'},
 {key:'nationality', label:'ರಾಷ್ಟ್ರೀಯತೆ (Nationality)', type:'text'},
 {key:'motherTongue', label:'ಮಾತೃಭಾಷೆ (Mother Tongue)', type:'text'},
 // ---- ತರಗತಿ ----
 {key:'className', label:'ತರಗತಿ (Class)', type:'select', options:CLASSES},
 {key:'section', label:'ವಿಭಾಗ (Section)', type:'select', options:['A','B','C','D','-']},
 {key:'medium', label:'ಮಾಧ್ಯಮ (Medium)', type:'select', options:['Kannada Medium','English Medium']},
 // ---- ಕುಟುಂಬ ----
 {key:'fatherName', label:'ತಂದೆಯ ಹೆಸರು — ಕನ್ನಡ (Fathers Name — Kannada)', type:'text'},
 {key:'fatherNameEn', label:"Father's Name — English", type:'text'},
 {key:'fatherOccupation', label:'ತಂದೆ ವೃತ್ತಿ (Fathers Occupation)', type:'text'},
 {key:'motherName', label:'ತಾಯಿಯ ಹೆಸರು — ಕನ್ನಡ (Mothers Name — Kannada)', type:'text'},
 {key:'motherNameEn', label:"Mother's Name — English", type:'text'},
 {key:'guardianName', label:'ಪಾಲಕ ಹೆಸರು (Guardian Name-if different)', type:'text'},
 {key:'guardianRelation', label:'ಪಾಲಕ ಸಂಬಂಧ (Guardian Relation)', type:'text'},
 // ---- ವಿಳಾಸ ----
 {key:'village', label:'ಗ್ರಾಮ/ಊರು (Village)', type:'text'},
 {key:'address', label:'ವಿಳಾಸ (Full Address)', type:'text'},
 {key:'taluk', label:'ತಾಲ್ಲೂಕು (Taluk)', type:'text'},
 {key:'district', label:'ಜಿಲ್ಲೆ (District)', type:'text'},
 {key:'state', label:'ರಾಜ್ಯ (State)', type:'text'},
 {key:'mobile', label:'ಮೊಬೈಲ್ (Mobile No)', type:'text'},
 // ---- ಜಾತಿ / ವರ್ಗ ----
 {key:'religion', label:'ಧರ್ಮ (Religion)', type:'text'},
 {key:'caste', label:'ಜಾತಿ (Caste)', type:'text'},
 {key:'subcaste', label:'ಉಪಜಾತಿ (Sub-Caste)', type:'text'},
 {key:'category', label:'ವರ್ಗ (Category)', type:'select', options:['SC','ST','OBC-I','OBC-II','GM']},
 // ---- ದೈಹಿಕ ----
 {key:'height', label:'ಎತ್ತರ cm (Height)', type:'text'},
 {key:'weight', label:'ತೂಕ kg (Weight)', type:'text'},
 {key:'bloodGroup', label:'ರಕ್ತದ ಗುಂಪು (Blood Group)', type:'select', options:['','A+','A-','B+','B-','AB+','AB-','O+','O-']},
 {key:'disability', label:'ಅಂಗವೈಕಲ್ಯ (Disability if any)', type:'text'},
 // ---- ಪ್ರವೇಶ ----
 {key:'admissionDate', label:'ಪ್ರವೇಶ ದಿನಾಂಕ (Admission Date)', type:'date', default:todayStr},
 {key:'previousSchool', label:'ಹಿಂದಿನ ಶಾಲೆ (Previous School)', type:'text'},
 {key:'previousSchoolAddress', label:'ಹಿಂದಿನ ಶಾಲೆ ವಿಳಾಸ (Previous School Address)', type:'text'},
 {key:'previousSchoolDise', label:'ಹಿಂದಿನ ಶಾಲೆ DISE ಕೋಡ್', type:'text'},
 {key:'previousClass', label:'ಹಿಂದಿನ ತರಗತಿ (Previous Class)', type:'text'},
 {key:'tcNo', label:'TC ಸಂಖ್ಯೆ (TC Number)', type:'text'},
 {key:'tcDate', label:'TC ದಿನಾಂಕ (TC Date)', type:'date'},
 // ---- ಗುರುತು ಸಂಖ್ಯೆಗಳು ----
 {key:'satsNo', label:'SATS ಸಂಖ್ಯೆ', type:'text'},
 {key:'aadharNo', label:'ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhar No)', type:'text'},
 {key:'penNo', label:'PEN / UDISE ಸಂಖ್ಯೆ', type:'text'},
 // ---- ಬ್ಯಾಂಕ್ ----
 {key:'bankName', label:'ಬ್ಯಾಂಕ್ ಹೆಸರು (Bank Name)', type:'text'},
 {key:'bankBranch', label:'ಶಾಖೆ (Branch)', type:'text'},
 {key:'bankAcc', label:'ಖಾತೆ ಸಂಖ್ಯೆ (Account No)', type:'text'},
 {key:'ifsc', label:'IFSC ಕೋಡ್', type:'text'},
 // ---- ಶಾಲೆ ಬಿಡುವಿಕೆ (ಬಿಟ್ಟ ಮೇಲೆ ತುಂಬಿ) ----
 {key:'leavingDate', label:'ಶಾಲೆ ಬಿಟ್ಟ ದಿನಾಂಕ (Date of Leaving)', type:'date'},
 {key:'leavingClass', label:'ಬಿಟ್ಟ ತರಗತಿ (Class at Leaving)', type:'text'},
 {key:'leavingReason', label:'ಬಿಟ್ಟ ಕಾರಣ (Reason for Leaving)', type:'text'},
];

let STOCK_TAB=STOCK_CATS[0].key;

const BILL_FLOWS={
  main:['Draft','Sent to Principal','Approved','Payment Order Generated','Paid','Closed'],
  mainByWarden:['Draft','Sent to FDA','FDA Approved','Sent to Principal','Approved','Payment Order Generated','Paid','Closed'],
  joint:['Draft','Sent to Warden','Warden Approved','Sent to Principal','Principal Approved','DC Bill Generated','Payment Order Generated','Paid','Closed'],
};

var CB_MONTH=null;

var EXP_FY=null, EXP_MONTH='all';

const EXP_SRC={bill:'ಬಿಲ್',import:'ನಗದು ಪುಸ್ತಕ ಆಮದು',entry:'ನಮೂದು'};

const PC_SUBJECTS=[
  {kn:'ಕನ್ನಡ',en:'KANNADA',key:'Kannada'},
  {kn:'ಆಂಗ್ಲ',en:'ENGLISH',key:'English'},
  {kn:'ಹಿಂದಿ',en:'HINDI',key:'Hindi'},
  {kn:'ಗಣಿತಶಾಸ್ತ್ರ',en:'MATHEMATICS',key:'Mathematics'},
  {kn:'ಸಮಾಜ ವಿಜ್ಞಾನ',en:'SOCIAL SCIENCE',key:'Social Science'},
  {kn:'ವಿಜ್ಞಾನ',en:'SCIENCE',key:'Science'},
  {kn:'ದೈಹಿಕ ಶಿಕ್ಷಣ',en:'PHYSICAL EDUCATION',key:'Physical Education'},
  {kn:'ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ',en:'COMPUTER EDUCATION',key:'Computer Science'},
  {kn:'SUPW',en:'SUPW',key:'Drawing'},
];

const NS_ITEMS=[
  {kn:'ಭಾವನಾತ್ಮಕ ಸಾಮಾಜಿಕ ಕೌಶಲ್ಯಗಳು',en:'EMOTIONAL SOCIAL SKILLS',key:'emotionalSocialSkills'},
  {kn:'ಸಾಂಸ್ಥಿಕ ಕೌಶಲ್ಯಗಳು',en:'ORGANIZATIONAL SKILLS',key:'organizationalSkills'},
  {kn:'ವೈಜ್ಞಾನಿಕ ಕೌಶಲ್ಯಗಳು',en:'SCIENTIFIC SKILLS',key:'scientificSkills'},
  {kn:'ಲಲಿತ ಕಲೆ',en:'FINE ART',key:'fineArt'},
  {kn:'ಸೃಜನಶೀಲತೆ',en:'CREATIVITY',key:'creativity'},
  {kn:'ಮನೋಧರ್ಮ',en:'TEMPERAMENT',key:'temperament'},
  {kn:'ಮೌಲ್ಯಗಳು',en:'VALUES',key:'values'},
];

const PC_MONTHS=[
  {label:'ಜೂನ್ / June',y:2025,m:6},{label:'ಜುಲೈ / July',y:2025,m:7},
  {label:'ಆಗಸ್ಟ್ / August',y:2025,m:8},{label:'ಸೆಪ್ಟೆಂಬರ್ / September',y:2025,m:9},
  {label:'ಅಕ್ಟೋಬರ್ / October',y:2025,m:10},{label:'ನವೆಂಬರ್ / November',y:2025,m:11},
  {label:'ಡಿಸೆಂಬರ್ / December',y:2025,m:12},{label:'ಜನವರಿ / January',y:2026,m:1},
  {label:'ಫೆಬ್ರವರಿ / February',y:2026,m:2},{label:'ಮಾರ್ಚ್ / March',y:2026,m:3},
  {label:'ಏಪ್ರಿಲ್ / April',y:2026,m:4},
];

const PC_WORKFLOW=['Generated','Sent to Class Teacher','Class Teacher Signed','Sent to Principal','Principal Signed','Ready to Issue','Issued'];

const BULK_COLS=[
  {key:'studentName',   label:'ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು ಕನ್ನಡ (Student Name Kannada)',  required:true},
  {key:'studentNameEn', label:'Student Name English',              required:false},
  {key:'gender',        label:'ಲಿಂಗ (Gender: ಗಂಡು/ಹೆಣ್ಣು)',       required:true},
  {key:'dob',           label:'ಜನ್ಮ ದಿನಾಂಕ (DOB: YYYY-MM-DD)',    required:false},
  {key:'className',     label:'ತರಗತಿ (Class: 6/7/8/9/10)',         required:true},
  {key:'fatherName',    label:'ತಂದೆಯ ಹೆಸರು ಕನ್ನಡ (Father Name Kannada)', required:false},
  {key:'fatherNameEn',  label:'Father Name English',               required:false},
  {key:'motherName',    label:'ತಾಯಿಯ ಹೆಸರು ಕನ್ನಡ (Mother Name Kannada)', required:false},
  {key:'motherNameEn',  label:'Mother Name English',               required:false},
  {key:'satsNo',        label:'SATS ಸಂಖ್ಯೆ (SATS No)',             required:false},
  {key:'aadharNo',      label:'ಆಧಾರ್ ಸಂಖ್ಯೆ (Aadhar No)',          required:false},
  {key:'height',        label:'ಎತ್ತರ cm (Height)',                  required:false},
  {key:'weight',        label:'ತೂಕ kg (Weight)',                    required:false},
  {key:'bloodGroup',    label:'ರಕ್ತದ ಗುಂಪು (Blood Group)',          required:false},
  {key:'address',       label:'ವಿಳಾಸ (Address)',                    required:false},
  {key:'mobile',        label:'ಮೊಬೈಲ್ (Mobile)',                    required:false},
  {key:'placeOfBirth',  label:'ಜನ್ಮಸ್ಥಳ (Place of Birth)',          required:false},
  {key:'taluk',         label:'ತಾಲ್ಲೂಕು (Taluk)',                   required:false},
  {key:'district',      label:'ಜಿಲ್ಲೆ (District)',                  required:false},
  {key:'religion',      label:'ಧರ್ಮ (Religion)',                    required:false},
  {key:'caste',         label:'ಜಾತಿ (Caste)',                       required:false},
  {key:'penNo',         label:'PEN ಸಂಖ್ಯೆ (PEN No)',               required:false},
  {key:'admissionDate', label:'ಪ್ರವೇಶ ದಿನಾಂಕ (Admission Date YYYY-MM-DD)', required:false},
];

let BULK_PREVIEW_DATA=[];

const FOOD_ITEMS_MASTER = [
  // Group A (1-43) — ಮುಖ್ಯ ಆಹಾರ ಪದಾರ್ಥಗಳು
  {id:'fA01',kn:'ಸಕ್ಕರೆ',en:'Sugar',group:'A',rate:40,unit:'ಕೆಜಿ'},
  {id:'fA02',kn:'ಉಪ್ಪಿಟ ರವಾ',en:'Upma Rave',group:'A',rate:35,unit:'ಕೆಜಿ'},
  {id:'fA03',kn:'ಅವಲಕ್ಕಿ',en:'Poha',group:'A',rate:37,unit:'ಕೆಜಿ'},
  {id:'fA04',kn:'ಇಡ್ಲಿ ರವಾ',en:'Idli Rave',group:'A',rate:35,unit:'ಕೆಜಿ'},
  {id:'fA05',kn:'ಸೈರ್ಯಕಾಂತಿ ಎಣ್ಣೆ',en:'Sunflower Oil',group:'A',rate:140,unit:'ಲೀ'},
  {id:'fA06',kn:'ಹೆಸರಕಾಳು',en:'Moong',group:'A',rate:86,unit:'ಕೆಜಿ'},
  {id:'fA07',kn:'ಅಲಸಂದಿ ಕಾಳು',en:'Black Eye Beans',group:'A',rate:75,unit:'ಕೆಜಿ'},
  {id:'fA08',kn:'ಹೆಸರಬೇಳೆ',en:'Moong Dal',group:'A',rate:100,unit:'ಕೆಜಿ'},
  {id:'fA09',kn:'ಶೇಂಗಾ ಕಾಳು',en:'Groundnut',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA10',kn:'ಉದ್ದಿನ ಬೇಳೆ',en:'Urad Dal',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA11',kn:'ಪುಟಾಣಿ',en:'Roasted Gram',group:'A',rate:80,unit:'ಕೆಜಿ'},
  {id:'fA12',kn:'ಕಡ್ಲೆ ಬೇಳೆ',en:'Channa Dal',group:'A',rate:75,unit:'ಕೆಜಿ'},
  {id:'fA13',kn:'ಹುಣಸೆಹಣ್ಣು',en:'Tamarind',group:'A',rate:85,unit:'ಕೆಜಿ'},
  {id:'fA14',kn:'ವಟಾಣಿ ಕಾಳು',en:'Green Peas',group:'A',rate:100,unit:'ಕೆಜಿ'},
  {id:'fA15',kn:'ಬೆಲ್ಲ',en:'Jaggery',group:'A',rate:40,unit:'ಕೆಜಿ'},
  {id:'fA16',kn:'ಚಹಾ ಪುಡಿ',en:'Tea Powder',group:'A',rate:225,unit:'ಕೆಜಿ'},
  {id:'fA17',kn:'ಜೀರಿಗೆ',en:'Cumin',group:'A',rate:220,unit:'ಕೆಜಿ'},
  {id:'fA18',kn:'ಸಾಸಿವೆ',en:'Mustard',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA19',kn:'ಯಾಲಕ್ಕಿ',en:'Cardamom',group:'A',rate:800,unit:'ಕೆಜಿ'},
  {id:'fA20',kn:'ಲವಂಗ',en:'Clove',group:'A',rate:599,unit:'ಕೆಜಿ'},
  {id:'fA21',kn:'ಶ್ಯಾವಿಗೆ',en:'Vermicelli',group:'A',rate:50,unit:'ಕೆಜಿ'},
  {id:'fA22',kn:'ತೊಗರಿಬೇಳೆ',en:'Toor Dal',group:'A',rate:90,unit:'ಕೆಜಿ'},
  {id:'fA23',kn:'ಮೆಣಸು ಕಾಳು',en:'Black Pepper',group:'A',rate:550,unit:'ಕೆಜಿ'},
  {id:'fA24',kn:'ಚಕ್ಕೆ',en:'Cinnamon',group:'A',rate:320,unit:'ಕೆಜಿ'},
  {id:'fA25',kn:'ಉಪ್ಪು',en:'Salt',group:'A',rate:10,unit:'ಕೆಜಿ'},
  {id:'fA26',kn:'ಒಣ ಮೆಣಸು',en:'Dry Chilli',group:'A',rate:220,unit:'ಕೆಜಿ'},
  {id:'fA27',kn:'ಕಡ್ಲೆಕಾಳು',en:'Chickpea',group:'A',rate:65,unit:'ಕೆಜಿ'},
  {id:'fA28',kn:'ಕಡ್ಲೆಹಿಟ್ಟು',en:'Gram Flour',group:'A',rate:80,unit:'ಕೆಜಿ'},
  {id:'fA29',kn:'ಅರಿಶಿಣ ಪುಡಿ',en:'Turmeric Powder',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA30',kn:'ಗೋಡಂಬಿ',en:'Cashew',group:'A',rate:680,unit:'ಕೆಜಿ'},
  {id:'fA31',kn:'ದ್ರಾಕ್ಷಿ',en:'Raisin',group:'A',rate:200,unit:'ಕೆಜಿ'},
  {id:'fA32',kn:'ಮೈದಾ ಹಿಟ್ಟು',en:'Maida',group:'A',rate:30,unit:'ಕೆಜಿ'},
  {id:'fA33',kn:'ಕಸಕಸೆ',en:'Poppy Seeds',group:'A',rate:900,unit:'ಕೆಜಿ'},
  {id:'fA34',kn:'ಎಳ್ಳು',en:'Sesame',group:'A',rate:150,unit:'ಕೆಜಿ'},
  {id:'fA35',kn:'ಒಣಕೊಬ್ಬರಿ',en:'Dry Coconut',group:'A',rate:190,unit:'ಕೆಜಿ'},
  {id:'fA36',kn:'ಹವೀಜ',en:'Havij',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA37',kn:'ಬಾದಮ ಪೌಡರ',en:'Badam Powder',group:'A',rate:150,unit:'ಕೆಜಿ'},
  {id:'fA38',kn:'ಮೆಂತ್ಯ',en:'Fenugreek',group:'A',rate:120,unit:'ಕೆಜಿ'},
  {id:'fA39',kn:'ಜಾಮೂನ ಮಿಕ್ಸ್',en:'Gulab Jamun Mix',group:'A',rate:215,unit:'ಕೆಜಿ'},
  {id:'fA40',kn:'ತುಪ್ಪ',en:'Ghee',group:'A',rate:375,unit:'ಕೆಜಿ'},
  {id:'fA41',kn:'ಉಪ್ಪಿನ ಕಾಯಿ',en:'Pickle',group:'A',rate:48,unit:'ಕೆಜಿ'},
  {id:'fA42',kn:'ಮಂಡಕ್ಕಿ',en:'Puffed Rice',group:'A',rate:58,unit:'ಕೆಜಿ'},
  {id:'fA43',kn:'ಇಂಗು',en:'Asafoetida',group:'A',rate:297,unit:'ಕೆಜಿ'},
  // Group B (43-64) — ತರಕಾರಿ & ಇತರ
  {id:'fB01',kn:'ಈರುಳ್ಳಿ',en:'Onion',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB02',kn:'ಬಟಾಟೆ',en:'Potato',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB03',kn:'ಕ್ಯಾರೆಟ್',en:'Carrot',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB04',kn:'ಹಸಿ ಮೆಣಸು',en:'Green Chilli',group:'B',rate:35,unit:'ಕೆಜಿ'},
  {id:'fB05',kn:'ಕೋಸು (ಕ್ಯಾಬೇಕ್ & ಫ್ಲವರ್)',en:'Cabbage/Cauliflower',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB06',kn:'ಬೆಂಡೆಕಾಯಿ',en:'Okra/Lady Finger',group:'B',rate:30,unit:'ಕೆಜಿ'},
  {id:'fB07',kn:'ತೊಂಡೆಕಾಯಿ',en:'Ivy Gourd',group:'B',rate:15,unit:'ಕೆಜಿ'},
  {id:'fB08',kn:'ಸೌತೆಕಾಯಿ',en:'Cucumber',group:'B',rate:22,unit:'ಕೆಜಿ'},
  {id:'fB09',kn:'ನುಗ್ಗೆಕಾಯಿ',en:'Drumstick',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB10',kn:'ಮೂಲಂಗಿ',en:'Radish',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB11',kn:'ಬದನೆಕಾಯಿ',en:'Brinjal',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB12',kn:'ಹೀರೆಕಾಯಿ',en:'Ridge Gourd',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB13',kn:'ಸೊಪ್ಪು',en:'Greens/Spinach',group:'B',rate:20,unit:'ಕೆಜಿ'},
  {id:'fB14',kn:'ಬೀನ್ಸ್',en:'Beans',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB15',kn:'ಬೀಟರೂಟ್',en:'Beetroot',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB16',kn:'ಟೊಮೆಟೋ',en:'Tomato',group:'B',rate:22,unit:'ಕೆಜಿ'},
  {id:'fB17',kn:'ಶುಂಠಿ',en:'Ginger',group:'B',rate:25,unit:'ಕೆಜಿ'},
  {id:'fB18',kn:'ಬೆಳ್ಳುಳ್ಳಿ',en:'Garlic',group:'B',rate:30,unit:'ಕೆಜಿ'},
  {id:'fB19',kn:'ಮೊಟ್ಟೆ',en:'Egg',group:'B',rate:5.5,unit:'ನಗ'},
  {id:'fB20',kn:'ಬಾಳೆ ಹಣ್ಣು',en:'Banana',group:'B',rate:3,unit:'ನಗ'},
  {id:'fB21',kn:'ಮಾಂಸ (ಚಿಕನ್)',en:'Chicken',group:'B',rate:150,unit:'ಕೆಜಿ'},
  {id:'fB22',kn:'ತೆಂಗಿನಕಾಯಿ',en:'Coconut',group:'B',rate:16,unit:'ನಗ'},
  // Group C (65-69) — ಅಕ್ಕಿ/ಗೋಧಿ/ಗ್ಯಾಸ್
  {id:'fC01',kn:'ಅಕ್ಕಿ',en:'Rice',group:'C',rate:7.5349,unit:'ಕೆಜಿ'},
  {id:'fC02',kn:'ಗೋಧಿ',en:'Wheat',group:'C',rate:6.252,unit:'ಕೆಜಿ'},
  {id:'fC03',kn:'ಗ್ಯಾಸ್ ಸಿಲಿಂಡರ್',en:'Gas Cylinder',group:'C',rate:919,unit:'ಸಿಲ'},
  {id:'fC04',kn:'ಹಾಲು',en:'Milk',group:'C',rate:46,unit:'ಲೀ'},
  {id:'fC05',kn:'ಮಿಲ್ಲಿಂಗ್ ಚಾರ್ಜ್',en:'Milling Charge',group:'C',rate:5,unit:'ಕೆಜಿ'},
];

const HOSTEL_ITEMS = [
  {id:'HI01', kn:'ಬೆಡ್ ಶೀಟ್', en:'Bed Sheet'},
  {id:'HI02', kn:'ತಲೆದಿಂಬು', en:'Pillow'},
  {id:'HI03', kn:'ಬೆಡ್', en:'Bed/Cot'},
  {id:'HI04', kn:'ಟ್ರಂಕ್', en:'Trunk'},
  {id:'HI05', kn:'ಸೊಳ್ಳೆ ಜಾಲರಿ', en:'Mosquito Net'},
  {id:'HI06', kn:'ಸೊಳ್ಳೆ ಕಾಯಿಲ್', en:'Mosquito Coil'},
  {id:'HI07', kn:'ತಟ್ಟೆ, ಲೋಟ, ಚಮಚ', en:'Plate, Cup, Spoon'},
  {id:'HI08', kn:'ವಿದ್ಯುತ್ ಸಾಮಗ್ರಿಗಳು', en:'Electrical Materials'},
  {id:'HI09', kn:'ಸಾಮಾನ್ಯ ಸಾಮಗ್ರಿ', en:'General Materials'},
  {id:'HI10', kn:'ಶುಚಿ ಕಿಟ್', en:'Cleanliness Kit'},
  {id:'HI11', kn:'ಸಂಭ್ರಮ ಕಿಟ್', en:'Celebration Kit'},
  {id:'HI12', kn:'ಕಂಬಳಿ', en:'Blanket'},
];

let SESSION_WARN_ID=null, SESSION_OUT_ID=null;

const SESSION_TIMEOUT=5*60*1000;

const SESSION_WARN=4*60*1000;

function resetSessionTimer(){
  if(!CURRENT_USER) return;
  clearTimeout(SESSION_WARN_ID);
  clearTimeout(SESSION_OUT_ID);
  SESSION_WARN_ID=setTimeout(()=>{
    if(CURRENT_USER) showToast('⚠ 1 ನಿಮಿಷದಲ್ಲಿ Auto Logout ಆಗುತ್ತದೆ — ಮುಂದುವರಿಯಲು ಏನಾದರೂ ಒತ್ತಿ',4000);
  }, SESSION_WARN);
  SESSION_OUT_ID=setTimeout(()=>{
    if(CURRENT_USER){
      doLogout();
      // Show timeout message on login screen
      setTimeout(()=>{
        const el=document.getElementById('loginMsg');
        if(el){ el.textContent=''; }
      },200);
    }
  }, SESSION_TIMEOUT);
}

['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(evt=>{
  document.addEventListener(evt, resetSessionTimer, {passive:true});
});

function normSats(v){ return String(v||'').replace(/\D/g,''); }

const MV_PUBLISHED=['Approved','FDA Acknowledged','Acknowledged'];   // public only after the principal's approval ('Frozen' = still waiting for the principal)

const MV_CARD_CSS=`
.mvcard{font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#1b2a3a;background:#fff;border:1.5px solid #1f3a5f;border-radius:6px;padding:14px 16px;font-size:12.5px;}
.mvcard .mv-head{text-align:center;border-bottom:2px solid #1f3a5f;padding-bottom:8px;margin-bottom:10px;}
.mvcard .mv-head .a{font-size:11px;letter-spacing:.3px;color:#44566b;}
.mvcard .mv-head .b{font-size:16px;font-weight:700;color:#1f3a5f;margin:2px 0;}
.mvcard .mv-head .c{font-size:13px;font-weight:700;margin-top:4px;}
.mvcard table{width:100%;border-collapse:collapse;}
.mvcard .mv-info td{padding:3px 6px;vertical-align:top;} .mvcard .mv-info td.k{color:#44566b;width:20%;white-space:nowrap;}
.mvcard .mv-exam{margin-top:12px;border:1px solid #9fb0c4;border-radius:4px;overflow:hidden;page-break-inside:avoid;}
.mvcard .mv-exam-title{background:#fff;color:#1f3a5f;border-bottom:1px solid #1f3a5f;padding:5px 10px;font-weight:800;font-size:13px;}
.mvcard .mv-t th{background:#e8eef6;padding:5px 6px;border:1px solid #9fb0c4;font-size:11.5px;text-align:center;}
.mvcard .mv-t td{padding:5px 6px;border:1px solid #c9d4e2;text-align:center;} .mvcard .mv-t td.l{text-align:left;}
.mvcard .mv-t tr.tot td{background:#f3f6fa;font-weight:700;}
.mvcard .g{display:inline-block;min-width:28px;padding:1px 6px;border-radius:10px;font-weight:700;background:#eef2f7;}
.mvcard .g.nc{background:#fdeceb;color:#b3261e;} .mvcard .g.ap{background:#e4f5ea;color:#1b7f3b;}
.mvcard .mv-res{padding:7px 10px;font-weight:700;} .mvcard .mv-res.pass{background:#e4f5ea;color:#1b7f3b;} .mvcard .mv-res.fail{background:#fdeceb;color:#b3261e;}
.mvcard .mv-legend{margin-top:12px;font-size:11px;color:#44566b;} .mvcard .mv-note{margin-top:6px;font-size:10.5px;color:#6b7a8c;}
`;

function downloadUploadedFile(id){
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  const a=document.createElement('a'); a.href=f.fileData; a.download=f.fileName; a.click();
  logAudit('Download','Upload',id,f.title); saveDB();
}

const DUTY_TYPES=[
  'ವರ್ಗ ಶಿಕ್ಷಕ (Class Teacher)',
  'ಇನ್ಛಾರ್ಜ್ ಪ್ರಾಂಶುಪಾಲ (I/C Principal)',
  'ಗ್ರಂಥಾಲಯ ಇನ್ಛಾರ್ಜ್ (Library I/C)',
  'ಕ್ರೀಡಾ ಇನ್ಛಾರ್ಜ್ (Sports I/C)',
  'ಪ್ರಯೋಗಾಲಯ ಇನ್ಛಾರ್ಜ್ (Lab I/C)',
  'ಕಂಪ್ಯೂಟರ್ ಇನ್ಛಾರ್ಜ್ (Computer I/C)',
  'ಪರೀಕ್ಷಾ ಇನ್ಛಾರ್ಜ್ (Exam I/C)',
  'ಸ್ವಚ್ಛತಾ ಇನ್ಛಾರ್ಜ್ (Sanitation I/C)',
  'ವಿದ್ಯಾರ್ಥಿ ಕಾಳಜಿ (Student Welfare)',
  'ಸಾಂಸ್ಕೃತಿಕ ಇನ್ಛಾರ್ಜ್ (Cultural I/C)',
  'ಇತರ (Other)',
];

function whatsAppReminderAll(reason){
  const msg=`ಪ್ರಿಯ ಸಿಬ್ಬಂದಿ,\n\nKREIS e-Office (http://mdrsshedbariesoffice.in) ನಲ್ಲಿ ${reason} ಕಾಯುತ್ತಿದೆ.\n\nದಯವಿಟ್ಟು Login ಆಗಿ ಪರಿಶೀಲಿಸಿ.\n\nMDRS Bhatkal (BC-265)`;
  // Open WhatsApp without a number — user copies and shares
  const encodedMsg=encodeURIComponent(msg);
  window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
}

function mkWA(mobile, name, reason){
  if(!mobile||mobile==='—'||mobile==='') return `<span class="small-muted">📵</span>`;
  const num=mobile.replace(/\D/g,'');
  const fn=num.startsWith('91')?num:'91'+num;
  const msg=encodeURIComponent(`ಪ್ರಿಯ ${name},\nKREIS e-Office ನಲ್ಲಿ ${reason} ಕಾಯುತ್ತಿದೆ.\nhttp://mdrsshedbariesoffice.in`);
  return `<a href="https://wa.me/${fn}?text=${msg}" target="_blank" class="btn btn-sm" style="background:#25D366;color:#fff;padding:3px 8px;font-size:11px;border-radius:5px;text-decoration:none;">📱 WhatsApp</a>`;
}

function openWhatsAppBroadcast(){
  document.getElementById('pwModalBg').classList.add('show');
  const staffWithMobile=STAFF.filter(s=>s.mobile&&s.mobile!=='—'&&s.mobile!=='');
  document.getElementById('pwModalBg').innerHTML=`<div class="modal" style="max-width:520px;max-height:80vh;overflow-y:auto;">
    <h3>📱 WhatsApp ಮೂಲಕ ತಿಳಿಸಿ</h3>
    <p style="font-size:12px;color:var(--muted);">ಸಿಬ್ಬಂದಿ Login ಆಗಿ Pending items ನೋಡಲು ನೆನಪಿಸಿ</p>
    <div class="table-wrap"><table><thead><tr>
      <th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>Mobile</th><th>Action</th>
    </tr></thead>
    <tbody>${staffWithMobile.map(s=>{
      const pending=DB.notifications.filter(n=>n.to===s.name&&!n.read).length;
      return `<tr>
        <td><b>${esc(s.name)}</b>${pending?` <span class="badge badge-warn" style="font-size:9px;">${pending} ಬಾಕಿ</span>`:''}</td>
        <td style="font-size:11px;">${esc(s.desig||'')}</td>
        <td><code>${esc(s.mobile)}</code></td>
        <td>${mkWA(s.mobile,s.name,'Pending notifications ಮತ್ತು Approvals')}</td>
      </tr>`;
    }).join('')}
    ${staffWithMobile.length===0?`<tr class="empty-row"><td colspan="4">ಮೊಬೈಲ್ ನಂಬರ್ ಇರುವ Staff ಇಲ್ಲ — Profile ನಲ್ಲಿ ಸೇರಿಸಿ</td></tr>`:''}
    </tbody></table></div>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="document.getElementById('pwModalBg').classList.remove('show')">Close</button>
      <button class="btn btn-primary" style="background:#25D366;border-color:#25D366;" onclick="whatsAppReminderAll('Pending Approvals / Notifications')">📢 Broadcast All</button>
    </div>
  </div>`;
}

function checkAdminChargeExpiry(){
  if(!DB.adminCharges) return;
  const today=todayStr();
  let changed=false;
  DB.adminCharges.forEach(c=>{
    if(c.active && c.toDate < today){ c.active=false; c.expiredAt=today; changed=true; }
  });
  if(changed) saveDB();
}

const LEAVE_TYPES=['CL (Casual Leave)','EL (Earned Leave)','HPL (Half Pay Leave)','RH (Restricted Holiday)','ML (Medical Leave)','MatL (Maternity Leave)'];
// CL and RH have their own separate page + register ("ನನ್ನ CL / RH ವಹಿ"); the general leave forms list the other types only
const LEAVE_TYPES_GEN=LEAVE_TYPES.filter(t=>!/^(CL|RH)\b/.test(t));

var LEAVE_PREVIEW=null;
// staff's own "Digitally signed by" stamp, entered automatically when the application is sent to the Principal
function leaveDupCheck(from,to){
  try{
    const f=from, t=to||from;
    const hit=(DB.leaveApplications||[]).find(l=>l.hrmsId===CURRENT_USER.hrmsId&&l.status!=='Rejected'&&l.status!=='Draft'&&l.fromDate&&(l.toDate||l.fromDate)&&l.fromDate<=t&&(l.toDate||l.fromDate)>=f);
    if(hit){ showToast('⚠ ಈಗಾಗಲೇ ಈ ದಿನಾಂಕಕ್ಕೆ ರಜೆ ಮಂಜೂರಾತಿಗಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ ('+fmtDate(hit.fromDate)+(hit.toDate&&hit.toDate!==hit.fromDate?' → '+fmtDate(hit.toDate):'')+')',6000); return true; }
  }catch(e){}
  return false;
}
function leaveStaffSign(l){ l.staffSignStamp=taStampText(new Date()); l.staffSignHost=location.host; return l; }
async function leaveLetterPdf(id){
  const l=(id==='preview')?LEAVE_PREVIEW:(DB.leaveApplications||[]).find(x=>x.id===id); if(!l) return;
  if(typeof html2canvas==='undefined'||typeof PDFLib==='undefined'){ showToast('⚠ PDF Library ಲೋಡ್ ಆಗಿಲ್ಲ — Internet ಪರಿಶೀಲಿಸಿ',4000); return; }
  showToast('⏳ PDF ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...');
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;box-sizing:border-box;padding:48px 52px;background:#fff;color:#000;';
  host.innerHTML=buildLeaveLetterHTML(l); document.body.appendChild(host);
  try{
    try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; }catch(e){}
    const canvas=await html2canvas(host,{scale:2,backgroundColor:'#ffffff',useCORS:true});
    const pdf=await PDFLib.PDFDocument.create(); const W=595.28,H=841.89;
    const pageH=Math.floor(canvas.width*H/W); const n=Math.max(1,Math.ceil(canvas.height/pageH));
    for(let i=0;i<n;i++){
      const part=document.createElement('canvas'); part.width=canvas.width; part.height=Math.min(pageH,canvas.height-i*pageH);
      const cx=part.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,part.width,part.height);
      cx.drawImage(canvas,0,i*pageH,canvas.width,part.height,0,0,canvas.width,part.height);
      const img=await pdf.embedJpg(part.toDataURL('image/jpeg',0.92));
      const pg=pdf.addPage([W,H]); const h=W*part.height/part.width;
      pg.drawImage(img,{x:0,y:H-h,width:W,height:h});
    }
    const blob=new Blob([await pdf.save()],{type:'application/pdf'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='Leave_'+String(l.leaveType||'CL').split(' ')[0]+'_'+String(l.staffName||'').replace(/[^A-Za-z0-9]+/g,'_')+'_'+(l.fromDate||'')+(l.status==='Approved'?'_Approved':'')+'.pdf';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
    showToast('✅ PDF Download ಆಯಿತು');
  }catch(e){ console.warn(e); showToast('⚠ PDF ಆಗಲಿಲ್ಲ: '+e.message,5000); }
  host.remove();
}

function printLeaveLetterById(id){
  const l=(DB.leaveApplications||[]).find(x=>x.id===id); if(!l) return;
  const wrap=document.getElementById('leavePrintWrap')||document.getElementById('content');
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-primary" onclick="leaveLetterPdf('${l.id}')">⬇ PDF Download</button>
      <button class="btn btn-outline" onclick="navigate(CURRENT_PAGE||'leavemgmt')">✕</button>
    </div>
    ${buildLeaveLetterHTML(l)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function renderLeaveApprove(){
  if(!DB.leaveApplications) DB.leaveApplications=[];
  const pending=DB.leaveApplications.filter(l=>l.status==='Sent to Principal');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✅ ರಜೆ ಅರ್ಜಿ ಅನುಮೋದನೆ</h2>
    <div class="desc">Principal — ಸಿಬ್ಬಂದಿ ರಜೆ ಅರ್ಜಿ ಪರಿಶೀಲಿಸಿ E-Sign ಮಾಡಿ</div></div>

    ${!pending.length?'<div class="panel"><div class="small-muted" style="text-align:center;padding:20px;">✅ ಅನುಮೋದಿಸಲು ಯಾವ ರಜೆ ಅರ್ಜಿ ಇಲ್ಲ.</div></div>':''}
    ${pending.map(l=>`<div class="panel">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;">${esc(l.staffName)} — ${esc(l.leaveType)}</h3>
          <div class="small-muted">${fmtDate(l.fromDate)} ರಿಂದ ${fmtDate(l.toDate)} (${l.days} ದಿನ)</div>
          <div class="small-muted">ಕಾರಣ: ${esc(l.reason)}</div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="printLeaveLetterById('${l.id}')">👁 Preview</button>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="approveLeave('${l.id}')">✅ ಮಂಜೂರು & E-Sign</button>
        <button class="btn btn-red btn-sm" onclick="rejectLeave('${l.id}')">✕ ತಿರಸ್ಕರಿಸು</button>
      </div>
    </div>`).join('')}
    <div id="leavePrintWrap"></div>`;
}

const DOC_FILE_CATS=[
  {key:'govtOrdersFile', label:'ಸರ್ಕಾರಿ ಆದೇಶಗಳ ಕಡತ (Govt Orders File)', ic:'🏛️', color:'#1a3a5c'},
  {key:'kreisLettersFile', label:'KREIS ಪತ್ರಗಳ ಕಡತ (KREIS Letters File)', ic:'📜', color:'#c0392b'},
  {key:'eduDeptFile', label:'ಶಿಕ್ಷಣ ಇಲಾಖೆ ಪತ್ರಗಳ ಕಡತ (Edu Dept File)', ic:'📚', color:'#27ae60'},
  {key:'otherDeptFile', label:'ಇತರ ಇಲಾಖೆ ಪತ್ರಗಳ ಕಡತ (Other Dept File)', ic:'📂', color:'#8e44ad'},
  {key:'leaveLettersFile', label:'ರಜೆ ಪತ್ರಗಳ ಕಡತ (Leave Letters File)', ic:'📅', color:'#e67e22'},
];

const _origRenderLeaveApprove = typeof renderLeaveApprove !== 'undefined' ? renderLeaveApprove : null;


/* ================= CL / RH — separate application + per-staff register =================
   Credit: 15 CL + 2 RH every calendar year (Jan-Dec). Balance = credit - days of Principal-approved leave in that year
   (deducted automatically on approval, because the register is computed from approved applications).
   The year changes at midnight 31 Dec -> 1 Jan: a fresh 15 CL + 2 RH, and the old year's unused balance does NOT carry (lapses).
================================================================================================ */
var CLR_YEAR=null, CLR_STAFF=null;
function clrYear(){ return String(CLR_YEAR||new Date().getFullYear()); }
function clrHrms(){ return CLR_STAFF||CURRENT_USER.hrmsId; }
function clrSet(k,v){ if(k==='y') CLR_YEAR=v; else CLR_STAFF=v; renderClRegister(); }
function clBalText(l){
  const sh=String(l.leaveType||'').split(' ')[0];
  if(sh!=='CL'&&sh!=='RH') return '';
  const r=lrRow(sh,String(l.fromDate||'').slice(0,4),{hrmsId:l.hrmsId});
  return ' | '+sh+' ಉಳಿದ ಶಿಲ್ಕು: '+r.bal+' / '+r.op;
}
function clrPrint(type){ LR_TAB=type; LR_YEAR=clrYear(); lrPrintStaff(clrHrms()); }
function clrCalcDays(){
  const f=document.getElementById('clr_from')?.value, t=document.getElementById('clr_to')?.value;
  const el=document.getElementById('clr_days');
  if(f&&t&&t>=f&&el) el.value=Math.round((new Date(t)-new Date(f))/86400000)+1;
  clrCheckBal();
}
function clrCheckBal(){
  const ty=document.getElementById('clr_type')?.value||'CL', f=document.getElementById('clr_from')?.value||todayStr();
  const r=lrRow(ty,f.slice(0,4),{hrmsId:CURRENT_USER.hrmsId});
  const pend=(DB.leaveApplications||[]).filter(l=>l.hrmsId===CURRENT_USER.hrmsId&&l.status==='Sent to Principal'&&String(l.leaveType).startsWith(ty)&&(l.fromDate||'').startsWith(f.slice(0,4))).reduce((a,l)=>a+Number(l.days||0),0);
  const el=document.getElementById('clr_info');
  if(el) el.innerHTML='<b style="color:'+(r.bal-pend>0?'var(--green)':'var(--red)')+';">'+ty+' ಶಿಲ್ಕು: '+r.bal+' ದಿನ</b> ('+f.slice(0,4)+')'+(pend?' · ಅನುಮೋದನೆ ಬಾಕಿ: '+pend+' ದಿನ':'');
}
function clrPreview(){
  const ty=document.getElementById('clr_type').value;
  const fake=leaveStaffSign({id:'preview',appNo:'PREVIEW',hrmsId:CURRENT_USER.hrmsId,staffName:CURRENT_USER.name,staffDesig:CURRENT_USER.desig||'',
    leaveType:LR_TYPES[ty].full,fromDate:document.getElementById('clr_from').value,toDate:document.getElementById('clr_to').value,
    days:document.getElementById('clr_days').value||1,reason:document.getElementById('clr_reason').value||'ವೈಯಕ್ತಿಕ ಕಾರಣ',
    place:document.getElementById('clr_place').value||'ಭಟ್ಕಳ',createdAt:todayStr(),status:'Draft',principalSigned:false});
  LEAVE_PREVIEW=fake;
  const w=document.getElementById('clrPreviewWrap'); if(!w) return;
  w.innerHTML=`<div class="panel" id="printArea"><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
    <button class="btn btn-primary" onclick="leaveLetterPdf('preview')">⬇ PDF Download</button>
    <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
    <button class="btn btn-outline" onclick="document.getElementById('clrPreviewWrap').innerHTML=''">✕</button></div>${buildLeaveLetterHTML(fake)}</div>`;
  w.scrollIntoView({behavior:'smooth'});
}
function clrApply(){
  const ty=document.getElementById('clr_type').value, from=document.getElementById('clr_from').value, to=document.getElementById('clr_to').value;
  const days=Number(document.getElementById('clr_days').value||0), reason=(document.getElementById('clr_reason').value||'').trim();
  const place=document.getElementById('clr_place').value||'ಭಟ್ಕಳ';
  if(!from||!to||!reason){ showToast('⚠ ದಿನಾಂಕ ಮತ್ತು ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  if(to<from||days<=0){ showToast('⚠ ದಿನಾಂಕಗಳು ಸರಿಯಿಲ್ಲ'); return; }
  if(leaveDupCheck(from,to)) return;
  if(from.slice(0,4)!==to.slice(0,4)){ showToast('⚠ ಡಿಸೆಂಬರ್–ಜನವರಿ ದಾಟುವ ರಜೆಯನ್ನು ವರ್ಷವಾರು ಎರಡು ಅರ್ಜಿಗಳಾಗಿ ಸಲ್ಲಿಸಿ',5000); return; }
  const yr=from.slice(0,4), r=lrRow(ty,yr,{hrmsId:CURRENT_USER.hrmsId});
  const pend=(DB.leaveApplications||[]).filter(l=>l.hrmsId===CURRENT_USER.hrmsId&&l.status==='Sent to Principal'&&String(l.leaveType).startsWith(ty)&&(l.fromDate||'').startsWith(yr)).reduce((a,l)=>a+Number(l.days||0),0);
  if(days>r.bal-pend){ showToast('⚠ '+ty+' ಶಿಲ್ಕು ಸಾಕಾಗುವುದಿಲ್ಲ — ಉಳಿದಿರುವುದು '+(r.bal-pend)+' ದಿನ ಮಾತ್ರ',5000); return; }
  const leaveType=LR_TYPES[ty].full;
  if(!DB.leaveApplications) DB.leaveApplications=[];
  const appNo='ಮೊದೇವಶಾ/ರಜೆ/'+nextSeq('leave')+'/'+(new Date().getFullYear());
  const _newId=uid();
  DB.leaveApplications.push(leaveStaffSign({id:_newId,appNo,hrmsId:CURRENT_USER.hrmsId,staffName:CURRENT_USER.name,staffDesig:CURRENT_USER.desig||'',
    leaveType,fromDate:from,toDate:to,days,reason,place,contact:CURRENT_USER.mobile||'',createdAt:todayStr(),status:'Sent to Principal',
    principalSigned:false,principalName:null,principalSignedAt:null,rejectedReason:null}));
  saveDB();
  const pr=STAFF.find(x=>x.role==='principal');
  if(pr) pushNotification(pr.name,'📅 ರಜೆ ಅರ್ಜಿ: '+CURRENT_USER.name+' — '+leaveType+' | '+fmtDate(from)+' ರಿಂದ '+fmtDate(to)+' ('+days+' ದಿನ) | "ರಜೆ ಅರ್ಜಿ ಅನುಮೋದನೆ" ನಲ್ಲಿ Sign ಮಾಡಿ');
  showToast('✅ ಅರ್ಜಿ ಕಳುಹಿಸಲಾಗಿದೆ (ನಿಮ್ಮ Digital ಸಹಿ ಸ್ವಯಂ ಸೇರಿದೆ) — '+appNo);
  renderClRegister();
  leaveLetterPdf(_newId); // staff copy of the signed letter as PDF
}
function renderClRegister(){
  const h=clrHrms(), year=clrYear(), viewer=CURRENT_USER.role==='fda'||CURRENT_USER.role==='principal';
  const mine=(h===CURRENT_USER.hrmsId);
  const st=STAFF.find(x=>x.hrmsId===h)||CURRENT_USER;
  const now=new Date().getFullYear();
  const yrs=Array.from(new Set([String(now)].concat((DB.leaveApplications||[]).filter(l=>l.hrmsId===h).map(l=>String(l.fromDate||'').slice(0,4)).filter(Boolean)))).sort().reverse();
  const today=todayStr();
  const card=(ty)=>{ const r=lrRow(ty,year,{hrmsId:h});
    return `<div class="stat-card" style="min-width:150px;border-top:3px solid ${r.bal>0?'var(--green)':'var(--red)'};">
      <div class="n" style="font-size:26px;color:${r.bal>0?'var(--green)':'var(--red)'};">${r.bal}</div>
      <div class="l" style="font-size:11px;">${ty} ಉಳಿದ ಶಿಲ್ಕು (${year})</div>
      <div style="font-size:10px;color:var(--muted);">ಜಮಾ ${r.op} − ಬಳಸಿದ ${r.used}</div></div>`; };
  const table=(ty)=>{
    const r=lrRow(ty,year,{hrmsId:h}); let run=r.op;
    const pend=(DB.leaveApplications||[]).filter(l=>l.hrmsId===h&&l.status==='Sent to Principal'&&String(l.leaveType).startsWith(ty)&&(l.fromDate||'').startsWith(year));
    return `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
      <h3 style="margin:0;">${esc(LR_TYPES[ty].name)} — ${year}</h3>
      <button class="btn btn-sm btn-gold" onclick="clrPrint('${ty}')">🖨️ Print / PDF</button></div>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಿನಾಂಕದಿಂದ</th><th>ದಿನಾಂಕದವರೆಗೆ</th><th>ಜಮಾ</th><th>ಬಳಕೆ</th><th>ಶಿಲ್ಕು</th><th>ಅರ್ಜಿ ಸಂ. / ಕಾರಣ</th><th>ಅನುಮೋದನೆ</th><th></th></tr></thead><tbody>
      <tr style="background:var(--green-tint);"><td>—</td><td colspan="2">${fmtDate(year+'-01-01')} — ವರ್ಷದ ಆರಂಭ (ಹೊಸ ಜಮಾ)</td><td><b>+${r.op}</b></td><td></td><td><b>${r.op}</b></td><td colspan="3" class="small-muted">ಹಿಂದಿನ ವರ್ಷದ ಉಳಿದ ಶಿಲ್ಕು ಸೇರುವುದಿಲ್ಲ (ರದ್ದು)</td></tr>
      ${r.led.map((x,i)=>{ run-=x.days; return `<tr><td>${i+1}</td><td>${fmtDate(x.from)}</td><td>${fmtDate(x.to)}</td><td></td><td><b>−${x.days}</b></td><td><b>${run}</b></td><td style="font-size:11px;">${esc(x.ref)}<br>${esc(x.remarks)}</td><td style="font-size:11px;">✅ ${esc(x.by)}<br>${fmtDate(x.at)}</td><td>${x.id?`<button class="btn btn-sm btn-primary" onclick="leaveLetterPdf('${x.id}')">⬇ PDF</button>`:''}</td></tr>`; }).join('')}
      ${pend.map(l=>`<tr style="background:#fffbe6;"><td>⏳</td><td>${fmtDate(l.fromDate)}</td><td>${fmtDate(l.toDate)}</td><td></td><td>(${l.days})</td><td>—</td><td style="font-size:11px;">${esc(l.appNo||'')}<br>${esc(l.reason||'')}</td><td style="font-size:11px;">Principal ಅನುಮೋದನೆ ಬಾಕಿ</td><td></td></tr>`).join('')}
      </tbody></table></div></div>`; };
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📅 CL / RH ರಜೆ ಅರ್ಜಿ & ವಹಿ</h2>
    <div style="margin:4px 0 8px;"><button class="btn btn-sm btn-outline" onclick="navigate('leavemgmt')">📋 ಇತರ ರಜೆ (HPL / ML / MatL) ಮತ್ತು ಎಲ್ಲಾ ಅರ್ಜಿಗಳು →</button></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <label style="font-size:12px;">ವರ್ಷ: <select onchange="clrSet('y',this.value)">${yrs.map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select></label>
      ${viewer?`<label style="font-size:12px;">ಸಿಬ್ಬಂದಿ: <select onchange="clrSet('s',this.value)">${STAFF.filter(x=>x.role!=='admin').map(x=>`<option value="${esc(x.hrmsId)}" ${x.hrmsId===h?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`:''}
      <b style="font-size:13px;">${esc(st.name||'')}</b> <span class="small-muted">${esc(st.desig||'')}</span>
    </div>
    <div class="cards-grid">${card('CL')}${card('RH')}</div>
    ${mine&&year===String(now)?`<div class="panel"><h3>➕ CL / RH ರಜೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ರಜೆ ಪ್ರಕಾರ <span class="req-star">*</span></label>
          <select id="clr_type" onchange="clrCheckBal()"><option value="CL">CL (Casual Leave)</option><option value="RH">RH (Restricted Holiday)</option></select></div>
        <div class="field"><label>ಪ್ರಾರಂಭ ದಿನಾಂಕ <span class="req-star">*</span></label><input type="date" id="clr_from" value="${today}" onchange="clrCalcDays()"></div>
        <div class="field"><label>ಅಂತ್ಯ ದಿನಾಂಕ <span class="req-star">*</span></label><input type="date" id="clr_to" value="${today}" onchange="clrCalcDays()"></div>
        <div class="field"><label>ದಿನಗಳು</label><input id="clr_days" value="1" readonly style="background:var(--surface-2);font-weight:700;"><div id="clr_info" style="font-size:11px;margin-top:3px;"></div></div>
        <div class="field"><label>ಕಾರಣ <span class="req-star">*</span></label><input id="clr_reason" placeholder="ವೈಯಕ್ತಿಕ ಕಾರಣ"></div>
        <div class="field"><label>ಸ್ಥಳ (Place)</label><input id="clr_place" placeholder="ಊರು/ನಗರ"></div>
      </div>
      <div class="form-actions"><button class="btn btn-gold" onclick="clrPreview()">👁 Preview & ⬇ PDF</button><button class="btn btn-primary" onclick="clrApply()">📤 Principal ಗೆ ಕಳುಹಿಸಿ</button></div>
      <div id="clrPreviewWrap"></div></div>`:''}
    ${table('CL')}${table('RH')}`;
  if(mine) clrCheckBal();
}


/* ===== ಸಿಬ್ಬಂದಿ ರಜೆ ವಹಿ (Principal + FDA): all staff leave applications + CL / RH month-wise report ===== */
var LSR_TAB='reg', LSR_YEAR=null, LSR_STATUS='', LSR_TYPE='', LSR_Q='', LSR_MON='';
function lsrSet(k,v){ if(k==='tab') LSR_TAB=v; else if(k==='y') LSR_YEAR=v; else if(k==='st') LSR_STATUS=v; else if(k==='ty') LSR_TYPE=v; else if(k==='q') LSR_Q=v; else if(k==='m') LSR_MON=v; renderLeaveStaffReg(); }
function lsrStamp(l){ return (l.staffSignStamp||'').slice(0,16); }
function renderLeaveStaffReg(){
  const year=String(LSR_YEAR||new Date().getFullYear());
  if(!LSR_MON) LSR_MON=String(new Date().getMonth()+1).padStart(2,'0');
  const isP=CURRENT_USER.role==='principal';
  const tabs=[['reg','📒 ರಜೆ ಅರ್ಜಿಗಳ ವಹಿ'],['CL','📅 CL ಮಾಸಿಕ ವರದಿ'],['RH','📅 RH ಮಾಸಿಕ ವರದಿ']];
  const yrs=Array.from(new Set([String(new Date().getFullYear())].concat((DB.leaveApplications||[]).map(l=>String(l.fromDate||'').slice(0,4)).filter(Boolean)))).sort().reverse();
  const mnames=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
  let body='';
  if(LSR_TAB==='reg'){
    let list=(DB.leaveApplications||[]).filter(l=>String(l.fromDate||'').startsWith(year));
    if(LSR_STATUS) list=list.filter(l=>l.status===LSR_STATUS);
    if(LSR_TYPE) list=list.filter(l=>String(l.leaveType).startsWith(LSR_TYPE));
    if(LSR_Q) list=list.filter(l=>String(l.staffName||'').toLowerCase().includes(LSR_Q.toLowerCase()));
    list=list.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))||0);
    const pend=(DB.leaveApplications||[]).filter(l=>l.status==='Sent to Principal').length;
    body=`${pend?`<div class="note" style="background:var(--gold-tint);border-color:var(--gold);">🔔 ${pend} ಅರ್ಜಿ(ಗಳು) ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇವೆ</div>`:''}
    <div class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <select onchange="lsrSet('st',this.value)"><option value="">ಎಲ್ಲಾ ಸ್ಥಿತಿ</option>${['Sent to Principal','Approved','Rejected'].map(x=>`<option ${LSR_STATUS===x?'selected':''}>${x}</option>`).join('')}</select>
      <select onchange="lsrSet('ty',this.value)"><option value="">ಎಲ್ಲಾ ರಜೆ ಪ್ರಕಾರ</option>${['CL','RH','EL','HPL','ML','MatL'].map(x=>`<option ${LSR_TYPE===x?'selected':''}>${x}</option>`).join('')}</select>
      <input placeholder="ಹೆಸರು ಹುಡುಕಿ..." value="${esc(LSR_Q)}" onchange="lsrSet('q',this.value)" style="padding:6px;border:1px solid var(--border);border-radius:6px;">
    </div>
    <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಅರ್ಜಿ ಸಂ.</th><th>ಸಿಬ್ಬಂದಿ</th><th>ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ದಿನ</th><th>ಸ್ಥಿತಿ</th><th>ಸಿಬ್ಬಂದಿ ಸಹಿ</th><th>ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</th><th>Action</th></tr></thead><tbody>
    ${list.length?list.map((l,i)=>`<tr${l.status==='Sent to Principal'?' style="background:#fffbe6;"':''}><td>${i+1}</td><td style="font-size:11px;">${esc(l.appNo||'')}</td><td><b>${esc(l.staffName)}</b></td><td>${esc(String(l.leaveType).split(' ')[0])}</td>
      <td>${fmtDate(l.fromDate)} → ${fmtDate(l.toDate)}</td><td><b>${l.days}</b></td>
      <td><span class="badge ${l.status==='Approved'?'badge-ok':l.status==='Rejected'?'badge-bad':'badge-info'}">${esc(l.status)}</span></td>
      <td style="font-size:10px;">${l.staffSignStamp?'✅ '+esc(l.staffSignStamp):'—'}</td>
      <td style="font-size:10px;">${l.principalSigned?'✅ '+esc(l.principalName||'')+'<br>'+esc(l.principalSignStamp||fmtDate(l.principalSignedAt)):'—'}</td>
      <td class="actions-cell"><button class="btn btn-sm btn-gold" onclick="printLeaveLetterById('${l.id}')">👁</button>
        <button class="btn btn-sm btn-primary" onclick="leaveLetterPdf('${l.id}')">⬇ PDF</button>
        ${isP&&l.status==='Sent to Principal'?`<button class="btn btn-sm btn-primary" onclick="approveLeave('${l.id}')">✅ ಮಂಜೂರು</button><button class="btn btn-sm btn-red" onclick="rejectLeave('${l.id}')">✕</button>`:''}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="10">ಯಾವ ಅರ್ಜಿಯೂ ಇಲ್ಲ.</td></tr>'}
    </tbody></table></div><div id="leavePrintWrap"></div></div>`;
  } else {
    const type=LSR_TAB, rows=lrMonthRows(type,year,LSR_MON), tot=rows.reduce((a,r)=>a+r.used,0);
    body=`<div class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <label style="font-size:12px;">ತಿಂಗಳು: <select id="lr_pm" onchange="lsrSet('m',this.value)">${mnames.map((m,i)=>{const v=String(i+1).padStart(2,'0');return `<option value="${v}" ${LSR_MON===v?'selected':''}>${m}</option>`;}).join('')}</select></label>
      <button class="btn btn-gold" onclick="LR_TAB='${type}';LR_YEAR='${year}';lrPrintMonth()">🖨️ ಮಾಸಿಕ ವರದಿ Print / PDF</button>
      <button class="btn btn-outline" onclick="LR_TAB='${type}';LR_YEAR='${year}';lrPrint()">🖨️ ವಾರ್ಷಿಕ ಶಿಲ್ಕು ಪಟ್ಟಿ</button></div>
    <h3 style="margin:0 0 8px;">${esc(LR_TYPES[type].name)} — ${mnames[+LSR_MON-1]} ${year}</h3>
    <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಸಿಬ್ಬಂದಿ</th><th>ತಿಂಗಳ ಆರಂಭ ಶಿಲ್ಕು</th><th>ಈ ತಿಂಗಳ ರಜೆ</th><th>ಬಳಕೆ</th><th>ತಿಂಗಳ ಅಂತ್ಯ ಶಿಲ್ಕು</th></tr></thead><tbody>
    ${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.s.name)}</b><br><span class="small-muted">${esc(r.s.desig||'')}</span></td><td>${r.openM}</td>
      <td style="font-size:11px;">${r.inM.length?r.inM.map(x=>fmtDate(x.from)+(x.to&&x.to!==x.from?' → '+fmtDate(x.to):'')+' ('+x.days+')').join('<br>'):'—'}</td><td><b>${r.used}</b></td><td><b>${r.bal}</b></td></tr>`).join('')}
    <tr><td colspan="4" style="text-align:right;"><b>ಒಟ್ಟು</b></td><td><b>${tot}</b></td><td></td></tr></tbody></table></div></div>`;
  }
  document.getElementById('content').innerHTML=`<div class="page-head"><h2>📒 ಸಿಬ್ಬಂದಿ ರಜೆ ವಹಿ & CL / RH ಮಾಸಿಕ ವರದಿ</h2>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      ${tabs.map(t=>`<button class="btn btn-sm ${LSR_TAB===t[0]?'btn-primary':'btn-outline'}" onclick="lsrSet('tab','${t[0]}')">${t[1]}</button>`).join('')}
      <label style="font-size:12px;margin-left:auto;">ವರ್ಷ: <select onchange="lsrSet('y',this.value)">${yrs.map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select></label></div>
    ${body}`;
}

const LEAVE_LIMITS={
  'CL (Casual Leave)': 15,
  'EL (Earned Leave)': 30,  // FDA updates per staff from manual register
  'HPL (Half Pay Leave)': 20,
  'RH (Restricted Holiday)': 2,
  'ML (Medical Leave)': 10,
  'MatL (Maternity Leave)': 180,
};

const INWARD_FILE_MAP=[
  {keywords:['ಸರ್ಕಾರ','government','govt','G.O.','GO-','ಸರಕಾರ'], file:'govtOrdersFile'},
  {keywords:['kreis','KREIS','ವಸತಿ ಶಿಕ್ಷಣ','KRES'], file:'kreisLettersFile'},
  {keywords:['ಶಿಕ್ಷಣ ಇಲಾಖೆ','education','DEd','DDPI','BEO','ಡಿಡಿಪಿ','ಶಿಕ್ಷಣ'], file:'eduDeptFile'},
];

function calcDashLeaveDays(){
  const from=document.getElementById('dlv_from')?.value;
  const to=document.getElementById('dlv_to')?.value;
  if(from&&to&&to>=from){
    const days=Math.round((new Date(to)-new Date(from))/(86400000))+1;
    const el=document.getElementById('dlv_days'); if(el) el.value=days;
  }
}

function updateDashLeaveBalance(){
  const type=document.getElementById('dlv_type')?.value||'';
  const yr=todayStr().slice(0,4);
  const limit=LEAVE_LIMITS[type]||0;
  const used=(DB.leaveApplications||[]).filter(l=>l.hrmsId===CURRENT_USER.hrmsId&&l.leaveType===type&&l.status==='Approved'&&(l.fromDate||'').startsWith(yr)).reduce((a,l)=>a+Number(l.days||0),0);
  const rem=limit-used;
  const el=document.getElementById('dlv_balance_info');
  if(el) el.innerHTML=`<b style="color:${rem>0?'var(--green)':'var(--red)'};">${rem} ದಿನ ಉಳಿದಿದೆ</b> (${used}/${limit} ಬಳಸಿದ — ${yr})`;
}

function submitDashLeave(){
  const leaveType=document.getElementById('dlv_type')?.value;
  const fromDate=document.getElementById('dlv_from')?.value;
  const toDate=document.getElementById('dlv_to')?.value;
  const days=document.getElementById('dlv_days')?.value||'1';
  const reason=document.getElementById('dlv_reason')?.value?.trim();
  const place=document.getElementById('dlv_place')?.value||'ಭಟ್ಕಳ';
  if(!fromDate||!toDate||!reason){ showToast('⚠ ದಿನಾಂಕ ಮತ್ತು ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  if(leaveDupCheck(fromDate,toDate)) return;
  if(!DB.leaveApplications) DB.leaveApplications=[];
  const appNo='ಮೊದೇವಶಾ/ರಜೆ/'+nextSeq('leave')+'/'+(new Date().getFullYear());
  const leave={
    id:uid(), appNo, hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
    staffDesig:CURRENT_USER.desig||'', leaveType, fromDate, toDate,
    days:Number(days), reason, place,
    contact:CURRENT_USER.mobile||'', createdAt:todayStr(),
    status:'Sent to Principal',
    principalSigned:false, principalName:null, principalSignedAt:null, rejectedReason:null
  };
  DB.leaveApplications.push(leaveStaffSign(leave)); saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📅 ರಜೆ ಅರ್ಜಿ: '+CURRENT_USER.name+' — '+leaveType+
    ' | '+fmtDate(fromDate)+' ರಿಂದ '+fmtDate(toDate)+' ('+days+' ದಿನ) | "ರಜೆ ಅರ್ಜಿ ಅನುಮೋದನೆ" ನಲ್ಲಿ Sign ಮಾಡಿ');
  showToast('✅ ರಜೆ ಅರ್ಜಿ ಕಳುಹಿಸಲಾಗಿದೆ — '+appNo);
  navigate('dashboard');
}

function previewDashLeave(){
  const leaveType=document.getElementById('dlv_type')?.value||'';
  const fromDate=document.getElementById('dlv_from')?.value||'';
  const toDate=document.getElementById('dlv_to')?.value||'';
  const days=document.getElementById('dlv_days')?.value||'1';
  const reason=document.getElementById('dlv_reason')?.value||'ವೈಯಕ್ತಿಕ ಕಾರಣ';
  const place=document.getElementById('dlv_place')?.value||'ಭಟ್ಕಳ';
  const fake={id:'preview',appNo:'PREVIEW',hrmsId:CURRENT_USER.hrmsId,
    staffName:CURRENT_USER.name,staffDesig:CURRENT_USER.desig||'',
    leaveType,fromDate,toDate,days,reason,place,
    createdAt:todayStr(),status:'Draft',principalSigned:false};
  const wrap=document.getElementById('dashLeavePrintWrap'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-outline" onclick="document.getElementById('dashLeavePrintWrap').innerHTML=''">✕</button>
    </div>
    ${buildLeaveLetterHTML(fake)}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function buildLeaveLetterHTML(l){
  const shortType=(l.leaveType||'CL').split(' ')[0];
  return `<div class="leave-letter-print" style="font-size:13.5px;font-family:var(--font-kn);line-height:2.2;max-width:680px;margin:0 auto;">

    <table style="width:100%;margin-bottom:20px;font-size:13px;">
      <tr><td style="width:50%;vertical-align:top;">ಅರ್ಜಿ ಸಂ: <b>${esc(l.appNo||'—')}</b></td>
          <td style="text-align:right;">ದಿನಾಂಕ: <b>${fmtDate(l.createdAt||todayStr())}</b></td></tr>
    </table>

    <!-- FROM section -->
    <div style="margin-bottom:18px;">
      <b>ಇಂದ :</b><br>
      <div style="margin-left:16px;margin-top:4px;">
        ${esc(l.staffName)}<br>
        ${esc(l.staffDesig)}<br>
        HRMS ಸಂ: <b>${esc(l.hrmsId)}</b><br>
        ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಭಟ್ಕಳ
      </div>
    </div>

    <!-- TO section -->
    <div style="margin-bottom:18px;">
      <b>ಗೆ :</b><br>
      <div style="margin-left:16px;margin-top:4px;">
        ಪ್ರಾಂಶುಪಾಲರು<br>
        ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ<br>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ<br>
        ಉತ್ತರ ಕನ್ನಡ – 581320
      </div>
    </div>

    <div style="margin-bottom:10px;"><b>ಮಾನ್ಯರೇ,</b></div>

    <div style="margin-bottom:14px;">
      <b>ವಿಷಯ : ${esc(shortType)} ರಜೆ ಮಂಜೂರು ಮಾಡುವ ಕುರಿತು.</b>
    </div>

    <div style="text-align:justify;margin-bottom:20px;line-height:2.4;">
      ಮೇಲ್ಕಂಡ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, <b>${esc(l.reason||'ವೈಯಕ್ತಿಕ ಕಾರಣ')}</b>ದಿಂದ ದಿನಾಂಕ <b>${fmtDate(l.fromDate)}</b> ರಿಂದ <b>${fmtDate(l.toDate)}</b> ರವರೆಗೆ ಒಟ್ಟು <b>${l.days}</b> ದಿನಗಳ <b>${esc(l.leaveType)}</b> ರಜೆ ಅಗತ್ಯವಿರುವುದರಿಂದ ಸದರಿ ಅವಧಿಗೆ ರಜೆ ಮಂಜೂರು ಮಾಡಿಕೊಡಬೇಕಾಗಿ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
    </div>

    <div style="margin-bottom:24px;">ಧನ್ಯವಾದಗಳು.</div>

    <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12.5px;">
      <div>
        <div>ಸ್ಥಳ : <b>${esc(l.place||'ಭಟ್ಕಳ')}</b></div>
        <div>ದಿನಾಂಕ : <b>${fmtDate(l.createdAt||todayStr())}</b></div>
        ${l.contact?`<div style="margin-top:6px;">ರಜೆ ಅವಧಿ ಸಂಪರ್ಕ: <b>${esc(l.contact)}</b></div>`:''}
      </div>
      <div style="text-align:${l.staffSignStamp?'right':'center'};min-width:220px;">
        <div style="margin-bottom:${l.staffSignStamp?'6px':'30px'};">ತಮ್ಮ ವಿಶ್ವಾಸಿ,</div>
        ${l.staffSignStamp?`<div style="line-height:1.9;"><b>${esc(l.staffName)}</b><br>${esc(l.staffDesig)}<br>HRMS: ${esc(l.hrmsId)}</div>
        <div style="margin-top:8px;">${cbDigiSign({signedBy:l.staffName,signStamp:l.staffSignStamp,signHost:l.staffSignHost||location.host,signDesig:l.staffDesig||'Staff'},'','Leave application submitted')}</div>`:`<div style="border-top:1px solid #000;padding-top:6px;">
          (ಸಹಿ)<br>
          <b>${esc(l.staffName)}</b><br>
          ${esc(l.staffDesig)}<br>
          HRMS: ${esc(l.hrmsId)}
        </div>`}
      </div>
    </div>

    ${l.principalSigned||l.status==='Approved'?`
    <div style="margin-top:24px;font-size:12.5px;">
      <div style="margin-bottom:8px;"><b>ಪ್ರಾಂಶುಪಾಲರಿಂದ ಅನುಮೋದಿಸಲಾಗಿದೆ (Approved by Principal)</b><br>
        ರಜೆ ಅವಧಿ: <b>${fmtDate(l.fromDate)}</b> ರಿಂದ <b>${fmtDate(l.toDate)}</b> (<b>${l.days}</b> ದಿನ)</div>
      ${principalSignatureHTML(l.principalName, l.principalSignedAt, fmtDate(l.principalSignedAt||''), l.principalSignStamp?{stamp:l.principalSignStamp,host:l.principalSignHost}:{})}
    </div>`:l.status==='Rejected'?`
    <div style="margin-top:16px;padding:10px;background:#fde8e8;border:1px solid var(--red);border-radius:8px;font-size:12px;">
      ❌ <b>ರಜೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ</b> — ${esc(l.rejectedReason||'')}
    </div>`:''}
  </div>`;
}

function approveLeave(id){
  const l=DB.leaveApplications.find(x=>x.id===id); if(!l) return;
  l.status='Approved'; l.principalSigned=true;
  l.principalName=CURRENT_USER.name; l.principalSignedAt=todayStr(); l.principalSignStamp=taStampText(new Date()); l.principalSignHost=location.host;
  syncAttendanceFromLeave(l);

  // Save to Leave Letters File with proper entry (accessible from FDA + Principal docfiles)
  if(!DB.leaveLettersFile) DB.leaveLettersFile=[];
  const lfNo='LF-'+String(DB.leaveLettersFile.length+1).padStart(3,'0')+'/'+new Date().getFullYear();
  DB.leaveLettersFile.push({
    id:uid(), leaveId:id, fileNo:lfNo,
    subject:'ರಜೆ ಅರ್ಜಿ — '+l.staffName+' ('+l.leaveType+') | '+fmtDate(l.fromDate)+' → '+fmtDate(l.toDate),
    staffName:l.staffName, leaveType:l.leaveType, fromDate:l.fromDate, toDate:l.toDate, days:l.days,
    approvedBy:CURRENT_USER.name, approvedAt:todayStr(),
    status:'Filed', addedBy:CURRENT_USER.name, addedAt:todayStr()
  });

  saveDB();

  // Notify staff — their approved letter appears in leavemgmt
  pushNotification(l.staffName,
    '✅ ರಜೆ ಮಂಜೂರು: '+l.leaveType+' | '+fmtDate(l.fromDate)+' → '+fmtDate(l.toDate)+
    ' ('+l.days+' ದಿನ) | ಅರ್ಜಿ ಸಂ: '+l.appNo+clBalText(l)+
    ' | "ರಜೆ ನಿರ್ವಹಣೆ / CL-RH ವಹಿ" ನಲ್ಲಿ PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ'
  );

  // Notify FDA — copy in their leave file
  staffNamesForRole('fda').forEach(n=>pushNotification(n,
    '📋 ರಜೆ Copy: '+l.staffName+' — '+l.leaveType+
    ' | '+fmtDate(l.fromDate)+' → '+fmtDate(l.toDate)+
    ' | ಕಡತ: '+lfNo+
    ' | "ದಾಖಲೆ ಕಡತಗಳು → ರಜೆ ಪತ್ರ ಕಡತ" ನಲ್ಲಿ ನೋಡಿ'
  ));

  showToast('✅ ರಜೆ ಮಂಜೂರು — '+l.staffName+' | Copy: FDA + Principal ಕಡತ ('+lfNo+')');
  navigate('leaveapprove');
  printLeaveLetterById(id); // show the approved letter right away with ⬇ PDF Download
}

function rejectLeave(id){
  const l=DB.leaveApplications.find(x=>x.id===id); if(!l) return;
  const reason=prompt('ತಿರಸ್ಕರಿಸಿದ ಕಾರಣ (ಕಡ್ಡಾಯ):')||'';
  if(!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  l.status='Rejected'; l.rejectedReason=reason; saveDB();
  pushNotification(l.staffName,
    '❌ ರಜೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ: '+l.leaveType+' | '+fmtDate(l.fromDate)+' → '+fmtDate(l.toDate)+
    ' | ಕಾರಣ: '+reason
  );
  showToast('↩ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'); navigate('leaveapprove');
}

function dismissNotice(id, save){
  const n=DB.noticeBoard.find(x=>x.id===id); if(!n) return;
  if(save){
    // Save to My Files before dismissing
    if(!DB.staffFiles) DB.staffFiles=[];
    DB.staffFiles.push({
      id:uid(), hrmsId:CURRENT_USER.hrmsId, staffName:CURRENT_USER.name,
      category:'notices', title:'Notice: '+n.text.slice(0,60),
      fileData:n.fileData||null, fileName:n.fileName||null, fileType:n.fileType||null,
      note:n.text, fromName:n.fromName, savedAt:todayStr(), sourceId:id
    });
    showToast('💾 My Files ಗೆ Save ಆಗಿದೆ');
  }
  if(!n.dismissedBy) n.dismissedBy=[];
  n.dismissedBy.push(CURRENT_USER.hrmsId);
  saveDB();
  navigate('noticeboard');
}

const STAFF_FILE_CATS=[
  {key:'govtorders', label:'ಸರ್ಕಾರಿ ಆದೇಶಗಳು', ic:'🏛️', color:'#1a3a5c'},
  {key:'kreisorders', label:'KREIS ಆದೇಶಗಳು', ic:'📜', color:'#8B1A1A'},
  {key:'eduorders', label:'ಶಿಕ್ಷಣ ಇಲಾಖೆ', ic:'📚', color:'#2C6B2F'},
  {key:'circulars', label:'ಸುತ್ತೋಲೆಗಳು (Circulars)', ic:'🔄', color:'#6A1B9A'},
  {key:'general', label:'ಸಾಮಾನ್ಯ ಸೂಚನೆಗಳು (General)', ic:'📢', color:'#00695C'},
  {key:'otherorders', label:'ಇತರ ಇಲಾಖೆ', ic:'📂', color:'#7B4F00'},
  {key:'notices', label:'Notice Archive', ic:'📌', color:'#5A5A5A'},
];

function renderNoticeBoardWidget(){
  if(!DB.noticeBoard) DB.noticeBoard=[];
  const myNotices=DB.noticeBoard.filter(n=>{
    if(!(n.to==='all'||n.to===CURRENT_USER.hrmsId)) return false;
    return !(n.dismissedBy||[]).includes(CURRENT_USER.hrmsId);
  }).slice(0,5);

  const hasNew=myNotices.length>0;
  const blinkStyle=hasNew?'animation:notifBlink 2s infinite;border:2px solid var(--red);':'border:2px solid var(--border);';

  return `<div class="panel" style="${blinkStyle}border-radius:10px;padding:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <h3 style="margin:0;color:${hasNew?'var(--red)':'var(--navy)'};">
        📌 ನೋಟಿಸ್ ಬೋರ್ಡ್ (Notice Board)
        ${hasNew?`<span class="badge" style="background:var(--red);color:#fff;margin-left:6px;font-size:11px;">${myNotices.length}</span>`:''}
      </h3>
      <button class="btn btn-sm btn-outline" onclick="navigate('noticeboard')" style="font-size:11px;">ಎಲ್ಲಾ ನೋಡಿ →</button>
    </div>
    ${hasNew ? myNotices.map(n=>`
      <div style="background:#fff9f0;border-left:3px solid ${n.to===CURRENT_USER.hrmsId?'var(--red)':'var(--gold)'};padding:8px 10px;margin-bottom:6px;border-radius:4px;font-size:12.5px;position:relative;">
        <div style="font-size:10px;color:var(--muted);margin-bottom:3px;">📤 ${esc(n.fromName)} | ${fmtDate(n.createdAt)} ${n.to===CURRENT_USER.hrmsId?'<span style="color:var(--red);font-weight:700;">• ನಿಮಗೆ ಮಾತ್ರ</span>':'• ಎಲ್ಲಾ Staff'}</div>
        <div style="font-family:var(--font-kn);line-height:1.6;">${esc(n.text.slice(0,120))}${n.text.length>120?'...':''}</div>
        ${n.fileData?`<button class="btn btn-sm btn-gold" style="margin-top:5px;font-size:10px;" onclick="(()=>{const a=document.createElement('a');a.href='${n.fileData}';a.download='${esc(n.fileName||'notice')}';a.click();})()">📎 ${esc(n.fileName||'')}</button>`:''}
        <div style="display:flex;gap:5px;margin-top:6px;">
          <button class="btn btn-sm btn-red" style="font-size:10px;padding:2px 8px;" onclick="dismissNotice('${n.id}',false)">✕ Remove</button>
          <button class="btn btn-sm btn-outline" style="font-size:10px;padding:2px 8px;" onclick="dismissNotice('${n.id}',true)">💾 Save & Remove</button>
        </div>
      </div>`).join('') :
    `<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px;">
      ✅ ಯಾವ ನೋಟಿಸ್ ಇಲ್ಲ — FDA ಕಳುಹಿಸಿದಾಗ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ
    </div>`}
    <div style="font-size:9.5px;color:var(--muted);text-align:right;margin-top:4px;">ಗರಿಷ್ಠ 5 ನೋಟಿಸ್ | Remove ಮಾಡಿದ ನಂತರ ಮತ್ತೆ ಹೊಸದು ಕಾಣಿಸುತ್ತದೆ</div>
  </div>`;
}

function checkMODReminder(){
  if(!DB.modEntries||!CURRENT_USER) return;
  const today=todayStr();
  DB.modEntries.forEach(mod=>{
    const staffList=mod.staffList||[];
    const myEntry=staffList.find(s=>s.hrmsId===CURRENT_USER.hrmsId||s.name===CURRENT_USER.name);
    if(!myEntry) return;
    const alreadySigned=(mod.acknowledgements||[]).some(a=>a.hrmsId===CURRENT_USER.hrmsId||a.staffName===CURRENT_USER.name);
    if(myEntry.modDate===today&&!alreadySigned){
      // Blink notification
      const existing=(DB.notifications||[]).find(n=>n.modReminder&&n.modId===mod.id&&n.to===CURRENT_USER.name);
      if(!existing) pushNotification(CURRENT_USER.name,'🔴 ಇಂದು MOD ದಿನ! '+mod.title+' | 8 PM ನಂತರ Sign ಮಾಡಿ — "MOD ಕರ್ತವ್ಯ" ನಲ್ಲಿ ನೋಡಿ');
    }
  });
}

const CURRENT_ACADEMIC_YEAR = (()=>{
  const now=new Date(); const y=now.getFullYear();
  return now.getMonth()>=5 ? `${y}-${String(y+1).slice(-2)}` : `${y-1}-${String(y).slice(-2)}`;
})();

function renderMODDashWidget(){
  if(!DB.modEntries) return '';
  const today=todayStr();
  const myPendingMOD=DB.modEntries.filter(mod=>
    (mod.staffList||[]).some(s=>(s.hrmsId===CURRENT_USER.hrmsId||s.name===CURRENT_USER.name)&&
    !(mod.acknowledgements||[]).some(a=>a.hrmsId===CURRENT_USER.hrmsId||a.staffName===CURRENT_USER.name))
  );
  const myPendingSTI=(DB.stiEntries||[]).filter(e=>e.staffHrmsId===CURRENT_USER.hrmsId&&!e.staffSigned&&e.dutyDate<=today);
  if(!myPendingMOD.length&&!myPendingSTI.length) return '';

  return `<div class="panel" style="border:2px solid var(--navy);">
    <h3 style="margin-bottom:10px;color:var(--navy);">📋 Pending Duties</h3>
    ${myPendingMOD.map(mod=>{
      const s=(mod.staffList||[]).find(x=>x.hrmsId===CURRENT_USER.hrmsId||x.name===CURRENT_USER.name)||{};
      const isToday=s.modDate===today;
      return `<div style="background:${isToday?'#fff3f3':'#f0f4ff'};border-left:3px solid ${isToday?'var(--red)':'var(--navy)'};padding:8px 10px;margin-bottom:6px;border-radius:4px;cursor:pointer;" onclick="navigate('modstaffview')">
        <b>📋 MOD${isToday?` <span class="badge" style="background:var(--red);color:#fff;animation:notifBlink 1s infinite;font-size:9px;">ಇಂದು!</span>`:''}:</b> ${esc(mod.title||mod.month)}<br>
        <span style="font-size:11px;">📅 ${fmtDate(s.modDate)} | 8PM+ GPS Sign → <u>MOD ಕರ್ತವ್ಯ</u></span>
      </div>`;
    }).join('')}
    ${myPendingSTI.map(e=>`<div style="background:#f3f0ff;border-left:3px solid #7c3aed;padding:8px 10px;margin-bottom:6px;border-radius:4px;cursor:pointer;" onclick="navigate('mystistaffview')">
      <b>📚 STI${e.dutyDate===today?` <span class="badge" style="background:var(--red);color:#fff;animation:notifBlink 1s infinite;font-size:9px;">ಇಂದು!</span>`:''}:</b> ಸ್ಟಡಿ ಟೈಮ್ ಇನ್ಚಾರ್ಜ್<br>
      <span style="font-size:11px;">📅 ${fmtDate(e.dutyDate)} | 8PM+ 2 GPS Photos → <u>STI ಕರ್ತವ್ಯ</u></span>
    </div>`).join('')}
  </div>`;
}

function nicStampText(signedAt,signedDate){
  const a=String(signedDate||'').trim(), b=String(signedAt||'').trim();
  return (a&&b&&a!==b&&!b.includes(a))?(a+' '+b):(a||b);
}
// NIC e-Office style "Digitally signed by" block (replaces the old signature-image boxes)
function principalSignatureHTML(signedName, signedAt, signedDate, opts={}){
  return cbDigiSign({signedBy:signedName,signStamp:opts.stamp||nicStampText(signedAt,signedDate),signHost:opts.host||location.host,signIp:opts.ip,signDevice:opts.device,signDesig:'Principal'},'',opts.reason||'Approved');
}
const NON_TEACHING_KEYWORDS=['nurse','security','watchman','peon','sweeper','cook','group-d','group d','driver','guard'];

const EDU_SUBJECT_MAP=[['hindi','Hindi'],['english','English'],['mathematics','Mathematics'],['maths','Mathematics'],
  ['social','Social Science'],['computer','Computer'],['physical','Physical Education'],
  ['kannada','Kannada'],['drawing','Drawing'],['art','Drawing'],['science','Science']];

function logAudit(action, entityType, entityId, details){
  if(!DB.auditLogs) DB.auditLogs=[];
  DB.auditLogs.push({
    id:uid(), action, entityType, entityId,
    byName:CURRENT_USER.name, byHrmsId:CURRENT_USER.hrmsId,
    at:todayStr(), ts:Date.now(), time:new Date().toLocaleTimeString('en-IN'), details:details||''
  });
  if(DB.auditLogs.length>800) DB.auditLogs=DB.auditLogs.slice(-800);
}

var SERVER_DATE_OFFSET=null;

let EDU_EDIT_ID=null;

const EDU_LABELS={
  lesson:{title:'ಲೆಸನ್ ಪ್ಲಾನ್ (Lesson Plan)', store:'lessonPlans', ic:'📘', prefix:'LP'},
  year:{title:'ಇಯರ್ ಪ್ಲಾನ್ (Year Plan)', store:'yearPlans', ic:'🗓️', prefix:'YP'},
};

let MENTOR_CART=[];

const MENTOR_HDR_KEYS={sats:['sats'],name:['student name','name','ಹೆಸರು'],className:['class','ತರಗತಿ'],gender:['gender','ಲಿಂಗ'],mentor:['mentor teacher','mentor','ಮೆಂಟರ್'],dob:['dob','date of birth','birth','ಜನ್ಮ']};

let CURRENT_MENTOR_STUDENT_ID=null;

const KN_MONTHS=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];

const ATT_STATUS_LABELS={
  Present:'✅ ಹಾಜರಿ', CL:'CL', RH:'RH', EL:'EL', ML:'ML', HPL:'HPL', MatL:'MatL',
  OD:'🚗 OD', OOD:'🚗 OOD', 'Technical Problem':'⚠ Technical', Absent:'❌ ಗೈರು'
};

const ATT_MANUAL_TYPES=['Present','OD','OOD','CL','RH','EL','ML','HPL','MatL','Technical Problem','Absent'];

const ROLE_ORDER={principal:0,fda:1,warden:2,staff:3};

function getAttendanceRecord(date, hrmsId){
  return (DB.dailyAttendance||[]).find(a=>a.date===date && a.hrmsId===hrmsId);
}

function getOrCreateAttendance(date, hrmsId, staffName){
  if(!Array.isArray(DB.dailyAttendance)) DB.dailyAttendance=[];
  let rec=getAttendanceRecord(date, hrmsId);
  if(!rec){
    rec={ id:uid(), date, hrmsId, staffName,
      morningStatus:null, morningSignedAt:null, morningSignedDate:null, morningServerTime:false,
      afternoonStatus:null, afternoonSignedAt:null, afternoonSignedDate:null, afternoonServerTime:false,
      enteredBy:null, fdaName:null, fdaHrmsId:null, reason:null, remarks:null,
      odFor:null, odPlace:null, odReason:null, fileData:null, fileName:null,
      staffResponse:null, staffResponseNote:null, staffResponseAt:null,
      createdAt:todayStr() };
    DB.dailyAttendance.push(rec);
  }
  return rec;
}

var _signBusy=false;

var CURRENT_AREG_DATE=null;

function syncAttendanceFromLeave(leave){
  if(!leave.fromDate||!leave.toDate) return;
  const shortType=(leave.leaveType||'').split(' ')[0]; // 'CL (Casual Leave)' -> 'CL'
  const start=new Date(leave.fromDate), end=new Date(leave.toDate);
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const dateStr=d.toISOString().slice(0,10);
    const rec=getOrCreateAttendance(dateStr, leave.hrmsId, leave.staffName);
    rec.morningStatus=shortType; rec.afternoonStatus=shortType;
    rec.morningSignedDate=todayStr(); rec.afternoonSignedDate=todayStr();
    rec.enteredBy='leave'; rec.reason='Leave Approved — '+leave.leaveType; rec.staffResponse='Accepted';
  }
  logAudit('Edit','Attendance',leave.hrmsId,`Leave sync — ${shortType} — ${leave.fromDate} to ${leave.toDate}`);
}

function init(){
  loadDB(); // Load from localStorage first (instant)
  loadSession();
  loadHeaderImages();
  setTimeout(checkURLVerification, 500);
  setTimeout(()=>{ try{ if(typeof visitorTrack==='function') visitorTrack(); }catch(e){} }, 2500);
  document.getElementById('footerYear').textContent=new Date().getFullYear();
  updateClock(); setInterval(updateClock,30000);
  if(CURRENT_USER && staffByName(CURRENT_USER.name)){
    enterApp();
  }
  ['loginHrms','loginPass','loginCaptchaA'].forEach(id=>document.getElementById(id).addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); }));
  newLoginCaptcha();

  // After local load, sync with Supabase in background — fully silent, no popup
  setTimeout(async()=>{
    try{
      const updated = await loadFromSupabase();
      if(updated){ migrateDB(); refreshVisibleUI(); }
    }catch(e){ console.warn('Background sync failed:',e); }
    startAutoSync();
  }, 1200);
}

function openSyncDiagnostics(){
  const el=document.getElementById('cloudChip');
  if(CURRENT_USER && ['fda','principal'].includes(CURRENT_USER.role)) navigate('supabase');
  else showToast(el&&el.title?el.title:'ಸಿಂಕ್ ತಾನಾಗಿ ನಡೆಯುತ್ತದೆ');
}

window.addEventListener('beforeprint',()=>{
  if(!document.getElementById('elHost')&&!document.getElementById('pcxHost')){
    // printed straight from the screen (Ctrl+P): swap in the isolated A4 print host first
    const sw=document.querySelector('.el-wrap'), pw=document.querySelector('.pcx-wrap');
    const src=sw||pw;
    if(src){ const host=document.createElement('div'); host.id=sw?'elHost':'pcxHost'; host.innerHTML=src.outerHTML; document.body.appendChild(host);
      if(pw&&!sw) pcMakeQRs(host);
      document.body.classList.add(sw?'el-printing':'pcx-printing');
      window.addEventListener('afterprint',function d(){ document.body.classList.remove('el-printing','pcx-printing'); host.remove(); window.removeEventListener('afterprint',d); }); }
  }
  if(!document.getElementById('regHost')&&typeof CURRENT_PAGE!=='undefined'&&CURRENT_PAGE==='leavereport'&&LR_TAB!=='MONTH'&&typeof lrPrintHtml==='function'){
    const type=LR_TAB, year=lrYear(); const host=document.createElement('div'); host.id='regHost';
    host.innerHTML=lrPrintHtml(type,year,lrStaff().map(s=>lrRow(type,year,s))); document.body.appendChild(host); document.body.classList.add('reg-printing');
    window.addEventListener('afterprint',function d(){ document.body.classList.remove('reg-printing'); host.remove(); window.removeEventListener('afterprint',d); });
  }
  if(document.body.classList.contains('reg-printing')){
    document.body.classList.remove('print-only-area');
    let st0=document.getElementById('dynPageStyle'); if(!st0){ st0=document.createElement('style'); st0.id='dynPageStyle'; document.head.appendChild(st0); }
    st0.textContent=document.body.classList.contains('reg-land')?'@page{size:A4 landscape;margin:0}':'@page{size:A4 portrait;margin:0}'; return;
  }
  const own=document.body.classList.contains('el-printing')||document.body.classList.contains('pcx-printing');
  document.body.classList.toggle('print-only-area', !own && !!document.getElementById('printArea'));
  let st=document.getElementById('dynPageStyle');
  if(!st){ st=document.createElement('style'); st.id='dynPageStyle'; document.head.appendChild(st); }
  if(own){ st.textContent='@page{size:A4 portrait;margin:0}'; return; }
  const ta=!!document.querySelector('.ta-page');
  document.body.classList.toggle('ta-printing',ta);
  if(ta){ st.textContent='@page{size:A4 landscape;margin:0}'; return; }
  st.textContent=document.querySelector('.print-landscape')?'@page{size:A4 landscape;margin:8mm}':'@page{size:A4;margin:10mm}';
});

window.addEventListener('afterprint',()=>document.body.classList.remove('print-only-area'));

;(window.__LOADED=window.__LOADED||[]).push('core');
