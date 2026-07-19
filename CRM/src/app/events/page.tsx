"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Lock,
  Tag,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Clock,
  AlignLeft,
  Palette
} from "lucide-react";

type EventItem = {
  _id?: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  color: string;
  startTime: string;
  endTime?: string;
  label?: string;
  type?: string;
};

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const EVENT_COLORS: { label: string; bg: string; light: string }[] = [
  { label: "Blue",    bg: "bg-[#4A90D9]",   light: "bg-[#dbeafe]" },
  { label: "Green",   bg: "bg-[#3BAA6E]",   light: "bg-[#dcfce7]" },
  { label: "Red",     bg: "bg-[#E05252]",   light: "bg-[#fee2e2]" },
  { label: "Purple",  bg: "bg-[#9B6DD6]",   light: "bg-[#ede9fe]" },
  { label: "Yellow",  bg: "bg-[#E5B83A]",   light: "bg-[#fef9c3]" },
  { label: "Pink",    bg: "bg-[#E06FA0]",   light: "bg-[#fce7f3]" },
  { label: "Indigo",  bg: "bg-[#5B6DD6]",   light: "bg-[#e0e7ff]" },
  { label: "Orange",  bg: "bg-[#E07B3A]",   light: "bg-[#ffedd5]" },
  { label: "Teal",    bg: "bg-[#2BA89A]",   light: "bg-[#ccfbf1]" },
];

const EVENT_LABELS = ["Work", "Personal", "Health", "Finance", "Social", "Other"];
const EVENT_TYPES  = ["Meeting", "Webinar", "Conference", "Symposium", "Workshop", "Other"];
const VIEW_MODES   = ["month", "week", "day", "list"] as const;
type ViewMode = typeof VIEW_MODES[number];

// Map tailwind bg class → hex for inline style fallback
const bgToHex: Record<string, string> = {
  "bg-[#4A90D9]": "#4A90D9",
  "bg-[#3BAA6E]": "#3BAA6E",
  "bg-[#E05252]": "#E05252",
  "bg-[#9B6DD6]": "#9B6DD6",
  "bg-[#E5B83A]": "#E5B83A",
  "bg-[#E06FA0]": "#E06FA0",
  "bg-[#5B6DD6]": "#5B6DD6",
  "bg-[#E07B3A]": "#E07B3A",
  "bg-[#2BA89A]": "#2BA89A",
  // Legacy support
  "bg-blue-500":   "#3b82f6",
  "bg-green-500":  "#22c55e",
  "bg-red-500":    "#ef4444",
  "bg-purple-500": "#a855f7",
  "bg-yellow-500": "#eab308",
  "bg-pink-500":   "#ec4899",
  "bg-indigo-500": "#6366f1",
  "bg-orange-500": "#f97316",
  "bg-teal-500":   "#14b8a6",
};

function hexFromBg(bg: string): string {
  return bgToHex[bg] ?? "#4A90D9";
}

export default function EventsPage() {
  const today = new Date();

  const [month, setMonth]             = useState(today.getMonth());
  const [year, setYear]               = useState(today.getFullYear());
  const [viewMode, setViewMode]       = useState<ViewMode>("month");
  const [events, setEvents]           = useState<EventItem[]>([]);
  const [showModal, setShowModal]     = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [notifiedEvents, setNotifiedEvents] = useState<string[]>([]);
  const [filterLabel, setFilterLabel] = useState("");
  const [filterType, setFilterType]   = useState("");
  const [showLabelDD, setShowLabelDD] = useState(false);
  const [showTypeDD, setShowTypeDD]   = useState(false);
  const [showManageLabels, setShowManageLabels] = useState(false);
  const [calendar, setCalendar]       = useState<(number | null)[][]>([]);

  const [form, setForm] = useState<Omit<EventItem, "_id">>({
    title: "",
    description: "",
    date: "",
    endDate: "",
    color: "bg-[#4A90D9]",
    startTime: "",
    endTime: "",
    label: "",
    type: "",
  });

  // ── Calendar generation ──────────────────────────────────────────────────
  const generateCalendar = (m: number, y: number) => {
    const firstDay  = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (let d = 1; d <= totalDays; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  };

  useEffect(() => { setCalendar(generateCalendar(month, year)); }, [month, year]);

  // ── Notifications ────────────────────────────────────────────────────────
  useEffect(() => { if ("Notification" in window) Notification.requestPermission(); }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach(event => {
        if (!event.startTime) return;
        const eventTime = new Date(`${event.date}T${event.startTime}`);
        const diff = (eventTime.getTime() - now.getTime()) / 60000;
        const key  = `${event._id}-${event.startTime}`;
        if (diff > 0 && diff <= 5 && !notifiedEvents.includes(key)) {
          if (Notification.permission === "granted") {
            new Notification("🔔 Event Reminder", { body: `${event.title} starts at ${event.startTime}` });
          }
          setNotifiedEvents(prev => [...prev, key]);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [events, notifiedEvents]);

  // ── Fetch events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res  = await fetch("/api/events");
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch { setEvents([]); }
    };
    fetchEvents();
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────
 const handleSave = async () => {
    if (!form.title || !form.date || !form.startTime) {
      alert("Title, date and start time are required.");
      return;
    }

    if (editingEvent?._id) {
      const res = await fetch("/api/events/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEvent._id, updateData: form }),
      });
      if (!res.ok) { alert("Failed to update event"); return; }
      setEvents(events.map(e => e._id === editingEvent._id ? { ...e, ...form } : e));

    } else {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      if (!text) {
        alert("Server returned empty response. Check MongoDB connection in terminal.");
        return;
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        alert("Invalid response from server: " + text);
        return;
      }

      if (!res.ok) {
        alert("Error saving event: " + result.error);
        return;
      }

      setEvents([...events, { ...form, _id: result.insertedId }]);
    }

    closeModal();
  };

  const handleDelete = async () => {
    if (!editingEvent?._id) return;
    await fetch("/api/events/delete", { method: "POST", body: JSON.stringify({ id: editingEvent._id }) });
    setEvents(events.filter(e => e._id !== editingEvent._id));
    closeModal();
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setForm({ title:"", description:"", date:"", endDate:"", color:"bg-[#4A90D9]", startTime:"", endTime:"", label:"", type:"" });
    setShowModal(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setForm({ 
      ...event,
      date: event.date ? event.date.split('T')[0] : "",
      endDate: event.endDate ? event.endDate.split('T')[0] : ""
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingEvent(null); };

  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);
  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);

  // ── Filtered events ───────────────────────────────────────────────────────
  const filteredEvents = events.filter(e => {
    if (filterLabel && e.label !== filterLabel) return false;
    if (filterType  && e.type  !== filterType)  return false;
    return true;
  });

  // Check if an event spans a given day (supports multi-day via endDate)
  const eventsForDay = (day: number) => {
    const cellStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => {
      if (!e.date) return false;
      const startStr = e.date.split('T')[0];
      const endStr = e.endDate ? e.endDate.split('T')[0] : startStr;
      return cellStr >= startStr && cellStr <= endStr;
    });
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // ── Week view helpers ─────────────────────────────────────────────────────
  const getWeekDays = () => {
    const dow    = today.getDay();
    const monday = new Date(today); monday.setDate(today.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  };

  const weekDays = getWeekDays();

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#6C63FF] to-[#4A90D9] p-2 rounded-lg">
            <CalendarDays size={20} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-800 tracking-tight">Event calendar</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Label filter */}
          <div className="relative">
            <button
              onClick={() => { setShowLabelDD(!showLabelDD); setShowTypeDD(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <Tag size={14} />
              {filterLabel || "- Event label -"}
              <ChevronDown size={13} />
            </button>
            {showLabelDD && (
              <div className="absolute top-9 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-1">
                <div onClick={() => { setFilterLabel(""); setShowLabelDD(false); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer">All labels</div>
                {EVENT_LABELS.map(l => (
                  <div key={l} onClick={() => { setFilterLabel(l); setShowLabelDD(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{l}</div>
                ))}
              </div>
            )}
          </div>

          {/* Type filter */}
          <div className="relative">
            <button
              onClick={() => { setShowTypeDD(!showTypeDD); setShowLabelDD(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              {filterType || "Event type"}
              <ChevronDown size={13} />
            </button>
            {showTypeDD && (
              <div className="absolute top-9 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-1">
                <div onClick={() => { setFilterType(""); setShowTypeDD(false); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer">All types</div>
                {EVENT_TYPES.map(t => (
                  <div key={t} onClick={() => { setFilterType(t); setShowTypeDD(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">{t}</div>
                ))}
              </div>
            )}
          </div>

          {/* Manage labels */}
          <button
            onClick={() => setShowManageLabels(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Tag size={14} /> Manage labels
          </button>

          {/* Add event */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#4A90D9] text-white text-sm font-medium hover:bg-[#3a7fc9] transition shadow"
          >
            <PlusCircle size={15} /> Add event
          </button>
        </div>
      </div>

      {/* ── CALENDAR TOOLBAR ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
            className="px-3 py-1 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition ml-1"
          >
            today
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-800">{months[month]} {year}</h2>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {VIEW_MODES.map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition capitalize ${
                viewMode === v ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTH VIEW ── */}
      {viewMode === "month" && (
        <div className="px-4 pt-0 pb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-l border-t border-gray-200 mt-0">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest border-r border-b border-gray-200 bg-white">{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {calendar.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-l border-gray-200">
              {week.map((day, di) => {
                const todayCell = day ? isToday(day) : false;
                const dayEvents = day ? eventsForDay(day) : [];
                // grey out days beyond current month (nulls)
                return (
                  <div
                    key={di}
                    className={`min-h-[110px] border-r border-b border-gray-200 p-1.5 relative transition
                      ${todayCell ? "bg-[#fffbe6]" : "bg-white hover:bg-gray-50"}
                      ${!day ? "bg-[#fafafa]" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <div className="flex items-start justify-between mb-1">
                          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                            ${todayCell ? "bg-[#4A90D9] text-white shadow" : "text-gray-700"}
                          `}>
                            {day}
                          </span>
                          {todayCell && <span className="text-[10px] text-[#4A90D9] font-semibold pt-1">Today</span>}
                        </div>

                        {dayEvents.slice(0, 3).map(e => (
                          <button
                            key={e._id || e.title}
                            onClick={() => openEditModal(e)}
                            className="w-full text-left mb-0.5 rounded-md overflow-hidden group"
                          >
                            <div
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-xs font-medium truncate"
                              style={{ backgroundColor: hexFromBg(e.color) }}
                            >
                              <Lock size={9} className="shrink-0 opacity-80" />
                              <span className="truncate">{e.title}</span>
                            </div>
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} more</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode === "week" && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {weekDays.map((d, i) => {
                const isTd = d.toDateString() === today.toDateString();
                return (
                  <div key={i} className={`text-center py-3 border-r border-gray-100 last:border-0 ${isTd ? "bg-[#fffbe6]" : ""}`}>
                    <div className="text-xs text-gray-400 uppercase">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</div>
                    <div className={`mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold
                      ${isTd ? "bg-[#4A90D9] text-white" : "text-gray-700"}`}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDays.map((d, i) => {
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayEvs = filteredEvents.filter(e => {
                  if (!e.date) return false;
                  const startStr = e.date.split('T')[0];
                  const endStr = e.endDate ? e.endDate.split('T')[0] : startStr;
                  return dStr >= startStr && dStr <= endStr;
                });
                return (
                  <div key={i} className="border-r border-gray-100 last:border-0 p-2 space-y-1">
                    {dayEvs.map(e => (
                      <button key={e._id} onClick={() => openEditModal(e)}
                        className="w-full text-left rounded-lg px-2 py-1.5 text-xs text-white font-medium truncate flex items-center gap-1"
                        style={{ backgroundColor: hexFromBg(e.color) }}>
                        <Lock size={9} />
                        <span className="truncate">{e.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {viewMode === "day" && (
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="py-4 text-center border-b border-gray-100 bg-[#fffbe6]">
              <div className="text-xs text-gray-400 uppercase">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][today.getDay()]}</div>
              <div className="text-3xl font-bold text-[#4A90D9] mt-1">{today.getDate()}</div>
              <div className="text-sm text-gray-500">{months[today.getMonth()]} {today.getFullYear()}</div>
            </div>
            <div className="p-4 space-y-2">
              {(() => {
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const todaysEvents = filteredEvents.filter(e => {
                  if (!e.date) return false;
                  const startStr = e.date.split('T')[0];
                  const endStr = e.endDate ? e.endDate.split('T')[0] : startStr;
                  return todayStr >= startStr && todayStr <= endStr;
                });
                
                if (todaysEvents.length === 0) {
                  return <p className="text-center text-gray-400 py-8 text-sm">No events today</p>;
                }
                
                return todaysEvents.map(e => (
                  <button key={e._id} onClick={() => openEditModal(e)}
                    className="w-full text-left rounded-xl p-3 text-sm text-white font-medium flex items-center gap-2"
                    style={{ backgroundColor: hexFromBg(e.color) }}>
                    <Lock size={12} />
                    <div>
                      <div>{e.title}</div>
                      {e.startTime && <div className="text-xs opacity-80 mt-0.5">⏰ {e.startTime}{e.endTime ? ` – ${e.endTime}` : ""}</div>}
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-16">No events found</div>
            ) : (
              [...filteredEvents].sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                <button key={e._id} onClick={() => openEditModal(e)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow transition text-left">
                  <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: hexFromBg(e.color) }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{e.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{e.date}{e.startTime ? ` · ${e.startTime}` : ""}{e.label ? ` · ${e.label}` : ""}</div>
                  </div>
                  <Lock size={14} className="text-gray-300 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-w-[95vw] p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{editingEvent ? "Edit Event" : "Add Event"}</h3>

            <div className="space-y-3">
              {/* Title */}
              <div className="relative">
                <AlignLeft size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                  placeholder="Event title *"
                  value={form.title || ""}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>

              {/* Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Start date *</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.date || ""} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">End date</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.endDate || ""} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={11}/> Start time *</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.startTime || ""} onChange={e => setForm({...form, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock size={11}/> End time</label>
                  <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.endTime || ""} onChange={e => setForm({...form, endTime: e.target.value})} />
                </div>
              </div>

              {/* Label & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Label</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.label || ""} onChange={e => setForm({...form, label: e.target.value})}>
                    <option value="">None</option>
                    {EVENT_LABELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                    value={form.type || ""} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="">None</option>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <textarea
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/40"
                placeholder="Description (optional)"
                rows={2}
                value={form.description || ""}
                onChange={e => setForm({...form, description: e.target.value})}
              />

              {/* Color picker */}
              <div>
                <label className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Palette size={11}/> Color</label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.bg}
                      onClick={() => setForm({...form, color: c.bg})}
                      className={`w-7 h-7 rounded-full border-2 transition ${form.color === c.bg ? "border-gray-800 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: hexFromBg(c.bg) }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-5 pt-4 border-t border-gray-100">
              {editingEvent ? (
                <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700 font-medium transition">Delete event</button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-xl text-sm text-white font-medium bg-[#4A90D9] hover:bg-[#3a7fc9] transition shadow">
                  {editingEvent ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE LABELS MODAL ── */}
      {showManageLabels && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowManageLabels(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Manage Labels</h3>
              <button onClick={() => setShowManageLabels(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-2">
              {EVENT_LABELS.map(l => (
                <div key={l} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{l}</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {events.filter(e => e.label === l).length} events
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Labels are pre-defined. Assign them when creating/editing events.</p>
          </div>
        </div>
      )}
    </div>
  );
}
