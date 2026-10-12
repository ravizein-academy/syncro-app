"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore, User } from "@/store/useStore";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  Sparkles, 
  UserCheck, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { triggerDebouncedAutoSync, performAutoCloudSync } from "@/lib/sync";

function DirectMessagesContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const { 
    dmThreads, 
    users, 
    currentUser, 
    createOrSelectDMThread, 
    sendDMMessage, 
    language 
  } = useStore();

  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // All teammates in workspace except current user
  const teammates = useMemo(() => {
    return users.filter(
      (u) => u.id !== currentUser?.id && u.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
    );
  }, [users, currentUser]);

  // Filtered teammates by search
  const filteredTeammates = useMemo(() => {
    if (!searchQuery.trim()) return teammates;
    const q = searchQuery.toLowerCase().trim();
    return teammates.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q)
    );
  }, [teammates, searchQuery]);

  // Handle URL query parameter ?userId=... to auto-open conversation
  useEffect(() => {
    if (targetUserId) {
      const targetUser = users.find((u) => u.id === targetUserId);
      if (targetUser) {
        const threadId = createOrSelectDMThread(targetUser);
        setSelectedThreadId(threadId);
      }
    } else if (!selectedThreadId && dmThreads.length > 0) {
      setSelectedThreadId(dmThreads[0].id);
    }
  }, [targetUserId, users, dmThreads, selectedThreadId, createOrSelectDMThread]);

  const currentThread = dmThreads.find((dm) => dm.id === selectedThreadId);

  const handleStartChatWithUser = (user: User) => {
    const threadId = createOrSelectDMThread(user);
    setSelectedThreadId(threadId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentThread) return;

    sendDMMessage(currentThread.id, {
      senderId: currentUser?.id || "u_curr",
      senderName: currentUser?.name || "User",
      text: inputText.trim(),
    });

    setInputText("");

    // Trigger cloud synchronization so messages reach other team members
    triggerDebouncedAutoSync(1000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none transition-colors duration-200">
      {/* Sidebar: Teammates & Threads */}
      <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">Pesan Tim (DM)</h2>
              <span className="text-[10px] text-muted-foreground">Komunikasi 1-on-1 Workspace</span>
            </div>
          </div>
          <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-full text-foreground font-mono font-semibold">
            {teammates.length} Anggota
          </span>
        </div>

        {/* Search Teammates */}
        <div className="p-3 border-b border-border bg-secondary/30">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email rekan..."
              className="pl-8 h-8 text-xs bg-card border-border rounded-lg"
            />
          </div>
        </div>

        {/* Teammates List & Active Conversations */}
        <div className="p-2 space-y-4 overflow-y-auto flex-1">
          {/* Active Conversations Section */}
          {dmThreads.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Percakapan Aktif ({dmThreads.length})
              </div>
              {dmThreads.map((thread) => {
                const isActive = thread.id === currentThread?.id;
                const lastMsg = thread.messages[thread.messages.length - 1];
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition text-xs font-semibold ${
                      isActive
                        ? "bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/30 shadow-xs"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center font-bold text-xs text-white shadow shrink-0">
                      {thread.participantName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{thread.participantName}</span>
                        {lastMsg && (
                          <span className="text-[9px] text-muted-foreground font-normal">{lastMsg.timestamp}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate font-normal mt-0.5">
                        {lastMsg ? lastMsg.text : "Belum ada pesan"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* All Team Members Section */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Rekan Tim di Workspace ({filteredTeammates.length})</span>
            </div>
            {filteredTeammates.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Tidak ada anggota yang cocok dengan pencarian.
              </div>
            ) : (
              filteredTeammates.map((teammate) => {
                const existingThread = dmThreads.find(
                  (t) => t.participantId === teammate.id || (teammate.email && t.participantEmail === teammate.email)
                );
                const isActive = existingThread?.id === currentThread?.id;

                return (
                  <button
                    key={teammate.id}
                    onClick={() => handleStartChatWithUser(teammate)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition text-xs ${
                      isActive
                        ? "bg-[#EE3726]/15 text-[#EE3726] border border-[#EE3726]/30 shadow-xs font-bold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                        {teammate.avatar || teammate.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate min-w-0">
                        <div className="font-bold text-foreground truncate">{teammate.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{teammate.email}</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      {teammate.department || "Tim"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      {currentThread ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Active Conversation Top Bar */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center font-bold text-xs text-white shadow ring-2 ring-[#EE3726]/30">
                {currentThread.participantName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{currentThread.participantName}</span>
                  {currentThread.participantEmail && (
                    <span className="text-[10px] font-normal text-muted-foreground">({currentThread.participantEmail})</span>
                  )}
                </h3>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Terhubung di Workspace
                </span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#EE3726]" />
              <span>Percakapan Tim Syncro</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {currentThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 max-w-sm mx-auto">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-[#EE3726]">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Mulai Percakapan Baru</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kirim pesan pertama Anda kepada <strong>{currentThread.participantName}</strong> untuk berdiskusi tentang tugas, ide, atau proyek.
                  </p>
                </div>
              </div>
            ) : (
              currentThread.messages.map((msg) => {
                const isMe = 
                  (currentUser && msg.senderId === currentUser.id) || 
                  (currentUser && msg.senderName === currentUser.name) ||
                  (currentUser?.email && msg.senderId === currentUser.email);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isMe 
                          ? "bg-[#EE3726] text-white shadow ring-2 ring-[#EE3726]/30" 
                          : "bg-secondary text-foreground border border-border"
                      }`}
                    >
                      {msg.senderName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`max-w-lg ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`mt-1 text-xs p-3.5 rounded-2xl shadow-sm leading-relaxed ${
                          isMe
                            ? "bg-[#EE3726] text-white rounded-tr-none"
                            : "bg-card text-foreground border border-border rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Chat */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
            <Input
              placeholder={`Tulis pesan untuk ${currentThread.participantName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-secondary border-border text-xs h-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#EE3726] rounded-xl"
            />
            <Button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-[#EE3726] hover:bg-[#D32717] text-white h-11 px-5 rounded-xl shadow-md transition-all font-semibold flex items-center gap-1.5"
            >
              <span>Kirim</span>
              <Send size={14} />
            </Button>
          </form>
        </div>
      ) : (
        /* Empty State when no conversation selected */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
          <div className="max-w-md mx-auto space-y-6">
            <div className="h-16 w-16 rounded-3xl bg-[#EE3726]/10 text-[#EE3726] flex items-center justify-center mx-auto shadow-inner">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                Pusat Komunikasi Tim Syncro
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Pilih rekan tim dari panel sebelah kiri atau klik salah satu rekan di bawah ini untuk langsung memulai percakapan 1-on-1.
              </p>
            </div>

            {/* Quick Teammate Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {teammates.slice(0, 4).map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleStartChatWithUser(member)}
                  className="p-3 rounded-xl bg-card border border-border hover:border-[#EE3726] hover:shadow-md transition text-left flex items-center gap-3 group"
                >
                  <div className="h-9 w-9 rounded-full bg-secondary border border-border group-hover:border-[#EE3726]/50 flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                    {member.avatar || member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <span className="font-bold text-xs text-foreground block truncate group-hover:text-[#EE3726] transition">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {member.department || "Anggota Tim"}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-[#EE3726] transition shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Memuat obrolan tim...</div>}>
      <DirectMessagesContent />
    </Suspense>
  );
}
