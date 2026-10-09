"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useStore, Task } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GripVertical, 
  Clock, 
  Play, 
  Video, 
  Calendar as CalendarIcon, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

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

  // Unscheduled tasks are tasks without scheduledSlot or in 'unscheduled'
  const unscheduledTasks = tasks.filter((t) => !t.scheduledSlot || t.scheduledSlot === "unscheduled");

  // Tasks partitioned by time slots
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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header with Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="text-blue-400" size={24} />
            Planner & Time Blocking
          </h1>
          <p className="text-xs text-slate-400">
            Jadwalkan tugas harian dengan menarik task langsung ke blok jam kerja kalender.
          </p>
        </div>

        {/* View Switcher: Day, Week, Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
            <button className="p-1 hover:text-white"><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium">{currentDateString}</span>
            <button className="p-1 hover:text-white"><ChevronRight size={16} /></button>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(["day", "week", "month"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  calendarView === view ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calendarView !== "day" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center">
          <CalendarIcon size={48} className="text-blue-400 mb-3 opacity-80" />
          <h2 className="text-lg font-bold text-slate-200 capitalize">Tampilan {calendarView} Mode</h2>
          <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
            Dalam mode {calendarView}, Anda dapat melihat matriks tugas berskala luas. Beralih ke mode <strong>Day</strong> untuk melakukan interaksi Time Blocking drag-and-drop secara presisi.
          </p>
          <Button onClick={() => setCalendarView("day")} className="bg-blue-600 hover:bg-blue-500 text-xs">
            Beralih ke Day View (Time Blocking)
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
            {/* Left Drawer: Unscheduled Tasks Panel */}
            <div className="w-80 shrink-0 flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-200">Unscheduled Tasks</span>
                  <span className="bg-blue-950 text-blue-400 border border-blue-800/40 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Tarik ke Jam</span>
              </div>

              <Droppable droppableId="unscheduled">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-slate-800/60" : ""
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
                                  ? "bg-blue-600/30 border-blue-500 shadow-xl"
                                  : "bg-slate-800/80 border-slate-700/80 hover:border-slate-600"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-100 line-clamp-1">
                                  {task.title}
                                </span>
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing p-1"
                                >
                                  <GripVertical size={14} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-slate-500" />
                                  {task.timeEstimate || 60}m
                                </span>
                                <span className="capitalize text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">
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
            <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-y-auto p-4 space-y-3">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = getTasksForSlot(slot);

                return (
                  <div key={slot} className="flex gap-4 items-start group">
                    {/* Time Slot Label */}
                    <div className="w-20 pt-2 text-right text-xs font-mono font-medium text-slate-400 shrink-0">
                      {slot}
                    </div>

                    {/* Droppable Slot Container */}
                    <Droppable droppableId={slot}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[72px] p-2.5 rounded-xl border border-dashed transition-all flex flex-col gap-2 ${
                            snapshot.isDraggingOver
                              ? "bg-blue-900/20 border-blue-500"
                              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
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
                                        ? "bg-blue-600/30 border-blue-500 shadow-xl"
                                        : "bg-slate-800 border-slate-700 shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-slate-500 hover:text-slate-300 cursor-grab p-0.5"
                                      >
                                        <GripVertical size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-100 truncate">
                                          {task.title}
                                        </p>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                          <Clock size={11} />
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
                                        className="h-7 px-2 text-[11px] gap-1 border-slate-700 text-blue-400 hover:bg-blue-950/40"
                                        title="Buka Google Meet untuk sesi ini"
                                      >
                                        <Video size={12} />
                                        <span>Meet</span>
                                      </Button>

                                      <Button
                                        size="sm"
                                        onClick={() => startTimer(task.id)}
                                        className={`h-7 px-2 text-[11px] gap-1 ${
                                          isTimerOn
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                            : "bg-slate-700 hover:bg-slate-600 text-slate-200"
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
