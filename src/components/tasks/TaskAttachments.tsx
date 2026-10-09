"use client";

import React, { useRef, useState } from "react";
import { TaskAttachment } from "@/store/useStore";
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Link2, 
  X, 
  ExternalLink, 
  Paperclip, 
  FileText,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  language?: "id" | "en";
}

export function TaskAttachments({
  attachments,
  onChange,
  language = "id",
}: TaskAttachmentsProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "audio"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newAttachment: TaskAttachment = {
        id: "att-" + Date.now(),
        type,
        url: result,
        name: file.name,
        size: formatFileSize(file.size),
      };
      onChange([...attachments, newAttachment]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    const newAttachment: TaskAttachment = {
      id: "att-" + Date.now(),
      type: "link",
      url: finalUrl,
      name: linkTitle.trim() || finalUrl,
    };

    onChange([...attachments, newAttachment]);
    setLinkUrl("");
    setLinkTitle("");
    setShowLinkDialog(false);
  };

  const handleRemoveAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, "image")}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleFileUpload(e, "video")}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={(e) => handleFileUpload(e, "audio")}
        accept="audio/*"
        className="hidden"
      />

      {/* Attachments Action Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
          <Paperclip size={11} className="text-[#EE3726]" />
          <span>{language === "en" ? "Attach:" : "Lampirkan:"}</span>
        </span>

        {/* Gambar */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:border-[#EE3726]/40 transition"
          title="Unggah Gambar"
        >
          <ImageIcon size={12} className="text-[#EE3726]" />
          <span>{language === "en" ? "Image" : "Gambar"}</span>
        </button>

        {/* Video */}
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:border-[#EE3726]/40 transition"
          title="Unggah Video"
        >
          <Video size={12} className="text-blue-500" />
          <span>Video</span>
        </button>

        {/* Audio */}
        <button
          type="button"
          onClick={() => audioInputRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground hover:border-[#EE3726]/40 transition"
          title="Unggah Audio"
        >
          <Music size={12} className="text-emerald-500" />
          <span>Audio</span>
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={() => setShowLinkDialog(!showLinkDialog)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
            showLinkDialog
              ? "bg-[#EE3726]/15 border-[#EE3726] text-[#EE3726]"
              : "bg-secondary hover:bg-secondary/80 border-border text-foreground hover:border-[#EE3726]/40"
          }`}
          title="Tambah Tautan Link"
        >
          <Link2 size={12} className="text-amber-500" />
          <span>Link</span>
        </button>
      </div>

      {/* Link Input Sub-Drawer */}
      {showLinkDialog && (
        <form
          onSubmit={handleAddLink}
          className="p-3 rounded-xl bg-secondary/40 border border-border space-y-2 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Link2 size={13} className="text-[#EE3726]" />
              <span>{language === "en" ? "Add Link Attachment" : "Tambah Tautan Lampiran"}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowLinkDialog(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/doc..."
              className="h-8 text-xs bg-card border-border focus-visible:ring-[#EE3726] rounded-lg"
              autoFocus
            />
            <Input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder={language === "en" ? "Link title / label (optional)" : "Judul link (opsional)"}
              className="h-8 text-xs bg-card border-border focus-visible:ring-[#EE3726] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkDialog(false)}
              className="h-7 text-xs px-2.5"
            >
              {language === "en" ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs px-3 bg-[#EE3726] hover:bg-[#D32717] text-white font-bold rounded-lg shadow-sm"
            >
              {language === "en" ? "Add Link" : "Simpan Link"}
            </Button>
          </div>
        </form>
      )}

      {/* Attachments Preview Grid */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {language === "en" ? "Attached Files & Links" : "Lampiran Berkas & Tautan"} ({attachments.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map((att) => {
              return (
                <div
                  key={att.id}
                  className="p-2.5 rounded-xl border border-border bg-secondary/30 flex flex-col justify-between gap-2 shadow-sm group hover:border-[#EE3726]/40 transition"
                >
                  {/* Top Bar: Title & Remove Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {att.type === "image" && <ImageIcon size={13} className="text-[#EE3726] shrink-0" />}
                      {att.type === "video" && <Video size={13} className="text-blue-500 shrink-0" />}
                      {att.type === "audio" && <Music size={13} className="text-emerald-500 shrink-0" />}
                      {att.type === "link" && <Link2 size={13} className="text-amber-500 shrink-0" />}

                      <span className="text-xs font-semibold text-foreground truncate" title={att.name}>
                        {att.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-muted-foreground hover:text-[#EE3726] p-1 rounded hover:bg-secondary transition shrink-0"
                      title="Hapus lampiran"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Attachment Content Preview */}
                  <div className="rounded-lg overflow-hidden bg-card/60 border border-border/70">
                    {/* Image Preview */}
                    {att.type === "image" && (
                      <div className="relative group/img aspect-video max-h-36 flex items-center justify-center bg-black/5 overflow-hidden">
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs gap-1 font-semibold transition"
                        >
                          <ExternalLink size={13} />
                          <span>{language === "en" ? "View Image" : "Buka Gambar"}</span>
                        </a>
                      </div>
                    )}

                    {/* Video Player Preview */}
                    {att.type === "video" && (
                      <div className="aspect-video max-h-40 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                          src={att.url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Audio Player Preview */}
                    {att.type === "audio" && (
                      <div className="p-2 bg-secondary/50 rounded-lg flex items-center justify-center">
                        <audio
                          src={att.url}
                          controls
                          className="w-full h-8"
                        />
                      </div>
                    )}

                    {/* Link Card Preview */}
                    {att.type === "link" && (
                      <div className="p-2 flex items-center justify-between gap-2">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#EE3726] hover:underline flex items-center gap-1.5 truncate font-semibold"
                        >
                          <span className="truncate">{att.url}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Footer metadata if file size exists */}
                  {att.size && (
                    <span className="text-[10px] text-muted-foreground self-end font-mono">
                      {att.size}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
