"use client"

import * as React from "react"
import { 
  X, Check, Bold, Italic, Underline, List, ListOrdered, Table, Link2, Code, Sparkles, 
  Minus, Maximize2, Users, UserCheck, Search, Percent, ExternalLink, Globe, GitBranch, 
  Server, Layers, Megaphone, Video, Image as ImageIcon, Calendar, MapPin, Receipt, 
  RefreshCw, FileText, CheckCircle2, DollarSign, Clock
} from "lucide-react"
import { Project, ProjectMember, ProjectStatus, ProjectType, isMarketingProject } from "../types"
import { updateProject } from "../service/projectService"
import { getInvoices, updateInvoice } from "@/app/feature/sales/invoices/service/invoiceService"
import { getUsers } from "@/app/feature/users/service/userService"
import { UserService } from "@/services/apiServices"
import { ProjectCompletionModal } from "./ProjectCompletionModal"

interface EditProjectModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onProjectUpdated: (updatedProject: Project) => void
}

const toDateInputValue = (d: string) => {
  if (!d) return ""
  const trimmed = String(d).trim()
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-")
    return `${year}-${month}-${day}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0]
  }
  return trimmed
}

export function EditProjectModal({
  isOpen,
  project,
  onClose,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [title, setTitle] = React.useState("")
  const [projectType, setProjectType] = React.useState<ProjectType>("Client Project")
  const [projectCategory, setProjectCategory] = React.useState<"Technical Project" | "Digital Marketing Retainer">("Technical Project")
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
  const [isCompletionModalOpen, setIsCompletionModalOpen] = React.useState(false)

  // Technical Project specific state
  const [techStack, setTechStack] = React.useState<string[]>([])
  const [newTechInput, setNewTechInput] = React.useState("")
  const [gitUrl, setGitUrl] = React.useState("")
  const [liveUrl, setLiveUrl] = React.useState("")
  const [hostingEnvironment, setHostingEnvironment] = React.useState("Dedicated Linux VPS")
  const [scopeDeliverables, setScopeDeliverables] = React.useState("")

  // Digital Marketing Retainer specific state
  const [planTier, setPlanTier] = React.useState("Grow")
  const [postersQuota, setPostersQuota] = React.useState(12)
  const [reelsQuota, setReelsQuota] = React.useState(2)
  const [shootDate, setShootDate] = React.useState("")
  const [shootLocation, setShootLocation] = React.useState("")
  const [targetGeo, setTargetGeo] = React.useState("")
  const [monthlyAdBudget, setMonthlyAdBudget] = React.useState(0)
  const [driveUrl, setDriveUrl] = React.useState("")

  // Attached invoice state
  const [attachedInvoice, setAttachedInvoice] = React.useState<any | null>(null)
  const [isLoadingInvoice, setIsLoadingInvoice] = React.useState(false)

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
          const email = String(u.email || "").toLowerCase().trim()
          const isClient = role.includes("client")
          const isAdmin = role.includes("admin") || role.includes("super") || email.includes("superadmin") || email === "saampark.official@gmail.com"
          const isInactive = u.status === "Inactive"
          const uId = String(u.id || u._id || u.email)
          if (!isClient && !isAdmin && !isInactive && !unique.has(uId.toLowerCase())) {
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
      const isMkt = isMarketingProject(project)
      setProjectCategory(isMkt ? "Digital Marketing Retainer" : "Technical Project")

      setTitle(project.title || "")
      setProjectType(project.projectType || "Client Project")
      setClient(project.client || "")
      setDescription(project.description || "")
      setStartDate(project.startDate || "")
      setDeadline(project.deadline || "")
      setPrice(project.price || "")
      setLabelsList(project.labels || [])
      setStatus(project.status || "Open")

      // Tech details
      setTechStack(Array.isArray(project.techStack) && project.techStack.length > 0 ? project.techStack : ["Next.js", "React", "Node.js", "PostgreSQL"])
      setGitUrl(project.gitUrl || "")
      setLiveUrl(project.liveUrl || "")
      setHostingEnvironment(project.hostingEnvironment || "Dedicated Linux VPS")
      setScopeDeliverables(project.scopeDeliverables || "")

      // Marketing details
      const mkt = project.marketingRetainer || {}
      setPlanTier(mkt.planTier || project.marketingPackage?.planName || "Grow")
      setPostersQuota(mkt.postersQuota !== undefined ? mkt.postersQuota : (project.marketingPackage?.postersCount ?? 12))
      setReelsQuota(mkt.reelsQuota !== undefined ? mkt.reelsQuota : (project.marketingPackage?.reelsCount ?? 2))
      setShootDate(mkt.shootDate || "")
      setShootLocation(mkt.shootLocation || "")
      setTargetGeo(mkt.targetGeo || "")
      setMonthlyAdBudget(mkt.monthlyAdBudget || 0)
      setDriveUrl(mkt.driveUrl || "")

      // Fetch attached invoice
      setIsLoadingInvoice(true)
      getInvoices(project.companyId).then((invList) => {
        if (!Array.isArray(invList)) return
        const inv = invList.find((i: any) => 
          (project.invoiceId && (String(i.id) === String(project.invoiceId) || String(i.invoiceNumber) === String(project.invoiceId))) ||
          (project.invoiceNumber && (String(i.invoiceNumber) === String(project.invoiceNumber) || String(i.id) === String(project.invoiceNumber))) ||
          (String(i.project || "").trim().toLowerCase() === String(project.title || "").trim().toLowerCase() && 
           String(i.client || "").trim().toLowerCase() === String(project.client || "").trim().toLowerCase())
        )
        if (inv) {
          setAttachedInvoice(inv)
        }
      }).catch(console.error).finally(() => setIsLoadingInvoice(false))
      
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

  // Effective client paid amount: derived from attached invoice or project payments
  const clientPaidAmount = attachedInvoice && typeof attachedInvoice.paidAmount === "number"
    ? attachedInvoice.paidAmount
    : (typeof project.paidAmount === "number"
      ? project.paidAmount
      : (project.paymentStatus === "Paid" || project.status === "Completed"
        ? numericProjectTotal
        : (typeof project.advanceAmount === "number" ? project.advanceAmount : 0)))

  const clientDueAmount = Math.max(0, numericProjectTotal - clientPaidAmount)
  const clientPaidRatio = numericProjectTotal > 0 ? Math.min(1, clientPaidAmount / numericProjectTotal) : 0
  const isSubscriptionProject = projectCategory === "Digital Marketing Retainer" || Boolean(project.subscriptionId) || String(project.title).toLowerCase().includes("package") || String(project.title).toLowerCase().includes("retainer")

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

      if (status === "Completed" && project.status !== "Completed") {
        setIsCompletionModalOpen(true)
        return
      }

      // Live bidirectional sync: If price changed, update attached invoice!
      const newPriceNum = parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0
      if (attachedInvoice && newPriceNum > 0 && newPriceNum !== (attachedInvoice.totalAmount || 0)) {
        try {
          const invGstRate = attachedInvoice.gstRate || 18
          const invBase = attachedInvoice.invoiceType === "nongst" ? newPriceNum : Math.round(newPriceNum / (1 + invGstRate / 100))
          const invGst = newPriceNum - invBase
          const invDue = Math.max(0, newPriceNum - (attachedInvoice.paidAmount || 0))
          
          await updateInvoice({
            ...attachedInvoice,
            baseAmount: invBase,
            gstAmount: invGst,
            totalAmount: newPriceNum,
            due: `₹${invDue.toLocaleString("en-IN")}`,
            subtotal: invBase,
          }, attachedInvoice.companyId)
        } catch (syncErr) {
          console.warn("Could not sync invoice price:", syncErr)
        }
      }

      // Ensure appropriate labels list
      let finalLabels = [...labelsList]
      if (projectCategory === "Digital Marketing Retainer") {
        if (!finalLabels.includes("Digital Marketing")) finalLabels.push("Digital Marketing")
      } else {
        finalLabels = finalLabels.filter((l) => l.toLowerCase() !== "digital marketing")
      }

      const updated = await updateProject(project.id, {
        title,
        projectType,
        client: projectType === "Client Project" ? client : "-",
        description,
        startDate,
        deadline,
        price,
        labels: finalLabels,
        status,
        members: assignedMembers,
        progress: (status === "Completed" || status === "Finished") ? 100 : (status === "Open" ? 0 : (project.progress === 100 ? 50 : project.progress)),
        category: projectCategory === "Digital Marketing Retainer" ? "Digital Marketing" : (project.category || "Website"),
        techStack: projectCategory === "Technical Project" ? techStack : undefined,
        gitUrl: projectCategory === "Technical Project" ? gitUrl : undefined,
        liveUrl: projectCategory === "Technical Project" ? liveUrl : undefined,
        hostingEnvironment: projectCategory === "Technical Project" ? hostingEnvironment : undefined,
        scopeDeliverables: projectCategory === "Technical Project" ? scopeDeliverables : undefined,
        marketingRetainer: projectCategory === "Digital Marketing Retainer" ? {
          planTier,
          postersQuota,
          reelsQuota,
          shootDate,
          shootLocation,
          targetGeo,
          monthlyAdBudget,
          driveUrl,
        } : undefined,
        paidAmount: clientPaidAmount,
        dueAmount: clientDueAmount,
        invoiceId: attachedInvoice?.id || project.invoiceId,
        invoiceNumber: attachedInvoice?.invoiceNumber || project.invoiceNumber,
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
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Edit Project
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
              projectCategory === "Digital Marketing Retainer"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}>
              {projectCategory === "Digital Marketing Retainer" ? "Digital Marketing Retainer" : "Technical Project"}
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

        {/* Project Architecture Specification Pill Selector */}
        <div className="px-6 py-2.5 bg-zinc-50/90 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Architecture Type:
          </span>
          <div className="inline-flex rounded-xl p-0.5 bg-zinc-200/70 dark:bg-zinc-700/60 border border-zinc-300 dark:border-zinc-600 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setProjectCategory("Technical Project")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                projectCategory === "Technical Project"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              }`}
            >
              <Code size={13} />
              <span>Normal / Tech Project</span>
            </button>
            <button
              type="button"
              onClick={() => setProjectCategory("Digital Marketing Retainer")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                projectCategory === "Digital Marketing Retainer"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              }`}
            >
              <Megaphone size={13} />
              <span>Digital Marketing Retainer</span>
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Attached Invoice Direct Sync Card */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                <Receipt size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Attached Invoice: {attachedInvoice?.invoiceNumber || project.invoiceNumber || project.invoiceId || "Live Synced"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    clientPaidAmount >= numericProjectTotal && numericProjectTotal > 0
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : clientPaidAmount > 0
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {clientPaidAmount >= numericProjectTotal && numericProjectTotal > 0 ? "Fully Paid" : clientPaidAmount > 0 ? "Advance Received" : "Payment Pending"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Project price is attached to invoice. Modifying price synchronizes the official invoice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-[11px]">
              <div className="text-right">
                <span className="text-zinc-400 block text-[10px]">Client Paid</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{clientPaidAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block text-[10px]">Balance Due</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{clientDueAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium">Title</label>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-semibold"
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

          {/* DEDICATED SPECIFICATIONS CARD: NORMAL TECH PROJECT */}
          {projectCategory === "Technical Project" && (
            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider pb-1 border-b border-blue-100 dark:border-blue-900/40">
                <Code size={14} />
                <span>Technical Project Architecture & Environment</span>
              </div>

              {/* Tech Stack Pills */}
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                  Technology Stack
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg min-h-[38px]">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      <button
                        type="button"
                        onClick={() => setTechStack(techStack.filter((t) => t !== tech))}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                      {tech}
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tech (e.g. Next.js, Flutter) & hit Enter..."
                    value={newTechInput}
                    onChange={(e) => setNewTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (newTechInput.trim() && !techStack.includes(newTechInput.trim())) {
                          setTechStack([...techStack, newTechInput.trim()])
                          setNewTechInput("")
                        }
                      }
                    }}
                    className="flex-1 bg-transparent border-none focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 text-xs min-w-[120px]"
                  />
                </div>
                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["Next.js", "React", "Node.js", "Flutter", "PostgreSQL", "Docker", "Tailwind"].map((sug) => (
                    !techStack.includes(sug) && (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTechStack([...techStack, sug])}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        + {sug}
                      </button>
                    )
                  ))}
                </div>
              </div>

              {/* Git URL & Live URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <GitBranch size={12} className="text-zinc-400" />
                    <span>Git Repository URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/saampark/..."
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Globe size={12} className="text-zinc-400" />
                    <span>Live / Staging Domain</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://gramgo.in"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Hosting Environment */}
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                  <Server size={12} className="text-zinc-400" />
                  <span>Hosting Infrastructure & Server</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated Linux VPS (Hostinger / DigitalOcean), AWS EC2, Vercel"
                  value={hostingEnvironment}
                  onChange={(e) => setHostingEnvironment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* DEDICATED SPECIFICATIONS CARD: DIGITAL MARKETING RETAINER */}
          {projectCategory === "Digital Marketing Retainer" && (
            <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider pb-1 border-b border-purple-100 dark:border-purple-900/40">
                <Megaphone size={14} />
                <span>Digital Marketing Campaign & Retainer Quotas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Retainer Plan Tier
                  </label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-semibold cursor-pointer"
                  >
                    <option value="Starter">Package 01 - Starter</option>
                    <option value="Grow">Package 02 - Grow</option>
                    <option value="Scale">Package 03 - Scale</option>
                    <option value="Enterprise">Enterprise / Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <ImageIcon size={12} className="text-purple-500" />
                    <span>Monthly Posters Quota</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={postersQuota}
                    onChange={(e) => setPostersQuota(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Video size={12} className="text-purple-500" />
                    <span>Monthly Reels / Shorts Quota</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reelsQuota}
                    onChange={(e) => setReelsQuota(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-zinc-400" />
                    <span>Model Shoot Date</span>
                  </label>
                  <input
                    type="date"
                    value={toDateInputValue(shootDate)}
                    onChange={(e) => setShootDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-zinc-400" />
                    <span>Target Geography & Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kolkata, West Bengal, 15km radius"
                    value={targetGeo}
                    onChange={(e) => setTargetGeo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <DollarSign size={12} className="text-emerald-500" />
                    <span>Monthly Ad Spend Budget (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={monthlyAdBudget || ""}
                    onChange={(e) => setMonthlyAdBudget(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                    <Link2 size={12} className="text-zinc-400" />
                    <span>Creative Drive Assets URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-[11px]"
                  />
                </div>
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
                      const memberTotalPayout = memberPayoutTypes[mId] === "fixed"
                        ? (memberAmounts[mId] || 0)
                        : Math.round((numericProjectTotal * shareVal) / 100)
                      const memberEarnedPayout = Math.round(clientPaidRatio * memberTotalPayout)
                      const memberPendingPayout = Math.max(0, memberTotalPayout - memberEarnedPayout)

                      return (
                        <div
                          key={mId}
                          className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2.5">
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
                                  <span>₹{memberTotalPayout.toLocaleString("en-IN")}</span>
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

                          {/* Pro-Rata Commission Attribution Breakdown */}
                          <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 grid grid-cols-3 gap-2 text-[10.5px]">
                            <div className="bg-purple-50/60 dark:bg-purple-950/40 p-2 rounded-lg border border-purple-100 dark:border-purple-900/40">
                              <div className="text-zinc-500 text-[10px]">Total Potential</div>
                              <div className="font-bold font-mono text-purple-700 dark:text-purple-300">
                                ₹{memberTotalPayout.toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                              <div className="text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] flex items-center justify-between">
                                <span>Earned (Pro-Rata)</span>
                                <span className="text-[9px] font-bold">{(clientPaidRatio * 100).toFixed(0)}%</span>
                              </div>
                              <div className="font-black font-mono text-emerald-700 dark:text-emerald-300">
                                ₹{memberEarnedPayout.toLocaleString("en-IN")}
                              </div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                                {clientPaidAmount > 0 ? `Against ₹${clientPaidAmount.toLocaleString("en-IN")} paid` : "Pending client payment"}
                              </div>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                              <div className="text-amber-700 dark:text-amber-300 font-semibold text-[10px]">Pending Due</div>
                              <div className="font-bold font-mono text-amber-700 dark:text-amber-300">
                                ₹{memberPendingPayout.toLocaleString("en-IN")}
                              </div>
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                                {clientDueAmount > 0 ? `On client balance ₹${clientDueAmount.toLocaleString("en-IN")}` : "Fully settled"}
                              </div>
                            </div>
                          </div>

                          {isSubscriptionProject && (
                            <div className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[10.5px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-between">
                              <span>🔄 Retainer Recurring Payout:</span>
                              <span className="font-mono font-bold">
                                ₹{memberTotalPayout.toLocaleString("en-IN")} / monthly cycle paid
                              </span>
                            </div>
                          )}
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
            <label className="text-zinc-500 font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-zinc-400" />
              <span>Start date</span>
            </label>
            <input
              type="date"
              value={toDateInputValue(startDate)}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 font-mono text-xs cursor-pointer"
            />
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-zinc-500 font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-zinc-400" />
              <span>Deadline</span>
            </label>
            <input
              type="date"
              value={toDateInputValue(deadline)}
              onChange={(e) => setDeadline(e.target.value)}
              className="col-span-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-red-600 dark:text-red-400 font-mono text-xs font-bold cursor-pointer"
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
              <option value="Under Review">Under Review</option>
              <option value="Hold">Hold</option>
              <option value="Completed">Completed</option>
              <option value="Finished">Finished</option>
              <option value="Cancelled">Cancelled</option>
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

      {isCompletionModalOpen && (
        <ProjectCompletionModal
          isOpen={isCompletionModalOpen}
          project={project}
          onClose={() => setIsCompletionModalOpen(false)}
          onConfirmComplete={async (completedData) => {
            const { sendProjectCompletionEmailNotification } = await import("@/services/emailNotificationService")

            const currentMembers: ProjectMember[] = selectedMemberIds.map((mId) => {
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
              status: "Completed",
              members: currentMembers,
              progress: 100,
              completedAt: new Date().toISOString(),
              countdownStartDate: completedData.countdownStartDate,
              countdownEndDate: completedData.countdownEndDate,
              planDuration: completedData.planDuration,
              planType: completedData.planType as any,
              firstPostDate: completedData.firstPostDate,
              clientEmail: completedData.clientEmail,
            })

            onProjectUpdated(updated)
            setIsCompletionModalOpen(false)
            onClose()

            if (completedData.notifyClient && completedData.clientEmail) {
              await sendProjectCompletionEmailNotification(
                updated,
                completedData.clientEmail,
                client || project.client,
                {
                  planType: completedData.planType,
                  countdownDuration: completedData.planDuration,
                  countdownStartDate: completedData.countdownStartDate,
                  countdownEndDate: completedData.countdownEndDate,
                  countdownNotice: completedData.planType === "digital_marketing"
                    ? (completedData.firstPostDate 
                        ? `Campaign timeline started from 1st post on ${completedData.firstPostDate} and expires on ${completedData.countdownEndDate}.`
                        : "Campaign countdown paused until first creative post goes live.")
                    : `Your service & hosting countdown started today (${new Date().toLocaleDateString("en-IN")}) and remains active until ${completedData.countdownEndDate}.`,
                }
              )
            }
          }}
        />
      )}
    </div>
  )
}
