"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, ExternalLink, Edit2, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useUIStore } from "@/store/useUIStore"

type Ticket = {
  id: string
  subject: string
  from: string
  category: string
  priority: "Low" | "Normal" | "High" | "Critical"
  status: "New" | "Open" | "Closed"
  createdAt: string
}

const MOCK_TICKETS: Ticket[] = [
  { id: "#T-001", subject: "Cannot login to the dashboard", from: "Acme Corp", category: "Bug Report", priority: "High", status: "Open", createdAt: "2026-07-30" },
  { id: "#T-002", subject: "Feature request: Dark mode", from: "TechNova", category: "General Support", priority: "Low", status: "New", createdAt: "2026-07-29" },
  { id: "#T-003", subject: "Invoice not being generated", from: "Wayne Tech", category: "Billing", priority: "Critical", status: "Open", createdAt: "2026-07-28" },
  { id: "#T-004", subject: "Sales inquiry for enterprise plan", from: "Stark Enterprises", category: "Sales Inquiry", priority: "Normal", status: "Closed", createdAt: "2026-07-27" },
  { id: "#T-005", subject: "API integration broken after update", from: "Acme Corp", category: "Bug Report", priority: "High", status: "New", createdAt: "2026-07-26" },
]

const statusColors: Record<string, string> = {
  New: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Closed: "bg-success/10 text-success border-success/20",
}

const priorityColors: Record<string, string> = {
  Low: "bg-surface-hover text-muted-foreground border-border",
  Normal: "bg-info/10 text-info border-info/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Critical: "bg-danger/10 text-danger border-danger/20",
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{row.original.id}</span>
        <span className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("subject")}</span>
      </div>
    ),
  },
  { accessorKey: "from", header: "From", cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("from")}</span> },
  { accessorKey: "category", header: "Category", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("category")}</span> },
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
  { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("createdAt")}</span> },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"><ExternalLink size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Edit2 size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger"><Trash2 size={14} /></Button>
      </div>
    ),
  },
]

export default function TicketsMain() {
  const [activeTab, setActiveTab] = React.useState("all")
  const { openModal } = useUIStore()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage all client support requests and issues.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddTicketModalOpen")}>New Ticket</Button>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            tabs={[
              { id: "all", label: "All Tickets" },
              { id: "new", label: "New" },
              { id: "open", label: "Open" },
              { id: "closed", label: "Closed" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />New: 21</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Open: 89</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />Closed: 89</span>
          </div>
        </div>
        <DataTable columns={columns} data={MOCK_TICKETS} searchKey="subject" />
      </div>
    </motion.div>
  )
}


