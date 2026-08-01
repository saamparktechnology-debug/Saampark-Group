"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Filter, ExternalLink } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"

type Project = {
  id: string
  name: string
  client: string
  status: "Planning" | "In Progress" | "Review" | "Completed"
  deadline: string
  progress: number
  budget: string
}

const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-101", name: "Website Redesign", client: "Acme Corp", status: "In Progress", deadline: "2026-09-15", progress: 65, budget: "₹4,20,000" },
  { id: "PRJ-102", name: "Mobile App V2", client: "TechNova", status: "Planning", deadline: "2026-11-01", progress: 10, budget: "₹8,50,000" },
  { id: "PRJ-103", name: "Marketing Campaign", client: "Global Industries", status: "Review", deadline: "2026-08-10", progress: 95, budget: "₹1,80,000" },
  { id: "PRJ-104", name: "Server Migration", client: "Wayne Tech", status: "Completed", deadline: "2026-07-28", progress: 100, budget: "₹3,40,000" },
  { id: "PRJ-105", name: "CRM Integration", client: "Stark Enterprises", status: "Planning", deadline: "2026-10-30", progress: 5, budget: "₹12,00,000" },
  { id: "PRJ-106", name: "ERP System", client: "Patel & Associates", status: "In Progress", deadline: "2026-12-15", progress: 40, budget: "₹25,00,000" },
]

const statusColors: Record<string, string> = {
  "Planning": "bg-info/10 text-info border-info/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  "Review": "bg-warning/10 text-warning border-warning/20",
  "Completed": "bg-success/10 text-success border-success/20",
}

export const columns: ColumnDef<Project>[] = [
  { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono">{row.getValue("id")}</span> },
  { accessorKey: "name", header: "Project Name", cell: ({ row }) => <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("name")}</div> },
  { accessorKey: "client", header: "Client", cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("client")}</span> },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status") as string
      return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[s] || ""}`}>{s}</span>
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const p = row.getValue("progress") as number
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="h-1.5 flex-1 bg-surface-pressed rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${p}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{p}%</span>
        </div>
      )
    },
  },
  { accessorKey: "budget", header: "Budget", cell: ({ row }) => <span className="font-semibold text-sm">{row.getValue("budget")}</span> },
  { accessorKey: "deadline", header: "Deadline", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("deadline")}</span> },
  {
    id: "actions",
    header: "",
    cell: () => <RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
  },
]

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = React.useState("all")
  const { openModal } = useUIStore()

  const filtered = activeTab === "all"
    ? MOCK_PROJECTS
    : activeTab === "in-progress"
    ? MOCK_PROJECTS.filter(p => p.status === "In Progress")
    : MOCK_PROJECTS.filter(p => p.status === "Completed")

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Track progress, milestones, and deliverables across all active projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal("isAddProjectModalOpen")}>New Project</Button>
        </div>
      </div>
      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs
          tabs={[{ id: "all", label: "All" }, { id: "in-progress", label: "In Progress" }, { id: "completed", label: "Completed" }]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={columns} data={filtered} searchKey="name" />
      </div>
    </motion.div>
  )
}
