"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, FileText, MoreHorizontal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"

type Invoice = {
  id: string
  client: string
  project: string
  billDate: string
  dueDate: string
  totalInvoiced: string
  paymentReceived: string
  due: string
  status: "Draft" | "Partially paid" | "Fully paid" | "Not paid" | "Credited"
}

const MOCK_INVOICES: Invoice[] = [
  { id: "INV #28", client: "Acme Corp", project: "Product Photography and Cataloging", billDate: "01-08-2026", dueDate: "-", totalInvoiced: "₹30,000", paymentReceived: "₹0", due: "₹0", status: "Draft" },
  { id: "INV #27", client: "Stark Enterprises", project: "Social Media Marketing Campaign", billDate: "27-07-2026", dueDate: "10-08-2026", totalInvoiced: "₹12,000", paymentReceived: "₹0", due: "₹12,000", status: "Draft" },
  { id: "INV #24", client: "Wayne Tech", project: "Event Planning and Management", billDate: "01-08-2026", dueDate: "14-08-2026", totalInvoiced: "₹13,500", paymentReceived: "₹6,750", due: "₹6,750", status: "Partially paid" },
  { id: "INV #23", client: "TechNova Solutions", project: "Podcast Production and Editing", billDate: "26-07-2026", dueDate: "09-08-2026", totalInvoiced: "₹9,000", paymentReceived: "₹9,000", due: "₹0", status: "Fully paid" },
  { id: "INV #22", client: "Global Industries", project: "SEO Optimization Strategy", billDate: "23-07-2026", dueDate: "06-08-2026", totalInvoiced: "₹36,000", paymentReceived: "₹36,000", due: "₹0", status: "Fully paid" },
  { id: "INV #21", client: "Acme Corp", project: "Product Photography and Cataloging", billDate: "25-07-2026", dueDate: "06-08-2026", totalInvoiced: "₹50,000", paymentReceived: "₹50,000", due: "₹0", status: "Credited" },
  { id: "INV #19", client: "Patel & Associates", project: "E-commerce Website Design", billDate: "24-07-2026", dueDate: "05-08-2026", totalInvoiced: "₹9,000", paymentReceived: "₹0", due: "₹9,000", status: "Not paid" },
]

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "id",
    header: "Invoice ID",
    cell: ({ row }) => <div className="font-medium text-danger hover:underline cursor-pointer">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => <div className="text-primary hover:underline cursor-pointer">{row.getValue("client")}</div>,
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => <div className="text-primary hover:underline cursor-pointer truncate max-w-[200px]">{row.getValue("project")}</div>,
  },
  {
    accessorKey: "billDate",
    header: "Bill date",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("billDate")}</div>,
  },
  {
    accessorKey: "dueDate",
    header: "Due date",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("dueDate")}</div>,
  },
  {
    accessorKey: "totalInvoiced",
    header: "Total invoiced",
    cell: ({ row }) => <div className="font-medium">{row.getValue("totalInvoiced")}</div>,
  },
  {
    accessorKey: "paymentReceived",
    header: "Payment Received",
    cell: ({ row }) => <div>{row.getValue("paymentReceived")}</div>,
  },
  {
    accessorKey: "due",
    header: "Due",
    cell: ({ row }) => <div className="font-medium">{row.getValue("due")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let colorClass = "bg-surface-hover text-muted-foreground"
      if (status === "Draft") colorClass = "bg-surface-hover text-muted-foreground"
      if (status === "Partially paid") colorClass = "bg-primary text-primary-foreground"
      if (status === "Fully paid") colorClass = "bg-blue-600 text-white"
      if (status === "Not paid") colorClass = "bg-warning text-warning-foreground"
      if (status === "Credited") colorClass = "bg-danger text-danger-foreground"
      
      return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><MoreHorizontal size={14} /></Button>
      </div>
    ),
  }
]

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = React.useState("invoices")

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Manage labels
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
            Add payment
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
          data={MOCK_INVOICES} 
          searchKey="client"
        />
        
        {/* Mock Summary Footer mimicking the screenshot */}
        <div className="border-t border-border mt-4 pt-4 flex justify-end gap-16 pr-[20%] text-sm">
          <div className="text-right">
            <p className="font-semibold mb-2">Total</p>
            <p className="font-semibold text-muted-foreground">Total of all pages</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-2">₹2,88,500</p>
            <p className="font-semibold text-muted-foreground">₹12,28,200</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-2">₹70,750</p>
            <p className="font-semibold text-muted-foreground">₹5,39,450</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-2">₹1,37,750</p>
            <p className="font-semibold text-muted-foreground">₹6,08,750</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
