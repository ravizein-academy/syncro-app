"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useStore, Task } from "@/store/useStore";
import { 
  GripVertical, 
  Clock, 
  Play, 
  Video, 
  Calendar as CalendarIcon, 
  ChevronLeft,
  ChevronRight,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

export default function PlannerPage() {
  const { 
    tasks, 
    updateTask, 
    startTimer, 
    activeTimerTaskId, 
    isTimerRunning 
  } = useStore();

  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("day");
  const [currentDateString, setCurrentDateString] = useState("Hari Ini - Kamis, 09 Okt 2026");

  const unscheduledTasks = tasks.filter((t) => !t.scheduledSlot || t.scheduledSlot === "unscheduled");

  const getTasksForSlot = (slot: string) => {
    return tasks.filter((t) => t.scheduledSlot === slot);
  };

  const onDragEnd = (result: any) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const targetSlot = destination.droppableId;
    updateTask(draggableId, {
      scheduledSlot: targetSlot === "unscheduled" ? undefined : targetSlot,
    });
  };

  const handleGenerateMeet = (taskTitle: string) => {
    const meetCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
    const meetUrl = `https://meet.google.com/${meetCode}`;
    window.open(meetUrl, "_blank");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4 max-w-[1600px] mx-auto select-none">
      {/* Header with Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">ClickUp Time Blocking</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 mt-0.5">
            <CalendarIcon className="text-rose-500" size={22} />
            Planner Kalender
          </h1>
          <p className="text-xs text-slate-400">
            Tarik tugas dari panel Unscheduled langsung ke grid jam kalender untuk menjadwalkan hari kerja.
          </p>
        </div>

        {/* View Switcher: Day, Week, Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#12131b] border border-[#222533] rounded-lg p-0.5 text-xs text-slate-300">
            <button className="p-1 hover:text-white transition"><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium">{currentDateString}</span>
            <button className="p-1 hover:text-white transition"><ChevronRight size={16} /></button>
          </div>

          <div className="flex bg-[#12131b] border border-[#222533] p-1 rounded-xl shadow-inner">
            {(["day", "week", "month"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  calendarView === view ? "bg-rose-600 text-white shadow-md shadow-rose-950/50" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calendarView !== "day" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#12131b]/60 border border-[#222533] rounded-2xl p-8 text-center">
          <CalendarIcon size={48} className="text-rose-500 mb-3 opacity-80" />
          <h2 className="text-lg font-bold text-white capitalize">Tampilan Mode {calendarView}</h2>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
            Beralih ke mode <strong>Day</strong> untuk melakukan interaksi time blocking drag-and-drop tugas harian secara presisi.
          </p>
          <Button onClick={() => setCalendarView("day")} className="bg-rose-600 hover:bg-rose-500 text-xs font-semibold rounded-lg">
            Beralih ke Day View (Time Blocking)
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
            {/* Left Drawer: Unscheduled Tasks Panel */}
            <div className="w-80 shrink-0 flex flex-col bg-[#12131b] border border-[#222533] rounded-xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-[#222533] flex items-center justify-between bg-[#161722]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Unscheduled Tasks</span>
                  <span className="bg-rose-950 text-rose-300 border border-rose-800/40 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Tarik ke Jam</span>
              </div>

              <Droppable droppableId="unscheduled">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-rose-950/20" : ""
                    }`}
                  >
                    {unscheduledTasks.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Semua tugas telah dijadwalkan!
                      </div>
                    ) : (
                      unscheduledTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                                snapshot.isDragging
                                  ? "bg-rose-600/30 border-rose-500 shadow-xl shadow-rose-950/50"
                                  : "bg-[#181a24] border-[#252837] hover:border-rose-500/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white line-clamp-1">
                                  {task.title}
                                </span>
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-slate-400 hover:text-rose-400 cursor-grab active:cursor-grabbing p-1"
                                >
                                  <GripVertical size={14} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-rose-400" />
                                  {task.timeEstimate || 60}m
                                </span>
                                <span className="capitalize text-[10px] bg-[#12131b] border border-[#222533] px-2 py-0.5 rounded text-rose-300 font-medium">
                                  {task.priority || "normal"}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Right: Time Blocking Grid by Hours */}
            <div className="flex-1 flex flex-col bg-[#12131b]/60 border border-[#222533] rounded-xl overflow-y-auto p-4 space-y-3">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = getTasksForSlot(slot);

                return (
                  <div key={slot} className="flex gap-4 items-start group">
                    <div className="w-20 pt-2 text-right text-xs font-mono font-bold text-slate-400 shrink-0">
                      {slot}
                    </div>

                    <Droppable droppableId={slot}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[72px] p-2.5 rounded-xl border border-dashed transition-all flex flex-col gap-2 ${
                            snapshot.isDraggingOver
                              ? "bg-rose-950/20 border-rose-500"
                              : "bg-[#161722]/80 border-[#252838] hover:border-rose-500/40"
                          }`}
                        >
                          {slotTasks.map((task, index) => {
                            const isTimerOn = activeTimerTaskId === task.id && isTimerRunning;

                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                                      snapshot.isDragging
                                        ? "bg-rose-600/30 border-rose-500 shadow-xl"
                                        : "bg-[#1c1e2b] border-[#2b2e40] shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-slate-400 hover:text-rose-400 cursor-grab p-0.5"
                                      >
                                        <GripVertical size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">
                                          {task.title}
                                        </p>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                          <Clock size={11} className="text-rose-400" />
                                          {task.timeTracked || 0}m / {task.timeEstimate || 60}m
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action Buttons: Meet 1-Click & Live Timer */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGenerateMeet(task.title)}
                                        className="h-7 px-2 text-[11px] gap-1 border-[#2e3146] text-rose-300 hover:bg-rose-950/40 rounded-lg"
                                        title="Buka Google Meet untuk sesi ini"
                                      >
                                        <Video size={12} className="text-rose-400" />
                                        <span>Meet</span>
                                      </Button>

                                      <Button
                                        size="sm"
                                        onClick={() => startTimer(task.id)}
                                        className={`h-7 px-2 text-[11px] gap-1 rounded-lg ${
                                          isTimerOn
                                            ? "bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                                            : "bg-[#252837] hover:bg-[#2e3245] text-slate-200"
                                        }`}
                                      >
                                        <Play size={11} className={isTimerOn ? "fill-white" : ""} />
                                        <span>{isTimerOn ? "Tracking" : "Mulai"}</span>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
