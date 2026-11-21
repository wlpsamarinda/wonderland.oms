# Wonderland OMS - Versi PWA (GitHub Pages + Google Apps Script)

Aplikasi yang sama persis (semua menu, semua fitur), tapi frontend-nya sekarang
PWA statis yang bisa di-install di HP (Android & iPhone) dan di-host gratis di GitHub Pages,
dengan Google Sheets tetap sebagai database lewat Google Apps Script.

## Arsitektur

```
HP (PWA terinstall, GitHub Pages)  --postMessage-->  iframe proxy tersembunyi
                                                          | google.script.run
                                                    Apps Script Web App
                                                          |
                                                    Google Sheets (database)
```

Browser tidak mengizinkan situs GitHub memanggil Apps Script langsung (CORS),
jadi dipakai pola *iframe proxy*: halaman Apps Script kecil (`?pwa=proxy`) berjalan
di iframe tersembunyi, menjalankan semua fungsi `Code.gs` apa adanya, dan hasilnya
dikirim balik ke halaman utama lewat `postMessage`.

## Langkah 1 - Update Google Apps Script (backend tetap sama)

1. Buka project Apps Script Anda (yang berisi `Code.gs`).
2. Buka file **`code-gs-pwa-addition.gs`** di repo ini, ikuti 2 langkah di dalamnya:
   - tambahkan blok `if (pwaParam === 'proxy') {...}` di `doGet()`
   - tempel fungsi `getPwaProxyHtml_()` di bawah file
3. **Deploy > Manage deployments > klik pensil > Version: New version > Deploy**.
   - Execute as: **Me**
   - Who has access: **Anyone** (wajib)
4. Salin URL yang berakhiran `/exec`.

## Langkah 2 - Deploy ke GitHub Pages

1. Buat repo GitHub baru, upload semua file dari folder ini.
2. Buka **Settings > Pages** > Source: `main` branch, folder `/ (root)` > Save.
3. Tunggu 1-2 menit, lalu buka `https://<username>.github.io/<repo>/`

## Langkah 3 - Hubungkan & Install di HP

1. Edit **`config.js`**, isi `APPS_SCRIPT_URL` dengan URL `/exec` dari Langkah 1.
2. Buka URL GitHub Pages di HP Chrome/Safari.
3. Install:
   - **Android/Chrome**: menu ⋮ > **Install app** / **Add to Home Screen**.
   - **iPhone/Safari**: tombol Share > **Add to Home Screen**.

## Catatan penting

- Data HR/absensi/task **tidak di-cache** offline - aplikasi butuh internet untuk
  baca/tulis data (sama seperti versi Apps Script sebelumnya). Yang di-cache hanya
  tampilan dasarnya supaya halaman tetap terbuka saat koneksi buruk.
- Login & semua session tetap berfungsi normal (token tersimpan di HP).
- Setiap ada update `Code.gs`, wajib **New version** deployment; setiap update
  file frontend, cukup push ke GitHub (bump `CACHE_NAME` di `sw.js` bila perlu
  memaksa HP pengguna mengambil versi terbaru).
