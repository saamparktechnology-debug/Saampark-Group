"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, FileText, Eye } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { getInvoices, InvoiceItem } from "./services/invoiceService"
import { InvoiceModal } from "./components/InvoiceModal"

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = React.useState("invoices")
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)

  const loadInvoices = React.useCallback(async () => {
    const data = await getInvoices()
    setInvoices(data)
  }, [])

  React.useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const columns: ColumnDef<InvoiceItem>[] = [
    {
      accessorKey: "id",
      header: "Invoice ID",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => {
            setSelectedInvoice(row.original)
            setIsInvoiceModalOpen(true)
          }}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
        >
          {row.getValue("id")}
        </button>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.getValue("client")}</div>,
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => <div className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">{row.getValue("project")}</div>,
    },
    {
      accessorKey: "billDate",
      header: "Bill date",
      cell: ({ row }) => <div className="text-zinc-500 text-xs">{row.getValue("billDate")}</div>,
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => <div className="text-zinc-500 text-xs">{row.getValue("dueDate")}</div>,
    },
    {
      accessorKey: "totalInvoiced",
      header: "Total invoiced",
      cell: ({ row }) => <div className="font-bold text-zinc-900 dark:text-zinc-100">{row.getValue("totalInvoiced")}</div>,
    },
    {
      accessorKey: "paymentReceived",
      header: "Payment Received",
      cell: ({ row }) => <div className="text-emerald-600 font-medium">{row.getValue("paymentReceived")}</div>,
    },
    {
      accessorKey: "due",
      header: "Due",
      cell: ({ row }) => <div className="font-semibold text-rose-600">{row.getValue("due")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        let colorClass = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200"
        if (status === "Draft") colorClass = "bg-zinc-100 text-zinc-600 border-zinc-200"
        if (status === "Partially paid") colorClass = "bg-blue-100 text-blue-800 border-blue-300"
        if (status === "Fully paid") colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300"
        if (status === "Not paid" || status === "Payment Pending") colorClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold"
        if (status === "Credited") colorClass = "bg-purple-100 text-purple-800 border-purple-300"
        
        return (
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {status}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => {
            setSelectedInvoice(row.original)
            setIsInvoiceModalOpen(true)
          }}
          className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold flex items-center gap-1 text-xs border border-blue-200/60"
        >
          <Eye size={13} />
          <span>View Invoice</span>
        </button>
      ),
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-xs text-muted-foreground">Manage client tax invoices, financial records & payment statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Manage labels
          </Button>
          <Button variant="primary" size="sm" leftIcon={<FileText size={14} />}>
            Add invoice
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs 
          tabs={[{ id: 'invoices', label: 'Invoices' }, { id: 'recurring', label: 'Recurring Invoices' }]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        <DataTable 
          columns={columns} 
          data={invoices} 
          searchKey="client"
        />
      </div>

      {/* Immersive Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setSelectedInvoice(null)
        }}
      />
    </motion.div>
  )
}
