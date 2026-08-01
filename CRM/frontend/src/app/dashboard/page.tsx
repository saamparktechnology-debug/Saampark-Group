"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckSquare, Clock, Calendar, DollarSign, Plus, Edit2, 
  Trash2, GripVertical, Download, Search, CheckCircle2,
  MoreHorizontal, FileText, PieChart, Users, AlertCircle, TrendingUp, Bell, MapPin, Grid, Briefcase, Monitor
} from "lucide-react"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useTimerStore } from "@/store/useTimerStore"

import { Button } from "@/components/ui/Button"

// --- WIDGET CONTAINER ---
function Widget({ title, children, className = "", action, icon: Icon }: { title: string, children: React.ReactNode, className?: string, action?: React.ReactNode, icon?: any }) {
  return (
    <div className={`bg-surface border border-border shadow-soft rounded-lg p-5 flex flex-col bg-white dark:bg-surface ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-muted-foreground" />}
          <h3 className="font-semibold text-[15px] text-foreground/90">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  )
}

function KPICard({ icon: Icon, colorClass, value, label, subtext, subtextNode }: any) {
  return (
    <div className="bg-white dark:bg-surface border border-border shadow-soft rounded-lg p-5 flex items-center justify-between">
      <div className={`w-14 h-14 rounded-md flex items-center justify-center text-white ${colorClass} shadow-sm shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="text-right flex-1 ml-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtextNode ? subtextNode : <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  )
}

// --- DONUT CHART SVG COMPONENT ---
function DonutChart({ data, size = 120, strokeWidth = 14 }: any) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  let currentOffset = 0

  return (
    <motion.div 
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-pressed"
        />
        {data.map((item: any, i: number) => {
          const dasharray = `${(item.percent / 100) * circumference} ${circumference}`
          const offset = currentOffset
          currentOffset -= (item.percent / 100) * circumference
          if (item.percent === 0) return null
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
              className={item.colorClass}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
    </motion.div>
  )
}

// --- BAR CHART MOCKUP ---
const STATIC_HEIGHTS = [
  30, 45, 25, 60, 80, 40, 95, 30, 70, 85, 
  40, 60, 75, 50, 90, 65, 45, 80, 55, 70, 
  85, 40, 60, 95, 30, 85, 60, 75, 50, 90
]

function BarChartMockup({ count = 30, color = "bg-emerald-500" }) {
  return (
    <div className="flex items-end gap-1 h-20 w-full px-2">
      {STATIC_HEIGHTS.slice(0, count).map((h, i) => (
        <motion.div 
          key={i} 
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
          className={`flex-1 ${color} rounded-t-sm`} 
          style={{ opacity: 0.8 }} 
        />
      ))}
    </div>
  )
}

// --- MOCK DATA FOR BOTH COMPANIES ---
const DATA = {
  tech: {
    kpi: { clockIn: "You are currently clocked out", openTasks: "46", events: "1", due: "$8,616.00" },
    projectsOverview: { open: 24, completed: 6, hold: 0, progression: 31 },
    invoices: [
      { label: "Overdue", count: 5, amount: "$2,648.50", color: "bg-red-500", percent: 15 },
      { label: "Not paid", count: 5, amount: "$3,256.00", color: "bg-yellow-500", percent: 20 },
      { label: "Partially paid", count: 9, amount: "$10,720.00", color: "bg-blue-500", percent: 35 },
      { label: "Fully paid", count: 11, amount: "$12,470.00", color: "bg-indigo-500", percent: 28 },
      { label: "Draft", count: 1, amount: "$120.00", color: "bg-gray-300", percent: 2 },
    ],
    invoiceTotals: { total: "$26,446.00", due: "$8,616.00" },
    incomeVsExpenses: {
      thisYear: { income: "$17,830.00", expenses: "$9,120.00" },
      lastYear: { income: "$0.00", expenses: "$0.00" },
      chartData: [{ percent: 66, colorClass: "text-emerald-500" }, { percent: 34, colorClass: "text-pink-600" }]
    },
    tasksOverview: {
      todo: 78, inProgress: 61, review: 68, done: 169, expired: 134,
      chartData: [
        { percent: 15, colorClass: "text-yellow-500" },
        { percent: 12, colorClass: "text-blue-500" },
        { percent: 13, colorClass: "text-purple-500" },
        { percent: 34, colorClass: "text-emerald-500" },
        { percent: 26, colorClass: "text-red-500" },
      ]
    },
    teamMembers: { total: 5, onLeave: 0, clockedIn: 2, clockedOut: 3 },
    ticketStatus: { new: 21, open: 39, closed: 69, general: 16, bug: 25, sales: 19 },
    timeline: [
      { user: "Sara Ann", time: "Today at 01:12:46 pm", action: "Updated", target: "Task: #3425 - Implement product zoom and gallery", status: "Review", done: "Done", project: "Product Photography and Cataloging" },
      { user: "Sara Ann", time: "Today at 01:12:36 pm", action: "Added", target: "Task Comment: Functionality testing done.", project: "Mobile Game Development" },
    ],
    events: [
      { title: "Company Anniversary Celebration", time: "Tomorrow, 01:10:00 am - 02:30:00 am", icon: Calendar, color: "text-emerald-500" },
      { title: "Industry Panel Discussion", time: "Thu, August 06, 07:59:00 pm - 09:39:00 pm", icon: Briefcase, color: "text-blue-500" },
      { title: "Leadership Summit", time: "Sat, August 15, 05:37:00 am - 06:47:00 am", icon: Users, color: "text-emerald-500" },
    ],
    openProjects: [
      { name: "Online Course Creation and Launch", start: "06-08-2026", deadline: "18-08-2026", progress: 0 },
      { name: "Social Media Influencer Collaboration", start: "05-08-2026", deadline: "02-09-2026", progress: 0 },
      { name: "Virtual Reality Experience Design", start: "27-07-2026", deadline: "03-08-2026", progress: 20 },
      { name: "Market Research and Analysis", start: "25-07-2026", deadline: "29-09-2026", progress: 27 },
      { name: "Content Writing and Blogging", start: "24-07-2026", deadline: "14-09-2026", progress: 29 },
    ],
    myTasks: [
      { id: "3368", title: "Optimize app navigation and flow", tag: "Design", deadline: "29-07-2026", status: "To do", statusColor: "bg-yellow-500" },
      { id: "3352", title: "Conduct SEO audit and analysis", tag: "Design", deadline: "29-07-2026", status: "Review", statusColor: "bg-purple-500" },
      { id: "3314", title: "Design brand logo and tagline", tag: "Design", deadline: "15-08-2026", status: "Review", statusColor: "bg-purple-500" },
    ]
  },
  digital: {
    kpi: { clockIn: "You are currently clocked in", openTasks: "12", events: "4", due: "₹1,05,000" },
    projectsOverview: { open: 12, completed: 42, hold: 1, progression: 75 },
    invoices: [
      { label: "Overdue", count: 1, amount: "₹45,000", color: "bg-red-500", percent: 5 },
      { label: "Not paid", count: 2, amount: "₹60,000", color: "bg-yellow-500", percent: 10 },
      { label: "Partially paid", count: 1, amount: "₹20,000", color: "bg-blue-500", percent: 5 },
      { label: "Fully paid", count: 15, amount: "₹7,25,000", color: "bg-indigo-500", percent: 80 },
      { label: "Draft", count: 0, amount: "₹0", color: "bg-gray-300", percent: 0 },
    ],
    invoiceTotals: { total: "₹8,50,000", due: "₹1,05,000" },
    incomeVsExpenses: {
      thisYear: { income: "₹7,45,000", expenses: "₹1,80,000" },
      lastYear: { income: "₹5,20,000", expenses: "₹2,10,000" },
      chartData: [{ percent: 80, colorClass: "text-emerald-500" }, { percent: 20, colorClass: "text-pink-600" }]
    },
    tasksOverview: {
      todo: 5, inProgress: 3, review: 1, done: 42, expired: 0,
      chartData: [
        { percent: 10, colorClass: "text-yellow-500" },
        { percent: 6, colorClass: "text-blue-500" },
        { percent: 2, colorClass: "text-purple-500" },
        { percent: 82, colorClass: "text-emerald-500" },
        { percent: 0, colorClass: "text-red-500" },
      ]
    },
    teamMembers: { total: 8, onLeave: 1, clockedIn: 6, clockedOut: 1 },
    ticketStatus: { new: 5, open: 2, closed: 18, general: 10, bug: 2, sales: 13 },
    timeline: [
      { user: "John Doe", time: "Today at 09:12:46 am", action: "Added", target: "New Ad Campaign creatives uploaded", project: "Stark Ent. Social Media" },
    ],
    events: [
      { title: "Marketing Strategy Review", time: "Today, 11:30 AM - 12:30 PM", icon: Calendar, color: "text-pink-500" },
    ],
    openProjects: [
      { name: "Social Media Campaign", start: "01-08-2026", deadline: "20-08-2026", progress: 80 },
      { name: "SEO Audit Q3", start: "15-08-2026", deadline: "15-09-2026", progress: 25 },
    ],
    myTasks: [
      { id: "4001", title: "Review Ad Copy", tag: "Copywriting", deadline: "02-08-2026", status: "In progress", statusColor: "bg-blue-500" },
    ]
  }
}

export default function Dashboard() {
  const { activeCompanyId, user } = useAuthStore()
  const { isClockedIn, clockIn, clockOut, secondsElapsed, tick } = useTimerStore()
  
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

  // Interactive state
  const [todos, setTodos] = React.useState([
    { id: 1, text: "Set roles and permissions for team members", done: false },
    { id: 2, text: "Setup notifications for tasks", done: false },
    { id: 3, text: "Discuss with team members", done: false },
  ])
  const [newTodo, setNewTodo] = React.useState("")
  const [noteText, setNoteText] = React.useState("My quick notes here...")

  if (!user) return null
  const d = DATA[activeCompanyId === 'digital' ? 'digital' : 'tech']

  return (
    <div className="space-y-6 pb-12 bg-background/50 min-h-screen -mx-4 -mt-4 p-4 sm:px-8 sm:py-6 rounded-tl-xl">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex items-center gap-2 mb-6">
        <Monitor size={18} className="text-muted-foreground" />
        <h1 className="text-xl font-medium text-foreground/90">Dashboard</h1>
      </div>

      {/* --- KPI CARDS ROW --- */}
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
        <KPICard icon={Grid} colorClass="bg-blue-400" value={d.kpi.openTasks} label="My open tasks" />
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
            {d.invoices.map((inv, i) => (
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
            {d.timeline.map((item, i) => (
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
                   {item.status && (
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
             {d.events.map((ev, i) => (
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
                  setTodos([{ id: Date.now(), text: newTodo, done: false }, ...todos])
                  setNewTodo("")
                }
              }}
              className="flex-1 bg-surface-pressed/30 border border-border rounded-md px-3 text-sm focus:outline-none focus:border-primary"
            />
            <Button size="sm" variant="primary" className="shrink-0" onClick={() => {
              if (newTodo.trim()) {
                setTodos([{ id: Date.now(), text: newTodo, done: false }, ...todos])
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
                <button onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${todo.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground hover:border-primary'}`}>
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
                {d.openProjects.map((p, i) => (
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
                    {d.myTasks.map((t, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-hover/20 transition-colors">
                        <td className="px-4 py-4 text-muted-foreground border-l-2 border-l-yellow-500">
                           <input type="checkbox" className="mr-2 rounded border-border" />
                           {t.id}
                        </td>
                        <td className="px-4 py-4 font-medium text-primary cursor-pointer hover:underline">
                          {t.title}
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-green-500 text-white font-medium">{t.tag} ↓</span>
                        </td>
                        <td className="px-4 py-4 text-right text-muted-foreground">-</td>
                        <td className="px-4 py-4 text-right text-red-500 text-xs w-24">
                           {t.deadline.split('-').join('\n-')}
                        </td>
                        <td className="px-4 py-4">
                           <span className={`px-2 py-1 text-xs font-bold rounded text-white ${t.statusColor}`}>{t.status}</span>
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
              onChange={e => setNoteText(e.target.value)}
              className="w-full h-full bg-transparent text-yellow-900 dark:text-yellow-100 border-none rounded-none p-0 text-sm focus:outline-none focus:ring-0 resize-none"
              placeholder="My quick notes here..."
            />
          </Widget>
        </div>
        
      </div>

    </div>
  )
}
