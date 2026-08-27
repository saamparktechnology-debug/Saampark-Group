"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Project } from "./types"
import { getProjects, deleteProject } from "./services/projectService"
import { ProjectList } from "./components/ProjectList"
import { AddProjectModal } from "./components/AddProjectModal"
import { EditProjectModal } from "./components/EditProjectModal"
import { ProjectDetailView } from "./components/ProjectDetailView"
import { useAuthStore } from "@/store/useAuthStore"

export default function ProjectsMain() {
  const { user, activeCompanyId } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [projects, setProjects] = React.useState<Project[]>([])
  const [viewMode, setViewMode] = React.useState<"table" | "detail">("table")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  React.useEffect(() => {
    const targetComp = activeCompanyId || user?.companyId || "tech"
    const fetchFreshProjects = () => {
      getProjects(targetComp).then((data) => {
        setProjects(data)
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0])
        } else if (data.length === 0) {
          setSelectedProject(null)
        }
      })
    }
    fetchFreshProjects()
    const interval = setInterval(fetchFreshProjects, 3000)
    const handleReload = () => fetchFreshProjects()
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_projects_updated", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_projects_updated", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }

  }, [activeCompanyId, user?.companyId, selectedProject])

  const visibleProjects = React.useMemo(() => {
    if (!user) return []
    if (isSuperOrAdmin) return projects

    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()
    const roleStr = String(user.role || "").toLowerCase()
    const isClient = roleStr.includes("client")

    return projects.filter((p) => {
      const pCreatorId = String((p as any).createdById || "").toLowerCase().trim()
      const pCreatorEmail = ((p as any).createdByEmail || "").toLowerCase().trim()

      if (isClient) {
        const clientName = (p.client || "").toLowerCase().trim()
        const pClientId = String((p as any).clientId || "").toLowerCase().trim()

        return (
          clientName === normName ||
          clientName === normEmail ||
          (normName && clientName.includes(normName)) ||
          (uId && pClientId === uId) ||
          (uId && pCreatorId === uId) ||
          (normEmail && pCreatorEmail === normEmail)
        )
      }

      // For team members: check if creator, lead, or member of project
      if (uId && pCreatorId === uId) return true
      if (normEmail && pCreatorEmail === normEmail) return true

      const members = p.members || []
      return members.some((m) => {
        const mName = (m.name || "").toLowerCase().trim()
        const mEmail = (m.email || "").toLowerCase().trim()
        return (
          mName === normName ||
          mEmail === normEmail ||
          (normName && (mName.includes(normName) || normName.includes(mName))) ||
          (normEmail && (mEmail.includes(normEmail) || normEmail.includes(mEmail)))
        )
      })
    })
  }, [projects, user, isSuperOrAdmin])


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
    await deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (selectedProject?.id === id) {
      setSelectedProject(projects.find((p) => p.id !== id) || null)
    }
  }

  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p)
    setIsEditModalOpen(true)
  }

  const handleSelectProjectDetail = (p: Project) => {
    setSelectedProject(p)
    setViewMode("detail")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {viewMode === "table" ? (
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
