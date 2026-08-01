"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, ExternalLink, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useUIStore } from "@/store/useUIStore"

type Expense = {
  id: string
  title: string
  amount: string
  category: string
  date: string
  member: string
  status: "Approved" | "Pending" | "Rejected"
}

const MOCK_EXPENSES: Expense[] = [
  { id: "EXP-001", title: "Adobe Creative Suite", amount: "$54.99/mo", category: "Software", date: "2026-07-01", member: "John Doe", status: "Approved" },
  { id: "EXP-002", title: "AWS Server Costs", amount: "$312.00", category: "Hardware", date: "2026-07-15", member: "Mark Thomas", status: "Approved" },
  { id: "EXP-003", title: "Google Ads Campaign", amount: "$1,200.00", category: "Marketing", date: "2026-07-20", member: "Sara Ann", status: "Pending" },
  { id: "EXP-004", title: "Conference Travel", amount: "$890.00", category: "Travel", date: "2026-07-22", member: "Richard Gray", status: "Pending" },
  { id: "EXP-005", title: "Office Supplies", amount: "$45.00", category: "Other", date: "2026-07-28", member: "Michael Wood", status: "Rejected" },
]

const statusColors: Record<string, string> = {
  Approved: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  Rejected: "bg-danger/10 text-danger border-danger/20",
}

const columns: ColumnDef<Expense>[] = [
  { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="text-muted-foreground text-xs font-mono">{row.getValue("id")}</span> },
  { accessorKey: "title", header: "Title", cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-semibold">{row.getValue("amount")}</span> },
  { accessorKey: "category", header: "Category", cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("category")}</span> },
  { accessorKey: "date", header: "Date", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("date")}</span> },
  { accessorKey: "member", header: "Member", cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("member")}</span> },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.getValue("status") as string
      return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[s]}`}>{s}</span>
    },
  },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"><ExternalLink size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger"><Trash2 size={14} /></Button>
      </div>
    ),
  },
]

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = React.useState("all")
  const { openModal } = useUIStore()

  const total = "$2,501.99"

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage all team expenses and budgets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddExpenseModalOpen")}>Add Expense</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Expenses", value: total, color: "text-foreground" },
          { label: "Pending Approval", value: "$2,090.00", color: "text-warning" },
          { label: "Approved This Month", value: "$366.99", color: "text-success" },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs
          tabs={[{ id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "approved", label: "Approved" }]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={columns} data={MOCK_EXPENSES} searchKey="title" />
      </div>
    </motion.div>
  )
}
