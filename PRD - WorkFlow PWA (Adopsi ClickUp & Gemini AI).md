# **Product Requirement Document (PRD)**

---

**Nama Proyek:** WorkFlow PWA (Adopsi ClickUp)  
**Tipe Aplikasi:** Progressive Web App (PWA)  
**Versi:** 1.0

## **1\. Ringkasan Eksekutif & Tujuan**

Proyek ini bertujuan untuk membangun aplikasi manajemen tugas, waktu, dan kolaborasi tim berbasis **Progressive Web App (PWA)** yang mengadopsi struktur utama **ClickUp**. Aplikasi dirancang dengan antarmuka yang lebih ringkas, terintegrasi penuh dengan ekosistem **Google**, serta memanfaatkan kecerdasan buatan **Gemini API** sebagai mesin AI utama.  
Seluruh *tech stack* memanfaatkan layanan **100% Free Tier** untuk efisiensi biaya pengembangan dan operasional.

## **2\. Target Audiens & Pengguna**

* **Internal Team / Admin:** Mengelola alokasi tugas, proyek (*Spaces*), dan memantau beban kerja anggota tim.  
* **Anggota Tim (Users):** Mengatur jadwal kerja harian, mengelola tugas pribadi/tim, serta mencatat durasi kerja.

## **3\. Tech Stack & Arsitektur Sistem**

| Layer | Teknologi / Service | Keterangan   |
| :---- | :---- | :---- |
| **PWA & Frontend** | Next.js (App Router) \+ React \+ next-pwa | Mendukung *installability* di desktop/mobile & *offline caching*. |
| **UI Framework** | Tailwind CSS \+ Shadcn UI | Komponen UI modern, responsif, dan ringan. |
| **Drag & Drop** | @hello-pangea/dnd / dnd-kit | Interaktivitas papan Kanban dan *Time Blocking* di Planner. |
| **State Management** | Zustand | Pengelolaan *state* aplikasi yang cepat di sisi klien. |
| **AI Engine** | Gemini API (via Google AI Studio) | Model kecerdasan buatan untuk merangkum & menganalisis data. |
| **Backend & Database** | Google Sheets \+ Google Apps Script (REST API) | *Database* berbasis spreadsheet dengan REST API kustom (doGet, doPost). |
| **Auth & Integrasi** | Google OAuth 2.0 \+ Google Drive API | Login terintegrasi & manajemen lampiran file. |
| **Hosting & Deployment** | Vercel | *Deployment* langsung via Vercel CLI tanpa GitHub. |

## **4\. Spesifikasi Fitur & Modul**

### **4.1. Modul Home (Sederhana & Ringkas)**

**Sidebar Navigasi:**

* **Inbox:** Pusat pemberitahuan penugasan dan aktivitas tugas.  
* **My Tasks:** Terbagi menjadi *Assigned to me*, *Today & Overdue*, dan *Personal List*.  
* **Channels:** Saluran obrolan grup berbasis topik/departemen.  
* **Direct Messages:** Pesan langsung antar anggota tim (*1-on-1*).  
* **Spaces:** Pengelompokan proyek/ruang kerja utama.

**Fitur yang Dihilangkan:** *Skills*, *Artifacts*, dan seluruh seksyen *AI Chats* (seperti *Onboarding Architect Setup* dan *Ask, Build, Create*) untuk menjaga antarmuka tetap bersih.

### **4.2. Modul Planner**

* **Calendar Views:** Tampilan agenda berbasis harian (*Day*), mingguan (*Week*), dan bulanan (*Month*).  
* **Unscheduled Tasks Panel:** Sidebar khusus tempat menampung tugas yang belum memiliki jam/tanggal pasti.  
* **Drag-and-Drop Time Blocking:** Menarik tugas dari panel *Unscheduled* langsung ke *grid* jam di kalender.  
* **Time Tracking & Estimates:** Pencatatan durasi pengerjaan tugas secara *real-time* serta batas estimasi waktu.

### **4.3. Modul AI (Ditenagai Gemini API)**

* **Knowledge Manager:** Menganalisis konteks dokumen, deskripsi tugas, dan riwayat obrolan untuk menjawab pertanyaan pengguna seputar proyek.  
* **Content & Project Writer:** Merangkum status *task*, menyusun Laporan *Standup*, dan mendraf dokumen SOP/catatan teknis.  
* **Super Agents (*Brain*):** Asisten AI internal untuk membantu penugasan dan otomatisasi ekstraksi *action items* dari catatan.

### **4.4. Modul Teams**

* **User & Role Management:** Manajemen daftar anggota, foto profil, peran (*Admin*, *Member*, *Guest*), serta hak akses.  
* **Workload & Capacity Tracking:** Pemantauan beban kerja tim untuk mencegah *burnout* dan distribusi tugas yang merata.  
* **Activity Stream:** Riwayat aktivitas dan pembaruan tugas tim secara *real-time*.  
* **User Groups / Sub-Teams:** Pengelompokan anggota berdasarkan divisi (contoh: @IT-Support, @Admin).

### **4.5. Ekosistem Integrasi Google**

* **Google SSO:** Login satu klik menggunakan akun Google Workspace/Gmail.  
* **Google Calendar:** Sinkronisasi dua arah (*2-way sync*) dengan modul Planner.  
* **Google Drive:** Akses lampiran berkas langsung dari Google Drive ke setiap tugas/dokumen.  
* **Google Meet:** Pembuatan tautan rapat otomatis saat penjadwalan di Planner.  
* **Gmail:** Mengubah email masuk menjadi tugas di aplikasi.

## **5\. Batasan & Persyaratan Non-Fungsional**

* **Kinerja & Respons:** Aplikasi PWA harus dimuat dalam \< 2 detik pada jaringan stabil.  
* **Keamanan:** Kredensial API (*Gemini API Key*, *Google Apps Script URL*) tersimpan aman di Environment Variables Vercel.  
* **Biaya Operasional:** Rp 0 (Memaksimalkan batas *Free Tier* dari seluruh layanan teknologi yang digunakan).

## **6\. Jalur Eksekusi & Roadmap Pengembangan**

### **Fase 1: Setup Backend & Database (Google Apps Script)**

1. Membuat struktur tabel di Google Sheets (Tasks, Users, Teams, Spaces).  
2. Menulis kode Google Apps Script untuk menyediakan endpoint REST API JSON (doGet, doPost).  
3. Deploy Apps Script sebagai *Web App* dan dapatkan URL API.

### **Fase 2: Setup Inisiasi Frontend & PWA**

1. Inisialisasi proyek Next.js (App Router) \+ TypeScript \+ Tailwind CSS \+ Shadcn UI.  
2. Mengonfigurasi next-pwa dan file manifest.json agar aplikasi dapat dipasang (*installable*).  
3. Mengatur *State Management* global menggunakan Zustand.

### **Fase 3: Pengembangan UI Modul & Integrasi API**

1. Membangun modul **Home** dengan susunan sidebar yang disederhanakan.  
2. Membangun modul **Planner** menggunakan @hello-pangea/dnd / dnd-kit untuk fitur *Drag-and-Drop*.  
3. Membangun modul **Teams** dan komponen UI untuk manajemen tugas.  
4. Menghubungkan Google OAuth 2.0, Calendar API, Drive API, dan Gmail.

### **Fase 4: Integrasi Gemini API & Testing**

1. Mendaftarkan *API Key* di Google AI Studio.  
2. Mengintegrasikan SDK Gemini API ke modul AI untuk fungsi *Knowledge Manager*, *Content Writer*, dan *Super Agent*.  
3. Pengujian alur *drag-and-drop*, otentikasi, dan performa PWA.

### **Fase 5: Deployment via Vercel CLI**

1. Menginstal Vercel CLI (npm i \-g vercel).  
2. Menjalankan perintah vercel dari terminal untuk *deploy* lingkungan *Staging*.  
3. Memasukkan Environment Variables di dasbor/CLI Vercel.  
4. Menjalankan vercel \--prod untuk merilis aplikasi ke lingkungan *Production*.