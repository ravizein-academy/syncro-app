# Panduan Deployment Syncro (ITSEC Academy Workspace)

Dokumen ini memuat panduan lengkap dan checklist prasyarat sebelum mendeploy aplikasi **Syncro** ke lingkungan production.

---

## 1. Checklist Prasyarat (Pre-flight Checklist)

Sebelum melakukan deployment, pastikan hal-hal berikut telah disiapkan:

- [x] **Next.js Production Build**: Telah diuji dan berhasil dikompilasi tanpa error (`npm run build`).
- [x] **Type Safety**: Lolos validasi TypeScript tanpa error (`npx tsc --noEmit`).
- [x] **Prisma Client Auto-Generation**: Skrip `"postinstall": "prisma generate"` telah ditambahkan ke `package.json`.
- [x] **Strict Domain Security**: Pendaftaran dan login akun dibatasi khusus untuk domain `@itsecacademy.com` dan `@itsecasia.com`.
- [x] **Database Schema**: Skema Prisma PostgreSQL (`prisma/schema.prisma`) siap disinkronisasi.
- [x] **PWA & Assets**: Service worker (`public/sw.js`), manifest (`public/manifest.json`), dan favicon resmi Syncro telah terkonfigurasi.
- [x] **Docker Support**: `Dockerfile` multi-stage, `.dockerignore`, dan `docker-compose.yml` telah disediakan.

---

## 2. Environment Variables yang Wajib Disiapkan di Production

Siapkan nilai-nilai berikut di dashboard hosting Anda (misal Vercel / Railway / file `.env` di VPS):

| Variabel | Deskripsi | Contoh Nilai | Wajib? |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Connection string PostgreSQL (Neon/Supabase/RDS) | `postgresql://user:pass@ep-xyz.neon.tech/syncro?sslmode=require` | **Ya** |
| `NEXTAUTH_URL` | URL domain production aplikasi Anda | `https://syncro.itsecacademy.com` | **Ya** |
| `NEXTAUTH_SECRET` | Kunci rahasia enkripsi JWT sesi (minimal 32 karakter acak) | Buat acak: `openssl rand -base64 32` | **Ya** |
| `AUTH_SECRET` | Kunci alternatif NextAuth v5 | Sama dengan `NEXTAUTH_SECRET` | Opsional |
| `ALLOWED_EMAIL_DOMAIN` | Domain email yang diizinkan untuk registrasi & login | `itsecacademy.com,itsecasia.com` | **Ya** |
| `GOOGLE_CLIENT_ID` | OAuth Client ID Google Cloud Console | `xxx.apps.googleusercontent.com` | Opsional |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret Google | `GOCSPX-xxxx` | Opsional |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Refresh Token Google Drive API (upload lampiran tiket) | `1//04xxx...` | Opsional |
| `GOOGLE_DRIVE_FOLDER_ID` | ID Folder Google Drive untuk media tiket | `1A2B3C4D...` | Opsional |

> **Tips Membuat Secret**:
> Jalankan perintah berikut di terminal untuk membuat string rahasia:
> ```bash
> openssl rand -base64 32
> ```

---

## 3. Langkah Menyiapkan Database Production

Sebelum pertama kali menjalankan aplikasi di production, buat tabel-tabel di database Anda:

```bash
# Sinkronkan schema Prisma ke database production
npx prisma db push
```

---

## 4. Panduan Deployment ke Cloudflare Pages (Pilihan Utama)

Aplikasi Syncro telah dikonfigurasi 100% kompatibel dengan **Cloudflare Pages & Edge Runtime** menggunakan `@cloudflare/next-on-pages` dan adapter Neon PostgreSQL.

### Cara 1: Deploy Otomatis via Cloudflare Dashboard (GitHub Git-Integration - Sangat Direkomendasikan)

1. **Push Kode ke GitHub**:
   Pastikan kode terbaru sudah di-commit dan di-push ke repository GitHub Anda:
   ```bash
   git add .
   git commit -m "feat: syncro ready for cloudflare pages deployment"
   git push origin main
   ```

2. **Buka Dashboard Cloudflare**:
   - Masuk ke [dash.cloudflare.com](https://dash.cloudflare.com).
   - Di menu sebelah kiri, pilih **Compute (Workers & Pages)** > **Create application** > tab **Pages** > **Connect to Git**.
   - Pilih repository GitHub Anda.

3. **Konfigurasi Build Settings**:
   - **Project name**: `syncro-workspace` (atau nama pilihan Anda)
   - **Production branch**: `main` (atau `master`)
   - **Framework preset**: Pilih **`None`** (atau `Next.js`)
   - **Build command**:
     ```bash
     npx @cloudflare/next-on-pages
     ```
   - **Build output directory**:
     ```bash
     .vercel/output/static
     ```

4. **Pengaturan Compatibility Flags (Penting!)**:
   - Scroll ke bagian **Environment variables & Compatibility flags**:
   - Di bagian **Compatibility flags**: Tambahkan `nodejs_compat`.
   - Di bagian **Compatibility date**: Masukkan `2024-09-23`.

5. **Masukkan Environment Variables di Cloudflare**:
   Tambahkan variabel berikut di menu **Environment variables (Production)**:
   - `NODE_VERSION`: `20`
   - `DATABASE_URL`: Connection string PostgreSQL Anda (contoh: Neon Serverless dengan SSL)
   - `NEXTAUTH_URL`: URL domain Cloudflare Pages Anda (misal `https://syncro-workspace.pages.dev` atau domain kantor kustom)
   - `NEXTAUTH_SECRET`: String acak aman minimal 32 karakter (dihasilkan via `openssl rand -base64 32`)
   - `ALLOWED_EMAIL_DOMAIN`: `itsecacademy.com,itsecasia.com`

6. **Klik "Save and Deploy"**:
   Cloudflare akan otomatis mengompilasi dan men-deploy aplikasi ke ratusan data center Edge di seluruh dunia dengan sertifikat HTTPS SSL otomatis aktif!

---

### Cara 2: Deploy Cepat via Terminal (Wrangler CLI)

Jika ingin melakukan deploy langsung dari terminal komputer Anda:

1. **Login ke Akun Cloudflare**:
   ```bash
   npx wrangler login
   ```
   *(Browser akan terbuka untuk konfirmasi login satu kali)*

2. **Jalankan Skrip Deploy**:
   ```bash
   npm run deploy
   ```
   *(Perintah ini akan otomatis menjalankan `npx @cloudflare/next-on-pages` dan mengunggah output `.vercel/output/static` ke Cloudflare Pages).*

3. **Sinkronkan Database**:
   ```bash
   npx prisma db push
   ```

---

## 5. Opsi Deployment Alternatif

### Opsi B: Deploy ke Vercel

1. Hubungkan repo ke [vercel.com](https://vercel.com).
2. Tambahkan variabel lingkungan: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ALLOWED_EMAIL_DOMAIN`.
3. Klik **Deploy**.

---

### Opsi C: Deploy Menggunakan Docker (VPS / Cloud Server)

1. Jalankan `docker compose up -d --build`.
2. Jalankan `docker compose exec app npx prisma db push`.
3. Akses aplikasi di port `3000`.

---

## 6. Verifikasi Pasca-Deploy

Setelah aplikasi berhasil terdeploy:
1. Kunjungi halaman utama `https://domain-anda.pages.dev` (atau domain kustom Anda).
2. Klik **Sign In** & coba lakukan pendaftaran akun baru:
   - Pastikan email berakhiran `@itsecacademy.com` atau `@itsecasia.com` dapat mendaftar.
   - Pastikan email selain itu ditolak secara otomatis oleh sistem.
3. Buat satu tiket baru untuk memastikan form pembuatan tiket dan tabel berfungsi normal.
