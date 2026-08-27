"use client"

import * as React from "react"
import { X, Check, Users, Shield, UserCheck } from "lucide-react"
import { Project, ProjectType, ProjectMember, ProjectMilestone } from "../types"
import { addProject } from "../services/projectService"
import { getUsers } from "@/app/feature/users/services/userService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { useAuthStore } from "@/store/useAuthStore"

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
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])

  React.useEffect(() => {
    if (isOpen) {
      getUsers().then((allUsers) => {
        const onlyTeam = allUsers.filter((u) => {
          const role = (u.role || "").toLowerCase().trim()
          return !role.includes("admin") && !role.includes("super") && !role.includes("client") && role !== "owner" && u.status !== "Inactive"
        })
        setTeamMembers(onlyTeam)
      }).catch(() => {})

      // 2. Fetch real clients
      getClients().then((cls) => {
        setAvailableClients(cls.map(c => ({ name: c.name, email: c.email || "" })))
        if (cls.length > 0) setClient(cls[0].name)
      }).catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleToggleMember = (mem: any) => {
    setSelectedMemberIds((prev) =>
      prev.includes(mem.id) ? prev.filter((id) => id !== mem.id) : [...prev, mem.id]
    )
  }

  const handleSave = async (continueAdding = false) => {
    if (!title.trim()) {
      alert("Please enter a project title.")
      return
    }

    const assignedMembers: ProjectMember[] = teamMembers
      .filter((m) => selectedMemberIds.includes(m.id))
      .map((m) => ({
        id: String(m.id),
        name: m.name,
        role: m.department || "Developer",
        avatar: m.avatar || m.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`,
        email: m.email,
      }))

    // Initial starter milestones for the assigned developer
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
        notes: "Server endpoints, MySQL schema, and sync",
        updatedBy: assignedMembers[0]?.name || "Assigned Team",
        updatedAt: new Date().toISOString(),
      },
    ]

    setIsSubmitting(true)
    const numBase = typeof baseAmount === "number" ? baseAmount : 0
    const numSetup = typeof setupCharge === "number" ? setupCharge : 0
    const numDiscount = typeof discount === "number" ? discount : 0
    const taxableBase = Math.max(0, numBase + numSetup - numDiscount)
    const gstAmount = Math.round(taxableBase * (gstRate / 100))
    const totalAmount = taxableBase + gstAmount

    const formattedPrice = totalAmount > 0 
      ? `₹${totalAmount.toLocaleString("en-IN")}`
      : price ? (price.startsWith("$") || price.startsWith("₹") ? price : `₹${price}`) : "-"

    const currentBranchObj = branches.find(b => b.id === (activeBranchId || user?.branchId))
    const finalBranchName = currentBranchObj?.name || user?.branchName || undefined

    setIsSubmitting(true)
    try {
      const created = await addProject({
        title,
        projectType,
        client: projectType === "Client Project" ? (client || (availableClients[0]?.name ?? "Direct Client")) : "Internal Operations",
        price: formattedPrice,
        baseAmount: numBase > 0 ? numBase : undefined,
        setupCharge: numSetup > 0 ? numSetup : undefined,
        discount: numDiscount > 0 ? numDiscount : undefined,
        gstRate,
        gstAmount: gstAmount > 0 ? gstAmount : undefined,
        totalAmount: totalAmount > 0 ? totalAmount : undefined,
        startDate: startDate || new Date().toLocaleDateString("en-GB"),
        deadline: deadline || new Date().toLocaleDateString("en-GB"),
        progress: 0,
        status: "Open",
        labels: labels ? labels.split(",").map(l => l.trim()).filter(Boolean) : [],
        description,
        billedBy: user?.name || "Admin",
        members: assignedMembers,
        milestones: defaultMilestones,
        branchId: activeBranchId || user?.branchId || undefined,
        branchName: finalBranchName,
        companyId: activeCompanyId || user?.companyId || "tech",
      })

      onProjectAdded(created)

      if (continueAdding) {
        setTitle("")
        setDescription("")
        setPrice("")
        setBaseAmount("")
        setSetupCharge("")
        setDiscount("")
        setLabels("")
        setStartDate("")
        setDeadline("")
        setSelectedMemberIds([])
      } else {
        onClose()
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
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Add project</h2>
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
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Project Type */}
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

          {/* Client (if Client Project) */}
          {projectType === "Client Project" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-zinc-500 font-medium">Client *</label>
              {availableClients.length > 0 ? (
                <select
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
                >
                  {availableClients.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Client Name"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
                />
              )}
            </div>
          )}

          {/* Assign Team (Team Members ONLY) */}
          <div className="grid grid-cols-4 items-start gap-4 pt-1">
            <div className="text-zinc-500 font-medium pt-1 flex flex-col">
              <span>Assign Team</span>
              <span className="text-[10px] text-blue-600 font-normal">Team Members Only</span>
            </div>
            <div className="col-span-3 space-y-2">
              {teamMembers.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 text-center text-[11px]">
                  No team members found. (Team members can be added under Users)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  {teamMembers.map((tm) => {
                    const isSelected = selectedMemberIds.includes(tm.id)
                    return (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => handleToggleMember(tm)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-2xs"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <img
                          src={tm.avatar || tm.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${tm.name}`}
                          alt={tm.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200 truncate">{tm.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{tm.department || "Developer / Team"}</p>
                        </div>
                        {isSelected && <UserCheck size={14} className="text-blue-600 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Billed By (Admin in charge) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Billed By</label>
            <div className="col-span-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-between">
              <span>{user?.name || "Admin"}</span>
              <span className="text-[10px] text-zinc-400 bg-white dark:bg-zinc-700 px-2 py-0.5 rounded">Admin In Charge</span>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-zinc-500 font-medium pt-2">Description</label>
            <textarea
              rows={3}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Start date</label>
            <input
              type="text"
              placeholder="Start date (e.g. 20-06-2026)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Deadline</label>
            <input
              type="text"
              placeholder="Deadline (e.g. 08-08-2026)"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>

          {/* Financial Breakdown: Base, Setup Charge, Discount, GST */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
              Financial Terms & Pricing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-zinc-500 font-medium block text-[10.5px] mb-1">Base Deal Amount (₹)</label>
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

            {/* Price Preview / Override */}
            <div className="grid grid-cols-4 items-center gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
              <label className="text-zinc-500 font-medium text-[11px]">Final Price</label>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Auto-calculated or custom (e.g. ₹55,000)"
                  value={
                    typeof baseAmount === "number" && baseAmount > 0
                      ? `₹${(Math.max(0, baseAmount + (typeof setupCharge === "number" ? setupCharge : 0) - (typeof discount === "number" ? discount : 0)) + Math.round(Math.max(0, baseAmount + (typeof setupCharge === "number" ? setupCharge : 0) - (typeof discount === "number" ? discount : 0)) * (gstRate / 100))).toLocaleString("en-IN")}`
                      : price
                  }
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-800 dark:text-zinc-200 font-bold"
                />
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

        {/* Footer Buttons matching Image 3 */}
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
            onClick={() => handleSave(true)}
            className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <Check size={14} />
            <span>Save & continue</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
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
