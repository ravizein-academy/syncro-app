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
import { fetchGoogleCalendarEvents, createCalendarEventOnCloud } from "@/lib/sync";

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
    currentUser
  } = useStore();

  const t = translations[language || 'id'];

  // Google Calendar View: "week" | "month" | "day" | "agenda"
  const [gcalView, setGcalView] = useState<"week" | "month" | "day" | "agenda">("week");

  // Sync state
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Helper to format Date to YYYY-MM-DD
  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = useMemo(() => formatDateLocal(new Date()), []);

  // New Event Modal state (Authentic Google Calendar experience)
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventType, setEventType] = useState<"event" | "task" | "focus" | "reminder">("event");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => formatDateLocal(new Date()));
  const [eventStartTime, setEventStartTime] = useState("10:00");
  const [eventEndTime, setEventEndTime] = useState("11:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [includeMeet, setIncludeMeet] = useState(true);
  const [meetSlug, setMeetSlug] = useState(() => `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`);
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [guests, setGuests] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("");
  const [selectedColor, setSelectedColor] = useState(GCAL_COLORS[0]);
  const [copiedMeet, setCopiedMeet] = useState(false);

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

  // Otomatis sinkronisasi Google Calendar secara realtime di background:
  // 1. Saat pertama kali membuka halaman atau berganti akun
  // 2. Saat berpindah tab/fokus kembali ke halaman ini (window focus)
  // 3. Polling otomatis berkala setiap 30 detik tanpa perlu klik tombol apapun
  useEffect(() => {
    const userEmail = currentUser?.email;
    if (!userEmail) return;

    fetchGoogleCalendarEvents(userEmail);

    const handleFocus = () => {
      fetchGoogleCalendarEvents(userEmail);
    };
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      fetchGoogleCalendarEvents(userEmail);
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [currentUser?.email]);

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
  const currentEmail = currentUser?.email?.toLowerCase().trim();

  const myCalendarEvents = useMemo(() => {
    if (!currentEmail) return calendarEvents;
    return (calendarEvents || []).filter(
      (ev) => !ev.userEmail || ev.userEmail.toLowerCase().trim() === currentEmail
    );
  }, [calendarEvents, currentEmail]);

  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isPersonal && t.userEmail && currentEmail) {
        if (t.userEmail.toLowerCase().trim() !== currentEmail) return false;
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



  const openCreateModalWithSlot = (dateStr: string, hourStr?: string) => {
    setEventDate(dateStr);
    if (hourStr) {
      const h = parseInt(hourStr.split(":")[0], 10);
      const nextH = Math.min(23, h + 1);
      setEventStartTime(hourStr);
      setEventEndTime(`${String(nextH).padStart(2, "0")}:00`);
      setIsAllDay(false);
    }
    setMeetSlug(`${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`);
    setIsNewEventModalOpen(true);
  };

  const handleAddGuest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = guestInput.trim().replace(",", "");
      if (val && !guests.includes(val)) {
        setGuests([...guests, val]);
      }
      setGuestInput("");
    }
  };

  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter((g) => g !== email));
  };

  const handleCopyMeetLink = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedMeet(true);
      setTimeout(() => setCopiedMeet(false), 2000);
    }
  };

  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const meetUrl = includeMeet ? `https://meet.google.com/${meetSlug}` : undefined;

    const newEvent: CalendarEvent = {
      id: `gcal-${Date.now()}`,
      title: eventTitle.trim(),
      dateStr: eventDate,
      timeRange: isAllDay 
        ? (language === "en" ? "All day" : "Sepanjang hari") 
        : `${eventStartTime} - ${eventEndTime}`,
      startHour: isAllDay ? "08:00" : eventStartTime,
      endHour: isAllDay ? "18:00" : eventEndTime,
      color: selectedColor.badgeClass,
      meetUrl: meetUrl,
      isGoogleEvent: true,
      userEmail: currentUser?.email || "",
      location: eventLocation.trim() || undefined,
      description: eventDescription.trim() || undefined,
      guests: guests.length > 0 ? guests.join(", ") : undefined,
      eventType: eventType,
      recurrence: recurrence !== "none" ? recurrence : undefined,
    };

    // Save to Google Calendar cloud and local store
    await createCalendarEventOnCloud(newEvent);
    fetchGoogleCalendarEvents(currentUser?.email);

    // If task tab was selected, also register in tasks state
    if (eventType === "task") {
      addTask({
        title: eventTitle.trim(),
        status: "todo",
        dueDate: eventDate,
        timeEstimate: 60,
        scheduledSlot: isAllDay ? undefined : `${eventStartTime} - ${eventEndTime}`,
        description: eventDescription.trim() || undefined,
      });
    }

    setIsNewEventModalOpen(false);
    // Reset form
    setEventTitle("");
    setEventLocation("");
    setEventDescription("");
    setGuests([]);
    setGuestInput("");
    setIsAllDay(false);
    setRecurrence("none");
    setEventType("event");
    setSyncNotice(language === "en" ? "Event synchronized with Google Calendar & Syncro" : "Acara berhasil disinkronkan ke Google Calendar & Syncro");
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const openGoogleCalendarExternal = () => {
    window.open("https://calendar.google.com", "_blank");
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
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Google Calendar Iconic "Buat" / "Create" FAB Pill Button */}
          <button
            type="button"
            onClick={() => {
              setMeetSlug(`${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`);
              setIsNewEventModalOpen(true);
            }}
            className="group inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-card hover:bg-secondary/80 border border-border/80 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-foreground font-semibold text-xs sm:text-sm"
          >
            <GooglePlusIcon className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />
            <span className="tracking-tight">{language === 'en' ? "Create" : "Buat"}</span>
          </button>
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
                          const evHour = ev.startHour || "09:00";
                          return ev.dateStr === d.dateStr && evHour.startsWith(hour.slice(0, 2));
                        });

                        return (
                          <div 
                            key={`${hour}-${dayIdx}`} 
                            onClick={(e) => {
                              if (e.target === e.currentTarget) {
                                openCreateModalWithSlot(d.dateStr, hour);
                              }
                            }}
                            className={`p-1 flex flex-col gap-1.5 relative min-h-[58px] transition-colors hover:bg-primary/5 cursor-pointer ${
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
                                  className={`p-2 rounded-xl border text-xs flex flex-col justify-between shadow-xs transition hover:shadow-md cursor-pointer ${ev.color}`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-mono font-bold opacity-80 truncate">
                                        {ev.timeRange}
                                      </span>
                                      {ev.isGoogleEvent ? (
                                        <GoogleCalendarLogo size={12} />
                                      ) : (
                                        <span className="text-[9px] bg-[#EE3726] text-white px-1 py-0.2 rounded font-bold">Task</span>
                                      )}
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
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-[10px] font-bold text-foreground border border-border"
                                      >
                                        <Video size={10} className="text-[#4285F4]" />
                                        <span>Meet</span>
                                      </a>
                                      <span className="text-[9px] text-muted-foreground font-medium">1-Click Join</span>
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
                      className={`p-2 min-h-[90px] flex flex-col justify-between transition cursor-pointer hover:bg-secondary/40 ${
                        cell.isToday ? "bg-blue-500/5 font-bold ring-1 ring-inset ring-blue-500/30" : ""
                      } ${!cell.isCurrentMonth ? "bg-secondary/20 opacity-40" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          cell.isToday ? "bg-[#4285F4] text-white font-bold" : "text-foreground"
                        }`}>
                          {cell.dayNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {dayEvents.length} {language === 'en' ? "events" : "acara"}
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${ev.color}`}
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
                    const hourEvents = dayEvents.filter((ev) =>
                      ev.startHour?.startsWith(hour.slice(0, 2))
                    );

                    return (
                      <div key={hour} className="flex gap-4 items-start p-2.5 rounded-xl hover:bg-secondary/30 border border-border/50">
                        <span className="w-16 font-mono text-xs font-bold text-muted-foreground pt-1">
                          {hour}
                        </span>
                        <div className="flex-1 space-y-2">
                          {hourEvents.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => openCreateModalWithSlot(selectedDateStr, hour)}
                              className="w-full text-left text-xs text-muted-foreground/60 hover:text-foreground py-1.5 px-3 rounded-lg border border-dashed border-border/40 hover:border-primary/50 hover:bg-secondary/40 transition-all flex items-center gap-2 group"
                            >
                              <GooglePlusIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                              <span>{language === "en" ? `Create event at ${hour}` : `Buat acara pada pukul ${hour}`}</span>
                            </button>
                          ) : (
                            hourEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs ${ev.color}`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold opacity-80">
                                      {ev.timeRange}
                                    </span>
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
                                      className="px-3 py-1 bg-secondary hover:bg-accent text-xs font-bold rounded-lg border border-border flex items-center gap-1.5 text-foreground"
                                    >
                                      <Video size={12} className="text-[#4285F4]" />
                                      <span>{language === "en" ? "Join Meet" : "Buka Meet"}</span>
                                    </a>
                                  )}
                                  {ev.isTask && ev.taskId && (
                                    <Link
                                      href={`/tasks/${ev.taskId}`}
                                      className="px-2.5 py-1 bg-secondary hover:bg-accent text-xs font-bold rounded-lg border border-border text-foreground"
                                    >
                                      {language === "en" ? "Task" : "Buka Task"}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))
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
                      className="p-4 rounded-xl bg-card border border-border hover:border-[#4285F4]/50 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
      {/* DIALOG: BUAT ACARA GOOGLE CALENDAR (EXACT GOOGLE CALENDAR UI)  */}
      {/* ============================================================== */}
      <Dialog open={isNewEventModalOpen} onOpenChange={setIsNewEventModalOpen}>
        <DialogContent 
          showCloseButton={false}
          className="bg-card border border-border text-foreground sm:max-w-[560px] max-h-[92vh] rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {language === "en" ? "Create Google Calendar Event" : "Buat Acara Google Calendar"}
            </DialogTitle>
          </DialogHeader>

          {/* Header Bar: Google Workspace Event Type Tabs & Close Button */}
          <div className="p-3 sm:px-5 sm:py-3.5 border-b border-border/60 bg-secondary/20 flex items-center justify-between gap-3 shrink-0">
            {/* Event Type Tabs */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: "event", label: language === "en" ? "Event" : "Acara" },
                { id: "task", label: language === "en" ? "Task" : "Tugas" },
                { id: "focus", label: language === "en" ? "Focus time" : "Waktu fokus" },
                { id: "reminder", label: language === "en" ? "Reminder" : "Pengingat" },
              ].map((tab) => {
                const isActive = eventType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEventType(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-[#1a73e8] text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsNewEventModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateNewEvent} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs">
            {/* 1. Title Input (Large Google Style) */}
            <div className="pl-8 sm:pl-9 pr-1">
              <input
                required
                autoFocus
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder={
                  eventType === "task"
                    ? (language === "en" ? "Add task title" : "Tambahkan judul tugas")
                    : (language === "en" ? "Add title" : "Tambahkan judul")
                }
                className="w-full text-xl sm:text-2xl font-normal text-foreground placeholder:text-muted-foreground/45 border-b border-border/70 focus:border-[#1a73e8] focus:outline-none py-1.5 bg-transparent transition"
              />
            </div>

            {/* 2. Date & Time Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <Clock className="w-5 h-5 text-muted-foreground/80 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-secondary/40 border border-border text-xs rounded-xl h-8 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                  />

                  {!isAllDay && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        required
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="bg-secondary/40 border border-border text-xs rounded-xl h-8 px-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        required
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="bg-secondary/40 border border-border text-xs rounded-xl h-8 px-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                      />
                    </div>
                  )}
                </div>

                {/* All day & Recurrence row */}
                <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="rounded accent-[#1a73e8] h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{language === "en" ? "All day" : "Sepanjang hari"}</span>
                  </label>

                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="bg-transparent border border-border/60 rounded-lg text-xs h-7 px-2 text-foreground focus:outline-none"
                  >
                    <option value="none">{language === "en" ? "Does not repeat" : "Tidak berulang"}</option>
                    <option value="daily">{language === "en" ? "Daily" : "Setiap hari"}</option>
                    <option value="weekly">{language === "en" ? "Weekly" : "Setiap minggu"}</option>
                    <option value="monthly">{language === "en" ? "Monthly" : "Setiap bulan"}</option>
                  </select>

                  <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
                    WIB (GMT+07:00)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Google Meet Video Conferencing Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <GoogleMeetLogo className="w-5 h-5 mt-1 shrink-0" />
              <div className="flex-1">
                {!includeMeet ? (
                  <button
                    type="button"
                    onClick={() => setIncludeMeet(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1a73e8]/10 hover:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#4285F4] font-semibold text-xs transition"
                  >
                    <Video size={13} />
                    <span>{language === "en" ? "Add Google Meet video conferencing" : "Tambahkan konferensi video Google Meet"}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs">
                          {language === "en" ? "Join with Google Meet" : "Gabung dengan Google Meet"}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md font-mono">
                          Hingga 100 peserta
                        </span>
                      </div>
                      <a
                        href={`https://meet.google.com/${meetSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1a73e8] hover:underline font-mono text-[11px] truncate block mt-0.5"
                      >
                        meet.google.com/{meetSlug}
                      </a>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyMeetLink(`https://meet.google.com/${meetSlug}`)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-foreground transition"
                        title={language === "en" ? "Copy conference link" : "Salin tautan Google Meet"}
                      >
                        {copiedMeet ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeMeet(false)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500 transition"
                        title={language === "en" ? "Remove Meet" : "Hapus Google Meet"}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Guests / Tamu Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <Users className="w-5 h-5 text-muted-foreground/80 mt-1 shrink-0" />
              <div className="flex-1 space-y-2">
                <input
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  onKeyDown={handleAddGuest}
                  placeholder={language === "en" ? "Add guests (press Enter to add email)" : "Tambahkan tamu (tekan Enter untuk tambah email)"}
                  className="w-full bg-secondary/40 border border-border text-xs rounded-xl h-8 px-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                />

                {guests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {guests.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-[11px] text-foreground font-medium"
                      >
                        <span className="w-4 h-4 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[9px] font-bold">
                          {email.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate max-w-[160px]">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(email)}
                          className="hover:text-rose-500 ml-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Location Row */}
            <div className="flex items-center gap-3 sm:gap-4">
              <MapPin className="w-5 h-5 text-muted-foreground/80 shrink-0" />
              <div className="flex-1">
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder={language === "en" ? "Add location or room" : "Tambahkan lokasi atau ruangan"}
                  className="w-full bg-secondary/40 border border-border text-xs rounded-xl h-8 px-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>
            </div>

            {/* 6. Description Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <AlignLeft className="w-5 h-5 text-muted-foreground/80 mt-1 shrink-0" />
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder={language === "en" ? "Add description or agenda notes" : "Tambahkan deskripsi atau catatan agenda"}
                  className="w-full bg-secondary/40 border border-border text-xs rounded-xl p-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] resize-none"
                />
              </div>
            </div>

            {/* 7. Google Calendar Account & Color Palette Picker */}
            <div className="flex items-start gap-3 sm:gap-4 pt-1 border-t border-border/50">
              <CalendarIcon className="w-5 h-5 text-muted-foreground/80 mt-1 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[10px] font-bold">
                      {(currentUser?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block leading-tight">
                        {currentUser?.name || "Syncro Workspace"}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {currentUser?.email || "syncro@google.com"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-medium">
                    {selectedColor.name}
                  </span>
                </div>

                {/* 10 Google Calendar Color Dots */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {GCAL_COLORS.map((col) => {
                    const isSelected = selectedColor.id === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        title={col.name}
                        className={`w-5 h-5 rounded-full transition-transform flex items-center justify-center relative ${
                          isSelected ? "scale-125 ring-2 ring-foreground shadow-sm" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check size={10} className="text-white drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <GoogleCalendarLogo size={14} />
                <span className="hidden sm:inline">
                  {language === "en" ? "Syncs with Google Calendar" : "Tersinkron otomatis ke Google"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="text-xs h-8 sm:h-9 px-3 rounded-full hover:bg-secondary text-foreground"
                >
                  {t.modalCancel}
                </Button>
                <Button
                  type="submit"
                  className="text-xs h-8 sm:h-9 px-5 sm:px-6 font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full shadow-md transition-all active:scale-95"
                >
                  {language === "en" ? "Save" : "Simpan"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
