"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Loader2,
  CheckCircle2,
  Clock,
  CircleDot,
  Flag,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  Info,
} from "lucide-react";
import { TaskItem } from "./TaskCard";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  projectName?: string;
  userName?: string;
}

export function ExportReportModal({
  isOpen,
  onClose,
  tasks,
  projectName = "Semua Spaces",
  userName = "Ravi Zein Permana",
}: ExportReportModalProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Extract unique assignees from tasks for the dropdown
  const { assignees, unassignedCount } = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>();
    let unassigned = 0;

    tasks.forEach((t) => {
      if (t.assignee && t.assignee.name) {
        const key = t.assignee.id || t.assignee.name;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: t.assignee.name,
            email: t.assignee.email,
          });
        }
      } else {
        unassigned++;
      }
    });

    return {
      assignees: Array.from(map.values()),
      unassignedCount: unassigned,
    };
  }, [tasks]);

  if (!isOpen) return null;

  // Filter tasks based on selected assignee
  const displayTasks = tasks.filter((task) => {
    if (assigneeFilter === "ALL") return true;
    if (assigneeFilter === "UNASSIGNED") return !task.assignee;
    return task.assignee?.id === assigneeFilter || task.assignee?.name === assigneeFilter;
  });

  const selectedAssigneeObj = assignees.find((a) => a.id === assigneeFilter);
  const selectedAssigneeLabel =
    assigneeFilter === "ALL"
      ? "Semua Penanggung Jawab"
      : assigneeFilter === "UNASSIGNED"
      ? "Belum Ditugaskan"
      : selectedAssigneeObj?.name || assigneeFilter;

  // Metrics for displayTasks
  const totalCount = displayTasks.length;
  const todoCount = displayTasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = displayTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = displayTasks.filter((t) => t.status === "DONE").length;
  const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTimeFormatted = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handler: Save to Excel (.xlsx) with clean headers & auto-fit columns
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);

      // Metadata rows
      const headerRows = [
        ["ITSEC ACADEMY - LAPORAN MANAJEMEN TUGAS SYNCRO"],
        [`Space / Proyek: ${projectName}`],
        [`Filter Penanggung Jawab (PIC): ${selectedAssigneeLabel}`],
        [`Dicetak Oleh: ${userName} | Tanggal: ${currentDateFormatted} ${currentTimeFormatted} WIB`],
        [`Ringkasan: Total ${totalCount} Tugas | To Do: ${todoCount} | In Progress: ${inProgressCount} | Selesai: ${doneCount} (${completionPercentage}%)`],
        [], // empty separator row
      ];

      // Data table headers
      const tableHeaders = [
        "No",
        "ID Tugas",
        "Nama Tugas",
        "Deskripsi",
        "Space / Proyek",
        "Status",
        "Prioritas",
        "Penanggung Jawab (PIC)",
        "Email PIC",
        "Tenggat Waktu",
        "Lampiran Drive",
        "Tanggal Dibuat",
      ];

      const dataRows = displayTasks.map((t, idx) => [
        idx + 1,
        t.id,
        t.title,
        t.description || "-",
        t.project?.name || "General",
        t.status === "DONE"
          ? "Completed (Selesai)"
          : t.status === "IN_PROGRESS"
          ? "In Progress (Dikerjakan)"
          : "To Do (Menunggu)",
        t.priority,
        t.assignee?.name || "Unassigned",
        t.assignee?.email || "-",
        t.dueDate ? new Date(t.dueDate).toLocaleDateString("id-ID") : "-",
        t.mediaUrls?.length || 0,
        t.createdAt ? new Date(t.createdAt).toLocaleDateString("id-ID") : "-",
      ]);

      const worksheetData = [...headerRows, tableHeaders, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto column widths
      worksheet["!cols"] = [
        { wch: 6 },  // No
        { wch: 16 }, // ID Tugas
        { wch: 38 }, // Nama Tugas
        { wch: 35 }, // Deskripsi
        { wch: 22 }, // Space
        { wch: 25 }, // Status
        { wch: 14 }, // Prioritas
        { wch: 24 }, // PIC
        { wch: 30 }, // Email
        { wch: 16 }, // Batas Waktu
        { wch: 16 }, // Lampiran
        { wch: 16 }, // Dibuat
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tugas");

      const cleanProject = projectName.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanAssignee = selectedAssigneeLabel.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `ITSEC_Syncro_Laporan_${cleanProject}_${cleanAssignee}_${Date.now()}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Gagal mengekspor file Excel:", err);
      alert("Terjadi kesalahan saat membuat file Excel. Silakan coba kembali.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler: Save to PDF with multi-page paging & clean light document format
  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsExportingPDF(true);

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x retina crispness
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff", // Strictly white background
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Multi-page pagination
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanProject = projectName.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanAssignee = selectedAssigneeLabel.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `ITSEC_Syncro_Laporan_${cleanProject}_${cleanAssignee}_${Date.now()}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("Gagal mengekspor file PDF:", err);
      alert("Terjadi kesalahan saat memproses file PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handler: Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-[#242424] border border-slate-200 dark:border-[#383838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] transition-colors">
        
        {/* Modal Top Header Bar */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-200 dark:border-[#383838] flex items-center justify-between bg-slate-50 dark:bg-[#202020]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2 flex-wrap">
                <span>Pratinjau & Ekspor Laporan</span>
                <span className="text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  PDF & Excel
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal">
                Pratinjau dokumen A4 resmi, unduh PDF atau Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#333333] transition cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Dropdown Filter Penanggung Jawab (PIC) & Format Badge */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100/90 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#333333] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs">
          
          {/* Dropdown Filter Penanggung Jawab */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Filter Penanggung Jawab:</span>
            </div>

            <div className="relative min-w-[220px] sm:min-w-[280px]">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full appearance-none pl-9 pr-9 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#282828] border border-slate-300 dark:border-[#444444] text-slate-900 dark:text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-all"
              >
                <option value="ALL">
                  Semua Penanggung Jawab ({tasks.length} Tugas)
                </option>
                {assignees.map((a) => {
                  const count = tasks.filter(
                    (t) => t.assignee?.id === a.id || t.assignee?.name === a.name
                  ).length;
                  return (
                    <option key={a.id} value={a.id}>
                      {a.name} ({count} Tugas)
                    </option>
                  );
                })}
                {unassignedCount > 0 && (
                  <option value="UNASSIGNED">
                    Belum Ditugaskan ({unassignedCount} Tugas)
                  </option>
                )}
              </select>

              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Menampilkan {displayTasks.length} dari {tasks.length} tugas
            </span>
          </div>

          {/* Standard Light Mode Format Badge (Document is strictly pure white A4) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Format Resmi Dokumen Cetak (Standar A4)</span>
          </div>
        </div>

        {/* Live Document Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-200/80 dark:bg-[#141414]">
          {/* Printable White Document Sheet (Strictly Pure Light Mode) */}
          <div
            ref={previewRef}
            className="syncro-report-sheet w-full max-w-4xl mx-auto p-6 sm:p-10 rounded-2xl shadow-xl bg-white text-slate-900 border border-slate-300 font-sans print:shadow-none print:border-none print:p-0"
            style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
          >
            {/* Header / Kop Resmi Perusahaan */}
            <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-itsec-darkRed flex items-center justify-center text-white font-black text-base shadow-lg shadow-brand-500/25 shrink-0">
                  IT
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase text-slate-900">
                    ITSEC ACADEMY
                  </h1>
                  <p className="text-xs font-bold text-brand-600 tracking-wider uppercase">
                    Syncro Task Management Suite &bull; Official Report
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-xs font-extrabold px-3 py-1 rounded-md border uppercase tracking-wider bg-slate-100 text-slate-800 border-slate-300">
                  LAPORAN STATUS PROYEK
                </span>
                <p className="text-xs mt-1 font-mono font-medium text-slate-600">
                  {currentDateFormatted} &bull; {currentTimeFormatted} WIB
                </p>
              </div>
            </div>

            {/* Document Details Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div>
                <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                  Space / Proyek:
                </span>
                <span className="font-black text-sm block truncate text-slate-900">
                  {projectName}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                  Penanggung Jawab (PIC):
                </span>
                <span className="font-black text-sm block truncate text-brand-600">
                  {selectedAssigneeLabel}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                  Jumlah Tugas:
                </span>
                <span className="font-black text-sm block text-slate-900">
                  {displayTasks.length} Tugas
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase block mb-1 text-slate-600">
                  Penyelesaian:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-emerald-600">
                    {completionPercentage}%
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Metric KPI Cards (To Do, In Progress, Completed) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="p-3.5 sm:p-4 rounded-xl border border-sky-200 bg-sky-50 text-center text-sky-950">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CircleDot className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-sky-700">
                    To Do
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-900">
                  {todoCount}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50 text-center text-amber-950">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                    In Progress
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-900">
                  {inProgressCount}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-center text-emerald-950">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Completed
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900">
                  {doneCount}
                </div>
              </div>
            </div>

            {/* Clear, Formatted Tasks Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-4">Nama Tugas & Catatan</th>
                    <th className="py-3 px-3">Space</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Prioritas</th>
                    <th className="py-3 px-4">Penanggung Jawab</th>
                    <th className="py-3 px-3">Tenggat Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayTasks.map((t, idx) => (
                    <tr
                      key={t.id}
                      className="text-xs transition hover:bg-slate-50"
                    >
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-600">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-black text-sm block leading-snug text-slate-900">
                          {t.title}
                        </span>
                        {t.description && (
                          <span className="block text-xs mt-0.5 leading-relaxed text-slate-600">
                            {t.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                        {t.project?.name || "General"}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            t.status === "DONE"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : t.status === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-sky-100 text-sky-800 border-sky-300"
                          }`}
                        >
                          {t.status === "DONE" && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {t.status === "IN_PROGRESS" && (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {t.status === "TODO" && (
                            <CircleDot className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {t.status === "DONE"
                              ? "Selesai"
                              : t.status === "IN_PROGRESS"
                              ? "In Progress"
                              : "To Do"}
                          </span>
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            t.priority === "URGENT"
                              ? "text-rose-600"
                              : t.priority === "HIGH"
                              ? "text-orange-600"
                              : t.priority === "MEDIUM"
                              ? "text-blue-600"
                              : "text-slate-500"
                          }`}
                        >
                          <Flag className="w-3 h-3 fill-current" />
                          <span>{t.priority}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-semibold">{t.assignee?.name || "Unassigned"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-xs font-medium text-slate-700">
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}

                  {displayTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-sm font-medium text-slate-500"
                      >
                        Tidak ada tugas yang ditugaskan kepada penanggung jawab ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Footer Notes & Signature Area */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3 text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Dokumen resmi digenerate otomatis oleh ITSEC Academy Syncro Engine.
                </span>
              </div>
              <div className="font-mono text-xs font-semibold">
                ITSEC-SYNCRO-DOC-V3 &bull; STANDAR A4 LIGHT MODE
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Download Buttons */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-slate-200 dark:border-[#383838] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#202020]">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="truncate">
              Total <strong>{displayTasks.length} tugas</strong> untuk <strong>{selectedAssigneeLabel}</strong> siap diekspor.
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2a2a2a] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#333333] transition cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
              <span>Cetak</span>
            </button>

            {/* Save to Excel (.xlsx) Button */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              type="button"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
              )}
              <span>Excel (.xlsx)</span>
            </button>

            {/* Save to PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              type="button"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl border border-brand-500 bg-gradient-to-r from-brand-600 via-brand-500 to-itsec-darkRed hover:from-brand-500 hover:to-brand-600 text-white shadow-md shadow-brand-500/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 shrink-0" />
              )}
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
