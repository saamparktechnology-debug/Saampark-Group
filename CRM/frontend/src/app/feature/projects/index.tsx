"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Project } from "./types"
import { getProjects, deleteProject } from "./services/projectService"
import { ProjectList } from "./components/ProjectList"
import { AddProjectModal } from "./components/AddProjectModal"
import { EditProjectModal } from "./components/EditProjectModal"
import { ProjectDetailView } from "./components/ProjectDetailView"

export default function ProjectsMain() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [viewMode, setViewMode] = React.useState<"table" | "detail">("table")
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)

  React.useEffect(() => {
    getProjects().then((data) => {
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0])
      }
    })
  }, [])

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
          projects={projects}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenEditModal={handleOpenEditModal}
          onDeleteProject={handleDeleteProject}
          onSelectProjectDetail={handleSelectProjectDetail}
        />
      ) : (
        selectedProject && (
          <ProjectDetailView
            projects={projects}
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
