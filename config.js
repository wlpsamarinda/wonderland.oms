/*************************************************************************************************
 * KONFIGURASI PWA - GANTI URL INI SETELAH DEPLOY GOOGLE APPS SCRIPT
 *
 * 1. Buka project Apps Script Anda (Code.gs)
 * 2. Tambahkan kode proxy dari file code-gs-pwa-addition.gs
 * 3. Deploy > New deployment > Web app
 *      - Execute as : Me
 *      - Who has access : Anyone
 * 4. Salin URL yang berakhiran /exec ke bawah ini
 *
 * Tanpa langkah ini, aplikasi GitHub Pages TIDAK bisa terhubung ke database
 * Google Sheets (CORS). Pola yang dipakai: iframe proxy + postMessage.
 *************************************************************************************************/
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/ISI_DENGAN_URL_EXEC_ANDA/exec';
