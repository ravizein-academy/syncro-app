"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus, 
  Bell, 
  Sparkles, 
  Search,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export function TopNavbar() {
  const { 
    tasks, 
    activeTimerTaskId, 
    timerSeconds, 
    isTimerRunning, 
    pauseTimer, 
    stopTimer, 
    tickTimer, 
    startTimer,
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage
  } = useStore();

  const t = translations[language || 'id'];
  const [openNewTask, setOpenNewTask] = useState(false);

  // Global keyboard shortcut: 't' or 'c' to open Create Task modal (when not in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }
      if (e.key === "t" || e.key === "T" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        setOpenNewTask(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  const activeTask = tasks.find((t) => t.id === activeTimerTaskId);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0 select-none transition-colors duration-200">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t.searchPlaceholder} 
            className="pl-9 h-9 bg-secondary border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-[#EE3726] rounded-lg"
          />
        </div>
      </div>

      {/* Middle: Active Live Time Tracker (ITSEC Red Edition) */}
      <div className="flex items-center gap-3">
        {activeTask ? (
          <div className="flex items-center gap-3 bg-secondary border border-[#EE3726]/40 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#EE3726] animate-ping" />
            <span className="text-xs font-semibold text-foreground max-w-[160px] truncate">
              {activeTask.title}
            </span>
            <span className="font-mono text-xs font-bold text-[#EE3726] bg-[#EE3726]/10 px-2 py-0.5 rounded border border-[#EE3726]/30">
              {formatTimer(timerSeconds)}
            </span>
            <div className="flex items-center gap-1 border-l border-border pl-2">
              {isTimerRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause timer"
                  className="p-1 hover:text-amber-500 text-muted-foreground transition"
                >
                  <Pause size={14} />
                </button>
              ) : (
                <button
                  onClick={() => startTimer(activeTask.id)}
                  title="Resume timer"
                  className="p-1 hover:text-[#EE3726] text-muted-foreground transition"
                >
                  <Play size={14} />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop and save time"
                className="p-1 hover:text-[#EE3726] text-muted-foreground transition"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3.5 py-1.5 rounded-full border border-border">
            <Clock size={13} className="text-[#EE3726]" />
            <span>{t.timerIdle}</span>
          </div>
        )}
      </div>

      {/* Right controls: Theme Switcher, Language Switcher, Gemini AI, Notifications, ClickUp New Task */}
      <div className="flex items-center gap-2.5">
        {/* Language Switcher */}
        <div className="flex items-center bg-secondary border border-border rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage('id')}
            className={`px-2 py-1 rounded transition text-[11px] ${
              language === 'id' 
                ? 'bg-[#EE3726] text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Bahasa Indonesia"
          >
            🇮🇩 ID
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded transition text-[11px] ${
              language === 'en' 
                ? 'bg-[#EE3726] text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="English"
          >
            🇬🇧 EN
          </button>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-accent transition"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-slate-600" />
          )}
        </button>

        {/* Gemini AI Shortcut */}
        <Link href="/ai">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-xs bg-[#EE3726]/10 border-[#EE3726]/30 text-[#EE3726] hover:bg-[#EE3726]/20 rounded-lg"
          >
            <Sparkles size={14} className="text-[#EE3726]" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        {/* Notifications Inbox */}
        <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE3726] text-[10px] font-extrabold text-white ring-2 ring-card">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Clean New Task Button (No Symbols) */}
        <Link href="/tasks/new">
          <Button 
            size="sm" 
            className="h-8 text-xs bg-[#EE3726] hover:bg-[#D32717] text-white font-bold shadow-md shadow-[#EE3726]/20 rounded-lg px-3.5"
          >
            <span>{t.newTask}</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
