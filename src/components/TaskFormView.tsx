'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { TaskPriority, TaskStatus, TaskAttachment } from '../types';
import {
  ArrowLeft,
  Calendar,
  User,
  Folder,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  HardDrive,
  FileText,
  FileSpreadsheet,
  File,
  Send,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface TaskFormViewProps {
  taskId: string;
  onBack: () => void;
}

export function TaskFormView({ taskId, onBack }: TaskFormViewProps) {
  const {
    tasks,
    users,
    spaces,
    currentUser,
    updateTask,
    deleteTask,
    addComment,
    addAttachment,
    removeAttachment
  } = useAppStore();

  const task = tasks.find((t) => t.id === taskId);

  // Comments state
  const [commentText, setCommentText] = useState('');

  // Attachments form state
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [attachType, setAttachType] = useState<'gdoc' | 'gsheet' | 'gdrive' | 'link' | 'image' | 'file'>('gdoc');
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-700">Tugas tidak ditemukan atau telah dihapus.</p>
        <button
          onClick={onBack}
          className="mt-4 flex items-center gap-1.5 bg-[#ee3425] text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tugas</span>
        </button>
      </div>
    );
  }

  const space = spaces.find((s) => s.id === task.spaceId);

  // ─── Comment & Attachment Handlers ───────────────────────────────────
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

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
      case 'gdoc': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'gsheet': return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'gdrive': return <HardDrive className="w-4 h-4 text-amber-600" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-indigo-600" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-sky-600" />;
      default: return <File className="w-4 h-4 text-slate-500" />;
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Action & Breadcrumb Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-[#ee3425] text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Tugas</span>
          </button>

          <span className="text-slate-300">/</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {space && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: space.color || '#ee3425' }}
              />
            )}
            <span className="font-semibold text-slate-700">{space?.name || 'Workspace'}</span>
          </div>
        </div>

        {/* Status, Priority, Delete Controls */}
        <div className="flex items-center gap-2">
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

          <button
            onClick={() => {
              if (confirm('Yakin ingin menghapus tugas ini?')) {
                deleteTask(task.id);
                onBack();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-[#ee3425] hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Hapus Tugas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Single Form Body - 2-Column Integrated Layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50 p-6 gap-6">

        {/* Left Section: Form Details + Attachments */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white border border-slate-200 rounded-xl shadow-sm">

          {/* Task Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Judul Tugas
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              placeholder="Tuliskan nama tugas..."
              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xl font-bold text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-[#ee3425] rounded-xl px-4 py-2.5 focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Meta Properties Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {/* Space */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                <Folder className="w-3.5 h-3.5 text-[#ee3425]" /> Space / Ruang Kerja
              </span>
              <select
                value={task.spaceId}
                onChange={(e) => updateTask(task.id, { spaceId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-[#ee3425]"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-[#ee3425]" /> Ditugaskan Kepada
              </span>
              <select
                value={task.assignedTo || ''}
                onChange={(e) => updateTask(task.id, { assignedTo: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-[#ee3425]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.team})</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#ee3425]" /> Tanggal Jatuh Tempo
              </span>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#ee3425]"
              />
            </div>
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Deskripsi &amp; Catatan Teknis:
            </label>
            <textarea
              value={task.description}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              placeholder="Tuliskan catatan teknis, instruksi tugas, panduan atau referensi..."
              rows={4}
              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ee3425] leading-relaxed resize-none transition shadow-2xs"
            />
          </div>

          {/* Lampiran Berkas & Integrasi Google */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#ee3425]" />
                Lampiran Berkas &amp; Integrasi Google ({task.attachments?.length || 0})
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                <label className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer transition font-semibold">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Gambar</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => handlePresetGoogleFile('gdoc')}
                  className="flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Docs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetGoogleFile('gsheet')}
                  className="flex items-center gap-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer"
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
                  className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Link / File</span>
                </button>
              </div>
            </div>

            {/* Attachment Input Form (inline, no popup) */}
            {showAttachDialog && (
              <form
                onSubmit={handleSaveAttachment}
                className="p-3.5 bg-red-50/50 border border-red-200 rounded-xl space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {renderAttachmentIcon(attachType)}
                    Tambah Lampiran {attachType === 'gdoc' ? 'Google Docs' : attachType === 'gsheet' ? 'Google Sheets' : attachType === 'gdrive' ? 'Google Drive' : 'File / Link'}
                  </span>
                  <button type="button" onClick={() => setShowAttachDialog(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={attachName}
                    onChange={(e) => setAttachName(e.target.value)}
                    placeholder="Nama Berkas / Judul Dokumen..."
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#ee3425]"
                  />
                  <input
                    type="url"
                    value={attachUrl}
                    onChange={(e) => setAttachUrl(e.target.value)}
                    placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#ee3425]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachDialog(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                  >
                    Batal
                  </button>
                  <button type="submit" className="bg-[#ee3425] hover:bg-[#d6281a] text-white px-3.5 py-1 text-xs font-bold rounded-lg shadow-2xs">
                    Simpan Lampiran
                  </button>
                </div>
              </form>
            )}

            {/* Attachments Grid */}
            <div className="space-y-2">
              {(task.attachments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada gambar, berkas, atau tautan Google yang dilampirkan.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(task.attachments || []).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl group transition shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {att.type === 'image' && att.url.startsWith('data:image') ? (
                          <img src={att.url} alt={att.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
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
                          <p className="text-[10px] text-slate-400">{att.size ? `${att.size} • ` : ''}{att.uploadedAt}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(task.id, att.id)}
                        className="p-1.5 text-slate-400 hover:text-[#ee3425] rounded transition opacity-0 group-hover:opacity-100"
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

        {/* Right Section: Comments & Discussions */}
        <div className="w-full md:w-96 bg-white flex flex-col h-full border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#ee3425]" />
              Komentar &amp; Diskusi Tim ({(task.comments || []).length})
            </h4>
          </div>

          {/* Comments Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {(task.comments || []).length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-slate-400">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Belum ada komentar.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mulai diskusi, tinggalkan feedback, atau bagikan update terkait tugas ini.
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
                      <span className="text-xs font-bold text-slate-900 truncate">{cmt.userName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{cmt.createdAt}</span>
                    </div>
                    <div className="mt-1 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed shadow-2xs">
                      {cmt.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input Form */}
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <form onSubmit={handleSendComment} className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis komentar atau update tugas..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425] resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePresetGoogleFile('gdoc')}
                    title="Sematkan Google Doc"
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetGoogleFile('gsheet')}
                    title="Sematkan Google Sheet"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAttachDialog(true)}
                    title="Sematkan Link / Berkas"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="flex items-center gap-1 bg-[#ee3425] hover:bg-[#d6281a] disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
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
  );
}
