/* =====================================================================
   KREIS e-Office v35 — fda.js
   FDA — FDA dashboard and FDA-only screens
   ===================================================================== */
function dashCardsFDA(ctx){
  const {pendingInward,pendingBills,pendingMsgs,myMovements}=ctx;
  let cards='';

    cards+=statCard(DB.students.length,'ವಿದ್ಯಾರ್ಥಿಗಳು');
    cards+=statCard(DB.inward.length,'ಒಳಬರುವ ಪತ್ರಗಳು');
    cards+=statCard(DB.outward.length,'ಹೊರಹೋಗುವ ಪತ್ರಗಳು');
    cards+=statCard(DB.bills.length,'ಒಟ್ಟು ಬಿಲ್‌ಗಳು');
  

    const qpPending=DB.questionPapers.filter(q=>q.status==='Print Requested').length;
    if(qpPending) cards+=statCard(qpPending,'🖨️ QP ಮುದ್ರಣ ಬಾಕಿ');
  
  return cards;
}


/* =====================================================================
   Website pages — NIC-style content written by FDA / Principal
   Data: DB.sitePageBlocks = [{id,section,title,html,order,by,at}]
   ===================================================================== */
const SITE_SECTIONS={about:'🏛 ನಮ್ಮ ಬಗ್ಗೆ (About Us)',academics:'📖 ಶೈಕ್ಷಣಿಕ (Academics)',facilities:'🏢 ಸೌಲಭ್ಯಗಳು (Facilities)',students:'👨‍🎓 ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ',downloads:'⬇ ಡೌನ್‌ಲೋಡ್ / ಸೂಚನೆಗಳು'};
let SITE_SEC='about', SITE_EDIT=null;
function siteClean(html,noAlign){
  const ALLOW={P:1,BR:1,B:1,STRONG:1,I:1,EM:1,U:1,H2:1,H3:1,H4:1,UL:1,OL:1,LI:1,A:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TH:1,TD:1,DIV:1,SPAN:1,BLOCKQUOTE:1,HR:1,SUB:1,SUP:1};
  const doc=new DOMParser().parseFromString('<body>'+String(html||'')+'</body>','text/html');
  (function walk(n){
    Array.from(n.childNodes).forEach(c=>{
      if(c.nodeType===3) return;
      if(c.nodeType!==1){ c.remove(); return; }
      if(!ALLOW[c.tagName]){
        if(/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|FORM|INPUT|BUTTON|SVG|IMG|VIDEO|AUDIO)$/.test(c.tagName)){ c.remove(); return; }
        walk(c); while(c.firstChild) n.insertBefore(c.firstChild,c); c.remove(); return;
      }
      Array.from(c.attributes).forEach(at=>{
        const nm=at.name.toLowerCase();
        if(c.tagName==='A'&&nm==='href'){ if(!/^(https?:|mailto:|tel:)/i.test(at.value.trim())) c.removeAttribute('href'); }
        else if(nm==='style'){ const m=/text-align\s*:\s*(left|center|right|justify)/i.exec(at.value); c.removeAttribute('style'); if(m&&!noAlign) c.setAttribute('style','text-align:'+m[1].toLowerCase()); }
        else if(c.tagName==='A'&&nm==='target'){}
        else if((c.tagName==='TD'||c.tagName==='TH')&&(nm==='colspan'||nm==='rowspan')){}
        else c.removeAttribute(at.name);
      });
      if(c.tagName==='A'){ c.setAttribute('target','_blank'); c.setAttribute('rel','noopener noreferrer'); }
      walk(c);
    });
  })(doc.body);
  return doc.body.innerHTML;
}
function siteCss(){ return `<style>.placeholder-panel .site-page-block{text-align:left;padding:26px 36px 22px;background:#fff;border:1px solid #d3dbe6;border-top:3px solid var(--navy);border-radius:6px;box-shadow:0 1px 4px rgba(15,35,65,.07)}
.site-page-block>h3{text-align:left;color:var(--navy);font-size:19px;letter-spacing:0}
.site-rich{text-align:left;color:#1f2a3a}.site-rich p{text-align:justify;margin:0 0 13px}.site-rich li{text-align:justify;margin-bottom:5px}
.site-rich h3,.site-rich h4{text-align:left;color:var(--navy);font-size:17px;margin:20px 0 9px;padding-left:10px;border-left:4px solid var(--gold)}
.site-rich h4{font-size:15.5px}
@media(max-width:640px){.placeholder-panel .site-page-block{padding:18px 16px}.site-rich p,.site-rich li{text-align:left}}
.site-rich table{border-collapse:collapse;width:100%;margin:10px 0}.site-rich th,.site-rich td{border:1px solid #c8cdd6;padding:6px 9px;text-align:left;vertical-align:top}.site-rich th{background:#eef2f8}.site-rich ul,.site-rich ol{margin:8px 0 8px 22px}.site-rich h3,.site-rich h4{margin:12px 0 6px}.site-rich a{color:#0b3d91;text-decoration:underline}</style>`; }
function sitePageBlocksHTML(section){
  const list=(DB.sitePageBlocks||[]).filter(b=>b.section===section).sort((a,b)=>(a.order||0)-(b.order||0));
  if(!list.length) return '';
  return list.map(b=>`<div class="panel site-page-block" style="margin-bottom:14px;">
    ${b.title?`<h3 style="margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid var(--gold);font-family:var(--font-kn);">${esc(b.title)}</h3>`:''}
    <div class="site-rich" style="font-family:var(--font-kn);font-size:14.5px;line-height:1.75;">${siteClean(b.html)}</div></div>`).join('')
    +siteCss();
}

function siteIsImg(f){ return /^image\//.test(f.fileType||'')||/\.(jpe?g|png)$/i.test(f.fileName||''); }
function siteFileRow(f){
  const img=siteIsImg(f)&&f.fileData;
  return `<div style="border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:10px;background:#fff;text-align:left;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
      <div><b>${esc(f.title)}</b><br><span class="small-muted">${fmtDate(f.uploadedAt)}${f.desc?' · '+esc(f.desc):''}</span></div>
      <div style="display:flex;gap:6px;"><button class="btn btn-sm btn-outline" onclick="siteOpenFile('${f.id}')">👁 View</button><button class="btn btn-sm btn-gold" onclick="downloadUploadedFile('${f.id}')">⬇</button></div>
    </div>
    ${img?`<img src="${f.fileData}" alt="${esc(f.title)}" onclick="siteOpenFile('${f.id}')" style="display:block;max-width:100%;max-height:460px;margin:10px auto 0;border:1px solid var(--border);border-radius:6px;cursor:zoom-in;">`:''}
  </div>`;
}
function siteOpenFile(id){
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f||!f.fileData) return;
  try{
    const m=/^data:([^;,]+)[^,]*;base64,(.*)$/.exec(f.fileData); if(!m){ window.open(f.fileData,'_blank'); return; }
    const bin=atob(m[2]); const u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([u8],{type:m[1]})),'_blank');
  }catch(e){ console.warn(e); downloadUploadedFile(id); }
}
function siteUploadFile(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const title=document.getElementById('spf_title').value.trim(), desc=document.getElementById('spf_desc').value.trim();
  const file=document.getElementById('spf_file').files[0];
  if(!title||!file){ showToast('⚠ ಶೀರ್ಷಿಕೆ ಮತ್ತು ಫೈಲ್ ಅಗತ್ಯ'); return; }
  if(!/\.(pdf|jpe?g|png)$/i.test(file.name)){ showToast('⚠ PDF ಅಥವಾ JPG/PNG ಮಾತ್ರ'); return; }
  if(file.size>3*1024*1024){ showToast('⚠ ಫೈಲ್ 3 MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು'); return; }
  const r=new FileReader();
  r.onload=e=>{
    if(!DB.downloads) DB.downloads=[];
    DB.downloads.push({id:uid(),category:SITE_SEC,title,desc,fileName:file.name,fileData:e.target.result,fileType:file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'image/jpeg'),uploadedBy:CURRENT_USER.name,uploadedAt:todayStr(),deleted:false});
    logAudit('Create','Upload',SITE_SEC,title); saveDB(); showToast('✅ ಅಪ್‌ಲೋಡ್ ಆಯಿತು — ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ'); renderSiteContent();
  };
  r.readAsDataURL(file);
}
function siteDeleteFile(id){
  if(!confirm('ಈ ಫೈಲ್ ಅನ್ನು ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ತೆಗೆಯುವುದೇ? (Recycle Bin ಗೆ ಹೋಗುತ್ತದೆ)')) return;
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  f.deleted=true; f.deletedAt=todayStr(); logAudit('Delete','Upload',id,f.title); saveDB(); renderSiteContent();
}

function renderSiteContent(){
  if(!DB.sitePageBlocks) DB.sitePageBlocks=[];
  const cnt=k=>DB.sitePageBlocks.filter(b=>b.section===k).length;
  const list=DB.sitePageBlocks.filter(b=>b.section===SITE_SEC).sort((a,b)=>(a.order||0)-(b.order||0));
  const ed=SITE_EDIT?(list.find(x=>x.id===SITE_EDIT)||null):null;
  const tb=(cmd,label,arg)=>`<button type="button" class="btn btn-sm btn-outline" onmousedown="event.preventDefault()" onclick="siteCmd('${cmd}'${arg?`,'${arg}'`:''})">${label}</button>`;
  document.getElementById('content').innerHTML=siteCss()+`
    <div class="page-head"><h2>📝 ವೆಬ್‌ಸೈಟ್ ವಿಷಯ ಬರೆಯಿರಿ (Website Pages)</h2>
    <div class="desc">ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್‌ನ ಪುಟಗಳಿಗೆ NIC ವೆಬ್‌ಸೈಟ್‌ಗಳಂತೆ ವಿಷಯ ಬರೆಯಿರಿ — ಶೀರ್ಷಿಕೆ, ಪ್ಯಾರಾಗ್ರಾಫ್, ಪಟ್ಟಿ, ಟೇಬಲ್, ಲಿಂಕ್. ಉಳಿಸಿದ ತಕ್ಷಣ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.</div></div>
    <div class="panel"><div style="display:flex;gap:6px;flex-wrap:wrap;">${Object.entries(SITE_SECTIONS).map(([k,v])=>`<button class="btn ${k===SITE_SEC?'btn-primary':'btn-outline'}" onclick="SITE_SEC='${k}';SITE_EDIT=null;renderSiteContent()">${v}${(cnt(k)?' ('+cnt(k)+')':'')}</button>`).join('')}</div></div>
    <div class="panel"><h3>${ed?'✏️ ಸಂಪಾದಿಸಿ':'➕ ಹೊಸ ವಿಭಾಗ ಸೇರಿಸಿ'} — ${SITE_SECTIONS[SITE_SEC]}</h3>
      <div class="field" style="margin-bottom:8px;"><label>ಶೀರ್ಷಿಕೆ (Heading)</label><input id="sp_title" value="${esc(ed?ed.title:'')}" placeholder="ಉದಾ: ಶಾಲೆಯ ಪರಿಚಯ, ದೃಷ್ಟಿ ಮತ್ತು ಧ್ಯೇಯ"></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;padding:6px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;">
        ${tb('bold','<b>B</b>')}${tb('italic','<i>I</i>')}${tb('underline','<u>U</u>')}
        ${tb('formatBlock','ಉಪಶೀರ್ಷಿಕೆ','H3')}${tb('formatBlock','ಪ್ಯಾರಾ','P')}
        ${tb('insertUnorderedList','• ಪಟ್ಟಿ')}${tb('insertOrderedList','1. ಪಟ್ಟಿ')}
        ${tb('justifyLeft','⯇')}${tb('justifyCenter','≡')}${tb('justifyFull','☰')}
        <button type="button" class="btn btn-sm btn-outline" onmousedown="event.preventDefault()" onclick="siteLink()">🔗 ಲಿಂಕ್</button>
        <button type="button" class="btn btn-sm btn-outline" onmousedown="event.preventDefault()" onclick="siteTable()">▦ ಟೇಬಲ್</button>
        ${tb('removeFormat','⌫ ಫಾರ್ಮ್ಯಾಟ್ ತೆಗೆ')}${tb('undo','↶')}${tb('redo','↷')}
      </div>
      <div id="sp_body" contenteditable="true" onpaste="sitePaste(event)" class="site-rich" style="min-height:240px;max-height:520px;overflow:auto;padding:12px 16px;border:1.5px solid var(--border);border-radius:8px;background:#fff;font-family:var(--font-kn);font-size:14.5px;line-height:1.75;">${ed?siteClean(ed.html):''}</div>
      <div class="field" style="margin-top:8px;max-width:160px;"><label>ಕ್ರಮ ಸಂಖ್ಯೆ (Order)</label><input id="sp_order" type="number" value="${ed?(ed.order||0):(list.length+1)}"></div>
      <div class="form-actions" style="margin-top:10px;"><button class="btn btn-primary" onclick="siteSave()">💾 ಉಳಿಸಿ</button>${ed?`<button class="btn btn-outline" onclick="SITE_EDIT=null;renderSiteContent()">ರದ್ದು</button>`:''}
      <span class="small-muted" style="margin-left:8px;">ಚಿತ್ರ/PDF ಗಳಿಗೆ ಕೆಳಗಿನ "ಅಪ್‌ಲೋಡ್" ಭಾಗ ಬಳಸಿ.</span></div>
    </div>
    <div class="panel"><h3>📎 ಈ ಪುಟಕ್ಕೆ PDF / ಚಿತ್ರ (JPG, PNG) ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ${SITE_SECTIONS[SITE_SEC]}</h3>
      <div class="form-grid">
        <div class="field"><label>ಶೀರ್ಷಿಕೆ</label><input id="spf_title" placeholder="ಉದಾ: SSLC ಫಲಿತಾಂಶ 2026"></div>
        <div class="field"><label>ವಿವರಣೆ (ಐಚ್ಛಿಕ)</label><input id="spf_desc"></div>
        <div class="field"><label>ಫೈಲ್ (PDF / JPG / PNG, ಗರಿಷ್ಠ 3 MB)</label><input type="file" id="spf_file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;width:100%;"></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="siteUploadFile()">📤 ಅಪ್‌ಲೋಡ್</button></div>
      ${(()=>{ const cat=SITE_SEC; const fs=(DB.downloads||[]).filter(f=>!f.deleted&&f.category===cat); return fs.length?`<div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>ಶೀರ್ಷಿಕೆ</th><th>ಫೈಲ್</th><th>ದಿನಾಂಕ</th><th>Action</th></tr></thead><tbody>${fs.slice().reverse().map(f=>`<tr><td><b>${esc(f.title)}</b><br><span class="small-muted">${esc(f.desc||'')}</span></td><td>${esc(f.fileName||'')}</td><td>${fmtDate(f.uploadedAt)}</td><td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="siteOpenFile('${f.id}')">👁</button><button class="btn btn-sm btn-outline" onclick="siteDeleteFile('${f.id}')">🗑</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="small-muted" style="margin-top:8px;">ಈ ಪುಟಕ್ಕೆ ಇನ್ನೂ ಯಾವುದೇ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.</p>'; })()}
    </div>
    <div class="panel"><h3>📋 ಈ ಪುಟದ ವಿಭಾಗಗಳು (${list.length})</h3>
      ${list.length?`<div class="table-wrap"><table><thead><tr><th>ಕ್ರಮ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಕೊನೆಯ ಬದಲಾವಣೆ</th><th>Action</th></tr></thead><tbody>${list.map(b=>`<tr><td>${b.order||0}</td><td><b>${esc(b.title||'(ಶೀರ್ಷಿಕೆ ಇಲ್ಲ)')}</b></td><td style="font-size:11.5px;">${esc(b.by||'')} · ${b.at?fmtDate(b.at):''}</td>
        <td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="SITE_EDIT='${b.id}';renderSiteContent();window.scrollTo({top:0,behavior:'smooth'})">✏️ ಸಂಪಾದಿಸಿ</button><button class="btn btn-sm btn-outline" onclick="siteDelete('${b.id}')">🗑</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="small-muted">ಇನ್ನೂ ಯಾವುದೇ ವಿಷಯ ಬರೆದಿಲ್ಲ.</p>'}
    </div>`;
}
function siteCmd(cmd,arg){ const b=document.getElementById('sp_body'); if(!b) return; b.focus(); document.execCommand(cmd,false,arg||null); }
function siteLink(){
  const u=prompt('ಲಿಂಕ್ ವಿಳಾಸ (https://...):'); if(!u) return;
  if(!/^(https?:|mailto:|tel:)/i.test(u.trim())){ showToast('⚠ ಲಿಂಕ್ https:// ನಿಂದ ಪ್ರಾರಂಭವಾಗಬೇಕು'); return; }
  siteCmd('createLink',u.trim());
}
function siteTable(){
  const r=parseInt(prompt('ಸಾಲುಗಳ ಸಂಖ್ಯೆ (ಶೀರ್ಷಿಕೆ ಸಾಲು ಸೇರಿ):','3'),10), c=parseInt(prompt('ಕಾಲಮ್‌ಗಳ ಸಂಖ್ಯೆ:','3'),10);
  if(!(r>0&&c>0&&r<=30&&c<=8)) return;
  let h='<table><thead><tr>'+'<th>ಶೀರ್ಷಿಕೆ</th>'.repeat(c)+'</tr></thead><tbody>'+('<tr>'+'<td>&nbsp;</td>'.repeat(c)+'</tr>').repeat(Math.max(r-1,1))+'</tbody></table><p><br></p>';
  siteCmd('insertHTML',h);
}
function sitePaste(e){
  e.preventDefault();
  const cd=e.clipboardData||window.clipboardData; const html=cd.getData('text/html'), txt=cd.getData('text/plain');
  document.execCommand('insertHTML',false, html?siteClean(html,true):esc(txt).replace(/\n/g,'<br>'));
}
function siteSave(){
  if(!['fda','principal'].includes(CURRENT_USER.role)) return;
  const title=document.getElementById('sp_title').value.trim();
  const html=siteClean(document.getElementById('sp_body').innerHTML).trim();
  if(!title&&!html.replace(/<[^>]*>|&nbsp;|\s/g,'')){ showToast('⚠ ವಿಷಯ ಬರೆಯಿರಿ'); return; }
  const order=parseInt(document.getElementById('sp_order').value,10)||0;
  if(!DB.sitePageBlocks) DB.sitePageBlocks=[];
  let b=SITE_EDIT?DB.sitePageBlocks.find(x=>x.id===SITE_EDIT):null;
  if(b){ b.title=title; b.html=html; b.order=order; }
  else { b={id:uid(),section:SITE_SEC,title,html,order}; DB.sitePageBlocks.push(b); }
  b.by=CURRENT_USER.name; b.at=todayStr();
  logAudit(SITE_EDIT?'Edit':'Create','SitePage',b.id,SITE_SEC+' — '+title);
  SITE_EDIT=null; saveDB(); showToast('✅ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ'); renderSiteContent();
}
function siteDelete(id){
  if(!confirm('ಈ ವಿಭಾಗವನ್ನು ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ತೆಗೆಯುವುದೇ?')) return;
  DB.sitePageBlocks=(DB.sitePageBlocks||[]).filter(x=>x.id!==id);
  logAudit('Delete','SitePage',id,SITE_SEC); saveDB(); renderSiteContent();
}

function renderFDAUploads(){
  const showBin=document.getElementById('up_showbin')?.checked||false;
  const activeUploads=(DB.downloads||[]).filter(f=>!f.deleted);
  const binUploads=(DB.downloads||[]).filter(f=>f.deleted);
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📤 ಅಪ್‌ಲೋಡ್ ಕೇಂದ್ರ (Upload Centre)</h2>
    <div class="desc">FDA — Photos, Notices, Documents ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — Home Page ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ</div></div>

    <div class="panel"><h3>➕ ಹೊಸ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಿಭಾಗ (Category)</label>
          <select id="up_cat">
            <option value="gallery">📸 ಫೋಟೋ ಗ್ಯಾಲರಿ</option>
            <option value="notices">📢 ಸೂಚನೆ / ಸುತ್ತೋಲೆ</option>
            <option value="academics">📚 ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ</option>
            <option value="facilities">🏫 ಸೌಲಭ್ಯಗಳು</option>
            <option value="students">👨‍🎓 ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ</option>
            <option value="downloads">⬇ ಡೌನ್‌ಲೋಡ್ ವಿಭಾಗ</option>
          </select>
        </div>
        <div class="field"><label>ಶೀರ್ಷಿಕೆ (Title)</label><input id="up_title" placeholder="ಫೈಲ್ ಶೀರ್ಷಿಕೆ"></div>
        <div class="field"><label>ವಿವರಣೆ (Description)</label><input id="up_desc" placeholder="ಐಚ್ಛಿಕ ವಿವರಣೆ"></div>
        <div class="field"><label>ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ (PDF/Image/Excel)</label>
          <input type="file" id="up_file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
            style="padding:6px;border:1.5px solid var(--border);border-radius:8px;width:100%;">
        </div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="saveUpload()">📤 ಅಪ್‌ಲೋಡ್ ಮಾಡಿ</button></div>
    </div>

    <div class="panel"><h3>📋 ಅಪ್‌ಲೋಡ್ ಆದ ಫೈಲ್‌ಗಳು (${activeUploads.length})</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ವಿಭಾಗ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಫೈಲ್ ಹೆಸರು</th><th>ದಿನಾಂಕ</th><th>Action</th>
      </tr></thead>
      <tbody>${activeUploads.slice().reverse().map(f=>`<tr>
        <td><span class="badge badge-info">${esc(f.category)}</span></td>
        <td><b>${esc(f.title)}</b><br><span class="small-muted">${esc(f.desc||'')}</span></td>
        <td>${esc(f.fileName)}</td>
        <td>${fmtDate(f.uploadedAt)}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-gold" onclick="downloadUploadedFile('${f.id}')">⬇</button>
          <button class="btn btn-sm btn-outline" onclick="editUploadMeta('${f.id}')">✏️ Edit</button>
          <label class="btn btn-sm btn-outline" style="cursor:pointer;">🔄 Replace
            <input type="file" style="display:none;" onchange="replaceUploadFile('${f.id}',this)">
          </label>
          <button class="btn btn-sm btn-red" onclick="deleteUpload('${f.id}')">🗑</button>
        </td>
      </tr>`).join('') || '<tr class="empty-row"><td colspan="5">ಯಾವ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಆಗಿಲ್ಲ.</td></tr>'}
      </tbody></table></div>
    </div>

    <div class="panel">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
        <input type="checkbox" id="up_showbin" ${showBin?'checked':''} onchange="renderFDAUploads()"> 🗑 Recycle Bin ತೋರಿಸಿ (${binUploads.length})
      </label>
      ${showBin?`<div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>ವಿಭಾಗ</th><th>ಶೀರ್ಷಿಕೆ</th><th>ಅಳಿಸಿದ ದಿನಾಂಕ</th><th>Action</th></tr></thead>
      <tbody>${binUploads.length?binUploads.map(f=>`<tr>
        <td><span class="badge badge-info">${esc(f.category)}</span></td>
        <td><b>${esc(f.title)}</b></td>
        <td style="font-size:11px;">${fmtDate(f.deletedAt)}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-primary" onclick="restoreUpload('${f.id}')">♻️ Restore</button>
          <button class="btn btn-sm btn-red" onclick="permanentlyDeleteUpload('${f.id}')">❌ ಶಾಶ್ವತ ಅಳಿಸಿ</button>
        </td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="4">Recycle Bin ಖಾಲಿ ಇದೆ.</td></tr>`}</tbody></table></div>`:''}
    </div>`;
}

function saveUpload(){
  const cat = document.getElementById('up_cat').value;
  const title = document.getElementById('up_title').value.trim();
  const desc = document.getElementById('up_desc').value.trim();
  const fileEl = document.getElementById('up_file');
  if(!title||!fileEl.files[0]){ showToast('⚠ ಶೀರ್ಷಿಕೆ ಮತ್ತು ಫೈಲ್ ಅಗತ್ಯ'); return; }
  const file = fileEl.files[0];
  const reader = new FileReader();
  reader.onload = e=>{
    if(!DB.downloads) DB.downloads=[];
    DB.downloads.push({
      id:uid(), category:cat, title, desc, fileName:file.name,
      fileData:e.target.result, fileType:file.type,
      uploadedBy:CURRENT_USER.name, uploadedAt:todayStr(), deleted:false
    });
    logAudit('Create','Upload',cat,title);
    saveDB(); showToast('✅ ಅಪ್‌ಲೋಡ್ ಆಯಿತು: '+file.name);
    navigate('fdauploads');
  };
  reader.readAsDataURL(file);
}

function deleteUpload(id){
  if(!confirm('🗑 Recycle Bin ಗೆ ಸ್ಥಳಾಂತರಿಸುವುದೇ?')) return;
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  f.deleted=true; f.deletedAt=todayStr();
  logAudit('Delete','Upload',id,f.title);
  saveDB(); navigate('fdauploads');
}

function restoreUpload(id){
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  f.deleted=false; f.deletedAt=null;
  logAudit('Edit','Upload',id,'Restored: '+f.title);
  saveDB(); showToast('♻️ Restore ಆಗಿದೆ'); navigate('fdauploads');
}

function permanentlyDeleteUpload(id){
  if(!confirm('⚠ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?')) return;
  const f=(DB.downloads||[]).find(x=>x.id===id);
  logAudit('Delete','Upload',id,'Permanently deleted: '+(f?.title||''));
  DB.downloads=(DB.downloads||[]).filter(x=>x.id!==id); saveDB(); navigate('fdauploads');
}

function editUploadMeta(id){
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  const newTitle=prompt('ಹೊಸ ಶೀರ್ಷಿಕೆ:', f.title);
  if(newTitle===null) return;
  const newDesc=prompt('ಹೊಸ ವಿವರಣೆ:', f.desc||'');
  if(newDesc===null) return;
  f.title=newTitle.trim()||f.title; f.desc=newDesc.trim();
  logAudit('Edit','Upload',id,'Meta edited: '+f.title);
  saveDB(); showToast('✅ Update ಆಗಿದೆ'); navigate('fdauploads');
}

function replaceUploadFile(id, inputEl){
  const file=inputEl.files[0]; if(!file) return;
  const f=(DB.downloads||[]).find(x=>x.id===id); if(!f) return;
  const reader=new FileReader();
  reader.onload=e=>{
    f.fileData=e.target.result; f.fileName=file.name; f.fileType=file.type;
    f.uploadedAt=todayStr(); f.uploadedBy=CURRENT_USER.name;
    logAudit('Edit','Upload',id,'File replaced: '+f.title);
    saveDB(); showToast('🔄 ಫೈಲ್ Replace ಆಗಿದೆ'); navigate('fdauploads');
  };
  reader.readAsDataURL(file);
}

function renderELUpdate(){
  const yr=todayStr().slice(0,4);
  const allStaff=STAFF.filter(s=>s.role!=='admin');
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📊 EL Balance Update (FDA)</h2>
    <div class="desc">Manual Register ನೋಡಿ ಪ್ರತಿ Staff ಗೆ EL (Earned Leave) Balance Update ಮಾಡಿ</div></div>
    <div class="note">EL Balance ನೀವು Manual Register ನಿಂದ ಇಲ್ಲಿ Enter ಮಾಡಿ — Staff ಅವರ Leave Balance ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.</div>
    <div class="panel"><h3>✏️ Staff EL Balance</h3>
    <div class="table-wrap"><table><thead><tr>
      <th>HRMS ID</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಪ್ರಸ್ತುತ EL Balance</th><th>ಹೊಸ Balance ನಮೂದಿಸಿ</th><th>Save</th>
    </tr></thead>
    <tbody>${allStaff.map(s=>{
      const cur=(DB.elBalances||{})[s.hrmsId]||30;
      return `<tr>
        <td style="font-size:11px;">${esc(s.hrmsId)}</td>
        <td><b>${esc(s.name)}</b></td>
        <td style="font-size:11px;">${esc(s.desig||'')}</td>
        <td><span class="badge badge-info">${cur} ದಿನ</span></td>
        <td><input type="number" id="el_${s.hrmsId}" value="${cur}" min="0" max="300" style="width:80px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;"></td>
        <td><button class="btn btn-sm btn-primary" onclick="saveELBalance('${s.hrmsId}','${esc(s.name)}')">✅ Save</button></td>
      </tr>`;
    }).join('')}
    </tbody></table></div>
    </div>`;
}

function saveELBalance(hrmsId, name){
  const val=document.getElementById('el_'+hrmsId)?.value;
  if(!val||isNaN(val)){ showToast('⚠ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'); return; }
  if(!DB.elBalances) DB.elBalances={};
  DB.elBalances[hrmsId]=Number(val);
  saveDB();
  pushNotification(name,'📊 EL Balance Update: '+val+' ದಿನ ('+todayStr()+')');
  showToast('✅ '+name+' EL Balance: '+val+' ದಿನ');
}

// ===== DSC (Digital Signature Certificate) signed copies — principal signs the PDF with the USB token in Adobe, then the signed PDF is attached here =====
const DSC_DOC_TYPES={mentororder:'ಮೆಂಟರ್ ಹಂಚಿಕೆ ಆದೇಶ',leave:'ರಜೆ ಪತ್ರ',tabill:'TA ಬಿಲ್',elapp:'EL ಅರ್ಜಿ',attreport:'ಮಾಸಿಕ ಹಾಜರಾತಿ ವಹಿ',cashbook:'ನಗದು ಪುಸ್ತಕ',inward:'ಒಳ ಬಂದ ಪತ್ರ (Inward)',outward:'ಹೊರ ಹೋದ ಪತ್ರ (Outward)',marks:'ಅಂಕ ಪತ್ರ / ಪ್ರಗತಿ ಪತ್ರಿಕೆ',cert:'ಪ್ರಮಾಣ ಪತ್ರ / TC',duty:'ಕರ್ತವ್ಯ ಆದೇಶ',other:'ಇತರೆ ದಾಖಲೆ'};
function dscFor(type,id){ return (DB.dscFiles||[]).filter(f=>f.docType===type&&f.docId===id).sort((a,b)=>(b.ts||0)-(a.ts||0)); }
function dscCanManage(){ return CURRENT_USER&&['principal','fda'].includes(CURRENT_USER.role); }
function dscBtns(type,id,title){
  const L=dscFor(type,id); let h='';
  if(L.length){ const f=L[0]; h+=`<button class="gv-b ok" title="${esc(f.fileName)} — ${esc(f.by)} ${esc(f.stamp||'')}" onclick="dscView('${f.id}')">DSC ಸಹಿ ಪ್ರತಿ</button>`; if(dscCanManage()) h+=`<button class="gv-b" onclick="dscRemove('${f.id}')">✕</button>`; }
  else if(dscCanManage()) h+=`<button class="gv-b" onclick="dscUpload('${type}','${id}','${esc(String(title||'').replace(/'/g,''))}')">DSC ಸಹಿ ಪ್ರತಿ ಸೇರಿಸಿ</button>`;
  return h;
}
function dscView(id){
  const f=(DB.dscFiles||[]).find(x=>x.id===id); if(!f) return;
  try{
    const b=atob(f.fileData.split(',')[1]), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([u],{type:'application/pdf'}));
    const w=window.open(url,'_blank'); if(!w){ const a=document.createElement('a'); a.href=url; a.download=f.fileName||'DSC_signed.pdf'; document.body.appendChild(a); a.click(); a.remove(); }
  }catch(e){ showToast('⚠ ಫೈಲ್ ತೆರೆಯಲಾಗಲಿಲ್ಲ'); }
}
function dscRemove(id){
  if(!dscCanManage()) return;
  if(!confirm('ಈ DSC ಸಹಿ ಪ್ರತಿಯನ್ನು ತೆಗೆಯುವುದೇ?')) return;
  DB.dscFiles=(DB.dscFiles||[]).filter(f=>f.id!==id); logAudit('Delete','DSCFile',id,''); saveDB();
  if(CURRENT_PAGE==='dscregister') renderDscRegister(); else navigate(CURRENT_PAGE);
}
function dscUpload(type,docId,title,after){
  if(!dscCanManage()){ showToast('⚠ ಪ್ರಾಂಶುಪಾಲರು / FDA ಮಾತ್ರ'); return; }
  const inp=document.createElement('input'); inp.type='file'; inp.accept='application/pdf,.pdf';
  inp.onchange=()=>{
    const file=inp.files&&inp.files[0]; if(!file) return;
    if(!/\.pdf$/i.test(file.name)){ showToast('⚠ PDF ಫೈಲ್ ಮಾತ್ರ'); return; }
    if(file.size>4*1024*1024){ showToast('⚠ ಫೈಲ್ 4 MB ಗಿಂತ ಕಡಿಮೆ ಇರಬೇಕು'); return; }
    const rd=new FileReader();
    rd.onload=async()=>{
      const data=String(rd.result);
      let raw=''; try{ raw=atob(data.split(',')[1]); }catch(e){}
      if(!/\/ByteRange/.test(raw)||!/\/Sig\b|\/Type\s*\/Sig/.test(raw)){ showToast('⚠ ಈ PDF ಯಲ್ಲಿ ಡಿಜಿಟಲ್ (DSC) ಸಹಿ ಕಂಡುಬಂದಿಲ್ಲ — Adobe ನಲ್ಲಿ ಸಹಿ ಮಾಡಿದ PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ'); return; }
      const ts=await getServerTimeStamp(); const stamp=ts&&ts.iso?taStampText(new Date(ts.iso)):taStampText(new Date());
      if(!DB.dscFiles) DB.dscFiles=[];
      DB.dscFiles.push({id:uid(),docType:type,docId:docId||'',title:title||'',fileName:file.name,fileData:data,size:file.size,by:CURRENT_USER.name,byRole:CURRENT_USER.role,stamp,ts:Date.now(),at:todayStr()});
      logAudit('Create','DSCFile',docId||type,file.name);
      saveDB(); showToast('✅ DSC ಸಹಿ ಪ್ರತಿ ಸೇರಿಸಲಾಗಿದೆ');
      if(after) after(); else if(CURRENT_PAGE==='dscregister') renderDscRegister(); else navigate(CURRENT_PAGE);
    };
    rd.readAsDataURL(file);
  };
  inp.click();
}
var DSC_FILTER='';
function dscRegUpload(){
  const type=document.getElementById('dsc_type')?.value||'other', title=document.getElementById('dsc_title')?.value?.trim()||'';
  if(!title){ showToast('⚠ ದಾಖಲೆಯ ಹೆಸರು / ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'); return; }
  dscUpload(type,'',title);
}
function renderDscRegister(){
  const list=(DB.dscFiles||[]).filter(f=>!DSC_FILTER||f.docType===DSC_FILTER).slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>DSC ಸಹಿ ಪ್ರತಿಗಳು (DSC Signed Copies)</h2>
    <div class="desc">ಪ್ರಾಂಶುಪಾಲರ DSC ಟೋಕನ್‌ನಿಂದ Adobe ನಲ್ಲಿ ಸಹಿ ಮಾಡಿದ PDF ಗಳು. ಬೇರೆ ಬೇರೆ ದಾಖಲೆಗಳ ಪಟ್ಟಿಯಲ್ಲಿಯೂ ಇದೇ ಸೌಲಭ್ಯ ಇದೆ.</div></div>
    <div class="panel"><h3>ಹೊಸ ಸಹಿ ಪ್ರತಿ ಸೇರಿಸಿ</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
        <div class="field" style="margin:0;"><label>ದಾಖಲೆ ಪ್ರಕಾರ</label><select id="dsc_type">${Object.entries(DSC_DOC_TYPES).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
        <div class="field" style="margin:0;flex:1;min-width:220px;"><label>ದಾಖಲೆಯ ಹೆಸರು / ಸಂಖ್ಯೆ</label><input id="dsc_title" placeholder="ಉದಾ: MENTOR/2026-27/6"></div>
        <button class="gv-b pri" onclick="dscRegUpload()">PDF ಆರಿಸಿ ಮತ್ತು ಸೇರಿಸಿ</button></div>
      <div class="note" style="font-size:12px;margin-top:8px;">DSC ಸಹಿ ಇಲ್ಲದ PDF ಅನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ. ಗರಿಷ್ಠ 4 MB.</div></div>
    <div class="panel"><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><b>ಸಹಿ ಪ್ರತಿಗಳು (${list.length})</b>
      <select onchange="DSC_FILTER=this.value;renderDscRegister()"><option value="">ಎಲ್ಲಾ ಪ್ರಕಾರ</option>${Object.entries(DSC_DOC_TYPES).map(([k,v])=>`<option value="${k}" ${DSC_FILTER===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಾಖಲೆ ಪ್ರಕಾರ</th><th>ಹೆಸರು / ಸಂಖ್ಯೆ</th><th>ಫೈಲ್</th><th>ಸೇರಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>ಕ್ರಮ</th></tr></thead><tbody>
      ${list.length?list.map((f,i)=>`<tr><td class="c">${i+1}</td><td>${esc(DSC_DOC_TYPES[f.docType]||f.docType)}</td><td>${esc(f.title||'—')}</td><td style="font-size:11px;">${esc(f.fileName)}</td><td>${esc(f.by)}</td><td class="c" style="font-size:11px;">${esc(f.stamp||fmtDate(f.at))}</td>
        <td class="c" style="white-space:nowrap;"><button class="gv-b" onclick="dscView('${f.id}')">ತೆರೆಯಿರಿ</button><button class="gv-b" onclick="dscRemove('${f.id}')">ತೆಗೆಯಿರಿ</button></td></tr>`).join(''):'<tr><td colspan="7" class="c" style="color:var(--muted);">ಇನ್ನೂ ಯಾವ DSC ಸಹಿ ಪ್ರತಿಯೂ ಇಲ್ಲ.</td></tr>'}
      </tbody></table></div>`;
}

// ===== Leave Register (CL / RH auto from principal-approved letters; EL / HPL updated by FDA) — NIC e-Office style =====
var LR_TAB='CL', LR_YEAR=null, LR_OPEN=null;
const LR_TYPES={
  CL:{full:'CL (Casual Leave)',name:'ಆಕಸ್ಮಿಕ ರಜೆ ನೋಂದಣಿ (CL Register)',def:15,auto:true},
  RH:{full:'RH (Restricted Holiday)',name:'ಪರಿಮಿತ ರಜೆ ನೋಂದಣಿ (RH Register)',def:2,auto:true},
  EL:{full:'EL (Earned Leave)',name:'ಗಳಿಕೆ ರಜೆ ನೋಂದಣಿ (EL Register)',def:0,auto:false},
  HPL:{full:'HPL (Half Pay Leave)',name:'ಅರ್ಧ ವೇತನ ರಜೆ ನೋಂದಣಿ (HPL Register)',def:0,auto:false}
};
function lrStaff(){ return STAFF.filter(s=>s.role!=='admin'); }
function lrYear(){ return String(LR_YEAR||new Date().getFullYear()); }
function lrOpening(type,year,h){
  const r=(DB.leaveRegOpen||[]).find(x=>x.id===type+'|'+year+'|'+h);
  if(r) return Number(r.opening)||0;
  if(type==='EL'&&DB.elBalances&&DB.elBalances[h]!=null) return Number(DB.elBalances[h])||0;
  return LR_TYPES[type].def;
}
function lrLedger(type,year,h){
  const T=LR_TYPES[type];
  if(T.auto){
    return (DB.leaveApplications||[]).filter(l=>l.hrmsId===h&&l.leaveType===T.full&&l.status==='Approved'&&(l.fromDate||'').startsWith(year))
      .map(l=>({auto:true,id:l.id,from:l.fromDate,to:l.toDate,days:Number(l.days)||0,ref:l.appNo||'',remarks:l.reason||'',by:l.principalName||'',at:l.principalSignedAt||''}))
      .sort((a,b)=>a.from.localeCompare(b.from));
  }
  return (DB.leaveRegEntries||[]).filter(e=>e.type===type&&e.year===year&&e.hrmsId===h)
    .map(e=>({auto:false,id:e.id,from:e.from,to:e.to,days:Number(e.days)||0,ref:e.ref||'',remarks:e.remarks||'',by:e.by||'',at:e.at||''}))
    .sort((a,b)=>a.from.localeCompare(b.from));
}
function lrRow(type,year,s){
  const led=lrLedger(type,year,s.hrmsId), op=lrOpening(type,year,s.hrmsId);
  const used=led.reduce((a,x)=>a+x.days,0);
  return {s,op,used,bal:op-used,led};
}
function lrSetTab(t){ LR_TAB=t; LR_OPEN=null; renderLeaveReport(); }
function lrSetYear(y){ LR_YEAR=y; LR_OPEN=null; renderLeaveReport(); }
function lrOpenStaff(h){ LR_OPEN=(LR_OPEN===h)?null:h; renderLeaveReport(); }
function lrSaveOpening(type,h){
  const v=document.getElementById('lr_op_'+h)?.value;
  if(v===''||isNaN(v)){ showToast('⚠ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'); return; }
  const year=lrYear(), id=type+'|'+year+'|'+h;
  if(!DB.leaveRegOpen) DB.leaveRegOpen=[];
  const r=DB.leaveRegOpen.find(x=>x.id===id);
  if(r){ r.opening=Number(v); r.by=CURRENT_USER.name; r.at=todayStr(); }
  else DB.leaveRegOpen.push({id,type,year,hrmsId:h,opening:Number(v),by:CURRENT_USER.name,at:todayStr()});
  if(type==='EL'){ if(!DB.elBalances) DB.elBalances={}; DB.elBalances[h]=Number(v); }
  logAudit('Update','LeaveRegister',id,'Opening '+v);
  saveDB(); showToast('✅ ಆರಂಭಿಕ ಶಿಲ್ಕು ಉಳಿಸಲಾಗಿದೆ'); renderLeaveReport();
}
function lrAddEntry(type,h){
  const from=document.getElementById('lr_f_'+h)?.value, to=document.getElementById('lr_t_'+h)?.value||from;
  let days=document.getElementById('lr_d_'+h)?.value;
  const ref=document.getElementById('lr_r_'+h)?.value?.trim()||'', remarks=document.getElementById('lr_m_'+h)?.value?.trim()||'';
  if(!from){ showToast('⚠ ದಿನಾಂಕ ನಮೂದಿಸಿ'); return; }
  if(!days||isNaN(days)) days=Math.max(1,Math.round((new Date(to)-new Date(from))/86400000)+1);
  if(Number(days)<=0){ showToast('⚠ ದಿನಗಳು ಸರಿಯಿಲ್ಲ'); return; }
  const year=from.slice(0,4);
  if(!DB.leaveRegEntries) DB.leaveRegEntries=[];
  DB.leaveRegEntries.push({id:uid(),type,year,hrmsId:h,from,to,days:Number(days),ref,remarks,by:CURRENT_USER.name,at:todayStr()});
  logAudit('Create','LeaveRegister',type+'|'+h,from+' '+days+' days');
  saveDB(); showToast('✅ ನಮೂದು ಸೇರಿಸಲಾಗಿದೆ'); LR_YEAR=year; renderLeaveReport();
}
function lrDelEntry(id){
  if(!confirm('ಈ ನಮೂದನ್ನು ಅಳಿಸುವುದೇ?')) return;
  DB.leaveRegEntries=(DB.leaveRegEntries||[]).filter(e=>e.id!==id);
  saveDB(); renderLeaveReport();
}
function lrPrintHtml(type,year,list){
  const T=LR_TYPES[type], web=location.host||'mdrsshedbarieoffice.in';
  const PER=24, chunks=[]; for(let i=0;i<list.length;i+=PER) chunks.push(list.slice(i,i+PER)); if(!chunks.length) chunks.push([]);
  return '<div class="reg-wrap">'+chunks.map((ch,ci)=>`<div class="reg-sheet reg-port" style="${ci<chunks.length-1?'page-break-after:always;':''}"><div class="reg-body">
    ${regHead(esc(T.name),'ವರ್ಷ: '+esc(year))}
    <table class="reg-tb" style="table-layout:auto;margin-top:6px;"><thead><tr><th style="width:6%">ಕ್ರ.ಸಂ</th><th style="width:24%">ಹೆಸರು / ಹುದ್ದೆ</th><th style="width:10%">ಆರಂಭಿಕ ಶಿಲ್ಕು</th><th style="width:10%">ಪಡೆದ ರಜೆ</th><th style="width:10%">ಉಳಿದ ಶಿಲ್ಕು</th><th>ರಜೆ ವಿವರ (ದಿನಾಂಕ / ದಿನಗಳು)</th></tr></thead><tbody>
    ${ch.map((r,i)=>{ const k=ci*PER+i; return `<tr><td>${k+1}</td><td style="text-align:left;">${esc(r.s.name)}<br><span style="font-size:6.5pt;">${esc(r.s.desig||'')}</span></td><td>${r.op}</td><td>${r.used}</td><td><b>${r.bal}</b></td><td style="text-align:left;font-size:7pt;">${r.led.map(x=>fmtDate(x.from)+(x.to&&x.to!==x.from?'–'+fmtDate(x.to):'')+' ('+x.days+')').join(', ')}</td></tr>`; }).join('')}
    </tbody></table></div>${regFoot(ci+1,chunks.length)}</div>`).join('')+'</div>';
}
function lrPrint(){
  const type=LR_TAB, year=lrYear();
  regPrint(lrPrintHtml(type,year,lrStaff().map(s=>lrRow(type,year,s))),false);
}
var LR_MONTH='';
function lrSetMonth(m){ LR_MONTH=m; renderLeaveReport(); }
function lrMonthRows(type,year,mon){
  const mp=year+'-'+mon, start=mp+'-01';
  return lrStaff().map(s=>{
    const led=lrLedger(type,year,s.hrmsId), op=lrOpening(type,year,s.hrmsId);
    const before=led.filter(x=>x.from<start).reduce((a,x)=>a+x.days,0);
    const inM=led.filter(x=>(x.from||'').startsWith(mp));
    const used=inM.reduce((a,x)=>a+x.days,0);
    return {s,openM:op-before,inM,used,bal:op-before-used};
  });
}
function lrPrintMonth(){
  const type=LR_TAB, year=lrYear(), T=LR_TYPES[type];
  const sel=document.getElementById('lr_pm'); const mon=sel?sel.value:String(new Date().getMonth()+1).padStart(2,'0');
  const names=['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'];
  const rows=lrMonthRows(type,year,mon), PER=26, chunks=[]; for(let i=0;i<rows.length;i+=PER) chunks.push(rows.slice(i,i+PER));
  const tot=rows.reduce((a,r)=>a+r.used,0);
  const html='<div class="reg-wrap">'+chunks.map((ch,ci)=>`<div class="reg-sheet reg-port" style="${ci<chunks.length-1?'page-break-after:always;':''}"><div class="reg-body">
    ${regHead(esc(T.name),'ತಿಂಗಳು: <b>'+names[+mon-1]+' '+esc(year)+'</b>')}
    <table class="reg-tb" style="table-layout:auto;margin-top:6px;"><thead><tr><th style="width:6%">ಕ್ರ.ಸಂ</th><th style="width:26%">ಹೆಸರು / ಹುದ್ದೆ</th><th style="width:11%">ತಿಂಗಳ ಆರಂಭದ ಶಿಲ್ಕು</th><th>ಈ ತಿಂಗಳ ರಜೆ (ದಿನಾಂಕ / ದಿನಗಳು)</th><th style="width:9%">ಒಟ್ಟು ದಿನಗಳು</th><th style="width:11%">ತಿಂಗಳ ಕೊನೆಯ ಶಿಲ್ಕು</th></tr></thead><tbody>
    ${ch.map((r,i)=>`<tr><td>${ci*PER+i+1}</td><td style="text-align:left;">${esc(r.s.name)}<br><span style="font-size:6.5pt;">${esc(r.s.desig||'')}</span></td><td>${r.openM}</td><td style="text-align:left;font-size:7.5pt;">${r.inM.length?r.inM.map(x=>fmtDate(x.from)+(x.to&&x.to!==x.from?' – '+fmtDate(x.to):'')+' ('+x.days+')').join(', '):'—'}</td><td>${r.used||'—'}</td><td><b>${r.bal}</b></td></tr>`).join('')}
    ${ci===chunks.length-1?`<tr><td colspan="4" style="text-align:right;"><b>ಒಟ್ಟು</b></td><td><b>${tot}</b></td><td></td></tr>`:''}
    </tbody></table>
    ${ci===chunks.length-1?`<div style="display:flex;justify-content:space-between;margin-top:26px;font-size:9.5pt;"><div>ಸಿದ್ಧಪಡಿಸಿದವರು: <b>${esc(CURRENT_USER.name)}</b></div><div style="text-align:right;">ಪ್ರಾಂಶುಪಾಲರು<br>MDRS Bhatkal (BC-265)</div></div>`:''}
  </div>${regFoot(ci+1,chunks.length)}</div>`).join('')+'</div>';
  regPrint(html,false);
}
function lrPrintStaff(h){
  const type=LR_TAB, year=lrYear(), s=lrStaff().find(x=>x.hrmsId===h); if(!s) return;
  const r=lrRow(type,year,s), T=LR_TYPES[type];
  let run=r.op;
  const html=`<div class="reg-wrap"><div class="reg-sheet reg-port"><div class="reg-body">
    ${regHead(esc(T.name),'ವರ್ಷ: '+esc(year))}
    <table style="width:100%;font-size:10pt;margin:6px 0;"><tr><td>ಹೆಸರು: <b>${esc(s.name)}</b></td><td style="text-align:right;">ಹುದ್ದೆ: <b>${esc(s.desig||'')}</b></td></tr><tr><td>ಆರಂಭಿಕ ಶಿಲ್ಕು: <b>${r.op}</b></td><td style="text-align:right;">ಉಳಿದ ಶಿಲ್ಕು: <b>${r.bal}</b></td></tr></table>
    <table class="reg-tb" style="table-layout:auto;"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಿನಾಂಕದಿಂದ</th><th>ದಿನಾಂಕದವರೆಗೆ</th><th>ದಿನಗಳು</th><th>ಶಿಲ್ಕು</th><th>ಆದೇಶ / ಅರ್ಜಿ ಸಂ.</th><th>ಕಾರಣ / ಟಿಪ್ಪಣಿ</th></tr></thead><tbody>
    ${r.led.length?r.led.map((x,i)=>{ run-=x.days; return `<tr><td>${i+1}</td><td>${fmtDate(x.from)}</td><td>${fmtDate(x.to)}</td><td>${x.days}</td><td>${run}</td><td style="font-size:7pt;">${esc(x.ref)}</td><td style="text-align:left;font-size:7pt;">${esc(x.remarks)}</td></tr>`; }).join(''):'<tr><td colspan="7">ಯಾವುದೇ ನಮೂದು ಇಲ್ಲ</td></tr>'}
    </tbody></table></div>${regFoot(1,1)}</div></div>`;
  regPrint(html,false);
}
function lrMonthlyHtml(){
  const now=new Date(), yr=String(now.getFullYear());
  const allMonths=['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `<div class="panel" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
      <div class="field" style="min-width:160px;margin:0;"><label>ತಿಂಗಳು</label>
        <select id="lr_month" onchange="renderLeaveTable()">${allMonths.map((m,i)=>`<option value="${i}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="field" style="min-width:100px;margin:0;"><label>ವರ್ಷ</label>
        <select id="lr_year" onchange="renderLeaveTable()">${[yr-1,yr,Number(yr)+1].map(y=>`<option value="${y}" ${String(y)===yr?'selected':''}>${y}</option>`).join('')}</select></div>
      <button class="btn btn-primary" onclick="renderLeaveTable()">🔍 ನೋಡಿ</button>
      <button class="btn btn-gold" onclick="downloadLeaveReport()">⬇ Excel Download</button>
      <button class="btn btn-primary" onclick="sendLeaveReportToPrincipal()">📤 Principal ಗೆ Monthly Report ಕಳುಹಿಸಿ</button>
    </div><div id="leaveReportTable"></div>`;
}
function renderLeaveReport(){
  const year=lrYear(), cy=new Date().getFullYear();
  const tabs=['CL','RH','EL','HPL'];
  let body='';
  if(LR_TAB==='MONTH'){ body=lrMonthlyHtml(); }
  else {
    const type=LR_TAB, T=LR_TYPES[type];
    const list=lrStaff().map(s=>lrRow(type,year,s));
    body=`<div class="panel">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <b>${esc(T.name)}</b>
        <select onchange="lrSetYear(this.value)">${[cy-1,cy,cy+1].map(y=>`<option value="${y}" ${String(y)===year?'selected':''}>${y}</option>`).join('')}</select>
        <span class="small-muted">${T.auto?'ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ '+type+' ರಜೆ ಪತ್ರದಿಂದ ಶಿಲ್ಕು ತಾನಾಗಿ ಕಡಿಮೆ ಆಗುತ್ತದೆ':'FDA ನಮೂದಿಸಿ ನವೀಕರಿಸುತ್ತಾರೆ'}</span>
        <span style="margin-left:auto;"></span>
        <select id="lr_pm" onchange="LR_MONTH=lrYear()+'-'+this.value">${['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=>`<option value="${m}" ${(LR_MONTH?LR_MONTH.slice(5,7)===m:(year===String(cy)&&new Date().getMonth()===i))?'selected':''}>${['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'][i]}</option>`).join('')}</select>
        <button class="gv-b" onclick="lrPrintMonth()">ತಿಂಗಳವಾರು Print / PDF</button>
        <button class="gv-b" onclick="lrPrint()">ವರ್ಷದ ಎಲ್ಲಾ Print / PDF</button>
      </div>
      <table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಆರಂಭಿಕ ಶಿಲ್ಕು</th><th>ಪಡೆದ ರಜೆ</th><th>ಉಳಿದ ಶಿಲ್ಕು</th><th>ಕ್ರಮ</th></tr></thead><tbody>
      ${list.map((r,i)=>{
        const open=LR_OPEN===r.s.hrmsId;
        let run=r.op;
        return `<tr><td class="c">${i+1}</td><td><b>${esc(r.s.name)}</b></td><td>${esc(r.s.desig||'')}</td>
          <td class="c">${r.op}</td><td class="c">${r.used}</td><td class="c"><b style="color:${r.bal<0?'var(--red)':'inherit'};">${r.bal}</b></td>
          <td class="c" style="white-space:nowrap;"><button class="gv-b" onclick="lrOpenStaff('${r.s.hrmsId}')">${open?'ಮುಚ್ಚಿ':'ವಿವರ'}</button></td></tr>
          ${open?`<tr><td colspan="7" style="background:#f7f9fc;padding:10px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
              <b>${esc(r.s.name)} — ${esc(year)}</b>
              <label style="font-size:12px;">ಆರಂಭಿಕ ಶಿಲ್ಕು:</label>
              <input id="lr_op_${r.s.hrmsId}" type="number" step="0.5" value="${r.op}" style="width:80px;">
              <button class="gv-b" onclick="lrSaveOpening('${type}','${r.s.hrmsId}')">ಉಳಿಸಿ</button>
              <button class="gv-b" style="margin-left:auto;" onclick="lrPrintStaff('${r.s.hrmsId}')">ಈ ಸಿಬ್ಬಂದಿಯ Print / PDF</button>
            </div>
            <table class="gov-table"><thead><tr><th>ಕ್ರ.ಸಂ</th><th>ದಿನಾಂಕದಿಂದ</th><th>ದಿನಾಂಕದವರೆಗೆ</th><th>ದಿನಗಳು</th><th>ಶಿಲ್ಕು</th><th>${T.auto?'ಅರ್ಜಿ ಸಂ. / ಮಂಜೂರು':'ಆದೇಶ ಸಂ.'}</th><th>ಕಾರಣ / ಟಿಪ್ಪಣಿ</th>${T.auto?'':'<th></th>'}</tr></thead><tbody>
            ${r.led.length?r.led.map((x,k)=>{ run-=x.days; return `<tr><td class="c">${k+1}</td><td class="c">${fmtDate(x.from)}</td><td class="c">${fmtDate(x.to)}</td><td class="c">${x.days}</td><td class="c">${run}</td><td>${esc(x.ref)}${x.auto&&x.by?'<div style="font-size:10px;color:var(--muted);">ಮಂಜೂರು: '+esc(x.by)+' '+fmtDate(x.at)+'</div>':''}</td><td>${esc(x.remarks)}</td>${T.auto?'':`<td class="c"><button class="gv-b" onclick="lrDelEntry('${x.id}')">ಅಳಿಸಿ</button></td>`}</tr>`; }).join(''):`<tr><td colspan="${T.auto?7:8}" class="c" style="color:var(--muted);">ಯಾವುದೇ ನಮೂದು ಇಲ್ಲ</td></tr>`}
            </tbody></table>
            ${T.auto?'':`<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end;margin-top:8px;">
              <div class="field" style="margin:0;"><label>ದಿನಾಂಕದಿಂದ</label><input type="date" id="lr_f_${r.s.hrmsId}"></div>
              <div class="field" style="margin:0;"><label>ದಿನಾಂಕದವರೆಗೆ</label><input type="date" id="lr_t_${r.s.hrmsId}"></div>
              <div class="field" style="margin:0;"><label>ದಿನಗಳು</label><input type="number" step="0.5" id="lr_d_${r.s.hrmsId}" style="width:80px;" placeholder="ಸ್ವಯಂ"></div>
              <div class="field" style="margin:0;"><label>ಆದೇಶ ಸಂ.</label><input id="lr_r_${r.s.hrmsId}" style="width:130px;"></div>
              <div class="field" style="margin:0;"><label>ಟಿಪ್ಪಣಿ</label><input id="lr_m_${r.s.hrmsId}" style="width:180px;"></div>
              <button class="gv-b pri" onclick="lrAddEntry('${type}','${r.s.hrmsId}')">ನಮೂದು ಸೇರಿಸಿ</button></div>`}
          </td></tr>`:''}`; }).join('')}
      </tbody></table></div>`;
  }
  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>Leave Register (ರಜೆ ನೋಂದಣಿ)</h2>
    <div class="desc">CL ಮತ್ತು RH — ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ ರಜೆ ಪತ್ರದಿಂದ ತಾನಾಗಿ ಕಡಿತ. EL ಮತ್ತು HPL — FDA ನಮೂದಿಸುತ್ತಾರೆ.</div></div>
    <div class="gv-tabs" style="margin-bottom:10px;">
      ${tabs.map(t=>`<button class="gv-tab ${LR_TAB===t?'on':''}" onclick="lrSetTab('${t}')">${t} Register</button>`).join('')}
      <button class="gv-tab ${LR_TAB==='MONTH'?'on':''}" onclick="lrSetTab('MONTH')">ಮಾಸಿಕ ವರದಿ (Monthly)</button></div>
    ${body}`;
  if(LR_TAB==='MONTH') renderLeaveTable();
}

function renderLeaveTable(){
  const month=Number(document.getElementById('lr_month')?.value??new Date().getMonth());
  const year=String(document.getElementById('lr_year')?.value??new Date().getFullYear());
  const monthName=['January','February','March','April','May','June','July','August','September','October','November','December'][month];
  const monthPrefix=year+'-'+String(month+1).padStart(2,'0');
  const allStaff=STAFF.filter(s=>s.role!=='admin');

  const rows=allStaff.map(s=>{
    const leaves=(DB.leaveApplications||[]).filter(l=>l.hrmsId===s.hrmsId&&l.status==='Approved');
    const cl=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const rh=leaves.filter(l=>l.leaveType==='RH (Restricted Holiday)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const el=leaves.filter(l=>l.leaveType==='EL (Earned Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const clYr=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0);
    const elBal=Number((DB.elBalances||{})[s.hrmsId]||30);
    const elUsedYr=leaves.filter(l=>l.leaveType==='EL (Earned Leave)'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0);
    return {s,cl,rh,el,clYr,elBal,elUsedYr};
  });

  const clTotal=rows.reduce((a,r)=>a+r.cl,0);
  const rhTotal=rows.reduce((a,r)=>a+r.rh,0);
  const elTotal=rows.reduce((a,r)=>a+r.el,0);

  const wrap=document.getElementById('leaveReportTable');
  wrap.innerHTML=`<div class="panel"><h3>📋 ${monthName} ${year} — ರಜೆ ನೋಂದಣಿ</h3>
    <div class="table-wrap"><table><thead><tr>
      <th>#</th><th>HRMS ID</th><th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th>
      <th style="background:#e3f2fd;">CL ಈ ತಿಂಗಳು</th>
      <th style="background:#e3f2fd;">CL ಈ ವರ್ಷ ಒಟ್ಟು</th>
      <th style="background:#e3f2fd;">CL ಉಳಿದ</th>
      <th style="background:#f3e5f5;">RH ಈ ತಿಂಗಳು</th>
      <th style="background:#f3e5f5;">RH ಉಳಿದ</th>
      <th style="background:#e8f5e9;">EL ಈ ತಿಂಗಳು</th>
      <th style="background:#e8f5e9;">EL ಒಟ್ಟು Balance</th>
      <th style="background:#e8f5e9;">EL ಉಳಿದ</th>
    </tr></thead>
    <tbody>
      ${rows.map((r,i)=>`<tr>
        <td>${i+1}</td>
        <td style="font-size:11px;">${esc(r.s.hrmsId)}</td>
        <td><b>${esc(r.s.name)}</b></td>
        <td style="font-size:11px;">${esc(r.s.desig||'')}</td>
        <td style="text-align:center;background:#e3f2fd;"><b style="color:${r.cl>0?'var(--red)':'var(--green)'};">${r.cl}</b></td>
        <td style="text-align:center;background:#e3f2fd;">${r.clYr}/15</td>
        <td style="text-align:center;background:#e3f2fd;"><b style="color:${15-r.clYr>5?'var(--green)':'var(--red)'};">${15-r.clYr}</b></td>
        <td style="text-align:center;background:#f3e5f5;"><b style="color:${r.rh>0?'var(--red)':'var(--green)'};">${r.rh}</b></td>
        <td style="text-align:center;background:#f3e5f5;"><b>${2-Math.min(2,((DB.leaveApplications||[]).filter(l=>l.hrmsId===r.s.hrmsId&&l.leaveType==='RH (Restricted Holiday)'&&l.status==='Approved'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0)))}</b></td>
        <td style="text-align:center;background:#e8f5e9;"><b style="color:${r.el>0?'var(--red)':'var(--green)'};">${r.el}</b></td>
        <td style="text-align:center;background:#e8f5e9;">${r.elBal}</td>
        <td style="text-align:center;background:#e8f5e9;"><b style="color:${r.elBal-r.elUsedYr>10?'var(--green)':'var(--red)'};">${r.elBal-r.elUsedYr}</b></td>
      </tr>`).join('')}
    </tbody>
    <tfoot><tr style="font-weight:800;background:var(--surface-2);">
      <td colspan="4" style="text-align:right;padding:6px 8px;">ಒಟ್ಟು (${monthName}):</td>
      <td style="text-align:center;background:#e3f2fd;">${clTotal}</td>
      <td colspan="2" style="background:#e3f2fd;"></td>
      <td style="text-align:center;background:#f3e5f5;">${rhTotal}</td>
      <td style="background:#f3e5f5;"></td>
      <td style="text-align:center;background:#e8f5e9;">${elTotal}</td>
      <td colspan="2" style="background:#e8f5e9;"></td>
    </tr></tfoot>
    </table></div>

    <div style="margin-top:10px;font-size:11px;color:var(--muted);">
      🔵 CL Max: 15/year | 🟣 RH Max: 2/year | 🟢 EL: FDA Manual Update ಪ್ರಕಾರ
    </div>
  </div>`;
}

function downloadLeaveReport(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const month=Number(document.getElementById('lr_month')?.value??new Date().getMonth());
  const year=String(document.getElementById('lr_year')?.value??new Date().getFullYear());
  const monthName=['January','February','March','April','May','June','July','August','September','October','November','December'][month];
  const monthPrefix=year+'-'+String(month+1).padStart(2,'0');
  const allStaff=STAFF.filter(s=>s.role!=='admin');
  const header=['#','HRMS ID','ಹೆಸರು','ಹುದ್ದೆ','CL (ಈ ತಿಂಗಳು)','CL ಈ ವರ್ಷ ಒಟ್ಟು','CL ಉಳಿದ','RH (ಈ ತಿಂಗಳು)','RH ಉಳಿದ','EL (ಈ ತಿಂಗಳು)','EL Total Balance','EL ಉಳಿದ'];
  const rows=allStaff.map((s,i)=>{
    const leaves=(DB.leaveApplications||[]).filter(l=>l.hrmsId===s.hrmsId&&l.status==='Approved');
    const cl=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const rh=leaves.filter(l=>l.leaveType==='RH (Restricted Holiday)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const el=leaves.filter(l=>l.leaveType==='EL (Earned Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const clYr=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0);
    const elBal=Number((DB.elBalances||{})[s.hrmsId]||30);
    const elUsedYr=leaves.filter(l=>l.leaveType==='EL (Earned Leave)'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0);
    return [i+1,s.hrmsId,s.name,s.desig||'',cl,clYr+'/15',15-clYr,rh,2-Math.min(2,leaves.filter(l=>l.leaveType==='RH (Restricted Holiday)'&&l.status==='Approved'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0)),el,elBal,elBal-elUsedYr];
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([
    ['ಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265) — ರಜೆ ನೋಂದಣಿ'],
    [monthName+' '+year],
    [],
    header,
    ...rows
  ]);
  ws['!cols']=header.map(()=>({wch:18}));
  XLSX.utils.book_append_sheet(wb,ws,'Leave Register');
  XLSX.writeFile(wb,'Leave_Register_'+monthName+'_'+year+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

function sendLeaveReportToPrincipal(){
  const month=Number(document.getElementById('lr_month')?.value??new Date().getMonth());
  const year=String(document.getElementById('lr_year')?.value??new Date().getFullYear());
  const monthName=['January','February','March','April','May','June','July','August','September','October','November','December'][month];
  const monthPrefix=year+'-'+String(month+1).padStart(2,'0');
  const allStaff=STAFF.filter(s=>s.role!=='admin');

  let reportText=`ರಜೆ ನೋಂದಣಿ — ${monthName} ${year}\nಮೊರಾರ್ಜಿ ದೇಸಾಯಿ ವಸತಿ ಶಾಲೆ (BC-265)\n\n`;
  allStaff.forEach((s,i)=>{
    const leaves=(DB.leaveApplications||[]).filter(l=>l.hrmsId===s.hrmsId&&l.status==='Approved');
    const cl=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const rh=leaves.filter(l=>l.leaveType==='RH (Restricted Holiday)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const el=leaves.filter(l=>l.leaveType==='EL (Earned Leave)'&&(l.fromDate||'').startsWith(monthPrefix)).reduce((a,l)=>a+Number(l.days||0),0);
    const clYr=leaves.filter(l=>l.leaveType==='CL (Casual Leave)'&&(l.fromDate||'').startsWith(year)).reduce((a,l)=>a+Number(l.days||0),0);
    reportText+=`${i+1}. ${s.name} (${s.desig||''}) — CL: ${cl} | CL ಒಟ್ಟು ಈ ವರ್ಷ: ${clYr}/15 | RH: ${rh} | EL: ${el}\n`;
  });
  reportText+=`\nFDA: ${CURRENT_USER.name} | ದಿನಾಂಕ: ${todayStr()}`;

  // Send as message to Principal
  const p=STAFF.find(x=>x.role==='principal');
  if(!p){ showToast('⚠ Principal ಇಲ್ಲ'); return; }
  if(!DB.teacherMsgs) DB.teacherMsgs=[];
  DB.teacherMsgs.push({
    id:uid(), from:CURRENT_USER.name, toType:'Principal', targetVal:p.name,
    toNames:[p.name], subject:'ರಜೆ Monthly Report — '+monthName+' '+year,
    message:reportText, attachment:'', fileData:null, fileName:null, fileType:null,
    date:todayStr(), ts:Date.now(), status:'sent', readBy:{}, archivedBy:{}
  });
  saveDB();
  pushNotification(p.name,'📊 ರಜೆ Monthly Report: '+monthName+' '+year+' | FDA: '+CURRENT_USER.name+' | Message Box ನಲ್ಲಿ ನೋಡಿ');
  showToast('✅ '+monthName+' '+year+' ರಜೆ Report — Principal ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
}

function renderFDAMentorRegister(){
  const orders=DB.mentorOrders||[];
  const search=document.getElementById('fdar_search')?.value?.toLowerCase()||'';
  const fStatus=document.getElementById('fdar_status')?.value||'';

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 ಮೆಂಟರ್ Received Register (FDA)</h2>
    <div class="desc">Mentor Acceptance ಆದ ಎಲ್ಲಾ Orders — Search, Filter, Print, Export</div></div>

    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input id="fdar_search" placeholder="🔍 Order No. / Mentor Name ಹುಡುಕಿ..." oninput="renderFDAMentorRegister()" value="${esc(search)}" style="flex:1;min-width:200px;">
        <select id="fdar_status" onchange="renderFDAMentorRegister()">
          <option value="">ಎಲ್ಲಾ ಸ್ಥಿತಿ</option>
          <option value="Draft" ${fStatus==='Draft'?'selected':''}>ಕರಡು</option>
          <option value="Sent to Principal" ${fStatus==='Sent to Principal'?'selected':''}>ಪ್ರಾಂಶುಪಾಲರ ಬಳಿ</option>
          <option value="Pending Acceptance" ${fStatus==='Pending Acceptance'?'selected':''}>Pending</option>
          <option value="Accepted" ${fStatus==='Accepted'?'selected':''}>Accepted</option>
          <option value="Acknowledged" ${fStatus==='Acknowledged'?'selected':''}>Acknowledged</option>
        </select>
        <button class="btn btn-gold" onclick="downloadMentorRegisterExcel()">⬇ Excel Export</button>
        <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
      </div>
      <div class="table-wrap"><table id="printArea"><thead><tr>
        <th>Order No.</th><th>ದಿನಾಂಕ</th><th>ಮೆಂಟರ್</th><th>ವಿದ್ಯಾರ್ಥಿ ಸಂಖ್ಯೆ</th><th>Accept ದಿನಾಂಕ</th><th>Signature</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>
        ${(()=>{
          let list=orders.slice();
          if(search) list=list.filter(o=>o.orderNo.toLowerCase().includes(search)||o.mentorName.toLowerCase().includes(search));
          if(fStatus) list=list.filter(o=>o.status===fStatus);
          if(!list.length) return `<tr class="empty-row"><td colspan="8">ಯಾವುದೂ ಇಲ್ಲ.</td></tr>`;
          return list.slice().reverse().map(o=>`<tr>
            <td style="font-size:11px;">${esc(o.orderNo)}</td>
            <td style="font-size:11px;">${fmtDate(o.orderDate)}</td>
            <td>${esc(o.mentorName)}</td>
            <td>${o.totalStudents}</td>
            <td style="font-size:11px;">${o.acceptedDate?fmtDate(o.acceptedDate)+' '+esc(o.acceptedAt||''):'—'}</td>
            <td>${['Accepted','Acknowledged'].includes(o.status)?'✅ Signed':'⏳ Pending'}</td>
            <td>${mentorStatusBadge(o.status)}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="viewMentorOrder('${o.id}')">👁</button>
              ${o.status==='Accepted'?`<button class="btn btn-sm btn-primary" onclick="ackMentorOrderFDA('${o.id}')">📋 Acknowledge</button>`:''}
            </td>
          </tr>`).join('');
        })()}
      </tbody></table></div>
    </div>
    <div class="panel"><h3>ಶಿಕ್ಷಕರಿಂದ ಫೈಲಿಂಗ್‌ಗೆ ಬಂದ ಮೆಂಟರ್ ಪ್ರೊಫೈಲ್‌ಗಳು</h3>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>ವಿದ್ಯಾರ್ಥಿ</th><th>ತರಗತಿ</th><th>ಮೆಂಟರ್</th><th>ಬಂದ ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>Action</th></tr></thead><tbody>
      ${(()=>{ const L=(DB.mentorProfiles||[]).filter(p=>p.sentToFDA);
        if(!L.length) return '<tr class="empty-row"><td colspan="7">ಯಾವುದೂ ಇಲ್ಲ.</td></tr>';
        return L.map((p,i)=>{ const st=(DB.students||[]).find(x=>x.id===p.studentId)||{};
          return `<tr><td>${i+1}</td><td>${esc(st.studentName||'—')}</td><td>${esc(st.className||'')}</td><td>${esc(p.mentorName)}</td><td>${fmtDate(p.sentToFDAAt)}</td><td>${p.filedByFDA?'Filed '+fmtDate(p.filedAt):'ಫೈಲಿಂಗ್ ಬಾಕಿ'}</td><td><button class="btn btn-sm btn-outline" onclick="navigate('mentorprofile');setTimeout(()=>openMentorProfile('${p.studentId}'),100)">👁 ತೆರೆಯಿರಿ</button></td></tr>`; }).join(''); })()}
      </tbody></table></div></div>
    <div id="mentorDetailPanel"></div>`;
}

async function ackMentorOrderFDA(orderId,silent){
  if(CURRENT_USER.role!=='fda'){ showToast('⚠ FDA ಮಾತ್ರ'); return false; }
  const order=DB.mentorOrders.find(x=>x.id===orderId); if(!order||order.status!=='Accepted') return false;
  await mentorSignMeta(order,'aSig');
  order.status='Acknowledged'; order.ackByFDA=CURRENT_USER.name; order.ackAt=todayStr();
  logAudit('Approve','MentorOrder',orderId,'FDA acknowledged');
  if(!silent){ saveDB(); showToast('✅ Acknowledged'); if(typeof renderMentorAllocation==='function'&&document.getElementById('mentorDetailPanel')) renderMentorAllocation(); else renderFDAMentorRegister(); }
  return true;
}
async function ackAllMentorOrders(){
  const L=(DB.mentorOrders||[]).filter(o=>o.status==='Accepted'); if(!L.length) return;
  if(!confirm(L.length+' ಆದೇಶಗಳನ್ನು Acknowledge ಮಾಡುವುದೇ?')) return;
  let n=0; for(const o of L){ if(await ackMentorOrderFDA(o.id,true)) n++; }
  saveDB(); showToast('✅ '+n+' ಆದೇಶ Acknowledged'); renderMentorAllocation();
}

function downloadMentorRegisterExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const header=['Order No.','Order Date','Academic Year','Mentor Teacher','Total Students','Accepted Date','Accepted Time','Status'];
  const rows=(DB.mentorOrders||[]).map(o=>[o.orderNo,o.orderDate,o.academicYear,o.mentorName,o.totalStudents,o.acceptedDate||'—',o.acceptedAt||'—',o.status]);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Mentor Register');
  XLSX.writeFile(wb,'Mentor_Received_Register_'+todayStr()+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

function renderFDAExamRegister(){
  const approvedStatuses=['Approved','FDA Acknowledged'];
  const approvedRecords=(DB.marks||[]).filter(m=>approvedStatuses.includes(m.status));
  const years=[...new Set(approvedRecords.map(m=>m.academicYear||defaultAcademicYear()))];
  const fYear=document.getElementById('fer_year')?.value||defaultAcademicYear();
  const fClass=document.getElementById('fer_class')?.value||'';
  const search=document.getElementById('fer_search')?.value?.toLowerCase()||'';

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 ಫಲಿತಾಂಶ Register (FDA — View Only)</h2>
    <div class="desc">Principal Approve ಮಾಡಿದ ಫಲಿತಾಂಶಗಳು ಮಾತ್ರ — Search, Print, Excel Export, Academic Year Archive</div></div>

    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="fer_year" onchange="renderFDAExamRegister()">
          ${years.length?years.map(y=>`<option ${fYear===y?'selected':''}>${esc(y)}</option>`).join(''):`<option>${defaultAcademicYear()}</option>`}
        </select>
        <select id="fer_class" onchange="renderFDAExamRegister()">
          <option value="">ಎಲ್ಲಾ ತರಗತಿ</option>
          ${['6','7','8','9','10'].map(c=>`<option ${fClass===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <input id="fer_search" placeholder="🔍 ವಿಷಯ / ಪರೀಕ್ಷೆ ಹುಡುಕಿ..." oninput="renderFDAExamRegister()" value="${esc(search)}" style="flex:1;min-width:180px;">
      </div>
      <div class="table-wrap"><table><thead><tr>
        <th>ತರಗತಿ</th><th>ಪರೀಕ್ಷೆ</th><th>ವಿಷಯ</th><th>ಶಿಕ್ಷಕರು</th><th>Max</th><th>Entries</th><th>ಸ್ಥಿತಿ</th><th>Action</th>
      </tr></thead><tbody>
        ${(()=>{
          let list=approvedRecords.filter(m=>(m.academicYear||defaultAcademicYear())===fYear);
          if(fClass) list=list.filter(m=>m.className===fClass);
          if(search) list=list.filter(m=>m.subject.toLowerCase().includes(search)||m.examName.toLowerCase().includes(search));
          if(!list.length) return `<tr class="empty-row"><td colspan="8">ಯಾವುದೂ ಇಲ್ಲ.</td></tr>`;
          return list.slice().reverse().map(m=>`<tr>
            <td>${esc(m.className)}ನೇ</td><td>${esc(m.examName)}</td><td>${esc(m.subject)}</td><td>${esc(m.createdBy)}</td>
            <td>${m.maxMarks||'—'}</td><td>${m.entries.length}</td>
            <td><span class="badge badge-ok">${esc(m.status)}</span></td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-outline" onclick="viewMarksSignatures('${m.id}')">👁</button>
            </td>
          </tr>`).join('');
        })()}
      </tbody></table></div>
    </div>

    <div class="panel" id="consPanel"><h3>📊 ಅನುಮೋದಿತ ಫಲಿತಾಂಶ — ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕ (ತರಗತಿವಾರು)</h3>
      <div class="note">ತರಗತಿ ಮತ್ತು ಪರೀಕ್ಷೆ ಆರಿಸಿ — ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳ ಒಟ್ಟು ಅಂಕ ಪಟ್ಟಿ, ವಿಷಯವಾರು ಅಂಕ ಪಟ್ಟಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ ಕಾಣುತ್ತದೆ. Print / PDF ಅಥವಾ Excel ಮಾಡಬಹುದು.</div>
      <div class="form-grid">
        <div class="field"><label>ತರಗತಿ</label><select id="cons_cls" onchange="fdaConsFill(true)">${['6','7','8','9','10'].map(c=>`<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label>ಪರೀಕ್ಷೆ</label><select id="cons_exam" onchange="consRun()"></select></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary btn-sm" onclick="consRun()">📊 ತೋರಿಸಿ</button> <button class="btn btn-gold btn-sm" onclick="fdaAllResultsExcel()">⬇ ಎಲ್ಲಾ ತರಗತಿ ಮತ್ತು ಪರೀಕ್ಷೆಗಳ Excel (ಒಂದೇ ಫೈಲ್)</button></div>
      <div id="consWrap"></div>
    </div>

    <div class="panel"><h3>📈 Subject / Class / Student Reports</h3>
      <div class="note" style="font-size:11px;">ವಿವರವಾದ Analysis (Highest/Lowest/Average/Pass%/Grade Distribution/Graphs) ಗಾಗಿ:</div>
      <button class="btn btn-gold" onclick="navigate('results')">📈 ಫಲಿತಾಂಶ ವಿಶ್ಲೇಷಣೆ ಗೆ ಹೋಗಿ</button>
    </div>`;
  setTimeout(()=>{ try{ const c=document.getElementById('cons_cls'); if(c){ const first=['6','7','8','9','10'].find(k=>fdaApprovedExams(k).length); if(first) c.value=first; fdaConsFill(!document.getElementById('fer_search').value); } }catch(e){ console.error(e); } },0);
}

function fdaApprovedExams(cls){
  const ok=['Approved','FDA Acknowledged'], seen=[];
  (DB.marks||[]).filter(m=>String(m.className)===String(cls)&&ok.includes(m.status)).forEach(m=>{ if(!seen.includes(m.examName)) seen.push(m.examName); });
  return seen;
}
function fdaConsFill(run){
  const c=document.getElementById('cons_cls'), e=document.getElementById('cons_exam'); if(!c||!e) return;
  const opts=fdaApprovedExams(c.value);
  e.innerHTML=opts.length?opts.map(x=>`<option>${esc(x)}</option>`).join(''):'<option value="">— ಅನುಮೋದಿತ ಫಲಿತಾಂಶ ಇಲ್ಲ —</option>';
  const w=document.getElementById('consWrap');
  if(run&&opts.length) consRun(); else if(w&&!opts.length) w.innerHTML='<div class="small-muted" style="margin-top:8px;">ಈ ತರಗತಿಗೆ ಪ್ರಾಂಶುಪಾಲರು ಅನುಮೋದಿಸಿದ ಫಲಿತಾಂಶ ಇನ್ನೂ ಇಲ್ಲ.</div>';
}
function fdaAllResultsExcel(){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  const wb=XLSX.utils.book_new(); let n=0;
  ['6','7','8','9','10'].forEach(cls=>fdaApprovedExams(cls).forEach(exam=>{
    try{ consExcelBook(wb,consModel(cls,exam),cls+' '+exam.replace(/[^A-Za-z0-9]+/g,'').slice(0,10)); n++; }catch(e){ console.error(e); }
  }));
  if(!n){ showToast('ℹ ಅನುಮೋದಿತ ಫಲಿತಾಂಶ ಇಲ್ಲ'); return; }
  XLSX.writeFile(wb,'All_Approved_Results_'+todayStr()+'.xlsx');
  showToast('✅ '+n+' ಪರೀಕ್ಷೆಗಳ Excel Download ಆಗಿದೆ');
}
function generateConsolidatedFDA(){
  const cls=document.getElementById('fer_cons_class').value;
  document.getElementById('ferConsolidatedWrap').innerHTML=buildConsolidatedHTML(cls);
}

function renderSalaryUpload(){
  const month=document.getElementById('sal_month')?.value || defaultSalaryMonth();
  const monthSlips=(DB.salarySlips||[]).filter(s=>s.month===month);
  const uploadedCt=monthSlips.length, ackCt=monthSlips.filter(s=>s.status==='Acknowledged').length;

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>💰 ಸಂಬಳ ಚೀಟಿ ಅಪ್‌ಲೋಡ್ (Salary Slip Upload)</h2>
    <div class="desc">ಪ್ರತಿ ಸಿಬ್ಬಂದಿಗೆ ಅವರದೇ ಸಂಬಳ ಚೀಟಿ (PDF) Upload ಮಾಡಿ — ಅವರ Dashboard ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ</div></div>

    <div class="panel">
      <div class="field" style="max-width:220px;"><label>ತಿಂಗಳು ಆಯ್ಕೆ ಮಾಡಿ</label>
        <input type="month" id="sal_month" value="${esc(month)}" onchange="renderSalaryUpload()">
      </div>
      <div style="font-size:12px;margin-top:6px;color:var(--muted);">${salaryMonthLabel(month)} — ${uploadedCt}/${STAFF.length} Upload ಆಗಿದೆ | ${ackCt} ಸ್ವೀಕೃತಿ ಆಗಿದೆ</div>
    </div>

    <div class="panel">
      <h3>👥 ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ — ${salaryMonthLabel(month)}</h3>
      <div class="table-wrap"><table><thead><tr>
        <th>ಹೆಸರು</th><th>ಹುದ್ದೆ</th><th>ಸ್ಥಿತಿ</th><th>Upload / Action</th>
      </tr></thead><tbody>
        ${STAFF.map(st=>{
          const slip=monthSlips.find(s=>s.hrmsId===st.hrmsId);
          return `<tr>
            <td><b>${esc(st.name)}</b></td>
            <td style="font-size:11.5px;">${esc(st.desig||'')}</td>
            <td>${slip?salaryStatusBadge(slip.status):'<span class="badge badge-draft">⏳ Upload ಆಗಿಲ್ಲ</span>'}</td>
            <td class="actions-cell">
              <label class="btn btn-sm btn-gold" style="cursor:pointer;">
                📎 ${slip?'ಮತ್ತೆ Upload':'Upload'} PDF
                <input type="file" accept=".pdf" style="display:none;" onchange="uploadSalarySlip(this,'${st.hrmsId}','${esc(st.name)}','${month}')">
              </label>
              ${slip?`<button class="btn btn-sm btn-outline" onclick="downloadSalarySlip('${slip.id}')">⬇</button>
              <button class="btn btn-sm btn-red" onclick="deleteSalarySlip('${slip.id}')">🗑</button>`:''}
            </td>
          </tr>`;
        }).join('')}
      </tbody></table></div>
    </div>`;
}

function uploadSalarySlip(inputEl, hrmsId, staffName, month){
  const file=inputEl.files[0]; if(!file) return;
  if(file.type!=='application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){
    showToast('⚠ PDF ಫೈಲ್ ಮಾತ್ರ ಅನುಮತಿ'); return;
  }
  if(file.size>3*1024*1024){ showToast('⚠ ಗರಿಷ್ಠ 3MB ಗಾತ್ರ ಮಾತ್ರ ಅನುಮತಿ'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    if(!DB.salarySlips) DB.salarySlips=[];
    let slip=DB.salarySlips.find(s=>s.hrmsId===hrmsId && s.month===month);
    if(slip){
      slip.fileData=e.target.result; slip.fileName=file.name;
      slip.uploadedBy=CURRENT_USER.name; slip.uploadedAt=todayStr();
      slip.status='Pending'; slip.ackAt=null; slip.ackDate=null; slip.ackServerTime=false;
      logAudit('Edit','SalarySlip',slip.id,`${staffName} — ${salaryMonthLabel(month)} — re-uploaded`);
    } else {
      slip={ id:uid(), month, hrmsId, staffName, fileData:e.target.result, fileName:file.name,
        uploadedBy:CURRENT_USER.name, uploadedAt:todayStr(), status:'Pending',
        ackAt:null, ackDate:null, ackServerTime:false };
      DB.salarySlips.push(slip);
      logAudit('Create','SalarySlip',slip.id,`${staffName} — ${salaryMonthLabel(month)}`);
    }
    saveDB();
    pushNotification(staffName, `💰 ನಿಮ್ಮ ${salaryMonthLabel(month)} ಸಂಬಳ ಚೀಟಿ ಸಿದ್ಧವಿದೆ — "ನನ್ನ ಸಂಬಳ ಚೀಟಿ" ನಲ್ಲಿ ನೋಡಿ, Download ಮಾಡಿ ಮತ್ತು ಸ್ವೀಕೃತಿ Sign ಮಾಡಿ`);
    showToast('✅ '+staffName+' — Salary Slip Upload ಆಗಿದೆ');
    renderSalaryUpload();
  };
  reader.onerror=()=>{ showToast('⚠ ಫೈಲ್ ಓದಲಾಗಲಿಲ್ಲ'); };
  reader.readAsDataURL(file);
}

function deleteSalarySlip(id){
  const slip=(DB.salarySlips||[]).find(s=>s.id===id); if(!slip) return;
  if(!confirm(`"${slip.staffName} — ${salaryMonthLabel(slip.month)}" ಸಂಬಳ ಚೀಟಿ ಅಳಿಸುವುದೇ?`)) return;
  logAudit('Delete','SalarySlip',id,slip.staffName+' — '+salaryMonthLabel(slip.month));
  DB.salarySlips=DB.salarySlips.filter(s=>s.id!==id);
  saveDB();
  showToast('🗑 ಅಳಿಸಲಾಗಿದೆ');
  renderSalaryUpload();
}

function renderSalaryRegister(){
  const month=document.getElementById('salreg_month')?.value || '';
  const search=document.getElementById('salreg_search')?.value?.toLowerCase()||'';
  const months=[...new Set((DB.salarySlips||[]).map(s=>s.month))].sort().reverse();
  let list=(DB.salarySlips||[]).slice().sort((a,b)=>b.month.localeCompare(a.month)||a.staffName.localeCompare(b.staffName));
  if(month) list=list.filter(s=>s.month===month);
  if(search) list=list.filter(s=>s.staffName.toLowerCase().includes(search));
  const totalCt=list.length, ackCt=list.filter(s=>s.status==='Acknowledged').length;

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📋 ಸಂಬಳ ಚೀಟಿ ಸ್ವೀಕೃತಿ ನೋಂದಣಿ (Salary Acknowledgement Register)</h2>
    <div class="desc">ಯಾರು ಸಂಬಳ ಚೀಟಿ ಸ್ವೀಕರಿಸಿ Sign ಮಾಡಿದ್ದಾರೆ ಎಂಬ ಸಂಪೂರ್ಣ ದಾಖಲೆ</div></div>

    <div class="cards-grid">
      <div class="stat-card"><div class="n">${totalCt}</div><div class="l">ಒಟ್ಟು Upload</div></div>
      <div class="stat-card"><div class="n">${ackCt}</div><div class="l">✅ ಸ್ವೀಕೃತಿ ಆಗಿದೆ</div></div>
      <div class="stat-card"><div class="n">${totalCt-ackCt}</div><div class="l">⏳ Pending</div></div>
    </div>

    <div class="panel">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="salreg_month" onchange="renderSalaryRegister()">
          <option value="">ಎಲ್ಲಾ ತಿಂಗಳು</option>
          ${months.map(m=>`<option value="${m}" ${month===m?'selected':''}>${salaryMonthLabel(m)}</option>`).join('')}
        </select>
        <input id="salreg_search" placeholder="🔍 ಸಿಬ್ಬಂದಿ ಹೆಸರು ಹುಡುಕಿ..." oninput="renderSalaryRegister()" value="${esc(search)}" style="flex:1;min-width:180px;">
        <button class="btn btn-gold" onclick="downloadSalaryRegisterExcel('${month}')">⬇ Excel Export</button>
        <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
      </div>
      <div class="table-wrap"><table id="printArea"><thead><tr>
        <th>ಹೆಸರು</th><th>ತಿಂಗಳು</th><th>Upload ದಿನಾಂಕ</th><th>ಸ್ಥಿತಿ</th><th>ಸ್ವೀಕೃತಿ ದಿನಾಂಕ/ಸಮಯ</th><th class="no-print">Action</th>
      </tr></thead><tbody>
        ${list.length?list.map(s=>`<tr>
          <td><b>${esc(s.staffName)}</b></td>
          <td>${salaryMonthLabel(s.month)}</td>
          <td style="font-size:11px;">${fmtDate(s.uploadedAt)}</td>
          <td>${salaryStatusBadge(s.status)}</td>
          <td style="font-size:11px;">${s.status==='Acknowledged'?fmtDate(s.ackDate)+' '+esc(s.ackAt||'')+(s.ackServerTime?' ✅':' ⏱'):'—'}</td>
          <td class="no-print actions-cell"><button class="btn btn-sm btn-outline" onclick="downloadSalarySlip('${s.id}')">⬇</button></td>
        </tr>`).join(''):`<tr class="empty-row"><td colspan="6">ಯಾವುದೂ ಇಲ್ಲ.</td></tr>`}
      </tbody></table></div>
    </div>`;
}

function downloadSalaryRegisterExcel(month){
  if(typeof XLSX==='undefined'){ showToast('⚠ Excel library ಲೋಡ್ ಆಗಿಲ್ಲ'); return; }
  let list=(DB.salarySlips||[]).slice();
  if(month) list=list.filter(s=>s.month===month);
  const header=['Staff Name','Month','Uploaded Date','Status','Acknowledged Date','Acknowledged Time'];
  const rows=list.map(s=>[s.staffName, salaryMonthLabel(s.month), s.uploadedAt, s.status, s.ackDate||'—', s.ackAt||'—']);
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  XLSX.utils.book_append_sheet(wb,ws,'Salary Register');
  XLSX.writeFile(wb,'Salary_Acknowledgement_Register'+(month?'_'+month:'')+'.xlsx');
  showToast('✅ Excel Download ಆಯಿತು');
}

function renderFDAManualAttendance(){
  const date=document.getElementById('fat_date')?.value || todayStr();
  const hrmsId=document.getElementById('fat_staff')?.value || STAFF[0].hrmsId;
  const type=document.getElementById('fat_type')?.value || 'Present';
  const isOD=type==='OD'||type==='OOD';
  const todayRecs=(DB.dailyAttendance||[]).filter(a=>a.date===date && a.enteredBy);

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>✍️ ಹಸ್ತಚಾಲಿತ ಹಾಜರಾತಿ ನಮೂದು (Manual Attendance Entry)</h2>
    <div class="desc">ಸಿಬ್ಬಂದಿ Busy/OD/OOD/Technical Problem ಇದ್ದಾಗ FDA ಪರವಾಗಿ ನಮೂದಿಸಿ</div></div>

    <div class="panel">
      <div class="form-grid">
        <div class="field"><label>ದಿನಾಂಕ</label><input type="date" id="fat_date" value="${esc(date)}" onchange="renderFDAManualAttendance()"></div>
        <div class="field"><label>HRMS ID / ಸಿಬ್ಬಂದಿ</label>
          <select id="fat_staff" onchange="renderFDAManualAttendance()">
            ${STAFF.map(s=>`<option value="${s.hrmsId}" ${hrmsId===s.hrmsId?'selected':''}>${esc(s.hrmsId)} — ${esc(s.name)} (${esc(s.desig||'')})</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಹಾಜರಾತಿ ಪ್ರಕಾರ</label>
          <select id="fat_type" onchange="renderFDAManualAttendance()">
            ${ATT_MANUAL_TYPES.map(t=>`<option value="${t}" ${type===t?'selected':''}>${esc(ATT_STATUS_LABELS[t]||t)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>ಯಾವ ಅವಧಿ</label>
          <select id="fat_session"><option value="both">Morning + Afternoon</option><option value="morning">Morning ಮಾತ್ರ</option><option value="afternoon">Afternoon ಮಾತ್ರ</option></select>
        </div>
      </div>
      ${isOD?`<div class="form-grid" style="margin-top:8px;border-top:1px dashed var(--border);padding-top:10px;">
        <div class="field"><label>${esc(type)} For <span class="req-star">*</span></label><input id="fat_odfor" placeholder="ಉದಾ: Sports Meet, Training"></div>
        <div class="field"><label>ಸ್ಥಳ (Place) <span class="req-star">*</span></label><input id="fat_odplace"></div>
        <div class="field" style="grid-column:1/-1;"><label>ಕಾರಣ (Reason) <span class="req-star">*</span></label><input id="fat_odreason"></div>
        <div class="field" style="grid-column:1/-1;"><label>📎 Supporting PDF (Order/Permission/Duty Letter — ಐಚ್ಛಿಕ)</label>
          <input type="file" id="fat_file" accept=".pdf">
        </div>
      </div>`:''}
      <div class="field" style="margin-top:8px;"><label>ಕಾರಣ / Remarks <span class="req-star">*</span></label>
        <input id="fat_reason" placeholder="ಉದಾ: Technical problem — phone not working">
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="saveFDAAttendance()">✅ Save & E-Sign</button></div>
    </div>

    <div class="panel"><h3>📋 ${fmtDate(date)} — Manual Entries (${todayRecs.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ಸಿಬ್ಬಂದಿ</th><th>Morning</th><th>Afternoon</th><th>ಕಾರಣ</th><th>ಸಿಬ್ಬಂದಿ ಪ್ರತಿಕ್ರಿಯೆ</th></tr></thead>
      <tbody>${todayRecs.length?todayRecs.map(r=>`<tr>
        <td><b>${esc(r.staffName)}</b></td><td>${attBadge(r.morningStatus)}</td><td>${attBadge(r.afternoonStatus)}</td>
        <td style="font-size:11px;">${esc(r.reason||'—')}</td>
        <td>${r.staffResponse==='Accepted'?'<span class="badge badge-ok">✅ Accepted</span>':r.staffResponse==='CorrectionRequested'?'<span class="badge badge-warn">✏️ Correction Requested</span>':'<span class="badge badge-draft">⏳ Pending</span>'}</td>
      </tr>`).join(''):`<tr class="empty-row"><td colspan="5">ಈ ದಿನ ಯಾವುದೇ Manual Entry ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>`;
}

async function saveFDAAttendance(){
  const date=document.getElementById('fat_date').value;
  const hrmsId=document.getElementById('fat_staff').value;
  const type=document.getElementById('fat_type').value;
  const session=document.getElementById('fat_session').value;
  const reason=document.getElementById('fat_reason').value;
  const isOD=type==='OD'||type==='OOD';
  const st=STAFF.find(s=>s.hrmsId===hrmsId); if(!st) return;

  if(!reason||!reason.trim()){ showToast('⚠ ಕಾರಣ ನಮೂದಿಸಿ'); return; }
  let odFor='',odPlace='',odReason='';
  if(isOD){
    odFor=document.getElementById('fat_odfor')?.value||'';
    odPlace=document.getElementById('fat_odplace')?.value||'';
    odReason=document.getElementById('fat_odreason')?.value||'';
    if(!odFor||!odPlace||!odReason){ showToast('⚠ OD/OOD For, Place, Reason ಎಲ್ಲಾ ಅಗತ್ಯ'); return; }
  }

  const doSave=async(fileData,fileName)=>{
    const rec=getOrCreateAttendance(date, hrmsId, st.name);
    showToast('⏳ Sign ಮಾಡಲಾಗುತ್ತಿದೆ...');
    const ts=await getServerTimeStamp();
    if(session==='both'||session==='morning'){ rec.morningStatus=type; rec.morningSignedAt=ts.time; rec.morningSignedDate=ts.date; rec.morningServerTime=ts.server; }
    if(session==='both'||session==='afternoon'){ rec.afternoonStatus=type; rec.afternoonSignedAt=ts.time; rec.afternoonSignedDate=ts.date; rec.afternoonServerTime=ts.server; }
    rec.enteredBy='fda'; rec.fdaName=CURRENT_USER.name; rec.fdaHrmsId=CURRENT_USER.hrmsId;
    rec.reason=reason.trim(); rec.staffResponse='Pending';
    if(isOD){ rec.odFor=odFor; rec.odPlace=odPlace; rec.odReason=odReason; }
    if(fileData){ rec.fileData=fileData; rec.fileName=fileName; }
    logAudit('Create','Attendance',rec.id,`FDA manual entry — ${st.name} — ${type}`);
    saveDB();
    pushNotification(st.name, `📋 ${fmtDate(date)} — FDA ಪರವಾಗಿ ಹಾಜರಾತಿ ನಮೂದಿಸಲಾಗಿದೆ (${ATT_STATUS_LABELS[type]||type}) — "ಹಾಜರಾತಿ ವಹಿ" ನಲ್ಲಿ ನೋಡಿ, ಒಪ್ಪಿಗೆ ನೀಡಿ`);
    showToast('✅ Save ಆಗಿದೆ & '+st.name+' ಗೆ ತಿಳಿಸಲಾಗಿದೆ');
    renderFDAManualAttendance();
  };

  const fileEl=document.getElementById('fat_file');
  const file=fileEl?.files?.[0];
  if(file){
    const reader=new FileReader();
    reader.onload=e=>doSave(e.target.result, file.name);
    reader.readAsDataURL(file);
  } else {
    doSave(null,null);
  }
}

function renderFDAMessageCentre(){
  const sent=(DB.fdaMessages||[]).slice().sort((a,b)=>b.sentAt.localeCompare(a.sentAt));

  document.getElementById('content').innerHTML=`
    <div class="page-head"><h2>📨 ಸಂದೇಶ ಕೇಂದ್ರ (FDA Message Centre)</h2>
    <div class="desc">Government Orders, KREIS Orders, Circulars ಇತ್ಯಾದಿ Staff ಗೆ ನೇರವಾಗಿ ಕಳುಹಿಸಿ — Principal ಅನುಮೋದನೆ ಅಗತ್ಯವಿಲ್ಲ</div></div>

    <div class="panel">
      <h3>➕ ಹೊಸ ಸಂದೇಶ</h3>
      <div class="form-grid">
        <div class="field"><label>ವಿಭಾಗ (Category)</label>
          <select id="mc_cat">${STAFF_FILE_CATS.filter(c=>c.key!=='notices').map(c=>`<option value="${c.key}">${c.ic} ${c.label}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ವಿಷಯ (Subject) <span class="req-star">*</span></label><input id="mc_subject" placeholder="ಉದಾ: GO No. ED 45/2026 — Holiday Notification"></div>
        <div class="field" style="grid-column:1/-1;"><label>ವಿವರ (Body)</label>
          <textarea id="mc_body" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;"></textarea>
        </div>
        <div class="field" style="grid-column:1/-1;"><label>📎 File Upload (PDF/Word — ಐಚ್ಛಿಕ)</label>
          <input type="file" id="mc_file" accept=".pdf,.doc,.docx" style="padding:6px;border:1px solid var(--border);border-radius:8px;width:100%;font-size:12px;">
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="font-size:12.5px;font-weight:600;">ಯಾರಿಗೆ ಕಳುಹಿಸಬೇಕು?</label>
        <div style="display:flex;gap:14px;margin:6px 0;">
          <label style="font-size:12px;"><input type="radio" name="mc_rtype" value="all" checked onchange="renderMCRecipients()"> ಎಲ್ಲಾ Staff</label>
          <label style="font-size:12px;"><input type="radio" name="mc_rtype" value="pick" onchange="renderMCRecipients()"> ಆಯ್ಕೆ ಮಾಡಿ (Single/Multiple)</label>
        </div>
        <div id="mc_recipients_wrap"></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" onclick="sendFDAMessage()">📤 ಕಳುಹಿಸಿ</button></div>
    </div>

    <div class="panel"><h3>📋 ಕಳುಹಿಸಿದ ಸಂದೇಶಗಳು (${sent.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>ವಿಷಯ</th><th>ವಿಭಾಗ</th><th>ಸ್ವೀಕರಿಸಿದವರು</th><th>ದಿನಾಂಕ</th><th>Action</th></tr></thead>
      <tbody>${sent.length?sent.map(m=>{
        const copies=(DB.staffInward||[]).filter(i=>i.msgId===m.id);
        const ackCt=copies.filter(c=>c.status==='Acknowledged'||c.status==='Saved').length;
        return `<tr>
        <td><b>${esc(m.subject)}</b></td>
        <td style="font-size:11px;">${esc(STAFF_FILE_CATS.find(c=>c.key===m.category)?.label||m.category)}</td>
        <td style="font-size:11px;">${m.recipientType==='all'?'ಎಲ್ಲಾ Staff ('+copies.length+')':copies.length+' ಜನ'}</td>
        <td style="font-size:11px;">${fmtDate(m.sentAt)}</td>
        <td class="actions-cell"><button class="btn btn-sm btn-outline" onclick="viewMessageStatus('${m.id}')">👁 ${ackCt}/${copies.length} Opened</button></td>
      </tr>`;
      }).join(''):`<tr class="empty-row"><td colspan="5">ಇನ್ನೂ ಯಾವುದೇ ಸಂದೇಶ ಇಲ್ಲ.</td></tr>`}</tbody></table></div>
    </div>
    <div id="mcStatusWrap"></div>`;
  renderMCRecipients();
}

function renderMCRecipients(){
  const wrap=document.getElementById('mc_recipients_wrap'); if(!wrap) return;
  const rtype=document.querySelector('input[name="mc_rtype"]:checked')?.value||'all';
  if(rtype==='all'){ wrap.innerHTML=`<div class="small-muted" style="font-size:11.5px;">ಎಲ್ಲಾ ${STAFF.length} ಸಿಬ್ಬಂದಿಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.</div>`; return; }
  wrap.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px;max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;">
    ${STAFF.map(s=>`<label style="display:flex;align-items:center;gap:4px;font-size:11.5px;border:1px solid var(--border);border-radius:6px;padding:3px 8px;cursor:pointer;">
      <input type="checkbox" class="mc_recipient" value="${s.hrmsId}"> ${esc(s.name)}
    </label>`).join('')}
  </div>`;
}

function sendFDAMessage(){
  const category=document.getElementById('mc_cat').value;
  const subject=document.getElementById('mc_subject').value.trim();
  const body=document.getElementById('mc_body').value.trim();
  const rtype=document.querySelector('input[name="mc_rtype"]:checked')?.value||'all';
  if(!subject){ showToast('⚠ ವಿಷಯ ನಮೂದಿಸಿ'); return; }
  let recipients=[];
  if(rtype==='all') recipients=STAFF.slice();
  else {
    const ids=[...document.querySelectorAll('.mc_recipient:checked')].map(el=>el.value);
    if(!ids.length){ showToast('⚠ ಕನಿಷ್ಠ ಒಬ್ಬ ಸಿಬ್ಬಂದಿ ಆಯ್ಕೆ ಮಾಡಿ'); return; }
    recipients=STAFF.filter(s=>ids.includes(s.hrmsId));
  }

  const doSend=(fileData,fileName)=>{
    const msg={ id:uid(), msgNo:'MSG-'+nextSeq('fdamsg'), category, subject, body,
      fileData:fileData||null, fileName:fileName||null,
      sentBy:CURRENT_USER.name, sentAt:todayStr(),
      recipientType:rtype, recipientCount:recipients.length };
    DB.fdaMessages.push(msg);

    recipients.forEach(s=>{
      DB.staffInward.push({ id:uid(), msgId:msg.id, hrmsId:s.hrmsId, staffName:s.name,
        category, subject, body, fileData:fileData||null, fileName:fileName||null,
        sentBy:CURRENT_USER.name, sentAt:todayStr(), status:'Unread',
        openedAt:null, savedAt:null, downloadedAt:null, savedFolder:null });
      if(!DB.noticeBoard) DB.noticeBoard=[];
      DB.noticeBoard.push({ id:uid(), to:s.hrmsId, toName:s.name,
        fromName:CURRENT_USER.name, fromHrmsId:CURRENT_USER.hrmsId,
        text:`📨 ${esc(STAFF_FILE_CATS.find(c=>c.key===category)?.label||category)}: ${subject}${body?'\n'+body:''}`,
        fileData:fileData||null, fileName:fileName||null, createdAt:todayStr(), dismissedBy:[] });
      pushNotification(s.name, `📨 ಹೊಸ ಸಂದೇಶ: ${subject} — "ನನ್ನ ಫೈಲ್‌ಗಳು" ನಲ್ಲಿ ನೋಡಿ`);
    });
    logAudit('Create','FDAMessage',msg.id,`${subject} — ${recipients.length} recipients`);
    saveDB();
    showToast('✅ '+recipients.length+' ಸಿಬ್ಬಂದಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ');
    renderFDAMessageCentre();
  };

  const fileEl=document.getElementById('mc_file');
  const file=fileEl?.files?.[0];
  if(file){ const reader=new FileReader(); reader.onload=e=>doSend(e.target.result,file.name); reader.readAsDataURL(file); }
  else doSend(null,null);
}

function viewMessageStatus(msgId){
  const msg=(DB.fdaMessages||[]).find(m=>m.id===msgId); if(!msg) return;
  const copies=(DB.staffInward||[]).filter(i=>i.msgId===msgId);
  const wrap=document.getElementById('mcStatusWrap'); if(!wrap) return;
  wrap.innerHTML=`<div class="panel" style="border:2px solid var(--navy);">
    <div style="display:flex;justify-content:space-between;"><h3 style="margin:0;">${esc(msg.subject)} — Status</h3>
    <button class="btn btn-sm btn-outline" onclick="document.getElementById('mcStatusWrap').innerHTML=''">✕</button></div>
    <div class="table-wrap" style="margin-top:10px;"><table style="font-size:12px;"><thead><tr><th>ಸಿಬ್ಬಂದಿ</th><th>ಸ್ಥಿತಿ</th><th>Folder ಗೆ Save</th></tr></thead>
    <tbody>${copies.map(c=>`<tr><td>${esc(c.staffName)}</td><td>${staffInwardStatusBadge(c.status)}</td><td style="font-size:11px;">${c.savedFolder?esc(STAFF_FILE_CATS.find(x=>x.key===c.savedFolder)?.label||c.savedFolder):'—'}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
  wrap.scrollIntoView({behavior:'smooth'});
}

function staffInwardStatusBadge(status){
  const map={Unread:'badge-warn',Opened:'badge-info',Saved:'badge-ok',Downloaded:'badge-info',Acknowledged:'badge-ok'};
  return `<span class="badge ${map[status]||''}">${esc(status)}</span>`;
}

;(window.__LOADED=window.__LOADED||[]).push('fda');
