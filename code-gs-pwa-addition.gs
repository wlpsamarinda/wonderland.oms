/*************************************************************************************************
 * TAMBAHKAN KODE INI KE Code.gs ANDA (tidak mengubah fungsi yang sudah ada)
 *
 * LANGKAH:
 * 1. Di doGet(), TAMBAHKAN blok proxy berikut tepat SETelah blok `if (pwaParam === 'sw') {...}`:
 *
 *      if (pwaParam === 'proxy') {
 *        // Halaman proxy untuk PWA GitHub Pages: halaman ini berjalan di iframe
 *        // tersembunyi, menjalankan google.script.run atas nama halaman induk,
 *        // dan mengirim hasilnya kembali lewat postMessage.
 *        // ALLOWALL wajib agar bisa di-embed dari origin GitHub Pages.
 *        return HtmlService.createHtmlOutput(getPwaProxyHtml_())
 *          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
 *      }
 *
 * 2. TEMPEL fungsi getPwaProxyHtml_() ini di bagian bawah Code.gs:
 *************************************************************************************************/

function getPwaProxyHtml_() {
  return '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8"></head><body>' +
    '<scr' + 'ipt>' +
    'function send(msg){ try{ parent.postMessage(msg, "*"); }catch(e){} }' +
    'window.addEventListener("load", function(){ send({type:"gs-proxy-ready"}); });' +
    'window.addEventListener("message", function(e){' +
    '  var d = e.data || {};' +
    '  if(d.type !== "gs-call"){ return; }' +
    '  try {' +
    '    var runner = google.script.run' +
    '      .withSuccessHandler(function(res){ send({type:"gs-result", id:d.id, ok:true, res:res}); })' +
    '      .withFailureHandler(function(err){ send({type:"gs-result", id:d.id, ok:false, error:(err && err.message) || String(err)}); });' +
    '    runner[d.fn].apply(runner, d.args || []);' +
    '  } catch(err){' +
    '    send({type:"gs-result", id:d.id, ok:false, error:(err && err.message) || String(err)});' +
    '  }' +
    '});' +
    '</scr' + 'ipt>' +
    '</body></html>';
}

/*************************************************************************************************
 * 3. DEPLOY ULANG (WAJIB versi baru agar perubahan berlaku):
 *    Deploy > Manage deployments > pensil > New version > Deploy
 *    Pastikan "Who has access" = ANYONE (akses publik), lalu salin URL /exec
 *    ke file config.js di repo GitHub Anda.
 *************************************************************************************************/
