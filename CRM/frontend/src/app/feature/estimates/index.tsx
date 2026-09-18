"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, Plus, Search, Edit, Trash2, X, Send, 
  Printer, UserCheck, Mail, Building2, Phone, Sparkles 
} from "lucide-react"
import { useAuthStore, getCompanyFullName, getCompanyLogoUrl } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { EstimateService } from "@/services/salesService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { createNotification } from "@/services/notificationService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal"

interface LineItem { 
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number 
}

interface Estimate { 
  id: string
  number: string
  customer: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  date: string
  validTill?: string
  notes?: string
  terms?: string
  total: number
  subtotal?: number
  tax?: number
  status: string
  items?: LineItem[]
  companyId?: string
}

export default function EstimatesMain() {
  const { user, activeCompanyId, activeBranchId, branches, companies } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  const canAdd = canPerformAction(user, "Estimates", "add")
  const canEdit = canPerformAction(user, "Estimates", "edit")
  const canDelete = canPerformAction(user, "Estimates", "delete")

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0]
  const companyName = getCompanyFullName(activeCompany)
  const logoUrl = getCompanyLogoUrl(activeCompany)

  const [estimates, setEstimates] = React.useState<Estimate[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isStudioOpen, setIsStudioOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Estimate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Estimate | null>(null)
  const [viewingItem, setViewingItem] = React.useState<Estimate | null>(null)
  const [sendingItem, setSendingItem] = React.useState<Estimate | null>(null)
  const [sendEmail, setSendEmail] = React.useState("")
  const [sendMessage, setSendMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)

  // Form state
  const [recipientMode, setRecipientMode] = React.useState<"client" | "custom">("client")
  const [selectedClientId, setSelectedClientId] = React.useState("")
  const [form, setForm] = React.useState({ 
    number: "", 
    customer: "", 
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    date: "", 
    validTill: "",
    notes: "Detailed project scope & commercial estimation.",
    terms: "1. Estimate valid for 30 calendar days.\n2. Scope changes subject to re-estimation.",
    status: "Draft" 
  })
  const [items, setItems] = React.useState<LineItem[]>([{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }])

  const loadData = React.useCallback(async () => {
    try { 
      const [eData, cData] = await Promise.all([
        EstimateService.getAll({}),
        getClients(activeCompanyId || "all").catch(() => [])
      ])
      setEstimates(Array.isArray(eData) ? eData : [])
      setClients(Array.isArray(cData) ? cData : [])
    } catch { }
  }, [activeCompanyId])

  React.useEffect(() => {
    loadData()
    const handleReload = () => loadData()
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    return () => {
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [loadData])

  const filtered = React.useMemo(() => {
    const { activeCompanyId: freshComp, activeBranchId: freshBranch, branches: freshBranches } = useAuthStore.getState()
    const userComp = (freshComp || user?.companyId || "").toLowerCase().trim()
    const targetBranch = freshBranch
    const branchObj = freshBranches.find(b => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
    const targetBranchId = String(branchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = branchObj?.name?.toLowerCase().trim() || ""

    return estimates.filter(e => {
      // Company filter
      if (userComp && userComp !== "all") {
        const eComp = (e.companyId || "").toLowerCase().trim()
        if (eComp && eComp !== userComp) return false
        if (!eComp && userComp !== "tech") return false
      }
      // Branch filter (strict)
      if (targetBranch && targetBranch !== "all") {
        const eBranch = String((e as any).branchId || "").toLowerCase().trim()
        if (!eBranch) return false
        const match = eBranch === targetBranchId || (targetBranchName && eBranch === targetBranchName)
        if (!match) return false
      }
      // Search + status
      if (statusFilter !== "all" && e.status !== statusFilter) return false
      const match = e.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.customerEmail && e.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()))
      return match
    })
  }, [estimates, activeCompanyId, activeBranchId, branches, searchQuery, statusFilter, user])

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const tax = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + tax

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, [field]: value }
      if (field === "quantity" || field === "unitPrice") updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
      return updated
    }))
  }

  const addItem = () => setItems([...items, { id: String(Date.now()), name: "", quantity: 1, unitPrice: 0, total: 0 }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)) }

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const selected = clients.find(c => String(c.id) === clientId)
    if (selected) {
      setForm(prev => ({
        ...prev,
        customer: selected.company_name || selected.primaryContact || "Valued Client",
        customerEmail: selected.email || "",
        customerPhone: selected.phone || "",
        customerAddress: selected.address || (selected.city ? `${selected.city}, ${selected.state || ''}` : ""),
      }))
    }
  }

  const openAddModal = () => { 
    setEditingItem(null)
    setRecipientMode("client")
    setSelectedClientId("")
    setForm({ 
      number: `EST-${Date.now().toString().slice(-6)}`, 
      customer: "", 
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      date: new Date().toISOString().split("T")[0], 
      validTill: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: "Commercial project estimate and deliverables breakdown.",
      terms: "1. Estimate valid for 30 calendar days.\n2. Work commences upon clearance of advance retainer.",
      status: "Draft" 
    })
    setItems([{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }])
    setIsModalOpen(true) 
  }

  const openEditModal = (item: Estimate) => { 
    setEditingItem(item)
    setRecipientMode(item.customerEmail ? "client" : "custom")
    setForm({ 
      number: item.number, 
      customer: item.customer, 
      customerEmail: item.customerEmail || "",
      customerPhone: item.customerPhone || "",
      customerAddress: item.customerAddress || "",
      date: item.date, 
      validTill: item.validTill || "",
      notes: item.notes || "Commercial project estimate.",
      terms: item.terms || "1. Estimate valid for 30 days.",
      status: item.status 
    })
    setItems(item.items || [{ id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }])
    setIsModalOpen(true) 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer.trim()) return
    const data = { ...form, items, subtotal, tax, total: grandTotal, companyId: activeCompanyId }
    await executeWithFeedback(async () => {
      if (editingItem) { await EstimateService.update(editingItem.id, data) } else { await EstimateService.create(data) }
    }, { actionType: editingItem ? "update" : "create", successTitle: editingItem ? "Estimate Updated" : "Estimate Created" })
    setIsModalOpen(false)
    loadData()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { await EstimateService.delete(deleteConfirm.id) }, { actionType: "delete", successTitle: "Estimate Deleted" })
    setDeleteConfirm(null)
    loadData()
  }

  const openSendModal = (item: Estimate) => {
    setSendingItem(item)
    setSendEmail(item.customerEmail || "")
    setSendMessage(`Dear ${item.customer},\n\nPlease find attached our detailed cost estimate ${item.number} amounting to ₹${(item.total || 0).toLocaleString("en-IN")}.\n\nPlease review the itemized breakdown and let us know if you would like to proceed.\n\nWarm regards,\n${companyName}`)
  }

  const handleSendEstimate = async () => {
    if (!sendingItem || !sendEmail.trim()) {
      alert("Please specify a valid recipient email.")
      return
    }
    setIsSending(true)
    try {
      // 1. Update status to Sent and save customer email
      await EstimateService.update(sendingItem.id, {
        ...sendingItem,
        customerEmail: sendEmail.trim(),
        status: "Sent"
      })

      // 2. Dispatch in-app notification to client
      await createNotification({
        title: `Project Estimate Received: ${sendingItem.number}`,
        message: `A new commercial project estimate (${sendingItem.number}) for ₹${(sendingItem.total || 0).toLocaleString("en-IN")} has been sent to you by ${companyName}.`,
        type: "invoice",
        targetEmail: sendEmail.trim(),
        linkUrl: `/feature/estimates`,
        sendEmailNotification: true,
      })

      setSendingItem(null)
      loadData()
      alert(`✅ Estimate ${sendingItem.number} dispatched successfully to ${sendEmail}!`)
    } catch (err) {
      console.error("Error sending estimate:", err)
      alert("Failed to dispatch estimate.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Estimate Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Create, email, print, and track commercial cost estimates for registered clients and custom recipients</p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setEditingItem(null); setIsStudioOpen(true) }} 
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Estimate</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search by number, customer, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer">
          <option value="all">All Status</option><option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Customer & Recipient</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No estimates found. Click "Create Estimate" to generate one.</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.customer}</div>
                      {item.customerEmail && <div className="text-[10px] text-zinc-400 font-mono">{item.customerEmail}</div>}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : item.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-200" : item.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Send Action */}
                        <button
                          type="button"
                          onClick={() => openSendModal(item)}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Send Estimate via Email"
                        >
                          <Send size={12} />
                          <span>Send</span>
                        </button>

                        {/* View & Print Action */}
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="View & Print Official Estimate"
                        >
                          <Printer size={14} />
                        </button>

                        {canEdit && <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-600"><Edit size={14} /></button>}
                        {canDelete && <button onClick={() => setDeleteConfirm(item)} className="p-1 hover:text-rose-600"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Create"} Project Estimate</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                {/* Number & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Estimate No. *</label>
                    <input type="text" value={form.number} onChange={(e) => setForm({...form, number: e.target.value})} className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Estimate Date *</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Valid Until</label>
                    <input type="date" value={form.validTill} onChange={(e) => setForm({...form, validTill: e.target.value})} className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg" />
                  </div>
                </div>

                {/* Recipient Mode Toggle */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Customer & Recipient Selection</span>
                    <div className="flex bg-zinc-200 dark:bg-zinc-700 rounded-lg p-0.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setRecipientMode("client")}
                        className={`px-3 py-1 rounded-md transition-colors ${recipientMode === "client" ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs" : "text-zinc-600 dark:text-zinc-400"}`}
                      >
                        CRM Registered Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientMode("custom")}
                        className={`px-3 py-1 rounded-md transition-colors ${recipientMode === "custom" ? "bg-white dark:bg-zinc-900 text-blue-600 shadow-xs" : "text-zinc-600 dark:text-zinc-400"}`}
                      >
                        Custom Recipient / Email
                      </button>
                    </div>
                  </div>

                  {recipientMode === "client" ? (
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Select Client *</label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-semibold focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Choose Client from CRM Directory --</option>
                        {clients.map(c => (
                          <option key={c.id} value={String(c.id)}>
                            🏢 {c.company_name || c.primaryContact} ({c.email || 'No email'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {/* Recipient Details Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Customer / Company Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Acme Tech Corp"
                        value={form.customer} 
                        onChange={(e) => setForm({...form, customer: e.target.value})} 
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold" 
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Recipient Email Address</label>
                      <input 
                        type="email" 
                        placeholder="client@company.com"
                        value={form.customerEmail} 
                        onChange={(e) => setForm({...form, customerEmail: e.target.value})} 
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Recipient Phone</label>
                      <input 
                        type="text" 
                        placeholder="+91 98765 43210"
                        value={form.customerPhone} 
                        onChange={(e) => setForm({...form, customerPhone: e.target.value})} 
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Billing Address</label>
                      <input 
                        type="text" 
                        placeholder="City, State, Country"
                        value={form.customerAddress} 
                        onChange={(e) => setForm({...form, customerAddress: e.target.value})} 
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg" 
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[11px]">Deliverable / Project Items</label>
                    <button type="button" onClick={addItem} className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1">
                      <Plus size={12} />Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg items-center">
                        <div className="col-span-5"><input type="text" placeholder="Deliverable / scope description" value={item.name} onChange={(e) => handleItemChange(item.id, "name", e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs" /></div>
                        <div className="col-span-2"><input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-center" /></div>
                        <div className="col-span-2"><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))} className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-right" /></div>
                        <div className="col-span-2 text-right font-mono font-bold">₹{item.total.toLocaleString("en-IN")}</div>
                        <div className="col-span-1 text-center"><button type="button" onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-600"><Trash2 size={13} /></button></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtotal, Tax, Total */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex justify-end">
                  <div className="w-64 space-y-1 text-right text-xs">
                    <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold font-mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Estimated GST (18%):</span><span className="font-semibold font-mono">₹{tax.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between text-sm font-bold text-blue-600 pt-1 border-t border-zinc-200 dark:border-zinc-700"><span>Grand Total:</span><span>₹{grandTotal.toLocaleString("en-IN")}</span></div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Estimate Scope Notes</label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Terms & Validity</label>
                    <textarea rows={2} value={form.terms} onChange={(e) => setForm({...form, terms: e.target.value})} className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-[11px]" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">{editingItem ? "Update Estimate" : "Create Estimate"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEND TO CLIENT MODAL */}
      <AnimatePresence>
        {sendingItem && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-xs">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2.5 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  <Send size={16} className="text-blue-600" />
                  <span>Send Estimate to Client</span>
                </div>
                <button onClick={() => setSendingItem(null)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"><X size={16} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                  <span className="font-bold">Estimate:</span> {sendingItem.number} | <span className="font-bold">Estimated Cost:</span> ₹{(sendingItem.total || 0).toLocaleString("en-IN")}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Recipient Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="client@company.com"
                    value={sendEmail} 
                    onChange={e => setSendEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-semibold"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">You can send to the client's registered email or input any custom email address.</p>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Message to Client</label>
                  <textarea 
                    rows={5}
                    value={sendMessage} 
                    onChange={e => setSendMessage(e.target.value)}
                    className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setSendingItem(null)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold">Cancel</button>
                  <button 
                    type="button" 
                    disabled={isSending || !sendEmail.trim()}
                    onClick={handleSendEstimate}
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>{isSending ? "Sending..." : "Dispatch Estimate"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL LETTERHEAD VIEW & PRINT MODAL */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0 print:hidden">
                <span className="font-bold text-sm">Commercial Estimate: {viewingItem.number}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer">
                    <Printer size={14} /><span>Print / PDF</span>
                  </button>
                  <button onClick={() => setViewingItem(null)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 print:p-0 print:bg-white print:text-black space-y-6">
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-zinc-900 pb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt={companyName} className="h-14 max-w-[150px] object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xl print:text-black">🏢</div>
                    )}
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-tight">{companyName}</h1>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 print:text-zinc-700 max-w-md">{activeCompany?.address || "Corporate Office, West Bengal, India"}</p>
                      {activeCompany?.gstin && <p className="text-[10px] text-zinc-500 font-mono">GSTIN: {activeCompany.gstin} {activeCompany?.pan ? `| PAN: ${activeCompany.pan}` : ""}</p>}
                    </div>
                  </div>

                  <div className="text-right text-xs space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 print:text-black">PROJECT ESTIMATE</h2>
                    <p className="font-mono font-bold">{viewingItem.number}</p>
                    <p className="text-[11px] text-zinc-500">Date: {viewingItem.date}</p>
                    {viewingItem.validTill && <p className="text-[10px] text-zinc-400">Valid Till: {viewingItem.validTill}</p>}
                  </div>
                </div>

                {/* Bill To */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Estimate Prepared For:</span>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{viewingItem.customer}</h3>
                    {viewingItem.customerAddress && <p className="text-xs text-zinc-600 dark:text-zinc-400">{viewingItem.customerAddress}</p>}
                    {viewingItem.customerEmail && <p className="text-xs font-mono text-zinc-500">{viewingItem.customerEmail}</p>}
                    {viewingItem.customerPhone && <p className="text-xs text-zinc-500">{viewingItem.customerPhone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Status:</span>
                    <p className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400">{viewingItem.status}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800">
                  <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Deliverable / Scope Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(viewingItem.items || []).map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold">{item.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹{item.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-between items-start gap-6 pt-2">
                  <div className="flex-1 space-y-3">
                    {viewingItem.terms && (
                      <div className="text-[11px] text-zinc-500">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">Scope & Validity Terms:</span>
                        <p className="whitespace-pre-line font-mono text-[10px]">{viewingItem.terms}</p>
                      </div>
                    )}
                    {activeCompany?.bank_name && (
                      <div className="text-[10px] text-zinc-500 font-mono p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Bank Account Details for Remittance:</span>
                        <span>Bank: {activeCompany.bank_name} | A/C: {activeCompany.account_number} | IFSC: {activeCompany.ifsc_code} | UPI: {activeCompany.upi_id || 'N/A'}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-64 space-y-1.5 text-right text-xs">
                    <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold font-mono">₹{(viewingItem.subtotal || 0).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>GST (18%):</span><span className="font-semibold font-mono">₹{(viewingItem.tax || 0).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between text-base font-black text-blue-600 dark:text-blue-400 pt-2 border-t-2 border-zinc-900 dark:border-zinc-100">
                      <span>Grand Total:</span><span>₹{(viewingItem.total || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Signatory */}
                <div className="pt-10 flex justify-end">
                  <div className="text-right space-y-1">
                    {activeCompany?.signature_image_url && (
                      <img src={activeCompany.signature_image_url} alt="Signature" className="h-10 max-w-[120px] object-contain ml-auto" />
                    )}
                    <div className="border-t border-zinc-400 pt-1">
                      <p className="font-bold text-xs">{activeCompany?.signatory_name || "Authorized Signatory"}</p>
                      <p className="text-[10px] text-zinc-500">{activeCompany?.signatory_designation || "Managing Director"}</p>
                      <p className="text-[10px] font-bold text-zinc-700">{companyName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-sm">Delete Estimate</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete estimate <strong>{deleteConfirm.number}</strong>?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-zinc-500 font-semibold cursor-pointer">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (ESTIMATE) */}
      <DocumentStudioModal
        isOpen={isStudioOpen}
        mode="estimate"
        initialData={editingItem}
        onClose={() => {
          setIsStudioOpen(false)
          setEditingItem(null)
        }}
        onSaveSuccess={() => {
          setIsStudioOpen(false)
          setEditingItem(null)
          loadData()
        }}
      />
    </motion.div>
  )
}
