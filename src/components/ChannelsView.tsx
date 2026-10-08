'use client';

import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ChannelMessage } from '../types';
import { INITIAL_MESSAGES } from '../lib/mockData';
import {
  MessageSquare,
  Hash,
  Send,
  Users
} from 'lucide-react';

export function ChannelsView() {
  const { users, currentUser } = useAppStore();
  const [messages, setMessages] = useState<ChannelMessage[]>(INITIAL_MESSAGES);
  const [activeChannel, setActiveChannel] = useState('general');
  const [inputMsg, setInputMsg] = useState('');

  const channels = [
    { id: 'general', name: 'general', desc: 'Pengumuman dan diskusi umum tim Syncro' },
    { id: 'engineering', name: 'tech-dev', desc: 'Diskusi teknis Next.js & PWA' },
    { id: 'soc-lab', name: 'soc-alerts', desc: 'Pemantauan insiden lab & DNS' },
    { id: 'academic', name: 'academy-sop', desc: 'Update silabus dan jadwal student' }
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: ChannelMessage = {
      id: 'msg-' + Date.now(),
      channelId: activeChannel,
      senderId: currentUser.id,
      content: inputMsg.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setInputMsg('');
  };

  const channelMessages = messages.filter((m) => m.channelId === activeChannel);

  return (
    <div className="flex-1 flex h-full bg-slate-50 overflow-hidden p-6 gap-6">
      {/* Channels Sidebar List */}
      <div className="w-60 border border-slate-200 bg-white flex flex-col shrink-0 shadow-sm rounded-xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#ee3425]" />
            Saluran Komunikasi
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Channels
          </div>
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                activeChannel === c.id
                  ? 'bg-red-50 text-[#ee3425] border-l-3 border-[#ee3425]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{c.name}</span>
            </button>
          ))}

          <div className="pt-4 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Direct Messages
          </div>
          {users
            .filter((u) => u.id !== currentUser.id)
            .map((u) => (
              <button
                key={u.id}
                onClick={() => setActiveChannel(u.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
                  activeChannel === u.id
                    ? 'bg-red-50 text-[#ee3425] border-l-3 border-[#ee3425]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover border border-slate-200"
                />
                <span className="truncate">{u.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Channel Header */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#ee3425]" />
            <h4 className="text-sm font-bold text-slate-900">#{activeChannel}</h4>
            <span className="text-xs text-slate-400 ml-2 hidden sm:inline font-medium">
              {channels.find((c) => c.id === activeChannel)?.desc || 'Percakapan Langsung'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{users.length} Anggota</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {channelMessages.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Belum ada pesan di saluran ini. Mulai percakapan sekarang!
            </div>
          ) : (
            channelMessages.map((msg) => {
              const sender = users.find((u) => u.id === msg.senderId) || currentUser;

              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <img
                    src={sender.avatar}
                    alt={sender.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{sender.name}</span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <div className="mt-1 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 inline-block max-w-xl leading-relaxed shadow-2xs">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Kirim pesan ke #${activeChannel}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ee3425]"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim()}
              className="bg-[#ee3425] hover:bg-[#d6281a] disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer shadow-xs shadow-red-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
