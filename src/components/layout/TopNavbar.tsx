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
  Search
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
    <header className="h-16 border-b border-[#1e2029] bg-[#0c0d12]/90 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0 select-none">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari task, space, atau dokumen..." 
            className="pl-9 h-9 bg-[#14151e] border-[#252837] text-xs text-slate-200 placeholder:text-slate-500 focus-visible:ring-rose-500 rounded-lg"
          />
        </div>
      </div>

      {/* Middle: Active Live Time Tracker (ClickUp Red Edition) */}
      <div className="flex items-center gap-3">
        {activeTask ? (
          <div className="flex items-center gap-3 bg-[#151218] border border-rose-500/40 px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-950/50">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-200 max-w-[160px] truncate">
              {activeTask.title}
            </span>
            <span className="font-mono text-xs font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/40">
              {formatTimer(timerSeconds)}
            </span>
            <div className="flex items-center gap-1 border-l border-rose-900/50 pl-2">
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
                  className="p-1 hover:text-rose-400 text-slate-400 transition"
                >
                  <Play size={14} />
                </button>
              )}
              <button
                onClick={stopTimer}
                title="Stop and save time"
                className="p-1 hover:text-rose-500 text-slate-400 transition"
              >
                <Square size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-[#13141c] px-3.5 py-1.5 rounded-full border border-[#222533]">
            <Clock size={13} className="text-rose-400" />
            <span>Time Tracker (Klik Play pada task untuk mulai mencatat durasi)</span>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-xs bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 rounded-lg"
          >
            <Sparkles size={14} className="text-rose-400" />
            <span className="hidden sm:inline">Gemini AI</span>
          </Button>
        </Link>

        <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 transition">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white ring-2 ring-[#0c0d12]">
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
                <span>Task Baru</span>
              </Button>
            }
          />
          <DialogContent className="bg-[#12131a] border-[#252838] text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Buat Task Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Judul Task</label>
                <Input
                  required
                  placeholder="e.g. Implementasi Autentikasi Google SSO"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="bg-[#181a24] border-[#2c3044] text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Estimasi (menit)</label>
                  <Input
                    type="number"
                    value={taskEstimate}
                    onChange={(e) => setTaskEstimate(e.target.value)}
                    className="bg-[#181a24] border-[#2c3044] text-sm focus-visible:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Prioritas</label>
                  <select
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full h-9 rounded-md bg-[#181a24] border border-[#2c3044] text-sm px-3 text-slate-200 focus:outline-none focus:border-rose-500"
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
                  className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold"
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
