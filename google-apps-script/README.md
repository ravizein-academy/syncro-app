# Setup Google Apps Script Backend (Database Google Sheets)

Syncro memanfaatkan **Google Sheets + Google Apps Script** sebagai backend database berbasis REST API yang **100% Free Tier**, tanpa biaya server bulanan.

---

## 1. Langkah Instalasi (3 Menit)

1. Buka [Google Sheets Baru](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet, contoh: `Syncro Database`.
3. Di menu atas, klik **Extensions (Ekstensi)** > **Apps Script**.
4. Hapus semua kode default di file `Code.gs`, lalu copy-paste seluruh kode dari file:
   [`google-apps-script/Code.gs`](./Code.gs)
5. Simpan file (`Ctrl + S` atau `Cmd + S`).
6. Di dropdown fungsi bagian atas editor Apps Script, pilih fungsi **`initDatabase`** atau **`seedDemoData`**, lalu klik tombol **Run (Jalankan)**.
   * *Catatan:* Saat pertama kali dijalankan, Google akan meminta izin otorisasi akses spreadsheet. Klik *Review Permissions* > pilih akun Anda > *Advanced* > *Go to ... (unsafe)* > *Allow*.
   * Sheet secara otomatis akan terisi tabel `Tasks`, `Users`, `Teams`, `Spaces`, dan `TimeLogs` beserta data awal.

---

## 2. Deploy sebagai Web App (REST API)

1. Di pojok kanan atas Google Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gear (Select type) > pilih **Web app**.
3. Atur konfigurasi berikut:
   * **Description**: `Syncro API v1`
   * **Execute as**: `Me (email-anda@gmail.com)`
   * **Who has access**: `Anyone` (Penting: agar aplikasi Next.js PWA dapat memanggil endpoint ini tanpa blokir CORS)
4. Klik **Deploy**.
5. Salin URL **Web app URL** yang muncul (contoh format: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## 3. Hubungkan ke Next.js

Simpan URL tersebut di file `.env.local` pada aplikasi Syncro:

```bash
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
```

---

## 4. Struktur Database (Sheet Schema)

| Nama Sheet | Kolom / Fields |
| :--- | :--- |
| **Tasks** | `id`, `title`, `description`, `status`, `priority`, `dueDate`, `scheduledTime`, `durationMinutes`, `assignedTo`, `spaceId`, `createdAt`, `updatedAt` |
| **Users** | `id`, `name`, `email`, `avatar`, `role`, `team` |
| **Teams** | `id`, `name`, `division`, `leaderId` |
| **Spaces** | `id`, `name`, `color`, `icon` |
| **TimeLogs** | `id`, `taskId`, `userId`, `durationMinutes`, `logDate`, `notes`, `createdAt` |
