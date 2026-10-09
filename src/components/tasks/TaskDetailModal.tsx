"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore, Task, TaskAttachment } from "@/store/useStore";
import { 
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
  CornerDownLeft
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { translations } from "@/lib/i18n";
import { TaskAttachments } from "@/components/tasks/TaskAttachments";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
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

  // Reactive task from store
  const activeTask = tasks.find((t) => t.id === task?.id) || task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');
  const [spaceId, setSpaceId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState("u1");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTask) {
      setTitle(activeTask.title || "");
      setDescription(activeTask.description || "");
      setStatus(activeTask.status || "todo");
      setPriority(activeTask.priority || "normal");
      setSpaceId(activeTask.spaceId || spaces[0]?.id || "");
      setAssigneeId(activeTask.assigneeId || "u1");
      setDueDate(activeTask.dueDate || "");
      setAttachments(activeTask.attachments || []);
    }
  }, [activeTask?.id, spaces]);

  // Scroll to bottom of comments when new comment is added
  useEffect(() => {
    if (open) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTask?.comments?.length, open]);

  if (!activeTask) return null;

  const isPinned = lineupTaskIds.includes(activeTask.id);
  const space = spaces.find((s) => s.id === spaceId);
  const assignee = users.find((u) => u.id === assigneeId);
  const currentSender = users.find((u) => u.id === selectedSenderId) || users[0];

  const handleSave = () => {
    updateTask(activeTask.id, {
      title,
      description,
      status,
      priority,
      spaceId,
      assigneeId,
      dueDate,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    onOpenChange(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const currentSubtasks = activeTask.subtasks || [];
    const updated = currentSubtasks.map((st) => 
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    updateTask(activeTask.id, { subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const currentSubtasks = activeTask.subtasks || [];
    const newSt = {
      id: "st-" + Date.now(),
      title: newSubtaskTitle.trim(),
      done: false,
    };
    updateTask(activeTask.id, { subtasks: [...currentSubtasks, newSt] });
    setNewSubtaskTitle("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const currentSubtasks = activeTask.subtasks || [];
    const updated = currentSubtasks.filter((st) => st.id !== subtaskId);
    updateTask(activeTask.id, { subtasks: updated });
  };

  const handleGenerateAI = async () => {
    if (!title.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_task_description",
          title: title.trim(),
        }),
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Add new comment
  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    addTaskComment(activeTask.id, {
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
    deleteTaskComment(activeTask.id, commentId);
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

  const completedSubtasks = (activeTask.subtasks || []).filter((st) => st.done).length;
  const totalSubtasks = (activeTask.subtasks || []).length;
  const commentsList = activeTask.comments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-card border-border text-foreground p-0 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header ClickUp Style */}
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {space && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: space.color }} />
                <span className="truncate max-w-[130px]">{space.name}</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              #{activeTask.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pin to Lineup */}
            <button
              onClick={() => {
                if (isPinned) {
                  removeFromLineup(activeTask.id);
                } else {
                  addToLineup(activeTask.id);
                }
              }}
              title={isPinned ? "Hapus dari Lineup" : "Sematkan ke Lineup"}
              className={`p-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                isPinned 
                  ? "bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/30" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Pin size={14} className={isPinned ? "fill-[#EE3726]" : ""} />
              <span className="hidden sm:inline">{isPinned ? "Lineup" : "Pin"}</span>
            </button>

            {/* Delete Task */}
            <button
              onClick={() => {
                if (confirm(language === 'en' ? "Delete this task?" : "Hapus tugas ini?")) {
                  deleteTask(activeTask.id);
                  onOpenChange(false);
                }
              }}
              title="Hapus Task"
              className="p-2 rounded-lg text-muted-foreground hover:text-[#EE3726] hover:bg-[#EE3726]/10 transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Two Columns on Desktop: Left = Task Details, Right = Collaborative Comments) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Column: Task Details, Fields, Attachments, Subtasks */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-5 max-h-[calc(92vh-135px)]">
            {/* Status & Priority Bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Selector */}
              <div className="flex items-center bg-secondary border border-border p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setStatus("todo")}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === "todo" 
                      ? "bg-slate-700 text-white shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  TO DO
                </button>
                <button
                  onClick={() => setStatus("in-progress")}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === "in-progress" 
                      ? "bg-[#EE3726] text-white shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  IN PROGRESS
                </button>
                <button
                  onClick={() => setStatus("done")}
                  className={`px-3 py-1 rounded-lg transition ${
                    status === "done" 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  COMPLETE
                </button>
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-1.5 bg-secondary border border-border px-2.5 py-1 rounded-xl text-xs">
                <Flag size={12} className="text-[#EE3726]" />
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
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                {language === 'en' ? 'Task Title' : 'Nama Tugas'}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base sm:text-lg font-bold text-foreground bg-secondary/40 border-border focus-visible:ring-[#EE3726] rounded-xl h-11"
                placeholder="Judul task..."
              />
            </div>

            {/* Properties Grid: Space, Assignee, Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border">
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
                    <option key={u.id} value={u.id}>{u.name}</option>
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
                  {language === 'en' ? 'Description' : 'Deskripsi & Catatan'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || !title.trim()}
                  className="text-xs text-[#EE3726] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>{language === 'en' ? 'AI Write' : 'Gemini AI Tulis Deskripsi'}</span>
                </button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={language === 'en' ? 'Add detailed specifications, checklist, or instructions...' : 'Tulis detail spesifikasi, petunjuk kerja, atau catatan...'}
                className="bg-secondary/40 border-border text-xs focus-visible:ring-[#EE3726] rounded-xl text-foreground"
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

            {/* Subtasks / Checklist Section (ClickUp Signature) */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo size={14} className="text-[#EE3726]" />
                  <span className="text-xs font-bold text-foreground">
                    Checklist & Subtasks
                  </span>
                  {totalSubtasks > 0 && (
                    <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.2 rounded font-bold text-muted-foreground">
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </div>
              </div>

              {/* Subtasks List */}
              {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-xl border border-border">
                  {activeTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-secondary transition group"
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
                  placeholder={language === 'en' ? "+ Add checklist item (press Enter)..." : "+ Tambah item checklist (tekan Enter)..."}
                  className="h-9 text-xs bg-secondary border-border focus-visible:ring-[#EE3726] rounded-xl"
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
          </div>

          {/* Right Column: Activity & Comments Feed (ClickUp Collaborative Hub) */}
          <div className="lg:col-span-5 bg-secondary/15 flex flex-col max-h-[calc(92vh-135px)] overflow-hidden">
            {/* Comments Header */}
            <div className="p-3.5 sm:p-4 border-b border-border bg-secondary/30 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>{t.taskCommentsTitle}</span>
                    <span className="text-[10px] font-semibold bg-[#EE3726]/15 text-[#EE3726] px-1.5 py-0.5 rounded-full border border-[#EE3726]/20">
                      {commentsList.length}
                    </span>
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    {t.taskCommentsSubtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment As Selector (Switch Team Member Persona) */}
            <div className="px-3.5 sm:px-4 py-2 border-b border-border bg-secondary/20 flex items-center justify-between gap-2 shrink-0">
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
                className="bg-card border border-border rounded-lg text-xs py-1 px-2 text-foreground font-semibold focus:outline-none focus:border-[#EE3726] max-w-[170px] truncate"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Comments Stream */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 min-h-[220px]">
              {commentsList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
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
                commentsList.map((comm) => {
                  const isCurrent = comm.senderId === selectedSenderId;
                  return (
                    <div
                      key={comm.id}
                      className="group relative flex items-start gap-2.5 p-2.5 rounded-xl bg-card border border-border/80 hover:border-border transition shadow-xs"
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
                        onClick={() => handleDeleteComment(comm.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#EE3726] p-1 transition rounded shrink-0 self-start"
                        title={t.deleteComment}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Composer Input */}
            <div className="p-3 sm:p-3.5 border-t border-border bg-secondary/30 shrink-0">
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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-secondary/40 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 px-4 rounded-xl border-border"
          >
            {t.modalCancel}
          </Button>
          <Button
            onClick={handleSave}
            className="text-xs h-9 px-5 font-bold bg-[#EE3726] hover:bg-[#D32717] text-white rounded-xl shadow-md shadow-[#EE3726]/20"
          >
            {language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
