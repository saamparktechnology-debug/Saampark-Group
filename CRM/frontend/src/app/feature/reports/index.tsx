"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, Download, Calendar, Filter, TrendingUp, Users, 
  DollarSign, CheckSquare, Target, PieChart, ArrowUpRight, ArrowDownRight, FileText
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { getUsers } from "../users/services/userService"
import { getInvoices, InvoiceItem } from "../sales/invoices/services/invoiceService"
import { getPayments, PaymentItem } from "../sales/payments/services/paymentService"
import { fetchModuleDataFromDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { taskService } from "../tasks/services/taskService"
import { Task } from "../tasks/types"
import { getLeads } from "../leads/services/leadService"
import { Lead } from "../leads/types"

type ReportTab = "revenue" | "leads" | "productivity" | "attendance" | "expenses"

export default function ReportsMain() {
  const { activeCompanyId } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState<ReportTab>("revenue")
  const [dateRange, setDateRange] = React.useState("this_month")
  const [customStartDate, setCustomStartDate] = React.useState("2026-08-01")
  const [customEndDate, setCustomEndDate] = React.useState("2026-08-31")
  const [users, setUsers] = React.useState<any[]>([])
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [payments, setPayments] = React.useState<PaymentItem[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [leads, setLeads] = React.useState<Lead[]>([])

  React.useEffect(() => {
    getUsers("all").then(setUsers).catch(() => [])
    getInvoices().then(setInvoices).catch(() => [])
    getPayments().then(setPayments).catch(() => [])
    fetchModuleDataFromDB<any[]>("expenses", []).then(setExpenses).catch(() => [])
    taskService.getTasks().then(setTasks).catch(() => [])
    getLeads().then(setLeads).catch(() => [])
  }, [])

  const userProductivity = React.useMemo(() => {
    if (!users || users.length === 0) return []
    return users.filter(u => u.role !== "Clients" && u.status !== "Inactive").map(u => {
      const uName = (u.name || "").toLowerCase().trim()
      const uEmail = (u.email || "").toLowerCase().trim()
      const assigned = tasks.filter(t => {
        const a = (t.assignedTo || "").toLowerCase().trim()
        const c = (t.collaborators || "").toLowerCase().trim()
        return a === uName || a === uEmail || (uName && a.includes(uName)) || c.includes(uName) || c.includes(uEmail)
      })
      const completed = assigned.filter(t => t.status === "Done")
      const rate = assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 100
      return {
        name: u.name,
        role: u.role || "Team Member",
        assigned: assigned.length,
        completed: completed.length,
        rate: `${rate}%`,
        avgTime: "4.0 hrs"
      }
    })
  }, [users, tasks])

  // Export report to CSV
  const handleExportCSV = () => {
    let rows: string[][] = []
    let filename = `saampark_${activeTab}_report.csv`

    if (activeTab === "revenue") {
      rows = [
        ["Invoice Number", "Client Name", "Total Amount", "Paid Amount", "Due Date", "Status"],
        ...invoices.map(inv => [inv.id, inv.client, inv.totalInvoiced, inv.paymentReceived || "₹0", inv.dueDate || "-", inv.status])
      ]
    } else if (activeTab === "leads") {
      rows = [
        ["Lead Name", "Primary Contact", "Phone", "Service", "Assigned Owner", "Status"],
        ...leads.map(l => [l.name, l.primaryContact || "-", l.phone || "-", l.service || "-", l.caller || l.owner || "-", l.status])
      ]
    } else if (activeTab === "productivity") {
      rows = [
        ["Team Member", "Role", "Assigned Tasks", "Completed Tasks", "Completion Rate", "Avg Time per Task"],
        ...userProductivity.map(up => [up.name, up.role, String(up.assigned), String(up.completed), up.rate, up.avgTime])
      ]
    } else {
      rows = [
        ["Employee", "Role", "Status", "Department"],
        ...users.filter(u => u.role !== "Clients").map(u => [u.name, u.role, u.status || "Active", u.department || "Operations"])
      ]
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalInvoicedSum = invoices.reduce((sum, i) => sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0), 0)
  const totalCollectedSum = payments.reduce((sum, p) => sum + (p.amountNum || parseInt((p.amount || "0").replace(/[^0-9]/g, "")) || 0), 0)
  const totalDueSum = Math.max(0, totalInvoicedSum - totalCollectedSum)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
            <BarChart3 size={14} /> Analytics & Reporting Studio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Business Intelligence Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Live metrics, revenue breakdown, team productivity, and operational analytics for SAAMPARK Group.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground px-3 py-1.5 focus:outline-hidden"
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Fiscal Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-px overflow-x-auto">
        {[
          { id: "revenue", label: "Revenue & Billing", icon: DollarSign },
          { id: "leads", label: "Leads & Conversion", icon: Target },
          { id: "productivity", label: "Team Productivity", icon: CheckSquare },
          { id: "attendance", label: "Staff Directory", icon: Users },
          { id: "expenses", label: "Operational Expenses", icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: REVENUE REPORT ────────────────────────────────────────────── */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Invoiced</span>
                <DollarSign size={16} className="text-primary" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">₹{totalInvoicedSum.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-emerald-500 font-semibold">{invoices.length} Registered Invoices</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Payments Received</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{totalCollectedSum.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">{payments.length} Settlements Recorded</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Outstanding Dues</span>
                <FileText size={16} className="text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">₹{totalDueSum.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted-foreground font-semibold">Active balances</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Payment Realization</span>
                <ArrowUpRight size={16} className="text-primary" />
              </div>
              <p className="text-2xl font-extrabold text-primary">
                {totalInvoicedSum > 0 ? `${Math.round((totalCollectedSum / totalInvoicedSum) * 100)}%` : "100%"}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">Collection efficiency</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LEADS REPORT ──────────────────────────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Inquiries & Leads</p>
              <p className="text-2xl font-extrabold text-foreground">{leads.length}</p>
              <p className="text-[11px] text-muted-foreground pt-1">Active Pipeline Volume</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Qualified Opportunities</p>
              <p className="text-2xl font-extrabold text-emerald-500">
                {leads.filter(l => l.status === "Qualified" || l.status === "Discussion").length}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">High conversion propensity</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Deals Won</p>
              <p className="text-2xl font-extrabold text-primary">
                {leads.filter(l => l.status === "Won").length}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Converted to client accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PRODUCTIVITY REPORT ──────────────────────────────────────── */}
      {activeTab === "productivity" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">Team Member Performance Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Assigned Tasks</th>
                    <th className="py-3 px-4 text-center">Completed Tasks</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                    <th className="py-3 px-4 text-right">Avg Task Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {userProductivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No team members registered yet.
                      </td>
                    </tr>
                  ) : (
                    userProductivity.map((up) => (
                      <tr key={up.name} className="hover:bg-surface-hover/50">
                        <td className="py-3 px-4 font-bold text-foreground">{up.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{up.role}</td>
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

      {/* ── TAB 4: ATTENDANCE / DIRECTORY REPORT ─────────────────────────────── */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">Registered Personnel & Account Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {users.filter(u => u.role !== "Clients").map((u) => (
                    <tr key={u.email} className="hover:bg-surface-hover/50">
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.email}`} alt={u.name} className="w-6 h-6 rounded-full border shrink-0" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.role}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.department || "Operations"}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-500">{u.status || "Active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: EXPENSES REPORT ──────────────────────────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Operational Expenses</p>
              <p className="text-2xl font-extrabold text-foreground">
                ₹{expenses.reduce((sum, e) => sum + (e.amountNum || parseInt((e.amount || "0").replace(/[^0-9]/g, "")) || 0), 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">{expenses.length} Recorded Expense Receipts</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-extrabold text-amber-500">
                {expenses.filter(e => e.status === "Pending").length} Requests
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Awaiting settlement</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Approved Settlements</p>
              <p className="text-2xl font-extrabold text-emerald-500">
                {expenses.filter(e => e.status === "Approved").length} Settled
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">Verified business costs</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
