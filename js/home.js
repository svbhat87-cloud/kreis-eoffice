/* =====================================================================
   KREIS e-Office v35 — home.js
   ಮುಖಪುಟ — Public home page, marks verification, contact form
   ===================================================================== */
function homeNav(section,el){
  CURRENT_HOME_SECTION=section;
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const main=document.getElementById('homeMain');
  if(section==='home'){
    main.querySelector('.home-hero').style.display='';
    const ph=main.querySelector('.placeholder-panel'); if(ph) ph.remove();
    return;
  }
  main.querySelector('.home-hero').style.display='none';
  let ph=main.querySelector('.placeholder-panel');
  let html='';
  if(section==='downloads'){
    const files=(DB.downloads||[]).filter(f=>!f.deleted&&(f.category==='downloads'||f.category==='notices'));
    html=`<div class="placeholder-panel">${sitePageBlocksHTML('downloads')}<div class="panel"><h3>⬇ Downloads & Notices</h3>
      ${files.length?`<div class="table-wrap"><table><thead><tr><th>ಶೀರ್ಷಿಕೆ</th><th>ವಿಭಾಗ</th><th>ದಿನಾಂಕ</th><th>Download</th></tr></thead>
      <tbody>${files.map(f=>`<tr><td><b>${esc(f.title)}</b><br><span class="small-muted">${esc(f.desc||'')}</span></td>
        <td><span class="badge badge-info">${esc(f.category)}</span></td><td>${fmtDate(f.uploadedAt)}</td>
        <td><button class="btn btn-sm btn-gold" onclick="downloadUploadedFile('${f.id}')">⬇ Download</button></td>
      </tr>`).join('')}</tbody></table></div>`:
      `<p class="small-muted">ಈ ವಿಭಾಗಕ್ಕೆ ಯಾವ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.</p>`}
    </div>
    <div class="panel"><h3>📢 ಸೂಚನೆ / ಸುತ್ತೋಲೆಗಳು (Notices & Circulars)</h3>
      ${(DB.downloads||[]).filter(f=>!f.deleted&&f.category==='notices').length?
        (DB.downloads||[]).filter(f=>!f.deleted&&f.category==='notices').map(f=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <div><b>${esc(f.title)}</b><br><span class="small-muted">${fmtDate(f.uploadedAt)} · ${esc(f.desc||'')}</span></div>
          <button class="btn btn-sm btn-gold" onclick="downloadUploadedFile('${f.id}')">⬇</button>
        </div>`).join('')
        :`<p class="small-muted">ಯಾವ ಸೂಚನೆ ಇಲ್ಲ.</p>`}
    </div></div>`;
  } else if(section==='gallery'){
    const imgs=(DB.downloads||[]).filter(f=>!f.deleted&&f.category==='gallery');
    html=`<div class="placeholder-panel"><div class="panel"><h3>📸 ಫೋಟೋ ಗ್ಯಾಲರಿ</h3>
      ${imgs.length?`<div class="gal-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${imgs.map(f=>`<div style="border-radius:8px;overflow:hidden;border:1px solid var(--border);">
          <img class="gal-img" src="${f.fileData}" style="width:100%;height:160px;object-fit:cover;" alt="${esc(f.title)}">
          <div style="padding:8px;font-size:12px;font-weight:700;">${esc(f.title)}</div>
        </div>`).join('')}
      </div>`:
      `<p class="small-muted">ಯಾವ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.</p>`}
    </div></div>`;
  } else if(section==='academics'){
    const files=(DB.downloads||[]).filter(f=>!f.deleted&&f.category==='academics');
    html=`<div class="placeholder-panel">${sitePageBlocksHTML('academics')}<div class="panel"><h3>📚 ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ</h3>
      ${files.length?files.map(siteFileRow).join(''):
      `<p class="small-muted">ಈ ವಿಭಾಗಕ್ಕೆ ಇನ್ನೂ ಮಾಹಿತಿ ಸೇರಿಸಲಾಗಿಲ್ಲ.</p>`}
    </div></div>`;
  } else if(section==='facilities'){
    const files=(DB.downloads||[]).filter(f=>!f.deleted&&f.category==='facilities');
    html=`<div class="placeholder-panel">${sitePageBlocksHTML('facilities')}<div class="panel"><h3>🏫 ಸೌಲಭ್ಯಗಳು</h3>
      ${files.length?files.map(siteFileRow).join(''):
      `<p class="small-muted">ಈ ವಿಭಾಗಕ್ಕೆ ಮಾಹಿತಿ ಶೀಘ್ರದಲ್ಲೇ ಸೇರಿಸಲಾಗುವುದು.</p>`}
    </div></div>`;
  } else {
    const titles={about:'🏛 About Us',students:'👨‍🎓 Student Info'};
    const files=(DB.downloads||[]).filter(f=>!f.deleted&&(f.category===section||f.category==='students'));
    const _blocks=sitePageBlocksHTML(section);
    html=`<div class="placeholder-panel">${_blocks}<div class="panel" ${(_blocks&&!files.length)?'style="display:none"':''}><h3>${_blocks?'⬇ ಸಂಬಂಧಿತ ಫೈಲ್‌ಗಳು':(titles[section]||section)}</h3>
      ${section==='marksverify'?`<div id="marksVerifySection"></div>`:
        (files.length?files.map(siteFileRow).join('') :
        `<p class="small-muted">ಈ ವಿಭಾಗದ ವಿಷಯವನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಸೇರಿಸಲಾಗುವುದು.<br>Content for this section will be added soon.</p>`)}
    </div></div>`;
  }
  if(ph) ph.outerHTML=html; else main.insertAdjacentHTML('beforeend', html);
  if(section==='marksverify') renderMarksVerification();
}

function openContactModal(){ document.getElementById('contactModalBg').classList.add('show'); }

function closeContactModal(){ document.getElementById('contactModalBg').classList.remove('show'); }

function contactFileChosen(el){
  const f=el.files&&el.files[0], info=document.getElementById('ct_fileinfo'); if(!info) return;
  if(!f){ info.textContent=''; return; }
  const ok=/\.(pdf|jpe?g|png)$/i.test(f.name)&&/^(application\/pdf|image\/jpeg|image\/png)$/.test(f.type||'application/pdf');
  if(!ok){ el.value=''; info.textContent=''; showToast('⚠ PDF ಅಥವಾ JPG/PNG ಫೈಲ್ ಮಾತ್ರ ಅನುಮತಿ'); return; }
  if(f.size>3*1024*1024){ el.value=''; info.textContent=''; showToast('⚠ ಫೈಲ್ 3 MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು'); return; }
  info.textContent='✅ '+f.name+' ('+Math.max(1,Math.round(f.size/1024))+' KB)';
}
function submitContactEnquiry(){
  const name=document.getElementById('ct_name').value, email=document.getElementById('ct_email').value, msg=document.getElementById('ct_msg').value;
  const fileEl=document.getElementById('ct_file'), file=fileEl&&fileEl.files&&fileEl.files[0];
  const done=(fileData,fileName,fileType)=>{
    DB.inward.push({id:uid(), inwardNo:'IN-'+nextSeq('inward'), ackNo:'ACK-'+nextSeq('ack'), receivedDate:todayStr(), sentFromOffice:'ಸಾರ್ವಜನಿಕ ವಿಚಾರಣೆ (Public Enquiry - Website)', letterNo:'', letterDate:todayStr(), subject:(msg||(fileName?'Letter / application uploaded from website':'Website enquiry'))+(name?(' — from '+name):'')+(email?(' ('+email+')'):''), attachments:fileName||'', fileData:fileData||null, fileName:fileName||null, fileType:fileType||null, status:'Draft', createdBy:'Website', createdAt:todayStr(), history:[{status:'Draft', by:'Website', at:todayStr()}]});
    saveDB();
    ['ct_name','ct_email','ct_msg','ct_file'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
    const inf=document.getElementById('ct_fileinfo'); if(inf) inf.textContent='';
    const btn=document.getElementById('ct_sendbtn'); if(btn) btn.disabled=false;
    closeContactModal();
    showToast('✅ ಕಳುಹಿಸಲಾಗಿದೆ — FDA Inward Register ನಲ್ಲಿ ಸ್ವೀಕರಿಸಲಾಗುವುದು');
  };
  if(!msg.trim()&&!file&&!name.trim()&&!email.trim()){ showToast('⚠ ಸಂದೇಶ ಬರೆಯಿರಿ ಅಥವಾ ಫೈಲ್ ಲಗತ್ತಿಸಿ'); return; }
  if(file){
    if(file.size>3*1024*1024){ showToast('⚠ ಫೈಲ್ 3 MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು'); return; }
    const btn=document.getElementById('ct_sendbtn'); if(btn) btn.disabled=true;
    const r=new FileReader();
    r.onload=e=>done(e.target.result,file.name,file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'image/jpeg'));
    r.onerror=()=>{ if(btn) btn.disabled=false; showToast('⚠ ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ'); };
    r.readAsDataURL(file);
  } else done(null,null,null);
}

/* doVerify / checkURLVerification now live in certimport.js */

function genCertNo(type){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const seq = String(nextSeq('cert_'+type)).padStart(4,'0');
  return `${y}${m}${d}${seq}`;
}


;(window.__LOADED=window.__LOADED||[]).push('home');
