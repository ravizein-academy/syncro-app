"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Briefcase, Plus, FolderKanban, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";

export default function SpacesPage() {
  const { spaces, tasks, addSpace } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("from-rose-500 to-red-700");

  const COLOR_OPTIONS = [
    { label: "Crimson Red", val: "from-rose-500 to-red-700" },
    { label: "Scarlet Ruby", val: "from-red-600 to-rose-600" },
    { label: "Wine Berry", val: "from-rose-700 to-purple-800" },
    { label: "Sunset Coral", val: "from-orange-500 to-rose-600" },
    { label: "Dark Cherry", val: "from-red-900 to-rose-900" },
  ];

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    addSpace({
      name: spaceName,
      description: spaceDesc || "Ruang kerja tim untuk kolaborasi proyek",
      color: selectedColor,
    });

    setSpaceName("");
    setSpaceDesc("");
    setOpenDialog(false);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Workspace Spaces</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5 mt-1">
            <Briefcase className="text-rose-500" />
            Spaces Proyek
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pengelompokan ruang kerja utama, divisi, dan proyek ClickUp-style di Syncro.
          </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger
            render={
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5 h-9 shadow-md shadow-rose-950/40 rounded-lg">
                <Plus size={14} />
                <span>Buat Space Baru</span>
              </Button>
            }
          />
          <DialogContent className="bg-[#12131b] border-[#222533] text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Buat Space Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSpace} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Space</label>
                <Input
                  required
                  placeholder="e.g. Mobile Apps V2, Security Compliance"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="bg-[#181a24] border-[#252837] text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Deskripsi Singkat</label>
                <Input
                  placeholder="e.g. Ruang lingkup fitur iOS & Android"
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  className="bg-[#181a24] border-[#252837] text-sm focus-visible:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Warna Tema Space</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setSelectedColor(c.val)}
                      className={`h-8 rounded-lg bg-gradient-to-r ${c.val} transition ring-2 ${
                        selectedColor === c.val ? "ring-white scale-105" : "ring-transparent opacity-80"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold">
                  Simpan Space
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid of Spaces */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => {
          const spaceTasks = tasks.filter((t) => t.spaceId === space.id);
          const doneTasks = spaceTasks.filter((t) => t.status === "done");
          const progressPercent = spaceTasks.length > 0 
            ? Math.round((doneTasks.length / spaceTasks.length) * 100) 
            : 0;

          return (
            <Card
              key={space.id}
              className="bg-[#12131b] border-[#222533] overflow-hidden hover:border-rose-500/50 transition flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className={`h-2.5 w-full bg-gradient-to-r ${space.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white group-hover:text-rose-400 transition">
                      {space.name}
                    </CardTitle>
                    <FolderKanban className="text-slate-500 group-hover:text-rose-400 transition" size={20} />
                  </div>
                  <CardDescription className="text-xs text-slate-400 line-clamp-2">
                    {space.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{spaceTasks.length} Tugas Terkait</span>
                    <span className="font-semibold text-rose-300">{progressPercent}% Selesai</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#1e202d] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${space.color} transition-all`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-[#1e202d] mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {doneTasks.length} dari {spaceTasks.length} selesai
                </span>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-400 hover:text-rose-300 gap-1 p-0">
                    <span>Buka Tasks</span>
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
