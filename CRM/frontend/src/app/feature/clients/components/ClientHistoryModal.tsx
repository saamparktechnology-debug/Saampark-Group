"use client"

import * as React from "react"
import { 
  X, Briefcase, FileText, CheckCircle2, Clock, Calendar, AlertCircle, 
  Eye, FolderPlus, Building2, Mail, Phone, MapPin, CreditCard, ShoppingBag,
  User, Receipt, Shield, Tag, DollarSign, Trash2
} from "lucide-react"
import { ClientItem } from "../types"
import { getProjects, deleteProject } from "@/app/feature/projects/services/projectService"
import { Project } from "@/app/feature/projects/types"
import { getInvoices, deleteInvoice, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { getPayments, deletePayment, PaymentItem } from "@/app/feature/sales/payments/services/paymentService"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

interface ClientHistoryModalProps {
  isOpen: boolean
  client: ClientItem | null
  onClose: () => void
  onSelectInvoice?: (invoice: InvoiceItem) => void
  onAddProjectForClient?: (client: ClientItem) => void
}

export function ClientHistoryModal({
  isOpen,
  client,
  onClose,
  onSelectInvoice,
  onAddProjectForClient,
}: ClientHistoryModalProps) {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const isSuperAdmin = user?.role === "Super Admin"
  const canDeleteProjects = isSuperAdmin || (user?.role === "Admin" && canPerformAction(user, "Projects", "delete"))
  const canDeleteInvoices = isSuperAdmin || (user?.role === "Admin" && (canPerformAction(user, "Sales", "delete") || canPerformAction(user, "Invoices", "delete")))
  const canDeleteOrders = isSuperAdmin || (user?.role === "Admin" && (canPerformAction(user, "Sales", "delete") || canPerformAction(user, "Orders", "delete")))
  const canDeletePayments = isSuperAdmin || (user?.role === "Admin" && (canPerformAction(user, "Sales", "delete") || canPerformAction(user, "Payments", "delete")))

  const [activeTab, setActiveTab] = React.useState<"projects" | "invoices" | "orders" | "payments">("projects")
  const [clientProjects, setClientProjects] = React.useState<Project[]>([])
  const [clientInvoices, setClientInvoices] = React.useState<InvoiceItem[]>([])
  const [clientOrders, setClientOrders] = React.useState<any[]>([])
  const [clientPayments, setClientPayments] = React.useState<PaymentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const loadHistory = React.useCallback(async () => {
    if (!client) return
    setIsLoading(true)
    const cId = (client.id || "").toLowerCase().trim()
    const cName = (client.name || "").toLowerCase().trim()
    const cEmail = (client.email || "").toLowerCase().trim()
    const cPrimary = (client.primaryContact || "").toLowerCase().trim()

    // Helper: strict matching - clientId exact > email exact > name exact (NO substring fuzzy matching)
    const matchesClient = (recordClientId: string, recordClient: string, recordEmail: string) => {
      if (cId && recordClientId && recordClientId === cId) return true
      if (cEmail && recordEmail && recordEmail === cEmail) return true
      if (cName && recordClient && recordClient === cName) return true
      if (cPrimary && recordClient && recordClient === cPrimary) return true
      return false
    }

    try {
      const [allProjects, allInvoices, allOrdersRaw, allPayments] = await Promise.all([
        getProjects("all").catch(() => []),
        getInvoices("all").catch(() => []),
        fetchModuleDataFromDB<any[]>("orders", [], "all").catch(() => []),
        getPayments("all").catch(() => []),
      ])
      const allOrders = Array.isArray(allOrdersRaw) ? filterGlobalDeletedItems(allOrdersRaw) : []

      // Pass 1: Direct matches
      let filteredProj = allProjects.filter((p) => {
        const pClient = (p.client || "").toLowerCase().trim()
        const pClientId = String(p.clientId || "").toLowerCase().trim()
        const pEmail = ((p as any).clientEmail || (p as any).createdByEmail || "").toLowerCase().trim()
        return matchesClient(pClientId, pClient, pEmail)
      })

      let filteredInv = allInvoices.filter((i) => {
        const iClient = (i.client || "").toLowerCase().trim()
        const iEmail = (i.clientEmail || "").toLowerCase().trim()
        const iClientId = String((i as any).clientId || "").toLowerCase().trim()
        return matchesClient(iClientId, iClient, iEmail)
      })

      // Pass 2: Bidirectional cross-linking by project title
      const initialProjTitles = new Set(filteredProj.map(p => (p.title || "").toLowerCase().trim()).filter(Boolean))

      // Expand invoices using direct matched project titles
      filteredInv = allInvoices.filter((i) => {
        const iClient = (i.client || "").toLowerCase().trim()
        const iEmail = (i.clientEmail || "").toLowerCase().trim()
        const iClientId = String((i as any).clientId || "").toLowerCase().trim()
        const iProject = (i.project || "").toLowerCase().trim()
        return (
          matchesClient(iClientId, iClient, iEmail) ||
          (iProject && initialProjTitles.has(iProject))
        )
      })

      const expandedInvTitles = new Set(filteredInv.map(i => (i.project || "").toLowerCase().trim()).filter(Boolean))

      // Expand projects using matched invoice project titles
      filteredProj = allProjects.filter((p) => {
        const pClient = (p.client || "").toLowerCase().trim()
        const pClientId = String(p.clientId || "").toLowerCase().trim()
        const pEmail = ((p as any).clientEmail || (p as any).createdByEmail || "").toLowerCase().trim()
        const pTitle = (p.title || "").toLowerCase().trim()
        return (
          matchesClient(pClientId, pClient, pEmail) ||
          (pTitle && expandedInvTitles.has(pTitle))
        )
      })

      const allMatchedProjectTitles = new Set([
        ...filteredProj.map(p => (p.title || "").toLowerCase().trim()).filter(Boolean),
        ...expandedInvTitles
      ])

      const filteredOrd = allOrders.filter((o) => {
        const oClient = (o.client || "").toLowerCase().trim()
        const oEmail = (o.clientEmail || "").toLowerCase().trim()
        const oClientId = String(o.clientId || "").toLowerCase().trim()
        const oProject = (o.project || "").toLowerCase().trim()
        const oInvId = (o.invoiceId || "").toLowerCase().trim()
        return (
          matchesClient(oClientId, oClient, oEmail) ||
          (oProject && allMatchedProjectTitles.has(oProject)) ||
          (oInvId && filteredInv.some(i => i.id.toLowerCase().trim() === oInvId))
        )
      })

      const filteredPay = allPayments.filter((pay) => {
        const payClient = (pay.client || "").toLowerCase().trim()
        const payEmail = (pay.clientEmail || "").toLowerCase().trim()
        const payProj = (pay.project || "").toLowerCase().trim()
        const payInvId = (pay.invoiceId || "").toLowerCase().trim()
        return (
          matchesClient("", payClient, payEmail) ||
          (payProj && allMatchedProjectTitles.has(payProj)) ||
          (payInvId && filteredInv.some(i => i.id.toLowerCase().trim() === payInvId))
        )
      })


      setClientProjects(filteredProj)
      setClientInvoices(filteredInv)
      setClientOrders(filteredOrd)
      setClientPayments(filteredPay)

    } finally {
      setIsLoading(false)
    }
  }, [client])

  React.useEffect(() => {
    if (isOpen && client) {
      loadHistory()
      window.addEventListener("saampark_data_synced", loadHistory)
      window.addEventListener("saampark_projects_updated", loadHistory)
      window.addEventListener("saampark_payments_updated", loadHistory)
      return () => {
        window.removeEventListener("saampark_data_synced", loadHistory)
        window.removeEventListener("saampark_projects_updated", loadHistory)
        window.removeEventListener("saampark_payments_updated", loadHistory)
      }
    }
  }, [isOpen, client, loadHistory])


  if (!isOpen || !client) return null

  // Delete handlers with permissions
  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (confirm(`Are you sure you want to delete project "${projectTitle}"? This will automatically remove associated invoices, orders, and payments.`)) {
      await deleteProject(projectId)
      loadHistory()
    }
  }

  const handleDeleteInvoice = async (invId: string) => {
    if (confirm(`Are you sure you want to delete invoice ${invId}?`)) {
      await deleteInvoice(invId)
      loadHistory()
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm(`Are you sure you want to delete this order?`)) {
      await markGlobalItemDeleted(String(orderId), "orders")
      const currentOrders = await fetchModuleDataFromDB<any[]>("orders", [])
      const updated = currentOrders.filter(o => String(o.id) !== String(orderId) && String(o.orderNumber) !== String(orderId))
      await saveModuleDataToDB("orders", updated)
      loadHistory()
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm(`Are you sure you want to delete this payment record?`)) {
      await deletePayment(paymentId)
      loadHistory()
    }
  }

  // Calculate live financial numbers purely from active client records
  const calculatedInvoiced = clientInvoices.reduce((acc, inv) => {
    return acc + (parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0)
  }, 0)

  const calculatedPaid = clientPayments.length > 0
    ? clientPayments.reduce((acc, pay) => {
        if (pay.status === "Failed" || pay.status === "Pending") return acc
        return acc + (pay.amountNum || parseInt((pay.amount || "0").replace(/[^0-9]/g, "")) || 0)
      }, 0)
    : clientInvoices.reduce((acc, inv) => {
        return acc + (parseInt((inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0)
      }, 0)

  const calculatedDue = Math.max(0, calculatedInvoiced - calculatedPaid)

  const displayInvoiced = `₹${calculatedInvoiced.toLocaleString("en-IN")}`
  const displayPaid = `₹${calculatedPaid.toLocaleString("en-IN")}`
  const displayDue = `₹${calculatedDue.toLocaleString("en-IN")}`

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{client.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {client.group || "VIP Client"}
                </span>
                {client.label && (
                  <span 
                    style={{ backgroundColor: client.labelColor || "#3b82f6" }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                  >
                    {client.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Primary Contact: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{client.primaryContact || client.name}</span>
                {client.companyName && <span> • {client.companyName}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddProjectForClient && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onAddProjectForClient(client)
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>+ Add Project & Invoice</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Client Profile Details Card */}
        <div className="px-6 py-3.5 bg-zinc-50/50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Mail size={14} className="text-blue-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-zinc-400 block">Email</span>
                <span className="font-semibold">{client.email || "No Email Provided"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Phone size={14} className="text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block">Phone</span>
                <span className="font-semibold">{client.phone || "No Phone Provided"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <MapPin size={14} className="text-rose-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-zinc-400 block">Address & City</span>
                <span className="font-semibold">
                  {[client.address, client.city, client.state].filter(Boolean).join(", ") || "No Address Provided"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Receipt size={14} className="text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block">GSTIN / Tax ID</span>
                <span className="font-semibold">{client.gstNumber || client.vatNumber || "Unregistered"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-200 dark:divide-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs py-3 px-6">
          <div className="text-center">
            <span className="text-zinc-400 block text-[10px] font-semibold uppercase tracking-wider">Total Projects</span>
            <strong className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{clientProjects.length}</strong>
          </div>
          <div className="text-center">
            <span className="text-zinc-400 block text-[10px] font-semibold uppercase tracking-wider">Total Invoiced</span>
            <strong className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{displayInvoiced}</strong>
          </div>
          <div className="text-center">
            <span className="text-zinc-400 block text-[10px] font-semibold uppercase tracking-wider">Payment Received</span>
            <strong className="text-sm font-extrabold text-emerald-600">{displayPaid}</strong>
          </div>
          <div className="text-center">
            <span className="text-zinc-400 block text-[10px] font-semibold uppercase tracking-wider">Balance Due</span>
            <strong className={`text-sm font-extrabold ${displayDue !== "₹0" ? "text-rose-600" : "text-zinc-500"}`}>{displayDue}</strong>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Briefcase size={14} />
            <span>Projects ({clientProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText size={14} />
            <span>Invoices & Billing ({clientInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "orders"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders ({clientOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <CreditCard size={14} />
            <span>Payment Receipts ({clientPayments.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          
          {isLoading ? (
            <div className="py-16 text-center text-zinc-400 font-medium">Loading full client history...</div>
          ) : activeTab === "projects" ? (
            clientProjects.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 space-y-3">
                <p className="font-medium">No projects found for {client.name}.</p>
                {onAddProjectForClient && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onAddProjectForClient(client)
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    + Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Project Title</th>
                      <th className="py-3 px-4">Price / Deal</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Target Release</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      {canDeleteProjects && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                          {p.title}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{p.price || (p.totalAmount ? `₹${p.totalAmount.toLocaleString("en-IN")}` : "₹0")}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{p.startDate}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{p.deadline}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{p.progress}%</span>
                            <div className="w-20 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.status === "Completed" || p.status === "Finished" ? "bg-emerald-500" : "bg-blue-600"}`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {p.paymentStatus || "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            p.status === "Completed" || p.status === "Finished"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        {canDeleteProjects && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(p.id, p.title)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Project & Cascaded Invoices/Orders"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "invoices" ? (
            clientInvoices.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">No invoices generated for {client.name} yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Bill Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">{inv.id}</td>
                        <td className="py-3.5 px-4 truncate max-w-[160px]">{inv.project}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{inv.billDate}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{inv.dueDate}</td>
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">{inv.totalInvoiced}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">{inv.paymentReceived}</td>
                        <td className="py-3.5 px-4 font-semibold text-rose-600">{inv.due}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inv.status === "Fully paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectInvoice) onSelectInvoice(inv)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 text-[11px] border border-blue-200/60 cursor-pointer hover:bg-blue-100"
                              title="View Tax Invoice"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                            {canDeleteInvoices && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "orders" ? (
            clientOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">No orders registered for {client.name} yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Project / Service</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4">Delivery Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      {canDeleteOrders && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">{ord.orderNumber || ord.id}</td>
                        <td className="py-3.5 px-4 truncate max-w-[180px]">{ord.project}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{ord.orderDate}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{ord.deliveryDate}</td>
                        <td className="py-3.5 px-4 font-bold">{ord.totalAmount}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {ord.status}
                          </span>
                        </td>
                        {canDeleteOrders && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(ord.id || ord.orderNumber)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            clientPayments.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">No payment records found for {client.name}.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Receipt ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Transaction Ref</th>
                      <th className="py-3 px-4">Note / Description</th>
                      <th className="py-3 px-4">Status</th>
                      {canDeletePayments && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">{pay.id}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">{pay.paymentDate}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{pay.amount}</td>
                        <td className="py-3.5 px-4">{pay.paymentMethod}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">{pay.transactionRef || "-"}</td>
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">{pay.note}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {pay.status}
                          </span>
                        </td>
                        {canDeletePayments && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(pay.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Payment Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  )
}
