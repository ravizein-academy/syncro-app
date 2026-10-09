"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  BrainCircuit, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AIPage() {
  const { tasks, addTask } = useStore();
  const [activeTab, setActiveTab] = useState<"knowledge" | "standup" | "agent">("knowledge");

  // Knowledge Manager State
  const [question, setQuestion] = useState("");
  const [knowledgeAnswer, setKnowledgeAnswer] = useState("");
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);

  // Standup Writer State
  const [standupReport, setStandupReport] = useState("");
  const [isStandupLoading, setIsStandupLoading] = useState(false);

  // Super Agent State
  const [meetingNotes, setMeetingNotes] = useState(
    "Diskusi rapat jam 10 pagi:\n- Budi perlu membuat endpoint autentikasi Google SSO hari ini.\n- Sarah akan menyelesaikan dokumen SOP untuk deployment Vercel.\n- Alex diminta memperbaiki padding pada tampilan mobile Planner sebelum Jumat."
  );
  const [extractedActions, setExtractedActions] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsKnowledgeLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "knowledge",
          prompt: question,
          context: `Daftar tugas Syncro saat ini: ${JSON.stringify(tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority })))}`,
        }),
      });
      const data = await res.json();
      setKnowledgeAnswer(data.result || "Tidak ada respon.");
    } catch (err) {
      setKnowledgeAnswer("Terjadi kesalahan saat memproses pertanyaan.");
    } finally {
      setIsKnowledgeLoading(false);
    }
  };

  const handleGenerateStandup = async () => {
    setIsStandupLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "standup",
          tasks: tasks,
        }),
      });
      const data = await res.json();
      setStandupReport(data.result || "");
    } catch (err) {
      setStandupReport("Gagal membuat laporan standup.");
    } finally {
      setIsStandupLoading(false);
    }
  };

  const handleExtractActions = async () => {
    if (!meetingNotes.trim()) return;
    setIsAgentLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "agent",
          notes: meetingNotes,
        }),
      });
      const data = await res.json();
      setExtractedActions(data.result || "");
    } catch (err) {
      setExtractedActions("Gagal mengekstrak action items.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Sparkles className="text-blue-400" />
            Gemini AI Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kecerdasan buatan terintegrasi untuk Knowledge Management, Content Writing, dan Super Agents.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "knowledge" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen size={14} />
            <span>Knowledge Manager</span>
          </button>
          <button
            onClick={() => setActiveTab("standup")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "standup" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText size={14} />
            <span>Content Writer</span>
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "agent" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BrainCircuit size={14} />
            <span>Super Agent</span>
          </button>
        </div>
      </div>

      {/* Feature 1: Knowledge Manager */}
      {activeTab === "knowledge" && (
        <Card className="bg-slate-900/90 border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="text-blue-400" size={18} />
              Knowledge Manager
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Tanyakan apapun seputar status proyek, rincian tugas yang sedang berjalan, atau konteks tim.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAskKnowledge} className="flex gap-2">
              <Input
                placeholder="e.g. Apa saja tugas berprioritas tinggi yang belum selesai minggu ini?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-11 text-slate-200"
              />
              <Button type="submit" disabled={isKnowledgeLoading} className="bg-blue-600 hover:bg-blue-500 h-11 px-5">
                {isKnowledgeLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </form>

            {knowledgeAnswer && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Sparkles size={13} />
                    Jawaban Gemini AI
                  </span>
                  <button
                    onClick={() => handleCopy(knowledgeAnswer)}
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1">
                  {knowledgeAnswer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature 2: Content & Project Writer */}
      {activeTab === "standup" && (
        <Card className="bg-slate-900/90 border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="text-indigo-400" size={18} />
              Content & Project Writer (Standup Generator)
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Kompilasikan status tugas terkini secara otomatis menjadi ringkasan laporan standup harian atau draft SOP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Generate Standup Report Otomatis</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI akan membaca {tasks.length} tugas yang ada di store untuk menyusun format 3 poin standar tim.
                </p>
              </div>
              <Button
                onClick={handleGenerateStandup}
                disabled={isStandupLoading}
                className="bg-blue-600 hover:bg-blue-500 text-xs h-9 gap-1.5"
              >
                {isStandupLoading && <Loader2 size={14} className="animate-spin" />}
                <Sparkles size={14} />
                <span>Buat Laporan Sekarang</span>
              </Button>
            </div>

            {standupReport && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Hasil Draf Standup
                  </span>
                  <button
                    onClick={() => handleCopy(standupReport)}
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Tersalin" : "Salin Laporan"}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono pt-1">
                  {standupReport}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature 3: Super Agent (Brain) */}
      {activeTab === "agent" && (
        <Card className="bg-slate-900/90 border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="text-emerald-400" size={18} />
              Super Agents (Brain) - Action Item Extractor
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Tempel catatan rapat mentah atau risalah obrolan, dan AI akan otomatis mengekstrak daftar to-do terstruktur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Catatan Rapat / Diskusi Mentah</label>
              <textarea
                rows={5}
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <Button
              onClick={handleExtractActions}
              disabled={isAgentLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-xs h-9 gap-1.5"
            >
              {isAgentLoading && <Loader2 size={14} className="animate-spin" />}
              <Sparkles size={14} />
              <span>Ekstrak Action Items dengan Gemini</span>
            </Button>

            {extractedActions && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Daftar Action Items Terdeteksi
                  </span>
                  <button
                    onClick={() => handleCopy(extractedActions)}
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Tersalin" : "Salin To-Do"}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 font-mono">
                  {extractedActions}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
