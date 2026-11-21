/*************************************************************************************************
 * GAS_API - jembatan antara PWA statis (GitHub Pages) dan Google Apps Script.
 *
 * Memakai fetch POST langsung ke Web App (doPost di Code.gs). Content-Type sengaja text/plain
 * agar request tergolong "simple request" (tanpa preflight CORS, yang tidak didukung Apps Script).
 * Antarmuka tetap sama: GAS_API.invoke(namaFungsi, [args]) -> Promise<respons>.
 *************************************************************************************************/
var GAS_API = (function(){
  var TIMEOUT_MS = 60000;

  function invoke(fnName, args){
    return new Promise(function(resolve, reject){
      if(!window.APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('https://script.google.com/macros/s/') !== 0){
        reject(new Error('URL Web App Apps Script belum diatur di config.js.'));
        return;
      }
      var controller = ('AbortController' in window) ? new AbortController() : null;
      var timer = setTimeout(function(){
        if(controller){ controller.abort(); }
        reject(new Error('Permintaan ke server terlalu lama (timeout). Periksa koneksi internet Anda.'));
      }, TIMEOUT_MS);

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn: fnName, args: args || [] }),
        redirect: 'follow',
        signal: controller ? controller.signal : undefined
      }).then(function(res){
        return res.text().then(function(text){
          clearTimeout(timer);
          var data;
          try { data = JSON.parse(text); }
          catch(e){
            reject(new Error('Server mengembalikan respons tidak valid. Pastikan Web App sudah di-deploy versi terbaru dengan akses "Anyone" (bukan "Anyone with Google account").'));
            return;
          }
          resolve(data);
        });
      }).catch(function(err){
        clearTimeout(timer);
        reject(new Error('Tidak bisa menghubungi server Apps Script. Periksa koneksi internet, URL di config.js, dan pastikan Web App di-deploy dengan akses "Anyone".'));
      });
    });
  }

  return { invoke: invoke };
})();

/*************************************************************************************************
 * PWA: service worker + prompt "Install / Add to Home Screen"
 *************************************************************************************************/
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(){ /* registrasi SW gagal tidak fatal */ });
  });
}

var deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  deferredInstallPrompt = e;
  var banner = document.getElementById('pwaInstallBanner');
  var btn = document.getElementById('pwaInstallBtn');
  if(banner && banner.style.display === 'none'){
    banner.style.display = 'flex';
    if(btn) btn.style.display = 'inline-block';
  }
});
if(typeof window.pwaTriggerInstall !== 'function'){
  window.pwaTriggerInstall = function(){
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function(){
        deferredInstallPrompt = null;
        window.pwaDismissBanner();
      });
    } else {
      toast('INFO', 'Di browser HP: buka menu browser lalu pilih "Add to Home Screen" / "Install App".');
    }
  };
}
if(typeof window.pwaDismissBanner !== 'function'){
  window.pwaDismissBanner = function(){
    var b = document.getElementById('pwaInstallBanner');
    if(b){ b.style.display = 'none'; }
    try{ localStorage.setItem('wlp_pwa_banner_dismissed', '1'); } catch(e){}
  };
}
document.addEventListener('DOMContentLoaded', function(){
  try{
    if(localStorage.getItem('wlp_pwa_banner_dismissed') === '1'){ window.pwaDismissBanner(); }
  } catch(e){}
});
