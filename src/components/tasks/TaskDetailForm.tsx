"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore, TaskAttachment } from "@/store/useStore";
import { 
  ArrowLeft,
  Calendar, 
  Flag, 
  User as UserIcon, 
  Briefcase, 
  Sparkles, 
  Loader2,
  Trash2,
  Pin,
  Check,
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  X,
  ListTodo,
  MessageSquare,
  Send,
  CornerDownLeft,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { translations } from "@/lib/i18n";
import { TaskAttachments } from "@/components/tasks/TaskAttachments";

interface TaskDetailFormProps {
  taskId: string;
}

export function TaskDetailForm({ taskId }: TaskDetailFormProps) {
  const router = useRouter();

  const { 
    tasks, 
    spaces, 
    users, 
    updateTask, 
    deleteTask, 
    lineupTaskIds, 
    addToLineup, 
    removeFromLineup, 
    language,
    addTaskComment,
    deleteTaskComment
  } = useStore();
  const t = translations[language || "id"];

  // Find target task
  const task = tasks.find((t) => t.id === taskId);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | "low">("normal");
  const [spaceId, setSpaceId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState("u1");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Initialize form when task is found
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "normal");
      setSpaceId(task.spaceId || spaces[0]?.id || "");
      setAssigneeId(task.assigneeId || "u1");
      setDueDate(task.dueDate || "");
      setAttachments(task.attachments || []);
    }
  }, [task?.id, spaces]);

  // Scroll to latest comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.comments?.length]);

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 text-center">
        <div className="p-8 rounded-2xl bg-card border border-border shadow-md space-y-4">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <X size={24} />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {language === "en" ? "Task Not Found" : "Tugas Tidak Ditemukan"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {language === "en"
              ? "The task you requested may have been deleted or does not exist."
              : "Tugas yang Anda cari mungkin telah dihapus atau tidak tersedia di workspace ini."}
          </p>
          <div className="pt-2">
            <Link href="/tasks">
              <Button className="bg-[#EE3726] hover:bg-[#D32717] text-white text-xs font-semibold rounded-xl">
                <ArrowLeft size={14} className="mr-1.5" />
                {language === "en" ? "Back to All Tasks" : "Kembali ke Daftar Tasks"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPinned = lineupTaskIds.includes(task.id);
  const space = spaces.find((s) => s.id === spaceId);
  const assignee = users.find((u) => u.id === assigneeId);
  const currentSender = users.find((u) => u.id === selectedSenderId) || users[0];
  const commentsList = task.comments || [];

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      description,
      status,
      priority,
      spaceId,
      assigneeId,
      dueDate,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleDeleteTask = () => {
    if (confirm(language === "en" ? "Are you sure you want to delete this task?" : "Apakah Anda yakin ingin menghapus tugas ini?")) {
      deleteTask(task.id);
      router.push("/tasks");
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const currentSubtasks = task.subtasks || [];
    const updated = currentSubtasks.map((st) => 
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    updateTask(task.id, { subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const currentSubtasks = task.subtasks || [];
    const newSt = {
      id: "st-" + Date.now(),
      title: newSubtaskTitle.trim(),
      done: false,
    };
    updateTask(task.id, { subtasks: [...currentSubtasks, newSt] });
    setNewSubtaskTitle("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const currentSubtasks = task.subtasks || [];
    const updated = currentSubtasks.filter((st) => st.id !== subtaskId);
    updateTask(task.id, { subtasks: updated });
  };

  const handleGenerateAI = async () => {
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

  // Add Comment
  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    addTaskComment(task.id, {
      senderId: currentSender.id,
      senderName: currentSender.name,
      senderAvatar: currentSender.avatar,
      senderDepartment: currentSender.department,
      text: commentText.trim(),
    });
    setCommentText("");
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteTaskComment(task.id, commentId);
  };

  const formatCommentTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const completedSubtasks = (task.subtasks || []).filter((st) => st.done).length;
  const totalSubtasks = (task.subtasks || []).length;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header / Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="h-9 w-9 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground flex items-center justify-center transition border border-border shrink-0"
            title="Kembali ke Daftar Tasks"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                #{task.id}
              </span>
              {space && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary border border-border">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: space.color }} />
                  <span>{space.name}</span>
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate max-w-lg sm:max-w-xl">
              {title || task.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pin to Lineup */}
          <button
            type="button"
            onClick={() => {
              if (isPinned) {
                removeFromLineup(task.id);
              } else {
                addToLineup(task.id);
              }
            }}
            title={isPinned ? "Hapus dari Lineup" : "Sematkan ke Lineup"}
            className={`px-3 h-9 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
              isPinned 
                ? "bg-[#EE3726]/15 text-[#EE3726] border-[#EE3726]/30" 
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Pin size={14} className={isPinned ? "fill-[#EE3726]" : ""} />
            <span className="hidden sm:inline">{isPinned ? "Disematkan di Lineup" : "Sematkan ke Lineup"}</span>
          </button>

          {/* Delete Task */}
          <button
            type="button"
            onClick={handleDeleteTask}
            title="Hapus Task"
            className="h-9 w-9 rounded-xl bg-secondary text-muted-foreground hover:text-[#EE3726] hover:bg-[#EE3726]/10 border border-border flex items-center justify-center transition"
          >
            <Trash2 size={15} />
          </button>

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 px-4 text-xs font-bold bg-[#EE3726] hover:bg-[#D32717] text-white rounded-xl shadow-md shadow-[#EE3726]/20 flex items-center gap-1.5"
          >
            {isSavedFeedback ? (
              <>
                <Check size={14} />
                <span>{language === "en" ? "Saved!" : "Tersimpan!"}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{language === "en" ? "Save Changes" : "Simpan Perubahan"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Edit on Left (7 cols), Comments & Activity on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Task Edit Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-card border-border shadow-xs">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Status & Priority Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status Selector */}
                <div className="flex items-center bg-secondary border border-border p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStatus("todo")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      status === "todo" 
                        ? "bg-slate-700 text-white shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    TO DO
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("in-progress")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      status === "in-progress" 
                        ? "bg-[#EE3726] text-white shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    IN PROGRESS
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("done")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      status === "done" 
                        ? "bg-emerald-600 text-white shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    COMPLETE
                  </button>
                </div>

                {/* Priority Selector */}
                <div className="flex items-center gap-1.5 bg-secondary border border-border px-3 py-1.5 rounded-xl text-xs">
                  <Flag size={13} className="text-[#EE3726]" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {language === "en" ? "Task Title" : "Nama Tugas"}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base sm:text-lg font-bold text-foreground bg-secondary/30 border-border focus-visible:ring-[#EE3726] rounded-xl h-11"
                  placeholder="Judul task..."
                />
              </div>

              {/* Properties Grid: Space, Assignee, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                {/* Space */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Briefcase size={11} className="text-[#EE3726]" />
                    <span>Space</span>
                  </span>
                  <select
                    value={spaceId}
                    onChange={(e) => setSpaceId(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg text-xs p-2 text-foreground focus:outline-none focus:border-[#EE3726]"
                  >
                    {spaces.map((sp) => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <UserIcon size={11} className="text-[#EE3726]" />
                    <span>Assignee</span>
                  </span>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg text-xs p-2 text-foreground focus:outline-none focus:border-[#EE3726]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} className="text-[#EE3726]" />
                    <span>Due Date</span>
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg text-xs p-2 text-foreground focus:outline-none focus:border-[#EE3726]"
                  />
                </div>
              </div>

              {/* Description Section with AI assist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "en" ? "Description" : "Deskripsi & Catatan Tugas"}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || !title.trim()}
                    className="text-xs text-[#EE3726] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                  >
                    {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>{language === "en" ? "AI Write" : "Gemini AI Tulis Deskripsi"}</span>
                  </button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={language === "en" ? "Add detailed specifications, checklist, or instructions..." : "Tulis detail spesifikasi, petunjuk kerja, atau catatan..."}
                  className="bg-secondary/30 border-border text-xs focus-visible:ring-[#EE3726] rounded-xl text-foreground leading-relaxed"
                />

                {/* Attachments Section: Image, Video, Audio, Link */}
                <div className="pt-2">
                  <TaskAttachments
                    attachments={attachments}
                    onChange={setAttachments}
                    language={language}
                  />
                </div>
              </div>

              {/* Subtasks / Checklist Section */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo size={15} className="text-[#EE3726]" />
                    <span className="text-xs font-bold text-foreground">
                      Checklist & Subtasks
                    </span>
                    {totalSubtasks > 0 && (
                      <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded font-bold text-muted-foreground">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtasks List */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-border">
                    {task.subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-secondary transition group"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${
                            st.done ? "bg-[#EE3726] border-[#EE3726] text-white" : "border-border hover:border-[#EE3726]"
                          }`}>
                            {st.done && <Check size={11} />}
                          </div>
                          <span className={`text-xs ${st.done ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                            {st.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="text-muted-foreground hover:text-[#EE3726] opacity-0 group-hover:opacity-100 transition p-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Input */}
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder={language === "en" ? "+ Add checklist item (press Enter)..." : "+ Tambah item checklist (tekan Enter)..."}
                    className="h-9 text-xs bg-secondary/40 border-border focus-visible:ring-[#EE3726] rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-3 bg-secondary hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border"
                  >
                    <Plus size={13} />
                  </Button>
                </form>
              </div>

              {/* Bottom Save Action */}
              <div className="pt-3 border-t border-border flex items-center justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  className="text-xs h-9 px-6 font-bold bg-[#EE3726] hover:bg-[#D32717] text-white rounded-xl shadow-md shadow-[#EE3726]/20"
                >
                  {isSavedFeedback ? (language === "en" ? "Saved!" : "Tersimpan!") : (language === "en" ? "Save Changes" : "Simpan Perubahan")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Collaborative Team Activity & Comments */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-card border-border shadow-xs sticky top-20 flex flex-col max-h-[calc(100vh-120px)] overflow-hidden">
            {/* Comments Header */}
            <CardHeader className="p-4 border-b border-border bg-secondary/30 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{t.taskCommentsTitle}</span>
                      <span className="text-[10px] font-semibold bg-[#EE3726]/15 text-[#EE3726] px-1.5 py-0.5 rounded-full border border-[#EE3726]/20">
                        {commentsList.length}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground">
                      {t.taskCommentsSubtitle}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Comment Persona Switcher */}
            <div className="px-4 py-2.5 border-b border-border bg-secondary/20 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="h-5 w-5 rounded-full bg-[#EE3726] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  {currentSender.avatar || currentSender.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {t.commentAs}:
                </span>
              </div>
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="bg-card border border-border rounded-lg text-xs py-1 px-2 text-foreground font-semibold focus:outline-none focus:border-[#EE3726] max-w-[190px] truncate"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[460px]">
              {commentsList.length === 0 ? (
                <div className="h-full py-12 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/60 border border-border">
                    <MessageSquare size={18} />
                  </div>
                  <div className="space-y-0.5 max-w-xs">
                    <p className="text-xs font-semibold text-foreground">
                      {t.noCommentsYet}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.noCommentsSub}
                    </p>
                  </div>
                </div>
              ) : (
                commentsList.map((comm) => (
                  <div
                    key={comm.id}
                    className="group relative flex items-start gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border/80 hover:border-border transition"
                  >
                    {/* Avatar */}
                    <div className="h-7 w-7 rounded-full bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {comm.senderAvatar || comm.senderName.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">
                            {comm.senderName}
                          </span>
                          {comm.senderDepartment && (
                            <span className="text-[9px] bg-secondary px-1.5 py-0.2 rounded border border-border font-medium text-muted-foreground truncate">
                              {comm.senderDepartment}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatCommentTime(comm.createdAt)}
                        </span>
                      </div>

                      {/* Comment Text */}
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                        {comm.text}
                      </p>
                    </div>

                    {/* Delete button on hover */}
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comm.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#EE3726] p-1 transition rounded shrink-0 self-start"
                      title={t.deleteComment}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Sticky Comment Composer */}
            <div className="p-3.5 border-t border-border bg-secondary/30 shrink-0">
              <form onSubmit={handleAddComment} className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder={t.writeCommentPlaceholder}
                    rows={2}
                    className="w-full bg-card border-border rounded-xl text-xs p-2.5 pr-10 resize-none focus-visible:ring-[#EE3726] text-foreground"
                  />
                  <Button
                    type="submit"
                    disabled={!commentText.trim()}
                    size="sm"
                    className="absolute right-2 bottom-2 h-7 w-7 p-0 rounded-lg bg-[#EE3726] hover:bg-[#D32717] text-white disabled:opacity-40 transition shadow-xs"
                    title={t.sendComment}
                  >
                    <Send size={12} />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                  <span className="flex items-center gap-1">
                    <CornerDownLeft size={10} /> Enter untuk kirim, Shift+Enter untuk baris baru
                  </span>
                  {commentText.length > 0 && (
                    <span>{commentText.length} karakter</span>
                  )}
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
