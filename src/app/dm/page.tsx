"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DirectMessagesPage() {
  const { dmThreads, sendDMMessage, language } = useStore();
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none transition-colors duration-200">
      {/* DM List Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="text-rose-500" size={18} />
            Direct Messages
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">1-on-1</span>
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
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[11px] text-rose-600 dark:text-rose-300 shrink-0">
                  {thread.participantName[0]}
                </div>
                <div className="truncate flex-1">
                  <span className="block truncate font-semibold text-foreground">{thread.participantName}</span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {thread.messages[thread.messages.length - 1]?.text || (language === 'en' ? "Start chat" : "Mulai obrolan")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentThread ? (
        <div className="flex-1 flex flex-col bg-background">
          <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center font-bold text-xs text-white shadow">
                {currentThread.participantName[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{currentThread.participantName}</h3>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
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
                      isMe ? "bg-rose-600 text-white shadow ring-1 ring-rose-400/30" : "bg-secondary text-foreground border border-border"
                    }`}
                  >
                    {msg.senderName[0]}
                  </div>
                  <div>
                    <div className={`flex items-center gap-2 ${isMe ? "justify-end" : ""}`}>
                      <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`mt-1 text-xs p-3 rounded-xl max-w-xl shadow-sm ${
                        isMe
                          ? "bg-rose-600 text-white rounded-tr-none"
                          : "bg-card text-foreground border border-border rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Chat */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-2">
            <Input
              placeholder={`Tulis pesan untuk ${currentThread.participantName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-secondary border-border text-xs h-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-rose-500 rounded-xl"
            />
            <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white h-11 px-5 rounded-xl shadow-md">
              <Send size={15} />
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
