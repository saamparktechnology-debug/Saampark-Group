"use client"

import * as React from "react"
import {
  ArrowLeft,
  Star,
  Clock,
  Settings,
  Zap,
  Play,
  Pause,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Mail,
  X,
  MoreVertical,
  Layers,
  CheckCircle2,
  Code2,
  Database,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Receipt,
  FileText,
  Printer,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Check,
  User as UserIcon,
  Trash2,
  Download,
  CreditCard,
  Briefcase,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Project, ProjectMilestone } from "../types"
import { addOrUpdateProjectMilestone } from "../services/projectService"
import { useAuthStore } from "@/store/useAuthStore"
import { getUserAvatar } from "@/app/feature/users/services/userService"
import { getInvoices, addInvoice, generateInvoiceNumber, updateInvoiceStatus, InvoiceItem, InvoiceStatus } from "@/app/feature/sales/invoices/services/invoiceService"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { Task, TaskPriority, TaskStatus, getTaskCountdownChip } from "@/app/feature/tasks/types"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { printPDFReport, exportToExcel } from "@/lib/exportUtils"

interface ProjectDetailViewProps {
  projects: Project[]
  selectedProject: Project
  initialTab?: string
  onSelectProject: (project: Project) => void
  onBackToTable: () => void
  onOpenEditModal: (project: Project) => void
}

const DONUT_COLORS = {
  todo: "#F59E0B",       // Orange
  inProgress: "#06B6D4", // Teal
  review: "#8B5CF6",     // Purple
  done: "#10B981",       // Green
}

export function ProjectDetailView({
  projects,
  selectedProject,
  initialTab = "Overview",
  onSelectProject,
  onBackToTable,
  onOpenEditModal,
}: ProjectDetailViewProps) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState(initialTab || "Overview")
  const [isStarred, setIsStarred] = React.useState(selectedProject.starred || false)
  const [isTimerRunning, setIsTimerRunning] = React.useState(false)
  const [timerSeconds, setTimerSeconds] = React.useState(0)
  const [leftSearch, setLeftSearch] = React.useState("")
  const [leftFilter, setLeftFilter] = React.useState("All")
  const [currentPage, setCurrentPage] = React.useState(1)

  // Developer Milestone Add/Update State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = React.useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = React.useState<string | null>(null)
  const [msTitle, setMsTitle] = React.useState("")
  const [msStage, setMsStage] = React.useState<ProjectMilestone["stage"]>("Frontend")
  const [msStatus, setMsStatus] = React.useState<ProjectMilestone["status"]>("Completed")
  const [msNotes, setMsNotes] = React.useState("")
  const [msCredentials, setMsCredentials] = React.useState("")
  const [isSavingMilestone, setIsSavingMilestone] = React.useState(false)

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, "0")
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0")
    const secs = (totalSec % 60).toString().padStart(2, "0")
    return `${hrs}:${mins}:${secs}`
  }

  // Left sidebar filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(leftSearch.toLowerCase()) ||
      p.client.toLowerCase().includes(leftSearch.toLowerCase())
    if (leftFilter === "Completed") return matchesSearch && p.status === "Completed"
    if (leftFilter === "High Priority") return matchesSearch && p.labels.includes("Urgent")
    return matchesSearch
  })

  // Chart data for task breakdown
  const taskData = [
    { name: "To do", value: selectedProject.taskBreakdown?.todo || 2, color: DONUT_COLORS.todo },
    { name: "In progress", value: selectedProject.taskBreakdown?.inProgress || 4, color: DONUT_COLORS.inProgress },
    { name: "Review", value: selectedProject.taskBreakdown?.review || 1, color: DONUT_COLORS.review },
    { name: "Done", value: selectedProject.taskBreakdown?.done || 3, color: DONUT_COLORS.done },
  ]

  const navTabs = [
    "Overview",
    "Invoices",
    "Tasks List",
    "Tasks Kanban",
    "Milestones",
    "Gantt",
    "Notes",
    "Files",
    "Comments",
    "Timesheets",
    "Expenses",
  ]

  // Initial Tab Sync
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab, selectedProject.id])

  // Invoices Sub-Module State
  const [projectInvoices, setProjectInvoices] = React.useState<InvoiceItem[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)
  const [invAmount, setInvAmount] = React.useState("")
  const [invDueDate, setInvDueDate] = React.useState(selectedProject.deadline || "")
  const [invDescription, setInvDescription] = React.useState("")
  const [invGstRate, setInvGstRate] = React.useState(18)
  const [invStatus, setInvStatus] = React.useState<InvoiceStatus>("Payment Pending")
  const [isSavingInvoice, setIsSavingInvoice] = React.useState(false)

  // Tasks Sub-Module State
  const [projectTasks, setProjectTasks] = React.useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
  const [taskTitle, setTaskTitle] = React.useState("")
  const [taskDeadline, setTaskDeadline] = React.useState("")
  const [taskPriority, setTaskPriority] = React.useState<TaskPriority>("Normal")
  const [taskAssignedTo, setTaskAssignedTo] = React.useState("")
  const [isSavingTask, setIsSavingTask] = React.useState(false)

  // Expenses Sub-Module State
  const [projectExpenses, setProjectExpenses] = React.useState<any[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = React.useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false)
  const [expTitle, setExpTitle] = React.useState("")
  const [expAmount, setExpAmount] = React.useState("")
  const [expCategory, setExpCategory] = React.useState("Direct Project Supply")
  const [expPayee, setExpPayee] = React.useState("")
  const [isSavingExpense, setIsSavingExpense] = React.useState(false)

  // ---------------- DATA LOADERS ----------------
  const loadProjectInvoices = React.useCallback(async () => {
    setIsLoadingInvoices(true)
    try {
      const comp = selectedProject.companyId || "tech"
      const all = await getInvoices(comp)
      const projTitleNorm = (selectedProject.title || "").toLowerCase().trim()
      const projIdNorm = (selectedProject.id || "").toLowerCase().trim()
      const clientNorm = (selectedProject.client || "").toLowerCase().trim()

      const matched = all.filter(inv => {
        const invProj = (inv.project || "").toLowerCase().trim()
        const invClient = (inv.client || "").toLowerCase().trim()
        return invProj === projTitleNorm || invProj === projIdNorm || (invClient === clientNorm && (invProj.includes(projTitleNorm) || !invProj))
      })
      setProjectInvoices(matched)
    } catch (err) {
      console.warn("Failed to load project invoices:", err)
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [selectedProject.id, selectedProject.title, selectedProject.client, selectedProject.companyId])

  const loadProjectTasks = React.useCallback(async () => {
    setIsLoadingTasks(true)
    try {
      const comp = selectedProject.companyId || "tech"
      const all = await taskService.getTasks(comp)
      const projTitleNorm = (selectedProject.title || "").toLowerCase().trim()
      const projIdNorm = (selectedProject.id || "").toLowerCase().trim()

      const matched = all.filter(t => {
        const rel = (t.relatedTo || "").toLowerCase().trim()
        const pName = (t.projectName || "").toLowerCase().trim()
        const sId = (t.sourceId || "").toLowerCase().trim()
        return rel === projTitleNorm || pName === projTitleNorm || sId === projIdNorm
      })
      setProjectTasks(matched)
    } catch (err) {
      console.warn("Failed to load project tasks:", err)
    } finally {
      setIsLoadingTasks(false)
    }
  }, [selectedProject.id, selectedProject.title, selectedProject.companyId])

  const loadProjectExpenses = React.useCallback(async () => {
    setIsLoadingExpenses(true)
    try {
      const comp = selectedProject.companyId || "tech"
      const allExp = await fetchModuleDataFromDB<any[]>("expenses", [], comp).catch(() => [])
      const clean = filterGlobalDeletedItems(Array.isArray(allExp) ? allExp : [])
      const projTitleNorm = (selectedProject.title || "").toLowerCase().trim()
      const projIdNorm = (selectedProject.id || "").toLowerCase().trim()

      const matched = clean.filter(e => {
        const pId = (e.projectId || "").toLowerCase().trim()
        const pName = (e.projectName || "").toLowerCase().trim()
        return pId === projIdNorm || pName === projTitleNorm
      })
      setProjectExpenses(matched)
    } catch (err) {
      console.warn("Failed to load project expenses:", err)
    } finally {
      setIsLoadingExpenses(false)
    }
  }, [selectedProject.id, selectedProject.title, selectedProject.companyId])

  React.useEffect(() => {
    if (activeTab === "Invoices") {
      loadProjectInvoices()
    } else if (activeTab === "Tasks List" || activeTab === "Tasks Kanban") {
      loadProjectTasks()
    } else if (activeTab === "Expenses") {
      loadProjectExpenses()
    }
  }, [activeTab, loadProjectInvoices, loadProjectTasks, loadProjectExpenses])

  // ---------------- PROJECT -> INVOICE HANDLERS ----------------
  const handleOpenGenerateInvoice = () => {
    const rawDue = selectedProject.dueAmount !== undefined && selectedProject.dueAmount > 0
      ? String(selectedProject.dueAmount)
      : selectedProject.price.replace(/[^0-9]/g, "")
    setInvAmount(rawDue || "10000")
    setInvDueDate(selectedProject.deadline || "")
    setInvDescription(`Milestone Deliverable / Project Billing for "${selectedProject.title}"`)
    setInvGstRate(18)
    setInvStatus("Payment Pending")
    setIsInvoiceModalOpen(true)
  }

  const handleSaveProjectInvoice = async () => {
    const amtNum = parseFloat(invAmount) || 0
    if (amtNum <= 0) {
      alert("Please enter a valid invoice amount.")
      return
    }
    setIsSavingInvoice(true)
    try {
      const comp = selectedProject.companyId || "tech"
      const allInvs = await getInvoices(comp)
      const invId = generateInvoiceNumber(allInvs, new Date())
      const gstAmt = (amtNum * invGstRate) / 100
      const totalAmt = amtNum + gstAmt

      const newInv: InvoiceItem = {
        id: invId,
        client: selectedProject.client,
        project: selectedProject.title,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: invDueDate || selectedProject.deadline || new Date().toLocaleDateString("en-GB"),
        baseAmount: amtNum,
        gstRate: invGstRate,
        gstAmount: gstAmt,
        totalInvoiced: `₹${Math.round(totalAmt).toLocaleString("en-IN")}`,
        paymentReceived: "₹0",
        due: `₹${Math.round(totalAmt).toLocaleString("en-IN")}`,
        status: invStatus,
        billedBy: user?.name || "Admin",
        companyId: comp,
        items: [
          {
            id: `line_${Date.now()}`,
            serviceName: invDescription || `Deliverable for ${selectedProject.title}`,
            qty: 1,
            unit: "Job",
            rate: amtNum,
            gstRate: invGstRate,
            gstAmount: gstAmt,
            totalAmount: totalAmt,
          },
        ],
      }

      await addInvoice(newInv, comp)
      await loadProjectInvoices()
      setIsInvoiceModalOpen(false)
    } catch (err) {
      console.error("Error creating project invoice:", err)
      alert("Failed to create invoice. Please try again.")
    } finally {
      setIsSavingInvoice(false)
    }
  }

  const handlePrintProjectInvoice = (inv: InvoiceItem) => {
    printPDFReport({
      title: `Tax Invoice - ${inv.id}`,
      subtitle: `Project: ${inv.project} | Client: ${inv.client}`,
      headers: ["Invoice #", "Bill Date", "Due Date", "Total Amount", "Paid", "Balance Due", "Status"],
      rows: [[inv.id, inv.billDate, inv.dueDate, inv.totalInvoiced, inv.paymentReceived, inv.due, inv.status]],
    })
  }

  const handleUpdateInvoiceRowStatus = async (invId: string, status: InvoiceStatus) => {
    try {
      const comp = selectedProject.companyId || "tech"
      await updateInvoiceStatus(invId, status, undefined, undefined, comp)
      await loadProjectInvoices()
    } catch (err) {
      console.error("Failed to update invoice status:", err)
    }
  }

  // ---------------- PROJECT -> TASK HANDLERS ----------------
  const handleSaveProjectTask = async () => {
    if (!taskTitle.trim()) {
      alert("Please enter a task title.")
      return
    }
    setIsSavingTask(true)
    try {
      const comp = selectedProject.companyId || "tech"
      await taskService.addTask({
        title: taskTitle.trim(),
        deadline: taskDeadline || selectedProject.deadline || "None",
        relatedTo: selectedProject.title,
        projectName: selectedProject.title,
        client: selectedProject.client,
        source: "projects",
        sourceId: selectedProject.id,
        assignedTo: taskAssignedTo || (selectedProject.members?.[0]?.name || user?.name || "Developer"),
        priority: taskPriority,
        status: "To do",
        companyId: comp,
      }, comp)
      await loadProjectTasks()
      setIsTaskModalOpen(false)
      setTaskTitle("")
      setTaskDeadline("")
    } catch (err) {
      console.error("Failed to add project task:", err)
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleUpdateTaskRowStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const comp = selectedProject.companyId || "tech"
      await taskService.updateTask(taskId, { status: newStatus }, comp)
      await loadProjectTasks()
    } catch (err) {
      console.error("Failed to update task status:", err)
    }
  }

  // ---------------- PROJECT -> EXPENSE HANDLERS ----------------
  const handleSaveProjectExpense = async () => {
    const amtNum = parseFloat(expAmount) || 0
    if (!expTitle.trim() || amtNum <= 0) {
      alert("Please enter an expense title and valid amount.")
      return
    }
    setIsSavingExpense(true)
    try {
      const comp = selectedProject.companyId || "tech"
      const allExp = await fetchModuleDataFromDB<any[]>("expenses", [], comp).catch(() => [])
      const expId = `EXP-${Date.now().toString().slice(-6)}`
      const newExp = {
        id: expId,
        expenseNumber: expId,
        title: expTitle.trim(),
        amount: `₹${amtNum.toLocaleString("en-IN")}`,
        amountNum: amtNum,
        category: expCategory,
        date: new Date().toLocaleDateString("en-GB"),
        member: expPayee.trim() || user?.name || "Admin",
        status: "Approved",
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        isProjectExpense: true,
        companyId: comp,
      }
      const updated = [newExp, ...allExp]
      await saveModuleDataToDB("expenses", updated, comp)
      await loadProjectExpenses()
      setIsExpenseModalOpen(false)
      setExpTitle("")
      setExpAmount("")
      setExpPayee("")
    } catch (err) {
      console.error("Failed to save project expense:", err)
    } finally {
      setIsSavingExpense(false)
    }
  }

  const handleSaveMilestone = async () => {
    if (!msTitle.trim()) {
      alert("Please enter a milestone title (e.g. Frontend Done, Backend Done).")
      return
    }
    setIsSavingMilestone(true)
    try {
      const milestone: ProjectMilestone = {
        id: editingMilestoneId || `ms_${Date.now()}`,
        title: msTitle.trim(),
        stage: msStage,
        status: msStatus,
        notes: msNotes.trim() || undefined,
        credentials: msCredentials.trim() || undefined,
        updatedBy: user?.name || "Developer",
        updatedAt: new Date().toISOString(),
      }
      const updated = await addOrUpdateProjectMilestone(
        selectedProject.id,
        milestone,
        user?.name || "Developer"
      )
      onSelectProject(updated)
      setIsMilestoneModalOpen(false)
      setEditingMilestoneId(null)
      setMsTitle("")
      setMsNotes("")
      setMsCredentials("")
    } catch (err) {
      console.error("Error saving milestone:", err)
    } finally {
      setIsSavingMilestone(false)
    }
  }

  const openAddMilestone = (stagePreset?: ProjectMilestone["stage"]) => {
    setEditingMilestoneId(null)
    setMsStage(stagePreset || "Frontend")
    setMsTitle(stagePreset === "Frontend" ? "Frontend Done & UI Finalized" : stagePreset === "Backend" ? "Backend API & Database Done" : stagePreset === "Credentials" ? "Server & DB Credentials" : "")
    setMsStatus("Completed")
    setMsNotes("")
    setMsCredentials("")
    setIsMilestoneModalOpen(true)
  }

  const openEditMilestone = (ms: ProjectMilestone) => {
    setEditingMilestoneId(ms.id)
    setMsTitle(ms.title)
    setMsStage(ms.stage)
    setMsStatus(ms.status)
    setMsNotes(ms.notes || "")
    setMsCredentials(ms.credentials || "")
    setIsMilestoneModalOpen(true)
  }

  // Render Milestones List Component
  const renderMilestonesView = () => (
    <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Code2 size={16} className="text-blue-600" />
            <span>Developer Progress Updates & Milestones</span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Frontend Done, Backend Done, Deployment & Server Credentials (live-synced to Sales Orders & Invoices)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddMilestone("Frontend")}
            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            + Frontend Done
          </button>
          <button
            type="button"
            onClick={() => openAddMilestone("Backend")}
            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            + Backend Done
          </button>
          <button
            type="button"
            onClick={() => openAddMilestone("Custom")}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Update</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {(selectedProject.milestones || []).length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
            No milestones added yet. Developers can click "+ Add Update" above to record progress notes (e.g. Frontend Done, Backend Done, Credentials).
          </div>
        ) : (
          (selectedProject.milestones || []).map((ms) => {
            const isCompleted = ms.status === "Completed"
            const isInProgress = ms.status === "In Progress"
            return (
              <div
                key={ms.id}
                className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${
                      isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                        : isInProgress
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                    }`}>
                      {ms.stage === "Frontend" ? <Code2 size={14} /> : ms.stage === "Backend" ? <Database size={14} /> : ms.stage === "Credentials" ? <KeyRound size={14} /> : <CheckCircle2 size={14} />}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{ms.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {ms.stage}
                        </span>
                      </h4>
                      {ms.updatedBy && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1">
                          <img
                            src={getUserAvatar(ms.updatedBy, undefined, ms.updatedBy)}
                            alt={ms.updatedBy}
                            className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0"
                          />
                          <span>
                            Updated by <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{ms.updatedBy}</strong> {ms.updatedAt ? `on ${new Date(ms.updatedAt).toLocaleDateString("en-GB")}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                        : isInProgress
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {ms.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditMilestone(ms)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {ms.notes && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Developer Notes:
                    </span>
                    {ms.notes}
                  </div>
                )}

                {ms.credentials && (
                  <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 font-mono space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1 font-sans">
                      <KeyRound size={11} /> Credentials / Access URLs:
                    </span>
                    <p className="whitespace-pre-wrap select-all">{ms.credentials}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  // ---------------- RENDER INVOICES TAB ----------------
  const renderInvoicesView = () => {
    const totalInvoicedNum = projectInvoices.reduce((acc, inv) => {
      const val = parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      return acc + val
    }, 0)
    const totalPaidNum = projectInvoices.reduce((acc, inv) => {
      const val = parseInt((inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
      return acc + val
    }, 0)
    const totalDueNum = projectInvoices.reduce((acc, inv) => {
      const val = parseInt((inv.due || "0").replace(/[^0-9]/g, "")) || 0
      return acc + val
    }, 0)

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Receipt size={18} className="text-emerald-600" />
              <span>Project Invoices & Billing Ledger</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Live-synced with Sales & Invoices module. Manage invoices, billings, and payments for <strong>{selectedProject.title}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenGenerateInvoice}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>+ Generate Invoice for Project</span>
          </button>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Contract / Quoted Value</span>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedProject.price}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Client: {selectedProject.client}</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Total Invoiced</span>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ₹{totalInvoicedNum.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">{projectInvoices.length} invoices generated</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Payment Received</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalPaidNum.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Real-time collections</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Outstanding Balance</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              ₹{totalDueNum.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Pending payments</div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FileText size={15} className="text-zinc-500" />
              <span>Invoices List ({projectInvoices.length})</span>
            </h4>
            <button
              type="button"
              onClick={loadProjectInvoices}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Description / Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {projectInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt size={32} className="text-zinc-300 dark:text-zinc-600" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">No invoices generated yet for this project</p>
                        <p className="text-[11px] text-zinc-400">Click below to generate a milestone or final tax invoice.</p>
                        <button
                          type="button"
                          onClick={handleOpenGenerateInvoice}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          + Generate Invoice for Project
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projectInvoices.map((inv) => {
                    const isPaid = inv.status === "Fully paid"
                    const isPartial = inv.status === "Partially paid"
                    return (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inv.id}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">{inv.billDate}</td>
                        <td className="py-3 px-4 text-red-600 dark:text-red-400 font-mono font-semibold">{inv.dueDate}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-zinc-700 dark:text-zinc-300">
                          {inv.items?.[0]?.serviceName || inv.project || "Deliverable"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                          {inv.totalInvoiced}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {inv.paymentReceived}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                          {inv.due}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : isPartial
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePrintProjectInvoice(inv)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Print / View Invoice PDF"
                            >
                              <Printer size={14} />
                            </button>
                            <select
                              value={inv.status}
                              onChange={(e) => handleUpdateInvoiceRowStatus(inv.id, e.target.value as InvoiceStatus)}
                              className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                            >
                              <option value="Payment Pending">Pending</option>
                              <option value="Partially paid">Partially Paid</option>
                              <option value="Fully paid">Fully Paid</option>
                              <option value="Draft">Draft</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- RENDER TASKS TAB ----------------
  const renderTasksListView = () => {
    const todoCount = projectTasks.filter(t => t.status === "To do").length
    const inProgressCount = projectTasks.filter(t => t.status === "In progress").length
    const doneCount = projectTasks.filter(t => t.status === "Done").length

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600" />
              <span>Project Tasks & Deliverables</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Assigned tasks and action items for <strong>{selectedProject.title}</strong> live-synced across team members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTaskTitle("")
              setTaskDeadline(selectedProject.deadline || "")
              setTaskPriority("Normal")
              setTaskAssignedTo(selectedProject.members?.[0]?.name || user?.name || "")
              setIsTaskModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>+ Add Task to Project</span>
          </button>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Total Tasks</span>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{projectTasks.length}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Assigned to team</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">To Do</span>
            <div className="text-xl font-bold text-amber-500">{todoCount}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Pending kickoff</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">In Progress</span>
            <div className="text-xl font-bold text-cyan-600">{inProgressCount}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Currently active</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Completed</span>
            <div className="text-xl font-bold text-emerald-600">{doneCount}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Finished tasks</div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Tasks List</h4>
            <button
              type="button"
              onClick={loadProjectTasks}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Assigned Member</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {projectTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 size={32} className="text-zinc-300 dark:text-zinc-600" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">No tasks added for this project yet</p>
                        <p className="text-[11px] text-zinc-400">Break down your project into deliverables and tasks.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskTitle("")
                            setTaskDeadline(selectedProject.deadline || "")
                            setTaskPriority("Normal")
                            setTaskAssignedTo(selectedProject.members?.[0]?.name || user?.name || "")
                            setIsTaskModalOpen(true)
                          }}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          + Add Task to Project
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projectTasks.map((t) => {
                    const chip = getTaskCountdownChip(t.deadline, t.dueTime, t.status)
                    return (
                      <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={getUserAvatar(t.assignedTo, undefined, t.assignedTo)}
                              alt={t.assignedTo || "Assignee"}
                              className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0 bg-surface"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.assignedTo || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === "Urgent" || t.priority === "High"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}>
                            {t.priority || "Normal"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-600 dark:text-zinc-300">{t.deadline || "No deadline"}</span>
                            {chip && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${chip.colorClass}`}>
                                {chip.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTaskRowStatus(t.id, e.target.value as TaskStatus)}
                            className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                          >
                            <option value="To do">To do</option>
                            <option value="In progress">In progress</option>
                            <option value="Review">Review</option>
                            <option value="Done">Done ✅</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- RENDER EXPENSES TAB ----------------
  const renderExpensesView = () => {
    const totalExpNum = projectExpenses.reduce((acc, exp) => acc + (exp.amountNum || 0), 0)
    const projectPriceNum = parseInt(selectedProject.price.replace(/[^0-9]/g, "")) || 0
    const grossMargin = projectPriceNum - totalExpNum
    const marginPct = projectPriceNum > 0 ? Math.round((grossMargin / projectPriceNum) * 100) : 0

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard size={18} className="text-purple-600" />
              <span>Project Cost Ledger & Profit Margin</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Direct expenses, contractor costs, and material purchases linked to <strong>{selectedProject.title}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpTitle("")
              setExpAmount("")
              setExpPayee(user?.name || "Admin")
              setIsExpenseModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>+ Record Project Expense</span>
          </button>
        </div>

        {/* 3 Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Total Project Revenue</span>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{selectedProject.price}</div>
            <div className="text-[10px] text-zinc-400 mt-1">Agreed project contract</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Direct Expenses Incurred</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
              ₹{totalExpNum.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">{projectExpenses.length} expense items</div>
          </div>
          <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">Net Margin / Profit</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${grossMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                ₹{grossMargin.toLocaleString("en-IN")}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                grossMargin >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-700"
              }`}>
                {marginPct}% Margin
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Project profitability</div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Expenses Log</h4>
            <button
              type="button"
              onClick={loadProjectExpenses}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payee / Member</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {projectExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard size={32} className="text-zinc-300 dark:text-zinc-600" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">No direct expenses recorded yet for this project</p>
                        <p className="text-[11px] text-zinc-400">Log software licenses, cloud servers, or subcontractor payments.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setExpTitle("")
                            setExpAmount("")
                            setExpPayee(user?.name || "Admin")
                            setIsExpenseModalOpen(true)
                          }}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs cursor-pointer"
                        >
                          + Record Project Expense
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projectExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-600 dark:text-zinc-400">{exp.expenseNumber || exp.id}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{exp.title}</td>
                      <td className="py-3 px-4 text-zinc-500">{exp.category}</td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">{exp.member}</td>
                      <td className="py-3 px-4 text-zinc-500">{exp.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">{exp.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          {exp.status || "Approved"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[85vh] bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl">
      
      {/* ---------------- LEFT PANEL: Project Navigation ---------------- */}
      <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm shrink-0">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onBackToTable}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Projects</span>
          </button>
          <button type="button" className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="p-3 space-y-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search projects..."
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {["All", "In Progress", "Completed", "High Priority"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLeftFilter(tab)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  leftFilter === tab
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[600px]">
          {filteredProjects.map((p) => {
            const isSelected = p.id === selectedProject.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p)}
                className={`w-full text-left p-3.5 flex items-start justify-between gap-2 transition-colors ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-100 truncate">
                      {p.title}
                    </span>
                    {p.starred && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">{p.client}</div>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-400">
                    <span className="text-red-600 dark:text-red-400 font-bold font-mono">{p.deadline}</span>
                    <span>•</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{p.price}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    p.status === "Completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    {p.progress}%
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Bottom Pagination matching image */}
        <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
          >
            &lt; 1
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredProjects.length / 5) || 1}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            2 &gt;
          </button>
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: Project Main Detail Canvas ---------------- */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
        
        {/* Top Title & Action Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-zinc-500" />
            <h1 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {selectedProject.title}
            </h1>
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className="text-amber-400 hover:scale-110 transition-transform ml-1 cursor-pointer"
            >
              <Star size={16} fill={isStarred ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenEditModal(selectedProject)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Settings size={13} className="text-zinc-500" />
              <span>Project Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-sm cursor-pointer ${
                isTimerRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
              <span>{isTimerRunning ? `Timer: ${formatTimer(timerSeconds)}` : "🟢 Start timer"}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-6 px-4 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar text-xs font-medium text-zinc-500">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Canvas Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "Overview" ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left & Middle Columns (2/3 width) */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Top Row Grid: Gauge + Donut Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Gauge Card */}
                  <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col items-center justify-between">
                    <div className="relative w-36 h-36 flex items-center justify-center my-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-100 dark:text-zinc-700 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500 stroke-current"
                          strokeWidth="3.5"
                          strokeDasharray={`${selectedProject.progress}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold text-zinc-700 dark:text-zinc-200">
                        {selectedProject.progress}%
                      </span>
                    </div>

                    <div className="w-full space-y-1.5 pt-4 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Start date:</strong> {selectedProject.startDate}</div>
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Deadline:</strong> <span className="text-red-600 dark:text-red-400 font-bold font-mono">{selectedProject.deadline}</span></div>
                      <div><strong className="text-zinc-700 dark:text-zinc-300">Status:</strong> {selectedProject.status}</div>
                    </div>
                  </div>

                  {/* Donut Chart Card */}
                  <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {taskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex items-center justify-center gap-3 text-[11px] pt-2 flex-wrap">
                      {taskData.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-zinc-600 dark:text-zinc-300">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Total Hours Worked Card */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
                      <Clock size={28} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                        {selectedProject.totalHours || 37.08}
                      </div>
                      <div className="text-xs text-zinc-400">Total hours worked</div>
                    </div>
                  </div>
                </div>

                {/* Developer Milestones & Updates Card in Overview */}
                {renderMilestonesView()}

                {/* Project Members Card */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Assigned Team Members</h3>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(selectedProject)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Manage Team</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(selectedProject.members || []).length === 0 ? (
                      <p className="text-zinc-400 text-xs py-2 text-center">No team assigned yet. Click 'Manage Team' to assign developer.</p>
                    ) : (
                      (selectedProject.members || []).map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={(m as any).avatarUrl || m.avatar || getUserAvatar(m.name, undefined, m.name)}
                              alt={m.name}
                              className="w-8 h-8 rounded-full object-cover bg-surface border border-border shrink-0"
                            />
                            <div>
                              <div className="font-bold text-zinc-800 dark:text-zinc-200">{m.name}</div>
                              <div className="text-[11px] text-zinc-400">{m.role || "Developer"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400">
                            {m.email && <span className="text-[10px] text-zinc-500 font-mono">{m.email}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Activity Timeline & Project In-Charge */}
              <div className="space-y-6">
                {/* Project In-Charge / Billed By */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Admin & Billing Information</h3>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Billed By:</span>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                        <img
                          src={getUserAvatar(selectedProject.billedBy || "Admin", undefined, selectedProject.billedBy || "Admin")}
                          alt={selectedProject.billedBy || "Admin"}
                          className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shrink-0"
                        />
                        <span>{selectedProject.billedBy || "Admin"}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Client:</span>
                      <span className="font-bold text-blue-600">{selectedProject.client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Project Value:</span>
                      <span className="font-bold text-emerald-600">{selectedProject.price}</span>
                    </div>
                    {selectedProject.advanceAmount !== undefined && selectedProject.advanceAmount > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-1 rounded">
                        <span>Advance Paid:</span>
                        <span>₹{selectedProject.advanceAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {selectedProject.dueAmount !== undefined && selectedProject.dueAmount > 0 && (
                      <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/60 dark:bg-amber-950/30 px-2 py-1 rounded">
                        <span>Balance Due:</span>
                        <span>₹{selectedProject.dueAmount.toLocaleString("en-IN")} {selectedProject.installmentsCount ? `(${selectedProject.installmentsCount} Parts)` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Activity Timeline</h3>

                  <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                    {(selectedProject.activityLogs || []).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {log.user.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="text-[11px] text-zinc-500">
                            <strong className="text-zinc-800 dark:text-zinc-200">{log.user}</strong> {log.timestamp}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
                              {log.action}
                            </span>
                            {log.badge && (
                              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                                {log.badge} -
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{log.title}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : activeTab === "Milestones" ? (
            renderMilestonesView()
          ) : activeTab === "Invoices" ? (
            renderInvoicesView()
          ) : activeTab === "Tasks List" || activeTab === "Tasks Kanban" ? (
            renderTasksListView()
          ) : activeTab === "Expenses" ? (
            renderExpensesView()
          ) : (
            <div className="p-12 text-center text-zinc-400 text-sm bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              Content for <strong className="text-zinc-700 dark:text-zinc-200">{activeTab}</strong> view will render here.
            </div>
          )}
        </div>

      </div>

      {/* ---------------- DEVELOPER MILESTONE / UPDATE MODAL ---------------- */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Code2 size={16} className="text-blue-600" />
                <span>{editingMilestoneId ? "Edit Progress Update" : "Record Developer Progress"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Update Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Done, Backend API Implemented, Staging Release"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Development Stage</label>
                  <select
                    value={msStage}
                    onChange={(e) => setMsStage(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Frontend">Frontend Development</option>
                    <option value="Backend">Backend & Database</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="Testing">Testing & QA</option>
                    <option value="Deployment">Live Deployment</option>
                    <option value="Credentials">Credentials & Access</option>
                    <option value="Custom">Custom Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Status</label>
                  <select
                    value={msStatus}
                    onChange={(e) => setMsStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                  >
                    <option value="Completed">Completed ✅</option>
                    <option value="In Progress">In Progress ⏳</option>
                    <option value="Pending">Pending ⏸️</option>
                    <option value="Hold">On Hold 🛑</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">Progress Details & Developer Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain details of completed work (e.g. Added auth tokens, responsive layout, Stripe webhook)..."
                  value={msNotes}
                  onChange={(e) => setMsNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1 flex items-center gap-1">
                  <KeyRound size={12} className="text-amber-500" />
                  <span>Deployment URLs / Server & DB Credentials (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Staging URL: https://staging.example.com | Admin User: dev@example.com"
                  value={msCredentials}
                  onChange={(e) => setMsCredentials(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingMilestone}
                onClick={handleSaveMilestone}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingMilestone ? "Saving..." : "Save Progress Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PROJECT INVOICE GENERATOR MODAL ---------------- */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Receipt size={16} className="text-emerald-600" />
                <span>Generate Tax Invoice for Project</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-1 text-zinc-600 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Project:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{selectedProject.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Client:</span>
                  <span className="font-bold text-blue-600">{selectedProject.client}</span>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">Deliverable / Line Item Description *</label>
                <input
                  type="text"
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Base Amount (₹) *</label>
                  <input
                    type="number"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">GST Rate (%)</label>
                  <select
                    value={invGstRate}
                    onChange={(e) => setInvGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value={0}>0% (Non-GST / Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% Standard GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                  >
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Draft">Draft</option>
                    <option value="Partially paid">Partially Paid</option>
                    <option value="Fully paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>Base Amount:</span>
                  <span>₹{(parseFloat(invAmount) || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                  <span>GST ({invGstRate}%):</span>
                  <span>₹{(((parseFloat(invAmount) || 0) * invGstRate) / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300 text-sm border-t border-emerald-200 dark:border-emerald-800 pt-1">
                  <span>Total Invoice Value:</span>
                  <span>₹{Math.round((parseFloat(invAmount) || 0) + (((parseFloat(invAmount) || 0) * invGstRate) / 100)).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingInvoice}
                onClick={handleSaveProjectInvoice}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingInvoice ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PROJECT TASK ADD MODAL ---------------- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600" />
                <span>Add Task to Project</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Payment Gateway, Design Landing Page..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Assigned Member</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Select Assignee</option>
                    {(selectedProject.members || []).map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role || "Dev"})</option>
                    ))}
                    {user?.name && <option value={user.name}>{user.name} (Current User)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent 🔥</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">Deadline</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingTask}
                onClick={handleSaveProjectTask}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingTask ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PROJECT EXPENSE RECORD MODAL ---------------- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CreditCard size={16} className="text-purple-600" />
                <span>Record Direct Project Expense</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Expense Description *</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Server Cluster, Figma License, Printing Cost"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Direct Project Supply">Direct Project Supply</option>
                    <option value="Cloud & Server Infrastructure">Cloud & Server Infrastructure</option>
                    <option value="Software & Tools Licenses">Software & Tools Licenses</option>
                    <option value="Subcontractor & Specialist Fees">Subcontractor & Specialist Fees</option>
                    <option value="Raw Materials & Printing">Raw Materials & Printing</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">Payee / Member Responsible</label>
                <input
                  type="text"
                  placeholder="e.g. Supriya / Admin / Vendor"
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingExpense}
                onClick={handleSaveProjectExpense}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingExpense ? "Recording..." : "Record Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
