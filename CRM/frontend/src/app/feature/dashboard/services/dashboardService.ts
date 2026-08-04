import { Calendar, Briefcase, Users } from "lucide-react"

export const DATA: any = {
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
