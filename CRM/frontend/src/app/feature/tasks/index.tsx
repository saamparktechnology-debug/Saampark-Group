"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"

type Task = {
  id: string
  title: string
  project: string
  assignee: string
  priority: "Low" | "Normal" | "High" | "Urgent"
  status: "To do" | "In Progress" | "Review" | "Done"
  dueDate: string
}

const MOCK_TASKS: Task[] = [
  { id: "#1243", title: "Optimize app navigation and flow", project: "Mobile App V2", assignee: "John Doe", priority: "High", status: "To do", dueDate: "20-07-2026" },
  { id: "#1244", title: "Conduct SEO audit and analysis", project: "Marketing Campaign", assignee: "Sara Ann", priority: "Normal", status: "Review", dueDate: "20-07-2026" },
  { id: "#1245", title: "Implement product zoom and gallery", project: "Website Redesign", assignee: "Mark Thomas", priority: "Urgent", status: "In Progress", dueDate: "25-07-2026" },
  { id: "#1246", title: "Write API documentation", project: "Website Redesign", assignee: "Richard Gray", priority: "Low", status: "Done", dueDate: "18-07-2026" },
  { id: "#1247", title: "Design checkout flow wireframes", project: "Mobile App V2", assignee: "Sara Ann", priority: "High", status: "To do", dueDate: "30-07-2026" },
  { id: "#1248", title: "Setup CI/CD pipeline", project: "CRM Integration", assignee: "Mark Thomas", priority: "Urgent", status: "In Progress", dueDate: "05-08-2026" },
]

const statusColors: Record<string, string> = {
  "To do": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "In Progress": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Review": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "Done": "bg-success/10 text-success border-success/20",
}

const priorityColors: Record<string, string> = {
  Low: "bg-surface-hover text-muted-foreground border-border",
  Normal: "bg-info/10 text-info border-info/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-danger/10 text-danger border-danger/20",
}

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-primary font-medium text-xs shrink-0">{row.original.id}</span>
        <span className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("title")}</span>
      </div>
    ),
  },
  { accessorKey: "project", header: "Project", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("project")}</span> },
  { accessorKey: "assignee", header: "Assignee" },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const p = row.getValue("priority") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[p]}`}>{p}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[s]}`}>{s}</span>
    },
  },
  { accessorKey: "dueDate", header: "Due Date", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("dueDate")}</span> },
  {
    id: "actions",
    header: "",
    cell: () => <RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
  },
]

export default function TasksMain() {
  const [activeTab, setActiveTab] = React.useState("my")
  const { openModal } = useUIStore()

  const filtered = activeTab === "my"
    ? MOCK_TASKS.filter(t => t.assignee === "John Doe")
    : activeTab === "done"
    ? MOCK_TASKS.filter(t => t.status === "Done")
    : MOCK_TASKS

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Track, assign, and manage all tasks across projects.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddTaskModalOpen")}>Add Task</Button>
      </div>
      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            tabs={[{ id: "my", label: "My Tasks" }, { id: "all", label: "All Tasks" }, { id: "done", label: "Done" }]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-8 pl-8 pr-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Search tasks..." />
          </div>
        </div>
        <DataTable columns={columns} data={filtered} searchKey="title" />
      </div>
    </motion.div>
  )
}


