# Syncro Backend - Google Apps Script & REST API

Backend resmi **Syncro PWA** yang mengadopsi 100% Free Tier Google Ecosystem (Google Sheets + Google Apps Script + Vercel Edge Serverless API) sesuai spesifikasi dokumen PRD.

---

## 📋 Fitur Backend
- **Multi-Sheet Database**: Mengelola tabel `Tasks`, `Users`, `Teams`, `Spaces`, `Channels`, `DirectMessages`, `PlannerEvents`.
- **REST API Endpoints**: Mendukung `doGet`, `doPost`, dan `doOptions` (CORS headers).
- **Auto-Initialization**: Cukup panggil `setupInitialDatabase()` atau endpoint `?action=initDatabase` untuk membuat seluruh kolom & data default secara otomatis.
- **Dukungan Objek Kompleks**: Subtasks, lampiran (attachments), komentar tim (comments), dan tag disimpan otomatis sebagai format JSON serial.

---

## 🚀 Panduan Setup Google Apps Script (Sekali Saja)
1. Buka [Google Sheets](https://sheets.new) dan buat Spreadsheet baru dengan judul **Syncro Database**.
2. Klik menu **Extensions > Apps Script**.
3. Hapus seluruh isi default pada `Code.gs` dan salin kode dari file [`backend/Code.gs`](./Code.gs).
4. Klik **Save (Simpan)**.
5. Jalankan fungsi `setupInitialDatabase` sekali untuk membuat semua sheets dan header kolom otomatis:
   - Di dropdown fungsi di atas, pilih `setupInitialDatabase`.
   - Klik **Run**. Berikan izin akses (*Review Permissions -> Allow*) jika diminta Google.
6. Klik tombol **Deploy > New deployment** di pojok kanan atas:
   - Pilih jenis: **Web app**
   - Description: `Syncro Production API v1`
   - Execute as: **Me (email Anda)**
   - Who has access: **Anyone**
7. Klik **Deploy** dan salin **Web app URL** yang dihasilkan (contoh: `https://script.google.com/macros/s/AKfycb.../exec`).
8. Tempelkan URL tersebut ke environment variable:
   ```env
   NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## 📡 Dokumentasi Endpoint REST API

### 1. HTTP GET
Format: `GET {APPS_SCRIPT_URL}?action={ACTION}`

| Action | Deskripsi | Respons Data |
| :--- | :--- | :--- |
| `health` | Cek status server Apps Script | `{ status: "ok", service: "Syncro..." }` |
| `getTasks` | Mengambil seluruh daftar tugas tim | `{ tasks: [ ... ] }` |
| `getUsers` | Mengambil data pengguna & tim | `{ users: [ ... ] }` |
| `getSpaces` | Mengambil daftar Spaces | `{ spaces: [ ... ] }` |
| `getChannels`| Mengambil daftar saluran chat & pesan | `{ channels: [ ... ] }` |
| `getDMs` | Mengambil utas pesan langsung (1-on-1) | `{ dmThreads: [ ... ] }` |
| `getAllData` | Mengambil seluruh snapshot database sekaligus | `{ tasks, users, spaces, ... }` |
| `initDatabase`| Inisialisasi ulang sheet database | `{ status: "success" }` |

### 2. HTTP POST
Format: `POST {APPS_SCRIPT_URL}`
Headers: `Content-Type: application/json`

Payload Body:
```json
{
  "action": "createTask",
  "payload": {
    "title": "Analisis Keamanan Jaringan",
    "status": "todo",
    "priority": "high",
    "assigneeId": "user_1"
  }
}
```

Aksi POST yang didukung:
- `createTask` : Membuat tugas baru.
- `updateTask` : Memperbarui tugas berdasarkan `id`.
- `deleteTask` : Menghapus tugas berdasarkan `id`.
- `syncAll`    : Sinkronisasi massal seluruh state dari web client.
- `createUser`  : Menambahkan akun pengguna baru.

---

## ⚡ Next.js API Routes (Serverless Gateway)
Di sisi Next.js, endpoint lokal disediakan di:
- `GET /api/health` : Healthcheck Next.js & Google Cloud.
- `GET/POST /api/tasks` : Proxy CRUD tugas ke Google Sheets.
- `POST /api/sync` : Sinkronisasi dua arah instan antara web client dan Google Sheets.
