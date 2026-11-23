/* =====================================================================
   KREIS e-Office v35 — warden.js
   ವಾರ್ಡನ್ ವಿಭಾಗ — Warden dashboard: food stock/issue/indent, hostel items
   ===================================================================== */
function dashCardsWarden(ctx){
  const {pendingInward,pendingBills,pendingMsgs,myMovements}=ctx;
  let cards='';
 cards+=statCard(pendingBills,'ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇರುವ DC ಬಿಲ್‌ಗಳು'); 
  return cards;
}

function renderFoodDash(){
  initFoodItemsFixed();
  const totalItems = DB.foodItems.length;
  const lowStock = DB.foodItems.filter(f=>f.currentStock<5).length;
  const grpA = DB.foodItems.filter(f=>f.group==='A');
  const grpB = DB.foodItems.filter(f=>f.group==='B');
  const grpC = DB.foodItems.filter(f=>f.group==='C');

  function renderGroup(items, label){
    return `<div class="panel"><h3>${label}</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>#</th><th>ಪದಾರ್ಥ</th><th>ಘಟಕ</th><th>ಪ್ರಸ್ತುತ ದರ (₹)</th><th>ಸ್ಟಾಕ್</th>
        <th>ಹೊಸ ಸ್ಟಾಕ್ ಸೇರಿಸಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${items.map((f,i)=>`<tr style="${f.currentStock<5?'background:var(--red-tint)':''}">
        <td>${i+1}</td>
        <td><b>${esc(f.kn||f.name||f.id)}</b></td>
        <td>${esc(f.unit)}</td>
        <td><input type="number" value="${f.rate}" id="rate_${f.id}" style="width:70px;padding:4px;border:1px solid var(--border);border-radius:4px;" onchange="updateFoodRate('${f.id}',this.value)"></td>
        <td><b style="color:${f.currentStock<5?'var(--red)':'var(--green)'}">${f.currentStock} ${esc(f.unit)}</b></td>
        <td>
          <div style="display:flex;gap:4px;align-items:center;">
            <input type="number" id="addstock_${f.id}" placeholder="ಪ್ರಮಾಣ" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px;">
            <input type="text" id="bill_${f.id}" placeholder="ಬಿಲ್ ಸಂ" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px;">
          </div>
        </td>
        <td><button class="btn btn-sm btn-primary" onclick="addFoodStock('${f.id}')">+ ಸ್ಟಾಕ್</button></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🍱 ಆಹಾರ ಸಾಮಗ್ರಿ ನಿರ್ವಹಣೆ (Food Stock)</h2>
    <div class="desc">ವಾರ್ಡನ್ — ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ, ದರ ಬದಲಿಸಿ, ದೈನಂದಿನ ವಿತರಣೆ ನೋಡಿ</div></div>
    <div class="cards-grid">
      <div class="stat-card"><div class="n">${totalItems}</div><div class="l">ಒಟ್ಟು ಪದಾರ್ಥಗಳು</div></div>
      <div class="stat-card"><div class="n" style="color:var(--red)">${lowStock}</div><div class="l">⚠ ಕಡಿಮೆ ಸ್ಟಾಕ್ (&lt;5)</div></div>
      <div class="stat-card"><div class="n">${DB.foodStock.length}</div><div class="l">ಒಟ್ಟು ಖರೀದಿ ದಾಖಲೆ</div></div>
      <div class="stat-card"><div class="n">${DB.foodIssue.length}</div><div class="l">ಒಟ್ಟು ವಿತರಣೆ ದಾಖಲೆ</div></div>
    </div>
    ${renderGroup(grpA,'ಗೂಪ್ A — ಮುಖ್ಯ ಆಹಾರ ಪದಾರ್ಥಗಳು')}
    ${renderGroup(grpB,'ಗೂಪ್ B — ಹೆಚ್ಚುವರಿ ಪದಾರ್ಥಗಳು')}
    ${renderGroup(grpC,'ಗೂಪ್ C — ಧಾನ್ಯ / ಗ್ಯಾಸ್')}
    <div class="panel"><h3>📋 ಇತ್ತೀಚಿನ ಸ್ಟಾಕ್ ದಾಖಲೆಗಳು</h3>
      <div class="table-wrap"><table><thead><tr><th>ದಿನಾಂಕ</th><th>ಪದಾರ್ಥ</th><th>ಪ್ರಮಾಣ</th><th>ದರ</th><th>ಮೊತ್ತ</th><th>ಬಿಲ್ ಸಂ.</th><th>ದಾಖಲಿಸಿದವರು</th></tr></thead>
      <tbody>${DB.foodStock.slice().reverse().slice(0,20).map(r=>{
        const item=DB.foodItems.find(f=>f.id===r.itemId);
        return `<tr><td>${fmtDate(r.date)}</td><td>${esc(item?(item.kn||item.name||item.id):r.itemId)}</td><td>${r.qty} ${esc(item?item.unit:'')}</td><td>₹${r.rate}</td><td>₹${(r.qty*r.rate).toFixed(2)}</td><td>${esc(r.billNo||'—')}</td><td>${esc(r.by)}</td></tr>`;
      }).join('') || '<tr class="empty-row"><td colspan="7">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>'}
      </tbody></table></div>
    </div>`;
}

function updateFoodRate(itemId, newRate){
  const item = DB.foodItems.find(f=>f.id===itemId); if(!item) return;
  item.rate = Number(newRate);
  item.lastUpdated = todayStr();
  saveDB(); showToast('✅ ದರ ಅಪ್‌ಡೇಟ್ ಆಯಿತು: ₹'+newRate);
}

function addFoodStock(itemId){
  const item = DB.foodItems.find(f=>f.id===itemId); if(!item) return;
  const qty = Number(document.getElementById('addstock_'+itemId)?.value||0);
  const bill = document.getElementById('bill_'+itemId)?.value||'';
  if(!qty||qty<=0){ showToast('⚠ ಪ್ರಮಾಣ ನಮೂದಿಸಿ'); return; }
  item.currentStock = (item.currentStock||0) + qty;
  item.lastUpdated = todayStr();
  DB.foodStock.push({id:uid(), itemId, qty, rate:item.rate, billNo:bill, date:todayStr(), by:CURRENT_USER.name});
  saveDB();
  showToast('✅ '+qty+' '+item.unit+' '+item.name+' ಸ್ಟಾಕ್ ಸೇರಿಸಲಾಗಿದೆ');
  navigate('fooddash');
}

function renderFoodIssue(){
  initFoodItemsFixed();
  const students = DB.students;
  const totalStudents = students.length;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🍽️ ದೈನಂದಿನ ಆಹಾರ ವಿತರಣೆ</h2>
    <div class="desc">ವಾರ್ಡನ್ — ಪ್ರತಿ ದಿನ ಯಾವ ಪದಾರ್ಥ ಎಷ್ಟು ಖರ್ಚಾಯಿತು ದಾಖಲಿಸಿ</div></div>
    <div class="panel"><h3>📅 ಇಂದಿನ ವಿತರಣೆ ದಾಖಲಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="fi_date" value="${todayStr()}"></div>
        <div class="field"><label>ಉಪಾಹಾರ ಪ್ರಕಾರ</label>
          <select id="fi_meal"><option>ಬೆಳಿಗ್ಗೆ (Breakfast)</option><option>ಮಧ್ಯಾಹ್ನ (Lunch)</option><option>ಸಂಜೆ (Snacks)</option><option>ರಾತ್ರಿ (Dinner)</option></select></div>
        <div class="field"><label>ಹಾಜರಾದ ವಿದ್ಯಾರ್ಥಿಗಳ ಸಂಖ್ಯೆ</label>
          <input type="number" id="fi_students" value="${totalStudents}" min="1"></div>
      </div>
      <h4>ಬಳಸಿದ ಪದಾರ್ಥಗಳು:</h4>
      <div class="table-wrap"><table><thead><tr>
        <th><input type="checkbox" onchange="selectAllFoodItems(this)"> ಎಲ್ಲಾ</th>
        <th>ಪದಾರ್ಥ</th><th>ಸ್ಟಾಕ್</th><th>ಬಳಕೆ ಪ್ರಮಾಣ</th><th>ದರ ₹</th><th>ಮೊತ್ತ</th>
      </tr></thead>
      <tbody>${DB.foodItems.map(f=>`<tr>
        <td><input type="checkbox" class="fi-item-chk" data-id="${f.id}"></td>
        <td>${esc(f.name)}</td>
        <td>${f.currentStock} ${esc(f.unit)}</td>
        <td><input type="number" id="fi_qty_${f.id}" value="0" min="0" max="${f.currentStock}" step="0.5"
          oninput="updateFITotal('${f.id}')" style="width:80px;padding:4px;border:1px solid var(--border);border-radius:4px;"></td>
        <td>
          <input type="number" id="fi_rate_${f.id}" value="${f.rate}" style="width:70px;padding:4px;border:1px solid var(--border);border-radius:4px;" oninput="updateFITotal('${f.id}')">
        </td>
        <td id="fi_total_${f.id}" style="font-weight:700;">₹0</td>
      </tr>`).join('')}
      </tbody></table></div>
      <div style="margin-top:10px;font-size:14px;font-weight:700;">ಒಟ್ಟು ಖರ್ಚು: <span id="fi_grand">₹0</span></div>
      <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-primary" onclick="saveFoodIssue()">✅ ವಿತರಣೆ ದಾಖಲಿಸಿ</button>
      </div>
    </div>
    <div class="panel"><h3>📋 ಇತ್ತೀಚಿನ ವಿತರಣೆ ದಾಖಲೆಗಳು</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ದಿನಾಂಕ</th><th>ಉಪಾಹಾರ</th><th>ವಿದ್ಯಾರ್ಥಿ ಸಂಖ್ಯೆ</th><th>ಒಟ್ಟು ಖರ್ಚು</th><th>ದಾಖಲಿಸಿದವರು</th>
      </tr></thead>
      <tbody>${DB.foodIssue.slice().reverse().slice(0,15).map(r=>`<tr>
        <td>${fmtDate(r.date)}</td><td>${esc(r.meal)}</td><td>${r.studentCount}</td>
        <td>₹${Number(r.totalAmount||0).toFixed(2)}</td><td>${esc(r.by)}</td>
      </tr>`).join('') || '<tr class="empty-row"><td colspan="5">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>'}
      </tbody></table></div>
    </div>`;
}

function selectAllFoodItems(master){
  document.querySelectorAll('.fi-item-chk').forEach(cb=>cb.checked=master.checked);
}

function updateFITotal(itemId){
  const qty = Number(document.getElementById('fi_qty_'+itemId)?.value||0);
  const rate = Number(document.getElementById('fi_rate_'+itemId)?.value||0);
  const totalEl = document.getElementById('fi_total_'+itemId);
  if(totalEl) totalEl.textContent='₹'+(qty*rate).toFixed(2);
  let grand=0;
  DB.foodItems.forEach(f=>{
    const q=Number(document.getElementById('fi_qty_'+f.id)?.value||0);
    const r=Number(document.getElementById('fi_rate_'+f.id)?.value||0);
    grand+=q*r;
  });
  const ge=document.getElementById('fi_grand'); if(ge) ge.textContent='₹'+grand.toFixed(2);
}

function saveFoodIssue(){
  const date=document.getElementById('fi_date').value;
  const meal=document.getElementById('fi_meal').value;
  const studentCount=Number(document.getElementById('fi_students').value||0);
  const items=[];
  let totalAmount=0;
  DB.foodItems.forEach(f=>{
    const qty=Number(document.getElementById('fi_qty_'+f.id)?.value||0);
    const rate=Number(document.getElementById('fi_rate_'+f.id)?.value||f.rate);
    if(qty>0){
      if(qty>f.currentStock){ showToast('⚠ '+f.name+': ಸ್ಟಾಕ್ ಕಡಿಮೆ ('+f.currentStock+' ಮಾತ್ರ ಇದೆ)'); return; }
      f.currentStock=Math.max(0,f.currentStock-qty);
      items.push({itemId:f.id, qty, rate, amount:qty*rate});
      totalAmount+=qty*rate;
    }
  });
  if(!items.length){ showToast('⚠ ಯಾವುದಾದರೂ ಪದಾರ್ಥ ಮತ್ತು ಪ್ರಮಾಣ ನಮೂದಿಸಿ'); return; }
  DB.foodIssue.push({id:uid(), date, meal, studentCount, items, totalAmount, by:CURRENT_USER.name});
  saveDB();
  showToast('✅ ವಿತರಣೆ ದಾಖಲಿಸಲಾಗಿದೆ — ₹'+totalAmount.toFixed(2));
  navigate('foodissue');
}

function initFoodItemsFixed(){
  if(!DB.foodItems || DB.foodItems.length===0 || !DB.foodItems[0].kn){
    DB.foodItems = FOOD_ITEMS_MASTER.map(f=>({...f, currentStock:0, lastUpdated:'', name:f.kn}));
    saveDB();
  } else if(DB.foodItems.length>0 && !DB.foodItems[0].kn){
    // Migrate old data
    DB.foodItems = FOOD_ITEMS_MASTER.map(f=>{
      const old = DB.foodItems.find(x=>x.id===f.id)||{};
      return {...f, currentStock:old.currentStock||0, lastUpdated:old.lastUpdated||'', name:f.kn};
    });
    saveDB();
  }
}

function renderFoodMonthly(){
  initFoodItemsFixed();
  const months=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
  const now=new Date(); const curM=now.getMonth(); const curY=now.getFullYear();
  const pendingSign = DB.beedigaPatti.filter(b=>b.status==='Sent to Principal').length;
  const pendingBack = DB.beedigaPatti.filter(b=>b.status==='Ready to Close').length;
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📊 ಮಾಸಿಕ ಬೀಡಿಕೆ ಪಟ್ಟಿ (ಘೋಷಣೆ)</h2>
    </div>
    ${pendingSign?`<div class="note">🔔 ${pendingSign} ಬೀಡಿಕೆ ಪಟ್ಟಿ Principal Sign ಗಾಗಿ ಕಾಯುತ್ತಿದೆ (Principal Login ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ)</div>`:''}
    ${pendingBack?`<div class="note" style="background:var(--green-tint);">✅ ${pendingBack} ಬೀಡಿಕೆ ಪಟ್ಟಿ Principal Sign ಆಗಿ ಮುಚ್ಚಲು ಸಿದ್ಧ</div>`:''}

    <div class="panel"><h3>➕ ಹೊಸ ಬೀಡಿಕೆ ಪಟ್ಟಿ Generate</h3>
      <div class="form-grid">
        <div class="field"><label>ತಿಂಗಳು</label>
          <select id="bp_month">${months.map((m,i)=>`<option value="${i}" ${i===curM?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="field"><label>ವರ್ಷ</label><input id="bp_year" type="number" value="${curY}"></div>
        <div class="field"><label>ಒಟ್ಟು ಕೆಲಸದ ದಿನಗಳು</label><input id="bp_wdays" type="number" value="30"></div>
        <div class="field"><label>ಈ ತಿಂಗಳ ಒಟ್ಟು ಹಾಜರಾತಿ (ವಿದ್ಯಾರ್ಥಿ ದಿನಗಳು)</label><input id="bp_att" type="number" value="${DB.students.length*30}"></div>
        <div class="field"><label>ಗೂಪ್ A ಮಂಜೂರಾದ ಹಣ ₹</label><input id="bp_gA" type="number" value="800"></div>
        <div class="field"><label>ಗೂಪ್ B ಮಂಜೂರಾದ ಹಣ ₹</label><input id="bp_gB" type="number" value="600"></div>
        <div class="field"><label>ಗೂಪ್ C ಮಂಜೂರಾದ ಹಣ ₹</label><input id="bp_gC" type="number" value="350"></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="generateBeedigaPatti()">📊 ಬೀಡಿಕೆ ಪಟ್ಟಿ Generate → Principal ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>

    <div class="panel"><h3>📋 ಹಿಂದಿನ ಬೀಡಿಕೆ ಪಟ್ಟಿಗಳು (${DB.beedigaPatti.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ತಿಂಗಳು</th><th>ಒಟ್ಟು ಖರ್ಚು</th><th>ಸ್ಥಿತಿ</th><th>Principal Sign</th><th>Action</th>
      </tr></thead>
      <tbody>${DB.beedigaPatti.length ? DB.beedigaPatti.slice().reverse().map(b=>`<tr>
        <td><b>${months[b.month]}-${b.year}</b></td>
        <td>₹${Number(b.totalExpense||0).toFixed(2)}</td>
        <td><span class="badge ${badgeClass(b.status)}">${esc(b.status)}</span></td>
        <td>${b.principalSigned?`✅ ${esc(b.principalName)} (${fmtDate(b.principalSignedAt)})`:'⏳ ಬಾಕಿ'}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="viewBeedigaPatti('${b.id}')">👁 View</button>
          ${b.status==='Ready to Close'?`<button class="btn btn-sm btn-green" onclick="closeBeedigaPatti('${b.id}')">✅ ಮುಚ್ಚಿ & Print</button>`:''}
        </td>
      </tr>`).join('') : `<tr class="empty-row"><td colspan="5">ಇಲ್ಲಿಯವರೆಗೆ ಯಾವ ಬೀಡಿಕೆ ಪಟ್ಟಿ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="bpPreviewWrap"></div>`;
}

function generateBeedigaPatti(){
  initFoodItemsFixed();
  const month=Number(document.getElementById('bp_month').value);
  const year=Number(document.getElementById('bp_year').value);
  const wdays=Number(document.getElementById('bp_wdays').value||30);
  const att=Number(document.getElementById('bp_att').value||0);
  const sanctA=Number(document.getElementById('bp_gA').value||800);
  const sanctB=Number(document.getElementById('bp_gB').value||600);
  const sanctC=Number(document.getElementById('bp_gC').value||350);

  // Gather data from food stock/issue for this month
  function getMonthStock(itemId){
    return DB.foodStock.filter(r=>r.itemId===itemId&&r.date&&Number(r.date.slice(0,4))===year&&Number(r.date.slice(5,7))===month+1).reduce((a,r)=>a+Number(r.qty||0),0);
  }
  function getMonthIssue(itemId){
    let t=0;
    DB.foodIssue.filter(r=>r.date&&Number(r.date.slice(0,4))===year&&Number(r.date.slice(5,7))===month+1).forEach(r=>{
      const e=r.items&&r.items.find(i=>i.itemId===itemId);
      if(e) t+=Number(e.qty||0);
    });
    return t;
  }

  let totalPurchaseA=0, totalPurchaseB=0, totalPurchaseC=0;
  let totalExpenseA=0, totalExpenseB=0, totalExpenseC=0;

  const itemDetails = DB.foodItems.map(f=>{
    const purchased=getMonthStock(f.id);
    const issued=getMonthIssue(f.id);
    const balance=Math.max(0,(f.currentStock||0));
    const pAmt=purchased*f.rate;
    const iAmt=issued*f.rate;
    if(f.group==='A'){totalPurchaseA+=pAmt; totalExpenseA+=iAmt;}
    else if(f.group==='B'){totalPurchaseB+=pAmt; totalExpenseB+=iAmt;}
    else if(f.group==='C'){totalPurchaseC+=pAmt; totalExpenseC+=iAmt;}
    return {id:f.id, kn:f.kn, group:f.group, rate:f.rate, purchased, issued, balance, pAmt, iAmt};
  });

  const totalPurchase=totalPurchaseA+totalPurchaseB+totalPurchaseC;
  const totalExpense=totalExpenseA+totalExpenseB+totalExpenseC;
  const perStudentPerDay = att>0 ? totalExpense/att : 0;
  const expectedExpense = att*(sanctA+sanctB+sanctC)/1;
  const difference = totalExpense - expectedExpense;
  const totalSanctioned = sanctA+sanctB+sanctC;

  const bp={
    id:uid(), month, year, wdays, att, sanctA, sanctB, sanctC,
    totalPurchase, totalExpense, perStudentPerDay, expectedExpense, difference,
    itemDetails, status:'Sent to Principal',
    createdBy:CURRENT_USER.name, createdAt:todayStr(),
    principalSigned:false, principalSignedAt:null, principalName:null, closedAt:null
  };
  DB.beedigaPatti.push(bp); saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📊 ಬೀಡಿಕೆ ಪಟ್ಟಿ Sign ಅಗತ್ಯ: '+['ಜನ','ಫೆಬ','ಮಾರ್ಚ್','ಏಪ್ರಿ','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟ','ಅಕ್ಟ','ನವ','ಡಿಸ'][month]+'-'+year);
  showToast('✅ ಬೀಡಿಕೆ ಪಟ್ಟಿ Generate ಆಯಿತು → Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  navigate('foodmonthly');
}

function viewBeedigaPatti(id){
  const b=DB.beedigaPatti.find(x=>x.id===id); if(!b) return;
  const months=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
  const monthLabel=months[b.month]+'-'+b.year;

  // Group items
  const grpA=(b.itemDetails||[]).filter(x=>x.group==='A'&&(x.purchased>0||x.issued>0));
  const grpB=(b.itemDetails||[]).filter(x=>x.group==='B'&&(x.purchased>0||x.issued>0));
  const grpC=(b.itemDetails||[]).filter(x=>x.group==='C'&&(x.purchased>0||x.issued>0));

  function renderItemGroup(items, label){
    if(!items.length) return '';
    return `<tr><td colspan="6" style="background:#e7eef5;font-weight:800;padding:5px 8px;">${label}</td></tr>
    ${items.map((f,i)=>`<tr>
      <td>${i+1}</td><td>${esc(f.kn)}</td><td>₹${f.rate}</td>
      <td>${f.purchased}</td><td>${f.issued}</td><td>₹${f.iAmt.toFixed(2)}</td>
    </tr>`).join('')}`;
  }

  const html=`<div class="letterhead-paper" style="font-size:12px;">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ, ಹೆಬಳೆ, ಭಟ್ಕಳ</div>
        ${monthLabel} ತಿಂಗಳ ಆಹಾರ ಪದಾರ್ಥಗಳ ಖರ್ಚು ವೆಚ್ಚದ ಬ್ಯಾಲೆನ್ಸ್ ಶೀಟ್
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:11px;">
      <thead><tr style="background:#1a3a5c;color:#fff;">
        <th style="padding:5px 6px;">#</th><th style="padding:5px 6px;text-align:left;">ಪದಾರ್ಥ</th>
        <th style="padding:5px 6px;">ದರ</th><th style="padding:5px 6px;">ಖರೀದಿ</th>
        <th style="padding:5px 6px;">ಖರ್ಚು</th><th style="padding:5px 6px;">ಮೊತ್ತ</th>
      </tr></thead>
      <tbody>
        ${renderItemGroup(grpA,'ಗೂಪ್ A — ಮುಖ್ಯ ಆಹಾರ')}
        ${renderItemGroup(grpB,'ಗೂಪ್ B — ತರಕಾರಿ & ಇತರ')}
        ${renderItemGroup(grpC,'ಗೂಪ್ C — ಅಕ್ಕಿ/ಗ್ಯಾಸ್')}
        <tr style="font-weight:800;background:#f0f0f0;">
          <td colspan="5" style="padding:5px 8px;">ಅಂತೂ ಒಟ್ಟು</td>
          <td style="padding:5px 8px;">₹${b.totalExpense.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="border:1px solid #ccc;padding:10px;margin-top:10px;background:#f8f8f8;">
      <h4 style="margin:0 0 8px;">${monthLabel}ನೇ ತಿಂಗಳ ಘೋಷಣೆ</h4>
      <table style="width:100%;font-size:11.5px;border-collapse:collapse;">
        <tr><td style="padding:3px 8px;width:50%;">ಮಂಜೂರಾದ ಹಣ — ಗೂಪ್ A</td><td><b>₹ ${b.sanctA}.00</b></td>
            <td>ಗೂಪ್ B</td><td><b>₹ ${b.sanctB}.00</b></td>
            <td>ಗೂಪ್ C</td><td><b>₹ ${b.sanctC}.00</b></td>
            <td>ಒಟ್ಟು</td><td><b>₹ ${b.sanctA+b.sanctB+b.sanctC}.00</b></td></tr>
        <tr><td>ಈ ತಿಂಗಳ ಒಟ್ಟು ಕೆಲಸದ ದಿನಗಳು</td><td><b>${b.wdays}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>1. ಹಿಂದಿನ ತಿಂಗಳ ಉಳಿಕೆ</td><td><b>₹ 0.00</b></td>
            <td colspan="6"></td></tr>
        <tr><td>2. ಈ ತಿಂಗಳ ಖರೀದಿ</td><td><b>₹ ${b.totalPurchase.toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>3. ಅಂತೂ ಒಟ್ಟು</td><td><b>₹ ${b.totalPurchase.toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>4. ಈ ತಿಂಗಳ ಹಾಜರಾತಿ (ವಿದ್ಯಾರ್ಥಿ ದಿನ)</td><td><b>${b.att}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>5. ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಗೆ (${b.wdays} ದಿನಕ್ಕೆ)</td><td><b>₹ ${b.perStudentPerDay.toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>6. ಹಾಜರಾತಿ ಪ್ರಕಾರ ಮಾಡಬೇಕಾದ ಖರ್ಚು</td><td><b>₹ ${b.expectedExpense.toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>7. ಈ ತಿಂಗಳು ಮಾಡಿರುವ ಖರ್ಚು</td><td><b>₹ ${b.totalExpense.toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>8. ವ್ಯತ್ಯಾಸ</td><td><b style="color:${b.difference>=0?'var(--red)':'var(--green)'}">₹ ${Math.abs(b.difference).toFixed(2)} ${b.difference>=0?'(ಹೆಚ್ಚು)':'(ಕಡಿಮೆ)'}</b></td>
            <td colspan="6"></td></tr>
        <tr><td>9. ತಿಂಗಳ ಕೊನೆಯ ಉಳಿಕೆ</td><td><b>₹ ${Math.max(0,b.totalPurchase-b.totalExpense).toFixed(2)}</b></td>
            <td colspan="6"></td></tr>
      </table>
    </div>
    ${b.principalSigned?principalSignatureHTML(b.principalName, b.principalSignedAt, fmtDate(b.principalSignedAt)):''}
    <div style="display:flex;justify-content:space-between;margin-top:28px;font-size:12px;">
      <div style="text-align:center;"><div style="margin-bottom:24px;"></div><div style="border-top:1px solid #000;padding-top:4px;">ವಾರ್ಡನ್ (ಪ್ರಭಾರ) ಸಹಿ</div></div>
      <div style="text-align:right;">${typeof PRINCIPAL_SIGN!=='undefined'?`<div style="height:34px;"></div><div style="border-top:1.5px solid #000;padding-top:4px;font-size:10px;font-family:var(--font-kn);text-align:right;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ | MDRS Bhatkal</div>`:`<div style="margin-bottom:40px;border-top:1.5px solid #000;padding-top:4px;font-size:11px;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div>`}</div>
    </div>
  </div>`;

  const wrap=document.getElementById('bpPreviewWrap')||document.getElementById('content');
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      ${b.status==='Ready to Close'?`<button class="btn btn-green" onclick="closeBeedigaPatti('${b.id}')">✅ ಮುಚ್ಚಿ</button>`:''}
      <button class="btn btn-outline" onclick="navigate('foodmonthly')">✕</button>
    </div>
    ${html}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function closeBeedigaPatti(id){
  const b=DB.beedigaPatti.find(x=>x.id===id); if(!b) return;
  b.status='Closed'; b.closedAt=todayStr(); saveDB();
  showToast('✅ ಬೀಡಿಕೆ ಪಟ್ಟಿ ಮುಚ್ಚಲಾಗಿದೆ'); viewBeedigaPatti(id);
}

function renderHostelItems(){
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>🛏️ ವಸತಿ ವಸ್ತು ರಿಜಿಸ್ಟರ್ (Hostel Items)</h2>
    <div class="desc">ವಾರ್ಡನ್ — ಬೆಡ್ ಶೀಟ್, ಕಂಬಳಿ, ಟವೆಲ್ ಇತ್ಯಾದಿ ಸ್ಟಾಕ್ ಮತ್ತು ವಿತರಣೆ</div></div>

    <div class="panel"><h3>➕ ಸ್ಟಾಕ್ ಸ್ವೀಕರಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಸ್ತು</label><select id="hi_item">${HOSTEL_ITEMS.map(i=>`<option value="${i.kn}">${i.kn} (${i.en})</option>`).join('')}</select></div>
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="hi_date" value="${todayStr()}"></div>
        <div class="field"><label>ಬಿಲ್ ಸಂಖ್ಯೆ</label><input id="hi_bill" placeholder="ಬಿಲ್ ಸಂ."></div>
        <div class="field"><label>ಬಂದ ಪ್ರಮಾಣ</label><input type="number" id="hi_qty" placeholder="ಪ್ರಮಾಣ"></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="addHostelStock()">➕ ಸ್ಟಾಕ್ ಸೇರಿಸಿ</button></div>
    </div>

    <div class="panel"><h3>📤 ವಿತರಣೆ ದಾಖಲಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಸ್ತು</label><select id="hii_item">${HOSTEL_ITEMS.map(i=>`<option value="${i.kn}">${i.kn} (${i.en})</option>`).join('')}</select></div>
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="hii_date" value="${todayStr()}"></div>
        <div class="field"><label>ಸ್ವೀಕರಿಸಿದ ವಿದ್ಯಾರ್ಥಿ (Student)</label>
          <input id="hii_recv" list="hostel_stu_list" placeholder="ಹೆಸರು ಟೈಪ್ ಮಾಡಿ...">
          <datalist id="hostel_stu_list">
            ${DB.students.map(s=>`<option value="${s.studentName} (${s.className}ನೇ, ${s.admissionNo})">`).join('')}
            <option value="ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ (All Students)">
            <option value="ಹೊಸ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ (New Admissions)">
          </datalist>
        </div>
        <div class="field"><label>ಪ್ರಮಾಣ</label><input type="number" id="hii_qty" placeholder="ಪ್ರಮಾಣ"></div>
        <div class="field"><label>ಟಿಪ್ಪಣಿ (Remarks)</label><input id="hii_remark" placeholder="ಐಚ್ಛಿಕ"></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="addHostelIssue()">📤 ವಿತರಣೆ ದಾಖಲಿಸಿ</button></div>
    </div>

    <div class="panel"><h3>📦 ಸ್ಟಾಕ್ ಸ್ಥಿತಿ</h3>
      <div class="table-wrap"><table><thead><tr><th>ವಸ್ತು</th><th>ಒಟ್ಟು ಬಂದ</th><th>ಒಟ್ಟು ಕೊಟ್ಟ</th><th>ಉಳಿಕೆ</th></tr></thead>
      <tbody>${HOSTEL_ITEMS.map(item=>{
        const key=item.kn||item;
        const stk = DB.hostelStock.filter(r=>r.item===key||r.item===item).reduce((a,r)=>a+Number(r.qty||0),0);
        const iss = DB.hostelIssue.filter(r=>r.item===key||r.item===item).reduce((a,r)=>a+Number(r.qty||0),0);
        const bal = stk-iss;
        return `<tr><td><b>${esc(key)}</b><br><span class="small-muted">${esc(item.en||'')}</span></td><td>${stk}</td><td>${iss}</td><td style="font-weight:700;color:${bal<5?'var(--red)':'var(--green)'}">${bal}</td></tr>`;
      }).join('')}
      </tbody></table></div>
    </div>

    <div class="panel"><h3>📋 ಸ್ಟಾಕ್ ರಿಜಿಸ್ಟರ್</h3>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ</th><th>ದಿನಾಂಕ</th><th>ಬಿಲ್ ಸಂ.</th><th>ವಸ್ತು</th><th>ಬಂದ ಪ್ರಮಾಣ</th><th>ಒಟ್ಟು</th><th>ಉಳಿಕೆ</th></tr></thead>
      <tbody>${DB.hostelStock.slice().reverse().map((r,i)=>{
        const iss=DB.hostelIssue.filter(x=>x.item===r.item&&x.date<=r.date).reduce((a,x)=>a+Number(x.qty||0),0);
        return `<tr><td>${DB.hostelStock.length-i}</td><td>${fmtDate(r.date)}</td><td>${esc(r.billNo||'—')}</td><td>${esc(r.item)}</td><td>${r.qty}</td><td>—</td><td>—</td></tr>`;
      }).join('') || '<tr class="empty-row"><td colspan="7">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>'}
      </tbody></table>
      <div style="margin-top:10px;display:flex;justify-content:space-between;">
        <div>ವಾರ್ಡನ್ (ಪ್ರಭಾರ) ಸಹಿ: ___________________</div>
        <div>ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ: ___________________</div>
      </div>
    </div>

    <div class="panel"><h3>📋 ವಿತರಣೆ ರಿಜಿಸ್ಟರ್</h3>
      <div class="table-wrap"><table><thead><tr><th>ಕ್ರ</th><th>ದಿನಾಂಕ</th><th>ವಸ್ತು</th><th>ಸ್ವೀಕರಿಸಿದವರು</th><th>ಪ್ರಮಾಣ</th><th>ಸಹಿ</th></tr></thead>
      <tbody>${DB.hostelIssue.slice().reverse().map((r,i)=>`<tr>
        <td>${DB.hostelIssue.length-i}</td>
        <td>${fmtDate(r.date)}</td><td>${esc(r.item)}</td><td>${esc(r.recipient)}</td><td>${r.qty}</td><td>—</td>
      </tr>`).join('') || '<tr class="empty-row"><td colspan="6">ದಾಖಲೆ ಇಲ್ಲ.</td></tr>'}
      </tbody></table>
      <div style="margin-top:10px;display:flex;justify-content:space-between;">
        <div>ವಾರ್ಡನ್ (ಪ್ರಭಾರ) ಸಹಿ: ___________________</div>
        <div>ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ: ___________________</div>
      </div>
      <div class="form-actions"><button class="btn btn-gold" onclick="window.print()">🖨️ Print</button></div>
    </div>`;
}

function addHostelStock(){
  const item=document.getElementById('hi_item').value;
  const date=document.getElementById('hi_date').value;
  const billNo=document.getElementById('hi_bill').value;
  const qty=Number(document.getElementById('hi_qty').value||0);
  if(!qty||qty<=0){ showToast('⚠ ಪ್ರಮಾಣ ನಮೂದಿಸಿ'); return; }
  DB.hostelStock.push({id:uid(), item, date, billNo, qty, by:CURRENT_USER.name});
  saveDB(); showToast('✅ ಸ್ಟಾಕ್ ದಾಖಲಿಸಲಾಗಿದೆ'); navigate('hostelitreg');
}

function addHostelIssue(){
  const item=document.getElementById('hii_item').value;
  const date=document.getElementById('hii_date').value;
  const recipient=document.getElementById('hii_recv').value;
  const qty=Number(document.getElementById('hii_qty').value||0);
  if(!qty||qty<=0||!recipient){ showToast('⚠ ವಿವರ ಮತ್ತು ಪ್ರಮಾಣ ನಮೂದಿಸಿ'); return; }
  DB.hostelIssue.push({id:uid(), item, date, recipient, qty, by:CURRENT_USER.name});
  saveDB(); showToast('✅ ವಿತರಣೆ ದಾಖಲಿಸಲಾಗಿದೆ'); navigate('hostelitreg');
}

function renderFoodIndent(){
  initFoodItemsFixed();
  const myIndents=(DB.foodIndents||[]).slice().reverse();
  const pendingApproval=myIndents.filter(x=>x.status==='Sent to Principal').length;
  const isWarden=CURRENT_USER.role==='warden';
  const selPart=document.getElementById('fi_part')?.value || 'A';
  const grpLabel={'A':'ಗುಂಪು A — ಮುಖ್ಯ ಆಹಾರ ಪದಾರ್ಥಗಳು','B':'ಗುಂಪು B — ತರಕಾರಿ & ಇತರ','C':'ಗುಂಪು C — ಅಕ್ಕಿ/ಗ್ಯಾಸ್'};

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 ಆಹಾರ ಇಂಡೆಂಟ್ (Food Indent)</h2>
    </div>

    ${pendingApproval&&CURRENT_USER.role==='principal'?`<div class="note">🔔 ${pendingApproval} Indent(s) ನಿಮ್ಮ Approval ಗಾಗಿ ಕಾಯುತ್ತಿದೆ</div>`:''}

    ${isWarden?`<div class="panel"><h3>➕ ಹೊಸ ಇಂಡೆಂಟ್ ತಯಾರಿಸಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ಇಂಡೆಂಟ್ ಪ್ರಕಾರ</label>
          <select id="fi_type"><option value="daily">ದೈನಂದಿನ (Daily)</option><option value="monthly">ಮಾಸಿಕ (Monthly)</option></select></div>
        <div class="field"><label>ದಿನಾಂಕ / ತಿಂಗಳು</label>
          <input type="date" id="fi_date" value="${todayStr()}"></div>
        <div class="field"><label>ಉದ್ದೇಶ / ಊಟ ಪ್ರಕಾರ</label>
          <input id="fi_purpose" placeholder="ಉದಾ: ಬೆಳಿಗ್ಗೆ+ಮಧ್ಯಾಹ್ನ+ರಾತ್ರಿ / ತಿಂಗಳ ಖರೀದಿ"></div>
        <div class="field"><label>ವಿದ್ಯಾರ್ಥಿ ಸಂಖ್ಯೆ</label>
          <input type="number" id="fi_stu" value="${DB.students.length}" min="1"></div>
        <div class="field"><label>ಭಾಗ (Part) ಆಯ್ಕೆ ಮಾಡಿ</label>
          <select id="fi_part" onchange="renderFoodIndent()">
            <option value="A" ${selPart==='A'?'selected':''}>ಭಾಗ A — ಮುಖ್ಯ ಆಹಾರ ಪದಾರ್ಥಗಳು</option>
            <option value="B" ${selPart==='B'?'selected':''}>ಭಾಗ B — ತರಕಾರಿ & ಇತರ</option>
            <option value="C" ${selPart==='C'?'selected':''}>ಭಾಗ C — ಅಕ್ಕಿ/ಗ್ಯಾಸ್</option>
          </select>
        </div>
      </div>

      <h4 style="margin:12px 0 8px;">${grpLabel[selPart]} — ಪ್ರತಿ ಪದಾರ್ಥ ಅಗತ್ಯ ಪ್ರಮಾಣ ನಮೂದಿಸಿ:</h4>
      <div class="note" style="margin-bottom:10px;">ಯಾವ ಪದಾರ್ಥ ಬೇಡವೋ ಅದನ್ನು 0 ಬಿಡಿ — 0 ಇರುವ ಪದಾರ್ಥ Print ನಲ್ಲಿ ಬರುವುದಿಲ್ಲ. ಇತರ ಭಾಗಗಳಿಗೆ ಪ್ರತ್ಯೇಕ Indent ತಯಾರಿಸಿ.</div>

      <div style="margin-bottom:14px;">
        <div style="font-weight:700;color:var(--navy);margin-bottom:8px;padding:6px 10px;background:var(--navy-tint);border-radius:6px;">${grpLabel[selPart]}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
          ${DB.foodItems.filter(f=>f.group===selPart).map(f=>`<div style="display:flex;gap:6px;align-items:center;background:var(--surface-2);padding:7px 10px;border-radius:8px;border:1px solid var(--border);">
            <div style="flex:1;font-size:12.5px;font-family:var(--font-kn);">${esc(f.kn)}<br><span class="small-muted" style="font-size:10.5px;">₹${f.rate}/${esc(f.unit)}</span></div>
            <input type="number" id="ind_${f.id}" value="0" min="0" step="0.5" style="width:70px;padding:5px;border:1px solid var(--border);border-radius:6px;text-align:right;" oninput="updateIndentTotal()">
            <span style="font-size:11px;color:var(--muted);min-width:20px;">${esc(f.unit)}</span>
          </div>`).join('')}
        </div>
      </div>

      <div style="margin-top:10px;padding:10px;background:var(--gold-tint);border-radius:8px;font-size:13px;">
        ಒಟ್ಟು ಅಂದಾಜು ಮೊತ್ತ: <b id="indentTotal" style="font-size:16px;color:var(--navy);">₹0</b>
      </div>
      <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-primary" onclick="saveAndSendIndent()">✅ Indent ತಯಾರು → Principal ಗೆ Approval ಗೆ ಕಳುಹಿಸಿ</button>
      </div>
    </div>`:''}

    <div class="panel"><h3>📋 ${isWarden?'ಹಿಂದಿನ':'ಎಲ್ಲಾ'} Indent ಗಳು (${myIndents.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಭಾಗ</th><th>ಪ್ರಕಾರ</th><th>ದಿನಾಂಕ</th><th>ಉದ್ದೇಶ</th><th>ಒಟ್ಟು ಅಂದಾಜು</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead>
      <tbody>${myIndents.length?myIndents.map(ind=>`<tr>
        <td><span class="badge badge-info">${esc(ind.part||'—')}</span></td>
        <td><span class="badge ${ind.indentType==='daily'?'badge-info':'badge-ok'}">${ind.indentType==='daily'?'ದೈನಂದಿನ':'ಮಾಸಿಕ'}</span></td>
        <td>${fmtDate(ind.date)}</td>
        <td>${esc(ind.purpose||'—')}</td>
        <td><b>₹${Number(ind.totalAmt||0).toFixed(0)}</b></td>
        <td><span class="badge ${badgeClass(ind.status)}">${esc(ind.status)}</span></td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-outline" onclick="viewIndent('${ind.id}')">👁 View</button>
          ${ind.status==='Approved'?`<button class="btn btn-sm btn-gold" onclick="printIndent('${ind.id}')">🖨️ Print</button>`:''}
        </td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="7">Indent ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>
    <div id="indentPreviewWrap"></div>`;
}

function updateIndentTotal(){
  let total=0;
  (DB.foodItems||[]).forEach(f=>{
    const qty=Number(document.getElementById('ind_'+f.id)?.value||0);
    total+=qty*f.rate;
  });
  const el=document.getElementById('indentTotal'); if(el) el.textContent='₹'+total.toFixed(2);
}

function saveAndSendIndent(){
  initFoodItemsFixed();
  const indentType=document.getElementById('fi_type').value;
  const date=document.getElementById('fi_date').value;
  const purpose=document.getElementById('fi_purpose').value;
  const stuCount=Number(document.getElementById('fi_stu').value||0);
  const part=document.getElementById('fi_part').value;
  const items=[]; let totalAmt=0;
  (DB.foodItems||[]).filter(f=>f.group===part).forEach(f=>{
    const qty=Number(document.getElementById('ind_'+f.id)?.value||0);
    if(qty>0){ items.push({itemId:f.id, kn:f.kn, en:f.en, group:f.group, unit:f.unit, qty, rate:f.rate, amt:qty*f.rate}); totalAmt+=qty*f.rate; }
  });
  if(!items.length){ showToast('⚠ ಕನಿಷ್ಠ ಒಂದು ಪದಾರ್ಥದ ಪ್ರಮಾಣ ನಮೂದಿಸಿ'); return; }
  if(!DB.foodIndents) DB.foodIndents=[];
  const indent={
    id:uid(), indentType, date, purpose, stuCount, part, items, totalAmt,
    createdBy:CURRENT_USER.name, createdAt:todayStr(),
    status:'Sent to Principal',
    principalApproved:false, principalAt:null, principalName:null,
    principalRemarks:''
  };
  DB.foodIndents.push(indent); saveDB();
  const p=STAFF.find(x=>x.role==='principal');
  if(p) pushNotification(p.name,'📋 ಆಹಾರ Indent Approval: ಭಾಗ '+part+' — '+(indentType==='daily'?'ದೈನಂದಿನ':'ಮಾಸಿಕ')+' ('+fmtDate(date)+') — ₹'+totalAmt.toFixed(0)+' — Principal Approval ಅಗತ್ಯ');
  showToast('✅ ಭಾಗ '+part+' Indent ತಯಾರಾಗಿದೆ → Principal Approval ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
  navigate('foodindent');
}

function viewIndent(id){
  const ind=(DB.foodIndents||[]).find(x=>x.id===id); if(!ind) return;
  const months=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];

  // Group items
  const grpA=ind.items.filter(x=>x.group==='A');
  const grpB=ind.items.filter(x=>x.group==='B');
  const grpC=ind.items.filter(x=>x.group==='C');

  function renderGroup(items,label){
    if(!items.length) return '';
    return `<tr><td colspan="5" style="background:#e7eef5;font-weight:800;padding:5px 8px;">${label}</td></tr>
    ${items.map((f,i)=>`<tr>
      <td>${i+1}</td><td style="font-family:var(--font-kn);">${esc(f.kn)}</td>
      <td style="text-align:right;">${f.qty} ${esc(f.unit)}</td>
      <td style="text-align:right;">₹${f.rate}</td>
      <td style="text-align:right;font-weight:700;">₹${f.amt.toFixed(2)}</td>
    </tr>`).join('')}`;
  }

  const html=`<div class="letterhead-paper" style="font-size:12px;">
    <div class="lh-top">
            <div class="lh-org">
        <div class="l1">ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)</div>
        ಶೇಡಬರಿ, ಹೆಬಳೆ, ಭಟ್ಕಳ, ಉತ್ತರ ಕನ್ನಡ – 581320
      </div>
    </div>
    <div style="text-align:center;font-size:15px;font-weight:800;margin:8px 0;">${ind.indentType==='daily'?'ದೈನಂದಿನ':'ಮಾಸಿಕ'} ಆಹಾರ ಇಂಡೆಂಟ್</div>
    <table style="width:100%;font-size:11px;border-collapse:collapse;margin-bottom:8px;">
      <tr><td style="padding:3px 8px;border:1px solid #ccc;font-weight:700;">ದಿನಾಂಕ</td><td style="padding:3px 8px;border:1px solid #ccc;">${fmtDate(ind.date)}</td>
          <td style="padding:3px 8px;border:1px solid #ccc;font-weight:700;">ಉದ್ದೇಶ</td><td style="padding:3px 8px;border:1px solid #ccc;">${esc(ind.purpose||'—')}</td></tr>
      <tr><td style="padding:3px 8px;border:1px solid #ccc;font-weight:700;">ವಿದ್ಯಾರ್ಥಿ ಸಂಖ್ಯೆ</td><td style="padding:3px 8px;border:1px solid #ccc;">${ind.stuCount}</td>
          <td style="padding:3px 8px;border:1px solid #ccc;font-weight:700;">ತಯಾರಿಸಿದ ವ್ಯಕ್ತಿ</td><td style="padding:3px 8px;border:1px solid #ccc;">${esc(ind.createdBy)}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:#1a3a5c;color:#fff;">
        <th style="padding:4px 6px;">#</th>
        <th style="padding:4px 6px;text-align:left;">ಪದಾರ್ಥ</th>
        <th style="padding:4px 6px;text-align:right;">ಬೇಕಾದ ಪ್ರಮಾಣ</th>
        <th style="padding:4px 6px;text-align:right;">ದರ (₹)</th>
        <th style="padding:4px 6px;text-align:right;">ಮೊತ್ತ (₹)</th>
      </tr></thead>
      <tbody>
        ${renderGroup(grpA,'ಗೂಪ್ A — ಮುಖ್ಯ ಆಹಾರ ಪದಾರ್ಥಗಳು')}
        ${renderGroup(grpB,'ಗೂಪ್ B — ತರಕಾರಿ & ಇತರ')}
        ${renderGroup(grpC,'ಗೂಪ್ C — ಅಕ್ಕಿ / ಗ್ಯಾಸ್')}
        <tr style="font-weight:900;background:#f0f0f0;">
          <td colspan="4" style="padding:5px 8px;text-align:right;">ಒಟ್ಟು ಅಂದಾಜು ಮೊತ್ತ</td>
          <td style="padding:5px 8px;text-align:right;">₹${Number(ind.totalAmt||0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    ${ind.principalApproved?`<div style="color:green;font-size:11px;margin-top:6px;">✅ Principal Approved: ${esc(ind.principalName)} (${fmtDate(ind.principalAt)}) ${ind.principalRemarks?'— '+esc(ind.principalRemarks):''}</div>`:''}
    <div style="display:flex;justify-content:space-between;margin-top:28px;font-size:12px;">
      <div style="text-align:center;"><div style="margin-bottom:24px;"></div><div style="border-top:1px solid #000;padding-top:4px;">ವಾರ್ಡನ್ (ಪ್ರಭಾರ) ಸಹಿ</div></div>
      <div style="text-align:right;">${typeof PRINCIPAL_SIGN!=='undefined'?`<div style="height:34px;"></div><div style="border-top:1.5px solid #000;padding-top:4px;font-size:10px;font-family:var(--font-kn);text-align:right;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ | MDRS Bhatkal</div>`:`<div style="margin-bottom:40px;border-top:1.5px solid #000;padding-top:4px;font-size:11px;">ಪ್ರಾಂಶುಪಾಲರ ಸಹಿ</div>`}</div>
    </div>
  </div>`;

  const wrap=document.getElementById('indentPreviewWrap')||document.getElementById('content');
  wrap.innerHTML=`<div class="panel" id="printArea">
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Print</button>
      ${ind.status==='Sent to Principal'&&CURRENT_USER.role==='principal'?`<button class="btn btn-primary" onclick="approveIndent('${ind.id}')">✅ Approve</button>`:''}
      <button class="btn btn-outline" onclick="navigate(CURRENT_PAGE)">✕</button>
    </div>
    ${html}
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function printIndent(id){ viewIndent(id); setTimeout(()=>window.print(),500); }

function approveIndent(id){
  const ind=(DB.foodIndents||[]).find(x=>x.id===id); if(!ind) return;
  const remarks=prompt('ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ):')||'';
  ind.status='Approved'; ind.principalApproved=true; ind.principalAt=todayStr();
  ind.principalName=CURRENT_USER.name; ind.principalRemarks=remarks;
  saveDB();
  pushNotification(ind.createdBy,'✅ Indent Approved: '+fmtDate(ind.date)+' — ₹'+Number(ind.totalAmt||0).toFixed(0));
  showToast('✅ Indent Approved'); navigate('foodindent');
}

;(window.__LOADED=window.__LOADED||[]).push('warden');
