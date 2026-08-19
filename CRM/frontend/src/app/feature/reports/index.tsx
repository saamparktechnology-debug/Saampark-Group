"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, Download, Calendar, Filter, TrendingUp, Users, 
  DollarSign, CheckSquare, Target, PieChart, ArrowUpRight, ArrowDownRight, FileText
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { getStoredUserAccounts } from "../users/services/userService"

type ReportTab = "revenue" | "leads" | "productivity" | "attendance" | "expenses"

export default function ReportsMain() {
  const { activeCompanyId } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState<ReportTab>("revenue")
  const [dateRange, setDateRange] = React.useState("this_month")
  const [customStartDate, setCustomStartDate] = React.useState("2026-08-01")
  const [customEndDate, setCustomEndDate] = React.useState("2026-08-31")
  const [users, setUsers] = React.useState<any[]>([])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setUsers(getStoredUserAccounts())
    }
  }, [])

  // Export report to CSV
  const handleExportCSV = () => {
    let rows: string[][] = []
    let filename = `saampark_${activeTab}_report.csv`

    if (activeTab === "revenue") {
      rows = [
        ["Invoice Number", "Client Name", "Total Amount", "Paid Amount", "Due Date", "Status"],
        ["INV-2026-001", "Acme Corporation", "₹2,50,000", "₹2,50,000", "2026-08-10", "Fully Paid"],
        ["INV-2026-002", "Global Tech Ltd", "₹1,80,000", "₹1,00,000", "2026-08-25", "Partially Paid"],
        ["INV-2026-003", "Innovate Solutions", "₹3,20,000", "₹0", "2026-08-30", "Overdue"],
        ["INV-2026-004", "Nexus Digital", "₹95,000", "₹95,000", "2026-08-05", "Fully Paid"],
      ]
    } else if (activeTab === "leads") {
      rows = [
        ["Lead Name", "Company", "Email", "Source", "Assigned Agent", "Score", "Stage"],
        ["Rahul Verma", "Apex Retail", "rahul@apex.in", "Website Inquiry", "Priya Patel", "85", "Qualified"],
        ["Anita Roy", "Zenith Media", "anita@zenith.com", "LinkedIn", "Sneha Gupta", "92", "Negotiation"],
        ["Vikas Sharma", "Astra Tech", "vikas@astra.io", "Cold Call", "Priya Patel", "45", "New"],
        ["Pooja Nair", "Metro Infra", "pooja@metro.in", "Referral", "Sneha Gupta", "78", "Discussion"],
      ]
    } else if (activeTab === "productivity") {
      rows = [
        ["Team Member", "Role", "Assigned Tasks", "Completed Tasks", "Completion Rate", "Avg Time per Task"],
        ["Priya Patel", "Admin / Manager", "24", "22", "91.6%", "4.2 hrs"],
        ["Sneha Gupta", "Team Member", "18", "15", "83.3%", "3.8 hrs"],
        ["Amit Kumar", "Developer", "32", "29", "90.6%", "5.5 hrs"],
        ["Deepak Singh", "Sales Executive", "15", "14", "93.3%", "2.1 hrs"],
      ]
    } else {
      rows = [
        ["Employee", "Role", "Days Present", "Hours Logged", "Overtime", "Attendance %"],
        ["Priya Patel", "Admin", "22", "176 hrs", "12 hrs", "100%"],
        ["Sneha Gupta", "Team Member", "21", "168 hrs", "4 hrs", "95.4%"],
        ["Amit Kumar", "Developer", "22", "180 hrs", "16 hrs", "100%"],
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate custom data summaries for revenue, sales pipelines, team performance, and attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter */}
          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-semibold">
            <Calendar size={14} className="text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month (Aug 2026)</option>
              <option value="last_month">Last Month (Jul 2026)</option>
              <option value="this_quarter">Q3 2026</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
              />
            </div>
          )}

          <Button
            variant="primary"
            leftIcon={<Download size={15} />}
            onClick={handleExportCSV}
            className="text-xs font-bold shadow-sm"
          >
            Export CSV Report
          </Button>
        </div>
      </div>

      {/* Report Category Navigation Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto scrollbar-hide pb-2">
        {[
          { id: "revenue", label: "Financial & Revenue", icon: DollarSign },
          { id: "leads", label: "Lead & Sales Conversion", icon: Target },
          { id: "productivity", label: "Team Productivity", icon: CheckSquare },
          { id: "attendance", label: "Attendance & Work Hours", icon: Users },
          { id: "expenses", label: "Expense Breakdown", icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border/50"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: REVENUE REPORT ────────────────────────────────────────────── */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Invoiced Revenue</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold text-foreground">₹12,45,000</p>
                <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <ArrowUpRight size={14} /> +18.4%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">Across active client accounts</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Collected Payments</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold text-emerald-500">₹9,80,000</p>
                <span className="text-xs font-bold text-emerald-500">78.7%</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">Realized cash flow</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Outstanding / Receivables</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold text-amber-500">₹2,65,000</p>
                <span className="text-xs font-bold text-amber-500">21.3%</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">Pending client payments</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Overdue Amount</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold text-rose-500">₹85,000</p>
                <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  <ArrowDownRight size={14} /> 3 Invoices
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">Due past 30 days</p>
            </div>
          </div>

          {/* Revenue Breakdown Table */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">Recent Invoices & Payment Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Date Issued</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-primary">INV-2026-001</td>
                    <td className="py-3 px-4 font-bold text-foreground">Acme Corporation</td>
                    <td className="py-3 px-4 text-muted-foreground">01 Aug 2026</td>
                    <td className="py-3 px-4 text-muted-foreground">15 Aug 2026</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">₹2,50,000</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-500">₹2,50,000</td>
                    <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">PAID</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-primary">INV-2026-002</td>
                    <td className="py-3 px-4 font-bold text-foreground">Global Tech Ltd</td>
                    <td className="py-3 px-4 text-muted-foreground">05 Aug 2026</td>
                    <td className="py-3 px-4 text-muted-foreground">25 Aug 2026</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">₹1,80,000</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-500">₹1,00,000</td>
                    <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">PARTIAL</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-primary">INV-2026-003</td>
                    <td className="py-3 px-4 font-bold text-foreground">Innovate Solutions</td>
                    <td className="py-3 px-4 text-muted-foreground">10 Jul 2026</td>
                    <td className="py-3 px-4 text-muted-foreground">30 Jul 2026</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">₹3,20,000</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-500">₹0</td>
                    <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">OVERDUE</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LEADS & SALES REPORT ─────────────────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Leads Logged</p>
              <p className="text-2xl font-extrabold text-foreground">148</p>
              <p className="text-[11px] text-muted-foreground pt-1">Across all marketing channels</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Qualified Leads</p>
              <p className="text-2xl font-extrabold text-indigo-500">62 (41.8%)</p>
              <p className="text-[11px] text-muted-foreground pt-1">High conversion likelihood</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Deals Won / Converted</p>
              <p className="text-2xl font-extrabold text-emerald-500">38</p>
              <p className="text-[11px] text-muted-foreground pt-1">Conversion Rate: <strong className="text-emerald-500">25.6%</strong></p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Pipeline Deal Value</p>
              <p className="text-2xl font-extrabold text-blue-500">₹18,20,000</p>
              <p className="text-[11px] text-muted-foreground pt-1">Potential pipeline revenue</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">Lead Source Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-background border border-border/60 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>🌐 Website Inquiries</span>
                  <span className="text-primary">65 Leads (44%)</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[44%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border/60 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>🤝 Client Referrals</span>
                  <span className="text-emerald-500">42 Leads (28%)</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[28%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border/60 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>📞 Cold Calls / Direct</span>
                  <span className="text-amber-500">41 Leads (28%)</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[28%]" />
                </div>
              </div>
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
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Priya Patel</td>
                    <td className="py-3 px-4 text-muted-foreground">Admin / Manager</td>
                    <td className="py-3 px-4 text-center font-mono">24</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">22</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-500">91.6%</td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">4.2 hrs</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Sneha Gupta</td>
                    <td className="py-3 px-4 text-muted-foreground">Team Member</td>
                    <td className="py-3 px-4 text-center font-mono">18</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">15</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-500">83.3%</td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">3.8 hrs</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-foreground">Amit Kumar</td>
                    <td className="py-3 px-4 text-muted-foreground">Developer</td>
                    <td className="py-3 px-4 text-center font-mono">32</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">29</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-500">90.6%</td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">5.5 hrs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ATTENDANCE REPORT ────────────────────────────────────────── */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">Employee Attendance & Timesheet Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Days Present</th>
                    <th className="py-3 px-4 text-center">Hours Logged</th>
                    <th className="py-3 px-4 text-center">Overtime</th>
                    <th className="py-3 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.email}`} alt={u.name} className="w-6 h-6 rounded-full border shrink-0" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.role}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">22 / 22</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">176 hrs</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-500">12 hrs</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-500">100%</td>
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
              <p className="text-2xl font-extrabold text-foreground">₹2,85,000</p>
              <p className="text-[11px] text-muted-foreground pt-1">Current period</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Largest Category</p>
              <p className="text-2xl font-extrabold text-indigo-500">Software & Servers</p>
              <p className="text-[11px] text-muted-foreground pt-1">₹1,20,000 (42.1%)</p>
            </div>
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-extrabold text-amber-500">₹15,400</p>
              <p className="text-[11px] text-muted-foreground pt-1">2 reimbursement requests</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
