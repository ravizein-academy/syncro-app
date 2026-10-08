'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import {
  Sparkles,
  Send,
  FileText,
  ListTodo,
  HelpCircle,
  Copy,
  Check,
  Bot,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export function AiView() {
  const { tasks, users, spaces, geminiApiKey, addTask } = useAppStore();

  const [activeMode, setActiveMode] = useState<'standup' | 'breakdown' | 'knowledge'>('standup');
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerateStandup = async () => {
    setIsLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'standup',
          apiKey: geminiApiKey,
          context: { tasks, users }
        })
      });
      const data = await res.json();
      setAiResult(data.text || 'Tidak ada teks yang dihasilkan.');
    } catch (err: any) {
      setAiResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskBreakdown = async () => {
    if (!promptInput.trim()) return;
    setIsLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'breakdown',
          prompt: promptInput,
          apiKey: geminiApiKey
        })
      });
      const data = await res.json();
      setAiResult(data.text || 'Tidak ada output.');
    } catch (err: any) {
      setAiResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowledgeAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setIsLoading(true);
    setAiResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'knowledge',
          prompt: promptInput,
          apiKey: geminiApiKey,
          context: { tasks, users, spaces }
        })
      });
      const data = await res.json();
      setAiResult(data.text || 'Tidak ada output.');
    } catch (err: any) {
      setAiResult(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTaskFromBreakdown = () => {
    try {
      const parsed = JSON.parse(aiResult);
      if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
        addTask({
          title: promptInput || 'Tugas Hasil Ekstraksi AI Syncro',
          durationMinutes: parsed.durationMinutes || 60,
          subtasks: parsed.subtasks.map((st: string, idx: number) => ({
            id: `st-ai-${idx}`,
            title: st,
            completed: false
          }))
        });
        alert('Tugas dan subtasks berhasil dibuat ke dalam daftar tugas Syncro!');
      }
    } catch (e) {
      alert('Teks belum dalam format JSON subtask.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ee3425] flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Syncro AI Brain
                <span className="text-[10px] bg-red-50 text-[#ee3425] border border-red-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pusat AI untuk otomatisasi rangkuman standup, ekstraksi subtask, dan knowledge manager Syncro.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              setActiveMode('standup');
              setAiResult('');
            }}
            className={`p-4 rounded-xl border text-left transition cursor-pointer shadow-xs ${
              activeMode === 'standup'
                ? 'bg-red-50/70 border-[#ee3425] text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#ee3425] mb-1">
              <FileText className="w-4 h-4" />
              <span>Standup & Status Writer</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Rangkum otomatis tugas Selesai, In Progress, dan Blocker hari ini.
            </p>
          </button>

          <button
            onClick={() => {
              setActiveMode('breakdown');
              setAiResult('');
            }}
            className={`p-4 rounded-xl border text-left transition cursor-pointer shadow-xs ${
              activeMode === 'breakdown'
                ? 'bg-red-50/70 border-[#ee3425] text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#ee3425] mb-1">
              <ListTodo className="w-4 h-4" />
              <span>Task Breakdown Generator</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pecah ide/proyek besar menjadi checklist subtask siap eksekusi.
            </p>
          </button>

          <button
            onClick={() => {
              setActiveMode('knowledge');
              setAiResult('');
            }}
            className={`p-4 rounded-xl border text-left transition cursor-pointer shadow-xs ${
              activeMode === 'knowledge'
                ? 'bg-red-50/70 border-[#ee3425] text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-[#ee3425] mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Knowledge Manager Q&A</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tanyakan seputar beban kerja tim, progress sprint, dan detail SOP.
            </p>
          </button>
        </div>

        {/* Input / Trigger Area */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          {activeMode === 'standup' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-700">
                Gemini AI akan memindai seluruh tugas di workspace Syncro ({tasks.length} tugas) dan merangkum status harian secara instan.
              </p>
              <button
                onClick={handleGenerateStandup}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#ee3425] hover:bg-[#d6281a] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer disabled:opacity-50 shadow-sm shadow-red-500/20"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isLoading ? 'Sedang Memproses...' : 'Buat Laporan Standup Sekarang'}</span>
              </button>
            </div>
          ) : activeMode === 'breakdown' ? (
            <div className="space-y-3">
              <label className="text-xs text-slate-800 font-bold">
                Tulis Judul Tugas atau Proyek yang Ingin Dipecah:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Contoh: Implementasi SSO Google Workspace & Auth Guard di Syncro"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425]"
                />
                <button
                  onClick={handleTaskBreakdown}
                  disabled={isLoading || !promptInput.trim()}
                  className="bg-[#ee3425] hover:bg-[#d6281a] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-red-500/20"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Pecah Tugas</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleKnowledgeAsk} className="space-y-3">
              <label className="text-xs text-slate-800 font-bold">
                Tanyakan apa saja seputar tugas dan ruang kerja Syncro:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Contoh: Siapa yang memegang tugas prioritas urgent dan berapa beban kerjanya?"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !promptInput.trim()}
                  className="bg-[#ee3425] hover:bg-[#d6281a] text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-red-500/20"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Tanya</span>
                </button>
              </div>
            </form>
          )}

          {/* AI Output Result Box */}
          {aiResult && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ee3425]">
                  <Bot className="w-4 h-4" />
                  <span>Hasil Analisis Syncro AI</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeMode === 'breakdown' && aiResult.includes('subtasks') && (
                    <button
                      onClick={handleCreateTaskFromBreakdown}
                      className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md hover:bg-emerald-100 cursor-pointer font-semibold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Buat Tugas ke Syncro</span>
                    </button>
                  )}
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11px] bg-white text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                {aiResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
