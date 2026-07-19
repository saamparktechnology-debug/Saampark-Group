"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  ArrowUp, Filter, PlusCircle, Search, Trash2, Edit, X,
  Upload, Printer, FileSpreadsheet, Plus, HelpCircle,
  Folder, User, Users, Calendar, ClipboardList, RefreshCw, AlertCircle,
  Clock, ExternalLink, Copy, Send
} from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import LabelDropdown from "../leads/LabelDropdown";

const STATUS_OPTIONS: TaskStatus[] = ["To do", "In progress", "Review", "Done"];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;

const RELATED_TO_OPTIONS = [
  "-",
  "Business Card and Stationery Design",
  "Virtual Reality Experience Design",
  "Data Analysis and Insights",
  "Product Packaging Design"
];

const ASSIGNEE_OPTIONS = ["John Doe", "Jane Smith", "Suraj", "Unassigned"];

const POINTS_OPTIONS = ["1 Point", "2 Points", "3 Points", "5 Points"];

const TASK_LABEL_OPTIONS = ["Design", "Feedback", "Enhancement", "Bug", "Quality"];

const statusClass: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  "To do": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "In progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Review: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Done: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
};

const getBadgeClass = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes("design")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (lower.includes("feedback")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }
  if (lower.includes("enhancement")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (lower.includes("bug")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

const isOverdueOrSoon = (deadline?: string) => {
  if (!deadline) return false;
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // overdue or within 3 days
  } catch {
    return false;
  }
};

const getMilestone = (relatedTo?: string) => {
  if (!relatedTo || relatedTo === "-") return "-";
  if (relatedTo.includes("Business Card") || relatedTo.includes("Product Packaging")) return "Beta Release";
  return "Release";
};

export default function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<"list" | "kanban">("list");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [infoTask, setInfoTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "bug" | "my">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    title: "",
    description: "",
    relatedTo: "-",
    points: "1 Point",
    assignedTo: "John Doe",
    collaborators: "-",
    status: "To do" as TaskStatus,
    priority: "Low" as "Low" | "Medium" | "High",
    labels: "",
    startDate: "",
    deadline: "",
    recurring: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = (await res.json()) as Task[];
        // Sort descending by ID to show newest first
        setTasks(data.sort((a, b) => b.id - a.id));
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, []);

  // Update Status (Optimistic)
  const updateTaskStatus = async (id: number, status: TaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        console.error("Failed to update status on server");
        void fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update status", err);
      void fetchTasks();
    }
  };

  // Delete Task
  const deleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        console.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingTask(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      relatedTo: task.relatedTo || "-",
      points: task.points || "1 Point",
      assignedTo: task.assignedTo || "John Doe",
      collaborators: task.collaborators || "-",
      status: task.status,
      priority: task.priority || "Low",
      labels: task.labels || "",
      startDate: task.startDate || "",
      deadline: task.deadline || "",
      recurring: !!task.recurring
    });
    setIsModalOpen(true);
  };

  // Save Task (Add or Edit)
  const saveTask = async (closeAfterSave = true) => {
    if (!formData.title.trim()) {
      alert("Task Title is required");
      return;
    }

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const method = editingTask ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        void fetchTasks();
        if (closeAfterSave) {
          setIsModalOpen(false);
        } else {
          // "Save & show" mode, just clear title but keep modal open or prefilled for next
          setFormData(initialFormState);
          setEditingTask(null);
        }
      } else {
        alert("Failed to save task");
      }
    } catch (err) {
      console.error("Failed to save task", err);
    }
  };

  const saveInfoTaskChange = async (updated: Task) => {
    setInfoTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    try {
      await fetch(`/api/tasks/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to sync task change", err);
    }
  };

  const cloneTask = async (taskToClone: Task) => {
    const clonedData = {
      title: `${taskToClone.title} (Clone)`,
      description: taskToClone.description,
      relatedTo: taskToClone.relatedTo,
      points: taskToClone.points,
      assignedTo: taskToClone.assignedTo,
      collaborators: taskToClone.collaborators,
      status: taskToClone.status,
      priority: taskToClone.priority,
      labels: taskToClone.labels,
      startDate: taskToClone.startDate,
      deadline: taskToClone.deadline,
      recurring: taskToClone.recurring,
      avatar: taskToClone.avatar,
      checklist: taskToClone.checklist,
      subTasks: taskToClone.subTasks,
      comments: taskToClone.comments,
      timeLogged: taskToClone.timeLogged
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clonedData)
      });
      if (res.ok) {
        void fetchTasks();
        setInfoTask(null);
      }
    } catch (err) {
      console.error("Failed to clone task", err);
    }
  };

  // Import Tasks
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedTasks = JSON.parse(content);

        if (!Array.isArray(importedTasks)) {
          alert("Invalid file format. Expected a JSON array of tasks.");
          return;
        }

        let importedCount = 0;
        for (const t of importedTasks) {
          if (!t.title) continue;

          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t)
          });

          if (res.ok) {
            importedCount++;
          }
        }
        alert(`Successfully imported ${importedCount} tasks!`);
        void fetchTasks();
      } catch (err) {
        console.error("Failed to parse or import tasks", err);
        alert("Error importing tasks. Please check the file format.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Export to Excel (JSON download)
  const exportToExcel = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tasks_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("taskId", String(id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("taskId");
    if (idStr) {
      void updateTaskStatus(Number(idStr), status);
    }
  };

  // Filter and search computation
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((t) =>
        `${t.title} ${t.id} ${t.status} ${t.assignedTo} ${t.labels || ""}`
          .toLowerCase()
          .includes(q)
      );
    }

    // Filter type pills
    if (filterType === "bug") {
      result = result.filter((t) => t.labels?.toLowerCase().includes("bug"));
    } else if (filterType === "my") {
      result = result.filter((t) => t.assignedTo === "John Doe");
    }

    return result;
  }, [tasks, search, filterType]);

  // Kanban groups
  const kanbanColumns = useMemo(() => {
    return [
      { id: "To do" as TaskStatus, borderClass: "border-[#f0ad2e]", title: "To do" },
      { id: "In progress" as TaskStatus, borderClass: "border-[#3f8cff]", title: "In progress" },
      { id: "Review" as TaskStatus, borderClass: "border-[#be31be]", title: "Review" },
      { id: "Done" as TaskStatus, borderClass: "border-[#17b893]", title: "Done" }
    ].map((col) => ({
      ...col,
      tasks: filteredTasks.filter((t) => t.status === col.id)
    }));
  }, [filteredTasks]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 w-full min-h-screen text-gray-800">
      
      {/* Header and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2">
        {/* Left: Tab list */}
        <div className="flex space-x-1">
          <span className="self-center font-bold text-gray-800 text-lg mr-4 uppercase tracking-wide">Tasks</span>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "list"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "kanban"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Kanban
          </button>
          <button className="px-4 py-2 text-sm font-semibold border-b-2 border-transparent text-gray-400 cursor-not-allowed">
            Gantt
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <ClipboardList size={14} />
            <span>Manage labels</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} />
            <span>Import tasks</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} />
            <span>Add multiple tasks</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PlusCircle size={14} />
            <span>Add task</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Filter size={13} />
            Filters
          </button>
          
          <button className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-500">
            <Plus size={13} />
          </button>
          
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-full border font-semibold transition-all ${
              filterType === "all"
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All tasks
          </button>
          
          <button
            onClick={() => setFilterType("bug")}
            className={`px-3 py-1.5 rounded-full border font-semibold transition-all ${
              filterType === "bug"
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Bug
          </button>
          
          <button className="p-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-500">
            <AlertCircle size={13} />
          </button>
          
          <button className="p-1.5 bg-white border border-gray-300 rounded-full hover:bg-gray-50 text-gray-500">
            <ArrowUp size={13} />
          </button>
          
          <button
            onClick={() => setFilterType("my")}
            className={`px-3 py-1.5 rounded-full border font-semibold transition-all ${
              filterType === "my"
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            My Tasks
          </button>
          
          <button className="px-3 py-1.5 rounded-full bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 font-semibold">
            Recently Updated
          </button>
        </div>

        {/* Right side search & export */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Export as JSON"
          >
            <FileSpreadsheet size={13} />
            <span>Excel</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Print Page"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded py-1.5 pl-8 pr-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-44 md:w-56 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Status</label>
            <select
              onChange={(e) => setSearch(e.target.value === "All" ? "" : e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white outline-none"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Assigned To</label>
            <select
              onChange={(e) => setSearch(e.target.value === "All" ? "" : e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white outline-none"
            >
              <option value="All">All Assignees</option>
              {ASSIGNEE_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Label</label>
            <select
              onChange={(e) => setSearch(e.target.value === "All" ? "" : e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white outline-none"
            >
              <option value="All">All Labels</option>
              {TASK_LABEL_OPTIONS.map((lbl) => (
                <option key={lbl} value={lbl}>{lbl}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="mt-2">
        {activeTab === "list" ? (
          // LIST VIEW: Table layout matching screenshot
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th className="px-4 py-3 w-16">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 w-28">Start date</th>
                  <th className="px-4 py-3 w-28">Deadline</th>
                  <th className="px-4 py-3 w-28">Milestone</th>
                  <th className="px-4 py-3">Related to</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3 w-28">Collaborators</th>
                  <th className="px-4 py-3 w-28">Status</th>
                  <th className="px-4 py-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const isRedDeadline = isOverdueOrSoon(task.deadline) && task.status !== "Done";
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </td>
                        <td onClick={() => setInfoTask(task)} className="px-4 py-3 text-gray-400 font-medium hover:text-blue-600 cursor-pointer">{task.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span onClick={() => setInfoTask(task)} className="font-semibold text-gray-700 hover:text-blue-600 hover:underline cursor-pointer">
                                {task.title}
                              </span>
                              {task.priority === "High" && (
                                <span
                                  className="inline-flex items-center justify-center bg-orange-100 text-orange-700 rounded-full w-4.5 h-4.5 text-[9px] font-extrabold"
                                  title="High Priority"
                                >
                                  ↑
                                </span>
                              )}
                            </div>
                            {task.labels && (
                              <div className="flex flex-wrap gap-1">
                                {task.labels.split(",").map((l, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getBadgeClass(
                                      l.trim()
                                    )}`}
                                  >
                                    {l.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{task.startDate ? formatDate(task.startDate) : "-"}</td>
                        <td className={`px-4 py-3 font-semibold ${isRedDeadline ? "text-red-500" : "text-gray-500"}`}>
                          {task.deadline ? formatDate(task.deadline) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{getMilestone(task.relatedTo)}</td>
                        <td className="px-4 py-3">
                          {task.relatedTo && task.relatedTo !== "-" ? (
                            <span className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer font-medium">
                              {task.relatedTo}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 bg-gray-200">
                              <img
                                src={task.avatar || `https://i.pravatar.cc/60?img=${task.id % 50}`}
                                alt="avatar"
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <span className="font-semibold text-gray-700">{task.assignedTo || "John Doe"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{task.collaborators || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                              statusClass[task.status]?.bg
                            } ${statusClass[task.status]?.text} ${statusClass[task.status]?.border}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => void deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Task"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-400 bg-white">
                      No tasks found. Click "Add task" to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // KANBAN BOARD VIEW: Column layout
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 overflow-x-auto pb-4">
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className="min-h-[500px] rounded-lg border border-gray-200 bg-gray-50/50 p-3 flex flex-col gap-2"
              >
                {/* Column header */}
                <div className={`rounded border-t-2 ${column.borderClass} bg-white p-2.5 shadow-sm`}>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>{column.title}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Column body tasks */}
                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[70vh]">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5 bg-gray-150">
                            <img
                              src={task.avatar || `https://i.pravatar.cc/60?img=${task.id % 50}`}
                              alt="avatar"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-1">
                            <p onClick={() => setInfoTask(task)} className="text-xs font-semibold text-gray-700 hover:text-blue-600 hover:underline cursor-pointer leading-tight">
                              {task.id}. {task.title}
                            </p>
                            {task.deadline && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                <Calendar size={11} className={isOverdueOrSoon(task.deadline) && task.status !== "Done" ? "text-rose-500" : "text-gray-400"} />
                                <span className={isOverdueOrSoon(task.deadline) && task.status !== "Done" ? "text-rose-600 font-semibold" : ""}>
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badges and action overlay */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1">
                            {task.labels &&
                              task.labels.split(",").map((l, i) => (
                                <span
                                  key={i}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getBadgeClass(
                                    l.trim()
                                  )}`}
                                >
                                  {l.trim()}
                                </span>
                              ))}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(task)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => void deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center p-6 text-gray-400 text-[11px] italic min-h-[100px]">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task form Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">
                {editingTask ? "Edit task" : "Add task"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body (Scrollable form) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
              
              {/* Task Title */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              {/* Task Description */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide pt-1.5">Description</label>
                <textarea
                  placeholder="Description of the task"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Related to */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Related to</label>
                <select
                  value={formData.relatedTo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, relatedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  {RELATED_TO_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Points */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Points</label>
                <select
                  value={formData.points}
                  onChange={(e) => setFormData((prev) => ({ ...prev, points: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  {POINTS_OPTIONS.map((pts) => (
                    <option key={pts} value={pts}>{pts}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Assign to</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  {ASSIGNEE_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Collaborators */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Collaborators</label>
                <input
                  type="text"
                  placeholder="Collaborator name(s)"
                  value={formData.collaborators}
                  onChange={(e) => setFormData((prev) => ({ ...prev, collaborators: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Status */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as "Low" | "Medium" | "High" }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
                >
                  {PRIORITY_OPTIONS.map((prio) => (
                    <option key={prio} value={prio}>{prio}</option>
                  ))}
                </select>
              </div>

              {/* Labels dropdown select */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Labels</label>
                <div className="w-full">
                  <LabelDropdown
                    selectedLabels={formData.labels}
                    onChange={(lbls) => setFormData((prev) => ({ ...prev, labels: lbls }))}
                    placeholder="Select Label"
                    options={TASK_LABEL_OPTIONS}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Start date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Deadline */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Recurring */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-semibold text-gray-600 uppercase tracking-wide">Recurring</label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recurring: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Enable recurring task</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Upload size={13} />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  className="p-1.5 bg-white border border-gray-300 rounded text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle size={13} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 bg-white rounded text-gray-700 font-semibold hover:bg-gray-50 transition-all text-xs cursor-pointer"
                >
                  Close
                </button>
                {!editingTask && (
                  <button
                    onClick={() => void saveTask(false)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded font-semibold hover:bg-blue-100 transition-all text-xs cursor-pointer"
                  >
                    Save & show
                  </button>
                )}
                <button
                  onClick={() => void saveTask(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 shadow-sm transition-all text-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {infoTask && (
        <TaskInfoModal
          task={infoTask}
          onClose={() => {
            setInfoTask(null);
            void fetchTasks();
          }}
          onEdit={() => {
            openEditModal(infoTask);
            setInfoTask(null);
          }}
          onDelete={() => {
            void deleteTask(infoTask.id);
            setInfoTask(null);
          }}
          onClone={() => {
            void cloneTask(infoTask);
          }}
          saveInfoTaskChange={saveInfoTaskChange}
        />
      )}
    </div>
  );
}

interface TaskInfoModalProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  saveInfoTaskChange: (updated: Task) => Promise<void>;
}

function TaskInfoModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onClone,
  saveInfoTaskChange
}: TaskInfoModalProps) {
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLogged, setTimeLogged] = useState(task.timeLogged || 0);

  // Sync elapsed time with task data on load or ID change
  useEffect(() => {
    setTimeLogged(task.timeLogged || 0);
    setTimerRunning(false);
  }, [task.id, task.timeLogged]);

  // Timer running interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeLogged((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleToggleTimer = () => {
    if (timerRunning) {
      setTimerRunning(false);
      void saveInfoTaskChange({ ...task, timeLogged });
    } else {
      setTimerRunning(true);
    }
  };

  const handleClose = () => {
    if (timerRunning) {
      void saveInfoTaskChange({ ...task, timeLogged });
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistItem.trim(),
      done: false
    };
    void saveInfoTaskChange({
      ...task,
      checklist: [...(task.checklist || []), newItem]
    });
    setNewChecklistItem("");
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = (task.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    void saveInfoTaskChange({ ...task, checklist: updated });
  };

  const handleDeleteChecklist = (itemId: string) => {
    const updated = (task.checklist || []).filter((item) => item.id !== itemId);
    void saveInfoTaskChange({ ...task, checklist: updated });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      done: false
    };
    void saveInfoTaskChange({
      ...task,
      subTasks: [...(task.subTasks || []), newItem]
    });
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = (task.subTasks || []).map((item) =>
      item.id === subId ? { ...item, done: !item.done } : item
    );
    void saveInfoTaskChange({ ...task, subTasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = (task.subTasks || []).filter((item) => item.id !== subId);
    void saveInfoTaskChange({ ...task, subTasks: updated });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      content: newComment.trim(),
      author: "John Doe",
      createdAt: new Date().toISOString(),
      avatar: "https://i.pravatar.cc/60?img=1"
    };
    void saveInfoTaskChange({
      ...task,
      comments: [newItem, ...(task.comments || [])]
    });
    setNewComment("");
  };

  const checklistList = task.checklist || [];
  const checklistTotal = checklistList.length;
  const checklistDone = checklistList.filter((item) => item.done).length;

  const subTasksList = task.subTasks || [];
  const commentsList = task.comments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">
              Task info #{task.id}
            </h2>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="text-blue-500 hover:text-blue-700"
              title="Open Editor"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Left Column: Title, description, checklist, subtasks, comments */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                {task.title}
              </h1>
              <p className="text-gray-600 text-xs leading-relaxed mb-4">
                {task.description || "No description provided."}
              </p>
              <div className="text-xs text-gray-500">
                Project:{" "}
                {task.relatedTo && task.relatedTo !== "-" ? (
                  <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                    {task.relatedTo}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>

            {/* Checklist Widget */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  Checklist {checklistTotal > 0 ? `(${checklistDone}/${checklistTotal})` : ""}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span>Sortable</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Add checklist item */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add item"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddChecklist}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-600 border border-gray-300"
                >
                  Add
                </button>
              </div>

              {/* Checklist list */}
              <div className="space-y-2">
                {checklistList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group text-xs text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className={item.done ? "line-through text-gray-400" : ""}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtasks Widget */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  Sub tasks
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span>Sortable</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Add subtask */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Create a sub task"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-600 border border-gray-300"
                >
                  Create
                </button>
              </div>

              {/* Subtasks list */}
              <div className="space-y-2 mb-3">
                {subTasksList.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between group text-xs text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.done}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className={sub.done ? "line-through text-gray-400" : ""}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 text-gray-600 bg-white transition-colors">
                <Plus size={13} />
                <span>Add dependency</span>
              </button>
            </div>

            {/* Comments Widget */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200 mt-1">
                  <img src="https://i.pravatar.cc/60?img=1" alt="avatar" className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 bg-gray-50/50 border border-gray-200 rounded-lg p-3 shadow-sm">
                  <textarea
                    placeholder="Write a comment..."
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 p-0 text-gray-800 placeholder-gray-400 resize-y"
                  />
                  <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-gray-150">
                    <div className="flex gap-2">
                      <button className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-semibold">
                        <Upload size={12} />
                        <span>Upload File</span>
                      </button>
                      <button className="p-1 border border-gray-300 bg-white rounded text-gray-500 hover:bg-gray-50">
                        <HelpCircle size={12} />
                      </button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded font-semibold text-[11px] hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                    >
                      <Send size={11} />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments History */}
              {commentsList.length > 0 && (
                <div className="relative pt-4">
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-bold text-gray-400 bg-white px-3 uppercase tracking-wider">
                    Activity
                  </div>
                  <div className="h-px bg-gray-200 w-full mb-4"></div>
                  
                  <div className="space-y-4">
                    {commentsList.map((comm) => (
                      <div key={comm.id} className="flex gap-3 text-xs">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200">
                          <img src={comm.avatar} alt="avatar" className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-850">{comm.author}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(comm.createdAt).toLocaleDateString()} at {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-150 text-gray-700 leading-relaxed shadow-sm">
                            {comm.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata controls, timer, reminders */}
          <div className="w-full md:w-80 shrink-0 space-y-5 bg-gray-50/50 p-4.5 rounded-lg border border-gray-150 text-xs">
            {/* Assignee Card */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-250 shadow-sm border border-gray-300">
                <img src={task.avatar || "https://i.pravatar.cc/60?img=1"} alt="avatar" className="object-cover w-full h-full" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-855 text-sm leading-none">{task.assignedTo || "John Doe"}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="bg-gray-100 border border-gray-250 text-gray-605 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {task.points || "1 Point"}
                  </span>
                  <span
                    className={`border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
                      statusClass[task.status]?.bg
                    } ${statusClass[task.status]?.text} ${statusClass[task.status]?.border}`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="divide-y divide-gray-250/70 border-t border-b border-gray-200">
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Milestone</span>
                <span className="font-medium text-gray-705">{getMilestone(task.relatedTo)}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Start date</span>
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {task.startDate ? formatDate(task.startDate) : "Add Start date"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Deadline</span>
                <div className="flex items-center gap-1 font-medium">
                  <span className="text-red-500">
                    {task.deadline ? formatDate(task.deadline) : "Add Deadline"}
                  </span>
                  <HelpCircle size={13} className="text-gray-400 shrink-0 cursor-help" />
                </div>
              </div>
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Priority</span>
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {task.priority || "Add Priority"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Label</span>
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {task.labels || "Add Label"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_1fr] py-2 items-center">
                <span className="font-semibold text-gray-500">Collaborators</span>
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {task.collaborators && task.collaborators !== "-" ? task.collaborators : "Add Collaborators"}
                </span>
              </div>
            </div>

            {/* Timer Widget */}
            <div className="space-y-2 pt-1">
              {timerRunning ? (
                <button
                  onClick={handleToggleTimer}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Clock size={14} className="animate-pulse" />
                  <span>Stop timer</span>
                </button>
              ) : (
                <button
                  onClick={handleToggleTimer}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Clock size={14} />
                  <span>Start timer</span>
                </button>
              )}
              <div className="text-center font-bold text-gray-600">
                Total time logged: <span className="text-gray-850 font-mono">{formatTime(timeLogged)}</span>
              </div>
            </div>

            {/* Reminders Widget */}
            <div className="pt-2 border-t border-gray-250/70 space-y-1.5">
              <div className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                Reminders (Private)
              </div>
              <button className="text-blue-600 hover:underline hover:text-blue-800 font-bold block cursor-pointer">
                + Add reminder
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2.5 rounded-b-lg text-xs">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-3.5 py-2 border border-gray-300 rounded font-semibold text-gray-650 bg-white hover:text-red-650 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete task</span>
          </button>
          
          <button
            onClick={onClone}
            className="inline-flex items-center gap-1 px-3.5 py-2 border border-gray-300 rounded font-semibold text-gray-650 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Copy size={13} />
            <span>Clone task</span>
          </button>

          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-3.5 py-2 border border-gray-300 rounded font-semibold text-gray-655 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Edit size={13} />
            <span>Edit task</span>
          </button>

          <button
            onClick={handleClose}
            className="inline-flex items-center gap-1 px-4.5 py-2 border border-gray-300 bg-white rounded font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <X size={13} />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
