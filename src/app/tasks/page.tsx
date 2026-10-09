"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore, Task } from "@/store/useStore";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar as CalendarIcon, 
  Tag, 
  Plus, 
  Filter, 
  Check, 
  Flame,
  LayoutList,
  Kanban,
  Calendar,
  User as UserIcon, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Flag, 
  Maximize2, 
  ListTodo, 
  Search,
  Pin,
  Trash2,
  Eye,
  EyeOff,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

type GroupByType = "status" | "dueDate" | "priority" | "space";

export default function TasksPage() {
  const { 
    tasks, 
    updateTask, 
    deleteTask,
    spaces,
    users,
    addTask,
    lineupTaskIds,
    addToLineup,
    removeFromLineup,
    language 
  } = useStore();

  const t = translations[language || 'id'];

  // View States
  const [viewMode, setViewMode] = useState<"list" | "board" | "calendar">("list");
  const [groupBy, setGroupBy] = useState<GroupByType>("status");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSpace, setFilterSpace] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [meModeOnly, setMeModeOnly] = useState(false);
  const [showClosedTasks, setShowClosedTasks] = useState(true);

  // Collapsible Groups
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Inline Quick Add state per group
  const [inlineNewTask, setInlineNewTask] = useState<Record<string, string>>({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [createDefaultSpace, setCreateDefaultSpace] = useState<string | undefined>(undefined);
  
  // Task Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Calendar View State
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // October
  const [todayStr, setTodayStr] = useState("2026-10-09");

  useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split("T")[0]);
  }, []);

  const toggleSection = (groupId: string) => {
    setCollapsedSections(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const handleToggleStatus = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTask(task.id, { status: nextStatus });
  };

  const handleInlineAdd = (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = inlineNewTask[groupId]?.trim();
    if (!title) return;

    let statusVal: 'todo' | 'in-progress' | 'done' = 'todo';
    let priorityVal: 'urgent' | 'high' | 'normal' | 'low' = 'normal';
    let spaceVal = spaces[0]?.id;
    let dueDateVal = "";

    if (groupBy === "status") {
      if (groupId === "in-progress" || groupId === "done" || groupId === "todo") {
        statusVal = groupId;
      }
    } else if (groupBy === "priority") {
      if (["urgent", "high", "normal", "low"].includes(groupId)) {
        priorityVal = groupId as any;
      }
    } else if (groupBy === "space") {
      spaceVal = groupId;
    } else if (groupBy === "dueDate") {
      if (groupId === "today") dueDateVal = todayStr;
    }

    addTask({
      title,
      status: statusVal,
      priority: priorityVal,
      spaceId: spaceVal,
      assigneeId: meModeOnly ? "u1" : "u1",
      dueDate: dueDateVal || todayStr,
      timeEstimate: 60,
      isPersonal: false,
    });

    setInlineNewTask(prev => ({ ...prev, [groupId]: "" }));
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Show Closed Toggle
      if (!showClosedTasks && task.status === "done") return false;

      // Me Mode (Assigned to Ravi Zein - u1)
      if (meModeOnly && task.assigneeId !== "u1" && !task.isPersonal) return false;

      // Priority Filter
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;

      // Space Filter
      if (filterSpace !== "all" && task.spaceId !== filterSpace) return false;

      // Assignee Filter
      if (filterAssignee !== "all" && task.assigneeId !== filterAssignee) return false;

      return true;
    });
  }, [tasks, searchQuery, showClosedTasks, meModeOnly, filterPriority, filterSpace, filterAssignee]);

  // Priority Helpers
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Flame size={11} className="text-[#EE3726] fill-[#EE3726]" />
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Flag size={10} className="text-orange-500 fill-orange-500" />
            High
          </span>
        );
      case "low":
        return (
          <span className="bg-secondary text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded border border-border flex items-center gap-1 shrink-0">
            <Flag size={10} className="text-muted-foreground" />
            Low
          </span>
        );
      default:
        return (
          <span className="bg-secondary text-foreground border border-border text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
            <Flag size={10} className="text-[#EE3726]" />
            Normal
          </span>
        );
    }
  };

  const getDueDateDisplay = (dueDate?: string) => {
    if (!dueDate) return { text: language === 'en' ? "No due date" : "Tanpa batas", color: "text-muted-foreground" };
    if (dueDate < todayStr) {
      return { text: dueDate, color: "text-[#EE3726] font-bold bg-[#EE3726]/10 px-1.5 py-0.5 rounded" };
    }
    if (dueDate === todayStr) {
      return { text: language === 'en' ? "Today" : "Hari Ini", color: "text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded" };
    }
    return { text: dueDate, color: "text-muted-foreground" };
  };

  // Group Definitions
  const groups = useMemo(() => {
    if (groupBy === "status") {
      return [
        { id: "todo", label: "TO DO", color: "bg-slate-500/20 text-slate-700 dark:text-slate-200 border-slate-400/40" },
        { id: "in-progress", label: "IN PROGRESS", color: "bg-[#EE3726] text-white border-[#EE3726] shadow-sm" },
        { id: "done", label: "COMPLETE", color: "bg-emerald-600 text-white border-emerald-600" },
      ];
    }
    if (groupBy === "priority") {
      return [
        { id: "urgent", label: "URGENT", color: "bg-[#EE3726] text-white border-[#EE3726]" },
        { id: "high", label: "HIGH", color: "bg-orange-500 text-white border-orange-500" },
        { id: "normal", label: "NORMAL", color: "bg-blue-600 text-white border-blue-600" },
        { id: "low", label: "LOW", color: "bg-slate-500 text-white border-slate-500" },
      ];
    }
    if (groupBy === "space") {
      return spaces.map((sp) => ({
        id: sp.id,
        label: sp.name.toUpperCase(),
        color: "bg-secondary text-foreground border-border",
        spaceColor: sp.color,
      }));
    }
    if (groupBy === "dueDate") {
      return [
        { id: "overdue", label: "OVERDUE", color: "bg-[#EE3726] text-white border-[#EE3726]" },
        { id: "today", label: "TODAY", color: "bg-amber-500 text-white border-amber-500" },
        { id: "upcoming", label: "UPCOMING", color: "bg-blue-600 text-white border-blue-600" },
        { id: "no-date", label: "NO DUE DATE", color: "bg-slate-500 text-white border-slate-500" },
      ];
    }
    return [];
  }, [groupBy, spaces]);

  // Filter Tasks into Groups
  const getTasksForGroup = (groupId: string) => {
    return filteredTasks.filter((task) => {
      if (groupBy === "status") return task.status === groupId;
      if (groupBy === "priority") return (task.priority || "normal") === groupId;
      if (groupBy === "space") return task.spaceId === groupId;
      if (groupBy === "dueDate") {
        if (!task.dueDate) return groupId === "no-date";
        if (task.dueDate < todayStr && task.status !== "done") return groupId === "overdue";
        if (task.dueDate === todayStr) return groupId === "today";
        if (task.dueDate > todayStr) return groupId === "upcoming";
        return groupId === "upcoming";
      }
      return true;
    });
  };

  // Calendar Days generator for October 2026
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    // Prefix padding
    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: "", dayNum: 0, isCurrentMonth: false });
    }
    // Days
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(calendarMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateStr: `${calendarYear}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }
    return days;
  }, [calendarYear, calendarMonth]);

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* ClickUp Header Breadcrumb & Views Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#EE3726] shadow-sm shadow-[#EE3726]/40" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EE3726]">
                {t.brandName} • My Work
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
              {t.myTasksTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t.myTasksSubtitle}
            </p>
          </div>

          {/* Quick Actions & ClickUp New Task Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Me Mode Toggle ClickUp Style */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMeModeOnly(!meModeOnly)}
              className={`h-9 px-3 text-xs gap-1.5 rounded-xl border-border transition ${
                meModeOnly 
                  ? "bg-[#EE3726] text-white border-[#EE3726] shadow-sm font-bold" 
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              <div className="h-4 w-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] font-black">
                RZ
              </div>
              <span>{t.meMode}</span>
            </Button>

            {/* NEW TASK BUTTON (ClickUp Red, No Symbols) */}
            <Button
              size="sm"
              onClick={() => {
                setCreateDefaultStatus("todo");
                setCreateModalOpen(true);
              }}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-[#EE3726] hover:bg-[#D32717] text-white shadow-md shadow-[#EE3726]/30 transition"
            >
              <span>{t.newTask}</span>
            </Button>
          </div>
        </div>

        {/* ClickUp Views Switcher Toolbar (List, Board, Calendar) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3 pt-2">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto max-w-full">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                viewMode === "list"
                  ? "bg-[#EE3726] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <LayoutList size={14} />
              <span>{t.listView}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                viewMode === "list" ? "bg-white/20 text-white" : "bg-card text-muted-foreground"
              }`}>
                {filteredTasks.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                viewMode === "board"
                  ? "bg-[#EE3726] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Kanban size={14} />
              <span>{t.boardView}</span>
            </button>

            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                viewMode === "calendar"
                  ? "bg-[#EE3726] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <CalendarIcon size={14} />
              <span>{language === 'en' ? 'Calendar' : 'Kalender'}</span>
            </button>
          </div>

          {/* Right: Filters, Search, Group By */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={language === 'en' ? "Search tasks..." : "Cari task..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary border-border w-36 sm:w-44 focus-visible:ring-[#EE3726] rounded-lg"
              />
            </div>

            {/* Group By Selector */}
            <div className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-lg text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Group:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByType)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="status">Status</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="space">Space</option>
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-secondary border border-border text-foreground rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#EE3726]"
            >
              <option value="all">{t.allPriorities}</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            {/* Space Filter */}
            <select
              value={filterSpace}
              onChange={(e) => setFilterSpace(e.target.value)}
              className="bg-secondary border border-border text-foreground rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#EE3726]"
            >
              <option value="all">{language === 'en' ? "All Spaces" : "Semua Space"}</option>
              {spaces.map((sp) => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>

            {/* Show Closed Tasks Toggle */}
            <button
              onClick={() => setShowClosedTasks(!showClosedTasks)}
              title={showClosedTasks ? "Sembunyikan tugas selesai" : "Tampilkan tugas selesai"}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                showClosedTasks 
                  ? "bg-secondary border-border text-foreground" 
                  : "bg-secondary/40 border-border text-muted-foreground opacity-60"
              }`}
            >
              {showClosedTasks ? <Eye size={13} className="text-[#EE3726]" /> : <EyeOff size={13} />}
              <span className="hidden sm:inline text-[11px] font-medium">
                {language === 'en' ? 'Closed' : 'Selesai'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CLICKUP LIST VIEW (TABLE) */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupTasks = getTasksForGroup(group.id);
            const isCollapsed = collapsedSections[group.id];

            return (
              <div key={group.id} className="space-y-2">
                {/* ClickUp Section Header Bar */}
                <div 
                  onClick={() => toggleSection(group.id)}
                  className="flex items-center justify-between py-1.5 px-3 cursor-pointer hover:bg-secondary/50 rounded-xl transition group/hdr select-none bg-secondary/20 border border-border"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? (
                      <ChevronRight size={15} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={15} className="text-muted-foreground" />
                    )}
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {groupTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateDefaultStatus(group.id === "in-progress" || group.id === "done" ? group.id : "todo");
                      if (groupBy === "space") setCreateDefaultSpace(group.id);
                      setCreateModalOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-[#EE3726] font-semibold px-2 py-0.5 rounded transition"
                  >
                    <span>{language === 'en' ? '+ Add Task' : '+ Tambah Task'}</span>
                  </button>
                </div>

                {/* Tasks Table Column Headers */}
                {!isCollapsed && groupTasks.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="col-span-5">{t.colTaskName}</div>
                    <div className="col-span-2">Space</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2">{t.colDueDate}</div>
                    <div className="col-span-1 text-right">Priority</div>
                  </div>
                )}

                {/* Tasks Items Rows */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {groupTasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-3 px-6 bg-secondary/10 rounded-xl border border-dashed border-border text-center">
                        {language === 'en' ? 'No tasks in this group' : 'Belum ada tugas pada grup ini'}
                      </div>
                    ) : (
                      groupTasks.map((task) => {
                        const isDone = task.status === "done";
                        const space = spaces.find((s) => s.id === task.spaceId);
                        const assignee = users.find((u) => u.id === task.assigneeId);
                        const isPinned = lineupTaskIds.includes(task.id);
                        const dueDateMeta = getDueDateDisplay(task.dueDate);

                        return (
                          <div
                            key={task.id}
                            onClick={() => handleOpenDetail(task)}
                            className={`group flex flex-col md:grid md:grid-cols-12 gap-2.5 items-start md:items-center p-3 rounded-xl border border-border bg-card hover:border-[#EE3726]/40 hover:bg-secondary/40 transition shadow-sm cursor-pointer ${
                              isDone ? "opacity-60 bg-secondary/30" : ""
                            }`}
                          >
                            {/* Col 1-5: Checkbox + Title + Checklist Counter + Lineup Icon */}
                            <div className="col-span-5 flex items-center gap-3 w-full min-w-0">
                              {/* Status Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(task, e)}
                                className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                  isDone
                                    ? "bg-[#EE3726] border-[#EE3726] text-white"
                                    : "border-border hover:border-[#EE3726] text-transparent"
                                }`}
                              >
                                <Check size={12} className={isDone ? "opacity-100" : "opacity-0"} />
                              </button>

                              {/* Task Title */}
                              <span
                                className={`text-xs font-semibold truncate flex-1 min-w-0 ${
                                  isDone ? "line-through text-muted-foreground" : "text-foreground group-hover:text-[#EE3726] transition"
                                }`}
                              >
                                {task.title}
                              </span>

                              {/* Subtasks checklist counter */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border shrink-0">
                                  <ListTodo size={10} className="text-[#EE3726]" />
                                  <span>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}</span>
                                </span>
                              )}

                              {/* Pin indicator */}
                              {isPinned && (
                                <span title="Disematkan ke Lineup" className="shrink-0">
                                  <Pin size={11} className="text-[#EE3726] fill-[#EE3726]" />
                                </span>
                              )}
                            </div>

                            {/* Col 6-7: Space */}
                            <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                              {space ? (
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: space.color }} />
                                  <span className="truncate font-medium">{space.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </div>

                            {/* Col 8-9: Assignee */}
                            <div className="col-span-2 flex items-center gap-2">
                              {assignee ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-[#EE3726]/30">
                                    {assignee.avatar}
                                  </div>
                                  <span className="text-xs text-foreground font-medium truncate max-w-[90px]">
                                    {assignee.name.split(" ")[0]}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                                  RZ
                                </div>
                              )}
                            </div>

                            {/* Col 10-11: Due Date */}
                            <div className="col-span-2 flex items-center gap-1.5 text-xs">
                              <Calendar size={12} className="text-muted-foreground shrink-0" />
                              <span className={dueDateMeta.color}>{dueDateMeta.text}</span>
                            </div>

                            {/* Col 12: Priority Badge */}
                            <div className="col-span-1 flex items-center justify-end">
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Inline Row: ClickUp + Add Task Input at Bottom of Each Section */}
                    <form 
                      onSubmit={(e) => handleInlineAdd(group.id, e)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <Input
                        value={inlineNewTask[group.id] || ""}
                        onChange={(e) => setInlineNewTask(prev => ({ ...prev, [group.id]: e.target.value }))}
                        placeholder={language === 'en' ? `+ Add task to ${group.label} (press Enter)...` : `+ Tambah task ke ${group.label} (tekan Enter)...`}
                        className="h-9 text-xs bg-secondary/30 border-dashed border-border/80 focus-visible:ring-[#EE3726] rounded-xl placeholder:text-muted-foreground/70"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold bg-secondary hover:bg-[#EE3726] hover:text-white text-foreground rounded-xl border border-border transition shrink-0"
                      >
                        {t.addButton}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CLICKUP KANBAN BOARD VIEW */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {groups.map((group) => {
            const groupTasks = getTasksForGroup(group.id);

            return (
              <div
                key={group.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col space-y-3 shadow-md"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{groupTasks.length}</span>
                  </div>

                  <button
                    onClick={() => {
                      setCreateDefaultStatus(group.id === "in-progress" || group.id === "done" ? group.id : "todo");
                      if (groupBy === "space") setCreateDefaultSpace(group.id);
                      setCreateModalOpen(true);
                    }}
                    className="text-xs font-semibold text-muted-foreground hover:text-[#EE3726] p-1 transition"
                  >
                    + Task
                  </button>
                </div>

                {/* Cards in Column */}
                <div className="space-y-2.5 min-h-[300px]">
                  {groupTasks.map((task) => {
                    const space = spaces.find((s) => s.id === task.spaceId);
                    const isDone = task.status === "done";
                    const dueDateMeta = getDueDateDisplay(task.dueDate);

                    return (
                      <Card
                        key={task.id}
                        onClick={() => handleOpenDetail(task)}
                        className={`bg-secondary/40 border-border hover:border-[#EE3726]/40 transition cursor-pointer shadow-sm group ${
                          isDone ? "opacity-60 bg-secondary/20" : ""
                        }`}
                      >
                        <CardContent className="p-3.5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-foreground group-hover:text-[#EE3726] transition line-clamp-2">
                              {task.title}
                            </span>
                            {getPriorityBadge(task.priority)}
                          </div>

                          {/* Subtasks & Space Pill */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                            {space && (
                              <span className="inline-flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded border border-border">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: space.color }} />
                                <span>{space.name}</span>
                              </span>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="inline-flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded border border-border">
                                <ListTodo size={10} className="text-[#EE3726]" />
                                <span>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}</span>
                              </span>
                            )}
                          </div>

                          {/* Due Date & Shift Status */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                            <span className={`text-[11px] ${dueDateMeta.color}`}>
                              {dueDateMeta.text}
                            </span>

                            {/* Quick Status Shift */}
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {(["todo", "in-progress", "done"] as const)
                                .filter((s) => s !== task.status)
                                .map((other) => (
                                  <button
                                    key={other}
                                    onClick={() => updateTask(task.id, { status: other })}
                                    className="px-1.5 py-0.5 rounded bg-secondary hover:bg-[#EE3726] hover:text-white transition text-muted-foreground text-[9px] font-semibold uppercase"
                                  >
                                    {other === "todo" ? "To Do" : other === "in-progress" ? "Progress" : "Done"}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Inline Add Card in Board Column */}
                  <form 
                    onSubmit={(e) => handleInlineAdd(group.id, e)}
                    className="pt-2 flex gap-1.5"
                  >
                    <Input
                      value={inlineNewTask[group.id] || ""}
                      onChange={(e) => setInlineNewTask(prev => ({ ...prev, [group.id]: e.target.value }))}
                      placeholder={language === 'en' ? "+ Add card..." : "+ Tambah tugas..."}
                      className="h-8 text-xs bg-secondary/30 border-dashed border-border focus-visible:ring-[#EE3726] rounded-lg"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-bold bg-secondary hover:bg-[#EE3726] hover:text-white rounded-lg border border-border"
                    >
                      +
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: CLICKUP CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-md">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#EE3726]" />
              <h2 className="text-base font-bold text-foreground">
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(y => y - 1);
                  } else {
                    setCalendarMonth(m => m - 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCalendarYear(2026);
                  setCalendarMonth(9);
                }}
                className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-secondary transition"
              >
                {language === 'en' ? "Today" : "Hari Ini"}
              </button>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(y => y + 1);
                  } else {
                    setCalendarMonth(m => m + 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-foreground transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-muted-foreground pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cd, idx) => {
              if (!cd.isCurrentMonth) {
                return (
                  <div key={idx} className="min-h-[90px] sm:min-h-[110px] rounded-xl bg-secondary/10 border border-dashed border-border/40 p-1.5" />
                );
              }

              const dayTasks = filteredTasks.filter((t) => t.dueDate === cd.dateStr);
              const isToday = cd.dateStr === "2026-10-09";

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between transition ${
                    isToday 
                      ? "bg-[#EE3726]/10 border-[#EE3726]/50 shadow-sm" 
                      : "bg-secondary/30 border-border hover:border-[#EE3726]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${
                      isToday ? "text-[#EE3726] bg-[#EE3726]/20 px-1.5 py-0.2 rounded-md" : "text-foreground"
                    }`}>
                      {cd.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold text-muted-foreground">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[70px] flex-1">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleOpenDetail(task)}
                        className={`text-[10px] p-1 rounded font-medium truncate cursor-pointer transition ${
                          task.status === "done" 
                            ? "line-through bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : "bg-[#EE3726] text-white hover:bg-[#D32717]"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Controlled ClickUp CreateTaskModal */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultStatus={createDefaultStatus}
        defaultSpaceId={createDefaultSpace}
      />

      {/* ClickUp Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
