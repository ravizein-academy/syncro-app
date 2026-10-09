"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore, Task } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Pin,
  X,
  Video,
  FileEdit,
  TrendingUp,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Flag,
  Tag,
  RotateCcw,
  Maximize2
} from "lucide-react";
import { translations } from "@/lib/i18n";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export default function Home() {
  const { 
    tasks, 
    notifications, 
    spaces, 
    language,
    currentUser,
    lineupTaskIds,
    personalNotes,
    addToLineup,
    removeFromLineup,
    setPersonalNotes,
    updateTask,
    addTask
  } = useStore();

  const t = translations[language || 'id'];

  const [activeWorkTab, setActiveWorkTab] = useState<"todo" | "overdue" | "next" | "unscheduled">("todo");
  const [showAddLineupDropdown, setShowAddLineupDropdown] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskInitialTitle, setCreateTaskInitialTitle] = useState("");
  const [notesDraft, setNotesDraft] = useState(personalNotes || "");
  const [notesSaved, setNotesSaved] = useState(true);
  const [todayStr, setTodayStr] = useState("");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split("T")[0]);
    setFormattedDate(
      now.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    );
  }, [language]);

  // Widget visibility toggles (ClickUp Customize Home)
  const [visibleWidgets, setVisibleWidgets] = useState({
    lineup: true,
    myWork: true,
    agenda: true,
    velocity: true,
    notepad: true,
    spaces: true,
    activity: true
  });
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const toggleWidget = (key: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNotesChange = (text: string) => {
    setNotesDraft(text);
    setPersonalNotes(text);
    setNotesSaved(true);
  };

  // Metrics calculations
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const unreadNotifications = notifications.filter((n) => !n.read);

  // Lineup Tasks
  const lineupTasks = tasks.filter((t) => lineupTaskIds.includes(t.id));
  const availableForLineup = tasks.filter((t) => !lineupTaskIds.includes(t.id) && t.status !== "done");

  // Today & Agenda slots
  const scheduledTasks = tasks.filter((t) => t.scheduledSlot && t.scheduledSlot !== "unscheduled");

  // My Work Filtered Tasks
  const myWorkTasks = tasks.filter((t) => {
    if (activeWorkTab === "todo") {
      return t.status !== "done";
    }
    if (activeWorkTab === "overdue") {
      return t.dueDate && t.dueDate < todayStr && t.status !== "done";
    }
    if (activeWorkTab === "next") {
      return t.dueDate && t.dueDate > todayStr && t.status !== "done";
    }
    if (activeWorkTab === "unscheduled") {
      return !t.scheduledSlot || t.scheduledSlot === "unscheduled";
    }
    return true;
  });

  // Task Completion Rate
  const completionPercent = totalTasks > 0 ? Math.min(100, Math.round((completedTasks.length / totalTasks) * 100)) : 0;

  const handleToggleTaskStatus = (task: Task) => {
    updateTask(task.id, { status: task.status === "done" ? "todo" : "done" });
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle,
      status: "todo",
      priority: "high",
      timeEstimate: 60,
      isPersonal: false,
    });
    setQuickTaskTitle("");
  };

  const getPriorityFlag = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span title="Urgent">
            <Flag size={12} className="text-[#EE3726] fill-[#EE3726]" />
          </span>
        );
      case "high":
        return (
          <span title="High">
            <Flag size={12} className="text-orange-500 fill-orange-500" />
          </span>
        );
      case "low":
        return (
          <span title="Low">
            <Flag size={12} className="text-slate-400" />
          </span>
        );
      default:
        return (
          <span title="Normal">
            <Flag size={12} className="text-[#EE3726]" />
          </span>
        );
    }
  };

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-5 md:p-8 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* ClickUp Home Banner & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#EE3726] shadow-sm shadow-[#EE3726]/50 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EE3726]">
              {t.brandName} • {t.brandTagline}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            {t.heroWelcome}, {currentUser?.name || (language === 'en' ? 'User' : 'Pengguna')} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formattedDate || (language === 'en' ? "Today's Overview" : "Ringkasan Hari Ini")}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/tasks/new">
            <Button
              size="sm"
              className="h-8 text-xs bg-[#EE3726] hover:bg-[#D32717] text-white font-bold rounded-lg shadow-sm shadow-[#EE3726]/20 transition px-3.5"
            >
              <span>{t.newTask}</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomizeModal(!showCustomizeModal)}
            className="h-8 gap-1.5 text-xs border-border bg-card hover:bg-accent text-foreground rounded-lg"
          >
            <SlidersHorizontal size={13} className="text-[#EE3726]" />
            <span>{language === 'en' ? 'Manage Cards' : 'Atur Kartu'}</span>
          </Button>

          <Link href="/planner">
            <Button className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs h-8 gap-1.5 shadow-sm font-semibold rounded-lg">
              <Calendar size={13} />
              <span>{t.openPlanner}</span>
            </Button>
          </Link>

          <Link href="/ai">
            <Button variant="outline" className="border-[#EE3726]/40 text-[#EE3726] hover:bg-[#EE3726]/10 text-xs h-8 gap-1.5 rounded-lg bg-card">
              <Sparkles size={13} className="text-[#EE3726]" />
              <span>{t.openAI}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Customize Cards Drawer (if toggled) */}
      {showCustomizeModal && (
        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[#EE3726]" />
              {language === 'en' ? 'Customize ClickUp Home Widgets' : 'Atur Tampilan Widget Dashboard ClickUp'}
            </span>
            <button onClick={() => setShowCustomizeModal(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {Object.keys(visibleWidgets).map((key) => {
              const k = key as keyof typeof visibleWidgets;
              const isVis = visibleWidgets[k];
              return (
                <button
                  key={k}
                  onClick={() => toggleWidget(k)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition flex items-center gap-1.5 ${
                    isVis ? 'bg-[#EE3726]/15 border-[#EE3726]/40 text-[#EE3726]' : 'bg-secondary border-border text-muted-foreground opacity-60'
                  }`}
                >
                  {isVis && <Check size={12} />}
                  <span>{k}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CLICKUP HOME WIDGET 1: LINEUP (ICONIC CLICKUP FEATURE) */}
      {visibleWidgets.lineup && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                <Pin size={14} className="rotate-45" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  {t.lineupTitle}
                  <span className="bg-[#EE3726]/10 text-[#EE3726] text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                    {lineupTasks.length}
                  </span>
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {t.lineupDesc}
                </CardDescription>
              </div>
            </div>

            {/* Add to Lineup Button & Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddLineupDropdown(!showAddLineupDropdown)}
                className="h-7 px-2.5 text-xs gap-1 border-border hover:border-[#EE3726] hover:text-[#EE3726] rounded-lg"
              >
                <Plus size={12} />
                <span>{t.addToLineup}</span>
              </Button>

              {showAddLineupDropdown && (
                <div className="absolute right-0 top-8 w-72 bg-card border border-border shadow-xl rounded-xl p-2 z-30 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                    Pilih Task untuk Lineup
                  </div>
                  {availableForLineup.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 italic text-center">
                      Semua tugas aktif sudah di Lineup.
                    </div>
                  ) : (
                    availableForLineup.slice(0, 5).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          addToLineup(t.id);
                          setShowAddLineupDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-accent text-xs font-medium text-foreground flex items-center justify-between transition"
                      >
                        <span className="truncate">{t.title}</span>
                        {getPriorityFlag(t.priority)}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {lineupTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic bg-secondary/30 rounded-xl border border-dashed border-border">
                {t.emptyLineup}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lineupTasks.map((task) => {
                  const space = spaces.find((s) => s.id === task.spaceId);
                  const isDone = task.status === "done";

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border border-border bg-secondary/40 hover:border-[#EE3726]/50 transition flex flex-col justify-between gap-3 shadow-sm group ${
                        isDone ? 'opacity-60 bg-secondary/20' : ''
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-left min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task)}
                              className="shrink-0"
                            >
                              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${
                                isDone ? 'bg-[#EE3726] border-[#EE3726] text-white' : 'border-border hover:border-[#EE3726]'
                              }`}>
                                {isDone && <Check size={11} />}
                              </div>
                            </button>
                            <Link
                              href={`/tasks/${task.id}`}
                              className={`text-xs font-bold line-clamp-2 hover:text-[#EE3726] transition ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                            >
                              {task.title}
                            </Link>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromLineup(task.id)}
                            className="text-muted-foreground hover:text-[#EE3726] p-1 opacity-60 group-hover:opacity-100 transition"
                            title={t.removeFromLineup}
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                          {getPriorityFlag(task.priority)}
                          {space && (
                            <span className="bg-card px-1.5 py-0.5 rounded border border-border truncate max-w-[110px]">
                              {space.name}
                            </span>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <span className="bg-card px-1.5 py-0.5 rounded border border-border flex items-center gap-1 text-[#EE3726] shrink-0 font-semibold" title={`${task.comments.length} komentar`}>
                              <MessageSquare size={10} />
                              <span>{task.comments.length}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-border pt-2 text-xs">
                        <span className="text-[11px] text-muted-foreground">{task.dueDate || t.todayLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* METRICS ROW CLICKUP STYLE */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks">
          <Card className="bg-card border-border hover:border-[#EE3726]/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.totalTasks}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center group-hover:bg-[#EE3726] group-hover:text-white transition">
                <CheckCircle2 size={15} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-foreground">{totalTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.totalTasksSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-card border-border hover:border-[#EE3726]/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.inProgress}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center group-hover:bg-[#EE3726] group-hover:text-white transition">
                <Clock size={15} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-[#EE3726]">{inProgressTasks.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.inProgressSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="bg-card border-border hover:border-[#EE3726]/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.completed}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle2 size={15} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedTasks.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.completedSub}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inbox">
          <Card className="bg-card border-border hover:border-[#EE3726]/50 transition cursor-pointer group shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 p-4">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.unreadInbox}</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center group-hover:bg-[#EE3726] group-hover:text-white transition">
                <MessageSquare size={15} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-[#EE3726]">{unreadNotifications.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.unreadInboxSub}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN (8 COLS): MY WORK + AGENDA */}
        <div className="lg:col-span-8 space-y-6">
          {/* WIDGET 2: MY WORK (CLICKUP SIGNATURE HOME COMPONENT) */}
          {visibleWidgets.myWork && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {t.myWorkTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      {language === 'en' ? 'Quick task triage and inline progress tracking' : 'Daftar kerja aktif dan pelacakan progres cepat'}
                    </CardDescription>
                  </div>
                </div>

                {/* Sub-tabs: To Do, Overdue, Next, Unscheduled */}
                <div className="flex bg-secondary p-0.5 rounded-lg border border-border text-xs">
                  <button
                    onClick={() => setActiveWorkTab("todo")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      activeWorkTab === "todo" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {t.tabToDo}
                  </button>
                  <button
                    onClick={() => setActiveWorkTab("overdue")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      activeWorkTab === "overdue" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {t.tabOverdue}
                  </button>
                  <button
                    onClick={() => setActiveWorkTab("next")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      activeWorkTab === "next" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {t.tabNext}
                  </button>
                  <button
                    onClick={() => setActiveWorkTab("unscheduled")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      activeWorkTab === "unscheduled" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {t.tabUnscheduled}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                {/* Inline Quick Add Task with ClickUp Expand Icon */}
                <form onSubmit={handleQuickAddTask} className="flex gap-2 pb-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={language === 'en' ? "+ Add task to My Work (press Enter)..." : "+ Tambah tugas ke My Work (tekan Enter)..."}
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      className="h-9 text-xs bg-secondary border-border focus-visible:ring-[#EE3726] rounded-lg pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCreateTaskInitialTitle(quickTaskTitle);
                        setCreateTaskOpen(true);
                      }}
                      title="Buka Modal ClickUp Lengkap"
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-[#EE3726] transition"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                  <Button type="submit" size="sm" className="h-9 px-4 bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-semibold rounded-lg">
                    {t.addButton}
                  </Button>
                </form>

                {myWorkTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground italic">
                    {language === 'en' ? 'No tasks found for this view.' : 'Tidak ada tugas pada filter ini.'}
                  </div>
                ) : (
                  myWorkTasks.slice(0, 6).map((task) => {
                    const isDone = task.status === "done";
                    const space = spaces.find((s) => s.id === task.spaceId);

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/40 transition gap-3 group ${
                          isDone ? 'opacity-60 bg-secondary/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition ${
                              isDone ? 'bg-[#EE3726] border-[#EE3726] text-white' : 'border-border hover:border-[#EE3726]'
                            }`}
                          >
                            {isDone && <Check size={11} />}
                          </button>

                          <div className="min-w-0">
                            <span className={`text-xs font-semibold block truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              {getPriorityFlag(task.priority)}
                              {space && (
                                <span className="bg-secondary px-1.5 py-0.2 rounded border border-border truncate max-w-[120px]">
                                  {space.name}
                                </span>
                              )}
                              <span>{task.dueDate || t.todayLabel}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="pt-2 text-right">
                  <Link href="/tasks" className="text-xs font-semibold text-[#EE3726] hover:underline inline-flex items-center gap-1">
                    <span>{t.viewAllTasks}</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WIDGET 3: TODAY'S AGENDA & TIME BLOCKING (CLICKUP CALENDAR CARD) */}
          {visibleWidgets.agenda && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {t.agendaTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      {t.agendaDesc}
                    </CardDescription>
                  </div>
                </div>

                <Link href="/planner">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-border text-[#EE3726] hover:bg-[#EE3726]/10">
                    Buka Planner
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="p-4 space-y-2.5">
                {scheduledTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground italic bg-secondary/30 rounded-xl">
                    {language === 'en' ? 'No tasks scheduled in calendar yet. Drag tasks in Planner to schedule.' : 'Belum ada jadwal hari ini. Buka Planner untuk time blocking.'}
                  </div>
                ) : (
                  scheduledTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#EE3726] bg-[#EE3726]/10 px-2 py-0.5 rounded border border-[#EE3726]/20 shrink-0">
                          {task.scheduledSlot}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{task.title}</p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} className="text-[#EE3726]" /> {task.timeEstimate || 60} menit sesi kerja
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const meetCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
                          window.open(`https://meet.google.com/${meetCode}`, "_blank");
                        }}
                        className="h-7 px-2.5 text-xs gap-1 border-border text-[#EE3726] hover:bg-[#EE3726]/10 shrink-0"
                      >
                        <Video size={12} className="text-[#EE3726]" />
                        <span>Meet</span>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN (4 COLS): NOTEPAD + CAPACITY + SPACES & RECENT ACTIVITY */}
        <div className="lg:col-span-4 space-y-6">
          {/* WIDGET 4: CLICKUP QUICK NOTEPAD / SCRATCHPAD */}
          {visibleWidgets.notepad && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <FileEdit size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {t.notepadTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      {t.notepadDesc}
                    </CardDescription>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <Check size={11} /> Auto-saved
                </span>
              </CardHeader>

              <CardContent className="p-4">
                <textarea
                  rows={5}
                  value={notesDraft}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder={t.notepadPlaceholder}
                  className="w-full rounded-xl bg-secondary border border-border p-3 text-xs text-foreground focus:outline-none focus:border-[#EE3726] font-mono leading-relaxed resize-none"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>{notesDraft.length} karakter</span>
                  <span>Persisted di LocalStorage</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WIDGET 5: TASK COMPLETION RATE */}
          {visibleWidgets.velocity && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {t.velocityTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground">
                      {t.velocityTarget}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-xl font-black text-foreground">
                    {completedTasks.length} <span className="text-xs text-muted-foreground font-normal">/ {totalTasks} {language === 'en' ? 'completed' : 'selesai'}</span>
                  </div>
                  <span className="text-xs font-bold text-[#EE3726]">{completionPercent}%</span>
                </div>

                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#EE3726] to-[#BA1E10] rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {language === 'en'
                    ? 'Overall task completion rate across active workspace.'
                    : 'Tingkat persentase penyelesaian seluruh tugas dalam workspace.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* WIDGET 6: SPACES SUMMARY */}
          {visibleWidgets.spaces && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <Briefcase size={14} />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {t.activeSpacesSummary}
                  </CardTitle>
                </div>
                <Link href="/spaces" className="text-xs text-[#EE3726] hover:underline font-semibold">
                  {t.viewSpaces}
                </Link>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                {spaces.map((sp) => {
                  const spTasks = tasks.filter((t) => t.spaceId === sp.id);
                  return (
                    <div key={sp.id} className="p-2.5 rounded-lg border border-border bg-secondary/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#EE3726]" />
                        <span className="text-xs font-semibold text-foreground">{sp.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {spTasks.length} {language === 'en' ? 'tasks' : 'tugas'}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* WIDGET 7: RECENT ACTIVITY FEED */}
          {visibleWidgets.activity && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <Users size={14} />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {t.activityFeed}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {notifications.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                    <div className="h-6 w-6 rounded-full bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {item.sender[0]}
                    </div>
                    <div>
                      <p className="text-[11px] leading-tight text-foreground">
                        <strong className="font-bold">{item.sender}</strong> {item.action} <span className="text-[#EE3726] font-medium">"{item.target}"</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Global ClickUp CreateTaskModal for Dashboard */}
      <CreateTaskModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        initialTitle={createTaskInitialTitle}
      />
    </div>
  );
}
