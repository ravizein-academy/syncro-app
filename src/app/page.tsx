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
  Flame 
} from "lucide-react";
import { translations } from "@/lib/i18n";

export default function Home() {
  const { tasks, notifications, spaces, startTimer, activeTimerTaskId, isTimerRunning, language } = useStore();
  const t = translations[language || 'id'];

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-7xl mx-auto select-none">
      {/* ClickUp Red Edition Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-500/10 via-card to-rose-600/15 border border-rose-500/30 p-7 rounded-2xl shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-rose-600/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                {t.heroBadge}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
              {t.heroWelcome}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {t.heroDesc}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/planner">
              <Button className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-9 gap-1.5 shadow-md shadow-rose-900/30 font-semibold rounded-lg">
                <Calendar size={14} />
                <span>{t.openPlanner}</span>
              </Button>
            </Link>
            <Link href="/ai">
              <Button variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/15 text-xs h-9 gap-1.5 rounded-lg">
                <Sparkles size={14} className="text-rose-500" />
                <span>{t.openAI}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row ClickUp-Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks">
          <Card className="bg-card border-border text-foreground hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.totalTasks}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
                <CheckCircle2 size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{totalTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.totalTasksSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-card border-border text-foreground hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.inProgress}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
                <Clock size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{inProgressTasks.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.inProgressSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-card border-border text-foreground hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.completed}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle2 size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedTasks.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.completedSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inbox">
          <Card className="bg-card border-border text-foreground hover:border-rose-500/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.unreadInbox}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
                <MessageSquare size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-300">{unreadNotifications.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.unreadInboxSub}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Tasks & Spaces */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Left: Active Tasks */}
        <Card className="lg:col-span-4 bg-card border-border text-foreground shadow-sm flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Flame size={17} className="text-rose-500" />
                {t.inProgressSectionTitle}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t.heroDesc.split(".")[0]}
              </CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-500 gap-1 p-0">
                <span>{t.viewAllTasks}</span>
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
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/50 hover:border-rose-500/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-rose-500/60 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="text-rose-600 dark:text-rose-300 font-medium">{task.dueDate || t.todayLabel}</span>
                        <span>•</span>
                        <span>{task.timeEstimate || 60}m</span>
                        {task.priority && (
                          <>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-bold text-rose-600 dark:text-rose-400">
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
                      isTimerOn ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock size={12} className="mr-1" />
                    {isTimerOn ? "Tracking" : t.startNow}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Spaces & Activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* Spaces Card */}
          <Card className="bg-card border-border text-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase size={16} className="text-rose-500" />
                {t.activeSpacesSummary}
              </CardTitle>
              <Link href="/spaces">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-rose-600 dark:text-rose-400 p-0 hover:text-rose-500">
                  {t.viewSpaces}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {spaces.map((sp) => (
                <div key={sp.id} className="p-2.5 rounded-lg border border-border bg-secondary/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
                    <span className="text-xs font-semibold text-foreground">{sp.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {tasks.filter((t) => t.spaceId === sp.id).length} {language === 'en' ? 'tasks' : 'tugas'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-card border-border text-foreground shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-rose-500" />
                {t.activityFeed}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {notifications.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs text-foreground">
                  <div className="h-6 w-6 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {item.sender[0]}
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight text-foreground">
                      <strong className="font-bold">{item.sender}</strong> {item.action} <span className="text-rose-600 dark:text-rose-300 font-medium">"{item.target}"</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
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
