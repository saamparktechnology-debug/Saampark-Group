"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calculator, Plus, Search, Download, Trash2, CheckCircle2, 
  Clock, XCircle, FileText, Printer, X, Check, DollarSign,
  Briefcase, Users, TrendingUp, Percent, ArrowUpRight, ArrowDownRight,
  Receipt, Building2, Tag, Layers, CreditCard, ShieldAlert, Sparkles, User
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { Project, ProjectMember } from "@/app/feature/projects/types"
import { getInvoices, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

export interface ProjectExtraCharge {
  id: string
  projectId: string
  title: string
  amount: number
  category: string
  date: string
  payee?: string
  vendor?: string
  notes?: string
}

export interface ExpenseItem {
  id: string
  expenseNumber: string
  title: string
  amount: string
  amountNum: number
  category: string
  date: string
  member: string
  receiptUrl?: string
  status: "Approved" | "Pending" | "Rejected"
  notes?: string
  // Project-Wise Expense Attribution
  projectId?: string
  projectName?: string
  isProjectExpense?: boolean
  assignedMemberId?: string
  isExtraCharge?: boolean
  extraChargeCategory?: string
}

type ExpenseTab = "all" | "project_wise"

export default function ExpensesMain() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const targetComp = activeCompanyId || user?.companyId || "tech"
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAddExpense = canPerformAction(user, "Expenses", "add")
  const canEditExpense = canPerformAction(user, "Expenses", "edit")
  const canDeleteExpense = canPerformAction(user, "Expenses", "delete")

  const [activeViewTab, setActiveViewTab] = React.useState<ExpenseTab>("all")
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [extraCharges, setExtraCharges] = React.useState<ProjectExtraCharge[]>([])
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  
  // Selected Project for Project-Wise Ledger
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isAddExtraChargeModalOpen, setIsAddExtraChargeModalOpen] = React.useState(false)

  // Form State: Add Expense
  const [title, setTitle] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [category, setCategory] = React.useState("Cloud & Server Infrastructure")
  const [member, setMember] = React.useState(user?.name || "Admin")
  const [receiptUrl, setReceiptUrl] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isProjectScoped, setIsProjectScoped] = React.useState(false)
  const [formProjectId, setFormProjectId] = React.useState("")
  const [formMemberId, setFormMemberId] = React.useState("")

  // Form State: Add Project Extra Charge
  const [extraChargeTitle, setExtraChargeTitle] = React.useState("")
  const [extraChargeAmount, setExtraChargeAmount] = React.useState("")
  const [extraChargeCategory, setExtraChargeCategory] = React.useState("Subcontractor & Specialist Fees")
  const [extraChargeVendor, setExtraChargeVendor] = React.useState("")
  const [extraChargeNotes, setExtraChargeNotes] = React.useState("")

  const loadData = React.useCallback(async () => {
    try {
      const [expData, projData, chargesData, invData] = await Promise.all([
        fetchModuleDataFromDB<ExpenseItem[]>("expenses", [], targetComp).catch(() => []),
        getProjects(targetComp).catch(() => []),
        fetchModuleDataFromDB<ProjectExtraCharge[]>("project_extra_charges", [], targetComp).catch(() => []),
        getInvoices(targetComp).catch(() => []),
      ])

      const cleanExpenses = Array.isArray(expData) ? filterGlobalDeletedItems(expData) : []
      const cleanProjects = Array.isArray(projData) ? filterGlobalDeletedItems(projData) : []
      const cleanCharges = Array.isArray(chargesData) ? filterGlobalDeletedItems(chargesData) : []

      setExpenses(cleanExpenses)
      setProjects(cleanProjects)
      setExtraCharges(cleanCharges)
      setInvoices(Array.isArray(invData) ? invData : [])

      if (cleanProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(cleanProjects[0].id)
      }
    } catch (err) {
      console.warn("Error loading expenses data:", err)
    }
  }, [targetComp, selectedProjectId])

  React.useEffect(() => {
    loadData()
    window.addEventListener("storage", loadData)
    window.addEventListener("saampark_data_synced", loadData)
    window.addEventListener("saampark_company_switched", loadData)
    window.addEventListener("saampark_branch_switched", loadData)
    window.addEventListener("saampark_projects_updated", loadData)
    return () => {
      window.removeEventListener("storage", loadData)
      window.removeEventListener("saampark_data_synced", loadData)
      window.removeEventListener("saampark_company_switched", loadData)
      window.removeEventListener("saampark_branch_switched", loadData)
      window.removeEventListener("saampark_projects_updated", loadData)
    }
  }, [loadData])

  // Current active project in Project-Wise view
  const currentProject = React.useMemo(() => {
    if (!selectedProjectId) return projects[0] || null
    return projects.find(p => String(p.id).toLowerCase().trim() === String(selectedProjectId).toLowerCase().trim()) || projects[0] || null
  }, [projects, selectedProjectId])

  // Project revenue parsing
  const projectRevenueNum = React.useMemo(() => {
    if (!currentProject) return 0
    if (typeof currentProject.totalAmount === "number" && currentProject.totalAmount > 0) {
      return currentProject.totalAmount
    }
    const rawPrice = currentProject.price || "₹0"
    const parsed = parseInt(String(rawPrice).replace(/[^0-9]/g, "")) || 0
    return parsed
  }, [currentProject])

  // Filtered expenses for general view
  const filteredExpenses = React.useMemo(() => {
    const { activeCompanyId: freshComp, activeBranchId: freshBranch, branches: freshBranches } = useAuthStore.getState()
    const userComp = (freshComp || user?.companyId || "").toLowerCase().trim()
    // Strict: activeBranchId takes priority
    const targetBranch = freshBranch
    const targetBranchObj = freshBranches.find(b => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
    const targetBranchId = String(targetBranchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

    return expenses.filter((e) => {
      // Company filter
      if (userComp && userComp !== "all") {
        const eComp = String((e as any).companyId || "").toLowerCase().trim()
        if (eComp && eComp !== userComp) return false
        if (!eComp && userComp !== "tech") return false
      }
      // Branch filter (strict)
      if (targetBranch && targetBranch !== "all") {
        const eBranch = String((e as any).branchId || (e as any).branch_id || "").toLowerCase().trim()
        const eBranchName = String((e as any).branchName || (e as any).branch_name || "").toLowerCase().trim()
        if (!eBranch && !eBranchName) return false
        const isMatch =
          (eBranch && (eBranch === targetBranchId || (targetBranchName && eBranch === targetBranchName))) ||
          (eBranchName && (eBranchName === targetBranchName || eBranchName === targetBranchId))
        if (!isMatch) return false
      }
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.projectName && e.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
      if (!matchSearch) return false
      if (selectedCategory === "all") return true
      return e.category === selectedCategory
    })
  }, [expenses, searchQuery, selectedCategory, activeCompanyId, activeBranchId, branches, user])

  // Project-specific expenses
  const projectExpenses = React.useMemo(() => {
    if (!currentProject) return []
    const pId = String(currentProject.id).toLowerCase().trim()
    const pTitle = String(currentProject.title || "").toLowerCase().trim()

    return expenses.filter(e => {
      const eProjId = String(e.projectId || "").toLowerCase().trim()
      const eProjName = String(e.projectName || "").toLowerCase().trim()
      return (eProjId && eProjId === pId) || (eProjName && eProjName === pTitle)
    })
  }, [expenses, currentProject])

  // Project-specific custom extra charges
  const projectExtraCharges = React.useMemo(() => {
    if (!currentProject) return []
    const pId = String(currentProject.id).toLowerCase().trim()
    return extraCharges.filter(c => String(c.projectId).toLowerCase().trim() === pId)
  }, [extraCharges, currentProject])

  // Financial Calculations for Selected Project
  const totalMemberExpensesNum = projectExpenses.reduce((sum, e) => sum + (e.amountNum || 0), 0)
  const totalExtraChargesNum = projectExtraCharges.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalProjectExpenses = totalMemberExpensesNum + totalExtraChargesNum
  const netProfit = projectRevenueNum - totalProjectExpenses
  const profitMarginPct = projectRevenueNum > 0 ? Math.round((netProfit / projectRevenueNum) * 100) : 0
  const isProfitable = netProfit >= 0

  // Per-member expense breakdown on this project
  const memberCostMap = React.useMemo(() => {
    const map: Record<string, number> = {}
    projectExpenses.forEach(e => {
      const key = (e.member || "Unassigned").toLowerCase().trim()
      map[key] = (map[key] || 0) + (e.amountNum || 0)
    })
    return map
  }, [projectExpenses])

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount.trim()) {
      alert("Please fill in title and amount.")
      return
    }

    const numAmount = parseInt(amount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`
    const maxNum = expenses.reduce((max, exp) => {
      const num = parseInt(String(exp.expenseNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 100)

    const targetProject = isProjectScoped && formProjectId 
      ? projects.find(p => p.id === formProjectId) 
      : null

    const newExp: ExpenseItem = {
      id: `exp_${Date.now()}`,
      expenseNumber: `EXP #${maxNum + 1}`,
      title,
      amount: formattedAmount,
      amountNum: numAmount,
      category,
      date: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      member: member || user?.name || "Admin",
      receiptUrl,
      status: isAdmin ? "Approved" : "Pending",
      notes,
      projectId: targetProject?.id,
      projectName: targetProject?.title,
      isProjectExpense: Boolean(targetProject),
      assignedMemberId: formMemberId || undefined,
    }

    await executeWithFeedback(async () => {
      const updated = [newExp, ...expenses]
      setExpenses(updated)
      await saveModuleDataToDB("expenses", updated, targetComp)

      setIsAddModalOpen(false)
      setTitle("")
      setAmount("")
      setNotes("")
      setIsProjectScoped(false)
      setFormProjectId("")
      setFormMemberId("")
    }, {
      actionType: "create",
      loadingTitle: "Recording Expense...",
      loadingMsg: `Logging ${newExp.expenseNumber} for ${title}...`,
      successTitle: "Expense Recorded!",
      successMsg: `Expense ${newExp.expenseNumber} recorded successfully.`,
      errorTitle: "Expense Failed",
    })
  }

  const handleAddExtraCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extraChargeTitle.trim() || !extraChargeAmount.trim() || !currentProject) {
      alert("Please fill in all extra charge details.")
      return
    }

    const numAmount = parseInt(extraChargeAmount.replace(/[^0-9]/g, "")) || 0
    const newCharge: ProjectExtraCharge = {
      id: `charge_${Date.now()}`,
      projectId: currentProject.id,
      title: extraChargeTitle.trim(),
      amount: numAmount,
      category: extraChargeCategory,
      date: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      vendor: extraChargeVendor.trim() || undefined,
      notes: extraChargeNotes.trim() || undefined,
    }

    await executeWithFeedback(async () => {
      const updated = [newCharge, ...extraCharges]
      setExtraCharges(updated)
      await saveModuleDataToDB("project_extra_charges", updated, targetComp)

      setIsAddExtraChargeModalOpen(false)
      setExtraChargeTitle("")
      setExtraChargeAmount("")
      setExtraChargeVendor("")
      setExtraChargeNotes("")
    }, {
      actionType: "create",
      loadingTitle: "Applying Extra Charge...",
      loadingMsg: `Adding "${newCharge.title}" to ${currentProject.title}...`,
      successTitle: "Extra Charge Added!",
      successMsg: `₹${numAmount.toLocaleString("en-IN")} direct cost added to ${currentProject.title}.`,
      errorTitle: "Failed to Add Charge",
    })
  }

  const handleDeleteExtraCharge = async (chargeId: string, cTitle: string) => {
    await executeWithFeedback(async () => {
      const updated = extraCharges.filter(c => c.id !== chargeId)
      setExtraCharges(updated)
      await saveModuleDataToDB("project_extra_charges", updated, targetComp)
    }, {
      actionType: "delete",
      loadingTitle: "Removing Extra Charge...",
      loadingMsg: `Deleting charge "${cTitle}"...`,
      successTitle: "Charge Removed",
      successMsg: `Extra charge "${cTitle}" removed from project ledger.`,
      errorTitle: "Delete Failed",
    })
  }

  const handleUpdateStatus = async (id: string, status: ExpenseItem["status"]) => {
    await executeWithFeedback(async () => {
      const updated = expenses.map(e => e.id === id ? { ...e, status } : e)
      setExpenses(updated)
      await saveModuleDataToDB("expenses", updated, targetComp)
    }, {
      actionType: "update",
      loadingTitle: "Updating Status...",
      loadingMsg: `Marking expense as ${status}...`,
      successTitle: `Expense ${status}`,
      successMsg: `Status updated to ${status}.`,
      errorTitle: "Update Failed",
    })
  }

  const handleDelete = async (id: string) => {
    const exp = expenses.find(e => e.id === id)
    const expNum = exp?.expenseNumber || "Expense"

    await executeWithFeedback(async () => {
      await markGlobalItemDeleted(id, "expenses")
      const updated = expenses.filter(e => e.id !== id)
      setExpenses(updated)
      await saveModuleDataToDB("expenses", updated, targetComp)
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Expense...",
      loadingMsg: `Removing ${expNum}...`,
      successTitle: "Expense Deleted",
      successMsg: `${expNum} removed successfully.`,
      errorTitle: "Delete Failed",
    })
  }

  const totalExpenseNum = expenses.reduce((sum, e) => sum + (e.amountNum || 0), 0)
  const approvedNum = expenses.filter(e => e.status === "Approved").reduce((sum, e) => sum + (e.amountNum || 0), 0)
  const pendingCount = expenses.filter(e => e.status === "Pending").length

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* ---------------- TOP HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Operational Expenses &amp; Project Profitability</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track business operating costs, project-wise team deliverables, custom subcontractor charges, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeViewTab === "project_wise" && currentProject) {
                exportToExcel({
                  filename: `SAAMPARK_Project_Cost_${currentProject.title.replace(/\s+/g, "_")}`,
                  title: `Project Profitability Statement: ${currentProject.title}`,
                  subtitle: `Client: ${currentProject.client} | Contract: ₹${projectRevenueNum.toLocaleString("en-IN")}`,
                  headers: ["Type", "Title / Item", "Category / Role", "Amount (INR)", "Date", "Status / Paid To"],
                  rows: [
                    ...projectExpenses.map(e => [
                      "Team Expense",
                      e.title,
                      e.category,
                      `₹${e.amountNum.toLocaleString("en-IN")}`,
                      e.date,
                      `${e.member} (${e.status})`,
                    ]),
                    ...projectExtraCharges.map(c => [
                      "Custom Extra Charge",
                      c.title,
                      c.category,
                      `₹${c.amount.toLocaleString("en-IN")}`,
                      c.date,
                      c.payee || c.vendor || "Direct Payee",
                    ]),
                    ["SUMMARY", "Contract Billed Revenue", "-", `₹${projectRevenueNum.toLocaleString("en-IN")}`, "-", "-"],
                    ["SUMMARY", "Total Project Expenses", "-", `₹${totalProjectExpenses.toLocaleString("en-IN")}`, "-", "-"],
                    ["SUMMARY", "Net Profit", "-", `₹${netProfit.toLocaleString("en-IN")}`, "-", `${profitMarginPct}% Margin`],
                  ],
                })
              } else {
                exportToExcel({
                  filename: "SAAMPARK_Operational_Expenses",
                  title: "Operational Expenses Report",
                  subtitle: selectedCategory === "all" ? "All Expenses" : selectedCategory,
                  headers: ["#", "Expense #", "Title", "Category", "Amount (₹)", "Date", "Recorded By", "Project", "Status"],
                  rows: filteredExpenses.map((exp, idx) => [
                    idx + 1,
                    exp.expenseNumber,
                    exp.title,
                    exp.category,
                    `₹${exp.amountNum.toLocaleString("en-IN")}`,
                    exp.date,
                    exp.member,
                    exp.projectName || "General",
                    exp.status,
                  ]),
                })
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
          >
            <Download size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: activeViewTab === "project_wise" && currentProject ? `Project Cost & Net Profit: ${currentProject.title}` : "Operational Expenses Report",
                subtitle: activeViewTab === "project_wise" && currentProject ? `Contract: ₹${projectRevenueNum.toLocaleString("en-IN")} | Net Profit: ₹${netProfit.toLocaleString("en-IN")} (${profitMarginPct}%)` : (selectedCategory === "all" ? "All Expenses" : selectedCategory),
                headers: ["Ref #", "Title", "Category", "Amount", "Date", "Member / Payee", "Status"],
                rows: (activeViewTab === "project_wise" ? projectExpenses : filteredExpenses).map((exp, idx) => [
                  exp.expenseNumber,
                  exp.title,
                  exp.category,
                  `₹${exp.amountNum.toLocaleString("en-IN")}`,
                  exp.date,
                  exp.member,
                  exp.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAddExpense && (
            <button
              type="button"
              onClick={() => {
                if (activeViewTab === "project_wise" && currentProject) {
                  setIsProjectScoped(true)
                  setFormProjectId(currentProject.id)
                }
                setIsAddModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- VIEW TABS (GENERAL VS PROJECT-WISE) ---------------- */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveViewTab("all")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeViewTab === "all"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Receipt size={14} />
          <span>All Operational Expenses</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("project_wise")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
            activeViewTab === "project_wise"
              ? "border-emerald-600 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Briefcase size={14} />
          <span>💼 Project-Wise Expenses &amp; Net Profit</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
            {projects.length} Projects
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: ALL GENERAL OPERATIONAL EXPENSES ────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeViewTab === "all" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Total Expenses Incurred</p>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">₹{totalExpenseNum.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
                <Calculator size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Approved &amp; Settled</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{approvedNum.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Pending Approval</p>
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount} Expenses</h3>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search expense, project, category, member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Cloud & Server Infrastructure">Cloud &amp; Server Infrastructure</option>
                <option value="SaaS & Software Subscriptions">SaaS &amp; Software Subscriptions</option>
                <option value="Subcontractor & Freelancer Fees">Subcontractor &amp; Freelancer Fees</option>
                <option value="Office & Operational Utilities">Office &amp; Operational Utilities</option>
                <option value="Marketing & Lead Acquisition">Marketing &amp; Lead Acquisition</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Associated Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-400">
                      No expense records found. Click "+ Add Expense" to log business costs.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                    if (exp.status === "Approved") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    if (exp.status === "Pending") statusBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                    if (exp.status === "Rejected") statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"

                    return (
                      <tr key={exp.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {exp.expenseNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {exp.title}
                        </td>
                        <td className="py-3 px-4">
                          {exp.projectName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10.5px] font-semibold border border-blue-200 dark:border-blue-800">
                              <Briefcase size={10} />
                              <span className="truncate max-w-[140px]">{exp.projectName}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">General Overhead</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                          {exp.category}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400 font-mono">
                          {exp.amount}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{exp.date}</td>
                        <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">{exp.member}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEditExpense && exp.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(exp.id, "Approved")}
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                                  title="Approve Expense"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(exp.id, "Rejected")}
                                  className="p-1 rounded text-rose-600 hover:bg-rose-50"
                                  title="Reject Expense"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}

                            {canDeleteExpense && (
                              <button
                                type="button"
                                onClick={() => handleDelete(exp.id)}
                                className="p-1 hover:text-rose-600 text-zinc-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
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
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: PROJECT-WISE EXPENSES, EXTRA CHARGES & NET PROFIT ───────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeViewTab === "project_wise" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Project Selector Bar */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Select Project to Inspect Profitability</h3>
                  <p className="text-[11px] text-zinc-500">Live reconciliation of contract billing vs. assigned member costs &amp; custom payee expenses</p>
                </div>
              </div>

              {/* Project Dropdown */}
              <div className="w-full sm:w-80">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.client || "Client"}) — {p.price || "₹0"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Project Info Pill */}
            {currentProject && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-500" />
                    <span>Client: {currentProject.client}</span>
                  </span>
                  <span className="text-zinc-500">|</span>
                  <span className="text-zinc-500">Timeline: {currentProject.startDate || "Ongoing"} &rarr; {currentProject.deadline || "TBD"}</span>
                  <span className="text-zinc-500">|</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 text-[10.5px] font-bold">
                    {currentProject.status || "In Progress"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectScoped(true)
                      setFormProjectId(currentProject.id)
                      setIsAddModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Log Member Expense</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddExtraChargeModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs hover:bg-purple-100 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Custom Extra Charge</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4 Financial Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Contract Revenue */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
                <span>Contract Billed Revenue</span>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Receipt size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                ₹{projectRevenueNum.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-500">Gross billing agreed with client</p>
            </div>

            {/* 2. Team Member Expenses */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
                <span>Team Member Costs</span>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <Users size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{totalMemberExpensesNum.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-500">{projectExpenses.length} member expense logs recorded</p>
            </div>

            {/* 3. Custom Extra Charges */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
                <span>Custom Direct Charges</span>
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Tag size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                ₹{totalExtraChargesNum.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-500">{projectExtraCharges.length} subcontractor / supplier charges</p>
            </div>

            {/* 4. Net Profit & Margin */}
            <div className={`p-5 rounded-2xl border shadow-2xs space-y-1.5 ${
              isProfitable 
                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isProfitable ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}>
                  Net Profit (Take-Home)
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold ${
                  isProfitable ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}>
                  {profitMarginPct}% Margin
                </span>
              </div>
              <p className={`text-2xl font-black ${isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                ₹{netProfit.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-zinc-500">
                Total Expenses: ₹{totalProjectExpenses.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Interactive Profitability Split Progress Bar */}
          {projectRevenueNum > 0 && (
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <span>📊 Project Financial Distribution &amp; Cost Allocation</span>
                <span className="font-mono text-zinc-500">Revenue: ₹{projectRevenueNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800 shadow-inner">
                {/* Net Profit Bar */}
                {isProfitable && (
                  <div
                    style={{ width: `${Math.max(0, Math.min(100, profitMarginPct))}%` }}
                    className="bg-emerald-500 h-full transition-all text-[9px] text-white font-bold flex items-center justify-center"
                    title={`Net Profit: ₹${netProfit.toLocaleString("en-IN")} (${profitMarginPct}%)`}
                  >
                    {profitMarginPct >= 15 ? `${profitMarginPct}% Profit` : ""}
                  </div>
                )}
                {/* Team Costs Bar */}
                <div
                  style={{ width: `${Math.min(100, Math.round((totalMemberExpensesNum / projectRevenueNum) * 100))}%` }}
                  className="bg-amber-500 h-full transition-all text-[9px] text-white font-bold flex items-center justify-center"
                  title={`Member Costs: ₹${totalMemberExpensesNum.toLocaleString("en-IN")}`}
                >
                  {Math.round((totalMemberExpensesNum / projectRevenueNum) * 100) >= 12 ? "Member Costs" : ""}
                </div>
                {/* Extra Charges Bar */}
                <div
                  style={{ width: `${Math.min(100, Math.round((totalExtraChargesNum / projectRevenueNum) * 100))}%` }}
                  className="bg-purple-600 h-full transition-all text-[9px] text-white font-bold flex items-center justify-center"
                  title={`Custom Extra Charges: ₹${totalExtraChargesNum.toLocaleString("en-IN")}`}
                >
                  {Math.round((totalExtraChargesNum / projectRevenueNum) * 100) >= 12 ? "Extra Charges" : ""}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Net Profit: ₹{netProfit.toLocaleString("en-IN")} ({profitMarginPct}%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Member Costs: ₹{totalMemberExpensesNum.toLocaleString("en-IN")}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>Extra Charges: ₹{totalExtraChargesNum.toLocaleString("en-IN")}</span>
                </span>
              </div>
            </div>
          )}

          {/* ---------------- ASSIGNED TEAM MEMBERS & COST ALLOCATION ---------------- */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <span>Assigned Team Members &amp; Individual Expense Attribution</span>
                </h3>
                <p className="text-[11px] text-zinc-500">Track costs logged by or allocated to each specialist on this deliverable</p>
              </div>
            </div>

            {(!currentProject?.members || currentProject.members.length === 0) ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 text-center text-xs text-zinc-400">
                No team members assigned to this project yet. Edit the project in Projects module to assign staff.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentProject.members.map((m) => {
                  const mKey = (m.name || "").toLowerCase().trim()
                  const mCost = memberCostMap[mKey] || 0
                  return (
                    <div
                      key={m.id || m.name}
                      className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`}
                          alt={m.name}
                          className="w-8 h-8 rounded-full border shrink-0"
                        />
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{m.name}</h4>
                          <p className="text-[10px] text-zinc-500 truncate">{m.role || "Member"}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 block">
                          ₹{mCost.toLocaleString("en-IN")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProjectScoped(true)
                            setFormProjectId(currentProject.id)
                            setMember(m.name)
                            setIsAddModalOpen(true)
                          }}
                          className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          + Log Cost
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ---------------- CUSTOM DIRECT EXTRA CHARGES LEDGER ---------------- */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Tag size={16} className="text-purple-600" />
                  <span>Custom Direct Extra Charges &amp; Subcontracting Costs</span>
                </h3>
                <p className="text-[11px] text-zinc-500">Dedicated supplies, cloud servers, specialized APIs, or subcontractor invoices</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddExtraChargeModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Add Extra Charge</span>
              </button>
            </div>

            {projectExtraCharges.length === 0 ? (
              <div className="p-6 rounded-xl bg-purple-50/20 dark:bg-purple-950/10 border border-dashed border-purple-200/60 dark:border-purple-800/40 text-center text-xs text-zinc-500 space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">No custom extra charges recorded for this project.</p>
                <p className="text-[11px]">Click above to add supplier bills, subcontractor charges, or domain/hosting fees.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10.5px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Charge Item</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Payee / Supplier</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5 text-right">Amount</th>
                      <th className="py-2.5 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                    {projectExtraCharges.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-zinc-900 dark:text-zinc-100">{c.title}</td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium text-[10.5px] border border-purple-200 dark:border-purple-800">
                            {c.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-400">{c.payee || c.vendor || "Direct Payee"}</td>
                        <td className="py-2.5 px-3.5 font-mono text-zinc-500 text-[11px]">{c.date}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                          ₹{c.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraCharge(c.id, c.title)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Delete Charge"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---------------- COMBINED PROJECT EXPENSES LEDGER ---------------- */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Receipt size={16} className="text-emerald-600" />
              <span>All Logged Expenses for {currentProject?.title}</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10.5px]">
                  <tr>
                    <th className="py-2.5 px-3.5">Ref #</th>
                    <th className="py-2.5 px-3.5">Expense Title</th>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Member</th>
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5 text-right">Amount</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                  {projectExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        No team expenses recorded for this project yet. Click "+ Add Expense" above to log costs.
                      </td>
                    </tr>
                  ) : (
                    projectExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold font-mono text-blue-600">{exp.expenseNumber}</td>
                        <td className="py-2.5 px-3.5 font-bold text-zinc-900 dark:text-zinc-100">{exp.title}</td>
                        <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-400">{exp.category}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-zinc-800 dark:text-zinc-200">{exp.member}</td>
                        <td className="py-2.5 px-3.5 font-mono text-zinc-500 text-[11px]">{exp.date}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{exp.amount}</td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                            exp.status === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: RECORD EXPENSE ─────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={18} className="text-blue-600" />
                  <span>Record Operational Expense</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4 text-xs">
                {/* Project Association Toggle */}
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-600" />
                      <span>Associate with Client Project?</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={isProjectScoped}
                      onChange={(e) => setIsProjectScoped(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {isProjectScoped && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Select Project *</label>
                        <select
                          value={formProjectId}
                          onChange={(e) => setFormProjectId(e.target.value)}
                          required={isProjectScoped}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                        >
                          <option value="">Choose Project</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Assigned Specialist</label>
                        <select
                          value={member}
                          onChange={(e) => setMember(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold"
                        >
                          <option value={user?.name || "Admin"}>{user?.name || "Admin"} (Current User)</option>
                          {formProjectId && projects.find(p => p.id === formProjectId)?.members?.map(m => (
                            <option key={m.name} value={m.name}>{m.name} ({m.role || "Member"})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Expense Title / Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Dedicated Database or Design Stock Assets"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    >
                      <option value="Cloud & Server Infrastructure">Cloud &amp; Server Infrastructure</option>
                      <option value="SaaS & Software Subscriptions">SaaS &amp; Software Subscriptions</option>
                      <option value="Subcontractor & Freelancer Fees">Subcontractor &amp; Freelancer Fees</option>
                      <option value="Design Assets & Stock Media">Design Assets &amp; Stock Media</option>
                      <option value="Office & Operational Utilities">Office &amp; Operational Utilities</option>
                      <option value="Marketing & Lead Acquisition">Marketing &amp; Lead Acquisition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 18500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                {!isProjectScoped && (
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Paid By / Team Member</label>
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => setMember(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Receipt / Invoice Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Record Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: ADD CUSTOM PROJECT EXTRA CHARGE ─────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddExtraChargeModalOpen && currentProject && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Tag size={18} className="text-purple-600" />
                  <span>Add Direct Project Extra Charge</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddExtraChargeModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddExtraCharge} className="p-6 space-y-4 text-xs">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">
                    Target Project: {currentProject.title}
                  </span>
                  <span className="text-[10px] text-zinc-500">Client: {currentProject.client}</span>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Charge Title / Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subcontractor Mobile App Developer Fees"
                    value={extraChargeTitle}
                    onChange={(e) => setExtraChargeTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Charge Category</label>
                    <select
                      value={extraChargeCategory}
                      onChange={(e) => setExtraChargeCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    >
                      <option value="Subcontractor & Specialist Fees">Subcontractor &amp; Specialist Fees</option>
                      <option value="Material & Direct Supply">Material &amp; Direct Supply</option>
                      <option value="Dedicated Cloud VM & Hosting">Dedicated Cloud VM &amp; Hosting</option>
                      <option value="Domain & SSL Certificates">Domain &amp; SSL Certificates</option>
                      <option value="Third-Party API Licenses">Third-Party API Licenses</option>
                      <option value="Hardware / Equipment Rental">Hardware / Equipment Rental</option>
                      <option value="Logistics & Travel">Logistics &amp; Travel</option>
                      <option value="Other Project Cost">Other Project Cost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 12000"
                      value={extraChargeAmount}
                      onChange={(e) => setExtraChargeAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Payee / Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CloudTech Solutions Ltd / Rajib Sen"
                    value={extraChargeVendor}
                    onChange={(e) => setExtraChargeVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Notes / Scope Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Milestone 2 backend API development fees"
                    value={extraChargeNotes}
                    onChange={(e) => setExtraChargeNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddExtraChargeModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                  >
                    Apply Extra Charge
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
