"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Filter } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { ProjectList } from "./components/ProjectList"

export default function ProjectsMain() {
  const { openModal } = useUIStore()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Track progress, milestones, and deliverables across all active projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal("isAddProjectModalOpen")}>New Project</Button>
        </div>
      </div>
      
      <ProjectList />
    </motion.div>
  )
}



