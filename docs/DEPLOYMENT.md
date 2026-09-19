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

Frontend production membutuhkan origin API melalui `VITE_API_ORIGIN`. Buat `.env.production` secara lokal sebelum build:

```bash
printf 'VITE_API_ORIGIN=https://api.example.com\n' > .env.production
```

Ganti nilainya dengan hostname API deployment yang sebenarnya. Development tidak memerlukan nilai ini karena Vite memakai proxy `/api` ke Worker lokal.

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

## 5. Cloudflare Security Infrastructure

WAF custom rules dan rate limiting dikelola melalui Terraform, terpisah dari
deployment Worker:

```text
infrastructure/cloudflare/
├── provider.tf
├── waf.tf
└── rate-limit.tf
```

Buat API Token Cloudflare dengan permission berikut:

```text
Zone → WAF → Edit
Zone resource → jelajahtaliabu.web.id
```

`environment.jelajahtaliabu.web.id` berada di dalam zone tersebut. Token tidak
boleh disimpan di repository atau file `.tfvars`.

Ambil `Zone ID` dari Cloudflare Dashboard pada halaman Overview zone
`jelajahtaliabu.web.id`, lalu jalankan dari direktori Terraform:

```bash
cd infrastructure/cloudflare
export TF_VAR_cloudflare_api_token="..."
export TF_VAR_cloudflare_zone_id="..."

terraform init
terraform fmt
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Konfigurasi ini membuat:

- WAF block untuk scanner secret, WordPress, PHP, backup, dan server extension
  yang tidak digunakan aplikasi;
- rate limit `60 requests / 10 seconds / IP` untuk `/api/render` dan
  `/api/copernicus/*`.

Terraform state saat ini bersifat lokal dan di-ignore oleh Git. Jalankan
Terraform dari satu workspace yang menyimpan state tersebut secara aman.
Jangan menjalankan `apply` paralel dari beberapa mesin.

Free Managed Ruleset, Security Events review, dan Bot Fight Mode tetap
dikelola dari Cloudflare Dashboard:

```text
Security → WAF → Managed rules
Security → Events
Security → Bots
```

Bot Fight Mode diaktifkan hanya setelah traffic browser dan API diverifikasi.

## 6. Pemeriksaan Sebelum Deploy

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

## 7. Deploy

```bash
npm run deploy
```

Script tersebut menjalankan `vite build` lalu `wrangler deploy`. URL Worker akan ditampilkan oleh Wrangler setelah deployment selesai.

## 8. Smoke Test

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

## 9. Observasi Log

Jika request gagal setelah deployment, lihat log Worker secara langsung:

```bash
npx wrangler tail
```

Gunakan endpoint `/api/health` untuk membedakan masalah deployment dari masalah provider. Jika health endpoint gagal, periksa deployment dan binding `DB`. Jika health endpoint berhasil tetapi scene atau render gagal, periksa Worker secrets dan kredensial Copernicus.

## 10. Custom Domain

Production custom domain sudah didefinisikan di `wrangler.jsonc`:

```jsonc
"routes": [
  {
    "pattern": "environment.jelajahtaliabu.web.id",
    "custom_domain": true
  }
]
```

Worker yang sama juga memakai custom domain API:

```text
https://api.environment.jelajahtaliabu.web.id/api/health
```

Hostname `api.` bersifat API-only. Path selain `/api` dan `/api/*` selalu
mengembalikan JSON `404`; domain utama tetap melayani aplikasi Vue. Frontend
production menggunakan base URL `https://api.environment.jelajahtaliabu.web.id`
untuk request API; Vite tetap memakai proxy lokal saat development.

Pastikan zone `jelajahtaliabu.web.id` berada pada account Cloudflare yang sama
dengan Worker dan API Token. Setelah deploy, uji domain tersebut secara
langsung:

```bash
curl -i https://environment.jelajahtaliabu.web.id/api/health
```

Jangan mengubah konfigurasi domain sebelum URL `workers.dev` lulus smoke test.

## 11. Deployment Berikutnya

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

## 12. Verifikasi Security Setelah Deploy

Path yang tidak mungkin valid harus berhenti di edge atau menghasilkan `404`,
bukan SPA shell `200`:

```bash
curl -I https://environment.jelajahtaliabu.web.id/.env
curl -I https://environment.jelajahtaliabu.web.id/wp-admin
curl -I https://environment.jelajahtaliabu.web.id/foo.php
curl -i https://environment.jelajahtaliabu.web.id/random-exploit-path
```

Request scanner yang diblokir WAF seharusnya muncul sebagai event pada:

```text
Security → Events
```

Endpoint aplikasi normal harus tetap bekerja:

```bash
curl -i https://environment.jelajahtaliabu.web.id/api/health
```

Expected: `200` untuk health check, `403` atau action block Cloudflare untuk
scanner, dan `404` untuk unknown path yang mencapai Worker.

## 13. Troubleshooting

### `database_id` masih placeholder

Jalankan `npx wrangler d1 create taliabu-db`, salin ID database yang dihasilkan ke `wrangler.jsonc`, lalu ulangi migration dan deployment.

### Worker tidak dapat mengakses D1

Pastikan `database_name` adalah `taliabu-db`, `database_id` benar, dan migration dijalankan dengan flag `--remote`.

### Scene atau render gagal

Pastikan kedua secret Copernicus sudah diset pada akun Cloudflare yang sama dengan deployment. Periksa `npx wrangler tail` untuk status response dari provider.

### Halaman utama tidak tampil

Pastikan build berhasil dan asset directory tetap `dist` dengan binding `ASSETS` seperti di `wrangler.jsonc`. Periksa URL Worker tanpa prefix `/api`.

### Terraform gagal membuat ruleset

Pastikan `TF_VAR_cloudflare_api_token` masih valid, permission token adalah
`Zone → WAF → Edit`, dan zone ID cocok dengan `jelajahtaliabu.web.id`. Jika
ruleset sudah dibuat manual di dashboard, jangan membuat entry point ruleset
kedua pada phase yang sama; import resource yang sudah ada atau hapus resource
manual setelah memastikan konfigurasinya aman.

### Scanner masih mencapai Worker

`404` dari Worker berarti routing aplikasi bekerja, tetapi request belum
diblokir di edge. Periksa resource `cloudflare_ruleset.waf_custom`, pastikan
zone benar, lalu lihat `Security → Events` untuk mengetahui apakah rule
berstatus `Block` dan request melewati zone yang sama.

## 14. Checklist Release

- [ ] `npx wrangler whoami` menunjuk akun yang benar.
- [ ] `database_id` production sudah diisi.
- [ ] Migration D1 remote sudah diterapkan.
- [ ] `COPERNICUS_CLIENT_ID` sudah diset sebagai Worker secret.
- [ ] `COPERNICUS_CLIENT_SECRET` sudah diset sebagai Worker secret.
- [ ] `npx vue-tsc --noEmit` berhasil.
- [ ] `npm run build` berhasil.
- [ ] `npm run deploy` berhasil.
- [ ] `terraform init` dan `terraform validate` berhasil.
- [ ] `terraform apply tfplan` berhasil.
- [ ] WAF custom rules terlihat pada `Security → WAF → Custom rules`.
- [ ] Rate limiting rule terlihat pada `Security → WAF → Rate limiting rules`.
- [ ] `/api/health` mengembalikan status `ok`.
- [ ] Path scanner mendapat block atau `404`, bukan SPA shell `200`.
- [ ] Security Events tidak menunjukkan false positive pada traffic aplikasi.
- [ ] Smoke test browser selesai tanpa error console baru.
- [ ] Attribution dan batasan interpretasi data tetap tampil.
