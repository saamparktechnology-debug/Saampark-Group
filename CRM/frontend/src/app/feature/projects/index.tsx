"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { KanbanSquare, BarChart3 } from "lucide-react"
import { Project } from "./types"
import { getProjects, deleteProject } from "./services/projectService"
import { ProjectList } from "./components/ProjectList"
import { AddProjectModal } from "./components/AddProjectModal"
import { EditProjectModal } from "./components/EditProjectModal"
import { ProjectDetailView } from "./components/ProjectDetailView"
import ClientMarketingReport from "../marketing/components/ClientMarketingReport"
import { useAuthStore } from "@/store/useAuthStore"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"

export default function ProjectsMain() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  
  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin" || roleLower === "superadmin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower.includes("management") ||
    roleLower === "admin"
  )
  const isClient = roleLower.includes("client")
  const isTeam = !isSuperAdmin && !isAdmin && !isClient

  const [projects, setProjects] = React.useState<Project[]>([])
  const [projectSuite, setProjectSuite] = React.useState<"software" | "marketing">("software")
  const [viewMode, setViewMode] = React.useState<"table" | "detail">("table")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchFreshProjects = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      try {
        // Read fresh from store — avoids stale closure on company switch
        const { activeCompanyId: freshCompanyId, user: freshUser } = useAuthStore.getState()
        const freshIsSuperAdmin = freshUser?.role === "Super Admin"
        const freshIsAdmin = freshUser?.role === "Admin"
        let targetComp = freshCompanyId || freshUser?.companyId || "tech"
        if (!freshIsSuperAdmin && freshIsAdmin) {
          targetComp = freshUser?.companyId || freshCompanyId || "tech"
        }
        const data = await getProjects(targetComp)
        setProjects(data || [])
        if (data && data.length > 0 && !selectedProject) {
          setSelectedProject(data[0])
        } else if (!data || data.length === 0) {
          setSelectedProject(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchFreshProjects(true)
    const handleReload = () => fetchFreshProjects(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_projects_updated", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_projects_updated", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [])

  const visibleProjects = React.useMemo(() => {
    if (!user) return []
    
    const userComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId || (user?.role !== "Super Admin" && user?.role !== "Admin" ? user?.branchId : null)

    const safeBranches = Array.isArray(branches) ? branches : []
    const targetBranchObj = safeBranches.find((b: any) => {
      if (!b) return false
      const bId = String(b.id || "").toLowerCase().trim()
      const bName = String(b.name || b.branch_name || b.code || "").toLowerCase().trim()
      const t = String(targetBranch || "").toLowerCase().trim()
      return bId === t || bName === t
    })
    const targetBranchId = String(targetBranchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = String(targetBranchObj?.name || (targetBranchObj as any)?.branch_name || "").toLowerCase().trim()

    const checkBranch = (p: any) => {
      if (!p) return false
      if (!targetBranch || targetBranch === "all") return true
      const pBranch = String(p.branchId || p.branch_id || "").toLowerCase().trim()
      const pBranchName = String(p.branchName || p.branch_name || "").toLowerCase().trim()
      return (pBranch && (pBranch === targetBranchId || (targetBranchName && pBranch === targetBranchName))) ||
             (pBranchName && (pBranchName === targetBranchName || pBranchName === targetBranchId))
    }

    // 1. Super Admin & Company Admin: filter strictly by active company and branch
    if (isSuperAdmin || isAdmin) {
      let filtered = Array.isArray(projects) ? projects : []
      if (userComp && userComp !== "all") {
        filtered = filtered.filter((p) => {
          if (!p) return false
          const pComp = String(p.companyId || (p as any).company || "").toLowerCase().trim()
          return pComp === userComp || (userComp === "tech" && !p.companyId)
        })
      }
      if (targetBranch && targetBranch !== "all") {
        filtered = filtered.filter((p) => checkBranch(p))
      }
      return filtered
    }

    const normName = String(user.name || "").toLowerCase().trim()
    const normEmail = String(user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // 3. Client: Strictly all projects created for / assigned to this client across their company
    if (isClient) {
      return (Array.isArray(projects) ? projects : []).filter((p) => {
        if (!p) return false
        return isRecordAssignedToClient(p, user)
      })
    }

    // 4. Team Member (Staff / Developer / Employee): ONLY projects assigned to them or created by them
    return (Array.isArray(projects) ? projects : []).filter((p) => {
      if (!p || !checkBranch(p)) return false

      const pCreatorId = String((p as any).createdById || "").toLowerCase().trim()
      const pCreatorEmail = String((p as any).createdByEmail || "").toLowerCase().trim()
      const pBilledBy = String(p.billedBy || "").toLowerCase().trim()

      if (uId && pCreatorId === uId) return true
      if (normEmail && pCreatorEmail === normEmail) return true
      if (normName && pBilledBy === normName) return true

      const members = Array.isArray(p.members) ? p.members : []
      return members.some((m: any) => {
        if (!m) return false
        const mName = String(typeof m === "string" ? m : m.name || "").toLowerCase().trim()
        const mEmail = String(typeof m === "string" ? "" : m.email || "").toLowerCase().trim()
        const mId = String(typeof m === "string" ? "" : m.id || "").toLowerCase().trim()
        return (
          (uId && mId === uId) ||
          mName === normName ||
          mEmail === normEmail ||
          (normName && (mName.includes(normName) || normName.includes(mName))) ||
          (normEmail && (mEmail.includes(normEmail) || normEmail.includes(mEmail)))
        )
      })
    })
  }, [projects, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId, branches])



  const handleProjectAdded = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev])
  }

  const handleProjectUpdated = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (isClient) {
      alert("Permission Denied: Clients cannot delete projects assigned to them.")
      return
    }
    const proj = projects.find(p => p.id === id)
    const projTitle = proj?.title || "Project"
    await executeWithFeedback(async () => {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (selectedProject?.id === id) {
        setSelectedProject(projects.find((p) => p.id !== id) || null)
      }
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Project...",
      loadingMsg: `Removing "${projTitle}" and milestones...`,
      successTitle: "Project Deleted",
      successMsg: `"${projTitle}" was deleted successfully.`,
      errorTitle: "Delete Failed",
    })
  }

  const [initialDetailTab, setInitialDetailTab] = React.useState<string>("Overview")

  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p)
    setIsEditModalOpen(true)
  }

  const handleSelectProjectDetail = (p: Project, tab: string = "Overview") => {
    setSelectedProject(p)
    setInitialDetailTab(tab)
    setViewMode("detail")
  }

  if (isLoading) {
    return <ThreeDotLoader text="Loading projects & workflows..." fullScreen={false} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* ── PROJECT SUITE SELECTOR (Software vs Marketing Retainers) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:px-4 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => {
              setProjectSuite("software")
              setViewMode("table")
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              projectSuite === "software"
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>IT & Software Projects</span>
          </button>

          <button
            onClick={() => setProjectSuite("marketing")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              projectSuite === "marketing"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Digital Marketing Campaigns</span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Multi-Discipline Project & Retainer Hub</span>
        </div>
      </div>

      {projectSuite === "marketing" ? (
        <ClientMarketingReport />
      ) : viewMode === "table" ? (
        <ProjectList
          projects={visibleProjects}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={handleOpenEditModal}
          onDeleteProject={handleDeleteProject}
          onSelectProjectDetail={handleSelectProjectDetail}
        />
      ) : (
        selectedProject && (
          <ProjectDetailView
            projects={visibleProjects}
            selectedProject={selectedProject}
            initialTab={initialDetailTab}
            onSelectProject={setSelectedProject}
            onBackToTable={() => setViewMode("table")}
            onOpenEditModal={handleOpenEditModal}
          />
        )
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProjectAdded={handleProjectAdded}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        project={editingProject}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingProject(null)
        }}
        onProjectUpdated={handleProjectUpdated}
      />
    </motion.div>
  )
}
