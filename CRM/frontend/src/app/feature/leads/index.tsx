"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Lead } from "./types"
import { getLeads, deleteLead, updateLead, normalizeCompanyId, isLeadAssignedToUser, isTeamMemberRole } from "./services/leadService"
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
  const { user, activeCompanyId, activeBranchId, activeSubBranchId, branches, subBranches } = useAuthStore()
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
    // Ensure all fresh branches and companies are loaded in store
    useAuthStore.getState().fetchBranches?.().catch(() => {})
    useAuthStore.getState().fetchCompanies?.().catch(() => {})

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
        setIsLoading(false)
      }
    }
    fetchFreshLeads(true)
    const storageHandler = () => fetchFreshLeads(false)
    window.addEventListener("storage", storageHandler)
    window.addEventListener("saampark_company_switched", storageHandler)
    window.addEventListener("saampark_branch_switched", storageHandler)
    window.addEventListener("saampark_sub_branch_switched", storageHandler)
    window.addEventListener("saampark_subbranch_switched", storageHandler)
    window.addEventListener("saampark_data_synced", storageHandler)
    window.addEventListener("saampark_leads_updated", storageHandler)
    return () => {
      window.removeEventListener("storage", storageHandler)
      window.removeEventListener("saampark_company_switched", storageHandler)
      window.removeEventListener("saampark_branch_switched", storageHandler)
      window.removeEventListener("saampark_sub_branch_switched", storageHandler)
      window.removeEventListener("saampark_subbranch_switched", storageHandler)
      window.removeEventListener("saampark_data_synced", storageHandler)
      window.removeEventListener("saampark_leads_updated", storageHandler)
    }
  }, [activeCompanyId, activeBranchId, activeSubBranchId])

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

  const userRole = (user?.role || "").trim()
  const userRoleId = Number((user as any)?.role_id)
  const userEmail = (user?.email || "").toLowerCase().trim()

  const isSuperAdmin = userRole === "Super Admin" || userRoleId === 1 || userEmail === "saampark.official@gmail.com"
  const isAdmin = !isSuperAdmin && (userRole === "Admin" || userRoleId === 2 || userRole.toLowerCase().includes("admin") || (user as any)?.role_name?.toLowerCase().includes("admin") || (user as any)?.role_name?.toLowerCase().includes("manager"))
  const isClient = userRole === "Clients" || userRole === "Client" || userRoleId === 4 || userRole.toLowerCase().includes("client")
  const isTeam = !isSuperAdmin && !isAdmin && !isClient

  const visibleLeads = React.useMemo(() => {
    if (!user) return []
    // Read fresh from store to avoid stale closure after company/branch/sub-branch switch
    const { 
      activeCompanyId: freshCompanyId, 
      activeBranchId: freshBranchId, 
      activeSubBranchId: freshSubBranchId, 
      branches: freshBranches, 
      subBranches: freshSubBranches, 
      user: freshUser 
    } = useAuthStore.getState()
    const userComp = (freshCompanyId || freshUser?.companyId || "").toLowerCase().trim()
    const targetBranch = freshBranchId || (isSuperAdmin ? null : freshUser?.branchId)
    const targetSubBranch = freshSubBranchId || (isSuperAdmin ? null : freshUser?.subBranchId)

    const matchLeadBranch = (l: Lead, bTarget: string | null) => {
      if (!bTarget || bTarget === "all") return true
      const lBranch = String(l.branchId || (l as any).assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
      const lBranchName = String(l.branchName || (l as any).assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()
      const targetStr = String(bTarget).toLowerCase().trim()

      const safeBranches = Array.isArray(freshBranches) ? freshBranches : []
      const targetBranchObj = safeBranches.find((b: any) => {
        if (!b) return false
        return String(b.id || "").toLowerCase().trim() === targetStr || 
               String(b.code || "").toLowerCase().trim() === targetStr || 
               String(b.name || b.branch_name || "").toLowerCase().trim() === targetStr
      })
      const targetBranchId = String(targetBranchObj?.id || bTarget).toLowerCase().trim()
      const targetBranchCode = String(targetBranchObj?.code || "").toLowerCase().trim()
      const targetBranchName = String(targetBranchObj?.name || (targetBranchObj as any)?.branch_name || "").toLowerCase().trim()

      return Boolean(
        (lBranch && (
          lBranch === targetBranchId ||
          (targetBranchCode && lBranch === targetBranchCode) ||
          (targetBranchName && lBranch === targetBranchName)
        )) ||
        (lBranchName && (
          lBranchName === targetBranchName ||
          lBranchName === targetBranchId ||
          (targetBranchCode && lBranchName === targetBranchCode)
        ))
      )
    }

    const matchLeadSubBranch = (l: Lead, sbTarget: string | null) => {
      if (!sbTarget || sbTarget === "all") return true
      const lSubBranch = String((l as any).subBranchId || (l as any).sub_branch_id || (l as any).assignedSubBranchId || "").toLowerCase().trim()
      const lSubBranchName = String((l as any).subBranchName || (l as any).sub_branch_name || (l as any).assignedSubBranchName || "").toLowerCase().trim()
      const targetStr = String(sbTarget).toLowerCase().trim()

      const safeSubBranches = Array.isArray(freshSubBranches) ? freshSubBranches : []
      const targetSbObj = safeSubBranches.find((sb: any) => {
        if (!sb) return false
        return String(sb.id || "").toLowerCase().trim() === targetStr ||
               String(sb.code || "").toLowerCase().trim() === targetStr ||
               String(sb.name || sb.sub_branch_name || "").toLowerCase().trim() === targetStr
      })
      const targetSbId = String(targetSbObj?.id || sbTarget).toLowerCase().trim()
      const targetSbCode = String(targetSbObj?.code || "").toLowerCase().trim()
      const targetSbName = String(targetSbObj?.name || (targetSbObj as any)?.sub_branch_name || "").toLowerCase().trim()

      return Boolean(
        (lSubBranch && (
          lSubBranch === targetSbId ||
          (targetSbCode && lSubBranch === targetSbCode) ||
          (targetSbName && lSubBranch === targetSbName)
        )) ||
        (lSubBranchName && (
          lSubBranchName === targetSbName ||
          lSubBranchName === targetSbId ||
          (targetSbCode && lSubBranchName === targetSbCode)
        ))
      )
    }

    // ── 1. SUPER ADMIN ROLE ──
    // Full system governance across companies & branches (unless filtered)
    if (isSuperAdmin) {
      return leads.filter((l) => {
        const isClientPrivate = (l as any).isClientPrivate === true || l.createdByRole === "Clients"
        if (isClientPrivate) return false

        if (userComp && userComp !== "all") {
          const lComp = normalizeCompanyId(l.companyId || (l as any).company)
          const targetComp = normalizeCompanyId(userComp)
          if (lComp !== targetComp) return false
        }

        if (freshBranchId && freshBranchId !== "all") {
          if (!matchLeadBranch(l, freshBranchId)) return false
        }

        if (freshSubBranchId && freshSubBranchId !== "all") {
          if (!matchLeadSubBranch(l, freshSubBranchId)) return false
        }

        return true
      })
    }

    // ── 2. ADMIN ROLE ──
    // Company / Branch Admin sees leads within their assigned company and branch scope
    if (isAdmin) {
      return leads.filter((l) => {
        const isClientPrivate = (l as any).isClientPrivate === true || l.createdByRole === "Clients"
        if (isClientPrivate) return false

        if (userComp && userComp !== "all") {
          const lComp = normalizeCompanyId(l.companyId || (l as any).company)
          const targetComp = normalizeCompanyId(userComp)
          if (lComp !== targetComp) return false
        }

        if (targetBranch && targetBranch !== "all") {
          if (!matchLeadBranch(l, targetBranch)) return false
        }

        if (targetSubBranch && targetSubBranch !== "all") {
          if (!matchLeadSubBranch(l, targetSubBranch)) return false
        }

        return true
      })
    }

    const uName = (user.name || (user as any).full_name || "").toLowerCase().trim()
    const uEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // ── 3. CLIENT ROLE ──
    // Clients only see leads created by this specific client
    if (isClient) {
      return leads.filter((l) => {
        const cId = String((l as any).createdById || "").toLowerCase().trim()
        const cEmail = ((l as any).createdByEmail || "").toLowerCase().trim()
        const createdBy = (l.createdBy || "").toLowerCase().trim()

        return (
          (uId && cId === uId) ||
          (uEmail && cEmail === uEmail) ||
          (uEmail && createdBy === uEmail) ||
          (uName && createdBy === uName)
        )
      })
    }

    // ── 4. TEAM MEMBER ROLE (Strictly ONLY Assigned Leads) ──
    // Team members see ONLY leads assigned directly to them (or created by them).
    // They NEVER see unassigned leads or leads assigned to other members!
    return leads.filter((l) => {
      // Exclude client-private leads
      if ((l as any).isClientPrivate === true || l.createdByRole === "Clients") {
        return false
      }

      const isAssigned = isLeadAssignedToUser(l, user)
      if (!isAssigned) return false

      if (freshBranchId && freshBranchId !== "all") {
        if (l.branchId && !matchLeadBranch(l, freshBranchId)) return false
      }
      if (freshSubBranchId && freshSubBranchId !== "all") {
        if ((l as any).subBranchId && !matchLeadSubBranch(l, freshSubBranchId)) return false
      }

      return true
    })
  }, [leads, user, isSuperAdmin, isAdmin, isClient, isTeam, activeCompanyId, activeBranchId, activeSubBranchId, branches, subBranches])

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
