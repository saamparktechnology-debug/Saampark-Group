import { Calendar, Briefcase, Users } from "lucide-react"

export const DATA: any = {
  tech: {
    kpi: { clockIn: "You are currently clocked out", openTasks: "0", events: "0", due: "₹0" },
    projectsOverview: { open: 0, completed: 0, hold: 0, progression: 0 },
    invoices: [
      { label: "Overdue", count: 0, amount: "₹0", color: "bg-red-500", percent: 0 },
      { label: "Not paid", count: 0, amount: "₹0", color: "bg-yellow-500", percent: 0 },
      { label: "Partially paid", count: 0, amount: "₹0", color: "bg-blue-500", percent: 0 },
      { label: "Fully paid", count: 0, amount: "₹0", color: "bg-indigo-500", percent: 0 },
      { label: "Draft", count: 0, amount: "₹0", color: "bg-gray-300", percent: 0 },
    ],
    invoiceTotals: { total: "₹0", due: "₹0" },
    incomeVsExpenses: {
      thisYear: { income: "₹0", expenses: "₹0" },
      lastYear: { income: "₹0", expenses: "₹0" },
      chartData: [{ percent: 0, colorClass: "text-emerald-500" }, { percent: 0, colorClass: "text-pink-600" }]
    },
    tasksOverview: {
      todo: 0, inProgress: 0, review: 0, done: 0, expired: 0,
      chartData: [
        { percent: 0, colorClass: "text-yellow-500" },
        { percent: 0, colorClass: "text-blue-500" },
        { percent: 0, colorClass: "text-purple-500" },
        { percent: 0, colorClass: "text-emerald-500" },
        { percent: 0, colorClass: "text-red-500" },
      ]
    },
    teamMembers: { total: 0, onLeave: 0, clockedIn: 0, clockedOut: 0 },
    ticketStatus: { new: 0, open: 0, closed: 0, general: 0, bug: 0, sales: 0 },
    timeline: [],
    events: [],
    openProjects: [],
    myTasks: []
  },
  digital: {
    kpi: { clockIn: "You are currently clocked out", openTasks: "0", events: "0", due: "₹0" },
    projectsOverview: { open: 0, completed: 0, hold: 0, progression: 0 },
    invoices: [
      { label: "Overdue", count: 0, amount: "₹0", color: "bg-red-500", percent: 0 },
      { label: "Not paid", count: 0, amount: "₹0", color: "bg-yellow-500", percent: 0 },
      { label: "Partially paid", count: 0, amount: "₹0", color: "bg-blue-500", percent: 0 },
      { label: "Fully paid", count: 0, amount: "₹0", color: "bg-indigo-500", percent: 0 },
      { label: "Draft", count: 0, amount: "₹0", color: "bg-gray-300", percent: 0 },
    ],
    invoiceTotals: { total: "₹0", due: "₹0" },
    incomeVsExpenses: {
      thisYear: { income: "₹0", expenses: "₹0" },
      lastYear: { income: "₹0", expenses: "₹0" },
      chartData: [{ percent: 0, colorClass: "text-emerald-500" }, { percent: 0, colorClass: "text-pink-600" }]
    },
    tasksOverview: {
      todo: 0, inProgress: 0, review: 0, done: 0, expired: 0,
      chartData: [
        { percent: 0, colorClass: "text-yellow-500" },
        { percent: 0, colorClass: "text-blue-500" },
        { percent: 0, colorClass: "text-purple-500" },
        { percent: 0, colorClass: "text-emerald-500" },
        { percent: 0, colorClass: "text-red-500" },
      ]
    },
    teamMembers: { total: 0, onLeave: 0, clockedIn: 0, clockedOut: 0 },
    ticketStatus: { new: 0, open: 0, closed: 0, general: 0, bug: 0, sales: 0 },
    timeline: [],
    events: [],
    openProjects: [],
    myTasks: []
  }
}
