"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  Calendar, 
  Flag, 
  User as UserIcon, 
  Briefcase, 
  Sparkles, 
  Loader2,
  Pin,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { translations } from "@/lib/i18n";

export default function NewTaskPage() {
  const router = useRouter();
  const { spaces, users, addTask, language, addToLineup } = useStore();
  const t = translations[language || "id"];

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [spaceId, setSpaceId] = useState<string>(spaces[0]?.id || "");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | "low">("high");
  const [assigneeId, setAssigneeId] = useState<string>("u1");
  const [dueDate, setDueDate] = useState<string>("");
  const [isPersonal, setIsPersonal] = useState<boolean>(false);

  // AI Description Generator State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    const d = new Date();
    setDueDate(d.toISOString().split("T")[0]);
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    router.push("/tasks");
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 select-none transition-colors duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link 
            href="/tasks" 
            className="text-xs font-semibold text-muted-foreground hover:text-[#EE3726] flex items-center gap-1 transition"
          >
            <ArrowLeft size={14} />
            <span>{language === 'en' ? 'Back to Tasks' : 'Kembali ke Daftar Tugas'}</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#EE3726] shadow-sm shadow-[#EE3726]/40" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EE3726]">
                ITSEC Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
              {language === 'en' ? 'Create New Task' : 'Buat Task Baru'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {language === 'en' 
                ? 'Fill in task details and assign to team members' 
                : 'Lengkapi rincian tugas dan tugaskan kepada anggota tim'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Dedicated Form Card */}
      <Card className="bg-card border-border shadow-lg rounded-2xl overflow-hidden">
        {/* Destination Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/40">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Space Selector */}
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl shadow-sm">
              <Briefcase size={14} className="text-[#EE3726]" />
              <span className="text-[11px] font-semibold text-muted-foreground">Space:</span>
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

            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className={`text-[11px] font-extrabold uppercase px-3.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition shadow-sm ${
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* TASK TITLE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {language === 'en' ? 'Task Name' : 'Nama Tugas'} <span className="text-[#EE3726]">*</span>
            </label>
            <Input
              autoFocus
              required
              placeholder={language === 'en' ? 'Enter task name...' : 'Masukkan nama tugas...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-bold tracking-tight h-12 bg-secondary/50 border-border focus-visible:ring-[#EE3726] rounded-xl px-4 text-foreground"
            />
          </div>

          {/* DESCRIPTION & GEMINI AI WRITER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                {language === 'en' ? 'Description' : 'Deskripsi Tugas'}
              </label>

              {/* Gemini AI Write Assistant */}
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={isGeneratingAI || !title.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EE3726] bg-[#EE3726]/10 hover:bg-[#EE3726]/20 px-3 py-1 rounded-lg transition disabled:opacity-40"
              >
                {isGeneratingAI ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>{language === 'en' ? 'Gemini AI Writer' : 'Bantuan Gemini AI'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              placeholder={language === 'en' 
                ? 'Add detailed description, objectives, or instructions...' 
                : 'Tambah rincian deskripsi tugas, tujuan, atau panduan pengerjaan...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#EE3726] resize-y leading-relaxed"
            />
          </div>

          {/* CUSTOM FIELDS (ASSIGNEE, DUE DATE, PRIORITY) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
            {/* 1. Assignee Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <UserIcon size={12} className="text-[#EE3726]" /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-[#EE3726] cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card text-foreground">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Due Date Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Calendar size={12} className="text-[#EE3726]" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-[#EE3726] cursor-pointer"
              />
            </div>

            {/* 3. Priority Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Flag size={12} className="text-[#EE3726]" /> Prioritas
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-[#EE3726] cursor-pointer"
              >
                <option value="urgent" className="bg-card text-foreground">Urgent</option>
                <option value="high" className="bg-card text-foreground">High</option>
                <option value="normal" className="bg-card text-foreground">Normal</option>
                <option value="low" className="bg-card text-foreground">Low</option>
              </select>
            </div>
          </div>

          {/* Quick Presets for Due Date */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>Batas waktu cepat:</span>
            <button
              type="button"
              onClick={() => handleApplyQuickDueDate("today")}
              className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-foreground transition text-xs"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDueDate("tomorrow")}
              className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-foreground transition text-xs"
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDueDate("friday")}
              className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-foreground transition text-xs"
            >
              Jumat
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickDueDate("nextWeek")}
              className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-foreground transition text-xs"
            >
              Minggu Depan
            </button>
            {dueDate && (
              <button
                type="button"
                onClick={() => handleApplyQuickDueDate("clear")}
                className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-[#EE3726]"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/tasks")}
              className="text-xs px-4"
            >
              {t.modalCancel}
            </Button>
            <Button
              type="submit"
              className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-bold px-6 h-10 shadow-md shadow-[#EE3726]/30 rounded-xl transition"
            >
              {language === 'en' ? 'Create Task' : 'Buat Task'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
