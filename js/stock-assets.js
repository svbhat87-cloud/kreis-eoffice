/* =====================================================================
   KREIS e-Office v35 — stock-assets.js
   ಸಾಮಗ್ರಿ / ಸ್ಟಾಕ್ — Stock & assets
   ===================================================================== */
function assetCfg(){
  const cfg={
    key:'assets', storeKey:'assets', title:'ಚರಾಸ್ತಿ ವಹಿ (Movable Asset Register)',
    subtitle:'FDA Entry → Principal Approval → ಚರಾಸ್ತಿ ಸಂಖ್ಯೆ ಸೃಷ್ಟಿ → Register Closed',
    newLabel:'ಹೊಸ ಚರಾಸ್ತಿ ದಾಖಲಾತಿ',
    createRoles:['fda'],
    fields:[
      {key:'description', label:'ಚರಾಸ್ತಿಯ ವಿವರ/ಹೆಸರು', type:'text', required:true},
      {key:'purchaseDate', label:'ಖರೀದಿ ದಿನಾಂಕ', type:'date', default:todayStr},
      {key:'supplierAgency', label:'ಸರಬರಾಜುದಾರ ಏಜೆನ್ಸಿ', type:'text'},
      {key:'billNo', label:'ಬಿಲ್ ಸಂಖ್ಯೆ', type:'text'},
      {key:'billDate', label:'ಬಿಲ್ ದಿನಾಂಕ', type:'date'},
      {key:'sanctionOrderNo', label:'ಮಂಜೂರಾತಿ ಆದೇಶ ಸಂಖ್ಯೆ', type:'text'},
      {key:'purchaseQty', label:'ಖರೀದಿ ಪ್ರಮಾಣ', type:'number', default:'1'},
      {key:'rate', label:'ಪ್ರತಿ ಸರಕಿನ ದರ (₹)', type:'number', default:'0'},
      {key:'location', label:'ಇರಿಸಿದ ಸ್ಥಳ/ಬಳಕೆ', type:'text'},
      {key:'condition', label:'ಸ್ಥಿತಿ', type:'select', options:['Good','Average','Poor']},
      {key:'remarks', label:'ಷರಾ', type:'text'},
    ],
    columns:[
      {key:'assetNo', label:'ಚರಾಸ್ತಿ ಸಂಖ್ಯೆ', render:i=>i.assetNo||'—'}, {key:'description', label:'ವಿವರ'},
      {key:'purchaseDate', label:'ದಿನಾಂಕ', render:i=>fmtDate(i.purchaseDate)}, {key:'supplierAgency', label:'ಏಜೆನ್ಸಿ'},
      {key:'purchaseQty', label:'ಪ್ರಮಾಣ'}, {key:'rate', label:'ದರ ₹'},
      {key:'value', label:'ಒಟ್ಟೂ ಮೌಲ್ಯ', render:i=>money(Number(i.purchaseQty||0)*Number(i.rate||0))},
    ],
    workflowSteps:['Draft','Sent to Principal','Approved','Asset No Generated','Closed'],
    steps:[
      {from:'Draft',to:'Sent to Principal',role:'fda',btn:'Principal ಗೆ ಕಳುಹಿಸಿ'},
      {from:'Sent to Principal',to:'Approved',role:'principal',btn:'Approve'},
      {from:'Sent to Principal',to:'Rejected',role:'principal',btn:'Reject'},
      {from:'Approved',to:'Asset No Generated',role:'fda',btn:'ಚರಾಸ್ತಿ ಸಂಖ್ಯೆ ಸೃಷ್ಟಿಸಿ'},
      {from:'Asset No Generated',to:'Closed',role:'fda',btn:'Register Closed'},
    ],
    onTransition:(item,to)=>{ if(to==='Asset No Generated'){ item.assetNo='AST-'+nextSeq('asset'); } },
    canDelete:(item)=> item.status==='Draft',
  };
  MODULE_CFGS.assets=cfg;
  return cfg;
}

function renderAssetsRegister(){
  const canCreate = CURRENT_USER.role==='fda';
  const canApprove = CURRENT_USER.role==='principal';
  const items = DB.assets||[];
  const cfg = assetCfg();
  const totalValue = items.reduce((a,i)=>a+Number(i.purchaseQty||0)*Number(i.rate||0),0);
  const closedItems = items.filter(i=>i.status==='Closed'||i.status==='Asset No Generated');

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🪑 ಚರಾಸ್ತಿ ವಹಿ (Movable Asset Register)</h2>
    </div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${items.length}</div><div class="l">ಒಟ್ಟು ಚರಾಸ್ತಿಗಳು</div></div>
      <div class="stat-card"><div class="n">${closedItems.length}</div><div class="l">ನೋಂದಾಯಿಸಿದ</div></div>
      <div class="stat-card"><div class="n">₹${totalValue.toLocaleString()}</div><div class="l">ಒಟ್ಟು ಮೌಲ್ಯ</div></div>
      <div class="stat-card"><div class="n">${items.filter(i=>i.status==='Sent to Principal').length}</div><div class="l">Principal Approval ಬಾಕಿ</div></div>
    </div>

    ${canCreate?`<div class="panel"><h3>➕ ಹೊಸ ಚರಾಸ್ತಿ ದಾಖಲಾತಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಚರಾಸ್ತಿಯ ವಿವರ/ಹೆಸರು <span class="req-star">*</span></label><input id="ast_description" placeholder="ಉದಾ: ಮೇಜು, ಕುರ್ಚಿ, ಕಂಪ್ಯೂಟರ್..."></div>
        <div class="field"><label>ಖರೀದಿ ದಿನಾಂಕ</label><input type="date" id="ast_purchaseDate" value="${todayStr()}"></div>
        <div class="field"><label>ಸರಬರಾಜುದಾರ / ಏಜೆನ್ಸಿ</label><input id="ast_supplierAgency" placeholder="ಏಜೆನ್ಸಿ ಹೆಸರು"></div>
        <div class="field"><label>ಬಿಲ್ ಸಂಖ್ಯೆ</label><input id="ast_billNo" placeholder="ಬಿಲ್ ಸಂ."></div>
        <div class="field"><label>ಬಿಲ್ ದಿನಾಂಕ</label><input type="date" id="ast_billDate"></div>
        <div class="field"><label>ಮಂಜೂರಾತಿ ಆದೇಶ ಸಂಖ್ಯೆ</label><input id="ast_sanctionOrderNo" placeholder="ಆದೇಶ ಸಂ."></div>
        <div class="field"><label>ಖರೀದಿ ಪ್ರಮಾಣ</label><input type="number" id="ast_purchaseQty" value="1" min="1"></div>
        <div class="field"><label>ಪ್ರತಿ ಸರಕಿನ ದರ (₹)</label><input type="number" id="ast_rate" value="0" oninput="updateAstTotal()"></div>
        <div class="field"><label>ಒಟ್ಟು ಮೌಲ್ಯ (₹)</label><input id="ast_total_display" readonly style="background:var(--surface-2);font-weight:700;" value="0"></div>
        <div class="field"><label>ಇರಿಸಿದ ಸ್ಥಳ / ಬಳಕೆ</label><input id="ast_location" placeholder="ಉದಾ: ಕಚೇರಿ, ಶ್ರೇಣಿ 6ನೇ ತರಗತಿ..."></div>
        <div class="field"><label>ಸ್ಥಿತಿ</label><select id="ast_condition"><option>Good</option><option>Average</option><option>Poor</option></select></div>
        <div class="field"><label>ಷರಾ</label><input id="ast_remarks" placeholder="ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿ"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="saveNewAsset()">💾 Save → Principal ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>`:''}

    <div class="panel"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
      <h3 style="margin:0;">📋 ಚರಾಸ್ತಿ ಪಟ್ಟಿ (${items.length})</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-gold" onclick="printAssetsRegister()">🖨️ Print Register</button>
        <button class="btn btn-sm btn-outline" onclick="downloadAssetsExcel()">⬇ Excel Download</button>
      </div>
    </div>
    <div class="table-wrap"><table><thead><tr>
      <th>#</th><th>ಚರಾಸ್ತಿ ಸಂ.</th><th>ವಿವರ</th><th>ದಿನಾಂಕ</th><th>ಏಜೆನ್ಸಿ</th><th>ಬಿಲ್ ಸಂ.</th><th>ಪ್ರಮಾಣ</th><th>ದರ</th><th>ಮೌಲ್ಯ</th><th>ಸ್ಥಳ</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
    </tr></thead>
    <tbody>${items.length? items.slice().reverse().map((item,idx)=>{
      const val=Number(item.purchaseQty||0)*Number(item.rate||0);
      const btns=[];
      cfg.steps.forEach(s=>{
        if(s.from===item.status && s.role===CURRENT_USER.role){
          btns.push(`<button class="btn btn-sm ${s.to==='Rejected'?'btn-red':s.to==='Closed'?'btn-green':'btn-primary'}" onclick="assetTransition('${item.id}','${s.to}')">${s.btn}</button>`);
        }
      });
      if(item.status==='Draft'&&CURRENT_USER.role==='fda') btns.push(`<button class="btn btn-sm btn-outline" onclick="deleteAssetItem('${item.id}')">🗑</button>`);
      return `<tr>
        <td>${items.length-idx}</td>
        <td><b>${esc(item.assetNo||'—')}</b></td>
        <td><b>${esc(item.description)}</b><br><span class="small-muted">${esc(item.condition||'')}</span></td>
        <td>${fmtDate(item.purchaseDate)}</td>
        <td>${esc(item.supplierAgency||'—')}</td>
        <td>${esc(item.billNo||'—')}</td>
        <td>${item.purchaseQty}</td>
        <td>₹${Number(item.rate||0).toLocaleString()}</td>
        <td><b>₹${val.toLocaleString()}</b></td>
        <td>${esc(item.location||'—')}</td>
        <td><span class="badge ${badgeClass(item.status)}">${esc(item.status)}</span>
        </td>
        <td class="actions-cell">${btns.join('')}</td>
      </tr>`;
    }).join('') : `<tr class="empty-row"><td colspan="12">ಯಾವ ಚರಾಸ್ತಿ ದಾಖಲಾತಿ ಇಲ್ಲ.</td></tr>`}
    <tr style="font-weight:800;background:var(--surface-2);">
      <td colspan="8" style="text-align:right;padding:6px 8px;">ಒಟ್ಟು ಮೌಲ್ಯ:</td>
      <td><b>₹${totalValue.toLocaleString()}</b></td>
      <td colspan="3"></td>
    </tr>
    </tbody></table></div>
    </div>
    <div id="assetPrintWrap"></div>`;
}

function updateAstTotal(){
  const qty=Number(document.getElementById('ast_purchaseQty')?.value||0);
  const rate=Number(document.getElementById('ast_rate')?.value||0);
  const el=document.getElementById('ast_total_display'); if(el) el.value='₹'+(qty*rate).toLocaleString();
}

function saveNewAsset(){
  const desc=document.getElementById('ast_description')?.value?.trim();
  if(!desc){ showToast('⚠ ಚರಾಸ್ತಿ ವಿವರ ನಮೂದಿಸಿ'); return; }
  if(!DB.assets) DB.assets=[];
  const item={
    id:uid(), description:desc,
    purchaseDate:document.getElementById('ast_purchaseDate')?.value||todayStr(),
    supplierAgency:document.getElementById('ast_supplierAgency')?.value||'',
    billNo:document.getElementById('ast_billNo')?.value||'',
    billDate:document.getElementById('ast_billDate')?.value||'',
    sanctionOrderNo:document.getElementById('ast_sanctionOrderNo')?.value||'',
    purchaseQty:Number(document.getElementById('ast_purchaseQty')?.value||1),
    rate:Number(document.getElementById('ast_rate')?.value||0),
    location:document.getElementById('ast_location')?.value||'',
    condition:document.getElementById('ast_condition')?.value||'Good',
    remarks:document.getElementById('ast_remarks')?.value||'',
    status:'Draft', createdBy:CURRENT_USER.name, createdAt:todayStr(), assetNo:null, history:[]
  };
  DB.assets.push(item); saveDB();
  showToast('✅ ಚರಾಸ್ತಿ ದಾಖಲಿಸಲಾಗಿದೆ');
  navigate('assets');
}

function assetTransition(id, to){
  if(!DB.assets) return;
  const item=DB.assets.find(x=>x.id===id); if(!item) return;
  if(to==='Rejected'){
    const reason=prompt('Reject ಕಾರಣ (ಕಡ್ಡಾಯ):')||'';
    if(!reason){ showToast('⚠ Reject ಕಾರಣ ಬರೆಯಿರಿ'); return; }
    item.rejectReason=reason;
  }
  if(to==='Asset No Generated') item.assetNo='AST-'+nextSeq('asset');
  if(to==='Approved'){ const p=STAFF.find(x=>x.role==='principal'); }
  item.status=to;
  if(!item.history) item.history=[];
  item.history.push({by:CURRENT_USER.name, to, at:todayStr()});
  saveDB();
  if(to==='Approved') staffNamesForRole('fda').forEach(n=>pushNotification(n,'✅ ಚರಾಸ್ತಿ Approved: '+item.description+' — Asset No ಸೃಷ್ಟಿಸಿ'));
  if(to==='Rejected') pushNotification(item.createdBy,'❌ ಚರಾಸ್ತಿ Rejected: '+item.description+(item.rejectReason?' — '+item.rejectReason:''));
  showToast('✅ ಅಪ್‌ಡೇಟ್: '+to); navigate('assets');
}

function deleteAssetItem(id){
  if(!confirm('ಅಳಿಸುವುದೇ?')) return;
  DB.assets=(DB.assets||[]).filter(x=>x.id!==id); saveDB(); navigate('assets');
}

function printAssetsRegister(){
  const items=DB.assets||[];
  const totalValue=items.reduce((a,i)=>a+Number(i.purchaseQty||0)*Number(i.rate||0),0);
  const html=`<div class="letterhead-paper" style="font-size:11px;" id="printArea">
    <div class="lh-top">
            <div class="lh-org"><div class="l1">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</div>
      ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320</div>
    </div>
    <div style="text-align:center;font-size:14px;font-weight:800;margin:8px 0;">ಚರಾಸ್ತಿ ವಹಿ (Movable Asset Register)</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr style="background:#1a3a5c;color:#fff;">
        <th style="padding:4px 5px;">#</th>
        <th style="padding:4px 5px;">ಚರಾಸ್ತಿ ಸಂ.</th>
        <th style="padding:4px 5px;text-align:left;">ಚರಾಸ್ತಿ ವಿವರ</th>
        <th style="padding:4px 5px;">ಖರೀದಿ ದಿನಾಂಕ</th>
        <th style="padding:4px 5px;">ಏಜೆನ್ಸಿ</th>
        <th style="padding:4px 5px;">ಬಿಲ್ ಸಂ.</th>
        <th style="padding:4px 5px;">ಪ್ರಮಾಣ</th>
        <th style="padding:4px 5px;">ದರ ₹</th>
        <th style="padding:4px 5px;">ಮೌಲ್ಯ ₹</th>
        <th style="padding:4px 5px;">ಸ್ಥಳ</th>
        <th style="padding:4px 5px;">ಸ್ಥಿತಿ</th>
      </tr></thead>
      <tbody>${items.map((item,i)=>{
        const val=Number(item.purchaseQty||0)*Number(item.rate||0);
        return `<tr style="${i%2?'background:#f8f8f8':''}">
          <td style="padding:3px 5px;text-align:center;">${i+1}</td>
          <td style="padding:3px 5px;text-align:center;font-weight:700;">${esc(item.assetNo||'—')}</td>
          <td style="padding:3px 5px;"><b>${esc(item.description)}</b>${item.remarks?'<br><i>'+esc(item.remarks)+'</i>':''}</td>
          <td style="padding:3px 5px;">${fmtDate(item.purchaseDate)}</td>
          <td style="padding:3px 5px;">${esc(item.supplierAgency||'—')}</td>
          <td style="padding:3px 5px;">${esc(item.billNo||'—')}</td>
          <td style="padding:3px 5px;text-align:center;">${item.purchaseQty}</td>
          <td style="padding:3px 5px;text-align:right;">${Number(item.rate||0).toLocaleString()}</td>
          <td style="padding:3px 5px;text-align:right;font-weight:700;">${val.toLocaleString()}</td>
          <td style="padding:3px 5px;">${esc(item.location||'—')}</td>
          <td style="padding:3px 5px;">${esc(item.status)}</td>
        </tr>`;
      }).join('')}
      <tr style="font-weight:900;background:#e7eef5;">
        <td colspan="8" style="padding:4px 5px;text-align:right;">ಒಟ್ಟು ಮೌಲ್ಯ:</td>
        <td style="padding:4px 5px;text-align:right;">₹${totalValue.toLocaleString()}</td>
        <td colspan="2"></td>
      </tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:32px;font-size:11px;">
      <div style="text-align:center;"><div style="margin-bottom:30px;"></div><div style="border-top:1.5px solid #000;padding-top:4px;font-size:11px;">FDA / ದಾಖಲಾತಿ ಸಿಬ್ಬಂದಿ</div></div>
      <div style="text-align:right;">${typeof PRINCIPAL_SIGN!=='undefined'?`<div style="height:34px;"></div><div style="font-size:10px;font-weight:700;font-family:var(--font-kn);text-align:right;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div>`:`<div style="margin-bottom:40px;border-top:1.5px solid #000;padding-top:4px;font-size:11px;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div>`}</div>
    </div>
  </div>`;
  const wrap=document.getElementById('assetPrintWrap');
  wrap.innerHTML=`<div class="panel">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF</button>
      <button class="btn btn-outline" onclick="document.getElementById('assetPrintWrap').innerHTML=''">✕ ಮುಚ್ಚಿ</button>
    </div>
    ${html}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function downloadAssetsExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const items=DB.assets||[];
  const header=['#','ಚರಾಸ್ತಿ ಸಂ.','ವಿವರ','ಖರೀದಿ ದಿನಾಂಕ','ಏಜೆನ್ಸಿ','ಬಿಲ್ ಸಂ.','ಬಿಲ್ ದಿನಾಂಕ','ಮಂಜೂರಾತಿ ಆದೇಶ','ಪ್ರಮಾಣ','ದರ ₹','ಮೌಲ್ಯ ₹','ಸ್ಥಳ','ಸ್ಥಿತಿ','ಷರಾ'];
  const rows=items.map((item,i)=>[
    i+1, item.assetNo||'—', item.description, item.purchaseDate, item.supplierAgency||'',
    item.billNo||'', item.billDate||'', item.sanctionOrderNo||'',
    item.purchaseQty, Number(item.rate||0), Number(item.purchaseQty||0)*Number(item.rate||0),
    item.location||'', item.status, item.remarks||''
  ]);
  const totalVal=items.reduce((a,i)=>a+Number(i.purchaseQty||0)*Number(i.rate||0),0);
  rows.push(['','','','','','','','','','ಒಟ್ಟು:',totalVal,'','','']);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  ws['!cols']=header.map(()=>({wch:18}));
  XLSX.utils.book_append_sheet(wb,ws,'ಚರಾಸ್ತಿ ವಹಿ');
  XLSX.writeFile(wb,'MDRS_Charasti_Register_'+todayStr()+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

/* =====================================================================
   ಸಾಮಗ್ರಿ ದಾಸ್ತಾನು ಮತ್ತು ವಿತರಣಾ ವಹಿ (v44)
   FDA: ದಾಸ್ತಾನು ಸೇರಿಸಿ (Add) + ವಿತರಣೆ ಸೇರಿಸಿ (Add — ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿಯಿಂದ)
   ಸಿಬ್ಬಂದಿಗೆ ವಿತರಣೆ → ಆ ಸಿಬ್ಬಂದಿಯ ಲಾಗಿನ್‌ನಲ್ಲಿ "ಸ್ವೀಕರಿಸಿ (Accept)" → ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ → ಮುದ್ರಣ
   ಪ್ರಾಂಶುಪಾಲರಿಗೆ: ತಿಂಗಳಿಗೊಮ್ಮೆ ಮಾತ್ರ (ಬೇಕಿದ್ದರೆ) ಕಳುಹಿಸಬಹುದು
   PDF (Print) ಮತ್ತು Excel — A4 ಗಾತ್ರ, ಶಾಲೆಯ ವಹಿ ಮಾದರಿಯಲ್ಲಿ
   ===================================================================== */
const STK_CLOSED=['Accepted','Closed','Approved'];
var STK_MONTH=todayStr().slice(0,7);
var STK_SCOPE='all';
const STK_MONTH_NAMES=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
function stkMonthLabel(m){ if(!m) return 'ಎಲ್ಲಾ ತಿಂಗಳು'; const p=String(m).split('-'); return (STK_MONTH_NAMES[Number(p[1])-1]||p[1])+' '+p[0]; }
function stkCatLabel(k){ const c=STOCK_CATS.find(x=>x.key===k); return c?c.label:k; }
function stkEnsure(){ if(!DB.stockMonthly) DB.stockMonthly=[]; STOCK_CATS.forEach(c=>{ if(!DB.stock[c.key]) DB.stock[c.key]={receive:[],issue:[]}; }); }
function stkMonthRec(m){ return (DB.stockMonthly||[]).find(x=>x.month===m); }
var STK_RANGE=null;   // when set (principal review / print of an approval request) rows are limited to this date range
function stkInP(d,month){ d=String(d||'').slice(0,10); if(STK_RANGE) return d>=STK_RANGE.from&&d<=STK_RANGE.to; return !month||d.slice(0,7)===month; }
function stkRecRange(r){ if(r.from&&r.to) return {from:r.from,to:r.to,scope:r.scope||'all'}; return {from:r.month+'-01',to:r.month+'-31',scope:'all'}; }
function stkRecLabel(r){ if(r.from&&r.to) return fmtDate(r.from)+' → '+fmtDate(r.to)+(r.scope&&r.scope!=='all'?' ('+stkCatLabel(r.scope)+')':''); return stkMonthLabel(r.month); }
function stkPeriodLabel(month){ return STK_RANGE?(fmtDate(STK_RANGE.from)+' → '+fmtDate(STK_RANGE.to)):(month?stkMonthLabel(month):''); }
function stkLocked(date,cat){ const d=String(date||'').slice(0,10); return (DB.stockMonthly||[]).some(r=>{ if(r.status!=='Approved') return false; const g=stkRecRange(r); return d>=g.from&&d<=g.to&&(g.scope==='all'||!cat||g.scope===cat); }); }

function stockBalances(catKey){
  const cat=DB.stock[catKey], bal={};
  cat.receive.forEach(r=>{ bal[r.itemName]=(bal[r.itemName]||0)+Number(r.qty||0); });
  cat.issue.filter(i=>i.status!=='Rejected'&&i.status!=='Cancelled').forEach(i=>{ bal[i.itemName]=(bal[i.itemName]||0)-Number(i.qty||0); });
  return bal;
}

/* ------------------------------------------------------------------ rows (shared by screen, PDF and Excel) */
function stkScopeCats(scope){ return scope==='all'?STOCK_CATS.map(c=>c.key):[scope]; }
function stkStockRows(month,scope){
  const out=[]; stkEnsure();
  stkScopeCats(scope).forEach(k=>DB.stock[k].receive.forEach(r=>{ if(stkInP(r.date,month)) out.push(Object.assign({cat:k},r)); }));
  return out.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function stkIssueRows(month,scope,closedOnly){
  const out=[]; stkEnsure();
  stkScopeCats(scope).forEach(k=>DB.stock[k].issue.forEach(i=>{
    if(!stkInP(i.date,month)) return;
    if(closedOnly&&!STK_CLOSED.includes(i.status)) return;
    out.push(Object.assign({cat:k},i));
  }));
  return out.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function stkDesig(i){
  if(i.designation) return i.designation;
  if(i.recipientType==='student'||i.studentId) return 'ವಿದ್ಯಾರ್ಥಿ'+(i.className?' — '+i.className+'ನೇ ತರಗತಿ':'');
  return i.className?('ವಿದ್ಯಾರ್ಥಿ — '+i.className+'ನೇ ತರಗತಿ'):'';
}
const STK_H1=['ಕ್ರ.ಸಂ','ದಿನಾಂಕ','ಪೂರೈಕೆದಾರರ ಹೆಸರು','ಬಿಲ್ ಸಂಖ್ಯೆ','ಬಿಲ್ ದಿನಾಂಕ','ಸಾಮಗ್ರಿಯ ವಿವರ','ದರ','ಪ್ರಮಾಣ (Qty)','ಬಿಲ್ ಮೊತ್ತ','ದಾಸ್ತಾನು ದಾಖಲಾದ ದಿನಾಂಕ'];
const STK_H2=['ಕ್ರ.ಸಂ','ವಿತರಣೆ ದಿನಾಂಕ','ಸಾಮಗ್ರಿಯ ವಿವರ','ವಿತರಿಸಿದ ಪ್ರಮಾಣ','ಸಾಮಗ್ರಿಗಳನ್ನು ಯಾರಿಗೆ ವಿತರಿಸಲಾಗಿದೆ','ಹುದ್ದೆ'];
function stkDisp(d){ return d?fmtDate(d):''; }
function stkTable1(rows){ return rows.map((r,n)=>[n+1,stkDisp(r.date),r.supplier||'',r.bill||'',stkDisp(r.billDate),r.itemName,Number(r.rate||0),Number(r.qty||0),Number(r.amount!=null?r.amount:(Number(r.qty||0)*Number(r.rate||0))),stkDisp(r.createdAt||r.date)]); }
function stkTable2(rows){ return rows.map((r,n)=>[n+1,stkDisp(r.date),r.itemName,Number(r.qty||0),r.recipient||'',stkDesig(r)]); }

/* ------------------------------------------------------------------ FDA screen */
function renderStockHub(){
  const old=document.getElementById('stkPageStyle'); if(old) old.remove();
  stkEnsure();
  if(CURRENT_USER.role==='principal'){ renderStockPrincipal(); return; }
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಸಾಮಗ್ರಿ ದಾಸ್ತಾನು ಮತ್ತು ವಿತರಣಾ ವಹಿ</h2></div>
    <div class="tabs" id="stockTabs">${STOCK_CATS.filter(c=>!c.hidden).map(c=>`<div class="tab ${STOCK_TAB===c.key?'active':''}" onclick="switchStockTab('${c.key}')">${c.ic} ${esc(c.label)}</div>`).join('')}
      <div class="tab ${STOCK_TAB==='gen_in'?'active':''}" onclick="switchStockTab('gen_in')">🗂️ ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು ವಹಿ — ಸ್ವೀಕೃತಿ</div>
      <div class="tab ${STOCK_TAB==='gen_out'?'active':''}" onclick="switchStockTab('gen_out')">🗂️ ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು ವಹಿ — ವಿತರಣೆ</div></div>
    <div id="stockTabBody"></div>
    <div id="stockSendPanel"></div>`;
  renderStockTabBody();
  stkRenderSendPanel();
}
function switchStockTab(key){ STOCK_TAB=key; renderStockHub(); }

function renderStockTabBody(){
  stkEnsure();
  if(STOCK_TAB==='gen_in'||STOCK_TAB==='gen_out'){ renderGenRegister(STOCK_TAB==='gen_in'?'in':'out'); return; }
  const cat=STOCK_CATS.find(c=>c.key===STOCK_TAB), data=DB.stock[STOCK_TAB], bal=stockBalances(STOCK_TAB);
  const usedItems=Object.keys(bal);
  const recvItem = cat.items ? `<select id="stk_recv_item">${cat.items.map(i=>`<option>${esc(i)}</option>`).join('')}</select>`
    : `<input id="stk_recv_item" list="stk_items_dl" placeholder="ಸಾಮಗ್ರಿ ವಿವರ"><datalist id="stk_items_dl">${usedItems.map(i=>`<option value="${esc(i)}">`).join('')}</datalist>`;
  const optB=i=>`<option value="${esc(i)}">${esc(i)} — ಉಳಿಕೆ ${bal[i]||0}</option>`;
  const issueItem = cat.items ? `<select id="stk_issue_item" onchange="autoFillEntitlement()">${cat.items.slice().sort((x,y)=>((bal[y]||0)>0)-((bal[x]||0)>0)).map(optB).join('')}</select>`
    : (usedItems.length?`<select id="stk_issue_item">${usedItems.map(optB).join('')}</select>`:`<input id="stk_issue_item" placeholder="ಸಾಮಗ್ರಿ ವಿವರ">`);
  const staffOpts=STAFF.map(s=>`<option value="${esc(s.hrmsId)}">${esc(s.name)} — ${esc(s.desig||'')}</option>`).join('');
  const mon=STK_MONTH;
  const rec=data.receive.filter(r=>!mon||String(r.date).slice(0,7)===mon).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const iss=data.issue.filter(i=>!mon||String(i.date).slice(0,7)===mon).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const pendingAccept=DB.stock?STOCK_CATS.reduce((a,c)=>a+DB.stock[c.key].issue.filter(i=>i.status==='Issued').length,0):0;
  const mr=stkMonthRec(mon);
  const statusBadge=s=>({'Issued':'<span class="badge badge-progress">⏳ ಸ್ವೀಕಾರ ಬಾಕಿ</span>','Accepted':'<span class="badge badge-ok">✅ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ</span>','Closed':'<span class="badge badge-ok">ವಿತರಿಸಲಾಗಿದೆ</span>','Approved':'<span class="badge badge-ok">ವಿತರಿಸಲಾಗಿದೆ</span>','Rejected':'<span class="badge badge-bad">❌ ತಿರಸ್ಕರಿಸಿದ್ದಾರೆ</span>','Cancelled':'<span class="badge badge-draft">ರದ್ದು</span>'})[s]||esc(s);
  document.getElementById('stockTabBody').innerHTML=`
    <div class="panel"><h3>📥 ಭಾಗ-1: ಸ್ಟಾಕ್ ದಾಸ್ತಾನು ಸೇರಿಸಿ — ${esc(cat.label)}</h3>
      <div class="form-grid">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="stk_recv_date" value="${todayStr()}"></div>
        <div class="field"><label>ಪೂರೈಕೆದಾರರ ಹೆಸರು</label><input id="stk_recv_supplier"></div>
        <div class="field"><label>ಬಿಲ್ ಸಂಖ್ಯೆ</label><input id="stk_recv_bill"></div>
        <div class="field"><label>ಬಿಲ್ ದಿನಾಂಕ</label><input type="date" id="stk_recv_billdate" value="${todayStr()}"></div>
        <div class="field"><label>ಸಾಮಗ್ರಿಯ ವಿವರ</label>${recvItem}</div>
        <div class="field"><label>ಪ್ರಮಾಣ (Qty)</label><input type="number" id="stk_recv_qty" value="1" oninput="stkAmt()"></div>
        <div class="field"><label>ದರ (₹)</label><input type="number" step="0.01" id="stk_recv_rate" value="0" oninput="stkAmt()"></div>
        <div class="field"><label>ಬಿಲ್ ಮೊತ್ತ (₹) — ತಾನಾಗಿ</label><input id="stk_recv_amt" value="0" readonly></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="stockReceive('${STOCK_TAB}')">➕ ದಾಸ್ತಾನು Add ಮಾಡಿ</button></div>
    </div>

    <div class="panel"><h3>📤 ಭಾಗ-2: ವಿತರಣೆ ಸೇರಿಸಿ — ${esc(cat.label)}</h3>
      <div class="form-grid">
        <div class="field"><label>ವಿತರಣೆ ದಿನಾಂಕ</label><input type="date" id="stk_issue_date" value="${todayStr()}"></div>
        <div class="field"><label>ಯಾರಿಗೆ ವಿತರಣೆ</label><select id="stk_issue_type" onchange="stkTypeChanged()"><option value="staff">ಸಿಬ್ಬಂದಿ (ಪಟ್ಟಿಯಿಂದ)</option><option value="student">ವಿದ್ಯಾರ್ಥಿ (ಪಟ್ಟಿಯಿಂದ)</option><option value="other">ಇತರರು (ಹೆಸರು ಬರೆಯಿರಿ)</option></select></div>
        <div class="field" id="stk_wrap_staff"><label>ಸಿಬ್ಬಂದಿ ಆರಿಸಿ</label><select id="stk_issue_staff"><option value="">— ಸಿಬ್ಬಂದಿ ಆರಿಸಿ —</option>${staffOpts}</select></div>
        <div class="field" id="stk_wrap_class" style="display:none;"><label>ತರಗತಿ</label><select id="stk_issue_class" onchange="stkClassChanged()"><option value="">—</option>${CLASSES.map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field" id="stk_wrap_student" style="display:none;"><label>ವಿದ್ಯಾರ್ಥಿ (ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ)</label><select id="stk_issue_student"><option value="">— ಮೊದಲು ತರಗತಿ ಆರಿಸಿ —</option></select></div>
        <div class="field" id="stk_wrap_other" style="display:none;"><label>ಹೆಸರು</label><input id="stk_issue_other" placeholder="ಯಾರಿಗೆ"></div>
        <div class="field"><label>ಸಾಮಗ್ರಿಯ ವಿವರ</label>${issueItem}</div>
        <div class="field"><label>ವಿತರಿಸಿದ ಪ್ರಮಾಣ</label><input type="number" id="stk_issue_qty" value="1"></div>
      </div>
      <div class="helper" id="stk_issue_help">ಸಿಬ್ಬಂದಿಗೆ ವಿತರಿಸಿದರೆ ಅವರ ಲಾಗಿನ್‌ಗೆ ಸೂಚನೆ ಹೋಗುತ್ತದೆ. ಅವರು "ಸ್ವೀಕರಿಸಿ (Accept)" ಒತ್ತಿದ ಮೇಲೆ ಆ ವಿತರಣೆ ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ ಮತ್ತು ಮುದ್ರಣ ವಹಿಯಲ್ಲಿ ಸೇರುತ್ತದೆ.</div>
      <div class="form-actions"><button class="btn btn-primary" onclick="stockIssue('${STOCK_TAB}')">➕ ವಿತರಣೆ Add ಮಾಡಿ</button></div>
    </div>

    <div class="panel"><h3>⚖️ ಸ್ಟಾಕ್ ಬ್ಯಾಲೆನ್ಸ್ — ${esc(cat.label)}</h3>
      <div class="table-wrap"><table><thead><tr><th>ಸಾಮಗ್ರಿ</th><th>ಪಡೆದ ಒಟ್ಟು</th><th>ವಿತರಿಸಿದ ಒಟ್ಟು</th><th>ಉಳಿಕೆ</th></tr></thead>
      <tbody>${usedItems.length? usedItems.map(k=>{
        const r=data.receive.filter(x=>x.itemName===k).reduce((a,x)=>a+Number(x.qty||0),0);
        const d=data.issue.filter(i=>i.itemName===k&&i.status!=='Rejected'&&i.status!=='Cancelled').reduce((a,i)=>a+Number(i.qty||0),0);
        return `<tr><td>${esc(k)}</td><td>${r}</td><td>${d}</td><td><b>${bal[k]}</b></td></tr>`;
      }).join('') : `<tr class="empty-row"><td colspan="4">ಸ್ಟಾಕ್ ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>
    ${STOCK_TAB==='stationery'? `<div class="panel"><h3>📐 ವರ್ಗವಾರು ಪ್ರಮಾಣ ಮಾನದಂಡ (ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಗೆ ವರ್ಷಕ್ಕೆ)</h3>
      <div class="table-wrap"><table><thead><tr><th>ಸಾಮಗ್ರಿ</th>${ENTITLEMENT_CLASSES.map(c=>`<th>${c}ನೇ</th>`).join('')}</tr></thead>
      <tbody>${Object.keys(CLASS_ENTITLEMENT).map(item=>`<tr><td>${esc(item)}</td>${ENTITLEMENT_CLASSES.map(c=>`<td>${CLASS_ENTITLEMENT[item][c]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    </div>` : ''}

    ${wipeHtml('stock')}
    <div class="panel"><h3>🖨 ವಹಿ ಮುದ್ರಣ / Export — A4 (PDF ಮತ್ತು Excel)</h3>
      <div class="form-grid">
        <div class="field"><label>ತಿಂಗಳು (ಖಾಲಿ ಬಿಟ್ಟರೆ ಎಲ್ಲಾ)</label><input type="month" value="${esc(STK_MONTH)}" onchange="STK_MONTH=this.value;renderStockTabBody()"></div>
        <div class="field"><label>ವಿಭಾಗ</label><select onchange="STK_SCOPE=this.value"><option value="all" ${STK_SCOPE==='all'?'selected':''}>ಎಲ್ಲಾ ವಿಭಾಗಗಳು</option>${STOCK_CATS.map(c=>`<option value="${c.key}" ${STK_SCOPE===c.key?'selected':''}>${esc(c.label)} ಮಾತ್ರ</option>`).join('')}</select></div>
      </div>
      <div class="form-actions" style="flex-wrap:wrap;">
        <button class="btn btn-gold" onclick="stkPrint('stock')">📄 ಸ್ವೀಕೃತಿ ವಹಿ (ಸರ್ಕಾರಿ ಮಾದರಿ) — Print / PDF</button>
        <button class="btn btn-outline" onclick="stkExcel('stock')">📊 ದಾಸ್ತಾನು Excel</button>
        <button class="btn btn-gold" onclick="stkPrint('issue')">📄 ವಿತರಣಾ ವಹಿ (ಸರ್ಕಾರಿ ಮಾದರಿ) — Print / PDF</button>
        <button class="btn btn-outline" onclick="stkExcel('issue')">📊 ವಿತರಣಾ Excel</button>
        <button class="btn btn-primary" onclick="stkPrintBook()">📖 ಪೂರ್ಣ ವಹಿ — ಸ್ವೀಕೃತಿ + ವಿತರಣೆ ಒಟ್ಟಿಗೆ (A4 Landscape)</button>
      </div>
      <div class="helper">ವಿತರಣಾ ವಹಿಯಲ್ಲಿ ಸ್ವೀಕರಿಸಿದ (ಮುಚ್ಚಿದ) ವಿತರಣೆಗಳು ಮಾತ್ರ ಬರುತ್ತವೆ. ಸ್ವೀಕಾರ ಬಾಕಿ: <b>${pendingAccept}</b>.</div>
    </div>

    <div class="panel"><h3>📋 ಭಾಗ-1 ದಾಸ್ತಾನು ದಾಖಲೆ — ${esc(cat.label)} (${esc(stkMonthLabel(mon))})</h3>
      <div class="table-wrap"><table><thead><tr>${STK_H1.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rec.length? rec.map((r,n)=>`<tr><td>${n+1}</td><td>${stkDisp(r.date)}</td><td>${esc(r.supplier||'')}</td><td>${esc(r.bill||'')}</td><td>${stkDisp(r.billDate)}</td><td>${esc(r.itemName)}</td><td>${r.rate||0}</td><td>${r.qty}</td><td>${r.amount!=null?r.amount:(r.qty*(r.rate||0))}</td><td>${stkDisp(r.createdAt||r.date)}</td>
        <td><button class="btn btn-sm btn-red" onclick="stkDelReceive('${STOCK_TAB}','${r.id}')">🗑</button></td></tr>`).join('') : `<tr class="empty-row"><td colspan="11">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>

    <div class="panel"><h3>📋 ಭಾಗ-2 ವಿತರಣಾ ದಾಖಲೆ — ${esc(cat.label)} (${esc(stkMonthLabel(mon))})</h3>
      <div class="table-wrap"><table><thead><tr>${STK_H2.map(h=>`<th>${h}</th>`).join('')}<th>ಸ್ಥಿತಿ</th><th></th></tr></thead>
      <tbody>${iss.length? iss.map((i,n)=>`<tr><td>${n+1}</td><td>${stkDisp(i.date)}</td><td>${esc(i.itemName)}</td><td>${i.qty}</td><td>${esc(i.recipient||'')}</td><td>${esc(stkDesig(i))}</td><td>${statusBadge(i.status)}${i.rejectReason?'<br><span class="small-muted">'+esc(i.rejectReason)+'</span>':''}</td>
        <td>${i.status==='Issued'?`<button class="btn btn-sm btn-gold" onclick="stkCancelIssue('${STOCK_TAB}','${i.id}')">ರದ್ದು</button>`:(i.status==='Closed'||i.status==='Approved'||i.status==='Accepted')?`<button class="btn btn-sm btn-red" onclick="stkCancelIssue('${STOCK_TAB}','${i.id}')">🗑</button>`:''}</td></tr>`).join('') : `<tr class="empty-row"><td colspan="8">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>`;
  stkTypeChanged();
}
/* ------------------------------------------------------------------ ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು ವಹಿ — two separate registers (any item) */
function renderGenRegister(which){
  const k='general', data=DB.stock[k], bal=stockBalances(k), mon=STK_MONTH, isIn=which==='in';
  const dd=d=>{ const x=String(d||'').slice(0,10).split('-'); return x.length===3?x[2]+'-'+x[1]+'-'+x[0]:''; };
  const c='border:1px solid #888;padding:4px 5px;font-size:12.5px;vertical-align:middle;';
  const h='border:1px solid #0b2340;background:var(--navy);color:#fff;padding:6px 4px;font-size:12px;text-align:center;font-weight:700;white-space:normal;';
  const nm='border:1px solid #888;background:#eef2f7;text-align:center;font-size:10.5px;padding:1px;';
  const inp='width:100%;box-sizing:border-box;padding:4px;font-size:12px;border:1px solid #6b7c93;border-radius:2px;';
  const used=Object.keys(bal), staffOpts=STAFF.map(s=>`<option value="${esc(s.hrmsId)}">${esc(s.name)} — ${esc(s.desig||'')}</option>`).join('');
  const monthBar=`<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap;"><label style="font-size:12px;">ತಿಂಗಳು (ಖಾಲಿ ಬಿಟ್ಟರೆ ಎಲ್ಲಾ):</label><input type="month" value="${esc(mon)}" onchange="STK_MONTH=this.value;renderStockTabBody()" style="padding:3px;">
    <button class="gv-b pri" onclick="STK_SCOPE='general';stkPrint('${isIn?'stock':'issue'}')">ಸರ್ಕಾರಿ ಮಾದರಿ — Print / PDF</button>
    <button class="gv-b" onclick="STK_SCOPE='general';stkExcel('${isIn?'stock':'issue'}')">Excel</button></div>`;
  let table;
  if(isIn){
    const rec=data.receive.filter(r=>!mon||String(r.date).slice(0,7)===mon).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    let tot=0;
    const rows=rec.map(r=>{ const a=Number(r.amount!=null?r.amount:(Number(r.qty||0)*Number(r.rate||0))); tot+=a;
      return `<tr><td style="${c}text-align:center;">${dd(r.date)}</td><td style="${c}">${esc(r.supplier||'')}</td><td style="${c}">${esc([r.bill||'',r.billDate?dd(r.billDate):''].filter(Boolean).join(' / '))}</td><td style="${c}">${esc(r.itemName)}</td><td style="${c}text-align:right;">${r.rate||0}</td><td style="${c}text-align:right;">${r.qty}</td><td style="${c}text-align:right;">${a}</td><td style="${c}text-align:center;"><button class="gv-b" onclick="stkDelReceive('general','${r.id}')">ಅಳಿಸಿ</button></td></tr>`; }).join('')
      ||`<tr><td colspan="8" style="${c}text-align:center;color:#777;padding:14px;">ಈ ತಿಂಗಳು ದಾಖಲೆ ಇಲ್ಲ. ಕೆಳಗಿನ ಸಾಲಿನಲ್ಲಿ ನಮೂದಿಸಿ.</td></tr>`;
    table=`<table style="width:100%;border-collapse:collapse;table-layout:fixed;min-width:760px;">
      <colgroup>${[11,18,16,24,8,8,10,9].map(w=>`<col style="width:${w}%">`).join('')}</colgroup>
      <thead><tr><th colspan="8" style="${h}font-size:13px;">ಸ್ವೀಕೃತಿ</th></tr>
      <tr>${['ದಿನಾಂಕ','ಪೂರೈಕೆದಾರರ ಹೆಸರು','ಬಿಲ್ ಸಂಖ್ಯೆ / ದಿನಾಂಕ','ಸಾಮಗ್ರಿಗಳ ವಿವರ','ದರ','ಪರಿಮಾಣ','ಬಿಲ್ ಮೊತ್ತ',''].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr>
      <tr>${[1,2,3,4,5,6,7,''].map(x=>`<td style="${nm}">${x}</td>`).join('')}</tr></thead>
      <tbody>${rows}
      <tr><td colspan="6" style="${c}text-align:right;font-weight:700;">ಒಟ್ಟು</td><td style="${c}text-align:right;font-weight:700;">${Math.round(tot*100)/100}</td><td style="${c}"></td></tr>
      <tr style="background:#fffbe6;">
        <td style="${c}"><input type="date" id="stk_recv_date" value="${todayStr()}" style="${inp}"></td>
        <td style="${c}"><input id="stk_recv_supplier" style="${inp}" placeholder="ಪೂರೈಕೆದಾರ"></td>
        <td style="${c}"><input id="stk_recv_bill" style="${inp}" placeholder="ಬಿಲ್ ಸಂ."><input type="date" id="stk_recv_billdate" value="${todayStr()}" style="${inp}margin-top:3px;"></td>
        <td style="${c}"><input id="stk_recv_item" list="stk_items_dl" style="${inp}" placeholder="ಸಾಮಗ್ರಿ ವಿವರ"><datalist id="stk_items_dl">${used.map(i=>`<option value="${esc(i)}">`).join('')}</datalist></td>
        <td style="${c}"><input type="number" step="0.01" id="stk_recv_rate" value="0" oninput="stkAmt()" style="${inp}"></td>
        <td style="${c}"><input type="number" id="stk_recv_qty" value="1" oninput="stkAmt()" style="${inp}"></td>
        <td style="${c}"><input id="stk_recv_amt" value="0" readonly style="${inp}background:#eee;"></td>
        <td style="${c}text-align:center;"><button class="gv-b pri" onclick="stockReceive('general')">ಸೇರಿಸಿ</button></td></tr>
      </tbody></table>`;
  } else {
    // group whole-class issues (same batchId) into one line
    const groups=[], byB={};
    data.issue.filter(i=>(!mon||String(i.date).slice(0,7)===mon)&&i.status!=='Rejected'&&i.status!=='Cancelled').slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(i=>{
      if(i.batchId){ let g=byB[i.batchId]; if(!g){ g=byB[i.batchId]={ids:[],date:i.date,itemName:i.itemName,qty:0,count:0,className:i.className,status:i.status,batch:true}; groups.push(g); } g.ids.push(i.id); g.qty+=Number(i.qty||0); g.count++; }
      else groups.push({ids:[i.id],date:i.date,itemName:i.itemName,qty:Number(i.qty||0),recipient:i.recipient,desig:stkDesig(i),status:i.status,acceptedBy:i.acceptedBy,acceptedAt:i.acceptedAt});
    });
    const sign=g=>g.status==='Accepted'?esc(g.acceptedBy||'')+'<br><span style="font-size:10.5px;">ಇ-ಸಹಿ '+dd(g.acceptedAt)+'</span>':g.status==='Issued'?'<span style="color:#8a5a00;font-size:11.5px;">ಸ್ವೀಕಾರ ಬಾಕಿ</span>':'';
    const rows=groups.map(g=>`<tr><td style="${c}text-align:center;">${dd(g.date)}</td><td style="${c}">${esc(g.itemName)}</td><td style="${c}text-align:right;">${g.qty}</td>
      <td style="${c}">${g.batch?esc((g.className||'')+'ನೇ ತರಗತಿ — ಇಡೀ ತರಗತಿ ('+g.count+' ವಿದ್ಯಾರ್ಥಿಗಳು)'):esc(g.recipient)+(g.desig?'<div style="font-size:11px;color:#555;">'+esc(g.desig)+'</div>':'')}</td>
      <td style="${c}text-align:center;">${sign(g)}</td><td style="${c}text-align:center;"><button class="gv-b" onclick="stkCancelMany('general','${g.ids.join(',')}')">ರದ್ದು</button></td></tr>`).join('')
      ||`<tr><td colspan="6" style="${c}text-align:center;color:#777;padding:14px;">ಈ ತಿಂಗಳು ವಿತರಣೆ ಇಲ್ಲ. ಕೆಳಗಿನ ಸಾಲಿನಲ್ಲಿ ನಮೂದಿಸಿ.</td></tr>`;
    const itemSel=used.length?`<select id="stk_issue_item" style="${inp}">${used.map(i=>`<option value="${esc(i)}">${esc(i)} — ಉಳಿಕೆ ${bal[i]||0}</option>`).join('')}</select>`:`<input id="stk_issue_item" style="${inp}" placeholder="ಮೊದಲು ಸ್ವೀಕೃತಿ ವಹಿಯಲ್ಲಿ ದಾಸ್ತಾನು ಸೇರಿಸಿ">`;
    table=`<table style="width:100%;border-collapse:collapse;table-layout:fixed;min-width:820px;">
      <colgroup>${[12,24,9,31,16,8].map(w=>`<col style="width:${w}%">`).join('')}</colgroup>
      <thead><tr><th colspan="6" style="${h}font-size:13px;">ವಿತರಣೆ</th></tr>
      <tr>${['ದಿನಾಂಕ','ಸಾಮಗ್ರಿಗಳ ವಿವರ','ಪರಿಮಾಣ','ಸಾಮಗ್ರಿಗಳನ್ನು ಯಾರಿಗೆ ವಿತರಿಸಿದೆ — ಹೆಸರು / ಹುದ್ದೆ','ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ',''].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr>
      <tr>${[8,9,10,11,12,''].map(x=>`<td style="${nm}">${x}</td>`).join('')}</tr></thead>
      <tbody>${rows}
      <tr style="background:#fffbe6;">
        <td style="${c}"><input type="date" id="stk_issue_date" value="${todayStr()}" style="${inp}"></td>
        <td style="${c}">${itemSel}</td>
        <td style="${c}"><input type="number" id="stk_issue_qty" value="1" style="${inp}"></td>
        <td style="${c}"><select id="stk_issue_type" onchange="stkTypeChanged()" style="${inp}"><option value="staff">ಸಿಬ್ಬಂದಿ</option><option value="student">ವಿದ್ಯಾರ್ಥಿ</option><option value="other">ಇತರೆ</option></select>
          <div id="stk_wrap_staff"><select id="stk_issue_staff" style="${inp}margin-top:3px;"><option value="">— ಸಿಬ್ಬಂದಿ ಆರಿಸಿ —</option>${staffOpts}</select></div>
          <div id="stk_wrap_class" style="display:none;"><select id="stk_issue_class" onchange="stkClassChanged()" style="${inp}margin-top:3px;"><option value="">ತರಗತಿ</option>${CLASSES.map(x=>`<option>${x}</option>`).join('')}</select></div>
          <div id="stk_wrap_student" style="display:none;"><select id="stk_issue_student" style="${inp}margin-top:3px;"><option value="">— ವಿದ್ಯಾರ್ಥಿ —</option></select></div>
          <div id="stk_wrap_other" style="display:none;"><input id="stk_issue_other" placeholder="ಹೆಸರು" style="${inp}margin-top:3px;"></div></td>
        <td style="${c}text-align:center;font-size:11px;color:#666;">ಸ್ವೀಕರಿಸಿದಾಗ ತಾನಾಗಿ ಬರುತ್ತದೆ</td>
        <td style="${c}text-align:center;"><button class="gv-b pri" onclick="stockIssue('general')">ಸೇರಿಸಿ</button></td></tr>
      </tbody></table><span id="stk_issue_help" style="display:none;"></span>`;
  }
  const balRows=used.length?used.map(i=>{ const r=data.receive.filter(x=>x.itemName===i).reduce((a,x)=>a+Number(x.qty||0),0); return `<tr><td style="${c}">${esc(i)}</td><td style="${c}text-align:right;">${r}</td><td style="${c}text-align:right;">${r-(bal[i]||0)}</td><td style="${c}text-align:right;font-weight:700;">${bal[i]||0}</td></tr>`; }).join(''):`<tr><td colspan="4" style="${c}text-align:center;color:#777;">ದಾಸ್ತಾನು ಇಲ್ಲ</td></tr>`;
  document.getElementById('stockTabBody').innerHTML=`
    <div class="panel"><h3>ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು ವಹಿ — ${isIn?'ಸ್ವೀಕೃತಿ':'ವಿತರಣೆ'}</h3>${monthBar}<div style="overflow-x:auto;">${table}</div></div>
    <div class="panel"><h3>ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು — ಉಳಿಕೆ</h3><table style="width:100%;border-collapse:collapse;"><thead><tr>${['ಸಾಮಗ್ರಿ','ಪಡೆದ ಒಟ್ಟು','ವಿತರಿಸಿದ ಒಟ್ಟು','ಉಳಿಕೆ'].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr></thead><tbody>${balRows}</tbody></table></div>`;
  stkTypeChanged();
}
function stkCancelMany(catKey,idsCsv){
  const ids=idsCsv.split(','), arr=DB.stock[catKey].issue, items=arr.filter(i=>ids.includes(i.id));
  if(!items.length) return;
  if(items.some(i=>stkLocked(i.date,catKey))){ showToast('⚠ ಅನುಮೋದಿತ ತಿಂಗಳ ದಾಖಲೆ — ಬದಲಿಸಲಾಗದು'); return; }
  const f=items[0];
  if(!confirm('ಈ ವಿತರಣೆಯನ್ನು ರದ್ದು/ಅಳಿಸುವುದೇ? (ಸ್ಟಾಕ್‌ಗೆ ಹಿಂತಿರುಗುತ್ತದೆ)\n'+f.itemName+(items.length>1?' — '+items.length+' ವಿದ್ಯಾರ್ಥಿಗಳು':' × '+f.qty+' — '+f.recipient))) return;
  items.forEach(i=>{ if(i.status==='Issued'&&i.recipient) pushNotification(i.recipient,`📦 ಸಾಮಗ್ರಿ ವಿತರಣೆ ರದ್ದು: ${i.itemName} × ${i.qty}`); });
  DB.stock[catKey].issue=arr.filter(i=>!ids.includes(i.id));
  saveDB(); showToast('ರದ್ದು ಮಾಡಲಾಗಿದೆ'); renderStockTabBody();
}
function stkAmt(){ const q=Number(document.getElementById('stk_recv_qty').value||0), r=Number(document.getElementById('stk_recv_rate').value||0); const a=document.getElementById('stk_recv_amt'); if(a) a.value=(Math.round(q*r*100)/100); }
function stkTypeChanged(){
  const t=(document.getElementById('stk_issue_type')||{}).value||'staff';
  const show=(id,on)=>{ const e=document.getElementById(id); if(e) e.style.display=on?'':'none'; };
  show('stk_wrap_staff',t==='staff'); show('stk_wrap_class',t==='student'); show('stk_wrap_student',t==='student'); show('stk_wrap_other',t==='other');
  const h=document.getElementById('stk_issue_help');
  if(h) h.textContent = t==='staff' ? 'ಸಿಬ್ಬಂದಿಗೆ ವಿತರಿಸಿದರೆ ಅವರ ಲಾಗಿನ್‌ಗೆ ಸೂಚನೆ ಹೋಗುತ್ತದೆ. ಅವರು "ಸ್ವೀಕರಿಸಿ (Accept)" ಒತ್ತಿದ ಮೇಲೆ ಆ ವಿತರಣೆ ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ ಮತ್ತು ಮುದ್ರಣ ವಹಿಯಲ್ಲಿ ಸೇರುತ್ತದೆ.'
    : t==='student' ? 'ತರಗತಿ ಆರಿಸಿ → ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಯಿಂದ ಆರಿಸಿ. "★ ಇಡೀ ತರಗತಿ" ಆರಿಸಿದರೆ ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಒಮ್ಮೆಲೇ ದಾಖಲಾಗುತ್ತದೆ. ವಿದ್ಯಾರ್ಥಿ ವಿತರಣೆ ತಕ್ಷಣ ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ.'
    : 'ಹೊರಗಿನವರಿಗೆ ವಿತರಣೆ ತಕ್ಷಣ ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ.';
}

function stockReceive(catKey){
  const g=id=>document.getElementById(id).value;
  const date=g('stk_recv_date'), supplier=g('stk_recv_supplier').trim(), bill=g('stk_recv_bill').trim(), billDate=g('stk_recv_billdate');
  const itemName=g('stk_recv_item').trim(), qty=Number(g('stk_recv_qty')||0), rate=Number(g('stk_recv_rate')||0);
  if(!itemName||qty<=0){ showToast('⚠ ಸಾಮಗ್ರಿ ಮತ್ತು ಪ್ರಮಾಣ ಅಗತ್ಯ'); return; }
  if(stkLocked(date,catKey)){ showToast('⚠ ಈ ಅವಧಿಯ ವಹಿ ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ್ದಾರೆ — ಬದಲಿಸಲಾಗದು'); return; }
  DB.stock[catKey].receive.push({id:uid(), date, supplier, bill, billDate, itemName, qty, rate, amount:Math.round(qty*rate*100)/100, createdAt:todayStr(), createdBy:CURRENT_USER.name});
  saveDB(); showToast('✅ ದಾಸ್ತಾನು ಸೇರಿಸಲಾಗಿದೆ'); renderStockTabBody();
}
function stkDelReceive(catKey,id){
  const r=DB.stock[catKey].receive.find(x=>x.id===id); if(!r) return;
  if(stkLocked(r.date,catKey)){ showToast('⚠ ಅನುಮೋದಿತ ತಿಂಗಳ ದಾಖಲೆ — ಅಳಿಸಲಾಗದು'); return; }
  if(!confirm('ಈ ದಾಸ್ತಾನು ದಾಖಲೆ ಅಳಿಸುವುದೇ?\n'+r.itemName+' × '+r.qty)) return;
  DB.stock[catKey].receive=DB.stock[catKey].receive.filter(x=>x.id!==id); saveDB(); showToast('🗑 ಅಳಿಸಲಾಗಿದೆ'); renderStockTabBody();
}
function stkClassChanged(){
  const cls=document.getElementById('stk_issue_class').value, sel=document.getElementById('stk_issue_student');
  if(sel){
    const list=(DB.students||[]).filter(s=>cls&&String(s.className)===String(cls)).sort((a,b)=>String(a.studentName).localeCompare(String(b.studentName)));
    sel.innerHTML=!cls?'<option value="">— ಮೊದಲು ತರಗತಿ ಆರಿಸಿ —</option>'
      :'<option value="">— ವಿದ್ಯಾರ್ಥಿ ಆರಿಸಿ ('+list.length+') —</option>'+(list.length?'<option value="__ALL__">★ ಇಡೀ ತರಗತಿ ('+list.length+' ವಿದ್ಯಾರ್ಥಿಗಳು)</option>':'')+list.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.studentName)+(s.satsNo?' — '+esc(s.satsNo):'')+'</option>').join('');
  }
  if(STOCK_TAB==='stationery') autoFillEntitlement();
}
function autoFillEntitlement(){
  const t=(document.getElementById('stk_issue_type')||{}).value; if(t!=='student') return;
  const cls=document.getElementById('stk_issue_class').value, item=document.getElementById('stk_issue_item').value;
  if(!cls||!item) return; const ent=CLASS_ENTITLEMENT[item]; if(!ent||ent[cls]===undefined) return;
  document.getElementById('stk_issue_qty').value=ent[cls];
}
function stockIssue(catKey){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const type=g('stk_issue_type')||'staff', date=g('stk_issue_date'), itemName=g('stk_issue_item').trim(), qty=Number(g('stk_issue_qty')||0);
  if(!itemName||qty<=0){ showToast('⚠ ಸಾಮಗ್ರಿ ಮತ್ತು ಪ್ರಮಾಣ ಅಗತ್ಯ'); return; }
  if(stkLocked(date,catKey)){ showToast('⚠ ಈ ಅವಧಿಯ ವಹಿ ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ್ದಾರೆ — ಬದಲಿಸಲಾಗದು'); return; }
  const base={date,itemName,qty,createdAt:todayStr(),createdBy:CURRENT_USER.name};
  const bal=stockBalances(catKey)[itemName]||0;
  const need=(type==='student'&&g('stk_issue_student')==='__ALL__')?qty*(DB.students||[]).filter(s=>String(s.className)===String(g('stk_issue_class'))).length:qty;
  if(need>bal && !confirm(`⚠ ಸ್ಟಾಕ್ ಬ್ಯಾಲೆನ್ಸ್ (${bal}) ಗಿಂತ ಹೆಚ್ಚು (${need}) ಕೇಳಲಾಗಿದೆ. ಮುಂದುವರಿಸುವುದೇ?`)) return;
  const arr=DB.stock[catKey].issue;
  if(type==='staff'){
    const st=STAFF.find(s=>s.hrmsId===g('stk_issue_staff')); if(!st){ showToast('⚠ ಸಿಬ್ಬಂದಿ ಆರಿಸಿ'); return; }
    arr.push(Object.assign({id:uid(),recipient:st.name,hrmsId:st.hrmsId,designation:st.desig||'',recipientType:'staff',status:'Issued'},base));
    pushNotification(st.name,`📦 ಸಾಮಗ್ರಿ ವಿತರಣೆ: ${itemName} × ${qty} (${stkCatLabel(catKey)}) — "ನನಗೆ ವಿತರಿಸಿದ ಸಾಮಗ್ರಿ" ನಲ್ಲಿ ಸ್ವೀಕರಿಸಿ (Accept) ಮಾಡಿ`);
    showToast('✅ '+st.name+' ಅವರ ಲಾಗಿನ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ — ಸ್ವೀಕಾರ ಬಾಕಿ');
  } else if(type==='student'){
    const cls=g('stk_issue_class'), pick=g('stk_issue_student');
    if(!cls||!pick){ showToast('⚠ ತರಗತಿ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿ ಆರಿಸಿ'); return; }
    const list=pick==='__ALL__'?(DB.students||[]).filter(s=>String(s.className)===String(cls)):[(DB.students||[]).find(s=>s.id===pick)].filter(Boolean);
    if(!list.length){ showToast('⚠ ವಿದ್ಯಾರ್ಥಿ ಕಂಡುಬಂದಿಲ್ಲ'); return; }
    const batchId='b'+uid();
    list.forEach(s=>arr.push(Object.assign({id:uid(),batchId,recipient:s.studentName,studentId:s.id,className:cls,designation:'ವಿದ್ಯಾರ್ಥಿ — '+cls+'ನೇ ತರಗತಿ',recipientType:'student',status:'Closed'},base)));
    showToast('✅ '+list.length+' ವಿದ್ಯಾರ್ಥಿ(ಗಳ) ವಿತರಣೆ ದಾಖಲಾಗಿದೆ');
  } else {
    const nm=g('stk_issue_other').trim(); if(!nm){ showToast('⚠ ಹೆಸರು ಬರೆಯಿರಿ'); return; }
    arr.push(Object.assign({id:uid(),recipient:nm,designation:'',recipientType:'other',status:'Closed'},base));
    showToast('✅ ವಿತರಣೆ ದಾಖಲಾಗಿದೆ');
  }
  saveDB(); renderStockTabBody();
}
function stkCancelIssue(catKey,id){
  const i=DB.stock[catKey].issue.find(x=>x.id===id); if(!i) return;
  if(stkLocked(i.date,catKey)){ showToast('⚠ ಅನುಮೋದಿತ ಅವಧಿಯ ದಾಖಲೆ — ಬದಲಿಸಲಾಗದು'); return; }
  if(!confirm('ಈ ವಿತರಣಾ ದಾಖಲೆಯನ್ನು ರದ್ದು/ಅಳಿಸುವುದೇ? (ಸ್ಟಾಕ್‌ಗೆ ಹಿಂತಿರುಗುತ್ತದೆ)\n'+i.itemName+' × '+i.qty+' — '+i.recipient)) return;
  if(i.status==='Issued'){ i.status='Cancelled'; if(i.recipient) pushNotification(i.recipient,`📦 ಸಾಮಗ್ರಿ ವಿತರಣೆ ರದ್ದು: ${i.itemName} × ${i.qty}`); }
  else DB.stock[catKey].issue=DB.stock[catKey].issue.filter(x=>x.id!==id);
  saveDB(); showToast('ರದ್ದು ಮಾಡಲಾಗಿದೆ'); renderStockTabBody();
}

/* ------------------------------------------------------------------ staff / warden / principal: accept what was issued to me */
function stkMyIssues(){
  const out=[]; stkEnsure();
  STOCK_CATS.forEach(c=>DB.stock[c.key].issue.forEach(i=>{
    if(i.recipientType==='staff'&&(i.hrmsId===CURRENT_USER.hrmsId||(!i.hrmsId&&i.recipient===CURRENT_USER.name))) out.push(Object.assign({cat:c.key},i));
  }));
  return out.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function renderStockAccept(){
  const mine=stkMyIssues(), pend=mine.filter(i=>i.status==='Issued');
  const badge=s=>({'Issued':'<span class="badge badge-progress">⏳ ಸ್ವೀಕಾರ ಬಾಕಿ</span>','Accepted':'<span class="badge badge-ok">✅ ಸ್ವೀಕರಿಸಿದ್ದೀರಿ</span>','Rejected':'<span class="badge badge-bad">❌ ತಿರಸ್ಕರಿಸಿದ್ದೀರಿ</span>','Cancelled':'<span class="badge badge-draft">ರದ್ದು</span>'})[s]||esc(s);
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📦 ನನಗೆ ವಿತರಿಸಿದ ಸಾಮಗ್ರಿ</h2><div class="desc">FDA ನಿಮಗೆ ವಿತರಿಸಿದ ಸಾಮಗ್ರಿಗಳು — ಪಡೆದ ಮೇಲೆ "ಸ್ವೀಕರಿಸಿ (Accept)" ಒತ್ತಿ. ಆಗ ವಿತರಣೆ ಮುಚ್ಚಲ್ಪಡುತ್ತದೆ.</div></div>
    <div class="cards-grid"><div class="stat-card"><div class="n">${pend.length}</div><div class="l">⏳ ಸ್ವೀಕಾರ ಬಾಕಿ</div></div><div class="stat-card"><div class="n">${mine.filter(i=>i.status==='Accepted').length}</div><div class="l">✅ ಸ್ವೀಕರಿಸಿದ್ದು</div></div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>ವಿಭಾಗ</th><th>ಸಾಮಗ್ರಿ</th><th>ಪ್ರಮಾಣ</th><th>ವಿತರಿಸಿದವರು</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead>
    <tbody>${mine.length?mine.map(i=>`<tr><td>${stkDisp(i.date)}</td><td>${esc(stkCatLabel(i.cat))}</td><td><b>${esc(i.itemName)}</b></td><td>${i.qty}</td><td>${esc(i.createdBy||'FDA')}</td><td>${badge(i.status)}${i.acceptedAt?'<br><span class="small-muted">'+stkDisp(i.acceptedAt)+'</span>':''}</td>
      <td class="actions-cell">${i.status==='Issued'?`<button class="btn btn-sm btn-green" onclick="stkAccept('${i.cat}','${i.id}',true)">✅ ಸ್ವೀಕರಿಸಿ (Accept)</button> <button class="btn btn-sm btn-red" onclick="stkAccept('${i.cat}','${i.id}',false)">❌ ತಿರಸ್ಕರಿಸಿ</button>`:''}</td></tr>`).join(''):'<tr class="empty-row"><td colspan="7">ನಿಮಗೆ ಯಾವುದೇ ಸಾಮಗ್ರಿ ವಿತರಿಸಿಲ್ಲ.</td></tr>'}</tbody></table></div></div>`;
}
function stkAccept(catKey,id,ok){
  const i=DB.stock[catKey].issue.find(x=>x.id===id); if(!i||i.status!=='Issued') return;
  if(ok){
    if(!confirm(i.itemName+' × '+i.qty+' ಪಡೆದಿದ್ದೇನೆ — ಸ್ವೀಕರಿಸುವುದೇ?')) return;
    i.status='Accepted'; i.acceptedAt=todayStr(); i.acceptedBy=CURRENT_USER.name;
  } else {
    const why=prompt('ತಿರಸ್ಕರಿಸಲು ಕಾರಣ:'); if(why===null) return;
    i.status='Rejected'; i.rejectReason=(why||'').trim(); i.rejectedAt=todayStr();
  }
  STAFF.filter(s=>s.role==='fda').forEach(f=>pushNotification(f.name,`📦 ಸಾಮಗ್ರಿ ವಿತರಣೆ ${ok?'ಸ್ವೀಕರಿಸಲಾಗಿದೆ ✅':'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ ❌'}: ${i.itemName} × ${i.qty} — ${CURRENT_USER.name}`));
  logAudit&&logAudit(ok?'Accept':'Reject','StockIssue',i.id,i.itemName+' × '+i.qty+' — '+CURRENT_USER.name);
  saveDB(); showToast(ok?'✅ ಸ್ವೀಕರಿಸಲಾಗಿದೆ — ವಿತರಣೆ ಮುಚ್ಚಲಾಗಿದೆ':'❌ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'); renderStockAccept();
}

/* ------------------------------------------------------------------ monthly send / principal */
function stkRenderSendPanel(){
  const el=document.getElementById('stockSendPanel'); if(!el) return;
  const first=todayStr().slice(0,8)+'01';
  const mine=(DB.stockMonthly||[]).slice().sort((a,b)=>String(b.sentAt||'').localeCompare(String(a.sentAt||''))).slice(0,8);
  const st=r=>r.status==='Approved'?'<span class="gv-st ok">ಅನುಮೋದಿತ</span>':r.status==='Returned'?'<span class="gv-st draft">ಹಿಂತಿರುಗಿಸಿದೆ</span>':'<span class="gv-st pend">ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆ ಬಾಕಿ</span>';
  const cnt=r=>{ const g=stkRecRange(r), old=STK_RANGE; STK_RANGE=g; const a=stkStockRows('',g.scope).length, b=stkIssueRows('',g.scope,false).length; STK_RANGE=old; return a+' / '+b; };
  el.innerHTML=`<div class="panel"><h3>ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸಿ (ಬೇಕಾದಾಗ)</h3>
    <div class="note" style="font-size:12px;">ಯಾವುದೇ ದಿನಾಂಕದಿಂದ ಯಾವುದೇ ದಿನಾಂಕದವರೆಗಿನ ವಹಿಯನ್ನು, ಬೇಕಾದಾಗ ಕಳುಹಿಸಬಹುದು. ಪ್ರಾಂಶುಪಾಲರು ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ವಿವರವಾಗಿ ನೋಡಿ ಅನುಮೋದಿಸುತ್ತಾರೆ. ಅನುಮೋದನೆಯ ನಂತರ ಆ ಅವಧಿಯ ದಾಖಲೆ ಬದಲಿಸಲಾಗುವುದಿಲ್ಲ.</div>
    <div class="form-grid" style="margin-top:8px;">
      <div class="field"><label>ದಿನಾಂಕದಿಂದ</label><input type="date" id="stkq_from" value="${first}"></div>
      <div class="field"><label>ದಿನಾಂಕದವರೆಗೆ</label><input type="date" id="stkq_to" value="${todayStr()}"></div>
      <div class="field"><label>ವಿಭಾಗ</label><select id="stkq_scope"><option value="all">ಎಲ್ಲಾ ವಿಭಾಗಗಳು (ಸಾಮಾನ್ಯ ದಾಸ್ತಾನು ಸೇರಿ)</option>${STOCK_CATS.map(c=>`<option value="${c.key}">${esc(c.label)} ಮಾತ್ರ</option>`).join('')}</select></div>
    </div>
    <div class="form-actions"><button class="gv-b pri" onclick="stkSendRange()">ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಿ</button></div>
    ${mine.length?`<table class="gov-table" style="margin-top:10px;"><thead><tr><th>ಅವಧಿ</th><th>ದಾಸ್ತಾನು / ವಿತರಣೆ ಎಂಟ್ರಿ</th><th>ಕಳುಹಿಸಿದ ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ಕ್ರಮ</th></tr></thead><tbody>
      ${mine.map(r=>`<tr><td>${esc(stkRecLabel(r))}</td><td class="c">${cnt(r)}</td><td class="c">${stkDisp(r.sentAt)}</td><td class="c">${st(r)}${r.remarks?'<div style="font-size:11px;color:var(--red);">'+esc(r.remarks)+'</div>':''}</td>
        <td class="c">${r.status==='Sent to Principal'?`<button class="gv-b" onclick="stkRecallReq('${r.id}')">ವಾಪಸ್ ಪಡೆಯಿರಿ</button>`:r.status==='Returned'?`<button class="gv-b pri" onclick="stkResendReq('${r.id}')">ಮತ್ತೆ ಕಳುಹಿಸಿ</button>`:''}</td></tr>`).join('')}</tbody></table>`:''}
  </div>`;
}
function stkSendRange(){
  const from=document.getElementById('stkq_from').value, to=document.getElementById('stkq_to').value, scope=document.getElementById('stkq_scope').value;
  if(!from||!to||from>to){ showToast('⚠ ಸರಿಯಾದ ದಿನಾಂಕ ಶ್ರೇಣಿ ಆರಿಸಿ'); return; }
  const old=STK_RANGE; STK_RANGE={from,to}; const r1=stkStockRows('',scope).length, r2=stkIssueRows('',scope,false).length, pend=stkIssueRows('',scope,false).filter(i=>i.status==='Issued').length; STK_RANGE=old;
  if(!r1&&!r2){ showToast('⚠ ಈ ಅವಧಿಯಲ್ಲಿ ಯಾವುದೇ ದಾಖಲೆ ಇಲ್ಲ'); return; }
  if((DB.stockMonthly||[]).some(x=>x.status==='Sent to Principal'&&x.from===from&&x.to===to&&(x.scope||'all')===scope)){ showToast('⚠ ಇದೇ ಅವಧಿ ಈಗಾಗಲೇ ಕಳುಹಿಸಲಾಗಿದೆ'); return; }
  if(!confirm(fmtDate(from)+' → '+fmtDate(to)+' ವಹಿಯನ್ನು (ದಾಸ್ತಾನು '+r1+', ವಿತರಣೆ '+r2+') ಪ್ರಾಂಶುಪಾಲರ ಅನುಮೋದನೆಗೆ ಕಳುಹಿಸುವುದೇ?'+(pend?'\n⚠ '+pend+' ವಿತರಣೆ ಇನ್ನೂ ಸಿಬ್ಬಂದಿ ಸ್ವೀಕರಿಸಿಲ್ಲ.':''))) return;
  const rec={id:uid(),kind:'range',from,to,scope,status:'Sent to Principal',sentAt:todayStr(),sentBy:CURRENT_USER.name,remarks:''};
  DB.stockMonthly.push(rec);
  STAFF.filter(s=>s.role==='principal').forEach(p=>pushNotification(p.name,`📦 ಸಾಮಗ್ರಿ ವಹಿ ಅನುಮೋದನೆಗೆ: ${stkRecLabel(rec)} (FDA — ${CURRENT_USER.name})`));
  saveDB(); showToast('ಪ್ರಾಂಶುಪಾಲರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ'); stkRenderSendPanel();
}
function stkRecallReq(id){ const r=(DB.stockMonthly||[]).find(x=>x.id===id); if(!r||r.status!=='Sent to Principal') return; if(!confirm('ಕಳುಹಿಸಿದ್ದನ್ನು ವಾಪಸ್ ಪಡೆಯುವುದೇ?')) return; DB.stockMonthly=DB.stockMonthly.filter(x=>x.id!==id); saveDB(); stkRenderSendPanel(); }
function stkResendReq(id){ const r=(DB.stockMonthly||[]).find(x=>x.id===id); if(!r) return; r.status='Sent to Principal'; r.sentAt=todayStr(); r.remarks=''; STAFF.filter(s=>s.role==='principal').forEach(p=>pushNotification(p.name,`📦 ಸಾಮಗ್ರಿ ವಹಿ ಮತ್ತೆ ಅನುಮೋದನೆಗೆ: ${stkRecLabel(r)}`)); saveDB(); showToast('ಮತ್ತೆ ಕಳುಹಿಸಲಾಗಿದೆ'); stkRenderSendPanel(); }

function renderStockPrincipal(){
  const list=(DB.stockMonthly||[]).slice().sort((a,b)=>String(b.sentAt||b.month||'').localeCompare(String(a.sentAt||a.month||'')));
  const tot=r=>{ const g=stkRecRange(r), old=STK_RANGE; STK_RANGE=g; const rows=stkStockRows('',g.scope); STK_RANGE=old; return {n:rows.length,amt:rows.reduce((a,x)=>a+Number(x.amount!=null?x.amount:(Number(x.qty||0)*Number(x.rate||0))),0)}; };
  const iss=r=>{ const g=stkRecRange(r), old=STK_RANGE; STK_RANGE=g; const n=stkIssueRows('',g.scope,false).length; STK_RANGE=old; return n; };
  const st=r=>r.status==='Approved'?'<span class="gv-st ok">ಅನುಮೋದಿತ</span>':r.status==='Returned'?'<span class="gv-st draft">ಹಿಂತಿರುಗಿಸಿದೆ</span>':'<span class="gv-st pend">ಅನುಮೋದನೆ ಬಾಕಿ</span>';
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>ಸಾಮಗ್ರಿ ದಾಸ್ತಾನು ಮತ್ತು ವಿತರಣಾ ವಹಿ — ಅನುಮೋದನೆ</h2><div class="desc">FDA ಕಳುಹಿಸಿದ ವಹಿಯ ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು "ವಿವರ ನೋಡಿ" ಒತ್ತಿ ಪರಿಶೀಲಿಸಿ, ನಂತರ ಅನುಮೋದಿಸಿ ಅಥವಾ ಹಿಂತಿರುಗಿಸಿ.</div></div>
    <div class="panel"><table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಅವಧಿ</th><th>ದಾಸ್ತಾನು ಎಂಟ್ರಿ</th><th>ಬಿಲ್ ಮೊತ್ತ (₹)</th><th>ವಿತರಣೆ ಎಂಟ್ರಿ</th><th>ಕಳುಹಿಸಿದ ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ಕ್ರಮ</th></tr></thead><tbody>
    ${list.length?list.map((m,i)=>{ const t=tot(m); return `<tr><td class="c">${i+1}</td><td>${esc(stkRecLabel(m))}</td><td class="c">${t.n}</td><td style="text-align:right;">${Math.round(t.amt*100)/100}</td><td class="c">${iss(m)}</td><td class="c">${stkDisp(m.sentAt)}</td>
      <td class="c">${st(m)}${m.remarks?'<div style="font-size:11px;">'+esc(m.remarks)+'</div>':''}</td>
      <td class="c" style="white-space:nowrap;"><button class="gv-b" onclick="stkViewReq('${m.id}')">ವಿವರ ನೋಡಿ</button>${m.status==='Sent to Principal'?`<button class="gv-b ok" onclick="stkDecideReq('${m.id}',true)">ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="stkDecideReq('${m.id}',false)">ಹಿಂತಿರುಗಿಸಿ</button>`:''}</td></tr>`; }).join(''):'<tr><td colspan="8" class="c" style="color:var(--muted);">FDA ಯಿಂದ ಯಾವುದೇ ವಹಿ ಬಂದಿಲ್ಲ.</td></tr>'}
    </tbody></table></div>
    <div id="stkPrincipalView"></div>`;
}
function stkViewReq(id){
  const r=(DB.stockMonthly||[]).find(x=>x.id===id), w=document.getElementById('stkPrincipalView'); if(!r||!w) return;
  const g=stkRecRange(r), old=STK_RANGE; STK_RANGE=g;
  const rec=stkStockRows('',g.scope), is=stkIssueRows('',g.scope,false);
  STK_RANGE=old;
  const dd=d=>{ const x=String(d||'').slice(0,10).split('-'); return x.length===3?x[2]+'-'+x[1]+'-'+x[0]:''; };
  const c='border:1px solid #9fb0c4;padding:4px 6px;font-size:12px;', h='border:1px solid #0b2340;background:var(--navy);color:#fff;padding:5px;font-size:12px;';
  let total=0;
  const rr=rec.map((x,n)=>{ const a=Number(x.amount!=null?x.amount:(Number(x.qty||0)*Number(x.rate||0))); total+=a; return `<tr><td style="${c}text-align:center;">${n+1}</td><td style="${c}">${esc(stkCatLabel(x.cat))}</td><td style="${c}text-align:center;">${dd(x.date)}</td><td style="${c}">${esc(x.supplier||'')}</td><td style="${c}">${esc([x.bill||'',x.billDate?dd(x.billDate):''].filter(Boolean).join(' / '))}</td><td style="${c}">${esc(x.itemName)}</td><td style="${c}text-align:right;">${x.rate||0}</td><td style="${c}text-align:right;">${x.qty}</td><td style="${c}text-align:right;">${a}</td></tr>`; }).join('');
  const groups=[], byB={};
  is.forEach(i=>{ if(i.batchId){ const k=i.cat+i.batchId; let q=byB[k]; if(!q){ q=byB[k]={cat:i.cat,date:i.date,itemName:i.itemName,qty:0,n:0,cls:i.className,status:i.status,batch:true}; groups.push(q); } q.qty+=Number(i.qty||0); q.n++; } else groups.push({cat:i.cat,date:i.date,itemName:i.itemName,qty:Number(i.qty||0),recipient:i.recipient,desig:stkDesig(i),status:i.status,by:i.acceptedBy,at:i.acceptedAt}); });
  const ss=q=>q.status==='Accepted'?'ಸ್ವೀಕರಿಸಿದ್ದಾರೆ ('+esc(q.by||'')+' '+dd(q.at)+')':q.status==='Issued'?'ಸ್ವೀಕಾರ ಬಾಕಿ':q.status==='Closed'||q.status==='Approved'?'ದಾಖಲಾಗಿದೆ':esc(q.status);
  const ir=groups.map((q,n)=>`<tr><td style="${c}text-align:center;">${n+1}</td><td style="${c}">${esc(stkCatLabel(q.cat))}</td><td style="${c}text-align:center;">${dd(q.date)}</td><td style="${c}">${esc(q.itemName)}</td><td style="${c}text-align:right;">${q.qty}</td><td style="${c}">${q.batch?esc((q.cls||'')+'ನೇ ತರಗತಿ — ಇಡೀ ತರಗತಿ ('+q.n+' ವಿದ್ಯಾರ್ಥಿಗಳು)'):esc(q.recipient)}</td><td style="${c}">${esc(q.batch?'ವಿದ್ಯಾರ್ಥಿಗಳು':q.desig||'')}</td><td style="${c}">${ss(q)}</td></tr>`).join('');
  // current balance per item
  const bal=[]; (g.scope==='all'?STOCK_CATS.map(x=>x.key):[g.scope]).forEach(k=>{ const b=stockBalances(k); Object.keys(b).forEach(i=>{ const rcv=DB.stock[k].receive.filter(x=>x.itemName===i).reduce((a,x)=>a+Number(x.qty||0),0); bal.push([stkCatLabel(k),i,rcv,rcv-b[i],b[i]]); }); });
  const pend=is.filter(i=>i.status==='Issued').length;
  w.innerHTML=`<div class="panel"><h3>ವಿವರ — ${esc(stkRecLabel(r))}</h3>
    <div class="cards-grid"><div class="stat-card"><div class="n">${rec.length}</div><div class="l">ದಾಸ್ತಾನು ಎಂಟ್ರಿ</div></div><div class="stat-card"><div class="n">${Math.round(total*100)/100}</div><div class="l">ಒಟ್ಟು ಬಿಲ್ ಮೊತ್ತ (₹)</div></div><div class="stat-card"><div class="n">${groups.length}</div><div class="l">ವಿತರಣೆ ಎಂಟ್ರಿ</div></div><div class="stat-card"><div class="n">${pend}</div><div class="l">ಸ್ವೀಕಾರ ಬಾಕಿ</div></div></div>
    <h4 style="margin:12px 0 6px;">ಸ್ವೀಕೃತಿ (ದಾಸ್ತಾನು)</h4>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${['ಕ್ರ.ಸಂ','ವಿಭಾಗ','ದಿನಾಂಕ','ಪೂರೈಕೆದಾರರ ಹೆಸರು','ಬಿಲ್ ಸಂಖ್ಯೆ / ದಿನಾಂಕ','ಸಾಮಗ್ರಿ','ದರ','ಪರಿಮಾಣ','ಬಿಲ್ ಮೊತ್ತ'].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr></thead><tbody>${rr||`<tr><td colspan="9" style="${c}text-align:center;color:#777;">ದಾಖಲೆ ಇಲ್ಲ</td></tr>`}${rr?`<tr><td colspan="8" style="${c}text-align:right;font-weight:700;">ಒಟ್ಟು</td><td style="${c}text-align:right;font-weight:700;">${Math.round(total*100)/100}</td></tr>`:''}</tbody></table></div>
    <h4 style="margin:14px 0 6px;">ವಿತರಣೆ</h4>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${['ಕ್ರ.ಸಂ','ವಿಭಾಗ','ದಿನಾಂಕ','ಸಾಮಗ್ರಿ','ಪರಿಮಾಣ','ಯಾರಿಗೆ ವಿತರಿಸಿದೆ','ಹುದ್ದೆ','ಸ್ವೀಕೃತಿ ಸ್ಥಿತಿ'].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr></thead><tbody>${ir||`<tr><td colspan="8" style="${c}text-align:center;color:#777;">ದಾಖಲೆ ಇಲ್ಲ</td></tr>`}</tbody></table></div>
    ${bal.length?`<h4 style="margin:14px 0 6px;">ಪ್ರಸ್ತುತ ಉಳಿಕೆ</h4><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${['ವಿಭಾಗ','ಸಾಮಗ್ರಿ','ಪಡೆದ ಒಟ್ಟು','ವಿತರಿಸಿದ ಒಟ್ಟು','ಉಳಿಕೆ'].map(x=>`<th style="${h}">${x}</th>`).join('')}</tr></thead><tbody>${bal.map(b=>`<tr>${b.map((x,i)=>`<td style="${c}${i>1?'text-align:right;':''}">${esc(String(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}
    <div class="form-actions" style="margin-top:12px;flex-wrap:wrap;">
      <button class="gv-b" onclick="stkReqPrint('${r.id}','stock')">ಸ್ವೀಕೃತಿ ವಹಿ — Print / PDF</button>
      <button class="gv-b" onclick="stkReqPrint('${r.id}','issue')">ವಿತರಣಾ ವಹಿ — Print / PDF</button>
      <button class="gv-b" onclick="stkReqPrint('${r.id}','book')">ಪೂರ್ಣ ವಹಿ — Print / PDF</button>
      ${r.status==='Sent to Principal'?`<button class="gv-b ok" onclick="stkDecideReq('${r.id}',true)">ಅನುಮೋದಿಸಿ</button><button class="gv-b" onclick="stkDecideReq('${r.id}',false)">ಹಿಂತಿರುಗಿಸಿ</button>`:''}
    </div></div>`;
  w.scrollIntoView({behavior:'smooth'});
}
function stkReqPrint(id,kind){
  const r=(DB.stockMonthly||[]).find(x=>x.id===id); if(!r) return;
  const g=stkRecRange(r); STK_RANGE=Object.assign({rec:r},g); STK_SCOPE=g.scope; STK_MONTH='';
  try{ if(kind==='book') stkPrintBook(); else stkPrint(kind); } finally { STK_RANGE=null; }
}
function stkDecideReq(id,ok){
  const r=(DB.stockMonthly||[]).find(x=>x.id===id); if(!r||r.status!=='Sent to Principal') return;
  let remarks='';
  if(ok){ if(!confirm(stkRecLabel(r)+' ವಹಿಯನ್ನು ಅನುಮೋದಿಸುವುದೇ? (ಅನುಮೋದನೆಯ ನಂತರ ಈ ಅವಧಿಯ ದಾಖಲೆ ಬದಲಿಸಲಾಗದು)')) return; r.status='Approved'; }
  else { remarks=prompt('ಹಿಂತಿರುಗಿಸಲು ಕಾರಣ:'); if(remarks===null) return; r.status='Returned'; }
  r.remarks=(remarks||'').trim(); r.decidedAt=todayStr(); r.decidedBy=CURRENT_USER.name;
  STAFF.filter(s=>s.role==='fda').forEach(f=>pushNotification(f.name,`📦 ಸಾಮಗ್ರಿ ವಹಿ ${ok?'ಅನುಮೋದಿಸಲಾಗಿದೆ ✅':'ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ ↩'}: ${stkRecLabel(r)}${r.remarks?' — '+r.remarks:''}`));
  saveDB(); showToast(ok?'ಅನುಮೋದಿಸಲಾಗಿದೆ':'ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ'); renderStockPrincipal();
}

/* ------------------------------------------------------------------ A4 print (PDF) */
function stkPrint(kind){
  /* Government register format (same as the school's printed ವಹಿ):
     stock  = ಸ್ವೀಕೃತಿ  : 1 ದಿನಾಂಕ | 2 ಪೂರೈಕೆದಾರರ ಹೆಸರು | 3 ಬಿಲ್ ಸಂಖ್ಯೆ/ದಿನಾಂಕ | 4 ಸಾಮಗ್ರಿಗಳ ವಿವರ | 5 ದರ | 6 ಪರಿಮಾಣ | 7 ಬಿಲ್ ಮೊತ್ತ
     issue  = ವಿತರಣೆ  : 8 ದಿನಾಂಕ | 9 ಸಾಮಗ್ರಿಗಳ ವಿವರ | 10 ಪರಿಮಾಣ | 11 ಯಾರಿಗೆ ವಿತರಿಸಿದೆ ಹೆಸರು/ಹುದ್ದೆ | 12 ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ */
  const month=STK_MONTH, scope=STK_SCOPE;
  const dd=d=>{ const x=String(d||'').slice(0,10).split('-'); return x.length===3?x[2]+'-'+x[1]+'-'+x[0]:''; };
  const isStock=kind==='stock';
  const yr=(()=>{ if(!month) return defaultAcademicYear(); const y=Number(month.slice(0,4)), m=Number(month.slice(5,7)); return m>=6?`${y}-${String(y+1).slice(2)}`:`${y-1}-${String(y).slice(2)}`; })();
  const td='border:1px solid #000;padding:3px 5px;height:27px;vertical-align:middle;white-space:pre-line;word-break:break-word;font-size:11px;';
  const th='border:1px solid #000;padding:5px 4px;text-align:center;font-weight:700;word-break:break-word;white-space:normal;font-size:11px;';
  const nm='border:1px solid #000;text-align:center;font-size:10px;padding:2px;';
  let cols, nums, body, n, extra='', total=0;
  if(isStock){
    cols=[['ದಿನಾಂಕ',12],['ಪೂರೈಕೆದಾರರ ಹೆಸರು',18],['ಬಿಲ್ ಸಂಖ್ಯೆ / ದಿನಾಂಕ',17],['ಸಾಮಗ್ರಿಗಳ ವಿವರ',24],['ದರ',8],['ಪರಿಮಾಣ',9],['ಬಿಲ್ ಮೊತ್ತ',12]]; nums=[1,2,3,4,5,6,7];
    const rows=stkStockRows(month,scope);
    body=rows.map(r=>{ const amt=Number(r.amount!=null?r.amount:(Number(r.qty||0)*Number(r.rate||0))); total+=amt;
      return [dd(r.date),r.supplier||'',[r.bill||'',r.billDate?dd(r.billDate):''].filter(Boolean).join(' / '),r.itemName,Number(r.rate||0),Number(r.qty||0),amt]; });
    n=body.length;
  } else {
    cols=[['ದಿನಾಂಕ',12],['ಸಾಮಗ್ರಿಗಳ ವಿವರ',26],['ಪರಿಮಾಣ',9],['ಸಾಮಗ್ರಿಗಳನ್ನು ಯಾರಿಗೆ ವಿತರಿಸಿದೆ ಹೆಸರು / ಹುದ್ದೆ',33],['ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ',20]]; nums=[8,9,10,11,12];
    const rows=stkIssueRows(month,scope,true);
    body=rows.map(r=>[dd(r.date),r.itemName,Number(r.qty||0),r.recipient+(stkDesig(r)?' — '+stkDesig(r):''),
      (r.status==='Accepted'&&r.acceptedBy)?(r.acceptedBy+'\nಇ-ಸಹಿ '+dd(r.acceptedAt)):'']);
    n=body.length;
    const skipped=stkIssueRows(month,scope,false).filter(i=>i.status==='Issued').length;
    if(skipped) extra=`<div class="no-print" style="margin-top:6px;font-size:11px;color:#8a6100;">⚠ ${skipped} ವಿತರಣೆ ಇನ್ನೂ ಸಿಬ್ಬಂದಿ ಸ್ವೀಕರಿಸಿಲ್ಲ — ಅವು ಈ ವಹಿಯಲ್ಲಿ ಇಲ್ಲ.</div>`;
  }
  const numCols=isStock?[4,5,6]:[2];
  const fill=Math.max(26, Math.ceil(n/26)*26);             // blank ruled rows, like the printed register
  const blank=cols.map(()=>'');
  const all=body.concat(Array.from({length:fill-n},()=>blank));
  const rowsHtml=all.map(r=>`<tr style="page-break-inside:avoid;">${r.map((c,i)=>`<td style="${td}${numCols.includes(i)?'text-align:right;':''}${(isStock&&i===0)||(!isStock&&i===0)?'text-align:center;':''}">${esc(String(c))}</td>`).join('')}</tr>`).join('');
  const totalRow=isStock&&n?`<tr><td colspan="6" style="${td}text-align:right;font-weight:700;">ಒಟ್ಟು</td><td style="${td}text-align:right;font-weight:700;">${Math.round(total*100)/100}</td></tr>`:'';
  const mr=(STK_RANGE&&STK_RANGE.rec)||stkMonthRec(month);
  const st=document.createElement('style'); st.id='stkPageStyle'; st.textContent='@page{size:A4 portrait;margin:10mm;}';
  const old=document.getElementById('stkPageStyle'); if(old) old.remove(); document.head.appendChild(st);
  const heading=isStock
    ? `<div style="font-size:17px;font-weight:700;">ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ವಹಿ</div>
       <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;margin-top:10px;"><div>ವಸತಿ ಶಾಲೆ / ಕಾಲೇಜು ಹೆಸರು: <span style="border-bottom:1px solid #000;padding:0 8px;">Morarji Desai Residential School (BC-265)</span></div><div>ವರ್ಷ: <span style="border-bottom:1px solid #000;padding:0 14px;">${esc(yr)}</span></div></div>`
    : `<div style="font-size:17px;font-weight:700;">ವಿತರಣಾ ವಹಿ</div>
       <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;margin-top:10px;"><div>ವಸತಿ ಶಾಲೆ / ಕಾಲೇಜು ಹೆಸರು: <span style="border-bottom:1px solid #000;padding:0 8px;">Morarji Desai Residential School (BC-265)</span></div><div>ತಿಂಗಳು / ಅವಧಿ: <span style="border-bottom:1px solid #000;padding:0 14px;">${esc(stkPeriodLabel(month))}</span></div></div>`;
  document.getElementById('content').innerHTML=`<div class="panel" id="printArea" style="max-width:780px;margin:0 auto;font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#000;background:#fff;">
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF (A4)</button>
      <button class="btn btn-outline" onclick="stkClosePrint()">✕ ಮುಚ್ಚಿ</button>
    </div>
    <div style="text-align:center;line-height:1.5;margin-bottom:8px;">${heading}
      <div style="font-size:11px;font-weight:400;margin-top:4px;">ವಿಭಾಗ: ${scope==='all'?'ಎಲ್ಲಾ':esc(stkCatLabel(scope))}${isStock&&stkPeriodLabel(month)?' &nbsp;|&nbsp; ಅವಧಿ: '+esc(stkPeriodLabel(month)):''}</div></div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;">
      <colgroup>${cols.map(c=>`<col style="width:${c[1]}%">`).join('')}</colgroup>
      <thead>
        <tr><th colspan="${cols.length}" style="${th}font-size:13px;">${isStock?'ಸ್ವೀಕೃತಿ':'ವಿತರಣೆ'}</th></tr>
        <tr>${cols.map(c=>`<th style="${th}">${c[0]}</th>`).join('')}</tr>
        <tr>${nums.map(x=>`<td style="${nm}">${x}</td>`).join('')}</tr>
      </thead>
      <tbody>${rowsHtml}${totalRow}</tbody></table>
    ${extra}
    <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px;">
      <div>ದಾಸ್ತಾನು ಪಾಲಕರು (FDA)</div>
      <div style="text-align:right;">ಮುಖ್ಯ ಗುರುಗಳು${mr&&mr.status==='Approved'?'<br><span style="font-size:10.5px;">ಅನುಮೋದಿತ: '+stkDisp(mr.decidedAt)+'</span>':''}</div>
    </div></div>`;
}
/* Combined register: every receipt line carries the issues made from it (FIFO) on the same line, exactly like the
   school's two-page spread (cols 1-7 ಸ್ವೀಕೃತಿ | cols 8-12 ವಿತರಣೆ). */
function stkPrintBook(){
  stkEnsure();
  const month=STK_MONTH, scope=STK_SCOPE;
  const dd=d=>{ const x=String(d||'').slice(0,10).split('-'); return x.length===3?x[2]+'-'+x[1]+'-'+x[0]:''; };
  const lines=[];                       // each: {left:[7 cells]|null, right:[5 cells]|null}
  let total=0;
  stkScopeCats(scope).forEach(k=>{
    const recs=DB.stock[k].receive.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const iss=DB.stock[k].issue.filter(i=>STK_CLOSED.includes(i.status)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const left=recs.map(r=>({r,rem:Number(r.qty||0),out:[]}));
    const orphan=[];
    iss.forEach(i=>{
      let need=Number(i.qty||0);
      left.filter(x=>x.r.itemName===i.itemName).forEach(x=>{ if(need<=0||x.rem<=0) return; const t=Math.min(need,x.rem); x.rem-=t; need-=t; x.out.push({i,q:t}); });
      if(need>0) orphan.push({i,q:need});
    });
    const right=o=>[dd(o.i.date),o.i.itemName,o.q,o.i.recipient+(stkDesig(o.i)?' — '+stkDesig(o.i):''),(o.i.status==='Accepted'&&o.i.acceptedBy)?(o.i.acceptedBy+'\nಇ-ಸಹಿ '+dd(o.i.acceptedAt)):''];
    left.forEach(x=>{
      if(!stkInP(x.r.date,month)) return;
      const amt=Number(x.r.amount!=null?x.r.amount:(Number(x.r.qty||0)*Number(x.r.rate||0))); total+=amt;
      const L=[dd(x.r.date),x.r.supplier||'',[x.r.bill||'',x.r.billDate?dd(x.r.billDate):''].filter(Boolean).join(' / '),x.r.itemName,Number(x.r.rate||0),Number(x.r.qty||0),amt];
      if(!x.out.length) lines.push({L,R:null});
      else x.out.forEach((o,n)=>lines.push({L:n===0?L:null,R:right(o)}));
    });
    orphan.filter(o=>stkInP(o.i.date,month)).forEach(o=>lines.push({L:null,R:right(o)}));
  });
  const td='border:1px solid #000;padding:3px 4px;height:26px;vertical-align:middle;white-space:pre-line;word-break:break-word;font-size:10.5px;';
  const th='border:1px solid #000;padding:4px 3px;text-align:center;font-weight:700;word-break:break-word;white-space:normal;font-size:10.5px;';
  const nm='border:1px solid #000;text-align:center;font-size:9.5px;padding:1px;';
  const W=[7,11,10,16,6,6,8, 8,15,6,18,12];   // 12 columns
  const H=['ದಿನಾಂಕ','ಪೂರೈಕೆದಾರರ ಹೆಸರು','ಬಿಲ್ ಸಂಖ್ಯೆ / ದಿನಾಂಕ','ಸಾಮಗ್ರಿಗಳ ವಿವರ','ದರ','ಪರಿಮಾಣ','ಬಿಲ್ ಮೊತ್ತ','ದಿನಾಂಕ','ಸಾಮಗ್ರಿಗಳ ವಿವರ','ಪರಿಮಾಣ','ಸಾಮಗ್ರಿಗಳನ್ನು ಯಾರಿಗೆ ವಿತರಿಸಿದೆ ಹೆಸರು / ಹುದ್ದೆ','ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ'];
  const num=[4,5,6,10,11];  // right-aligned: rate, qty, amount, issue qty ... (indices below)
  const cells=(arr,off,len)=>(arr?arr:Array(len).fill('')).map((c,i)=>`<td style="${td}${[4,5,6].includes(i+off)||(i+off)===9?'text-align:right;':''}">${esc(String(c))}</td>`).join('');
  const fill=Math.max(22,Math.ceil(lines.length/22)*22);
  const rows=lines.concat(Array.from({length:fill-lines.length},()=>({L:null,R:null})));
  const body=rows.map(r=>`<tr style="page-break-inside:avoid;">${cells(r.L,0,7)}${cells(r.R,7,5)}</tr>`).join('');
  const yr=(()=>{ if(!month) return defaultAcademicYear(); const y=Number(month.slice(0,4)), m=Number(month.slice(5,7)); return m>=6?`${y}-${String(y+1).slice(2)}`:`${y-1}-${String(y).slice(2)}`; })();
  const st=document.createElement('style'); st.id='stkPageStyle'; st.textContent='@page{size:A4 landscape;margin:8mm;}';
  const old=document.getElementById('stkPageStyle'); if(old) old.remove(); document.head.appendChild(st);
  document.getElementById('content').innerHTML=`<div class="panel" id="printArea" style="max-width:1120px;margin:0 auto;font-family:'Noto Sans Kannada','Nirmala UI',Arial,sans-serif;color:#000;background:#fff;">
    <div class="no-print" style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print / PDF (A4 Landscape)</button>
      <button class="btn btn-outline" onclick="stkClosePrint()">✕ ಮುಚ್ಚಿ</button></div>
    <div style="text-align:center;font-size:16px;font-weight:700;">ಸಾಮಗ್ರಿ ಸ್ವೀಕೃತಿ ಮತ್ತು ವಿತರಣಾ ವಹಿ</div>
    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin:8px 0;"><div>ವಸತಿ ಶಾಲೆ / ಕಾಲೇಜು ಹೆಸರು: <span style="border-bottom:1px solid #000;padding:0 8px;">Morarji Desai Residential School (BC-265)</span></div>
      <div>ವರ್ಷ: <span style="border-bottom:1px solid #000;padding:0 10px;">${esc(yr)}</span> &nbsp; ತಿಂಗಳು: <span style="border-bottom:1px solid #000;padding:0 10px;">${stkPeriodLabel(month)?esc(stkPeriodLabel(month)):'ಎಲ್ಲಾ'}</span> &nbsp; ವಿಭಾಗ: ${scope==='all'?'ಎಲ್ಲಾ':esc(stkCatLabel(scope))}</div></div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <colgroup>${W.map(w=>`<col style="width:${w}%">`).join('')}</colgroup>
      <thead><tr><th colspan="7" style="${th}font-size:12px;">ಸ್ವೀಕೃತಿ</th><th colspan="5" style="${th}font-size:12px;">ವಿತರಣೆ</th></tr>
        <tr>${H.map(h=>`<th style="${th}">${h}</th>`).join('')}</tr>
        <tr>${H.map((h,i)=>`<td style="${nm}">${i+1}</td>`).join('')}</tr></thead>
      <tbody>${body}<tr><td colspan="6" style="${td}text-align:right;font-weight:700;">ಒಟ್ಟು</td><td style="${td}text-align:right;font-weight:700;">${Math.round(total*100)/100}</td><td colspan="5" style="${td}"></td></tr></tbody></table>
    <div style="display:flex;justify-content:space-between;margin-top:34px;font-size:12px;"><div>ದಾಸ್ತಾನು ಪಾಲಕರು (FDA)</div><div>ಮುಖ್ಯ ಗುರುಗಳು</div></div></div>`;
}
function stkClosePrint(){ const o=document.getElementById('stkPageStyle'); if(o) o.remove(); navigate(CURRENT_PAGE); }

/* ------------------------------------------------------------------ Excel (A4 page set-up injected) */
function stkInjectA4(xml,landscape){
  const ps='<pageSetup paperSize="9" orientation="'+(landscape?'landscape':'portrait')+'" fitToWidth="1" fitToHeight="0"/>';
  const pm='<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>';
  if(/<pageSetUpPr[^>]*\/>/.test(xml)) xml=xml.replace(/<pageSetUpPr[^>]*\/>/,'<pageSetUpPr fitToPage="1"/>');
  else if(/<sheetPr\s*\/>/.test(xml)) xml=xml.replace(/<sheetPr\s*\/>/,'<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  else if(/<sheetPr[\s>]/.test(xml)) xml=xml.replace(/<\/sheetPr>/,'<pageSetUpPr fitToPage="1"/></sheetPr>');
  else xml=xml.replace(/(<worksheet[^>]*>)/,'$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  xml=xml.replace(/<pageMargins[^>]*\/>/,'').replace(/<pageSetup[^>]*\/>/,'');
  return xml.replace('</worksheet>',pm+ps+'</worksheet>');
}
function stkDownloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
function stkSaveXlsx(wb,name,landscape){
  if(typeof JSZip==='undefined'){ XLSX.writeFile(wb,name); return; }
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  JSZip.loadAsync(buf).then(z=>{
    const files=Object.keys(z.files).filter(f=>/^xl\/worksheets\/sheet\d+\.xml$/.test(f));
    return Promise.all(files.map(f=>z.file(f).async('string').then(x=>z.file(f,stkInjectA4(x,landscape))))).then(()=>z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }).then(blob=>stkDownloadBlob(blob,name)).catch(()=>XLSX.writeFile(wb,name));
}
function stkExcel(kind){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const month=STK_MONTH, scope=STK_SCOPE, landscape=kind==='stock';
  const head=kind==='stock'?STK_H1:STK_H2;
  const rows=kind==='stock'?stkTable1(stkStockRows(month,scope)):stkTable2(stkIssueRows(month,scope,true));
  const part=(kind==='stock'?'ಭಾಗ - 1 : ಸಾಮಗ್ರಿ ದಾಸ್ತಾನು':'ಭಾಗ - 2 : ವಿತರಣೆ ವಿವರ')+(stkPeriodLabel(month)?' — '+stkPeriodLabel(month):'');
  const aoa=[['Morarji Desai Residential School (BC-265)'],['ಸಾಮಗ್ರಿ ದಾಸ್ತಾನು ಮತ್ತು ವಿತರಣಾ ವಹಿ'],[part],head].concat(rows);
  if(kind==='stock'&&rows.length){ const r=new Array(head.length).fill(''); r[7]='ಒಟ್ಟು ಮೊತ್ತ'; r[8]=Math.round(rows.reduce((a,x)=>a+Number(x[8]||0),0)*100)/100; aoa.push(r); }
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges']=[0,1,2].map(r=>({s:{r,c:0},e:{r,c:head.length-1}}));
  ws['!cols']=(kind==='stock'?[7,13,24,12,13,26,9,11,12,18]:[7,14,28,13,34,30]).map(w=>({wch:w}));
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,kind==='stock'?'Materials Stock Register':'Materials Issue Register');
  stkSaveXlsx(wb,(kind==='stock'?'Materials_Stock_Register_':'Materials_Issue_Register_')+(month||'all')+'.xlsx',landscape);
  showToast('✅ Excel Download ಆಗುತ್ತಿದೆ (A4)');
}

;(window.__LOADED=window.__LOADED||[]).push('stock-assets');
