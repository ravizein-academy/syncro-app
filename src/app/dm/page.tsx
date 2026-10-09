"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DirectMessagesPage() {
  const { dmThreads, sendDMMessage } = useStore();
  const [selectedThreadId, setSelectedThreadId] = useState<string>(dmThreads[0]?.id || "");
  const [inputText, setInputText] = useState("");

  const currentThread = dmThreads.find((dm) => dm.id === selectedThreadId) || dmThreads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentThread) return;

    sendDMMessage(currentThread.id, {
      senderId: "u1",
      senderName: "Ravi Zein",
      text: inputText,
    });

    setInputText("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none">
      {/* DM List Sidebar */}
      <div className="w-72 bg-[#0c0d12] border-r border-[#1e2029] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1e2029] flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <MessageSquare className="text-rose-500" size={18} />
            Direct Messages
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">1-on-1</span>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {dmThreads.map((thread) => {
            const isActive = thread.id === currentThread?.id;
            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition text-xs font-semibold ${
                  isActive
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-[#181a24] border border-[#2c3044] flex items-center justify-center font-bold text-[11px] text-rose-300 shrink-0">
                  {thread.participantName[0]}
                </div>
                <div className="truncate flex-1">
                  <span className="block truncate font-semibold text-white">{thread.participantName}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {thread.messages[thread.messages.length - 1]?.text || "Mulai obrolan"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentThread ? (
        <div className="flex-1 flex flex-col bg-[#0e0f15]">
          <div className="h-14 border-b border-[#1e2029] px-6 flex items-center justify-between bg-[#12131b]/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center font-bold text-xs text-white shadow">
                {currentThread.participantName[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{currentThread.participantName}</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                </span>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {currentThread.messages.map((msg) => {
              const isMe = msg.senderName === "Ravi Zein";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMe ? "bg-rose-600 text-white shadow ring-1 ring-rose-400/30" : "bg-[#181a24] text-slate-200 border border-[#2c3044]"
                    }`}
                  >
                    {msg.senderName[0]}
                  </div>
                  <div className={`max-w-md ${isMe ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                      <span className="text-xs font-semibold text-slate-300">{msg.senderName}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-rose-600 text-white rounded-tr-none shadow-md shadow-rose-950/40"
                          : "bg-[#14151e] border border-[#222533] text-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1e2029] bg-[#12131b]/80 flex gap-2">
            <Input
              placeholder={`Pesan untuk ${currentThread.participantName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-[#181a24] border-[#2c3044] text-xs h-10 text-slate-200 focus-visible:ring-rose-500 rounded-xl"
            />
            <Button type="submit" className="bg-rose-600 hover:bg-rose-500 h-10 px-4 rounded-xl shadow-md shadow-rose-950/40">
              <Send size={14} />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Pilih kontak untuk memulai chat.
        </div>
      )}
    </div>
  );
}
