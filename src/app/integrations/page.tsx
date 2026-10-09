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
import { translations } from "@/lib/i18n";

export default function IntegrationsPage() {
  const { integrations, toggleIntegration, language, currentUser } = useStore();
  const t = translations[language || 'id'];

  const INTEGRATION_LIST = [
    {
      key: "googleAuth" as const,
      name: "Google OAuth 2.0 (SSO)",
      desc: language === 'en' 
        ? "One-click authentication using Google Workspace or your personal Gmail account." 
        : "Autentikasi satu klik menggunakan Google Workspace atau akun Gmail personal Anda.",
      icon: Lock,
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      statusText: currentUser?.email || (language === 'en' ? "Connected" : "Terhubung"),
    },
    {
      key: "googleCalendar" as const,
      name: "Google Calendar (2-Way Sync)",
      desc: language === 'en'
        ? "Automatic two-way synchronization between Google Calendar and Syncro Planner."
        : "Sinkronisasi dua arah otomatis antara agenda Google Calendar dengan modul Planner Syncro.",
      icon: Calendar,
      color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
      statusText: language === 'en' ? "Sync active (Realtime)" : "Sinkronisasi aktif (Interval: Realtime)",
    },
    {
      key: "googleDrive" as const,
      name: "Google Drive API",
      desc: language === 'en'
        ? "Attach Docs, Sheets, and Slides directly to Syncro tasks."
        : "Akses dan lampirkan dokumen, spreadsheet, dan Google Slides langsung ke rincian tugas.",
      icon: HardDrive,
      color: "text-rose-600 dark:text-rose-300 bg-rose-500/10 border-rose-500/20",
      statusText: "Drive Picker & File Attachment",
    },
    {
      key: "googleMeet" as const,
      name: "Google Meet 1-Click Link",
      desc: language === 'en'
        ? "Instant Meet video conferencing URLs generated right from the calendar grid."
        : "Membuat URL video call Google Meet secara instan saat menjadwalkan sesi kerja di Planner.",
      icon: Video,
      color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      statusText: "1-Click Meet button",
    },
    {
      key: "gmail" as const,
      name: "Gmail to Task Converter",
      desc: language === 'en'
        ? "Transform critical incoming emails into actionable Syncro tasks."
        : "Ekstrak email masuk penting dari Gmail menjadi daftar tugas langsung ke inbox Syncro.",
      icon: Mail,
      color: "text-red-600 dark:text-red-300 bg-red-500/10 border-red-500/20",
      statusText: "Auto forwarding to Tasks",
    },
  ];

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6 max-w-6xl mx-auto select-none transition-colors duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t.integrationsTag}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
          <Layers className="text-rose-500" />
          {t.integrationsTitle}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {t.integrationsSubtitle}
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {INTEGRATION_LIST.map((item) => {
          const isConnected = integrations[item.key];

          return (
            <Card
              key={item.key}
              className={`bg-card border-border transition hover:border-rose-500/40 shadow-sm flex flex-col justify-between ${
                isConnected ? "border-rose-500/30" : "opacity-80"
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
                        <CardTitle className="text-sm font-bold text-foreground">{item.name}</CardTitle>
                        <span className="text-[11px] font-mono text-muted-foreground">Google Workspace API</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} />
                          {t.connectedBadge}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          <XCircle size={12} />
                          {t.inactiveBadge}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </CardDescription>

                  {isConnected && (
                    <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-[11px] text-foreground flex items-center justify-between">
                      <span className="truncate">{item.statusText}</span>
                      <RefreshCw size={12} className="text-rose-500 animate-spin" />
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-border mt-2 flex items-center justify-between">
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleIntegration(item.key)}
                  className={`text-xs h-8 ${
                    isConnected
                      ? "border-border text-foreground hover:bg-accent"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40"
                  }`}
                >
                  {isConnected ? t.disconnectBtn : t.connectBtn}
                </Button>

                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition"
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
