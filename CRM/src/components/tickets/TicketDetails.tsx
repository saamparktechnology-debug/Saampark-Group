"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, X, Paperclip, Mic, Send, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, Table, Link2, RemoveFormatting, Code,
  ChevronDown, Phone, Mail, FileText, CheckCircle2, Clock, Plus, Square, CheckSquare,
  MoreHorizontal
} from "lucide-react";
import type { Ticket, TicketComment, TicketStatus, TicketTemplate } from "@/lib/types";

interface TicketDetailsProps {
  id: number;
}

const STATUS_OPTIONS: TicketStatus[] = ["New", "Open", "Closed"];

const statusStyles: Record<TicketStatus, string> = {
  New: "bg-[#ff9f00] text-white",
  Open: "bg-[#ff5b5b] text-white",
  Closed: "bg-[#3f51b5] text-white"
};

const AUTHOR_AVATARS: Record<string, string> = {
  "John Doe": "https://i.pravatar.cc/60?img=33",
  "Jane Smith": "https://i.pravatar.cc/60?img=12",
  "Sara Ann": "https://i.pravatar.cc/60?img=47",
  "Michael Wood": "https://i.pravatar.cc/60?img=11",
  "Richard Gray": "https://i.pravatar.cc/60?img=59",
  "Mark Thomas": "https://i.pravatar.cc/60?img=68",
  "Suraj": "https://i.pravatar.cc/60?img=60",
  "Randy Daniel": "https://i.pravatar.cc/60?img=9",
  "Blaze Rohan": "https://i.pravatar.cc/60?img=20",
  "Kolby Moore": "https://i.pravatar.cc/60?img=21",
  "Leif Hoeger": "https://i.pravatar.cc/60?img=22",
  "Abshire-Swaniawski": "https://i.pravatar.cc/60?img=23",
  "Demo Client": "https://i.pravatar.cc/60?img=24",
  "DuBuque Ltd": "https://i.pravatar.cc/60?img=25",
  "Hermiston-Wilkinson": "https://i.pravatar.cc/60?img=26",
  "Sammy Steuber": "https://i.pravatar.cc/60?img=27",
  "Unassigned": "https://i.pravatar.cc/60?img=9"
};

const CLIENT_CONTACT_INFO: Record<string, { phone: string; email: string }> = {
  "Randy Daniel": { phone: "531-459-1633", email: "randy.daniel@example.com" },
  "Blaze Rohan": { phone: "415-555-2671", email: "rohan.blaze@example.com" },
  "Kolby Moore": { phone: "206-555-0192", email: "kolby.moore@example.com" },
  "Leif Hoeger": { phone: "312-555-4081", email: "leif.hoeger@example.com" },
  "Abshire-Swaniawski": { phone: "908-555-7319", email: "info@abshire-swaniawski.com" },
  "Demo Client": { phone: "800-555-0199", email: "client@demo.com" },
  "DuBuque Ltd": { phone: "212-555-8830", email: "contact@dubuque.com" },
  "Hermiston-Wilkinson": { phone: "617-555-9012", email: "wilkinson@hermiston.com" },
  "Sammy Steuber": { phone: "408-555-6677", email: "sammy@steuber.com" }
};

function formatCommentTime(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const commentDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${String(d.getSeconds()).padStart(2, '0')} ${ampm}`;

    if (commentDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    } else if (commentDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    } else {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year} ${timeStr}`;
    }
  } catch {
    return dateStr;
  }
}

export default function TicketDetails({ id }: TicketDetailsProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editor states
  const [editorContent, setEditorContent] = useState("");
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState("");

  // Tasks states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Reminders states
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderContent, setNewReminderContent] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicketData = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) {
          setError("Ticket not found");
        } else {
          setError("Failed to load ticket details");
        }
        return;
      }
      const data = (await res.json()) as Ticket;
      setTicket(data);
    } catch (err) {
      console.error("Error fetching ticket", err);
      setError("Failed to retrieve ticket info.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTicketsAndTemplates = async () => {
    try {
      const ticketsRes = await fetch("/api/tickets", { cache: "no-store" });
      if (ticketsRes.ok) {
        const data = (await ticketsRes.json()) as Ticket[];
        setAllTickets(data);
      }

      const templatesRes = await fetch("/api/ticket-templates", { cache: "no-store" });
      if (templatesRes.ok) {
        const tpls = (await templatesRes.json()) as TicketTemplate[];
        setTemplates(tpls);
      }
    } catch (err) {
      console.error("Failed to load templates/tickets", err);
    }
  };

  useEffect(() => {
    void fetchTicketData();
    void fetchAllTicketsAndTemplates();
  }, [id]);

  const handleUpdateTicket = async (updated: Ticket) => {
    setTicket(updated);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) {
        throw new Error("Failed to save updates to server");
      }
      const refreshed = (await res.json()) as Ticket;
      setTicket(refreshed);
    } catch (err) {
      console.error("Error updating ticket details", err);
      alert("Error saving updates to server. Reverting...");
      void fetchTicketData();
    }
  };

  // Toggle ticket status between Open and Closed
  const handleToggleStatus = async () => {
    if (!ticket) return;
    const newStatus: TicketStatus = ticket.status === "Closed" ? "Open" : "Closed";
    await handleUpdateTicket({
      ...ticket,
      status: newStatus
    });
  };

  // Add Comment/Note Handler
  const handleAddComment = async (type: "message" | "note") => {
    if (!ticket || !editorContent.trim()) return;

    const newComment: TicketComment = {
      id: `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      content: editorContent.trim(),
      author: "John Doe", // Default user actor
      createdAt: new Date().toISOString(),
      avatar: AUTHOR_AVATARS["John Doe"],
      type
    };

    const currentComments = ticket.comments || [];
    // Place new comments at the top (reverse-chronological order)
    const updatedComments = [newComment, ...currentComments];

    // If a file was attached, simulate linking it in message/files list
    let updatedFiles = ticket.files || [];
    if (attachedFileName) {
      updatedFiles = [...updatedFiles, attachedFileName];
      setAttachedFileName("");
    }

    await handleUpdateTicket({
      ...ticket,
      comments: updatedComments,
      files: updatedFiles
    });

    setEditorContent("");
  };

  // Textarea formatting helper
  const handleFormat = (prefix: string, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const formatted = prefix + selected + suffix;

    setEditorContent(text.substring(0, start) + formatted + text.substring(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
    }
  };

  const handleSelectTemplate = (tpl: TicketTemplate) => {
    setEditorContent((prev) => (prev ? prev + "\n" : "") + tpl.description);
    setShowTemplatesDropdown(false);
  };

  // Sidebar widget handlers: Tasks
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newTaskTitle.trim()) return;

    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      done: false
    };

    const updatedTasks = [...(ticket.tasksList || []), newTask];
    await handleUpdateTicket({ ...ticket, tasksList: updatedTasks });

    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    if (!ticket) return;
    const updatedTasks = (ticket.tasksList || []).map((t) =>
      t.id === taskId ? { ...t, done } : t
    );
    await handleUpdateTicket({ ...ticket, tasksList: updatedTasks });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!ticket) return;
    const updatedTasks = (ticket.tasksList || []).filter((t) => t.id !== taskId);
    await handleUpdateTicket({ ...ticket, tasksList: updatedTasks });
  };

  // Sidebar widget handlers: Reminders
  const handleAddReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newReminderContent.trim()) return;

    const newReminder = {
      id: Math.random().toString(36).substring(2, 9),
      content: newReminderContent.trim(),
      time: newReminderTime || new Date().toISOString()
    };

    const updatedReminders = [...(ticket.remindersList || []), newReminder];
    await handleUpdateTicket({ ...ticket, remindersList: updatedReminders });

    setNewReminderContent("");
    setNewReminderTime("");
    setShowAddReminder(false);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!ticket) return;
    const updatedReminders = (ticket.remindersList || []).filter((r) => r.id !== reminderId);
    await handleUpdateTicket({ ...ticket, remindersList: updatedReminders });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">Loading Ticket Details...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md text-center max-w-sm w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error || "Could not retrieve ticket details."}</p>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            <ArrowLeft size={16} /> Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  const clientInfo = CLIENT_CONTACT_INFO[ticket.client] || {
    phone: "531-459-1633",
    email: "client@example.com"
  };

  const clientTicketsCount = Math.max(
    1,
    allTickets.filter((t) => t.client === ticket.client).length
  );

  const comments = ticket.comments || [];
  const inMessagesCount = comments.filter((c) => c.author === ticket.client).length;
  const outMessagesCount = comments.filter((c) => c.author !== ticket.client).length;

  return (
    <div className="bg-slate-50 min-h-screen pb-16 text-sm text-gray-700">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/tickets"
              className="p-2.5 rounded-lg text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors border border-slate-200/60 bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">
                  Ticket #{ticket.id} - {ticket.title}
                </h1>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${statusStyles[ticket.status]}`}>
                  {ticket.status}
                </span>
                <span className="text-gray-400 font-semibold hover:text-blue-600 cursor-pointer">
                  Add Label
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <img
                    src={AUTHOR_AVATARS[ticket.assignedTo || "Unassigned"] || AUTHOR_AVATARS["Unassigned"]}
                    alt={ticket.assignedTo}
                    className="w-5 h-5 rounded-full object-cover border border-gray-200"
                  />
                  <span className="font-semibold text-gray-600">{ticket.assignedTo || "John Doe"}</span>
                </div>
                <span className="text-gray-400">
                  {formatCommentTime(ticket.lastActivity)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3f51b5] hover:bg-[#303f9f] text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>{ticket.status === "Closed" ? "Mark as Open" : "Mark as Closed"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Messages & Canned Templates */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Rich Response Text Area Editor Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-1 text-gray-500">
              <button
                type="button"
                onClick={() => handleFormat("**", "**")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Bold"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("*", "*")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Italic"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("<u>", "</u>")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Underline"
              >
                <Underline size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("~~", "~~")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Strikethrough"
              >
                <Strikethrough size={15} />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => handleFormat("- ", "")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Bullet List"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("1. ", "")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Numbered List"
              >
                <ListOrdered size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("| Header | Header |\n|------|------|\n| Cell | Cell |", "")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Table"
              >
                <Table size={15} />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => handleFormat("[Link Text](url)", "")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Insert Link"
              >
                <Link2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setEditorContent("")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Clear format"
              >
                <RemoveFormatting size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleFormat("`", "`")}
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                title="Insert Code"
              >
                <Code size={15} />
              </button>
            </div>

            {/* Input area */}
            <div className="flex p-4 gap-3 bg-white">
              <img
                src={AUTHOR_AVATARS["John Doe"]}
                alt="Me"
                className="w-8 h-8 rounded-full border border-gray-200 shrink-0 mt-0.5 object-cover"
              />
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Reply to ticket..."
                  rows={5}
                  className="w-full text-sm border-0 focus:ring-0 outline-none resize-none placeholder-gray-400 text-gray-800"
                />
              </div>
            </div>

            {/* Footer Form Controls */}
            <div className="border-t border-gray-150 px-4 py-3 flex items-center justify-between bg-white text-xs">
              <div className="flex gap-2 relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Paperclip size={13} />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  className="p-1.5 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Mic size={13} />
                </button>

                {/* Templates Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded font-semibold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span>+ Template</span>
                  </button>
                  {showTemplatesDropdown && (
                    <div className="absolute left-0 bottom-full mb-1 z-30 bg-white border border-gray-200 shadow-xl rounded-lg w-56 max-h-48 overflow-y-auto divide-y divide-gray-100 py-1">
                      {templates.length > 0 ? (
                        templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectTemplate(tpl)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-55 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors font-semibold truncate block"
                            title={tpl.title}
                          >
                            {tpl.title}
                          </button>
                        ))
                      ) : (
                        <span className="block px-3 py-2 text-xs italic text-gray-400">
                          No templates seeded.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {attachedFileName && (
                  <span className="self-center text-xs text-green-600 font-semibold ml-2 flex items-center gap-1">
                    ✓ {attachedFileName}
                    <button onClick={() => setAttachedFileName("")} className="text-gray-400 hover:text-red-500 p-0.5">
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void handleAddComment("note")}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-55 bg-sky-50 text-sky-700 border-sky-200 transition-colors cursor-pointer"
                >
                  <span>Save as note</span>
                </button>
                <button
                  onClick={() => void handleAddComment("message")}
                  className="inline-flex items-center gap-1 px-4.5 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold rounded transition-colors cursor-pointer"
                >
                  <Send size={11} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Discussion feed list */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((c) => {
                const isNote = c.type === "note";
                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4.5 flex gap-3 transition-colors ${
                      isNote ? "bg-amber-50/40 border-l-4 border-l-amber-400" : ""
                    }`}
                  >
                    <img
                      src={c.avatar || AUTHOR_AVATARS[c.author] || AUTHOR_AVATARS["Unassigned"]}
                      alt={c.author}
                      className="w-8 h-8 rounded-full border border-gray-200 shrink-0 mt-0.5 object-cover"
                    />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{c.author}</span>
                          {isNote && (
                            <span className="inline-flex px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded uppercase tracking-wider">
                              Note
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 font-medium">
                          {formatCommentTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-gray-200 text-gray-450 italic font-medium p-8 text-center rounded-lg">
                No discussion messages recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Ticket Info Widget */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={15} className="text-gray-500" />
                <span>Ticket info</span>
              </h3>
            </div>
            <div className="p-4.5 space-y-4">
              <div className="flex justify-center">
                <span className="px-5 py-1.5 bg-[#f1f5f9] text-gray-700 font-semibold rounded text-xs">
                  {ticket.ticketType}
                </span>
              </div>
              <div className="grid grid-cols-2 border-y border-gray-100 py-3.5 text-center">
                <div className="border-r border-gray-100">
                  <h4 className="text-lg font-bold text-red-500">{inMessagesCount}</h4>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                    In messages
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-600">{outMessagesCount}</h4>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
                    Out messages
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                <Clock size={13} className="text-gray-400 shrink-0" />
                <span>{formatCommentTime(ticket.lastActivity)}</span>
              </div>
            </div>
          </div>

          {/* Client Info Widget */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4.5 space-y-4 text-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={AUTHOR_AVATARS[ticket.client] || AUTHOR_AVATARS["Unassigned"]}
                  alt={ticket.client}
                  className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0"
                />
                <div>
                  <Link href="/leads" className="font-bold text-sm text-blue-600 hover:underline">
                    {ticket.client}
                  </Link>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    Client contact profile
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1.5">
                <div className="flex items-center gap-3">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <a href={`tel:${clientInfo.phone}`} className="font-semibold text-gray-650 hover:underline">
                    {clientInfo.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <FileText size={13} className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-650">
                    {clientTicketsCount} Tickets
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <a href={`mailto:${clientInfo.email}`} className="font-semibold text-gray-400 hover:text-blue-600">
                    CC
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Widget */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle2 size={15} className="text-gray-500" />
                <span>Tasks</span>
              </h3>
              {!showAddTask && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add task</span>
                </button>
              )}
            </div>

            <div className="p-4 space-y-3">
              {showAddTask && (
                <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                    required
                  />
                  <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskTitle("");
                    }}
                    className="p-1.5 border border-gray-300 text-gray-600 rounded text-xs font-bold hover:bg-gray-50"
                  >
                    <X size={13} />
                  </button>
                </form>
              )}

              <div className="divide-y divide-gray-100">
                {(ticket.tasksList || []).length > 0 ? (
                  (ticket.tasksList || []).map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleTask(t.id, !t.done)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                        >
                          {t.done ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                        <span className={`text-xs font-semibold text-gray-700 ${t.done ? "line-through text-gray-400" : ""}`}>
                          {t.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTask(t.id)}
                        className="text-gray-350 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No tasks assigned to this ticket.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reminders Widget */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={15} className="text-gray-500" />
                <span>Reminders (Private)</span>
              </h3>
              {!showAddReminder && (
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add reminder</span>
                </button>
              )}
            </div>

            <div className="p-4 space-y-3">
              {showAddReminder && (
                <form onSubmit={handleAddReminderSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reminder text..."
                    value={newReminderContent}
                    onChange={(e) => setNewReminderContent(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                    />
                    <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddReminder(false);
                        setNewReminderContent("");
                        setNewReminderTime("");
                      }}
                      className="p-1.5 border border-gray-300 text-gray-600 rounded text-xs font-bold hover:bg-gray-50"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-gray-100">
                {(ticket.remindersList || []).length > 0 ? (
                  (ticket.remindersList || []).map((r) => (
                    <div key={r.id} className="py-2.5 flex items-start justify-between group text-xs">
                      <div>
                        <p className="font-semibold text-gray-700 leading-normal">{r.content}</p>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                          {new Date(r.time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteReminder(r.id)}
                        className="text-gray-350 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No active reminders set.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
