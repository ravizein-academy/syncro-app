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
  AlertCircle,
  Plus,
  Filter,
  Check
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
    addTask 
  } = useStore();

  const [activeTab, setActiveTab] = useState<"assigned" | "today" | "personal" | "all">("assigned");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const filteredTasks = tasks.filter((task) => {
    // Priority filter
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;

    // Tabs filter
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
      priority: "normal",
      timeEstimate: 60,
      isPersonal: activeTab === "personal",
    });
    setNewTaskTitle("");
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">Urgent</span>;
      case "high":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">High</span>;
      case "low":
        return <span className="bg-slate-700 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full">Low</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-medium px-2 py-0.5 rounded-full">Normal</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">My Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manajemen tugas terstruktur dengan estimasi waktu & prioritas ClickUp-style.
          </p>
        </div>

        {/* Quick Tabs according to PRD 4.1 */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "assigned"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Assigned to me
          </button>
          <button
            onClick={() => setActiveTab("today")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "today"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Today & Overdue
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "personal"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Personal List
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder={`+ Tambah tugas cepat ke ${activeTab === 'personal' ? 'Personal List' : 'My Tasks'} (tekan Enter)...`}
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="bg-slate-900 border-slate-800 text-sm h-11 text-slate-200 placeholder:text-slate-500"
        />
        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 h-11 px-5">
          <Plus size={16} className="mr-1.5" />
          Tambah
        </Button>
      </form>

      {/* Filters & Counts */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
        <div className="flex items-center gap-2">
          <span>Menampilkan <strong className="text-slate-200">{filteredTasks.length}</strong> tugas</span>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={12} />
          <span className="text-slate-500">Filter Prioritas:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="all">Semua Prioritas</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2 opacity-80" />
            <h3 className="text-base font-semibold text-slate-200">Tidak ada tugas pada filter ini!</h3>
            <p className="text-xs text-slate-400 mt-1">Santai atau buat tugas baru di atas.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "done";
            const space = spaces.find((s) => s.id === task.spaceId);
            const isTimerActiveForThis = activeTimerTaskId === task.id && isTimerRunning;
            const progressPercent = task.timeEstimate 
              ? Math.min(100, Math.round(((task.timeTracked || 0) / task.timeEstimate) * 100)) 
              : 0;

            return (
              <Card
                key={task.id}
                className={`bg-slate-900/90 border-slate-800 transition hover:border-slate-700 shadow-sm ${
                  isDone ? "opacity-60 bg-slate-950/40" : ""
                }`}
              >
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Checkbox + Title */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-700 hover:border-blue-500 text-transparent"
                      }`}
                    >
                      <Check size={14} className={isDone ? "opacity-100" : "opacity-0"} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isDone ? "line-through text-slate-400" : "text-slate-100"
                          }`}
                        >
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                        {task.isPersonal && (
                          <span className="bg-purple-900/30 text-purple-400 border border-purple-800/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Personal
                          </span>
                        )}
                        {space && (
                          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-700">
                            <Tag size={10} />
                            {space.name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Due Date, Time Tracked vs Estimate & Timer Action */}
                  <div className="flex items-center gap-4 shrink-0 pl-8 md:pl-0">
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={13} className="text-slate-500" />
                        <span>{task.dueDate}</span>
                      </div>
                    )}

                    {/* Time Progress Tracker */}
                    <div className="w-28 text-right">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{task.timeTracked || 0}m</span>
                        <span className="text-slate-500">/ {task.timeEstimate || 60}m</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progressPercent >= 100
                              ? "bg-rose-500"
                              : progressPercent > 50
                              ? "bg-amber-400"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Timer trigger */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTimer(task.id)}
                      className={`h-8 px-2.5 text-xs gap-1.5 border-slate-700 ${
                        isTimerActiveForThis
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <Play size={12} className={isTimerActiveForThis ? "fill-emerald-400" : ""} />
                      <span>{isTimerActiveForThis ? "Tracking" : "Mulai"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
