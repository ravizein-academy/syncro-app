'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { TaskPriority, TaskStatus, TaskAttachment } from '../types';
import {
  X,
  Calendar,
  Clock,
  User,
  Folder,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  HardDrive,
  FileText,
  FileSpreadsheet,
  File,
  Send,
  ExternalLink,
  MessageSquare,
  Plus
} from 'lucide-react';

interface TaskModalProps {
  taskId: string;
  onClose: () => void;
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  const {
    tasks,
    users,
    spaces,
    currentUser,
    updateTask,
    deleteTask,
    toggleSubtask,
    addComment,
    addAttachment,
    removeAttachment,
    geminiApiKey
  } = useAppStore();

  const task = tasks.find((t) => t.id === taskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAiBreaking, setIsAiBreaking] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');

  // Attachments form state
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [attachType, setAttachType] = useState<'gdoc' | 'gsheet' | 'gdrive' | 'link' | 'image' | 'file'>('gdoc');
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  if (!task) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const currentSubtasks = task.subtasks || [];
    const newSub = {
      id: 'st-' + Math.random().toString(36).substring(2, 7),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    updateTask(task.id, { subtasks: [...currentSubtasks, newSub] });
    setNewSubtaskTitle('');
  };

  const handleAiBreakdown = async () => {
    setIsAiBreaking(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'breakdown',
          prompt: task.title,
          apiKey: geminiApiKey
        })
      });
      const data = await res.json();
      if (data.text) {
        try {
          const parsed = JSON.parse(data.text);
          if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
            const generatedSubs = parsed.subtasks.map((st: string) => ({
              id: 'st-ai-' + Math.random().toString(36).substring(2, 7),
              title: st,
              completed: false
            }));
            updateTask(task.id, {
              subtasks: [...(task.subtasks || []), ...generatedSubs],
              durationMinutes: parsed.durationMinutes || task.durationMinutes
            });
          }
        } catch {
          const lines = data.text.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('*'));
          if (lines.length > 0) {
            const generatedSubs = lines.map((l: string) => ({
              id: 'st-ai-' + Math.random().toString(36).substring(2, 7),
              title: l.replace(/^[-*]\s*/, ''),
              completed: false
            }));
            updateTask(task.id, { subtasks: [...(task.subtasks || []), ...generatedSubs] });
          }
        }
      }
    } catch (e: any) {
      alert(`Gagal memecah tugas: ${e.message}`);
    } finally {
      setIsAiBreaking(false);
    }
  };

  // Add Comment
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  // Add Attachment / Google Drive file
  const handleSaveAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachName.trim() || !attachUrl.trim()) {
      alert('Mohon isi nama file dan link URL file.');
      return;
    }

    const newAttachment: TaskAttachment = {
      id: 'att_' + Math.random().toString(36).substring(2, 8),
      name: attachName.trim(),
      url: attachUrl.trim(),
      type: attachType,
      uploadedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    };

    addAttachment(task.id, newAttachment);
    setAttachName('');
    setAttachUrl('');
    setShowAttachDialog(false);
  };

  // Helper for mock Google files
  const handlePresetGoogleFile = (presetType: 'gdoc' | 'gsheet' | 'gdrive') => {
    setAttachType(presetType);
    if (presetType === 'gdoc') {
      setAttachName('SOP Blueprint ITSEC Academy');
      setAttachUrl('https://docs.google.com/document/d/1dQnUXsAVCEgYP6H04v1iC5ZyKtJsgUY944kw1KxEQ24/edit');
    } else if (presetType === 'gsheet') {
      setAttachName('DNS Block List SOC Assessment');
      setAttachUrl('https://docs.google.com/spreadsheets/d/1SOC_Assessment_Sheet_ID/edit');
    } else {
      setAttachName('Folder Lampiran Google Drive');
      setAttachUrl('https://drive.google.com/drive/folders/Syncro');
    }
    setShowAttachDialog(true);
  };

  // Image file upload simulation via input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        addAttachment(task.id, {
          id: 'att_' + Math.random().toString(36).substring(2, 8),
          name: file.name,
          url: result,
          type: 'image',
          size: `${Math.round(file.size / 1024)} KB`,
          uploadedAt: 'Baru saja'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAttachmentIcon = (type: TaskAttachment['type']) => {
    switch (type) {
      case 'gdoc':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'gsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'gdrive':
        return <HardDrive className="w-4 h-4 text-amber-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-indigo-600" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-sky-600" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar - ClickUp Style */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            {/* Status Dropdown */}
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#ee3425] capitalize cursor-pointer shadow-2xs"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#ee3425] capitalize cursor-pointer shadow-2xs"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              onClick={() => {
                if (confirm('Yakin ingin menghapus tugas ini?')) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-[#ee3425] hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Hapus Tugas"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body - 2 Columns (ClickUp Layout: Left Details, Right Comments) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Details, Subtasks, Attachments */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-slate-100">
            {/* Task Title */}
            <div>
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                placeholder="Nama Tugas di Syncro..."
                className="w-full bg-transparent text-lg font-bold text-slate-900 placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-[#ee3425] pb-1"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              {/* Space */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Folder className="w-3 h-3 text-[#ee3425]" /> Space
                </span>
                <select
                  value={task.spaceId}
                  onChange={(e) => updateTask(task.id, { spaceId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-[#ee3425]" /> Assignee
                </span>
                <select
                  value={task.assignedTo || ''}
                  onChange={(e) => updateTask(task.id, { assignedTo: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-[#ee3425]" /> Jatuh Tempo
                </span>
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium"
                />
              </div>

              {/* Scheduled Time & Duration */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-[#ee3425]" /> Jadwal / Durasi
                </span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={task.scheduledTime || ''}
                    onChange={(e) => updateTask(task.id, { scheduledTime: e.target.value })}
                    placeholder="09:00"
                    className="w-16 bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-mono text-center text-xs font-medium"
                  />
                  <select
                    value={task.durationMinutes || 60}
                    onChange={(e) => updateTask(task.id, { durationMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-slate-800 text-xs font-medium"
                  >
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>1j</option>
                    <option value={90}>1.5j</option>
                    <option value={120}>2j</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Deskripsi & Catatan:</label>
              <textarea
                value={task.description}
                onChange={(e) => updateTask(task.id, { description: e.target.value })}
                placeholder="Tambahkan rincian tugas atau briefing..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425] leading-relaxed resize-none"
              />
            </div>

            {/* Checklist Subtasks */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#ee3425]" />
                  Checklist Subtasks ({(task.subtasks || []).filter((s) => s.completed).length}/
                  {(task.subtasks || []).length})
                </label>

                <button
                  type="button"
                  onClick={handleAiBreakdown}
                  disabled={isAiBreaking}
                  className="flex items-center gap-1 text-[11px] bg-red-50 text-[#ee3425] border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-100 transition cursor-pointer font-bold shadow-2xs"
                >
                  {isAiBreaking ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-[#ee3425]" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#ee3425]" />
                  )}
                  <span>{isAiBreaking ? 'Memproses AI...' : 'Pecah dengan Syncro AI'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {(task.subtasks || []).map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-[#ee3425] focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`flex-1 text-slate-800 ${
                        sub.completed ? 'line-through text-slate-400 font-normal' : 'font-medium'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="+ Tambah subtask langkah kerja..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425]"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                >
                  Tambah
                </button>
              </form>
            </div>

            {/* Attachments & Google Integration Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-[#ee3425]" />
                  Lampiran Berkas & Integrasi Google ({task.attachments?.length || 0})
                </label>

                {/* Quick Add Dropdown / Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Upload Image / File Input */}
                  <label className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md cursor-pointer transition font-medium">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handlePresetGoogleFile('gdoc')}
                    className="flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-md transition font-medium cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Docs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetGoogleFile('gsheet')}
                    className="flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md transition font-medium cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Sheets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttachType('link');
                      setAttachName('');
                      setAttachUrl('');
                      setShowAttachDialog(true);
                    }}
                    className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition font-medium cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Link</span>
                  </button>
                </div>
              </div>

              {/* Add Attachment Dialog / Input Form */}
              {showAttachDialog && (
                <form
                  onSubmit={handleSaveAttachment}
                  className="p-3 bg-red-50/50 border border-red-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {renderAttachmentIcon(attachType)}
                      Tambah Lampiran {attachType === 'gdoc' ? 'Google Docs' : attachType === 'gsheet' ? 'Google Sheets' : attachType === 'gdrive' ? 'Google Drive' : 'File / Link'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAttachDialog(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={attachName}
                      onChange={(e) => setAttachName(e.target.value)}
                      placeholder="Nama File / Judul Dokumen..."
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#ee3425]"
                    />
                    <input
                      type="url"
                      value={attachUrl}
                      onChange={(e) => setAttachUrl(e.target.value)}
                      placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#ee3425]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAttachDialog(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-[#ee3425] hover:bg-[#d6281a] text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-2xs"
                    >
                      Simpan Lampiran
                    </button>
                  </div>
                </form>
              )}

              {/* Attachments List */}
              <div className="space-y-2">
                {(task.attachments || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada gambar, file, atau tautan Google yang dilampirkan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(task.attachments || []).map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl group transition shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {att.type === 'image' && att.url.startsWith('data:image') ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                              {renderAttachmentIcon(att.type)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-slate-800 hover:text-[#ee3425] truncate block flex items-center gap-1"
                            >
                              <span className="truncate">{att.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </a>
                            <p className="text-[10px] text-slate-400">
                              {att.size ? `${att.size} • ` : ''}{att.uploadedAt}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(task.id, att.id)}
                          className="p-1 text-slate-400 hover:text-[#ee3425] rounded transition opacity-0 group-hover:opacity-100"
                          title="Hapus Lampiran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Comments Stream (ClickUp Style) */}
          <div className="w-full md:w-88 bg-slate-50 flex flex-col h-full border-t md:border-t-0 md:border-l border-slate-100">
            {/* Comments Header */}
            <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ee3425]" />
                Komentar & Diskusi Tim ({(task.comments || []).length})
              </h4>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {(task.comments || []).length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-slate-400">
                  <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">Belum ada komentar.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bagikan catatan, hasil review, atau update progres tugas di sini.
                  </p>
                </div>
              ) : (
                (task.comments || []).map((cmt) => (
                  <div key={cmt.id} className="flex items-start gap-2.5">
                    <img
                      src={cmt.userAvatar || currentUser.avatar}
                      alt={cmt.userName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {cmt.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {cmt.createdAt}
                        </span>
                      </div>
                      <div className="mt-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed shadow-2xs">
                        {cmt.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Box */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendComment} className="space-y-2">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis komentar atau instruksi untuk tim..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePresetGoogleFile('gdoc')}
                      title="Sematkan Google Doc ke Komentar"
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetGoogleFile('gsheet')}
                      title="Sematkan Google Sheet ke Komentar"
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAttachDialog(true)}
                      title="Sematkan Link / File"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="flex items-center gap-1 bg-[#ee3425] hover:bg-[#d6281a] disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <span>Kirim</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
