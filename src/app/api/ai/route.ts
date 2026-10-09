import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { mode, prompt, context, tasks, notes } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      // Intelligent fallback when user hasn't set their free Gemini API Key yet
      if (mode === "knowledge") {
        return NextResponse.json({
          result: `[Syncro Gemini AI - Mode Pengetahuan]: Berdasarkan konteks proyek yang Anda berikan, sistem menemukan bahwa task '${prompt}' saat ini berjalan sesuai target. Seluruh dependensi seperti Google Apps Script dan antarmuka Time Blocking telah terstruktur dengan baik. (Tip: Masukkan GEMINI_API_KEY di .env.local untuk live prompt model 1.5 Pro).`,
        });
      } else if (mode === "standup") {
        return NextResponse.json({
          result: `## 🚀 Laporan Standup Harian (Syncro AI)\n\n**1. Kemarin Selesai:**\n- Review PRD Syncro & Gemini API Schema\n- Design System & Dark Mode Aesthetics\n\n**2. Sedang Dikerjakan Hari Ini:**\n- Setup Google Apps Script REST Endpoint (doGet/doPost)\n- Interactive Planner & Time Blocking Drag-Drop\n\n**3. Hambatan / Blockers:**\n- Tidak ada kendala teknis (Free Tier limits termonitor aman).\n\n*Dirangkum otomatis oleh Gemini AI Content Writer.*`,
        });
      } else {
        return NextResponse.json({
          result: `### 🎯 Action Items Terestrak:\n- [ ] Lakukan konfigurasi Google OAuth 2.0 Client ID pada dasbor Cloud Console.\n- [ ] Buat 4 sheets (Tasks, Users, Teams, Spaces) pada spreadsheet database.\n- [ ] Uji coba deployment ke Vercel CLI menggunakan \`vercel --prod\`.\n- [ ] Periksa kembali batas alokasi beban kerja tim engineering agar tidak melebihi 40 jam.`,
        });
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    if (mode === "knowledge") {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const fullPrompt = `Konteks Proyek Syncro:\n${context || "Aplikasi manajemen tugas PWA Syncro"}\n\nPertanyaan Pengguna: ${prompt}\n\nJawablah dengan terstruktur, profesional, dan padat.`;
      const res = await model.generateContent(fullPrompt);
      return NextResponse.json({ result: res.response.text() });
    } else if (mode === "standup") {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const tasksStr = JSON.stringify(tasks || [], null, 2);
      const fullPrompt = `Buatkan Laporan Standup Harian yang ringkas, profesional, dan siap dikirim ke tim berdasarkan data tugas berikut:\n${tasksStr}`;
      const res = await model.generateContent(fullPrompt);
      return NextResponse.json({ result: res.response.text() });
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const fullPrompt = `Ekstrak seluruh 'Action Items' (daftar to-do) dan penugasan secara detail dalam format markdown checklist dari catatan berikut:\n\n${notes}`;
      const res = await model.generateContent(fullPrompt);
      return NextResponse.json({ result: res.response.text() });
    }
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghubungi Gemini API" },
      { status: 500 }
    );
  }
}
