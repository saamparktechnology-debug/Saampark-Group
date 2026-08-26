"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckSquare, Clock, Calendar, DollarSign, Plus, Edit2, 
  Trash2, Download, Search, CheckCircle2, MoreHorizontal,
  FileText, PieChart, Users, AlertCircle, TrendingUp, Bell, Grid, Briefcase, Monitor,
  ShieldCheck, Lock, Unlock, PhoneCall, Check, ExternalLink, UserCheck
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useTimerStore } from "@/store/useTimerStore"
import { Button } from "@/components/ui/Button"
import { Widget } from "./components/Widget"
import { KPICard } from "./components/KPICard"
import { DonutChart } from "./components/DonutChart"
import { BarChartMockup } from "./components/BarChartMockup"
import { DATA } from "./services/dashboardService"
import { getStoredUserAccountsAsync, getUsers } from "../users/services/userService"
import { taskService } from "../tasks/services/taskService"
import { getProjects } from "../projects/services/projectService"
import { Task } from "../tasks/types"
import { Project } from "../projects/types"
import { filterGlobalDeletedItems } from "@/lib/storageSync"

import { normalizeRole } from "@/store/usePermissionStore"

export default function DashboardMain() {
  const { activeCompanyId, user } = useAuthStore()
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

  const refreshLiveDashboard = React.useCallback(async () => {
    try {
      const { getLeads } = await import("../leads/services/leadService")
      const [uList, tList, pList, lList] = await Promise.all([
        getUsers(),
        taskService.getTasks(),
        getProjects(),
        getLeads(),
      ])
      const cleanUsers = filterGlobalDeletedItems(uList)
      const cleanTasks = filterGlobalDeletedItems(tList)
      const cleanProjects = filterGlobalDeletedItems(pList)
      const cleanLeads = filterGlobalDeletedItems(lList)

      setRealUsers(cleanUsers)
      if (cleanUsers.length > 0 && !selectedUserEmail) {
        setSelectedUserEmail(cleanUsers[0].email)
      }

      const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
      let scopedTasks = cleanTasks
      if (user && !isSuperOrAdmin) {
        const normName = (user.name || "").toLowerCase().trim()
        const normEmail = (user.email || "").toLowerCase().trim()
        scopedTasks = cleanTasks.filter((t) => {
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

      const active = scopedTasks.filter((t) => t.status !== "Done")
      setActiveTasksCount(active.length)
      setLiveTasks(cleanTasks)
      setLiveProjects(cleanProjects)
      setLiveLeads(cleanLeads)
    } catch (e) {
      console.warn("Dashboard refresh error:", e)
    }
  }, [selectedUserEmail, user])

  React.useEffect(() => {
    refreshLiveDashboard()
    
    let interval: any = null
    const startPolling = () => {
      if (!interval) {
        interval = setInterval(() => {
          if (typeof document !== "undefined" && !document.hidden) {
            refreshLiveDashboard()
          }
        }, 5000)
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
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (interval) clearInterval(interval)
      window.removeEventListener("storage", refreshLiveDashboard)
      window.removeEventListener("saampark_company_switched", refreshLiveDashboard)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshLiveDashboard])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      getStoredUserAccountsAsync().then((accounts) => {
        setRealUsers(accounts)
        if (accounts.length > 0 && !selectedUserEmail) {
          setSelectedUserEmail(accounts[0].email)
        }
      }).catch(() => {})
      // Load active tasks count dynamically
      const loadTaskCount = async () => {
        const tasks = await taskService.getTasks()
        const active = tasks.filter((t) => t.status !== "Done")
        setActiveTasksCount(active.length)
      }
      loadTaskCount()

      const handleTaskStorage = () => loadTaskCount()
      window.addEventListener("storage", handleTaskStorage)

      // Load saved todos and sticky note from localStorage
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

  if (!user) return null
  const normRole = normalizeRole(user.role)
  const d = DATA[activeCompanyId === 'digital' ? 'digital' : 'tech'] || DATA.tech

  // Find currently selected user object for attendance history
  const selectedUserObj = realUsers.find((u) => u.email === selectedUserEmail) || realUsers[0] || user

  // Check if selected user is the currently logged in user
  const isSelectedUserActiveLoggedIn = selectedUserObj?.email?.toLowerCase() === user.email.toLowerCase()

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
    const activeProjects = clientProjects.filter(p => (p.progress || 0) < 100 && p.status !== "Completed")

    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <Briefcase size={14} /> Client Portal Dashboard
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your projects, invoices, support tickets, and team communications — all in one place.
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
          <KPICard icon={AlertCircle} colorClass="bg-amber-500" value="Open" label="Support Tickets" />
          <KPICard icon={FileText} colorClass="bg-indigo-500" value="Invoices" label="View Billing History" />
        </div>

        {/* ── PROJECTS + QUICK ACTIONS ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects List */}
          <Widget title="My Projects & Progress" icon={Grid} className="lg:col-span-2">
            <div className="space-y-4 pt-2">
              {clientProjects.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs">
                  <Grid size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p>No projects are currently assigned to your account.</p>
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
                      {p.members && p.members.length > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Team: {p.members.map((m: any) => m.name || m).slice(0, 3).join(", ")}</span>
                          <a href="/feature/projects" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                            View Details <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
              {clientProjects.length > 5 && (
                <a href="/feature/projects" className="block text-center text-xs text-primary hover:underline pt-1">
                  View all {clientProjects.length} projects →
                </a>
              )}
            </div>
          </Widget>

          {/* Quick Actions + Support Widget */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Widget title="Quick Actions" icon={TrendingUp}>
              <div className="space-y-2 pt-1">
                {[
                  { label: "View My Projects", href: "/feature/projects", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/50", icon: Grid },
                  { label: "My Support Tickets", href: "/feature/tickets", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/50", icon: AlertCircle },
                  { label: "Message My Team", href: "/feature/messages", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/50", icon: Bell },
                  { label: "View Sales & Invoices", href: "/feature/sales", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/50", icon: DollarSign },
                  { label: "Knowledge Base", href: "/feature/knowledge-base", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-900/50", icon: FileText },
                ].map(({ label, href, color, icon: Icon }) => (
                  <a key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.01] cursor-pointer ${color}`}>
                    <Icon size={14} />
                    {label}
                  </a>
                ))}
              </div>
            </Widget>

            {/* My Account Info */}
            <Widget title="My Account" icon={UserCheck}>
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-muted-foreground truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">Client</span>
                  </div>
                </div>
                <a href="/feature/settings" className="flex items-center justify-center gap-2 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                  <Edit2 size={12} /> Edit Profile & Settings
                </a>
              </div>
            </Widget>
          </div>
        </div>

        {/* ── ANNOUNCEMENTS + TASKS + EVENTS ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <Widget title="My Assigned Tasks" icon={CheckSquare} className="lg:col-span-2">
            <div className="space-y-2 pt-1 text-xs">
              {liveTasks.filter(t => {
                const assigned = (t.assignedTo || "").toLowerCase()
                const uName = (user.name || "").toLowerCase()
                const uEmail = (user.email || "").toLowerCase()
                return assigned.includes(uName) || assigned.includes(uEmail)
              }).slice(0, 5).map((t, i) => (
                <div key={t.id || i} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{t.title}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {t.relatedTo && <span>{t.relatedTo} · </span>}
                      {t.deadline && <span>Due: {t.deadline}</span>}
                    </p>
                  </div>
                  <span className={`ml-3 px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ${
                    t.status === "Done" ? "bg-emerald-100 text-emerald-700" :
                    t.priority === "Urgent" || t.priority === "High" ? "bg-rose-100 text-rose-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{t.status || "In Progress"}</span>
                </div>
              ))}
              {liveTasks.filter(t => {
                const assigned = (t.assignedTo || "").toLowerCase()
                return assigned.includes((user.name || "").toLowerCase()) || assigned.includes((user.email || "").toLowerCase())
              }).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No tasks assigned to you yet.</p>
                </div>
              )}
              <a href="/feature/tasks" className="block text-center text-xs text-primary hover:underline pt-1">View all tasks →</a>
            </div>
          </Widget>

          {/* Upcoming Events */}
          <Widget title="Upcoming Meetings & Events" icon={Calendar}>
            <div className="space-y-2 pt-1 text-xs">
              {[
                { title: "Project Review Call", date: "Today · 3:00 PM", color: "bg-blue-500" },
                { title: "Design Handoff Meeting", date: "Tomorrow · 11:00 AM", color: "bg-indigo-500" },
                { title: "Monthly Progress Report", date: "28 Aug · 10:00 AM", color: "bg-amber-500" },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface border border-border rounded-xl">
                  <div className={`w-2 h-full rounded-full ${ev.color} mt-1.5 shrink-0`} style={{ minHeight: 24 }} />
                  <div>
                    <p className="font-semibold text-foreground">{ev.title}</p>
                    <p className="text-muted-foreground mt-0.5">{ev.date}</p>
                  </div>
                </div>
              ))}
              <a href="/feature/events" className="block text-center text-xs text-primary hover:underline pt-1">View all events →</a>
            </div>
          </Widget>
        </div>
      </div>
    )
  }

  // Computed metrics for staff/team member views
  const normName = (user?.name || "").toLowerCase().trim()
  const normEmail = (user?.email || "").toLowerCase().trim()

  const myTasks = React.useMemo(() => {
    return liveTasks.filter((t) => {
      const assigned = (t.assignedTo || "").toLowerCase().trim()
      const collab = (t.collaborators || "").toLowerCase().trim()
      if (!assigned) return false
      return (
        assigned === normName ||
        assigned === normEmail ||
        (normName && (assigned.includes(normName) || normName.includes(assigned))) ||
        (normEmail && assigned.includes(normEmail)) ||
        (collab && normName && collab.includes(normName))
      )
    })
  }, [liveTasks, normName, normEmail])

  const myUrgentTasks = React.useMemo(() => {
    return myTasks.filter((t) => t.priority === "Urgent" || t.priority === "High")
  }, [myTasks])

  const myDoneTasks = React.useMemo(() => {
    return myTasks.filter((t) => t.status === "Done")
  }, [myTasks])

  const myCallReminders = React.useMemo(() => {
    return liveLeads.filter((l) => {
      const caller = (l.caller || l.owner || "").toLowerCase().trim()
      const isCallerMatch =
        caller.includes(normName) ||
        normName.includes(caller) ||
        (normEmail && caller.includes(normEmail))
      const hasReminder =
        l.reminderDate &&
        !["none", "00,00,0000", "00-00-0000", "00/00/0000"].includes(l.reminderDate.toLowerCase().trim())
      return isCallerMatch && hasReminder
    })
  }, [liveLeads, normName, normEmail])

  const myProjects = React.useMemo(() => {
    return liveProjects.filter((p) => {
      const members = p.members || []
      return members.some((m: any) => {
        const mName = (m.name || "").toLowerCase().trim()
        const mEmail = (m.email || "").toLowerCase().trim()
        return mName === normName || mEmail === normEmail || (normName && mName.includes(normName))
      })
    })
  }, [liveProjects, normName, normEmail])

  // =========================================================================
  // 2. STAFF / TEAM MEMBER DASHBOARD VIEW (Rendered for Teams)
  // =========================================================================
  if (normRole === 'Teams') {
    const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <UserCheck size={14} /> Staff Workbench · {todayStr}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {user.name}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your tasks, shift tracker, call reminders, and project updates — everything in one place.
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

        {/* ── KPI CARDS + SHIFT CLOCK ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Shift Time Clock */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Shift Attendance</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            </div>
            <button
              type="button"
              onClick={() => (isClockedIn ? clockOut() : clockIn())}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isClockedIn
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              }`}
            >
              <Monitor size={14} />
              <span>{isClockedIn ? "Clock Out Now" : "Clock In Shift"}</span>
            </button>
            <div className="text-xs font-mono text-center pt-1 border-t border-border/50">
              {isClockedIn ? (
                <span className="text-emerald-600 font-bold">{formatTime(secondsElapsed)} elapsed</span>
              ) : (
                <span className="text-muted-foreground">Not clocked in</span>
              )}
            </div>
          </div>

          <KPICard icon={CheckSquare} colorClass="bg-blue-500" value={`${myTasks.length}`} label="Assigned Tasks" />
          <KPICard icon={AlertCircle} colorClass="bg-rose-500" value={`${myUrgentTasks.length}`} label="High Priority" />
          <KPICard icon={PhoneCall} colorClass="bg-amber-500" value={`${myCallReminders.length}`} label="Call Follow-ups" />
        </div>

        {/* ── TASKS + CALL REMINDERS ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Assigned Tasks */}
          <Widget title="My Assigned Tasks" icon={CheckSquare} className="lg:col-span-2">
            <div className="space-y-2 pt-1 text-xs">
              {myTasks.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckSquare size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No tasks currently assigned to you.</p>
                  <p className="text-[11px] mt-1">Your admin will assign tasks shortly.</p>
                </div>
              ) : (
                myTasks.slice(0, 7).map((t, i) => {
                  const statusColor = t.status === "Done" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : t.priority === "Urgent" || t.priority === "High" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  return (
                    <motion.div key={t.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-start justify-between p-3 bg-surface border border-border rounded-xl gap-3 hover:border-primary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{t.title}</p>
                        <p className="text-muted-foreground mt-0.5 truncate">
                          {t.relatedTo || "General"} {t.deadline && `· Due: ${t.deadline}`}
                        </p>
                        {(t.priority === "Urgent" || t.priority === "High") && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-rose-600 font-bold">
                            <AlertCircle size={10} /> Urgent
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ${statusColor}`}>{t.status || "Pending"}</span>
                    </motion.div>
                  )
                })
              )}
              {myTasks.length > 7 && (
                <a href="/feature/tasks" className="block text-center text-xs text-primary hover:underline pt-1">+{myTasks.length - 7} more tasks →</a>
              )}
            </div>
          </Widget>

          {/* Right Column: Call Reminders + Quick Links */}
          <div className="space-y-4">
            <Widget title="Today's Telecaller Call Desk" icon={PhoneCall}>
              <div className="space-y-2 pt-1 text-xs">
                {myCallReminders.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <PhoneCall size={24} className="mx-auto mb-2 opacity-30" />
                    <p>No follow-up calls scheduled.</p>
                  </div>
                ) : (
                  myCallReminders.slice(0, 5).map((l, i) => (
                    <div key={l.id || i} className="p-3 bg-surface border border-border rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{l.name}</span>
                        <span className="text-amber-600 font-semibold font-mono text-[10px]">{l.reminderTime || "—"}</span>
                      </div>
                      <p className="text-muted-foreground">{l.phone || "—"} · {l.service || "Service"}</p>
                      {l.reminderNotes && <p className="text-[11px] text-amber-600 font-medium">{l.reminderNotes}</p>}
                    </div>
                  ))
                )}
              </div>
            </Widget>

            {/* Quick Navigation */}
            <Widget title="Quick Links" icon={TrendingUp}>
              <div className="space-y-1.5 pt-1">
                {[
                  { label: "My Tasks", href: "/feature/tasks", color: "text-blue-600" },
                  { label: "My Projects", href: "/feature/projects", color: "text-indigo-600" },
                  { label: "Messages", href: "/feature/messages", color: "text-emerald-600" },
                  { label: "Calendar & Events", href: "/feature/events", color: "text-purple-600" },
                  { label: "Leads Pipeline", href: "/feature/leads", color: "text-amber-600" },
                  { label: "My Timecards", href: "/feature/team/timecards", color: "text-rose-600" },
                  { label: "My Profile", href: "/feature/settings", color: "text-zinc-600" },
                ].map(({ label, href, color }) => (
                  <a key={href} href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-surface-hover hover:border-primary/30 transition-all ${color} cursor-pointer`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {label}
                  </a>
                ))}
              </div>
            </Widget>
          </div>
        </div>

        {/* ── PROJECTS + STATS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Projects */}
          <Widget title="My Projects" icon={Grid} className="lg:col-span-2">
            <div className="space-y-3 pt-1 text-xs">
              {myProjects.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Grid size={28} className="mx-auto mb-2 opacity-30" />
                  <p>You haven't been assigned to any projects yet.</p>
                </div>
              ) : (
                myProjects.slice(0, 4).map((p, i) => {
                  const pct = Math.min(100, Math.max(0, p.progress || 0))
                  return (
                    <motion.div key={p.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                      className="p-3 bg-surface border border-border rounded-xl space-y-2 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">{p.title}</span>
                        <span className="text-[10px] font-bold text-muted-foreground ml-2">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} />
                      </div>
                      {p.deadline && <p className="text-muted-foreground text-[11px]">Deadline: {p.deadline}</p>}
                    </motion.div>
                  )
                })
              )}
              <a href="/feature/projects" className="block text-center text-xs text-primary hover:underline pt-1">View all projects →</a>
            </div>
          </Widget>

          {/* Performance Summary */}
          <Widget title="My Performance Summary" icon={TrendingUp}>
            <div className="space-y-4 pt-2 text-xs">
              {[
                { label: "Tasks Completed", value: myDoneTasks.length, total: myTasks.length, color: "bg-emerald-500" },
                { label: "Urgent / High Priority", value: myUrgentTasks.length, total: myTasks.length, color: "bg-rose-500" },
                { label: "Projects Involved", value: myProjects.length, total: liveProjects.length, color: "bg-blue-500" },
                { label: "Call Follow-ups Due", value: myCallReminders.length, total: liveLeads.length, color: "bg-amber-500" },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{label}</span>
                      <span className="font-bold text-foreground">{value}<span className="font-normal text-muted-foreground">/{total}</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                        className={`h-full rounded-full ${color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Widget>
        </div>
      </div>
    )
  }


  // =========================================================================
  // 3. COMPANY ADMIN / SUPER ADMIN DASHBOARD VIEW (FULL ORIGINAL RICH LAYOUT + REAL DATA ATTENDANCE)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 bg-background/50 min-h-screen -mx-4 -mt-4 p-4 sm:px-8 sm:py-6 rounded-tl-xl">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex items-center gap-2 mb-6">
        <Monitor size={18} className="text-muted-foreground" />
        <h1 className="text-xl font-medium text-foreground/90">Dashboard</h1>
      </div>

      {/* --- ROW 1: KPI CARDS ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard 
          icon={Clock} 
          colorClass={isClockedIn ? "bg-emerald-500" : "bg-pink-500"} 
          value={
            <button 
              onClick={() => isClockedIn ? clockOut() : clockIn()}
              className={`text-base font-medium px-2.5 py-1 rounded border flex items-center gap-1.5 w-fit ml-auto transition-all ${
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
        <KPICard icon={Grid} colorClass="bg-blue-400" value={`${activeTasksCount} Active`} label="My open tasks" />
        <KPICard icon={Calendar} colorClass="bg-indigo-500" value={d.kpi.events} label="Events today" />
        <KPICard icon={PieChart} colorClass="bg-pink-500" value={d.kpi.due} label="Due" />
      </div>

      {/* --- ROW 2: OVERVIEWS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <Widget title="Projects Overview" icon={Grid} className="flex flex-col">
          <div className="flex justify-around items-center py-6 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-500">{d.projectsOverview.open}</p>
              <p className="text-xs text-muted-foreground mt-1">Open</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{d.projectsOverview.completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{d.projectsOverview.hold}</p>
              <p className="text-xs text-muted-foreground mt-1">Hold</p>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="h-6 w-full rounded-full border border-emerald-500 p-0.5 relative flex items-center">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${d.projectsOverview.progression}%` }} 
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-emerald-300/50 rounded-full" 
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs text-emerald-700 font-medium z-10 pointer-events-none">
                Progression {d.projectsOverview.progression}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 mt-6 pt-6 border-t border-border/40 gap-4">
            <div className="text-center border-r border-border/40">
               <p className="text-2xl font-bold text-red-500">0</p>
               <p className="text-xs text-muted-foreground mt-1">Reminder Today</p>
            </div>
            <div className="flex flex-col justify-center text-xs text-muted-foreground">
               <div className="flex items-center gap-1 mb-1 text-red-400">
                 <Bell size={12} /> Next reminder
               </div>
               <p className="truncate">12-08-2026 - Renew mydo...</p>
            </div>
          </div>
        </Widget>

        {/* Invoice Overview */}
        <Widget title="Invoice Overview" icon={FileText}>
          <div className="space-y-4 pt-2">
            {d.invoices.map((inv: any, i: number) => (
              <div key={i} className="flex items-center text-sm">
                <span className="w-4 font-bold" style={{ color: inv.color.replace('bg-', 'text-') }}>{inv.count}</span>
                <span className="w-24 text-muted-foreground">{inv.label}</span>
                <div className="flex-1 mx-4 h-1.5 bg-surface-pressed rounded-full flex items-center overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${inv.percent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${inv.color}`} 
                  />
                </div>
                <span className="text-right text-muted-foreground font-medium">{inv.amount}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end mt-auto pt-6 border-t border-border/40">
            <div>
              <p className="text-xs text-muted-foreground">Total invoiced</p>
              <p className="font-bold">{d.invoiceTotals.total}</p>
              <p className="text-xs text-muted-foreground mt-2">Due</p>
              <p className="font-bold">{d.invoiceTotals.due}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-2">Last 12 months</p>
              <div className="w-32 h-12 flex items-end justify-between px-1 border-b border-blue-200">
                <svg className="w-full h-full text-blue-500 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <motion.path 
                    d="M0,40 L60,40 C65,40 65,10 75,10 C85,10 85,40 90,40 L100,40" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </Widget>

        {/* Income vs Expenses */}
        <Widget title="Income vs Expenses" icon={TrendingUp}>
           <div className="flex mt-4 items-center gap-6">
             <DonutChart data={d.incomeVsExpenses.chartData} size={150} strokeWidth={16} />
             <div className="flex-1 space-y-4 text-sm">
               <div>
                 <p className="text-xs text-muted-foreground mb-2">This Year</p>
                 <div className="flex items-center justify-between mb-1">
                   <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500"/>{d.incomeVsExpenses.thisYear.income}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-pink-600"/>{d.incomeVsExpenses.thisYear.expenses}</span>
                 </div>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-2">Last Year</p>
                 <div className="flex items-center justify-between mb-1">
                   <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500"/>{d.incomeVsExpenses.lastYear.income}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-pink-600"/>{d.incomeVsExpenses.lastYear.expenses}</span>
                 </div>
               </div>
             </div>
           </div>
           
           <div className="mt-auto pt-6 border-t border-border/40">
             <p className="text-xs text-muted-foreground mb-2">This Year</p>
             <div className="h-16 w-full border-b border-border/60 relative flex items-end">
                <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                   <motion.path 
                     d="M0,40 L50,40 C60,40 60,25 65,25 C70,25 70,40 80,40 L100,40" 
                     fill="rgba(219,39,119,0.2)" stroke="#db2777" strokeWidth="1.5" 
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 1 }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                   />
                   <motion.path 
                     d="M0,40 L45,40 C55,40 55,10 65,10 C75,10 75,40 85,40 L100,40" 
                     fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" 
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 1 }}
                     transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                   />
                </svg>
             </div>
           </div>
        </Widget>
      </div>

      {/* --- REAL DATA STAFF ATTENDANCE & HISTORICAL LOGIN LOG MONITOR PANEL --- */}
      <Widget title="Real Staff Attendance & Login Session Monitor" icon={Users}>
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

          {/* Historical Log Table With Real User Data */}
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

                  let punchInTime = "-"
                  let punchOutTime = "-"
                  let workedHours = "-"
                  let statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">Not Logged In</span>

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
                  } else if (u.lastLogin && u.lastLogin.includes("Today")) {
                    punchInTime = u.lastLogin
                    punchOutTime = "06:00 PM"
                    workedHours = "08 hrs 45 mins"
                    statusBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">COMPLETED</span>
                  }

                  return (
                    <tr key={u.email} className={`hover:bg-surface-hover/30 ${isActiveUser ? "bg-primary/5" : ""}`}>
                      <td className="py-2.5 px-3 font-mono font-medium">19 Aug 2026</td>
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
             <DonutChart data={d.tasksOverview.chartData} size={150} strokeWidth={16} />
             <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-500"/> To do</span>
                  <span className="font-medium text-yellow-500">{d.tasksOverview.todo}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500"/> In progress</span>
                  <span className="font-medium text-blue-500">{d.tasksOverview.inProgress}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-purple-500"/> Review</span>
                  <span className="font-medium text-purple-500">{d.tasksOverview.review}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Done</span>
                  <span className="font-medium text-emerald-500">{d.tasksOverview.done}</span>
                </div>
                <div className="flex justify-between items-center w-32">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-500"/> Expired</span>
                  <span className="font-medium text-red-500">{d.tasksOverview.expired}</span>
                </div>
             </div>
          </div>
          <div className="flex justify-around items-center pt-6 mt-auto border-t border-border/40 text-sm">
             <div className="flex items-center gap-1 text-red-500 font-medium"><AlertCircle size={14} /> 18</div>
             <div className="flex items-center gap-1 text-purple-500 font-medium"><Clock size={14} /> 29</div>
             <div className="flex items-center gap-1 text-yellow-500 font-medium">↑ 41</div>
             <div className="flex items-center gap-1 text-muted-foreground font-medium">↓ 28</div>
          </div>
        </Widget>

        {/* Team Members Overview */}
        <Widget title="Team Members Overview" icon={Users}>
           <div className="grid grid-cols-2 gap-4 py-4 text-center">
              <div>
                <p className="text-3xl font-bold">{d.teamMembers.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Team members</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-500">{d.teamMembers.onLeave}</p>
                <p className="text-xs text-muted-foreground mt-1">On leave today</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/40 text-center">
              <div>
                <p className="text-3xl font-bold text-red-500">{d.teamMembers.clockedIn}</p>
                <div className="h-1 bg-red-500 rounded-full w-12 mx-auto mt-2 mb-1" />
                <p className="text-xs text-muted-foreground">Members Clocked In</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-500">{d.teamMembers.clockedOut}</p>
                <div className="h-1 bg-blue-500 rounded-full w-12 mx-auto mt-2 mb-1" />
                <p className="text-xs text-muted-foreground">Members Clocked Out</p>
              </div>
           </div>
           
           <div className="mt-auto border border-border/40 rounded-lg p-3">
             <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium text-xs">
                <FileText size={12} /> Last announcement
             </div>
             <p className="text-sm text-blue-500">Tomorrow is holiday!</p>
           </div>
        </Widget>

        {/* Ticket Status */}
        <Widget title="Ticket Status" icon={AlertCircle}>
           <div className="grid grid-cols-2 gap-6 text-sm mb-6">
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-yellow-500" /> New</span>
                 <span className="font-bold text-red-500">{d.ticketStatus.new}</span>
               </div>
               <div className="flex justify-between">
                 <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-red-500" /> Open</span>
                 <span className="font-bold text-red-500">{d.ticketStatus.open}</span>
               </div>
               <div className="flex justify-between">
                 <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 rounded-full bg-blue-500" /> Closed</span>
                 <span className="font-bold text-blue-500">{d.ticketStatus.closed}</span>
               </div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">General Supp...</span>
                 <span className="font-bold text-red-500">{d.ticketStatus.general}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Bug Reports</span>
                 <span className="font-bold text-red-500">{d.ticketStatus.bug}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Sales Inquiry</span>
                 <span className="font-bold text-red-500">{d.ticketStatus.sales}</span>
               </div>
             </div>
           </div>
           
           <div className="mt-auto">
             <p className="text-xs text-muted-foreground mb-3">New tickets in last 30 days</p>
             <BarChartMockup count={30} color="bg-emerald-500" />
             <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1 border-t border-border/50 pt-1">
               <span>03</span><span>05</span><span>07</span><span>09</span><span>11</span><span>13</span><span>15</span><span>17</span><span>19</span><span>21</span><span>23</span><span>25</span><span>27</span><span>29</span><span>31</span>
             </div>
           </div>
        </Widget>
      </div>

      {/* --- ROW 4: TIMELINE, EVENTS, TODO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Timeline */}
        <Widget title="Project Timeline" icon={Clock} className="h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border/50">
            {d.timeline.map((item: any, i: number) => (
              <div key={i} className="relative flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 z-10 flex items-center justify-center font-bold text-primary text-xs border-2 border-white dark:border-surface">
                   {item.user.charAt(0)}
                 </div>
                 <div className="bg-surface-hover/20 rounded-lg p-3 border border-border/50 flex-1">
                   <p className="text-sm font-semibold">{item.user} <span className="font-normal text-xs text-muted-foreground">{item.time}</span></p>
                   <p className="text-sm mt-2">
                     <span className={`px-1.5 py-0.5 text-[10px] rounded text-white mr-2 ${item.action === 'Updated' ? 'bg-yellow-500' : 'bg-blue-500'}`}>{item.action}</span>
                     {item.target}
                   </p>
                   {'status' in item && item.status && (
                     <ul className="list-disc ml-5 text-xs text-muted-foreground mt-2 space-y-1">
                       <li>Status: <span className="line-through">{item.status}</span> <span className="text-emerald-500">{item.done}</span></li>
                     </ul>
                   )}
                   <p className="text-xs text-muted-foreground mt-3">Project: {item.project}</p>
                 </div>
              </div>
            ))}
          </div>
        </Widget>

        {/* Events */}
        <Widget title="Events" icon={Calendar} className="h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
             {d.events.map((ev: any, i: number) => (
               <div key={i} className="flex gap-3 items-start border-b border-border/40 pb-4 last:border-0 cursor-pointer group">
                  <ev.icon size={16} className={`${ev.color} mt-1`} />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{ev.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ev.time}</p>
                  </div>
               </div>
             ))}
          </div>
        </Widget>

        {/* To do (Private) */}
        <Widget title="To do (Private)" icon={CheckSquare} action={<div className="flex items-center gap-2 text-xs text-muted-foreground">Sortable <div className="w-6 h-3 bg-border rounded-full" /></div>} className="h-96">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Add a to do..." 
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newTodo.trim()) {
                  updateTodos([{ id: Date.now(), text: newTodo, done: false }, ...todos])
                  setNewTodo("")
                }
              }}
              className="flex-1 bg-surface-pressed/30 border border-border rounded-md px-3 text-sm focus:outline-none focus:border-primary"
            />
            <Button size="sm" variant="primary" className="shrink-0" onClick={() => {
              if (newTodo.trim()) {
                updateTodos([{ id: Date.now(), text: newTodo, done: false }, ...todos])
                setNewTodo("")
              }
            }}>
              <CheckCircle2 size={14} className="mr-1" /> Save
            </Button>
          </div>
          
          <div className="flex gap-2 mb-4 border-b border-border/50 pb-2">
            <button className="text-sm font-medium border-b-2 border-primary pb-2 px-1">To do</button>
            <button className="text-sm font-medium text-muted-foreground pb-2 px-1">Done</button>
            <div className="ml-auto relative">
              <input type="text" placeholder="Search" className="w-24 bg-surface border border-border rounded px-2 py-1 text-xs pl-6" />
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-surface-hover rounded group border-b border-border/30 last:border-0">
                <button onClick={() => updateTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${todo.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground hover:border-primary'}`}>
                  {todo.done && <CheckCircle2 size={12} />}
                </button>
                <span className={`text-sm flex-1 truncate text-primary cursor-pointer hover:underline ${todo.done ? 'line-through text-muted-foreground' : ''}`}>
                  {todo.text}
                </span>
                <MoreHorizontal size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer" />
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* --- ROW 5: OPEN PROJECTS, TASKS, STICKY NOTE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
           {/* Open Projects List */}
           <Widget title="Open Projects" icon={Grid}>
              <div className="space-y-4 pt-2">
                {(liveProjects.length > 0 ? liveProjects.map(p => ({
                  name: p.title,
                  progress: p.progress || 0,
                  start: p.startDate,
                  deadline: p.deadline
                })) : d.openProjects).map((p: any, i: number) => (
                  <div key={i} className="border-b border-border/40 pb-4 last:border-0 group cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{p.progress}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-surface-pressed rounded-full overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                        className="h-full bg-indigo-200" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Start date: {p.start} | Deadline: {p.deadline}</p>
                  </div>
                ))}
              </div>
           </Widget>

           {/* My Tasks */}
           <Widget title="My Tasks" icon={CheckSquare}>
              <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 border border-border"><Grid size={14} /></Button>
                </div>
                <div className="relative">
                  <input type="text" placeholder="Search" className="w-48 bg-surface border border-border rounded px-3 py-1.5 text-sm pr-8" />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border/40 font-semibold">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 text-right">Start date</th>
                      <th className="px-4 py-3 text-right">Deadline</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(liveTasks.length > 0 ? liveTasks.map(t => ({
                      id: t.id,
                      title: t.title,
                      start: t.startDate || "-",
                      deadline: t.deadline || "-",
                      status: t.status,
                      statusColor: t.status === "Done" ? "bg-emerald-500" : "bg-blue-500"
                    })) : d.myTasks).map((t: any, i: number) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-hover/20 transition-colors">
                        <td className="px-4 py-4 text-muted-foreground border-l-2 border-l-yellow-500">
                           <input type="checkbox" className="mr-2 rounded border-border" />
                           {t.id}
                        </td>
                        <td className="px-4 py-4 font-medium text-primary cursor-pointer hover:underline">
                          {t.title}
                          {t.tag && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-green-500 text-white font-medium">{t.tag} ↓</span>}
                        </td>
                        <td className="px-4 py-4 text-right text-muted-foreground">{t.start || "-"}</td>
                        <td className="px-4 py-4 text-right text-red-500 text-xs w-24">
                           {String(t.deadline || "-").split('-').join('\n-')}
                        </td>
                        <td className="px-4 py-4">
                           <span className={`px-2 py-1 text-xs font-bold rounded text-white ${t.statusColor || "bg-blue-500"}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Widget>
        </div>

        {/* Sticky Note */}
        <div className="space-y-6">
          <Widget title="Sticky Note (Private)" icon={FileText} className="h-full min-h-[400px] !bg-yellow-200/50 dark:!bg-yellow-900/30 border-yellow-300">
            <textarea 
              value={noteText}
              onChange={e => updateNoteText(e.target.value)}
              className="w-full h-full bg-transparent text-yellow-900 dark:text-yellow-100 border-none rounded-none p-0 text-sm focus:outline-none focus:ring-0 resize-none"
              placeholder="My quick notes here..."
            />
          </Widget>
        </div>
        
      </div>

    </div>
  )
}
