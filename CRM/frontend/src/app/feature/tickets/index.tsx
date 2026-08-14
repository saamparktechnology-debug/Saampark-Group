"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, ExternalLink, Edit2, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useUIStore } from "@/store/useUIStore"
import { TicketService } from "@/services/apiServices"

type Ticket = {
  id: string
  subject: string
  from: string
  category: string
  priority: "Low" | "Normal" | "High" | "Critical"
  status: "New" | "Open" | "Closed"
  createdAt: string
}

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
      const p = (row.getValue("priority") || "Normal") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[p] || priorityColors.Normal}`}>{p}</span>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = (row.getValue("status") || "New") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[s] || statusColors.New}`}>{s}</span>
    },
  },
  { accessorKey: "createdAt", header: "Created At", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("createdAt")}</span> },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex items-center gap-1">
        <button className="p-1 hover:bg-surface-hover rounded text-muted-foreground hover:text-foreground"><ExternalLink size={14} /></button>
        <button className="p-1 hover:bg-surface-hover rounded text-muted-foreground hover:text-foreground"><Edit2 size={14} /></button>
        <button className="p-1 hover:bg-surface-hover rounded text-muted-foreground hover:text-danger"><Trash2 size={14} /></button>
      </div>
    ),
  },
]

export default function TicketsMain() {
  const [activeTab, setActiveTab] = React.useState("all")
  const { openModal } = useUIStore()
  const [tickets, setTickets] = React.useState<Ticket[]>([])

  const loadTickets = React.useCallback(() => {
    TicketService.getTickets()
      .then((res) => {
        if (Array.isArray(res)) {
          const live: Ticket[] = res.map((t: any) => ({
            id: `#T-${t.id || t._id}`,
            subject: t.subject || 'Support Ticket',
            from: t.customer_id ? `Customer #${t.customer_id}` : 'Customer',
            category: t.category || 'General Support',
            priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) as any : 'Normal',
            status: t.status === 'closed' ? 'Closed' : t.status === 'open' ? 'Open' : 'New',
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : 'Today',
          }))
          setTickets(live)
        }
      })
      .catch((err) => console.error("Error loading live tickets API:", err))
  }, [])

  React.useEffect(() => {
    loadTickets()
    const handleCreated = (e: any) => {
      if (e.detail) {
        const item = e.detail
        const newTicketItem: Ticket = {
          id: `#T-${Date.now().toString().slice(-4)}`,
          subject: item.subject || 'Support Ticket',
          from: 'Customer',
          category: 'General Support',
          priority: item.priority ? (item.priority.charAt(0).toUpperCase() + item.priority.slice(1)) as any : 'Normal',
          status: 'New',
          createdAt: new Date().toISOString().split('T')[0],
        }
        setTickets((prev) => [newTicketItem, ...prev])
      }
    }
    window.addEventListener("ticket_created", handleCreated)
    return () => window.removeEventListener("ticket_created", handleCreated)
  }, [loadTickets])

  const filtered = activeTab === "open"
    ? tickets.filter(t => t.status === "Open" || t.status === "New")
    : activeTab === "closed"
    ? tickets.filter(t => t.status === "Closed")
    : tickets

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Live customer support tickets loaded directly from backend API.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddTicketModalOpen")}>New Ticket</Button>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs
          tabs={[
            { id: "all", label: "All Tickets" },
            { id: "open", label: "Open / New" },
            { id: "closed", label: "Closed" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={columns} data={filtered} searchKey="subject" />
      </div>
    </motion.div>
  )
}
