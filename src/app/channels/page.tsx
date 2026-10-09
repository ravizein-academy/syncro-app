"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Hash, Send, Users } from "lucide-react";
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none">
      {/* Channels List Sidebar */}
      <div className="w-72 bg-[#0c0d12] border-r border-[#1e2029] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1e2029] flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <Hash className="text-rose-500" size={18} />
            Channels
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">{channels.length} channels</span>
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
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash size={14} className={isActive ? "text-rose-400" : "text-slate-500"} />
                  <span className="truncate">{ch.name}</span>
                </div>
                <span className="text-[10px] bg-[#14151e] border border-[#222533] px-1.5 py-0.5 rounded text-rose-300">
                  {ch.department}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {currentChannel ? (
        <div className="flex-1 flex flex-col bg-[#0e0f15]">
          {/* Channel Header */}
          <div className="h-14 border-b border-[#1e2029] px-6 flex items-center justify-between bg-[#12131b]/60">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Hash size={16} className="text-rose-500" />
                {currentChannel.name}
              </h3>
              <p className="text-[11px] text-slate-400">{currentChannel.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-300">
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
                        : "bg-[#181a24] text-slate-300 border border-[#2c3044]"
                    }`}
                  >
                    {msg.senderName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 bg-[#14151e] border border-[#222533] p-2.5 rounded-xl max-w-xl">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1e2029] bg-[#12131b]/80 flex gap-2">
            <Input
              placeholder={`Kirim pesan ke #${currentChannel.name}...`}
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
          Pilih channel untuk melihat percakapan.
        </div>
      )}
    </div>
  );
}
