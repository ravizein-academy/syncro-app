"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { 
  Calendar, 
  Flag, 
  User as UserIcon, 
  Briefcase, 
  Sparkles, 
  Loader2
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
  const [assigneeId, setAssigneeId] = useState<string>("u1");
  const [dueDate, setDueDate] = useState<string>("");
  const [isPersonal, setIsPersonal] = useState<boolean>(defaultPersonal);

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

  const handleGenerateAIDescription = async () => {
    if (!title.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "knowledge",
          prompt: `Buat deskripsi tugas yang jelas, terstruktur, dan ringkas dalam bahasa ${
            language === "en" ? "Inggris" : "Indonesia"
          } untuk tugas: "${title}". Sertakan ringkasan objektif dan kriteria penyelesaian.`,
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
      timeEstimate: 60,
      timeTracked: 0,
      isPersonal: isPersonal,
    });

    setTitle("");
    setDescription("");
    setOpen?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}

      <DialogContent 
        className="bg-card border-border text-foreground sm:max-w-2xl p-0 overflow-hidden shadow-2xl rounded-2xl transition-colors duration-200"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t.modalNewTaskTitle}</DialogTitle>
        </DialogHeader>

        {/* TOP DESTINATION BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Space Selector */}
            <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#EE3726]" />
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

            {/* Status Pill */}
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
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* TASK TITLE */}
          <div>
            <Input
              autoFocus
              required
              placeholder={language === "en" ? "Task Name..." : "Nama tugas baru..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-bold tracking-tight h-11 border-none shadow-none bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>

          {/* DESCRIPTION & GEMINI AI WRITER */}
          <div className="space-y-1.5 bg-secondary/20 p-3 rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-2 text-muted-foreground">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {language === 'en' ? 'Description' : 'Deskripsi Tugas'}
              </span>

              {/* Gemini AI Write Assistant */}
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={isGeneratingAI || !title.trim()}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#EE3726] bg-[#EE3726]/10 hover:bg-[#EE3726]/20 px-2.5 py-1 rounded-lg transition disabled:opacity-40"
              >
                {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{language === 'en' ? 'Gemini AI Writer' : 'Bantuan Gemini AI'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              placeholder={language === "en" ? "Add description, notes, or details..." : "Tambah deskripsi tugas, catatan, atau rincian pekerjaan..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none pt-2 leading-relaxed"
            />
          </div>

          {/* CUSTOM FIELDS (ASSIGNEE, DUE DATE, PRIORITY) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border">
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
                <option value="urgent" className="bg-card text-foreground">Urgent</option>
                <option value="high" className="bg-card text-foreground">High</option>
                <option value="normal" className="bg-card text-foreground">Normal</option>
                <option value="low" className="bg-card text-foreground">Low</option>
              </select>
            </div>
          </div>

          {/* QUICK PRESETS FOR DATE */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground px-1">
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
                Hapus
              </button>
            )}
          </div>

          {/* FOOTER ACTIONS BAR */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
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
              className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-bold px-5 shadow-md shadow-[#EE3726]/30 rounded-lg transition"
            >
              {language === 'en' ? 'Create Task' : 'Buat Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
