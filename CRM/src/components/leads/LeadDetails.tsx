"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, MapPin, Tag, Compass,
  DollarSign, ShieldAlert, Plus, CheckSquare, Square, FileText,
  MessageSquare, Bell, Edit, Check, X,
  Briefcase, CheckCircle2, Clock, Calendar
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import LabelDropdown from "./LabelDropdown";
import CalendarWidget from "./CalendarWidget";
import DocumentTab from "./DocumentTab";

interface LeadDetailsProps {
  id: string;
}

const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Negotiation",
  "Discussion",
  "Qualified",
  "Won",
  "Lost",
];

const statusClass: Record<LeadStatus, string> = {
  New: "bg-yellow-500 text-white border-yellow-600",
  Negotiation: "bg-purple-500 text-white border-purple-600",
  Discussion: "bg-teal-500 text-white border-teal-600",
  Qualified: "bg-blue-500 text-white border-blue-600",
  Won: "bg-green-500 text-white border-green-600",
  Lost: "bg-red-500 text-white border-red-600",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export default function LeadDetails({ id }: LeadDetailsProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "estimates" | "proposals" | "contracts">("overview");

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedContact, setEditedContact] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedOwner, setEditedOwner] = useState("");
  const [editedLabel, setEditedLabel] = useState("");
  const [editedSource, setEditedSource] = useState("");
  const [editedAmount, setEditedAmount] = useState(0);
  const [editedType, setEditedType] = useState<"person" | "organization">("person");
  const [editedAddress, setEditedAddress] = useState("");
  const [editedCity, setEditedCity] = useState("");
  const [editedState, setEditedState] = useState("");
  const [editedZip, setEditedZip] = useState("");
  const [editedDeadline, setEditedDeadline] = useState("");

  // Sub-widgets local form states
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactDesig, setNewContactDesig] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderContent, setNewReminderContent] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  // Fetch lead data
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Lead not found");
          } else {
            setError("Failed to load lead information");
          }
          return;
        }
        const data = (await res.json()) as Lead;
        setLead(data);
        syncEditForm(data);
      } catch (err) {
        console.error("Error fetching lead detail", err);
        setError("Network error while loading lead details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const syncEditForm = (data: Lead) => {
    setEditedName(data.name || "");
    setEditedContact(data.contact || "");
    setEditedPhone(data.phone || "");
    setEditedEmail(data.email || "");
    setEditedOwner(data.owner || "");
    setEditedLabel(data.label || "");
    setEditedSource(data.source || "");
    setEditedAmount(data.amount || 0);
    setEditedType(data.type || "person");
    setEditedAddress(data.address || "");
    setEditedCity(data.city || "");
    setEditedState(data.state || "");
    setEditedZip(data.zip || "");
    setEditedDeadline(data.deadline || "");
  };

  const handleUpdateLead = async (updated: Lead) => {
    setLead(updated);

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        throw new Error("Server responded with error status");
      }
      const refreshed = (await res.json()) as Lead;
      setLead(refreshed);
    } catch (err) {
      console.error("Failed to sync lead update to server", err);
      alert("Warning: Could not save changes to server. Please check your connection.");
    }
  };

  const handleSaveProfile = async () => {
    if (!lead) return;
    const updatedLead: Lead = {
      ...lead,
      name: editedName.trim(),
      contact: editedContact.trim(),
      phone: editedPhone.trim(),
      email: editedEmail.trim(),
      owner: editedOwner.trim(),
      label: editedLabel.trim(),
      source: editedSource.trim(),
      amount: Number(editedAmount) || 0,
      type: editedType,
      address: editedAddress.trim(),
      city: editedCity.trim(),
      state: editedState.trim(),
      zip: editedZip.trim(),
      deadline: editedDeadline,
    };

    await handleUpdateLead(updatedLead);
    setIsEditingProfile(false);
  };

  const handleCancelProfile = () => {
    if (lead) {
      syncEditForm(lead);
    }
    setIsEditingProfile(false);
  };

  // Contacts Actions
  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!newContactName.trim()) {
      alert("Contact name is required");
      return;
    }

    const newContact = {
      id: Math.random().toString(36).substring(2, 9),
      name: newContactName.trim(),
      designation: newContactDesig.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim(),
    };

    const updatedContacts = [...(lead.contactsList || []), newContact];
    await handleUpdateLead({ ...lead, contactsList: updatedContacts });

    setNewContactName("");
    setNewContactDesig("");
    setNewContactEmail("");
    setNewContactPhone("");
    setShowAddContact(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!lead) return;
    const updatedContacts = (lead.contactsList || []).filter(c => c.id !== contactId);
    await handleUpdateLead({ ...lead, contactsList: updatedContacts });
  };

  // Tasks Actions
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      done: false,
    };

    const updatedTasks = [...(lead.tasksList || []), newTask];
    await handleUpdateLead({ ...lead, tasksList: updatedTasks });

    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    if (!lead) return;
    const updatedTasks = (lead.tasksList || []).map(t =>
      t.id === taskId ? { ...t, done } : t
    );
    await handleUpdateLead({ ...lead, tasksList: updatedTasks });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!lead) return;
    const updatedTasks = (lead.tasksList || []).filter(t => t.id !== taskId);
    await handleUpdateLead({ ...lead, tasksList: updatedTasks });
  };

  // Calendar Event Actions
  const handleAddEvent = async (title: string, date: string, startTime?: string, endTime?: string) => {
    if (!lead) return;
    const newEvent = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      date,
      startTime,
      endTime,
    };

    const updatedEvents = [...(lead.eventsList || []), newEvent];
    await handleUpdateLead({ ...lead, eventsList: updatedEvents });
  };

  // Notes Actions
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!newNoteContent.trim()) return;

    const newNote = {
      id: Math.random().toString(36).substring(2, 9),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...(lead.notesList || [])];
    await handleUpdateLead({ ...lead, notesList: updatedNotes });

    setNewNoteContent("");
    setShowAddNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!lead) return;
    const updatedNotes = (lead.notesList || []).filter(n => n.id !== noteId);
    await handleUpdateLead({ ...lead, notesList: updatedNotes });
  };

  // Reminders Actions
  const handleAddReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!newReminderContent.trim()) return;

    const newReminder = {
      id: Math.random().toString(36).substring(2, 9),
      content: newReminderContent.trim(),
      time: newReminderTime || new Date().toISOString(),
    };

    const updatedReminders = [...(lead.remindersList || []), newReminder];
    await handleUpdateLead({ ...lead, remindersList: updatedReminders });

    setNewReminderContent("");
    setNewReminderTime("");
    setShowAddReminder(false);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!lead) return;
    const updatedReminders = (lead.remindersList || []).filter(r => r.id !== reminderId);
    await handleUpdateLead({ ...lead, remindersList: updatedReminders });
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    await handleUpdateLead({ ...lead, status: newStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">Loading Lead Details...</span>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md text-center max-w-sm w-full">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error || "Could not retrieve lead details."}</p>
          <Link href="/leads" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors">
            <ArrowLeft size={16} /> Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const estimateCount = lead.estimatesList?.length || 0;
  const proposalCount = lead.proposalsList?.length || 0;
  const contractCount = lead.contractsList?.length || 0;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="no-print">
        {/* Top Navbar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/leads"
                className="p-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-slate-200/60 bg-slate-50"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                    {lead.name}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    lead.type === "organization"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}>
                    {lead.type || "person"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-bold tracking-wide uppercase mt-1">
                  Lead Details Dashboard
                </p>
              </div>
            </div>

            {/* Quick Status Select */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Status:</span>
              <div className="relative inline-block">
                <select
                  value={lead.status}
                  onChange={(e) => void handleStatusChange(e.target.value as LeadStatus)}
                  className={`appearance-none outline-none cursor-pointer rounded-full px-4.5 py-2 pr-8.5 text-xs font-extrabold border shadow-sm ${
                    statusClass[lead.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-white text-gray-900 font-bold">
                      {status}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-white">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Header Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-20"><FileText size={48} /></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Estimates</p>
              <h3 className="text-3xl font-black mt-1.5">{estimateCount}</h3>
              <p className="text-[10px] text-blue-50/80 mt-1 font-semibold">Generated documents</p>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-20"><Briefcase size={48} /></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-teal-100">Proposals</p>
              <h3 className="text-3xl font-black mt-1.5">{proposalCount}</h3>
              <p className="text-[10px] text-teal-50/80 mt-1 font-semibold">Sent for consideration</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-20"><CheckCircle2 size={48} className="w-12 h-12" /></div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-100">Contracts</p>
              <h3 className="text-3xl font-black mt-1.5">{contractCount}</h3>
              <p className="text-[10px] text-purple-50/80 mt-1 font-semibold">Agreements compiled</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex border border-slate-200/80 border-b border-gray-200 bg-white rounded-xl p-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab("estimates")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "estimates"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Estimates
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "proposals"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Proposals
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "contracts"
                  ? "bg-indigo-50 text-indigo-700 font-extrabold shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Contracts
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === "overview" ? (
          <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Lead Profile, Notes, and Reminders (Moved here and styled) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4.5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <User size={15} />
                    </div>
                    Lead Profile
                  </h3>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleSaveProfile}
                        className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                        title="Save Profile"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancelProfile}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="p-4.5 space-y-4.5 text-sm">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Name</label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Type</label>
                      <select
                        value={editedType}
                        onChange={(e) => setEditedType(e.target.value as "person" | "organization")}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      >
                        <option value="person">Person</option>
                        <option value="organization">Organization</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Contact</label>
                      <input
                        type="text"
                        value={editedContact}
                        onChange={(e) => setEditedContact(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                      <input
                        type="text"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assignee</label>
                      <input
                        type="text"
                        value={editedOwner}
                        onChange={(e) => setEditedOwner(e.target.value)}
                        placeholder="Owner name"
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Labels</label>
                      <LabelDropdown
                        selectedLabels={editedLabel}
                        onChange={(labels) => setEditedLabel(labels)}
                        placeholder="Select labels"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
                      <input
                        type="text"
                        value={editedSource}
                        onChange={(e) => setEditedSource(e.target.value)}
                        placeholder="e.g. Website/Direct"
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Est. Amount (₹)</label>
                      <input
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deadline</label>
                      <input
                        type="date"
                        value={editedDeadline}
                        onChange={(e) => setEditedDeadline(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Address</label>
                      <input
                        type="text"
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        placeholder="Street"
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 focus:outline-none bg-white font-semibold text-slate-800"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editedCity}
                          onChange={(e) => setEditedCity(e.target.value)}
                          placeholder="City"
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          value={editedState}
                          onChange={(e) => setEditedState(e.target.value)}
                          placeholder="State"
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          value={editedZip}
                          onChange={(e) => setEditedZip(e.target.value)}
                          placeholder="ZIP"
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    {/* Primary Contact Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <User size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Contact</h4>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{lead.contact || "-"}</p>
                      </div>
                    </div>

                    {/* Phone Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Phone size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</h4>
                        <div className="mt-0.5 text-sm font-bold text-slate-800 space-y-0.5">
                          {lead.phone ? lead.phone.split(",").map((p, idx) => (
                            <a href={`tel:${p.trim()}`} key={idx} className="block text-indigo-600 hover:underline">{p.trim()}</a>
                          )) : "-"}
                        </div>
                      </div>
                    </div>

                    {/* Email Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Mail size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</h4>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-sm font-bold text-indigo-600 hover:underline block mt-0.5">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-sm font-bold text-slate-800 block mt-0.5">-</span>
                        )}
                      </div>
                    </div>

                    {/* Assignee Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignee</h4>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{lead.owner || "Unassigned"}</p>
                      </div>
                    </div>

                    {/* Deadline Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</h4>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {lead.deadline ? formatDate(lead.deadline) : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Label/Tags Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Tag size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Labels</h4>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {lead.label ? lead.label.split(",").map((l, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200/80 text-slate-700">
                              {l.trim()}
                            </span>
                          )) : <span className="text-xs text-slate-400">-</span>}
                        </div>
                      </div>
                    </div>

                    {/* Source Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <Compass size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source</h4>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{lead.source || "Direct Website"}</p>
                      </div>
                    </div>

                    {/* Deal Value Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Value</h4>
                        <p className="text-base font-black text-emerald-600 mt-0.5">
                          {(lead.amount || 0).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Address Block */}
                    <div className="flex gap-3">
                      <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-sm">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</h4>
                        <p className="text-xs text-slate-700 font-bold leading-relaxed mt-0.5">
                          {lead.address ? (
                            <>
                              {lead.address}
                              {(lead.city || lead.state) && <br />}
                              {lead.city}
                              {lead.city && lead.state && ", "}
                              {lead.state}
                              {lead.zip && ` - ${lead.zip}`}
                            </>
                          ) : (
                            "No address listed"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discussion Notes List Widget (Moved to Left Side) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <MessageSquare size={16} />
                    </div>
                    Discussion Notes
                  </h3>
                  <button
                    onClick={() => setShowAddNote(!showAddNote)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                </div>

                {showAddNote && (
                  <form onSubmit={handleAddNoteSubmit} className="p-4 border-b border-gray-100 bg-slate-50/30 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Note Details</label>
                      <textarea
                        required
                        rows={3}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Type details of client discussion..."
                        className="w-full text-sm border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowAddNote(false)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto no-scrollbar">
                  {!lead.notesList || lead.notesList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No notes recorded yet</p>
                  ) : (
                    lead.notesList.map((note) => (
                      <div key={note.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl relative group hover:border-slate-300 hover:shadow-sm transition-all border-l-4 border-l-indigo-500 shadow-sm">
                        <div className="flex justify-between items-start text-xs text-slate-400 font-bold mb-1.5">
                          <span>
                            {new Date(note.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <button
                            onClick={() => void handleDeleteNote(note.id)}
                            className="hidden group-hover:block text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Note"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-slate-700 font-semibold text-sm leading-relaxed whitespace-pre-line">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reminders List Widget (Moved to Left Side) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                      <Bell size={16} />
                    </div>
                    Reminders Alerts
                  </h3>
                  <button
                    onClick={() => setShowAddReminder(!showAddReminder)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add Reminder
                  </button>
                </div>

                {showAddReminder && (
                  <form onSubmit={handleAddReminderSubmit} className="p-4 border-b border-gray-100 bg-slate-50/30 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reminder Alert Details</label>
                      <input
                        type="text"
                        required
                        value={newReminderContent}
                        onChange={(e) => setNewReminderContent(e.target.value)}
                        placeholder="e.g. Call client to verify invoice acceptance"
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alert Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddReminder(false)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        Set Alert
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto no-scrollbar">
                  {!lead.remindersList || lead.remindersList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No reminder alerts configured</p>
                  ) : (
                    lead.remindersList.map((reminder) => (
                      <div key={reminder.id} className="flex justify-between items-center p-3.5 rounded-xl border border-red-100 bg-red-50/20 hover:bg-red-50/40 transition-all text-xs border-l-4 border-l-red-500 shadow-sm relative group hover:border-red-200">
                        <div className="flex gap-2.5 items-start">
                          <Bell className="text-red-500 w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{reminder.content}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                              Alert at: {new Date(reminder.time).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => void handleDeleteReminder(reminder.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                          title="Delete Alert"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Contacts directory, Tasks Checklist, CalendarWidget (Taller layout) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Contacts directory widget */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <User size={16} />
                    </div>
                    Contacts Directory
                  </h3>
                  <button
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add Contact
                  </button>
                </div>

                {showAddContact && (
                  <form onSubmit={handleAddContactSubmit} className="p-4 border-b border-gray-100 bg-slate-50/30 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900">New Contact Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="e.g. Sameer Verma"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation</label>
                        <input
                          type="text"
                          value={newContactDesig}
                          onChange={(e) => setNewContactDesig(e.target.value)}
                          placeholder="e.g. Director"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                        <input
                          type="email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          placeholder="sameer@org.com"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                        <input
                          type="text"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddContact(false)}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        Save Contact
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-4.5 space-y-3">
                  {!lead.contactsList || lead.contactsList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No other contacts registered</p>
                  ) : (
                    lead.contactsList.map((contact) => (
                      <div key={contact.id} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all text-xs shadow-sm bg-white">
                        <div>
                          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            {contact.name}
                            {contact.designation && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {contact.designation}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-slate-400 mt-1.5 text-[11px] font-bold">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 flex items-center gap-1">
                                <Mail size={13} className="text-slate-400" /> {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 flex items-center gap-1">
                                <Phone size={13} className="text-slate-400" /> {contact.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => void handleDeleteContact(contact.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Remove Contact"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tasks List checklist widget */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <CheckSquare size={16} />
                    </div>
                    Action Tasks Checklist
                  </h3>
                  <button
                    onClick={() => setShowAddTask(!showAddTask)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>

                {showAddTask && (
                  <form onSubmit={handleAddTaskSubmit} className="p-4 border-b border-gray-100 bg-slate-50/30 flex gap-2">
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                    >
                      Add
                    </button>
                  </form>
                )}

                <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {!lead.tasksList || lead.tasksList.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No pending action items</p>
                  ) : (
                    lead.tasksList.map((task) => (
                      <div
                        key={task.id}
                        className={`flex justify-between items-center p-3 rounded-lg border transition-all shadow-sm ${
                          task.done ? "bg-slate-50/50 border-slate-100" : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => void handleToggleTask(task.id, !task.done)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                          >
                            {task.done ? (
                              <CheckSquare className="text-indigo-600 w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                          <span className={`text-sm font-bold text-slate-700 ${task.done ? "line-through text-slate-400 font-medium" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                        <button
                          onClick={() => void handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Delete Task"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Event Calendar Widget */}
              <CalendarWidget events={lead.eventsList || []} onAddEvent={handleAddEvent} />

            </div>

          </div>
        ) : activeTab === "estimates" ? (
          <DocumentTab lead={lead} type="Estimate" onUpdateLead={handleUpdateLead} />
        ) : activeTab === "proposals" ? (
          <DocumentTab lead={lead} type="Proposal" onUpdateLead={handleUpdateLead} />
        ) : (
          <DocumentTab lead={lead} type="Contract" onUpdateLead={handleUpdateLead} />
        )}
      </div>
    </div>
  );
}
