"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  Briefcase, 
  Users,
  Flame,
  Plus
} from "lucide-react";

export default function Home() {
  const { tasks, notifications, spaces, startTimer, activeTimerTaskId, isTimerRunning } = useStore();

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
      {/* ClickUp Red Edition Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1a0f14] via-[#141219] to-[#1c0f12] border border-rose-500/30 p-7 rounded-2xl shadow-xl shadow-rose-950/20">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-rose-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-widest">
                ClickUp Red Workspace
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1.5">
              Selamat Datang, Ravi Zein 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Manajemen tugas presisi, penjadwalan time blocking kalender, dan kecerdasan Gemini AI dengan antarmuka ClickUp Red yang elegan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/planner">
              <Button className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-9 gap-1.5 shadow-md shadow-rose-900/30 font-semibold rounded-lg">
                <Calendar size={14} />
                <span>Buka Planner</span>
              </Button>
            </Link>
            <Link href="/ai">
              <Button variant="outline" className="border-rose-500/40 text-rose-300 hover:bg-rose-500/15 text-xs h-9 gap-1.5 rounded-lg">
                <Sparkles size={14} className="text-rose-400" />
                <span>Gemini AI</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row ClickUp-Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks">
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition">
                <CheckCircle2 size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{totalTasks}</div>
              <p className="text-[11px] text-slate-400 mt-1">Seluruh workspace aktif</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition">
                <Clock size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-400">{inProgressTasks.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Sedang aktif dikerjakan</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
                <CheckCircle2 size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-400">{completedTasks.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Tugas selesai minggu ini</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inbox">
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inbox Unread</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition">
                <MessageSquare size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-300">{unreadNotifications.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Aktivitas & penugasan baru</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Tasks & Spaces */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Left: Active Tasks */}
        <Card className="lg:col-span-4 bg-[#12131b] border-[#222533] text-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#1e202d]">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Flame size={17} className="text-rose-500" />
                Tugas Prioritas Hari Ini
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Fokus pekerjaan tim dengan batas waktu terdekat.
              </CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-400 hover:text-rose-300 gap-1 p-0">
                <span>Lihat Semua</span>
                <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-4">
            {tasks.slice(0, 5).map((task) => {
              const isDone = task.status === "done";
              const isTimerOn = activeTimerTaskId === task.id && isTimerRunning;

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#222533] bg-[#161722] hover:border-rose-500/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-rose-500/60 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? "line-through text-slate-500" : "text-slate-100"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-rose-300">{task.dueDate || "Hari ini"}</span>
                        <span>•</span>
                        <span>{task.timeEstimate || 60} menit</span>
                        {task.priority && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-bold text-rose-400">
                              {task.priority}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startTimer(task.id)}
                    className={`h-7 px-2.5 text-[11px] rounded-lg ${
                      isTimerOn ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Clock size={12} className="mr-1" />
                    {isTimerOn ? "Tracking" : "Timer"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Spaces & Activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* Spaces Card */}
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#1e202d]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase size={16} className="text-rose-400" />
                Spaces Proyek
              </CardTitle>
              <Link href="/spaces">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-rose-400 p-0 hover:text-rose-300">
                  Semua Space
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {spaces.map((sp) => (
                <div key={sp.id} className="p-2.5 rounded-lg border border-[#222533] bg-[#161722] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
                    <span className="text-xs font-semibold text-slate-200">{sp.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {tasks.filter((t) => t.spaceId === sp.id).length} tugas
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-[#12131b] border-[#222533] text-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-[#1e202d]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-rose-400" />
                Aktivitas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="h-6 w-6 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight text-slate-300">
                      <strong className="text-white">{item.sender}</strong> {item.action} <span className="text-rose-300 font-medium">"{item.target}"</span>
                    </p>
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
