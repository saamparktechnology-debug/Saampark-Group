"use client"

import * as React from "react"
import { X, Check, Users, Shield, UserCheck, Search, Percent, Sparkles, Building2 } from "lucide-react"
import { Project, ProjectType, ProjectMember, ProjectMilestone } from "../types"
import { addProject } from "../services/projectService"
import { getUsers } from "@/app/feature/users/services/userService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { UserService } from "@/services/apiServices"
import { useAuthStore } from "@/store/useAuthStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectAdded: (newProject: Project) => void
}

export function AddProjectModal({ isOpen, onClose, onProjectAdded }: AddProjectModalProps) {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const [title, setTitle] = React.useState("")
  const [projectType, setProjectType] = React.useState<ProjectType>("Client Project")
  const [client, setClient] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [baseAmount, setBaseAmount] = React.useState<number | "">("")
  const [setupCharge, setSetupCharge] = React.useState<number | "">("")
  const [discount, setDiscount] = React.useState<number | "">("")
  const [gstRate, setGstRate] = React.useState<number>(18)
  const [labels, setLabels] = React.useState("")
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([])
  const [memberShares, setMemberShares] = React.useState<Record<string, number>>({})
  const [memberSearchQuery, setMemberSearchQuery] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])

  React.useEffect(() => {
    if (isOpen) {
      // 1. Fetch team members reliably
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
      }).catch(() => {})

      // 2. Fetch real clients
      getClients().then((cls) => {
        setAvailableClients(cls.map(c => ({ name: c.name, email: c.email || "" })))
        if (cls.length > 0) setClient(cls[0].name)
      }).catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  // Computed numeric final price
  const numericComputedPrice = (typeof baseAmount === "number" && baseAmount > 0)
    ? (Math.max(0, baseAmount + (typeof setupCharge === "number" ? setupCharge : 0) - (typeof discount === "number" ? discount : 0)) +
       Math.round(Math.max(0, baseAmount + (typeof setupCharge === "number" ? setupCharge : 0) - (typeof discount === "number" ? discount : 0)) * (gstRate / 100)))
    : (parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0)

  const handleToggleMember = (mem: any) => {
    const memId = String(mem.id)
    setSelectedMemberIds((prev) => {
      if (prev.includes(memId)) {
        return prev.filter((id) => id !== memId)
      } else {
        if (memberShares[memId] === undefined) {
          setMemberShares((s) => ({ ...s, [memId]: 15 }))
        }
        return [...prev, memId]
      }
    })
  }

  const handleShareChange = (memId: string, shareVal: number) => {
    const clamped = isNaN(shareVal) ? 0 : Math.max(0, Math.min(100, shareVal))
    setMemberShares((prev) => ({
      ...prev,
      [memId]: clamped,
    }))
  }

  const totalAssignedSharePct = selectedMemberIds.reduce(
    (acc, mId) => acc + (memberShares[mId] !== undefined ? memberShares[mId] : 15),
    0
  )

  const handleSave = async (continueAdding = false) => {
    if (!title.trim()) {
      alert("Please enter a project title.")
      return
    }

    const assignedMembers: ProjectMember[] = selectedMemberIds.map((mId) => {
      const found = teamMembers.find(
        (t) => String(t.id).toLowerCase() === mId.toLowerCase()
      )
      const sharePct = memberShares[mId] !== undefined ? Number(memberShares[mId]) : 15
      return {
        id: mId,
        name: found?.name || "Team Member",
        role: found?.role || "Developer",
        avatar: found?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${found?.name || mId}`,
        email: found?.email || "",
        sharePercentage: sharePct,
      }
    })

    // Starter milestones
    const defaultMilestones: ProjectMilestone[] = [
      {
        id: `ms_fe_${Date.now()}`,
        title: "Frontend Development & UI",
        stage: "Frontend",
        status: "Pending",
        notes: "Next.js UI components and client view",
        updatedBy: assignedMembers[0]?.name || "Assigned Team",
        updatedAt: new Date().toISOString(),
      },
      {
        id: `ms_be_${Date.now() + 1}`,
        title: "Backend API & Database Integration",
        stage: "Backend",
        status: "Pending",
        notes: "MySQL Schema & Storage Sync endpoints",
        updatedBy: assignedMembers[0]?.name || "Assigned Team",
        updatedAt: new Date().toISOString(),
      }
    ]

    const labelsArray = labels.split(",").map(l => l.trim()).filter(Boolean)

    const finalPriceString = (typeof baseAmount === "number" && baseAmount > 0)
      ? `₹${numericComputedPrice.toLocaleString("en-IN")}`
      : (price || "₹0")

    const currentBranch = branches.find(b => b.id === activeBranchId)

    const newProjData: Omit<Project, "id"> = {
      title,
      projectType,
      client: projectType === "Client Project" ? (client || "Client") : "-",
      price: finalPriceString,
      startDate: startDate || new Date().toISOString().split('T')[0],
      deadline: deadline || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      progress: 0,
      status: "Open",
      labels: labelsArray.length > 0 ? labelsArray : ["Active"],
      description,
      members: assignedMembers,
      milestones: defaultMilestones,
      companyId: activeCompanyId || user?.companyId || "tech",
      branchId: activeBranchId || undefined,
      branchName: currentBranch?.name || undefined,
      baseAmount: typeof baseAmount === "number" ? baseAmount : undefined,
      setupCharge: typeof setupCharge === "number" ? setupCharge : undefined,
      discount: typeof discount === "number" ? discount : undefined,
      gstRate: gstRate,
      gstAmount: (typeof baseAmount === "number" && baseAmount > 0)
        ? Math.round(Math.max(0, baseAmount + (typeof setupCharge === "number" ? setupCharge : 0) - (typeof discount === "number" ? discount : 0)) * (gstRate / 100))
        : 0,
      totalAmount: numericComputedPrice,
      paymentStatus: "Payment Pending",
      paymentStructure: "Full",
      totalHours: 0,
    }

    setIsSubmitting(true)
    try {
      const created = await executeWithFeedback(
        () => addProject(newProjData),
        {
          loadingMsg: `Creating project "${title}"...`,
          successMsg: `Project "${title}" created successfully!`,
          errorMsg: "Failed to create project."
        }
      )

      if (created) {
        onProjectAdded(created)
        if (!continueAdding) {
          onClose()
        } else {
          setTitle("")
          setDescription("")
          setPrice("")
          setBaseAmount("")
          setSetupCharge("")
          setDiscount("")
          setLabels("")
          setSelectedMemberIds([])
          setMemberShares({})
        }
      }
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
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Add project
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
            <label className="text-zinc-500 font-medium">Title *</label>
            <input
              type="text"
              placeholder="Project Title"
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

          {/* Client Selection (only if Client Project) */}
          {projectType === "Client Project" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-zinc-500 font-medium">Client *</label>
              <div className="col-span-3">
                {availableClients.length > 0 ? (
                  <select
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
                  >
                    {availableClients.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
                  />
                )}
              </div>
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
                      Total: {totalAssignedSharePct}% (₹{Math.round((numericComputedPrice * totalAssignedSharePct) / 100).toLocaleString("en-IN")})
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
                      const memberCalculatedAmt = Math.round((numericComputedPrice * shareVal) / 100)

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

                          {/* Share % Input & Computed Amount */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                              <span className="text-[10px] text-zinc-500 font-semibold">Share:</span>
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

                            {/* Payout Preview Badge */}
                            <div className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-black text-[11px] border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                              ₹{memberCalculatedAmt.toLocaleString("en-IN")}
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
            <textarea
              rows={3}
              placeholder="Project description, scope, and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 text-xs resize-none"
            />
          </div>

          {/* Start date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Start date</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD or DD/MM/YYYY"
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
              placeholder="YYYY-MM-DD or DD/MM/YYYY"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          {/* Price & Billing Calculation */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Price & Tax Breakdown</label>
            <div className="col-span-3 space-y-2 p-3 bg-zinc-50 dark:bg-zinc-850/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-500 font-medium block text-[10.5px] mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={baseAmount}
                    onChange={(e) => {
                      const val = e.target.value
                      setBaseAmount(val === "" ? "" : Math.max(0, Number(val)))
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 font-medium block text-[10.5px] mb-1">Platform / Setup Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2500"
                    value={setupCharge}
                    onChange={(e) => {
                      const val = e.target.value
                      setSetupCharge(val === "" ? "" : Math.max(0, Number(val)))
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 font-medium block text-[10.5px] mb-1">Less: Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={discount}
                    onChange={(e) => {
                      const val = e.target.value
                      setDiscount(val === "" ? "" : Math.max(0, Number(val)))
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 font-medium block text-[10.5px] mb-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-semibold"
                  >
                    <option value={0}>0% (Non-GST / Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard GST)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              {/* Price Preview */}
              <div className="grid grid-cols-4 items-center gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                <label className="text-zinc-500 font-medium text-[11px]">Final Price</label>
                <div className="col-span-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Auto-calculated or custom"
                    value={
                      typeof baseAmount === "number" && baseAmount > 0
                        ? `₹${numericComputedPrice.toLocaleString("en-IN")}`
                        : price
                    }
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-bold font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Labels</label>
            <input
              type="text"
              placeholder="Labels (comma separated, e.g. Urgent, On track)"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
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
            onClick={() => handleSave(true)}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
          >
            <Check size={14} />
            <span>Save & continue</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
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
