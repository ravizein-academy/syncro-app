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
  Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { translations } from "@/lib/i18n";

export default function AIPage() {
  const { tasks, language } = useStore();
  const t = translations[language || 'id'];

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
    language === 'en'
      ? "Team sync discussion at 10 AM:\n- Budi needs to implement Google SSO authentication endpoint today.\n- Sarah will finalize the SOP documentation for Vercel deployment.\n- Alex should polish the padding on the mobile Planner calendar before Friday."
      : "Diskusi rapat jam 10 pagi:\n- Budi perlu membuat endpoint autentikasi Google SSO hari ini.\n- Sarah akan menyelesaikan dokumen SOP untuk deployment Vercel.\n- Alex diminta memperbaiki padding pada tampilan mobile Planner sebelum Jumat."
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
      setKnowledgeAnswer(data.result || (language === 'en' ? "No response received." : "Tidak ada respon."));
    } catch (err) {
      setKnowledgeAnswer(language === 'en' ? "An error occurred while contacting Gemini AI." : "Terjadi kesalahan saat memproses pertanyaan.");
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
      setStandupReport(language === 'en' ? "Failed to generate standup report." : "Gagal membuat laporan standup.");
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
      setExtractedActions(language === 'en' ? "Failed to extract action items." : "Gagal mengekstrak action items.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 space-y-6 max-w-6xl mx-auto select-none transition-colors duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#EE3726] shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EE3726]">{t.aiTag}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3 mt-1">
            <Sparkles className="text-[#EE3726]" />
            {t.aiTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t.aiSubtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-secondary border border-border p-1 rounded-xl shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "knowledge" ? "bg-[#EE3726] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={14} />
            <span>{t.tabKnowledge}</span>
          </button>
          <button
            onClick={() => setActiveTab("standup")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "standup" ? "bg-[#EE3726] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={14} />
            <span>{t.tabStandup}</span>
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === "agent" ? "bg-[#EE3726] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BrainCircuit size={14} />
            <span>{t.tabAgent}</span>
          </button>
        </div>
      </div>

      {/* Feature 1: Knowledge Manager */}
      {activeTab === "knowledge" && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="text-rose-500" size={18} />
              {t.tabKnowledge}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t.knowledgeDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAskKnowledge} className="flex gap-2">
              <Input
                placeholder={t.knowledgePlaceholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-secondary border-border text-xs h-11 text-foreground focus-visible:ring-rose-500 rounded-xl"
              />
              <Button type="submit" disabled={isKnowledgeLoading} className="bg-rose-600 hover:bg-rose-500 text-white h-11 px-5 rounded-xl shadow-md">
                {isKnowledgeLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </form>

            {knowledgeAnswer && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <Sparkles size={13} />
                    {t.aiAnswerLabel}
                  </span>
                  <button
                    onClick={() => handleCopy(knowledgeAnswer)}
                    className="hover:text-foreground transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                  </button>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed pt-1">
                  {knowledgeAnswer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature 2: Standup Writer */}
      {activeTab === "standup" && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <FileText className="text-rose-500" size={18} />
              {t.tabStandup}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t.standupDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateStandup}
              disabled={isStandupLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-10 px-5 gap-2 rounded-xl shadow-md"
            >
              {isStandupLoading && <Loader2 size={14} className="animate-spin" />}
              <Sparkles size={14} />
              <span>{t.generateStandupBtn}</span>
            </Button>

            {standupReport && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                  <span className="font-semibold text-foreground">Format Daily Standup</span>
                  <button
                    onClick={() => handleCopy(standupReport)}
                    className="hover:text-foreground transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-mono pt-1">
                  {standupReport}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature 3: Super Agent */}
      {activeTab === "agent" && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BrainCircuit className="text-rose-500" size={18} />
              {t.tabAgent}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t.superAgentDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Catatan Rapat / Notulensi:</label>
              <textarea
                rows={4}
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full rounded-xl bg-secondary border border-border p-3 text-xs text-foreground focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
              />
            </div>

            <Button
              onClick={handleExtractActions}
              disabled={isAgentLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs h-10 px-5 gap-2 rounded-xl shadow-md"
            >
              {isAgentLoading && <Loader2 size={14} className="animate-spin" />}
              <Sparkles size={14} />
              <span>{t.extractActionsBtn}</span>
            </Button>

            {extractedActions && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                  <span className="font-semibold text-foreground">Action Items Terstruktur</span>
                  <button
                    onClick={() => handleCopy(extractedActions)}
                    className="hover:text-foreground transition flex items-center gap-1"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed pt-1">
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
