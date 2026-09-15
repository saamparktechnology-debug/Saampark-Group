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
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { confirmTwoStepDelete } from "@/lib/confirmDialog"

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
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [activeViewTab, setActiveViewTab] = React.useState<"list" | "kanban">("list")
  const [availableLabels, setAvailableLabels] = React.useState<LabelItem[]>(INITIAL_LABELS)

  // Load user-specific custom labels from localStorage
  React.useEffect(() => {
    const userKey = user?.email || user?.name || "global"
    const storageKey = `saampark_custom_labels_${userKey}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableLabels(parsed)
          return
        }
      } catch (e) {
        console.warn("Failed to load user custom labels:", e)
      }
    }
    setAvailableLabels(INITIAL_LABELS)
  }, [user?.email, user?.name])

  const persistLabelsForUser = React.useCallback((labelsToSave: LabelItem[]) => {
    setAvailableLabels(labelsToSave)
    const userKey = user?.email || user?.name || "global"
    const storageKey = `saampark_custom_labels_${userKey}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(labelsToSave))
    } catch (e) {
      console.warn("Failed to persist user custom labels:", e)
    }
  }, [user?.email, user?.name])
  
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
        // Read fresh from store at call time — avoids stale closure on company switch
        const { activeCompanyId: freshCompanyId, user: freshUser } = useAuthStore.getState()
        const targetComp = freshCompanyId || freshUser?.companyId || "tech"
        const data = await getLeads(targetComp)
        if (Array.isArray(data)) {
          setLeads(data)
        }
      } catch (err) {
        console.warn("Error loading leads:", err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }
    fetchFreshLeads(true)
    const storageHandler = () => fetchFreshLeads(false)
    window.addEventListener("storage", storageHandler)
    window.addEventListener("saampark_company_switched", storageHandler)
    window.addEventListener("saampark_branch_switched", storageHandler)
    window.addEventListener("saampark_data_synced", storageHandler)
    return () => {
      window.removeEventListener("storage", storageHandler)
      window.removeEventListener("saampark_company_switched", storageHandler)
      window.removeEventListener("saampark_branch_switched", storageHandler)
      window.removeEventListener("saampark_data_synced", storageHandler)
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

    const lead = leads.find(l => l.id === id)
    const label = lead?.name || "Lead"
    if (!await confirmTwoStepDelete(label, "lead")) return

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

  // Label management with user-specific persistence
  const handleSaveLabel = (newLabel: LabelItem) => {
    setAvailableLabels((prev) => {
      const updated = [...prev.filter((l) => l.name !== newLabel.name), newLabel]
      persistLabelsForUser(updated)
      return updated
    })
  }

  const handleDeleteLabel = (labelId: string) => {
    setAvailableLabels((prev) => {
      const updated = prev.filter((l) => l.id !== labelId)
      persistLabelsForUser(updated)
      return updated
    })
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

  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const visibleLeads = React.useMemo(() => {
    if (!user) return []
    // Read fresh from store to avoid stale closure after company/branch switch
    const { activeCompanyId: freshCompanyId, activeBranchId: freshBranchId, branches: freshBranches, user: freshUser } = useAuthStore.getState()
    const userComp = (freshCompanyId || freshUser?.companyId || "").toLowerCase().trim()
    const targetBranch = freshUser?.branchId || freshBranchId

    // Admins see all leads across companies and branches (or scoped to their assigned branch)
    if (isSuperOrAdmin) {
      return leads.filter((l) => {
        const isClientPrivate = (l as any).isClientPrivate === true || l.createdByRole === "Clients"
        if (isClientPrivate) return false

        if (userComp && userComp !== "all") {
          const lComp = (l.companyId || (l as any).company || "").toLowerCase().trim()
          if (lComp && lComp !== userComp && !((userComp === "tech" || !lComp) && (!l.companyId || lComp === "tech"))) {
            return false
          }
        }

        if (targetBranch && targetBranch !== "all") {
          const lBranch = String(l.branchId || (l as any).assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
          const lBranchName = String(l.branchName || (l as any).assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()
          const targetBranchObj = freshBranches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
          const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
          const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

          if (lBranch || lBranchName) {
            const isBranchMatch =
              (lBranch && (lBranch === targetBranchId || (targetBranchName && lBranch === targetBranchName))) ||
              (lBranchName && (lBranchName === targetBranchName || lBranchName === targetBranchId))

            if (!isBranchMatch) return false
          }
        }

        return true
      })
    }

    const uName = (user.name || (user as any).full_name || "").toLowerCase().trim()
    const uEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // ── CLIENT ROLE VIEW ──
    // Clients only see leads created by this specific client
    if (user.role === "Clients") {
      return leads.filter((l) => {
        const cId = String((l as any).createdById || "").toLowerCase().trim()
        const cEmail = ((l as any).createdByEmail || "").toLowerCase().trim()
        const createdBy = (l.createdBy || "").toLowerCase().trim()

        if (targetBranch) {
          const lBranch = String(l.branchId || (l as any).assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
          const lBranchName = String(l.branchName || (l as any).assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()
          const targetBranchObj = freshBranches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
          const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
          const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

          const isBranchMatch =
            (lBranch && (lBranch === targetBranchId || (targetBranchName && lBranch === targetBranchName))) ||
            (lBranchName && (lBranchName === targetBranchName || lBranchName === targetBranchId))

          if (!isBranchMatch) return false
        }

        return (
          (uId && cId === uId) ||
          (uEmail && cEmail === uEmail) ||
          (uEmail && createdBy === uEmail) ||
          (uName && createdBy === uName)
        )
      })
    }

    // ── TEAM MEMBER ROLE VIEW ──
    // Teams see leads assigned directly to them OR created by this specific team member
    return leads.filter((l) => {
      // Exclude client-private leads
      if ((l as any).isClientPrivate === true || l.createdByRole === "Clients") {
        return false
      }

      if (targetBranch) {
        const lBranch = String(l.branchId || (l as any).assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
        const lBranchName = String(l.branchName || (l as any).assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()
        const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
        const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
        const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

        const isBranchMatch =
          (lBranch && (lBranch === targetBranchId || (targetBranchName && lBranch === targetBranchName))) ||
          (lBranchName && (lBranchName === targetBranchName || lBranchName === targetBranchId))

        if (!isBranchMatch) return false
      }

      const caller = (l.caller || "").toLowerCase().trim()
      const owner = (l.owner || "").toLowerCase().trim()
      const createdBy = (l.createdBy || "").toLowerCase().trim()
      const cId = String((l as any).createdById || "").toLowerCase().trim()
      const cEmail = ((l as any).createdByEmail || "").toLowerCase().trim()
      const assignedTo = (l.assignedTo || (l as any).assigned_to || "").toString().toLowerCase().trim()
      const managers = (l.managers || "").toLowerCase().trim()

      const checkExplicitMatch = (val: string) => {
        if (!val || val === "none" || val === "unassigned" || val === "team" || val === "teams" || val === "all") {
          return false
        }

        const targets = val.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
        if (targets.length === 0) targets.push(val)

        return targets.some((t) => {
          if (!t || t === "none" || t === "unassigned" || t === "team" || t === "teams" || t === "all") return false
          if (uEmail && t === uEmail) return true
          if (uName && t === uName) return true
          if (uId && t === uId) return true
          if (uName && (t === uName || t.includes(uName) || uName.includes(t))) return true
          if (uEmail && (t === uEmail || t.includes(uEmail) || uEmail.includes(t))) return true
          if (uName) {
            const parts = uName.split(/\s+/).filter((p: string) => p.length > 2)
            if (parts.some((p: string) => t.includes(p))) return true
          }
          return false
        })
      }

      // Check if created specifically by this team member
      const isCreator = 
        (uId && cId === uId) ||
        (uEmail && cEmail === uEmail) ||
        ((createdBy && createdBy !== "team" && createdBy !== "teams" && createdBy !== "admin") && 
          (createdBy === uEmail || createdBy === uName || (uEmail && createdBy.includes(uEmail)) || (uName && createdBy.includes(uName))))

      return (
        checkExplicitMatch(assignedTo) ||
        checkExplicitMatch(caller) ||
        checkExplicitMatch(owner) ||
        checkExplicitMatch(managers) ||
        isCreator
      )
    })
  }, [leads, user, isSuperOrAdmin, activeCompanyId, activeBranchId, branches])

  if (isLoading) {
    return <ThreeDotLoader text="Loading leads & opportunities..." fullScreen={false} />
  }

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
          onOpenEditModal={handleOpenEditModal}
          onDeleteLead={handleDeleteLead}
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
