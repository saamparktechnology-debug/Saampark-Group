"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Filter } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Lead } from "./types"
import { getLeads } from "./services/leadService"
import { LeadList } from "./components/LeadList"
import { LeadKanban } from "./components/LeadKanban"

export default function LeadsMain() {
  const [activeTab, setActiveTab] = React.useState("list")
  const { openModal } = useUIStore()
  const { activeCompanyId } = useAuthStore()

  const [leads, setLeads] = React.useState<Lead[]>([])

  const loadLeads = React.useCallback(async () => {
    const live = await getLeads(activeCompanyId || "tech")
    setLeads(live)
  }, [activeCompanyId])

  React.useEffect(() => {
    loadLeads()
    const handleCreated = (e: any) => {
      if (e.detail) {
        const item = e.detail
        const newLeadItem: Lead = {
          id: `L-${Date.now()}`,
          name: item.company_name || item.first_name || 'New Lead',
          primaryContact: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Contact',
          phone: item.phone || '+91 98000 00000',
          owner: 'Sales Rep',
          value: '₹50,000',
          createdAt: new Date().toLocaleDateString('en-GB'),
          status: 'New',
        }
        setLeads((prev) => [newLeadItem, ...prev])
      }
    }
    window.addEventListener("lead_created", handleCreated)
    return () => window.removeEventListener("lead_created", handleCreated)
  }, [loadLeads])

  const handleDelete = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

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
        <div className="mb-4">
          <Tabs
            tabs={[
              { id: "list", label: "List View" },
              { id: "kanban", label: "Kanban Board" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === "list" ? (
          <LeadList leads={leads} onDelete={handleDelete} />
        ) : (
          <LeadKanban leads={leads} />
        )}
      </div>
    </motion.div>
  )
}
