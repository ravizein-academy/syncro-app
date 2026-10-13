"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore, Task, CalendarEvent } from "@/store/useStore";
import { 
  Clock, 
  Video, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Plus,
  Check,
  X,
  MapPin,
  Users,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  LayoutGrid,
  AlignLeft,
  Copy,
  Trash2,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { translations } from "@/lib/i18n";
import { fetchGoogleCalendarEvents } from "@/lib/sync";

// Google Calendar Brand Logo SVG
function GoogleCalendarLogo({ size = 20 }: { size?: number }) {
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

// Authentic Google 4-Color Plus Icon
function GooglePlusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none">
      <path d="M16 4C16 2.89543 16.8954 2 18 2C19.1046 2 20 2.89543 20 4V16H16V4Z" fill="#EA4335" />
      <path d="M16 20V32C16 33.1046 16.8954 34 18 34C19.1046 34 20 33.1046 20 32V20H16Z" fill="#34A853" />
      <path d="M4 16C2.89543 16 2 16.8954 2 18C2 19.1046 2.89543 20 4 20H16V16H4Z" fill="#FBBC05" />
      <path d="M20 16V20H32C33.1046 20 34 19.1046 34 18C34 16.8954 33.1046 16 32 16H20Z" fill="#4285F4" />
      <rect x="16" y="16" width="4" height="4" fill="#4285F4" />
    </svg>
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

// Official Google Calendar 10 Color Palette
const GCAL_COLORS = [
  { id: "peacock", name: "Peacock (Biru)", hex: "#039be5", badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30" },
  { id: "flamingo", name: "Flamingo (Coral)", hex: "#e67c73", badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  { id: "sage", name: "Sage (Hijau)", hex: "#33b679", badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
  { id: "grape", name: "Grape (Ungu)", hex: "#8e24aa", badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30" },
  { id: "banana", name: "Banana (Kuning)", hex: "#f6bf26", badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  { id: "tangerine", name: "Tangerine (Oranye)", hex: "#f4511e", badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30" },
  { id: "basil", name: "Basil (Hijau Tua)", hex: "#0b8043", badgeClass: "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30" },
  { id: "blueberry", name: "Blueberry (Indigo)", hex: "#3f51b5", badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30" },
  { id: "tomato", name: "Tomato (Merah)", hex: "#d50000", badgeClass: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30" },
  { id: "graphite", name: "Graphite (Abu-abu)", hex: "#616161", badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
];

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

interface ExtraCalendarEvent {
  id: string;
  title: string;
  dayIndex: number; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  dateStr: string; // YYYY-MM-DD
  timeRange: string;
  startHour: string; // e.g. "09:00"
  color: string;
  meetUrl?: string;
  isGoogleEvent?: boolean;
}

export default function PlannerPage() {
  const { 
    tasks, 
    updateTask, 
    addTask,
    integrations,
    toggleIntegration,
    language,
    calendarEvents,
    deleteCalendarEvent,
    currentUser
  } = useStore();

  const t = translations[language || 'id'];

  // Google Calendar View: "week" | "month" | "day" | "agenda"
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

  // Selected Date state (controls active view date for Day, Week, and Month)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Navigation handlers for all views
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

  // Email aktif untuk sinkronisasi Google Calendar (fallback ke ravizein@itsecacademy.com jika belum login)
  const activeUserEmail = (currentUser?.email || 'ravizein@itsecacademy.com').toLowerCase().trim();

  // Otomatis sinkronisasi Google Calendar secara realtime di background:
  // 1. Saat pertama kali membuka halaman atau berganti akun
  // 2. Saat berpindah tab/fokus kembali ke halaman ini (window focus)
  // 3. Polling otomatis berkala setiap 30 detik tanpa perlu klik tombol apapun
  useEffect(() => {
    fetchGoogleCalendarEvents(activeUserEmail);

    const handleFocus = () => {
      fetchGoogleCalendarEvents(activeUserEmail);
    };
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      fetchGoogleCalendarEvents(activeUserEmail);
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [activeUserEmail]);

  // Dynamic 7 Days of the active week (Monday to Sunday) containing selectedDate
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

  // Dynamic Month & Year title for Header
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

  // Dynamic Month Grid Days (for Month View)
  const monthGridDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun, 6 is Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Leading days from previous month
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

    // Days in current month
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

    // Trailing days from next month to complete standard grid (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
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

  // Filter agenda & tugas spesifik untuk akun yang sedang aktif (currentUser)
  const currentEmail = activeUserEmail;

  const myCalendarEvents = useMemo(() => {
    const isRavi = currentEmail === 'ravizein@itsecacademy.com' || currentEmail === 'ravizein@gmail.com';
    const seen = new Set<string>();

    return (calendarEvents || []).filter((ev) => {
      // Deduplikasi ketat berdasarkan ID
      if (seen.has(ev.id)) return false;
      seen.add(ev.id);

      if (!ev.userEmail) return true;
      const evMail = ev.userEmail.toLowerCase().trim();
      const guests = (ev.guests || '').toLowerCase();

      // Sinkronisasi otomatis penuh antara akun Academy dan Gmail milik Ravi Zein
      if (isRavi) {
        return (
          evMail === 'ravizein@itsecacademy.com' ||
          evMail === 'ravizein@gmail.com' ||
          guests.includes('ravizein@itsecacademy.com') ||
          guests.includes('ravizein@gmail.com') ||
          ev.isGoogleEvent
        );
      }

      return (
        evMail === currentEmail ||
        guests.includes(currentEmail)
      );
    });
  }, [calendarEvents, currentEmail]);

  const myTasks = useMemo(() => {
    const isRavi = currentEmail === 'ravizein@itsecacademy.com' || currentEmail === 'ravizein@gmail.com';
    return tasks.filter((t) => {
      if (t.isPersonal && t.userEmail && currentEmail) {
        const taskEmail = t.userEmail.toLowerCase().trim();
        if (isRavi) {
          return taskEmail === 'ravizein@itsecacademy.com' || taskEmail === 'ravizein@gmail.com' || !taskEmail;
        }
        if (taskEmail !== currentEmail) return false;
      }
      return true;
    });
  }, [tasks, currentEmail]);

  // Unified Calendar Events (Google Calendar items + Syncro tasks)
  // Shared by Week View, Month View, Day View, and Agenda View
  const allEvents = useMemo(() => {
    const list: (CalendarEvent & {
      isTask?: boolean;
      taskId?: string;
      startHour: string;
      timeRange: string;
    })[] = [];

    // 1. Google Calendar items
    (myCalendarEvents || []).forEach((ev) => {
      let hour = ev.startHour || "09:00";
      if (!ev.startHour && ev.timeRange) {
        const match = ev.timeRange.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let h = parseInt(match[1], 10);
          if (ev.timeRange.toUpperCase().includes("PM") && h < 12) h += 12;
          hour = `${String(h).padStart(2, "0")}:${match[2]}`;
        }
      }

      list.push({
        ...ev,
        startHour: hour,
        timeRange: ev.timeRange || `${hour} - ${hour}`,
        color: ev.color || "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
        isGoogleEvent: true,
      });
    });

    // 2. Syncro tasks matching scheduledSlot or dueDate
    myTasks.forEach((t) => {
      let hour = "09:00";
      const slot = t.scheduledSlot || "09:00 AM";
      const match = slot.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        if (slot.toUpperCase().includes("PM") && h < 12) h += 12;
        hour = `${String(h).padStart(2, "0")}:${match[2]}`;
      }

      const taskDate = t.dueDate || todayDateStr;

      list.push({
        id: `task-${t.id}`,
        title: t.title,
        dateStr: taskDate,
        timeRange: t.scheduledSlot || `${hour} - 10:00`,
        startHour: hour,
        color: "bg-[#EE3726]/15 text-[#EE3726] border-[#EE3726]/30",
        meetUrl: `https://meet.google.com/syncro-${t.id.slice(0, 4)}`,
        isTask: true,
        taskId: t.id,
        userEmail: t.userEmail,
      });
    });

    return list;
  }, [myCalendarEvents, myTasks, todayDateStr]);

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

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchGoogleCalendarEvents(activeUserEmail);
      setSyncNotice(language === "en" ? "Google Calendar synchronized successfully!" : "Kalender Google berhasil disinkronkan!");
    } catch (err) {
      console.warn("Manual sync error:", err);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 3000);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-5 md:p-6 space-y-3 sm:space-y-4 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* Top Header with Google Calendar Status, Mode Selector & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 pb-2 border-b border-border">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <GoogleCalendarLogo size={28} />
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
                <span>Auto-Sync Google Otomatis Aktif</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-0.5">
              <span>{language === 'en' ? "Google Calendar" : "Kalender Google"}</span>
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Akun terhubung:</span>
              <span className="font-semibold text-foreground font-mono bg-secondary px-1.5 py-0.2 rounded border border-border">
                {activeUserEmail}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sync Now Button with spinner */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-card hover:bg-secondary/80 border border-border shadow-xs text-xs font-semibold text-foreground transition active:scale-95 disabled:opacity-60"
            title={language === "en" ? "Sync with Google Calendar" : "Sinkronkan dengan Google Calendar"}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4285F4] ${isSyncing ? "animate-spin" : ""}`} />
            <span>
              {isSyncing
                ? (language === "en" ? "Syncing..." : "Sinkronisasi...")
                : (language === "en" ? "Sync Calendar" : "Sinkronkan")}
            </span>
          </button>

          {/* Open Google Calendar directly with user's specific Google Account */}
          <a
            href={`https://calendar.google.com/calendar/r?authuser=${encodeURIComponent(activeUserEmail)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Buka Google Calendar resmi untuk akun ${activeUserEmail}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4285F4] hover:bg-[#3367d6] text-white shadow-xs text-xs font-semibold transition active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === "en" ? "Open My Google Calendar" : "Buka Google Calendar Saya"}</span>
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

      {/* ============================================================== */}
      {/* GOOGLE CALENDAR VIEW (WEEK / MONTH / DAY / AGENDA) */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Google Calendar Toolbar: Month/Year navigation, Today, and View Switcher */}
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

            {/* Sub-view Switcher: Minggu, Bulan, Hari, Agenda */}
            <div className="flex items-center bg-secondary border border-border p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setGcalView("week")}
                className={`px-3 py-1 rounded-lg transition ${
                  gcalView === "week" 
                    ? "bg-[#4285F4] text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {language === 'en' ? "Week" : "Minggu"}
              </button>
              <button
                onClick={() => setGcalView("month")}
                className={`px-3 py-1 rounded-lg transition ${
                  gcalView === "month" 
                    ? "bg-[#4285F4] text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {language === 'en' ? "Month" : "Bulan"}
              </button>
              <button
                onClick={() => setGcalView("day")}
                className={`px-3 py-1 rounded-lg transition ${
                  gcalView === "day" 
                    ? "bg-[#4285F4] text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {language === 'en' ? "Day" : "Hari"}
              </button>
              <button
                onClick={() => setGcalView("agenda")}
                className={`px-3 py-1 rounded-lg transition ${
                  gcalView === "agenda" 
                    ? "bg-[#4285F4] text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

          {/* VIEW: WEEK GRID (AUTHENTIC GOOGLE CALENDAR WEEK) */}
          {gcalView === "week" && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Day Headers (7 Columns: Mon to Sun) */}
              <div className="grid grid-cols-8 border-b border-border bg-secondary/20 sticky top-0 z-10 text-center py-2 shrink-0">
                {/* GMT / Timezone column */}
                <div className="text-[10px] font-mono text-muted-foreground pt-1 border-r border-border/60">
                  GMT+7
                </div>

                {/* 7 Days Columns */}
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
                    title={language === 'en' ? "Click to open Day View" : "Klik untuk membuka tampilan Harian"}
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

              {/* Time Rows & Event Cells */}
              <div className="flex-1 divide-y divide-border/50">
                {WEEK_HOURS.map((hour) => {
                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[68px] relative group hover:bg-secondary/10 transition">
                      {/* Left Hour Label */}
                      <div className="text-[11px] font-mono font-medium text-muted-foreground text-right pr-2.5 pt-1 border-r border-border/60 select-none">
                        {hour}
                      </div>

                      {/* 7 Columns for the Hour */}
                      {weekDays.map((d, dayIdx) => {
                        // Find events in this day and matching this hour
                        const matchingEvents = allEvents.filter(ev => {
                          if (ev.dateStr !== d.dateStr) return false;
                          const evH = parseInt((ev.startHour || "09:00").split(":")[0], 10);
                          const slotH = parseInt(hour.split(":")[0], 10);
                          return evH === slotH;
                        });

                        return (
                          <div 
                            key={`${hour}-${dayIdx}`} 
                            className={`p-1 flex flex-col gap-1.5 relative min-h-[58px] transition-colors ${
                              dayIdx < 6 ? "border-r border-border/60" : ""
                            } ${d.isToday ? "bg-blue-500/5" : ""}`}
                          >
                            {/* Today Active Hour Line (e.g. at 15:00) */}
                            {d.isToday && hour === "15:00" && (
                              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#EA4335] z-10 flex items-center">
                                <span className="h-2 w-2 rounded-full bg-[#EA4335] -ml-1" />
                              </div>
                            )}

                            {/* Render Event Chips */}
                            {matchingEvents.map(ev => {
                              return (
                                <div
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetailEvent(ev);
                                  }}
                                  className={`p-2 rounded-xl border text-xs flex flex-col justify-between shadow-xs transition hover:shadow-md cursor-pointer ${ev.color}`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-mono font-bold opacity-80 truncate">
                                        {ev.timeRange}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {(ev.isInvitation || (ev.guests && ev.guests.length > 0)) && (
                                          <span title={language === 'en' ? "Invitation" : "Undangan"}>
                                            <Users size={11} className="text-amber-500" />
                                          </span>
                                        )}
                                        {ev.isGoogleEvent ? (
                                          <GoogleCalendarLogo size={12} />
                                        ) : (
                                          <span className="text-[9px] bg-[#EE3726] text-white px-1 py-0.2 rounded font-bold">Task</span>
                                        )}
                                      </div>
                                    </div>
                                    {ev.isTask && ev.taskId ? (
                                      <Link
                                        href={`/tasks/${ev.taskId}`}
                                        className="font-bold hover:underline line-clamp-2 mt-0.5 text-foreground block"
                                      >
                                        {ev.title}
                                      </Link>
                                    ) : (
                                      <p className="font-bold line-clamp-2 mt-0.5 text-foreground">
                                        {ev.title}
                                      </p>
                                    )}
                                  </div>

                                  {/* Action Buttons: Google Meet */}
                                  {ev.meetUrl && (
                                    <div className="pt-1.5 mt-1 border-t border-border/40 flex items-center justify-between">
                                      <a
                                        href={ev.meetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[10px] font-bold text-[#4285F4] border border-[#4285F4]/30 transition"
                                      >
                                        <GoogleMeetLogo className="w-3.5 h-3.5" />
                                        <span>Meet</span>
                                      </a>
                                      <span className="text-[9px] text-muted-foreground font-medium">Join ↗</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
            <div className="flex-1 overflow-y-auto flex flex-col p-3 sm:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 text-center py-2 border-b border-border bg-secondary/30 rounded-t-xl font-bold text-xs text-muted-foreground uppercase">
                <span>{language === 'en' ? "Sun" : "Min"}</span>
                <span>{language === 'en' ? "Mon" : "Sen"}</span>
                <span>{language === 'en' ? "Tue" : "Sel"}</span>
                <span>{language === 'en' ? "Wed" : "Rab"}</span>
                <span>{language === 'en' ? "Thu" : "Kam"}</span>
                <span>{language === 'en' ? "Fri" : "Jum"}</span>
                <span>{language === 'en' ? "Sat" : "Sab"}</span>
              </div>

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 flex-1 border-l border-b border-border divide-x divide-y divide-border rounded-b-xl overflow-hidden bg-card">
                {monthGridDays.map((cell) => {
                  const dayEvents = allEvents.filter((ev) => ev.dateStr === cell.dateStr);

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => {
                        const [y, m, d] = cell.dateStr.split("-").map(Number);
                        setSelectedDate(new Date(y, m - 1, d));
                        setGcalView("day");
                      }}
                      className={`p-2 min-h-[90px] flex flex-col justify-between transition cursor-pointer hover:bg-secondary/40 group relative ${
                        cell.isToday ? "bg-blue-500/5 font-bold ring-1 ring-inset ring-blue-500/30" : ""
                      } ${!cell.isCurrentMonth ? "bg-secondary/20 opacity-40" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          cell.isToday ? "bg-[#4285F4] text-white font-bold" : "text-foreground"
                        }`}>
                          {cell.dayNum}
                        </span>
                        <div className="flex items-center gap-1">
                          {dayEvents.length > 0 && (
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              {dayEvents.length} {language === 'en' ? "events" : "acara"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event chips */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium cursor-pointer transition hover:opacity-90 ${ev.color}`}
                            title={`${ev.timeRange} - ${ev.title}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-muted-foreground font-bold">
                            +{dayEvents.length - 2} {language === 'en' ? "more" : "lainnya"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: DAY VIEW */}
          {gcalView === "day" && (() => {
            const selectedDateStr = formatDateLocal(selectedDate);
            const dayEvents = allEvents.filter((ev) => ev.dateStr === selectedDateStr);
            const isToday = selectedDateStr === todayDateStr;

            return (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-300 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <GoogleCalendarLogo size={16} />
                    <span className="font-bold">
                      {selectedDate.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {isToday ? (language === "en" ? " (Today)" : " (Hari Ini)") : ""}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80 font-mono">
                    {dayEvents.length} {language === "en" ? "events scheduled" : "agenda terjadwal"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {WEEK_HOURS.map((hour) => {
                    const hourEvents = dayEvents.filter((ev) => {
                      const evH = parseInt((ev.startHour || "09:00").split(":")[0], 10);
                      const slotH = parseInt(hour.split(":")[0], 10);
                      return evH === slotH;
                    });

                    return (
                      <div key={hour} className="flex gap-4 items-start p-2.5 rounded-xl hover:bg-secondary/30 border border-border/50">
                        <span className="w-16 font-mono text-xs font-bold text-muted-foreground pt-1">
                          {hour}
                        </span>
                        <div className="flex-1 space-y-2">
                          {hourEvents.length === 0 ? (
                            <div className="py-1 text-[11px] text-muted-foreground/40 italic">-</div>
                          ) : (
                            <div className="space-y-2">
                              {hourEvents.map((ev) => (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedDetailEvent(ev)}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:shadow-md transition ${ev.color}`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono font-bold opacity-80">
                                        {ev.timeRange}
                                      </span>
                                      {(ev.isInvitation || (ev.guests && ev.guests.length > 0)) && (
                                        <span title={language === 'en' ? "Invitation" : "Undangan"}>
                                          <Users size={12} className="text-amber-500" />
                                        </span>
                                      )}
                                      {ev.isTask && (
                                        <span className="text-[9px] bg-[#EE3726] text-white px-1 py-0.2 rounded font-bold">Task</span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground mt-0.5 truncate">
                                      {ev.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {ev.meetUrl && (
                                      <a
                                        href={ev.meetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-3 py-1 bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-xs font-bold rounded-lg border border-[#4285F4]/30 flex items-center gap-1.5 text-[#4285F4] transition"
                                      >
                                        <GoogleMeetLogo className="w-3.5 h-3.5" />
                                        <span>Meet</span>
                                      </a>
                                    )}
                                    {ev.isTask && ev.taskId && (
                                      <Link
                                        href={`/tasks/${ev.taskId}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-2.5 py-1 bg-secondary hover:bg-accent text-xs font-bold rounded-lg border border-border text-foreground"
                                      >
                                        {language === "en" ? "Task" : "Buka Task"}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* VIEW: AGENDA VIEW */}
          {gcalView === "agenda" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck size={14} className="text-[#4285F4]" />
                  <span>
                    {language === "en" ? `Agenda Schedule (${activePeriodTitle})` : `Daftar Agenda (${activePeriodTitle})`}
                  </span>
                </h3>

                {agendaEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs italic bg-secondary/20 rounded-xl">
                    {language === "en" ? "No agenda items found for this period." : "Tidak ada agenda untuk periode ini."}
                  </div>
                ) : (
                  agendaEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedDetailEvent(ev)}
                      className="p-4 rounded-xl bg-card border border-border hover:border-[#4285F4]/50 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                          {ev.isGoogleEvent ? <GoogleCalendarLogo size={18} /> : <Clock size={16} className="text-[#EE3726]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              {ev.timeRange}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary border border-border font-bold">
                              {ev.dateStr}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground mt-0.5">
                            {ev.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ev.meetUrl && (
                          <a
                            href={ev.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4] text-xs font-bold rounded-xl border border-[#4285F4]/30 flex items-center gap-1.5"
                          >
                            <Video size={13} />
                            <span>Google Meet</span>
                          </a>
                        )}
                        {ev.isTask && ev.taskId && (
                          <Link
                            href={`/tasks/${ev.taskId}`}
                            className="px-3 py-1.5 bg-secondary hover:bg-accent text-foreground text-xs font-bold rounded-xl border border-border"
                          >
                            {language === "en" ? "View Task" : "Buka Task"}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      {/* ============================================================== */}
      {/* DIALOG: DETAIL ACARA & GOOGLE MEET / EVENT DETAIL POPUP        */}
      {/* ============================================================== */}
      <Dialog open={!!selectedDetailEvent} onOpenChange={(open) => !open && setSelectedDetailEvent(null)}>
        <DialogContent 
          showCloseButton={false}
          className="bg-card border border-border text-foreground sm:max-w-[480px] rounded-3xl shadow-2xl p-5 overflow-hidden flex flex-col gap-4"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Detail Acara</DialogTitle>
          </DialogHeader>

          {selectedDetailEvent && (
            <div className="space-y-4 text-xs">
              {/* Header with Title and Close Button */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#4285F4] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                      <GoogleCalendarLogo size={12} />
                      <span>{selectedDetailEvent.isGoogleEvent ? "Google Calendar" : "Syncro Schedule"}</span>
                    </span>
                    {(selectedDetailEvent.isInvitation || (selectedDetailEvent.guests && selectedDetailEvent.guests.length > 0)) && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Users size={10} />
                        <span>{language === 'en' ? "Invitation" : "Undangan"}</span>
                      </span>
                    )}
                    {selectedDetailEvent.eventType && (
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full capitalize font-semibold text-muted-foreground border border-border">
                        {selectedDetailEvent.eventType}
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

              {/* Guests / Invitations list if exists */}
              {selectedDetailEvent.guests && (
                <div className="flex items-start gap-3 text-muted-foreground p-3 rounded-2xl bg-secondary/30 border border-border/60">
                  <Users className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground block text-xs">Peserta / Tamu Undangan:</span>
                      {selectedDetailEvent.myStatus && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-mono border border-border text-foreground">
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

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs h-8 px-3 rounded-xl border border-border hover:bg-secondary text-foreground flex items-center gap-1.5 transition font-semibold"
                >
                  <ExternalLink size={13} className="text-[#4285F4]" />
                  <span>{language === "en" ? "Open Google Calendar" : "Buka Google Calendar"}</span>
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      deleteCalendarEvent(selectedDetailEvent.id);
                      setSelectedDetailEvent(null);
                      setSyncNotice(language === "en" ? "Event dismissed" : "Jadwal disembunyikan dari tampilan");
                      setTimeout(() => setSyncNotice(null), 3000);
                    }}
                    className="text-xs h-8 px-3 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20 flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>{language === "en" ? "Dismiss" : "Hapus"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedDetailEvent(null)}
                    className="text-xs h-8 px-4 rounded-xl hover:bg-secondary text-foreground"
                  >
                    {language === "en" ? "Close" : "Tutup"}
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
