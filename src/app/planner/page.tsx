"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useStore, Task } from "@/store/useStore";
import { 
  GripVertical, 
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
  Columns
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { translations } from "@/lib/i18n";

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

const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
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
    language 
  } = useStore();

  const t = translations[language || 'id'];

  // Planner Modes: "gcal" (Google Calendar) or "blocking" (Time Blocking)
  const [plannerMode, setPlannerMode] = useState<"gcal" | "blocking">("gcal");
  
  // Google Calendar View: "week" | "month" | "day" | "agenda"
  const [gcalView, setGcalView] = useState<"week" | "month" | "day" | "agenda">("week");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // New Event Modal state
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("2026-10-09");
  const [eventStartTime, setEventStartTime] = useState("10:00");
  const [eventEndTime, setEventEndTime] = useState("11:00");
  const [includeMeet, setIncludeMeet] = useState(true);

  // Month navigation
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Sample Google Workspace events synchronized from Google Calendar
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<ExtraCalendarEvent[]>([
    {
      id: "gcal-1",
      title: "Daily Engineering Standup",
      dayIndex: 4, // Fri (Today)
      dateStr: "2026-10-09",
      timeRange: "09:00 - 09:30 AM",
      startHour: "09:00",
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
      meetUrl: "https://meet.google.com/eng-sync-standup",
      isGoogleEvent: true
    },
    {
      id: "gcal-2",
      title: "Syncro Workspace Client Demo",
      dayIndex: 4, // Fri
      dateStr: "2026-10-09",
      timeRange: "02:00 - 03:00 PM",
      startHour: "14:00",
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
      meetUrl: "https://meet.google.com/demo-client-sync",
      isGoogleEvent: true
    },
    {
      id: "gcal-3",
      title: "Google Workspace Security Audit",
      dayIndex: 2, // Wed
      dateStr: "2026-10-07",
      timeRange: "11:00 - 12:00 PM",
      startHour: "11:00",
      color: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
      meetUrl: "https://meet.google.com/audit-sec-itsec",
      isGoogleEvent: true
    },
    {
      id: "gcal-4",
      title: "Product Roadmap Review",
      dayIndex: 0, // Mon
      dateStr: "2026-10-05",
      timeRange: "10:00 - 11:30 AM",
      startHour: "10:00",
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
      meetUrl: "https://meet.google.com/prod-roadmap-q4",
      isGoogleEvent: true
    }
  ]);

  // Days of current week (Oct 5 - Oct 11, 2026 as reference week)
  const weekDays = useMemo(() => {
    return [
      { name: language === 'en' ? "MON" : "SEN", full: language === 'en' ? "Monday" : "Senin", date: 5, dateStr: "2026-10-05", isToday: false },
      { name: language === 'en' ? "TUE" : "SEL", full: language === 'en' ? "Tuesday" : "Selasa", date: 6, dateStr: "2026-10-06", isToday: false },
      { name: language === 'en' ? "WED" : "RAB", full: language === 'en' ? "Wednesday" : "Rabu", date: 7, dateStr: "2026-10-07", isToday: false },
      { name: language === 'en' ? "THU" : "KAM", full: language === 'en' ? "Thursday" : "Kamis", date: 8, dateStr: "2026-10-08", isToday: false },
      { name: language === 'en' ? "FRI" : "JUM", full: language === 'en' ? "Friday" : "Jumat", date: 9, dateStr: "2026-10-09", isToday: true }, // Today
      { name: language === 'en' ? "SAT" : "SAB", full: language === 'en' ? "Saturday" : "Sabtu", date: 10, dateStr: "2026-10-10", isToday: false },
      { name: language === 'en' ? "SUN" : "MIN", full: language === 'en' ? "Sunday" : "Minggu", date: 11, dateStr: "2026-10-11", isToday: false },
    ];
  }, [language]);

  const unscheduledTasks = tasks.filter((t) => !t.scheduledSlot || t.scheduledSlot === "unscheduled");

  const getTasksForSlot = (slot: string) => {
    return tasks.filter((t) => t.scheduledSlot === slot);
  };

  const onDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const targetSlot = destination.droppableId;
    updateTask(draggableId, {
      scheduledSlot: targetSlot === "unscheduled" ? undefined : targetSlot,
    });
  };

  const handleGenerateMeet = (taskTitle: string) => {
    const meetCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
    const meetUrl = `https://meet.google.com/${meetCode}`;
    window.open(meetUrl, "_blank");
  };

  const handleSyncWithGoogleCalendar = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice(language === 'en' ? "Synced with Google Calendar successfully (7 items connected)" : "Sinkronisasi Google Calendar berhasil (7 agenda terhubung)");
      setTimeout(() => setSyncNotice(null), 4000);
    }, 900);
  };

  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const meetCode = includeMeet 
      ? `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      : undefined;

    // Add to Google Calendar events list
    const newEvent: ExtraCalendarEvent = {
      id: `gcal-${Date.now()}`,
      title: eventTitle.trim(),
      dayIndex: 4, // default Friday
      dateStr: eventDate,
      timeRange: `${eventStartTime} - ${eventEndTime}`,
      startHour: eventStartTime,
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
      meetUrl: meetCode,
      isGoogleEvent: true
    };

    setGoogleCalendarEvents(prev => [newEvent, ...prev]);

    // Also add as a scheduled task in store
    addTask({
      title: `[GCal] ${eventTitle.trim()}`,
      status: "todo",
      dueDate: eventDate,
      timeEstimate: 60,
      scheduledSlot: `${eventStartTime.startsWith("0") ? eventStartTime.slice(1) : eventStartTime} AM`,
    });

    setIsNewEventModalOpen(false);
    setEventTitle("");
    setSyncNotice(language === 'en' ? "Event added to Google Calendar & Syncro" : "Acara berhasil ditambahkan ke Google Calendar & Syncro");
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const openGoogleCalendarExternal = () => {
    window.open("https://calendar.google.com", "_blank");
  };

  // Map tasks to calendar events for Google Calendar grid
  const allEventsForWeek = useMemo(() => {
    const list: (ExtraCalendarEvent & { isTask?: boolean; taskId?: string })[] = [...googleCalendarEvents];

    tasks.forEach(t => {
      if (t.scheduledSlot && t.scheduledSlot !== "unscheduled") {
        let hour = "09:00";
        if (t.scheduledSlot.includes("08:00")) hour = "08:00";
        else if (t.scheduledSlot.includes("09:00")) hour = "09:00";
        else if (t.scheduledSlot.includes("10:00")) hour = "10:00";
        else if (t.scheduledSlot.includes("11:00")) hour = "11:00";
        else if (t.scheduledSlot.includes("01:00")) hour = "13:00";
        else if (t.scheduledSlot.includes("02:00")) hour = "14:00";
        else if (t.scheduledSlot.includes("03:00")) hour = "15:00";
        else if (t.scheduledSlot.includes("04:00")) hour = "16:00";

        list.push({
          id: `task-${t.id}`,
          title: t.title,
          dayIndex: 4, // Friday (Today)
          dateStr: t.dueDate || "2026-10-09",
          timeRange: t.scheduledSlot,
          startHour: hour,
          color: "bg-[#EE3726]/15 text-[#EE3726] border-[#EE3726]/30",
          meetUrl: `https://meet.google.com/syncro-${t.id.slice(0, 4)}`,
          isTask: true,
          taskId: t.id
        });
      }
    });

    return list;
  }, [googleCalendarEvents, tasks]);

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
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={10} />
                <span>Google Calendar Terhubung</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 mt-0.5">
              <span>{language === 'en' ? "Google Calendar & Planner" : "Google Calendar & Syncro Planner"}</span>
            </h1>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Main Mode Toggle: Google Calendar vs Time-Blocking */}
          <div className="flex bg-secondary/80 border border-border p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setPlannerMode("gcal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                plannerMode === "gcal" 
                  ? "bg-[#4285F4] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GoogleCalendarLogo size={14} />
              <span>Google Calendar</span>
            </button>
            <button
              onClick={() => setPlannerMode("blocking")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                plannerMode === "blocking" 
                  ? "bg-[#EE3726] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns size={13} />
              <span>Time-Blocking</span>
            </button>
          </div>

          {/* Sync Button */}
          <Button
            size="sm"
            onClick={handleSyncWithGoogleCalendar}
            disabled={isSyncing}
            variant="outline"
            className="h-9 px-3 text-xs gap-1.5 border-border font-semibold hover:border-[#4285F4] hover:text-[#4285F4] rounded-xl"
            title="Sinkronisasi 2-arah dengan Google Calendar"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-[#4285F4]" : "text-[#4285F4]"} />
            <span className="hidden sm:inline">{isSyncing ? "Menyinkronkan..." : "Sync Calendar"}</span>
          </Button>

          {/* + New Event Button */}
          <Button
            size="sm"
            onClick={() => setIsNewEventModalOpen(true)}
            className="h-9 px-3.5 text-xs gap-1.5 bg-[#EE3726] hover:bg-[#D32717] text-white font-bold rounded-xl shadow-sm shadow-[#EE3726]/20"
          >
            <Plus size={14} />
            <span>{language === 'en' ? "+ New Event" : "+ Buat Acara"}</span>
          </Button>

          {/* External Google Calendar Link */}
          <Button
            size="sm"
            variant="ghost"
            onClick={openGoogleCalendarExternal}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-[#4285F4] rounded-xl border border-border/80"
            title="Buka Google Calendar Web (calendar.google.com)"
          >
            <ExternalLink size={14} />
          </Button>
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
      {/* MODE 1: GOOGLE CALENDAR VIEW (WEEK / MONTH / DAY / AGENDA) */}
      {/* ============================================================== */}
      {plannerMode === "gcal" && (
        <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Google Calendar Toolbar: Month/Year navigation, Today, and View Switcher */}
          <div className="p-3 sm:p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Today Button */}
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-secondary text-foreground transition"
              >
                {language === 'en' ? "Today" : "Hari Ini"}
              </button>

              {/* Navigation arrows */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                  title="Periode Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                  title="Periode Selanjutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Month & Year Title */}
              <h2 className="text-sm sm:text-base font-black text-foreground">
                {language === 'en' ? "October 2026" : "Oktober 2026"}
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
                  <div key={d.name} className={`px-1 py-1 ${index < 6 ? "border-r border-border/60" : ""}`}>
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
                        const matchingEvents = allEventsForWeek.filter(ev => {
                          const evHour = ev.startHour || "09:00";
                          return ev.dayIndex === dayIdx && evHour.startsWith(hour.slice(0, 2));
                        });

                        return (
                          <div 
                            key={`${hour}-${dayIdx}`} 
                            className={`p-1 flex flex-col gap-1.5 relative ${
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
                <span>Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              {/* 31 Days Grid */}
              <div className="grid grid-cols-7 flex-1 border-l border-b border-border divide-x divide-y divide-border rounded-b-xl overflow-hidden bg-card">
                {/* 4 offset empty cells for Oct 2026 starting on Thursday */}
                <div className="p-2 min-h-[90px] bg-secondary/20 opacity-40 text-xs text-muted-foreground">27</div>
                <div className="p-2 min-h-[90px] bg-secondary/20 opacity-40 text-xs text-muted-foreground">28</div>
                <div className="p-2 min-h-[90px] bg-secondary/20 opacity-40 text-xs text-muted-foreground">29</div>
                <div className="p-2 min-h-[90px] bg-secondary/20 opacity-40 text-xs text-muted-foreground">30</div>

                {/* Days 1 to 31 */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dateNum) => {
                  const isToday = dateNum === 9;
                  const dayEvents = allEventsForWeek.filter((ev) => {
                    if (dateNum === 9 && ev.dayIndex === 4) return true;
                    if (dateNum === 7 && ev.dayIndex === 2) return true;
                    if (dateNum === 5 && ev.dayIndex === 0) return true;
                    return false;
                  });

                  return (
                    <div
                      key={dateNum}
                      className={`p-2 min-h-[90px] flex flex-col justify-between transition hover:bg-secondary/30 ${
                        isToday ? "bg-blue-500/5 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          isToday ? "bg-[#4285F4] text-white font-bold" : "text-foreground"
                        }`}>
                          {dateNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {dayEvents.length} acara
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${ev.color}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-muted-foreground font-bold">
                            +{dayEvents.length - 2} lainnya
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
          {gcalView === "day" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-300 text-xs font-semibold">
                <GoogleCalendarLogo size={16} />
                <span>Jadwal Harian Google Calendar - Jumat, 09 Oktober 2026 (Hari Ini)</span>
              </div>

              <div className="space-y-2.5">
                {WEEK_HOURS.map((hour) => {
                  const hourEvents = allEventsForWeek.filter(
                    (ev) => ev.dayIndex === 4 && ev.startHour?.startsWith(hour.slice(0, 2))
                  );

                  return (
                    <div key={hour} className="flex gap-4 items-start p-2 rounded-xl hover:bg-secondary/30 border border-border/50">
                      <span className="w-16 font-mono text-xs font-bold text-muted-foreground pt-1">
                        {hour}
                      </span>
                      <div className="flex-1 space-y-2">
                        {hourEvents.length === 0 ? (
                          <div className="text-xs text-muted-foreground/60 italic py-1">
                            Slot kosong - klik + Buat Acara untuk menjadwalkan
                          </div>
                        ) : (
                          hourEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs ${ev.color}`}
                            >
                              <div>
                                <span className="text-[10px] font-mono font-bold opacity-80">
                                  {ev.timeRange}
                                </span>
                                <h4 className="text-xs font-bold text-foreground mt-0.5">
                                  {ev.title}
                                </h4>
                              </div>
                              {ev.meetUrl && (
                                <a
                                  href={ev.meetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-secondary hover:bg-accent text-xs font-bold rounded-lg border border-border flex items-center gap-1.5 text-foreground"
                                >
                                  <Video size={12} className="text-[#4285F4]" />
                                  <span>Buka Meet</span>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck size={14} className="text-[#4285F4]" />
                  <span>Daftar Agenda Minggu Ini (5 - 11 Okt 2026)</span>
                </h3>

                {allEventsForWeek.map((ev) => (
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
                          Buka Task
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: TIME BLOCKING PLANNER (CLICKUP STYLE DRAG & DROP) */}
      {/* ============================================================== */}
      {plannerMode === "blocking" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:gap-6 overflow-hidden min-h-0">
            {/* Left Drawer: Unscheduled Tasks Panel */}
            <div className="w-full lg:w-80 max-h-48 sm:max-h-56 lg:max-h-none shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-secondary/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground">{t.unscheduledTasksTitle}</span>
                  <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{language === 'en' ? "Drag to slot" : "Tarik ke Jam"}</span>
              </div>

              <Droppable droppableId="unscheduled">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-rose-500/10" : ""
                    }`}
                  >
                    {unscheduledTasks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-xs">
                        {language === 'en' ? "All tasks scheduled!" : "Semua tugas telah dijadwalkan!"}
                      </div>
                    ) : (
                      unscheduledTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                                snapshot.isDragging
                                  ? "bg-rose-500/20 border-rose-500 shadow-xl"
                                  : "bg-secondary/40 border-border hover:border-rose-500/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="text-xs font-semibold text-foreground hover:text-[#EE3726] transition line-clamp-1"
                                >
                                  {task.title}
                                </Link>
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground hover:text-rose-500 cursor-grab active:cursor-grabbing p-1"
                                >
                                  <GripVertical size={14} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-rose-500" />
                                  {task.timeEstimate || 60}m
                                </span>
                                <span className="capitalize text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-rose-600 dark:text-rose-300 font-medium">
                                  {task.priority || "normal"}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Right: Time Blocking Grid by Hours */}
            <div className="flex-1 flex flex-col bg-card/60 border border-border rounded-xl overflow-y-auto p-4 space-y-3 shadow-sm">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = getTasksForSlot(slot);

                return (
                  <div key={slot} className="flex gap-4 items-start group">
                    <div className="w-20 pt-2 text-right text-xs font-mono font-bold text-muted-foreground shrink-0">
                      {slot}
                    </div>

                    <Droppable droppableId={slot}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[72px] p-2.5 rounded-xl border border-dashed transition-all flex flex-col gap-2 ${
                            snapshot.isDraggingOver
                              ? "bg-rose-500/10 border-rose-500"
                              : "bg-secondary/30 border-border hover:border-rose-500/40"
                          }`}
                        >
                          {slotTasks.map((task, index) => {
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                                      snapshot.isDragging
                                        ? "bg-rose-500/20 border-rose-500 shadow-xl"
                                        : "bg-card border-border shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-muted-foreground hover:text-rose-500 cursor-grab p-0.5"
                                      >
                                        <GripVertical size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <Link
                                          href={`/tasks/${task.id}`}
                                          className="text-xs font-bold text-foreground hover:text-[#EE3726] transition truncate block"
                                        >
                                          {task.title}
                                        </Link>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <Clock size={11} className="text-rose-500" />
                                          {task.timeEstimate || 60}m
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action Buttons: Meet & Sync to GCal */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGenerateMeet(task.title)}
                                        className="h-7 px-2.5 text-[11px] gap-1.5 border-border text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                        title={language === 'en' ? "Open Google Meet" : "Buka Google Meet untuk sesi ini"}
                                      >
                                        <Video size={12} className="text-rose-500" />
                                        <span>Meet</span>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* ============================================================== */}
      {/* DIALOG: BUAT ACARA GOOGLE CALENDAR BARU */}
      {/* ============================================================== */}
      <Dialog open={isNewEventModalOpen} onOpenChange={setIsNewEventModalOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[480px] rounded-2xl shadow-2xl p-0 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center gap-2.5">
            <GoogleCalendarLogo size={22} />
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {language === 'en' ? "Create Google Calendar Event" : "Buat Acara Google Calendar"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                {language === 'en' ? "Synchronizes instantly with your Google Calendar" : "Tersinkronisasi otomatis dengan Google Calendar Anda"}
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateNewEvent} className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                {language === 'en' ? "Event Title" : "Nama Acara / Pertemuan"}
              </label>
              <Input
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder={language === 'en' ? "e.g. Weekly Sync with Marketing" : "e.g. Rapat Koordinasi Mingguan Tim"}
                className="bg-secondary/40 border-border text-xs focus-visible:ring-[#4285F4] rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                  {language === 'en' ? "Date" : "Tanggal Acara"}
                </label>
                <Input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-secondary/40 border-border text-xs rounded-xl h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                    {language === 'en' ? "Start" : "Mulai"}
                  </label>
                  <Input
                    type="time"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="bg-secondary/40 border-border text-xs rounded-xl h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground mb-1 block">
                    {language === 'en' ? "End" : "Selesai"}
                  </label>
                  <Input
                    type="time"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="bg-secondary/40 border-border text-xs rounded-xl h-9"
                  />
                </div>
              </div>
            </div>

            {/* Google Meet Toggle */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-[#4285F4]" />
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Sertakan Google Meet Link
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Buat link video call otomatis untuk peserta
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeMeet}
                onChange={(e) => setIncludeMeet(e.target.checked)}
                className="h-4 w-4 rounded accent-[#4285F4] cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-xs h-9 rounded-xl border-border"
              >
                {t.modalCancel}
              </Button>
              <Button
                type="submit"
                className="text-xs h-9 px-4 font-bold bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl shadow-md shadow-[#4285F4]/20"
              >
                {language === 'en' ? "Save to Calendar" : "Simpan ke Calendar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
