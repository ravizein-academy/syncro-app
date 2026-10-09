"use client";

import React, { useState, useEffect } from "react";
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
  ListTodo
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { spaces, users, updateTask, deleteTask, lineupTaskIds, addToLineup, removeFromLineup, language } = useStore();
  const t = translations[language || "id"];

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
  }, [task, spaces]);

  if (!task) return null;

  const isPinned = lineupTaskIds.includes(task.id);
  const space = spaces.find((s) => s.id === spaceId);
  const assignee = users.find((u) => u.id === assigneeId);

  const handleSave = () => {
    updateTask(task.id, {
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

  const completedSubtasks = (task.subtasks || []).filter((st) => st.done).length;
  const totalSubtasks = (task.subtasks || []).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground p-0 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header ClickUp Style */}
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {space && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary border border-border">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: space.color }} />
                <span className="truncate max-w-[130px]">{space.name}</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              #{task.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pin to Lineup */}
            <button
              onClick={() => {
                if (isPinned) {
                  removeFromLineup(task.id);
                } else {
                  addToLineup(task.id);
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
                  deleteTask(task.id);
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
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
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-xl border border-border">
                {task.subtasks.map((st) => (
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-secondary/40 flex items-center justify-end gap-2.5">
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
