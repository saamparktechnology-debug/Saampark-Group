"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, Download, Calendar, Filter, TrendingUp, Users, 
  DollarSign, CheckSquare, Target, PieChart, ArrowUpRight, ArrowDownRight, FileText,
  Receipt, ShieldCheck, AlertCircle, Building2, MapPin, Search, CheckCircle2, Clock, Landmark, Percent, Layers
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore, SubBranch } from "@/store/useAuthStore"
import { getUsers } from "../users/services/userService"
import { getInvoices, InvoiceItem } from "../sales/invoices/services/invoiceService"
import { getPayments, PaymentItem } from "../sales/payments/services/paymentService"
import { fetchModuleDataFromDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { getClients } from "../clients/services/clientService"
import { ClientItem } from "../clients/types"
import { taskService } from "../tasks/services/taskService"
import { Task } from "../tasks/types"
import { getLeads } from "../leads/services/leadService"
import { Lead } from "../leads/types"

type ReportTab = "revenue" | "gst_analytics" | "sub_branches" | "leads" | "productivity" | "attendance" | "expenses"
type InvoiceFilterType = "all" | "gst" | "non_gst" | "due" | "paid" | "partially_paid"

export default function ReportsMain() {
  const { user, branches, subBranches, fetchSubBranches, activeCompanyId, activeBranchId } = useAuthStore()
  
  const isSuperAdmin = user?.role === "Super Admin"
  const isAdmin = user?.role === "Admin"
  const isTeamOrBranchAdmin = !isSuperAdmin && !isAdmin

  // Active Company Selection
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(
    activeCompanyId || (isSuperAdmin ? "all" : user?.companyId || "tech")
  )

  // Active Branches available
  const availableBranches = React.useMemo(() => {
    if (!branches || !Array.isArray(branches)) return []
    if (selectedCompanyId && selectedCompanyId !== "all") {
      return branches.filter((b) => b.companyId === selectedCompanyId)
    }
    return branches
  }, [branches, selectedCompanyId])

  // User's default or assigned branch
  const userAssignedBranchId = user?.branchId || ""
  const userAssignedBranchName = user?.branchName || ""

  // Selected Branch state
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(() => {
    if (activeBranchId) return activeBranchId
    if (isSuperAdmin) return "all"
    if (userAssignedBranchId) return userAssignedBranchId
    return "all"
  })

  // Sync activeCompanyId & activeBranchId from auth store if changed
  React.useEffect(() => {
    if (activeCompanyId && isSuperAdmin && activeCompanyId !== "all") {
      setSelectedCompanyId(activeCompanyId)
    }
  }, [activeCompanyId, isSuperAdmin])

  React.useEffect(() => {
    if (activeBranchId) {
      setSelectedBranchId(activeBranchId)
    } else if (isSuperAdmin) {
      setSelectedBranchId("all")
    }
  }, [activeBranchId, isSuperAdmin])

  const [activeTab, setActiveTab] = React.useState<ReportTab>("revenue")
  const [invoiceSubFilter, setInvoiceSubFilter] = React.useState<InvoiceFilterType>("all")
  const [invoiceSearchQuery, setInvoiceSearchQuery] = React.useState("")
  const [dateRange, setDateRange] = React.useState("all_time")

  const [users, setUsers] = React.useState<any[]>([])
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [payments, setPayments] = React.useState<PaymentItem[]>([])
  const [clients, setClients] = React.useState<ClientItem[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [leads, setLeads] = React.useState<Lead[]>([])

  const targetComp = selectedCompanyId || activeCompanyId || user?.companyId || "tech"

  const loadData = React.useCallback(async () => {
    try {
      const [uList, invList, payList, cliList, expList, tList, lList] = await Promise.all([
        getUsers("all").catch(() => []),
        getInvoices(targetComp).catch(() => []),
        getPayments(targetComp).catch(() => []),
        getClients(targetComp).catch(() => []),
        fetchModuleDataFromDB<any[]>("expenses", [], targetComp).catch(() => []),
        taskService.getTasks(targetComp).catch(() => []),
        getLeads(targetComp).catch(() => []),
      ])
      setUsers(uList || [])
      setInvoices(invList || [])
      setPayments(payList || [])
      setClients(cliList || [])
      setExpenses(expList || [])
      setTasks(tList || [])
      setLeads(lList || [])
    } catch (err) {
      console.error("Error loading reports data:", err)
    }
  }, [targetComp])

  React.useEffect(() => {
    loadData()
    fetchSubBranches().catch(() => {})
    window.addEventListener("storage", loadData)
    window.addEventListener("saampark_data_synced", loadData)
    window.addEventListener("saampark_company_switched", loadData)
    window.addEventListener("saampark_subbranches_updated", loadData)
    return () => {
      window.removeEventListener("storage", loadData)
      window.removeEventListener("saampark_data_synced", loadData)
      window.removeEventListener("saampark_company_switched", loadData)
      window.removeEventListener("saampark_subbranches_updated", loadData)
    }
  }, [loadData, fetchSubBranches])

  // Helper map for client GSTIN and Branch details
  const clientMap = React.useMemo(() => {
    const map: Record<string, ClientItem> = {}
    clients.forEach((c) => {
      if (c.name) map[c.name.toLowerCase().trim()] = c
    })
    return map
  }, [clients])

  // Branch map for quick lookup
  const branchMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    ;(branches || []).forEach((b) => {
      if (b.id) map[b.id] = b.name
    })
    return map
  }, [branches])

  // ── Scoped Invoices Filter ────────────────────────────────────────────────
  const scopedInvoices = React.useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Company Scoping
      if (selectedCompanyId && selectedCompanyId !== "all") {
        if (inv.companyId && inv.companyId !== selectedCompanyId) return false
      }

      // 2. Branch Scoping for Role
      if (isTeamOrBranchAdmin && userAssignedBranchId) {
        const invBranch = inv.branchId || (clientMap[inv.client.toLowerCase().trim()]?.branchId)
        if (invBranch && invBranch !== userAssignedBranchId) return false
      } else if (selectedBranchId !== "all") {
        const invBranch = inv.branchId || (clientMap[inv.client.toLowerCase().trim()]?.branchId)
        const invBranchName = inv.branchName || (clientMap[inv.client.toLowerCase().trim()]?.branchName)
        const targetBranchObj = availableBranches.find((b) => b.id === selectedBranchId)
        const targetBranchName = targetBranchObj?.name || selectedBranchId
        
        const isMatch =
          invBranch === selectedBranchId ||
          (invBranchName && invBranchName.toLowerCase() === targetBranchName.toLowerCase())
        if (!isMatch) return false
      }

      return true
    })
  }, [invoices, selectedCompanyId, selectedBranchId, isTeamOrBranchAdmin, userAssignedBranchId, clientMap, availableBranches])

  // ── Scoped Payments Filter ────────────────────────────────────────────────
  const scopedPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (selectedCompanyId && selectedCompanyId !== "all") {
        if (p.companyId && p.companyId !== selectedCompanyId) return false
      }
      if (isTeamOrBranchAdmin && userAssignedBranchId) {
        const pBranch = p.branchId || (p as any).branch_id
        if (pBranch && pBranch !== userAssignedBranchId) return false
      } else if (selectedBranchId !== "all") {
        const targetBranchObj = availableBranches.find((b) => b.id === selectedBranchId || b.name.toLowerCase() === selectedBranchId.toLowerCase())
        const targetBranchId = String(targetBranchObj?.id || selectedBranchId).toLowerCase().trim()
        const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

        const pBranch = String(p.branchId || (p as any).branch_id || "").toLowerCase().trim()
        const pBranchName = String(p.branchName || (p as any).branch_name || "").toLowerCase().trim()

        const isMatch =
          (pBranch && (pBranch === targetBranchId || (targetBranchName && pBranch === targetBranchName))) ||
          (pBranchName && (pBranchName === targetBranchName || pBranchName === targetBranchId))

        if (!isMatch) return false
      }
      return true
    })
  }, [payments, selectedCompanyId, selectedBranchId, isTeamOrBranchAdmin, userAssignedBranchId, availableBranches])

  // ── Scoped Leads Filter ───────────────────────────────────────────────────
  const scopedLeads = React.useMemo(() => {
    return leads.filter((l) => {
      if (selectedCompanyId && selectedCompanyId !== "all") {
        if (l.companyId && l.companyId !== selectedCompanyId) return false
      }
      if (isTeamOrBranchAdmin && userAssignedBranchId) {
        if (l.branchId && l.branchId !== userAssignedBranchId) return false
      } else if (selectedBranchId !== "all") {
        const targetBranchObj = availableBranches.find((b) => b.id === selectedBranchId || b.name.toLowerCase() === selectedBranchId.toLowerCase())
        const targetBranchId = String(targetBranchObj?.id || selectedBranchId).toLowerCase().trim()
        const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

        const lBranch = String(l.branchId || (l as any).assignedBranchId || (l as any).branch_id || "").toLowerCase().trim()
        const lBranchName = String(l.branchName || (l as any).assignedBranchName || (l as any).branch_name || "").toLowerCase().trim()

        const isMatch =
          (lBranch && (lBranch === targetBranchId || (targetBranchName && lBranch === targetBranchName))) ||
          (lBranchName && (lBranchName === targetBranchName || lBranchName === targetBranchId))

        if (!isMatch) return false
      }
      return true
    })
  }, [leads, selectedCompanyId, selectedBranchId, isTeamOrBranchAdmin, userAssignedBranchId, availableBranches])

  // ── GST vs Non-GST Invoices Categorization & Metrics ──────────────────────
  const gstInvoices = React.useMemo(() => {
    return scopedInvoices.filter((i) => {
      const rate = typeof i.gstRate === "number" ? i.gstRate : 0
      const gstAmt = typeof i.gstAmount === "number" ? i.gstAmount : 0
      const hasGstInClient = Boolean(clientMap[i.client.toLowerCase().trim()]?.gstNumber)
      return rate > 0 || gstAmt > 0 || hasGstInClient
    })
  }, [scopedInvoices, clientMap])

  const nonGstInvoices = React.useMemo(() => {
    return scopedInvoices.filter((i) => {
      const rate = typeof i.gstRate === "number" ? i.gstRate : 0
      const gstAmt = typeof i.gstAmount === "number" ? i.gstAmount : 0
      const hasGstInClient = Boolean(clientMap[i.client.toLowerCase().trim()]?.gstNumber)
      return rate === 0 && gstAmt === 0 && !hasGstInClient
    })
  }, [scopedInvoices, clientMap])

  // Calculations: Total Invoices
  const totalBillsCount = scopedInvoices.length
  const totalInvoicedSum = scopedInvoices.reduce((sum, i) => {
    return sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)

  // Calculations: GST Bills
  const totalGstBillsCount = gstInvoices.length
  const totalGstInvoicedSum = gstInvoices.reduce((sum, i) => {
    return sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)
  const totalGstTaxAmountSum = gstInvoices.reduce((sum, i) => {
    if (typeof i.gstAmount === "number" && i.gstAmount > 0) return sum + i.gstAmount
    const total = parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
    const rate = i.gstRate || 18
    const base = Math.round(total / (1 + rate / 100))
    return sum + (total - base)
  }, 0)
  const totalGstBaseAmountSum = totalGstInvoicedSum - totalGstTaxAmountSum
  const cgstCollected = Math.round(totalGstTaxAmountSum / 2)
  const sgstCollected = Math.round(totalGstTaxAmountSum / 2)

  // Calculations: Non-GST Bills
  const totalNonGstBillsCount = nonGstInvoices.length
  const totalNonGstInvoicedSum = nonGstInvoices.reduce((sum, i) => {
    return sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)

  // Calculations: Payments & Dues
  const totalCollectedSum = scopedInvoices.reduce((sum, i) => {
    return sum + (parseInt((i.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)
  const totalDueSum = scopedInvoices.reduce((sum, i) => {
    return sum + (parseInt((i.due || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)
  const paymentPendingCount = scopedInvoices.filter(
    (i) => i.status === "Not paid" || i.status === "Partially paid" || i.status === "Payment Pending"
  ).length
  const fullyPaidCount = scopedInvoices.filter((i) => i.status === "Fully paid").length
  const partiallyPaidCount = scopedInvoices.filter((i) => i.status === "Partially paid").length

  // ── GST Slab Distribution (18%, 12%, 5%, 0%) ──────────────────────────────
  const gstSlabs = React.useMemo(() => {
    const slabs: Record<number, { count: number; base: number; tax: number; total: number }> = {
      18: { count: 0, base: 0, tax: 0, total: 0 },
      12: { count: 0, base: 0, tax: 0, total: 0 },
      5: { count: 0, base: 0, tax: 0, total: 0 },
      0: { count: 0, base: 0, tax: 0, total: 0 },
    }

    scopedInvoices.forEach((i) => {
      const rate = typeof i.gstRate === "number" ? i.gstRate : 0
      const total = parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      const tax = typeof i.gstAmount === "number" && i.gstAmount > 0 
        ? i.gstAmount 
        : rate > 0 ? Math.round(total - total / (1 + rate / 100)) : 0
      const base = total - tax

      const matchedRate = rate === 12 ? 12 : rate === 5 ? 5 : rate > 0 ? 18 : 0
      if (!slabs[matchedRate]) slabs[matchedRate] = { count: 0, base: 0, tax: 0, total: 0 }
      slabs[matchedRate].count += 1
      slabs[matchedRate].base += base
      slabs[matchedRate].tax += tax
      slabs[matchedRate].total += total
    })

    return slabs
  }, [scopedInvoices])

  // ── Table Filtering & Search ──────────────────────────────────────────────
  const filteredTableInvoices = React.useMemo(() => {
    return scopedInvoices.filter((inv) => {
      // Sub-filter
      if (invoiceSubFilter === "gst") {
        const isGst = (typeof inv.gstRate === "number" && inv.gstRate > 0) || (typeof inv.gstAmount === "number" && inv.gstAmount > 0) || Boolean(clientMap[inv.client.toLowerCase().trim()]?.gstNumber)
        if (!isGst) return false
      } else if (invoiceSubFilter === "non_gst") {
        const isGst = (typeof inv.gstRate === "number" && inv.gstRate > 0) || (typeof inv.gstAmount === "number" && inv.gstAmount > 0) || Boolean(clientMap[inv.client.toLowerCase().trim()]?.gstNumber)
        if (isGst) return false
      } else if (invoiceSubFilter === "due") {
        const dueNum = parseInt((inv.due || "0").replace(/[^0-9]/g, "")) || 0
        if (dueNum <= 0 && inv.status === "Fully paid") return false
      } else if (invoiceSubFilter === "paid") {
        if (inv.status !== "Fully paid") return false
      } else if (invoiceSubFilter === "partially_paid") {
        if (inv.status !== "Partially paid") return false
      }

      // Search Query
      if (invoiceSearchQuery.trim()) {
        const q = invoiceSearchQuery.toLowerCase().trim()
        const clientGst = (clientMap[inv.client.toLowerCase().trim()]?.gstNumber || "").toLowerCase()
        const match =
          inv.id.toLowerCase().includes(q) ||
          inv.client.toLowerCase().includes(q) ||
          (inv.project || "").toLowerCase().includes(q) ||
          (inv.branchName || "").toLowerCase().includes(q) ||
          clientGst.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [scopedInvoices, invoiceSubFilter, invoiceSearchQuery, clientMap])

  // ── User Productivity Calculation ─────────────────────────────────────────
  const userProductivity = React.useMemo(() => {
    if (!users || users.length === 0) return []
    return users
      .filter((u) => u.role !== "Clients" && u.status !== "Inactive")
      .map((u) => {
        const uName = (u.name || "").toLowerCase().trim()
        const uEmail = (u.email || "").toLowerCase().trim()
        const assigned = tasks.filter((t) => {
          const a = (t.assignedTo || "").toLowerCase().trim()
          const c = (t.collaborators || "").toLowerCase().trim()
          return a === uName || a === uEmail || (uName && a.includes(uName)) || c.includes(uName) || c.includes(uEmail)
        })
        const completed = assigned.filter((t) => t.status === "Done")
        const rate = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 100
        return {
          name: u.name,
          role: u.role || "Team Member",
          department: u.department || "Operations",
          branchName: u.branchName || branchMap[u.branchId || ""] || "-",
          assigned: assigned.length,
          completed: completed.length,
          rate: `${rate}%`,
          avgTime: "4.0 hrs",
        }
      })
  }, [users, tasks, branchMap])

  // ── Sub-Branch Performance & Percentage Revenue Share Calculations ─────────
  const subBranchReportData = React.useMemo(() => {
    const list = subBranches || []
    return list.map((sb) => {
      const parentBranch = (branches || []).find((b) => b.id === sb.parentBranchId)
      const parentBranchName = parentBranch?.name || sb.parentBranchId || "Main Operating Branch"

      // Match invoices attributed to this sub-branch
      const matchedInvoices = scopedInvoices.filter((inv) => {
        const strSubBranchId = String(inv.subBranchId || "").toLowerCase().trim()
        const strSubBranchName = String(inv.subBranchName || "").toLowerCase().trim()
        const sbId = String(sb.id).toLowerCase().trim()
        const sbName = String(sb.name).toLowerCase().trim()

        return (
          (strSubBranchId && strSubBranchId === sbId) ||
          (strSubBranchName && strSubBranchName === sbName) ||
          ((inv as any).subBranch && String((inv as any).subBranch).toLowerCase().trim() === sbName)
        )
      })

      const totalInvoicedGross = matchedInvoices.reduce((sum, inv) => {
        const num = parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
        return sum + num
      }, 0)

      const totalPaid = matchedInvoices.reduce((sum, inv) => {
        const num = parseInt((inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
        return sum + num
      }, 0)

      const totalDue = matchedInvoices.reduce((sum, inv) => {
        const num = parseInt((inv.due || "0").replace(/[^0-9]/g, "")) || 0
        return sum + num
      }, 0)

      const sharePct = sb.revenueSharePct ?? 30
      const companySharePct = 100 - sharePct
      const partnerEarnedGross = Math.round(totalInvoicedGross * (sharePct / 100))
      const companyRetainedGross = totalInvoicedGross - partnerEarnedGross

      const partnerEarnedRealized = Math.round(totalPaid * (sharePct / 100))
      const partnerPendingPayout = Math.round(totalDue * (sharePct / 100))

      return {
        ...sb,
        parentBranchName,
        invoicesCount: matchedInvoices.length,
        totalInvoicedGross,
        totalPaid,
        totalDue,
        sharePct,
        companySharePct,
        partnerEarnedGross,
        companyRetainedGross,
        partnerEarnedRealized,
        partnerPendingPayout,
        matchedInvoices,
      }
    })
  }, [subBranches, branches, scopedInvoices])

  const totalSubBranchGrossVolume = subBranchReportData.reduce((sum, sb) => sum + sb.totalInvoicedGross, 0)
  const totalCompanyRetainedFromSubBranches = subBranchReportData.reduce((sum, sb) => sum + sb.companyRetainedGross, 0)
  const totalPartnerPayoutAccrued = subBranchReportData.reduce((sum, sb) => sum + sb.partnerEarnedGross, 0)
  const totalPartnerPayoutRealized = subBranchReportData.reduce((sum, sb) => sum + sb.partnerEarnedRealized, 0)

  // ── CSV / Excel Export ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let rows: string[][] = []
    let filename = `saampark_billing_report_${new Date().toISOString().split("T")[0]}.csv`

    if (activeTab === "sub_branches") {
      filename = `saampark_subbranch_revenue_share_report_${new Date().toISOString().split("T")[0]}.csv`
      rows = [
        [
          "Sub-Branch Name",
          "Code",
          "Parent Branch",
          "Partner Name",
          "Partner Phone",
          "Partner Type",
          "Partner Share (%)",
          "Company Share (%)",
          "Invoices Count",
          "Total Invoiced Gross (INR)",
          "Company Retained (INR)",
          "Partner Total Accrued (INR)",
          "Partner Realized Payout (INR)",
          "Partner Pending Due (INR)",
          "Bank Account",
          "IFSC",
          "UPI ID",
          "Status"
        ],
        ...subBranchReportData.map((sb) => [
          sb.name,
          sb.code || "-",
          sb.parentBranchName,
          sb.partnerName || "-",
          sb.partnerPhone || "-",
          sb.partnerType || "Franchise Partner",
          `${sb.sharePct}%`,
          `${sb.companySharePct}%`,
          String(sb.invoicesCount),
          String(sb.totalInvoicedGross),
          String(sb.companyRetainedGross),
          String(sb.partnerEarnedGross),
          String(sb.partnerEarnedRealized),
          String(sb.partnerPendingPayout),
          sb.bankDetails?.accountNumber || "-",
          sb.bankDetails?.ifscCode || "-",
          sb.bankDetails?.upiId || "-",
          sb.status
        ])
      ]
    } else if (activeTab === "revenue" || activeTab === "gst_analytics") {
      rows = [
        [
          "Invoice Number",
          "Client Name",
          "Client GSTIN",
          "Project / Service",
          "Bill Type",
          "Base Taxable (INR)",
          "GST Rate (%)",
          "CGST 9% (INR)",
          "SGST 9% (INR)",
          "Total GST Tax (INR)",
          "Total Invoiced (INR)",
          "Payment Received (INR)",
          "Balance Due (INR)",
          "Bill Date",
          "Due Date",
          "Status",
          "Branch",
        ],
        ...filteredTableInvoices.map((inv) => {
          const isGst = (typeof inv.gstRate === "number" && inv.gstRate > 0) || (typeof inv.gstAmount === "number" && inv.gstAmount > 0) || Boolean(clientMap[inv.client.toLowerCase().trim()]?.gstNumber)
          const rate = inv.gstRate || (isGst ? 18 : 0)
          const totalNum = parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
          const taxNum = typeof inv.gstAmount === "number" && inv.gstAmount > 0 
            ? inv.gstAmount 
            : rate > 0 ? Math.round(totalNum - totalNum / (1 + rate / 100)) : 0
          const baseNum = totalNum - taxNum
          const cgst = Math.round(taxNum / 2)
          const sgst = Math.round(taxNum / 2)
          const clientGst = clientMap[inv.client.toLowerCase().trim()]?.gstNumber || "N/A"
          const branchName = inv.branchName || clientMap[inv.client.toLowerCase().trim()]?.branchName || "-"

          return [
            inv.id,
            inv.client,
            clientGst,
            inv.project || "-",
            isGst ? `GST Invoice (${rate}%)` : "Non-GST Invoice",
            String(baseNum),
            `${rate}%`,
            String(cgst),
            String(sgst),
            String(taxNum),
            String(totalNum),
            inv.paymentReceived || "0",
            inv.due || "0",
            inv.billDate || "-",
            inv.dueDate || "-",
            inv.status,
            branchName,
          ]
        }),
      ]
    } else if (activeTab === "leads") {
      rows = [
        ["Lead Name", "Primary Contact", "Phone", "Service", "Assigned Owner", "Branch", "Status"],
        ...scopedLeads.map((l) => [
          l.name,
          l.primaryContact || "-",
          l.phone || "-",
          l.service || "-",
          l.caller || l.owner || "-",
          l.branchName || "-",
          l.status,
        ]),
      ]
    } else if (activeTab === "productivity") {
      rows = [
        ["Team Member", "Role", "Department", "Branch", "Assigned Tasks", "Completed Tasks", "Completion Rate", "Avg Time"],
        ...userProductivity.map((up) => [
          up.name,
          up.role,
          up.department,
          up.branchName,
          String(up.assigned),
          String(up.completed),
          up.rate,
          up.avgTime,
        ]),
      ]
    } else {
      rows = [
        ["Employee", "Role", "Status", "Department", "Branch"],
        ...users
          .filter((u) => u.role !== "Clients")
          .map((u) => [u.name, u.role, u.status || "Active", u.department || "Operations", u.branchName || "-"]),
      ]
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* ── TOP HEADER & MULTI-TIER SCOPING BAR ───────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
            <BarChart3 size={15} /> Business Intelligence & Tax Audit Reports
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Billing & Financial Reports Studio</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            GST & Non-GST tax metrics, payment dues, revenue realization, and branch-level analytics for SAAMPARK Group.
          </p>
        </div>

        {/* Global Filter Controls: Company & Branch Scope */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Scope (Super Admin) */}
          {isSuperAdmin && (
            <div className="flex items-center bg-surface border border-border rounded-xl px-2.5 py-1.5 gap-1.5 text-xs font-semibold shadow-2xs">
              <Building2 size={13} className="text-primary" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="all">🏢 All Companies</option>
                <option value="tech">SAAMPARK Technology</option>
                <option value="digital">SAAMPARK Digital</option>
              </select>
            </div>
          )}

          {/* Branch Scope Dropdown (Super Admin & Admin with branch access) */}
          {availableBranches.length > 0 && !isTeamOrBranchAdmin ? (
            <div className="flex items-center bg-surface border border-border rounded-xl px-2.5 py-1.5 gap-1.5 text-xs font-semibold shadow-2xs">
              <MapPin size={13} className="text-blue-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="all">📍 All Branches ({availableBranches.length})</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city || b.code || "Branch"})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Branch Scoped Lock Badge for Branch Admin / Team Member */
            (userAssignedBranchName || userAssignedBranchId) && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold shadow-2xs">
                <MapPin size={13} />
                <span>Scoped Branch: {userAssignedBranchName || branchMap[userAssignedBranchId] || userAssignedBranchId}</span>
              </div>
            )
          )}

          {/* Export Action */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
            className="shadow-md shadow-primary/20 cursor-pointer font-bold"
          >
            Export Detailed CSV
          </Button>
        </div>
      </div>

      {/* ── REPORT NAVIGATION TABS ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-px overflow-x-auto">
        {[
          { id: "revenue", label: "Financial & Tax Overview", icon: DollarSign },
          { id: "gst_analytics", label: "GST & Tax Slab Audit", icon: Landmark },
          { id: "sub_branches", label: "🌿 Sub-Branch Revenue Share (% Wise)", icon: Percent },
          { id: "leads", label: "Leads & Conversion", icon: Target },
          { id: "productivity", label: "Team Productivity", icon: CheckSquare },
          { id: "attendance", label: "Staff & Branch Directory", icon: Users },
          { id: "expenses", label: "Operational Expenses", icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-primary text-primary bg-primary/5 shadow-2xs"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1 & 2: REVENUE & GST BILLS OVERVIEW ────────────────────────── */}
      {(activeTab === "revenue" || activeTab === "gst_analytics") && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 5 Key Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Bills */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-2 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Total Bills Invoiced</span>
                <Receipt size={16} className="text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">₹{totalInvoicedSum.toLocaleString("en-IN")}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-0.5">
                <span className="text-primary font-bold">{totalBillsCount} Registered Invoices</span>
                <span>100% Vol</span>
              </div>
            </div>

            {/* Card 2: GST Bills */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/20 dark:from-indigo-950/30 dark:to-blue-950/10 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                <span>GST Taxable Bills</span>
                <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                ₹{totalGstInvoicedSum.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-0.5">
                <span>{totalGstBillsCount} GST Invoices</span>
                <span>Tax: ₹{totalGstTaxAmountSum.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Card 3: Non-GST Bills */}
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Non-GST Bills</span>
                <FileText size={16} className="text-zinc-500" />
              </div>
              <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200">
                ₹{totalNonGstInvoicedSum.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-0.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalNonGstBillsCount} Exempted / 0%</span>
                <span>No Tax</span>
              </div>
            </div>

            {/* Card 4: Payments Received */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                <span>Payment Collected</span>
                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalCollectedSum.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                <span>{fullyPaidCount} Fully Settled</span>
                <span>{totalInvoicedSum > 0 ? `${Math.round((totalCollectedSum / totalInvoicedSum) * 100)}% Realized` : "100%"}</span>
              </div>
            </div>

            {/* Card 5: Payment Due */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/20 dark:from-amber-950/30 dark:to-rose-950/10 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold">
                <span>Total Payment Due</span>
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{totalDueSum.toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 font-semibold pt-0.5">
                <span>{paymentPendingCount} Pending Invoices</span>
                <span className="text-rose-600 dark:text-rose-400">{partiallyPaidCount} Part-paid</span>
              </div>
            </div>
          </div>

          {/* ── GST TAX SLAB & COMPLIANCE MATRIX ────────────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Landmark size={16} className="text-indigo-600" />
                  <span>GST Tax Compliance & Slab Breakdown</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated computation of Taxable Base Value, CGST (Central), SGST (State), and total collections across tax slabs.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  CGST: ₹{cgstCollected.toLocaleString("en-IN")}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  SGST: ₹{sgstCollected.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              {/* 18% Standard GST */}
              <div className="p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-indigo-700 dark:text-indigo-300">
                  <span>18% Standard GST</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-[10px]">
                    {gstSlabs[18]?.count || 0} Bills
                  </span>
                </div>
                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Taxable Base:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">₹{(gstSlabs[18]?.base || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                    <span>Tax (9%+9%):</span>
                    <strong className="font-mono">₹{(gstSlabs[18]?.tax || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50 font-bold text-zinc-900 dark:text-zinc-100">
                    <span>Gross Value:</span>
                    <span className="font-mono">₹{(gstSlabs[18]?.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* 12% GST */}
              <div className="p-3.5 rounded-xl border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-blue-700 dark:text-blue-300">
                  <span>12% Print / Goods GST</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[10px]">
                    {gstSlabs[12]?.count || 0} Bills
                  </span>
                </div>
                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Taxable Base:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">₹{(gstSlabs[12]?.base || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Tax (6%+6%):</span>
                    <strong className="font-mono">₹{(gstSlabs[12]?.tax || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/50 dark:border-blue-800/50 font-bold text-zinc-900 dark:text-zinc-100">
                    <span>Gross Value:</span>
                    <span className="font-mono">₹{(gstSlabs[12]?.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* 5% GST */}
              <div className="p-3.5 rounded-xl border border-teal-200/70 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-teal-700 dark:text-teal-300">
                  <span>5% Concessional GST</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-[10px]">
                    {gstSlabs[5]?.count || 0} Bills
                  </span>
                </div>
                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Taxable Base:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">₹{(gstSlabs[5]?.base || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-teal-600 dark:text-teal-400">
                    <span>Tax (2.5%+2.5%):</span>
                    <strong className="font-mono">₹{(gstSlabs[5]?.tax || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-teal-200/50 dark:border-teal-800/50 font-bold text-zinc-900 dark:text-zinc-100">
                    <span>Gross Value:</span>
                    <span className="font-mono">₹{(gstSlabs[5]?.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* 0% Non-GST */}
              <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                <div className="flex items-center justify-between font-bold text-xs text-zinc-700 dark:text-zinc-300">
                  <span>0% Non-GST / Exempt</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px]">
                    {gstSlabs[0]?.count || 0} Bills
                  </span>
                </div>
                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Taxable Base:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">₹{(gstSlabs[0]?.total || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Tax Collected:</span>
                    <strong className="font-mono">₹0</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100">
                    <span>Gross Value:</span>
                    <span className="font-mono">₹{(gstSlabs[0]?.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── DETAILED INVOICES & BILLS EXPLORER ──────────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Receipt size={16} className="text-primary" />
                  <span>Interactive Invoices & Tax Register</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {filteredTableInvoices.length} matching invoices with GST tax breakdowns and live payment statuses.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search invoice, client, GSTIN, branch..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-hover/60 border border-border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground placeholder-muted-foreground"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              </div>
            </div>

            {/* Sub-Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: `All Bills (${totalBillsCount})` },
                { id: "gst", label: `GST Bills (${totalGstBillsCount})` },
                { id: "non_gst", label: `Non-GST Bills (${totalNonGstBillsCount})` },
                { id: "due", label: `Payment Due (${paymentPendingCount})` },
                { id: "paid", label: `Fully Settled (${fullyPaidCount})` },
                { id: "partially_paid", label: `Part-Paid (${partiallyPaidCount})` },
              ].map((pill) => {
                const isSelected = invoiceSubFilter === pill.id
                return (
                  <button
                    key={pill.id}
                    onClick={() => setInvoiceSubFilter(pill.id as InvoiceFilterType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-surface-hover/70 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>

            {/* Detailed Invoices Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                    <th className="py-3 px-3.5">Invoice #</th>
                    <th className="py-3 px-3.5">Client & GSTIN</th>
                    <th className="py-3 px-3.5">Project / Service</th>
                    <th className="py-3 px-3.5 text-right">Taxable Base</th>
                    <th className="py-3 px-3.5 text-center">GST Rate</th>
                    <th className="py-3 px-3.5 text-right">GST Tax</th>
                    <th className="py-3 px-3.5 text-right">Total Bill</th>
                    <th className="py-3 px-3.5 text-right">Paid</th>
                    <th className="py-3 px-3.5 text-right">Due</th>
                    <th className="py-3 px-3.5">Branch / Origin</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium">
                  {filteredTableInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Receipt size={24} className="text-muted-foreground/60" />
                          <p className="font-semibold text-xs text-foreground">No invoices match current filter criteria</p>
                          <p className="text-[11px]">Adjust your branch, company, or search keyword above.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTableInvoices.map((inv) => {
                      const isGst =
                        (typeof inv.gstRate === "number" && inv.gstRate > 0) ||
                        (typeof inv.gstAmount === "number" && inv.gstAmount > 0) ||
                        Boolean(clientMap[inv.client.toLowerCase().trim()]?.gstNumber)
                      const rate = inv.gstRate || (isGst ? 18 : 0)
                      const totalNum = parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
                      const taxNum =
                        typeof inv.gstAmount === "number" && inv.gstAmount > 0
                          ? inv.gstAmount
                          : rate > 0
                          ? Math.round(totalNum - totalNum / (1 + rate / 100))
                          : 0
                      const baseNum = totalNum - taxNum
                      const clientObj = clientMap[inv.client.toLowerCase().trim()]
                      const clientGst = clientObj?.gstNumber
                      const branchDisplay = inv.branchName || clientObj?.branchName || "-"

                      const statusColors: Record<string, string> = {
                        "Fully paid": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
                        "Partially paid": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
                        "Not paid": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
                        "Payment Pending": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
                      }

                      return (
                        <tr key={inv.id} className="hover:bg-surface-hover/60 transition-colors">
                          {/* Invoice # & Type */}
                          <td className="py-3 px-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground">{inv.id}</span>
                              <span
                                className={`w-fit px-1.5 py-0.2 text-[9.5px] font-bold rounded ${
                                  isGst
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                {isGst ? `GST ${rate}%` : "NON-GST"}
                              </span>
                            </div>
                          </td>

                          {/* Client & GSTIN */}
                          <td className="py-3 px-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground">{inv.client}</span>
                              {clientGst ? (
                                <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                  GST: {clientGst}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Unregistered</span>
                              )}
                            </div>
                          </td>

                          {/* Project */}
                          <td className="py-3 px-3.5 text-muted-foreground">{inv.project || "General Project"}</td>

                          {/* Taxable Base */}
                          <td className="py-3 px-3.5 text-right font-mono font-semibold text-foreground">
                            ₹{baseNum.toLocaleString("en-IN")}
                          </td>

                          {/* GST Rate */}
                          <td className="py-3 px-3.5 text-center font-mono text-muted-foreground">
                            {isGst ? `${rate}%` : "0%"}
                          </td>

                          {/* GST Tax */}
                          <td className="py-3 px-3.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {taxNum > 0 ? `₹${taxNum.toLocaleString("en-IN")}` : "₹0"}
                          </td>

                          {/* Total Bill */}
                          <td className="py-3 px-3.5 text-right font-mono font-extrabold text-foreground">
                            ₹{totalNum.toLocaleString("en-IN")}
                          </td>

                          {/* Paid */}
                          <td className="py-3 px-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {inv.paymentReceived || "₹0"}
                          </td>

                          {/* Due */}
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {inv.due || "₹0"}
                          </td>

                          {/* Branch */}
                          <td className="py-3 px-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                              <MapPin size={11} className="text-blue-500 shrink-0" />
                              <span>{branchDisplay}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                                statusColors[inv.status] || "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SUB-BRANCH REVENUE SHARE (% WISE) ────────────────────────── */}
      {activeTab === "sub_branches" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Hero Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sub-Branch Gross */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Sub-Branch Invoiced (Gross)</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Receipt size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                ₹{totalSubBranchGrossVolume.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Across {subBranchReportData.length} registered percentage partner hubs
              </p>
            </div>

            {/* Company Retained Net Share */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Company Retained Share</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <Building2 size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                ₹{totalCompanyRetainedFromSubBranches.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Company retainage (Operating Branch share)
              </p>
            </div>

            {/* Partner Payouts Accrued */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Partner Payouts (Accrued)</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Percent size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{totalPartnerPayoutAccrued.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Total commission/share earned by sub-branches
              </p>
            </div>

            {/* Realized Cash Payouts */}
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
                <span>Partner Share Realized</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{totalPartnerPayoutRealized.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Commission realized from collected customer payments
              </p>
            </div>
          </div>

          {/* Sub-Branch Breakdown Cards & Interactive Table */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="text-base">🌿</span>
                  <span>Sub-Branch Performance & Percentage Settlement Breakdown</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time ledger tracking gross billings, percentage agreements, company retention, and partner commissions.
                </p>
              </div>
            </div>

            {subBranchReportData.length === 0 ? (
              <div className="py-12 text-center bg-surface-hover/30 rounded-2xl border border-dashed border-border p-6 space-y-2">
                <p className="font-bold text-xs text-foreground">No Sub-Branches configured yet.</p>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                  Go to <strong>Settings &gt; Company Entities &amp; Branch Hubs</strong> to add your first percentage-based franchise or partner sub-branch.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                      <th className="py-3 px-3.5">Sub-Branch & Hub</th>
                      <th className="py-3 px-3.5">Parent Operating Branch</th>
                      <th className="py-3 px-3.5">Partner / Franchisee</th>
                      <th className="py-3 px-3.5 text-center">Revenue Split Agreement</th>
                      <th className="py-3 px-3.5 text-center">Bills</th>
                      <th className="py-3 px-3.5 text-right">Gross Invoiced</th>
                      <th className="py-3 px-3.5 text-right">Company Retained</th>
                      <th className="py-3 px-3.5 text-right">Partner Share</th>
                      <th className="py-3 px-3.5 text-right">Realized Cash Payout</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    {subBranchReportData.map((sb) => (
                      <tr key={sb.id} className="hover:bg-surface-hover/60 transition-colors">
                        {/* Sub-Branch */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              <span className="text-emerald-500">🌿</span>
                              <span>{sb.name}</span>
                            </span>
                            {sb.code && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                Code: {sb.code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Parent Branch */}
                        <td className="py-3.5 px-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                            <Building2 size={11} className="text-blue-500 shrink-0" />
                            <span>{sb.parentBranchName}</span>
                          </span>
                        </td>

                        {/* Partner Contact */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">{sb.partnerName || "Primary Partner"}</span>
                            {sb.partnerPhone && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {sb.partnerPhone}
                              </span>
                            )}
                            {sb.bankDetails?.upiId && (
                              <span className="font-mono text-[9.5px] text-emerald-600 dark:text-emerald-400">
                                UPI: {sb.bankDetails.upiId}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Split Bar & Percentage */}
                        <td className="py-3.5 px-3.5">
                          <div className="space-y-1 w-44 mx-auto">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                🪙 {sb.sharePct}% Partner
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {sb.companySharePct}% Co.
                              </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800">
                              <div
                                style={{ width: `${sb.sharePct}%` }}
                                className="bg-emerald-500 h-full"
                              />
                              <div
                                style={{ width: `${sb.companySharePct}%` }}
                                className="bg-blue-600 h-full"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Bills Count */}
                        <td className="py-3.5 px-3.5 text-center font-mono font-bold text-foreground">
                          {sb.invoicesCount}
                        </td>

                        {/* Gross Invoiced */}
                        <td className="py-3.5 px-3.5 text-right font-mono font-black text-foreground">
                          ₹{sb.totalInvoicedGross.toLocaleString("en-IN")}
                        </td>

                        {/* Company Retained */}
                        <td className="py-3.5 px-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          ₹{sb.companyRetainedGross.toLocaleString("en-IN")}
                        </td>

                        {/* Partner Total Accrued */}
                        <td className="py-3.5 px-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          ₹{sb.partnerEarnedGross.toLocaleString("en-IN")}
                        </td>

                        {/* Partner Realized Payout */}
                        <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{sb.partnerEarnedRealized.toLocaleString("en-IN")}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              sb.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                                : "bg-zinc-500/10 text-zinc-500"
                            }`}
                          >
                            {sb.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LEADS & CONVERSION ────────────────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Total Inquiries & Leads</p>
              <p className="text-2xl font-black text-foreground">{scopedLeads.length}</p>
              <p className="text-[11px] text-muted-foreground pt-1">Active Pipeline Volume</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Qualified Opportunities</p>
              <p className="text-2xl font-black text-emerald-500">
                {scopedLeads.filter((l) => l.status === "Qualified" || l.status === "Discussion").length}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">High conversion propensity</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Deals Won</p>
              <p className="text-2xl font-black text-primary">
                {scopedLeads.filter((l) => l.status === "Won").length}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Converted to client accounts</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-foreground">Pipeline Leads Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Primary Contact</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {scopedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No leads registered in this scope.
                      </td>
                    </tr>
                  ) : (
                    scopedLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">{l.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{l.primaryContact || "-"}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{l.phone || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{l.service || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{l.branchName || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{l.caller || l.owner || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {l.status}
                          </span>
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

      {/* ── TAB 4: PRODUCTIVITY REPORT ──────────────────────────────────── */}
      {activeTab === "productivity" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-foreground">Team Member Performance Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 text-center">Assigned Tasks</th>
                    <th className="py-3 px-4 text-center">Completed Tasks</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                    <th className="py-3 px-4 text-right">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {userProductivity.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No team members registered yet.
                      </td>
                    </tr>
                  ) : (
                    userProductivity.map((up) => (
                      <tr key={up.name} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">{up.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{up.role}</td>
                        <td className="py-3 px-4 text-muted-foreground">{up.department}</td>
                        <td className="py-3 px-4 text-muted-foreground">{up.branchName}</td>
                        <td className="py-3 px-4 text-center font-mono">{up.assigned}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">{up.completed}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-500">{up.rate}</td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">{up.avgTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: STAFF & BRANCH DIRECTORY ─────────────────────────────── */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-foreground">Registered Personnel & Branch Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {users
                    .filter((u) => u.role !== "Clients")
                    .map((u) => (
                      <tr key={u.email} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.email}`}
                            alt={u.name}
                            className="w-6 h-6 rounded-full border shrink-0"
                          />
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.role}</td>
                        <td className="py-3 px-4 text-muted-foreground">{u.department || "Operations"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{u.branchName || branchMap[u.branchId] || "-"}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-500">{u.status || "Active"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: OPERATIONAL EXPENSES ─────────────────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Total Operational Expenses</p>
              <p className="text-2xl font-black text-foreground">
                ₹
                {expenses
                  .reduce((sum, e) => sum + (e.amountNum || parseInt((e.amount || "0").replace(/[^0-9]/g, "")) || 0), 0)
                  .toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">{expenses.length} Recorded Expense Receipts</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-black text-amber-500">
                {expenses.filter((e) => e.status === "Pending").length} Requests
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Awaiting settlement</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1 shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">Approved Settlements</p>
              <p className="text-2xl font-black text-emerald-500">
                {expenses.filter((e) => e.status === "Approved").length} Settled
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Verified business costs</p>
            </div>
          </div>

          {/* Expenses Register Table */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <PieChart size={16} className="text-primary" />
              <span>Operational &amp; Project Expenses Register</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-surface-hover/40">
                    <th className="py-3 px-4">Ref #</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Associated Project</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid By</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No expense logs recorded.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id || Math.random()} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{exp.expenseNumber || "EXP"}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{exp.title}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {exp.projectName ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">💼 {exp.projectName}</span>
                          ) : (
                            <span className="text-zinc-400 italic">General Overhead</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{exp.category}</td>
                        <td className="py-3 px-4 text-foreground">{exp.member || "Admin"}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-500">
                          {exp.amount || `₹${(exp.amountNum || 0).toLocaleString("en-IN")}`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {exp.status || "Pending"}
                          </span>
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
    </motion.div>
  )
}
