"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, Plus, Search, Filter, Trash2, Eye, CheckCircle2, 
  XCircle, Clock, Send, Printer, Download, ArrowRight,
  Calculator, Building2, User, UserCheck, Calendar, Check, X, AlertCircle, RefreshCw
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { getEstimates, addEstimate, updateEstimateStatus, deleteEstimate, EstimateItem, EstimateServiceItem, EstimateStatus } from "./services/estimateService"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { addProject } from "@/app/feature/projects/services/projectService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
import { addOrder } from "@/app/feature/sales/orders/services/orderService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { executeWithFeedback, useActionFeedbackStore } from "@/store/useActionFeedbackStore"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"
import { OfficialEstimateDocument } from "./components/OfficialEstimateDocument"
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal"

export default function EstimatesPage() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const canAddEstimate = canPerformAction(user, "Estimates", "add")
  const canEditEstimate = canPerformAction(user, "Estimates", "edit")
  const canDeleteEstimate = canPerformAction(user, "Estimates", "delete")
  
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [estimates, setEstimates] = React.useState<EstimateItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")
  const [selectedEstimate, setSelectedEstimate] = React.useState<EstimateItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [revisionModalEstimate, setRevisionModalEstimate] = React.useState<EstimateItem | null>(null)
  const [revisionNote, setRevisionNote] = React.useState("")

  // Create Form State
  const [title, setTitle] = React.useState("")
  const [client, setClient] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [validUntil, setValidUntil] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [services, setServices] = React.useState<EstimateServiceItem[]>([
    { id: "s1", name: "UI/UX Design & Wireframing", description: "Design systems, high fidelity mockups", quantity: 1, unitPrice: 25000, total: 25000 },
    { id: "s2", name: "Frontend Development", description: "Responsive Next.js React components", quantity: 1, unitPrice: 45000, total: 45000 },
  ])
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const targetComp = activeCompanyId || user?.companyId || "tech"

  const loadData = React.useCallback(async () => {
    const data = await getEstimates(targetComp)
    setEstimates(data)
  }, [targetComp])

  React.useEffect(() => {
    loadData()
    window.addEventListener("storage", loadData)
    window.addEventListener("saampark_data_synced", loadData)
    window.addEventListener("saampark_company_switched", loadData)
    return () => {
      window.removeEventListener("storage", loadData)
      window.removeEventListener("saampark_data_synced", loadData)
      window.removeEventListener("saampark_company_switched", loadData)
    }
  }, [loadData])

  React.useEffect(() => {
    if (isCreateModalOpen) {
      getClients().then((cList) => {
        setAvailableClients(cList.map(c => ({ name: c.name, email: c.email || "" })))
        if (cList.length > 0) {
          setClient(cList[0].name)
          setClientEmail(cList[0].email || "")
        }
      }).catch(() => {})
    }
  }, [isCreateModalOpen])

  // Client vs Admin filtering
  const displayedEstimates = React.useMemo(() => {
    let filtered = estimates
    if (isClientRole) {
      filtered = filtered.filter((e) => isRecordAssignedToClient(e, user))
    }
    const targetBranch = user?.branchId || activeBranchId
    if (targetBranch) {
      const bObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
      const bId = String(bObj?.id || targetBranch).toLowerCase().trim()
      const bName = bObj?.name?.toLowerCase().trim() || ""
      filtered = filtered.filter((e) => {
        const eb = String(e.branchId || (e as any).branch_id || "").toLowerCase().trim()
        const ebn = String(e.branchName || (e as any).branch_name || "").toLowerCase().trim()
        return !eb || eb === bId || (bName && (eb === bName || ebn === bName))
      })
    }
    return filtered
  }, [estimates, isClientRole, user, activeBranchId, branches])

  const filteredEstimates = React.useMemo(() => {
    return displayedEstimates.filter((e) => {
      const matchSearch =
        e.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.formattedTotal.toLowerCase().includes(searchQuery.toLowerCase())

      if (selectedStatus === "all") return matchSearch
      return matchSearch && e.status === selectedStatus
    })
  }, [displayedEstimates, searchQuery, selectedStatus])

  // Service item handlers
  const handleAddServiceRow = () => {
    const newId = `s_${Date.now()}`
    setServices([...services, { id: newId, name: "", description: "", quantity: 1, unitPrice: 10000, total: 10000 }])
  }

  const handleUpdateServiceRow = (id: string, field: keyof EstimateServiceItem, value: any) => {
    setServices(services.map(s => {
      if (s.id !== id) return s
      const updated = { ...s, [field]: value }
      if (field === "quantity" || field === "unitPrice") {
        const q = Number(updated.quantity) || 1
        const p = Number(updated.unitPrice) || 0
        updated.total = q * p
      }
      return updated
    }))
  }

  const handleRemoveServiceRow = (id: string) => {
    if (services.length <= 1) {
      alert("At least one service line item is required.")
      return
    }
    setServices(services.filter(s => s.id !== id))
  }

  // Calculate totals
  const subtotal = services.reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  const gstAmount = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + gstAmount
  const formattedGrandTotal = `₹${grandTotal.toLocaleString("en-IN")}`

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !client.trim()) {
      alert("Please provide Estimate Title and Client.")
      return
    }

    const assignedBranchId = user?.branchId || activeBranchId || undefined
    const assignedBranchName = branches.find(b => b.id === assignedBranchId)?.name || undefined

    await executeWithFeedback(async () => {
      const created = await addEstimate({
        client,
        clientEmail: clientEmail || `${client.toLowerCase().replace(/\s+/g, "")}@example.com`,
        title,
        date: new Date().toLocaleDateString("en-GB"),
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB"),
        services,
        subtotal,
        gstRate: 18,
        gstAmount,
        totalAmount: grandTotal,
        formattedTotal: formattedGrandTotal,
        status: "Sent",
        notes: notes || "Terms: 50% advance on approval, balance on final delivery.",
        createdAdmin: user?.name || "Admin",
        companyId: targetComp,
        branchId: assignedBranchId,
        branchName: assignedBranchName,
      })

      setIsCreateModalOpen(false)
      setTitle("")
      setNotes("")
      loadData()
    }, {
      actionType: "create",
      loadingTitle: "Generating Quotation...",
      loadingMsg: `Calculating items and dispatching quotation to ${client}...`,
      successTitle: "Estimate Dispatched!",
      successMsg: `Quotation sent successfully to ${client}.`,
      errorTitle: "Estimate Creation Failed",
    })
  }

  // Client actions
  const handleClientAccept = async (est: EstimateItem) => {
    await executeWithFeedback(async () => {
      await updateEstimateStatus(est.id, "Accepted", { acceptedAt: new Date().toLocaleDateString("en-GB") })
      setIsDetailModalOpen(false)
      loadData()
    }, {
      actionType: "process",
      loadingTitle: "Accepting Estimate...",
      loadingMsg: `Approving quotation ${est.estimateNumber}...`,
      successTitle: "Quotation Accepted!",
      successMsg: `You have successfully accepted estimate ${est.estimateNumber}.`,
      errorTitle: "Approval Failed",
    })
  }

  const handleClientDecline = async (est: EstimateItem) => {
    await executeWithFeedback(async () => {
      await updateEstimateStatus(est.id, "Declined")
      setIsDetailModalOpen(false)
      loadData()
    }, {
      actionType: "update",
      loadingTitle: "Updating Status...",
      loadingMsg: "Marking quotation as declined...",
      successTitle: "Quotation Declined",
      successMsg: `Estimate ${est.estimateNumber} was declined.`,
      errorTitle: "Update Failed",
    })
  }

  const handleClientRequestRevision = async () => {
    if (!revisionModalEstimate) return
    await updateEstimateStatus(revisionModalEstimate.id, "Draft", { revisionNote })
    showToast(`📝 Revision requested for Estimate ${revisionModalEstimate.estimateNumber}.`)
    setRevisionModalEstimate(null)
    setRevisionNote("")
    setIsDetailModalOpen(false)
    loadData()
  }

  // Convert Prospect to CRM Client
  const handleConvertToClient = async (est: EstimateItem) => {
    await executeWithFeedback(async () => {
      const existingClients = await getClients("all").catch(() => [])
      const custEmailNorm = (est.clientEmail || "").toLowerCase().trim()
      const custNameNorm = (est.client || "").toLowerCase().trim()
      
      let matchedClient = existingClients.find(c => 
        (custEmailNorm && (c.email || "").toLowerCase().trim() === custEmailNorm) ||
        (custNameNorm && (c.name || "").toLowerCase().trim() === custNameNorm)
      )

      if (!matchedClient) {
        await saveStoredClient({
          id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: est.client,
          email: est.clientEmail || "",
          phone: (est as any).clientPhone || (est as any).phone || "",
          address: (est as any).clientAddress || (est as any).address || "",
          city: "",
          state: "",
          gstNumber: (est as any).clientGstin || (est as any).gstin || "",
          primaryContact: est.client,
          group: "VIP",
          label: "Estimate Convert",
          labelColor: "#10b981",
          projectsCount: 0,
          totalInvoiced: "₹0",
          paymentReceived: "₹0",
          due: "₹0",
          type: "Organization",
          owner: user?.name || "Admin",
          createdAt: Date.now(),
          companyId: est.companyId || activeCompanyId || "tech",
          companyName: (est as any).companyName || "SAAMPARK",
          branchId: est.branchId,
          branchName: est.branchName,
        }, est.companyId || activeCompanyId || "tech")
      }

      // Update estimate status to "Accepted"
      await updateEstimateStatus(est.id, "Accepted")
      
      // Dispatch sync events
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_clients_updated"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
      }
      loadData()
    }, {
      actionType: "process",
      loadingTitle: "Converting to Client...",
      loadingMsg: `Adding ${est.client} to official CRM Clients database...`,
      successTitle: "Client Registered Successfully!",
      successMsg: `${est.client} is now a registered CRM client. You can now send Invoices, Estimates, and Projects.`,
    })
  }

  // Convert to Project & Invoice
  const handleConvertToProject = async (est: EstimateItem) => {
    const pTitle = est.title || `Project from ${est.estimateNumber}`
    const invoiceId = `INV #${Math.floor(100 + Math.random() * 900)}`

    await executeWithFeedback(async () => {
      const targetComp = est.companyId || activeCompanyId || "tech"

      const p = await addProject({
        title: pTitle,
        client: est.client,
        price: est.formattedTotal,
        projectType: "Client Project",
        progress: 0,
        startDate: new Date().toLocaleDateString("en-GB"),
        deadline: est.validUntil,
        status: "In Progress",
        members: [{ id: "1", name: "Admin", role: "Manager", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Admin" }],
        labels: ["From Estimate", est.estimateNumber],
        description: `Generated from Accepted Estimate ${est.estimateNumber}. Services: ${est.services.map(s => s.name).join(", ")}`,
        baseAmount: est.subtotal,
        gstRate: est.gstRate,
        gstAmount: est.gstAmount,
        totalAmount: est.totalAmount,
        companyId: targetComp,
        branchId: est.branchId,
        branchName: est.branchName,
      }, targetComp)

      await addInvoice({
        id: invoiceId,
        client: est.client,
        clientEmail: est.clientEmail,
        project: pTitle,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: est.validUntil,
        baseAmount: est.subtotal,
        gstRate: est.gstRate,
        gstAmount: est.gstAmount,
        totalInvoiced: est.formattedTotal,
        paymentReceived: "₹0",
        due: est.formattedTotal,
        status: "Not paid",
        billedBy: user?.name || "Admin",
        companyId: targetComp,
        branchId: est.branchId,
        branchName: est.branchName,
      }, targetComp)

      await addOrder({
        client: est.client,
        clientEmail: est.clientEmail,
        project: pTitle,
        orderDate: new Date().toLocaleDateString("en-GB"),
        deliveryDate: est.validUntil,
        itemsCount: est.services.length,
        totalAmount: est.formattedTotal,
        paymentStatus: "Unpaid",
        status: "Processing",
        notes: `Converted from Estimate ${est.estimateNumber}`,
        invoiceId,
        companyId: targetComp,
        branchId: est.branchId,
        branchName: est.branchName,
      }, targetComp)

      loadData()
    }, {
      actionType: "process",
      loadingTitle: "Converting Quotation...",
      loadingMsg: `Initializing active Project, Sales Order, and Tax Invoice ${invoiceId}...`,
      successTitle: "Converted Successfully!",
      successMsg: `Estimate ${est.estimateNumber} converted into Project, Invoice ${invoiceId}, and Sales Order.`,
      errorTitle: "Conversion Failed",
    })
  }

  const handleDelete = async (id: string) => {
    if (!canDeleteEstimate) {
      useActionFeedbackStore.getState().showError({
        title: "Permission Denied",
        message: "You do not have permission to delete estimates.",
        actionType: "delete",
      })
      return
    }

    const est = estimates.find(e => e.id === id)
    const estNum = est?.estimateNumber || "Estimate"

    await executeWithFeedback(async () => {
      await deleteEstimate(id)
      setEstimates(prev => prev.filter(e => e.id !== id))
    }, {
      actionType: "delete",
      loadingTitle: "Deleting Estimate...",
      loadingMsg: `Removing ${estNum}...`,
      successTitle: "Estimate Deleted",
      successMsg: `${estNum} was deleted successfully.`,
      errorTitle: "Delete Failed",
    })
  }

  // Summary Metrics
  const totalVal = displayedEstimates.reduce((sum, e) => sum + e.totalAmount, 0)
  const acceptedCount = displayedEstimates.filter(e => e.status === "Accepted").length
  const pendingCount = displayedEstimates.filter(e => e.status === "Sent" || e.status === "Draft").length

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[99999] bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-zinc-700"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- TOP HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
            <span>{isClientRole ? "My Project Estimates" : "Estimates & Quotations"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClientRole
              ? "Review custom service quotations, inspect pricing line items, and approve project estimates."
              : "Generate itemized service quotes, calculate margins & taxes, and deliver estimates directly to clients"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Estimates",
                title: "Estimates & Quotations Report",
                subtitle: selectedStatus === "all" ? "All Estimates" : selectedStatus,
                headers: ["#", "Estimate #", "Client Name", "Total Amount (₹)", "Date", "Valid Until", "Status"],
                rows: filteredEstimates.map((est, idx) => [
                  idx + 1,
                  est.estimateNumber,
                  est.client,
                  `₹${est.totalAmount.toLocaleString("en-IN")}`,
                  est.date,
                  est.validUntil,
                  est.status,
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
                title: "Estimates & Quotations Report",
                subtitle: selectedStatus === "all" ? "All Estimates" : selectedStatus,
                headers: ["#", "Estimate #", "Client Name", "Total Amount", "Date", "Valid Until", "Status"],
                rows: filteredEstimates.map((est, idx) => [
                  idx + 1,
                  est.estimateNumber,
                  est.client,
                  `₹${est.totalAmount.toLocaleString("en-IN")}`,
                  est.date,
                  est.validUntil,
                  est.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAddEstimate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Create Estimate</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">{isClientRole ? "My Total Estimates" : "Total Estimates"}</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayedEstimates.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <Calculator size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Accepted</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{acceptedCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Pending Review</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Pipeline Value</p>
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">₹{totalVal.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- FILTER & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search estimate, client, total..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "Sent", "Accepted", "Draft", "Declined"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedStatus === st 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- ESTIMATES TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Estimate ID</th>
                <th className="py-3 px-4">Title / Scope</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-400">
                    No estimates found. Click "+ Create Estimate" to generate a quote.
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((est) => {
                  let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                  if (est.status === "Accepted") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  if (est.status === "Sent") statusBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                  if (est.status === "Declined") statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"

                  return (
                    <tr key={est.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEstimate(est)
                            setIsDetailModalOpen(true)
                          }}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {est.estimateNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                        {est.title}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{est.client}</div>
                        <div className="text-[10px] text-zinc-400">{est.clientEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium">
                          {est.services?.length || 0} services
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                        {est.date}
                      </td>
                      <td className="py-3 px-4 text-red-600 dark:text-red-400 font-bold font-mono text-[11px]">
                        {est.validUntil}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {est.formattedTotal}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                          {est.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Client Actions */}
                          {isClientRole && est.status === "Sent" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleClientAccept(est)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                title="Accept Quote"
                              >
                                <Check size={12} />
                                <span>Accept</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRevisionModalEstimate(est)
                                  setRevisionNote("")
                                }}
                                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1"
                                title="Request Revision"
                              >
                                <span>Revise</span>
                              </button>
                            </>
                          )}

                          {/* Admin: Convert / Move to CRM Client */}
                          {!isClientRole && (
                            <button
                              type="button"
                              onClick={() => handleConvertToClient(est)}
                              className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Convert / Move to CRM Client"
                            >
                              <UserCheck size={14} className="text-emerald-600" />
                            </button>
                          )}

                          {/* Admin: Convert to Project/Invoice when Accepted */}
                          {!isClientRole && est.status === "Accepted" && (
                            <button
                              type="button"
                              onClick={() => handleConvertToProject(est)}
                              className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold flex items-center gap-1"
                              title="Convert to active Project and Tax Invoice"
                            >
                              <ArrowRight size={12} />
                              <span>Convert</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEstimate(est)
                              setIsDetailModalOpen(true)
                            }}
                            className="p-1 hover:text-blue-600 transition-colors"
                            title="View Quote Details"
                          >
                            <Eye size={14} />
                          </button>

                          {canDeleteEstimate && (
                            <button
                              type="button"
                              onClick={() => handleDelete(est.id)}
                              className="p-1 hover:text-rose-600 transition-colors"
                              title="Delete Estimate"
                            >
                              <Trash2 size={14} />
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

      {/* ---------------- ESTIMATE DETAIL & QUOTE MODAL (OFFICIAL PDF DOCUMENT) ---------------- */}
      <AnimatePresence>
        {isDetailModalOpen && selectedEstimate && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
            <OfficialEstimateDocument
              estimate={selectedEstimate}
              onClose={() => setIsDetailModalOpen(false)}
              onAccept={() => handleClientAccept(selectedEstimate)}
              onDecline={() => handleClientDecline(selectedEstimate)}
              onConvertToClient={() => handleConvertToClient(selectedEstimate)}
              onConvert={() => {
                setIsDetailModalOpen(false)
                handleConvertToProject(selectedEstimate)
              }}
              isClientRole={isClientRole}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (ESTIMATE) ────────── */}
      <DocumentStudioModal
        isOpen={isCreateModalOpen}
        mode="estimate"
        onClose={() => setIsCreateModalOpen(false)}
        onSaveSuccess={() => {
          setIsCreateModalOpen(false)
          loadData()
        }}
      />

      {/* ---------------- REVISION MODAL ---------------- */}
      <AnimatePresence>
        {revisionModalEstimate && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Request Revision for {revisionModalEstimate.estimateNumber}</h3>
              <textarea
                rows={3}
                required
                placeholder="Specify your requested scope changes or budget adjustment..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalEstimate(null)}
                  className="px-3 py-1.5 text-xs text-zinc-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClientRequestRevision}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Submit Revision
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
