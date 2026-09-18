"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, Plus, Search, Edit, Trash2, X, ArrowRight, Send, 
  Printer, UserCheck, Mail, Building2, Phone, Sparkles, CheckCircle2,
  Download, Calculator, Clock, Check, AlertCircle, Eye, RefreshCw
} from "lucide-react"
import { useAuthStore, getCompanyFullName, getCompanyLogoUrl } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { QuotationService } from "@/services/salesService"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
import { createNotification } from "@/services/notificationService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { OfficialQuotationDocument, QuotationData, QuotationLineItem } from "./components/OfficialQuotationDocument"
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal"

export default function QuotationsMain() {
  const { user, activeCompanyId, activeBranchId, branches, companies } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const canAdd = canPerformAction(user, "Quotations", "add") || user?.role === "Super Admin"
  const canEdit = canPerformAction(user, "Quotations", "edit") || user?.role === "Super Admin"
  const canDelete = canPerformAction(user, "Quotations", "delete") || user?.role === "Super Admin"

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0]

  const [quotations, setQuotations] = React.useState<QuotationData[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isStudioOpen, setIsStudioOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<QuotationData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<QuotationData | null>(null)
  const [viewingItem, setViewingItem] = React.useState<QuotationData | null>(null)
  const [sendingItem, setSendingItem] = React.useState<QuotationData | null>(null)
  const [sendEmail, setSendEmail] = React.useState("")
  const [sendMessage, setSendMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)

  // Estimate Studio from Quotation
  const [isEstimateStudioOpen, setIsEstimateStudioOpen] = React.useState(false)
  const [estimateInitialData, setEstimateInitialData] = React.useState<any>(null)

  // Form state
  const [recipientMode, setRecipientMode] = React.useState<"client" | "custom">("client")
  const [selectedClientId, setSelectedClientId] = React.useState("")
  const [formBranchId, setFormBranchId] = React.useState(user?.branchId || activeBranchId || "")
  
  const [form, setForm] = React.useState({ 
    number: "", 
    customer: "", 
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    clientGstin: "",
    date: "", 
    validTill: "",
    notes: "Thank you for your business interest. Looking forward to your approval.",
    terms: "1. Quotation valid for 30 calendar days from date of issue.\n2. 50% mobilization advance required before commencement.\n3. Applicable GST 18% billed as per statutory norms.",
    status: "Draft" 
  })
  
  const [items, setItems] = React.useState<QuotationLineItem[]>([
    { id: "1", name: "Custom Software Architecture & Development", description: "Full-stack enterprise application engineering", sac: "998311", quantity: 1, unitPrice: 75000, total: 75000 },
    { id: "2", name: "UI/UX Experience Design & Wireframing", description: "Design systems, interactive prototypes", sac: "998311", quantity: 1, unitPrice: 35000, total: 35000 }
  ])

  const loadData = React.useCallback(async () => {
    try { 
      const [qData, cData] = await Promise.all([
        QuotationService.getAll({}).catch(() => []),
        getClients(activeCompanyId || "all").catch(() => [])
      ])
      
      let list: QuotationData[] = Array.isArray(qData) ? qData : []
      if (list.length === 0) {
        // Fallback default sample quotation
        list = [
          {
            id: "qt_sample_1",
            number: "QT-2026-001",
            customer: "Acme Global Solutions",
            customerEmail: "contact@acmeglobal.com",
            customerPhone: "+91 98300 12345",
            customerAddress: "Park Street, Kolkata - 700016",
            date: new Date().toLocaleDateString("en-GB"),
            validTill: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB"),
            subtotal: 110000,
            tax: 19800,
            total: 129800,
            status: "Sent",
            items: [
              { id: "1", name: "Custom Enterprise Portal Engineering", description: "Full-stack cloud portal", sac: "998311", quantity: 1, unitPrice: 75000, total: 75000 },
              { id: "2", name: "UI/UX Design Systems & Brand Prototype", description: "Figma design system & mockups", sac: "998311", quantity: 1, unitPrice: 35000, total: 35000 }
            ],
            notes: "Complete scope includes staging testing, security audit, and 90 days warranty.",
            terms: "1. Quotation valid for 30 days.\n2. 50% mobilization advance on approval.\n3. GST 18% as applicable.",
            companyId: activeCompanyId || "tech"
          }
        ]
      }
      setQuotations(list)
      setClients(Array.isArray(cData) ? cData : [])
    } catch (err) { 
      console.warn("Quotation load warning:", err)
    }
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

    return quotations.filter(q => {
      // Company filter
      if (userComp && userComp !== "all") {
        const qComp = (q.companyId || "").toLowerCase().trim()
        if (qComp && qComp !== userComp) return false
        if (!qComp && userComp !== "tech") return false
      }
      // Branch filter (strict)
      if (targetBranch && targetBranch !== "all") {
        const qBranch = String((q as any).branchId || "").toLowerCase().trim()
        if (!qBranch) return false
        const match = qBranch === targetBranchId || (targetBranchName && qBranch === targetBranchName)
        if (!match) return false
      }
      // Search + status filter
      if (statusFilter !== "all" && q.status !== statusFilter) return false
      const match = q.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.customerEmail && q.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()))
      return match
    })
  }, [quotations, activeCompanyId, activeBranchId, branches, searchQuery, statusFilter, user])

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0)
  const tax = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + tax

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(i => {
      if (i.id !== id) return i
      const updated = { ...i, [field]: value }
      if (field === "quantity" || field === "unitPrice") {
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
      }
      return updated
    }))
  }

  const addItem = () => setItems([...items, { id: String(Date.now()), name: "", description: "", sac: "998311", quantity: 1, unitPrice: 0, total: 0 }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)) }

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const selected = clients.find(c => String(c.id) === clientId)
    if (selected) {
      setForm(prev => ({
        ...prev,
        customer: selected.company_name || selected.primaryContact || selected.name || "Valued Client",
        customerEmail: selected.email || "",
        customerPhone: selected.phone || "",
        customerAddress: selected.address || (selected.city ? `${selected.city}, ${selected.state || ''}` : ""),
        clientGstin: selected.gstin || "",
      }))
    }
  }

  const openAddModal = () => { 
    setEditingItem(null)
    setRecipientMode("client")
    setSelectedClientId("")
    setFormBranchId(user?.branchId || activeBranchId || "")
    setForm({ 
      number: `QT-${Date.now().toString().slice(-6)}`, 
      customer: "", 
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      clientGstin: "",
      date: new Date().toISOString().split("T")[0], 
      validTill: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: "Thank you for your business interest. Looking forward to your approval.",
      terms: "1. Quotation valid for 30 calendar days.\n2. 50% advance required before work begins.\n3. GST 18% as applicable.",
      status: "Draft" 
    })
    setItems([
      { id: "1", name: "", description: "", sac: "998311", quantity: 1, unitPrice: 0, total: 0 }
    ])
    setIsModalOpen(true)
  }

  const openEditModal = (item: QuotationData) => {
    setEditingItem(item)
    setRecipientMode("custom")
    setFormBranchId(item.branchId || "")
    setForm({
      number: item.number,
      customer: item.customer,
      customerEmail: item.customerEmail || "",
      customerPhone: item.customerPhone || "",
      customerAddress: item.customerAddress || "",
      clientGstin: item.clientGstin || "",
      date: item.date,
      validTill: item.validTill || "",
      notes: item.notes || "",
      terms: item.terms || "",
      status: item.status
    })
    setItems(item.items && item.items.length > 0 ? item.items : [{ id: "1", name: item.customer, quantity: 1, unitPrice: item.total, total: item.total }])
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer.trim()) return

    const assignedBranch = branches.find(b => b.id === formBranchId)

    const payload: QuotationData = {
      id: editingItem ? editingItem.id : `qt_${Date.now()}`,
      ...form,
      subtotal,
      tax,
      total: grandTotal,
      items,
      companyId: activeCompanyId || "tech",
      companyName: activeCompany?.brand_name || activeCompany?.name,
      branchId: formBranchId || undefined,
      branchName: assignedBranch?.name || undefined,
      preparedBy: user?.name || "Sales Manager"
    }

    await executeWithFeedback(async () => {
      if (editingItem) {
        await QuotationService.update(editingItem.id, payload).catch(() => {})
        setQuotations(prev => prev.map(q => q.id === editingItem.id ? payload : q))
      } else {
        await QuotationService.create(payload).catch(() => {})
        setQuotations(prev => [payload, ...prev.filter(q => q.id !== payload.id)])
      }
      setIsModalOpen(false)
    }, {
      actionType: editingItem ? "update" : "create",
      loadingTitle: editingItem ? "Updating Quotation..." : "Generating Quotation...",
      loadingMsg: `Saving commercial tender ${payload.number}...`,
      successTitle: editingItem ? "Quotation Updated" : "Quotation Generated!",
      successMsg: `Quotation ${payload.number} is ready.`,
    })
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const secondConfirm = window.confirm(
      `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete quotation "${deleteConfirm.number}"?\n\nThis action cannot be undone.`
    )
    if (!secondConfirm) return

    await executeWithFeedback(async () => {
      await QuotationService.delete(deleteConfirm.id).catch(() => {})
      setQuotations(prev => prev.filter(q => q.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Quotation...",
      loadingMsg: `Removing ${deleteConfirm.number}...`,
      successTitle: "Quotation Deleted",
      successMsg: `Quotation ${deleteConfirm.number} removed.`,
    })
  }

  const handleConvertToInvoice = async (quotation: QuotationData) => {
    const invId = `INV-${Math.floor(100 + Math.random() * 900)}`
    await executeWithFeedback(async () => {
      await addInvoice({
        id: invId,
        client: quotation.customer,
        clientEmail: quotation.customerEmail,
        project: `Project from ${quotation.number}`,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: quotation.validTill || new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-GB"),
        baseAmount: quotation.subtotal || Math.round(quotation.total / 1.18),
        gstRate: 18,
        gstAmount: quotation.tax || (quotation.total - (quotation.subtotal || 0)),
        totalInvoiced: `₹${quotation.total.toLocaleString("en-IN")}`,
        paymentReceived: "₹0",
        due: `₹${quotation.total.toLocaleString("en-IN")}`,
        status: "Not paid",
        billedBy: user?.name || "Admin",
        companyId: quotation.companyId || activeCompanyId || "tech",
        branchId: quotation.branchId,
        branchName: quotation.branchName,
      }, quotation.companyId || activeCompanyId || "tech")

      setViewingItem(null)
    }, {
      actionType: "process",
      loadingTitle: "Converting to Tax Invoice...",
      loadingMsg: `Generating formal Invoice ${invId} from ${quotation.number}...`,
      successTitle: "Converted Successfully!",
      successMsg: `Invoice ${invId} created. You can view it under Invoices.`,
    })
  }

  const handleConvertToClient = async (quotation: QuotationData) => {
    await executeWithFeedback(async () => {
      const existingClients = await getClients("all").catch(() => [])
      const custEmailNorm = (quotation.customerEmail || "").toLowerCase().trim()
      const custNameNorm = (quotation.customer || "").toLowerCase().trim()
      
      let matchedClient = existingClients.find(c => 
        (custEmailNorm && (c.email || "").toLowerCase().trim() === custEmailNorm) ||
        (custNameNorm && (c.name || "").toLowerCase().trim() === custNameNorm)
      )

      if (!matchedClient) {
        await saveStoredClient({
          id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: quotation.customer,
          email: quotation.customerEmail || "",
          phone: quotation.customerPhone || "",
          address: quotation.customerAddress || "",
          city: "",
          state: "",
          gstNumber: quotation.clientGstin || "",
          primaryContact: quotation.customer,
          group: "VIP",
          label: "Quotation Convert",
          labelColor: "#10b981",
          projectsCount: 0,
          totalInvoiced: "₹0",
          paymentReceived: "₹0",
          due: "₹0",
          type: "Organization",
          owner: user?.name || "Admin",
          createdAt: Date.now(),
          companyId: quotation.companyId || activeCompanyId || "tech",
          companyName: activeCompany?.brand_name || activeCompany?.name || "SAAMPARK",
          branchId: quotation.branchId,
          branchName: quotation.branchName,
        }, quotation.companyId || activeCompanyId || "tech")
      }

      // Update quotation status to "Accepted"
      const updated = { ...quotation, status: "Accepted" }
      await QuotationService.update(quotation.id, updated).catch(() => {})
      setQuotations(prev => prev.map(q => q.id === quotation.id ? updated : q))
      
      // Dispatch sync events
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_clients_updated"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      }
      loadData()
    }, {
      actionType: "process",
      loadingTitle: "Converting to Client...",
      loadingMsg: `Adding ${quotation.customer} to official CRM Clients database...`,
      successTitle: "Client Registered Successfully!",
      successMsg: `${quotation.customer} is now a registered CRM client. You can now send Estimates, Invoices, and Projects to them.`,
    })
  }

  const handleCreateEstimateFromQuote = (quotation: QuotationData) => {
    setEstimateInitialData({
      customer: quotation.customer,
      clientName: quotation.customer,
      clientEmail: quotation.customerEmail,
      clientPhone: quotation.customerPhone,
      clientAddress: quotation.customerAddress,
      clientGst: quotation.clientGstin,
      projectTitle: `Estimate for ${quotation.customer} (${quotation.number})`,
      companyId: quotation.companyId || activeCompanyId || "tech",
      branchId: quotation.branchId,
      items: (quotation.items || []).map(it => ({
        id: `est_it_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serviceName: it.name,
        sacCode: it.sac || "998313",
        qty: it.quantity || 1,
        unit: "Project",
        rate: it.unitPrice || 0,
        gstRate: 18,
        gstAmount: Math.round(((it.unitPrice || 0) * (it.quantity || 1)) * 0.18),
        totalAmount: Math.round(((it.unitPrice || 0) * (it.quantity || 1)) * 1.18),
      })),
      notes: quotation.notes || "Commercial estimate prepared for project execution.",
      terms: quotation.terms || "1. Estimate valid for 30 calendar days.\n2. Scope changes subject to re-estimation.",
    })
    setIsEstimateStudioOpen(true)
  }

  const totalPipeline = quotations.reduce((acc, q) => acc + (q.total || 0), 0)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.2 }} 
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <FileText size={22} />
            </div>
            <span>Commercial Quotations &amp; Price Tenders</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Generate formal corporate price quotes, configure line-item SAC/tax breakdowns, and print PDF quotations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Quotations",
                title: "Commercial Quotations Report",
                subtitle: statusFilter === "all" ? "All Quotations" : statusFilter,
                headers: ["#", "Quote #", "Customer Name", "Total Amount (₹)", "Date", "Valid Till", "Status"],
                rows: filtered.map((q, idx) => [
                  idx + 1,
                  q.number,
                  q.customer,
                  `₹${(q.total || 0).toLocaleString("en-IN")}`,
                  q.date,
                  q.validTill || "-",
                  q.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: "Commercial Quotations Report",
                subtitle: statusFilter === "all" ? "All Quotations" : statusFilter,
                headers: ["#", "Quote #", "Customer", "Total Amount", "Date", "Valid Till", "Status"],
                rows: filtered.map((q, idx) => [
                  idx + 1,
                  q.number,
                  q.customer,
                  `₹${(q.total || 0).toLocaleString("en-IN")}`,
                  q.date,
                  q.validTill || "-",
                  q.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAdd && (
            <button 
              onClick={() => { setEditingItem(null); setIsStudioOpen(true) }} 
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Quotations</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{quotations.length}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Pipeline Value</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalPipeline.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <Calculator size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Sent &amp; Pending</p>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{quotations.filter(q => q.status === "Sent").length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Accepted</p>
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{quotations.filter(q => q.status === "Accepted").length}</h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by quote #, client, email..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500" 
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "Draft", "Sent", "Accepted", "Declined"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                statusFilter === st 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Client / Organization</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Valid Till</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">No quotations found. Click "+ Create Quotation" to create one.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <button 
                        type="button" 
                        onClick={() => setViewingItem(q)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {q.number}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{q.customer}</div>
                      {q.customerEmail && <div className="text-[10px] text-zinc-400 font-mono">{q.customerEmail}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">{q.date}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-rose-600 font-semibold">{q.validTill || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">
                        {q.items?.length || 1} items
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      ₹{(q.total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        q.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        q.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        q.status === "Declined" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-zinc-100 text-zinc-700 border-zinc-200"
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setViewingItem(q)}
                          className="p-1 hover:text-emerald-600 transition-colors cursor-pointer" 
                          title="View PDF Document"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleConvertToClient(q)}
                          className="p-1 hover:text-emerald-600 transition-colors cursor-pointer" 
                          title="Convert / Move to CRM Client"
                        >
                          <UserCheck size={14} className="text-emerald-600" />
                        </button>
                        <button 
                          onClick={() => handleCreateEstimateFromQuote(q)}
                          className="p-1 hover:text-blue-600 transition-colors cursor-pointer" 
                          title="Generate Estimate from Quotation"
                        >
                          <Sparkles size={14} className="text-blue-600" />
                        </button>
                        <button 
                          onClick={() => {
                            setSendingItem(q)
                            setSendEmail(q.customerEmail || "")
                            setSendMessage(`Dear ${q.customer},\n\nPlease find attached our commercial quotation ${q.number} totaling ₹${(q.total || 0).toLocaleString("en-IN")}.\n\nBest regards,\n${user?.name || "SAAMPARK Group"}`)
                          }}
                          className="p-1 hover:text-blue-600 transition-colors cursor-pointer" 
                          title="Email Quotation"
                        >
                          <Send size={14} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => openEditModal(q)} 
                            className="p-1 hover:text-amber-600 transition-colors cursor-pointer" 
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => setDeleteConfirm(q)} 
                            className="p-1 hover:text-rose-600 transition-colors cursor-pointer" 
                            title="Delete"
                          >
                            <Trash2 size={14} />
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

      {/* ── OFFICIAL PDF DOCUMENT VIEWER MODAL ───────────────────────── */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
            <OfficialQuotationDocument 
              quotation={viewingItem}
              onClose={() => setViewingItem(null)}
              onConvertToClient={() => handleConvertToClient(viewingItem)}
              onSendEstimate={() => handleCreateEstimateFromQuote(viewingItem)}
              onSendEmail={() => {
                const target = viewingItem
                setViewingItem(null)
                setSendingItem(target)
                setSendEmail(target.customerEmail || "")
                setSendMessage(`Dear ${target.customer},\n\nPlease find attached our commercial quotation ${target.number} totaling ₹${(target.total || 0).toLocaleString("en-IN")}.\n\nBest regards,\n${user?.name || "SAAMPARK Group"}`)
              }}
              onConvertToInvoice={() => handleConvertToInvoice(viewingItem)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (QUOTATION) ────────── */}
      <DocumentStudioModal
        isOpen={isModalOpen}
        mode="quotation"
        initialData={editingItem}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        onSaveSuccess={() => {
          setIsModalOpen(false)
          setEditingItem(null)
          loadData()
        }}
      />

      {/* ── INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (ESTIMATE FROM QUOTE) ── */}
      <DocumentStudioModal
        isOpen={isEstimateStudioOpen}
        mode="estimate"
        initialData={estimateInitialData}
        onClose={() => {
          setIsEstimateStudioOpen(false)
          setEstimateInitialData(null)
        }}
        onSaveSuccess={() => {
          setIsEstimateStudioOpen(false)
          setEstimateInitialData(null)
        }}
      />

      {/* INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (QUOTATION) */}
      <DocumentStudioModal
        isOpen={isStudioOpen}
        mode="quotation"
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

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Delete Quotation</h3>
              <p className="text-zinc-500">Are you sure you want to delete quotation <strong>{deleteConfirm.number}</strong>? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-zinc-500 font-semibold">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
