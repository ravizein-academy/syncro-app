"use client";

import { useStore } from "@/store/useStore";
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  HardDrive, 
  Video, 
  Mail, 
  Lock, 
  RefreshCw,
  ExternalLink 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  const { integrations, toggleIntegration } = useStore();

  const INTEGRATION_LIST = [
    {
      key: "googleAuth" as const,
      name: "Google OAuth 2.0 (SSO)",
      desc: "Autentikasi satu klik menggunakan Google Workspace atau akun Gmail pribadi.",
      icon: Lock,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      statusText: "Terhubung sebagai ravi@itsecacademy.com",
    },
    {
      key: "googleCalendar" as const,
      name: "Google Calendar (2-Way Sync)",
      desc: "Sinkronisasi dua arah otomatis antara agenda Google Calendar dengan modul Planner Syncro.",
      icon: Calendar,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      statusText: "Sinkronisasi aktif (Interval: Realtime)",
    },
    {
      key: "googleDrive" as const,
      name: "Google Drive API",
      desc: "Akses dan lampirkan file dokumen, spreadsheet, dan slide langsung ke rincian tugas.",
      icon: HardDrive,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      statusText: "Drive Picker & File Attachment aktif",
    },
    {
      key: "googleMeet" as const,
      name: "Google Meet 1-Click Link",
      desc: "Membuat URL ruang rapat video Google Meet instan saat menjadwalkan sesi kerja di Planner.",
      icon: Video,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      statusText: "Tombol 1-Click Meet aktif di Planner",
    },
    {
      key: "gmail" as const,
      name: "Gmail to Task Converter",
      desc: "Ekstrak email masuk penting dari Gmail menjadi daftar tugas langsung ke inbox Syncro.",
      icon: Mail,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      statusText: "Pengalihan otomatis pesan Gmail ke Tasks",
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <Layers className="text-blue-400" />
          Ekosistem Integrasi Google
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Konektivitas menyeluruh dengan layanan Google Workspace 100% Free Tier untuk mendukung workflow Syncro.
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {INTEGRATION_LIST.map((item) => {
          const isConnected = integrations[item.key];

          return (
            <Card
              key={item.key}
              className={`bg-slate-900/90 border-slate-800 transition hover:border-slate-700 shadow-sm flex flex-col justify-between ${
                isConnected ? "border-blue-500/20" : "opacity-80"
              }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-100">{item.name}</CardTitle>
                        <span className="text-[11px] font-mono text-slate-500">Google Workspace API</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} />
                          Terhubung
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          <XCircle size={12} />
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <CardDescription className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </CardDescription>

                  {isConnected && (
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="truncate">{item.statusText}</span>
                      <RefreshCw size={12} className="text-slate-500 animate-spin" />
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleIntegration(item.key)}
                  className={`text-xs h-8 ${
                    isConnected
                      ? "border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {isConnected ? "Putuskan Koneksi" : "Hubungkan Sekarang"}
                </Button>

                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
