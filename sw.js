/*************************************************************************************************
 * Service Worker Wonderland OMS PWA
 * - App shell (index.html, config.js, api.js, manifest, ikon) di-cache agar
 *   halaman login & tampilan dasar tetap bisa dibuka offline.
 * - Request ke Google Apps Script TIDAK pernah di-cache (data HR/absensi/
 *   task harus selalu fresh dari server) - dan memang tidak bisa di-cache
 *   oleh SW karena cross-origin.
 * - CDN (xlsx) di-cache runtime agar fitur Import Excel tetap jalan.
 * Bump CACHE_NAME setiap kali ada update file agar HP user mendapat versi baru.
 *************************************************************************************************/
var CACHE_NAME = 'wonderland-pwa-v4';
var APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './api.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(evt){
  evt.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // add satu per satu supaya satu file gagal tidak membatalkan semua
      return Promise.all(APP_SHELL.map(function(url){
        return cache.add(url).catch(function(){ /* abaikan file yang gagal */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(evt){
  evt.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf('wonderland-pwa') !== -1 && k !== CACHE_NAME; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(evt){
  var url = new URL(evt.request.url);

  // Jangan pernah sentuh request ke Apps Script / Google - selalu network.
  if(url.hostname.indexOf('google') !== -1){ return; }

  // Navigasi halaman: network-first, fallback ke cache (offline tetap buka app)
  if(evt.request.mode === 'navigate'){
    evt.respondWith(
      fetch(evt.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put('./index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Aset statis & CDN: cache-first, lalu network (dan simpan ke cache)
  evt.respondWith(
    caches.match(evt.request).then(function(cached){
      if(cached){ return cached; }
      return fetch(evt.request).then(function(res){
        if(res && (res.status === 200 || res.type === 'opaque')){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(evt.request, copy); });
        }
        return res;
      });
    })
  );
});
