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
  Flag,
  Maximize2,
  ListTodo,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export default function TasksPage() {
  const { 
    tasks, 
    updateTask, 
    startTimer, 
    activeTimerTaskId, 
    isTimerRunning, 
    spaces,
    users,
    addTask,
    language 
  } = useStore();

  const t = translations[language || 'id'];

  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [activeTab, setActiveTab] = useState<"assigned" | "today" | "personal" | "all">("assigned");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [meModeOnly, setMeModeOnly] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // ClickUp Create Task Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [modalInitialTitle, setModalInitialTitle] = useState("");

  const toggleSection = (status: string) => {
    setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const openCreateModalFor = (status: "todo" | "in-progress" | "done" = "todo", initialTitle = "") => {
    setModalDefaultStatus(status);
    setModalInitialTitle(initialTitle);
    setModalOpen(true);
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
      title: newTaskTitle.trim(),
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
          <span className="bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Flame size={11} className="text-[#EE3726] fill-[#EE3726]" />
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Flag size={10} className="text-orange-500 fill-orange-500" />
            High
          </span>
        );
      case "low":
        return (
          <span className="bg-secondary text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded border border-border flex items-center gap-1">
            <Flag size={10} className="text-muted-foreground" />
            Low
          </span>
        );
      default:
        return (
          <span className="bg-secondary text-foreground border border-border text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Flag size={10} className="text-[#EE3726]" />
            Normal
          </span>
        );
    }
  };

  const STATUS_GROUPS = [
    { id: "todo", label: t.statusTodo, color: "bg-slate-500/20 text-slate-700 dark:text-slate-200 border-slate-400/40" },
    { id: "in-progress", label: t.statusInProgress, color: "bg-[#EE3726] text-white border-[#EE3726] shadow-sm" },
    { id: "done", label: t.statusComplete, color: "bg-emerald-600 text-white border-emerald-600" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* ClickUp Header Breadcrumb & Views Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#EE3726] shadow-sm shadow-[#EE3726]/40" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EE3726]">
                ITSEC Workspace / Tasks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
              {t.myTasksTitle}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t.myTasksSubtitle}
            </p>
          </div>

          {/* Quick Filters Pill & New Task Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-secondary border border-border p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "assigned"
                    ? "bg-[#EE3726] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabAssigned}
              </button>
              <button
                onClick={() => setActiveTab("today")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "today"
                    ? "bg-[#EE3726] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabToday}
              </button>
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "personal"
                    ? "bg-[#EE3726] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabPersonal}
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "all"
                    ? "bg-[#EE3726] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.tabAll}
              </button>
            </div>

            {/* ClickUp Me Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMeModeOnly(!meModeOnly)}
              className={`h-9 px-3 text-xs gap-1.5 rounded-xl border-border transition ${
                meModeOnly 
                  ? "bg-[#EE3726] text-white border-[#EE3726] shadow-sm" 
                  : "bg-secondary text-foreground hover:bg-accent"
              }`}
            >
              <UserIcon size={13} />
              <span>{t.meMode}</span>
            </Button>

            {/* CLICKUP NEW TASK BUTTON */}
            <Button
              size="sm"
              onClick={() => openCreateModalFor("todo")}
              className="h-9 px-4 text-xs font-bold gap-1.5 rounded-xl bg-[#EE3726] hover:bg-[#D32717] text-white shadow-md shadow-[#EE3726]/30 transition"
            >
              <Plus size={15} />
              <span>{t.newTask}</span>
            </Button>
          </div>
        </div>

        {/* ClickUp Views Switcher Toolbar (List vs Board) */}
        <div className="flex items-center justify-between border-b border-border pb-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <LayoutList size={14} className={viewMode === "list" ? "text-[#EE3726]" : ""} />
              <span>{t.listView}</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "board"
                  ? "bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Kanban size={14} className={viewMode === "board" ? "text-[#EE3726]" : ""} />
              <span>{t.boardView}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-muted-foreground" />
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
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Bar with ClickUp Expand Icon */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={t.quickAddPlaceholder}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="bg-card border-border text-xs h-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#EE3726] rounded-xl pr-10 shadow-sm"
          />
          <button
            type="button"
            onClick={() => openCreateModalFor("todo", newTaskTitle)}
            title="Buka Modal ClickUp Lengkap"
            className="absolute right-3 top-3 text-muted-foreground hover:text-[#EE3726] transition"
          >
            <Maximize2 size={15} />
          </button>
        </div>
        <Button 
          type="submit" 
          className="bg-[#EE3726] hover:bg-[#D32717] h-11 px-5 font-bold text-xs shadow-md shadow-[#EE3726]/20 rounded-xl text-white transition"
        >
          <Plus size={15} className="mr-1.5" />
          {t.addButton}
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
                  className="flex items-center justify-between py-1.5 px-2 cursor-pointer hover:bg-accent rounded-lg transition"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? <ChevronRight size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {groupTasks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateModalFor(group.id as any);
                    }}
                    className="text-xs text-muted-foreground hover:text-[#EE3726] flex items-center gap-1 font-semibold px-2 py-0.5 rounded transition"
                  >
                    <Plus size={13} />
                    <span>+ Task</span>
                  </button>
                </div>

                {/* Tasks Table Column Header */}
                {!isCollapsed && groupTasks.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="col-span-6">{t.colTaskName}</div>
                    <div className="col-span-2">{t.colAssigneeSpace}</div>
                    <div className="col-span-2">{t.colDueDate}</div>
                    <div className="col-span-2 text-right">{t.colTimeTracked}</div>
                  </div>
                )}

                {/* Task Items */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {groupTasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-2 px-6">
                        {t.emptyTasksFilter}
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
                            className={`group flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center p-3.5 rounded-xl border border-border bg-card hover:border-[#EE3726]/40 hover:bg-secondary/40 transition shadow-sm ${
                              isDone ? "opacity-60 bg-secondary/30" : ""
                            }`}
                          >
                            {/* Col 1-6: Checkbox + Title + Badges + Subtasks Indicator */}
                            <div className="col-span-6 flex items-start md:items-center gap-3 w-full min-w-0">
                              <button
                                onClick={() => handleToggleStatus(task)}
                                className={`mt-0.5 md:mt-0 h-4.5 w-4.5 rounded border flex items-center justify-center transition shrink-0 ${
                                  isDone
                                    ? "bg-[#EE3726] border-[#EE3726] text-white"
                                    : "border-border hover:border-[#EE3726] text-transparent"
                                }`}
                              >
                                <Check size={12} className={isDone ? "opacity-100" : "opacity-0"} />
                              </button>

                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    isDone ? "line-through text-muted-foreground" : "text-foreground"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {getPriorityBadge(task.priority)}
                                
                                {task.isPersonal && (
                                  <span className="bg-[#EE3726]/10 text-[#EE3726] border border-[#EE3726]/30 text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                    {t.personalBadge}
                                  </span>
                                )}

                                {/* Subtasks pill if present */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                                    <ListTodo size={11} className="text-[#EE3726]" />
                                    <span>
                                      {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                                    </span>
                                  </span>
                                )}

                                {/* Tags pills */}
                                {task.tags?.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] font-bold text-[#EE3726] bg-[#EE3726]/10 border border-[#EE3726]/20 px-1.5 py-0.2 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Col 7-8: Assignee & Space */}
                            <div className="col-span-2 flex items-center gap-2">
                              {assignee ? (
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center text-[10px] font-bold text-white shadow ring-1 ring-[#EE3726]/30">
                                  {assignee.avatar}
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                                  RZ
                                </div>
                              )}
                              {space && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: space.color }} />
                                  <span className="truncate">{space.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Col 9-10: Due Date */}
                            <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar size={12} className="text-muted-foreground" />
                              <span>{task.dueDate || (language === 'en' ? 'No due date' : 'Tanpa batas')}</span>
                            </div>

                            {/* Col 11-12: Time Tracked & Live Timer */}
                            <div className="col-span-2 flex items-center justify-end gap-2 w-full md:w-auto">
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 text-xs font-mono">
                                  <Clock size={11} className="text-[#EE3726]" />
                                  <span className="text-[#EE3726] font-bold">{task.timeTracked || 0}m</span>
                                  <span className="text-muted-foreground">/ {task.timeEstimate || 60}m</span>
                                </div>
                                <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className="h-full bg-[#EE3726] rounded-full transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startTimer(task.id)}
                                className={`h-7 px-2.5 text-xs gap-1 border-border rounded-lg transition ${
                                  isTimerActiveForThis
                                    ? "bg-[#EE3726]/20 text-[#EE3726] border-[#EE3726]/50 shadow-sm"
                                    : "text-foreground hover:bg-accent"
                                }`}
                              >
                                <Play size={10} className={isTimerActiveForThis ? "fill-[#EE3726] text-[#EE3726]" : ""} />
                                <span>{isTimerActiveForThis ? "Live" : "Start"}</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* ClickUp Inline Row: + Tambah Task */}
                    <button
                      type="button"
                      onClick={() => openCreateModalFor(group.id as any)}
                      className="w-full py-2 px-3 text-xs font-semibold text-muted-foreground hover:text-[#EE3726] hover:bg-secondary/40 rounded-xl border border-dashed border-border/70 flex items-center gap-2 transition"
                    >
                      <Plus size={14} className="text-[#EE3726]" />
                      <span>{language === 'en' ? `+ New task in ${group.label}` : `+ Tambah task di ${group.label}`}</span>
                    </button>
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
          {STATUS_GROUPS.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.status === group.id);

            return (
              <div
                key={group.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col space-y-3 shadow-md"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{groupTasks.length}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openCreateModalFor(group.id as any)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-[#EE3726] rounded-lg"
                    title={`+ Tambah Task ${group.label}`}
                  >
                    <Plus size={15} />
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
                        className="bg-secondary/40 border-border hover:border-[#EE3726]/40 transition cursor-pointer shadow-sm group"
                      >
                        <CardContent className="p-3.5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-foreground group-hover:text-[#EE3726] transition">
                              {task.title}
                            </span>
                            {getPriorityBadge(task.priority)}
                          </div>

                          {/* Tags & Subtasks count */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                                <ListTodo size={10} className="text-[#EE3726]" />
                                <span>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}</span>
                              </span>
                            )}
                            {task.tags?.map((tag) => (
                              <span key={tag} className="text-[9px] font-semibold text-[#EE3726] bg-[#EE3726]/10 px-1.5 py-0.2 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {space && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Tag size={10} className="text-[#EE3726]" />
                              <span>{space.name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                              <Clock size={11} className="text-[#EE3726]" />
                              <span className="text-[#EE3726] font-semibold">{task.timeTracked || 0}m</span>
                              <span>/ {task.timeEstimate || 60}m</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startTimer(task.id);
                              }}
                              className={`h-6 px-2 text-[10px] gap-1 border-border rounded-md ${
                                isTimerActiveForThis
                                  ? "bg-[#EE3726]/20 text-[#EE3726] border-[#EE3726]/50"
                                  : "text-foreground hover:bg-accent"
                              }`}
                            >
                              <Play size={9} className={isTimerActiveForThis ? "fill-[#EE3726] text-[#EE3726]" : ""} />
                              <span>{isTimerActiveForThis ? "Live" : "Start"}</span>
                            </Button>
                          </div>

                          {/* Quick Status Shift Buttons */}
                          <div className="flex items-center justify-between gap-1 pt-1 text-[10px] text-muted-foreground">
                            <span>{t.shiftStatus}</span>
                            <div className="flex gap-1">
                              {STATUS_GROUPS.filter((g) => g.id !== group.id).map((other) => (
                                <button
                                  key={other.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTask(task.id, { status: other.id as any });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-secondary hover:bg-[#EE3726] hover:text-white transition text-muted-foreground text-[9px]"
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

                  {/* Add task button in board column */}
                  <button
                    type="button"
                    onClick={() => openCreateModalFor(group.id as any)}
                    className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-[#EE3726] hover:bg-secondary/40 rounded-xl border border-dashed border-border/70 flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus size={13} className="text-[#EE3726]" />
                    <span>{language === 'en' ? '+ Add Task' : '+ Tambah Task'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Controlled ClickUp CreateTaskModal */}
      <CreateTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultStatus={modalDefaultStatus}
        initialTitle={modalInitialTitle}
      />
    </div>
  );
}
