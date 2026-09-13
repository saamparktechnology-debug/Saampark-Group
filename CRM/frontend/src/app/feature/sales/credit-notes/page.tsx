"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowUpCircle, Plus, Search, Filter, Download, Printer, 
  Trash2, Eye, CheckCircle2, Clock, X, Building2, Calculator,
  ArrowRight, FileText, Check, AlertCircle, RefreshCw
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { CreditNoteService } from "@/services/salesService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

export interface CreditNoteItem {
  id: string
  creditNoteNumber: string
  invoiceNumber: string
  client: string
  clientEmail?: string
  date: string
  amount: number
  reason: string
  status: "Issued" | "Applied" | "Void"
  companyId?: string
  branchId?: string
}

const DEFAULT_CREDIT_NOTES: CreditNoteItem[] = [
  {
    id: "cn_1",
    creditNoteNumber: "CN-2026-001",
    invoiceNumber: "INV-101",
    client: "Acme Global Solutions",
    clientEmail: "billing@acmeglobal.com",
    date: "12-09-2026",
    amount: 15000,
    reason: "Pre-payment adjustment for server milestone SLA rebate",
    status: "Issued",
    companyId: "tech"
  },
  {
    id: "cn_2",
    creditNoteNumber: "CN-2026-002",
    invoiceNumber: "INV-104",
    client: "Nexus Enterprise Ltd",
    clientEmail: "accounts@nexus.com",
    date: "10-09-2026",
    amount: 8500,
    reason: "Service discount concession applied after scope optimization",
    status: "Applied",
    companyId: "tech"
  }
]

export default function CreditNotesPage() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Credit Notes", "add") || user?.role === "Super Admin"
  const canDelete = canPerformAction(user, "Credit Notes", "delete") || user?.role === "Super Admin"

  const [notes, setNotes] = React.useState<CreditNoteItem[]>(DEFAULT_CREDIT_NOTES)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedNote, setSelectedNote] = React.useState<CreditNoteItem | null>(null)
  const [clients, setClients] = React.useState<any[]>([])

  const [form, setForm] = React.useState({
    creditNoteNumber: "",
    invoiceNumber: "",
    client: "",
    clientEmail: "",
    amount: 0,
    reason: "",
    status: "Issued" as const
  })

  const loadData = React.useCallback(async () => {
    try {
      const [cnData, cData] = await Promise.all([
        CreditNoteService.getAll().catch(() => []),
        getClients(activeCompanyId || "tech").catch(() => [])
      ])
      if (Array.isArray(cnData) && cnData.length > 0) {
        setNotes(cnData)
      }
      setClients(Array.isArray(cData) ? cData : [])
    } catch {}
  }, [activeCompanyId])

  React.useEffect(() => { loadData() }, [loadData])

  const filteredNotes = notes.filter(n => {
    const match = n.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && n.status !== statusFilter) return false
    return match
  })

  const totalCreditAmount = notes.reduce((sum, n) => sum + (n.status !== "Void" ? n.amount : 0), 0)

  const openAddModal = () => {
    setForm({
      creditNoteNumber: `CN-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: "INV-",
      client: clients[0]?.name || "Acme Global Solutions",
      clientEmail: clients[0]?.email || "",
      amount: 5000,
      reason: "Discount concession / refund adjustment",
      status: "Issued"
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreditNoteItem = {
      id: `cn_${Date.now()}`,
      ...form,
      date: new Date().toLocaleDateString("en-GB"),
      companyId: activeCompanyId || "tech",
      branchId: activeBranchId || undefined,
    }

    await executeWithFeedback(async () => {
      await CreditNoteService.create(payload).catch(() => {})
      setNotes(prev => [payload, ...prev])
      setIsModalOpen(false)
    }, {
      actionType: "create",
      loadingTitle: "Generating Credit Note...",
      loadingMsg: `Creating ${payload.creditNoteNumber}...`,
      successTitle: "Credit Note Issued",
      successMsg: `${payload.creditNoteNumber} registered successfully.`
    })
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900">
              <ArrowUpCircle size={22} />
            </div>
            <span>Credit Notes Directory</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Issue statutory tax credit notes, invoice adjustments, and customer refund vouchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "Credit_Notes",
                title: "Credit Notes Ledger",
                subtitle: statusFilter === "all" ? "All Notes" : statusFilter,
                headers: ["#", "CN Number", "Ref Invoice", "Customer", "Date", "Amount (₹)", "Status"],
                rows: filteredNotes.map((n, idx) => [
                  idx + 1, n.creditNoteNumber, n.invoiceNumber, n.client, n.date, `₹${n.amount.toLocaleString("en-IN")}`, n.status
                ])
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 cursor-pointer shadow-2xs"
          >
            <Download size={13} className="text-teal-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: "Credit Notes Ledger",
                subtitle: "Official Financial Adjustments",
                headers: ["CN #", "Invoice #", "Client", "Date", "Amount", "Status"],
                rows: filteredNotes.map(n => [n.creditNoteNumber, n.invoiceNumber, n.client, n.date, `₹${n.amount.toLocaleString("en-IN")}`, n.status])
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 cursor-pointer shadow-2xs"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAdd && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Issue Credit Note</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Credit Notes</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{notes.length}</h3>
          </div>
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-xl">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Credit Value</p>
            <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-0.5">₹{totalCreditAmount.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-xl">
            <Calculator size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Applied Against Invoices</p>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {notes.filter(n => n.status === "Applied").length}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by CN #, invoice #, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "Issued", "Applied", "Void"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">CN Number</th>
                <th className="py-3 px-4">Ref Invoice</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    No credit notes found.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n) => (
                  <tr key={n.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-teal-600 dark:text-teal-400">
                      {n.creditNoteNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {n.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {n.client}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">{n.date}</td>
                    <td className="py-3 px-4 font-bold font-mono text-zinc-950 dark:text-zinc-50">
                      ₹{n.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">{n.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        n.status === "Applied" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        n.status === "Issued" ? "bg-teal-50 text-teal-700 border-teal-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDelete && (
                        <button
                          onClick={() => setNotes(prev => prev.filter(x => x.id !== n.id))}
                          className="p-1 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-xs">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  <ArrowUpCircle size={16} className="text-teal-600" />
                  <span>Issue Official Credit Note</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Credit Note #</label>
                  <input type="text" required value={form.creditNoteNumber} onChange={e => setForm({ ...form, creditNoteNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono font-bold" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Target Customer</label>
                  <select
                    value={form.client}
                    onChange={e => {
                      const c = clients.find(cl => cl.name === e.target.value)
                      setForm({ ...form, client: e.target.value, clientEmail: c?.email || "" })
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  >
                    {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Invoice Reference #</label>
                  <input type="text" placeholder="e.g. INV-101" required value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Credit Amount (₹)</label>
                  <input type="number" required min={1} value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono font-bold" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Adjustment Reason / Notes</label>
                  <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer">Issue Note</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
