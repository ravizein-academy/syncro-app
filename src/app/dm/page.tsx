"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore, User, DirectMessageThread } from "@/store/useStore";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  ShieldCheck,
  ArrowRight,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerDebouncedAutoSync } from "@/lib/sync";

function DirectMessagesContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const { 
    dmThreads, 
    users, 
    currentUser, 
    createOrSelectDMThread, 
    sendDMMessage, 
    deleteDMMessage,
    deleteDMThread,
  } = useStore();

  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // All teammates in workspace except current user
  const teammates = useMemo(() => {
    return users.filter(
      (u) => u.id !== currentUser?.id && u.email?.toLowerCase().trim() !== currentUser?.email?.toLowerCase().trim()
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

  // Filter percakapan aktif yang melibatkan akun saya
  const myActiveThreads = useMemo(() => {
    const myEmail = currentUser?.email?.toLowerCase().trim();
    const myId = currentUser?.id;
    if (!myEmail && !myId) return dmThreads;
    return dmThreads.filter((t) => {
      const inEmails = t.participantEmails && t.participantEmails.some((e) => e.toLowerCase().trim() === myEmail);
      const inPartEmail = t.participantEmail && t.participantEmail.toLowerCase().trim() === myEmail;
      const inPartId = t.participantId && t.participantId === myId;
      const inMessages = (t.messages || []).some(
        (m) =>
          (m.senderEmail && m.senderEmail.toLowerCase().trim() === myEmail) ||
          (m.senderId && m.senderId === myId)
      );
      const inId = myEmail ? t.id.includes(myEmail.replace(/[^a-zA-Z0-9]/g, '_')) : false;
      return inEmails || inPartEmail || inPartId || inMessages || inId;
    });
  }, [dmThreads, currentUser]);

  // Handle URL query parameter ?userId=... to auto-open conversation
  useEffect(() => {
    if (targetUserId) {
      const targetUser = users.find((u) => u.id === targetUserId);
      if (targetUser) {
        const threadId = createOrSelectDMThread(targetUser);
        setSelectedThreadId(threadId);
      }
    } else if (!selectedThreadId && myActiveThreads.length > 0) {
      setSelectedThreadId(myActiveThreads[0].id);
    }
  }, [targetUserId, users, myActiveThreads, selectedThreadId, createOrSelectDMThread]);

  const currentThread = dmThreads.find((dm) => dm.id === selectedThreadId);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentThread?.messages?.length, selectedThreadId]);

  // Helper untuk menentukan identitas lawan bicara secara tepat
  const getThreadPartner = (thread: DirectMessageThread) => {
    const myEmail = currentUser?.email?.toLowerCase().trim();
    const myId = currentUser?.id;

    // 1. Cek apakah thread.participantEmail adalah rekan (bukan diri saya)
    const isParticipantOther =
      (thread.participantEmail && thread.participantEmail.toLowerCase().trim() !== myEmail) ||
      (thread.participantId && thread.participantId !== myId);

    if (isParticipantOther && thread.participantName) {
      return {
        name: thread.participantName,
        email: thread.participantEmail || "",
        avatar: thread.participantName.substring(0, 2).toUpperCase(),
      };
    }

    // 2. Cek dari pesan-pesan: cari pesan yang dikirim oleh rekan
    const otherMsg = (thread.messages || []).find(
      (m) =>
        (m.senderEmail && m.senderEmail.toLowerCase().trim() !== myEmail) ||
        (m.senderId && m.senderId !== myId)
    );
    if (otherMsg) {
      const foundUser = users.find(
        (u) =>
          (otherMsg.senderEmail && u.email?.toLowerCase().trim() === otherMsg.senderEmail.toLowerCase().trim()) ||
          u.id === otherMsg.senderId
      );
      if (foundUser) {
        return {
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar || foundUser.name.substring(0, 2).toUpperCase(),
        };
      }
      return {
        name: otherMsg.senderName || "Rekan Tim",
        email: otherMsg.senderEmail || "",
        avatar: (otherMsg.senderName || "Rekan").substring(0, 2).toUpperCase(),
      };
    }

    // 3. Cek dari participantEmails array
    if (thread.participantEmails && thread.participantEmails.length > 0) {
      const counterpartEmail = thread.participantEmails.find(
        (em) => em.toLowerCase().trim() !== myEmail
      );
      if (counterpartEmail) {
        const foundUser = users.find(
          (u) => u.email?.toLowerCase().trim() === counterpartEmail.toLowerCase().trim()
        );
        if (foundUser) {
          return {
            name: foundUser.name,
            email: foundUser.email,
            avatar: foundUser.avatar || foundUser.name.substring(0, 2).toUpperCase(),
          };
        }
        return {
          name: counterpartEmail.split("@")[0],
          email: counterpartEmail,
          avatar: counterpartEmail.substring(0, 2).toUpperCase(),
        };
      }
    }

    return {
      name: thread.participantName || "Rekan Tim",
      email: thread.participantEmail || "",
      avatar: (thread.participantName || "RT").substring(0, 2).toUpperCase(),
    };
  };

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
      senderEmail: currentUser?.email || "",
      text: inputText.trim(),
    });

    setInputText("");
    triggerDebouncedAutoSync(1000);
  };

  const handleDeleteSingleMessage = (messageId: string) => {
    if (!currentThread) return;
    deleteDMMessage(currentThread.id, messageId);
    setDeletingMsgId(null);
    triggerDebouncedAutoSync(1000);
  };

  const handleDeleteEntireThread = () => {
    if (!currentThread) return;
    deleteDMThread(currentThread.id);
    setShowClearConfirm(false);
    setSelectedThreadId("");
    triggerDebouncedAutoSync(1000);
  };

  const currentPartner = currentThread ? getThreadPartner(currentThread) : null;

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
          {myActiveThreads.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Percakapan Aktif ({myActiveThreads.length})
              </div>
              {myActiveThreads.map((thread) => {
                const partner = getThreadPartner(thread);
                const isActive = thread.id === currentThread?.id;
                const lastMsg = thread.messages && thread.messages.length > 0
                  ? thread.messages[thread.messages.length - 1]
                  : null;
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
                      {partner.avatar}
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{partner.name}</span>
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
                  (t) =>
                    t.participantId === teammate.id ||
                    (teammate.email && t.participantEmail?.toLowerCase().trim() === teammate.email.toLowerCase().trim()) ||
                    (t.participantEmails && teammate.email && t.participantEmails.includes(teammate.email.toLowerCase().trim()))
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
      {currentThread && currentPartner ? (
        <div className="flex-1 flex flex-col bg-background relative">
          {/* Active Conversation Top Bar */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EE3726] to-[#BA1E10] flex items-center justify-center font-bold text-xs text-white shadow ring-2 ring-[#EE3726]/30">
                {currentPartner.avatar}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{currentPartner.name}</span>
                  {currentPartner.email && (
                    <span className="text-[10px] font-normal text-muted-foreground">({currentPartner.email})</span>
                  )}
                </h3>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Terhubung di Workspace
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex text-[11px] text-muted-foreground items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#EE3726]" />
                <span>Percakapan Tim Syncro</span>
              </div>
              {/* Tombol Hapus Seluruh Obrolan */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                title="Hapus Seluruh Obrolan"
              >
                <Trash2 size={13} />
                <span>Hapus Obrolan</span>
              </button>
            </div>
          </div>

          {/* Banner Konfirmasi Hapus Seluruh Obrolan */}
          {showClearConfirm && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between transition-all">
              <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                <AlertTriangle size={15} />
                <span>Yakin ingin menghapus seluruh riwayat percakapan dengan <strong>{currentPartner.name}</strong>?</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteEntireThread}
                  className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Ya, Hapus
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowClearConfirm(false)}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

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
                    Kirim pesan pertama Anda kepada <strong>{currentPartner.name}</strong> untuk berdiskusi tentang tugas, ide, atau proyek.
                  </p>
                </div>
              </div>
            ) : (
              currentThread.messages.map((msg) => {
                const isMe = 
                  (currentUser?.email && msg.senderEmail && msg.senderEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
                  (currentUser?.id && msg.senderId === currentUser.id) || 
                  (currentUser?.name && msg.senderName === currentUser.name);

                const canDelete = isMe || currentUser?.role === "admin";
                const isDeleting = deletingMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 group relative ${isMe ? "flex-row-reverse" : "flex-row"}`}
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
                    <div className={`max-w-lg ${isMe ? "items-end" : "items-start"} flex flex-col relative`}>
                      <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                        {/* Tombol Hapus Pesan yang Langsung Terlihat */}
                        {canDelete && !isDeleting && (
                          <button
                            onClick={() => setDeletingMsgId(msg.id)}
                            className="text-muted-foreground hover:text-red-500 p-0.5 rounded transition flex items-center gap-0.5"
                            title="Hapus pesan ini"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      
                      <div className={`mt-1 flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <div
                          className={`text-xs p-3.5 rounded-2xl shadow-sm leading-relaxed ${
                            isMe
                              ? "bg-[#EE3726] text-white rounded-tr-none"
                              : "bg-card text-foreground border border-border rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>

                        {/* Konfirmasi Hapus Pesan Individu */}
                        {canDelete && isDeleting && (
                          <div className="flex items-center gap-1.5 bg-background border border-red-500/30 shadow-md px-2 py-1 rounded-xl text-[10px] animate-in fade-in zoom-in-95 duration-150">
                            <span className="text-red-500 font-semibold">Hapus?</span>
                            <button
                              onClick={() => handleDeleteSingleMessage(msg.id)}
                              className="text-white bg-red-600 hover:bg-red-700 font-bold px-1.5 py-0.5 rounded-md"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeletingMsgId(null)}
                              className="text-muted-foreground hover:text-foreground px-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Chat */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
            <Input
              placeholder={`Tulis pesan untuk ${currentPartner.name}...`}
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
