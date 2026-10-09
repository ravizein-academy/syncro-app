"use client";

import React, { useState, useEffect } from "react";
import { useStore, Task } from "@/store/useStore";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Flag, 
  User as UserIcon, 
  Briefcase, 
  Sparkles, 
  ListTodo, 
  Check, 
  X, 
  ChevronDown, 
  Paperclip, 
  Bold, 
  Italic, 
  Code, 
  Loader2,
  Tag,
  Pin,
  CheckCircle2,
  Circle,
  FileText,
  CornerDownLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";

interface CreateTaskModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  defaultSpaceId?: string;
  defaultStatus?: "todo" | "in-progress" | "done";
  defaultPersonal?: boolean;
  initialTitle?: string;
}

const PRESET_TAGS = ["Frontend", "Backend", "Security", "Design", "DevOps", "Bug"];

export function CreateTaskModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  defaultSpaceId,
  defaultStatus = "todo",
  defaultPersonal = false,
  initialTitle = "",
}: CreateTaskModalProps) {
  const { spaces, users, addTask, language, addToLineup } = useStore();
  const t = translations[language || "id"];

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  // Form State
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [spaceId, setSpaceId] = useState<string>(defaultSpaceId || spaces[0]?.id || "");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">(defaultStatus);
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | "low">("high");
  const [assigneeId, setAssigneeId] = useState<string>("u1"); // Default to Ravi Zein
  const [dueDate, setDueDate] = useState<string>("");
  const [timeEstimate, setTimeEstimate] = useState<number>(60);
  const [isPersonal, setIsPersonal] = useState<boolean>(defaultPersonal);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [pinToLineup, setPinToLineup] = useState(false);

  // Subtasks State
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showSubtasks, setShowSubtasks] = useState(true);

  // Attachments simulation
  const [attachments, setAttachments] = useState<string[]>([]);

  // AI Description Generator State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle);
      if (defaultSpaceId) setSpaceId(defaultSpaceId);
      if (defaultStatus) setStatus(defaultStatus);
      if (defaultPersonal !== undefined) setIsPersonal(defaultPersonal);
      
      const d = new Date();
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [isOpen, initialTitle, defaultSpaceId, defaultStatus, defaultPersonal]);

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${Math.random()}`, title: newSubtaskTitle.trim(), done: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTagInput("");
      setShowTagInput(false);
    }
  };

  const handleApplyQuickDueDate = (type: "today" | "tomorrow" | "friday" | "nextWeek" | "clear") => {
    if (type === "clear") {
      setDueDate("");
      return;
    }
    const d = new Date();
    if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (type === "friday") {
      const day = d.getDay();
      const diff = d.getDate() + (day <= 5 ? 5 - day : 5 - day + 7);
      d.setDate(diff);
    } else if (type === "nextWeek") {
      d.setDate(d.getDate() + 7);
    }
    setDueDate(d.toISOString().split("T")[0]);
  };

  const handleGenerateAIDescription = async (customPromptType?: "full" | "criteria" | "steps") => {
    if (!title.trim()) return;
    setIsGeneratingAI(true);
    try {
      let promptText = `Buat deskripsi tugas profesional, jelas, dan terstruktur dalam bahasa ${
        language === "en" ? "Inggris" : "Indonesia"
      } untuk tugas: "${title}".`;

      if (customPromptType === "criteria") {
        promptText += " Fokuskan pada Acceptance Criteria dan Definition of Done berpoin-poin.";
      } else if (customPromptType === "steps") {
        promptText += " Buat langkah-langkah eksekusi sistematis (actionable checklist steps).";
      } else {
        promptText += " Sertakan Overview ringkas, Objectives, dan Acceptance Criteria.";
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "knowledge",
          prompt: promptText,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setDescription(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddAttachment = () => {
    const fileTypes = ["specification-itsec.pdf", "architecture-diagram.png", "figma-design-link.url"];
    const randomFile = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    if (!attachments.includes(randomFile)) {
      setAttachments((prev) => [...prev, randomFile]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const newTaskId = `t_${Date.now()}`;

    addTask({
      id: newTaskId,
      title: title.trim(),
      description: description.trim() || undefined,
      status: status,
      priority: priority,
      assigneeId: assigneeId,
      spaceId: isPersonal ? undefined : spaceId,
      dueDate: dueDate || undefined,
      timeEstimate: timeEstimate,
      timeTracked: 0,
      isPersonal: isPersonal,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    if (pinToLineup) {
      addToLineup(newTaskId);
    }

    if (createAnother) {
      setTitle("");
      setDescription("");
      setSubtasks([]);
      setSelectedTags([]);
      setAttachments([]);
    } else {
      setTitle("");
      setDescription("");
      setSubtasks([]);
      setSelectedTags([]);
      setAttachments([]);
      setOpen?.(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd + Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const selectedAssignee = users.find((u) => u.id === assigneeId);
  const completedSubtasksCount = subtasks.filter((s) => s.done).length;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}

      <DialogContent 
        className="bg-card border-border text-foreground sm:max-w-3xl p-0 overflow-hidden shadow-2xl rounded-2xl transition-colors duration-200"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t.modalNewTaskTitle}</DialogTitle>
        </DialogHeader>

        {/* CLICKUP 3.0 TOP DESTINATION BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* ClickUp Workspace Breadcrumb & Space Selector */}
            <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#EE3726]" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                ITSEC
              </span>
              <span className="text-muted-foreground">/</span>
              <Briefcase size={13} className="text-[#EE3726]" />
              <select
                value={isPersonal ? "personal" : spaceId}
                onChange={(e) => {
                  if (e.target.value === "personal") {
                    setIsPersonal(true);
                  } else {
                    setIsPersonal(false);
                    setSpaceId(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <optgroup label="Spaces">
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id} className="bg-card text-foreground">
                      {sp.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Personal">
                  <option value="personal" className="bg-card text-foreground">
                    Personal List
                  </option>
                </optgroup>
              </select>
            </div>

            {/* ClickUp Status Pill Selector */}
            <div className="flex items-center gap-1">
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-lg border focus:outline-none cursor-pointer transition shadow-sm ${
                  status === "in-progress"
                    ? "bg-[#EE3726] text-white border-[#EE3726]"
                    : status === "done"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <option value="todo" className="bg-card text-foreground font-semibold">
                  TO DO
                </option>
                <option value="in-progress" className="bg-card text-foreground font-semibold">
                  IN PROGRESS
                </option>
                <option value="done" className="bg-card text-foreground font-semibold">
                  COMPLETE
                </option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>ClickUp 3.0 Mode</span>
          </div>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* TASK TITLE */}
          <div>
            <Input
              autoFocus
              required
              placeholder={language === "en" ? "Task Name or type '/' for commands..." : "Nama tugas baru atau ketik '/'..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold tracking-tight h-12 border-none shadow-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>

          {/* DESCRIPTION WITH MARKDOWN TOOLBAR & GEMINI AI WRITER */}
          <div className="space-y-1.5 bg-secondary/20 p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDescription((prev) => prev + " **tebal**")}
                  className="p-1.5 rounded hover:bg-accent text-xs hover:text-foreground transition"
                  title="Bold (**tebal**)"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDescription((prev) => prev + " *miring*")}
                  className="p-1.5 rounded hover:bg-accent text-xs hover:text-foreground transition"
                  title="Italic (*miring*)"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDescription((prev) => prev + "\n- ")}
                  className="p-1.5 rounded hover:bg-accent text-xs hover:text-foreground transition"
                  title="Bullet List (- item)"
                >
                  <ListTodo size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDescription((prev) => prev + "\n```\ncode\n```")}
                  className="p-1.5 rounded hover:bg-accent text-xs hover:text-foreground transition"
                  title="Code Block"
                >
                  <Code size={13} />
                </button>
              </div>

              {/* Gemini AI Write Assistant with Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGenerateAIDescription("full")}
                  disabled={isGeneratingAI || !title.trim()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EE3726] bg-[#EE3726]/10 hover:bg-[#EE3726]/20 px-2.5 py-1 rounded-lg transition disabled:opacity-40"
                  title="Generate structured task description with Gemini AI"
                >
                  {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>{language === 'en' ? 'AI Write' : 'Gemini AI'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleGenerateAIDescription("criteria")}
                  disabled={isGeneratingAI || !title.trim()}
                  className="hidden md:inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded transition disabled:opacity-40"
                >
                  <span>+ Acceptance Criteria</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder={language === "en" ? "Add description, objectives, links, or acceptance criteria..." : "Tambah deskripsi tugas, tujuan, tautan, atau kriteria penyelesaian..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none pt-2 leading-relaxed"
            />
          </div>

          {/* CLICKUP CUSTOM FIELDS GRID (ASSIGNEE, DUE DATE, PRIORITY, ESTIMATE) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border">
            {/* 1. Assignee Field */}
            <div className="p-2.5 rounded-xl border border-border bg-secondary/30 space-y-1 hover:border-[#EE3726]/40 transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <UserIcon size={11} className="text-[#EE3726]" /> Assignee
              </span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer truncate"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card text-foreground">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Due Date Field */}
            <div className="p-2.5 rounded-xl border border-border bg-secondary/30 space-y-1 hover:border-[#EE3726]/40 transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Calendar size={11} className="text-[#EE3726]" /> Due Date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            {/* 3. Priority Field */}
            <div className="p-2.5 rounded-xl border border-border bg-secondary/30 space-y-1 hover:border-[#EE3726]/40 transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Flag size={11} className="text-[#EE3726]" /> Prioritas
              </span>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="urgent" className="bg-card text-foreground">Urgent (🔴)</option>
                <option value="high" className="bg-card text-foreground">High (🟠)</option>
                <option value="normal" className="bg-card text-foreground">Normal (🔵)</option>
                <option value="low" className="bg-card text-foreground">Low (⚪)</option>
              </select>
            </div>

            {/* 4. Time Estimate Field */}
            <div className="p-2.5 rounded-xl border border-border bg-secondary/30 space-y-1 hover:border-[#EE3726]/40 transition">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Clock size={11} className="text-[#EE3726]" /> Estimasi
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground font-mono">menit</span>
              </div>
            </div>
          </div>

          {/* QUICK PRESETS FOR DATE & TIME ESTIMATE */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted-foreground px-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Batas waktu cepat:</span>
              <button
                type="button"
                onClick={() => handleApplyQuickDueDate("today")}
                className="px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-foreground transition text-[10px]"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleApplyQuickDueDate("tomorrow")}
                className="px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-foreground transition text-[10px]"
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => handleApplyQuickDueDate("friday")}
                className="px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-foreground transition text-[10px]"
              >
                Jumat
              </button>
              <button
                type="button"
                onClick={() => handleApplyQuickDueDate("nextWeek")}
                className="px-2 py-0.5 rounded-md bg-secondary hover:bg-accent text-foreground transition text-[10px]"
              >
                Minggu Depan
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => handleApplyQuickDueDate("clear")}
                  className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-[#EE3726]"
                >
                  ✕ Hapus
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span>Durasi:</span>
              {[15, 30, 60, 120, 240, 480].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimeEstimate(m)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                    timeEstimate === m 
                      ? "bg-[#EE3726] text-white font-bold shadow-sm" 
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          {/* CLICKUP TAGS SECTION */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Tag size={12} className="text-[#EE3726]" />
                Tags ({selectedTags.length})
              </span>
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="text-[11px] font-semibold text-[#EE3726] hover:underline"
              >
                + Tambah Tag Kustom
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      isSelected
                        ? "bg-[#EE3726]/15 border-[#EE3726]/40 text-[#EE3726]"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}

              {selectedTags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#EE3726]/15 border border-[#EE3726]/40 text-[#EE3726]"
                >
                  #{tag}
                  <button type="button" onClick={() => handleToggleTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            {showTagInput && (
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Ketik nama tag baru lalu tekan Enter..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTag(e);
                    }
                  }}
                  className="h-8 text-xs bg-secondary border-border"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomTag}
                  size="sm"
                  className="h-8 px-3 text-xs bg-[#EE3726] hover:bg-[#D32717] text-white"
                >
                  Tambah
                </Button>
              </div>
            )}
          </div>

          {/* SUBTASKS & CHECKLIST ACCORDION (CLICKUP STYLE) */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-[#EE3726] transition"
              >
                <ListTodo size={14} className="text-[#EE3726]" />
                <span>Subtasks & Checklist</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  ({completedSubtasksCount}/{subtasks.length})
                </span>
                <ChevronDown size={13} className={`transition-transform ${showSubtasks ? "rotate-180" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleAddAttachment}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
              >
                <Paperclip size={12} className="text-[#EE3726]" />
                <span>Lampiran ({attachments.length})</span>
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {attachments.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] bg-secondary px-2 py-0.5 rounded border border-border text-foreground"
                  >
                    <FileText size={11} className="text-[#EE3726]" />
                    {file}
                    <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      <X size={10} className="hover:text-[#EE3726]" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showSubtasks && (
              <div className="space-y-2 pt-2">
                {subtasks.length > 0 && (
                  <div className="space-y-1.5">
                    {subtasks.map((st) => (
                      <div 
                        key={st.id} 
                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition border ${
                          st.done 
                            ? "bg-secondary/20 border-border/50 text-muted-foreground line-through" 
                            : "bg-secondary/40 border-border text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSubtask(st.id)}
                            className="text-[#EE3726] hover:scale-110 transition"
                          >
                            {st.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                          </button>
                          <span className="truncate">{st.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-muted-foreground hover:text-[#EE3726] transition p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="+ Tambah subtask item (tekan Enter)..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="h-8 text-xs bg-secondary border-border"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddSubtask()}
                    size="sm"
                    className="h-8 px-3 bg-secondary hover:bg-accent text-foreground text-xs"
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
            {/* ClickUp Quick Toggles */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={createAnother}
                  onChange={(e) => setCreateAnother(e.target.checked)}
                  className="rounded border-border text-[#EE3726] focus:ring-[#EE3726] h-3.5 w-3.5 accent-[#EE3726]"
                />
                <span>{language === 'en' ? 'Create another' : 'Buat tugas lainnya'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={pinToLineup}
                  onChange={(e) => setPinToLineup(e.target.checked)}
                  className="rounded border-border text-[#EE3726] focus:ring-[#EE3726] h-3.5 w-3.5 accent-[#EE3726]"
                />
                <Pin size={11} className="text-[#EE3726]" />
                <span>{language === 'en' ? 'Pin to Lineup' : 'Sematkan ke Lineup'}</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen?.(false)}
                className="text-xs"
              >
                {t.modalCancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-bold px-4 gap-1.5 shadow-md shadow-[#EE3726]/30 rounded-lg transition"
              >
                <span>{language === 'en' ? 'Create Task' : 'Buat Task'}</span>
                <span className="text-[10px] bg-black/20 px-1 py-0.2 rounded font-mono">⌘↵</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
