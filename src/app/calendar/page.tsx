"use client";

import { useStore } from "@/store/useStore";
import { translations } from "@/lib/i18n";

// Google Calendar Brand Logo SVG
function GoogleCalendarLogo({ size = 30 }: { size?: number }) {
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
  const { currentUser, language } = useStore();
  const t = translations[language || "id"];
  const activeUserEmail = (currentUser?.email || "ravizein@itsecacademy.com").toLowerCase().trim();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* Top Header with Google Calendar Account Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-2 border-b border-border">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <GoogleCalendarLogo size={32} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4285F4]">
                Google Workspace
              </span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Terhubung</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-0.5">
              <span>{language === "en" ? "Google Calendar" : "Kalender Google"}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Akun terhubung:</span>
              <span className="font-semibold text-foreground font-mono bg-secondary px-1.5 py-0.2 rounded border border-border">
                {activeUserEmail}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Google Calendar In-App Embed (Satu Aplikasi) */}
      <div className="flex-1 w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative min-h-[620px] flex flex-col">
        <iframe
          src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(activeUserEmail)}&ctz=Asia%2FJakarta&hl=id`}
          className="w-full flex-1 border-0 min-h-[620px]"
          title="Google Calendar Terintegrasi"
        />
      </div>
    </div>
  );
}
