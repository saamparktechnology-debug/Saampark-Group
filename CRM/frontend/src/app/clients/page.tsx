"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Filter, Eye, Pencil, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"

type Client = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Lead"
  projects: number
  amount: string
}

const CLIENT_DATA: Record<string, Client[]> = {
  tech: [
    { id: "CLI-001", name: "Acme Corp", email: "contact@acmecorp.com", status: "Active", projects: 4, amount: "₹35,00,000" },
    { id: "CLI-002", name: "TechNova Solutions", email: "hello@technova.io", status: "Active", projects: 2, amount: "₹12,80,000" },
    { id: "CLI-003", name: "Global Industries", email: "info@globalind.com", status: "Inactive", projects: 0, amount: "₹0" },
    { id: "CLI-004", name: "Stark Enterprises", email: "tony@stark.com", status: "Lead", projects: 1, amount: "₹1,04,00,000" },
    { id: "CLI-005", name: "Wayne Tech", email: "bruce@wayne.com", status: "Active", projects: 5, amount: "₹74,00,000" },
    { id: "CLI-006", name: "Patel & Associates", email: "info@patel.in", status: "Active", projects: 3, amount: "₹28,50,000" },
  ],
  digital: [
    { id: "CLI-D1", name: "GrowthPulse Marketing", email: "growth@pulse.in", status: "Active", projects: 6, amount: "₹18,50,000" },
    { id: "CLI-D2", name: "Apex Creatives", email: "design@apex.com", status: "Active", projects: 3, amount: "₹8,40,000" },
    { id: "CLI-D3", name: "HyperScale Ventures", email: "venture@hyperscale.io", status: "Lead", projects: 1, amount: "₹4,20,000" },
    { id: "CLI-D4", name: "Zenith Digital", email: "hello@zenith.in", status: "Inactive", projects: 0, amount: "₹0" },
  ]
}

export default function ClientsPage() {
  const { openModal } = useUIStore()
  const { activeCompanyId } = useAuthStore()

  // Manage client list locally so deletes/edits show up
  const [clients, setClients] = React.useState<Client[]>([])

  React.useEffect(() => {
    setClients(CLIENT_DATA[activeCompanyId === "digital" ? "digital" : "tech"] || [])
  }, [activeCompanyId])

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const columns = React.useMemo<ColumnDef<Client>[]>(() => [
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {row.original.name.charAt(0)}
          </div>
          <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("name")}</div>
        </div>
      ),
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("email")}</span> 
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        let c = "bg-success/10 text-success border-success/20"
        if (s === "Inactive") c = "bg-danger/10 text-danger border-danger/20"
        if (s === "Lead") c = "bg-warning/10 text-warning border-warning/20"
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c}`}>{s}</span>
      },
    },
    { accessorKey: "projects", header: "Projects" },
    { 
      accessorKey: "amount", 
      header: "Total Revenue", 
      cell: ({ row }) => <span className="font-semibold">{row.getValue("amount")}</span> 
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          onView={() => alert(`Viewing details for ${row.original.name}`)}
          onEdit={() => alert(`Editing ${row.original.name}`)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ),
    },
  ], [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients, leads, and customer relationships for {activeCompanyId === "digital" ? "SAAMPARK Digital" : "SAAMPARK Technology"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal("isAddClientModalOpen")}>Add Client</Button>
        </div>
      </div>
      <DataTable columns={columns} data={clients} searchKey="name" />
    </motion.div>
  )
}
