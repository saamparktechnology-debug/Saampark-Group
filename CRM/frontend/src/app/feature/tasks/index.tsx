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
import { TaskService } from "@/services/apiServices"

type Task = {
  id: string
  title: string
  project: string
  assignee: string
  priority: "Low" | "Normal" | "High" | "Urgent"
  status: "To do" | "In Progress" | "Review" | "Done"
  dueDate: string
}

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
      const p = (row.getValue("priority") || "Normal") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[p] || priorityColors.Normal}`}>{p}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = (row.getValue("status") || "To do") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[s] || statusColors["To do"]}`}>{s}</span>
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
  const [activeTab, setActiveTab] = React.useState("all")
  const { openModal } = useUIStore()
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const loadTasks = React.useCallback(() => {
    setIsLoading(true)
    TaskService.getTasks()
      .then((res) => {
        if (Array.isArray(res)) {
          const live: Task[] = res.map((t: any) => ({
            id: `#${t.id || t._id}`,
            title: t.title || 'Task',
            project: t.customer_id ? `Customer #${t.customer_id}` : 'General',
            assignee: t.assigned_to ? `User #${t.assigned_to}` : 'Assignee',
            priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) as any : 'Normal',
            status: t.status === 'completed' ? 'Done' : 'To do',
            dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '-',
          }))
          setTasks(live)
        }
      })
      .catch((err) => console.error("Error loading tasks API:", err))
      .finally(() => setIsLoading(false))
  }, [])

  React.useEffect(() => {
    loadTasks()
    const handleCreated = (e: any) => {
      if (e.detail) {
        const item = e.detail
        const newTaskItem: Task = {
          id: `#${Date.now().toString().slice(-4)}`,
          title: item.title || 'New Task',
          project: 'General',
          assignee: 'John Doe',
          priority: item.priority ? (item.priority.charAt(0).toUpperCase() + item.priority.slice(1)) as any : 'High',
          status: 'To do',
          dueDate: new Date().toLocaleDateString('en-GB'),
        }
        setTasks((prev) => [newTaskItem, ...prev])
      }
    }
    window.addEventListener("task_created", handleCreated)
    return () => window.removeEventListener("task_created", handleCreated)
  }, [loadTasks])

  const filtered = activeTab === "done"
    ? tasks.filter(t => t.status === "Done")
    : tasks

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Live API tasks loaded directly from server backend.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddTaskModalOpen")}>Add Task</Button>
      </div>
      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            tabs={[{ id: "all", label: "All Tasks" }, { id: "done", label: "Done" }]}
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
