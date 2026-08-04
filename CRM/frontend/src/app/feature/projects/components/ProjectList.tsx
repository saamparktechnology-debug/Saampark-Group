"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { Tabs } from "@/components/ui/Tabs"
import { RowActions } from "@/components/ui/RowActions"
import { Project } from "../types"
import { getProjects } from "../services/projectService"

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

export function ProjectList() {
  const [activeTab, setActiveTab] = React.useState("all")
  const [projects, setProjects] = React.useState<Project[]>([])

  React.useEffect(() => {
    getProjects().then(setProjects)
  }, [])

  const filtered = activeTab === "all"
    ? projects
    : activeTab === "in-progress"
    ? projects.filter(p => p.status === "In Progress")
    : projects.filter(p => p.status === "Completed")

  return (
    <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
      <Tabs
        tabs={[{ id: "all", label: "All" }, { id: "in-progress", label: "In Progress" }, { id: "completed", label: "Completed" }]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <DataTable columns={columns} data={filtered} searchKey="name" />
    </div>
  )
}
