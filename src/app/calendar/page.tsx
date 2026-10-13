"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { 
  RefreshCw, 
  ExternalLink, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Sparkles
} from "lucide-react";

// Google Calendar Brand Logo SVG
function GoogleCalendarLogo({ size = 26 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-xs">
        <path fill="#4285F4" d="M38 44H10c-3.3 0-6-2.7-6-6V14c0-3.3 2.7-6 6-6h28c3.3 0 6 2.7 6 6v24c0 3.3-2.7 6-6 6z"/>
        <path fill="#FFF" d="M10 14h28v24H10z"/>
        <path fill="#EA4335" d="M34 4h4v6h-4zm-24 0h4v6h-4z"/>
        <path fill="#FBBC05" d="M10 14h28v4H10z"/>
        <text x="24" y="32" fill="#4285F4" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">31</text>
      </svg>
    </div>
  );
}

export default function CalendarPage() {
  const { language, currentUser } = useStore();

  // Mode Tampilan Google Calendar: WEEK | MONTH | AGENDA
  const [embedMode, setEmbedMode] = useState<"WEEK" | "MONTH" | "AGENDA">("WEEK");
  const [iframeKey, setIframeKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email aktif akun yang sedang login (otomatis menyesuaikan akun)
  const activeUserEmail = (currentUser?.email || "ravizein@itsecacademy.com").toLowerCase().trim();

  // URL resmi Google Calendar Live Embed yang langsung tampil di dalam aplikasi
  const gcalEmbedUrl = useMemo(() => {
    const email = encodeURIComponent(activeUserEmail);
    const lang = language === "en" ? "en" : "id";
    return `https://calendar.google.com/calendar/embed?src=${email}&ctz=Asia%2FJakarta&hl=${lang}&wkst=2&mode=${embedMode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1`;
  }, [activeUserEmail, language, embedMode]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-w-[1700px] mx-auto select-none transition-colors duration-200">
      {/* Header Google Calendar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-2 border-b border-border">
        {/* Title & Akun Google Terhubung */}
        <div className="flex items-center gap-3">
          <GoogleCalendarLogo size={32} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4285F4]">
                Google Workspace
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Tampil Langsung di Aplikasi</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-0.5">
              <span>{language === "en" ? "Google Calendar" : "Google Calendar"}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Akun terhubung:</span>
              <span className="font-semibold text-foreground font-mono bg-secondary px-2 py-0.5 rounded-md border border-border">
                {activeUserEmail}
              </span>
            </p>
          </div>
        </div>

        {/* Toolbar & Kontrol Mode */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Switcher Mode: Minggu | Bulan | Agenda */}
          <div className="flex items-center bg-secondary/80 border border-border p-1 rounded-xl text-xs font-medium shadow-xs">
            <button
              onClick={() => setEmbedMode("WEEK")}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedMode === "WEEK"
                  ? "bg-[#4285F4] text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" ? "Week" : "Minggu"}
            </button>
            <button
              onClick={() => setEmbedMode("MONTH")}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedMode === "MONTH"
                  ? "bg-[#4285F4] text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "en" ? "Month" : "Bulan"}
            </button>
            <button
              onClick={() => setEmbedMode("AGENDA")}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedMode === "AGENDA"
                  ? "bg-[#4285F4] text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Tombol Muat Ulang (Refresh Iframe) */}
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition shadow-xs flex items-center gap-1.5 text-xs font-semibold ${
              isRefreshing ? "opacity-70 pointer-events-none" : ""
            }`}
            title={language === "en" ? "Reload Calendar" : "Muat ulang kalender"}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#4285F4]" : ""} />
            <span className="hidden md:inline">{language === "en" ? "Refresh" : "Segarkan"}</span>
          </button>

          {/* Tombol Buka di Google Calendar */}
          <a
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition shadow-xs flex items-center gap-1.5 text-xs font-semibold"
            title="Google Calendar"
          >
            <ExternalLink size={14} className="text-[#4285F4]" />
            <span className="hidden md:inline">Google Calendar</span>
          </a>
        </div>
      </div>

      {/* Frame Google Calendar Langsung di Dalam Aplikasi */}
      <div className="flex-1 w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative min-h-[640px]">
        <iframe
          key={iframeKey}
          src={gcalEmbedUrl}
          className="w-full h-full border-0 absolute inset-0 rounded-2xl bg-background"
          style={{ border: 0, width: "100%", height: "100%" }}
          title="Google Calendar Direct Embed"
          allow="camera; microphone; geolocation; clipboard-write; storage-access"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
        />
      </div>
    </div>
  );
}
