/* =====================================================================
   KREIS e-Office v35 — finance.js
   ಹಣಕಾಸು — DC bills, cash book, budget, monthly expenditure
   ===================================================================== */
function billSteps(account, bill){
  if(account==='main' && bill && bill.createdByRole==='warden'){
    // Warden creates a Main Account bill → FDA verifies → Principal approves
    return [
      {from:'Draft',to:'Sent to FDA',role:'warden',btn:'FDA ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Sent to FDA',to:'FDA Approved',role:'fda',btn:'Verify / Approve'},
      {from:'Sent to FDA',to:'Rejected',role:'fda',btn:'Reject'},
      {from:'FDA Approved',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Sent to Principal',to:'Approved',role:'principal',btn:'Approve'},
      {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
      {from:'Approved',to:'Payment Order Generated',role:'fda',btn:'Payment Order Generate'},
      {from:'Payment Order Generated',to:'Paid',role:'fda',btn:'Cash/Bank Book Entry'},
      {from:'Paid',to:'Closed',role:'fda',btn:'Close Transaction'},
    ];
  }
  if(account==='main') return [
    {from:'Draft',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
    {from:'Sent to Principal',to:'Approved',role:'principal',btn:'Approve'},
    {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
    {from:'Approved',to:'Payment Order Generated',role:'fda',btn:'Payment Order Generate'},
    {from:'Payment Order Generated',to:'Paid',role:'fda',btn:'Cash/Bank Book Entry'},
    {from:'Paid',to:'Closed',role:'fda',btn:'Close Transaction'},
  ];
  return [
    {from:'Draft',to:'Sent to Warden',role:'fda',btn:'Warden ಗೆ ಕಳುಹಿಸಿ'},
    {from:'Sent to Warden',to:'Warden Approved',role:'warden',btn:'Verify / Approve'},
    {from:'Sent to Warden',to:'Rejected',role:'warden',btn:'Reject'},
    {from:'Warden Approved',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
    {from:'Sent to Principal',to:'Principal Approved',role:'principal',btn:'Approve'},
    {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
    {from:'Principal Approved',to:'DC Bill Generated',role:'fda',btn:'DC Bill Generate'},
    {from:'DC Bill Generated',to:'Payment Order Generated',role:'fda',btn:'Payment Order Generate'},
    {from:'Payment Order Generated',to:'Paid',role:'fda',btn:'Cash/Bank Book Entry'},
    {from:'Paid',to:'Closed',role:'fda',btn:'Close Transaction'},
  ];
}

function renderBills(){
  const canCreate=['fda','warden'].includes(CURRENT_USER.role);
  const isWarden=CURRENT_USER.role==='warden';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಬಿಲ್ ಪಾವತಿ (DC ಬಿಲ್ ಕವರ್)</h2></div>
    ${finImportHtml('DC Bill Register')}
    ${canCreate?`<div class="panel"><h3>➕ ಹೊಸ ಬಿಲ್ ನಮೂದು</h3>
      <div class="form-grid">
        <div class="field"><label>ಬ್ಯಾಂಕ್ ಖಾತೆ</label><select id="bill_account" onchange="refreshBillHeads()" ${isWarden?'disabled':''}>
          ${isWarden?`<option value="main">${esc(ACCOUNTS.main.name)} (${ACCOUNTS.main.id})</option>`:`
          <option value="main">${esc(ACCOUNTS.main.name)} (${ACCOUNTS.main.id})</option>
          <option value="joint">${esc(ACCOUNTS.joint.name)} (${ACCOUNTS.joint.id})</option>`}
        </select></div>
        <div class="field"><label>ಪಾವತಿದಾರರ ಹೆಸರು</label><input id="bill_payee"></div>
        <div class="field"><label>ಬಿಲ್ ಸಂಖ್ಯೆ</label><input id="bill_no"></div>
        <div class="field"><label>ಬಿಲ್ ದಿನಾಂಕ</label><input type="date" id="bill_date" value="${todayStr()}"></div>
        <div class="field"><label>ಮೊತ್ತ (₹)</label><input type="number" id="bill_amount"></div>
        <div class="field"><label>ಖಾತೆ ಶೀರ್ಷಿಕೆ (Head)</label><select id="bill_head">${(isWarden?ACCOUNTS.main:ACCOUNTS.main).heads.map(h=>`<option>${esc(h)}</option>`).join('')}</select></div>
        <div class="field"><label>ಚೆಕ್ ಸಂಖ್ಯೆ</label><input id="bill_cheque"></div>
        <div class="field"><label>ವೌಚರ್ ಸಂಖ್ಯೆ</label><input id="bill_voucher"></div>
        <div class="field"><label>ಕಡಿತ (₹) (ಐಚ್ಛಿಕ)</label><input type="number" id="bill_deduction" value="0"></div>
        <div class="field" style="grid-column:1/-1;"><label>📎 ಬಿಲ್ PDF Upload (ಐಚ್ಛಿಕ — Scan/Photo of actual bill)</label>
          <input type="file" id="bill_file" accept=".pdf,.jpg,.jpeg,.png" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
        </div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="addBill()">Save</button></div>
    </div>`:''}
    <div class="panel"><h3>📋 ಬಿಲ್‌ಗಳ ಪಟ್ಟಿ (${DB.bills.length})</h3>
    <div class="table-wrap"><table><thead><tr><th>ಖಾತೆ</th><th>ಪಾವತಿದಾರರು</th><th>ಬಿಲ್ ಸಂ</th><th>ದಿನಾಂಕ</th><th>ಮೊತ್ತ</th><th>Head</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
    <tbody>${DB.bills.length? DB.bills.slice().reverse().map(b=>{
      const steps=billSteps(b.account,b).filter(s=>s.from===b.status && s.role===CURRENT_USER.role);
      const btns=steps.map(s=>`<button class="btn btn-sm ${s.to==='Rejected'?'btn-red':'btn-green'}" onclick="billTransition('${b.id}','${esc(s.to)}')">${esc(s.btn)}</button>`).join('');
      const flowKey=(b.account==='main'&&b.createdByRole==='warden')?'mainByWarden':b.account;
      const flow=BILL_FLOWS[flowKey];
      return `<tr><td>${esc(ACCOUNTS[b.account].id)}</td><td>${esc(b.payee)}</td><td>${esc(b.billNo)}</td><td>${fmtDate(b.date)}</td><td>${money(b.amount)}</td><td>${esc(b.head)}</td>
      <td><span class="badge ${badgeClass(b.status)}">${esc(b.status)}</span>
      </td><td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="viewBillDetails('${b.id}')">👁 ವಿವರ</button>${btns}</td></tr>`;
    }).join('') : `<tr class="empty-row"><td colspan="8">ಯಾವುದೇ ಬಿಲ್ ದಾಖಲೆಗಳಿಲ್ಲ.</td></tr>`}</tbody></table></div></div>
    <div id="billDetailWrap"></div>`;
}

function viewBillDetails(id){
  const b=DB.bills.find(x=>x.id===id); if(!b) return;
  const wrap=document.getElementById('billDetailWrap'); if(!wrap) return;
  const steps=billSteps(b.account,b).filter(s=>s.from===b.status && s.role===CURRENT_USER.role);
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;justify-content:space-between;"><h3 style="margin:0;">ಬಿಲ್ ವಿವರ — ${esc(b.payee)}</h3>
    <button class="btn btn-sm btn-outline" onclick="document.getElementById('billDetailWrap').innerHTML=''">✕</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin:12px 0;">
      <div class="kv"><b>ಖಾತೆ:</b> ${esc(ACCOUNTS[b.account].name)} (${esc(ACCOUNTS[b.account].id)})</div>
      <div class="kv"><b>ಪಾವತಿದಾರರು:</b> ${esc(b.payee)}</div>
      <div class="kv"><b>ಬಿಲ್ ಸಂಖ್ಯೆ:</b> ${esc(b.billNo||'—')}</div>
      <div class="kv"><b>ಬಿಲ್ ದಿನಾಂಕ:</b> ${fmtDate(b.date)}</div>
      <div class="kv"><b>ಮೊತ್ತ:</b> ${money(b.amount)}</div>
      <div class="kv"><b>ಕಡಿತ:</b> ${money(b.deduction||0)}</div>
      <div class="kv"><b>ಖಾತೆ ಶೀರ್ಷಿಕೆ:</b> ${esc(b.head)}</div>
      <div class="kv"><b>ಚೆಕ್/ವೌಚರ್:</b> ${esc(b.cheque||'—')} / ${esc(b.voucher||'—')}</div>
      <div class="kv"><b>ರಚಿಸಿದವರು:</b> ${esc(b.createdBy)} (${esc(b.createdByRole||'')})</div>
      <div class="kv"><b>ಸ್ಥಿತಿ:</b> ${esc(b.status)}</div>
    </div>
    ${b.fileData?`<div class="note" style="margin-bottom:10px;">📎 Uploaded Bill: <button class="btn btn-sm btn-gold" onclick="downloadBillFile('${b.id}')">⬇ ${esc(b.fileName)}</button></div>`:'<div class="small-muted">📎 ಯಾವ ಬಿಲ್ Attachment ಇಲ್ಲ</div>'}
    ${b.orderNo?`<div class="form-actions"><button class="btn btn-gold" onclick="viewPaymentOrder('${b.id}')">📄 Payment Order ನೋಡಿ</button></div>`:''}
    <div class="form-actions" style="margin-top:10px;">
      ${steps.map(s=>`<button class="btn ${s.to==='Rejected'?'btn-red':'btn-primary'}" onclick="billTransition('${b.id}','${esc(s.to)}')">${esc(s.btn)}</button>`).join('')}
    </div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function downloadBillFile(id){
  const b=DB.bills.find(x=>x.id===id); if(!b||!b.fileData) return;
  const a=document.createElement('a'); a.href=b.fileData; a.download=b.fileName||'bill'; a.click();
}

function refreshBillHeads(){
  const acc=document.getElementById('bill_account').value;
  document.getElementById('bill_head').innerHTML=ACCOUNTS[acc].heads.map(h=>`<option>${esc(h)}</option>`).join('');
}

function addBill(){
  const account=document.getElementById('bill_account').value, payee=document.getElementById('bill_payee').value;
  const billNo=document.getElementById('bill_no').value, date=document.getElementById('bill_date').value;
  const amount=Number(document.getElementById('bill_amount').value||0), head=document.getElementById('bill_head').value;
  const cheque=document.getElementById('bill_cheque').value, voucher=document.getElementById('bill_voucher').value;
  const deduction=Number(document.getElementById('bill_deduction').value||0);
  if(!payee||amount<=0){ showToast('⚠ ಪಾವತಿದಾರರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ಅಗತ್ಯ'); return; }
  const createdByRole=CURRENT_USER.role;
  const doSave=(fileData,fileName)=>{
    DB.bills.push({id:uid(), account, payee, billNo, date, amount, head, cheque, voucher, deduction,
      status:'Draft', createdAt:todayStr(), createdBy:CURRENT_USER.name, createdByRole,
      fileData:fileData||null, fileName:fileName||null});
    saveDB(); showToast('✅ ಬಿಲ್ ಉಳಿಸಲಾಗಿದೆ'); navigate('bills');
  };
  const fileEl=document.getElementById('bill_file');
  const file=fileEl?.files?.[0];
  if(file){ const reader=new FileReader(); reader.onload=e=>doSave(e.target.result,file.name); reader.readAsDataURL(file); }
  else doSave(null,null);
}

function billTransition(id,to){
  const b=DB.bills.find(x=>x.id===id); if(!b) return;
  b.status=to;
  if(to==='Payment Order Generated'){ b.orderNo='ORD-'+nextSeq('order'); b.orderGeneratedAt=todayStr(); }
  if(to==='Paid'){ b.paidDate=todayStr(); }
  // Route notifications sensibly based on who needs to act next
  if(to==='Sent to FDA') staffNamesForRole('fda').forEach(n=>pushNotification(n,'🧾 DC Bill Approval (Warden ಇಂದ): '+b.payee+' — '+money(b.amount)));
  if(to==='FDA Approved') staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ ಬಿಲ್ Verify ಆಗಿದೆ — Principal ಗೆ ಕಳುಹಿಸಿ'));
  if(to==='Sent to Principal') staffNamesForRole('principal').forEach(n=>pushNotification(n,'🧾 DC Bill Approval: '+b.payee+' — '+money(b.amount)));
  if(to==='Approved'||to==='Principal Approved') pushNotification(b.createdBy,'✅ ಬಿಲ್ Approved: '+b.payee+' — '+money(b.amount));
  if(to==='Rejected') pushNotification(b.createdBy,'❌ ಬಿಲ್ Reject ಆಗಿದೆ: '+b.payee);
  saveDB();
  if(to==='Payment Order Generated'){ showToast('✅ Payment Order ರಚಿಸಲಾಗಿದೆ'); viewPaymentOrder(id); }
  else { showToast('✅ ನವೀಕರಿಸಲಾಗಿದೆ: '+to); navigate('bills'); }
}

function numberToWordsINR(num){
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(n){ if(n<20) return a[n]; return b[Math.floor(n/10)]+(n%10?' '+a[n%10]:''); }
  function three(n){ if(n<100) return two(n); return a[Math.floor(n/100)]+' Hundred'+(n%100?' '+two(n%100):''); }
  num=Math.round(num);
  if(num===0) return 'Zero';
  let str='';
  const crore=Math.floor(num/10000000); num%=10000000;
  const lakh=Math.floor(num/100000); num%=100000;
  const thousand=Math.floor(num/1000); num%=1000;
  if(crore) str+=three(crore)+' Crore ';
  if(lakh) str+=three(lakh)+' Lakh ';
  if(thousand) str+=three(thousand)+' Thousand ';
  if(num) str+=three(num);
  return str.trim();
}

function viewPaymentOrder(id){
  const b=DB.bills.find(x=>x.id===id); if(!b||!b.orderNo) return;
  const wrap=document.getElementById('billDetailWrap')||document.getElementById('content');
  const netAmt=Number(b.amount||0)-Number(b.deduction||0);
  const verifierName = b.createdByRole==='warden' ? (STAFF.find(s=>s.role==='warden')?.name||'') : (b.createdBy||'');
  const verifierLabel = b.createdByRole==='warden' ? 'ವಾರ್ಡನ್ (ಪ್ರಭಾರ)' : 'ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA)';
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;gap:8px;margin-bottom:10px;" class="no-print">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-outline" onclick="document.getElementById('billDetailWrap').innerHTML=''">✕</button>
    </div>
    <div class="letterhead-paper" id="printArea" style="font-family:var(--font-kn);">
      <div style="text-align:center;font-weight:800;font-size:15px;">ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ (KREIS)</div>
      <div style="text-align:center;font-weight:800;font-size:13px;margin-bottom:14px;">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320</div>

      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;">
        <div>ವೋಚರ್ ಸಂಖ್ಯೆ : <b>${esc(b.orderNo)}</b></div>
        <div>ದಿನಾಂಕ : <b>${fmtDate(b.orderGeneratedAt)}</b></div>
      </div>
      <div style="font-size:13px;margin-bottom:6px;">ವಿಷಯ : ಶಾಲೆಗೆ ಸರಬರಾಜು ಮಾಡಿದ <b>${esc(b.payee)}</b> ಬಿಲ್ ಪಾವತಿ ಕುರಿತು.</div>
      <div style="font-size:13px;margin-bottom:6px;">ಒಟ್ಟು ಮೊತ್ತ : <b>₹${Number(netAmt).toFixed(2)}</b></div>
      <div style="font-size:13px;margin-bottom:10px;text-align:justify;">&nbsp;&nbsp;ರೂಪಾಯಿಗಳಲ್ಲಿ : <b>Rupees ${esc(numberToWordsINR(netAmt))} Only</b></div>

      <div style="font-size:13px;text-align:justify;line-height:1.9;">
        ಪಾವತಿಸುವ ಖಾತೆ ಸಂಖ್ಯೆ: <b>${esc(ACCOUNTS[b.account].id)} (${esc(ACCOUNTS[b.account].name)})</b><br>
        ಪಾವತಿಸುವ ಉದ್ದೇಶ: <b>${esc(b.payee)} ಬಿಲ್ ಪಾವತಿ</b><br>
        ಲೆಕ್ಕಶೀರ್ಷಿಕೆ: <b>${esc(b.head)}</b><br>
        ಚಕ್ ಸಂಖ್ಯೆ: <b>${esc(b.cheque||'—')}</b><br>
        ಚಕ್ ದಿನಾಂಕ: <b>${b.cheque?fmtDate(b.orderGeneratedAt):'—'}</b>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin:14px 0;">
        <thead><tr style="background:#1a3a5c;color:#fff;">
          <th style="padding:5px;border:1px solid #999;">ಕ್ರ.ಸಂ</th>
          <th style="padding:5px;border:1px solid #999;">ಬಿಲ್ ದಿನಾಂಕ</th>
          <th style="padding:5px;border:1px solid #999;">ಬಿಲ್ ಸಂಖ್ಯೆ</th>
          <th style="padding:5px;border:1px solid #999;">ಮೊತ್ತ (₹)</th>
        </tr></thead>
        <tbody>
          <tr><td style="padding:5px;border:1px solid #999;text-align:center;">1</td><td style="padding:5px;border:1px solid #999;text-align:center;">${fmtDate(b.date)}</td><td style="padding:5px;border:1px solid #999;text-align:center;">${esc(b.billNo||'—')}</td><td style="padding:5px;border:1px solid #999;text-align:right;">${Number(b.amount).toFixed(2)}</td></tr>
          <tr><td style="padding:5px;border:1px solid #999;text-align:center;">2</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td></tr>
          <tr><td style="padding:5px;border:1px solid #999;text-align:center;">3</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td></tr>
          <tr><td style="padding:5px;border:1px solid #999;text-align:center;">4</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td><td style="padding:5px;border:1px solid #999;">&nbsp;</td></tr>
        </tbody>
      </table>

      <div style="font-size:13px;text-align:justify;margin-bottom:20px;">&nbsp;&nbsp;<b>${esc(b.payee)}</b> ಇವರಿಗೆ ಮೇಲ್ಕಂಡ ಮೊತ್ತವನ್ನು ಪಾವತಿಸಲು ಆದೇಶಿಸಲಾಗಿದೆ.</div>

      <div style="display:flex;justify-content:space-between;margin-top:30px;font-size:13px;">
        <div>
          ಬಿಲ್ ಪರಿಶೀಲಿಸಿದವರು,<br><br>
          <div style="margin-bottom:36px;"></div>
          <b>${esc(verifierName)}</b><br>${verifierLabel}
        </div>
        <div style="text-align:right;">
          ಅನುಮೋದಿಸಿದೆ,<br><br>
          ${principalSignatureHTML(b.principalOrderName||STAFF.find(s=>s.role==='principal')?.name, fmtDate(b.orderGeneratedAt), fmtDate(b.orderGeneratedAt))}
        </div>
      </div>
    </div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function cbMonth(){ if(CB_MONTH===null) CB_MONTH=todayStr().slice(0,7); return CB_MONTH; }

function setCBMonth(v){ CB_DAY=''; CB_MONTH=v; if(v!=='all') CB_FY=cbFYof(v); renderCashbook(); }

function cbPayDate(b){ return b.paidDate||b.date||''; }

function cbSign(acc,month){ return (DB.cashbookSigns||[]).find(x=>x.account===acc&&x.month===month)||null; }

function cbRangeSigns(){ if(!Array.isArray(DB.cashbookRangeSigns)) DB.cashbookRangeSigns=[]; return DB.cashbookRangeSigns; }
function cbRangeCover(acc,d,onlyStatus){ return cbRangeSigns().find(x=>x.account===acc&&(onlyStatus?x.status===onlyStatus:(x.status==='Submitted'||x.status==='Signed'))&&x.from<=d&&d<=x.to)||null; }
function cbLocked(acc,dateOrMonth){
  const v=String(dateOrMonth||''), m=v.slice(0,7); const sg=cbSign(acc,m);
  if(sg&&(sg.status==='Submitted'||sg.status==='Signed')) return true;
  return v.length>=10 && !!cbRangeCover(acc,v.slice(0,10));
}

function cbAnyLocked(acc){ return (DB.cashbookSigns||[]).some(x=>x.account===acc&&(x.status==='Submitted'||x.status==='Signed')); }

function cbMonthLabel(m){ if(m==='all') return 'ಎಲ್ಲಾ ತಿಂಗಳು'; return MONTHS[monthIdx(m+'-01')]+' '+m.slice(0,4); }

var CB_FY=null;
function cbFYof(m){ const y=+m.slice(0,4), mo=+m.slice(5,7); return mo>=4?y:y-1; }
function cbFY(){ if(CB_FY===null){ const m=cbMonth(); CB_FY=(m==='all')?cbFYof(todayStr()):cbFYof(m); } return CB_FY; }
function cbFYList(){
  const set=new Set([cbFYof(todayStr()), cbFYof(todayStr())+1, cbFY()]);
  const add=d=>{ if(d&&/^\d{4}-\d{2}/.test(d)) set.add(cbFYof(d)); };
  ['main','joint'].forEach(a=>(DB.receipts[a]||[]).forEach(r=>add(r.date)));
  DB.bills.forEach(b=>{ if(b.status==='Paid'||b.status==='Closed') add(cbPayDate(b)); });
  (DB.cashNoTxn||[]).forEach(n=>add(n.date));
  (DB.cashbookSigns||[]).forEach(x=>add(x.month));
  const mn=Math.min(...set); for(let y=mn;y<=Math.max(...set);y++) set.add(y);
  return [...set].sort((x,y)=>y-x);
}
function cbFYLabel(y){ return y+'-'+String(y+1).slice(2)+' (ಏಪ್ರಿಲ್ '+y+' – ಮಾರ್ಚ್ '+(y+1)+')'; }
function setCBFY(v){ CB_FY=+v; const m=cbMonth(); if(m!=='all'&&cbFYof(m)!==CB_FY){ const mo=m.slice(5,7); CB_MONTH=((+mo>=4)?CB_FY:CB_FY+1)+'-'+mo; } renderCashbook(); }
function cbMonthOptions(){
  const fy=cbFY(), out=[];
  for(let i=0;i<12;i++){ const mo=((3+i)%12)+1, y=mo>=4?fy:fy+1; out.push(y+'-'+String(mo).padStart(2,'0')); }
  return out;
}

function cbCompute(acc,month){
  const opening0=Number(DB.cashOpening[acc]||0);
  const rAll=DB.receipts[acc]||[];
  const pAll=DB.bills.filter(b=>b.account===acc&&(b.status==='Paid'||b.status==='Closed'));
  const net=b=>Number(b.amount||0)-Number(b.deduction||0);
  const inM=d=>month==='all'||String(d||'').slice(0,7)===month;
  const before=d=>month!=='all'&&String(d||'').slice(0,7)<month;
  let rB=0,pB=0; rAll.forEach(r=>{ if(before(r.date)) rB+=Number(r.amount||0); }); pAll.forEach(b=>{ if(before(cbPayDate(b))) pB+=net(b); });
  const receipts=rAll.filter(r=>inM(r.date)), payments=pAll.filter(b=>inM(cbPayDate(b)));
  const rT=receipts.reduce((a,r)=>a+Number(r.amount||0),0), pT=payments.reduce((a,b)=>a+net(b),0);
  const opening=opening0+rB-pB;
  return {opening0,opening,receipts,payments,rT,pT,closing:opening+rT-pT};
}

function cbFdaBlock(sg){
  const st=staffByName(sg.submittedBy); const img=(DB.staffSignatures||{})[st&&st.hrmsId];
  return `<div style="text-align:left;min-width:180px;"><div style="height:34px;"></div><div style="font-size:11px;font-weight:700;border-top:1.5px solid #000;padding-top:3px;">${esc(sg.submittedBy)}</div><div style="font-size:9.5px;">ಪ್ರಥಮ ದರ್ಜೆ ಸಹಾಯಕರು (FDA) · ${fmtDate(sg.submittedAt)}</div></div>`;
}

function cbRowSign(acc,date){
  const d=String(date||'').slice(0,10);
  let sg=cbSign(acc,d.slice(0,7)); if(!(sg&&sg.status==='Signed')) sg=(d.length===10?cbRangeCover(acc,d,'Signed'):null);
  if(!(sg&&sg.status==='Signed')) return '';
  const pr=(typeof STAFF!=='undefined'&&STAFF.find(x=>x.role==='principal'))||null;
  return (pr&&pr.name)||sg.signedBy||'';
}
function cbSendBar(acc,month){
  if(month==='all') return '';
  const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  const sg=cbSign(acc,month), st=sg?sg.status:'Draft', future=month>todayStr().slice(0,7);
  const lab={Draft:['ಡ್ರಾಫ್ಟ್ — ಇನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ','var(--muted)'],Submitted:['⏳ ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ ಬಾಕಿ','#b26a00'],Signed:['✅ ಪ್ರಾಂಶುಪಾಲರು ಸಹಿ ಮಾಡಿದ್ದಾರೆ','var(--green)'],Returned:['↩ ಹಿಂದಿರುಗಿದೆ — ತಿದ್ದಿ ಮತ್ತೆ ಕಳುಹಿಸಿ','var(--red)']}[st]||[st,'var(--muted)'];
  const day=(CB_DAY&&CB_DAY.slice(0,7)===month)?CB_DAY:todayStr();
  let b='';
  if(fda&&!future&&(st==='Draft'||st==='Returned')) b+=`<button class="btn btn-primary btn-sm" onclick="cbSend('${acc}','${month}')">📤 ${esc(cbMonthLabel(month))} ನಗದು ಪುಸ್ತಕ — ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಿ</button><button class="btn btn-gold btn-sm" onclick="cbRangeSend('${acc}','${day}','${day}')">📤 ${fmtDate(day)} ಒಂದು ದಿನ ಮಾತ್ರ ಕಳುಹಿಸಿ</button>`;
  if(fda&&st==='Submitted') b+=`<button class="btn btn-outline btn-sm" onclick="cbRecall('${acc}','${month}')">↩ ಹಿಂತೆಗೆದುಕೊಳ್ಳಿ</button>`;
  if(pr&&st==='Submitted') b+=`<button class="btn btn-primary btn-sm" onclick="cbPrincipalSign('${acc}','${month}')">✍ ಸಹಿ / ಅನುಮೋದಿಸಿ</button><button class="btn btn-outline btn-sm" onclick="cbReturn('${acc}','${month}')">↩ ಹಿಂದಿರುಗಿಸಿ</button>`;
  const rgs=cbRangeSigns().filter(x=>x.account===acc&&x.from.slice(0,7)<=month&&x.to.slice(0,7)>=month);
  const rgHtml=rgs.length?`<div style="margin-top:8px;font-size:12.5px;"><b>📅 ದಿನ / ವ್ಯಾಪ್ತಿಯ ಕಳುಹಿಸುವಿಕೆಗಳು:</b>${rgs.map(x=>{ const t={Submitted:['⏳ ಸಹಿ ಬಾಕಿ','#b26a00'],Signed:['✅ ಸಹಿ ಆಗಿದೆ','var(--green)'],Returned:['↩ ಹಿಂದಿರುಗಿದೆ','var(--red)']}[x.status]||[x.status,'var(--muted)']; return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 0;border-bottom:1px dashed var(--border);"><span style="min-width:170px;">${esc(cbRangeLabel(x))}</span><span style="font-weight:700;color:${t[1]};">${t[0]}</span><button class="btn btn-outline btn-sm" onclick="cbRangeView('${x.id}')">👁 ನೋಡಿ</button>${pr&&x.status==='Submitted'?`<button class="btn btn-primary btn-sm" onclick="cbRangeSign('${x.id}')">✍ ಸಹಿ / ಅನುಮೋದಿಸಿ</button><button class="btn btn-outline btn-sm" onclick="cbRangeReturn('${x.id}')">↩ ಹಿಂದಿರುಗಿಸಿ</button>`:''}${fda&&x.status==='Submitted'?`<button class="btn btn-outline btn-sm" onclick="cbRangeRecall('${x.id}')">↩ ಹಿಂತೆಗೆ</button>`:''}</div>`; }).join('')}</div>`:'';
  return `<div class="panel no-print" style="border:2px solid var(--navy);margin-top:14px;"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><b>📤 ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ — ${esc(ACCOUNTS[acc].name)}:</b><span style="font-weight:700;color:${lab[1]};">${lab[0]}</span>${b}</div>${rgHtml}${(fda&&(st==='Draft'||st==='Returned'))?'':''}</div>`;
}
// NIC / e-Office style "Digitally signed by" block (replaces the signature image on cash book prints)
function cbDigiSign(sg,pname,reason){
  const nm=pname||sg.signedBy||'', stamp=sg.signStamp||((sg.signedDate?fmtDate(sg.signedDate):'')+' '+(sg.signedAt||''));
  const meta=[sg.signHost||'', sg.signIp?('IP: '+sg.signIp+(sg.signDevice?' ('+sg.signDevice+')':'')):''].filter(Boolean).join(' | ');
  return `<div style="display:flex;justify-content:flex-end;"><div style="display:flex;gap:8px;align-items:stretch;font-family:Arial,'Nirmala UI','Noto Sans Kannada',sans-serif;color:#000;text-align:left;">
    <div style="width:4px;background:#1a4d8f;border-radius:2px;"></div>
    <div style="font-size:9.5pt;line-height:1.4;">
      <div style="color:#444;">Digitally signed by</div>
      <div style="font-weight:700;font-size:10.5pt;">${esc(nm)}</div>
      <div>${esc(sg.signDesig||'Principal')}, MDRS Bhatkal (BC-265)</div>
      <div>Date: ${esc(stamp)} IST</div>
      <div>Reason: ${esc(reason||'Cash Book approved')}</div>
      ${meta?`<div style="font-size:8pt;color:#444;">${esc(meta)}</div>`:''}
    </div></div></div>`;
}
async function cbSignMeta(rec,ts){
  rec.signStamp=ts&&ts.iso?taStampText(new Date(ts.iso)):taStampText(new Date());
  rec.signHost=location.host;
  rec.signDevice=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'Mobile':'Computer';
  rec.signIp=await taGetIp();
}
function cbPrincipalInbox(){
  const items=[
    ...(DB.cashbookSigns||[]).filter(x=>x.status==='Submitted').map(x=>({k:'m',acc:x.account,label:cbMonthLabel(x.month),by:x.submittedBy,at:x.submittedAt,x})),
    ...cbRangeSigns().filter(x=>x.status==='Submitted').map(x=>({k:'r',acc:x.account,label:cbRangeLabel(x),by:x.submittedBy,at:x.submittedAt,x}))
  ].sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')));
  const done=[
    ...(DB.cashbookSigns||[]).filter(x=>x.status==='Signed').map(x=>({k:'m',acc:x.account,label:cbMonthLabel(x.month),x})),
    ...cbRangeSigns().filter(x=>x.status==='Signed').map(x=>({k:'r',acc:x.account,label:cbRangeLabel(x),x}))
  ].sort((a,b)=>String(b.x.signStamp||b.x.signedDate||'').localeCompare(String(a.x.signStamp||a.x.signedDate||''))).slice(0,15);
  const view=i=>i.k==='m'?`cbJump('${i.acc}','${i.x.month}')`:`cbRangeView('${i.x.id}')`;
  const sign=i=>i.k==='m'?`cbPrincipalSign('${i.acc}','${i.x.month}')`:`cbRangeSign('${i.x.id}')`;
  const ret=i=>i.k==='m'?`cbReturn('${i.acc}','${i.x.month}')`:`cbRangeReturn('${i.x.id}')`;
  return `<div class="panel no-print" style="border:2px solid var(--navy);">
    <h3>✍ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇರುವ ನಗದು ಪುಸ್ತಕಗಳು (Pending for approval) — ${items.length}</h3>
    
    ${items.length?`<div class="table-wrap"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಖಾತೆ</th><th>ಅವಧಿ</th><th>ಕಳುಹಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>ಕ್ರಿಯೆ</th></tr></thead><tbody>
      ${items.map((i,n)=>`<tr><td class="c">${n+1}</td><td>${esc(ACCOUNTS[i.acc].name)}<br><span style="font-size:11px;color:var(--muted);">A/c ${esc(ACCOUNTS[i.acc].id)}</span></td><td><b>${esc(i.label)}</b></td><td>${esc(i.by||'')}</td><td>${i.at?fmtDate(i.at):''}</td><td><span class="gv-act"><button class="gv-b lnk" onclick="${view(i)}">👁 ವೀಕ್ಷಿಸಿ</button><button class="gv-b ok" onclick="${sign(i)}">✍ ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="${ret(i)}">↩ ಹಿಂದಿರುಗಿಸಿ</button></span></td></tr>`).join('')}</tbody></table></div>
      <div style="margin-top:8px;"><button class="btn btn-primary btn-sm" onclick="cbSignMany(true)">✍ ಎಲ್ಲವನ್ನೂ ಅನುಮೋದಿಸಿ (${items.length})</button></div>`
      :'<div class="small-muted" style="margin-top:6px;">ಅನುಮೋದನೆಗೆ ಯಾವುದೂ ಬಾಕಿ ಇಲ್ಲ ✅</div>'}
  </div>
  <div class="panel no-print"><h3>✅ ಇತ್ತೀಚೆಗೆ ಅನುಮೋದಿಸಿದವು</h3>
    ${done.length?`<div class="table-wrap"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಖಾತೆ</th><th>ಅವಧಿ</th><th>ಅನುಮೋದಿಸಿದ ದಿನಾಂಕ / ಸಮಯ</th><th></th></tr></thead><tbody>
      ${done.map((i,n)=>`<tr><td class="c">${n+1}</td><td>${esc(ACCOUNTS[i.acc].name)}</td><td><b>${esc(i.label)}</b></td><td>${esc(i.x.signStamp||((i.x.signedDate?fmtDate(i.x.signedDate):'')+' '+(i.x.signedAt||'')))}</td><td><button class="gv-b lnk" onclick="${view(i)}">👁 ನೋಡಿ</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="small-muted">ಇನ್ನೂ ಯಾವುದನ್ನೂ ಅನುಮೋದಿಸಿಲ್ಲ.</div>'}
  </div>`;
}
function cbSignBlock(acc,month){
  if(month==='all') return '';
  let sg=cbSign(acc,month);
  if(!(sg&&sg.status==='Signed')&&CB_DAY&&CB_DAY.slice(0,7)===month){ const rg=cbRangeSigns().find(x=>x.account===acc&&x.status==='Signed'&&x.from<=CB_DAY&&CB_DAY<=x.to); if(rg) sg=rg; }
  const pr=(typeof STAFF!=='undefined'&&STAFF.find(x=>x.role==='principal'))||null, pname=pr?pr.name:'';
  const right = sg&&sg.status==='Signed' ? cbDigiSign(sg,pname)
    : `<div style="min-width:200px;text-align:right;"><div style="height:45px;"></div><div style="font-size:11px;border-top:1.5px solid #000;padding-top:3px;">${pname?('<b>'+esc(pname)+'</b><br>'):''}ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div></div>`;
  return `<div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:12px;margin-top:22px;page-break-inside:avoid;">${right}</div>`;
}

function cbStatusHtml(acc,month,c){
  if(month==='all') return '';
  const sg=cbSign(acc,month);
  if(sg&&sg.status==='Signed'&&sg.snap&&(sg.snap.rc!==c.receipts.length||sg.snap.pc!==c.payments.length||Number(sg.snap.rt)!==c.rT||Number(sg.snap.pt)!==c.pT))
    return `<div class="no-print" style="margin:8px 0;padding:6px 10px;border-radius:8px;background:var(--red-tint);color:var(--red);font-size:12px;font-weight:700;">⚠ ಸಹಿ ಮಾಡಿದ ನಂತರ ಈ ತಿಂಗಳ ವಹಿವಾಟುಗಳಲ್ಲಿ ಬದಲಾವಣೆಯಾಗಿದೆ. ಪ್ರಾಂಶುಪಾಲರು ಸಹಿ ರದ್ದು ಮಾಡಿ ಮತ್ತೆ ಸಹಿ ಮಾಡಬೇಕು.</div>`;
  return '';
}

async function cbSend(acc,monthArg,silent){
  const month=monthArg||cbMonth(); if(month==='all'){ showToast('⚠ ತಿಂಗಳು ಆರಿಸಿ'); return; }
  if(CURRENT_USER.role!=='fda') return;
  if(!silent&&!confirm(ACCOUNTS[acc].name+' — '+cbMonthLabel(month)+' ನಗದು ಪುಸ್ತಕವನ್ನು ಪ್ರಾಂಶುಪಾಲರ ಸಹಿಗೆ ಕಳುಹಿಸಬೇಕೇ?\n(ಕಳುಹಿಸಿದ ನಂತರ ಈ ತಿಂಗಳ ನಮೂದುಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ)')) return;
  const ts=await getServerTimeStamp();
  let sg=cbSign(acc,month);
  const data={status:'Submitted',submittedBy:CURRENT_USER.name,submittedAt:ts.date,submittedTime:ts.time,remarks:'',signedBy:null,signedAt:null,signedDate:null,snap:null};
  if(sg) Object.assign(sg,data); else { if(!Array.isArray(DB.cashbookSigns)) DB.cashbookSigns=[]; DB.cashbookSigns.push(Object.assign({id:uid(),account:acc,month},data)); }
  STAFF.filter(x=>x.role==='principal').forEach(p=>pushNotification(p.name,'📤 ನಗದು ಪುಸ್ತಕ ಸಹಿಗೆ: '+ACCOUNTS[acc].name+' — '+cbMonthLabel(month)));
  saveDB(); showToast('✅ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); renderCashbook();
}

function cbRecall(acc,monthArg){
  const month=monthArg||cbMonth(), sg=cbSign(acc,month); if(!sg||sg.status!=='Submitted') return;
  if(!confirm('ಕಳುಹಿಸಿದ್ದನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಬೇಕೇ?')) return;
  sg.status='Returned'; sg.remarks='FDA ಹಿಂತೆಗೆದುಕೊಂಡಿದ್ದಾರೆ'; saveDB(); showToast('↩ ಹಿಂತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ'); renderCashbook();
}

async function cbPrincipalSign(acc,monthArg,silent){
  if(CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ ಸಹಿ ಮಾಡಬಹುದು'); return; }
  const month=monthArg||cbMonth(), sg=cbSign(acc,month); if(!sg||sg.status!=='Submitted') return;
  if(!silent&&!confirm(ACCOUNTS[acc].name+' — '+cbMonthLabel(month)+' ನಗದು ಪುಸ್ತಕಕ್ಕೆ ಸಹಿ ಮಾಡಬೇಕೇ?')) return;
  const ts=await getServerTimeStamp(); const c=cbCompute(acc,month);
  sg.status='Signed'; sg.signedBy=CURRENT_USER.name; sg.signedAt=ts.time; sg.signedDate=ts.date; sg.serverTime=!!ts.server; await cbSignMeta(sg,ts);
  sg.snap={rc:c.receipts.length,rt:c.rT,pc:c.payments.length,pt:c.pT};
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ ನಗದು ಪುಸ್ತಕಕ್ಕೆ ಪ್ರಾಂಶುಪಾಲರು ಸಹಿ ಮಾಡಿದ್ದಾರೆ: '+ACCOUNTS[acc].name+' — '+cbMonthLabel(month)));
  saveDB(); showToast('✅ ಸಹಿ ಮಾಡಲಾಗಿದೆ'); renderCashbook();
}

function cbReturn(acc,monthArg){
  if(CURRENT_USER.role!=='principal') return;
  const month=monthArg||cbMonth(), sg=cbSign(acc,month); if(!sg||sg.status!=='Submitted') return;
  const why=prompt('ತಿದ್ದುಪಡಿಗೆ ಕಾರಣ (ಐಚ್ಛಿಕ):',''); if(why===null) return;
  sg.status='Returned'; sg.remarks=why.trim();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'↩ ನಗದು ಪುಸ್ತಕ ತಿದ್ದುಪಡಿಗೆ ಹಿಂದಿರುಗಿದೆ: '+ACCOUNTS[acc].name+' — '+cbMonthLabel(month)+(sg.remarks?(' ('+sg.remarks+')'):'')));
  saveDB(); showToast('↩ ಹಿಂದಿರುಗಿಸಲಾಗಿದೆ'); renderCashbook();
}

function cbRevoke(acc){
  if(CURRENT_USER.role!=='principal') return;
  const month=cbMonth(), sg=cbSign(acc,month); if(!sg||sg.status!=='Signed') return;
  if(!confirm('ಸಹಿ ರದ್ದು ಮಾಡಬೇಕೇ? FDA ತಿದ್ದುಪಡಿ ಮಾಡಿ ಮತ್ತೆ ಕಳುಹಿಸಬೇಕಾಗುತ್ತದೆ.')) return;
  sg.status='Returned'; sg.remarks='ಸಹಿ ರದ್ದು ಮಾಡಲಾಗಿದೆ'; sg.signedBy=null; sg.signedAt=null; sg.signedDate=null; sg.snap=null;
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'🔓 ನಗದು ಪುಸ್ತಕ ಸಹಿ ರದ್ದು: '+ACCOUNTS[acc].name+' — '+cbMonthLabel(month)));
  saveDB(); showToast('🔓 ಸಹಿ ರದ್ದಾಗಿದೆ'); renderCashbook();
}

function cbSendGridHtml(){
  const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  const cur=todayStr().slice(0,7), months=cbMonthOptions();
  const st=(acc,m)=>{ const sg=cbSign(acc,m); return sg?sg.status:'Draft'; };
  const stx=x=>({Draft:['draft','ಡ್ರಾಫ್ಟ್'],Submitted:['pend','ಸಹಿ ಬಾಕಿ'],Signed:['ok','ಸಹಿ ಆಗಿದೆ'],Returned:['bad','ಹಿಂದಿರುಗಿದೆ']}[x]||['draft',x]);
  const cells=(acc,m)=>{
    const s=st(acc,m), future=m>cur, t=stx(s); let b='';
    if(fda&&!future&&(s==='Draft'||s==='Returned')) b+=`<button class="gv-b pri" onclick="cbSend('${acc}','${m}')">ಕಳುಹಿಸಿ</button>`;
    if(fda&&s==='Submitted') b+=`<button class="gv-b" onclick="cbRecall('${acc}','${m}')">ಹಿಂತೆಗೆ</button>`;
    if(pr&&s==='Submitted') b+=`<button class="gv-b ok" onclick="cbPrincipalSign('${acc}','${m}')">ಸಹಿ</button><button class="gv-b" onclick="cbReturn('${acc}','${m}')">ಹಿಂದಿರುಗಿಸಿ</button>`;
    b+=`<button class="gv-b lnk" onclick="cbJump('${acc}','${m}')">ತೆರೆಯಿರಿ</button>`;
    return `<td class="c"><span class="gv-st ${t[0]}">${t[1]}</span></td><td class="c"><span class="gv-act">${b}</span></td>`;
  };
  const nSend=months.filter(m=>m<=cur).reduce((a,m)=>a+cbAccs().filter(acc=>{ const s=st(acc,m); return s==='Draft'||s==='Returned'; }).length,0);
  const nSign=(DB.cashbookSigns||[]).filter(x=>x.status==='Submitted'&&x.account===CB_ACC).length+cbRangeSigns().filter(x=>x.status==='Submitted'&&x.account===CB_ACC).length;
  return `<div class="panel no-print"><h3>📤 ಪ್ರಾಂಶುಪಾಲರ ಸಹಿಗೆ ಕಳುಹಿಸುವುದು — ವರ್ಷ ${cbFY()}-${String(cbFY()+1).slice(2)}</h3>
    
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;">
      ${fda?`<button class="gv-b pri" onclick="cbSendMany()" ${nSend?'':'disabled'}>ಕಳುಹಿಸದ ಎಲ್ಲವನ್ನೂ ಕಳುಹಿಸಿ (${nSend})</button>`:''}
      ${pr?`<button class="gv-b ok" onclick="cbSignMany()" ${nSign?'':'disabled'}>ಕಳುಹಿಸಿದ ಎಲ್ಲಕ್ಕೂ ಸಹಿ ಮಾಡಿ (${nSign})</button>`:''}</div>
    <div class="table-wrap"><table class="gov-table"><thead><tr><th rowspan="2">ಕ್ರ.ಸಂ</th><th rowspan="2">ತಿಂಗಳು</th><th colspan="2">${esc(ACCOUNTS[cbAccs()[0]].name)}<br><span style="font-weight:400;font-size:11px;">A/c ${esc(ACCOUNTS[cbAccs()[0]].id)}</span></th></tr>
      <tr><th>ಸ್ಥಿತಿ</th><th>ಕ್ರಿಯೆ</th></tr></thead><tbody>
    ${months.map((m,i)=>`<tr class="${m>cur?'gv-future':''}"><td class="c">${i+1}</td><td><b>${esc(cbMonthLabel(m))}</b></td>${cbAccs().map(a=>cells(a,m)).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
async function cbSendMany(){
  if(CURRENT_USER.role!=='fda') return;
  const cur=todayStr().slice(0,7), list=[];
  cbMonthOptions().filter(m=>m<=cur).forEach(m=>cbAccs().forEach(acc=>{ const sg=cbSign(acc,m); if(!sg||sg.status==='Returned') list.push([acc,m]); }));
  if(!list.length) return;
  if(!confirm(list.length+' ನಗದು ಪುಸ್ತಕ(ಗಳನ್ನು) ಪ್ರಾಂಶುಪಾಲರ ಸಹಿಗೆ ಕಳುಹಿಸಬೇಕೇ?\n'+list.map(x=>ACCOUNTS[x[0]].id+' — '+cbMonthLabel(x[1])).join('\n')+'\n\n(ಕಳುಹಿಸಿದ ನಂತರ ಆ ತಿಂಗಳ ನಮೂದುಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ)')) return;
  for(const [acc,m] of list) await cbSend(acc,m,true);
}
async function cbSignMany(all){
  if(CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ'); return; }
  const list=(DB.cashbookSigns||[]).filter(x=>x.status==='Submitted'&&(all||x.account===CB_ACC)).map(x=>[x.account,x.month]);
  const rl=cbRangeSigns().filter(x=>x.status==='Submitted'&&(all||x.account===CB_ACC));
  if(!list.length&&!rl.length) return;
  if(!confirm((list.length+rl.length)+' ನಗದು ಪುಸ್ತಕಗಳಿಗೆ ಸಹಿ ಮಾಡಬೇಕೇ?\n'+list.map(x=>ACCOUNTS[x[0]].id+' — '+cbMonthLabel(x[1])).concat(rl.map(x=>ACCOUNTS[x.account].id+' — '+cbRangeLabel(x))).join('\n'))) return;
  for(const [acc,m] of list) await cbPrincipalSign(acc,m,true);
  for(const x of rl) await cbRangeSign(x.id,true);
}

function cbRangeLabel(x){ return x.from===x.to?fmtDate(x.from):(fmtDate(x.from)+' – '+fmtDate(x.to)); }
async function cbRangeSend(w,f,t){
  if(CURRENT_USER.role!=='fda') return;
  const which=w||cbV('rg_acc')||'both', from=f||cbV('rg_from'), to=t||cbV('rg_to')||from;
  if(!from){ showToast('⚠ ದಿನಾಂಕ ಆರಿಸಿ'); return; }
  if(to<from){ showToast('⚠ "ವರೆಗೆ" ದಿನಾಂಕ "ಇಂದ" ದಿನಾಂಕಕ್ಕಿಂತ ಮೊದಲಿರಬಾರದು'); return; }
  if(to>todayStr()){ showToast('⚠ ಭವಿಷ್ಯದ ದಿನಾಂಕ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ'); return; }
  const accs=which==='both'?['main','joint']:[which];
  for(const acc of accs){
    const m1=from.slice(0,7), m2=to.slice(0,7);
    for(let m=m1;m<=m2;m=cbNextMonth(m)){ const sg=cbSign(acc,m); if(sg&&(sg.status==='Submitted'||sg.status==='Signed')){ showToast('⚠ '+ACCOUNTS[acc].id+' — '+cbMonthLabel(m)+' ತಿಂಗಳು ಈಗಾಗಲೇ ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',6000); return; } }
    const ov=cbRangeSigns().find(x=>x.account===acc&&(x.status==='Submitted'||x.status==='Signed')&&x.from<=to&&from<=x.to);
    if(ov){ showToast('⚠ '+ACCOUNTS[acc].id+' — '+cbRangeLabel(ov)+' ಈಗಾಗಲೇ ಕಳುಹಿಸಲಾಗಿದೆ (ದಿನಾಂಕಗಳು ಅತಿಕ್ರಮಿಸುತ್ತವೆ)',6000); return; }
  }
  if(!confirm(accs.map(a=>ACCOUNTS[a].name).join(' + ')+'\nನಗದು ಪುಸ್ತಕ '+fmtDate(from)+(to!==from?' ರಿಂದ '+fmtDate(to)+' ವರೆಗೆ':'')+' ಪ್ರಾಂಶುಪಾಲರ ಸಹಿಗೆ ಕಳುಹಿಸಬೇಕೇ?\n(ಕಳುಹಿಸಿದ ನಂತರ ಈ ದಿನಾಂಕಗಳ ನಮೂದುಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ)')) return;
  const ts=await getServerTimeStamp();
  accs.forEach(acc=>{
    cbRangeSigns().push({id:uid(),account:acc,from,to,status:'Submitted',submittedBy:CURRENT_USER.name,submittedAt:ts.date,submittedTime:ts.time,remarks:'',signedBy:null,signedAt:null,signedDate:null});
    STAFF.filter(x=>x.role==='principal').forEach(p=>pushNotification(p.name,'📤 ನಗದು ಪುಸ್ತಕ ಸಹಿಗೆ: '+ACCOUNTS[acc].name+' — '+from+(to!==from?(' → '+to):'')));
  });
  saveDB(); showToast('✅ ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — "ಸಹಿ / ಅನುಮೋದನೆ" ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಸ್ಥಿತಿ ನೋಡಿ',6000); renderCashbook();
}
function cbNextMonth(m){ let y=+m.slice(0,4), mo=+m.slice(5,7)+1; if(mo>12){mo=1;y++;} return y+'-'+String(mo).padStart(2,'0'); }
function cbRangeQuick(){ const d=(CB_DAY&&CB_DAY.slice(0,7)===cbMonth())?CB_DAY:todayStr(); cbRangeSend(CB_ACC,d,d); }
function cbRangeRecall(id){ const x=cbRangeSigns().find(r=>r.id===id); if(!x||x.status!=='Submitted') return; if(!confirm('ಕಳುಹಿಸಿದ್ದನ್ನು ಹಿಂತೆಗೆದುಕೊಳ್ಳಬೇಕೇ?')) return; x.status='Returned'; x.remarks='FDA ಹಿಂತೆಗೆದುಕೊಂಡಿದ್ದಾರೆ'; saveDB(); renderCashbook(); }
async function cbRangeSign(id,silent){
  if(CURRENT_USER.role!=='principal'){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು ಮಾತ್ರ ಸಹಿ ಮಾಡಬಹುದು'); return; }
  const x=cbRangeSigns().find(r=>r.id===id); if(!x||x.status!=='Submitted') return;
  if(!silent&&!confirm(ACCOUNTS[x.account].name+' — '+cbRangeLabel(x)+' ನಗದು ಪುಸ್ತಕಕ್ಕೆ ಸಹಿ ಮಾಡಬೇಕೇ?')) return;
  const ts=await getServerTimeStamp();
  x.status='Signed'; x.signedBy=CURRENT_USER.name; x.signedAt=ts.time; x.signedDate=ts.date; await cbSignMeta(x,ts);
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ ನಗದು ಪುಸ್ತಕಕ್ಕೆ ಪ್ರಾಂಶುಪಾಲರು ಸಹಿ ಮಾಡಿದ್ದಾರೆ: '+ACCOUNTS[x.account].name+' — '+cbRangeLabel(x)));
  saveDB(); showToast('✅ ಸಹಿ ಮಾಡಲಾಗಿದೆ'); renderCashbook();
}
function cbRangeReturn(id){
  if(CURRENT_USER.role!=='principal') return; const x=cbRangeSigns().find(r=>r.id===id); if(!x||x.status!=='Submitted') return;
  const why=prompt('ತಿದ್ದುಪಡಿಗೆ ಕಾರಣ (ಐಚ್ಛಿಕ):',''); if(why===null) return;
  x.status='Returned'; x.remarks=why.trim();
  staffNamesForRole('fda').forEach(n=>pushNotification(n,'↩ ನಗದು ಪುಸ್ತಕ ತಿದ್ದುಪಡಿಗೆ ಹಿಂದಿರುಗಿದೆ: '+ACCOUNTS[x.account].name+' — '+cbRangeLabel(x)+(x.remarks?(' ('+x.remarks+')'):'')));
  saveDB(); renderCashbook();
}
function cbRangeRevoke(id){
  if(CURRENT_USER.role!=='principal') return; const x=cbRangeSigns().find(r=>r.id===id); if(!x||x.status!=='Signed') return;
  if(!confirm('ಸಹಿ ರದ್ದು ಮಾಡಬೇಕೇ? FDA ತಿದ್ದುಪಡಿ ಮಾಡಿ ಮತ್ತೆ ಕಳುಹಿಸಬೇಕಾಗುತ್ತದೆ.')) return;
  x.status='Returned'; x.remarks='ಸಹಿ ರದ್ದು ಮಾಡಲಾಗಿದೆ'; x.signedBy=null; x.signedAt=null; x.signedDate=null; saveDB(); renderCashbook();
}
function cbRangeDel(id){ if(CURRENT_USER.role!=='fda') return; const x=cbRangeSigns().find(r=>r.id===id); if(!x||x.status!=='Returned') return; if(!confirm('ಈ ಪಟ್ಟಿಯ ನಮೂದನ್ನು ತೆಗೆಯಬೇಕೇ?')) return; DB.cashbookRangeSigns=cbRangeSigns().filter(r=>r.id!==id); saveDB(); renderCashbook(); }
function cbRangeView(id){ const x=cbRangeSigns().find(r=>r.id===id); if(!x) return; CB_ACC=x.account; CB_VIEW={acc:x.account,from:x.from,to:x.to,head:'',show:true}; CB_TAB='view'; renderCashbook(); window.scrollTo({top:0}); }
function cbRangeHtml(){
  const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  const list=cbRangeSigns().filter(x=>x.account===CB_ACC).slice().sort((a,b)=>(b.from+b.submittedAt).localeCompare(a.from+a.submittedAt));
  const day=(CB_DAY&&CB_DAY.slice(0,7)===cbMonth())?CB_DAY:todayStr();
  const stx=x=>({Submitted:['pend','ಸಹಿ ಬಾಕಿ'],Signed:['ok','ಸಹಿ ಆಗಿದೆ'],Returned:['bad','ಹಿಂದಿರುಗಿದೆ']}[x]||['draft',x]);
  return `<div class="panel no-print"><h3>📅 ದಿನ / ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯ ನಗದು ಪುಸ್ತಕ — ಸಹಿಗೆ ಕಳುಹಿಸಿ</h3>
    ${fda?`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:6px;">
      <input type="hidden" id="rg_acc" value="${CB_ACC}"><div style="font-weight:600;align-self:center;">🏦 ${esc(ACCOUNTS[CB_ACC==='joint'?'joint':'main'].name)}</div>
      <div class="field" style="margin:0;"><label>ಇಂದ</label><input type="date" id="rg_from" value="${day}"></div>
      <div class="field" style="margin:0;"><label>ವರೆಗೆ</label><input type="date" id="rg_to" value="${day}"></div>
      <button class="gv-b pri" style="padding:8px 16px;" onclick="cbRangeSend()">ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button></div>
      `:''}
    ${list.length?`<div class="table-wrap" style="margin-top:8px;"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಖಾತೆ</th><th>ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ಕಳುಹಿಸಿದವರು</th><th>ಕ್ರಿಯೆ</th></tr></thead><tbody>${list.map((x,i)=>{ const t=stx(x.status); return `<tr><td class="c">${i+1}</td><td class="c">${esc(ACCOUNTS[x.account].id)}</td><td class="c"><b>${esc(cbRangeLabel(x))}</b></td><td class="c"><span class="gv-st ${t[0]}">${t[1]}</span>${x.remarks&&x.status==='Returned'?`<div class="small-muted">${esc(x.remarks)}</div>`:''}</td><td class="c">${esc(x.submittedBy||'')}<div class="small-muted">${fmtDate(x.submittedAt)}</div></td><td class="c"><span class="gv-act">
      <button class="gv-b lnk" onclick="cbRangeView('${x.id}')">ನೋಡಿ</button>
      ${fda&&x.status==='Submitted'?`<button class="gv-b" onclick="cbRangeRecall('${x.id}')">ಹಿಂತೆಗೆ</button>`:''}
      ${fda&&x.status==='Returned'?`<button class="gv-b" onclick="cbRangeDel('${x.id}')">ತೆಗೆಯಿರಿ</button>`:''}
      ${pr&&x.status==='Submitted'?`<button class="gv-b ok" onclick="cbRangeSign('${x.id}')">ಸಹಿ</button><button class="gv-b" onclick="cbRangeReturn('${x.id}')">ಹಿಂದಿರುಗಿಸಿ</button>`:''}
      ${pr&&x.status==='Signed'?`<button class="gv-b" onclick="cbRangeRevoke('${x.id}')">ಸಹಿ ರದ್ದು</button>`:''}</span></td></tr>`; }).join('')}</tbody></table></div>`:'<div class="small-muted" style="margin-top:6px;">ಇನ್ನೂ ಯಾವ ದಿನದ ಲೆಕ್ಕವನ್ನೂ ಕಳುಹಿಸಿಲ್ಲ.</div>'}</div>`;
}
function cbJump(acc,month){ CB_MONTH=month; CB_DAY=''; if(month!=='all') CB_FY=cbFYof(month); CB_TAB='book'; CB_ACC=(acc==='joint'?'joint':'main'); renderCashbook(); window.scrollTo({top:0}); }

function renderCashbook(){
  const month=cbMonth(); const fda=CURRENT_USER.role==='fda', pr=CURRENT_USER.role==='principal';
  const opts=cbMonthOptions();
  let html=`<div class="page-head"><h2>ನಗದು ಪುಸ್ತಕ (Cash Book)</h2></div>
  ${printHeaderHtml('ನಗದು ಪುಸ್ತಕ (Cash Book) — '+ACCOUNTS[CB_ACC==='joint'?'joint':'main'].name,cbMonthLabel(month))}
  <div class="form-actions no-print" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
    <select onchange="setCBFY(this.value)" title="ಆರ್ಥಿಕ ವರ್ಷ">${cbFYList().map(y=>`<option value="${y}" ${y===cbFY()?'selected':''}>ವರ್ಷ ${esc(cbFYLabel(y))}</option>`).join('')}</select>
    <select onchange="setCBMonth(this.value)"><option value="all" ${month==='all'?'selected':''}>ಎಲ್ಲಾ ತಿಂಗಳು</option>${opts.map(m=>`<option value="${m}" ${m===month?'selected':''}>${esc(cbMonthLabel(m))}</option>`).join('')}</select>
    <button class="btn btn-outline btn-sm" onclick="cbStep(-1)">◀ ಹಿಂದಿನ ತಿಂಗಳು</button><button class="btn btn-outline btn-sm" onclick="cbStep(1)">ಮುಂದಿನ ತಿಂಗಳು ▶</button>
    ${month!=='all'?`<select onchange="CB_DAY=this.value;renderCashbook()" title="ದಿನ"><option value="">ಎಲ್ಲಾ ದಿನಗಳು</option>${cbDatesOf(month).map(d=>`<option value="${d}" ${d===CB_DAY?'selected':''}>${fmtDate(d)}</option>`).join('')}</select>`:''}
    ${month!=='all'?`<button class="btn btn-outline btn-sm" onclick="cbDayStep(-1)">◀ ಹಿಂದಿನ ದಿನ</button><button class="btn btn-outline btn-sm" onclick="cbDayStep(1)">ಮುಂದಿನ ದಿನ ▶</button>${fda?`<button class="btn btn-gold btn-sm" onclick="cbRangeQuick()">📤 ${(CB_DAY&&CB_DAY.slice(0,7)===month)?'ಈ ದಿನ':'ಇಂದಿನ ದಿನ'} ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button>`:''}`:''}
    <button class="btn btn-gold btn-sm" onclick="window.print()">🖨 Print / PDF</button></div>
`;
  let sendHtml='', bookHtml='';
  if(pr) sendHtml=cbPrincipalInbox(); else sendHtml+=cbRangeHtml()+cbSendGridHtml();
  bookHtml+=`<div class="panel no-print" style="border:2px solid var(--navy);"><b>🏦 ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ:</b> ಚೆಕ್ ನೀಡಿದೆ ಆದರೆ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆಗಿಲ್ಲದ ಚೆಕ್‌ಗಳ ವರದಿ (3 ತಿಂಗಳ ಅವಧಿ ಎಚ್ಚರಿಕೆಯೊಂದಿಗೆ) <button class="btn btn-primary btn-sm" onclick="BR_ACC=CB_ACC;navigate('bankrecon')">🏦 ತೆರೆಯಿರಿ</button></div>`;
  let excelHtml=cbToolbarHtml(month);
  if(fda) excelHtml+=finImportHtml('ನಗದು ಪುಸ್ತಕ — ಸಾಫ್ಟ್‌ವೇರ್‌ನಿಂದ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ CashBook_YYYY-MM.xlsx (ಎಷ್ಟು ತಿಂಗಳ ಫೈಲ್ ಬೇಕಾದರೂ, ಒಂದೊಂದಾಗಿ)');
  excelHtml+=wipeHtml('cash');
  [CB_ACC==='joint'?'joint':'main'].forEach(acc=>{
    const c=cbCompute(acc,month);
    const noAll=(DB.cashNoTxn||[]).filter(n=>n.account===acc&&(month==='all'||String(n.date||'').slice(0,7)===month));
    const byDate=(a,b)=>String(a.date||'').localeCompare(String(b.date||''));
    const dayF=x=>!(CB_DAY&&month!=='all'&&CB_DAY.slice(0,7)===month)||x.date===CB_DAY;
    const rRows=[...c.receipts.map(r=>({t:'r',date:r.date||'',r})),...noAll.filter(n=>n.section==='receipt').map(n=>({t:'n',date:n.date||'',n}))].filter(dayF).sort(byDate);
    const pRows=[...c.payments.map(p=>({t:'p',date:cbPayDate(p),p})),...noAll.filter(n=>n.section==='payment').map(n=>({t:'n',date:n.date||'',n}))].filter(dayF).sort(byDate);
    const canEdit=fda&&(month==='all'||!cbLocked(acc,month));
    const defDate=(CB_DAY&&month!=='all'&&CB_DAY.slice(0,7)===month)?CB_DAY:((month==='all'||month===todayStr().slice(0,7))?todayStr():(month+'-01'));
    const noTxnForm=(sec)=>canEdit?`<div class="form-actions no-print" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;"><input type="date" id="nt_date_${sec}_${acc}" value="${defDate}" style="max-width:170px;"><button class="btn btn-outline btn-sm" onclick="addNoTxn('${acc}','${sec}')">🚫 ವ್ಯವಹಾರವಿಲ್ಲ (No Transaction)</button></div>`:'';
    const openEditable=fda&&!cbAnyLocked(acc);
    bookHtml+=`<div class="panel"><h3>🏦 ${esc(ACCOUNTS[acc].name)} (A/c: ${esc(ACCOUNTS[acc].id)}) <span style="font-size:12px;color:var(--muted);">— ${esc(cbMonthLabel(month))}</span></h3>
      ${cbStatusHtml(acc,month,c)}
      <div class="form-grid no-print">
        <div class="field"><label>Opening Balance (₹) — ಆರಂಭದ ಶಿಲ್ಕು (ಸ್ಥಿರ)</label><input type="number" id="cob_${acc}" value="${c.opening0}" ${openEditable?'':'readonly'}></div>
      </div>
      ${openEditable?`<div class="form-actions no-print"><button class="btn btn-outline btn-sm" onclick="setOpening('${acc}')">Update Opening Balance</button></div>`:''}
      <div class="cards-grid" style="margin-top:10px;">
        <div class="stat-card"><div class="n">${money(c.opening)}</div><div class="l">Opening${month==='all'?'':' (ತಿಂಗಳ ಆರಂಭ)'}</div></div>
        <div class="stat-card"><div class="n">${money(c.rT)}</div><div class="l">ಒಟ್ಟು ಜಮೆ (Receipts)</div></div>
        <div class="stat-card"><div class="n">${money(c.pT)}</div><div class="l">ಒಟ್ಟು ಪಾವತಿ (Payments)</div></div>
        <div class="stat-card"><div class="n">${money(c.closing)}</div><div class="l">Closing Balance</div></div>
      </div>

      ${canEdit?`<div class="form-grid no-print" style="margin-top:14px;">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="rcpt_date_${acc}" value="${defDate}"></div>
        <div class="field"><label>ಇನ್‌ವರ್ಡ್ ಸಂ. (ಐಚ್ಛಿಕ)</label><input id="rcpt_inward_${acc}" placeholder="IN-..."></div>
        <div class="field"><label>ಮೂಲ (Source)</label><input id="rcpt_source_${acc}"></div>
        <div class="field"><label>ಮೊತ್ತ (₹)</label><input type="number" id="rcpt_amt_${acc}"></div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ (Head)</label><select id="rcpt_head_${acc}">${ACCOUNTS[acc].heads.map(h=>`<option>${esc(h)}</option>`).join('')}</select></div>
      </div>
      <div class="form-actions no-print"><button class="btn btn-primary btn-sm" id="rcpt_btn_${acc}" onclick="addReceipt('${acc}')">➕ ಜಮೆ ನಮೂದಿಸಿ (Add Receipt)</button> <button class="btn btn-outline btn-sm" id="rcpt_cancel_${acc}" style="display:none" onclick="cbCancelEdit()">✖ ತಿದ್ದುಪಡಿ ರದ್ದು</button></div>
      <div class="form-grid no-print" style="margin-top:14px;border-top:1px dashed var(--border);padding-top:10px;">
        <div class="field"><label>ದಿನಾಂಕ (ಪಾವತಿ)</label><input type="date" id="pay_date_${acc}" value="${defDate}"></div>
        <div class="field"><label>ವೋಚರ್ ಸಂ.</label><input id="pay_voucher_${acc}"></div>
        <div class="field"><label>ವಿವರ / ಪಾವತಿದಾರ</label><input id="pay_payee_${acc}"></div>
        <div class="field"><label>ಚೆಕ್ ಸಂ.</label><input id="pay_cheque_${acc}"></div>
        <div class="field"><label>ಆದೇಶ ಸಂ.</label><input id="pay_order_${acc}"></div>
        <div class="field"><label>ಒಟ್ಟು ಮೊತ್ತ (₹)</label><input type="number" id="pay_amt_${acc}"></div>
        <div class="field"><label>ಕಡಿತ (₹)</label><input type="number" id="pay_ded_${acc}" value="0"></div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ (Head)</label><select id="pay_head_${acc}">${ACCOUNTS[acc].heads.map(h=>`<option>${esc(h)}</option>`).join('')}</select></div>
      </div>
      <div class="form-actions no-print"><button class="btn btn-primary btn-sm" id="pay_btn_${acc}" onclick="cbAddPayment('${acc}')">➕ ಪಾವತಿ ನಮೂದಿಸಿ (Add Payment — DC Bill ಇಲ್ಲದೆ)</button> <button class="btn btn-outline btn-sm" id="pay_cancel_${acc}" style="display:none" onclick="cbCancelEdit()">✖ ತಿದ್ದುಪಡಿ ರದ್ದು</button></div>`:''}

      <h4 style="margin:18px 0 6px;font-size:13px;color:var(--navy);">ಜಮೆ ವಿವರಗಳು (RECEIPTS)</h4>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಇನ್‌ವರ್ಡ್ ಸಂ.</th><th>ದಿನಾಂಕ</th><th>ಮೂಲ</th><th>ಮೊತ್ತ (₹)</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಸಹಿ</th>${canEdit?'<th class="no-print">✏ / 🗑</th>':''}</tr></thead>
      <tbody>${rRows.length? rRows.map((x,idx)=>{ if(x.t==='n') return noTxnRow(x.n,idx,3).replace(/<\/tr>$/,canEdit?'<td class="no-print"></td></tr>':'</tr>'); const r=x.r; return `<tr><td>${idx+1}</td><td>${esc(r.inwardNo||'—')}</td><td>${fmtDate(r.date)}</td><td>${esc(r.source||'—')}</td><td>${money(r.amount)}</td><td>${esc(r.head||'—')}</td><td>${esc(cbRowSign(acc,r.date))}</td>${canEdit?`<td class="no-print" style="white-space:nowrap;"><button class="btn btn-outline btn-sm" onclick="cbEditRc('${acc}','${r.id}')">✏</button> <button class="btn btn-outline btn-sm" onclick="cbDelRc('${acc}','${r.id}')">🗑</button></td>`:''}</tr>`; }).join('') : `<tr class="empty-row"><td colspan="7">ವಹಿವಾಟುಗಳಿಲ್ಲ.</td></tr>`}</tbody></table></div>
      ${noTxnForm('receipt')}

      <h4 style="margin:18px 0 6px;font-size:13px;color:var(--navy);">ಖರ್ಚು / ಪಾವತಿ ವಿವರಗಳು (PAYMENTS)</h4>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ವೋಚರ್ ಸಂ.</th><th>ದಿನಾಂಕ</th><th>ವಿವರ</th><th>ಚೆಕ್ ಸಂ.</th><th>ಆದೇಶ ಸಂ.</th><th>ಒಟ್ಟು (₹)</th><th>ಕಡಿತ (₹)</th><th>ನಿವ್ವಳ (₹)</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಸಹಿ</th>${canEdit?'<th class="no-print">✏ / 🗑</th>':''}</tr></thead>
      <tbody>${pRows.length? pRows.map((x,idx)=>{ if(x.t==='n') return noTxnRow(x.n,idx,7).replace(/<\/tr>$/,canEdit?'<td class="no-print"></td></tr>':'</tr>'); const p=x.p; return `<tr><td>${idx+1}</td><td>${esc(p.voucher||'—')}</td><td>${fmtDate(cbPayDate(p))}</td><td>${esc(p.payee)}</td><td>${esc(p.cheque||'—')}</td><td>${esc(p.orderNo||'—')}</td><td>${money(p.amount)}</td><td>${money(p.deduction||0)}</td><td>${money(Number(p.amount||0)-Number(p.deduction||0))}</td><td>${esc(p.head)}</td><td>${esc(cbRowSign(acc,cbPayDate(p)))}</td>${canEdit?`<td class="no-print" style="white-space:nowrap;">${(p.manual||p.imported)?`<button class="btn btn-outline btn-sm" onclick="cbEditPay('${acc}','${p.id}')">✏</button> <button class="btn btn-outline btn-sm" onclick="cbDelPay('${p.id}')">🗑</button>`:'<span class="small-muted" title="DC Bill ಪುಟದಲ್ಲಿ ಬದಲಿಸಿ">DC</span>'}</td>`:''}</tr>`; }).join('') : `<tr class="empty-row"><td colspan="11">ವಹಿವಾಟುಗಳಿಲ್ಲ.</td></tr>`}</tbody></table></div>
      ${noTxnForm('payment')}
      ${cbDayTotals(c,month,acc)}
      ${cbBookTotals(c,month)}
      ${cbAbstract(acc,month)}
      ${cbBankBlock(acc,month)}
      ${cbCertificate(acc,month)}
      ${cbSendBar(acc,month)}
      ${cbSignBlock(acc,month)}
    </div>`;
  });
  const nPend=(DB.cashbookSigns||[]).filter(x=>x.status==='Submitted').length+cbRangeSigns().filter(x=>x.status==='Submitted').length;
  if(pr&&!window.__cbPrInit){ window.__cbPrInit=1; CB_TAB='send'; }
  const tabs=pr?[['send','✍ ಅನುಮೋದನೆ ('+nPend+' ಬಾಕಿ)'],['book','📒 ನಗದು ಪುಸ್ತಕ (ಓದಲು ಮಾತ್ರ)'],['view','👁 ವೀಕ್ಷಣೆ (View)']]:[['book','📒 ನಗದು ಪುಸ್ತಕ (ದಿನದ ಬರವಣಿಗೆ)'],['send','📤 ಸಹಿ / ಅನುಮೋದನೆ'],['view','👁 ವೀಕ್ಷಣೆ (View)'],['excel','📥 Excel ಅಪ್‌ಲೋಡ್ / ಡೌನ್‌ಲೋಡ್']];
  if(!tabs.some(t=>t[0]===CB_TAB)) CB_TAB='book';
  const tabBar=`<div class="gv-tabs no-print">${tabs.map(t=>`<button class="gv-tab ${t[0]===CB_TAB?'on':''}" onclick="cbTab('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
  const body={book:bookHtml+wipeHtml('cash'),send:sendHtml,view:cbViewHtml(),excel:excelHtml}[CB_TAB];
  const pi=html.indexOf('</div></div>')+12;
  document.getElementById('content').innerHTML='<div class="print-landscape">'+html.slice(0,pi)+((pr&&CB_TAB==='send')?'':cbAccPills())+html.slice(pi)+tabBar+body+'</div>';
}

function cbStep(d){
  let m=cbMonth(); if(m==='all') m=todayStr().slice(0,7);
  let y=+m.slice(0,4), mo=+m.slice(5,7)+d; if(mo>12){mo=1;y++;} if(mo<1){mo=12;y--;}
  CB_MONTH=y+'-'+String(mo).padStart(2,'0'); CB_FY=cbFYof(CB_MONTH); renderCashbook();
}
function cbBookTotals(c,month){
  if(month==='all') return '';
  const lab=cbMonthLabel(month), tot=c.opening+c.rT, tot2=c.pT+c.closing;
  return `<h4 style="margin:18px 0 6px;font-size:13px;color:var(--navy);">📒 ತಿಂಗಳ ಸಾರಾಂಶ — ${esc(lab)} (ಜಮೆ ಮತ್ತು ಖರ್ಚು ಸಮತೋಲನ)</h4>
  <div class="table-wrap"><table><thead><tr><th colspan="2">ಜಮೆ (RECEIPTS)</th><th colspan="2">ಖರ್ಚು (PAYMENTS)</th></tr></thead><tbody>
  <tr><td>ಆರಂಭದ ಶಿಲ್ಕು (Opening Balance b/f)</td><td style="text-align:right;">${money(c.opening)}</td><td>ಈ ತಿಂಗಳ ಒಟ್ಟು ಖರ್ಚು</td><td style="text-align:right;">${money(c.pT)}</td></tr>
  <tr><td>ಈ ತಿಂಗಳ ಒಟ್ಟು ಜಮೆ</td><td style="text-align:right;">${money(c.rT)}</td><td>ಅಂತಿಮ ಶಿಲ್ಕು (Closing Balance c/f)</td><td style="text-align:right;">${money(c.closing)}</td></tr>
  <tr style="font-weight:800;background:var(--surface-2);"><td>ಒಟ್ಟು</td><td style="text-align:right;">${money(tot)}</td><td>ಒಟ್ಟು</td><td style="text-align:right;">${money(tot2)}</td></tr></tbody></table></div>
  <div class="helper">ಎರಡೂ ಕಡೆಯ ಒಟ್ಟು ಸಮನಾಗಿರಬೇಕು ${Math.abs(tot-tot2)<0.005?'✅ ಸಮನಾಗಿದೆ':'❌ ವ್ಯತ್ಯಾಸ '+money(tot-tot2)}</div>`;
}
function cbAbstract(acc,month){
  if(month==='all') return '';
  const fy=cbFYof(month), fyStart=fy+'-04', net=b=>Number(b.amount||0)-Number(b.deduction||0);
  const heads=[...ACCOUNTS[acc].heads];
  const rAll=DB.receipts[acc]||[], pAll=DB.bills.filter(b=>b.account===acc&&(b.status==='Paid'||b.status==='Closed'));
  const M=d=>String(d||'').slice(0,7);
  const rowsFor=(list,dateOf,amtOf)=>{
    const map={};
    list.forEach(x=>{ const m=M(dateOf(x)); if(!m||m<fyStart||m>month) return; const h=x.head||'—'; if(!heads.includes(h)) heads.push(h); const o=map[h]=map[h]||{cur:0,prev:0}; if(m===month) o.cur+=amtOf(x); else o.prev+=amtOf(x); });
    return map;
  };
  const rm=rowsFor(rAll,r=>r.date,r=>Number(r.amount||0)), pm=rowsFor(pAll,cbPayDate,net);
  const tbl=(title,m)=>{
    let tc=0,tp=0; const rows=heads.filter(h=>m[h]).map(h=>{ const o=m[h]; tc+=o.cur; tp+=o.prev; return `<tr><td>${esc(h)}</td><td style="text-align:right;">${money(o.prev)}</td><td style="text-align:right;">${money(o.cur)}</td><td style="text-align:right;">${money(o.prev+o.cur)}</td></tr>`; }).join('');
    return `<div class="table-wrap"><table><thead><tr><th>${title}</th><th style="text-align:right;">ಹಿಂದಿನ ತಿಂಗಳುಗಳವರೆಗೆ (ವರ್ಷದ ಆರಂಭದಿಂದ)</th><th style="text-align:right;">ಈ ತಿಂಗಳು</th><th style="text-align:right;">ಇಲ್ಲಿಯವರೆಗೆ ಒಟ್ಟು</th></tr></thead><tbody>${rows||'<tr class="empty-row"><td colspan="4">—</td></tr>'}<tr style="font-weight:800;background:var(--surface-2);"><td>ಒಟ್ಟು</td><td style="text-align:right;">${money(tp)}</td><td style="text-align:right;">${money(tc)}</td><td style="text-align:right;">${money(tp+tc)}</td></tr></tbody></table></div>`;
  };
  return `<h4 style="margin:18px 0 6px;font-size:13px;color:var(--navy);">📊 ಶೀರ್ಷಿಕೆವಾರು ವರ್ಗೀಕೃತ ಸಾರಾಂಶ (Classified Abstract) — ವರ್ಷ ${fy}-${String(fy+1).slice(2)}</h4>${tbl('ಜಮೆ — ಶೀರ್ಷಿಕೆ',rm)}${tbl('ಖರ್ಚು — ಶೀರ್ಷಿಕೆ',pm)}`;
}
function cbCertificate(acc,month){
  if(month==='all') return '';
  return `<div style="margin-top:16px;font-size:12px;line-height:1.7;border:1px solid #000;padding:8px 12px;page-break-inside:avoid;">ಪ್ರಮಾಣ: ${esc(cbMonthLabel(month))} ತಿಂಗಳ ನಗದು ಪುಸ್ತಕದ ಎಲ್ಲಾ ನಮೂದುಗಳನ್ನು ಮೂಲ ರಸೀದಿ / ವೋಚರ್‌ಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಅಂತಿಮ ಶಿಲ್ಕು ${money(cbCompute(acc,month).closing)} ಸರಿಯಾಗಿದ್ದು, ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್‌ನೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆ ಮಾಡಲಾಗಿದೆ.<br>ದಿನಾಂಕ: ${fmtDate(cbMonthEnd(month))}</div>`;
}

function cbToolbarHtml(month){
  const fda=CURRENT_USER.role==='fda';
  return `<div class="panel no-print"><h3>⬇ Excel ವರದಿ — ನೀವು ನೀಡಿದ CashBook ಮಾದರಿ (ಆರಿಸಿದ ಖಾತೆ ಮಾತ್ರ)</h3>
    <div class="form-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="cbExportExcel('month')" ${month==='all'?'disabled':''}>⬇ ಈ ತಿಂಗಳು (${month==='all'?'—':esc(cbMonthLabel(month))})</button>
      <button class="btn btn-primary btn-sm" onclick="cbExportExcel('fy')">⬇ ಇಡೀ ವರ್ಷ ${cbFY()}-${String(cbFY()+1).slice(2)} (ಎಲ್ಲಾ 12 ತಿಂಗಳು)</button>
      <button class="btn btn-outline btn-sm" onclick="cbExportExcel('all')">⬇ ಎಲ್ಲಾ ವರ್ಷಗಳು / ಎಲ್ಲಾ ತಿಂಗಳು</button></div>
    <div class="helper">ಪ್ರತಿ ತಿಂಗಳಿಗೆ ಪ್ರತಿ ಖಾತೆಗೆ ಒಂದು ಶೀಟ್ (ಜಮೆ | ಖರ್ಚು ಅಕ್ಕಪಕ್ಕ), ದಿನವಾರು ಲೆಕ್ಕ (ಎಲ್ಲಾ ದಿನಾಂಕಗಳು) ಮತ್ತು ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ ಶೀಟ್‌ಗಳು ಇರುತ್ತವೆ. ಇದೇ ಫೈಲ್ ಅನ್ನು ಕೆಳಗಿನ "Excel Upload" ನಲ್ಲಿ ಮತ್ತೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.</div>
    ${(fda&&month!=='all')?`<div class="form-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
      <button class="btn btn-outline btn-sm" onclick="cbFillNoTxn('pending')">🚫 ಬಾಕಿ ದಿನಗಳೆಲ್ಲ: ವಹಿವಾಟುಗಳಿಲ್ಲ (ಇಂದಿನವರೆಗೆ)</button>
      <button class="btn btn-outline btn-sm" onclick="cbFillNoTxn('month')">🚫 ಇಡೀ ತಿಂಗಳು: ವಹಿವಾಟುಗಳಿಲ್ಲ</button>
      <button class="btn btn-outline btn-sm" onclick="cbClearNoTxn()">↩ ಈ ತಿಂಗಳ "ವಹಿವಾಟುಗಳಿಲ್ಲ" ಗುರುತು ತೆಗೆಯಿರಿ</button></div>
      <div class="helper">ವಹಿವಾಟು ಇರುವ ದಿನಗಳನ್ನು ಮುಟ್ಟುವುದಿಲ್ಲ. ಆರಿಸಿದ ಖಾತೆಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ. ಸಹಿಗೆ ಕಳುಹಿಸಿದ ತಿಂಗಳು ಬಿಟ್ಟುಹೋಗುತ್ತದೆ.</div>`:''}</div>`;
}
function cbFillNoTxn(mode){
  const month=cbMonth(); if(month==='all'){ showToast('⚠ ತಿಂಗಳು ಆರಿಸಿ'); return; }
  if(!confirm(cbMonthLabel(month)+' — '+(mode==='pending'?'ವಹಿವಾಟು ಇಲ್ಲದ ಇಂದಿನವರೆಗಿನ ಎಲ್ಲಾ ದಿನಗಳಿಗೆ':'ವಹಿವಾಟು ಇಲ್ಲದ ತಿಂಗಳ ಎಲ್ಲಾ ದಿನಗಳಿಗೆ')+' "ವಹಿವಾಟುಗಳಿಲ್ಲ" ಗುರುತಿಸಬೇಕೇ? (ಎರಡೂ ಖಾತೆ)')) return;
  if(!Array.isArray(DB.cashNoTxn)) DB.cashNoTxn=[];
  const today=todayStr(); let n=0, lk=0;
  cbAccs().forEach(acc=>{
    if(cbLocked(acc,month)){ lk++; return; }
    cbDatesOf(month).forEach(d=>{
      if(mode==='pending'&&d>today) return;
      if(cbLocked(acc,d)) return;
      ['receipt','payment'].forEach(sec=>{
        const has=sec==='receipt'?(DB.receipts[acc]||[]).some(r=>r.date===d):DB.bills.some(b=>b.account===acc&&(b.status==='Paid'||b.status==='Closed')&&cbPayDate(b)===d);
        if(has||DB.cashNoTxn.some(x=>x.account===acc&&x.section===sec&&x.date===d)) return;
        DB.cashNoTxn.push({id:uid(),account:acc,section:sec,date:d,createdBy:CURRENT_USER.name}); n++;
      });
    });
  });
  saveDB(); showToast('✅ '+n+' "ವಹಿವಾಟುಗಳಿಲ್ಲ" ಗುರುತಿಸಲಾಗಿದೆ'+(lk?' · ಸಹಿಗೆ ಕಳುಹಿಸಿದ '+lk+' ಖಾತೆ ಬಿಟ್ಟಿದೆ':''),6000); renderCashbook();
}
function cbClearNoTxn(){
  const month=cbMonth(); if(month==='all') return;
  if(!confirm(cbMonthLabel(month)+' ತಿಂಗಳ ಎಲ್ಲಾ "ವಹಿವಾಟುಗಳಿಲ್ಲ" ಗುರುತುಗಳನ್ನು ತೆಗೆಯಬೇಕೇ? (ನಿಜವಾದ ವಹಿವಾಟುಗಳು ಹಾಗೇ ಇರುತ್ತವೆ)')) return;
  const before=(DB.cashNoTxn||[]).length;
  DB.cashNoTxn=(DB.cashNoTxn||[]).filter(x=>x.account!==CB_ACC||!(String(x.date||'').slice(0,7)===month&&!cbLocked(x.account,month)));
  saveDB(); showToast('🗑 '+(before-DB.cashNoTxn.length)+' ಗುರುತು ತೆಗೆಯಲಾಗಿದೆ'); renderCashbook();
}
function cbDmy(d){ d=String(d||''); return /^\d{4}-\d{2}-\d{2}$/.test(d)?(d.slice(8,10)+'-'+d.slice(5,7)+'-'+d.slice(0,4)):d; }
function cbSheetAoa(acc,month){
  const c=cbCompute(acc,month);
  const noAll=(DB.cashNoTxn||[]).filter(n=>n.account===acc&&String(n.date||'').slice(0,7)===month);
  const byDate=(a,b)=>String(a.date||'').localeCompare(String(b.date||''));
  const rR=[...c.receipts.map(r=>({date:r.date||'',a:[r.inwardNo||'',cbDmy(r.date),r.source||'',Number(r.amount||0),r.head||'',cbRowSign(acc,r.date)]})),
            ...noAll.filter(n=>n.section==='receipt').map(n=>({date:n.date,a:['',cbDmy(n.date),'ವ್ಯವಹಾರವಿಲ್ಲ','','',cbRowSign(acc,n.date)]}))].sort(byDate);
  const pR=[...c.payments.map(p=>({date:cbPayDate(p),a:[p.voucher||'',cbDmy(cbPayDate(p)),p.payee||'',p.cheque||'',p.orderNo||'',Number(p.amount||0),Number(p.deduction||0),Number(p.amount||0)-Number(p.deduction||0),p.head||'',cbRowSign(acc,cbPayDate(p))]})),
            ...noAll.filter(n=>n.section==='payment').map(n=>({date:n.date,a:['',cbDmy(n.date),'ವ್ಯವಹಾರವಿಲ್ಲ','','','','','','',cbRowSign(acc,n.date)]}))].sort(byDate);
  const rows=[]; const e=n=>Array(n).fill('');
  rows.push(['ಜಮೆ ವಿವರಗಳು (RECEIPTS)',...e(6),'ಖರ್ಚು / ಪಾವತಿ ವಿವರಗಳು (PAYMENTS)',...e(10)]);
  rows.push(['ಕ್ರ.ಸಂ','ಇನ್‌ವರ್ಡ್ ಸಂ.','ದಿನಾಂಕ','ಮೂಲ','ಮೊತ್ತ (₹)','ಶೀರ್ಷಿಕೆ','ಸಹಿ','ಕ್ರ.ಸಂ','ವೋಚರ್ ಸಂ.','ದಿನಾಂಕ','ವಿವರ','ಚೆಕ್ ಸಂ.','ಆದೇಶ ಸಂ.','ಒಟ್ಟು (₹)','ಕಡಿತ (₹)','ನಿವ್ವಳ (₹)','ಶೀರ್ಷಿಕೆ','ಸಹಿ']);
  const n=Math.max(rR.length,pR.length);
  for(let i=0;i<n;i++){
    const L=rR[i]?[i+1,...rR[i].a]:e(7), R=pR[i]?[i+1,...pR[i].a]:e(11);
    // receipt row layout: [no, inward, date, source, amount, head, sign]
    rows.push([...L,...R]);
  }
  rows.push(['','','','ಒಟ್ಟು',c.rT,'','','','','','','','',c.payments.reduce((a,b)=>a+Number(b.amount||0),0),c.payments.reduce((a,b)=>a+Number(b.deduction||0),0),c.pT,'','']);
  rows.push(e(18));
  const sg=cbSign(acc,month);
  [['ಖಾತೆ',ACCOUNTS[acc].name+' ('+ACCOUNTS[acc].id+')'],['ತಿಂಗಳು',cbMonthLabel(month)],['ಸ್ಥಿತಿ',sg?sg.status:'Open'],['ಆರಂಭಿಕ ಶಿಲ್ಕು',c.opening],['ಒಟ್ಟು ಜಮಾ',c.rT],['ವರ್ಗಾವಣೆ ಒಳ',0],['ಒಟ್ಟು ಪಾವತಿ (ನಿವ್ವಳ)',c.pT],['ವರ್ಗಾವಣೆ ಹೊರ',0],['ಮುಕ್ತಾಯ ಶಿಲ್ಕು',c.closing]]
    .forEach(([k,v])=>rows.push(['','','',k,v,...e(13)]));
  return rows;
}
function cbExportExcel(scope){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  let months;
  if(scope==='month'){ const m=cbMonth(); if(m==='all'){ showToast('⚠ ತಿಂಗಳು ಆರಿಸಿ'); return; } months=[m]; }
  else if(scope==='fy') months=cbMonthOptions();
  else { months=[]; cbFYList().slice().reverse().forEach(fy=>{ for(let i=0;i<12;i++){ const mo=((3+i)%12)+1, y=mo>=4?fy:fy+1; months.push(y+'-'+String(mo).padStart(2,'0')); } }); }
  const wb=XLSX.utils.book_new(), names=new Set();
  const nm=x=>{ x=x.slice(0,31); let k=x,i=2; while(names.has(k)) k=x.slice(0,28)+'~'+(i++); names.add(k); return k; };
  const setW=(ws,w)=>{ ws['!cols']=w.map(x=>({wch:x})); };
  months.forEach(m=>cbAccs().forEach(acc=>{
    const ws=XLSX.utils.aoa_to_sheet(cbSheetAoa(acc,m));
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:6}},{s:{r:0,c:7},e:{r:0,c:17}}]; setW(ws,[6,12,12,28,12,22,14,6,12,12,28,12,12,12,10,12,22,14]);
    XLSX.utils.book_append_sheet(wb,ws,nm(acc+' '+m));
  }));
  months.forEach(m=>cbAccs().forEach(acc=>{
    const rows=[['ದಿನಾಂಕ','ಸ್ವೀಕೃತಿ','','','ಪಾವತಿ','','','ಷರಾ'],['','ಆರಂಭಿಕ ಶಿಲ್ಕು (OB)','ಜಮಾ','ಒಟ್ಟು','ಖರ್ಚು','ಉಳಿಕೆ','ಒಟ್ಟು','']];
    cbDayRows(acc,m).forEach(x=>rows.push([cbDmy(x.date),x.open,x.r,x.tot,x.p,x.close,x.tot2,x.remark==='ನಮೂದಿಸಿಲ್ಲ'?'':x.remark]));
    const ws=XLSX.utils.aoa_to_sheet(rows); ws['!merges']=[{s:{r:0,c:1},e:{r:0,c:3}},{s:{r:0,c:4},e:{r:0,c:6}}]; setW(ws,[12,16,12,12,12,12,12,18]);
    XLSX.utils.book_append_sheet(wb,ws,nm('Day totals '+acc+' '+m));
  }));
  months.forEach(m=>cbAccs().forEach(acc=>{
    const asOn=cbMonthEnd(m), R=brData(acc,asOn);
    const rows=[['Morarji Desai Residential School (BC-265) - Bank Reconciliation Statement as on '+cbDmy(asOn)+' - '+ACCOUNTS[acc].name],[],
      ['Balance as per Cash Book',R.book],['Add: cheques issued, not yet paid by the bank',R.outTot],['Less: deposits not yet credited by the bank',R.rcTot],['Expected balance as per bank',R.expectedBank],
      ['Actual balance as per bank passbook',R.bank&&R.bank.amount!=null?R.bank.amount:''],['Difference',R.bank&&R.bank.amount!=null?R.bank.amount-R.expectedBank:''],[],
      ['Outstanding cheques'],['Sl','Cheque no','Cheque date','Payee / details','Amount (₹)','Valid until','Status'],
      ...R.outstanding.map((x,i)=>[i+1,x.b.cheque,cbDmy(x.cd),x.b.payee,x.amt,cbDmy(x.valid),x.stale?'Expired':'Valid']),['','','','Total',R.outTot]];
    const ws=XLSX.utils.aoa_to_sheet(rows); setW(ws,[46,16,14,30,14,14,10]);
    XLSX.utils.book_append_sheet(wb,ws,nm('BRS '+acc+' '+m));
  }));
  const fname='CashBook_'+(scope==='month'?months[0]:scope==='fy'?('FY'+cbFY()+'-'+String(cbFY()+1).slice(2)):'AllMonths')+'.xlsx';
  XLSX.writeFile(wb,fname); showToast('✅ '+fname+' ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ ('+months.length+' ತಿಂಗಳು × 2 ಖಾತೆ)',5000);
}

var CB_TAB='book', CB_ACC='main';
function cbAccs(){ return [CB_ACC==='joint'?'joint':'main']; }
function cbPage(){ return 'cashbook'; }
function cbTab(t){ CB_TAB=t; renderCashbook(); window.scrollTo({top:0}); }
function cbSetAcc(a){ CB_ACC=(a==='joint'?'joint':'main'); renderCashbook(); }
function cbAccPills(){
  const mk=(k,l)=>`<button class="gv-tab ${CB_ACC===k?'on':''}" style="padding:5px 14px;" onclick="cbSetAcc('${k}')">${l}</button>`;
  return `<div class="no-print" style="display:flex;gap:0;margin-bottom:10px;flex-wrap:wrap;">${mk('main','🏦 '+esc(ACCOUNTS.main.name))}${mk('joint','🏦 ವಾರ್ಡನ್-ಪ್ರಾಂಶುಪಾಲರ ಜಂಟಿ ಖಾತೆ')}</div>`;
}
var CB_EDIT=null;
var CB_VIEW={acc:'main',from:'',to:'',head:'',show:false};
function cbV(id){ const e=document.getElementById(id); return e?e.value:''; }
function cbSetV(id,v){ const e=document.getElementById(id); if(e) e.value=v; }
function cbCancelEdit(){ CB_EDIT=null; renderCashbook(); }
function cbMark(kind,acc){
  const rb=document.getElementById('rcpt_btn_'+acc), pb=document.getElementById('pay_btn_'+acc);
  const rc=document.getElementById('rcpt_cancel_'+acc), pc=document.getElementById('pay_cancel_'+acc);
  if(kind==='r'){ if(rb) rb.textContent='💾 ಜಮೆ ತಿದ್ದುಪಡಿ ಉಳಿಸಿ'; if(rc) rc.style.display=''; }
  else { if(pb) pb.textContent='💾 ಪಾವತಿ ತಿದ್ದುಪಡಿ ಉಳಿಸಿ'; if(pc) pc.style.display=''; }
}
function cbEditRc(acc,id){
  const r=(DB.receipts[acc]||[]).find(x=>x.id===id); if(!r) return;
  if(cbLocked(acc,r.date)){ showToast('⚠ ಈ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  CB_EDIT={kind:'r',id};
  cbSetV('rcpt_date_'+acc,r.date); cbSetV('rcpt_inward_'+acc,r.inwardNo||''); cbSetV('rcpt_source_'+acc,r.source||''); cbSetV('rcpt_amt_'+acc,r.amount); cbSetV('rcpt_head_'+acc,r.head||'');
  cbMark('r',acc); const e=document.getElementById('rcpt_date_'+acc); if(e) e.scrollIntoView({behavior:'smooth',block:'center'});
}
function cbDelRc(acc,id){
  const r=(DB.receipts[acc]||[]).find(x=>x.id===id); if(!r) return;
  if(cbLocked(acc,r.date)){ showToast('⚠ ಈ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  if(!confirm('ಈ ಜಮೆಯನ್ನು ಅಳಿಸಬೇಕೇ?\n'+fmtDate(r.date)+' — '+(r.source||'')+' — '+money(r.amount))) return;
  DB.receipts[acc]=DB.receipts[acc].filter(x=>x.id!==id); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); renderCashbook();
}
function cbAddPayment(acc){
  const date=cbV('pay_date_'+acc), voucher=cbV('pay_voucher_'+acc).trim(), payee=cbV('pay_payee_'+acc).trim(), cheque=cbV('pay_cheque_'+acc).trim(), orderNo=cbV('pay_order_'+acc).trim();
  const amount=Number(cbV('pay_amt_'+acc)||0), deduction=Number(cbV('pay_ded_'+acc)||0), head=cbV('pay_head_'+acc);
  if(!payee||amount<=0){ showToast('⚠ ವಿವರ/ಪಾವತಿದಾರ ಮತ್ತು ಮೊತ್ತ ಅಗತ್ಯ'); return; }
  if(deduction<0||deduction>amount){ showToast('⚠ ಕಡಿತ ಮೊತ್ತ ಸರಿಯಿಲ್ಲ'); return; }
  if(!date){ showToast('⚠ ದಿನಾಂಕ ಅಗತ್ಯ'); return; }
  if(cbLocked(acc,date)){ showToast('⚠ ಈ ತಿಂಗಳ ನಗದು ಪುಸ್ತಕ ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ',5000); return; }
  if(CB_EDIT&&CB_EDIT.kind==='p'){
    const b=DB.bills.find(x=>x.id===CB_EDIT.id);
    if(b){ if(cbLocked(b.account,cbPayDate(b))){ showToast('⚠ ಮೂಲ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
      Object.assign(b,{date,paidDate:date,voucher,payee,cheque,orderNo,amount,deduction,head}); CB_EDIT=null; if(CB_MONTH!=='all') CB_MONTH=date.slice(0,7); saveDB(); showToast('✅ ಪಾವತಿ ತಿದ್ದುಪಡಿ ಆಗಿದೆ'); navigate(cbPage()); return; }
  }
  DB.bills.push({id:uid(),account:acc,payee,billNo:'',date,amount,head,cheque,voucher,orderNo,deduction,status:'Paid',paidDate:date,createdAt:todayStr(),createdBy:CURRENT_USER.name,createdByRole:CURRENT_USER.role,manual:true,fileData:null,fileName:null});
  if(CB_MONTH!=='all') CB_MONTH=date.slice(0,7);
  saveDB(); showToast('✅ ಪಾವತಿ ನಮೂದಿಸಲಾಗಿದೆ'); navigate(cbPage());
}
function cbEditPay(acc,id){
  const b=DB.bills.find(x=>x.id===id); if(!b) return;
  if(cbLocked(acc,cbPayDate(b))){ showToast('⚠ ಈ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  CB_EDIT={kind:'p',id};
  cbSetV('pay_date_'+acc,cbPayDate(b)); cbSetV('pay_voucher_'+acc,b.voucher||''); cbSetV('pay_payee_'+acc,b.payee||''); cbSetV('pay_cheque_'+acc,b.cheque||''); cbSetV('pay_order_'+acc,b.orderNo||'');
  cbSetV('pay_amt_'+acc,b.amount); cbSetV('pay_ded_'+acc,b.deduction||0); cbSetV('pay_head_'+acc,b.head||'');
  cbMark('p',acc); const e=document.getElementById('pay_date_'+acc); if(e) e.scrollIntoView({behavior:'smooth',block:'center'});
}
function cbDelPay(id){
  const b=DB.bills.find(x=>x.id===id); if(!b) return;
  if(cbLocked(b.account,cbPayDate(b))){ showToast('⚠ ಈ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  if(!confirm('ಈ ಪಾವತಿಯನ್ನು ಅಳಿಸಬೇಕೇ?\n'+fmtDate(cbPayDate(b))+' — '+(b.payee||'')+' — '+money(b.amount))) return;
  DB.bills=DB.bills.filter(x=>x.id!==id); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); renderCashbook();
}
function cbDayStep(d){
  const month=cbMonth(); if(month==='all') return;
  const base=(CB_DAY&&CB_DAY.slice(0,7)===month)?CB_DAY:(month===todayStr().slice(0,7)?todayStr():month+'-01');
  const dt=new Date(base+'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate()+d); const nd=dt.toISOString().slice(0,10);
  CB_MONTH=nd.slice(0,7); CB_FY=cbFYof(CB_MONTH); CB_DAY=nd; renderCashbook();
}
function cbViewSet(k,v){ CB_VIEW[k]=v; if(k==='acc') CB_VIEW.head=''; renderCashbook(); }
function cbViewShow(){ CB_VIEW.from=cbV('cbv_from')||CB_VIEW.from; CB_VIEW.to=cbV('cbv_to')||CB_VIEW.to; CB_VIEW.head=cbV('cbv_head'); CB_VIEW.show=true; CB_TAB='view'; renderCashbook(); }
function cbViewSignBlock(v){
  const rg=cbRangeSigns().find(x=>x.account===v.acc&&x.status==='Signed'&&x.from<=v.from&&v.to<=x.to);
  const mo=(v.from.slice(0,7)===v.to.slice(0,7))?cbSign(v.acc,v.from.slice(0,7)):null;
  const sg=rg||(mo&&mo.status==='Signed'?mo:null);
  const pr=(typeof STAFF!=='undefined'&&STAFF.find(x=>x.role==='principal'))||null, pname=pr?pr.name:'';
  const right=sg?cbDigiSign(sg,pname):`<div style="min-width:200px;text-align:right;"><div style="height:45px;"></div><div style="font-size:11px;border-top:1.5px solid #000;padding-top:3px;">${pname?('<b>'+esc(pname)+'</b><br>'):''}ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div></div>`;
  return `<div style="display:flex;justify-content:flex-end;margin-top:22px;page-break-inside:avoid;">${right}</div>`;
}
function cbViewHtml(){
  const v=CB_VIEW, month=cbMonth(); if(v.acc!==CB_ACC){ v.acc=CB_ACC; v.show=false; v.head=''; }
  if(!v.from){ const m=month==='all'?todayStr().slice(0,7):month; v.from=m+'-01'; v.to=cbMonthEnd(m); }
  const A=ACCOUNTS[v.acc], net=b=>Number(b.amount||0)-Number(b.deduction||0);
  const inR=d=>d&&d>=v.from&&d<=v.to;
  let box='';
  if(v.show){
    const rc=(DB.receipts[v.acc]||[]).filter(r=>inR(r.date)&&(!v.head||r.head===v.head)).sort((a,b)=>String(a.date).localeCompare(b.date));
    const pa=DB.bills.filter(b=>b.account===v.acc&&(b.status==='Paid'||b.status==='Closed')&&inR(cbPayDate(b))&&(!v.head||b.head===v.head)).sort((a,b)=>cbPayDate(a).localeCompare(cbPayDate(b)));
    const rT=rc.reduce((a,r)=>a+Number(r.amount||0),0), gT=pa.reduce((a,b)=>a+Number(b.amount||0),0), dT=pa.reduce((a,b)=>a+Number(b.deduction||0),0);
    box=`<div id="cbViewBox">${printHeaderHtml('ನಗದು ಪುಸ್ತಕ ವೀಕ್ಷಣೆ — '+A.name+' ('+A.id+')',fmtDate(v.from)+' ರಿಂದ '+fmtDate(v.to)+' ವರೆಗೆ'+(v.head?(' — '+v.head):''))}
    <div style="margin:8px 0;font-weight:700;color:var(--green);">Receipts ${money(rT)} &nbsp; Payments: gross ${money(gT)}, deduction ${money(dT)}, net ${money(gT-dT)}</div>
    <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಇನ್‌ವರ್ಡ್ ಸಂ.</th><th>ದಿನಾಂಕ</th><th>ಮೂಲ</th><th>ಮೊತ್ತ (₹)</th><th>ಶೀರ್ಷಿಕೆ</th></tr></thead><tbody>${rc.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.inwardNo||'—')}</td><td>${fmtDate(r.date)}</td><td>${esc(r.source||'—')}</td><td>${money(r.amount)}</td><td>${esc(r.head||'—')}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="6">ಜಮೆ ಇಲ್ಲ</td></tr>'}</tbody></table></div>
    <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ವೋಚರ್ ಸಂ.</th><th>ದಿನಾಂಕ</th><th>ವಿವರ</th><th>ಚೆಕ್ ಸಂ.</th><th>ಆದೇಶ ಸಂ.</th><th>ಒಟ್ಟು (₹)</th><th>ಕಡಿತ (₹)</th><th>ನಿವ್ವಳ (₹)</th><th>ಶೀರ್ಷಿಕೆ</th></tr></thead><tbody>${pa.map((b,i)=>`<tr><td>${i+1}</td><td>${esc(b.voucher||'—')}</td><td>${fmtDate(cbPayDate(b))}</td><td>${esc(b.payee)}</td><td>${esc(b.cheque||'—')}</td><td>${esc(b.orderNo||'—')}</td><td>${money(b.amount)}</td><td>${money(b.deduction||0)}</td><td>${money(net(b))}</td><td>${esc(b.head||'—')}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="10">ಪಾವತಿ ಇಲ್ಲ</td></tr>'}</tbody></table></div>${cbViewSignBlock(v)}</div>`;
  }
  return `<div class="panel no-print" style="border:2px solid var(--navy);"><h3>👁 ನಗದು ಪುಸ್ತಕ ವೀಕ್ಷಣೆ (View cash book)</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:8px;">
      <div style="font-weight:600;align-self:center;">🏦 ${esc(A.name)}</div>
      <div class="field" style="margin:0;"><label>From ಇಂದ</label><input type="date" id="cbv_from" value="${v.from}"></div>
      <div class="field" style="margin:0;"><label>To ವರೆಗೆ</label><input type="date" id="cbv_to" value="${v.to}"></div>
      <div class="field" style="margin:0;"><label>Head ಶೀರ್ಷಿಕೆ</label><select id="cbv_head"><option value="">All heads</option>${A.heads.map(h=>`<option ${h===v.head?'selected':''}>${esc(h)}</option>`).join('')}</select></div>
      <button class="btn btn-primary btn-sm" onclick="cbViewShow()">Show</button>
      ${v.show?`<button class="btn btn-gold btn-sm" onclick="printEl(document.getElementById('cbViewBox'))">🖨 Print / PDF</button>`:''}</div></div>${box?`<div class="panel">${box}</div>`:''}`;
}

function wipeHtml(kind){
  if(CURRENT_USER.role!=='fda') return '';
  const isCb=kind==='cash';
  return `<div class="panel no-print" style="border:2px solid var(--red);"><h3 style="color:var(--red);">🗑 ${isCb?'ನಗದು ಪುಸ್ತಕ':'ಸ್ಟಾಕ್ ವಹಿ'} — ಹಿಂದಿನ ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ</h3>
    ${isCb?`<div style="margin-bottom:8px;font-weight:600;">ಯಾವ ಖಾತೆ?
      <label style="margin-left:10px;"><input type="radio" name="wipe_acc" value="main" ${CB_ACC!=='joint'?'checked':''}> ${esc(ACCOUNTS.main.name)}</label>
      <label style="margin-left:10px;"><input type="radio" name="wipe_acc" value="joint" ${CB_ACC==='joint'?'checked':''}> ವಾರ್ಡನ್-ಪ್ರಾಂಶುಪಾಲರ ಜಂಟಿ ಖಾತೆ</label>
      <label style="margin-left:10px;"><input type="radio" name="wipe_acc" value="both"> ಎರಡೂ ಖಾತೆಗಳ ಡೇಟಾ</label></div>`:''}
    <div class="helper" style="margin-bottom:8px;">${isCb
      ?`<label style="display:block;"><input type="checkbox" id="wipe_a" checked> ಜಮೆ, "ವಹಿವಾಟುಗಳಿಲ್ಲ", ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ ಸ್ಥಿತಿ (ತಿಂಗಳ + ಅವಧಿ ಪಟ್ಟಿ), ಬ್ಯಾಂಕ್ ಶಿಲ್ಕುಗಳು, ಖರ್ಚು ನಮೂದುಗಳು (ಖರ್ಚು ನಮೂದುಗಳು ಖಾತೆ-ವಾರು ಇಲ್ಲ — "ಎರಡೂ ಖಾತೆ" ಆರಿಸಿದಾಗ ಮಾತ್ರ)</label>
         <label style="display:block;"><input type="checkbox" id="wipe_b" checked> ಬಿಲ್‌ಗಳು — ಪಾವತಿ ಆದ ಮತ್ತು ಬಾಕಿ ಇರುವ ಎಲ್ಲಾ DC Bill ಗಳು (ಆರಿಸಿದ ಖಾತೆಯವು)</label>
         <label style="display:block;"><input type="checkbox" id="wipe_c"> Opening Balance ಅನ್ನೂ 0 ಮಾಡಿ</label>`
      :`ಎಲ್ಲಾ ವಿಭಾಗಗಳ ದಾಸ್ತಾನು (receive), ವಿತರಣೆ (issue) ಮತ್ತು ಮಾಸಿಕ ಪ್ರಾಂಶುಪಾಲರ ವರದಿ ಸ್ಥಿತಿ ಅಳಿಸಲಾಗುತ್ತದೆ.`}</div>
    <button class="btn btn-sm" style="background:var(--red);color:#fff;" onclick="wipeData('${kind}')">🗑 ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ (ಮೊದಲು ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತದೆ)</button></div>`;
}
function wipeData(kind){
  if(CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ'); return; }
  const isCb=kind==='cash';
  const wr=document.querySelector('input[name=wipe_acc]:checked'); const WA=wr?wr.value:'both';
  const accs=WA==='both'?['main','joint']:[WA];
  const a=!isCb||(document.getElementById('wipe_a')||{}).checked, b=isCb&&(document.getElementById('wipe_b')||{}).checked, c=isCb&&(document.getElementById('wipe_c')||{}).checked;
  if(isCb&&!a&&!b&&!c){ showToast('⚠ ಏನನ್ನು ಅಳಿಸಬೇಕೆಂದು ಆರಿಸಿ'); return; }
  const word=prompt('⚠ ಇದು ಹಿಂತಿರುಗಿಸಲಾಗುವುದಿಲ್ಲ.\n'+(isCb?(WA==='main'?'ಮುಖ್ಯ ಶಾಲಾ ಖಾತೆಯ':WA==='joint'?'ಜಂಟಿ (ವಾರ್ಡನ್-ಪ್ರಾಂಶುಪಾಲ) ಖಾತೆಯ':'ಎರಡೂ ಖಾತೆಗಳ ನಗದು ಪುಸ್ತಕದ'):'ಸ್ಟಾಕ್ ವಹಿಯ')+' ಎಲ್ಲಾ ಹಿಂದಿನ ಡೇಟಾ ಅಳಿಸಲಾಗುತ್ತದೆ (ಮೊದಲು ಬ್ಯಾಕಪ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತದೆ).\n\nಖಚಿತವಾಗಿದ್ದರೆ ಕೆಳಗೆ  DELETE  ಎಂದು ಟೈಪ್ ಮಾಡಿ:');
  if(word===null) return;
  if(String(word).trim().toUpperCase()!=='DELETE'){ showToast('ರದ್ದು — DELETE ಎಂದು ಟೈಪ್ ಮಾಡಿಲ್ಲ'); return; }
  try{
    const bk=isCb?{receipts:DB.receipts,cashNoTxn:DB.cashNoTxn,cashbookSigns:DB.cashbookSigns,cashbookRangeSigns:DB.cashbookRangeSigns,expenseEntries:DB.expenseEntries,bankBalances:DB.bankBalances,cashOpening:DB.cashOpening,bills:DB.bills}:{stock:DB.stock,stockMonthly:DB.stockMonthly};
    const blob=new Blob([JSON.stringify(bk,null,1)],{type:'application/json'}); const u=URL.createObjectURL(blob);
    const l=document.createElement('a'); l.href=u; l.download='BACKUP_'+(isCb?'cashbook':'stock')+'_'+todayStr()+'.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),5000);
  }catch(e){ if(!confirm('ಬ್ಯಾಕಪ್ ಆಗಲಿಲ್ಲ ('+e.message+'). ಆದರೂ ಅಳಿಸಬೇಕೇ?')) return; }
  let n=0;
  if(isCb){
    const inA=x=>accs.includes(x&&x.account);
    if(a){
      accs.forEach(k=>{ n+=(DB.receipts[k]||[]).length; DB.receipts[k]=[]; });
      ['cashNoTxn','cashbookSigns','cashbookRangeSigns','bankBalances'].forEach(k=>{ const cur=DB[k]||[]; const keep=cur.filter(x=>!inA(x)); n+=cur.length-keep.length; DB[k]=keep; });
      if(WA==='both'){ n+=(DB.expenseEntries||[]).length; DB.expenseEntries=[]; }
    }
    if(b){ const cur=DB.bills||[]; const keep=cur.filter(x=>!inA(x)); n+=cur.length-keep.length; DB.bills=keep; }
    if(c){ accs.forEach(k=>{ DB.cashOpening[k]=0; }); }
    CB_EDIT=null; CB_DAY='';
  } else {
    Object.keys(DB.stock||{}).forEach(k=>{ n+=(DB.stock[k].receive||[]).length+(DB.stock[k].issue||[]).length; DB.stock[k]={receive:[],issue:[]}; });
    n+=(DB.stockMonthly||[]).length; DB.stockMonthly=[];
  }
  saveDB(); showToast('🗑 '+n+' ನಮೂದುಗಳು ಅಳಿಸಲಾಗಿದೆ. ಬ್ಯಾಕಪ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ. ಬೇರೆ ಫೋನ್/ಕಂಪ್ಯೂಟರ್‌ಗಳಲ್ಲಿ ಪುಟ ರಿಫ್ರೆಶ್ ಮಾಡಿ.',9000);
  navigate(isCb?cbPage():'stock');
}

function noTxnRow(n,idx,span){
  const fda=CURRENT_USER.role==='fda';
  return `<tr style="background:#fff8e6"><td>${idx+1}</td><td>—</td><td>${fmtDate(n.date)}</td><td colspan="${span}" style="text-align:center;font-weight:700;">ವ್ಯವಹಾರವಿಲ್ಲ</td><td>${esc(cbRowSign(n.account,n.date))}${(fda&&!cbLocked(n.account,n.date))?` <button class="btn btn-outline btn-sm no-print" onclick="delNoTxn('${n.id}')">🗑</button>`:''}</td></tr>`;
}

function addNoTxn(acc,section){
  const el=document.getElementById('nt_date_'+section+'_'+acc); const date=el&&el.value;
  if(!date){ showToast('⚠ ದಿನಾಂಕ ಆರಿಸಿ'); return; }
  if(!Array.isArray(DB.cashNoTxn)) DB.cashNoTxn=[];
  if(cbLocked(acc,date)){ showToast('⚠ ಈ ತಿಂಗಳ ನಗದು ಪುಸ್ತಕ ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ',5000); return; }
  if(DB.cashNoTxn.some(n=>n.account===acc&&n.section===section&&n.date===date)){ showToast('⚠ ಈ ದಿನಾಂಕಕ್ಕೆ ಈಗಾಗಲೇ "ವ್ಯವಹಾರವಿಲ್ಲ" ನಮೂದಿಸಲಾಗಿದೆ'); return; }
  const hasTxn = section==='receipt'
    ? (DB.receipts[acc]||[]).some(r=>r.date===date)
    : DB.bills.some(b=>b.account===acc&&(b.status==='Paid'||b.status==='Closed')&&(b.paidDate||b.date)===date);
  if(hasTxn && !confirm('ಈ ದಿನಾಂಕದಂದು ವಹಿವಾಟು ಈಗಾಗಲೇ ಇದೆ. ಆದರೂ "ವ್ಯವಹಾರವಿಲ್ಲ" ನಮೂದಿಸಬೇಕೇ?')) return;
  DB.cashNoTxn.push({id:uid(), account:acc, section, date, createdBy:CURRENT_USER.name});
  if(CB_MONTH!=='all') CB_MONTH=date.slice(0,7);
  saveDB(); showToast('✅ ವ್ಯವಹಾರವಿಲ್ಲ ನಮೂದಿಸಲಾಗಿದೆ'); navigate(cbPage());
}

function delNoTxn(id){
  if(!confirm('ಈ "ವ್ಯವಹಾರವಿಲ್ಲ" ನಮೂದನ್ನು ಅಳಿಸಬೇಕೇ?')) return;
  const i=(DB.cashNoTxn||[]).findIndex(n=>n.id===id);
  if(i>=0 && cbLocked(DB.cashNoTxn[i].account,DB.cashNoTxn[i].date)){ showToast('⚠ ಈ ತಿಂಗಳು ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಅಳಿಸಲಾಗುವುದಿಲ್ಲ'); return; }
  if(i>=0){ DB.cashNoTxn.splice(i,1); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); navigate(cbPage()); }
}

function downloadCashbookTemplate(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const acc=(document.getElementById('cbImpAcc')||{}).value||'main';
  const heads=ACCOUNTS[acc].heads;
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([
    ['ಪ್ರಕಾರ (ಜಮೆ/ಪಾವತಿ/ವ್ಯವಹಾರವಿಲ್ಲ)','ದಿನಾಂಕ (YYYY-MM-DD)','ಇನ್‌ವರ್ಡ್/ವೋಚರ್ ಸಂ.','ಮೂಲ / ಪಾವತಿದಾರ','ಚೆಕ್ ಸಂ.','ಆದೇಶ ಸಂ.','ಮೊತ್ತ','ಕಡಿತ','ಶೀರ್ಷಿಕೆ'],
    ['ಜಮೆ',todayStr(),'IN-1','ಸರ್ಕಾರ ಅನುದಾನ','','',10000,'',heads[0]],
    ['ಪಾವತಿ',todayStr(),'V-1','ಪಾವತಿದಾರ ಹೆಸರು','123456','ORD-1',1000,0,heads[0]],
    ['ವ್ಯವಹಾರವಿಲ್ಲ',todayStr(),'','','','','','','']
  ]),'CashBook');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಶೀರ್ಷಿಕೆ ಪಟ್ಟಿ'],...heads.map(h=>[h])]),'Heads');
  XLSX.writeFile(wb,'CashBook_Import_Template_'+acc+'.xlsx');
}

function importCashbookExcel(input){
  const f=input.files&&input.files[0]; if(!f) return;
  const acc=document.getElementById('cbImpAcc').value; const heads=ACCOUNTS[acc].heads;
  let othersIdx=heads.findIndex(h=>/others|ಇತರೆ/i.test(h)); if(othersIdx<0) othersIdx=heads.length-1;
  readExcelRows(f,rows=>{
    input.value='';
    const rc=[], pay=[], nt=[]; let skipped=0, toOthers=0;
    rows.forEach((r,i)=>{
      const type=String(r[0]||'').trim().toLowerCase(); const date=xlDate(r[1]);
      if(!type||!date){ if(i>0 && r.some(x=>x!=='')) skipped++; return; }
      if(type.indexOf('ವ್ಯವಹಾರ')>=0||type.charAt(0)==='n'){ nt.push({date}); return; }
      const amount=xlNum(r[6]); if(amount<=0){ skipped++; return; }
      let hi=matchHeadIn(heads,r[8]); if(hi<0){ hi=othersIdx; toOthers++; }
      const row={date,no:String(r[2]||'').trim(),party:String(r[3]||'').trim(),cheque:String(r[4]||'').trim(),orderNo:String(r[5]||'').trim(),amount,deduction:xlNum(r[7]),head:heads[hi]};
      if(type.indexOf('ಜಮೆ')>=0||type.charAt(0)==='r') rc.push(row);
      else if(type.indexOf('ಪಾವತಿ')>=0||type.charAt(0)==='p') pay.push(row);
      else skipped++;
    });
    if(!rc.length&&!pay.length&&!nt.length){ showToast('⚠ ಆಮದು ಮಾಡಲು ಸರಿಯಾದ ಸಾಲುಗಳಿಲ್ಲ (Template ಬಳಸಿ)',6000); return; }
    const rTot=rc.reduce((a,x)=>a+x.amount,0), pTot=pay.reduce((a,x)=>a+x.amount,0);
    if(!confirm('ಖಾತೆ: '+ACCOUNTS[acc].name+'\nಜಮೆ: '+rc.length+' (₹'+rTot+')\nಪಾವತಿ: '+pay.length+' (₹'+pTot+')\nವ್ಯವಹಾರವಿಲ್ಲ: '+nt.length+(skipped?('\nಬಿಟ್ಟ ಸಾಲುಗಳು: '+skipped):'')+(toOthers?('\nಶೀರ್ಷಿಕೆ ಹೊಂದದೆ "ಇತರೆ" ಗೆ: '+toOthers):'')+'\nಮುಂದುವರಿಯಬೇಕೇ?')) return;
    let dup=0, added=0, lockedSkip=0;
    if(!DB.receipts[acc]) DB.receipts[acc]=[];
    rc.forEach(x=>{
      if(cbLocked(acc,x.date)){ lockedSkip++; return; }
      if(DB.receipts[acc].some(r=>r.date===x.date&&Number(r.amount)===x.amount&&(r.inwardNo||'')===x.no&&(r.source||'')===x.party)){ dup++; return; }
      DB.receipts[acc].push({id:uid(),date:x.date,inwardNo:x.no,source:x.party||'—',amount:x.amount,head:x.head,createdBy:CURRENT_USER.name,imported:true}); added++;
    });
    pay.forEach(x=>{
      if(cbLocked(acc,x.date)){ lockedSkip++; return; }
      if(DB.bills.some(b=>b.account===acc&&(b.paidDate||b.date)===x.date&&Number(b.amount)===x.amount&&(b.voucher||'')===x.no&&(b.payee||'')===x.party)){ dup++; return; }
      DB.bills.push({id:uid(),account:acc,payee:x.party||'—',billNo:'',date:x.date,amount:x.amount,head:x.head,cheque:x.cheque,voucher:x.no,orderNo:x.orderNo,deduction:x.deduction,
        status:'Paid',paidDate:x.date,createdAt:todayStr(),createdBy:CURRENT_USER.name,createdByRole:CURRENT_USER.role,fileData:null,fileName:null,imported:true}); added++;
    });
    if(!Array.isArray(DB.cashNoTxn)) DB.cashNoTxn=[];
    nt.forEach(x=>['receipt','payment'].forEach(sec=>{
      if(cbLocked(acc,x.date)){ lockedSkip++; return; }
      if(DB.cashNoTxn.some(n=>n.account===acc&&n.section===sec&&n.date===x.date)){ dup++; return; }
      DB.cashNoTxn.push({id:uid(),account:acc,section:sec,date:x.date,createdBy:CURRENT_USER.name}); added++;
    }));
    saveDB(); showToast('✅ '+added+' ನಮೂದುಗಳು ಆಮದಾಗಿವೆ'+(dup?(' ('+dup+' ಪುನರಾವರ್ತನೆ ಬಿಟ್ಟಿದೆ)'):'')+(lockedSkip?(' · ಸಹಿ ಆದ ತಿಂಗಳ '+lockedSkip+' ಸಾಲು ಬಿಟ್ಟಿದೆ'):''),6000);
    navigate(cbPage());
  });
}

function setOpening(acc){ if(cbAnyLocked(acc)){ showToast('⚠ ಸಹಿಗೆ ಕಳುಹಿಸಿದ/ಸಹಿ ಮಾಡಿದ ತಿಂಗಳುಗಳಿರುವಾಗ Opening ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ'); return; } DB.cashOpening[acc]=Number(document.getElementById('cob_'+acc).value||0); saveDB(); showToast('✅ ನವೀಕರಿಸಲಾಗಿದೆ'); navigate(cbPage()); }

function addReceipt(acc){
  const date=document.getElementById('rcpt_date_'+acc).value, inwardNo=document.getElementById('rcpt_inward_'+acc).value;
  const source=document.getElementById('rcpt_source_'+acc).value, amount=Number(document.getElementById('rcpt_amt_'+acc).value||0);
  const head=document.getElementById('rcpt_head_'+acc).value;
  if(!source||amount<=0){ showToast('⚠ ಮೂಲ ಮತ್ತು ಮೊತ್ತ ಅಗತ್ಯ'); return; }
  if(!date){ showToast('⚠ ದಿನಾಂಕ ಅಗತ್ಯ'); return; }
  if(cbLocked(acc,date)){ showToast('⚠ ಈ ತಿಂಗಳ ನಗದು ಪುಸ್ತಕ ಸಹಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ',5000); return; }
  CB_MONTH=(CB_MONTH==='all')?'all':date.slice(0,7);
  if(CB_EDIT&&CB_EDIT.kind==='r'){ const rec=DB.receipts[acc].find(x=>x.id===CB_EDIT.id); if(rec){ Object.assign(rec,{date,inwardNo,source,amount,head}); CB_EDIT=null; saveDB(); showToast('✅ ಜಮೆ ತಿದ್ದುಪಡಿ ಆಗಿದೆ'); navigate(cbPage()); return; } }
  DB.receipts[acc].push({id:uid(), date, inwardNo, source, amount, head, createdBy:CURRENT_USER.name}); saveDB(); showToast('✅ ಜಮೆ ನಮೂದಿಸಲಾಗಿದೆ'); navigate(cbPage());
}

function headIndexFor(headText, account){
  const fallback = account==='main' ? BUDGET_HEADS.length-1 : -1;
  if(!headText) return fallback;
  let i=BUDGET_HEADS.findIndex(h=>matchHead(headText,h)); if(i>=0) return i;
  const fw=String(headText).trim().split(/[\s(]/)[0];
  i=BUDGET_HEADS.findIndex(h=>h.split(' ')[0]===fw); if(i>=0) return i;
  return fallback;
}

function fyOf(date){ const y=+date.slice(0,4), m=+date.slice(5,7); return m>=4?y:y-1; }

function fyLabel(y){ return y+'-'+String((y+1)%100).padStart(2,'0'); }

function expenseRecords(){
  const out=[]; const okDate=d=>/^\d{4}-\d{2}-\d{2}/.test(d||'');
  (DB.bills||[]).forEach(b=>{
    if(!(b.status==='Paid'||b.status==='Closed')) return;
    const date=b.paidDate||b.date; if(!okDate(date)) return;
    const hi=headIndexFor(b.head,b.account); if(hi<0) return;
    out.push({date,hi,amount:Number(b.amount||0),src:b.imported?'import':'bill',desc:(b.payee||'')+(b.billNo?(' / '+b.billNo):''),id:b.id});
  });
  (DB.expenseEntries||[]).forEach(e=>{
    if(!okDate(e.date)) return;
    let hi=BUDGET_HEADS.indexOf(e.head); if(hi<0) hi=BUDGET_HEADS.length-1;
    out.push({date:e.date,hi,amount:Number(e.amount||0),src:'entry',desc:e.desc||'',id:e.id});
  });
  return out;
}

function renderBudget(){
  const canEdit=CURRENT_USER.role==='fda';
  const canApprove=CURRENT_USER.role==='principal';
  const FY=fyOf(todayStr());
  const spent=BUDGET_HEADS.map(()=>[0,0,0,0]);
  expenseRecords().filter(r=>fyOf(r.date)===FY).forEach(r=>{ spent[r.hi][Math.floor(monthIdx(r.date)/3)]+=r.amount; });
  let rowsHtml='', changed=false;
  const tot=QUARTERS.map(()=>({ob:0,credit:0,exp:0,bal:0})); let tYC=0,tYE=0,tFB=0;
  BUDGET_HEADS.forEach((head,hi)=>{
    let prevBal=0, cells='';
    QUARTERS.forEach((q,qi)=>{
      const rec=DB.budget[hi][q.k];
      if(q.k!=='Q1' && Number(rec.ob||0)!==prevBal){ rec.ob=prevBal; changed=true; }
      const exp=spent[hi][qi];
      const bal=Number(rec.ob||0)+Number(rec.credit||0)-exp;
      prevBal=bal;
      tot[qi].ob+=Number(rec.ob||0); tot[qi].credit+=Number(rec.credit||0); tot[qi].exp+=exp; tot[qi].bal+=bal;
      const editable=canEdit && !rec.locked;
      cells+=`<td>${rec.ob}</td>
        <td>${editable?`<input type="number" class="no-print-input" style="width:70px" value="${rec.credit}" onchange="setBudget(${hi},'${q.k}','credit',this.value)">`:rec.credit}</td>
        <td>${exp||0}</td>
        <td><b>${bal}</b>${canApprove?` <button class="btn btn-sm ${rec.locked?'btn-outline':'btn-green'}" onclick="toggleBudgetLock(${hi},'${q.k}')">${rec.locked?'🔒':'Approve'}</button>`:''}</td>`;
    });
    const yearlyCredit=QUARTERS.reduce((a,q)=>a+Number(DB.budget[hi][q.k].credit||0),0);
    const yearlyExpense=spent[hi].reduce((a,x)=>a+x,0);
    tYC+=yearlyCredit; tYE+=yearlyExpense; tFB+=prevBal;
    rowsHtml+=`<tr><td>${hi+1}</td><td>${esc(head)}</td>${cells}<td>${yearlyCredit}</td><td>${yearlyExpense}</td><td><b>${prevBal}</b></td></tr>`;
  });
  rowsHtml+=`<tr style="font-weight:800;background:var(--surface-2);"><td></td><td>ಒಟ್ಟು</td>${tot.map(t=>`<td>${t.ob}</td><td>${t.credit}</td><td>${t.exp}</td><td>${t.bal}</td>`).join('')}<td>${tYC}</td><td>${tYE}</td><td>${tFB}</td></tr>`;
  if(changed) saveDB();
  document.getElementById('content').innerHTML=`<div class="print-landscape">
    ${printHeaderHtml('ಬಜೆಟ್ ವಾಚ್ ರಿಜಿಸ್ಟರ್','ಆರ್ಥಿಕ ವರ್ಷ '+fyLabel(FY))}
    <div class="page-head"><h2>ಬಜೆಟ್ ವಾಚ್ ರಿಜಿಸ್ಟರ್ <span style="font-size:13px;color:var(--muted);">(${fyLabel(FY)})</span></h2><div class="desc">ಖರ್ಚು ಸ್ವಯಂಚಾಲಿತ — ಬಿಲ್‌ಗಳು (Paid/Closed), ನಗದು ಪುಸ್ತಕ Excel ಆಮದು ಮತ್ತು ಮಾಸಿಕ ಖರ್ಚು ನಮೂದುಗಳಿಂದ ಶೀರ್ಷಿಕೆವಾರು ಸೇರುತ್ತದೆ · ಉಳಿಕೆ = OB + ಜಮಾ − ಖರ್ಚು · ಮುಂದಿನ Quarter OB = ಹಿಂದಿನ ಉಳಿಕೆ (auto)</div></div>
    <div class="form-actions no-print" style="margin-bottom:8px;"><button class="btn btn-gold btn-sm" onclick="window.print()">🖨 Print / PDF</button> <button class="btn btn-outline btn-sm" onclick="exportBudgetExcel()">⬇ Excel</button></div>
    ${finImportHtml('Budget Watch')}
    <div class="panel"><div class="table-wrap"><table><thead><tr>
      <th rowspan="1">ಕ್ರ.ಸಂ</th><th>ಶೀರ್ಷಿಕೆ</th>
      ${QUARTERS.map(q=>`<th colspan="4">${esc(q.label)}</th>`).join('')}
      <th>ವಾರ್ಷಿಕ ಜಮಾ</th><th>ವಾರ್ಷಿಕ ಖರ್ಚು</th><th>ಅಂತಿಮ ಉಳಿಕೆ</th>
    </tr><tr><th></th><th></th>${QUARTERS.map(()=>'<th>OB</th><th>ಜಮಾ</th><th>ಖರ್ಚು</th><th>ಉಳಿಕೆ</th>').join('')}<th></th><th></th><th></th></tr></thead>
    <tbody>${rowsHtml}</tbody></table></div></div></div>`;
}

function exportBudgetExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const FY=fyOf(todayStr());
  const spent=BUDGET_HEADS.map(()=>[0,0,0,0]);
  expenseRecords().filter(r=>fyOf(r.date)===FY).forEach(r=>{ spent[r.hi][Math.floor(monthIdx(r.date)/3)]+=r.amount; });
  const header=['ಕ್ರ.ಸಂ','ಶೀರ್ಷಿಕೆ']; QUARTERS.forEach(q=>header.push(q.k+' OB',q.k+' ಜಮಾ',q.k+' ಖರ್ಚು',q.k+' ಉಳಿಕೆ')); header.push('ವಾರ್ಷಿಕ ಜಮಾ','ವಾರ್ಷಿಕ ಖರ್ಚು','ಅಂತಿಮ ಉಳಿಕೆ');
  const rows=BUDGET_HEADS.map((head,hi)=>{
    let prev=0; const r=[hi+1,head]; let yc=0, ye=0;
    QUARTERS.forEach((q,qi)=>{ const rec=DB.budget[hi][q.k]; const ob=q.k==='Q1'?Number(rec.ob||0):prev; const exp=spent[hi][qi]; const bal=ob+Number(rec.credit||0)-exp; prev=bal; yc+=Number(rec.credit||0); ye+=exp; r.push(ob,Number(rec.credit||0),exp,bal); });
    r.push(yc,ye,prev); return r;
  });
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([header,...rows]),'Budget Watch');
  XLSX.writeFile(wb,'MDRS_Budget_Watch_'+fyLabel(FY)+'.xlsx');
}

function setBudget(hi,q,field,val){ DB.budget[hi][q][field]=Number(val||0); saveDB(); renderBudget(); }

function toggleBudgetLock(hi,q){ DB.budget[hi][q].locked=!DB.budget[hi][q].locked; saveDB(); renderBudget(); }

function setExpFY(v){ EXP_FY=Number(v); renderMonthExp(); }

function setExpMonth(v){ EXP_MONTH=v; renderMonthExp(); }

function renderMonthExp(){
  const fda=CURRENT_USER.role==='fda';
  if(EXP_FY===null) EXP_FY=fyOf(todayStr());
  const all=expenseRecords();
  const yrs=new Set([fyOf(todayStr()),EXP_FY]); all.forEach(r=>yrs.add(fyOf(r.date)));
  const fyList=[...yrs].sort((a,b)=>b-a);
  const recs=all.filter(r=>fyOf(r.date)===EXP_FY);
  const mat=BUDGET_HEADS.map(()=>Array(12).fill(0));
  recs.forEach(r=>{ mat[r.hi][monthIdx(r.date)]+=r.amount; });
  const colTot=Array(12).fill(0); let grand=0;
  let rowsHtml=BUDGET_HEADS.map((head,hi)=>{
    const rt=mat[hi].reduce((a,x)=>a+x,0); grand+=rt;
    return `<tr><td>${hi+1}</td><td>${esc(head)}</td>${mat[hi].map((v,mi)=>{ colTot[mi]+=v; return `<td>${v||'—'}</td>`; }).join('')}<td><b>${rt}</b></td></tr>`;
  }).join('');
  rowsHtml+=`<tr style="font-weight:800;background:var(--surface-2);"><td></td><td>ಒಟ್ಟು</td>${colTot.map(v=>`<td>${v||'—'}</td>`).join('')}<td>${grand}</td></tr>`;
  const list=recs.filter(r=>EXP_MONTH==='all'||monthIdx(r.date)===Number(EXP_MONTH)).sort((a,b)=>a.date.localeCompare(b.date));
  const listTotal=list.reduce((a,r)=>a+r.amount,0);
  const listHtml=list.length? list.map((r,i)=>`<tr><td>${i+1}</td><td>${fmtDate(r.date.slice(0,10))}</td><td>${esc(BUDGET_HEADS[r.hi])}</td><td>${esc(r.desc||'—')}</td><td>${EXP_SRC[r.src]||''}</td><td>${money(r.amount)}</td><td class="no-print">${(fda&&r.src==='entry')?`<button class="btn btn-outline btn-sm" onclick="delExpenseEntry('${r.id}')">🗑</button>`:''}</td></tr>`).join('')
    +`<tr style="font-weight:800;background:var(--surface-2);"><td colspan="5" style="text-align:right;">ಒಟ್ಟು</td><td>${money(listTotal)}</td><td class="no-print"></td></tr>`
    : `<tr class="empty-row"><td colspan="7">ನಮೂದುಗಳಿಲ್ಲ.</td></tr>`;
  document.getElementById('content').innerHTML=`<div class="print-landscape">
    ${printHeaderHtml('ತಿಂಗಳವಾರು ಖರ್ಚು ವಹಿ','ಆರ್ಥಿಕ ವರ್ಷ '+fyLabel(EXP_FY))}
    <div class="page-head"><h2>ತಿಂಗಳವಾರು ಖರ್ಚು ವಹಿ (Month-wise Expenditure Register)</h2><div class="desc">ಬಿಲ್‌ಗಳು (Paid/Closed), ನಗದು ಪುಸ್ತಕ ಆಮದು ಮತ್ತು ದಿನಾಂಕವಾರು ನಮೂದುಗಳಿಂದ ಶೀರ್ಷಿಕೆವಾರು ಸ್ವಯಂ ಲೆಕ್ಕ · ಇದೇ ಖರ್ಚು ಬಜೆಟ್ ವಾಚ್ ರಿಜಿಸ್ಟರ್‌ಗೂ ಸ್ವಯಂ ಸೇರುತ್ತದೆ</div></div>
    <div class="form-actions no-print" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
      <select onchange="setExpFY(this.value)">${fyList.map(y=>`<option value="${y}" ${y===EXP_FY?'selected':''}>ಆರ್ಥಿಕ ವರ್ಷ ${fyLabel(y)}</option>`).join('')}</select>
      <button class="btn btn-gold btn-sm" onclick="window.print()">🖨 Print / PDF</button>
      <button class="btn btn-outline btn-sm" onclick="exportMonthExpExcel()">⬇ Excel</button>
    </div>
    ${finImportHtml('ಮಾಸಿಕ ಖರ್ಚು ವಹಿ')}
    ${fda?`<div class="panel no-print"><h3>➕ ದಿನಾಂಕವಾರು ಖರ್ಚು ನಮೂದು (Date-wise Entry)</h3>
      <div class="form-grid">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="ex_date" value="${todayStr()}"></div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ (Head)</label><select id="ex_head">${BUDGET_HEADS.map((h,i)=>`<option value="${i}">${esc(h)}</option>`).join('')}</select></div>
        <div class="field"><label>ಮೊತ್ತ (₹)</label><input type="number" id="ex_amt"></div>
        <div class="field"><label>ವಿವರ (ಐಚ್ಛಿಕ)</label><input id="ex_desc"></div>
      </div>
      <div class="form-actions" style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-primary btn-sm" onclick="addExpenseEntry()">➕ ಖರ್ಚು ನಮೂದಿಸಿ</button>
        <button class="btn btn-outline btn-sm" onclick="downloadExpenseTemplate()">⬇ Excel Template</button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('expXl').click()">📥 Excel Import</button>
        <input type="file" id="expXl" accept=".xlsx,.xls,.csv" style="display:none" onchange="importExpenseExcel(this)"></div>
      <div class="helper">Excel ಕಾಲಂಗಳು: ದಿನಾಂಕ | ಶೀರ್ಷಿಕೆ | ಮೊತ್ತ | ವಿವರ. ಶೀರ್ಷಿಕೆ ಹೊಂದಿಕೆಯಾಗದಿದ್ದರೆ "ಇತರೆ ವೆಚ್ಚಗಳು" ಅಡಿ ಸೇರುತ್ತದೆ.</div></div>`:''}
    <div class="panel"><h3>📅 ಮಾಸಿಕ ಖರ್ಚು (ಶೀರ್ಷಿಕೆ × ತಿಂಗಳು)</h3><div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ವೆಚ್ಚದ ಶೀರ್ಷಿಕೆ</th>${MONTHS.map(m=>`<th>${esc(m)}</th>`).join('')}<th>ಒಟ್ಟು</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table></div></div>
    <div class="panel"><h3>🗓 ದಿನಾಂಕವಾರು ಖರ್ಚು ವಿವರ</h3>
      <div class="no-print" style="margin-bottom:8px;"><select onchange="setExpMonth(this.value)"><option value="all" ${EXP_MONTH==='all'?'selected':''}>ಎಲ್ಲಾ ತಿಂಗಳು</option>${MONTHS.map((m,i)=>`<option value="${i}" ${String(EXP_MONTH)===String(i)?'selected':''}>${esc(m)}</option>`).join('')}</select></div>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಿನಾಂಕ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ವಿವರ</th><th>ಮೂಲ</th><th>ಮೊತ್ತ (₹)</th><th class="no-print"></th></tr></thead><tbody>${listHtml}</tbody></table></div></div></div>`;
}

function addExpenseEntry(){
  const date=document.getElementById('ex_date').value, hi=Number(document.getElementById('ex_head').value);
  const amount=Number(document.getElementById('ex_amt').value||0), desc=document.getElementById('ex_desc').value.trim();
  if(!date||amount<=0){ showToast('⚠ ದಿನಾಂಕ ಮತ್ತು ಮೊತ್ತ ಅಗತ್ಯ'); return; }
  if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[];
  DB.expenseEntries.push({id:uid(), date, head:BUDGET_HEADS[hi], amount, desc, createdBy:CURRENT_USER.name});
  EXP_FY=fyOf(date);
  saveDB(); showToast('✅ ಖರ್ಚು ನಮೂದಿಸಲಾಗಿದೆ'); renderMonthExp();
}

function delExpenseEntry(id){
  if(!confirm('ಈ ಖರ್ಚು ನಮೂದನ್ನು ಅಳಿಸಬೇಕೇ?')) return;
  const i=(DB.expenseEntries||[]).findIndex(e=>e.id===id);
  if(i>=0){ DB.expenseEntries.splice(i,1); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); renderMonthExp(); }
}

function exportMonthExpExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const recs=expenseRecords().filter(r=>fyOf(r.date)===EXP_FY);
  const mat=BUDGET_HEADS.map(()=>Array(12).fill(0)); recs.forEach(r=>{ mat[r.hi][monthIdx(r.date)]+=r.amount; });
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಕ್ರ.ಸಂ','ಶೀರ್ಷಿಕೆ',...MONTHS,'ಒಟ್ಟು'],...BUDGET_HEADS.map((h,i)=>[i+1,h,...mat[i],mat[i].reduce((a,x)=>a+x,0)])]),'Monthly');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ದಿನಾಂಕ','ಶೀರ್ಷಿಕೆ','ವಿವರ','ಮೂಲ','ಮೊತ್ತ'],...recs.sort((a,b)=>a.date.localeCompare(b.date)).map(r=>[r.date.slice(0,10),BUDGET_HEADS[r.hi],r.desc||'',EXP_SRC[r.src]||'',r.amount])]),'Date-wise');
  XLSX.writeFile(wb,'MDRS_Month_Expenditure_'+fyLabel(EXP_FY)+'.xlsx');
}

function downloadExpenseTemplate(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ದಿನಾಂಕ (YYYY-MM-DD)','ಶೀರ್ಷಿಕೆ','ಮೊತ್ತ','ವಿವರ'],[todayStr(),BUDGET_HEADS[0],1000,'ಉದಾಹರಣೆ'],[todayStr(),BUDGET_HEADS[1],500,'']]),'Expenses');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ಶೀರ್ಷಿಕೆ ಪಟ್ಟಿ (ಇವುಗಳಲ್ಲಿ ಒಂದನ್ನು ಬಳಸಿ)'],...BUDGET_HEADS.map(h=>[h])]),'Heads');
  XLSX.writeFile(wb,'Expense_Import_Template.xlsx');
}

function readExcelRows(file,cb){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const fr=new FileReader();
  fr.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]];
      cb(XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''}));
    }catch(err){ showToast('❌ Excel ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ: '+err.message,6000); }
  };
  fr.readAsArrayBuffer(file);
}

function xlDate(v){
  if(v===''||v==null) return '';
  const pad=n=>String(n).padStart(2,'0'); let y,m,d,mm;
  if(v instanceof Date){ y=v.getFullYear(); m=v.getMonth()+1; d=v.getDate(); }
  else if(typeof v==='number'){ if(v<20000||v>80000) return ''; const pc=XLSX.SSF.parse_date_code(v); if(!pc) return ''; y=pc.y; m=pc.m; d=pc.d; }
  else {
    const t=String(v).trim();
    if((mm=t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))){ y=+mm[1]; m=+mm[2]; d=+mm[3]; }
    else if((mm=t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/))){ d=+mm[1]; m=+mm[2]; y=+mm[3]; }
    else return '';
  }
  if(m<1||m>12||d<1||d>31) return '';
  return y+'-'+pad(m)+'-'+pad(d);
}

function xlNum(v){ const n=Number(String(v==null?'':v).replace(/[₹,\s]/g,'')); return isNaN(n)?0:n; }

function matchHeadIn(list,text){
  const t=String(text==null?'':text).trim().toLowerCase(); if(!t) return -1;
  if(/^\d+$/.test(t)){ const n=Number(t); return (n>=1&&n<=list.length)?n-1:-1; }
  let i=list.findIndex(h=>h.toLowerCase()===t); if(i>=0) return i;
  i=list.findIndex(h=>h.toLowerCase().indexOf(t)>=0 || t.indexOf(h.toLowerCase())>=0); if(i>=0) return i;
  const fw=t.split(/[\s(]/)[0];
  return list.findIndex(h=>h.toLowerCase().split(/[\s(]/)[0]===fw);
}

function importExpenseExcel(input){
  const f=input.files&&input.files[0]; if(!f) return;
  readExcelRows(f,rows=>{
    input.value='';
    const items=[]; let skipped=0, toOthers=0;
    rows.forEach((r,i)=>{
      const date=xlDate(r[0]);
      if(!date){ if(i>0 && r.some(x=>x!=='')) skipped++; return; }
      const amount=xlNum(r[2]); if(amount<=0){ skipped++; return; }
      let hi=matchHeadIn(BUDGET_HEADS,r[1]); if(hi<0){ hi=BUDGET_HEADS.length-1; toOthers++; }
      items.push({date,head:BUDGET_HEADS[hi],amount,desc:String(r[3]||'').trim()});
    });
    if(!items.length){ showToast('⚠ ಆಮದು ಮಾಡಲು ಸರಿಯಾದ ಸಾಲುಗಳಿಲ್ಲ (Template ಬಳಸಿ)',6000); return; }
    const total=items.reduce((a,x)=>a+x.amount,0);
    if(!confirm('ಆಮದು: '+items.length+' ನಮೂದುಗಳು, ಒಟ್ಟು ₹'+total+(skipped?('\n(ಬಿಟ್ಟ ಸಾಲುಗಳು: '+skipped+')'):'')+(toOthers?('\n(ಶೀರ್ಷಿಕೆ ಹೊಂದದೆ "ಇತರೆ" ಗೆ: '+toOthers+')'):'')+'\nಮುಂದುವರಿಯಬೇಕೇ?')) return;
    if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[];
    let dup=0;
    items.forEach(it=>{
      if(DB.expenseEntries.some(e=>e.date===it.date&&e.head===it.head&&Number(e.amount)===it.amount&&(e.desc||'')===it.desc)){ dup++; return; }
      DB.expenseEntries.push({id:uid(),...it,createdBy:CURRENT_USER.name,imported:true});
    });
    saveDB(); showToast('✅ '+(items.length-dup)+' ನಮೂದುಗಳು ಆಮದಾಗಿವೆ'+(dup?(' ('+dup+' ಪುನರಾವರ್ತನೆ ಬಿಟ್ಟಿದೆ)'):''),5000);
    renderMonthExp();
  });
}

function matchHead(billHead,budgetHead){ if(!billHead) return false; return billHead.indexOf(budgetHead)===0 || billHead.toLowerCase().indexOf(budgetHead.toLowerCase())===0; }


/* ---------- v67: ಸ್ಮಾರ್ಟ್ Excel ಅಪ್‌ಲೋಡ್ — DC Bill / Cash Book / Budget Watch / ಮಾಸಿಕ ಖರ್ಚು (ನಿಮ್ಮ format) ---------- */
function finImportHtml(label){
  if(CURRENT_USER.role!=='fda') return '';
  return `<div class="panel no-print" style="border:2px dashed var(--gold);"><h3>📥 Excel Upload — ${label}</h3>
    <div class="helper" style="margin-bottom:8px;">ನೀವು ಕೊಟ್ಟ format ನ ಫೈಲ್ ಅನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (DC_Bill_Register.xlsx / CashBook_YYYY-MM.xlsx / MDRS_Budget_Watch_YYYY-YY.xlsx / ಮಾಸಿಕ ಖರ್ಚು). ಯಾವ ಫೈಲ್ ಎಂದು ಸ್ವತಃ ಗುರುತಿಸುತ್ತದೆ. ಪುನರಾವರ್ತನೆ ಆಗುವುದಿಲ್ಲ.</div>
    <label class="btn btn-primary" style="cursor:pointer;">📂 Excel ಆಯ್ಕೆ ಮಾಡಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="finSmartImport(this)"></label></div>`;
}
function finSmartImport(input){
  const f=input.files&&input.files[0]; if(!f) return;
  if(CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು'); input.value=''; return; }
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const fr=new FileReader();
  fr.onload=e=>{
    input.value='';
    try{
      const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
      const sh=wb.SheetNames.map(n=>({n,rows:XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''})}));
      const h0=s=>(s.rows[0]||[]).map(x=>String(x).trim());
      let s;
      if((s=sh.find(x=>{const h=h0(x);return h.includes('Record ID')&&h.includes('Paying account');}))) return finImpDC(s.rows,f.name);
      if((s=sh.find(x=>h0(x).includes('Q1 OB')))) return finImpBudget(s.rows,f.name);
      const cb=sh.filter(x=>/^(main|joint)\b/i.test(x.n)||/RECEIPTS/i.test(String((x.rows[0]||[])[0])));
      if(cb.length) return finImpCash(cb);
      if((s=sh.find(x=>{const h=h0(x);return h[1]==='ಶೀರ್ಷಿಕೆ'&&h.includes(MONTHS[0]);}))) return finImpMonthMatrix(s.rows);
      return finImpExpense((sh.find(x=>h0(x).includes('ಮೊತ್ತ'))||sh[0]).rows);
    }catch(err){ showToast('❌ Excel ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ: '+err.message,6000); }
  };
  fr.readAsArrayBuffer(f);
}
function finAccOf(t){ t=String(t||'').toLowerCase(); return (/joint|ವೇತನ|ಜಂಟಿ|8116|staff/.test(t))?'joint':'main'; }
function finHeadFor(heads,text){ let i=matchHeadIn(heads,text); if(i<0){ i=heads.findIndex(h=>/others|ಇತರೆ/i.test(h)); if(i<0) i=heads.length-1; return {head:heads[i],miss:!!String(text||'').trim()}; } return {head:heads[i],miss:false}; }

function finImpDC(rows,fname){
  const H=rows[0].map(x=>String(x).trim()); const ix=n=>H.indexOf(n);
  const c={id:ix('Record ID'),date:ix('Bill date'),payee:ix('Payee'),no:ix('Bill No'),desc:ix('Description'),head:ix('Account head'),acc:ix('Paying account'),amt:ix('Amount'),ded:ix('Deduction'),chq:ix('Cheque No'),chqd:ix('Cheque date'),paid:ix('Paid on'),vou:ix('Voucher No'),st:ix('Status')};
  const items=[]; let skipped=0, cancelled=0, others=0;
  rows.slice(1).forEach(r=>{
    const payee=String(r[c.payee]||'').trim(), amount=xlNum(r[c.amt]);
    if(!payee&&!amount) return;
    if(/^total/i.test(String(r[0]).trim())) return;
    const stx=String(r[c.st]||'').trim();
    if(/cancel/i.test(stx)){ cancelled++; return; }
    const date=xlDate(r[c.date])||xlDate(r[c.paid]);
    if(!payee||amount<=0||!date){ skipped++; return; }
    const acc=finAccOf(r[c.acc]); const hh=finHeadFor(ACCOUNTS[acc].heads,r[c.head]); if(hh.miss) others++;
    const paidDate=xlDate(r[c.paid]);
    const all=['Draft','Sent to FDA','FDA Approved','Sent to Warden','Warden Approved','Sent to Principal','Approved','Principal Approved','DC Bill Generated','Payment Order Generated','Paid','Closed','Rejected'];
    let status=all.find(x=>x.toLowerCase()===stx.toLowerCase()) || (paidDate?'Paid':'Draft');
    items.push({ref:String(r[c.id]||'').trim(),account:acc,payee,billNo:String(r[c.no]||'').trim(),date,amount,head:hh.head,cheque:String(r[c.chq]||'').trim(),chequeDate:xlDate(r[c.chqd]),voucher:String(r[c.vou]||'').trim(),deduction:xlNum(r[c.ded]),desc:String(r[c.desc]||'').trim(),status,paidDate:(status==='Paid'||status==='Closed')?(paidDate||date):''});
  });
  if(!items.length){ showToast('⚠ ಆಮದು ಮಾಡಲು ಬಿಲ್‌ಗಳಿಲ್ಲ ('+fname+' ಖಾಲಿ ಇರಬಹುದು)',6000); return; }
  const tot=items.reduce((a,x)=>a+x.amount,0);
  if(!confirm('DC Bill ಆಮದು:\n'+items.length+' ಬಿಲ್‌ಗಳು, ಒಟ್ಟು ₹'+tot+(cancelled?'\nರದ್ದಾದ '+cancelled+' ಬಿಟ್ಟಿದೆ':'')+(skipped?'\nಅಪೂರ್ಣ '+skipped+' ಸಾಲು ಬಿಟ್ಟಿದೆ':'')+(others?'\nಶೀರ್ಷಿಕೆ ಹೊಂದದ '+others+' ಬಿಲ್ "ಇತರೆ" ಅಡಿ':'')+'\n\nಮುಂದುವರಿಸಲೇ?')) return;
  let added=0, dup=0;
  items.forEach(x=>{
    if(DB.bills.some(b=>(x.ref&&b.importRef===x.ref)||(b.account===x.account&&b.payee===x.payee&&(b.billNo||'')===x.billNo&&b.date===x.date&&Number(b.amount)===x.amount))){ dup++; return; }
    DB.bills.push({id:uid(),importRef:x.ref,account:x.account,payee:x.payee,billNo:x.billNo,date:x.date,amount:x.amount,head:x.head,cheque:x.cheque,chequeDate:x.chequeDate,voucher:x.voucher,deduction:x.deduction,description:x.desc,
      status:x.status,paidDate:x.paidDate||undefined,createdAt:todayStr(),createdBy:CURRENT_USER.name,createdByRole:CURRENT_USER.role,fileData:null,fileName:null,imported:true}); added++;
  });
  saveDB(); showToast('✅ '+added+' ಬಿಲ್ ಆಮದಾಗಿದೆ'+(dup?' ('+dup+' ಪುನರಾವರ್ತನೆ ಬಿಟ್ಟಿದೆ)':''),6000); navigate(CURRENT_PAGE||'bills');
}

function finImpBudget(rows,fname){
  const FY=fyOf(todayStr()); const qs=['Q1','Q2','Q3','Q4']; const H=rows[0].map(x=>String(x).trim());
  const col=(q,k)=>H.indexOf(q+' '+k);
  const spent=BUDGET_HEADS.map(()=>[0,0,0,0]);
  expenseRecords().filter(r=>fyOf(r.date)===FY).forEach(r=>{ spent[r.hi][Math.floor(monthIdx(r.date)/3)]+=r.amount; });
  const upd=[]; let miss=0, lockedSkip=0, addExp=0, sumCr=0;
  rows.slice(1).forEach(r=>{
    const title=String(r[1]||'').trim(); if(!title) return;
    let hi=BUDGET_HEADS.findIndex(h=>h===title); if(hi<0) hi=matchHeadIn(BUDGET_HEADS,title); if(hi<0){ miss++; return; }
    qs.forEach((q,qi)=>{
      const rec=DB.budget[hi][q]; if(!rec) return;
      if(rec.locked){ lockedSkip++; return; }
      const cr=xlNum(r[col(q,'ಜಮಾ')]), ob=xlNum(r[col(q,'OB')]), ex=xlNum(r[col(q,'ಖರ್ಚು')]);
      upd.push({hi,q,qi,cr,ob,ex}); sumCr+=cr;
    });
  });
  if(!upd.length){ showToast('⚠ ಹೊಂದುವ ಶೀರ್ಷಿಕೆಗಳು ಸಿಗಲಿಲ್ಲ',6000); return; }
  const expAdd=upd.filter(u=>u.ex-spent[u.hi][u.qi]>0.5);
  if(!confirm('Budget Watch ಆಮದು (ಆರ್ಥಿಕ ವರ್ಷ '+fyLabel(FY)+'):\n• ಜಮಾ (ಅನುದಾನ) ಒಟ್ಟು ₹'+sumCr+' ಅನ್ನು ಎಲ್ಲಾ ತ್ರೈಮಾಸಿಕಗಳಿಗೆ ಹೊಂದಿಸಲಾಗುವುದು\n• Q1 ಆರಂಭಿಕ ಶಿಲ್ಕು (OB) ಹೊಂದಿಸಲಾಗುವುದು\n• ಸಿಸ್ಟಂನಲ್ಲಿರುವ ಬಿಲ್‌ಗಳಿಗಿಂತ Excel ನಲ್ಲಿ ಹೆಚ್ಚು ಖರ್ಚು ಇರುವ '+expAdd.length+' ತ್ರೈಮಾಸಿಕಗಳಿಗೆ ವ್ಯತ್ಯಾಸವನ್ನು "ಖರ್ಚು ನಮೂದು" ಆಗಿ ಸೇರಿಸಲಾಗುವುದು'+(miss?'\n• ಹೊಂದದ '+miss+' ಶೀರ್ಷಿಕೆ ಬಿಟ್ಟಿದೆ':'')+(lockedSkip?'\n• Approve (ಲಾಕ್) ಆದ '+lockedSkip+' ಬಿಟ್ಟಿದೆ':'')+'\n\nಮುಂದುವರಿಸಲೇ?')) return;
  if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[];
  upd.forEach(u=>{
    const rec=DB.budget[u.hi][u.q]; rec.credit=u.cr; if(u.q==='Q1') rec.ob=u.ob;
    const diff=u.ex-spent[u.hi][u.qi];
    if(diff>0.5){
      const m=[4,7,10,1][u.qi], y=(u.qi===3)?FY+1:FY;
      DB.expenseEntries.push({id:uid(),date:y+'-'+String(m).padStart(2,'0')+'-01',head:BUDGET_HEADS[u.hi],amount:Math.round(diff*100)/100,desc:'Budget Watch Excel ಆಮದು ('+u.q+' ಖರ್ಚು)',createdBy:CURRENT_USER.name,imported:true}); addExp++;
    }
  });
  saveDB(); showToast('✅ Budget Watch ನವೀಕರಿಸಲಾಗಿದೆ'+(addExp?' (+'+addExp+' ಖರ್ಚು ನಮೂದು)':''),6000); navigate('budget');
}

function finImpCash(sheets){
  const isNT=v=>/^(ವ್ಯವಹಾರ|ವಹಿವಾಟು)/.test(String(v==null?'':v).trim());
  const parsed=[];
  sheets.forEach(s=>{
    const m=String(s.n).match(/^(main|joint)\s*(\d{4}-\d{2})?/i);
    const mon=(m&&m[2])||''; let acc=m?m[1].toLowerCase():null; if(!acc){ const t=s.rows.slice(5,10).map(r=>String(r[4]||'')).join(' '); acc=finAccOf(t); }
    const heads=ACCOUNTS[acc].heads; const rc=[],pay=[],nt=[]; let others=0;
    for(let i=2;i<s.rows.length;i++){
      const r=s.rows[i]; if(String(r[3]).trim()==='ಒಟ್ಟು'||String(r[13]).trim()==='ಒಟ್ಟು') break;
      const rd=xlDate(r[2]), pd=xlDate(r[9]);
      if(!rd&&!pd&&mon&&isNT(r[0])){ cbDatesOf(mon).forEach(d=>{ nt.push({date:d,section:'receipt'}); nt.push({date:d,section:'payment'}); }); continue; }
      if(rd){
        if(isNT(r[3])||isNT(r[0])) nt.push({date:rd,section:'receipt'});
        else if(xlNum(r[4])>0){ const hh=finHeadFor(heads,r[5]); if(hh.miss) others++; rc.push({date:rd,no:String(r[1]||'').trim(),party:String(r[3]||'').trim(),amount:xlNum(r[4]),head:hh.head}); }
      }
      if(pd){
        if(isNT(r[10])||isNT(r[7])) nt.push({date:pd,section:'payment'});
        else if(xlNum(r[13])>0){ const hh=finHeadFor(heads,r[16]); if(hh.miss) others++; pay.push({date:pd,no:String(r[8]||'').trim(),party:String(r[10]||'').trim(),cheque:String(r[11]||'').trim(),orderNo:String(r[12]||'').trim(),amount:xlNum(r[13]),deduction:xlNum(r[14]),head:hh.head}); }
      }
    }
    let opening=null; s.rows.forEach(r=>{ if(String(r[3]).trim()==='ಆರಂಭಿಕ ಶಿಲ್ಕು'&&typeof r[4]==='number') opening=r[4]; });
    parsed.push({name:s.n,acc,mon,rc,pay,nt,others,opening});
  });
  // Opening balance: taken from the earliest month in the file, only if the website has no earlier data for that account
  const openPlan={};
  parsed.filter(p=>p.opening!==null&&p.mon).sort((a,b)=>a.mon.localeCompare(b.mon)).forEach(p=>{
    if(openPlan[p.acc]) return;
    const earlier=(DB.receipts[p.acc]||[]).some(r=>String(r.date||'').slice(0,7)<p.mon)||DB.bills.some(b=>b.account===p.acc&&(b.status==='Paid'||b.status==='Closed')&&String(cbPayDate(b)).slice(0,7)<p.mon);
    if(!earlier&&Number((DB.cashOpening||{})[p.acc]||0)!==p.opening) openPlan[p.acc]={v:p.opening,mon:p.mon};
  });
  const nR=parsed.reduce((a,p)=>a+p.rc.length,0), nP=parsed.reduce((a,p)=>a+p.pay.length,0), nN=parsed.reduce((a,p)=>a+p.nt.length,0);
  if(!nR&&!nP&&!nN){ showToast('⚠ ಈ ನಗದು ಪುಸ್ತಕ ಫೈಲ್‌ನಲ್ಲಿ ವಹಿವಾಟುಗಳಿಲ್ಲ — ಆಮದು ಮಾಡಲು ಏನೂ ಇಲ್ಲ',6000); return; }
  if(!confirm('ನಗದು ಪುಸ್ತಕ ಆಮದು:\n'+parsed.map(p=>p.name+' (ಖಾತೆ: '+ACCOUNTS[p.acc].id+') — ಜಮೆ '+p.rc.length+', ಪಾವತಿ '+p.pay.length+', ವ್ಯವಹಾರವಿಲ್ಲ '+p.nt.length).join('\n')+Object.keys(openPlan).map(a=>'\n• ಆರಂಭಿಕ ಶಿಲ್ಕು ('+ACCOUNTS[a].id+'): ₹'+openPlan[a].v+' ('+openPlan[a].mon+' ತಿಂಗಳ ಫೈಲ್‌ನಿಂದ)').join('')+'\n\nಮುಂದುವರಿಸಲೇ?')) return;
  Object.keys(openPlan).forEach(a=>{ if(!DB.cashOpening) DB.cashOpening={main:0,joint:0}; DB.cashOpening[a]=openPlan[a].v; });
  let added=0,dup=0,lk=0;
  parsed.forEach(p=>{
    const acc=p.acc; if(!DB.receipts[acc]) DB.receipts[acc]=[];
    p.rc.forEach(x=>{
      if(cbLocked(acc,x.date)){ lk++; return; }
      if(DB.receipts[acc].some(r=>r.date===x.date&&Number(r.amount)===x.amount&&(r.inwardNo||'')===x.no&&(r.source||'')===(x.party||'—'))){ dup++; return; }
      DB.receipts[acc].push({id:uid(),date:x.date,inwardNo:x.no,source:x.party||'—',amount:x.amount,head:x.head,createdBy:CURRENT_USER.name,imported:true}); added++;
    });
    p.pay.forEach(x=>{
      if(cbLocked(acc,x.date)){ lk++; return; }
      if(DB.bills.some(b=>b.account===acc&&(b.paidDate||b.date)===x.date&&Number(b.amount)===x.amount&&(b.voucher||'')===x.no&&(b.payee||'')===(x.party||'—'))){ dup++; return; }
      DB.bills.push({id:uid(),account:acc,payee:x.party||'—',billNo:'',date:x.date,amount:x.amount,head:x.head,cheque:x.cheque,voucher:x.no,orderNo:x.orderNo,deduction:x.deduction,status:'Paid',paidDate:x.date,createdAt:todayStr(),createdBy:CURRENT_USER.name,createdByRole:CURRENT_USER.role,fileData:null,fileName:null,imported:true}); added++;
    });
    if(!Array.isArray(DB.cashNoTxn)) DB.cashNoTxn=[];
    p.nt.forEach(x=>{
      if(cbLocked(acc,x.date)){ lk++; return; }
      if(DB.cashNoTxn.some(n=>n.account===acc&&n.section===x.section&&n.date===x.date)){ dup++; return; }
      DB.cashNoTxn.push({id:uid(),account:acc,section:x.section,date:x.date,createdBy:CURRENT_USER.name}); added++;
    });
  });
  saveDB(); showToast('✅ '+added+' ನಮೂದುಗಳು ಆಮದಾಗಿವೆ'+(dup?' ('+dup+' ಪುನರಾವರ್ತನೆ ಬಿಟ್ಟಿದೆ)':'')+(lk?' · ಸಹಿ ಆದ ತಿಂಗಳ '+lk+' ಬಿಟ್ಟಿದೆ':''),6000); navigate(cbPage());
}

function finImpMonthMatrix(rows){
  const FY=(typeof EXP_FY!=='undefined'&&EXP_FY!==null)?EXP_FY:fyOf(todayStr());
  const H=rows[0].map(x=>String(x).trim()); const mc=MONTHS.map(m=>H.indexOf(m));
  const have=BUDGET_HEADS.map(()=>Array(12).fill(0));
  expenseRecords().filter(r=>fyOf(r.date)===FY).forEach(r=>{ have[r.hi][monthIdx(r.date)]+=r.amount; });
  const adds=[]; let miss=0;
  rows.slice(1).forEach(r=>{
    const t=String(r[1]||'').trim(); if(!t||/^ಒಟ್ಟು/.test(t)) return;
    let hi=BUDGET_HEADS.indexOf(t); if(hi<0) hi=matchHeadIn(BUDGET_HEADS,t); if(hi<0){ miss++; return; }
    mc.forEach((c,mi)=>{ if(c<0) return; const diff=xlNum(r[c])-have[hi][mi]; if(diff>0.5){ const cal=((mi+3)%12)+1; adds.push({date:(cal>=4?FY:FY+1)+'-'+String(cal).padStart(2,'0')+'-01',head:BUDGET_HEADS[hi],amount:Math.round(diff*100)/100,desc:'Excel ಆಮದು (ಮಾಸಿಕ ಖರ್ಚು)'}); } });
  });
  if(!adds.length){ showToast('ℹ ಹೊಸ ಖರ್ಚು ಇಲ್ಲ — Excel ನ ಮೊತ್ತಗಳು ಈಗಾಗಲೇ ಸಿಸ್ಟಂನಲ್ಲಿ ಇವೆ',6000); return; }
  if(!confirm('ಮಾಸಿಕ ಖರ್ಚು ಆಮದು (ಆರ್ಥಿಕ ವರ್ಷ '+fyLabel(FY)+'):\n'+adds.length+' ತಿಂಗಳು-ಶೀರ್ಷಿಕೆ ವ್ಯತ್ಯಾಸಗಳು, ಒಟ್ಟು ₹'+adds.reduce((a,x)=>a+x.amount,0)+'\n(ಸಿಸ್ಟಂನಲ್ಲಿ ಈಗಾಗಲೇ ಇರುವ ಮೊತ್ತ ಕಳೆದು ಉಳಿದದ್ದನ್ನು ಮಾತ್ರ ಸೇರಿಸಲಾಗುವುದು)'+(miss?'\nಹೊಂದದ '+miss+' ಶೀರ್ಷಿಕೆ ಬಿಟ್ಟಿದೆ':'')+'\n\nಮುಂದುವರಿಸಲೇ?')) return;
  if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[];
  adds.forEach(a=>DB.expenseEntries.push({id:uid(),...a,createdBy:CURRENT_USER.name,imported:true}));
  saveDB(); showToast('✅ '+adds.length+' ನಮೂದುಗಳು ಆಮದಾಗಿವೆ',5000); navigate('monthexp');
}
function finImpExpense(rows){
  const items=[]; let skipped=0, toOthers=0;
  const H=(rows[0]||[]).map(x=>String(x).trim()); const hasH=H.includes('ಮೊತ್ತ')&&H.includes('ಶೀರ್ಷಿಕೆ');
  const ci=hasH?{d:H.indexOf('ದಿನಾಂಕ'),h:H.indexOf('ಶೀರ್ಷಿಕೆ'),a:H.indexOf('ಮೊತ್ತ'),v:H.indexOf('ವಿವರ'),s:H.indexOf('ಮೂಲ')}:{d:0,h:1,a:2,v:3,s:-1};
  rows.forEach((r,i)=>{
    const date=xlDate(r[ci.d]); if(!date){ if(i>0&&r.some(x=>x!=='')) skipped++; return; }
    if(ci.s>=0&&String(r[ci.s]).trim()!==EXP_SRC.entry) return;   // ಬಿಲ್/ನಗದು ಪುಸ್ತಕದಿಂದ ಬಂದವನ್ನು ಬಿಡಿ
    const amount=xlNum(r[ci.a]); if(amount<=0){ skipped++; return; }
    let hi=matchHeadIn(BUDGET_HEADS,r[ci.h]); if(hi<0){ hi=BUDGET_HEADS.length-1; toOthers++; }
    items.push({date,head:BUDGET_HEADS[hi],amount,desc:ci.v>=0?String(r[ci.v]||'').trim():''});
  });
  if(!items.length){ showToast('⚠ ಈ ಫೈಲ್ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. DC Bill / ನಗದು ಪುಸ್ತಕ / Budget Watch ಅಥವಾ ಮಾಸಿಕ ಖರ್ಚು (ದಿನಾಂಕ | ಶೀರ್ಷಿಕೆ | ಮೊತ್ತ | ವಿವರ) format ಬಳಸಿ',8000); return; }
  if(!confirm('ಮಾಸಿಕ ಖರ್ಚು ಆಮದು: '+items.length+' ನಮೂದುಗಳು, ಒಟ್ಟು ₹'+items.reduce((a,x)=>a+x.amount,0)+(skipped?'\nಬಿಟ್ಟ '+skipped:'')+(toOthers?'\n"ಇತರೆ" ಅಡಿ '+toOthers:'')+'\n\nಮುಂದುವರಿಸಲೇ?')) return;
  if(!Array.isArray(DB.expenseEntries)) DB.expenseEntries=[]; let dup=0;
  items.forEach(it=>{ if(DB.expenseEntries.some(e=>e.date===it.date&&e.head===it.head&&Number(e.amount)===it.amount&&(e.desc||'')===it.desc)){ dup++; return; } DB.expenseEntries.push({id:uid(),...it,createdBy:CURRENT_USER.name,imported:true}); });
  saveDB(); showToast('✅ '+(items.length-dup)+' ನಮೂದುಗಳು ಆಮದಾಗಿವೆ'+(dup?' ('+dup+' ಪುನರಾವರ್ತನೆ)':''),5000); navigate('monthexp');
}


/* ---------- v68: ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ (Bank Reconciliation) — ಚೆಕ್ ನೀಡಿದ್ದು ಆದರೆ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆಗದ್ದು ---------- */
var BR_ACC='main', BR_DATE=null;
function brAddMonths(iso,n){ const [y,m,d]=iso.split('-').map(Number); const t=new Date(Date.UTC(y,m-1+n,d)); return t.toISOString().slice(0,10); }
function brDays(a,b){ return Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/86400000); }
function brData(acc,asOn){
  const net=b=>Number(b.amount||0)-Number(b.deduction||0);
  const opening=Number((DB.cashOpening||{})[acc]||0);
  const rAll=(DB.receipts[acc]||[]).filter(r=>(r.date||'')<=asOn);
  const pAll=DB.bills.filter(b=>b.account===acc&&(b.status==='Paid'||b.status==='Closed')&&cbPayDate(b)<=asOn);
  const book=opening+rAll.reduce((a,r)=>a+Number(r.amount||0),0)-pAll.reduce((a,b)=>a+net(b),0);
  const withChq=pAll.filter(b=>String(b.cheque||'').trim());
  const outstanding=withChq.filter(b=>!b.clearedOn||b.clearedOn>asOn).map(b=>{
    const cd=b.chequeDate||cbPayDate(b); const valid=brAddMonths(cd,3); const left=brDays(asOn,valid);
    return {b,cd,valid,left,amt:net(b),stale:left<0};
  }).sort((x,y)=>x.cd.localeCompare(y.cd));
  const cleared=withChq.filter(b=>b.clearedOn&&b.clearedOn<=asOn).sort((x,y)=>y.clearedOn.localeCompare(x.clearedOn));
  const noChq=pAll.length-withChq.length;
  const pendingRc=rAll.filter(r=>r.bankPending);
  const outTot=outstanding.reduce((a,x)=>a+x.amt,0), rcTot=pendingRc.reduce((a,r)=>a+Number(r.amount||0),0);
  const bbRec=(DB.bankBalances||[]).filter(x=>x.account===acc&&x.date<=asOn).sort((x,y)=>y.date.localeCompare(x.date))[0]||null;
  const exact=(DB.bankBalances||[]).find(x=>x.id==='bb_'+acc+'_'+asOn)||null;
  const adjs=(exact&&exact.reasons)||[]; const adjTot=adjs.reduce((a,x)=>a+(x.type==='less'?-1:1)*Number(x.amount||0),0);
  return {book,outstanding,cleared,noChq,pendingRc,outTot,rcTot,adjs,adjTot,expectedBank:book+outTot-rcTot+adjTot,bank:exact||bbRec,rAll};
}

function brRerender(){ if(String(CURRENT_PAGE).indexOf('cashbook')===0) renderCashbook(); else renderBankRecon(); }
function brRec(acc,date){
  if(!Array.isArray(DB.bankBalances)) DB.bankBalances=[];
  const id='bb_'+acc+'_'+date; let r=DB.bankBalances.find(x=>x.id===id);
  if(!r){ r={id,account:acc,date,amount:null,reasons:[],createdBy:CURRENT_USER.name}; DB.bankBalances.push(r); }
  if(!r.reasons) r.reasons=[]; return r;
}
function brSaveBankFor(acc,date){
  const v=document.getElementById('br_bank_'+acc).value; if(v===''){ showToast('⚠ ಪಾಸ್‌ಬುಕ್ ಶಿಲ್ಕು ಹಾಕಿ'); return; }
  brRec(acc,date).amount=Number(v); saveDB(); showToast('✅ ಪಾಸ್‌ಬುಕ್ ಶಿಲ್ಕು ಉಳಿಸಲಾಗಿದೆ'); brRerender();
}
function brAddReason(acc,date){
  const t=document.getElementById('br_rt_'+acc).value.trim(), a=Number(document.getElementById('br_ra_'+acc).value||0), ty=document.getElementById('br_rk_'+acc).value;
  if(!t||a<=0){ showToast('⚠ ಕಾರಣ ಮತ್ತು ಮೊತ್ತ ಹಾಕಿ'); return; }
  const r=brRec(acc,date); r.reasons=r.reasons.concat([{id:uid(),type:ty,text:t,amount:a}]); saveDB(); brRerender();
}
function brDelReason(acc,date,id){ const r=brRec(acc,date); r.reasons=r.reasons.filter(x=>x.id!==id); saveDB(); brRerender(); }
function brStatementHtml(acc,asOn,canEdit){
  const R=brData(acc,asOn); const diff=R.bank&&R.bank.amount!=null&&R.bank.amount!==''?(Number(R.bank.amount)-R.expectedBank):null;
  const out=R.outstanding;
  return `<div class="table-wrap"><table><tbody>
    <tr><td>1. ನಗದು ಪುಸ್ತಕದ ಪ್ರಕಾರ ಶಿಲ್ಕು (Cash Book Balance) — ${fmtDate(asOn)}</td><td style="text-align:right;"><b>${money(R.book)}</b></td></tr>
    <tr><td>2. ಸೇರಿಸಿ: ಚೆಕ್ ನೀಡಿದೆ ಆದರೆ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆಗಿಲ್ಲ (${out.length} ಚೆಕ್)
        ${out.length?`<div class="small-muted" style="margin-top:4px;">${out.map(x=>'ಚೆಕ್ '+esc(x.b.cheque)+' ('+fmtDate(x.cd)+', '+esc(x.b.payee)+') '+money(x.amt)+(x.stale?' 🔴ಅವಧಿ ಮುಗಿದಿದೆ':'')).join('<br>')}</div>`:''}</td><td style="text-align:right;">+ ${money(R.outTot)}</td></tr>
    <tr><td>3. ಕಳೆಯಿರಿ: ಜಮೆ ಮಾಡಿದ್ದು ಆದರೆ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಬಂದಿಲ್ಲ (${R.pendingRc.length})</td><td style="text-align:right;">− ${money(R.rcTot)}</td></tr>
    <tr><td>4. ಇತರೆ ಕಾರಣಗಳು (ಬ್ಯಾಂಕ್ ಬಡ್ಡಿ/ಶುಲ್ಕ ಇತ್ಯಾದಿ)
        ${R.adjs.map(x=>`<div class="small-muted">${x.type==='less'?'−':'+'} ${esc(x.text)}: ${money(x.amount)} ${canEdit?`<a class="no-print" style="cursor:pointer;color:var(--red);" onclick="brDelReason('${acc}','${asOn}','${x.id}')">✕</a>`:''}</div>`).join('')}
        ${canEdit?`<div class="no-print" style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"><select id="br_rk_${acc}"><option value="add">+ ಸೇರಿಸಿ</option><option value="less">− ಕಳೆಯಿರಿ</option></select><input id="br_rt_${acc}" placeholder="ಕಾರಣ (ಉದಾ: ಬ್ಯಾಂಕ್ ಶುಲ್ಕ)" list="br_dl" style="width:210px;"><datalist id="br_dl"><option value="ಬ್ಯಾಂಕ್ ಬಡ್ಡಿ ಜಮೆ (ನಗದು ಪುಸ್ತಕದಲ್ಲಿ ಇಲ್ಲ)"><option value="ಬ್ಯಾಂಕ್ ಶುಲ್ಕ / SMS ಶುಲ್ಕ"><option value="ECS/ಆನ್‌ಲೈನ್ ವರ್ಗಾವಣೆ ಇನ್ನೂ ನಮೂದಿಸಿಲ್ಲ"><option value="ಬೇರೆ ಖಾತೆಯಿಂದ ವರ್ಗಾವಣೆ"></datalist><input id="br_ra_${acc}" type="number" placeholder="₹" style="width:90px;"><button class="btn btn-sm btn-outline" onclick="brAddReason('${acc}','${asOn}')">➕</button></div>`:''}</td><td style="text-align:right;">${R.adjTot>=0?'+':'−'} ${money(Math.abs(R.adjTot))}</td></tr>
    <tr style="background:var(--surface-2);font-weight:700;"><td>5. ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿ ಇರಬೇಕಾದ ಶಿಲ್ಕು (1+2−3±4)</td><td style="text-align:right;">${money(R.expectedBank)}</td></tr>
    <tr><td>6. ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ನಿಜವಾದ ಶಿಲ್ಕು (Passbook Balance) ${R.bank&&R.bank.date!==asOn?'<span class="small-muted">('+fmtDate(R.bank.date)+' ರಂದು ಹಾಕಿದ್ದು)</span>':''}
        ${canEdit?`<span class="no-print"> <input type="number" id="br_bank_${acc}" style="width:130px;" value="${R.bank&&R.bank.date===asOn&&R.bank.amount!=null?R.bank.amount:''}" placeholder="ಶಿಲ್ಕು ₹"> <button class="btn btn-sm btn-primary" onclick="brSaveBankFor('${acc}','${asOn}')">Save</button></span>`:''}</td><td style="text-align:right;">${R.bank&&R.bank.amount!=null&&R.bank.amount!==''?money(R.bank.amount):'—'}</td></tr>
    <tr style="font-weight:800;${diff===null?'':Math.abs(diff)<0.5?'background:var(--green-tint);':'background:#fff4f2;'}"><td>7. ವ್ಯತ್ಯಾಸ (6 − 5) ${diff===null?'<span class="small-muted">(ಪಾಸ್‌ಬುಕ್ ಶಿಲ್ಕು ಹಾಕಿ)</span>':Math.abs(diff)<0.5?'✅ ಹೊಂದಿಕೆಯಾಗಿದೆ':'⚠ ವಿವರಿಸಲಾಗದ ವ್ಯತ್ಯಾಸ — ಮೇಲಿನ "ಇತರೆ ಕಾರಣಗಳು" ಸೇರಿಸಿ ಅಥವಾ ನಮೂದುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ'}</td><td style="text-align:right;">${diff===null?'—':money(diff)}</td></tr>
  </tbody></table></div>`;
}
var CB_DAY='';
function cbDatesOf(month){ const n=+cbMonthEnd(month).slice(8,10), out=[]; for(let d=1;d<=n;d++) out.push(month+'-'+String(d).padStart(2,'0')); return out; }
function cbDayRows(acc,month){
  const c=cbCompute(acc,month), net=b=>Number(b.amount||0)-Number(b.deduction||0), map={};
  c.receipts.forEach(r=>{ const k=r.date||''; (map[k]=map[k]||{r:0,p:0}).r+=Number(r.amount||0); });
  c.payments.forEach(b=>{ const k=cbPayDate(b); (map[k]=map[k]||{r:0,p:0}).p+=net(b); });
  const nt=(DB.cashNoTxn||[]).filter(n=>n.account===acc);
  let bal=c.opening;
  return cbDatesOf(month).map(d=>{
    const m=map[d]||{r:0,p:0}, o=bal; bal=o+m.r-m.p;
    const noR=nt.some(n=>n.date===d&&n.section==='receipt'), noP=nt.some(n=>n.date===d&&n.section==='payment');
    const remark=map[d]?'':((noR&&noP)?'ವ್ಯವಹಾರವಿಲ್ಲ':'ನಮೂದಿಸಿಲ್ಲ');
    return {date:d,open:o,r:m.r,tot:o+m.r,p:m.p,close:bal,tot2:m.p+bal,remark,has:!!map[d]};
  });
}
function cbDayTotals(c,month,acc){
  if(month==='all'||!acc) return '';
  let rows=cbDayRows(acc,month); if(CB_DAY&&CB_DAY.slice(0,7)===month) rows=rows.filter(x=>x.date===CB_DAY);
  return `<h4 style="margin:18px 0 6px;font-size:13px;color:var(--navy);">📅 ದಿನವಾರು ಲೆಕ್ಕ (Day totals) — ಎಲ್ಲಾ ದಿನಾಂಕಗಳು</h4>
  <div class="helper">ಸ್ವೀಕೃತಿ = OB + ಜಮಾ = ಒಟ್ಟು &nbsp;|&nbsp; ಪಾವತಿ = ಖರ್ಚು + ಉಳಿಕೆ = ಒಟ್ಟು</div>
  <div class="table-wrap"><table><thead><tr><th rowspan="2">ದಿನಾಂಕ</th><th colspan="3">ಸ್ವೀಕೃತಿ</th><th colspan="3">ಪಾವತಿ</th><th rowspan="2">ಷರಾ</th></tr><tr><th>OB ಆರಂಭಿಕ ಶಿಲ್ಕು</th><th>ಜಮಾ</th><th>ಒಟ್ಟು</th><th>ಖರ್ಚು</th><th>ಉಳಿಕೆ</th><th>ಒಟ್ಟು</th></tr></thead><tbody>${rows.map(x=>`<tr style="${x.has?'':'color:var(--muted);'}"><td>${fmtDate(x.date)}</td><td>${money(x.open)}</td><td>${money(x.r)}</td><td>${money(x.tot)}</td><td>${money(x.p)}</td><td><b>${money(x.close)}</b></td><td>${money(x.tot2)}</td><td>${esc(x.remark)}</td></tr>`).join('')}</tbody></table></div>`;
}
function cbMonthEnd(m){ const [y,mo]=m.split('-').map(Number); return new Date(Date.UTC(y,mo,0)).toISOString().slice(0,10); }
function cbBankBlock(acc,month){
  if(month==='all') return '';
  const asOn=cbMonthEnd(month); const canEdit=CURRENT_USER.role==='fda'&&!cbLocked(acc,month);
  return `<div style="margin-top:18px;page-break-inside:avoid;"><h4 style="margin:0 0 6px;font-size:13px;color:var(--navy);">🏦 ತಿಂಗಳ ಅಂತ್ಯದ ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ — ನಗದು ಪುಸ್ತಕ ಶಿಲ್ಕು vs ಪಾಸ್‌ಬುಕ್ ಶಿಲ್ಕು (${fmtDate(asOn)})</h4>${brStatementHtml(acc,asOn,canEdit)}</div>`;
}
function brSet(k,v){ if(k==='acc') BR_ACC=v; else BR_DATE=v; renderBankRecon(); }
function renderBankRecon(){
  const fda=CURRENT_USER.role==='fda';
  if(!BR_DATE) BR_DATE=todayStr();
  const acc=BR_ACC, asOn=BR_DATE, R=brData(acc,asOn);
  const stale=R.outstanding.filter(x=>x.stale), soon=R.outstanding.filter(x=>!x.stale&&x.left<=15);
  const diff=R.bank?(Number(R.bank.amount)-R.expectedBank):null;
  const recent=R.rAll.filter(r=>brDays(r.date,asOn)<=90).sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('content').innerHTML=`
    ${printHeaderHtml('ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ ಪಟ್ಟಿ (Bank Reconciliation Statement)',ACCOUNTS[acc].name+' ('+ACCOUNTS[acc].id+') — '+fmtDate(asOn)+' ರಂದು')}
    <div class="page-head"><h2>🏦 ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ (Bank Reconciliation)</h2><div class="desc">ಶಾಲೆ ಚೆಕ್ ನೀಡಿ ನಗದು ಪುಸ್ತಕದಲ್ಲಿ ಖರ್ಚು ಬರೆದಿದ್ದರೂ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಇನ್ನೂ ಪಾವತಿ ಆಗದ ಚೆಕ್‌ಗಳು. ಚೆಕ್ ಜಮೆ ಮಾಡಲು ಅವಧಿ 3 ತಿಂಗಳು — ಮೀರಿದ ಚೆಕ್ ಅನ್ನು ಕೆಂಪು ಬಣ್ಣದಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ.</div></div>
    <div class="panel no-print"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
      <div class="field" style="margin:0;"><label>ಖಾತೆ</label><select onchange="brSet('acc',this.value)"><option value="main" ${acc==='main'?'selected':''}>${esc(ACCOUNTS.main.name)}</option><option value="joint" ${acc==='joint'?'selected':''}>${esc(ACCOUNTS.joint.name)}</option></select></div>
      <div class="field" style="margin:0;"><label>ದಿನಾಂಕದಂತೆ (As on)</label><input type="date" value="${asOn}" onchange="brSet('date',this.value)"></div>
      <button class="btn btn-gold btn-sm" onclick="window.print()">🖨 Print / PDF</button>
      <button class="btn btn-outline btn-sm" onclick="brExcel()">⬇ Excel</button>
      <button class="btn btn-outline btn-sm" onclick="navigate(cbPage())">← ನಗದು ಪುಸ್ತಕ</button></div></div>
    ${(stale.length||soon.length)?`<div class="note" style="background:#fff4f2;border-color:#e0b4ae;">${stale.length?`🔴 <b>${stale.length}</b> ಚೆಕ್‌ಗಳ 3 ತಿಂಗಳ ಅವಧಿ ಮುಗಿದಿದೆ (ಒಟ್ಟು ${money(stale.reduce((a,x)=>a+x.amt,0))}) — ಪಾವತಿದಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ, ಹೊಸ ಚೆಕ್ ನೀಡಿ ಅಥವಾ ರದ್ದುಗೊಳಿಸಿ. `:''}${soon.length?`🟠 <b>${soon.length}</b> ಚೆಕ್‌ಗಳ ಅವಧಿ 15 ದಿನಗಳೊಳಗೆ ಮುಗಿಯಲಿದೆ.`:''}</div>`:''}
    <div class="panel"><h3>📑 ಹೊಂದಾಣಿಕೆ ಪಟ್ಟಿ — ${fmtDate(asOn)}</h3>
      ${brStatementHtml(acc,asOn,fda)}</div>
    <div class="panel"><h3>⏳ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆಗದ ಚೆಕ್‌ಗಳು (${R.outstanding.length}) — ಒಟ್ಟು ${money(R.outTot)}</h3>
      ${fda?`<div class="no-print note" style="margin-bottom:10px;">ಪಾಸ್‌ಬುಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆದ ಚೆಕ್ ಸಂಖ್ಯೆಗಳನ್ನು ಒಟ್ಟಿಗೆ ಹಾಕಿ ಗುರುತಿಸಿ: <input id="br_chqs" placeholder="ಚೆಕ್ ಸಂಖ್ಯೆಗಳು (ಅಲ್ಪವಿರಾಮ/ಸ್ಪೇಸ್‌ನಿಂದ ಬೇರ್ಪಡಿಸಿ)" style="width:280px;"> <input type="date" id="br_cdate" value="${asOn}"> <button class="btn btn-sm btn-green" onclick="brBulkClear()">✔ ಎಲ್ಲವನ್ನೂ ಪಾವತಿ ಆಯಿತೆಂದು ಗುರುತಿಸಿ</button></div>`:''}
      <div class="table-wrap"><table><thead><tr><th>ಚೆಕ್ ಸಂ.</th><th>ಚೆಕ್ ದಿನಾಂಕ</th><th>ಪಾವತಿದಾರರು</th><th>ವೋಚರ್</th><th style="text-align:right;">ಮೊತ್ತ</th><th>ಅವಧಿ ಮುಗಿಯುವ ದಿನ</th><th>ಸ್ಥಿತಿ</th>${fda?'<th class="no-print">Action</th>':''}</tr></thead><tbody>
      ${R.outstanding.length?R.outstanding.map(x=>`<tr style="${x.stale?'background:#fff4f2;':x.left<=15?'background:#fff8e6;':''}"><td><b>${esc(x.b.cheque)}</b></td><td>${fmtDate(x.cd)}</td><td>${esc(x.b.payee)}</td><td>${esc(x.b.voucher||'')}</td><td style="text-align:right;">${money(x.amt)}</td><td>${fmtDate(x.valid)}</td>
        <td>${x.stale?`<span class="badge badge-bad">🔴 ಅವಧಿ ಮುಗಿದಿದೆ (${-x.left} ದಿನ)</span>`:`<span class="badge ${x.left<=15?'badge-progress':'badge-ok'}">${x.left} ದಿನ ಬಾಕಿ</span>`}</td>
        ${fda?`<td class="no-print"><button class="btn btn-sm btn-green" onclick="brClear('${x.b.id}')">✔ ಪಾವತಿ ಆಯಿತು</button></td>`:''}</tr>`).join(''):'<tr class="empty-row"><td colspan="8">ಬಾಕಿ ಚೆಕ್‌ಗಳಿಲ್ಲ ✅</td></tr>'}
      </tbody></table></div>
      ${R.noChq?`<div class="helper">ℹ ಚೆಕ್ ಸಂಖ್ಯೆ ಇಲ್ಲದ ${R.noChq} ಪಾವತಿಗಳನ್ನು (ನಗದು/ಆನ್‌ಲೈನ್) ಇಲ್ಲಿ ಪರಿಗಣಿಸಿಲ್ಲ.</div>`:''}</div>
    <div class="panel no-print"><h3>🏦 ಇತ್ತೀಚೆಗೆ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆದ ಚೆಕ್‌ಗಳು (${R.cleared.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ಚೆಕ್ ಸಂ.</th><th>ಪಾವತಿದಾರರು</th><th style="text-align:right;">ಮೊತ್ತ</th><th>ಬ್ಯಾಂಕ್ ಪಾವತಿ ದಿನಾಂಕ</th>${fda?'<th>Action</th>':''}</tr></thead><tbody>
      ${R.cleared.slice(0,30).map(b=>`<tr><td>${esc(b.cheque)}</td><td>${esc(b.payee)}</td><td style="text-align:right;">${money(Number(b.amount||0)-Number(b.deduction||0))}</td><td>${fmtDate(b.clearedOn)}</td>${fda?`<td><button class="btn btn-sm btn-outline" onclick="brUnclear('${b.id}')">↩ ರದ್ದು</button></td>`:''}</tr>`).join('')||'<tr class="empty-row"><td colspan="5">—</td></tr>'}</tbody></table></div></div>
    ${fda?`<div class="panel no-print"><h3>📥 ಜಮೆ — ಬ್ಯಾಂಕ್‌ಗೆ ಇನ್ನೂ ಬಂದಿಲ್ಲದ್ದು (ಕಳೆದ 90 ದಿನ)</h3><div class="helper" style="margin-bottom:6px;">ನಗದು ಪುಸ್ತಕದಲ್ಲಿ ಜಮೆ ಬರೆದಿದ್ದು ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಇನ್ನೂ ಬಾರದ ಮೊತ್ತಗಳನ್ನು ಗುರುತಿಸಿ.</div>
      <div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>ಮೂಲ</th><th style="text-align:right;">ಮೊತ್ತ</th><th>Action</th></tr></thead><tbody>
      ${recent.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${esc(r.source)}</td><td style="text-align:right;">${money(r.amount)}</td><td><button class="btn btn-sm ${r.bankPending?'btn-green':'btn-outline'}" onclick="brToggleRc('${r.id}')">${r.bankPending?'✔ ಬ್ಯಾಂಕ್‌ಗೆ ಬಂತು':'⏳ ಬಂದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಿ'}</button></td></tr>`).join('')||'<tr class="empty-row"><td colspan="4">—</td></tr>'}</tbody></table></div></div>`:''}`;
}
function brSaveBank(){
  const v=document.getElementById('br_bank').value; if(v===''){ showToast('⚠ ಶಿಲ್ಕು ಹಾಕಿ'); return; }
  if(!Array.isArray(DB.bankBalances)) DB.bankBalances=[];
  const id='bb_'+BR_ACC+'_'+BR_DATE, rec=DB.bankBalances.find(x=>x.id===id);
  if(rec) rec.amount=Number(v); else DB.bankBalances.push({id,account:BR_ACC,date:BR_DATE,amount:Number(v),createdBy:CURRENT_USER.name});
  saveDB(); showToast('✅ ಬ್ಯಾಂಕ್ ಶಿಲ್ಕು ಉಳಿಸಲಾಗಿದೆ'); renderBankRecon();
}
function brClear(id){
  const b=DB.bills.find(x=>x.id===id); if(!b) return;
  const dt=prompt('ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆದ ದಿನಾಂಕ (YYYY-MM-DD):',BR_DATE||todayStr()); if(!dt) return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dt.trim())){ showToast('⚠ ದಿನಾಂಕ YYYY-MM-DD ರೂಪದಲ್ಲಿರಲಿ'); return; }
  b.clearedOn=dt.trim(); saveDB(); renderBankRecon();
}
function brUnclear(id){ const b=DB.bills.find(x=>x.id===id); if(!b) return; delete b.clearedOn; b.clearedOn=''; saveDB(); renderBankRecon(); }
function brBulkClear(){
  const nums=(document.getElementById('br_chqs').value||'').split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
  const dt=document.getElementById('br_cdate').value||todayStr();
  if(!nums.length){ showToast('⚠ ಚೆಕ್ ಸಂಖ್ಯೆಗಳನ್ನು ಹಾಕಿ'); return; }
  let n=0; const miss=[];
  nums.forEach(c=>{
    const hits=DB.bills.filter(b=>b.account===BR_ACC&&(b.status==='Paid'||b.status==='Closed')&&!b.clearedOn&&String(b.cheque||'').trim().replace(/^0+/,'')===c.replace(/^0+/,''));
    if(hits.length){ hits.forEach(b=>{ b.clearedOn=dt; n++; }); } else miss.push(c);
  });
  saveDB(); showToast('✅ '+n+' ಚೆಕ್ ಪಾವತಿ ಆಯಿತೆಂದು ಗುರುತಿಸಲಾಗಿದೆ'+(miss.length?' · ಸಿಗದ ಸಂಖ್ಯೆಗಳು: '+miss.join(', '):''),8000); renderBankRecon();
}
function brToggleRc(id){ const r=(DB.receipts[BR_ACC]||[]).find(x=>x.id===id); if(!r) return; r.bankPending=!r.bankPending; saveDB(); renderBankRecon(); }
function brExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const R=brData(BR_ACC,BR_DATE);
  const s1=[['ಬ್ಯಾಂಕ್ ಹೊಂದಾಣಿಕೆ ಪಟ್ಟಿ',ACCOUNTS[BR_ACC].id,BR_DATE],['ನಗದು ಪುಸ್ತಕ ಶಿಲ್ಕು',R.book],['+ ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಪಾವತಿ ಆಗದ ಚೆಕ್‌ಗಳು',R.outTot],['− ಬ್ಯಾಂಕ್‌ಗೆ ಬಾರದ ಜಮೆ',R.rcTot],['ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಇರಬೇಕಾದ ಶಿಲ್ಕು',R.expectedBank],['ಬ್ಯಾಂಕ್ ನಿಜ ಶಿಲ್ಕು',R.bank&&R.bank.amount!=null?R.bank.amount:''],['ವ್ಯತ್ಯಾಸ',R.bank&&R.bank.amount!=null?R.bank.amount-R.expectedBank:'']];
  const s2=[['ಚೆಕ್ ಸಂ.','ಚೆಕ್ ದಿನಾಂಕ','ಪಾವತಿದಾರರು','ವೋಚರ್','ಮೊತ್ತ','ಅವಧಿ ಮುಗಿಯುವ ದಿನ','ಬಾಕಿ ದಿನ','ಸ್ಥಿತಿ'],...R.outstanding.map(x=>[x.b.cheque,x.cd,x.b.payee,x.b.voucher||'',x.amt,x.valid,x.left,x.stale?'ಅವಧಿ ಮುಗಿದಿದೆ':'ಮಾನ್ಯ'])];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(s1),'BRS'); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(s2),'Outstanding cheques');
  XLSX.writeFile(wb,'Bank_Reconciliation_'+BR_ACC+'_'+BR_DATE+'.xlsx');
}

;(window.__LOADED=window.__LOADED||[]).push('finance');
