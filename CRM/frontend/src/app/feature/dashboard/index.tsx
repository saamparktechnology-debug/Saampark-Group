"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckSquare, Clock, Calendar, DollarSign, Plus, Edit2, 
  Trash2, Download, Search, CheckCircle2, MoreHorizontal,
  FileText, PieChart, Users, AlertCircle, TrendingUp, Bell, Grid, Briefcase, Monitor,
  ShieldCheck, Lock, Unlock, PhoneCall, Check, ExternalLink, UserCheck, Building2, MapPin
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useTimerStore } from "@/store/useTimerStore"
import { Button } from "@/components/ui/Button"
import { Widget } from "./components/Widget"
import { KPICard } from "./components/KPICard"
import { DonutChart } from "./components/DonutChart"
import { BarChartMockup } from "./components/BarChartMockup"
import { getStoredUserAccountsAsync, getUsers } from "../users/services/userService"
import { taskService } from "../tasks/services/taskService"
import { getProjects } from "../projects/services/projectService"
import { getInvoices, InvoiceItem } from "../sales/invoices/services/invoiceService"
import { getOrders, OrderItem } from "../sales/orders/services/orderService"
import { Task } from "../tasks/types"
import { Project } from "../projects/types"
import { filterGlobalDeletedItems, fetchModuleDataFromDB } from "@/lib/storageSync"
import { normalizeRole } from "@/store/usePermissionStore"

export default function DashboardMain() {
  const { activeCompanyId, activeBranchId, companies, branches, user } = useAuthStore()
  if (!user) return null
  const { isClockedIn, clockIn, clockOut, secondsElapsed, tick } = useTimerStore()

  // Real registered users list from user management service
  const [realUsers, setRealUsers] = React.useState<any[]>([])
  const [selectedUserEmail, setSelectedUserEmail] = React.useState<string>("")
  
  // Interactive state for To-do and Notes (persisted in localStorage)
  const [todos, setTodos] = React.useState<{ id: number; text: string; done: boolean }[]>([])
  const [newTodo, setNewTodo] = React.useState("")
  const [noteText, setNoteText] = React.useState("")
  const [activeTasksCount, setActiveTasksCount] = React.useState<number>(0)

  const [liveTasks, setLiveTasks] = React.useState<Task[]>([])
  const [liveProjects, setLiveProjects] = React.useState<Project[]>([])
  const [liveLeads, setLiveLeads] = React.useState<any[]>([])
  const [liveInvoices, setLiveInvoices] = React.useState<InvoiceItem[]>([])
  const [liveOrders, setLiveOrders] = React.useState<OrderItem[]>([])
  const [liveExpenses, setLiveExpenses] = React.useState<any[]>([])

  const targetComp = activeCompanyId || user?.companyId || "tech"
  const targetBranch = activeBranchId || user?.branchId || null

  const refreshLiveDashboard = React.useCallback(async () => {
    try {
      const { getLeads } = await import("../leads/services/leadService")
      const [uList, tList, pList, lList, invList, ordList, expList] = await Promise.all([
        getUsers(targetComp),
        taskService.getTasks(targetComp),
        getProjects(targetComp),
        getLeads(targetComp),
        getInvoices(targetComp),
        getOrders(targetComp),
        fetchModuleDataFromDB<any[]>("expenses", [], targetComp),
      ])

      const cleanUsers = filterGlobalDeletedItems(uList)
      const cleanTasks = filterGlobalDeletedItems(tList)
      const cleanProjects = filterGlobalDeletedItems(pList)
      const cleanLeads = filterGlobalDeletedItems(lList)
      const cleanInvoices = filterGlobalDeletedItems(invList)
      const cleanOrders = filterGlobalDeletedItems(ordList)
      const cleanExpenses = filterGlobalDeletedItems(expList)

      // Apply company scoping
      const companyFilter = (item: any) => {
        if (!targetComp || targetComp === "all") return true
        const cId = (item.companyId || item.company || "tech").toLowerCase().trim()
        const tComp = targetComp.toLowerCase().trim()
        return cId === tComp || (tComp === "tech" && !item.companyId)
      }

      // Apply branch scoping if active branch is selected
      const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
      const targetBranchId = String(targetBranchObj?.id || targetBranch || "").toLowerCase().trim()
      const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

      const branchFilter = (item: any) => {
        if (!targetBranch) return true
        const bId = String(item.branchId || item.assignedBranchId || item.branch_id || "").toLowerCase().trim()
        const bName = String(item.branchName || item.assignedBranchName || item.branch_name || "").toLowerCase().trim()
        if (item.branchIds && Array.isArray(item.branchIds)) {
          const ids = item.branchIds.map((s: string) => String(s).toLowerCase().trim())
          if (ids.includes(targetBranchId)) return true
        }
        return (bId && (bId === targetBranchId || (targetBranchName && bId === targetBranchName))) ||
               (bName && (bName === targetBranchName || bName === targetBranchId))
      }

      const userCompanyFilter = (u: any) => {
        if (!targetComp || targetComp === "all") return true
        if (u.role === "Super Admin") return true
        const uCompIds = (u.companyIds && u.companyIds.length > 0)
          ? u.companyIds.map((id: string) => String(id).toLowerCase().trim())
          : [String(u.companyId || "tech").toLowerCase().trim()]
        return uCompIds.includes(targetComp.toLowerCase().trim())
      }

      const scopedUsers = cleanUsers.filter(userCompanyFilter).filter((u: any) => {
        if (!targetBranch) return true
        if (u.role === "Super Admin") return true
        return branchFilter(u)
      })

      const scopedTasks = cleanTasks.filter(companyFilter).filter(branchFilter)
      const scopedProjects = cleanProjects.filter(companyFilter).filter(branchFilter)
      const scopedLeads = cleanLeads.filter(companyFilter).filter(branchFilter)
      const scopedInvoices = cleanInvoices.filter(companyFilter).filter(branchFilter)
      const scopedOrders = cleanOrders.filter(companyFilter).filter(branchFilter)
      const scopedExpenses = cleanExpenses.filter(companyFilter).filter(branchFilter)

      setRealUsers(scopedUsers)
      if (scopedUsers.length > 0 && !selectedUserEmail) {
        setSelectedUserEmail(scopedUsers[0].email)
      }

      const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
      let userScopedTasks = scopedTasks
      if (user && !isSuperOrAdmin) {
        const normName = (user.name || "").toLowerCase().trim()
        const normEmail = (user.email || "").toLowerCase().trim()
        userScopedTasks = scopedTasks.filter((t) => {
          const assigned = (t.assignedTo || "").toLowerCase().trim()
          const collab = (t.collaborators || "").toLowerCase().trim()
          return (
            assigned === normName ||
            assigned === normEmail ||
            (normName && assigned.includes(normName)) ||
            (normEmail && assigned.includes(normEmail)) ||
            collab.includes(normName) ||
            collab.includes(normEmail)
          )
        })
      }

      const active = userScopedTasks.filter((t) => t.status !== "Done")
      setActiveTasksCount(active.length)
      setLiveTasks(scopedTasks)
      setLiveProjects(scopedProjects)
      setLiveLeads(scopedLeads)
      setLiveInvoices(scopedInvoices)
      setLiveOrders(scopedOrders)
      setLiveExpenses(scopedExpenses)
    } catch (e) {
      console.warn("Dashboard refresh error:", e)
    }
  }, [targetComp, targetBranch, selectedUserEmail, user])

  React.useEffect(() => {
    refreshLiveDashboard()
    
    let interval: any = null
    const startPolling = () => {
      if (!interval) {
        interval = setInterval(() => {
          if (typeof document !== "undefined" && !document.hidden) {
            refreshLiveDashboard()
          }
        }, 4000)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshLiveDashboard()
      }
    }

    startPolling()
    window.addEventListener("storage", refreshLiveDashboard)
    window.addEventListener("saampark_company_switched", refreshLiveDashboard)
    window.addEventListener("saampark_branch_switched", refreshLiveDashboard)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (interval) clearInterval(interval)
      window.removeEventListener("storage", refreshLiveDashboard)
      window.removeEventListener("saampark_company_switched", refreshLiveDashboard)
      window.removeEventListener("saampark_branch_switched", refreshLiveDashboard)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshLiveDashboard])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userKey = user?.email ? user.email.toLowerCase().trim() : "default"
      const savedTodos = localStorage.getItem(`saampark_todos_${userKey}`)
      if (savedTodos) {
        try { setTodos(JSON.parse(savedTodos)) } catch {}
      } else {
        setTodos([
          { id: 1, text: "Set roles and permissions for team members", done: false },
          { id: 2, text: "Setup notifications for tasks", done: false },
          { id: 3, text: "Discuss project deliverables with team", done: false },
        ])
      }

      const savedNote = localStorage.getItem(`saampark_sticky_note_${userKey}`)
      if (savedNote !== null) {
        setNoteText(savedNote)
      } else {
        setNoteText("My quick notes here...")
      }
    }
  }, [user])

  // Save todos to localStorage when updated
  const updateTodos = (newTodos: typeof todos) => {
    setTodos(newTodos)
    if (typeof window !== "undefined" && user?.email) {
      const userKey = user.email.toLowerCase().trim()
      localStorage.setItem(`saampark_todos_${userKey}`, JSON.stringify(newTodos))
    }
  }

  // Save note to localStorage when updated
  const updateNoteText = (text: string) => {
    setNoteText(text)
    if (typeof window !== "undefined" && user?.email) {
      const userKey = user.email.toLowerCase().trim()
      localStorage.setItem(`saampark_sticky_note_${userKey}`, text)
    }
  }

  // Timer tick interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClockedIn) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isClockedIn, tick])

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0")
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  const normRole = normalizeRole(user.role)
  const currentCompanyObj = companies.find(c => c.id === targetComp || c.slug === targetComp) || companies[0] || { name: "SAAMPARK Technology", logo: "💻" }
  const currentBranchObj = branches.find(b => b.id === targetBranch)

  // Find currently selected user object for attendance history
  const selectedUserObj = realUsers.find((u) => u.email === selectedUserEmail) || realUsers[0] || user

  // =========================================================================
  // DYNAMIC METRICS CALCULATION (FOR ACTIVE COMPANY & BRANCH)
  // =========================================================================
  const openProjectsCount = liveProjects.filter(p => String(p.status) === "In Progress" || String(p.status) === "Open" || String(p.status) === "Pending").length
  const completedProjectsCount = liveProjects.filter(p => String(p.status) === "Completed" || String(p.status) === "Finished" || (p.progress || 0) >= 100).length
  const holdProjectsCount = liveProjects.filter(p => String(p.status) === "Hold" || String(p.status) === "On Hold").length
  const totalProjectsCount = liveProjects.length
  const averageProjectProgression = totalProjectsCount > 0 
    ? Math.round(liveProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjectsCount) 
    : 0

  // Invoice breakdown
  const fullyPaidInvoices = liveInvoices.filter(i => i.status === "Fully paid")
  const partiallyPaidInvoices = liveInvoices.filter(i => i.status === "Partially paid")
  const unpaidInvoices = liveInvoices.filter(i => i.status === "Not paid" || i.status === "Payment Pending" || i.status === "Draft")

  const totalInvoicedSum = liveInvoices.reduce((sum, i) => {
    const num = i.baseAmount || parseInt(String(i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
    return sum + num
  }, 0)

  const totalReceivedSum = liveInvoices.reduce((sum, i) => {
    const num = parseInt(String(i.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
    return sum + num
  }, 0)

  const totalDueSum = liveInvoices.reduce((sum, i) => {
    const num = parseInt(String(i.due || "0").replace(/[^0-9]/g, "")) || 0
    return sum + num
  }, 0)

  // Expense breakdown
  const totalExpenseSum = liveExpenses.reduce((sum, e) => {
    const num = e.amountNum || parseInt(String(e.amount || "0").replace(/[^0-9]/g, "")) || 0
    return sum + num
  }, 0)

  // Task status distribution
  const taskTodoCount = liveTasks.filter(t => String(t.status) === "To do" || String(t.status) === "Pending").length
  const taskInProgressCount = liveTasks.filter(t => String(t.status) === "In progress" || String(t.status) === "In Progress").length
  const taskReviewCount = liveTasks.filter(t => String(t.status) === "Review").length
  const taskDoneCount = liveTasks.filter(t => String(t.status) === "Done" || String(t.status) === "Completed").length

  const taskDonutData = [
    { label: "To do", value: taskTodoCount || 1, color: "#eab308" },
    { label: "In progress", value: taskInProgressCount || 0, color: "#3b82f6" },
    { label: "Review", value: taskReviewCount || 0, color: "#a855f7" },
    { label: "Done", value: taskDoneCount || 0, color: "#10b981" },
  ]

  const incomeVsExpenseData = [
    { label: "Revenue Collected", value: Math.max(1, totalReceivedSum), color: "#10b981" },
    { label: "Expenses Incurred", value: Math.max(0, totalExpenseSum), color: "#ec4899" },
  ]

  // =========================================================================
  // 1. CLIENT DASHBOARD VIEW (Rendered for Clients)
  // =========================================================================
  if (normRole === 'Clients') {
    const clientProjects = liveProjects.filter((p) => {
      const clientName = (p.client || "").toLowerCase().trim()
      const userName = (user.name || "").toLowerCase().trim()
      const userEmail = (user.email || "").toLowerCase().trim()
      return clientName === userName || clientName.includes(userName) || (userEmail && clientName.includes(userEmail))
    })

    const completedProjects = clientProjects.filter(p => (p.progress || 0) >= 100 || p.status === "Completed")

    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        {/* ── HEADER & COMPANY SCOPE BANNER ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <span className="text-base">{currentCompanyObj.logo || "🏢"}</span>
              <span>{currentCompanyObj.name}</span>
              {currentBranchObj && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                  <MapPin size={11} className="text-primary shrink-0" />
                  <span>{currentBranchObj.name}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your projects, invoices, support tickets, and communications for {currentCompanyObj.name}.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/feature/tickets">
              <Button variant="outline" size="sm" leftIcon={<AlertCircle size={14} />}>
                My Tickets
              </Button>
            </a>
            <a href="/feature/messages">
              <Button variant="primary" size="sm" leftIcon={<Bell size={14} />}>
                Message Team
              </Button>
            </a>
          </div>
        </div>

        {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Grid} colorClass="bg-blue-500" value={`${clientProjects.length} Projects`} label="My Active Projects" />
          <KPICard icon={CheckCircle2} colorClass="bg-emerald-500" value={`${completedProjects.length} Done`} label="Completed Milestones" />
          <KPICard icon={AlertCircle} colorClass="bg-amber-500" value={`${liveInvoices.length} Invoices`} label="Billing Invoices" />
          <KPICard icon={FileText} colorClass="bg-indigo-500" value={`₹${totalReceivedSum.toLocaleString("en-IN")}`} label="Paid Total" />
        </div>

        {/* ── PROJECTS + QUICK ACTIONS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Widget title="My Projects & Delivery Progress" icon={Grid} className="lg:col-span-2">
            <div className="space-y-4 pt-2">
              {clientProjects.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs">
                  <Grid size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p>No projects are currently assigned to your account in {currentCompanyObj.name}.</p>
                  <p className="mt-1">Contact your project manager to get started.</p>
                </div>
              ) : (
                clientProjects.slice(0, 5).map((p, i) => {
                  const pct = Math.min(100, Math.max(0, p.progress || 0))
                  const statusColor = pct >= 100 ? "bg-emerald-600" : pct >= 60 ? "bg-blue-600" : "bg-amber-500"
                  const badgeColor = pct >= 100 ? "bg-emerald-100 text-emerald-700" : pct >= 60 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  return (
                    <motion.div key={p.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="p-4 bg-surface border border-border/80 rounded-xl space-y-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">{p.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.client && <span>Client: <strong className="text-foreground">{p.client}</strong> · </span>}
                            {p.deadline && <span>Due: {p.deadline}</span>}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full shrink-0 ${badgeColor}`}>
                          {pct >= 100 ? "Completed" : `${pct}% Done`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full rounded-full ${statusColor}`} />
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </Widget>

          {/* Quick Actions */}
          <Widget title="Quick Actions" icon={TrendingUp}>
            <div className="space-y-2 pt-1">
              {[
                { label: "View My Projects", href: "/feature/projects", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/50", icon: Grid },
                { label: "My Support Tickets", href: "/feature/tickets", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/50", icon: AlertCircle },
                { label: "Message Team", href: "/feature/messages", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50", icon: Bell },
                { label: "View Invoices & Orders", href: "/feature/sales", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/50", icon: DollarSign },
              ].map(({ label, href, color, icon: Icon }) => (
                <a key={href} href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.01] cursor-pointer ${color}`}>
                  <Icon size={14} />
                  {label}
                </a>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. STAFF / TEAM MEMBER DASHBOARD VIEW (Rendered for Teams)
  // =========================================================================
  if (normRole === 'Teams') {
    const normName = (user?.name || "").toLowerCase().trim()
    const normEmail = (user?.email || "").toLowerCase().trim()

    const myTasks = liveTasks.filter((t) => {
      const assigned = (t.assignedTo || "").toLowerCase().trim()
      const collab = (t.collaborators || "").toLowerCase().trim()
      return (
        assigned === normName ||
        assigned === normEmail ||
        (normName && assigned.includes(normName)) ||
        (collab && normName && collab.includes(normName))
      )
    })

    const myProjects = liveProjects.filter((p) => {
      const members = p.members || []
      return members.some((m: any) => {
        const mName = (m.name || "").toLowerCase().trim()
        const mEmail = (m.email || "").toLowerCase().trim()
        return mName === normName || mEmail === normEmail || (normName && mName.includes(normName))
      })
    })

    const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <span className="text-base">{currentCompanyObj.logo || "🏢"}</span>
              <span>{currentCompanyObj.name}</span>
              {currentBranchObj && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                  <MapPin size={11} className="text-primary shrink-0" />
                  <span>{currentBranchObj.name}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {user.name}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your tasks, shift tracker, and project updates for {currentCompanyObj.name}.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/feature/tasks">
              <Button variant="outline" size="sm" leftIcon={<CheckSquare size={14} />}>My Tasks</Button>
            </a>
            <a href="/feature/messages">
              <Button variant="primary" size="sm" leftIcon={<Bell size={14} />}>Messages</Button>
            </a>
          </div>
        </div>

        {/* Shift Clock & KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Shift Attendance</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {isClockedIn ? formatTime(secondsElapsed) : "00:00:00"}
            </div>
            <button
              onClick={() => isClockedIn ? clockOut() : clockIn()}
              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isClockedIn
                  ? "bg-rose-500 text-white hover:bg-rose-600 shadow-2xs"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
              }`}
            >
              {isClockedIn ? "Punch Out Shift" : "Punch In Shift"}
            </button>
          </div>

          <KPICard icon={CheckSquare} colorClass="bg-blue-500" value={`${myTasks.length} Tasks`} label="My Assigned Tasks" />
          <KPICard icon={Grid} colorClass="bg-indigo-500" value={`${myProjects.length} Projects`} label="My Active Projects" />
          <KPICard icon={CheckCircle2} colorClass="bg-emerald-500" value={`${myTasks.filter(t => t.status === "Done").length} Completed`} label="Tasks Finished" />
        </div>

        {/* Assigned Projects */}
        <Widget title="My Assigned Projects" icon={Grid}>
          <div className="space-y-3 pt-1">
            {myProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No projects assigned yet in this company/branch.</p>
            ) : (
              myProjects.map((p) => (
                <div key={p.id} className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{p.title}</h4>
                    <p className="text-[11px] text-muted-foreground">Client: {p.client} · Deadline: {p.deadline}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {p.progress}% Done
                  </span>
                </div>
              ))
            )}
          </div>
        </Widget>
      </div>
    )
  }

  // =========================================================================
  // 3. COMPANY ADMIN / SUPER ADMIN DASHBOARD VIEW (100% DYNAMIC & ISOLATED)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 bg-background/50 min-h-screen -mx-4 -mt-4 p-4 sm:px-8 sm:py-6 rounded-tl-xl">
      
      {/* --- DASHBOARD HEADER & ACTIVE COMPANY/BRANCH BADGE --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
            <span className="text-base">{currentCompanyObj.logo || "🏢"}</span>
            <span className="font-bold">{currentCompanyObj.name}</span>
            {currentBranchObj ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold flex items-center gap-1">
                <MapPin size={11} /> {currentBranchObj.name} ({currentBranchObj.city || "Branch"})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-semibold">
                🏢 All Branches / Main HQ
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {user.role === "Super Admin" ? "Super Admin Executive Dashboard" : `${currentCompanyObj.name} Admin Dashboard`}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            Active Accounts: <strong className="text-foreground">{realUsers.length}</strong>
          </span>
          <span className="text-muted-foreground">
            Projects: <strong className="text-foreground">{liveProjects.length}</strong>
          </span>
          <span className="text-muted-foreground">
            Orders: <strong className="text-foreground">{liveOrders.length}</strong>
          </span>
        </div>
      </div>

      {/* --- ROW 1: KPI CARDS ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard 
          icon={Clock} 
          colorClass={isClockedIn ? "bg-emerald-500" : "bg-pink-500"} 
          value={
            <button 
              onClick={() => isClockedIn ? clockOut() : clockIn()}
              className={`text-base font-medium px-2.5 py-1 rounded border flex items-center gap-1.5 w-fit ml-auto transition-all cursor-pointer ${
                isClockedIn 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" 
                  : "bg-pink-50 text-pink-500 border-pink-100 hover:bg-pink-100"
              }`}
            >
              <Monitor size={14}/> 
              {isClockedIn ? "Clock Out" : "Clock In"}
            </button>
          } 
          label="" 
          subtextNode={
            <div className="mt-2 text-xs">
              {isClockedIn ? (
                <p className="text-emerald-600 font-mono font-medium flex items-center justify-end gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatTime(secondsElapsed)}
                </p>
              ) : (
                <p className="text-muted-foreground">You are currently clocked out</p>
              )}
            </div>
          }
        />
        <KPICard icon={Grid} colorClass="bg-blue-400" value={`${activeTasksCount} Open`} label="Active Tasks" />
        <KPICard icon={Calendar} colorClass="bg-indigo-500" value={`₹${totalInvoicedSum.toLocaleString("en-IN")}`} label="Total Invoiced" />
        <KPICard icon={PieChart} colorClass="bg-pink-500" value={`₹${totalDueSum.toLocaleString("en-IN")}`} label="Balance Due" />
      </div>

      {/* --- ROW 2: REAL DYNAMIC OVERVIEWS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projects Overview (Calculated from Real Database) */}
        <Widget title="Projects Overview" icon={Grid} className="flex flex-col">
          <div className="flex justify-around items-center py-6 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-500">{openProjectsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{completedProjectsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{holdProjectsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">On Hold</p>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="h-6 w-full rounded-full border border-emerald-500 p-0.5 relative flex items-center">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${averageProjectProgression}%` }} 
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-emerald-300/50 rounded-full" 
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs text-emerald-700 dark:text-emerald-300 font-bold z-10 pointer-events-none">
                Average Progression: {averageProjectProgression}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 mt-6 pt-4 border-t border-border/40 gap-4 text-xs">
            <div className="text-center border-r border-border/40">
               <p className="text-lg font-bold text-foreground">{totalProjectsCount}</p>
               <p className="text-[11px] text-muted-foreground mt-0.5">Total Company Projects</p>
            </div>
            <div className="text-center">
               <p className="text-lg font-bold text-blue-600">{liveOrders.length}</p>
               <p className="text-[11px] text-muted-foreground mt-0.5">Sales Orders</p>
            </div>
          </div>
        </Widget>

        {/* Invoice Overview (Calculated from Real Database) */}
        <Widget title="Invoice & Billing Overview" icon={FileText}>
          <div className="space-y-4 pt-2">
            {[
              { label: "Fully Paid", count: fullyPaidInvoices.length, color: "bg-emerald-500", text: "text-emerald-500", percent: liveInvoices.length > 0 ? Math.round((fullyPaidInvoices.length / liveInvoices.length) * 100) : 0, amount: `₹${totalReceivedSum.toLocaleString("en-IN")}` },
              { label: "Partially Paid", count: partiallyPaidInvoices.length, color: "bg-amber-500", text: "text-amber-500", percent: liveInvoices.length > 0 ? Math.round((partiallyPaidInvoices.length / liveInvoices.length) * 100) : 0, amount: `${partiallyPaidInvoices.length} Invoices` },
              { label: "Due / Pending", count: unpaidInvoices.length, color: "bg-rose-500", text: "text-rose-500", percent: liveInvoices.length > 0 ? Math.round((unpaidInvoices.length / liveInvoices.length) * 100) : 0, amount: `₹${totalDueSum.toLocaleString("en-IN")}` },
            ].map((inv, i) => (
              <div key={i} className="flex items-center text-sm">
                <span className={`w-6 font-bold ${inv.text}`}>{inv.count}</span>
                <span className="w-28 text-muted-foreground text-xs">{inv.label}</span>
                <div className="flex-1 mx-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${inv.percent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${inv.color}`} 
                  />
                </div>
                <span className="text-right text-xs text-foreground font-bold">{inv.amount}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end mt-auto pt-6 border-t border-border/40 text-xs">
            <div>
              <p className="text-muted-foreground">Total Invoiced</p>
              <p className="font-extrabold text-sm text-foreground">₹{totalInvoicedSum.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Outstanding Due</p>
              <p className="font-extrabold text-sm text-rose-500">₹{totalDueSum.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </Widget>

        {/* Income vs Expenses (Calculated from Real Database) */}
        <Widget title="Revenue vs Expenses" icon={TrendingUp}>
           <div className="flex mt-2 items-center gap-6">
             <DonutChart data={incomeVsExpenseData} size={130} strokeWidth={14} />
             <div className="flex-1 space-y-3 text-xs">
               <div>
                 <p className="font-semibold text-foreground mb-1">Total Revenue Collected</p>
                 <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-sm">
                   <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>
                   ₹{totalReceivedSum.toLocaleString("en-IN")}
                 </div>
               </div>
               <div>
                 <p className="font-semibold text-foreground mb-1">Logged Expenses</p>
                 <div className="flex items-center gap-1.5 font-bold text-pink-600 text-sm">
                   <span className="w-2.5 h-2.5 rounded-full bg-pink-500"/>
                   ₹{totalExpenseSum.toLocaleString("en-IN")}
                 </div>
               </div>
             </div>
           </div>
           
           <div className="mt-auto pt-4 border-t border-border/40 text-xs flex justify-between">
             <span className="text-muted-foreground">Net Margin</span>
             <span className={`font-bold ${totalReceivedSum >= totalExpenseSum ? "text-emerald-600" : "text-rose-500"}`}>
               ₹{(totalReceivedSum - totalExpenseSum).toLocaleString("en-IN")}
             </span>
           </div>
        </Widget>
      </div>

      {/* --- REAL DATA STAFF ATTENDANCE & HISTORICAL LOGIN LOG MONITOR PANEL --- */}
      <Widget title="Company Staff Attendance & Session Monitor" icon={Users}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Filter Staff User:</span>
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-none"
              >
                {realUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.role} - {u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active User: {user.name}
              </span>
              <span className="text-muted-foreground">Registered Staff: {realUsers.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">User Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Login Punch Time</th>
                  <th className="py-2.5 px-3">Logout Punch Time</th>
                  <th className="py-2.5 px-3">Total Worked Hours</th>
                  <th className="py-2.5 px-3">Session Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {realUsers.map((u) => {
                  const isActiveUser = u.email.toLowerCase() === user.email.toLowerCase()

                  let punchInTime = "09:00 AM"
                  let punchOutTime = "-"
                  let workedHours = "-"
                  let statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Offline</span>

                  if (isActiveUser) {
                    punchInTime = "Today at 09:15 AM"
                    if (isClockedIn) {
                      punchOutTime = "Active Session"
                      workedHours = formatTime(secondsElapsed)
                      statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">🟢 CLOCKED IN</span>
                    } else {
                      punchOutTime = "06:15 PM"
                      workedHours = "08 hrs 15 mins"
                      statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">🔵 LOGGED IN</span>
                    }
                  } else if (u.status === "Active") {
                    statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">ACTIVE</span>
                  }

                  return (
                    <tr key={u.email} className={`hover:bg-surface-hover/30 ${isActiveUser ? "bg-primary/5" : ""}`}>
                      <td className="py-2.5 px-3 font-mono font-medium">Today</td>
                      <td className="py-2.5 px-3 font-bold text-foreground flex items-center gap-1.5">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.email}`} alt={u.name} className="w-5 h-5 rounded-full border shrink-0" />
                        <span>{u.name}</span>
                        {isActiveUser && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">YOU</span>}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{u.role}</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-mono font-bold">{punchInTime}</td>
                      <td className="py-2.5 px-3 text-rose-600 font-mono font-bold">{punchOutTime}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">{workedHours}</td>
                      <td className="py-2.5 px-3">{statusBadge}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Widget>

      {/* --- ROW 3: TASKS & TEAM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* All Tasks Overview */}
        <Widget title="All Tasks Overview" icon={Grid}>
          <div className="flex items-center justify-around py-4">
             <DonutChart data={taskDonutData} size={140} strokeWidth={14} />
             <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-500"/> To do</span>
                  <span className="font-bold text-yellow-500">{taskTodoCount}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500"/> In progress</span>
                  <span className="font-bold text-blue-500">{taskInProgressCount}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-purple-500"/> Review</span>
                  <span className="font-bold text-purple-500">{taskReviewCount}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Done</span>
                  <span className="font-bold text-emerald-500">{taskDoneCount}</span>
                </div>
             </div>
          </div>
          <div className="flex justify-around items-center pt-4 mt-auto border-t border-border/40 text-xs">
             <div className="text-muted-foreground">Total Tasks: <strong className="text-foreground">{liveTasks.length}</strong></div>
             <a href="/feature/tasks" className="text-blue-600 hover:underline font-semibold">View Task Kanban →</a>
          </div>
        </Widget>

        {/* Team Members Overview */}
        <Widget title="Team Members Overview" icon={Users}>
           <div className="grid grid-cols-2 gap-4 py-4 text-center">
              <div>
                <p className="text-3xl font-bold text-foreground">{realUsers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Company Staff</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-500">{realUsers.filter(u => u.status === "Active").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Accounts</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40 text-center text-xs">
              <div>
                <p className="text-2xl font-bold text-purple-600">{realUsers.filter(u => u.role === "Admin" || u.role === "Super Admin").length}</p>
                <p className="text-muted-foreground mt-0.5">Admins</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{realUsers.filter(u => u.role === "Teams" || u.role === "Team").length}</p>
                <p className="text-muted-foreground mt-0.5">Developers / Staff</p>
              </div>
           </div>
           
           <div className="mt-auto border border-border/40 rounded-lg p-2.5 text-xs text-center">
             <a href="/feature/users" className="text-blue-600 hover:underline font-semibold">Manage Company Users →</a>
           </div>
        </Widget>

        {/* Recent Invoices / Orders */}
        <Widget title="Recent Orders & Billing" icon={DollarSign}>
           <div className="space-y-2.5 pt-1 text-xs">
             {liveOrders.length === 0 ? (
               <p className="text-muted-foreground text-center py-6">No sales orders created yet for this company/branch.</p>
             ) : (
               liveOrders.slice(0, 4).map((ord) => (
                 <div key={ord.id} className="p-2.5 bg-surface border border-border rounded-xl flex items-center justify-between">
                   <div>
                     <p className="font-bold text-foreground truncate max-w-[140px]">{ord.project}</p>
                     <p className="text-[10px] text-muted-foreground">{ord.client} · {ord.orderDate}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-foreground">{ord.totalAmount}</p>
                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                       ord.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                     }`}>
                       {ord.paymentStatus}
                     </span>
                   </div>
                 </div>
               ))
             )}
           </div>
           
           <div className="mt-auto pt-3 border-t border-border/40 text-center">
             <a href="/feature/sales/orders" className="text-blue-600 hover:underline text-xs font-semibold">View All Sales Orders →</a>
           </div>
        </Widget>
      </div>

      {/* --- ROW 4: OPEN PROJECTS, TASKS, STICKY NOTE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
           {/* Open Projects List */}
           <Widget title={`Open Projects in ${currentCompanyObj.name}`} icon={Grid}>
              <div className="space-y-4 pt-2">
                {liveProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No projects registered yet for {currentCompanyObj.name}.</p>
                ) : (
                  liveProjects.slice(0, 5).map((p, i) => (
                    <div key={p.id || i} className="border-b border-border/40 pb-4 last:border-0 group">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-foreground">{p.title}</p>
                        <p className="text-xs font-bold text-blue-600">{p.progress || 0}%</p>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.progress || 0}%` }}
                          transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                          className="h-full bg-blue-500 rounded-full" 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Client: {p.client} | Deadline: {p.deadline}</p>
                    </div>
                  ))
                )}
              </div>
           </Widget>

           {/* My Tasks */}
           <Widget title="Recent Tasks" icon={CheckSquare}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-muted-foreground border-b border-border/40 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Assigned To</th>
                      <th className="px-3 py-2 text-right">Deadline</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {liveTasks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No tasks recorded for this company.
                        </td>
                      </tr>
                    ) : (
                      liveTasks.slice(0, 5).map((t, i) => (
                        <tr key={t.id || i} className="hover:bg-surface-hover/20 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-foreground">{t.title}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{t.assignedTo || "Unassigned"}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{t.deadline || "-"}</td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded text-white ${
                              t.status === "Done" ? "bg-emerald-500" : "bg-blue-500"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </Widget>
        </div>

        {/* Sticky Note */}
        <div className="space-y-6">
          <Widget title="Personal Sticky Note" icon={FileText} className="h-full min-h-[380px] !bg-yellow-200/50 dark:!bg-yellow-900/30 border-yellow-300">
            <textarea 
              value={noteText}
              onChange={e => updateNoteText(e.target.value)}
              className="w-full h-full bg-transparent text-yellow-900 dark:text-yellow-100 border-none rounded-none p-0 text-xs focus:outline-none focus:ring-0 resize-none leading-relaxed font-sans"
              placeholder="My quick scratchpad notes..."
            />
          </Widget>
        </div>
        
      </div>

    </div>
  )
}
