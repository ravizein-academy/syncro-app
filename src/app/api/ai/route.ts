import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, context, apiKey: clientKey } = body;

    const apiKey = clientKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        text: getSimulatedAIResponse(action, prompt, context),
        isSimulated: true
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let systemInstruction = `Kamu adalah asisten AI produktivitas cerdas bernama "Syncro AI Copilot" di aplikasi Syncro Workspace. Jawablah dalam bahasa Indonesia yang ringkas, berbobot, terstruktur, profesional, dan to-the-point.`;

    let userPrompt = prompt;

    if (action === 'standup') {
      userPrompt = `Buatkan draf Laporan Standup Harian (Daily Standup) profesional berdasarkan daftar tugas berikut:
Konteks Tugas Tim:
${JSON.stringify(context?.tasks || [], null, 2)}

Format laporan dengan bagian:
1. Selesai Dikerjakan (Yesterday / Done)
2. Sedang Dikerjakan Hari Ini (Today / In Progress)
3. Rencana Selanjutnya (Next Priorities)
4. Potensi Hambatan / Blocker (jika ada)`;
    } else if (action === 'enhance_description') {
      userPrompt = `Bantu susun draf deskripsi tugas yang lengkap, jelas, dan profesional untuk tugas berjudul: "${context?.title || prompt}".
Deskripsi saat ini (jika ada): "${context?.description || ''}".
Tolong sediakan:
1. Ringkasan Tujuan (Objective)
2. Lingkup Pengerjaan (Scope of Work)
3. Kriteria Selesai / Deliverables (Definition of Done)`;
    } else if (action === 'execution_steps') {
      userPrompt = `Susun panduan langkah kerja teknis (SOP ringkas) langkah demi langkah untuk menyelesaikan tugas: "${context?.title || prompt}".
Berikan urutan tindakan yang praktis, efisien, dan siap dipraktikkan.`;
    } else if (action === 'risk_analysis') {
      userPrompt = `Analisis potensi risiko, kendala teknis, dan langkah mitigasi terbaik untuk tugas: "${context?.title || prompt}".
Berikan rekomendasi solusi yang bisa diterapkan anggota tim.`;
    } else if (action === 'knowledge') {
      userPrompt = `Pertanyaan Pengguna: "${prompt}"
Konteks Workspace (Tugas, Anggota Tim, Ruang Kerja):
${JSON.stringify(context, null, 2)}

Jawab pertanyaan pengguna secara akurat berdasarkan data workspace di atas.`;
    }
    // action === 'generate' or 'breakdown': use prompt as-is (already fully formed by the caller)

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const outputText = response.text || 'Tidak ada respons dari Gemini AI.';
    return NextResponse.json({ success: true, text: outputText, isSimulated: false });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses permintaan AI' },
      { status: 500 }
    );
  }
}

function getSimulatedAIResponse(action: string, prompt: string, context: any): string {
  const taskTitle = context?.title || prompt || 'Tugas';

  if (action === 'standup') {
    const tasks = context?.tasks || [];
    const doneTasks = tasks.filter((t: any) => t.status === 'done').map((t: any) => `* **${t.title}** - Selesai`).join('\n') || '* Menyelesaikan setup fondasi aplikasi';
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').map((t: any) => `* **${t.title}** - Dalam proses pengerjaan`).join('\n') || '* Pengerjaan fitur utama';
    const todoTasks = tasks.filter((t: any) => t.status === 'todo').slice(0, 3).map((t: any) => `* **${t.title}**`).join('\n') || '* Review agenda';

    return `### 📋 Ringkasan Standup Harian (Syncro AI)

#### ✅ Selesai (Completed)
${doneTasks}

#### ⏳ Sedang Berjalan (In Progress)
${inProgressTasks}

#### 🎯 Prioritas Selanjutnya (Next Up)
${todoTasks}

#### 💡 Catatan & Hambatan
Semua aktivitas berjalan lancar sesuai timeline sprint. Sinkronisasi Google Sheets aktif.`;
  }

  if (action === 'enhance_description') {
    return `### 🎯 Sasaran & Deskripsi Lengkap (${taskTitle})

#### 1. Tujuan Utama (Objective)
Menyelesaikan dan memastikan implementasi ${taskTitle} berjalan optimal sesuai standar operasional dan arsitektur ITSEC Academy.

#### 2. Lingkup Pengerjaan (Scope of Work)
* Melakukan identifikasi kebutuhan dan parameter teknis yang dibutuhkan.
* Menyusun konfigurasi dan implementasi komponen sesuai spesifikasi.
* Memverifikasi fungsionalitas dan integrasi dengan sistem Google Workspace.

#### 3. Kriteria Selesai (Definition of Done)
* Telah diuji tanpa error dan siap digunakan oleh tim.
* Berkas dokumentasi/SOP pendukung telah terlampir di Google Docs/Sheets.`;
  }

  if (action === 'execution_steps') {
    return `### 🛠️ Panduan Langkah Kerja (SOP) untuk ${taskTitle}

1. **Persiapan & Validasi Kebutuhan:**
   * Tinjau file dokumen acuan dan pastikan hak akses akun Google Workspace aktif.
   * Koordinasikan dengan lead divisi bila terdapat parameter yang belum jelas.

2. **Eksekusi Teknis:**
   * Terapkan konfigurasi utama secara bertahap.
   * Catat setiap perubahan atau modifikasi konfigurasi pada bagian catatan tugas.

3. **Verifikasi & Quality Check:**
   * Lakukan validasi output dan pastikan tidak ada dampak negatif ke modul lain.
   * Unggah berkas hasil/screenshot pengujian ke bagian Lampiran Berkas.

4. **Update Status & Laporan:**
   * Berikan komentar progres terkini kepada tim dan pindahkan status tugas ke *Review/Done*.`;
  }

  if (action === 'risk_analysis') {
    return `### ⚠️ Analisis Risiko & Rekomendasi Solusi

* **Risiko 1: Keterlambatan Sinkronisasi Data**
  * *Dampak:* Moderat
  * *Mitigasi:* Pastikan koneksi Google Sheets REST API dan environment variable Web App URL telah aktif.

* **Risiko 2: Kesalahan Hak Akses Dokumen**
  * *Dampak:* Rendah
  * *Mitigasi:* Atur Google Docs & Google Drive sharing permission ke "Anyone with link / Organisasi".

* **Risiko 3: Kurangnya Konfirmasi dari Reviewer**
  * *Dampak:* Rendah
  * *Mitigasi:* Manfaatkan kolom Komentar tugas untuk me-mention anggota tim terkait.`;
  }

  if (action === 'generate' || action === 'breakdown') {
    // The prompt is fully formed by the caller — return a smart simulated response
    if (prompt.includes('rencana langkah') || prompt.includes('Rencana')) {
      return `### 📋 Rencana Kerja — ${taskTitle}\n\n1. **Persiapan & Analisis Kebutuhan** — Tinjau dokumen acuan, pastikan hak akses tersedia, dan klarifikasi scope.\n2. **Desain & Perencanaan Teknis** — Susun arsitektur solusi, alokasikan sumber daya, tetapkan milestone.\n3. **Implementasi Tahap Awal** — Kerjakan komponen inti, catat setiap perubahan, dan dokumentasikan progres.\n4. **Pengujian & Validasi** — Lakukan testing fungsional, identifikasi bug, dan perbaiki sebelum review.\n5. **Review & Finalisasi** — Presentasikan hasil ke lead/stakeholder, lakukan penyesuaian akhir.\n6. **Delivery & Dokumentasi** — Upload berkas final ke Google Drive, update status ke Done, bagikan laporan.\n\n*💡 Tip: Aktifkan Gemini API Key di Settings untuk rencana kerja yang lebih personal dan kontekstual.*`;
    }
    if (prompt.includes('risiko') || prompt.includes('Risiko')) {
      return `### ⚠️ Analisis Risiko — ${taskTitle}\n\n**1. Keterlambatan Penyelesaian**\n   - Dampak: Tinggi | Kemungkinan: Sedang\n   - Mitigasi: Bagi tugas menjadi milestone harian dan pantau progres di Syncro.\n\n**2. Kurangnya Informasi / Dokumen Pendukung**\n   - Dampak: Sedang | Kemungkinan: Rendah\n   - Mitigasi: Lampirkan semua dokumen acuan di bagian Lampiran Berkas sebelum memulai.\n\n**3. Ketidaktersediaan Anggota Tim Kunci**\n   - Dampak: Sedang | Kemungkinan: Rendah\n   - Mitigasi: Assign backup assignee dan pastikan handover notes terdokumentasi.`;
    }
    if (prompt.includes('estimasi') || prompt.includes('Estimasi')) {
      return `### ⏱️ Estimasi Waktu — ${taskTitle}\n\n| Tahap | Estimasi |\n|---|---|\n| Persiapan & Analisis | 1–2 jam |\n| Implementasi Inti | 3–6 jam |\n| Testing & Review | 1–2 jam |\n| Finalisasi & Dokumentasi | 30–60 menit |\n| **Total Estimasi** | **~6–12 jam kerja** |\n\n*Estimasi bersifat indikatif. Sesuaikan berdasarkan kompleksitas aktual dan kapasitas tim.*`;
    }
    if (prompt.includes('ringkasan') || prompt.includes('Ringkasan')) {
      return `### 📄 Ringkasan Eksekutif — ${taskTitle}\n\nTugas **"${taskTitle}"** merupakan prioritas operasional yang membutuhkan kolaborasi antar divisi dan validasi teknis sebelum delivery. Proses pengerjaan melibatkan persiapan dokumen, implementasi bertahap, dan review final oleh lead/stakeholder. Output akhir akan didokumentasikan dan disinkronkan ke Google Workspace tim.\n\n*Dihasilkan oleh Syncro AI — Aktifkan Gemini API Key untuk ringkasan yang lebih mendalam.*`;
    }
    if (prompt.includes('saran') || prompt.includes('Saran')) {
      return `### 💡 Saran & Optimasi — ${taskTitle}\n\n1. **Gunakan Time-Boxing** — Tetapkan blok waktu spesifik (misal: 2 jam pagi) agar fokus tidak terpecah.\n2. **Lampirkan Referensi** — Sematkan Google Docs/Sheets relevan langsung di bagian lampiran tugas ini.\n3. **Aktifkan Notifikasi** — Gunakan fitur Inbox Syncro untuk memantau update dari assignee lain.\n4. **Daily Check-in** — Perbarui komentar tugas setiap hari dengan progres singkat agar tim tetap tersinkronisasi.\n5. **Gunakan Syncro AI** — Jalankan *Analisis Risiko* sebelum mulai dan *Rencana Kerja* sebagai panduan langkah.`;
    }
  }

  return `Syncro AI siap membantu tugas "${taskTitle}". Gunakan opsi aksi cepat di atas atau masukkan API Key di tab Pengaturan untuk kustomisasi lebih lanjut.`;
}
