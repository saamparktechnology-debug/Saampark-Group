"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowDownCircle, Plus, Search, Filter, Download, Printer, 
  Trash2, Eye, CheckCircle2, Clock, X, Building2, Calculator,
  ArrowRight, FileText, Check, AlertCircle, RefreshCw
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { DebitNoteService } from "@/services/salesService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

export interface DebitNoteItem {
  id: string
  debitNoteNumber: string
  invoiceNumber: string
  client: string
  clientEmail?: string
  date: string
  amount: number
  reason: string
  status: "Issued" | "Collected" | "Cancelled"
  companyId?: string
  branchId?: string
}

const DEFAULT_DEBIT_NOTES: DebitNoteItem[] = [
  {
    id: "dn_1",
    debitNoteNumber: "DN-2026-001",
    invoiceNumber: "INV-102",
    client: "Quantum Dynamics Corp",
    clientEmail: "finance@quantum.com",
    date: "11-09-2026",
    amount: 12000,
    reason: "Additional cloud compute and server provisioning charges outside original scope",
    status: "Issued",
    companyId: "tech"
  },
  {
    id: "dn_2",
    debitNoteNumber: "DN-2026-002",
    invoiceNumber: "INV-103",
    client: "Horizon Retail Systems",
    clientEmail: "accounts@horizonretail.com",
    date: "09-09-2026",
    amount: 6500,
    reason: "Post-delivery emergency security patch & overtime developer deployment",
    status: "Collected",
    companyId: "tech"
  }
]

export default function DebitNotesPage() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAdd = canPerformAction(user, "Debit Notes", "add") || user?.role === "Super Admin"
  const canDelete = canPerformAction(user, "Debit Notes", "delete") || user?.role === "Super Admin"

  const [notes, setNotes] = React.useState<DebitNoteItem[]>(DEFAULT_DEBIT_NOTES)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])

  const [form, setForm] = React.useState({
    debitNoteNumber: "",
    invoiceNumber: "",
    client: "",
    clientEmail: "",
    amount: 0,
    reason: "",
    status: "Issued" as const
  })

  const loadData = React.useCallback(async () => {
    try {
      const [dnData, cData] = await Promise.all([
        DebitNoteService.getAll().catch(() => []),
        getClients(activeCompanyId || "tech").catch(() => [])
      ])
      if (Array.isArray(dnData) && dnData.length > 0) {
        setNotes(dnData)
      }
      setClients(Array.isArray(cData) ? cData : [])
    } catch {}
  }, [activeCompanyId])

  React.useEffect(() => { loadData() }, [loadData])

  const filteredNotes = notes.filter(n => {
    const match = n.debitNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    if (statusFilter !== "all" && n.status !== statusFilter) return false
    return match
  })

  const totalDebitAmount = notes.reduce((sum, n) => sum + (n.status !== "Cancelled" ? n.amount : 0), 0)

  const openAddModal = () => {
    setForm({
      debitNoteNumber: `DN-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: "INV-",
      client: clients[0]?.name || "Quantum Dynamics Corp",
      clientEmail: clients[0]?.email || "",
      amount: 7500,
      reason: "Additional deliverables & overtime infrastructure maintenance",
      status: "Issued"
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: DebitNoteItem = {
      id: `dn_${Date.now()}`,
      ...form,
      date: new Date().toLocaleDateString("en-GB"),
      companyId: activeCompanyId || "tech",
      branchId: activeBranchId || undefined,
    }

    await executeWithFeedback(async () => {
      await DebitNoteService.create(payload).catch(() => {})
      setNotes(prev => [payload, ...prev])
      setIsModalOpen(false)
    }, {
      actionType: "create",
      loadingTitle: "Issuing Debit Note...",
      loadingMsg: `Creating ${payload.debitNoteNumber}...`,
      successTitle: "Debit Note Issued",
      successMsg: `${payload.debitNoteNumber} registered successfully.`
    })
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <ArrowDownCircle size={22} />
            </div>
            <span>Debit Notes Directory</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Issue official supplementary billing debit notes for scope extensions, billable add-ons, and supplementary claims
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "Debit_Notes",
                title: "Debit Notes Ledger",
                subtitle: statusFilter === "all" ? "All Notes" : statusFilter,
                headers: ["#", "DN Number", "Ref Invoice", "Customer", "Date", "Amount (₹)", "Status"],
                rows: filteredNotes.map((n, idx) => [
                  idx + 1, n.debitNoteNumber, n.invoiceNumber, n.client, n.date, `₹${n.amount.toLocaleString("en-IN")}`, n.status
                ])
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 cursor-pointer shadow-2xs"
          >
            <Download size={13} className="text-indigo-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: "Debit Notes Ledger",
                subtitle: "Supplementary Invoicing Records",
                headers: ["DN #", "Invoice #", "Client", "Date", "Amount", "Status"],
                rows: filteredNotes.map(n => [n.debitNoteNumber, n.invoiceNumber, n.client, n.date, `₹${n.amount.toLocaleString("en-IN")}`, n.status])
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Issue Debit Note</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Debit Notes</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{notes.length}</h3>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Supplementary Billable</p>
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">₹{totalDebitAmount.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
            <Calculator size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Settled / Collected</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {notes.filter(n => n.status === "Collected").length}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
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
            placeholder="Search by DN #, invoice #, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["all", "Issued", "Collected", "Cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-xs"
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
                <th className="py-3 px-4">DN Number</th>
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
                    No debit notes found.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n) => (
                  <tr key={n.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {n.debitNoteNumber}
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
                        n.status === "Collected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        n.status === "Issued" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        "bg-zinc-100 text-zinc-700 border-zinc-200"
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
                  <ArrowDownCircle size={16} className="text-indigo-600" />
                  <span>Issue Supplementary Debit Note</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Debit Note #</label>
                  <input type="text" required value={form.debitNoteNumber} onChange={e => setForm({ ...form, debitNoteNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono font-bold" />
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
                  <input type="text" placeholder="e.g. INV-102" required value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Supplementary Amount (₹)</label>
                  <input type="number" required min={1} value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono font-bold" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Billing Reason / Notes</label>
                  <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer">Issue Note</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
