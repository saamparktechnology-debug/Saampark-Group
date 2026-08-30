"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Download, Mail, X, ExternalLink, CheckCircle2, 
  Briefcase, CheckSquare, Clock, Phone, User, Shield, Building2, Eye,
  DollarSign, Percent, Sparkles, RefreshCw
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useUIStore } from "@/store/useUIStore"
import { UserService } from "@/services/apiServices"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { Task } from "@/app/feature/tasks/types"
import { getUserAvatar } from "@/app/feature/users/services/userService"
import { getSubscriptions } from "@/app/feature/subscriptions/services/subscriptionService"
import { Subscription, calculateTeamRevenueShare } from "@/app/feature/subscriptions/types"

export type TeamMember = {
  id: string
  name: string
  avatarUrl: string
  jobTitle: string
  email: string
  phone: string
  department?: string
  status: "Online" | "Offline"
  assignedTasksCount: number
  activeTasks: Task[]
  assignedSubscriptions: Subscription[]
  totalMonthlyCommission: number
}

export default function TeamMembersPage() {
  const [activeTab, setActiveTab] = React.useState("active")
  const { openModal } = useUIStore()
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [userRes, allTasks, allSubs] = await Promise.all([
        UserService.getTeamMembers().catch(() => []),
        taskService.getTasks().catch(() => []),
        getSubscriptions("all").catch(() => []),
      ])

      if (Array.isArray(userRes)) {
        const live: TeamMember[] = userRes.map((u: any, idx: number) => {
          const mName = u.full_name || u.name || u.email || "Team Member"
          const mEmail = (u.email || "").toLowerCase().trim()

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
            const byId = s.assignedMemberId && String(s.assignedMemberId) === String(u.id || u._id)
            return Boolean(byEmail || byName || byId)
          })

          const totalMonthlyCommission = memberSubs.reduce((acc, sub) => {
            const calc = calculateTeamRevenueShare(sub)
            return acc + calc.monthlyRevenue
          }, 0)

          return {
            id: String(u.id || u._id || idx),
            name: mName,
            avatarUrl: (u as any).avatar_url || (u as any).avatarUrl || u.avatar || getUserAvatar(mName, undefined, mName),
            jobTitle: u.role_name || u.role || "Technical Lead",
            email: u.email || "-",
            phone: u.phone || "+91 98765 43210",
            department: u.department || "Engineering & Delivery",
            status: u.status === "active" || idx % 2 === 0 ? "Online" : "Offline",
            assignedTasksCount: memberTasks.length,
            activeTasks: memberTasks,
            assignedSubscriptions: memberSubs,
            totalMonthlyCommission,
          }
        })
        setMembers(live)
      }
    } catch (err) {
      console.error("Error loading team members API:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: "Team Member",
      cell: ({ row }) => (
        <div 
          onClick={() => setSelectedMember(row.original)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <img src={row.original.avatarUrl} alt={row.getValue("name")} className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition-all" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${row.original.status === "Online" ? "bg-emerald-500" : "bg-zinc-400"}`} />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">{row.getValue("name")}</div>
            <div className="text-[11px] text-zinc-400 font-normal">{row.original.jobTitle}</div>
          </div>
        </div>
      ),
    },
    { 
      accessorKey: "department", 
      header: "Department", 
      cell: ({ row }) => <div className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">{row.original.department}</div> 
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      cell: ({ row }) => <div className="text-zinc-500 font-mono text-xs">{row.getValue("email")}</div> 
    },
    { 
      accessorKey: "phone", 
      header: "Phone", 
      cell: ({ row }) => <div className="text-zinc-500 text-xs">{row.getValue("phone")}</div> 
    },
    {
      accessorKey: "assignedTasksCount",
      header: "Workload Status",
      cell: ({ row }) => {
        const count = row.original.assignedTasksCount
        const isFree = count === 0

        return (
          <div className="flex items-center gap-2">
            {isFree ? (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Free / Available</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1">
                <CheckSquare size={12} />
                <span>Assigned ({count} Tasks)</span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Profile",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelectedMember(row.original)}
          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1"
        >
          <Eye size={13} />
          <span>View Profile</span>
        </button>
      ),
    }
  ]

  const freeCount = members.filter(m => m.assignedTasksCount === 0).length
  const busyCount = members.filter(m => m.assignedTasksCount > 0).length

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <User className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Team Members & Workload</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time team directory tracking assigned project deliverables vs available resource capacity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddMemberModalOpen")}>
            Add Member
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Team Size</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{members.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <User size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Free / Ready for Tasks</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{freeCount} Members</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Actively Assigned</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{busyCount} Members</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <CheckSquare size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 shadow-2xs">
        <DataTable columns={columns} data={members} searchKey="name" />
      </div>

      {/* ---------------- MEMBER PROFILE DOSSIER MODAL ---------------- */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white/80 shadow-lg bg-white"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{selectedMember.name}</h3>
                    <p className="text-xs text-blue-100">{selectedMember.jobTitle} • {selectedMember.department}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/20 text-white">
                      Status: {selectedMember.assignedTasksCount === 0 ? "Free / Available" : `Assigned (${selectedMember.assignedTasksCount} Tasks)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedMember.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedMember.phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Department</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedMember.department}</span>
                  </div>
                </div>

                {/* Assigned Tasks Breakdown */}
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-blue-600" />
                    <span>Active Assigned Tasks ({selectedMember.activeTasks.length})</span>
                  </h4>

                  {selectedMember.activeTasks.length === 0 ? (
                    <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs">
                      ✨ Member is currently free. Ready to be assigned new project deliverables!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMember.activeTasks.map((t) => (
                        <div key={t.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{t.title}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Project: <span className="font-medium text-zinc-600 dark:text-zinc-300">{t.relatedTo}</span> • Deadline: <span className="font-mono font-bold text-red-600 dark:text-red-400">{t.deadline}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Managed Subscriptions & Revenue Share */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <RefreshCw size={14} className="text-indigo-600" />
                      <span>Managed Subscriptions & Revenue Share ({selectedMember.assignedSubscriptions.length})</span>
                    </h4>
                    {selectedMember.totalMonthlyCommission > 0 && (
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                        Total: ₹{selectedMember.totalMonthlyCommission.toLocaleString("en-IN")}/mo
                      </span>
                    )}
                  </div>

                  {selectedMember.assignedSubscriptions.length === 0 ? (
                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-zinc-500 text-xs">
                      No recurring subscription contracts currently assigned to this team member.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedMember.assignedSubscriptions.map((sub) => {
                        const calc = calculateTeamRevenueShare(sub)
                        return (
                          <div
                            key={sub.id}
                            className="p-3.5 bg-gradient-to-br from-indigo-50/40 to-blue-50/20 dark:from-indigo-950/30 dark:to-blue-950/10 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                  <span>{sub.planName}</span>
                                  <span className="px-2 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold">
                                    {calc.sharePercentage}% Revenue Share
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">
                                  Client: <strong className="text-zinc-700 dark:text-zinc-300">{sub.clientName}</strong> • Contract Price: <strong className="text-zinc-800 dark:text-zinc-200">{sub.amount}</strong> ({sub.billingCycle})
                                </div>
                              </div>

                              <div className="text-left sm:text-right">
                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Member Payout</div>
                                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                  ₹{calc.monthlyRevenue.toLocaleString("en-IN")} / mo
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
                              <div>Daily: <strong className="text-zinc-800 dark:text-zinc-200">₹{calc.dailyRevenue.toLocaleString("en-IN")}/d</strong></div>
                              <div>Weekly: <strong className="text-zinc-800 dark:text-zinc-200">₹{calc.weeklyRevenue.toLocaleString("en-IN")}/wk</strong></div>
                              <div>Per Cycle: <strong className="text-zinc-800 dark:text-zinc-200">₹{calc.cycleRevenue.toLocaleString("en-IN")}</strong></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 px-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
