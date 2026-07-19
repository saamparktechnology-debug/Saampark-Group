"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Search, Filter, PlusCircle, Tag, Upload, Eye, Pencil, X,
  LayoutGrid, List, FileSpreadsheet, Printer,
  Link as LinkIcon, Archive, Globe, Calendar
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import AddLeadModal from "@/components/modals/AddLeadModal";
import LabelDropdown from "./LabelDropdown";

const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Negotiation",
  "Discussion",
  "Qualified",
  "Won",
  "Lost",
];

const KANBAN_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: "New", label: "New", color: "border-yellow-400" },
  { id: "Qualified", label: "Qualified", color: "border-blue-400" },
  { id: "Discussion", label: "Discussion", color: "border-teal-400" },
  { id: "Negotiation", label: "Negotiation", color: "border-purple-400" },
  { id: "Won", label: "Won", color: "border-green-400" },
];

const statusClass: Record<LeadStatus, string> = {
  New: "bg-yellow-500 text-white border-yellow-600",
  Negotiation: "bg-purple-500 text-white border-purple-600",
  Discussion: "bg-teal-500 text-white border-teal-600",
  Qualified: "bg-blue-500 text-white border-blue-600",
  Won: "bg-green-500 text-white border-green-600",
  Lost: "bg-red-500 text-white border-red-600",
};

function formatFullDate(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    return `${day}-${month}-${year} ${strTime}`;
  } catch {
    return dateStr;
  }
}

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

const OWNER_AVATARS: Record<string, string> = {
  "John Doe": "https://i.pravatar.cc/60?img=33",
  "Jane Smith": "https://i.pravatar.cc/60?img=12",
  "Suraj": "https://i.pravatar.cc/60?img=47",
  "uyg": "https://i.pravatar.cc/60?img=59",
  "Unassigned": "https://i.pravatar.cc/60?img=9",
};

function getOwnerAvatar(owner: string) {
  if (!owner) return "https://i.pravatar.cc/60?img=95";
  return OWNER_AVATARS[owner] || `https://i.pravatar.cc/60?img=${(owner.charCodeAt(0) || 0) % 70}`;
}



export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "kanban">("leads");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/leads", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as Lead[];
          setLeads(data);
        }
      } catch (err) {
        console.error("Failed to fetch leads", err);
      }
    })();
  }, []);

  async function updateLeadStatus(id: string, status: LeadStatus) {
    try {
      // Optimistic update
      setLeads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        // Handle failure if needed
        console.error("Failed to update status on server");
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function updateLeadLabel(id: string, label: string) {
    try {
      // Optimistic update
      setLeads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, label } : item))
      );

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });

      if (!res.ok) {
        console.error("Failed to update label on server");
      }
    } catch (err) {
      console.error("Failed to update label", err);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete lead", err);
    }
  }

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;

    return leads.filter((lead) =>
      `${lead.name} ${lead.contact} ${lead.owner} ${lead.status} ${lead.phone} ${lead.label}`
        .toLowerCase()
        .includes(q)
    );
  }, [leads, search]);

  const totalAmount = filteredLeads.reduce(
    (sum, lead) => sum + (lead.amount || 0),
    0
  );

  // Drag and drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("leadId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("leadId");
    if (id) {
      void updateLeadStatus(id, status);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedLeads = JSON.parse(content);

        if (!Array.isArray(importedLeads)) {
          alert("Invalid file format. Expected a JSON array of leads.");
          return;
        }

        let importedCount = 0;
        for (const lead of importedLeads) {
          if (!lead.name || !lead.contact || !lead.owner) continue;

          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...lead,
              amount: Number(lead.amount) || 0,
            }),
          });

          if (res.ok) {
            const created = (await res.json()) as Lead;
            setLeads((prev) => [created, ...prev]);
            importedCount++;
          }
        }
        alert(`Successfully imported ${importedCount} leads!`);
      } catch (err) {
        console.error("Failed to parse or import leads", err);
        alert("Error importing leads. Please check the file format.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 w-full">
      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        {/* Left: Tabs */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "leads" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Leads
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "kanban" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Kanban
          </button>
        </div>

        {/* Right: Search and Buttons */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-300 rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Tag size={16} /> <span className="hidden sm:inline">Manage Labels</span>
          </button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} /> <span className="hidden sm:inline">Import Leads</span>
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={16} /> <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-3">
          {/* Grid/List toggle */}
          <div className="flex items-center border border-gray-300 rounded-md bg-gray-50 p-0.5">
            <button className="p-1 bg-white shadow-sm rounded text-gray-700"><List size={16} /></button>
            <button className="p-1 text-gray-500 hover:text-gray-700"><LayoutGrid size={16} /></button>
          </div>

          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Filter size={16} /> Filters
          </button>

          {/* Quick filters */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200 border border-gray-200 transition-colors">
              50%
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200 border border-gray-200 transition-colors">
              90%
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 border border-blue-200 transition-colors">
              Phone
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <span>{filteredLeads.length} lead(s)</span>
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Excel Export">
            <FileSpreadsheet size={18} />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Print">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(createdLead) => setLeads((prev) => [createdLead, ...prev])}
      />

      {/* Main Content Area */}
      <div className="mt-2 bg-[#f8fafc] rounded-lg border border-gray-200 overflow-hidden">
        {activeTab === "leads" ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Primary Contact</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Labels</th>
                  <th className="px-4 py-3 font-medium">Created at</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          {lead.name || "-"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                            {lead.contact ? lead.contact.charAt(0).toUpperCase() : "?"}
                          </div>
                          <span className="text-gray-700 font-medium">{lead.contact || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {lead.phone ? lead.phone.split(",").map((p, i) => (
                            <span key={i} className="text-gray-600 text-xs">{p.trim()}</span>
                          )) : <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-300">
                            <img
                              src={getOwnerAvatar(lead.owner)}
                              alt={lead.owner}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="text-gray-600 text-sm">{lead.owner || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LabelDropdown
                          selectedLabels={lead.label || ""}
                          onChange={(newLabel) => void updateLeadLabel(lead.id, newLabel)}
                          variant="compact"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 text-xs">
                          {formatFullDate(lead.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-550 font-medium">
                        {lead.deadline ? formatDate(lead.deadline) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            onChange={(e) => void updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                            className={`appearance-none outline-none cursor-pointer rounded-full px-3 py-1 pr-7 text-[11px] font-medium border ${statusClass[lead.status] || "bg-gray-100 text-gray-800"}`}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status} className="bg-white text-gray-900">
                                {status}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/leads/${lead.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View">
                            <Eye size={16} />
                          </Link>
                          <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => void deleteLead(lead.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 bg-white">
                      No leads found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-2">
              {KANBAN_COLUMNS.map((col) => {
                const columnLeads = filteredLeads.filter(lead => lead.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col w-72 bg-gray-50 rounded-lg shrink-0 border border-gray-200"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    {/* Column Header */}
                    <div className={`p-3 border-t-4 ${col.color} bg-white rounded-t-lg border-b border-gray-200 flex justify-between items-center`}>
                      <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{col.label}</span>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md">
                        {columnLeads.length}
                      </span>
                    </div>

                    {/* Column Body */}
                    <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                      {columnLeads.length > 0 ? (
                        columnLeads.map((lead) => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className="bg-white border border-gray-200 rounded-md p-3 mb-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow transition-all"
                          >
                            {/* Top Row: Lead Name & Icons */}
                            <div className="flex justify-between items-start mb-2">
                              <Link href={`/leads/${lead.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-[13px] leading-tight line-clamp-2 pr-2">
                                {lead.name}
                              </Link>
                              <div className="flex gap-1.5 text-gray-400 shrink-0">
                                <LinkIcon size={14} className="hover:text-blue-500 cursor-pointer transition-colors" />
                                <Archive size={14} className="hover:text-gray-600 cursor-pointer transition-colors" />
                              </div>
                            </div>

                            {/* Middle Section: Source info */}
                            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-gray-500">
                              <Globe size={13} className="text-blue-500" />
                              <span>Website/Direct</span>
                            </div>

                            {/* Deadline */}
                            {lead.deadline && (
                              <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                                <Calendar size={13} className="text-rose-500 shrink-0" />
                                <span className="font-semibold text-rose-600">
                                  {formatDate(lead.deadline)}
                                </span>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {lead.label ? lead.label.split(",").map((l, i) => {
                                const text = l.trim();
                                let badgeClass = "bg-gray-100 text-gray-600 border-gray-200";

                                if (text.toLowerCase().includes("call this week")) {
                                  badgeClass = "bg-purple-50 text-purple-700 border-purple-100";
                                } else if (text.toLowerCase().includes("90% probability")) {
                                  badgeClass = "bg-green-50 text-green-700 border-green-100";
                                } else if (text.toLowerCase().includes("50% probability")) {
                                  badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
                                }

                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeClass}`}
                                  >
                                    {text}
                                  </span>
                                );
                              }) : null}
                            </div>

                            {/* Bottom Row: Lead Count & Owner */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-gray-400" title="Tasks/Counts">
                                <List size={13} />
                                <span className="text-[11px] font-medium text-gray-500">1</span>
                              </div>
                              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-indigo-200" title={lead.owner}>
                                <img
                                  src={getOwnerAvatar(lead.owner)}
                                  alt={lead.owner}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full min-h-[100px] flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-md bg-gray-50/50">
                          No leads found
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Total */}
      <div className="flex justify-end pt-2">
        <div className="text-right text-sm">
          <span className="text-gray-500 mr-2">Total Amount:</span>
          <span className="font-semibold text-gray-900">
            {totalAmount.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
