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
  const { user } = useAuthStore()
  const isSuperOrAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [projects, setProjects] = React.useState<Project[]>([])
  const [viewMode, setViewMode] = React.useState<"table" | "detail">("table")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  React.useEffect(() => {
    const fetchFreshProjects = () => {
      getProjects().then((data) => {
        setProjects(data)
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0])
        }
      })
    }
    fetchFreshProjects()
    const interval = setInterval(fetchFreshProjects, 2500)
    window.addEventListener("storage", fetchFreshProjects)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", fetchFreshProjects)
    }
  }, [selectedProject])

  const visibleProjects = React.useMemo(() => {
    if (!user || isSuperOrAdmin) return projects
    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const roleStr = String(user.role || "").toLowerCase()
    const isClient = roleStr.includes("client")

    return projects.filter((p) => {
      if (isClient) {
        const clientName = (p.client || "").toLowerCase().trim()
        return clientName === normName || clientName === normEmail || (normName && clientName.includes(normName))
      }
      // For team members: check if member of project
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
