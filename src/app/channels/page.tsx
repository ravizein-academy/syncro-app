"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Hash, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChannelsPage() {
  const { channels, sendChannelMessage, language } = useStore();
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || "");
  const [inputText, setInputText] = useState("");

  const currentChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentChannel) return;

    sendChannelMessage(currentChannel.id, {
      senderId: "u1",
      senderName: "Ravi Zein",
      text: inputText,
    });

    setInputText("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none transition-colors duration-200">
      {/* Channels List Sidebar */}
      <div className="w-72 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Hash className="text-rose-500" size={18} />
            Channels
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">{channels.length} channels</span>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {channels.map((ch) => {
            const isActive = ch.id === currentChannel?.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition text-xs font-semibold ${
                  isActive
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash size={14} className={isActive ? "text-rose-500" : "text-muted-foreground"} />
                  <span className="truncate">{ch.name}</span>
                </div>
                <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-300">
                  {ch.department}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentChannel ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Channel Header */}
          <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/60">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Hash size={16} className="text-rose-500" />
                {currentChannel.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">{currentChannel.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-300 font-medium">
              <Users size={14} />
              <span>Dept: @{currentChannel.department}</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {currentChannel.messages.map((msg) => {
              const isMe = msg.senderName === "Ravi Zein";
              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMe
                        ? "bg-rose-600 text-white shadow ring-1 ring-rose-400/40"
                        : "bg-secondary text-foreground border border-border"
                    }`}
                  >
                    {msg.senderName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{msg.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground bg-card border border-border p-3 rounded-xl rounded-tl-none max-w-xl shadow-sm">
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
              placeholder={`Kirim pesan ke #${currentChannel.name}...`}
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
