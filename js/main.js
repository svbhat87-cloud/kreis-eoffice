/* =====================================================================
   KREIS e-Office v38 — main.js
   ಎಲ್ಲಾ ಫೈಲ್‌ಗಳು ಲೋಡ್ ಆದ ನಂತರ ಆ್ಯಪ್ ಪ್ರಾರಂಭಿಸುತ್ತದೆ / Starts the app after every file has loaded
   ===================================================================== */
(function(){
  var need=["assets","core","common","students-staff","stock-assets","finance","correspondence","teacher","consolidate","attendance-salary","administration","documents","warden","meetings","fda","principal","home","training-cert","training-materials","certimport","other"];
  var got=window.__LOADED||[];
  var miss=need.filter(function(n){ return got.indexOf(n)<0; });
  if(miss.length){
    document.body.innerHTML='<div style="font-family:sans-serif;max-width:520px;margin:12vh auto;padding:24px;border:1px solid #e6b3ae;background:#fdeceb;border-radius:10px;color:#7a1f1a;">'+
      '<b>ಕೆಲವು ಫೈಲ್‌ಗಳು ಲೋಡ್ ಆಗಿಲ್ಲ</b> ('+miss.join(', ')+').<br><br>ದಯವಿಟ್ಟು <b>Ctrl+Shift+R</b> ಒತ್ತಿ ಪುಟವನ್ನು ಮತ್ತೆ ಲೋಡ್ ಮಾಡಿ. ಸಮಸ್ಯೆ ಮುಂದುವರಿದರೆ ಎಲ್ಲ ಫೈಲ್‌ಗಳನ್ನು (js ಫೋಲ್ಡರ್ ಸೇರಿ) GitHub ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.</div>';
    return;
  }
  init();
})();
