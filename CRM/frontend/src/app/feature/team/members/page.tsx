"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Download, Mail, X, ExternalLink, CheckCircle2, 
  Briefcase, CheckSquare, Clock, Phone, User, Shield, Building2, Eye,
  DollarSign, Percent, Sparkles, RefreshCw, Lock, Layers, Trash2, Pencil,
  CreditCard, Calendar, FolderKanban, Check, ChevronRight
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { Task } from "@/app/feature/tasks/types"
import { getUsers, getUserAvatar, deleteUser } from "@/app/feature/users/services/userService"
import { getSubscriptions } from "@/app/feature/subscriptions/services/subscriptionService"
import { Subscription, calculateTeamRevenueShare } from "@/app/feature/subscriptions/types"
import { getProjectWiseUserEarnings, getTeamBankingMap, updateMemberBankingDetails } from "../services/teamPaymentService"
import { ProjectUserEarningsRecord, TeamMemberBankingInfo } from "../types"
import { AddTeamMemberModal } from "../components/AddTeamMemberModal"
import { EditTeamMemberModal } from "../components/EditTeamMemberModal"
import { RecordPayoutModal } from "../components/RecordPayoutModal"
import { confirmTwoStepDelete } from "@/lib/confirmDialog"

export type TeamMember = {
  id: string
  name: string
  avatarUrl: string
  jobTitle: string
  email: string
  phone: string
  department?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subbranchName?: string
  companyId?: string
  status: "Online" | "Offline"
  assignedTasksCount: number
  activeTasks: Task[]
  assignedSubscriptions: Subscription[]
  totalMonthlyCommission: number
  assignedProjects: ProjectUserEarningsRecord[]
  totalProjectEarnings: number
  bankingInfo?: TeamMemberBankingInfo
}

export default function TeamMembersPage() {
  const { activeCompanyId, activeBranchId, branches, subBranches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin"
  const isCompanyAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower === "admin"
  )
  const isSingleBranchAdmin = Boolean(
    !isSuperAdmin &&
    user?.branchId && 
    (roleLower.includes("branch admin") || roleLower.includes("branch manager") || roleLower.includes("branch"))
  )

  // Permissions
  const canAddMember = canPerformAction(user, "Teams", "add") || isSuperAdmin || isCompanyAdmin
  const canEditMember = canPerformAction(user, "Teams", "edit") || isSuperAdmin || isCompanyAdmin
  const canDeleteMember = canPerformAction(user, "Teams", "delete") || isSuperAdmin || isCompanyAdmin
  const canDisbursePayout = canPerformAction(user, "Teams", "add") || isSuperAdmin || isCompanyAdmin

  // Branch & Sub-Branch Filter Selectors
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("all")
  const [selectedSubBranchId, setSelectedSubBranchId] = React.useState<string>("all")

  React.useEffect(() => {
    if (isSingleBranchAdmin && user?.branchId) {
      setSelectedBranchId(user.branchId)
    } else if (activeBranchId) {
      setSelectedBranchId(activeBranchId)
    } else {
      setSelectedBranchId("all")
    }
  }, [isSingleBranchAdmin, user?.branchId, activeBranchId])

  // Filter available sub-branches based on selected branch
  const availableSubBranches = React.useMemo(() => {
    if (selectedBranchId === "all") return subBranches
    return subBranches.filter(sb => sb.parentBranchId === selectedBranchId)
  }, [subBranches, selectedBranchId])

  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null)
  const [drawerActiveTab, setDrawerActiveTab] = React.useState<"overview" | "projects" | "subs" | "tasks" | "banking">("overview")
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null)
  const [payingMember, setPayingMember] = React.useState<TeamMember | null>(null)

  // Inline banking edit in drawer
  const [isEditingBankingInline, setIsEditingBankingInline] = React.useState(false)
  const [inlineBankName, setInlineBankName] = React.useState("")
  const [inlineAccountNum, setInlineAccountNum] = React.useState("")
  const [inlineIfsc, setInlineIfsc] = React.useState("")
  const [inlineUpi, setInlineUpi] = React.useState("")
  const [inlineSalary, setInlineSalary] = React.useState<number | "">("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const comp = activeCompanyId || "tech"
      const [userRes, allTasks, allSubs, allProjEarnings, bankingMap] = await Promise.all([
        getUsers(comp).catch(() => []),
        taskService.getTasks().catch(() => []),
        getSubscriptions(comp).catch(() => []),
        getProjectWiseUserEarnings(comp, selectedBranchId, selectedSubBranchId).catch(() => []),
        getTeamBankingMap(comp).catch(() => ({})),
      ])

      if (Array.isArray(userRes)) {
        // Filter strictly to non-clients
        let rawMembers = userRes.filter((u: any) => {
          const r = (u.role || u.role_name || "").toLowerCase().trim()
          return !r.includes("client") && u.status !== "Inactive"
        })

        // Filter by Branch if selected
        if (selectedBranchId && selectedBranchId !== "all") {
          rawMembers = rawMembers.filter((u: any) => {
            const uBranch = u.branchId || u.branch_id
            const uBranchIds = u.branchIds || []
            return uBranch === selectedBranchId || uBranchIds.includes(selectedBranchId)
          })
        }

        // Filter by Sub-Branch if selected
        if (selectedSubBranchId && selectedSubBranchId !== "all") {
          rawMembers = rawMembers.filter((u: any) => {
            const uSub = u.subBranchId || u.subbranch_id || u.subbranchName || u.subbranch
            return uSub === selectedSubBranchId
          })
        }

        const live: TeamMember[] = rawMembers.map((u: any, idx: number) => {
          const mName = u.name || u.full_name || u.email || "Team Member"
          const mEmail = (u.email || "").toLowerCase().trim()
          const memberId = String(u.id || idx)

          // Filter assigned tasks that are not Done
          const memberTasks = allTasks.filter((t) => {
            const assigned = (t.assignedTo || "").toLowerCase().trim()
            const isAssigned = assigned === mName.toLowerCase().trim() || (mEmail && assigned.includes(mEmail))
            return isAssigned && t.status !== "Done"
          })

          // Filter assigned subscriptions
          const memberSubs = (Array.isArray(allSubs) ? allSubs : []).filter((s: Subscription) => {
            const byEmail = (s.assignedMemberEmail || "").toLowerCase().trim() === mEmail ||
              (Array.isArray(s.assignedMembers) && s.assignedMembers.some(em => em.toLowerCase().trim() === mEmail))
            const byName = (s.assignedMemberName || "").toLowerCase().trim() === mName.toLowerCase().trim()
            const byId = s.assignedMemberId && String(s.assignedMemberId) === memberId
            return Boolean(byEmail || byName || byId)
          })

          const totalMonthlyCommission = memberSubs.reduce((acc, sub) => {
            const calc = calculateTeamRevenueShare(sub)
            return acc + calc.monthlyRevenue
          }, 0)

          // Filter assigned projects
          const memberProjects = allProjEarnings.filter(p => 
            String(p.memberId).toLowerCase().trim() === memberId.toLowerCase().trim() ||
            (p.memberEmail && mEmail && p.memberEmail.toLowerCase().trim() === mEmail)
          )
          const totalProjectEarnings = memberProjects.reduce((acc, p) => acc + p.memberTotalEarned, 0)

          const bankMap: Record<string, TeamMemberBankingInfo> = (bankingMap as any) || {}
          const bInfo: TeamMemberBankingInfo = bankMap[memberId.toLowerCase()] || bankMap[mEmail] || {
            memberId,
            baseSalary: u.salary ? Number(u.salary) : (u.baseSalary ? Number(u.baseSalary) : 0),
            bankName: u.bankName || u.bankingInfo?.bankName || "",
            accountNumber: u.accountNumber || u.bankingInfo?.accountNumber || "",
            ifscCode: u.ifscCode || u.bankingInfo?.ifscCode || "",
            accountHolderName: u.accountHolderName || u.bankingInfo?.accountHolderName || "",
            upiId: u.upiId || u.bankingInfo?.upiId || "",
          }

          return {
            id: memberId,
            name: mName,
            avatarUrl: u.avatarUrl || u.avatar_url || u.avatar || getUserAvatar(mName, undefined, mName),
            jobTitle: u.role || u.role_name || "Technical Lead",
            email: u.email || "-",
            phone: u.phone || "+91 98765 43210",
            department: u.department || "Engineering & Delivery",
            branchId: u.branchId || u.branch_id,
            branchName: u.branchName || u.branch_name,
            subBranchId: u.subBranchId || u.subbranch_id,
            subbranchName: u.subbranchName || u.subbranch,
            companyId: u.companyId || comp,
            status: u.status === "active" || idx % 2 === 0 ? "Online" : "Offline",
            assignedTasksCount: memberTasks.length,
            activeTasks: memberTasks,
            assignedSubscriptions: memberSubs,
            totalMonthlyCommission,
            assignedProjects: memberProjects,
            totalProjectEarnings,
            bankingInfo: bInfo,
          }
        })
        setMembers(live)
      }
    } catch (err) {
      console.error("Error loading team members API:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId, selectedBranchId, selectedSubBranchId])

  React.useEffect(() => {
    loadData()
    const handleReload = () => loadData()
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_subbranches_updated", handleReload)
    window.addEventListener("saampark_users_updated", handleReload)
    window.addEventListener("saampark_team_members_updated", handleReload)
    window.addEventListener("saampark_team_banking_updated", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_subbranches_updated", handleReload)
      window.removeEventListener("saampark_users_updated", handleReload)
      window.removeEventListener("saampark_team_members_updated", handleReload)
      window.removeEventListener("saampark_team_banking_updated", handleReload)
    }
  }, [loadData])

  // Delete Member Handler
  const handleDeleteMember = async (member: TeamMember) => {
    if (!canDeleteMember) {
      alert("You do not have permission to delete team members.")
      return
    }

    if (await confirmTwoStepDelete(member.name, "team member")) {
      await deleteUser(member.id || member.email, activeCompanyId || "tech")
      showToast(`🗑️ Team member "${member.name}" removed successfully.`)
      if (selectedMember?.id === member.id) {
        setSelectedMember(null)
      }
      loadData()
    }
  }

  // Open inline banking editor inside drawer
  const handleOpenInlineBanking = (member: TeamMember) => {
    setInlineBankName(member.bankingInfo?.bankName || "")
    setInlineAccountNum(member.bankingInfo?.accountNumber || "")
    setInlineIfsc(member.bankingInfo?.ifscCode || "")
    setInlineUpi(member.bankingInfo?.upiId || "")
    setInlineSalary(member.bankingInfo?.baseSalary ?? 0)
    setIsEditingBankingInline(true)
  }

  // Save inline banking inside drawer
  const handleSaveInlineBanking = async (member: TeamMember) => {
    await updateMemberBankingDetails(member.id, {
      bankName: inlineBankName.trim() || undefined,
      accountNumber: inlineAccountNum.trim() || undefined,
      ifscCode: inlineIfsc.trim() || undefined,
      upiId: inlineUpi.trim() || undefined,
      baseSalary: typeof inlineSalary === "number" ? inlineSalary : 0,
      accountHolderName: member.name,
    }, activeCompanyId || "tech")

    setIsEditingBankingInline(false)
    showToast("✅ Banking and compensation details updated!")
    loadData()
  }

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Team Member",
      cell: ({ row }) => (
        <div 
          onClick={() => {
            setSelectedMember(row.original)
            setDrawerActiveTab("overview")
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <img src={row.original.avatarUrl} alt={row.getValue("name")} className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition-all" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${row.original.status === "Online" ? "bg-emerald-500" : "bg-zinc-400"}`} />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>{row.getValue("name")}</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "jobTitle",
      header: "Role & Branch Scope",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-zinc-800 dark:text-zinc-200">{row.original.jobTitle}</div>
          <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
            <span>{row.original.department}</span>
            {row.original.branchName && (
              <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                📍 {row.original.branchName}
              </span>
            )}
            {row.original.subbranchName && (
              <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                🏢 {row.original.subbranchName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "assignedProjects",
      header: "Projects & Share",
      cell: ({ row }) => {
        const projCount = row.original.assignedProjects.length
        const totalEarned = row.original.totalProjectEarnings
        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              <FolderKanban size={13} />
              <span>₹{totalEarned.toLocaleString("en-IN")} Earned</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              {projCount > 0 ? `${projCount} Assigned Project(s)` : "No Projects Assigned"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "assignedSubscriptions",
      header: "Subscriptions Share",
      cell: ({ row }) => {
        const subsCount = row.original.assignedSubscriptions.length
        const monthlyComm = row.original.totalMonthlyCommission
        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles size={12} />
              <span>₹{monthlyComm.toLocaleString("en-IN")}/mo</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              {subsCount > 0 ? `${subsCount} Managed Client Subs` : "0 Subscriptions"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "assignedTasksCount",
      header: "Active Workload",
      cell: ({ row }) => {
        const count = row.original.assignedTasksCount
        return (
          <div>
            {count === 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <CheckCircle2 size={12} />
                <span>Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <CheckSquare size={12} />
                <span>Assigned ({count})</span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectedMember(row.original)
              setDrawerActiveTab("overview")
            }}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            title="View Dossier"
          >
            <Eye size={14} />
          </button>

          {canEditMember && (
            <button
              type="button"
              onClick={() => setEditingMember(row.original)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Edit Member Profile"
            >
              <Pencil size={14} />
            </button>
          )}

          {canDisbursePayout && (
            <button
              type="button"
              onClick={() => setPayingMember(row.original)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
              title="Record / Disburse Payment"
            >
              <CreditCard size={14} />
            </button>
          )}

          {canDeleteMember && (
            <button
              type="button"
              onClick={() => handleDeleteMember(row.original)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Delete Member"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    }
  ]

  const freeCount = members.filter(m => m.assignedTasksCount === 0).length
  const busyCount = members.filter(m => m.assignedTasksCount > 0).length

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[999999] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border border-zinc-700"
          >
            <Sparkles size={16} className="text-blue-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <User size={18} />
            </div>
            <span>Team Members & Workload Hub</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Directory of company, branch, and sub-branch staff with active deliverables, revenue share rates, and instant compensation payouts.
          </p>
        </div>

        {/* Branch & Sub-Branch Scoping Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Filter Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs">
            <Building2 size={13} className="text-zinc-400 shrink-0" />
            <select
              value={selectedBranchId}
              disabled={isSingleBranchAdmin}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-bold text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer disabled:cursor-not-allowed text-xs"
            >
              {!isSingleBranchAdmin && (
                <>
                  <option value="all">🏢 All Branches & HQ</option>
                  <option value="hq">🏢 Central Office / HQ</option>
                </>
              )}
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.code || 'Branch'})
                </option>
              ))}
            </select>
            {isSingleBranchAdmin && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1 flex items-center gap-0.5" title="Branch is locked to your assigned branch">
                <Lock size={10} />
              </span>
            )}
          </div>

          {/* Sub-Branch Filter Selector */}
          {availableSubBranches.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
              <Layers size={13} className="text-purple-500 shrink-0" />
              <select
                value={selectedSubBranchId}
                onChange={(e) => setSelectedSubBranchId(e.target.value)}
                className="bg-transparent font-bold text-purple-900 dark:text-purple-200 focus:outline-hidden cursor-pointer text-xs"
              >
                <option value="all">🌐 All Sub-Branches</option>
                {availableSubBranches.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    🏢 {sb.name} ({sb.code || 'Sub-Branch'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {canAddMember && (
            <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={() => setIsAddMemberOpen(true)}>
              Add Member
            </Button>
          )}

          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={13} />} onClick={() => loadData()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Team Size</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{members.length} Members</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <User size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Currently Available</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{freeCount} Ready for Projects</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Occupied with Deliverables</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{busyCount} In Progress</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={members}
        searchKey="name"
        isLoading={isLoading}
      />

      {/* Slide-over Profile Drawer */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedMember(null)} />
            
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-lg bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50">
                  <div className="flex items-center gap-3">
                    <img src={selectedMember.avatarUrl} alt={selectedMember.name} className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedMember.name}</h2>
                      <p className="text-xs text-zinc-500">{selectedMember.jobTitle} • {selectedMember.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {canEditMember && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(selectedMember)
                          setSelectedMember(null)
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        title="Edit Member"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {canDeleteMember && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(selectedMember)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete Member"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    <button type="button" onClick={() => setSelectedMember(null)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Drawer Tab Navigation */}
                <div className="flex items-center gap-1 px-6 border-b border-zinc-100 dark:border-zinc-800 text-xs overflow-x-auto bg-zinc-50/40 dark:bg-zinc-850/30">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "projects", label: `Projects (${selectedMember.assignedProjects.length})` },
                    { id: "subs", label: `Subscriptions (${selectedMember.assignedSubscriptions.length})` },
                    { id: "tasks", label: `Tasks (${selectedMember.activeTasks.length})` },
                    { id: "banking", label: "Banking & Salary" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDrawerActiveTab(tab.id as any)}
                      className={`py-3 px-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        drawerActiveTab === tab.id
                          ? "border-blue-600 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                  
                  {/* OVERVIEW TAB */}
                  {drawerActiveTab === "overview" && (
                    <div className="space-y-4">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Branch Office:</span>
                          <strong className="text-zinc-800 dark:text-zinc-200">📍 {selectedMember.branchName || "Central Office / HQ"}</strong>
                        </div>
                        {selectedMember.subbranchName && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Sub-Branch / Satellite:</span>
                            <strong className="text-purple-600 dark:text-purple-400">🏢 {selectedMember.subbranchName}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Email:</span>
                          <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedMember.email}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Phone:</span>
                          <strong className="text-zinc-800 dark:text-zinc-200">{selectedMember.phone}</strong>
                        </div>
                      </div>

                      {/* Quick Summary Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60">
                          <span className="text-[10.5px] text-purple-700 dark:text-purple-300 font-bold block">Project Milestone Earnings</span>
                          <div className="text-base font-black text-purple-900 dark:text-purple-100 mt-0.5">
                            ₹{selectedMember.totalProjectEarnings.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            Across {selectedMember.assignedProjects.length} Projects
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                          <span className="text-[10.5px] text-indigo-700 dark:text-indigo-300 font-bold block">Subscription Commissions</span>
                          <div className="text-base font-black text-indigo-900 dark:text-indigo-100 mt-0.5">
                            ₹{selectedMember.totalMonthlyCommission.toLocaleString("en-IN")}/mo
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            From {selectedMember.assignedSubscriptions.length} Subscriptions
                          </span>
                        </div>
                      </div>

                      {/* Action trigger */}
                      {canDisbursePayout && (
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full justify-center"
                            leftIcon={<CreditCard size={14} />}
                            onClick={() => {
                              setPayingMember(selectedMember)
                              setSelectedMember(null)
                            }}
                          >
                            Disburse Compensation / Payout Voucher
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PROJECTS TAB */}
                  {drawerActiveTab === "projects" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                          Assigned Projects & Revenue Share
                        </h3>
                        <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          ₹{selectedMember.totalProjectEarnings.toLocaleString("en-IN")} Total
                        </span>
                      </div>

                      {selectedMember.assignedProjects.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400">
                          No project assignments found for this team member.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedMember.assignedProjects.map(proj => (
                            <div key={proj.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                                <span>{proj.projectTitle}</span>
                                <span className="text-purple-600 dark:text-purple-400 font-black">{proj.memberSharePercentage}% Share</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-zinc-500">
                                <span>Client: <strong>{proj.clientName}</strong></span>
                                <span>Project Value: ₹{proj.projectTotalValue.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center text-[11px]">
                                <span className="text-zinc-500">Client Paid: ₹{proj.clientPaymentReceived.toLocaleString("en-IN")}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  Member Earned: ₹{proj.memberTotalEarned.toLocaleString("en-IN")} (Pending: ₹{proj.memberPendingAmount.toLocaleString("en-IN")})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBSCRIPTIONS TAB */}
                  {drawerActiveTab === "subs" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Managed Subscriptions & Commission Share
                        </h3>
                        <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          ₹{selectedMember.totalMonthlyCommission.toLocaleString("en-IN")}/mo
                        </span>
                      </div>

                      {selectedMember.assignedSubscriptions.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400">
                          No recurring subscription clients assigned yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedMember.assignedSubscriptions.map(sub => {
                            const rev = calculateTeamRevenueShare(sub)
                            return (
                              <div key={sub.id} className="p-3 bg-indigo-50/40 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
                                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                                  <span>{sub.planName}</span>
                                  <span className="text-indigo-600 dark:text-indigo-400">{sub.teamSharePercentage || 0}% Share</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-zinc-500">
                                  <span>Client: <strong>{sub.clientName}</strong></span>
                                  <span>Cycle: {sub.billingCycle}</span>
                                </div>
                                <div className="pt-1.5 border-t border-indigo-100 dark:border-indigo-900/40 flex justify-between items-center text-[11px]">
                                  <span className="text-zinc-500">Plan Amount: {sub.amount}</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    +₹{rev.monthlyRevenue.toLocaleString("en-IN")}/mo
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TASKS TAB */}
                  {drawerActiveTab === "tasks" && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Active Assigned Tasks ({selectedMember.activeTasks.length})
                      </h3>

                      {selectedMember.activeTasks.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400">
                          No pending tasks. Member is completely available.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedMember.activeTasks.map(t => (
                            <div key={t.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1">
                              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                                <span>{t.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                  {t.status}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px] text-zinc-400">
                                <span>Project: {t.projectName || t.relatedTo || t.sourceName || "Internal"}</span>
                                <span>Due: {t.deadline || "No deadline"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BANKING TAB */}
                  {drawerActiveTab === "banking" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Banking & Salary Settings
                        </h3>
                        {!isEditingBankingInline ? (
                          <button
                            type="button"
                            onClick={() => handleOpenInlineBanking(selectedMember)}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Pencil size={12} />
                            <span>Edit Banking</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingBankingInline(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {!isEditingBankingInline ? (
                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Base Salary:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ₹{(selectedMember.bankingInfo?.baseSalary ?? 0).toLocaleString("en-IN")}/mo
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Bank Name:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200">{selectedMember.bankingInfo?.bankName || "Not configured"}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Account Number:</span>
                            <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedMember.bankingInfo?.accountNumber || "Not configured"}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">IFSC Code:</span>
                            <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedMember.bankingInfo?.ifscCode || "Not configured"}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">UPI ID:</span>
                            <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedMember.bankingInfo?.upiId || "Not configured"}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                          <div>
                            <label className="text-zinc-500 font-semibold block mb-1">Base Salary (₹)</label>
                            <input
                              type="number"
                              value={inlineSalary}
                              onChange={(e) => setInlineSalary(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-500 font-semibold block mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={inlineBankName}
                              onChange={(e) => setInlineBankName(e.target.value)}
                              placeholder="e.g. HDFC Bank"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-zinc-500 font-semibold block mb-1">Account No.</label>
                              <input
                                type="text"
                                value={inlineAccountNum}
                                onChange={(e) => setInlineAccountNum(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-zinc-500 font-semibold block mb-1">IFSC Code</label>
                              <input
                                type="text"
                                value={inlineIfsc}
                                onChange={(e) => setInlineIfsc(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono uppercase"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-zinc-500 font-semibold block mb-1">UPI ID</label>
                            <input
                              type="text"
                              value={inlineUpi}
                              onChange={(e) => setInlineUpi(e.target.value)}
                              placeholder="user@upi"
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                            />
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => handleSaveInlineBanking(selectedMember)}
                          >
                            Save Banking Details
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AddTeamMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={() => {
          showToast("🎉 New team member added successfully!")
          loadData()
        }}
      />

      {/* Edit Member Modal */}
      <EditTeamMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={() => {
          showToast("✅ Team member profile updated!")
          loadData()
        }}
      />

      {/* Record Payout Modal */}
      {payingMember && (
        <RecordPayoutModal
          isOpen={Boolean(payingMember)}
          profile={{
            id: payingMember.id,
            name: payingMember.name,
            email: payingMember.email,
            phone: payingMember.phone,
            avatarUrl: payingMember.avatarUrl,
            role: payingMember.jobTitle,
            department: payingMember.department || "Operations",
            companyId: payingMember.companyId || activeCompanyId || "tech",
            branchId: payingMember.branchId,
            branchName: payingMember.branchName,
            subBranchId: payingMember.subBranchId,
            subbranchName: payingMember.subbranchName,
            baseSalary: payingMember.bankingInfo?.baseSalary || 0,
            subscriptionCommission: payingMember.totalMonthlyCommission,
            projectEarnings: payingMember.totalProjectEarnings,
            totalDueThisMonth: (payingMember.bankingInfo?.baseSalary || 0) + payingMember.totalMonthlyCommission + payingMember.totalProjectEarnings,
            totalPaidThisMonth: 0,
            remainingNeedToPay: (payingMember.bankingInfo?.baseSalary || 0) + payingMember.totalMonthlyCommission + payingMember.totalProjectEarnings,
            payoutStatus: "Need to Pay",
            activeSubscriptionsCount: payingMember.assignedSubscriptions.length,
            activeProjectsCount: payingMember.assignedProjects.length,
            bankingInfo: payingMember.bankingInfo || {
              memberId: payingMember.id,
              baseSalary: 0,
              bankName: "",
              accountNumber: "",
              ifscCode: "",
              accountHolderName: "",
              upiId: "",
            },
          }}
          onClose={() => setPayingMember(null)}
          onSuccess={(payout) => {
            showToast(`💳 Payout voucher ${payout.id} generated for ${payout.memberName}!`)
            loadData()
          }}
        />
      )}
    </motion.div>
  )
}
