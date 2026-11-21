# Wonderland OMS - Versi PWA (GitHub Pages + Google Apps Script)

Aplikasi yang sama persis (semua menu, semua fitur), tapi frontend-nya sekarang
PWA statis yang bisa di-install di HP (Android & iPhone) dan di-host gratis di GitHub Pages,
dengan Google Sheets tetap sebagai database lewat Google Apps Script.

## Arsitektur

```
HP (PWA terinstall, GitHub Pages)  --fetch POST (JSON)-->  Apps Script Web App (doPost)
                                                                  |
                                                            Google Sheets (database)
```

Frontend memanggil Web App lewat `fetch` POST dengan `Content-Type: text/plain` (tanpa preflight CORS).
`doPost` di Code.gs hanya mengizinkan fungsi di `API_WHITELIST_`.

## Langkah 1 - Update Google Apps Script

1. Ganti isi project Apps Script dengan `Code.gs` terbaru (sudah berisi `doPost`).
2. **Deploy > Manage deployments > pensil > Version: New version > Deploy**.
   - Execute as: **Me**
   - Who has access: **Anyone** (bukan "Anyone with Google account")
3. URL `/exec` sudah diisi di `config.js`. Tes: buka `URL/exec?pwa=manifest` di browser, harus muncul JSON.

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
