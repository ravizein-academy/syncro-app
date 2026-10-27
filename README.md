# Syncro - Pusat Kendali Operasional & Manajemen Tiket ITSEC Academy

**Syncro** adalah platform manajemen tiket operasional modern (*ClickUp style*) yang dirancang khusus untuk ekosistem kerja **ITSEC Academy** dan **ITSEC Asia**.

---

## Fitur Utama

- **Pusat Kendali Operasional Tiket**: Dashboard pelacakan tiket komprehensif dengan metrik antrean triage, tiket overdue, tiket kritis, dan tiket aktif.
- **Menu Filter Dinamis & Responsif**: Dropdown menu pemfilteran kategori tiket yang rapi dan tidak tumpang tindih dengan kolom pencarian di semua ukuran layar (Mobile, Tablet, Desktop).
- **Inline Status, Prioritas, & Penugasan PIC**: Pembaruan status tiket (*To Do*, *In Progress*, *Completed*), penyesuaian prioritas, dan penugasan PIC langsung dari sel tabel secara instan.
- **Tabel Bebas Scrollbar Horizontal di Desktop**: Tata letak `table-fixed` proporsional yang pas 100% pada layar komputer tanpa memotong kolom tombol aksi.
- **Keamanan Domain Ketat**: Pendaftaran akun dan otentikasi hanya diizinkan bagi pengguna dengan domain resmi `@itsecacademy.com` dan `@itsecasia.com`.
- **Kapabilitas PWA**: Dukungan Service Worker dan Web App Manifest untuk pengalaman aplikasi cepat dan instalasi pada perangkat seluler/desktop.

---

## Panduan Deployment

Semua persiapan dan panduan langkah-demi-langkah untuk melakukan deployment ke **Vercel**, **Docker / VPS**, maupun **Cloudflare Pages** telah disusun lengkap di dokumen:

👉 **[Baca Panduan Deployment (DEPLOYMENT.md)](./DEPLOYMENT.md)**

---

## Menjalankan Secara Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Salin environment variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## Skrip Penting

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan lokal |
| `npm run build` | Melakukan build produksi Next.js yang teroptimasi |
| `npm run start` | Menjalankan server produksi hasil build |
| `npm run lint` | Memeriksa kepatuhan kode dengan ESLint |
| `npx prisma db push` | Menyinkronkan skema database ke database PostgreSQL |
