"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Calendar as CalendarIcon, ExternalLink, Loader2 } from "lucide-react";

export default function CalendarPage() {
  const { currentUser } = useStore();
  const activeEmail = (currentUser?.email || 'ravizein@itsecacademy.com').toLowerCase().trim();
  const targetUrl = `https://calendar.google.com/calendar/r?authuser=${encodeURIComponent(activeEmail)}`;

  useEffect(() => {
    // Direct redirect ke Google Calendar resmi milik akun yang sedang login
    window.location.href = targetUrl;
  }, [targetUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center select-none">
      <div className="h-16 w-16 rounded-2xl bg-[#EE3726]/10 border border-[#EE3726]/20 flex items-center justify-center text-[#EE3726] shadow-lg shadow-rose-950/10 animate-bounce">
        <CalendarIcon size={32} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          Membuka Google Calendar...
        </h1>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Menghubungkan langsung ke kalender akun Google Workspace: <br />
          <strong className="text-foreground font-mono bg-secondary px-2 py-0.5 rounded mt-1 inline-block border border-border">
            {activeEmail}
          </strong>
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-[#EE3726]" />
          <span>Mengalihkan secara otomatis...</span>
        </div>

        <a
          href={targetUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EE3726] to-[#BA1E10] text-white text-xs font-bold shadow-md shadow-rose-950/30 hover:opacity-95 transition"
        >
          <span>Buka Google Calendar Sekarang</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
