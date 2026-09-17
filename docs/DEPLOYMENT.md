# Deployment Guide

Panduan ini menjelaskan deployment `taliabu-environmental` ke Cloudflare Workers dengan static assets dan Cloudflare D1.

## Prasyarat

- Node.js 20 atau lebih baru.
- Akun Cloudflare dengan akses Workers dan D1.
- Wrangler terpasang melalui dependency proyek.
- Kredensial Copernicus Data Space:
  - `COPERNICUS_CLIENT_ID`
  - `COPERNICUS_CLIENT_SECRET`
- Repository berada pada commit yang sudah lolos type-check dan build.

Jangan commit credential. File `.dev.vars`, `.env`, dan `.env.*` sudah di-ignore oleh repository.

## Development Lokal

Development menggunakan `wrangler.dev.jsonc` dan D1 lokal. Konfigurasi production di `wrangler.jsonc` tetap memakai D1 remote.

Terapkan migration ke database lokal sebelum menjalankan Worker:

```bash
npx wrangler d1 migrations apply taliabu-db --local --config wrangler.dev.jsonc
```

Jalankan frontend dan Worker di terminal terpisah:

```bash
npm run dev:worker
npm run dev
```

Jangan gunakan flag `--remote` saat development. Gunakan `--remote` hanya untuk migration production dengan `wrangler.jsonc`.

## 1. Instalasi dan Login

```bash
npm install
npx wrangler login
npx wrangler whoami
```

Pastikan `whoami` menampilkan akun Cloudflare yang akan menerima deployment.

## 2. Buat Database D1

Jika database belum pernah dibuat:

```bash
npx wrangler d1 create taliabu-db
```

Simpan `database_id` dari output perintah tersebut. Buka `wrangler.jsonc` dan ganti nilai berikut:

```jsonc
"database_id": "placeholder-replace-with-real-d1-id"
```

menjadi ID database yang diberikan Cloudflare.

Nama database harus tetap `taliabu-db`, sesuai `database_name` di `wrangler.jsonc`.

## 3. Terapkan Migration Remote

Setelah `database_id` sudah benar:

```bash
npx wrangler d1 migrations apply taliabu-db --remote
```

Migration saat ini membuat tabel metadata untuk scene satelit, analysis run, alert, konfigurasi aplikasi, dan deduplikasi alert. Raster tidak disimpan di D1.

Untuk memeriksa migration yang sudah diterapkan:

```bash
npx wrangler d1 migrations list taliabu-db --remote
```

Jalankan migration sebelum deployment Worker pertama yang membutuhkan binding `DB`.

## 4. Set Worker Secrets

Setiap perintah berikut meminta nilai secret secara interaktif:

```bash
npx wrangler secret put COPERNICUS_CLIENT_ID
npx wrangler secret put COPERNICUS_CLIENT_SECRET
```

Verifikasi nama secret dari dashboard Cloudflare atau konfigurasi Worker. Jangan menampilkan nilainya di log atau memasukkannya ke file konfigurasi.

## 5. Pemeriksaan Sebelum Deploy

Jalankan dari root repository:

```bash
npx vue-tsc --noEmit
npm run build
```

Periksa hal berikut sebelum melanjutkan:

- `wrangler.jsonc` tidak lagi memakai database ID placeholder.
- `npm run build` menghasilkan direktori `dist/`.
- Migration remote selesai tanpa error.
- Dua Worker secrets sudah tersedia.
- Tidak ada credential pada diff Git.

## 6. Deploy

```bash
npm run deploy
```

Script tersebut menjalankan `vite build` lalu `wrangler deploy`. URL Worker akan ditampilkan oleh Wrangler setelah deployment selesai.

## 7. Smoke Test

Simpan URL Worker dari output deployment, lalu periksa health endpoint:

```bash
curl -i https://<worker-subdomain>.workers.dev/api/health
```

Respons yang diharapkan:

```json
{"status":"ok","timestamp":"...","version":"0.1.0"}
```

Lanjutkan pemeriksaan di browser:

- halaman utama dapat dibuka langsung dari URL Worker;
- basemap dan layer konteks tampil;
- scene Sentinel-2 dapat dicari;
- render raster dapat dimuat setelah scene dipilih;
- AOI dapat digambar dan analisis menghasilkan status atau error yang terlihat;
- alert dapat disimpan dan dibaca kembali;
- export CSV, GeoJSON, JSON, PNG, dan share URL bekerja sesuai konteks;
- tombol `Guide` membuka guideline dan toggle EN/ID bekerja;
- tidak ada error baru di console browser.

## 8. Observasi Log

Jika request gagal setelah deployment, lihat log Worker secara langsung:

```bash
npx wrangler tail
```

Gunakan endpoint `/api/health` untuk membedakan masalah deployment dari masalah provider. Jika health endpoint gagal, periksa deployment dan binding `DB`. Jika health endpoint berhasil tetapi scene atau render gagal, periksa Worker secrets dan kredensial Copernicus.

## 9. Custom Domain

Custom domain belum didefinisikan di `wrangler.jsonc`. Setelah deployment awal tervalidasi, tambahkan domain dari Cloudflare Dashboard pada pengaturan Worker, atau tambahkan konfigurasi domain sesuai DNS dan zone yang digunakan.

Jangan mengubah konfigurasi domain sebelum URL `workers.dev` lulus smoke test.

## 10. Deployment Berikutnya

Untuk deployment setelah perubahan kode:

```bash
npx vue-tsc --noEmit
npm run deploy
```

Migration baru harus diterapkan secara terpisah sebelum fitur yang membutuhkannya digunakan:

```bash
npx wrangler d1 migrations apply taliabu-db --remote
```

Jangan menjalankan `wrangler d1 migrations apply --remote` dari branch atau commit yang belum direview.

## Troubleshooting

### `database_id` masih placeholder

Jalankan `npx wrangler d1 create taliabu-db`, salin ID database yang dihasilkan ke `wrangler.jsonc`, lalu ulangi migration dan deployment.

### Worker tidak dapat mengakses D1

Pastikan `database_name` adalah `taliabu-db`, `database_id` benar, dan migration dijalankan dengan flag `--remote`.

### Scene atau render gagal

Pastikan kedua secret Copernicus sudah diset pada akun Cloudflare yang sama dengan deployment. Periksa `npx wrangler tail` untuk status response dari provider.

### Halaman utama tidak tampil

Pastikan build berhasil dan asset directory tetap `dist` dengan binding `ASSETS` seperti di `wrangler.jsonc`. Periksa URL Worker tanpa prefix `/api`.

## Checklist Release

- [ ] `npx wrangler whoami` menunjuk akun yang benar.
- [ ] `database_id` production sudah diisi.
- [ ] Migration D1 remote sudah diterapkan.
- [ ] `COPERNICUS_CLIENT_ID` sudah diset sebagai Worker secret.
- [ ] `COPERNICUS_CLIENT_SECRET` sudah diset sebagai Worker secret.
- [ ] `npx vue-tsc --noEmit` berhasil.
- [ ] `npm run build` berhasil.
- [ ] `npm run deploy` berhasil.
- [ ] `/api/health` mengembalikan status `ok`.
- [ ] Smoke test browser selesai tanpa error console baru.
- [ ] Attribution dan batasan interpretasi data tetap tampil.
