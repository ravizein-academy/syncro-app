"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users
} from "lucide-react";

export default function Home() {
  const { tasks, notifications, spaces, startTimer, activeTimerTaskId, isTimerRunning } = useStore();

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 p-6 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Syncro Workspace</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Selamat Datang, Ravi Zein 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Aplikasi PWA manajemen tugas, time-blocking terintegrasi kalender, dan asisten AI Gemini 100% Free Tier.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/planner">
            <Button className="bg-blue-600 hover:bg-blue-500 text-xs h-9 gap-1.5 shadow-sm">
              <Calendar size={14} />
              <span>Buka Planner</span>
            </Button>
          </Link>
          <Link href="/ai">
            <Button variant="outline" className="border-blue-500/40 text-blue-300 hover:bg-blue-600/15 text-xs h-9 gap-1.5">
              <Sparkles size={14} className="text-blue-400" />
              <span>AI Brain</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks">
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 transition cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Tugas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-[11px] text-slate-500 mt-1">Seluruh workspace aktif</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 transition cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Sedang Dikerjakan</CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <p className="text-[11px] text-amber-400/80 mt-1">Dalam pengerjaan aktif</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 transition cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Selesai</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-[11px] text-emerald-400/80 mt-1">Tugas terselesaikan</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inbox">
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 transition cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Notifikasi Belum Dibaca</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadNotifications.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">Pemberitahuan aktivitas</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Left: Active Tasks */}
        <Card className="lg:col-span-4 bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Tugas Hari Ini & Prioritas</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Daftar task yang membutuhkan perhatian Anda.
              </CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 gap-1">
                <span>Lihat Semua</span>
                <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.slice(0, 5).map((task) => {
              const isDone = task.status === "done";
              const isTimerOn = activeTimerTaskId === task.id && isTimerRunning;

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? "line-through text-slate-500" : "text-slate-200"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{task.dueDate || "Hari ini"}</span>
                        <span>•</span>
                        <span>{task.timeEstimate || 60} menit</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startTimer(task.id)}
                    className={`h-7 px-2 text-[11px] ${
                      isTimerOn ? "text-emerald-400" : "text-slate-400 hover:text-white"
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

        {/* Right: Spaces & Activity Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Spaces card */}
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-400" />
                Spaces Proyek
              </CardTitle>
              <Link href="/spaces">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-400 p-0 hover:text-blue-300">
                  Semua Space
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {spaces.map((sp) => (
                <div key={sp.id} className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${sp.color}`} />
                    <span className="text-xs font-medium text-slate-200">{sp.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {tasks.filter((t) => t.spaceId === sp.id).length} task
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Activity card */}
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                Aktivitas Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight">
                      <strong>{item.sender}</strong> {item.action} <span className="text-blue-400">"{item.target}"</span>
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
