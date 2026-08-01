"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Download, Filter, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"

type Lead = {
  id: string
  name: string
  primaryContact: string
  phone: string
  owner: string
  value: string
  createdAt: string
  status: "New" | "Negotiation" | "Discussion" | "Qualified" | "Won" | "Lost"
}

const LEAD_DATA: Record<string, Lead[]> = {
  tech: [
    { id: "L-1", name: "Rice-Wolf Industries", primaryContact: "Luciano Schaefer", phone: "+91 97800 34460", owner: "Sara Ann", value: "₹4,20,000", createdAt: "31-07-2026", status: "Lost" },
    { id: "L-2", name: "Casper-Altenwerth", primaryContact: "Reid Wisoky", phone: "+91 98700 15780", owner: "John Doe", value: "₹1,20,000", createdAt: "30-07-2026", status: "New" },
    { id: "L-3", name: "Schaefer & Associates", primaryContact: "Shaylee Lockman", phone: "+91 98000 49763", owner: "Richard Gray", value: "₹8,50,000", createdAt: "30-07-2026", status: "Negotiation" },
    { id: "L-4", name: "Sandra Waters Ltd", primaryContact: "Sandra Waters", phone: "+91 94600 72884", owner: "Richard Gray", value: "₹2,80,000", createdAt: "30-07-2026", status: "Negotiation" },
    { id: "L-5", name: "Abshire-Armstrong Co", primaryContact: "Sterling Kertzmann", phone: "+91 97400 10851", owner: "Sara Ann", value: "₹15,00,000", createdAt: "29-07-2026", status: "Discussion" },
    { id: "L-6", name: "Thiel, Batz and Homenick", primaryContact: "Maci Adams", phone: "+91 94600 81393", owner: "John Doe", value: "₹6,30,000", createdAt: "29-07-2026", status: "Qualified" },
  ],
  digital: [
    { id: "LD-1", name: "Acme Retail Store", primaryContact: "Bob Builder", phone: "+91 98765 43210", owner: "Jane Smith", value: "₹1,50,000", createdAt: "01-08-2026", status: "New" },
    { id: "LD-2", name: "Local Cafe Chain", primaryContact: "Alice Cafe", phone: "+91 87654 32109", owner: "Jane Smith", value: "₹75,000", createdAt: "31-07-2026", status: "Discussion" },
    { id: "LD-3", name: "Fitness Gym", primaryContact: "Mike Strong", phone: "+91 76543 21098", owner: "John Doe", value: "₹3,00,000", createdAt: "30-07-2026", status: "Qualified" },
    { id: "LD-4", name: "Online Bookstore", primaryContact: "Read Books", phone: "+91 65432 10987", owner: "Sara Ann", value: "₹2,10,000", createdAt: "29-07-2026", status: "Won" },
  ]
}

const statusColors: Record<string, string> = {
  New: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Discussion: "bg-info/10 text-info border-info/20",
  Negotiation: "bg-warning/10 text-warning border-warning/20",
  Qualified: "bg-success/10 text-success border-success/20",
  Won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Lost: "bg-danger/10 text-danger border-danger/20",
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = React.useState("list")
  const { openModal } = useUIStore()
  const { activeCompanyId } = useAuthStore()

  const [leads, setLeads] = React.useState<Lead[]>([])

  React.useEffect(() => {
    setLeads(LEAD_DATA[activeCompanyId === "digital" ? "digital" : "tech"] || [])
  }, [activeCompanyId])

  const handleDelete = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const columns = React.useMemo<ColumnDef<Lead>[]>(() => [
    {
      accessorKey: "name",
      header: "Company / Lead",
      cell: ({ row }) => <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "primaryContact",
      header: "Contact",
      cell: ({ row }) => {
        const c = row.getValue("primaryContact") as string
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-xs font-medium border border-border shrink-0">{c.charAt(0)}</div>
            <span className="text-sm">{c}</span>
          </div>
        )
      },
    },
    { 
      accessorKey: "phone", 
      header: "Phone", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("phone")}</span> 
    },
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const o = row.getValue("owner") as string
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 shrink-0">{o.charAt(0)}</div>
            <span className="text-sm">{o}</span>
          </div>
        )
      },
    },
    { 
      accessorKey: "value", 
      header: "Value", 
      cell: ({ row }) => <span className="font-semibold">{row.getValue("value")}</span> 
    },
    { 
      accessorKey: "createdAt", 
      header: "Created", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("createdAt")}</span> 
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        return <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[s] || ""}`}>{s}</span>
      },
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
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Track and convert leads for {activeCompanyId === "digital" ? "SAAMPARK Digital" : "SAAMPARK Technology"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />}>Manage labels</Button>
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Import leads</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => openModal("isAddLeadModalOpen")}>Add lead</Button>
        </div>
      </div>
      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs tabs={[{ id: "list", label: "List" }, { id: "kanban", label: "Kanban" }]} activeTab={activeTab} onChange={setActiveTab} />
        
        {activeTab === "list" ? (
          <DataTable columns={columns} data={leads} searchKey="name" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 pt-4 overflow-x-auto pb-4">
            {Object.keys(statusColors).map(status => {
              const columnLeads = leads.filter(l => l.status === status)
              return (
                <div key={status} className="bg-surface-hover rounded-xl p-3 min-w-[200px] flex flex-col h-[600px]">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold border shadow-sm ${statusColors[status]}`}>{status}</span>
                    <span className="text-xs font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border">{columnLeads.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                    <AnimatePresence>
                      {columnLeads.map(l => (
                        <motion.div 
                          key={l.id} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group relative"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-semibold text-foreground/90 leading-tight pr-6">{l.name}</p>
                            
                            {/* Kanban Card Action Menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <RowActions 
                                onEdit={() => alert(`Editing ${l.name}`)} 
                                onDelete={() => handleDelete(l.id)} 
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-3">{l.primaryContact}</p>
                          
                          <div className="flex items-center justify-between mt-auto border-t border-border/50 pt-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border border-primary/20" title={l.owner}>
                                {l.owner.charAt(0)}
                              </div>
                              <span className="text-xs font-medium">{l.value}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {columnLeads.length === 0 && (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
