"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Briefcase, Plus, FolderKanban, ArrowRight, CheckCircle2 } from "lucide-react";
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
  const [selectedColor, setSelectedColor] = useState("from-blue-500 to-indigo-600");

  const COLOR_OPTIONS = [
    { label: "Ocean Blue", val: "from-blue-500 to-indigo-600" },
    { label: "Purple Sunset", val: "from-purple-500 to-pink-600" },
    { label: "Emerald Green", val: "from-emerald-500 to-teal-600" },
    { label: "Amber Orange", val: "from-amber-500 to-orange-600" },
    { label: "Rose Crimson", val: "from-rose-500 to-red-600" },
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Briefcase className="text-blue-400" />
            Spaces
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pengelompokan ruang kerja utama, divisi, dan proyek ClickUp-style di Syncro.
          </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger
            render={
              <Button className="bg-blue-600 hover:bg-blue-500 text-xs gap-1.5 h-9">
                <Plus size={14} />
                <span>Buat Space Baru</span>
              </Button>
            }
          />
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Buat Space Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSpace} className="space-y-4 pt-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Space</label>
                <Input
                  required
                  placeholder="e.g. Mobile Apps V2, Security Compliance"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Deskripsi Singkat</label>
                <Input
                  placeholder="e.g. Ruang lingkup fitur iOS & Android"
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm"
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
                        selectedColor === c.val ? "ring-white" : "ring-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-xs">
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
              className="bg-slate-900/90 border-slate-800 overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className={`h-2.5 w-full bg-gradient-to-r ${space.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition">
                      {space.name}
                    </CardTitle>
                    <FolderKanban className="text-slate-500 group-hover:text-blue-400 transition" size={20} />
                  </div>
                  <CardDescription className="text-xs text-slate-400 line-clamp-2">
                    {space.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{spaceTasks.length} Tugas Terkait</span>
                    <span className="font-medium text-slate-300">{progressPercent}% Selesai</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${space.color} transition-all`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {doneTasks.length} dari {spaceTasks.length} selesai
                </span>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 gap-1 p-0">
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
