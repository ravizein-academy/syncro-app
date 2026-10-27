"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Check,
  Activity,
  Sparkles,
  Zap,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  CircleDot,
} from "lucide-react";
import { TaskItem } from "@/components/tasks/TaskCard";

export interface ActivityLogItem {
  id: string;
  user: string;
  avatarSeed: string;
  action: string;
  targetTitle: string;
  targetId: string;
  timestamp: string;
  type: "status" | "assign" | "priority" | "create" | "resolve";
}

const DEFAULT_ACTIVITIES: ActivityLogItem[] = [
  {
    id: "act-1",
    user: "Ravi Zein",
    avatarSeed: "Ravi",
    action: "mengubah status menjadi In Progress pada",
    targetTitle: "Implement Cloudflare Pages Edge Deployment",
    targetId: "task-101",
    timestamp: "10 menit lalu",
    type: "status",
  },
  {
    id: "act-2",
    user: "Sarah Chen",
    avatarSeed: "Sarah",
    action: "menyelesaikan tiket operasional",
    targetTitle: "Google Drive OAuth 2.0 Edge Upload REST",
    targetId: "task-102",
    timestamp: "35 menit lalu",
    type: "resolve",
  },
  {
    id: "act-3",
    user: "Sistem ITSEC",
    avatarSeed: "ITSEC",
    action: "menerima tiket masuk baru di antrean Triage",
    targetTitle: "Vulnerability Report: Potential SSRF in Webhook Ingestion",
    targetId: "task-107",
    timestamp: "1 jam lalu",
    type: "create",
  },
  {
    id: "act-4",
    user: "Budi Santoso",
    avatarSeed: "Budi",
    action: "menugaskan penanggung jawab pada",
    targetTitle: "Audit Neon PostgreSQL Connection Pool",
    targetId: "task-106",
    timestamp: "2 jam lalu",
    type: "assign",
  },
];

const AVAILABLE_PICS = [
  { id: "user-1", name: "Ravi Zein", email: "ravizein@itsecacademy.com" },
  { id: "user-2", name: "Sarah Chen", email: "sarah@itsecacademy.com" },
  { id: "user-3", name: "Budi Santoso", email: "budi@itsecacademy.com" },
];

interface TicketingDashboardViewProps {
  tasks: TaskItem[];
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onUpdatePriority?: (taskId: string, newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => void;
  onUpdateAssignee?: (
    taskId: string,
    assignee: { id: string; name: string; email: string } | null
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskDetail: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  currentUserName?: string;
  currentUserEmail?: string;
}

export function TicketingDashboardView({
  tasks,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateAssignee,
  onDeleteTask,
  onOpenTaskDetail,
  onOpenCreateTask,
  currentUserName = "Ravi Zein",
  currentUserEmail = "ravizein@itsecacademy.com",
}: TicketingDashboardViewProps) {
  // Tab state: "ALL_ACTIVE" | "MY_TICKETS" | "HIGH_PRIORITY" | "OVERDUE" | "DONE" | "ALL"
  const [activeTab, setActiveTab] = useState<string>("ALL_ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(DEFAULT_ACTIVITIES);

  // Dropdown Filter Menu State
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper: check if a task is overdue
  const isOverdue = (task: TaskItem) => {
    if (task.status === "DONE" || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  // 1. Calculate Global Operational Metrics
  const unassignedTasks = useMemo(
    () => tasks.filter((t) => !t.assignee || !t.assignee.name),
    [tasks]
  );
  const highPriorityTasks = useMemo(
    () =>
      tasks.filter(
        (t) => (t.priority === "HIGH" || t.priority === "URGENT") && t.status !== "DONE"
      ),
    [tasks]
  );
  const openActiveTasks = useMemo(
    () => tasks.filter((t) => t.status !== "DONE"),
    [tasks]
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t)),
    [tasks]
  );
  const myTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.assignee?.email === currentUserEmail ||
          t.assignee?.name?.toLowerCase().includes("ravi")
      ),
    [tasks, currentUserEmail]
  );
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === "DONE"),
    [tasks]
  );

  // Helper to add activity log
  const pushActivity = (
    action: string,
    targetTitle: string,
    targetId: string,
    type: ActivityLogItem["type"]
  ) => {
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      user: currentUserName,
      avatarSeed: currentUserName,
      action,
      targetTitle,
      targetId,
      timestamp: "Baru saja",
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 15)]);
  };

  // Inline Handlers
  const handleInlineStatus = async (task: TaskItem, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    if (task.status === newStatus) return;
    onUpdateStatus(task.id, newStatus);
    pushActivity(
      `memperbarui status menjadi ${newStatus === "DONE" ? "Completed" : newStatus === "IN_PROGRESS" ? "In Progress" : "To Do"} pada`,
      task.title,
      task.id,
      newStatus === "DONE" ? "resolve" : "status"
    );
    if (newStatus === "DONE") {
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#ee3726", "#10b981", "#0ea5e9"],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleInlinePriority = (task: TaskItem, newPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
    if (task.priority === newPriority) return;
    if (onUpdatePriority) {
      onUpdatePriority(task.id, newPriority);
    }
    pushActivity(`mengubah prioritas menjadi ${newPriority} pada`, task.title, task.id, "priority");
  };

  const handleInlineAssignee = (
    task: TaskItem,
    assignee: { id: string; name: string; email: string } | null
  ) => {
    if (onUpdateAssignee) {
      onUpdateAssignee(task.id, assignee);
    }
    pushActivity(
      assignee ? `menugaskan ${assignee.name} pada` : "melepas penugasan PIC pada",
      task.title,
      task.id,
      "assign"
    );
  };

  const handleAssignToMe = (task: TaskItem) => {
    const me = AVAILABLE_PICS.find((p) => p.email === currentUserEmail) || {
      id: "user-1",
      name: currentUserName,
      email: currentUserEmail,
    };
    handleInlineAssignee(task, me);
  };

  // 2. Filter Table based on active tab and search query
  const filteredTableTasks = useMemo(() => {
    let result = tasks;

    switch (activeTab) {
      case "ALL_ACTIVE":
        result = openActiveTasks;
        break;
      case "MY_TICKETS":
        result = myTasks;
        break;
      case "HIGH_PRIORITY":
        result = highPriorityTasks;
        break;
      case "OVERDUE":
        result = overdueTasks;
        break;
      case "DONE":
        result = doneTasks;
        break;
      case "TRIAGE":
        result = unassignedTasks;
        break;
      case "ALL":
      default:
        result = tasks;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.project && t.project.name.toLowerCase().includes(q)) ||
          (t.assignee && t.assignee.name?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [
    tasks,
    activeTab,
    searchQuery,
    openActiveTasks,
    myTasks,
    highPriorityTasks,
    overdueTasks,
    doneTasks,
    unassignedTasks,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#f8fafc] dark:bg-[#1c1c1c] font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Control Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#333333]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Pusat Kendali Operasional Tiket
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau status tiket operasional, kelola antrean triage, lakukan penugasan langsung, dan pantau activity stream secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenCreateTask}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-itsec-darkRed hover:from-brand-500 hover:to-brand-600 text-white shadow-md shadow-brand-500/25 active:scale-95 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buat Tiket Baru</span>
            </button>
          </div>
        </div>

        {/* 1. Global Operational Metrics Cards (Bagian Atas: 2 kolom di mobile, 4 kolom di desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Unassigned / Triage Card */}
          <div
            onClick={() => setActiveTab("TRIAGE")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
              activeTab === "TRIAGE"
                ? "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500"
                : "bg-white dark:bg-[#252525] border-slate-200 dark:border-[#353535] hover:border-amber-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Triage</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                Action
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {unassignedTasks.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate ml-1">
                Menunggu PIC
              </span>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Buka antrean &rarr;</span>
            </div>
          </div>

          {/* High Priority & Urgent Card */}
          <div
            onClick={() => setActiveTab("HIGH_PRIORITY")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
              activeTab === "HIGH_PRIORITY"
                ? "ring-2 ring-rose-500 bg-rose-500/10 border-rose-500"
                : "bg-white dark:bg-[#252525] border-slate-200 dark:border-[#353535] hover:border-rose-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">High / Urgent</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 shrink-0">
                Kritis
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {highPriorityTasks.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate ml-1">
                Prioritas tinggi
              </span>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Lihat tiket &rarr;</span>
            </div>
          </div>

          {/* Open & Active Card */}
          <div
            onClick={() => setActiveTab("ALL_ACTIVE")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
              activeTab === "ALL_ACTIVE"
                ? "ring-2 ring-sky-500 bg-sky-500/10 border-sky-500"
                : "bg-white dark:bg-[#252525] border-slate-200 dark:border-[#353535] hover:border-sky-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Open Active</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 shrink-0">
                Pipeline
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {openActiveTasks.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate ml-1">
                Dalam proses
              </span>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-[10px] sm:text-[11px] text-sky-600 dark:text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Semua aktif &rarr;</span>
            </div>
          </div>

          {/* Overdue Card */}
          <div
            onClick={() => setActiveTab("OVERDUE")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
              activeTab === "OVERDUE"
                ? "ring-2 ring-red-600 bg-red-600/10 border-red-600"
                : "bg-white dark:bg-[#252525] border-slate-200 dark:border-[#353535] hover:border-red-500 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Overdue</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 animate-pulse shrink-0">
                Eskalasi
              </span>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {overdueTasks.length}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate ml-1">
                Lewat tenggat
              </span>
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#303030] flex items-center justify-between text-[10px] sm:text-[11px] text-red-600 dark:text-red-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Selesaikan &rarr;</span>
            </div>
          </div>
        </div>

        {/* 2. Antrean Khusus Triage (Incoming Unassigned Tickets Queue) */}
        {unassignedTasks.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-500/30 dark:border-amber-500/40 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Antrean Triage Tiket Masuk</span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      {unassignedTasks.length} Belum Ditugaskan
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tiket baru membutuhkan penugasan penanggung jawab (PIC). Ambil langsung atau tugaskan ke analis operasional.
                  </p>
                </div>
              </div>
            </div>

            {/* Triage Tickets Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#252525] border border-amber-300 dark:border-amber-500/30 shadow-xs flex flex-col justify-between gap-3 hover:border-amber-500 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                        {t.id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          t.priority === "URGENT"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                            : t.priority === "HIGH"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <h4
                      onClick={() => onOpenTaskDetail(t)}
                      className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
                      title={t.title}
                    >
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#333333] flex items-center justify-between gap-2">
                    {/* Quick 1-Click Action: Assign to Me */}
                    <button
                      onClick={() => handleAssignToMe(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition active:scale-95 cursor-pointer"
                      title="Ambil tiket ini untuk saya"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ambil Tiket</span>
                    </button>

                    {/* Quick Assign Dropdown */}
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const pic = AVAILABLE_PICS.find((p) => p.id === e.target.value);
                          if (pic) handleInlineAssignee(t, pic);
                        }}
                        defaultValue=""
                        className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#303030] border border-slate-200 dark:border-[#404040] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <option value="" disabled>
                          Tugaskan ke...
                        </option>
                        {AVAILABLE_PICS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Left 2 Cols (Tabbed Table) + Right 1 Col (Global Activity Stream) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column (2 Cols wide on desktop): Tabs & Interactive Table */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* 3. Antarmuka Berbasis Dropdown Menu & Search Bar (Responsive di Semua Layar) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
              
              {/* Dropdown Menu Trigger & Popover */}
              <div className="relative z-30" ref={filterDropdownRef}>
                {(() => {
                  const tabOptions = [
                    {
                      id: "ALL_ACTIVE",
                      label: "Semua Tiket Aktif",
                      count: openActiveTasks.length,
                      icon: Layers,
                      badgeColor: "bg-slate-100 text-slate-700",
                      iconColor: "text-slate-600",
                    },
                    {
                      id: "MY_TICKETS",
                      label: "Assigned to Me",
                      count: myTasks.length,
                      icon: UserCheck,
                      badgeColor: "bg-brand-50 text-brand-600",
                      iconColor: "text-brand-600",
                    },
                    {
                      id: "HIGH_PRIORITY",
                      label: "Prioritas Tinggi",
                      count: highPriorityTasks.length,
                      icon: Flame,
                      badgeColor: "bg-rose-50 text-rose-600",
                      iconColor: "text-rose-500",
                    },
                    {
                      id: "OVERDUE",
                      label: "Overdue",
                      count: overdueTasks.length,
                      icon: AlertTriangle,
                      badgeColor: "bg-red-50 text-red-600",
                      iconColor: "text-red-500",
                    },
                    {
                      id: "DONE",
                      label: "Selesai",
                      count: doneTasks.length,
                      icon: CheckCircle2,
                      badgeColor: "bg-emerald-50 text-emerald-600",
                      iconColor: "text-emerald-500",
                    },
                  ];

                  const currentActive =
                    tabOptions.find((opt) => opt.id === activeTab) || tabOptions[0];
                  const ActiveIcon = currentActive.icon;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                        className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer select-none"
                        title="Pilih filter tiket"
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="text-slate-400 font-normal">Menu:</span>
                          <ActiveIcon className={`w-3.5 h-3.5 ${currentActive.iconColor} shrink-0`} />
                          <span className="text-slate-900 font-bold">{currentActive.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentActive.badgeColor}`}>
                            {currentActive.count}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                              isFilterDropdownOpen ? "rotate-180 text-brand-600" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Dropdown Menu Popover */}
                      {isFilterDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-full sm:w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 animate-scale-up">
                          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            PILIH KATEGORI TIKET
                          </div>
                          <div className="space-y-1">
                            {tabOptions.map((opt) => {
                              const Icon = opt.icon;
                              const isSelected = activeTab === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab(opt.id);
                                    setIsFilterDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                                    isSelected
                                      ? "bg-slate-900 text-white shadow-xs"
                                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : opt.iconColor}`} />
                                    <span>{opt.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : opt.badgeColor
                                      }`}
                                    >
                                      {opt.count}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Quick Search in Tab bar - Responsive & Non-overlapping */}
              <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tiket di tab ini..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* 4. Interactive Table with Inline Editing & Quick Actions */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#252525] overflow-hidden shadow-xs">
              {/* Desktop Table View (hidden on mobile, visible on md+) - No horizontal scrollbar on desktop */}
              <div className="hidden md:block overflow-x-hidden no-scrollbar w-full">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[17%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#333333] bg-slate-50/80 dark:bg-[#202020] text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tiket & Space</th>
                      <th className="py-2.5 px-1.5">Status</th>
                      <th className="py-2.5 px-1.5">Prioritas</th>
                      <th className="py-2.5 px-1.5">PIC</th>
                      <th className="py-2.5 px-1.5">Tenggat</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#303030]">
                    {filteredTableTasks.map((task) => {
                      const taskIsOverdue = isOverdue(task);
                      const isAssignedToMe =
                        task.assignee?.email === currentUserEmail ||
                        task.assignee?.name === currentUserName;

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#2a2a2a] transition-colors group"
                        >
                          {/* 1. Tiket Title & Space */}
                          <td className="py-2.5 px-3 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                {task.id.toUpperCase()}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: task.project?.color || "#ee3726" }}
                                />
                                <span className="truncate">{task.project?.name || "General"}</span>
                              </span>
                            </div>
                            <div
                              onClick={() => onOpenTaskDetail(task)}
                              className="font-bold text-xs text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer truncate leading-snug"
                              title={task.title}
                            >
                              {task.title}
                            </div>
                          </td>

                          {/* 2. Status with Inline Dropdown */}
                          <td className="py-2.5 px-1.5 min-w-0">
                            <div className="relative w-full">
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleInlineStatus(
                                    task,
                                    e.target.value as "TODO" | "IN_PROGRESS" | "DONE"
                                  )
                                }
                                className={`w-full appearance-none pl-5 pr-4 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer truncate ${
                                  task.status === "DONE"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                                    : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
                                }`}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Completed</option>
                              </select>

                              {/* Status dot icon */}
                              <span className="absolute left-1.5 top-2 pointer-events-none">
                                {task.status === "DONE" && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                )}
                                {task.status === "IN_PROGRESS" && (
                                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                )}
                                {task.status === "TODO" && (
                                  <CircleDot className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                )}
                              </span>
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                            </div>
                          </td>

                          {/* 3. Prioritas with Inline Dropdown */}
                          <td className="py-2.5 px-1.5 min-w-0">
                            <div className="relative w-full">
                              <select
                                value={task.priority}
                                onChange={(e) =>
                                  handleInlinePriority(
                                    task,
                                    e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                                  )
                                }
                                className={`w-full appearance-none pl-5 pr-4 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer truncate ${
                                  task.priority === "URGENT"
                                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                                    : task.priority === "HIGH"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                                    : task.priority === "MEDIUM"
                                    ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
                                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                              >
                                <option value="URGENT">Urgent</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                              </select>
                              <Flame
                                className={`w-3 h-3 absolute left-1.5 top-2 pointer-events-none ${
                                  task.priority === "URGENT"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : task.priority === "HIGH"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-400"
                                }`}
                              />
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                            </div>
                          </td>

                          {/* 4. Penanggung Jawab with Inline Dropdown */}
                          <td className="py-2.5 px-1.5 min-w-0">
                            <div className="relative w-full">
                              <select
                                value={task.assignee?.id || "UNASSIGNED"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "UNASSIGNED") {
                                    handleInlineAssignee(task, null);
                                  } else {
                                    const pic = AVAILABLE_PICS.find((p) => p.id === val);
                                    if (pic) handleInlineAssignee(task, pic);
                                  }
                                }}
                                className={`w-full appearance-none pl-5 pr-4 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer truncate ${
                                  !task.assignee
                                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 font-bold"
                                    : "bg-slate-50 text-slate-800 border-slate-200 dark:bg-[#303030] dark:text-slate-200 dark:border-[#404040]"
                                }`}
                                title={task.assignee?.name || "Belum Ditugaskan"}
                              >
                                <option value="UNASSIGNED">Belum Ada</option>
                                {AVAILABLE_PICS.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <User className="w-3 h-3 text-slate-400 absolute left-1.5 top-2 pointer-events-none" />
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1 top-2 pointer-events-none" />
                            </div>
                          </td>

                          {/* 5. Tenggat Waktu with Overdue Warning */}
                          <td className="py-2.5 px-1.5 min-w-0">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-600 dark:text-slate-400 truncate">
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : "-"}
                              </span>
                              {taskIsOverdue && (
                                <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 animate-pulse shrink-0" title="Overdue">
                                  !
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Aksi Cepat (Quick Actions) */}
                          <td className="py-2.5 px-3 min-w-0 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {/* Quick Assign To Me if unassigned */}
                              {!isAssignedToMe && (
                                <button
                                  onClick={() => handleAssignToMe(task)}
                                  className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition cursor-pointer"
                                  title="Tugaskan ke Saya"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Quick Complete */}
                              {task.status !== "DONE" && (
                                <button
                                  onClick={() => handleInlineStatus(task, "DONE")}
                                  className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition cursor-pointer"
                                  title="Tandai Selesai"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Detail Modal */}
                              <button
                                onClick={() => onOpenTaskDetail(task)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#333333] transition cursor-pointer"
                                title="Buka Detail Laporan"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                                title="Hapus Tiket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTableTasks.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 px-4 text-center text-slate-400 dark:text-slate-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Tidak ada tiket pada kategori ini.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Semua alur kerja operasional dalam kategori ini berjalan lancar.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Ticket Cards View (visible on screens < md) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#303030]">
                {filteredTableTasks.map((task) => {
                  const taskIsOverdue = isOverdue(task);
                  const isAssignedToMe =
                    task.assignee?.email === currentUserEmail ||
                    task.assignee?.name === currentUserName;

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 space-y-2.5 hover:bg-slate-50/60 dark:hover:bg-[#2a2a2a]/60 transition"
                    >
                      {/* Top Header: ID, Space, Due Date & Overdue */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {task.id.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: task.project?.color || "#ee3726" }}
                            />
                            <span className="truncate">{task.project?.name || "General"}</span>
                          </span>
                        </div>

                        {/* Due Date & Overdue Badge */}
                        <div className="flex items-center gap-1 text-[11px] shrink-0">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "-"}
                          </span>
                          {taskIsOverdue && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 animate-pulse">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ticket Title */}
                      <h4
                        onClick={() => onOpenTaskDetail(task)}
                        className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
                        title={task.title}
                      >
                        {task.title}
                      </h4>

                      {/* Inline Selectors: Status & Priority in 2 Columns */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        {/* Inline Status Dropdown */}
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleInlineStatus(
                                task,
                                e.target.value as "TODO" | "IN_PROGRESS" | "DONE"
                              )
                            }
                            className={`w-full appearance-none pl-6 pr-6 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              task.status === "DONE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                                : task.status === "IN_PROGRESS"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                                : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
                            }`}
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Completed</option>
                          </select>
                          <span className="absolute left-2 top-2.5 pointer-events-none">
                            {task.status === "DONE" && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            )}
                            {task.status === "TODO" && (
                              <CircleDot className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            )}
                          </span>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                        </div>

                        {/* Inline Priority Dropdown */}
                        <div className="relative">
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              handleInlinePriority(
                                task,
                                e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                              )
                            }
                            className={`w-full appearance-none pl-6 pr-6 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              task.priority === "URGENT"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                                : task.priority === "HIGH"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                                : task.priority === "MEDIUM"
                                ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            }`}
                          >
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                          </select>
                          <Flame
                            className={`w-3 h-3 absolute left-2 top-2.5 pointer-events-none ${
                              task.priority === "URGENT"
                                ? "text-rose-600 dark:text-rose-400"
                                : task.priority === "HIGH"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-400"
                            }`}
                          />
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                        </div>

                        {/* Inline PIC Dropdown (Span 2) */}
                        <div className="col-span-2 relative">
                          <select
                            value={task.assignee?.id || "UNASSIGNED"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "UNASSIGNED") {
                                handleInlineAssignee(task, null);
                              } else {
                                const pic = AVAILABLE_PICS.find((p) => p.id === val);
                                if (pic) handleInlineAssignee(task, pic);
                              }
                            }}
                            className={`w-full appearance-none pl-6 pr-6 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                              !task.assignee
                                ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 font-bold"
                                : "bg-slate-50 text-slate-800 border-slate-200 dark:bg-[#303030] dark:text-slate-200 dark:border-[#404040]"
                            }`}
                          >
                            <option value="UNASSIGNED">-- Belum Ditugaskan --</option>
                            {AVAILABLE_PICS.map((p) => (
                              <option key={p.id} value={p.id}>
                                PIC: {p.name}
                              </option>
                            ))}
                          </select>
                          <User className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Quick Actions Footer */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-[#303030]">
                        <div className="flex items-center gap-1.5">
                          {!isAssignedToMe && (
                            <button
                              onClick={() => handleAssignToMe(task)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition active:scale-95 cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Ambil</span>
                            </button>
                          )}
                          {task.status !== "DONE" && (
                            <button
                              onClick={() => handleInlineStatus(task, "DONE")}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition active:scale-95 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Selesai</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenTaskDetail(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#303030] transition cursor-pointer"
                            title="Buka Detail"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Hapus Tiket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTableTasks.length === 0 && (
                  <div className="py-10 px-4 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500/60 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tidak ada tiket pada kategori ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (1 Col wide on desktop): Global Activity Stream & Team Workload */}
          <div className="space-y-4">
            
            {/* 5. Global Activity Stream (Live Audit Log) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#353535] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Global Activity Stream
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Audit riwayat pembaruan operasional real-time
                    </p>
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Feed List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2c2c2c] transition"
                  >
                    {/* User Initials Avatar */}
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                      {log.user.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <p className="text-slate-700 dark:text-slate-300 leading-snug">
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {log.user}
                        </strong>{" "}
                        {log.action}{" "}
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {log.targetTitle}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>{log.timestamp}</span>
                        <span>&bull;</span>
                        <span className="uppercase">{log.targetId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team PIC Workload Widget */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#353535] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#333333]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Beban Kerja PIC
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Distribusi tiket aktif per analis
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {AVAILABLE_PICS.map((pic) => {
                  const picTasksCount = openActiveTasks.filter(
                    (t) => t.assignee?.id === pic.id || t.assignee?.name === pic.name
                  ).length;
                  const ratio =
                    openActiveTasks.length > 0
                      ? Math.round((picTasksCount / openActiveTasks.length) * 100)
                      : 0;

                  return (
                    <div key={pic.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{pic.name}</span>
                          {pic.name === currentUserName && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-brand-50 text-brand-600 font-bold dark:bg-brand-500/20 dark:text-brand-300">
                              Saya
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                          {picTasksCount} Tiket ({ratio}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-300"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned row */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      <span>Belum Ditugaskan (Triage)</span>
                    </span>
                    <span className="font-mono font-bold">
                      {unassignedTasks.length} Tiket
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          openActiveTasks.length > 0
                            ? Math.round((unassignedTasks.length / openActiveTasks.length) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
