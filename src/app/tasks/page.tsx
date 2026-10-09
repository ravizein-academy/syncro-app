"use client";

import { useState } from "react";
import { useStore, Task } from "@/store/useStore";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Play, 
  Calendar, 
  Tag, 
  Plus, 
  Filter, 
  Check, 
  Flame,
  LayoutList,
  Kanban,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
  const { 
    tasks, 
    updateTask, 
    startTimer, 
    activeTimerTaskId, 
    isTimerRunning, 
    spaces,
    users,
    addTask 
  } = useStore();

  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [activeTab, setActiveTab] = useState<"assigned" | "today" | "personal" | "all">("assigned");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [meModeOnly, setMeModeOnly] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (status: string) => {
    setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (meModeOnly && task.assigneeId !== "u1" && !task.isPersonal) return false;

    if (activeTab === "personal") return task.isPersonal;
    if (activeTab === "assigned") return !task.isPersonal;
    if (activeTab === "today") {
      const today = new Date().toISOString().split("T")[0];
      return task.dueDate === today || (task.dueDate && task.dueDate < today && task.status !== "done");
    }
    return true;
  });

  const handleToggleStatus = (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTask(task.id, { status: nextStatus });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle,
      status: "todo",
      priority: "high",
      timeEstimate: 60,
      isPersonal: activeTab === "personal",
    });
    setNewTaskTitle("");
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Flame size={11} className="text-rose-500 fill-rose-500" />
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Flag size={10} className="text-red-400 fill-red-400" />
            High
          </span>
        );
      case "low":
        return (
          <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-700/60 flex items-center gap-1">
            <Flag size={10} className="text-slate-500" />
            Low
          </span>
        );
      default:
        return (
          <span className="bg-slate-800/80 text-slate-300 border border-slate-700/80 text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Flag size={10} className="text-rose-400" />
            Normal
          </span>
        );
    }
  };

  const STATUS_GROUPS = [
    { id: "todo", label: "TO DO", color: "bg-slate-700 text-slate-200 border-slate-600" },
    { id: "in-progress", label: "IN PROGRESS", color: "bg-rose-700 text-white border-rose-600 shadow-sm shadow-rose-950/60" },
    { id: "review", label: "IN REVIEW", color: "bg-amber-700 text-white border-amber-600" },
    { id: "done", label: "COMPLETE", color: "bg-emerald-700 text-white border-emerald-600" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* ClickUp Header Breadcrumb & Views Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400">
                Workspace / Tasks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Task Manager
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Antarmuka ClickUp Red: List & Kanban Board dengan live time tracking, status grouping, dan Me Mode.
            </p>
          </div>

          {/* Quick Filters Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-[#12131b] border border-[#222533] p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "assigned"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Assigned
              </button>
              <button
                onClick={() => setActiveTab("today")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "today"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "personal"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "all"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Semua
              </button>
            </div>

            {/* ClickUp Me Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMeModeOnly(!meModeOnly)}
              className={`h-9 px-3 text-xs gap-1.5 rounded-xl border-[#222533] transition ${
                meModeOnly 
                  ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50" 
                  : "bg-[#12131b] text-slate-300 hover:text-white"
              }`}
            >
              <UserIcon size={13} />
              <span>Me Mode</span>
            </Button>
          </div>
        </div>

        {/* ClickUp Views Switcher Toolbar (List vs Board) */}
        <div className="flex items-center justify-between border-b border-[#202230] pb-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <LayoutList size={14} className={viewMode === "list" ? "text-rose-400" : ""} />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "board"
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Kanban size={14} className={viewMode === "board" ? "text-rose-400" : ""} />
              <span>Board View</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-slate-500" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[#12131b] border border-[#222533] text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="all">Semua Prioritas</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder={`+ Tambah tugas cepat ke ${activeTab === "personal" ? "Personal List" : "ClickUp Backlog"} (tekan Enter)...`}
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="bg-[#12131b] border-[#222533] text-xs h-11 text-slate-200 placeholder:text-slate-500 focus-visible:ring-rose-500 rounded-xl"
        />
        <Button 
          type="submit" 
          className="bg-rose-600 hover:bg-rose-500 h-11 px-5 font-semibold text-xs shadow-md shadow-rose-900/40 rounded-xl text-white"
        >
          <Plus size={15} className="mr-1.5" />
          Tambah
        </Button>
      </form>

      {/* VIEW MODE 1: CLICKUP LIST VIEW GROUPED BY STATUS */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {STATUS_GROUPS.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.status === group.id);
            const isCollapsed = collapsedSections[group.id];

            return (
              <div key={group.id} className="space-y-2">
                {/* Status Group Header */}
                <div 
                  onClick={() => toggleSection(group.id)}
                  className="flex items-center justify-between py-1.5 px-2 cursor-pointer hover:bg-white/[0.02] rounded-lg transition"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {groupTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks Table Column Header */}
                {!isCollapsed && groupTasks.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#1c1e2b]">
                    <div className="col-span-6">Nama Task</div>
                    <div className="col-span-2">Assignee & Space</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-2 text-right">Time Tracked</div>
                  </div>
                )}

                {/* Task Items */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {groupTasks.length === 0 ? (
                      <div className="text-xs text-slate-600 italic py-2 px-6">
                        Belum ada task dengan status {group.label.toLowerCase()}.
                      </div>
                    ) : (
                      groupTasks.map((task) => {
                        const isDone = task.status === "done";
                        const space = spaces.find((s) => s.id === task.spaceId);
                        const isTimerActiveForThis = activeTimerTaskId === task.id && isTimerRunning;
                        const assignee = users.find((u) => u.id === task.assigneeId);
                        const progressPercent = task.timeEstimate 
                          ? Math.min(100, Math.round(((task.timeTracked || 0) / task.timeEstimate) * 100)) 
                          : 0;

                        return (
                          <div
                            key={task.id}
                            className={`group flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center p-3.5 rounded-xl border border-[#1f2231] bg-[#12131b] hover:border-rose-500/50 hover:bg-[#151722] transition shadow-sm ${
                              isDone ? "opacity-60 bg-[#0e0f15]" : ""
                            }`}
                          >
                            {/* Col 1-6: Checkbox + Title + Badges */}
                            <div className="col-span-6 flex items-start md:items-center gap-3 w-full min-w-0">
                              <button
                                onClick={() => handleToggleStatus(task)}
                                className={`mt-0.5 md:mt-0 h-4.5 w-4.5 rounded border flex items-center justify-center transition shrink-0 ${
                                  isDone
                                    ? "bg-rose-600 border-rose-600 text-white"
                                    : "border-slate-700 hover:border-rose-500 text-transparent"
                                }`}
                              >
                                <Check size={12} className={isDone ? "opacity-100" : "opacity-0"} />
                              </button>

                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    isDone ? "line-through text-slate-500" : "text-slate-100"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {getPriorityBadge(task.priority)}
                                {task.isPersonal && (
                                  <span className="bg-rose-950/40 text-rose-300 border border-rose-900/40 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                    Personal
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Col 7-8: Assignee & Space */}
                            <div className="col-span-2 flex items-center gap-2">
                              {assignee ? (
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center text-[10px] font-bold text-white shadow ring-1 ring-rose-400/30">
                                  {assignee.avatar}
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                                  RZ
                                </div>
                              )}
                              {space && (
                                <span className="bg-[#181a24] text-slate-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-[#252837] truncate max-w-[120px]">
                                  <Tag size={9} className="text-rose-400" />
                                  {space.name}
                                </span>
                              )}
                            </div>

                            {/* Col 9-10: Due Date */}
                            <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-400">
                              <Calendar size={12} className="text-rose-400" />
                              <span className="text-[11px]">{task.dueDate || "Hari ini"}</span>
                            </div>

                            {/* Col 11-12: Time Tracking & Play */}
                            <div className="col-span-2 flex items-center justify-between md:justify-end gap-3 w-full">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-[11px] font-mono justify-end">
                                  <span className="text-rose-300 font-semibold">{task.timeTracked || 0}m</span>
                                  <span className="text-slate-500">/ {task.timeEstimate || 60}m</span>
                                </div>
                                <div className="w-20 bg-[#1e202d] h-1 rounded-full overflow-hidden mt-0.5 ml-auto">
                                  <div
                                    className="h-full bg-rose-600 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startTimer(task.id)}
                                className={`h-7 px-2 text-[11px] gap-1 border-[#2a2d3e] rounded-lg ${
                                  isTimerActiveForThis
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                    : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                                }`}
                              >
                                <Play size={10} className={isTimerActiveForThis ? "fill-rose-400" : ""} />
                                <span>{isTimerActiveForThis ? "Live" : "Track"}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CLICKUP KANBAN BOARD VIEW */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_GROUPS.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.status === group.id);

            return (
              <div
                key={group.id}
                className="bg-[#0f1017] border border-[#1f2231] rounded-2xl p-3.5 flex flex-col space-y-3 shadow-md"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between pb-2 border-b border-[#1c1e2b]">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{groupTasks.length}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      addTask({
                        title: `Tugas baru ${group.label}`,
                        status: group.id as any,
                        priority: "high",
                        timeEstimate: 60,
                      });
                    }}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                {/* Cards in Column */}
                <div className="space-y-2.5 min-h-[300px]">
                  {groupTasks.map((task) => {
                    const isTimerActiveForThis = activeTimerTaskId === task.id && isTimerRunning;
                    const space = spaces.find((s) => s.id === task.spaceId);

                    return (
                      <Card
                        key={task.id}
                        className="bg-[#141622] border-[#222536] hover:border-rose-500/50 transition cursor-pointer shadow-sm group"
                      >
                        <CardContent className="p-3.5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition">
                              {task.title}
                            </span>
                            {getPriorityBadge(task.priority)}
                          </div>

                          {space && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Tag size={10} className="text-rose-400" />
                              <span>{space.name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#1c1e2b] text-xs">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                              <Clock size={11} className="text-rose-400" />
                              <span className="text-rose-300 font-semibold">{task.timeTracked || 0}m</span>
                              <span>/ {task.timeEstimate || 60}m</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startTimer(task.id);
                              }}
                              className={`h-6 px-2 text-[10px] gap-1 border-[#2a2d3e] rounded-md ${
                                isTimerActiveForThis
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                  : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              <Play size={9} className={isTimerActiveForThis ? "fill-rose-400" : ""} />
                              <span>{isTimerActiveForThis ? "Live" : "Start"}</span>
                            </Button>
                          </div>

                          {/* Quick Status Shift Buttons */}
                          <div className="flex items-center justify-between gap-1 pt-1 text-[10px] text-slate-500">
                            <span>Pindah status:</span>
                            <div className="flex gap-1">
                              {STATUS_GROUPS.filter((g) => g.id !== group.id).map((other) => (
                                <button
                                  key={other.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTask(task.id, { status: other.id as any });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-[#1a1c29] hover:bg-rose-600 hover:text-white transition text-slate-400 text-[9px]"
                                >
                                  {other.label.split(" ")[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
