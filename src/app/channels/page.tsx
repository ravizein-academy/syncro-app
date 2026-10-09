"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Hash, Send, Users, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChannelsPage() {
  const { channels, sendChannelMessage } = useStore();
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Channels List Sidebar */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Hash className="text-blue-400" size={18} />
            Channels
          </h2>
          <span className="text-[11px] text-slate-500">{channels.length} channels</span>
        </div>

        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {channels.map((ch) => {
            const isActive = ch.id === currentChannel?.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition text-xs font-medium ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash size={14} className={isActive ? "text-blue-400" : "text-slate-500"} />
                  <span className="truncate">{ch.name}</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  {ch.department}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentChannel ? (
        <div className="flex-1 flex flex-col bg-slate-950/50">
          {/* Channel Header */}
          <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Hash size={16} className="text-blue-400" />
                {currentChannel.name}
              </h3>
              <p className="text-[11px] text-slate-400">{currentChannel.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={14} />
              <span>Dept: {currentChannel.department}</span>
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
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {msg.senderName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 bg-slate-900 border border-slate-800 p-2.5 rounded-lg max-w-xl">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-2">
            <Input
              placeholder={`Kirim pesan ke #${currentChannel.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs h-10 text-slate-200"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 h-10 px-4">
              <Send size={14} />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          Pilih channel untuk melihat percakapan.
        </div>
      )}
    </div>
  );
}
