"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useStore, Task } from "@/store/useStore";
import { 
  GripVertical, 
  Clock, 
  Video, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n";

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
    language 
  } = useStore();

  const t = translations[language || 'id'];

  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("day");
  const [currentDateString, setCurrentDateString] = useState(language === 'en' ? "Today - Thu, Oct 9, 2026" : "Hari Ini - Kamis, 09 Okt 2026");

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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4 max-w-[1600px] mx-auto select-none transition-colors duration-200">
      {/* Header with Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">{t.plannerTag}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2 mt-0.5">
            <CalendarIcon className="text-rose-500" size={22} />
            {t.plannerTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.plannerSubtitle}
          </p>
        </div>

        {/* View Switcher: Day, Week, Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-0.5 text-xs text-foreground">
            <button className="p-1 hover:text-rose-600 transition"><ChevronLeft size={16} /></button>
            <span className="px-2 font-medium">{currentDateString}</span>
            <button className="p-1 hover:text-rose-600 transition"><ChevronRight size={16} /></button>
          </div>

          <div className="flex bg-secondary border border-border p-1 rounded-xl shadow-inner">
            {(["day", "week", "month"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  calendarView === view ? "bg-rose-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {view === 'day' ? t.viewDay : view === 'week' ? t.viewWeek : t.viewMonth}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calendarView !== "day" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <CalendarIcon size={48} className="text-rose-500 mb-3 opacity-80" />
          <h2 className="text-lg font-bold text-foreground capitalize">{viewDayText(calendarView, t)}</h2>
          <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
            {language === 'en' 
              ? "Switch to Day mode to interact with drag-and-drop time-blocking for today's agenda."
              : "Beralih ke mode Harian untuk melakukan interaksi time blocking drag-and-drop tugas secara presisi."}
          </p>
          <Button onClick={() => setCalendarView("day")} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm">
            {language === 'en' ? "Switch to Day View (Time Blocking)" : "Beralih ke Day View (Time Blocking)"}
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
            {/* Left Drawer: Unscheduled Tasks Panel */}
            <div className="w-80 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-secondary/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground">{t.unscheduledTasksTitle}</span>
                  <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {unscheduledTasks.length}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{language === 'en' ? "Drag to slot" : "Tarik ke Jam"}</span>
              </div>

              <Droppable droppableId="unscheduled">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-rose-500/10" : ""
                    }`}
                  >
                    {unscheduledTasks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-xs">
                        {language === 'en' ? "All tasks scheduled!" : "Semua tugas telah dijadwalkan!"}
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
                                  ? "bg-rose-500/20 border-rose-500 shadow-xl"
                                  : "bg-secondary/40 border-border hover:border-rose-500/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground line-clamp-1">
                                  {task.title}
                                </span>
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground hover:text-rose-500 cursor-grab active:cursor-grabbing p-1"
                                >
                                  <GripVertical size={14} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-rose-500" />
                                  {task.timeEstimate || 60}m
                                </span>
                                <span className="capitalize text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-rose-600 dark:text-rose-300 font-medium">
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
            <div className="flex-1 flex flex-col bg-card/60 border border-border rounded-xl overflow-y-auto p-4 space-y-3 shadow-sm">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = getTasksForSlot(slot);

                return (
                  <div key={slot} className="flex gap-4 items-start group">
                    <div className="w-20 pt-2 text-right text-xs font-mono font-bold text-muted-foreground shrink-0">
                      {slot}
                    </div>

                    <Droppable droppableId={slot}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-[72px] p-2.5 rounded-xl border border-dashed transition-all flex flex-col gap-2 ${
                            snapshot.isDraggingOver
                              ? "bg-rose-500/10 border-rose-500"
                              : "bg-secondary/30 border-border hover:border-rose-500/40"
                          }`}
                        >
                          {slotTasks.map((task, index) => {
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                                      snapshot.isDragging
                                        ? "bg-rose-500/20 border-rose-500 shadow-xl"
                                        : "bg-card border-border shadow-sm"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-muted-foreground hover:text-rose-500 cursor-grab p-0.5"
                                      >
                                        <GripVertical size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">
                                          {task.title}
                                        </p>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <Clock size={11} className="text-rose-500" />
                                          {task.timeEstimate || 60}m
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action Buttons: Meet 1-Click */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleGenerateMeet(task.title)}
                                        className="h-7 px-2.5 text-[11px] gap-1.5 border-border text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                        title={language === 'en' ? "Open Google Meet" : "Buka Google Meet untuk sesi ini"}
                                      >
                                        <Video size={12} className="text-rose-500" />
                                        <span>Meet</span>
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

function viewDayText(view: string, t: any) {
  if (view === 'week') return t.viewWeek;
  if (view === 'month') return t.viewMonth;
  return t.viewDay;
}
