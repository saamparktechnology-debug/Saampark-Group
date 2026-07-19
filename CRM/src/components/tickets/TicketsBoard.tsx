"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search, Filter, PlusCircle, Tag, Settings, FileSpreadsheet, Printer,
  User, Users, ChevronDown, Check, X, ClipboardList, AlertCircle, Plus,
  FileText, Clock, HelpCircle, Columns, LayoutGrid, Maximize2, MoreHorizontal,
  Paperclip, Mic, Send, Pencil
} from "lucide-react";
import type { Ticket, TicketStatus, TicketTemplate } from "@/lib/types";

const STATUS_OPTIONS: TicketStatus[] = ["New", "Open", "Closed"];

const TICKET_TYPE_OPTIONS = ["General Support", "Sales Inquiry", "Bug Reports", "Custom Support"];

const ASSIGNEE_OPTIONS = [
  "John Doe",
  "Jane Smith",
  "Sara Ann",
  "Michael Wood",
  "Richard Gray",
  "Mark Thomas",
  "Suraj",
  "Unassigned"
];

const ASSIGNEE_AVATARS: Record<string, string> = {
  "John Doe": "https://i.pravatar.cc/60?img=33",
  "Jane Smith": "https://i.pravatar.cc/60?img=12",
  "Sara Ann": "https://i.pravatar.cc/60?img=47",
  "Michael Wood": "https://i.pravatar.cc/60?img=11",
  "Richard Gray": "https://i.pravatar.cc/60?img=59",
  "Mark Thomas": "https://i.pravatar.cc/60?img=68",
  "Suraj": "https://i.pravatar.cc/60?img=60",
  "Unassigned": "https://i.pravatar.cc/60?img=9"
};

const DEFAULT_CLIENTS = [
  "Randy Daniel",
  "Blaze Rohan",
  "Kolby Moore",
  "Leif Hoeger",
  "Abshire-Swaniawski",
  "Demo Client",
  "DuBuque Ltd",
  "Hermiston-Wilkinson",
  "Sammy Steuber"
];

const statusStyles: Record<TicketStatus, string> = {
  New: "bg-[#ff9f00] text-white",
  Open: "bg-[#ff5b5b] text-white",
  Closed: "bg-[#3f51b5] text-white"
};

function formatActivityTime(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const ticketDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    if (ticketDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    } else if (ticketDate.getTime() === yesterday.getTime()) {
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

export default function TicketsBoard() {
  const [activeTab, setActiveTab] = useState<"tickets" | "templates">("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [labelFilter, setLabelFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Templates States
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    title: "",
    description: "",
    ticketType: "-",
    private: false
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Templates Pagination
  const [templatesPerPage, setTemplatesPerPage] = useState(10);
  const [currentTemplatesPage, setCurrentTemplatesPage] = useState(1);

  // Add Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    client: "Randy Daniel",
    requestedBy: "Randy Daniel",
    ticketType: "Bug Reports",
    assignedTo: "John Doe",
    status: "New" as TicketStatus,
    description: "",
    labels: "",
    attachedFile: ""
  });

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch tickets and clients
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Ticket[];
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/ticket-templates", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TicketTemplate[];
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
    void fetchTemplates();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: TicketStatus) => {
    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, lastActivity: new Date().toISOString() } : t))
    );

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        console.error("Failed to update status on server");
        void fetchTickets();
      }
    } catch (err) {
      console.error("Error updating status", err);
      void fetchTickets();
    }
  };

  const handleSaveTicket = async () => {
    if (!formData.title.trim()) {
      alert("Title is required!");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          client: formData.client,
          requestedBy: formData.requestedBy || formData.client,
          ticketType: formData.ticketType,
          assignedTo: formData.assignedTo,
          status: formData.status,
          description: formData.description,
          labels: formData.labels,
          files: formData.attachedFile ? [formData.attachedFile] : []
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form
        setFormData({
          title: "",
          client: "Randy Daniel",
          requestedBy: "Randy Daniel",
          ticketType: "Bug Reports",
          assignedTo: "John Doe",
          status: "New",
          description: "",
          labels: "",
          attachedFile: ""
        });
        void fetchTickets();
      } else {
        alert("Failed to save ticket.");
      }
    } catch (err) {
      console.error("Failed to save ticket", err);
      alert("Error saving ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete ticket", err);
    }
  };

  // Save template handler (handles both Add and Edit)
  const handleSaveTemplate = async () => {
    if (!templateFormData.title.trim()) {
      alert("Title is required!");
      return;
    }

    setSavingTemplate(true);
    try {
      const isEdit = !!editingTemplate;
      const url = isEdit ? `/api/ticket-templates/${editingTemplate.id}` : "/api/ticket-templates";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateFormData.title,
          description: templateFormData.description,
          ticketType: templateFormData.ticketType,
          private: templateFormData.private
        })
      });

      if (res.ok) {
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
        setTemplateFormData({
          title: "",
          description: "",
          ticketType: "-",
          private: false
        });
        void fetchTemplates();
      } else {
        alert("Failed to save template.");
      }
    } catch (err) {
      console.error("Failed to save template", err);
      alert("Error saving template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/ticket-templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  };

  const openEditTemplateModal = (tpl: TicketTemplate) => {
    setEditingTemplate(tpl);
    setTemplateFormData({
      title: tpl.title,
      description: tpl.description,
      ticketType: tpl.ticketType,
      private: tpl.private
    });
    setIsTemplateModalOpen(true);
  };

  // Filtered lists
  const filteredTickets = useMemo(() => {
    let result = tickets;

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.client.toLowerCase().includes(query) ||
          t.ticketType.toLowerCase().includes(query) ||
          t.assignedTo?.toLowerCase().includes(query) ||
          String(t.id).includes(query)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (labelFilter) {
      result = result.filter(
        (t) => t.labels?.toLowerCase().includes(labelFilter.toLowerCase())
      );
    }

    return result;
  }, [tickets, search, statusFilter, labelFilter]);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.ticketType.toLowerCase().includes(query)
      );
    }
    return result;
  }, [templates, search]);

  const paginatedTemplates = useMemo(() => {
    const startIdx = (currentTemplatesPage - 1) * templatesPerPage;
    return filteredTemplates.slice(startIdx, startIdx + templatesPerPage);
  }, [filteredTemplates, currentTemplatesPage, templatesPerPage]);

  const totalTemplatesPages = Math.max(1, Math.ceil(filteredTemplates.length / templatesPerPage));

  const handleExportExcel = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTickets, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "crm-tickets.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, attachedFile: file.name }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 w-full min-h-screen">
      {/* Header and Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2 no-print">
        {/* Navigation Tabs */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "tickets"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Tickets
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "templates"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Templates
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 bg-white rounded hover:bg-gray-50 transition-colors">
            <Tag size={13} />
            <span>Manage labels</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 bg-white rounded hover:bg-gray-50 transition-colors">
            <Settings size={13} />
            <span>Settings</span>
          </button>
          {activeTab === "tickets" ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3f51b5] hover:bg-[#303f9f] text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>Add ticket</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateFormData({
                  title: "",
                  description: "",
                  ticketType: "-",
                  private: false
                });
                setIsTemplateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3f51b5] hover:bg-[#303f9f] text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>Add template</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Search / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center flex-wrap gap-3">
          {/* Columns Icon button */}
          <button className="p-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700">
            <Columns size={14} />
          </button>

          {activeTab === "tickets" && (
            <>
              {/* Status Filter Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none outline-none border border-gray-300 rounded py-1.5 pl-3 pr-8 text-xs bg-white text-gray-700 font-semibold cursor-pointer"
                >
                  <option value="All">All tickets</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
                  <ChevronDown size={11} />
                </div>
              </div>

              {/* Plus Filter Badge Trigger */}
              <button className="p-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-50">
                <Plus size={14} />
              </button>

              {/* Quick labels pills */}
              <div className="flex items-center gap-2">
                <span
                  onClick={() => setLabelFilter((prev) => (prev === "Important" ? "" : "Important"))}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                    labelFilter === "Important"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Important
                </span>
                <span
                  onClick={() => setStatusFilter((prev) => (prev === "Open" ? "All" : "Open"))}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                    statusFilter === "Open"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Open
                </span>
              </div>
            </>
          )}
        </div>

        {/* Excel, Print and Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === "tickets" && (
            <>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 bg-white rounded hover:bg-gray-50"
              >
                <span>Excel</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 bg-white rounded hover:bg-gray-50"
              >
                <span>Print</span>
              </button>
            </>
          )}
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded py-1.5 pl-8 pr-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-44 md:w-56 transition-all"
            />
          </div>
        </div>
      </div>

      {activeTab === "tickets" ? (
        /* Tickets tab layout view */
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white print:border-none print:shadow-none">
          {loading ? (
            <div className="p-8 text-center text-gray-500 font-semibold flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading tickets data...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px] print:min-w-full">
              <thead className="bg-[#f8fafc] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5 w-24">Ticket ID</th>
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Client</th>
                  <th className="px-4 py-3.5">Ticket type</th>
                  <th className="px-4 py-3.5">Labels</th>
                  <th className="px-4 py-3.5">Assigned to</th>
                  <th className="px-4 py-3.5 w-44">Last activity</th>
                  <th className="px-4 py-3.5 w-24 text-center">Status</th>
                  <th className="px-4 py-3.5 w-24 text-right no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3.5 text-blue-600 font-bold">
                        Ticket #{t.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/tickets/${t.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {t.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {t.client}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {t.ticketType}
                      </td>
                      <td className="px-4 py-3.5">
                        {t.labels ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-255">
                            {t.labels}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-300">
                            <img
                              src={ASSIGNEE_AVATARS[t.assignedTo || "Unassigned"] || ASSIGNEE_AVATARS["Unassigned"]}
                              alt={t.assignedTo}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="font-bold text-gray-700">{t.assignedTo || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {formatActivityTime(t.lastActivity)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="relative inline-block no-print">
                          <select
                            value={t.status}
                            onChange={(e) => void handleUpdateStatus(t.id, e.target.value as TicketStatus)}
                            className={`appearance-none outline-none cursor-pointer rounded px-2.5 py-1 pr-6.5 text-[10px] font-extrabold uppercase tracking-wide border-none text-center ${
                              statusStyles[t.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-gray-900 font-bold">
                                {st}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-white">
                            <ChevronDown size={9} />
                          </div>
                        </div>
                        <span className={`hidden print:inline-block rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${statusStyles[t.status]}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right no-print">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 text-gray-400 hover:text-blue-600 rounded">
                            <Maximize2 size={12} />
                          </button>
                          <button
                            onClick={() => void handleDeleteTicket(t.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400 bg-white italic font-medium">
                      No tickets found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Templates tab Dynamic Table view */
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white print:border-none print:shadow-none">
          {loadingTemplates ? (
            <div className="p-8 text-center text-gray-500 font-semibold flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading templates data...</span>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[800px] print:min-w-full">
                <thead className="bg-[#f8fafc] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5 w-44">Category</th>
                    <th className="px-4 py-3.5 w-24">Private</th>
                    <th className="px-4 py-3.5 w-24 text-right no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTemplates.length > 0 ? (
                    paginatedTemplates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <span
                            onClick={() => openEditTemplateModal(tpl)}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {tpl.title}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-605 font-medium whitespace-pre-wrap">
                          {tpl.description}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {tpl.ticketType}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {tpl.private ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3.5 text-right no-print">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditTemplateModal(tpl)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Edit Template"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => void handleDeleteTemplate(tpl.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete Template"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 bg-white italic font-medium">
                        No templates found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 no-print">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={templatesPerPage}
                      onChange={(e) => {
                        setTemplatesPerPage(Number(e.target.value));
                        setCurrentTemplatesPage(1);
                      }}
                      className="appearance-none outline-none border border-gray-300 rounded px-2.5 py-1 pr-6 bg-white cursor-pointer text-[11px]"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-gray-500">
                      <ChevronDown size={10} />
                    </div>
                  </div>
                  <span>
                    {filteredTemplates.length > 0
                      ? `${(currentTemplatesPage - 1) * templatesPerPage + 1}-${Math.min(
                          currentTemplatesPage * templatesPerPage,
                          filteredTemplates.length
                        )} / ${filteredTemplates.length}`
                      : "0-0 / 0"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentTemplatesPage((p) => Math.max(1, p - 1))}
                    disabled={currentTemplatesPage === 1}
                    className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 transition-colors"
                  >
                    &lt;
                  </button>
                  <span className="px-2.5 py-1 bg-gray-50 border border-gray-250 rounded font-bold text-gray-800">
                    {currentTemplatesPage}
                  </span>
                  <button
                    onClick={() => setCurrentTemplatesPage((p) => Math.min(totalTemplatesPages, p + 1))}
                    disabled={currentTemplatesPage === totalTemplatesPages}
                    className="px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Ticket Modal popup overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-base font-bold text-gray-700">Add ticket</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 text-sm text-gray-700">
              {/* Ticket Title */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              {/* Client dropdown selection */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Client</label>
                <div className="relative">
                  <select
                    value={formData.client}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client: e.target.value,
                        requestedBy: e.target.value
                      }))
                    }
                    className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white outline-none cursor-pointer transition-all text-xs font-semibold text-gray-800 appearance-none"
                  >
                    {DEFAULT_CLIENTS.map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDown size={11} />
                  </div>
                </div>
              </div>

              {/* Requested By dropdown */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-555">Requested by</label>
                <div className="relative">
                  <select
                    value={formData.requestedBy}
                    onChange={(e) => setFormData((prev) => ({ ...prev, requestedBy: e.target.value }))}
                    className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white outline-none cursor-pointer transition-all text-xs font-semibold text-gray-800 appearance-none"
                  >
                    {DEFAULT_CLIENTS.map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDown size={11} />
                  </div>
                </div>
              </div>

              {/* Ticket Type */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Ticket type</label>
                <div className="relative">
                  <select
                    value={formData.ticketType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ticketType: e.target.value }))}
                    className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white outline-none cursor-pointer transition-all text-xs font-semibold text-gray-800 appearance-none"
                  >
                    {TICKET_TYPE_OPTIONS.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDown size={11} />
                  </div>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="font-medium text-gray-555 pt-1">Description</label>
                <textarea
                  placeholder="Description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-850 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Assign to */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Assign to</label>
                <div className="relative">
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white outline-none cursor-pointer transition-all text-xs font-semibold text-gray-800 appearance-none"
                  >
                    {ASSIGNEE_OPTIONS.map((name) => (
                      <option key={name} value={name}>
                        {name === "Unassigned" ? "-" : name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDown size={11} />
                  </div>
                </div>
              </div>

              {/* Labels input field */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Labels</label>
                <input
                  type="text"
                  placeholder="Labels"
                  value={formData.labels}
                  onChange={(e) => setFormData((prev) => ({ ...prev, labels: e.target.value }))}
                  className="w-full border border-gray-205 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between bg-white rounded-b-lg text-xs">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Paperclip size={13} />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  className="p-2 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Mic size={13} />
                </button>

                {formData.attachedFile && (
                  <span className="self-center text-xs text-green-600 font-semibold ml-1.5">
                    ✓ {formData.attachedFile}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded cursor-pointer transition-all"
                >
                  <X size={12} />
                  <span>Close</span>
                </button>
                <button
                  onClick={handleSaveTicket}
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-4.5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold rounded cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check size={12} />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal popup overlay */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-base font-bold text-gray-700">
                {editingTemplate ? "Edit template" : "Add template"}
              </h2>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 text-sm text-gray-700">
              {/* Title input */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-550">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  value={templateFormData.title}
                  onChange={(e) => setTemplateFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-800 placeholder-gray-400"
                  required
                />
              </div>

              {/* Description textarea */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="font-medium text-gray-555 pt-1">Description</label>
                <textarea
                  placeholder="Description"
                  rows={5}
                  value={templateFormData.description}
                  onChange={(e) => setTemplateFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-205 rounded px-3 py-1.5 bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-xs font-semibold text-gray-850 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Ticket type dropdown select */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-555">Ticket type</label>
                <div className="relative">
                  <select
                    value={templateFormData.ticketType}
                    onChange={(e) => setTemplateFormData((prev) => ({ ...prev, ticketType: e.target.value }))}
                    className="w-full border border-gray-205 rounded px-3 py-1.5 bg-[#f5f5f5]/60 focus:bg-white outline-none cursor-pointer transition-all text-xs font-semibold text-gray-800 appearance-none"
                  >
                    <option value="-">-</option>
                    {TICKET_TYPE_OPTIONS.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDown size={11} />
                  </div>
                </div>
              </div>

              {/* Private checkbox */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-555">Private</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateFormData.private}
                    onChange={(e) => setTemplateFormData((prev) => ({ ...prev, private: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-end bg-white rounded-b-lg text-xs gap-3">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded cursor-pointer transition-all"
              >
                <X size={12} />
                <span>Close</span>
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="inline-flex items-center gap-1 px-4.5 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold rounded cursor-pointer transition-all disabled:opacity-50"
              >
                {savingTemplate ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Check size={12} />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
