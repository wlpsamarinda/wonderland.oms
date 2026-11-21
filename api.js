/*************************************************************************************************
 * GAS_API - jembatan antara PWA statis (GitHub Pages) dan Google Apps Script.
 *
 * google.script.run HANYA bisa dipakai di halaman yang disajikan Apps Script
 * sendiri. Karena frontend sekarang di-host statis di GitHub Pages, kita memakai
 * pola "iframe proxy":
 *   - iframe tersembunyi memuat Web App Apps Script (?pwa=proxy)
 *   - iframe itu menjalankan google.script.run secara internal
 *   - hasilnya dikirim balik ke halaman induk lewat postMessage
 * Semua fungsi backend (Code.gs) bisa dipanggil apa adanya lewat invoke().
 *************************************************************************************************/
var GAS_API = (function(){
  var iframe = null, ready = false, seq = 0, pending = {}, loadPromise = null;

  function onMessage(e){
    var d = e.data || {};
    if(d.type === 'gs-proxy-ready'){ ready = true; return; }
    if(d.type === 'gs-result'){
      var p = pending[d.id];
      if(p){
        delete pending[d.id];
        if(d.ok){ p.resolve(d.res); } else { p.reject(new Error(d.error || 'Server error')); }
      }
    }
  }

  function ensureIframe(){
    if(ready && iframe){ return Promise.resolve(); }
    if(loadPromise){ return loadPromise; }
    loadPromise = new Promise(function(resolve, reject){
      if(!window.APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('https://script.google.com/macros/s/') !== 0){
        reject(new Error('URL Web App Apps Script belum diatur di config.js. Ikuti petunjuk di file tersebut.'));
        return;
      }
      window.addEventListener('message', onMessage);
      iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
      var timer = setTimeout(function(){
        reject(new Error('Tidak bisa menghubungi server Apps Script. Periksa URL di config.js, koneksi internet, dan pastikan Web App sudah di-deploy dengan akses "Anyone".'));
      }, 25000);
      iframe.addEventListener('load', function(){
        var wait = setInterval(function(){
          if(ready){ clearInterval(wait); clearTimeout(timer); resolve(); }
        }, 200);
        setTimeout(function(){ clearInterval(wait); }, 20000);
      });
      iframe.src = APPS_SCRIPT_URL + '?pwa=proxy';
      document.body.appendChild(iframe);
    });
    return loadPromise;
  }

  function invoke(fnName, args){
    return ensureIframe().then(function(){
      return new Promise(function(resolve, reject){
        var id = ++seq;
        pending[id] = { resolve: resolve, reject: reject };
        var timer = setTimeout(function(){
          if(pending[id]){
            delete pending[id];
            reject(new Error('Permintaan ke server terlalu lama (timeout). Periksa koneksi internet Anda.'));
          }
        }, 45000);
        var origResolve = pending[id].resolve, origReject = pending[id].reject;
        pending[id].resolve = function(v){ clearTimeout(timer); origResolve(v); };
        pending[id].reject = function(e){ clearTimeout(timer); origReject(e); };
        try {
          iframe.contentWindow.postMessage({ type: 'gs-call', id: id, fn: fnName, args: args || [] }, '*');
        } catch(err){
          delete pending[id];
          reject(new Error('Gagal mengirim permintaan ke server: ' + (err && err.message ? err.message : err)));
        }
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
