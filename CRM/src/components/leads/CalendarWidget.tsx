"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
}

interface CalendarWidgetProps {
  events: Event[];
  onAddEvent: (title: string, date: string, startTime?: string, endTime?: string) => void;
}

export default function CalendarWidget({ events, onAddEvent }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDateVal, setNewDateVal] = useState("");
  const [newStartTimeVal, setNewStartTimeVal] = useState("10:00");
  const [newEndTimeVal, setNewEndTimeVal] = useState("11:00");
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Please enter an event title");
      return;
    }
    if (!newDateVal) {
      setError("Please select a date");
      return;
    }

    onAddEvent(newTitle.trim(), newDateVal, newStartTimeVal, newEndTimeVal);
    setNewTitle("");
    setNewDateVal("");
    setNewStartTimeVal("10:00");
    setNewEndTimeVal("11:00");
    setShowAddForm(false);
    setError("");
  };

  // Date utilities
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => {
      if (!e.date) return false;
      const parsedDate = new Date(e.date);
      const cellDate = new Date(dateStr);
      return (
        parsedDate.getFullYear() === cellDate.getFullYear() &&
        parsedDate.getMonth() === cellDate.getMonth() &&
        parsedDate.getDate() === cellDate.getDate()
      );
    });
  };

  // Convert "10:00" to "10am", "13:30" to "1:30pm"
  const formatTimeDisplay = (timeStr: string | undefined) => {
    if (!timeStr) return "";
    try {
      const [hoursStr, minutesStr] = timeStr.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      const ampm = hours >= 12 ? "pm" : "am";
      const h = hours % 12 || 12;
      const m = minutes ? `:${String(minutes).padStart(2, "0")}` : "";
      return `${h}${m}${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Calendar calculations - Month View
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  interface MonthCell {
    dayNum: number;
    isCurrentMonth: boolean;
    dateString: string;
  }

  interface WeekCell {
    dayNum: number;
    dayName: string;
    isCurrentMonth: boolean;
    dateString: string;
    fullDate: Date;
  }

  const monthCells: MonthCell[] = [];
  // Prev month filler
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthDays - i;
    const prevMonthNum = month === 0 ? 12 : month;
    const prevYearNum = month === 0 ? year - 1 : year;
    const cellDateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, "0")}-${String(dayVal).padStart(2, "0")}`;
    monthCells.push({
      dayNum: dayVal,
      isCurrentMonth: false,
      dateString: cellDateStr,
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    monthCells.push({
      dayNum: i,
      isCurrentMonth: true,
      dateString: cellDateStr,
    });
  }
  // Next month filler
  const totalCellsNeeded = 42;
  const remainingCells = totalCellsNeeded - monthCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthNum = month + 2 === 13 ? 1 : month + 2;
    const nextYearNum = month + 2 === 13 ? year + 1 : year;
    const cellDateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    monthCells.push({
      dayNum: i,
      isCurrentMonth: false,
      dateString: cellDateStr,
    });
  }

  // Calendar calculations - Week View
  const startOfWeek = new Date(currentDate);
  const currentDayOfWeek = startOfWeek.getDay(); // 0 = Sunday
  startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek);

  const weekCells: WeekCell[] = [];
  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(startOfWeek);
    cellDate.setDate(cellDate.getDate() + i);
    const cellDateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(
      cellDate.getDate()
    ).padStart(2, "0")}`;
    weekCells.push({
      dayNum: cellDate.getDate(),
      dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
      isCurrentMonth: cellDate.getMonth() === month,
      dateString: cellDateStr,
      fullDate: cellDate,
    });
  }

  // Header display string
  const getHeaderTitleString = () => {
    if (viewMode === "month") {
      return `${monthNames[month]} ${year}`;
    } else {
      const first = weekCells[0]?.fullDate;
      const last = weekCells[6]?.fullDate;
      if (!first || !last) return "";
      
      const firstMonth = monthNames[first.getMonth()].substring(0, 3);
      const lastMonth = monthNames[last.getMonth()].substring(0, 3);
      
      if (first.getFullYear() !== last.getFullYear()) {
        return `${firstMonth} ${first.getFullYear()} - ${lastMonth} ${last.getFullYear()}`;
      } else if (first.getMonth() !== last.getMonth()) {
        return `${firstMonth} - ${lastMonth} ${first.getFullYear()}`;
      } else {
        return `${monthNames[first.getMonth()]} ${first.getFullYear()}`;
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-auto text-slate-800 font-sans relative">
      
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-none">
              {getHeaderTitleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              {viewMode === "month" ? "Month View" : "Week View"}
            </p>
          </div>
        </div>

        {/* View mode buttons & Nav controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === "month"
                  ? "bg-white text-indigo-600 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === "week"
                  ? "bg-white text-indigo-600 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Week
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1"></div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm bg-white"
              title="Previous"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm bg-white"
              title="Next"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            onClick={() => {
              setNewDateVal(new Date().toISOString().split("T")[0]);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Main active area */}
      <div className="flex-grow flex flex-col min-h-0 bg-white">
        
        {/* PREMIUM EVENT DIALOG SHEET OVERLAY */}
        {showAddForm && (
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
              {/* Modal Header */}
              <div className="p-4.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base">Schedule New Event</h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError("");
                  }}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-700">
                {error && (
                  <p className="text-red-650 text-xs font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Sales Follow-up or Product Demo"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newDateVal}
                    onChange={(e) => setNewDateVal(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={newStartTimeVal}
                      onChange={(e) => setNewStartTimeVal(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={newEndTimeVal}
                      onChange={(e) => setNewEndTimeVal(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-150 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setError("");
                    }}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 1: MONTH VIEW GRID (Fixed Height bounds of 480px to avoid bottom cuts) */}
        {viewMode === "month" && (
          <div className="flex flex-col min-h-0 bg-white px-4 pb-4">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center py-2.5 bg-white shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <span key={day} className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {day}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 grid-rows-6 border border-slate-200/60 rounded-xl divide-x divide-y divide-slate-100 bg-slate-100/10 h-[480px]">
              {monthCells.map((cell, idx) => {
                const dateEvents = getEventsForDate(cell.dateString);
                const hasEvents = dateEvents.length > 0;
                const isToday = new Date().toDateString() === new Date(cell.dateString).toDateString();

                const cornerClass =
                  idx === 0 ? "rounded-tl-xl" :
                  idx === 6 ? "rounded-tr-xl" :
                  idx === 35 ? "rounded-bl-xl" :
                  idx === 41 ? "rounded-br-xl" : "";

                return (
                  <div
                    key={idx}
                    className={`flex flex-col justify-start group hover:bg-indigo-50/10 hover:z-30 transition-all duration-150 p-1 relative ${
                      cell.isCurrentMonth ? "bg-white" : "bg-slate-50/20"
                    } ${cornerClass}`}
                  >
                    {/* Compact Top-Right Day Number */}
                    <div className="flex justify-end p-0.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold flex items-center justify-center w-5.5 h-5.5 rounded-full ${
                          !cell.isCurrentMonth
                            ? "text-slate-300"
                            : isToday
                            ? "bg-indigo-600 text-white font-black shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                    </div>

                    {/* Events list: Premium solid gradient look with white text */}
                    <div className="flex-1 flex flex-col gap-0.5 px-0.5 pb-0.5 overflow-y-auto no-scrollbar">
                      {dateEvents.slice(0, 3).map(e => {
                        const timeLabel = e.startTime
                          ? formatTimeDisplay(e.startTime) + (e.endTime ? `-${formatTimeDisplay(e.endTime)}` : "")
                          : "";
                        return (
                          <div
                            key={e.id}
                            className="text-[9px] px-1 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-blue-600 text-white truncate font-bold leading-tight flex items-center gap-0.5 shadow-sm border border-indigo-700/30"
                            title={`${timeLabel ? timeLabel + ": " : ""}${e.title}`}
                          >
                            {timeLabel && <span className="text-[8px] font-black opacity-80 shrink-0">{timeLabel.split("-")[0]}</span>}
                            <span className="truncate">{e.title}</span>
                          </div>
                        );
                      })}
                      {dateEvents.length > 3 && (
                        <div className="text-[8px] text-indigo-600 font-extrabold pl-1 pt-0.5 leading-none">
                          +{dateEvents.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Hover List details */}
                    {hasEvents && (
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 bg-white text-slate-700 text-[10px] rounded-lg p-2.5 shadow-xl z-20 pointer-events-none border border-slate-200/90">
                        <p className="font-extrabold border-b border-slate-100 pb-1 mb-1.5 text-indigo-600 uppercase tracking-wide text-[8px]">
                          Events for {cell.dayNum}:
                        </p>
                        {dateEvents.map(e => {
                          const range = e.startTime
                            ? `${formatTimeDisplay(e.startTime)}${e.endTime ? ` - ${formatTimeDisplay(e.endTime)}` : ""}`
                            : "";
                          return (
                            <div key={e.id} className="truncate line-clamp-1 py-0.5 leading-normal text-slate-600 font-semibold">
                              • {range ? `${range}: ` : ""}{e.title}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: WEEK VIEW COLUMNS (Fixed height matching h-[480px]) */}
        {viewMode === "week" && (
          <div className="flex flex-col min-h-0 bg-white px-4 pb-4">
            {/* Header dates */}
            <div className="grid grid-cols-7 text-center py-3 bg-white shrink-0">
              {weekCells.map((cell, idx) => {
                const isToday = new Date().toDateString() === cell.fullDate.toDateString();
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {cell.dayName}
                    </span>
                    <span
                      className={`text-sm font-extrabold flex items-center justify-center w-7 h-7 rounded-full mt-0.5 ${
                        isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Event columns grid with fixed height */}
            <div className="grid grid-cols-7 divide-x divide-slate-100 bg-slate-50/10 min-h-0 overflow-y-auto no-scrollbar h-[480px] border border-slate-200/60 rounded-xl">
              {weekCells.map((cell, idx) => {
                const cellEvents = getEventsForDate(cell.dateString);
                const isToday = new Date().toDateString() === cell.fullDate.toDateString();
                
                const colCornerClass =
                  idx === 0 ? "rounded-l-xl" :
                  idx === 6 ? "rounded-r-xl" : "";

                return (
                  <div
                    key={idx}
                    className={`p-2 flex flex-col gap-2 min-h-0 h-full overflow-y-auto no-scrollbar transition-colors ${
                      isToday ? "bg-indigo-50/10" : ""
                    } ${colCornerClass}`}
                  >
                    {cellEvents.length === 0 ? (
                      <div className="flex-grow flex items-center justify-center text-slate-350 text-[10px] italic select-none">
                        No events
                      </div>
                    ) : (
                      cellEvents
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(e => {
                          const timeRange = e.startTime
                            ? `${formatTimeDisplay(e.startTime)}${e.endTime ? ` - ${formatTimeDisplay(e.endTime)}` : ""}`
                            : "";
                          return (
                            <div
                              key={e.id}
                              className="p-2.5 rounded-lg border border-l-4 bg-white hover:shadow-md transition-all duration-150 text-xs shadow-sm border-slate-200/85 border-l-indigo-600 flex flex-col gap-1.5 cursor-pointer shrink-0"
                            >
                              <span className="font-extrabold text-slate-800 leading-snug line-clamp-2">
                                {e.title}
                              </span>
                              {timeRange && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md self-start">
                                  <Clock className="w-2.5 h-2.5 text-indigo-600" /> {timeRange}
                                </span>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AGENDA FEED: Grouped Timeline List */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-col h-[180px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Agenda Feed: Upcoming events this month
          </h4>
          
          <div className="flex-grow overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {events.filter(e => {
              if (!e.date) return false;
              const d = new Date(e.date);
              return d.getFullYear() === year && d.getMonth() === month;
            }).length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No scheduled events for {monthNames[month]}.
              </div>
            ) : (
              events
                .filter(e => {
                  if (!e.date) return false;
                  const d = new Date(e.date);
                  return d.getFullYear() === year && d.getMonth() === month;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(e => {
                  const eventDate = new Date(e.date);
                  const isPast = eventDate.getTime() < new Date().setHours(0,0,0,0);
                  const isCellToday = new Date().toDateString() === eventDate.toDateString();

                  let borderClass = "border-l-indigo-600 border-indigo-100 bg-white";
                  let titleColorClass = "text-slate-800 font-extrabold";
                  let tag = null;

                  if (isPast) {
                    borderClass = "border-l-slate-300 border-slate-200 bg-slate-50/50 opacity-60";
                    titleColorClass = "text-slate-500 font-bold";
                  } else if (isCellToday) {
                    borderClass = "border-l-emerald-600 border-emerald-200 bg-white";
                    titleColorClass = "text-slate-800 font-extrabold";
                    tag = (
                      <span className="text-[8px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase self-center shrink-0 shadow-sm border border-emerald-200">
                        Today
                      </span>
                    );
                  }

                  return (
                    <div key={e.id} className={`flex justify-between items-center p-3 rounded-xl border border-l-4 shadow-sm hover:shadow transition-all ${borderClass}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${isCellToday ? "bg-emerald-50 text-emerald-600" : isPast ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"}`}>
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate leading-snug ${titleColorClass}`}>{e.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>
                              {eventDate.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {e.startTime && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded font-semibold normal-case text-[9px]">
                                  <Clock className="w-2.5 h-2.5 text-indigo-600" />
                                  {formatTimeDisplay(e.startTime)}
                                  {e.endTime && ` - ${formatTimeDisplay(e.endTime)}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {tag}
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
