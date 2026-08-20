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
import { getStoredUserAccounts, getUsers } from "../users/services/userService"
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

  const refreshLiveDashboard = React.useCallback(async () => {
    try {
      const [uList, tList, pList] = await Promise.all([
        getUsers(),
        taskService.getTasks(),
        getProjects(),
      ])
      const cleanUsers = filterGlobalDeletedItems(uList)
      const cleanTasks = filterGlobalDeletedItems(tList)
      const cleanProjects = filterGlobalDeletedItems(pList)

      setRealUsers(cleanUsers)
      if (cleanUsers.length > 0 && !selectedUserEmail) {
        setSelectedUserEmail(cleanUsers[0].email)
      }

      const active = cleanTasks.filter((t) => t.status !== "Done")
      setActiveTasksCount(active.length)
      setLiveTasks(cleanTasks)
      setLiveProjects(cleanProjects)
    } catch (e) {
      console.warn("Dashboard refresh error:", e)
    }
  }, [selectedUserEmail])

  React.useEffect(() => {
    refreshLiveDashboard()
    const interval = setInterval(refreshLiveDashboard, 2500)
    window.addEventListener("storage", refreshLiveDashboard)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", refreshLiveDashboard)
    }
  }, [refreshLiveDashboard])

  React.useEffect(() => {
    if (typeof window !== "undefined") {

      const accounts = getStoredUserAccounts()
      setRealUsers(accounts)
      if (accounts.length > 0 && !selectedUserEmail) {
        setSelectedUserEmail(accounts[0].email)
      }

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
    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <Briefcase size={14} /> Client Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track your active projects, financial payments, support tickets, and team progress.
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => alert("New Ticket Request")}>
            Raise Support Ticket
          </Button>
        </div>

        {/* Client KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard icon={Grid} colorClass="bg-blue-500" value="2 Active" label="Subscribed Projects" />
          <KPICard icon={DollarSign} colorClass="bg-emerald-500" value="₹4,50,000" label="Total Invoiced" />
          <KPICard icon={CheckCircle2} colorClass="bg-indigo-500" value="₹3,20,000" label="Amount Paid" />
          <KPICard icon={AlertCircle} colorClass="bg-amber-500" value="₹1,30,000" label="Pending Balance" />
        </div>

        {/* Client Projects Progress & Payments Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects Widget */}
          <Widget title="My Projects & Progress" icon={Grid} className="lg:col-span-2">
            <div className="space-y-6 pt-2">
              <div className="p-4 bg-surface border border-border/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Virtual Reality Experience Design</h3>
                    <p className="text-xs text-muted-foreground">Manager: <strong className="text-foreground">John Doe</strong> | Target Release: 20-08-2026</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    In Progress (72%)
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[72%]" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Assigned Team: John Doe, Michael Lee</span>
                  <button className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                    View Project Details <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-surface border border-border/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Business Card and Stationery Design</h3>
                    <p className="text-xs text-muted-foreground">Manager: <strong className="text-foreground">John Doe</strong> | Target Release: 30-06-2026</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Milestone Completed (100%)
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[100%]" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Assigned Team: Mark Smith</span>
                  <button className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                    View Project Details <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          </Widget>

          {/* Payment Receipts & Invoices Widget */}
          <Widget title="Billing & Payment Receipts" icon={FileText}>
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">INV-2026-004</p>
                  <p className="text-muted-foreground">15 Aug 2026 • ₹2,50,000</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">PAID</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">INV-2026-009</p>
                  <p className="text-muted-foreground">01 Aug 2026 • ₹1,30,000</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">PENDING</span>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full">
                Download Statement of Account (PDF)
              </Button>
            </div>
          </Widget>
        </div>
      </div>
    )
  }

  // =========================================================================
  // 2. STAFF / TEAM MEMBER DASHBOARD VIEW (Rendered for Teams & User)
  // =========================================================================
  if (normRole === 'Teams') {
    return (
      <div className="space-y-6 pb-12 bg-background/50 min-h-screen p-4 sm:px-8 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <UserCheck size={14} /> Staff Daily Workbench
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {user.name}!
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your shift clock, assigned tasks, telecaller call reminders, and work log.
            </p>
          </div>
        </div>

        {/* Staff Shift Punch Box & KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Shift Time Clock */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Shift Attendance</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            </div>
            
            <div className="my-2">
              <button
                type="button"
                onClick={() => (isClockedIn ? clockOut() : clockIn())}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isClockedIn
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
              >
                <Monitor size={15} />
                <span>{isClockedIn ? "Clock Out Now" : "Clock In Shift"}</span>
              </button>
            </div>

            <div className="text-xs font-mono text-center pt-1 border-t border-border/50">
              {isClockedIn ? (
                <span className="text-emerald-600 font-bold">Elapsed: {formatTime(secondsElapsed)}</span>
              ) : (
                <span className="text-muted-foreground">Not clocked in</span>
              )}
            </div>
          </div>

          <KPICard icon={Grid} colorClass="bg-blue-500" value="6 Tasks" label="My Assigned Tasks" />
          <KPICard icon={AlertCircle} colorClass="bg-rose-500" value="2 Urgent" label="High Priority" />
          <KPICard icon={PhoneCall} colorClass="bg-amber-500" value="3 Calls" label="Telecaller Follow-ups Due Today" />
        </div>

        {/* Staff Tasks & Telecaller Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Assigned Tasks List */}
          <Widget title="My Assigned Tasks" icon={CheckSquare} className="lg:col-span-2">
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">#3623. Use VR for training and simulations</p>
                  <p className="text-muted-foreground">Virtual Reality Experience Design • Deadline: 20-08-2026</p>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  In progress
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">#3615. Develop VR navigation and interactions</p>
                  <p className="text-muted-foreground">Virtual Reality Experience Design • Deadline: 20-08-2026</p>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                  Review
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">#3571. Implement product barcodes and labels</p>
                  <p className="text-muted-foreground">Product Packaging Design • Deadline: 07-07-2026</p>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  To do
                </span>
              </div>
            </div>
          </Widget>

          {/* Today's Call Follow-ups Desk */}
          <Widget title="Today's Telecaller Call Desk" icon={PhoneCall}>
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Sarah Cole</span>
                  <span className="text-amber-600 font-semibold font-mono">11:30 AM</span>
                </div>
                <p className="text-muted-foreground">+91 98123 45678 • Google My Business</p>
                <p className="text-[11px] text-amber-600 font-medium pt-1">Follow up regarding GMB verification code</p>
              </div>

              <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Jaylin Sawayn</span>
                  <span className="text-amber-600 font-semibold font-mono">02:00 PM</span>
                </div>
                <p className="text-muted-foreground">+91 91234 56789 • Google Ads</p>
                <p className="text-[11px] text-amber-600 font-medium pt-1">Discuss monthly ad budget increase</p>
              </div>
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
