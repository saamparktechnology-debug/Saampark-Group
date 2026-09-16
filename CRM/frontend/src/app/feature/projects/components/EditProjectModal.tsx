"use client"

import * as React from "react"
import { X, Check, Bold, Italic, Underline, List, ListOrdered, Table, Link2, Code, Sparkles, Minus, Maximize2, Users, UserCheck, Search, Percent } from "lucide-react"
import { Project, ProjectMember, ProjectStatus, ProjectType } from "../types"
import { updateProject } from "../services/projectService"
import { getUsers } from "@/app/feature/users/services/userService"
import { UserService } from "@/services/apiServices"

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
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [memberShares, setMemberShares] = React.useState<Record<string, number>>({})
  const [memberPayoutTypes, setMemberPayoutTypes] = React.useState<Record<string, "percentage" | "fixed">>({})
  const [memberAmounts, setMemberAmounts] = React.useState<Record<string, number>>({})
  const [memberSearchQuery, setMemberSearchQuery] = React.useState("")
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Load team members reliably from both DB and API
  React.useEffect(() => {
    if (isOpen) {
      Promise.all([
        getUsers("all").catch(() => []),
        UserService.getTeamMembers().catch(() => []),
      ]).then(([dbUsers, apiUsers]) => {
        const combined = [
          ...(Array.isArray(dbUsers) ? dbUsers : []),
          ...(Array.isArray(apiUsers) ? apiUsers : []),
        ]
        const unique = new Map<string, any>()
        for (const u of combined) {
          if (!u) continue
          const role = (u.role || u.role_name || "").toLowerCase().trim()
          const isClient = role.includes("client")
          const isInactive = u.status === "Inactive"
          const uId = String(u.id || u._id || u.email)
          if (!isClient && !isInactive && !unique.has(uId.toLowerCase())) {
            unique.set(uId.toLowerCase(), {
              id: uId,
              name: u.name || u.full_name || "Team Member",
              role: u.role || u.role_name || u.department || "Developer",
              email: u.email || "",
              avatar: u.avatarUrl || u.avatar_url || u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || u.full_name || uId}`,
            })
          }
        }
        setTeamMembers(Array.from(unique.values()))
      }).catch((err) => {
        console.error("Error loading team members in EditProjectModal:", err)
      })
    }
  }, [isOpen])

  // Initialize form when project prop changes
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
      
      const numProjTotal = parseFloat(
        String(project.totalAmount ?? project.baseAmount ?? project.price ?? "0").replace(/[^0-9.]/g, "")
      ) || 0

      const initialShares: Record<string, number> = {}
      const initialTypes: Record<string, "percentage" | "fixed"> = {}
      const initialAmounts: Record<string, number> = {}
      const memberIds: string[] = []

      if (Array.isArray(project.members)) {
        project.members.forEach(m => {
          const mId = String(m.id)
          memberIds.push(mId)
          const share = typeof m.sharePercentage === "number" ? m.sharePercentage : 15
          initialShares[mId] = share
          initialTypes[mId] = m.payoutType || "percentage"
          initialAmounts[mId] = typeof m.payoutAmount === "number" ? m.payoutAmount : Math.round((numProjTotal * share) / 100)
        })
      }
      setSelectedMemberIds(memberIds)
      setMemberShares(initialShares)
      setMemberPayoutTypes(initialTypes)
      setMemberAmounts(initialAmounts)
    }
  }, [project])

  if (!isOpen || !project) return null

  // Calculate numeric project total for live commission preview
  const numericProjectTotal = parseFloat(
    String(project.totalAmount ?? project.baseAmount ?? price ?? project.price ?? "0").replace(/[^0-9.]/g, "")
  ) || 0

  const handleToggleMember = (mem: any) => {
    const memId = String(mem.id)
    setSelectedMemberIds((prev) => {
      if (prev.includes(memId)) {
        return prev.filter((id) => id !== memId)
      } else {
        if (memberShares[memId] === undefined) {
          setMemberShares((s) => ({ ...s, [memId]: 15 }))
        }
        if (memberPayoutTypes[memId] === undefined) {
          setMemberPayoutTypes((t) => ({ ...t, [memId]: "percentage" }))
        }
        if (memberAmounts[memId] === undefined) {
          const defaultAmt = Math.round((numericProjectTotal * 15) / 100) || 5000
          setMemberAmounts((a) => ({ ...a, [memId]: defaultAmt }))
        }
        return [...prev, memId]
      }
    })
  }

  const handlePayoutTypeChange = (memId: string, type: "percentage" | "fixed") => {
    setMemberPayoutTypes((prev) => ({ ...prev, [memId]: type }))
    if (type === "fixed" && (!memberAmounts[memId] || memberAmounts[memId] === 0)) {
      const share = memberShares[memId] !== undefined ? memberShares[memId] : 15
      const computedAmt = Math.round((numericProjectTotal * share) / 100) || 5000
      setMemberAmounts((prev) => ({ ...prev, [memId]: computedAmt }))
    }
  }

  const handleAmountChange = (memId: string, amtVal: number) => {
    const clamped = isNaN(amtVal) ? 0 : Math.max(0, amtVal)
    setMemberAmounts((prev) => ({ ...prev, [memId]: clamped }))
    if (numericProjectTotal > 0) {
      const calcPct = Math.min(100, Math.round((clamped / numericProjectTotal) * 1000) / 10)
      setMemberShares((prev) => ({ ...prev, [memId]: calcPct }))
    }
  }

  const handleShareChange = (memId: string, shareVal: number) => {
    const clamped = isNaN(shareVal) ? 0 : Math.max(0, Math.min(100, shareVal))
    setMemberShares((prev) => ({
      ...prev,
      [memId]: clamped,
    }))
    if (numericProjectTotal > 0) {
      const calcAmt = Math.round((numericProjectTotal * clamped) / 100)
      setMemberAmounts((prev) => ({ ...prev, [memId]: calcAmt }))
    }
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabelsList(labelsList.filter((l) => l !== labelToRemove))
  }

  const handleAddLabel = () => {
    if (newLabelInput.trim() && !labelsList.includes(newLabelInput.trim())) {
      setLabelsList([...labelsList, newLabelInput.trim()])
      setNewLabelInput("")
    }
  }

  const totalAssignedSharePct = selectedMemberIds.reduce(
    (acc, mId) => acc + (memberShares[mId] !== undefined ? memberShares[mId] : 15),
    0
  )

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a project title.")
      return
    }

    setIsSubmitting(true)
    try {
      const assignedMembers: ProjectMember[] = selectedMemberIds.map((mId) => {
        const found = teamMembers.find(
          (t) => String(t.id).toLowerCase() === mId.toLowerCase()
        )
        const pType = memberPayoutTypes[mId] || "percentage"
        const sharePct = memberShares[mId] !== undefined ? Number(memberShares[mId]) : 15
        const manualAmt = memberAmounts[mId] !== undefined ? Number(memberAmounts[mId]) : Math.round((numericProjectTotal * sharePct) / 100)
        const finalPayoutAmt = pType === "fixed" ? manualAmt : Math.round((numericProjectTotal * sharePct) / 100)

        return {
          id: mId,
          name: found?.name || "Team Member",
          role: found?.role || "Developer",
          avatar: found?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${found?.name || mId}`,
          email: found?.email || "",
          payoutType: pType,
          payoutValue: pType === "fixed" ? manualAmt : sharePct,
          payoutAmount: finalPayoutAmt,
          sharePercentage: pType === "fixed" && numericProjectTotal > 0
            ? Number(((manualAmt / numericProjectTotal) * 100).toFixed(1))
            : sharePct,
        }
      })

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
        members: assignedMembers,
        progress: status === "Completed" ? 100 : project.progress,
      })

      onProjectUpdated(updated)
      onClose()
    } catch (err) {
      console.error("Error saving updated project:", err)
      alert("Failed to save project updates.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Edit project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Title</label>
            <input
              type="text"
              placeholder="Title"
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
              <option value="Client Project">Client Project</option>
              <option value="Internal Project">Internal Project</option>
            </select>
          </div>

          {/* Client (only if Client Project) */}
          {projectType === "Client Project" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-zinc-500 font-medium">Client</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
              />
            </div>
          )}

          {/* Assigned Team Members & Revenue Share % Section */}
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="pt-2">
              <label className="text-zinc-700 dark:text-zinc-300 font-bold block">Assign Team</label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="col-span-3 space-y-3 p-3.5 bg-zinc-50/80 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              {/* Selected Members with Revenue Share % */}
              {selectedMemberIds.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Configured Project Shares</span>
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold text-[11px]">
                      Total: {totalAssignedSharePct}% (₹{Math.round((numericProjectTotal * totalAssignedSharePct) / 100).toLocaleString("en-IN")})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedMemberIds.map((mId) => {
                      const m = teamMembers.find(
                        (t) => String(t.id).toLowerCase() === mId.toLowerCase()
                      ) || {
                        id: mId,
                        name: "Team Member",
                        role: "Developer",
                        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${mId}`,
                        email: "",
                      }
                      const shareVal = memberShares[mId] !== undefined ? memberShares[mId] : 15
                      const memberCalculatedAmt = Math.round((numericProjectTotal * shareVal) / 100)

                      return (
                        <div
                          key={mId}
                          className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs flex items-center justify-between gap-2.5"
                        >
                          {/* Member Info */}
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-7 h-7 rounded-full object-cover border border-purple-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                                {m.name}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">
                                {m.role}
                              </div>
                            </div>
                          </div>

                          {/* Payout Controls: % Share vs ₹ Manual Amount */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Mode Toggle Pills: % vs ₹ */}
                            <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => handlePayoutTypeChange(mId, "percentage")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  (memberPayoutTypes[mId] || "percentage") === "percentage"
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                }`}
                                title="Set percentage of project"
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePayoutTypeChange(mId, "fixed")}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  memberPayoutTypes[mId] === "fixed"
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                }`}
                                title="Type manual fixed amount in ₹"
                              >
                                ₹
                              </button>
                            </div>

                            {/* Value Input */}
                            {memberPayoutTypes[mId] === "fixed" ? (
                              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <span className="text-zinc-400 font-bold text-[11px]">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="5000"
                                  value={memberAmounts[mId] !== undefined ? memberAmounts[mId] : ""}
                                  onChange={(e) => handleAmountChange(mId, Number(e.target.value))}
                                  className="w-16 bg-transparent text-purple-600 dark:text-purple-400 font-bold text-left focus:outline-none text-xs"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={shareVal}
                                  onChange={(e) => handleShareChange(mId, Number(e.target.value))}
                                  className="w-10 bg-transparent text-purple-600 dark:text-purple-400 font-black text-center focus:outline-none text-xs"
                                />
                                <span className="text-zinc-400 font-bold text-[10px]">%</span>
                              </div>
                            )}

                            {/* Payout Preview Badge */}
                            <div className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-black text-[11px] border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                              {memberPayoutTypes[mId] === "fixed" ? (
                                <span>≈ {numericProjectTotal > 0 ? ((memberAmounts[mId] || 0) / numericProjectTotal * 100).toFixed(1) : 0}%</span>
                              ) : (
                                <span>₹{memberCalculatedAmt.toLocaleString("en-IN")}</span>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleToggleMember(m)}
                              className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Remove member"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Member Search Bar */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search team members by name, role, email..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Team Members Checkbox List */}
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900/60 rounded-xl p-1.5 border border-zinc-200/80 dark:border-zinc-700/60">
                {teamMembers.length === 0 ? (
                  <div className="py-4 text-center text-[11px] text-zinc-400">
                    Loading team members...
                  </div>
                ) : (
                  teamMembers
                    .filter((m) => {
                      if (!memberSearchQuery.trim()) return true
                      const q = memberSearchQuery.toLowerCase().trim()
                      return (
                        m.name.toLowerCase().includes(q) ||
                        m.role.toLowerCase().includes(q) ||
                        m.email.toLowerCase().includes(q)
                      )
                    })
                    .map((m) => {
                      const isSelected = selectedMemberIds.includes(String(m.id))
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggleMember(m)}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs ${
                            isSelected
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-medium leading-none truncate">{m.name}</div>
                              <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                                {m.role} {m.email ? `• ${m.email}` : ''}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] shrink-0 ml-2 ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && "✓"}
                          </div>
                        </button>
                      )
                    })
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Description</label>
            <div className="col-span-3 border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center gap-1 p-1.5 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 overflow-x-auto">
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Sparkles size={12} /></button>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Bold size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Italic size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Underline size={12} /></button>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><List size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><ListOrdered size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Table size={12} /></button>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Link2 size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Minus size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Maximize2 size={12} /></button>
                <button type="button" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"><Code size={12} /></button>
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

          {/* Price & Tax Details */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Price & Taxes</label>
            <div className="col-span-3 space-y-2.5">
              {/* Detailed Breakdown */}
              {(project.baseAmount !== undefined || project.gstAmount !== undefined || project.clientId || (project.items && project.items.length > 0)) ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700 pb-1.5">
                    <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🧾</span>
                      <span>Client Billing Breakdown</span>
                    </span>
                    {project.items && project.items.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {project.items.length} Itemized Service(s)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11.5px]">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 dark:text-zinc-400">Actual Base Price:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{(project.baseAmount ?? (project.totalAmount && project.gstAmount ? project.totalAmount - project.gstAmount : (parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0))).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {(project.setupCharge || 0) > 0 && (
                      <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
                        <span>Additional / Setup Charges:</span>
                        <span className="font-mono font-bold">
                          + ₹{project.setupCharge?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    {(project.discount || 0) > 0 && (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                        <span>Discount Applied:</span>
                        <span className="font-mono font-bold">
                          - ₹{project.discount?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                      <span>GST Tax ({project.gstRate || 18}%):</span>
                      <span className="font-mono font-bold">
                        + ₹{(project.gstAmount ?? (project.baseAmount ? Math.round(project.baseAmount * ((project.gstRate || 18) / 100)) : 0)).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-700 flex justify-between items-center font-extrabold text-slate-900 dark:text-slate-100">
                      <span>Total Price (With Tax):</span>
                      <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-black">
                        ₹{(project.totalAmount ?? (project.baseAmount ? (project.baseAmount + (project.gstAmount || Math.round(project.baseAmount * ((project.gstRate || 18) / 100)))) : (parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0))).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Editable Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Price (e.g. ₹35,000)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Labels with removable pills */}
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
                    className="hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer"
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
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Hold">Hold</option>
              <option value="Completed">Completed</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
          >
            <X size={14} />
            <span>Close</span>
          </button>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex items-center gap-1 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <Check size={14} />
            <span>Save</span>
          </button>
        </div>

      </div>
    </div>
  )
}
