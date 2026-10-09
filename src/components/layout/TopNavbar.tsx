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
  Moon,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";

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
    addTask,
    notifications,
    theme,
    toggleTheme,
    language,
    setLanguage
  } = useStore();

  const t = translations[language || 'id'];

  const [openNewTask, setOpenNewTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("60");
  const [taskPriority, setTaskPriority] = useState<"urgent" | "high" | "normal" | "low">("high");

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

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle,
      status: "todo",
      priority: taskPriority,
      timeEstimate: parseInt(taskEstimate) || 60,
      timeTracked: 0,
      isPersonal: false,
    });

    setTaskTitle("");
    setOpenNewTask(false);
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
            className="pl-9 h-9 bg-secondary border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-rose-500 rounded-lg"
          />
        </div>
      </div>

      {/* Middle: Active Live Time Tracker (ClickUp Red Edition) */}
      <div className="flex items-center gap-3">
        {activeTask ? (
          <div className="flex items-center gap-3 bg-secondary border border-rose-500/40 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-foreground max-w-[160px] truncate">
              {activeTask.title}
            </span>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
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
                  className="p-1 hover:text-rose-500 text-muted-foreground transition"
                >
                  <Play size={14} />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop and save time"
                className="p-1 hover:text-rose-600 text-muted-foreground transition"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3.5 py-1.5 rounded-full border border-border">
            <Clock size={13} className="text-rose-500" />
            <span>{t.timerIdle}</span>
          </div>
        )}
      </div>

      {/* Right controls: Theme Switcher, Language Switcher, Gemini AI, Notifications, New Task */}
      <div className="flex items-center gap-2.5">
        {/* Language Switcher */}
        <div className="flex items-center bg-secondary border border-border rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setLanguage('id')}
            className={`px-2 py-1 rounded transition text-[11px] ${
              language === 'id' 
                ? 'bg-rose-600 text-white shadow-sm' 
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
                ? 'bg-rose-600 text-white shadow-sm' 
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
            className="h-8 gap-1.5 text-xs bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 rounded-lg"
          >
            <Sparkles size={14} className="text-rose-500" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        {/* Notifications Inbox */}
        <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white ring-2 ring-card">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Modal New Task */}
        <Dialog open={openNewTask} onOpenChange={setOpenNewTask}>
          <DialogTrigger
            render={
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-900/30 rounded-lg">
                <Plus size={14} />
                <span>{t.newTask}</span>
              </Button>
            }
          />
          <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t.modalNewTaskTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.modalTaskTitleLabel}</label>
                <Input
                  required
                  placeholder={t.modalTaskTitlePlaceholder}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t.modalTaskEstimateLabel}</label>
                  <Input
                    type="number"
                    value={taskEstimate}
                    onChange={(e) => setTaskEstimate(e.target.value)}
                    className="bg-secondary border-border text-sm focus-visible:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t.modalTaskPriorityLabel}</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full h-9 rounded-md bg-secondary border border-border text-sm px-3 text-foreground focus:outline-none focus:border-rose-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenNewTask(false)}
                  className="text-xs"
                >
                  {t.modalCancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/40"
                >
                  {t.modalSubmitTask}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
