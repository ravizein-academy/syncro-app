"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStore, CalendarEvent } from "@/store/useStore";
import { 
  Clock, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  MapPin,
  Users,
  CheckCircle2,
  AlignLeft,
  Copy,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchGoogleCalendarEvents } from "@/lib/sync";

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

// Google Meet Logo SVG
function GoogleMeetLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M14 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z" fill="#00832d" />
      <path d="M14 9.5l6-4.5v14l-6-4.5v-5z" fill="#0066da" />
      <path d="M2 14v-4l6-3 6 3v4l-6 3-6-3z" fill="#2684fc" opacity="0.15" />
      <path d="M14 8h-4v8h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z" fill="#00ac47" />
      <path d="M20 5l-6 4.5V11l6-2V5z" fill="#ea4335" />
      <path d="M14 14.5L20 19v-4l-6-2.5v2z" fill="#2684fc" />
      <path d="M4 8h6v8H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2z" fill="#ffba00" />
    </svg>
  );
}

const WEEK_HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export default function CalendarPage() {
  const { 
    language,
    calendarEvents,
    deleteCalendarEvent,
    currentUser
  } = useStore();

  // Mode Tampilan Google Calendar: "week" | "month" | "day" | "agenda"
  const [gcalView, setGcalView] = useState<"week" | "month" | "day" | "agenda">("week");

  // Sync state
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Selected event for detail popup
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<any | null>(null);
  const [copiedMeet, setCopiedMeet] = useState(false);

  // Helper to format Date to YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = useMemo(() => formatDateLocal(new Date()), []);

  // Selected Date state
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Navigation handlers
  const handlePrev = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (gcalView === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (gcalView === "week" || gcalView === "agenda") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (gcalView === "month") {
        next.setMonth(next.getMonth() + 1);
      } else if (gcalView === "week" || gcalView === "agenda") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Email aktif (ravizein@gmail.com atau ravizein@itsecacademy.com)
  const activeUserEmail = (currentUser?.email || "ravizein@itsecacademy.com").toLowerCase().trim();

  // Fetch data Google Calendar secara otomatis (Auto-Refresh Realtime)
  useEffect(() => {
    let isMounted = true;

    const performAutoFetch = async () => {
      try {
        if (isMounted) setIsSyncing(true);
        await fetchGoogleCalendarEvents(activeUserEmail);
      } catch (err) {
        console.warn("Auto-fetch error:", err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    performAutoFetch();

    const handleFocus = () => {
      performAutoFetch();
    };
    window.addEventListener("focus", handleFocus);

    // Auto-refresh otomatis setiap 15 detik tanpa perlu klik tombol
    const interval = setInterval(performAutoFetch, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [activeUserEmail]);

  // Dynamic 7 Days of the active week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const dayNamesID = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];
    const dayNamesEN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const fullNamesID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const fullNamesEN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return Array.from({ length: 7 }, (_, i) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dStr = formatDateLocal(cur);
      return {
        name: language === "en" ? dayNamesEN[i] : dayNamesID[i],
        full: language === "en" ? fullNamesEN[i] : fullNamesID[i],
        date: cur.getDate(),
        dateStr: dStr,
        isToday: dStr === todayDateStr,
        rawDate: cur,
      };
    });
  }, [selectedDate, language, todayDateStr]);

  // Dynamic Period Title
  const activePeriodTitle = useMemo(() => {
    if (gcalView === "day") {
      const formatted = selectedDate.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    const formatted = selectedDate.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate, gcalView, language]);

  // Month Grid Days
  const monthGridDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      const dStr = formatDateLocal(d);
      cells.push({
        dayNum: prevMonthDays - i,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayDateStr,
      });
    }

    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = formatDateLocal(d);
      cells.push({
        dayNum: i,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayDateStr,
      });
    }

    // Trailing days
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = formatDateLocal(d);
      cells.push({
        dayNum: i,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayDateStr,
      });
    }

    return cells;
  }, [selectedDate, todayDateStr]);

  // Filter agenda secara ketat per akun aktif (Mencegah Mirroring antara gmail dan academy)
  const myCalendarEvents = useMemo(() => {
    const seen = new Set<string>();
    const active = activeUserEmail;

    return (calendarEvents || []).filter((ev) => {
      if (seen.has(ev.id)) return false;
      seen.add(ev.id);

      const evMail = (ev.userEmail || '').toLowerCase().trim();
      const guests = (ev.guests || '').toLowerCase();
      const title = (ev.title || '').toLowerCase();
      const location = (ev.location || '').toLowerCase();

      // Akun ravizein@gmail.com TIDAK BOLEH me-mirror agenda kantor ITSEC Academy
      if (active === 'ravizein@gmail.com') {
        const isInvited = guests.includes('ravizein@gmail.com');
        const isAcademyEvent =
          guests.includes('ravizein@itsecacademy.com') ||
          guests.includes('@itsecasia.com') ||
          guests.includes('@itsec.sg') ||
          title.includes('[classroom academy booking]') ||
          location.includes('itsec');

        if (isAcademyEvent && !isInvited) {
          return false;
        }

        return isInvited || (evMail === 'ravizein@gmail.com' && !isAcademyEvent);
      }

      // Akun ravizein@itsecacademy.com menampilkan agenda workspace ITSEC Academy
      if (active === 'ravizein@itsecacademy.com') {
        return (
          evMail === 'ravizein@itsecacademy.com' ||
          guests.includes('ravizein@itsecacademy.com') ||
          !guests.includes('ravizein@gmail.com')
        );
      }

      return evMail === active || guests.includes(active);
    });
  }, [calendarEvents, activeUserEmail]);

  // Unified Google Calendar events list
  const allEvents = useMemo(() => {
    return (myCalendarEvents || []).map((ev) => {
      let hour = ev.startHour || "09:00";
      if (!ev.startHour && ev.timeRange) {
        const match = ev.timeRange.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let h = parseInt(match[1], 10);
          if (ev.timeRange.toUpperCase().includes("PM") && h < 12) h += 12;
          hour = `${String(h).padStart(2, "0")}:${match[2]}`;
        }
      }

      return {
        ...ev,
        startHour: hour,
        timeRange: ev.timeRange || `${hour} - ${hour}`,
        color: ev.color || "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
        isGoogleEvent: true,
      };
    });
  }, [myCalendarEvents]);

  const agendaEvents = useMemo(() => {
    const weekDateSet = new Set(weekDays.map((w) => w.dateStr));
    const currentMonthPrefix = formatDateLocal(selectedDate).slice(0, 7);

    return allEvents
      .filter((ev) => weekDateSet.has(ev.dateStr) || ev.dateStr.startsWith(currentMonthPrefix))
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.startHour.localeCompare(b.startHour));
  }, [allEvents, weekDays, selectedDate]);

  const handleCopyMeetLink = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedMeet(true);
      setTimeout(() => setCopiedMeet(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-w-[1700px] mx-auto select-none transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-2 border-b border-border">
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
                <span>Tersinkronisasi Langsung</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-0.5">
              <span>Google Calendar</span>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Akun terhubung:</span>
              <span className="font-semibold text-foreground font-mono bg-secondary px-2 py-0.5 rounded-md border border-border">
                {activeUserEmail}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Auto-Refresh Status Indicator */}
          <div 
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs flex items-center gap-1.5 select-none"
            title="Auto-Refresh Aktif: Agenda Google Calendar tersinkronisasi otomatis secara realtime tanpa perlu klik manual"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <RefreshCw size={12} className={isSyncing ? "animate-spin text-emerald-500 shrink-0" : "text-emerald-500 shrink-0"} />
            <span className="hidden sm:inline">{isSyncing ? "Menyinkronkan..." : "Auto-Refresh"}</span>
          </div>

          {/* Google Calendar Direct Web Button */}
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

      {/* Sync Banner Notification if active */}
      {syncNotice && (
        <div className="py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="p-0.5 hover:opacity-80">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main Google Calendar Container */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Calendar Navigation Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-secondary text-foreground transition shadow-xs"
            >
              {language === 'en' ? "Today" : "Hari Ini"}
            </button>

            {/* Navigation arrows */}
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                title={language === 'en' ? "Previous Period" : "Periode Sebelumnya"}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                title={language === 'en' ? "Next Period" : "Periode Selanjutnya"}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dynamic Period Title */}
            <h2 className="text-sm sm:text-base font-black text-foreground">
              {activePeriodTitle}
            </h2>
          </div>

          {/* View Switcher: Minggu | Bulan | Hari | Agenda */}
          <div className="flex items-center bg-secondary border border-border p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setGcalView("week")}
              className={`px-3 py-1 rounded-lg transition ${
                gcalView === "week" 
                  ? "bg-[#4285F4] text-white shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'en' ? "Week" : "Minggu"}
            </button>
            <button
              onClick={() => setGcalView("month")}
              className={`px-3 py-1 rounded-lg transition ${
                gcalView === "month" 
                  ? "bg-[#4285F4] text-white shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'en' ? "Month" : "Bulan"}
            </button>
            <button
              onClick={() => setGcalView("day")}
              className={`px-3 py-1 rounded-lg transition ${
                gcalView === "day" 
                  ? "bg-[#4285F4] text-white shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === 'en' ? "Day" : "Hari"}
            </button>
            <button
              onClick={() => setGcalView("agenda")}
              className={`px-3 py-1 rounded-lg transition ${
                gcalView === "agenda" 
                  ? "bg-[#4285F4] text-white shadow-xs font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Agenda
            </button>
          </div>
        </div>

        {/* VIEW: WEEK GRID */}
        {gcalView === "week" && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Day Headers (7 Columns: Mon to Sun) */}
            <div className="grid grid-cols-8 border-b border-border bg-secondary/20 sticky top-0 z-10 text-center py-2 shrink-0">
              <div className="text-[10px] font-mono text-muted-foreground pt-1 border-r border-border/60">
                GMT+7
              </div>
              {weekDays.map((d, index) => (
                <div 
                  key={d.name} 
                  onClick={() => {
                    setSelectedDate(d.rawDate);
                    setGcalView("day");
                  }}
                  className={`px-1 py-1 select-none cursor-pointer hover:bg-secondary/40 transition ${
                    index < 6 ? "border-r border-border/60" : ""
                  }`}
                  title="Klik untuk tampilan Harian"
                >
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    {d.name}
                  </div>
                  <div className="mt-0.5">
                    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-black ${
                      d.isToday 
                        ? "bg-[#4285F4] text-white shadow-sm" 
                        : "text-foreground hover:bg-secondary"
                    }`}>
                      {d.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="flex-1 divide-y divide-border/50">
              {WEEK_HOURS.map((hour) => {
                const hourPrefix = hour.slice(0, 2);
                return (
                  <div key={hour} className="grid grid-cols-8 min-h-[58px] group hover:bg-secondary/10 transition">
                    <div className="text-[10px] font-mono text-muted-foreground text-right pr-2 pt-1 border-r border-border/60 select-none">
                      {hour}
                    </div>

                    {weekDays.map((d, colIdx) => {
                      const cellEvents = allEvents.filter(
                        (ev) => ev.dateStr === d.dateStr && ev.startHour?.startsWith(hourPrefix)
                      );

                      return (
                        <div 
                          key={colIdx} 
                          className={`p-1 relative border-r border-border/40 ${
                            d.isToday ? "bg-blue-500/[0.02]" : ""
                          }`}
                        >
                          {cellEvents.map((ev) => (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedDetailEvent(ev)}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition hover:scale-[1.01] hover:shadow-md mb-1 ${ev.color}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate text-[11px] leading-tight">
                                  {ev.title}
                                </span>
                                {ev.meetUrl && (
                                  <Video size={11} className="text-[#4285F4] shrink-0" />
                                )}
                              </div>
                              <div className="text-[9px] opacity-80 font-mono mt-0.5 truncate">
                                {ev.timeRange}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: MONTH GRID */}
        {gcalView === "month" && (
          <div className="flex-1 overflow-y-auto flex flex-col p-2 sm:p-3">
            <div className="grid grid-cols-7 border-b border-border pb-2 mb-2 text-center text-xs font-bold text-muted-foreground">
              {["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"].map((dayName) => (
                <div key={dayName}>{dayName}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-5 gap-1.5 flex-1 min-h-[520px]">
              {monthGridDays.map((c, idx) => {
                const cellEvents = allEvents.filter((ev) => ev.dateStr === c.dateStr);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(new Date(c.dateStr));
                      setGcalView("day");
                    }}
                    className={`rounded-xl border p-1.5 flex flex-col justify-between transition cursor-pointer hover:border-[#4285F4]/60 ${
                      c.isToday
                        ? "border-[#4285F4] bg-blue-500/5 shadow-xs"
                        : c.isCurrentMonth
                        ? "border-border/60 bg-card hover:bg-secondary/40"
                        : "border-border/20 bg-secondary/20 text-muted-foreground/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`h-6 w-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        c.isToday ? "bg-[#4285F4] text-white" : ""
                      }`}>
                        {c.dayNum}
                      </span>
                      {cellEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-[#4285F4]">
                          {cellEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden my-1">
                      {cellEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailEvent(ev);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${ev.color}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {cellEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground font-semibold px-1">
                          +{cellEvents.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: DAY VIEW */}
        {gcalView === "day" && (
          <div className="flex-1 overflow-y-auto flex flex-col p-4">
            <div className="max-w-3xl mx-auto w-full space-y-2">
              {WEEK_HOURS.map((hour) => {
                const hourPrefix = hour.slice(0, 2);
                const activeDateStr = formatDateLocal(selectedDate);
                const eventsAtHour = allEvents.filter(
                  (ev) => ev.dateStr === activeDateStr && ev.startHour?.startsWith(hourPrefix)
                );

                return (
                  <div key={hour} className="flex gap-4 p-2 rounded-xl border border-border/40 hover:bg-secondary/20 transition min-h-[58px]">
                    <span className="text-xs font-mono text-muted-foreground w-14 shrink-0 pt-1">
                      {hour}
                    </span>
                    <div className="flex-1 space-y-2">
                      {eventsAtHour.length === 0 ? (
                        <div className="h-full flex items-center text-[11px] text-muted-foreground/30 italic">
                          - Tidak ada agenda -
                        </div>
                      ) : (
                        eventsAtHour.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedDetailEvent(ev)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition hover:shadow-md flex items-center justify-between gap-3 ${ev.color}`}
                          >
                            <div>
                              <h4 className="font-bold text-sm">{ev.title}</h4>
                              <p className="text-[11px] font-mono opacity-80 mt-0.5">{ev.timeRange}</p>
                            </div>
                            {ev.meetUrl && (
                              <a
                                href={ev.meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 bg-[#4285F4] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-[#3367d6] transition shadow-xs"
                              >
                                <Video size={13} />
                                <span>Gabung Meet</span>
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: AGENDA VIEW */}
        {gcalView === "agenda" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {agendaEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-secondary/10">
                  <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-bold text-sm text-foreground">Tidak Ada Jadwal Google Calendar</h3>
                  <p className="text-xs mt-1">Belum ada agenda Google Calendar yang tercatat pada periode ini.</p>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl bg-[#4285F4] text-white text-xs font-bold hover:bg-[#3367d6] transition shadow-xs"
                  >
                    <ExternalLink size={13} />
                    <span>Buka Google Calendar</span>
                  </a>
                </div>
              ) : (
                agendaEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedDetailEvent(ev)}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-[#4285F4]/60 transition cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-[#4285F4] border border-blue-500/20 font-bold">
                          {ev.dateStr}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                          {ev.timeRange}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{ev.title}</h4>
                      {ev.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-500" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ev.meetUrl && (
                        <a
                          href={ev.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4] text-xs font-bold rounded-xl border border-[#4285F4]/30 flex items-center gap-1.5 transition"
                        >
                          <Video size={13} />
                          <span>Google Meet</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* DETAIL POPUP DIALOG */}
      <Dialog open={!!selectedDetailEvent} onOpenChange={(open) => !open && setSelectedDetailEvent(null)}>
        <DialogContent 
          showCloseButton={false}
          className="bg-card border border-border text-foreground sm:max-w-[480px] rounded-3xl shadow-2xl p-5 overflow-hidden flex flex-col gap-4"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Detail Agenda Google Calendar</DialogTitle>
          </DialogHeader>

          {selectedDetailEvent && (
            <div className="space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#4285F4] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                      <GoogleCalendarLogo size={12} />
                      <span>Google Calendar</span>
                    </span>
                    {(selectedDetailEvent.isInvitation || (selectedDetailEvent.guests && selectedDetailEvent.guests.length > 0)) && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Users size={10} />
                        <span>Undangan</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                    {selectedDetailEvent.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailEvent(null)}
                  className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Time & Date */}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4 text-[#4285F4] shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">
                    {selectedDetailEvent.dateStr}
                  </span>
                  <span className="mx-1.5 text-border">•</span>
                  <span className="font-mono">{selectedDetailEvent.timeRange}</span>
                </div>
              </div>

              {/* Google Meet Link if exists */}
              {selectedDetailEvent.meetUrl && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GoogleMeetLogo className="w-6 h-6 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-foreground block text-xs">Google Meet Video Call</span>
                      <a
                        href={selectedDetailEvent.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#4285F4] hover:underline font-mono truncate block"
                      >
                        {selectedDetailEvent.meetUrl}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyMeetLink(selectedDetailEvent.meetUrl)}
                      className="p-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-semibold transition"
                      title="Salin tautan Google Meet"
                    >
                      {copiedMeet ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <a
                      href={selectedDetailEvent.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Video size={13} />
                      <span>Gabung Meet</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Location if exists */}
              {selectedDetailEvent.location && (
                <div className="flex items-center gap-3 text-muted-foreground px-0.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-foreground font-medium">{selectedDetailEvent.location}</span>
                </div>
              )}

              {/* Guests if exists */}
              {selectedDetailEvent.guests && (
                <div className="flex items-start gap-3 text-muted-foreground px-0.5">
                  <Users className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Daftar Undangan / Tamu:</span>
                      {selectedDetailEvent.myStatus && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-foreground">
                          Status: {selectedDetailEvent.myStatus}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground break-words space-y-1 pt-0.5">
                      {selectedDetailEvent.guests.split(',').map((guest: string, gIdx: number) => (
                        <div key={gIdx} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">{guest.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Description if exists */}
              {selectedDetailEvent.description && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <AlignLeft className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <div 
                    className="p-3 rounded-2xl bg-secondary/40 border border-border flex-1 text-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: selectedDetailEvent.description.startsWith('<') 
                        ? selectedDetailEvent.description 
                        : selectedDetailEvent.description.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs h-8 px-3 rounded-xl border border-border hover:bg-secondary text-foreground flex items-center gap-1.5 transition font-semibold"
                >
                  <ExternalLink size={13} className="text-[#4285F4]" />
                  <span>Google Calendar</span>
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      deleteCalendarEvent(selectedDetailEvent.id);
                      setSelectedDetailEvent(null);
                      setSyncNotice("Jadwal disembunyikan dari kalender");
                      setTimeout(() => setSyncNotice(null), 3000);
                    }}
                    className="text-xs h-8 px-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20 flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedDetailEvent(null)}
                    className="text-xs h-8 px-4 rounded-xl hover:bg-secondary text-foreground"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
