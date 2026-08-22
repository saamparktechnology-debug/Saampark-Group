"use client"

import * as React from "react"
import { X, Check, Bold, Italic, Underline, List, ListOrdered, Table, Link2, Code, Sparkles, Minus, Maximize2 } from "lucide-react"
import { Project, ProjectStatus, ProjectType } from "../types"
import { updateProject } from "../services/projectService"

interface EditProjectModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onProjectUpdated: (updatedProject: Project) => void
}

export function EditProjectModal({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [title, setTitle] = React.useState("")
  const [projectType, setProjectType] = React.useState<ProjectType>("Client Project")
  const [client, setClient] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [labelsList, setLabelsList] = React.useState<string[]>([])
  const [newLabelInput, setNewLabelInput] = React.useState("")
  const [status, setStatus] = React.useState<ProjectStatus>("Open")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (project) {
      setTitle(project.title || "")
      setProjectType(project.projectType || "Client Project")
      setClient(project.client || "")
      setDescription(project.description || "")
      setStartDate(project.startDate || "")
      setDeadline(project.deadline || "")
      setPrice(project.price || "")
      setLabelsList(project.labels || [])
      setStatus(project.status || "Open")
    }
  }, [project])

  if (!isOpen || !project) return null

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabelsList(labelsList.filter((l) => l !== labelToRemove))
  }

  const handleAddLabel = () => {
    if (newLabelInput.trim() && !labelsList.includes(newLabelInput.trim())) {
      setLabelsList([...labelsList, newLabelInput.trim()])
      setNewLabelInput("")
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a project title.")
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateProject(project.id, {
        title,
        projectType,
        client: projectType === "Client Project" ? client : "-",
        description,
        startDate,
        deadline,
        price,
        labels: labelsList,
        status,
        progress: status === "Completed" ? 100 : project.progress,
      })

      onProjectUpdated(updated)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Edit project</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Project type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Project type</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="Internal Project">Internal Project</option>
              <option value="Client Project">Client Project</option>
            </select>
          </div>

          {/* Client (if Client Project) */}
          {projectType === "Client Project" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-zinc-500 font-medium">Client</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          )}

          {/* Description with Rich Formatting Toolbar matching Image 4 */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Description</label>
            <div className="col-span-3 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500">
                <button type="button" className="p-1 hover:text-blue-600 rounded"><Sparkles size={13} /></button>
                <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded font-bold"><Bold size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded italic"><Italic size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded underline"><Underline size={13} /></button>
                <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><List size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><ListOrdered size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><Table size={13} /></button>
                <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><Link2 size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><Minus size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><Maximize2 size={13} /></button>
                <button type="button" className="p-1 hover:text-zinc-800 dark:hover:text-zinc-200 rounded"><Code size={13} /></button>
              </div>

              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 text-xs resize-none"
              />
            </div>
          </div>

          {/* Start date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Start date</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Deadline</label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Price</label>
            <input
              type="text"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Labels with removable pills matching Image 4 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Labels</label>
            <div className="col-span-3 flex flex-wrap items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md min-h-[38px]">
              {labelsList.map((lbl) => (
                <span
                  key={lbl}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(lbl)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    ×
                  </button>
                  {lbl}
                </span>
              ))}
              <input
                type="text"
                placeholder={labelsList.length === 0 ? "Add label..." : ""}
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddLabel()
                  }
                }}
                className="flex-1 bg-transparent border-none focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs min-w-[80px]"
              />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
              <option value="Hold">Hold</option>
            </select>
          </div>

        </div>

        {/* Footer Buttons matching Image 4 */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex items-center gap-1 px-5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
        </div>

      </div>
    </div>
  )
}
