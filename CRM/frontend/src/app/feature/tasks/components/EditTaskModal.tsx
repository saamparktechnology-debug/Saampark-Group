"use client"

import * as React from "react"
import { X, Check, Paperclip, Mic, HelpCircle, Trash2, Plus, Tag } from "lucide-react"
import { Task, TaskStatus, TaskPriority } from "../types"
import { taskService } from "../services/taskService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

import { getUsers } from "@/app/feature/users/services/userService"

interface EditTaskModalProps {
  isOpen: boolean
  task: Task | null
  onClose: () => void
  onTaskUpdated: (updatedTask: Task) => void
  onDeleteTask?: (id: string) => void
}

export function EditTaskModal({ isOpen, task, onClose, onTaskUpdated, onDeleteTask }: EditTaskModalProps) {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canDeleteTask = canPerformAction(user, "Tasks", "delete")

  const [teamMembers, setTeamMembers] = React.useState<{ id: string; name: string; role?: string }[]>([])
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [selectedRelatedTo, setSelectedRelatedTo] = React.useState<string[]>([])
  const [customRelatedInput, setCustomRelatedInput] = React.useState("")
  const [availableRelatedOptions, setAvailableRelatedOptions] = React.useState<string[]>([
    "Website Development",
    "Software Development",
    "Android/iOS",
    "Digital Marketing",
    "Domain & Hosting",
  ])
  const [points, setPoints] = React.useState("1 Point")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [status, setStatus] = React.useState<TaskStatus>("To do")
  const [priority, setPriority] = React.useState<TaskPriority | "Priority">("Priority")
  const [milestone, setMilestone] = React.useState("New")
  const [labels, setLabels] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      // 1. Fetch available projects and leads for Related To multi-select
      Promise.all([
        import("@/app/feature/projects/services/projectService").then(m => m.getProjects()).catch(() => []),
        import("@/app/feature/leads/services/leadService").then(m => m.getLeads()).catch(() => []),
      ]).then(([projs, lds]) => {
        const extraOptions: string[] = []
        if (Array.isArray(projs)) {
          projs.forEach(p => { if (p.title) extraOptions.push(`Project: ${p.title}`) })
        }
        if (Array.isArray(lds)) {
          lds.forEach(l => { if (l.name) extraOptions.push(`Lead: ${l.name}`) })
        }
        setAvailableRelatedOptions(prev => {
          const set = new Set(prev)
          extraOptions.forEach(opt => set.add(opt))
          return Array.from(set)
        })
      })

      // 2. Fetch users strictly scoped to the active company and branch
      getUsers("all").then((list) => {
        const targetComp = (task?.companyId || activeCompanyId || user?.companyId || "").toLowerCase().trim()
        const targetBranch = task?.branchId || activeBranchId || user?.branchId

        let filtered = list || []

        // Filter by Company
        if (targetComp && targetComp !== "all") {
          filtered = filtered.filter((u) => {
            const uCompIds = (u.companyIds && u.companyIds.length > 0)
              ? u.companyIds.map(id => String(id).toLowerCase().trim())
              : [String(u.companyId || "tech").toLowerCase().trim()]
            return uCompIds.includes(targetComp)
          })
        }

        // Filter by Branch
        if (targetBranch) {
          const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
          const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
          const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

          filtered = filtered.filter((u) => {
            const uBranchIds = (u.branchIds && u.branchIds.length > 0)
              ? u.branchIds.map(id => String(id).toLowerCase().trim())
              : (u.branchId ? [String(u.branchId).toLowerCase().trim()] : [])
            const uBranchName = String(u.branchName || "").toLowerCase().trim()

            return (
              uBranchIds.includes(targetBranchId) ||
              (targetBranchName && uBranchIds.includes(targetBranchName)) ||
              String(u.branchId || "").toLowerCase().trim() === targetBranchId ||
              (targetBranchName && (uBranchName === targetBranchName || String(u.branchId || "").toLowerCase().trim() === targetBranchName))
            )
          })
        }

        // Strictly team members only — Super Admin and Admin excluded
        const members = filtered
          .filter((u) => {
            const r = (u.role || "").toLowerCase().trim()
            return !r.includes("admin") && !r.includes("super") && !r.includes("client") && r !== "owner" && u.status !== "Inactive"
          })
          .map((u) => ({ id: u.id, name: u.name, role: u.role }))

        setTeamMembers(members)
      })
    }
  }, [isOpen, user, task, activeCompanyId, activeBranchId, branches])

  React.useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      
      // Parse relatedTo string to array
      if (task.relatedTo && task.relatedTo !== "-") {
        const parts = task.relatedTo.split(/,\s*/).filter(Boolean)
        setSelectedRelatedTo(parts)
      } else {
        setSelectedRelatedTo([])
      }

      setPoints(task.points || "1 Point")
      setAssignedTo(task.assignedTo || "")
      setStatus(task.status || "To do")
      setPriority(task.priority || "Priority")
      setMilestone(task.milestone || "New")
      setLabels((task.labels || []).join(", "))
      setStartDate(task.startDate || "")
      setDeadline(task.deadline || "")
      setIsRecurring(!!task.isRecurring)
    }
  }, [task])

  if (!isOpen || !task) return null

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a task title.")
      return
    }

    setIsSubmitting(true)
    try {
      const parsedLabels = labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)

      let priorityIcon: "up" | "exclamation" | "down" | "none" = task.priorityIcon || "none"
      if (priority === "High") priorityIcon = "up"
      else if (priority === "Urgent") priorityIcon = "exclamation"
      else if (priority === "Low") priorityIcon = "down"

      const finalRelatedTo = selectedRelatedTo.length > 0 ? selectedRelatedTo.join(", ") : undefined

      const updated = await taskService.updateTask(task.id, {
        title,
        description,
        relatedTo: finalRelatedTo,
        points,
        assignedTo,
        assignedToAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${assignedTo.replace(/\s/g, "")}`,
        status,
        milestone: milestone || "New",
        priority: priority === "Priority" ? "Normal" : (priority as TaskPriority),
        priorityIcon,
        labels: parsedLabels,
        startDate: startDate || "-",
        deadline: deadline || "30-06-2026",
        isRecurring,
        branchId: task.branchId || activeBranchId || user?.branchId || undefined,
        branchName: task.branchName || user?.branchName || undefined,
        companyId: task.companyId || activeCompanyId || user?.companyId || "tech",
      })

      onTaskUpdated(updated)
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Edit Task</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {status}
            </span>
          </div>
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
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 resize-none"
            />
          </div>

          {/* Move Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium text-blue-600 dark:text-blue-400 font-semibold">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="col-span-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 dark:text-blue-100 font-bold"
            >
              <option value="To do">To do</option>
              <option value="In progress">In progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Related to */}
          {/* Related to Multi-Select & Custom Tag Addition */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2 flex items-center gap-1">
              <Tag size={13} className="text-zinc-400" />
              <span>Related to</span>
            </label>
            <div className="col-span-3 space-y-2">
              {/* Selected Pills */}
              {selectedRelatedTo.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {selectedRelatedTo.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRelatedTo(prev => prev.filter(i => i !== item))}
                        className="hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Selector for pre-defined & dynamically loaded items */}
              <div className="flex items-center gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value
                    if (val && !selectedRelatedTo.includes(val)) {
                      setSelectedRelatedTo(prev => [...prev, val])
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs"
                >
                  <option value="">Select pre-defined service, project, or lead...</option>
                  {availableRelatedOptions
                    .filter(opt => !selectedRelatedTo.includes(opt))
                    .map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              </div>

              {/* Custom Add Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type custom related item (e.g. Campaign, Feature, Referral)..."
                  value={customRelatedInput}
                  onChange={(e) => setCustomRelatedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (customRelatedInput.trim() && !selectedRelatedTo.includes(customRelatedInput.trim())) {
                        setSelectedRelatedTo(prev => [...prev, customRelatedInput.trim()])
                        setCustomRelatedInput("")
                      }
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs placeholder-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customRelatedInput.trim() && !selectedRelatedTo.includes(customRelatedInput.trim())) {
                      setSelectedRelatedTo(prev => [...prev, customRelatedInput.trim()])
                      setCustomRelatedInput("")
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Milestone (Lead Stage / Development Stage) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Milestone</label>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            >
              <optgroup label="Lead Stages">
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Discussion">Discussion</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Store Visit">Store Visit</option>
                <option value="Our Office Visit">Our Office Visit</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </optgroup>
              <optgroup label="Development Stages">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </optgroup>
            </select>
          </div>

          {/* Points */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <span>Points</span>
              <HelpCircle size={13} className="text-zinc-400" />
            </label>
            <select
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="1 Point">1 Point</option>
              <option value="2 Points">2 Points</option>
              <option value="3 Points">3 Points</option>
              <option value="5 Points">5 Points</option>
              <option value="8 Points">8 Points</option>
            </select>
          </div>

          {/* Assign to */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Assign to</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              {teamMembers.length === 0 ? (
                <option value="">No team members available</option>
              ) : (
                <>
                  {assignedTo && !teamMembers.some((m) => m.name === assignedTo) && (
                    <option value={assignedTo}>{assignedTo} (Current)</option>
                  )}
                  {teamMembers.map((m) => (
                    <option key={m.id || m.name} value={m.name}>
                      {m.name} {m.role ? `(${m.role})` : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="Priority">Priority</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Labels */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Labels</label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
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
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-rose-600 dark:text-rose-400 font-semibold"
            />
          </div>

          {/* Recurring */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1">
              <span>Recurring</span>
              <HelpCircle size={13} className="text-zinc-400" />
            </label>
            <div className="col-span-3 flex items-center">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {canDeleteTask && onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(task.id)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                title="Delete Task"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => alert("Upload file clicked")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 transition-colors"
            >
              <Paperclip size={13} />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Voice dictation clicked")}
              className="p-2 text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-full transition-colors"
              title="Voice note"
            >
              <Mic size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <X size={14} />
              <span>Close</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="flex items-center gap-1 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm font-semibold"
            >
              <Check size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
