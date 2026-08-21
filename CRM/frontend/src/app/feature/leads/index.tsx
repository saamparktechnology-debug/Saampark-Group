"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Lead } from "./types"
import { getLeads, deleteLead, updateLead } from "./services/leadService"
import { LeadList } from "./components/LeadList"
import { LeadKanban } from "./components/LeadKanban"
import { AddLeadModal } from "./components/AddLeadModal"
import { EditLeadModal } from "./components/EditLeadModal"
import { ManageLabelsModal, LabelItem } from "./components/ManageLabelsModal"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

export const INITIAL_LABELS: LabelItem[] = [
  { id: "lbl_3", name: "Call this week", color: "#a855f7" },
  { id: "lbl_4", name: "Corporate", color: "#d8b4fe" },
  { id: "lbl_5", name: "Inactive", color: "#9ca3af" },
  { id: "lbl_6", name: "Potential", color: "#3b82f6" },
  { id: "lbl_7", name: "Referral", color: "#06b6d4" },
  { id: "lbl_8", name: "Satisfied", color: "#84cc16" },
  { id: "lbl_9", name: "Unsatisfied", color: "#38bdf8" },
]

export default function LeadsMain() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [activeViewTab, setActiveViewTab] = React.useState<"list" | "kanban">("list")
  const [availableLabels, setAvailableLabels] = React.useState<LabelItem[]>(INITIAL_LABELS)
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = React.useState(false)
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null)

  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchFreshLeads = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        const data = await getLeads()
        setLeads(data)
      } catch (err) {
        console.warn("Error loading leads:", err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }
    fetchFreshLeads(true)                              // first load: show spinner
    const interval = setInterval(() => fetchFreshLeads(false), 5000)  // background: silent
    const storageHandler = () => fetchFreshLeads(false)
    window.addEventListener("storage", storageHandler)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])



  const handleLeadAdded = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev])
  }

  const handleLeadUpdated = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  const handleDeleteLead = async (id: string) => {
    const { user } = useAuthStore.getState()
    const { canPerformAction } = usePermissionStore.getState()
    const isSuperAdminOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"
    
    if (!isSuperAdminOrAdmin && !canPerformAction(user, "Leads", "delete")) {
      alert("Action forbidden: You do not have permission to delete leads.")
      return
    }

    await deleteLead(id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead)
    setIsEditModalOpen(true)
  }

  const handleSelectLeadDetail = (lead: Lead) => {
    setEditingLead(lead)
    setIsEditModalOpen(true)
  }

  // Label management
  const handleSaveLabel = (newLabel: LabelItem) => {
    setAvailableLabels((prev) => [...prev.filter((l) => l.name !== newLabel.name), newLabel])
  }

  const handleDeleteLabel = (labelId: string) => {
    setAvailableLabels((prev) => prev.filter((l) => l.id !== labelId))
  }

  const handleToggleLeadLabel = async (leadId: string, labelName: string) => {
    const target = leads.find((l) => l.id === leadId)
    if (!target) return

    let updatedLabels: string[]
    if (target.labels.includes(labelName)) {
      updatedLabels = target.labels.filter((lbl) => lbl !== labelName)
    } else {
      updatedLabels = [...target.labels, labelName]
    }

    const updated = await updateLead(leadId, { labels: updatedLabels })
    handleLeadUpdated(updated)
  }

  const { user } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const visibleLeads = React.useMemo(() => {
    if (!user || isSuperOrAdmin) return leads

    const uName = (user.name || (user as any).full_name || "").toLowerCase().trim()
    const uEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    return leads.filter((l) => {
      const caller = (l.caller || "").toLowerCase().trim()
      const owner = (l.owner || "").toLowerCase().trim()
      const createdBy = (l.createdBy || "").toLowerCase().trim()
      const assignedTo = (l.assignedTo || (l as any).assigned_to || "").toString().toLowerCase().trim()
      const managers = (l.managers || "").toLowerCase().trim()

      const checkMatch = (val: string) => {
        if (!val) return false
        if (val === "team" || val === "teams" || val === "all") return true

        const targets = val.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
        if (targets.length === 0) targets.push(val)

        return targets.some((t) => {
          if (t === "team" || t === "teams" || t === "all") return true
          if (uEmail && t === uEmail) return true
          if (uName && t === uName) return true
          if (uId && t === uId) return true
          if (uName && (t.includes(uName) || uName.includes(t))) return true
          if (uEmail && (t.includes(uEmail) || uEmail.includes(t))) return true
          if (uName) {
            const parts = uName.split(/\s+/).filter((p: string) => p.length > 2)
            if (parts.some((p: string) => t.includes(p))) return true
          }
          return false
        })
      }

      return (
        checkMatch(caller) ||
        checkMatch(owner) ||
        checkMatch(createdBy) ||
        checkMatch(assignedTo) ||
        checkMatch(managers)
      )
    })
  }, [leads, user, isSuperOrAdmin])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {activeViewTab === "list" ? (
        <LeadList
          leads={visibleLeads}
          availableLabels={availableLabels}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={handleOpenEditModal}
          onDeleteLead={handleDeleteLead}
          onSelectLeadDetail={handleSelectLeadDetail}
          onOpenManageLabelsModal={() => setIsManageLabelsModalOpen(true)}
          onToggleLeadLabel={handleToggleLeadLabel}
          onLeadUpdated={handleLeadUpdated}
        />
      ) : (
        <LeadKanban
          leads={visibleLeads}
          availableLabels={availableLabels}
          activeViewTab={activeViewTab}
          onChangeViewTab={setActiveViewTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectLeadDetail={handleSelectLeadDetail}
          onLeadUpdated={handleLeadUpdated}
          onOpenManageLabelsModal={() => setIsManageLabelsModalOpen(true)}
          onToggleLeadLabel={handleToggleLeadLabel}
        />
      )}

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadAdded={handleLeadAdded}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={editingLead}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingLead(null)
        }}
        onLeadUpdated={handleLeadUpdated}
        onDeleteLead={handleDeleteLead}
      />


      <ManageLabelsModal
        isOpen={isManageLabelsModalOpen}
        onClose={() => setIsManageLabelsModalOpen(false)}
        labels={availableLabels}
        onSaveLabel={handleSaveLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    </motion.div>
  )
}
