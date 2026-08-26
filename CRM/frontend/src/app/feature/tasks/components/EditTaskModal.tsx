"use client"

import * as React from "react"
import { X, Check, Paperclip, Mic, HelpCircle, Trash2 } from "lucide-react"
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
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canDeleteTask = canPerformAction(user, "Tasks", "delete")

  const [teamMembers, setTeamMembers] = React.useState<{ id: string; name: string; role?: string }[]>([])
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [relatedTo, setRelatedTo] = React.useState("-")
  const [points, setPoints] = React.useState("1 Point")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [collaborators, setCollaborators] = React.useState("")
  const [status, setStatus] = React.useState<TaskStatus>("To do")
  const [priority, setPriority] = React.useState<TaskPriority | "Priority">("Priority")
  const [labels, setLabels] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      getUsers("all").then((list) => {
        const isSuperAdmin = user?.role === "Super Admin"
        const userCompIds = user?.companyIds || (user?.companyId ? [user?.companyId] : ["tech"])

        const filteredByCompany = isSuperAdmin
          ? (list || [])
          : (list || []).filter((u) => {
              if (u.role === "Super Admin") return false
              const uComps = u.companyIds || (u.companyId ? [u.companyId] : [])
              return uComps.some((c) => userCompIds.includes(c))
            })

        const teamOnly = filteredByCompany.filter((u) => {
          const r = (u.role || "").toLowerCase().trim()
          return (r === "teams" || r === "team" || r.includes("team")) && !r.includes("admin") && !r.includes("client")
        })
        const members = (teamOnly.length > 0 ? teamOnly : filteredByCompany.filter(u => u.role !== "Clients")).map((u) => ({ id: u.id, name: u.name, role: u.role }))
        setTeamMembers(members)
      })
    }
  }, [isOpen, user])

  React.useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setRelatedTo(task.relatedTo || "-")
      setPoints(task.points || "1 Point")
      setAssignedTo(task.assignedTo || "")
      setCollaborators(task.collaborators || "")
      setStatus(task.status || "To do")
      setPriority(task.priority || "Priority")
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

      const updated = await taskService.updateTask(task.id, {
        title,
        description,
        relatedTo: relatedTo === "-" ? undefined : relatedTo,
        points,
        assignedTo,
        collaborators: collaborators || "-",
        status,
        priority: priority === "Priority" ? "Normal" : (priority as TaskPriority),
        priorityIcon,
        labels: parsedLabels,
        startDate,
        deadline,
        isRecurring,
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
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Edit task #{task.id}</h2>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Related to</label>
            <select
              value={relatedTo}
              onChange={(e) => setRelatedTo(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="-">-</option>
              <option value="Website Development">Website Development</option>
              <option value="Software Development">Software Development</option>
              <option value="Android/iOS">Android/iOS</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Domain & Hosting">Domain & Hosting</option>
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

          {/* Collaborators */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Collaborators</label>
            <input
              type="text"
              value={collaborators}
              onChange={(e) => setCollaborators(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
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
