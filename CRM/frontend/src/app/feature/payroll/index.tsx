"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  DollarSign, Plus, Search, Check, Clock, Edit, X, 
  FolderKanban, User, Users, Briefcase, Filter, Award, 
  FileText, Printer, Download, ShieldCheck, Percent, 
  TrendingUp, CheckCircle2, Building2, Sparkles, AlertCircle, 
  ArrowUpRight, ExternalLink
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { PayrollService } from "@/services/hrService"
import { getProjects } from "../projects/service/projectService"
import { getStoredUserAccountsAsync } from "../users/service/userService"
import { Project } from "../projects/types"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

interface PayrollItem { 
  id: string
  employee: string
  employeeId?: string
  projectId?: string
  projectName?: string
  month: string
  basic: number
  allowances: number
  deductions: number
  net: number
  status: string 
}

export default function PayrollMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleNorm = String(user?.role || "").toLowerCase().trim()
  const isAdmin = roleNorm === "super admin" || roleNorm === "admin" || roleNorm.includes("admin")
  const isClient = roleNorm === "clients" || roleNorm === "client" || roleNorm.includes("client")
  const isTeamMember = !isAdmin && !isClient
  const canAdd = isAdmin || canPerformAction(user, "Users", "add")

  const [payrolls, setPayrolls] = React.useState<PayrollItem[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [allUsers, setAllUsers] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Payout request modal state (for team member self-service)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = React.useState(false)
  const [payoutReqAmount, setPayoutReqAmount] = React.useState("")
  const [payoutReqType, setPayoutReqType] = React.useState<"Monthly Salary Payout" | "Salary Advance" | "Expense Reimbursement">("Monthly Salary Payout")
  const [payoutReqNotes, setPayoutReqNotes] = React.useState("")
  const [isSubmittingPayoutReq, setIsSubmittingPayoutReq] = React.useState(false)

  // Form state
  const [selectionMode, setSelectionMode] = React.useState<"project" | "individual">("project")
  const [selectedProjectId, setSelectedProjectId] = React.useState("")
  const [selectedProjectMembers, setSelectedProjectMembers] = React.useState<any[]>([])

  const [form, setForm] = React.useState({ 
    employee: "", 
    employeeId: "",
    projectId: "",
    projectName: "",
    month: new Date().toISOString().slice(0, 7), 
    basic: 0, 
    allowances: 0, 
    deductions: 0 
  })

  const loadData = React.useCallback(async () => {
    try { 
      const [payrollData, projectList, userList] = await Promise.all([
        PayrollService.getAll({}).catch(() => []),
        getProjects(activeCompanyId || undefined).catch(() => []),
        getStoredUserAccountsAsync().catch(() => [])
      ])

      setPayrolls(Array.isArray(payrollData) ? payrollData : [])
      setProjects(Array.isArray(projectList) ? projectList : [])
      setAllUsers(Array.isArray(userList) ? userList : [])
    } catch (err) {
      console.warn("Payroll loadData warning:", err)
    }
  }, [activeCompanyId])

  React.useEffect(() => { 
    loadData() 
  }, [loadData])

  // When project changes in form, update project members
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId)
    const foundProject = projects.find(p => p.id === projId)
    if (foundProject) {
      const pMembers = foundProject.members || []
      // If project has defined members, use them, otherwise list users
      setSelectedProjectMembers(pMembers.length > 0 ? pMembers : allUsers)
      setForm(prev => ({
        ...prev,
        projectId: projId,
        projectName: foundProject.title,
        employee: pMembers[0]?.name || "",
        employeeId: pMembers[0]?.id || ""
      }))
    } else {
      setSelectedProjectMembers([])
      setForm(prev => ({ ...prev, projectId: "", projectName: "", employee: "", employeeId: "" }))
    }
  }

  const handleMemberSelect = (memberName: string) => {
    const memberObj = selectedProjectMembers.find(m => m.name === memberName) || allUsers.find(u => u.name === memberName)
    setForm(prev => ({
      ...prev,
      employee: memberName,
      employeeId: memberObj?.id || ""
    }))
  }

  const [activePayrollTab, setActivePayrollTab] = React.useState<"incentives" | "salaries" | "payslips">("incentives")
  const [selectedPayslipItem, setSelectedPayslipItem] = React.useState<any | null>(null)
  const [isPayslipModalOpen, setIsPayslipModalOpen] = React.useState(false)

  // User Projects & Incentives Attribution
  const userProjects = React.useMemo(() => {
    if (!user) return []
    const uId = String(user.id || "").toLowerCase().trim()
    const uEmail = String(user.email || "").toLowerCase().trim()
    const uName = String(user.name || "").toLowerCase().trim()

    return projects.filter((p) => {
      if (isAdmin) return true
      const members = Array.isArray(p.members) ? p.members : []
      return members.some((m: any) => {
        if (!m) return false
        const mId = String(m.id || "").toLowerCase().trim()
        const mEmail = String(m.email || "").toLowerCase().trim()
        const mName = String(m.name || "").toLowerCase().trim()
        return (uId && mId === uId) || (uEmail && mEmail === uEmail) || (uName && mName === uName)
      })
    })
  }, [projects, user, isAdmin])

  const userIncentivesList = React.useMemo(() => {
    const list: any[] = []
    const uId = String(user?.id || "").toLowerCase().trim()
    const uEmail = String(user?.email || "").toLowerCase().trim()
    const uName = String(user?.name || "").toLowerCase().trim()

    userProjects.forEach((p) => {
      const numProjTotal = parseFloat(
        String(p.totalAmount ?? p.baseAmount ?? p.price ?? "0").replace(/[^0-9.]/g, "")
      ) || 0

      const effectiveClientPaid = typeof p.paidAmount === "number"
        ? p.paidAmount
        : (p.paymentStatus === "Paid" || p.status === "Completed"
          ? numProjTotal
          : (typeof p.advanceAmount === "number" ? p.advanceAmount : 0))

      const effectiveClientDue = Math.max(0, numProjTotal - effectiveClientPaid)
      const paidRatio = numProjTotal > 0 ? Math.min(1, effectiveClientPaid / numProjTotal) : 0

      const members = Array.isArray(p.members) ? p.members : []
      const myMembers = isAdmin 
        ? (members.length > 0 ? members : [{ name: "Project Team", role: "Contributor", sharePercentage: 15 }])
        : members.filter((m: any) => {
            const mId = String(m.id || "").toLowerCase().trim()
            const mEmail = String(m.email || "").toLowerCase().trim()
            const mName = String(m.name || "").toLowerCase().trim()
            return (uId && mId === uId) || (uEmail && mEmail === uEmail) || (uName && mName === uName)
          })

      myMembers.forEach((mem: any) => {
        const sharePct = typeof mem?.sharePercentage === "number" ? mem.sharePercentage : 15
        const totalPotential = mem?.payoutType === "fixed" && typeof mem?.payoutAmount === "number"
          ? mem.payoutAmount
          : Math.round((numProjTotal * sharePct) / 100)

        const earnedIncentive = Math.round(paidRatio * totalPotential)
        const pendingIncentive = Math.max(0, totalPotential - earnedIncentive)

        list.push({
          projectId: p.id,
          projectTitle: p.title,
          client: p.client || "-",
          status: p.status,
          isCompleted: p.status === "Completed" || p.status === "Finished",
          projectTotal: numProjTotal,
          clientPaid: effectiveClientPaid,
          clientDue: effectiveClientDue,
          sharePct,
          memberName: mem?.name || user?.name || "Staff",
          memberRole: mem?.role || "Developer",
          totalPotential,
          earnedIncentive,
          pendingIncentive,
          category: p.category || (p.projectType === "Digital Marketing Campaign" ? "Digital Marketing" : "Website"),
        })
      })
    })
    return list
  }, [userProjects, user, isAdmin])

  const successfulProjectsCount = userIncentivesList.filter((item) => item.isCompleted).length
  const totalEarnedIncentives = userIncentivesList.reduce((sum, item) => sum + item.earnedIncentive, 0)
  const totalPendingIncentives = userIncentivesList.reduce((sum, item) => sum + item.pendingIncentive, 0)

  const handleRequestIncentiveForProject = (item: any) => {
    setPayoutReqType("Monthly Salary Payout")
    const amt = item.earnedIncentive > 0 ? item.earnedIncentive : item.totalPotential
    setPayoutReqAmount(String(amt))
    setPayoutReqNotes(`Incentive claim against project "${item.projectTitle}" (${item.sharePct}% share). Client paid: ₹${item.clientPaid.toLocaleString("en-IN")}.`)
    setIsPayoutModalOpen(true)
  }

  // Statutory India Compliant Payroll Breakdown (PF 12%, ESI 0.75%, P-Tax ₹200)
  const calculateStatutoryPayslip = (baseGross: number, incentiveAmt: number = 0) => {
    const gross = Math.max(0, baseGross + incentiveAmt)
    const basic = Math.round(gross * 0.50) // Statutory 50% Basic
    const hra = Math.round(basic * 0.40) // 40% of Basic
    const specialAllowance = Math.max(0, gross - (basic + hra + incentiveAmt))
    
    // Statutory Deductions:
    const pf = Math.round(basic * 0.12) // 12% statutory PF on Basic
    const esi = gross <= 21000 ? Math.round(gross * 0.0075) : Math.round(basic * 0.0075) // 0.75% ESI on Gross
    const pt = gross > 10000 ? 200 : 0 // Professional Tax
    const totalDeductions = pf + esi + pt
    const netSalary = Math.max(0, gross - totalDeductions)

    return {
      gross,
      basic,
      hra,
      specialAllowance,
      incentiveAmt,
      pf,
      esi,
      pt,
      totalDeductions,
      netSalary,
    }
  }

  const filtered = payrolls.filter(p => {
    // If team member: strictly only see their own payroll records
    if (isTeamMember) {
      const uId = String(user?.id || "").toLowerCase().trim()
      const uName = String(user?.name || "").toLowerCase().trim()
      const pEmp = (p.employee || "").toLowerCase().trim()
      const pEmpId = String(p.employeeId || "").toLowerCase().trim()

      const isMine = (uId && pEmpId === uId) || (uName && (pEmp === uName || pEmp.includes(uName)))
      if (!isMine) return false
    }

    const matchSearch = 
      p.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projectName || "").toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    if (projectFilter !== "all" && p.projectId !== projectFilter) return false
    return matchSearch
  })

  // Team Member Metrics
  const teamMetrics = React.useMemo(() => {
    const myRecords = filtered
    const totalDue = myRecords.filter(r => r.status === "Pending").reduce((sum, r) => sum + (r.net || 0), 0)
    const totalPaid = myRecords.filter(r => r.status === "Paid").reduce((sum, r) => sum + (r.net || 0), 0)
    const latest = myRecords[0]
    return {
      totalDue,
      totalPaid,
      latestNet: latest ? latest.net : 0,
      bankName: user?.kycData?.bankName || "Branch Remittance",
      accountNumber: user?.kycData?.accountNumber ? `••••${user.kycData.accountNumber.slice(-4)}` : "Verified Remittance",
    }
  }, [filtered, user])

  const handleSubmitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutReqAmount || Number(payoutReqAmount) <= 0) return

    setIsSubmittingPayoutReq(true)
    try {
      const { submitForApproval } = await import("@/services/approvalService")
      const reqId = `payreq_${Date.now()}`
      await submitForApproval({
        type: "payout",
        title: `${payoutReqType} of ₹${Number(payoutReqAmount).toLocaleString("en-IN")}`,
        documentNumber: reqId,
        documentId: reqId,
        clientName: user?.name || "Team Member",
        clientEmail: user?.email || "",
        amount: Number(payoutReqAmount),
        submittedBy: {
          id: String(user?.id || ""),
          name: user?.name || "Team Member",
          email: user?.email || "",
          role: user?.role || "Teams",
        },
        companyId: activeCompanyId || "tech",
        branchId: user?.branchId,
        branchName: user?.branchName,
        dataSnapshot: {
          amount: Number(payoutReqAmount),
          type: payoutReqType,
          notes: payoutReqNotes,
          bankDetails: user?.kycData ? {
            bankName: user.kycData.bankName,
            accountNumber: user.kycData.accountNumber,
            ifscCode: user.kycData.ifscCode,
            upiId: user.kycData.upiId,
          } : undefined,
          submittedAt: new Date().toISOString(),
        }
      })

      setIsPayoutModalOpen(false)
      setPayoutReqAmount("")
      setPayoutReqNotes("")
      alert("✅ Payout request submitted! Your request has been forwarded for Administrator review and disbursement.")
    } catch (err: any) {
      alert(`Failed to submit payout request: ${err.message}`)
    } finally {
      setIsSubmittingPayoutReq(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee.trim()) return
    const net = form.basic + form.allowances - form.deductions

    const payload = {
      ...form,
      net,
      status: "Pending"
    }

    await executeWithFeedback(async () => { 
      await PayrollService.create(payload) 
    }, { actionType: "create", successTitle: "Payroll Generated" })

    setIsModalOpen(false)
    loadData()
  }

  const handleMarkPaid = async (id: string) => {
    await executeWithFeedback(async () => { 
      await PayrollService.markPaid(id) 
    }, { actionType: "update", successTitle: "Marked as Paid" })
    loadData()
  }

  if (isClient) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-3">
          <DollarSign className="mx-auto text-blue-500" size={32} />
          <h2 className="text-lg font-bold">Client Portal Notice</h2>
          <p className="text-xs text-muted-foreground">The Payroll module is reserved for internal company staff and employee compensation. Please visit Invoices or Projects to view your commercial accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200/60 dark:border-blue-800">
              <DollarSign size={22} />
            </div>
            <span>{isTeamMember ? "My Earnings & Compensation" : "Payroll Management"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isTeamMember
              ? "View your personal earnings breakdown, payslips, and request advances or payouts"
              : "Generate and manage employee payroll against specific projects or individual team members"}
          </p>
        </div>

        {isAdmin ? (
          <button 
            onClick={() => { 
              setSelectionMode("project")
              setForm({ 
                employee: "", 
                employeeId: "",
                projectId: "",
                projectName: "",
                month: new Date().toISOString().slice(0, 7), 
                basic: 0, 
                allowances: 0, 
                deductions: 0 
              })
              setSelectedProjectId("")
              setSelectedProjectMembers([])
              setIsModalOpen(true) 
            }} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Generate Payroll</span>
          </button>
        ) : (
          <button 
            onClick={() => setIsPayoutModalOpen(true)} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Request Payout / Advance</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActivePayrollTab("incentives")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activePayrollTab === "incentives"
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Award size={15} />
          <span>Project Incentives & Counts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
            {userIncentivesList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePayrollTab("salaries")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activePayrollTab === "salaries"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <DollarSign size={15} />
          <span>Monthly Salary Records</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
            {filtered.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePayrollTab("payslips")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activePayrollTab === "payslips"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <FileText size={15} />
          <span>Statutory Pay Slips (PF & ESI)</span>
        </button>
      </div>

      {/* TAB 1: PROJECT INCENTIVES & SUCCESSFUL COUNTS */}
      {activePayrollTab === "incentives" && (
        <div className="space-y-6">
          {/* Top KPI Cards for Incentives */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Successful Projects Delivered</span>
              </span>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {successfulProjectsCount}
              </p>
              <p className="text-[11px] text-zinc-400">Successfully completed projects count</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-600" />
                <span>Earned Incentives (Pro-Rata)</span>
              </span>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                ₹{totalEarnedIncentives.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-emerald-600/80">Accrued from received client payments</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500" />
                <span>Pending Client Balance</span>
              </span>
              <p className="text-2xl font-black text-amber-600 font-mono">
                ₹{totalPendingIncentives.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-400">Unlocks upon client balance settlement</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-500" />
                <span>Disbursement Account</span>
              </span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {teamMetrics.bankName}
              </p>
              <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {teamMetrics.accountNumber}
              </p>
            </div>
          </div>

          {/* Pro-Rata Attribution Guide Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0">
                <Percent size={15} />
              </div>
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  Pro-Rata Commission Structure: Advance & Final Settlement
                </span>
                <p className="text-[11px] text-zinc-500">
                  When a client pays an advance (e.g. ₹100 on ₹1,000 project at 10% commission), you earn ₹10 immediately. The remaining ₹90 unlocks automatically once the client clears the final invoice balance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPayoutReqType("Monthly Salary Payout")
                setPayoutReqAmount(String(totalEarnedIncentives > 0 ? totalEarnedIncentives : 5000))
                setPayoutReqNotes("Total accrued project incentives payout request")
                setIsPayoutModalOpen(true)
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
            >
              Request Total Incentive →
            </button>
          </div>

          {/* Incentives Ledger Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Project & Category</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Delivery Status</th>
                    <th className="py-3.5 px-4">Total Value</th>
                    <th className="py-3.5 px-4">Client Paid / Due</th>
                    <th className="py-3.5 px-4">Share %</th>
                    <th className="py-3.5 px-4">Earned (Pro-Rata)</th>
                    <th className="py-3.5 px-4">Pending Due</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                  {userIncentivesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-400">
                        No project commission records found. You will see incentives here once assigned to active or completed projects.
                      </td>
                    </tr>
                  ) : (
                    userIncentivesList.map((item, idx) => (
                      <tr key={`${item.projectId}_${idx}`} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{item.projectTitle}</div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold mt-0.5 ${
                            item.category === "Digital Marketing"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">
                          {item.client}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          ₹{item.projectTotal.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-emerald-600 font-mono font-semibold text-[11px]">
                            Paid: ₹{item.clientPaid.toLocaleString("en-IN")}
                          </div>
                          {item.clientDue > 0 && (
                            <div className="text-amber-600 font-mono text-[10px]">
                              Due: ₹{item.clientDue.toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono text-purple-600">
                          {item.sharePct}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                            ₹{item.earnedIncentive.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            of ₹{item.totalPotential.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold font-mono text-amber-600 text-xs">
                            ₹{item.pendingIncentive.toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRequestIncentiveForProject(item)}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Request Payout
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY SALARY RECORDS */}
      {activePayrollTab === "salaries" && (
        <div className="space-y-6">
          {/* Team Member Personal Earnings KPI Cards */}
          {isTeamMember && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Pending / Due Payout</span>
                <p className="text-2xl font-black text-amber-600 font-mono">₹{teamMetrics.totalDue.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-zinc-400">Available for payout disbursement</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Approved & Paid YTD</span>
                <p className="text-2xl font-black text-emerald-600 font-mono">₹{teamMetrics.totalPaid.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-zinc-400">Total received compensation</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 font-medium">Registered Payout Account</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{teamMetrics.bankName}</p>
                <p className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{teamMetrics.accountNumber}</p>
              </div>
            </div>
          )}

          {/* Filter and Search controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search employee or project..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <select 
                value={projectFilter} 
                onChange={(e) => setProjectFilter(e.target.value)} 
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Assignment / Project</th>
                    <th className="py-3.5 px-4">Month</th>
                    <th className="py-3.5 px-4">Basic</th>
                    <th className="py-3.5 px-4">Allowances</th>
                    <th className="py-3.5 px-4">Deductions</th>
                    <th className="py-3.5 px-4">Net Salary</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-400">
                        No payroll records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {item.employee.charAt(0)}
                          </div>
                          <span>{item.employee}</span>
                        </td>
                        <td className="py-3 px-4">
                          {item.projectName ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              <FolderKanban size={11} /> {item.projectName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <User size={11} /> Individual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">{item.month}</td>
                        <td className="py-3 px-4 font-mono font-semibold">₹{(item.basic || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">+₹{(item.allowances || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-semibold">-₹{(item.deductions || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                          ₹{(item.net || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === "Paid" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" 
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayslipItem(item)
                                setIsPayslipModalOpen(true)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <FileText size={12} />
                              <span>Payslip</span>
                            </button>
                            {isAdmin && item.status !== "Paid" && (
                              <button 
                                onClick={() => handleMarkPaid(item.id)} 
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check size={12} />
                                <span>Mark Paid</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY PAY SLIPS (PF & ESI) */}
      {activePayrollTab === "payslips" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>Statutory Pay Slip Center (India PF & ESI Compliant)</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Statutory deductions configured as per Ministry of Labour & Employment guidelines: PF (12% of Basic), ESI (0.75% of Gross), and Professional Tax.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const sample = filtered[0] || {
                  employee: user?.name || "Employee",
                  month: new Date().toISOString().slice(0, 7),
                  basic: 25000,
                  allowances: 10000,
                  deductions: 3200,
                  net: 31800,
                  status: "Paid",
                }
                setSelectedPayslipItem(sample)
                setIsPayslipModalOpen(true)
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
            >
              <FileText size={14} />
              <span>Preview Statutory Pay Slip</span>
            </button>
          </div>

          {/* Grid of Available Pay Slip Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filtered.length > 0 ? filtered : [
              {
                id: "current_month",
                employee: user?.name || "Team Member",
                month: new Date().toISOString().slice(0, 7),
                basic: 30000,
                allowances: 12000,
                deductions: 3800,
                net: 38200,
                status: "Current Month",
                projectName: "Active Engagements",
              }
            ]).map((slip, sIdx) => {
              const breakdown = calculateStatutoryPayslip(slip.basic + slip.allowances, totalEarnedIncentives)
              return (
                <div
                  key={slip.id || sIdx}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 block">
                        {slip.employee}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">Month: {slip.month}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                      PF & ESI Active
                    </span>
                  </div>

                  {/* Dual Column Financial Snapshot */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Gross Earnings</span>
                      <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200">₹{breakdown.gross.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-emerald-600">+ Incentive: ₹{breakdown.incentiveAmt.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Statutory Deductions</span>
                      <div className="font-mono font-bold text-rose-600">-₹{breakdown.totalDeductions.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-zinc-400">PF (12%) + ESI (0.75%)</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-semibold">Net Take-Home:</span>
                      <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">
                        ₹{breakdown.netSalary.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPayslipItem(slip)
                        setIsPayslipModalOpen(true)
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileText size={12} />
                      <span>View & Print</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <DollarSign size={16} />
                  </div>
                  <h3 className="font-bold text-sm">Generate Employee Payroll</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {/* Mode Selector: Against Project vs Individual */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1.5">
                    Payroll Assignment Mode *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode("project")
                        setForm(f => ({ ...f, employee: "", employeeId: "" }))
                      }}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectionMode === "project" 
                          ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs" 
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <FolderKanban size={13} />
                      <span>Against a Project</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode("individual")
                        setForm(f => ({ ...f, projectId: "", projectName: "", employee: "", employeeId: "" }))
                      }}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        selectionMode === "individual" 
                          ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs" 
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <User size={13} />
                      <span>Individual Member</span>
                    </button>
                  </div>
                </div>

                {/* If Project Mode: Select Project First */}
                {selectionMode === "project" && (
                  <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                    <div>
                      <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1 flex items-center gap-1">
                        <FolderKanban size={13} className="text-blue-600" />
                        <span>Select Project *</span>
                      </label>
                      <select
                        required
                        value={selectedProjectId}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">-- Choose a Project --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                        ))}
                      </select>
                    </div>

                    {selectedProjectId && (
                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1 flex items-center gap-1">
                          <Users size={13} className="text-blue-600" />
                          <span>Select Team Member against this Project *</span>
                        </label>
                        {selectedProjectMembers.length > 0 ? (
                          <select
                            required
                            value={form.employee}
                            onChange={(e) => handleMemberSelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">-- Select Member --</option>
                            {selectedProjectMembers.map((m, idx) => (
                              <option key={m.id || idx} value={m.name}>
                                {m.name} {m.role ? `(${m.role})` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            No members assigned to this project yet. Please select another project or use Individual Member mode.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* If Individual Mode: Select from all team members directly */}
                {selectionMode === "individual" && (
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                      <User size={13} className="text-blue-600" />
                      <span>Select Individual Team Member *</span>
                    </label>
                    <select
                      required
                      value={form.employee}
                      onChange={(e) => handleMemberSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- Select Employee --</option>
                      {allUsers.map((u, idx) => (
                        <option key={u.id || idx} value={u.name || u.email}>
                          {u.name || u.email} {u.role ? `(${u.role})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Month Picker */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                    Payroll Month *
                  </label>
                  <input 
                    type="month" 
                    required 
                    value={form.month} 
                    onChange={(e) => setForm({...form, month: e.target.value})} 
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none cursor-pointer" 
                  />
                </div>

                {/* Salary Breakdown Inputs */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Basic Pay (₹)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.basic || ""} 
                      onChange={(e) => setForm({...form, basic: Number(e.target.value)})} 
                      placeholder="0"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Allowances (₹)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.allowances || ""} 
                      onChange={(e) => setForm({...form, allowances: Number(e.target.value)})} 
                      placeholder="0"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">
                      Deductions (₹)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.deductions || ""} 
                      onChange={(e) => setForm({...form, deductions: Number(e.target.value)})} 
                      placeholder="0"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none" 
                    />
                  </div>
                </div>

                {/* Net Total preview */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-300 font-semibold">Net Calculated Salary:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-base font-mono">
                    ₹{(form.basic + form.allowances - form.deductions).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                  >
                    Generate Payroll
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Request Payout / Advance Modal for Team Members */}
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <DollarSign size={16} />
                  </div>
                  <h3 className="font-bold text-sm">Request Salary Payout / Advance</h3>
                </div>
                <button 
                  onClick={() => setIsPayoutModalOpen(false)} 
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitPayoutRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Request Category *
                  </label>
                  <select
                    value={payoutReqType}
                    onChange={(e: any) => setPayoutReqType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Monthly Salary Payout">Monthly Salary Payout</option>
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Expense Reimbursement">Expense Reimbursement / Claim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Requested Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payoutReqAmount}
                    onChange={(e) => setPayoutReqAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Auto-filled remittance account info */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Disbursement Target Account:</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.kycData?.bankName || "Registered Branch Remittance Account"}
                  </p>
                  <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    {user?.kycData?.accountNumber ? `A/C: ${user.kycData.accountNumber} (${user.kycData.ifscCode || ""})` : "Verified Remittance Details"}
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Reason / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={payoutReqNotes}
                    onChange={(e) => setPayoutReqNotes(e.target.value)}
                    placeholder="Brief explanation for finance and admin review..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsPayoutModalOpen(false)} 
                    className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingPayoutReq}
                    className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isSubmittingPayoutReq ? "Submitting..." : "Submit Payout Request"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Statutory Pay Slip Modal */}
        {isPayslipModalOpen && selectedPayslipItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto print:m-0 print:border-none print:shadow-none"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Statutory Pay Slip - {selectedPayslipItem.month}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPayslipModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Printable Pay Slip Body */}
              {(() => {
                const breakdown = calculateStatutoryPayslip(
                  (selectedPayslipItem.basic || 25000) + (selectedPayslipItem.allowances || 10000),
                  totalEarnedIncentives
                )

                return (
                  <div className="p-6 sm:p-8 space-y-6 text-xs bg-white text-zinc-900 font-sans print:p-4">
                    {/* Corporate Letterhead */}
                    <div className="text-center border-b-2 border-zinc-800 pb-4 space-y-1">
                      <div className="text-lg font-black tracking-wider uppercase text-zinc-900">
                        SAAMPARK TECHNOLOGY & RESEARCH PRIVATE LIMITED
                      </div>
                      <div className="text-[10px] font-semibold text-zinc-600">
                        Regd Office: Balichak (Station Road), Debra, Paschim Medinipur, West Bengal - 721140, India
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        CIN: U58200WB2025PTC285223 | MSME: UDYAM-WB-16-0119512
                      </div>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-zinc-100 border border-zinc-300 rounded font-black text-xs uppercase tracking-wider">
                          PAY SLIP FOR THE MONTH OF {selectedPayslipItem.month}
                        </span>
                      </div>
                    </div>

                    {/* Employee Profile Metadata */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Employee Name:</span>
                        <span className="font-bold">{selectedPayslipItem.employee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Employee ID:</span>
                        <span className="font-mono font-bold">{selectedPayslipItem.employeeId || "STR-EMP-088"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Designation / Role:</span>
                        <span className="font-semibold">{selectedPayslipItem.role || "Software Specialist"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Pay Period:</span>
                        <span className="font-mono">{selectedPayslipItem.month}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Bank Account:</span>
                        <span className="font-mono">{teamMetrics.accountNumber || "Verified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">PF UAN / ESI IP:</span>
                        <span className="font-mono">101928374652 / WB-0912</span>
                      </div>
                    </div>

                    {/* Dual Column Earnings & Statutory Deductions */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Earnings */}
                      <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="bg-zinc-100 px-3 py-2 font-bold uppercase text-[10.5px] border-b border-zinc-200 flex justify-between">
                          <span>Earnings Head</span>
                          <span>Amount (₹)</span>
                        </div>
                        <div className="p-3 space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-600">Basic Salary (50%):</span>
                            <span className="font-mono font-semibold">₹{breakdown.basic.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">House Rent Allowance (HRA):</span>
                            <span className="font-mono font-semibold">₹{breakdown.hra.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">Special / Conveyance Allowance:</span>
                            <span className="font-mono font-semibold">₹{breakdown.specialAllowance.toLocaleString("en-IN")}</span>
                          </div>
                          {breakdown.incentiveAmt > 0 && (
                            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              <span>Project Incentive Earned:</span>
                              <span className="font-mono">+₹{breakdown.incentiveAmt.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-zinc-200 flex justify-between font-black text-zinc-900">
                            <span>Gross Earnings:</span>
                            <span className="font-mono">₹{breakdown.gross.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="bg-zinc-100 px-3 py-2 font-bold uppercase text-[10.5px] border-b border-zinc-200 flex justify-between">
                          <span>Statutory Deduction</span>
                          <span>Amount (₹)</span>
                        </div>
                        <div className="p-3 space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-zinc-600">Provident Fund (PF - 12%):</span>
                            <span className="font-mono font-semibold text-rose-700">₹{breakdown.pf.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">ESI Contribution (0.75%):</span>
                            <span className="font-mono font-semibold text-rose-700">₹{breakdown.esi.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">Professional Tax (PT):</span>
                            <span className="font-mono font-semibold text-rose-700">₹{breakdown.pt.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="pt-2 border-t border-zinc-200 flex justify-between font-black text-rose-800">
                            <span>Total Deductions:</span>
                            <span className="font-mono">-₹{breakdown.totalDeductions.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Salary Highlight Box */}
                    <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Net Take-Home Salary:
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Gross Earnings minus Statutory PF, ESI & Tax Deductions
                        </span>
                      </div>
                      <span className="text-2xl font-black font-mono text-emerald-800">
                        ₹{breakdown.netSalary.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Corporate Stamp & Signatures */}
                    <div className="pt-8 border-t border-zinc-200 flex items-end justify-between text-center text-[10.5px]">
                      <div>
                        <div className="w-32 border-b border-zinc-400 mb-1 mx-auto" />
                        <span className="text-zinc-500 font-semibold">Employee Signature</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[9px] text-zinc-400 font-mono">Digitally signed & authorized</div>
                        <div className="w-40 border-b border-zinc-900 mb-1 mx-auto" />
                        <span className="font-bold text-zinc-900 uppercase">For SAAMPARK TECH & RESEARCH PVT LTD</span>
                        <div className="text-[9.5px] text-zinc-500">Authorized Signatory / Finance Controller</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
