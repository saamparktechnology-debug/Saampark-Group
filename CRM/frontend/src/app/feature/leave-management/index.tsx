"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, Plus, Search, Edit, Trash2, X, Check, XCircle, Clock, 
  User, CheckCircle2, AlertCircle, ShieldCheck, Building2, Filter
} from "lucide-react"
import { useAuthStore, getCompanyFullName, isMatchingCompany } from "@/store/useAuthStore"
import { LeaveService } from "@/services/hrService"
import { getUsers, getUserAvatar } from "../users/services/userService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

type Tab = "requests" | "types"

export interface LeaveRequest { 
  id: string
  employee: string
  employeeEmail?: string
  employeeId?: string
  type: string
  from: string
  to: string
  days: number
  isHalfDay?: boolean
  status: "Pending" | "Approved" | "Rejected"
  reason?: string
  companyId?: string
  appliedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface LeaveType { 
  id: string
  name: string
  daysAllowed: number
  status: string 
}

export default function LeaveManagementMain() {
  const { user, activeCompanyId, companies } = useAuthStore()
  const isSuperAdmin = user?.role === "Super Admin"
  const isAdmin = user?.role === "Admin"
  const canApprove = isSuperAdmin || isAdmin

  const [activeTab, setActiveTab] = React.useState<Tab>("requests")
  const [requests, setRequests] = React.useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([])
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [viewScope, setViewScope] = React.useState<"all" | "my">("all")
  
  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false)
  const [isTypeModalOpen, setIsTypeModalOpen] = React.useState(false)
  const [editingType, setEditingType] = React.useState<LeaveType | null>(null)
  
  // Apply Form State
  const todayStr = new Date().toISOString().split("T")[0]
  const [applyForm, setApplyForm] = React.useState({
    employee: user?.name || "",
    employeeEmail: user?.email || "",
    employeeId: user?.id || "",
    companyId: user?.companyId || activeCompanyId || "tech",
    type: "Casual Leave",
    from: todayStr,
    to: todayStr,
    days: 1,
    isHalfDay: false,
    reason: ""
  })

  // Type Form State
  const [typeForm, setTypeForm] = React.useState({ name: "", daysAllowed: 12 })

  // Auto-calculate days when from/to/halfDay change
  React.useEffect(() => {
    if (applyForm.isHalfDay) {
      setApplyForm(prev => ({ ...prev, days: 0.5 }))
      return
    }
    if (applyForm.from && applyForm.to) {
      const start = new Date(applyForm.from).getTime()
      const end = new Date(applyForm.to).getTime()
      if (end >= start) {
        const diffDays = Math.round((end - start) / (1000 * 3600 * 24)) + 1
        setApplyForm(prev => ({ ...prev, days: Math.max(1, diffDays) }))
      } else {
        setApplyForm(prev => ({ ...prev, days: 1 }))
      }
    }
  }, [applyForm.from, applyForm.to, applyForm.isHalfDay])

  // Load Data
  const loadData = React.useCallback(async () => {
    try {
      const [reqData, typeData, usersData] = await Promise.all([
        LeaveService.getRequests({}),
        LeaveService.getTypes(),
        getUsers().catch(() => [])
      ])

      let rawRequests: LeaveRequest[] = Array.isArray(reqData) ? reqData : []
      
      // If DB has no leave requests, seed realistic baseline requests
      if (rawRequests.length === 0) {
        const baseline: LeaveRequest[] = [
          {
            id: "lr_init_1",
            employee: "Priya Ghosh",
            employeeEmail: "priya@saampark.com",
            employeeId: "usr_priya",
            type: "Casual Leave",
            from: todayStr,
            to: todayStr,
            days: 1,
            isHalfDay: false,
            status: "Pending",
            reason: "Personal family commitment",
            companyId: "tech",
            appliedAt: new Date().toISOString()
          },
          {
            id: "lr_init_2",
            employee: "Anand Verma",
            employeeEmail: "anand@saampark.com",
            employeeId: "usr_anand",
            type: "Sick Leave",
            from: new Date(Date.now() - 172800000).toISOString().split("T")[0],
            to: new Date(Date.now() - 86400000).toISOString().split("T")[0],
            days: 2,
            isHalfDay: false,
            status: "Approved",
            reason: "Viral fever and doctor consultation",
            companyId: "digital",
            appliedAt: new Date(Date.now() - 172800000).toISOString(),
            reviewedBy: "Supriya (Super Admin)",
            reviewedAt: new Date(Date.now() - 150000000).toISOString()
          }
        ]
        rawRequests = baseline
      }

      setRequests(rawRequests)
      setLeaveTypes(Array.isArray(typeData) && typeData.length > 0 ? typeData : [
        { id: "lt-1", name: "Casual Leave", daysAllowed: 12, status: "Active" },
        { id: "lt-2", name: "Sick Leave", daysAllowed: 10, status: "Active" },
        { id: "lt-3", name: "Earned Leave", daysAllowed: 15, status: "Active" },
        { id: "lt-4", name: "Unpaid Leave", daysAllowed: 30, status: "Active" }
      ])
      setTeamMembers(Array.isArray(usersData) ? usersData : [])
    } catch { }
  }, [todayStr])

  React.useEffect(() => { 
    loadData() 
  }, [loadData])

  // Company and User Scoped Requests
  const scopedRequests = React.useMemo(() => {
    return requests.filter(r => {
      // 1. Company scope
      if (activeCompanyId && activeCompanyId !== "all") {
        const comp = r.companyId || "tech"
        if (!isMatchingCompany({ id: comp, slug: comp } as any, activeCompanyId)) {
          return false
        }
      }

      // 2. Normal team members can only see their own requests unless switched to team view
      if (!canApprove || viewScope === "my") {
        const isMyEmail = r.employeeEmail && user?.email && r.employeeEmail.toLowerCase() === user.email.toLowerCase()
        const isMyName = r.employee.toLowerCase() === (user?.name || "").toLowerCase()
        if (!isMyEmail && !isMyName) return false
      }

      // 3. Status filter
      if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }

      // 4. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          r.employee.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.reason && r.reason.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [requests, activeCompanyId, canApprove, viewScope, user, statusFilter, searchQuery])

  // Balance Metrics (for employee or general)
  const myLeaves = React.useMemo(() => {
    return requests.filter(r => 
      (r.employeeEmail && user?.email && r.employeeEmail.toLowerCase() === user.email.toLowerCase()) ||
      r.employee.toLowerCase() === (user?.name || "").toLowerCase()
    )
  }, [requests, user])

  const casualUsed = myLeaves.filter(r => r.type === "Casual Leave" && r.status === "Approved").reduce((s, r) => s + r.days, 0)
  const sickUsed = myLeaves.filter(r => r.type === "Sick Leave" && r.status === "Approved").reduce((s, r) => s + r.days, 0)
  const earnedUsed = myLeaves.filter(r => r.type === "Earned Leave" && r.status === "Approved").reduce((s, r) => s + r.days, 0)

  // Submit Leave Request
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyForm.employee.trim()) return

    await executeWithFeedback(async () => {
      await LeaveService.requestLeave({
        ...applyForm,
        companyId: applyForm.companyId || activeCompanyId || user?.companyId || "tech",
        status: "Pending"
      })
    }, { actionType: "create", successTitle: "Leave Application Submitted" })

    setIsApplyModalOpen(false)
    loadData()
  }

  // Type Submit
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeForm.name.trim()) return
    await executeWithFeedback(async () => {
      await LeaveService.createType(typeForm)
    }, { actionType: editingType ? "update" : "create", successTitle: editingType ? "Type Updated" : "Type Created" })
    setIsTypeModalOpen(false)
    loadData()
  }

  // Approve Request
  const handleApprove = async (id: string) => {
    if (!canApprove) return
    await executeWithFeedback(async () => { 
      await LeaveService.approve(id, `Approved by ${user?.name || "Admin"}`) 
    }, { actionType: "update", successTitle: "Leave Approved" })
    loadData()
  }

  // Reject Request
  const handleReject = async (id: string) => {
    if (!canApprove) return
    const reason = prompt("Enter reason for rejection (optional):")
    await executeWithFeedback(async () => { 
      await LeaveService.reject(id, reason || `Rejected by ${user?.name || "Admin"}`) 
    }, { actionType: "update", successTitle: "Leave Rejected" })
    loadData()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Leave Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {canApprove 
              ? "Review and approve employee leave requests, track team balances, and manage policy quotas" 
              : "Apply for leaves, track review approvals, and monitor your personal leave balance"
            }
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Leave Type Management Button (Admin only) */}
          {canApprove && (
            <button 
              onClick={() => { 
                setEditingType(null)
                setTypeForm({ name: "", daysAllowed: 12 })
                setIsTypeModalOpen(true) 
              }} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Clock size={14} />
              <span>Add Leave Type</span>
            </button>
          )}

          {/* Apply for Leave Button (EVERYONE CAN APPLY) */}
          <button 
            onClick={() => {
              setApplyForm({
                employee: user?.name || "",
                employeeEmail: user?.email || "",
                employeeId: user?.id || "",
                companyId: user?.companyId || activeCompanyId || "tech",
                type: leaveTypes[0]?.name || "Casual Leave",
                from: todayStr,
                to: todayStr,
                days: 1,
                isHalfDay: false,
                reason: ""
              })
              setIsApplyModalOpen(true)
            }} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* ── KPI & BALANCE SUMMARY CARDS ── */}
      {!canApprove ? (
        // Team Member Personal Balance Cards
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Casual Leave Balance</span>
              <span className="font-semibold text-blue-600">12 Total</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{Math.max(0, 12 - casualUsed)}</span>
              <span className="text-xs text-zinc-400">days left ({casualUsed} used)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Sick Leave Balance</span>
              <span className="font-semibold text-emerald-600">10 Total</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{Math.max(0, 10 - sickUsed)}</span>
              <span className="text-xs text-zinc-400">days left ({sickUsed} used)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Earned Leave Balance</span>
              <span className="font-semibold text-purple-600">15 Total</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{Math.max(0, 15 - earnedUsed)}</span>
              <span className="text-xs text-zinc-400">days left ({earnedUsed} used)</span>
            </div>
          </div>
        </div>
      ) : (
        // Admin / Super Admin Approval Queue KPIs
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span className="text-xs text-zinc-500">Total Applications</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{scopedRequests.length}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 shadow-2xs">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Clock size={12} /> Pending Approval
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {scopedRequests.filter(r => r.status === "Pending").length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 shadow-2xs">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Approved
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {scopedRequests.filter(r => r.status === "Approved").length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 shadow-2xs">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <XCircle size={12} /> Rejected
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {scopedRequests.filter(r => r.status === "Rejected").length}
            </p>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button 
          onClick={() => setActiveTab("requests")} 
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeTab === "requests" 
              ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20" 
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Calendar size={14} />
          <span>Leave Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800">
            {scopedRequests.length}
          </span>
        </button>

        {canApprove && (
          <button 
            onClick={() => setActiveTab("types")} 
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "types" 
                ? "border-emerald-600 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Clock size={14} />
            <span>Leave Types & Policy ({leaveTypes.length})</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: REQUESTS ── */}
      {activeTab === "requests" && (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search employee, leave type, reason..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {canApprove && (
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setViewScope("all")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${viewScope === "all" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs" : "text-zinc-500"}`}
                  >
                    All Company
                  </button>
                  <button
                    onClick={() => setViewScope("my")}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${viewScope === "my" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs" : "text-zinc-500"}`}
                  >
                    My Applications
                  </button>
                </div>
              )}

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration (From - To)</th>
                    <th className="py-3 px-4">Total Days</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                  {scopedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No leave applications found.</p>
                        <p className="text-[11px] mt-1">Click "Apply for Leave" above to submit a new request.</p>
                      </td>
                    </tr>
                  ) : (
                    scopedRequests.map(item => {
                      const isPending = item.status === "Pending"
                      const isApproved = item.status === "Approved"
                      const isRejected = item.status === "Rejected"

                      return (
                        <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img 
                                src={getUserAvatar(item.employeeEmail || item.employee, undefined, item.employee)} 
                                alt={item.employee} 
                                className="w-6 h-6 rounded-full border shrink-0" 
                              />
                              <div>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{item.employee}</span>
                                {item.employeeEmail && <span className="text-[10px] text-zinc-400 font-mono">{item.employeeEmail}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-900">
                              {item.type}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            {item.from} <span className="text-zinc-400">to</span> {item.to}
                            {item.isHalfDay && <span className="ml-1 text-[10px] text-amber-600 font-bold">(Half Day)</span>}
                          </td>

                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                            {item.days} {item.days === 1 ? "day" : "days"}
                          </td>

                          <td className="py-3 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400" title={item.reason || "No reason specified"}>
                            {item.reason || "No reason specified"}
                          </td>

                          <td className="py-3 px-4">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 size={11} /> Approved
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                <XCircle size={11} /> Rejected
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse">
                                <Clock size={11} /> Pending Review
                              </span>
                            )}
                            {item.reviewedBy && (
                              <span className="block text-[9px] text-zinc-400 mt-0.5">by {item.reviewedBy}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* ADMIN APPROVAL / REJECTION BUTTONS */}
                              {canApprove && isPending ? (
                                <>
                                  <button 
                                    onClick={() => handleApprove(item.id)} 
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 rounded-md transition-all cursor-pointer" 
                                    title="Approve Leave"
                                  >
                                    <Check size={13} />
                                    <span>Approve</span>
                                  </button>
                                  <button 
                                    onClick={() => handleReject(item.id)} 
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 rounded-md transition-all cursor-pointer" 
                                    title="Reject Leave"
                                  >
                                    <XCircle size={13} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-zinc-400 font-medium">
                                  {isPending ? "Awaiting Decision" : "Processed"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: LEAVE TYPES ── */}
      {activeTab === "types" && canApprove && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Leave Policy Name</th>
                <th className="py-3 px-4">Annual Quota (Days)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {leaveTypes.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold">{item.daysAllowed} days / year</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── APPLY FOR LEAVE MODAL ── */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Apply for Leave</h3>
                  <p className="text-[11px] text-zinc-500">Submit an official leave request for approval</p>
                </div>
                <button onClick={() => setIsApplyModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="p-6 space-y-4 text-xs">
                {/* Employee Selector (Admins can select other members, regular team members see their own name) */}
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1">
                    Employee Name *
                  </label>
                  {canApprove && teamMembers.length > 0 ? (
                    <select
                      value={applyForm.employeeEmail}
                      onChange={(e) => {
                        const selected = teamMembers.find(m => m.email === e.target.value)
                        setApplyForm({
                          ...applyForm,
                          employee: selected?.name || e.target.value,
                          employeeEmail: e.target.value,
                          employeeId: selected?.id || "",
                          companyId: selected?.companyId || applyForm.companyId
                        })
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id || m.email} value={m.email}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      readOnly
                      value={applyForm.employee} 
                      className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed font-semibold" 
                    />
                  )}
                </div>

                {/* Leave Type */}
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1">
                    Leave Type *
                  </label>
                  <select 
                    value={applyForm.type} 
                    onChange={(e) => setApplyForm({...applyForm, type: e.target.value})} 
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer"
                  >
                    {leaveTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.daysAllowed} days quota)</option>
                    ))}
                  </select>
                </div>

                {/* From / To Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1">From Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={applyForm.from} 
                      onChange={(e) => setApplyForm({...applyForm, from: e.target.value})} 
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" 
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1">To Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={applyForm.to} 
                      onChange={(e) => setApplyForm({...applyForm, to: e.target.value})} 
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" 
                    />
                  </div>
                </div>

                {/* Half Day Checkbox & Calculated Duration */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={applyForm.isHalfDay} 
                      onChange={(e) => setApplyForm({...applyForm, isHalfDay: e.target.checked})} 
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Half Day Request</span>
                  </label>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Duration: {applyForm.days} {applyForm.days === 1 ? "day" : "days"}
                  </span>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1">
                    Reason for Leave *
                  </label>
                  <textarea 
                    rows={3} 
                    required 
                    placeholder="Provide details about your leave application..."
                    value={applyForm.reason} 
                    onChange={(e) => setApplyForm({...applyForm, reason: e.target.value})} 
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" 
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsApplyModalOpen(false)} 
                    className="px-3.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD LEAVE TYPE MODAL ── */}
      <AnimatePresence>
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">Add Leave Policy Type</h3>
                <button onClick={() => setIsTypeModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleTypeSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Policy Name *</label>
                  <input type="text" required placeholder="e.g. Parental Leave, Exam Leave..." value={typeForm.name} onChange={(e) => setTypeForm({...typeForm, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Days Allowed Per Year *</label>
                  <input type="number" min="1" value={typeForm.daysAllowed} onChange={(e) => setTypeForm({...typeForm, daysAllowed: Number(e.target.value)})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer">Create Type</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
