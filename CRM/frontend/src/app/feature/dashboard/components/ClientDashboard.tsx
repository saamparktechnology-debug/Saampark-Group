"use client"

import * as React from "react"
import {
  Briefcase,
  FileText,
  CreditCard,
  LifeBuoy,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  ArrowUpRight,
  Plus,
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { getInvoices, InvoiceItem } from "../../sales/invoices/services/invoiceService"
import { getProjects } from "../../projects/services/projectService"
import { getInstallments } from "../../subscriptions/services/subscriptionService"
import { Project } from "../../projects/types"
import { InstallmentItem } from "../../subscriptions/types"
import { InvoiceModal } from "../../sales/invoices/components/InvoiceModal"

export function ClientDashboard() {
  const { user } = useAuthStore()
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [installments, setInstallments] = React.useState<InstallmentItem[]>([])
  const [tickets, setTickets] = React.useState<any[]>([])
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return

    const loadClientData = async () => {
      setIsLoading(true)
      try {
        const [allInvs, allProjs, allInsts, allTkts] = await Promise.all([
          getInvoices("all").catch(() => []),
          getProjects("all").catch(() => []),
          getInstallments("all").catch(() => []),
          import("@/lib/storageSync").then((m) =>
            m.fetchModuleDataFromDB<any[]>("tickets", [], "all").catch(() => [])
          ),
        ])

        const userEmail = (user.email || "").toLowerCase().trim()
        const userName = (user.name || "").toLowerCase().trim()
        const compName = ((user as any).companyName || "").toLowerCase().trim()

        // Filter Invoices for this client
        const myInvs = (allInvs || []).filter((inv) => {
          const cEmail = (inv.clientEmail || "").toLowerCase().trim()
          const cName = (inv.client || "").toLowerCase().trim()
          return (
            (userEmail && cEmail === userEmail) ||
            (userName && cName === userName) ||
            (compName && cName.includes(compName))
          )
        })

        // Filter Projects for this client
        const myProjs = (allProjs || []).filter((p) => {
          const cName = (p.client || "").toLowerCase().trim()
          return (
            (userName && cName.includes(userName)) ||
            (compName && cName.includes(compName)) ||
            (userEmail && cName.includes(userEmail))
          )
        })

        // Filter Installments for this client
        const myInsts = (allInsts || []).filter((inst) => {
          const cName = (inst.clientName || "").toLowerCase().trim()
          return (
            (userName && cName.includes(userName)) ||
            (compName && cName.includes(compName))
          )
        })

        // Filter Tickets for this client
        const myTkts = (allTkts || []).filter((t) => {
          const tEmail = (t.requestedByEmail || t.clientEmail || "").toLowerCase().trim()
          const tName = (t.client || t.clientName || "").toLowerCase().trim()
          return (
            (userEmail && tEmail === userEmail) ||
            (userName && tName === userName) ||
            (compName && tName.includes(compName))
          )
        })

        setInvoices(myInvs)
        setProjects(myProjs)
        setInstallments(myInsts)
        setTickets(myTkts)
      } catch (err) {
        console.warn("Error loading client dashboard data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClientData()
  }, [user])

  // Financial Metrics
  const totalInvoicedNum = invoices.reduce((acc, inv) => {
    const raw = String(inv.totalInvoiced || "0").replace(/[^0-9]/g, "")
    return acc + (parseInt(raw, 10) || 0)
  }, 0)

  const totalPaidNum = invoices.reduce((acc, inv) => {
    if (inv.status === "Fully paid") {
      const raw = String(inv.totalInvoiced || "0").replace(/[^0-9]/g, "")
      return acc + (parseInt(raw, 10) || 0)
    }
    const paidRaw = String(inv.paymentReceived || "0").replace(/[^0-9]/g, "")
    return acc + (parseInt(paidRaw, 10) || 0)
  }, 0)

  const outstandingDueNum = Math.max(0, totalInvoicedNum - totalPaidNum)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* ── Welcome & Account Header ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
              <Building2 size={13} />
              <span>Client Self-Service Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || "Valued Client"}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Track your ongoing project milestones, download official tax invoices, check installment EMI schedules, and access priority support.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-right">
              <p className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">Account Status</p>
              <p className="text-base font-extrabold flex items-center gap-1.5 justify-end">
                <CheckCircle2 size={16} className="text-emerald-300" />
                <span>Active Account</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Financial Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            ₹{totalInvoicedNum.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-zinc-500">{invoices.length} Generated Invoices</p>
        </div>

        {/* Total Paid */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Payments Settled</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{totalPaidNum.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Cleared & Verified</p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Due</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black font-mono ${outstandingDueNum > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>
            ₹{outstandingDueNum.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-zinc-500">{outstandingDueNum === 0 ? "No Pending Balance ✓" : "Upcoming Balance"}</p>
        </div>

        {/* Active Projects */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {projects.length}
          </p>
          <p className="text-[11px] text-zinc-500">Live Deployments</p>
        </div>
      </div>

      {/* ── Active Projects Section ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Briefcase size={15} />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              My Projects & Milestone Progress
            </h2>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {projects.length} Total
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No active projects assigned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const progressPct = p.progress !== undefined ? p.progress : 50
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Deadline: {p.deadline || "Ongoing"}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {p.status || "In Progress"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      <span>Completion</span>
                      <span className="font-mono">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Tax Invoices & Official Documents ───────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <FileText size={15} />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Tax Invoices & Billing Statements
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {invoices.length} Invoices
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No invoices generated for your account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold pb-2">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {inv.id}
                    </td>
                    <td className="py-3 text-zinc-500 font-mono">{inv.billDate || "-"}</td>
                    <td className="py-3 text-zinc-500 font-mono">{inv.dueDate || "-"}</td>
                    <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {inv.totalInvoiced}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === "Fully paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : inv.status === "Partially paid"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>View / Print</span>
                        <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal for Selected Invoice ──────────────────────────────────────── */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  )
}
