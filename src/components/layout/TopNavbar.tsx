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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
    notifications 
  } = useStore();

  const [openNewTask, setOpenNewTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("60");
  const [taskPriority, setTaskPriority] = useState<"urgent" | "high" | "normal" | "low">("normal");

  // Timer interval effect
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
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Search / Context */}
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari task, space, atau dokumen..." 
            className="pl-9 h-9 bg-slate-950/60 border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Middle: Active Live Time Tracker */}
      <div className="flex items-center gap-3">
        {activeTask ? (
          <div className="flex items-center gap-3 bg-slate-950/80 border border-blue-500/30 px-3.5 py-1.5 rounded-full shadow-inner shadow-blue-500/10 animate-pulse">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-medium text-slate-300 max-w-[160px] truncate">
              {activeTask.title}
            </span>
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
              {formatTimer(timerSeconds)}
            </span>
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              {isTimerRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause timer"
                  className="p-1 hover:text-amber-400 text-slate-400 transition"
                >
                  <Pause size={14} />
                </button>
              ) : (
                <button
                  onClick={() => startTimer(activeTask.id)}
                  title="Resume timer"
                  className="p-1 hover:text-emerald-400 text-slate-400 transition"
                >
                  <Play size={14} />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop and save time"
                className="p-1 hover:text-rose-400 text-slate-400 transition"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-800/60">
            <Clock size={14} className="text-slate-600" />
            <span>Time Tracker Siap (Klik Play pada task untuk mulai)</span>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-xs bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/30 text-blue-300 hover:bg-blue-600/20"
          >
            <Sparkles size={14} className="text-blue-400" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Modal New Task */}
        <Dialog open={openNewTask} onOpenChange={setOpenNewTask}>
          <DialogTrigger
            render={
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm">
                <Plus size={14} />
                <span>Task Baru</span>
              </Button>
            }
          />
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Buat Task Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Judul Task</label>
                <Input
                  required
                  placeholder="e.g. Implementasi Autentikasi Google SSO"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Estimasi (menit)</label>
                  <Input
                    type="number"
                    value={taskEstimate}
                    onChange={(e) => setTaskEstimate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Prioritas</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-sm px-3 text-slate-200"
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
                  onClick={() => setOpenNewTask(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-500 text-xs"
                >
                  Simpan Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
