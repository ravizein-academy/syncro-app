# Peran & Tujuan
Bertindaklah sebagai Full-Stack Developer Ahli dan "Vibe Coder" yang berspesialisasi dalam Next.js App Router, Cloudflare Pages (Edge Runtime), dan Progressive Web Apps (PWA). Tugas Anda adalah membangun aplikasi web Manajemen Tugas internal (kloning ClickUp) yang *scalable* dan dirancang khusus untuk kebutuhan kantor.

# Tech Stack & Infrastruktur
- **Frontend & API:** Next.js 14/15 (App Router), React, Tailwind CSS, Shadcn UI (untuk komponen UI yang cepat dan bersih).
- **Deployment:** Cloudflare Pages (Edge Runtime via `@cloudflare/next-on-pages`).
- **Database:** PostgreSQL (di-host di Neon) menggunakan Prisma ORM dengan `@prisma/adapter-neon` dan `@neondatabase/serverless` (koneksi berbasis WebSocket agar kompatibel dengan lingkungan Edge).
- **Autentikasi:** NextAuth.js (Auth.js) menggunakan Google Provider.
- **Penyimpanan (Storage):** Google Drive API untuk lampiran gambar dan video.
- **PWA:** `@serwist/next` untuk kemampuan *offline* dan instalasi di desktop maupun mobile.

# Kebutuhan & Fitur Utama

## 1. Autentikasi (Hanya Domain Kantor)
- Implementasikan Google OAuth menggunakan NextAuth.
- **SANGAT PENTING:** Batasi akses login HANYA untuk pengguna dengan domain email kantor (misalnya: `@domainkantor.com`). Tolak semua percobaan login dari domain standar `@gmail.com` atau domain eksternal lainnya menggunakan *callback* `signIn`.

## 2. Skema Database (Prisma)
Buat skema Prisma dengan entitas utama berikut:
- `User`: id, email, name, role.
- `Project`/`Workspace`: id, name, description, createdBy.
- `Task`: id, title, description, status (TODO, IN_PROGRESS, DONE), mediaUrls (String[]), projectId, assigneeId.

## 3. Upload Media (Integrasi Google Drive Kompatibel dengan Edge)
- **BATASAN KRITIS:** Karena aplikasi ini akan di-deploy ke Cloudflare Pages (Edge Runtime), Anda TIDAK BOLEH menggunakan *package* Node.js `googleapis`, serta modul `fs`, atau `stream`.
- Implementasikan *route* untuk upload (`/api/upload`) menggunakan Web API standar yaitu `fetch`.
- Gunakan Google OAuth 2.0 Refresh Token untuk meminta `access_token` secara dinamis melalui REST API.
- Buat *request body* berformat `multipart/related` secara manual untuk mengunggah file (gambar/video) langsung ke ID Folder Google Drive spesifik melalui REST API (`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`).
- Simpan `webViewLink` yang dihasilkan ke dalam array `mediaUrls` pada model `Task` di Prisma.

## 4. Konfigurasi PWA
- Bungkus konfigurasi Next.js dengan `@serwist/next`.
- Pastikan file `manifest.json` yang valid dan ikon-ikon telah dikonfigurasi sehingga aplikasi web akan memunculkan *prompt* "Install App" kepada pengguna di OS Windows, macOS, iOS, dan Android.

## 5. UI/UX (Gaya ClickUp)
- Bangun *layout dashboard* yang responsif dengan *sidebar* (untuk Projects/Workspaces) dan area konten utama.
- Buat tampilan papan Kanban (Kanban board) dan tampilan Daftar (List view) untuk daftar Tugas (Tasks).
- Sertakan *modal* atau *drawer* untuk membuat tugas baru, menetapkan pengguna (*assignee*), dan mengunggah media.
- Gunakan fitur *drag-and-drop* (misalnya menggunakan `dnd-kit` atau `@hello-pangea/dnd`) untuk memindahkan tugas antar status jika memungkinkan, atau sediakan *dropdown* sederhana untuk mengubah status.

# Langkah-langkah Eksekusi
1. Inisialisasi proyek Next.js dan konfigurasikan Shadcn UI.
2. Siapkan skema Prisma dan *client* Edge *serverless* untuk Neon PostgreSQL.
3. Buat *route* NextAuth dan lindungi *layout* aplikasi utama dari akses tanpa izin.
4. Bangun *API route* untuk upload ke Google Drive yang kompatibel dengan Edge.
5. Kembangkan Frontend UI (Dashboard, Papan Kanban, Modal pembuatan tugas dengan fitur upload file).
6. Konfigurasikan Serwist untuk dukungan PWA.

Harap berikan implementasinya langkah demi langkah, dimulai dari perintah inisialisasi proyek, dependensi di `package.json` (pastikan kompatibilitas edge), dan file `schema.prisma`.