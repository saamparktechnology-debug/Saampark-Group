"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Download, 
  FileText, 
  Eye, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Trash2, 
  Printer, 
  X, 
  Check, 
  BellRing,
  Building2,
  Coins,
  RefreshCw,
  UserPlus,
  FolderPlus,
  Calculator,
  Tag,
  Pencil,
  MapPin
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { 
  InvoiceItem, 
  InvoiceLineItem,
  AppliedDiscount,
  InvoiceStatus, 
  getInvoices, 
  generateInvoiceNumber,
  addInvoice, 
  updateInvoice,
  deleteInvoice, 
  updateInvoiceStatus, 
  markPaymentCompleted,
  recordPartialPayment,
  sendPaymentReminder 
} from "./services/invoiceService"
import { InvoiceModal } from "./components/InvoiceModal"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { addPayment } from "../payments/services/paymentService"
import { addSubscription } from "@/app/feature/subscriptions/services/subscriptionService"
import { addOrder } from "../orders/services/orderService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { printPDFReport, exportToExcel } from "@/lib/exportUtils"
import { executeWithFeedback, useActionFeedbackStore } from "@/store/useActionFeedbackStore"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"

function InvoicesPageContent() {
  const { user, activeCompanyId, activeBranchId, branches, subBranches, companies } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canViewInvoice = canPerformAction(user, "Invoices", "view")
  const canAddInvoice = canPerformAction(user, "Invoices", "add")
  const canEditInvoice = canPerformAction(user, "Invoices", "edit")
  const canDeleteInvoice = canPerformAction(user, "Invoices", "delete")
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [activeTab, setActiveTab] = React.useState<"all" | InvoiceStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

  // Auto-fill from query params (e.g. redirected from Project or Client)
  const searchParams = useSearchParams()
  React.useEffect(() => {
    if (!searchParams) return
    const action = searchParams.get("action")
    const isNew = searchParams.get("new") === "true" || action === "new"
    const proj = searchParams.get("project") || searchParams.get("projectTitle")
    const cli = searchParams.get("client")
    if (isNew || proj || cli) {
      if (proj) {
        setProjectName(proj)
        setProjectSelectionMode("existing")
      }
      if (cli) {
        setClientName(cli)
        setClientSelectionMode("existing")
      }
      if (isNew) {
        setIsAddModalOpen(true)
      }
    }
  }, [searchParams])

  const [isGeneratingInvoice, setIsGeneratingInvoice] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Payment Recording / Pay Now Modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = React.useState<InvoiceItem | null>(null)
  const [paymentMethod, setPaymentMethod] = React.useState("UPI / Net Banking")
  const [paymentRef, setPaymentRef] = React.useState("")
  const [paymentTypeOption, setPaymentTypeOption] = React.useState<"full" | "part">("full")
  const [customPartPaymentAmount, setCustomPartPaymentAmount] = React.useState<number>(0)

  // Add Invoice Form state
  const [clientSelectionMode, setClientSelectionMode] = React.useState<"existing" | "custom">("existing")
  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [clientAddress, setClientAddress] = React.useState("")
  const [clientCity, setClientCity] = React.useState("")
  const [clientState, setClientState] = React.useState("")
  const [clientGst, setClientGst] = React.useState("")

  const [customClientName, setCustomClientName] = React.useState("")
  const [customClientEmail, setCustomClientEmail] = React.useState("")
  const [customClientPhone, setCustomClientPhone] = React.useState("")
  const [customClientAddress, setCustomClientAddress] = React.useState("")
  const [customClientCity, setCustomClientCity] = React.useState("")
  const [customClientState, setCustomClientState] = React.useState("")
  const [customClientGst, setCustomClientGst] = React.useState("")

  const [projectSelectionMode, setProjectSelectionMode] = React.useState<"existing" | "custom">("existing")
  const [projectName, setProjectName] = React.useState("")
  const [customProjectName, setCustomProjectName] = React.useState("")

  const [baseAmount, setBaseAmount] = React.useState<number | "">("")
  const [setupCharge, setSetupCharge] = React.useState<number | "">("")
  const [discount, setDiscount] = React.useState<number | "">("")
  const [gstRate, setGstRate] = React.useState<number>(18)
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<InvoiceStatus>("Not paid")
  const [paymentPlanMode, setPaymentPlanMode] = React.useState<"advance" | "part" | "full">("advance")
  const [advanceAmountInput, setAdvanceAmountInput] = React.useState<number | "">("")
  const [partInitialPayment, setPartInitialPayment] = React.useState<number | "">("")
  const [installmentsCount, setInstallmentsCount] = React.useState<number>(3)
  const [billingCycle, setBillingCycle] = React.useState<"Monthly" | "Quarterly">("Monthly")
  const [autoCreateSubscription, setAutoCreateSubscription] = React.useState<boolean>(true)

  // Invoice Type (GST vs Non-GST) and Issuing Company
  const isBranchLocked = Boolean(user?.branchId && user?.role !== "Super Admin")
  const [invoiceType, setInvoiceType] = React.useState<"gst" | "nongst">("gst")
  const [isNonGstMode, setIsNonGstMode] = React.useState(false)
  const [invoiceCompanyId, setInvoiceCompanyId] = React.useState<string>("tech")
  const [invoiceBranchId, setInvoiceBranchId] = React.useState<string>(user?.branchId || activeBranchId || "")
  const [invoiceSubBranchId, setInvoiceSubBranchId] = React.useState<string>("")
  const [editInvoiceType, setEditInvoiceType] = React.useState<"gst" | "nongst">("gst")
  const [editCompanyId, setEditCompanyId] = React.useState<string>("tech")
  const [editBranchId, setEditBranchId] = React.useState<string>("")
  const [editSubBranchId, setEditSubBranchId] = React.useState<string>("")
  const [editIsNonGst, setEditIsNonGst] = React.useState(false)

  React.useEffect(() => {
    if (user?.branchId && user?.role !== "Super Admin") {
      setInvoiceBranchId(user.branchId)
    }
  }, [user?.branchId, user?.role])

  const availableBillingBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    const targetComp = (invoiceCompanyId || activeCompanyId || user?.companyId || "tech").toLowerCase().trim()
    return branches.filter((b) => {
      const bComp = String(b.companyId || "").toLowerCase().trim()
      return bComp === targetComp || (targetComp === "tech" && !b.companyId)
    })
  }, [branches, invoiceCompanyId, activeCompanyId, user?.companyId])

  const availableEditBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    const targetComp = (editCompanyId || activeCompanyId || user?.companyId || "tech").toLowerCase().trim()
    return branches.filter((b) => {
      const bComp = String(b.companyId || "").toLowerCase().trim()
      return bComp === targetComp || (targetComp === "tech" && !b.companyId)
    })
  }, [branches, editCompanyId, activeCompanyId, user?.companyId])

  // Dynamic Multi-Services State for Invoices
  const [invoiceServiceItems, setInvoiceServiceItems] = React.useState<any[]>([
    {
      id: `svc_${Date.now()}`,
      serviceName: "",
      sacCode: "998313",
      qty: 1,
      unit: "Project",
      rate: "",
      charges: [],
      gstRate: 18,
    }
  ])

  // Named Multi-Discounts State for Invoices
  const [invoiceDiscounts, setInvoiceDiscounts] = React.useState<{ id: string; name: string; amount: number | "" }[]>([])

  const [availableClients, setAvailableClients] = React.useState<ClientItem[]>([])
  const [availableProjects, setAvailableProjects] = React.useState<{ title: string; client: string }[]>([])

  const handleAddInvService = (presetName?: string, presetSac?: string, presetGst?: number, presetUnit?: string) => {
    setInvoiceServiceItems(prev => [
      ...prev,
      {
        id: `svc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serviceName: presetName || "",
        sacCode: presetSac || "998313",
        qty: 1,
        unit: presetUnit || "Project",
        rate: "",
        charges: [],
        gstRate: presetGst !== undefined ? presetGst : 18,
      }
    ])
  }

  const handleRemoveInvService = (id: string) => {
    if (invoiceServiceItems.length <= 1) {
      alert("At least one service is required on the invoice.")
      return
    }
    setInvoiceServiceItems(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdateInvService = (id: string, field: string, value: any) => {
    setInvoiceServiceItems(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleAddInvCharge = (serviceId: string) => {
    setInvoiceServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          charges: [...s.charges, { id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, name: "", amount: "" }]
        }
      }
      return s
    }))
  }

  const handleRemoveInvCharge = (serviceId: string, chargeId: string) => {
    setInvoiceServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, charges: s.charges.filter((c: any) => c.id !== chargeId) }
      }
      return s
    }))
  }

  const handleUpdateInvCharge = (serviceId: string, chargeId: string, field: string, value: any) => {
    setInvoiceServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          charges: s.charges.map((c: any) => c.id === chargeId ? { ...c, [field]: value } : c)
        }
      }
      return s
    }))
  }

  const handleAddInvDiscount = () => {
    setInvoiceDiscounts(prev => [
      ...prev,
      { id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: "Promotional Discount", amount: "" }
    ])
  }

  const handleRemoveInvDiscount = (id: string) => {
    setInvoiceDiscounts(prev => prev.filter(d => d.id !== id))
  }

  const handleUpdateInvDiscount = (id: string, field: string, value: any) => {
    setInvoiceDiscounts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  // ---------------- EDIT INVOICE STATE & HANDLERS ----------------
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingInvoice, setEditingInvoice] = React.useState<InvoiceItem | null>(null)
  const [editClientName, setEditClientName] = React.useState("")
  const [editClientEmail, setEditClientEmail] = React.useState("")
  const [editProjectName, setEditProjectName] = React.useState("")
  const [editBillDate, setEditBillDate] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")
  const [editStatus, setEditStatus] = React.useState<InvoiceStatus>("Not paid")
  const [editPaymentReceived, setEditPaymentReceived] = React.useState<number | "">("")
  const [editServiceItems, setEditServiceItems] = React.useState<any[]>([])
  const [editDiscounts, setEditDiscounts] = React.useState<{ id: string; name: string; amount: number | "" }[]>([])

  const handleOpenEditInvoice = (inv: InvoiceItem) => {
    const isNonGst = inv.id?.toUpperCase().startsWith("NGINV") || (inv.gstRate === 0 && (!inv.items || inv.items.every(it => !it.gstRate || it.gstRate === 0)))
    setEditInvoiceType(isNonGst ? "nongst" : "gst")
    setEditCompanyId(inv.companyId || activeCompanyId || "tech")
    setEditBranchId(inv.branchId || (inv as any).branch_id || (isBranchLocked ? (user?.branchId || "") : ""))
    setEditSubBranchId(inv.subBranchId || (inv as any).sub_branch_id || "")
    setEditingInvoice(inv)
    setEditClientName(inv.client || "")
    setEditClientEmail(inv.clientEmail || "")
    setEditProjectName(inv.project || "")
    setEditBillDate(inv.billDate || new Date().toLocaleDateString("en-GB"))
    setEditDueDate(inv.dueDate || "")
    setEditStatus(inv.status || "Not paid")
    
    const recNum = parseInt((inv.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
    setEditPaymentReceived(recNum > 0 ? recNum : "")

    if (inv.items && inv.items.length > 0) {
      setEditServiceItems(inv.items.map(it => ({
        id: it.id || `svc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serviceName: it.serviceName || inv.project || "Enterprise Service",
        sacCode: it.sacCode || "998313",
        qty: it.qty || 1,
        unit: it.unit || "Project",
        rate: it.rate !== undefined ? it.rate : 0,
        charges: (it.charges || []).map((c: any) => ({
          id: c.id || `chg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: c.name || "Additional Setup",
          amount: c.amount || 0,
        })),
        gstRate: isNonGst ? 0 : (it.gstRate !== undefined ? it.gstRate : 18),
      })))
    } else {
      const baseNum = inv.baseAmount || parseInt((inv.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      setEditServiceItems([{
        id: `svc_${Date.now()}`,
        serviceName: inv.project || "Custom Service",
        sacCode: "998313",
        qty: 1,
        unit: "Project",
        rate: baseNum,
        charges: inv.setupCharge ? [{ id: "c1", name: "Platform Setup", amount: inv.setupCharge }] : [],
        gstRate: isNonGst ? 0 : 18,
      }])
    }
    if (inv.discountsList && inv.discountsList.length > 0) {
      setEditDiscounts(inv.discountsList.map(d => ({
        id: d.id || `disc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        name: d.name || "Discount",
        amount: d.amount || 0,
      })))
    } else if (inv.discount && inv.discount > 0) {
      setEditDiscounts([{
        id: `disc_${Date.now()}`,
        name: "Promotional Discount",
        amount: inv.discount,
      }])
    } else {
      setEditDiscounts([])
    }

    setIsInvoiceModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleAddEditService = () => {
    setEditServiceItems(prev => [
      ...prev,
      {
        id: `svc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serviceName: "",
        sacCode: "998313",
        qty: 1,
        unit: "Project",
        rate: "",
        charges: [],
        gstRate: 18,
      }
    ])
  }

  const handleRemoveEditService = (id: string) => {
    if (editServiceItems.length <= 1) {
      alert("At least one service line item is required on the invoice.")
      return
    }
    setEditServiceItems(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdateEditService = (id: string, field: string, value: any) => {
    setEditServiceItems(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleAddEditCharge = (serviceId: string) => {
    setEditServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          charges: [...(s.charges || []), { id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, name: "", amount: "" }]
        }
      }
      return s
    }))
  }

  const handleRemoveEditCharge = (serviceId: string, chargeId: string) => {
    setEditServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, charges: (s.charges || []).filter((c: any) => c.id !== chargeId) }
      }
      return s
    }))
  }

  const handleUpdateEditCharge = (serviceId: string, chargeId: string, field: string, value: any) => {
    setEditServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          charges: (s.charges || []).map((c: any) => c.id === chargeId ? { ...c, [field]: value } : c)
        }
      }
      return s
    }))
  }

  const handleAddEditDiscount = () => {
    setEditDiscounts(prev => [
      ...prev,
      { id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: "Promotional Discount", amount: "" }
    ])
  }

  const handleRemoveEditDiscount = (id: string) => {
    setEditDiscounts(prev => prev.filter(d => d.id !== id))
  }

  const handleUpdateEditDiscount = (id: string, field: string, value: any) => {
    setEditDiscounts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingInvoice) return

    const isEditNonGst = editInvoiceType === "nongst"
    const finalClient = editClientName.trim() || editingInvoice.client
    const finalProject = editProjectName.trim() || editingInvoice.project

    const finalItems = editServiceItems.map(it => {
      const rate = typeof it.rate === "number" ? it.rate : parseFloat(String(it.rate || "0")) || 0
      const qty = it.qty > 0 ? it.qty : 1
      const chargesSum = (it.charges || []).reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
      const rowBase = (rate * qty) + chargesSum
      const lineGstRate = isEditNonGst ? 0 : (Number(it.gstRate) || 0)
      const rowGst = isEditNonGst ? 0 : Math.round(rowBase * (lineGstRate / 100))
      const rowTotal = isEditNonGst ? rowBase : (rowBase + rowGst)
      return {
        id: it.id,
        serviceName: it.serviceName.trim() || finalProject,
        sacCode: it.sacCode || "998313",
        qty,
        unit: it.unit || "Unit",
        rate,
        charges: (it.charges || []).map((c: any) => ({
          id: c.id,
          name: c.name.trim() || "Additional Setup",
          amount: Number(c.amount) || 0,
        })),
        gstRate: lineGstRate,
        gstAmount: rowGst,
        totalAmount: rowTotal,
      }
    })

    const baseSum = finalItems.reduce((sum, it) => sum + (it.rate * it.qty), 0)
    const setupSum = finalItems.reduce((sum, it) => sum + (it.charges || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0), 0)
    const discountsSum = editDiscounts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const taxableBase = Math.max(0, baseSum + setupSum - discountsSum)

    const totalGst = isEditNonGst ? 0 : finalItems.reduce((sum, it) => sum + it.gstAmount, 0)
    const grandTotal = isEditNonGst ? taxableBase : (taxableBase + totalGst)

    const receivedNum = typeof editPaymentReceived === "number" 
      ? editPaymentReceived 
      : parseFloat(String(editPaymentReceived || "0")) || 0

    const dueNum = Math.max(0, grandTotal - receivedNum)

    let calculatedStatus: InvoiceStatus = editStatus
    if (dueNum === 0 && receivedNum > 0) {
      calculatedStatus = "Fully paid"
    } else if (receivedNum > 0 && dueNum > 0) {
      calculatedStatus = "Partially paid"
    } else if (receivedNum === 0 && calculatedStatus === "Fully paid") {
      calculatedStatus = "Not paid"
    }

    const payload: InvoiceItem = {
      ...editingInvoice,
      client: finalClient,
      clientEmail: editClientEmail.trim() || editingInvoice.clientEmail,
      project: finalProject,
      billDate: editBillDate || editingInvoice.billDate,
      dueDate: editDueDate || editingInvoice.dueDate,
      baseAmount: baseSum,
      setupCharge: setupSum,
      discount: discountsSum,
      discountsList: editDiscounts.filter(d => Number(d.amount) > 0).map(d => ({ id: d.id, name: d.name, amount: Number(d.amount) })),
      items: finalItems,
      gstRate: isEditNonGst ? 0 : (finalItems[0]?.gstRate || 18),
      gstAmount: totalGst,
      totalInvoiced: `₹${grandTotal.toLocaleString("en-IN")}`,
      paymentReceived: `₹${receivedNum.toLocaleString("en-IN")}`,
      due: `₹${dueNum.toLocaleString("en-IN")}`,
      status: calculatedStatus,
      companyId: editCompanyId || editingInvoice.companyId || activeCompanyId || "tech",
      branchId: editBranchId || (isBranchLocked ? user?.branchId : editingInvoice.branchId) || undefined,
      branchName: branches.find(b => b.id === (editBranchId || (isBranchLocked ? user?.branchId : editingInvoice.branchId)))?.name || editingInvoice.branchName || undefined,
      branchCode: branches.find(b => b.id === (editBranchId || (isBranchLocked ? user?.branchId : editingInvoice.branchId)))?.code || editingInvoice.branchCode || undefined,
      subBranchId: editSubBranchId || editingInvoice.subBranchId || undefined,
      subBranchName: (subBranches || []).find(sb => sb.id === (editSubBranchId || editingInvoice.subBranchId))?.name || editingInvoice.subBranchName || undefined,
      subBranchCode: (subBranches || []).find(sb => sb.id === (editSubBranchId || editingInvoice.subBranchId))?.code || editingInvoice.subBranchCode || undefined,
      subBranchSharePct: (subBranches || []).find(sb => sb.id === (editSubBranchId || editingInvoice.subBranchId))?.revenueSharePct || editingInvoice.subBranchSharePct || undefined,
    }

    await executeWithFeedback(async () => {
      await updateInvoice(payload)
      setIsEditModalOpen(false)
      setSelectedInvoice(payload)
      setIsInvoiceModalOpen(true)
      loadInvoices()
    }, {
      actionType: "update",
      loadingTitle: `Saving Invoice ${payload.id}...`,
      loadingMsg: "Updating financial computations and ledger...",
      successTitle: "Invoice Updated!",
      successMsg: `Invoice ${payload.id} was saved and synced.`,
      errorTitle: "Invoice Update Failed",
    })
  }

  const [isLoading, setIsLoading] = React.useState(true)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadInvoices = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      // Read fresh from store — avoids stale closure on company switch
      const { activeCompanyId: freshCompanyId, user: freshUser } = useAuthStore.getState()
      const targetComp = freshCompanyId || freshUser?.companyId || "tech"
      const data = await getInvoices(targetComp)
      setInvoices(data || [])
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadInvoices(true)
    const handleReload = () => loadInvoices(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_invoices_updated", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_invoices_updated", handleReload)
    }
  }, [loadInvoices])


  // Direct QR Code Scan to View Handler (?view=INV...)
  React.useEffect(() => {
    if (typeof window !== "undefined" && invoices.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const viewId = params.get("view")
      if (viewId) {
        const found = invoices.find(
          (i) => i.id.toLowerCase().trim() === viewId.toLowerCase().trim()
        )
        if (found) {
          setSelectedInvoice(found)
          setIsInvoiceModalOpen(true)
        }
      }
    }
  }, [invoices])

  React.useEffect(() => {
    if (isAddModalOpen) {
      setProjectName("")
      setCustomProjectName("")
      setDueDate("")
      setStatus("Not paid")
      setBaseAmount("")
      setSetupCharge("")
      setDiscount("")
      setInvoiceServiceItems([
        {
          id: `svc_${Date.now()}`,
          serviceName: "",
          sacCode: "998313",
          qty: 1,
          unit: "Project",
          rate: "",
          charges: [],
          gstRate: 18,
        }
      ])
      setInvoiceDiscounts([])
      setAdvanceAmountInput("")
      setPartInitialPayment("")
      setPaymentPlanMode("advance")
      setCustomClientName("")
      setCustomClientEmail("")
      setCustomClientPhone("")
      setCustomClientAddress("")
      setCustomClientCity("")
      setCustomClientGst("")
      getClients().then((clients) => {
        setAvailableClients(clients)
        if (clients.length > 0) {
          const first = clients[0]
          setClientName(first.name)
          setClientEmail(first.email || "")
          setClientPhone(first.phone || "")
          setClientAddress(first.address || "")
          setClientCity(first.city || "")
          setClientState(first.state || "")
          setClientGst(first.gstNumber || first.vatNumber || "")
        } else {
          setClientSelectionMode("custom")
        }
      }).catch(() => {})

      getProjects().then(projs => {
        setAvailableProjects(projs.map(p => ({ title: p.title, client: p.client })))
        if (projs.length > 0) {
          setProjectName(projs[0].title)
        } else {
          setProjectSelectionMode("custom")
        }
      })
    }
  }, [isAddModalOpen])

  const handleSendReminder = async (invoice: InvoiceItem) => {
    await executeWithFeedback(async () => {
      const res = await sendPaymentReminder(invoice.id)
      if (!res.success) throw new Error(res.message || "Failed to dispatch reminder.")
      loadInvoices()
    }, {
      actionType: "process",
      loadingTitle: "Dispatching Reminder...",
      loadingMsg: `Sending notification to ${invoice.client}...`,
      successTitle: "Reminder Dispatched!",
      successMsg: `Payment reminder sent to ${invoice.client} for ${invoice.due || invoice.totalInvoiced}.`,
      errorTitle: "Reminder Failed",
    })
  }

  const handleConfirmPayment = async () => {
    if (!paymentModalInvoice) return
    const isPart = paymentTypeOption === "part" && customPartPaymentAmount > 0
    const invId = paymentModalInvoice.id

    await executeWithFeedback(async () => {
      if (isPart) {
        const updated = await recordPartialPayment(
          invId,
          customPartPaymentAmount,
          paymentMethod,
          paymentRef
        )
        if (!updated) throw new Error("Could not record partial payment.")
      } else {
        const updated = await markPaymentCompleted(invId, paymentMethod, paymentRef)
        if (!updated) throw new Error("Could not record full payment.")
      }
      setPaymentModalInvoice(null)
      setPaymentRef("")
      setCustomPartPaymentAmount(0)
      loadInvoices()
    }, {
      actionType: "payment",
      loadingTitle: "Recording Payment...",
      loadingMsg: `Processing ${isPart ? `₹${customPartPaymentAmount.toLocaleString("en-IN")}` : "full"} payment settlement for ${invId}...`,
      successTitle: "Payment Recorded!",
      successMsg: `Payment for ${invId} has been successfully recorded and synced.`,
      errorTitle: "Payment Failed",
    })
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!canDeleteInvoice) {
      useActionFeedbackStore.getState().showError({
        title: "Permission Denied",
        message: "You do not have permission to delete invoices.",
        actionType: "delete",
      })
      return
    }
    await executeWithFeedback(async () => {
      await deleteInvoice(id, activeCompanyId || "all")
      setInvoices(prev => prev.filter(i => String(i.id).toLowerCase().trim() !== String(id).toLowerCase().trim()))
      await loadInvoices(false)
    }, {
      actionType: "delete",
      loadingTitle: `Deleting Invoice ${id}...`,
      loadingMsg: "Removing record from financial ledger...",
      successTitle: "Invoice Deleted",
      successMsg: `Invoice ${id} was deleted successfully.`,
      errorTitle: "Delete Failed",
    })
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalClientName = clientSelectionMode === "custom" ? customClientName.trim() : clientName.trim()
    const finalClientEmail = clientSelectionMode === "custom" 
      ? (customClientEmail.trim() || `${finalClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`)
      : (clientEmail.trim() || `${finalClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`)
    const finalProjectName = projectSelectionMode === "custom" ? customProjectName.trim() : projectName.trim()

    if (!finalClientName) {
      alert("Please enter or select a client name.")
      return
    }
    if (!finalProjectName) {
      alert("Please enter or select a project/service name.")
      return
    }
    const isNonGstMode = invoiceType === "nongst"
    const itemCalculations = invoiceServiceItems.map((item) => {
      const numRate = typeof item.rate === "number" ? item.rate : 0
      const qty = item.qty > 0 ? item.qty : 1
      const itemCharges = (item.charges || []).reduce((sum: number, c: any) => sum + (typeof c.amount === "number" ? c.amount : 0), 0)
      const itemBase = (numRate * qty) + itemCharges
      const lineGstRate = isNonGstMode ? 0 : (item.gstRate !== undefined ? item.gstRate : 18)
      const itemGst = isNonGstMode ? 0 : Math.round(itemBase * (lineGstRate / 100))
      const itemTotal = isNonGstMode ? itemBase : (itemBase + itemGst)
      return {
        ...item,
        gstRate: lineGstRate,
        numRate,
        qty,
        itemCharges,
        itemBase,
        itemGst,
        itemTotal,
      }
    })

    const totalServicesBase = itemCalculations.reduce((sum, it) => sum + (it.numRate * it.qty), 0)
    const totalPlatformCharges = itemCalculations.reduce((sum, it) => sum + it.itemCharges, 0)
    const totalGross = totalServicesBase + totalPlatformCharges
    const totalDiscounts = invoiceDiscounts.reduce((sum, d) => sum + (typeof d.amount === "number" ? d.amount : 0), 0)
    const taxableBase = Math.max(0, totalGross - totalDiscounts)
    const discountRatio = totalGross > 0 ? taxableBase / totalGross : 1

    const finalItemCalculations = itemCalculations.map((item) => {
      const lineTaxable = Math.round(item.itemBase * discountRatio)
      const lineGst = isNonGstMode ? 0 : Math.round(lineTaxable * (item.gstRate / 100))
      const lineTotal = isNonGstMode ? lineTaxable : (lineTaxable + lineGst)
      return {
        ...item,
        lineTaxable,
        itemGst: lineGst,
        itemTotal: lineTotal,
      }
    })

    const totalGstAmount = isNonGstMode ? 0 : (taxableBase > 0 ? finalItemCalculations.reduce((sum, it) => sum + it.itemGst, 0) : 0)
    const totalAmount = isNonGstMode ? taxableBase : (taxableBase + totalGstAmount)
    const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`

    let receivedNum = 0
    let finalStatus: InvoiceStatus = "Not paid"

    if (paymentPlanMode === "full") {
      receivedNum = status === "Fully paid" ? totalAmount : 0
      finalStatus = status
    } else if (paymentPlanMode === "advance") {
      receivedNum = Math.min(Math.max(0, typeof advanceAmountInput === "number" ? advanceAmountInput : 0), totalAmount)
      finalStatus = receivedNum >= totalAmount ? "Fully paid" : receivedNum > 0 ? "Partially paid" : "Not paid"
    } else if (paymentPlanMode === "part") {
      receivedNum = Math.min(Math.max(0, typeof partInitialPayment === "number" ? partInitialPayment : 0), totalAmount)
      finalStatus = receivedNum >= totalAmount ? "Fully paid" : receivedNum > 0 ? "Partially paid" : "Not paid"
    }

    const dueNum = Math.max(0, totalAmount - receivedNum)
    const formattedReceived = `₹${receivedNum.toLocaleString("en-IN")}`
    const formattedDue = `₹${dueNum.toLocaleString("en-IN")}`
    const allInvoices = await getInvoices("all")
    const invoiceId = generateInvoiceNumber(allInvoices, new Date(), isNonGstMode)
    const calculatedDueDate = dueDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-GB")

    const finalInvoiceItems: InvoiceLineItem[] = finalItemCalculations.map(it => ({
      id: it.id,
      serviceName: it.serviceName.trim() || finalProjectName,
      sacCode: it.sacCode || "998313",
      qty: it.qty,
      unit: it.unit,
      rate: it.numRate,
      charges: (it.charges || []).map((c: any) => ({
        id: c.id,
        name: c.name.trim() || "Additional Setup",
        amount: typeof c.amount === "number" ? c.amount : 0,
      })),
      gstRate: it.gstRate,
      gstAmount: it.itemGst,
      totalAmount: it.itemTotal,
    }))

    const finalDiscounts: AppliedDiscount[] = invoiceDiscounts
      .filter(d => (typeof d.amount === "number" && d.amount > 0))
      .map(d => ({
        id: d.id,
        name: d.name.trim() || "Discount",
        amount: Number(d.amount),
      }))

    await executeWithFeedback(async () => {
      const targetComp = invoiceCompanyId || activeCompanyId || "tech"
      const selectedSb = (subBranches || []).find(sb => sb.id === invoiceSubBranchId)
      const matchedBranch = branches.find(b => b.id === (invoiceBranchId || (isBranchLocked ? user?.branchId : (activeBranchId || selectedSb?.parentBranchId))) || b.name.toLowerCase() === ((invoiceBranchId || user?.branchId || activeBranchId) || "").toLowerCase())
      const effectiveBranchId = (invoiceBranchId || (isBranchLocked ? user?.branchId : (activeBranchId || selectedSb?.parentBranchId))) || undefined
      const effectiveBranchName = matchedBranch?.name || undefined
      const effectiveBranchCode = matchedBranch?.code ? matchedBranch.code.toUpperCase() : undefined
      const matchedCompObj = (companies as any[]).find(c => c.id?.toLowerCase() === targetComp.toLowerCase())
      const effectiveCompanyName = matchedCompObj?.brand_name || matchedCompObj?.name || (targetComp === "print" ? "Print Space India" : "SAAMPARK Technology")

      // 1. Save or update client in database with complete billing details
      try {
        if (clientSelectionMode === "custom") {
          await saveStoredClient({
            id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: finalClientName,
            email: finalClientEmail,
            phone: customClientPhone.trim() || "N/A",
            address: customClientAddress.trim(),
            city: customClientCity.trim(),
            gstNumber: customClientGst.trim(),
            primaryContact: finalClientName,
            group: "VIP",
            label: "Corporate",
            labelColor: "#d8b4fe",
            projectsCount: 1,
            totalInvoiced: formattedTotal,
            paymentReceived: formattedReceived,
            due: formattedDue,
            type: "Organization",
            owner: user?.name || "Admin",
            createdAt: Date.now(),
            companyId: targetComp,
            companyName: effectiveCompanyName,
            branchId: effectiveBranchId,
            branchName: effectiveBranchName,
            branchCode: effectiveBranchCode,
          }, targetComp)
        } else {
          const matched = availableClients.find(c => c.name === finalClientName)
          if (matched) {
            await saveStoredClient({
              ...matched,
              email: clientEmail.trim() || matched.email,
              phone: clientPhone.trim() || matched.phone,
              address: clientAddress.trim() || matched.address,
              city: clientCity.trim() || matched.city,
              state: clientState.trim() || matched.state,
              gstNumber: clientGst.trim() || matched.gstNumber,
              companyId: matched.companyId || targetComp,
              companyName: matched.companyName || effectiveCompanyName,
              branchId: matched.branchId || effectiveBranchId,
              branchName: matched.branchName || effectiveBranchName,
              branchCode: matched.branchCode || effectiveBranchCode,
            }, targetComp)
          }
        }
      } catch (err) {
        console.warn("Error saving client details:", err)
      }

      // 2. Add Invoice
      const newInv = await addInvoice({
        id: invoiceId,
        client: finalClientName,
        clientEmail: finalClientEmail,
        project: finalProjectName,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: calculatedDueDate,
        baseAmount: totalServicesBase,
        setupCharge: totalPlatformCharges,
        discount: totalDiscounts,
        gstRate: isNonGstMode ? 0 : 18,
        gstAmount: totalGstAmount,
        totalInvoiced: formattedTotal,
        paymentReceived: formattedReceived,
        due: formattedDue,
        status: finalStatus,
        billedBy: user?.name || "Admin",
        companyId: targetComp,
        branchId: effectiveBranchId,
        branchName: effectiveBranchName,
        branchCode: effectiveBranchCode,
        subBranchId: selectedSb?.id,
        subBranchName: selectedSb?.name,
        subBranchCode: selectedSb?.code,
        subBranchSharePct: selectedSb?.revenueSharePct,
        items: finalInvoiceItems,
        discountsList: finalDiscounts,
      }, targetComp)

      // 3. Automatically create Order in Sales Order List
      try {
        await addOrder({
          client: finalClientName,
          clientEmail: finalClientEmail,
          project: finalProjectName,
          orderDate: new Date().toISOString().split("T")[0],
          deliveryDate: calculatedDueDate,
          itemsCount: invoiceServiceItems.length,
          totalAmount: formattedTotal,
          paymentStatus: dueNum === 0 ? "Paid" : receivedNum > 0 ? "Partially paid" : "Unpaid",
          status: receivedNum > 0 ? "Processing" : "Pending",
          notes: `Order for: ${finalProjectName}. Services: ${invoiceServiceItems.map(s => s.serviceName).join(", ")}.`,
          invoiceId: invoiceId,
          companyId: targetComp,
          branchId: effectiveBranchId,
          branchName: effectiveBranchName,
          branchCode: effectiveBranchCode,
        }, targetComp)
      } catch (err) {
        console.warn("Could not auto-create sales order:", err)
      }

      // 4. Automatically record upfront / advance payment if received
      if (receivedNum > 0) {
        try {
          await addPayment({
            invoiceId: invoiceId,
            client: finalClientName,
            clientEmail: finalClientEmail,
            project: finalProjectName,
            paymentDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
            paymentMethod: "Bank Transfer / UPI",
            transactionRef: `TXN-${Date.now().toString().slice(-6)}`,
            note: paymentPlanMode === "advance" 
              ? `Advance Down Payment received for ${finalProjectName}` 
              : paymentPlanMode === "part"
                ? `Initial installment received for ${finalProjectName}`
                : `Full invoice settlement for ${finalProjectName}`,
            amount: formattedReceived,
            amountNum: receivedNum,
            status: "Completed",
            companyId: targetComp,
          }, targetComp)
        } catch (err) {
          console.warn("Error creating payment entry:", err)
        }
      }

      // 5. Automatically create Recurring Part Payment Subscription if Part Payment mode is active
      if (paymentPlanMode === "part" && autoCreateSubscription && dueNum > 0) {
        try {
          const perPart = Math.round(dueNum / installmentsCount)
          await addSubscription({
            clientName: finalClientName,
            planName: `${finalProjectName} (Part Payment Plan)`,
            status: "Active",
            amount: `₹${perPart.toLocaleString("en-IN")}`,
            billingCycle: billingCycle as any,
            nextBillingDate: calculatedDueDate,
            companyId: targetComp,
          }, targetComp)
        } catch (err) {
          console.warn("Error creating subscription for part payment:", err)
        }
      }

      setIsAddModalOpen(false)
      setSelectedInvoice(newInv)
      setIsInvoiceModalOpen(true)
      loadInvoices()
    }, {
      actionType: "create",
      loadingTitle: `Generating ${isNonGstMode ? "Invoice" : "Tax Invoice"}...`,
      loadingMsg: `Creating ${invoiceId} for ${finalClientName}...`,
      successTitle: "Invoice Created Successfully!",
      successMsg: `Invoice ${invoiceId} has been created and synced with the ledger.`,
      errorTitle: "Invoice Creation Failed",
    })

    setCustomClientName("")
    setCustomClientEmail("")
    setCustomClientPhone("")
    setCustomProjectName("")
    setClientSelectionMode("existing")
    setProjectSelectionMode("existing")
    setAdvanceAmountInput(20000)
    setPartInitialPayment(0)
    setPaymentPlanMode("advance")
    loadInvoices()
  }

  // Client-specific vs Admin filtered invoices
  const displayedInvoices = React.useMemo(() => {
    const userComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = user?.branchId || activeBranchId

    const targetBranchObj = (branches as any[]).find((b: any) => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
    const targetBranchId = String(targetBranchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

    const checkBranch = (i: any) => {
      if (!targetBranch || targetBranch === "all") return true
      const iBranch = String(i.branchId || i.branch_id || "").toLowerCase().trim()
      const iBranchName = String(i.branchName || i.branch_name || "").toLowerCase().trim()
      const iBranchCode = String(i.branchCode || i.branch_code || "").toLowerCase().trim()
      return (iBranch && (iBranch === targetBranchId || (targetBranchName && iBranch === targetBranchName))) ||
             (iBranchName && (iBranchName === targetBranchName || iBranchName === targetBranchId)) ||
             (iBranchCode && targetBranchObj?.code && iBranchCode === targetBranchObj.code.toLowerCase().trim())
    }

    let filtered = invoices
    if (isClientRole) {
      filtered = filtered.filter((i) => {
        if (!checkBranch(i)) return false
        return isRecordAssignedToClient(i, user)
      })
    } else {
      if (userComp && userComp !== "all" && !user?.branchId) {
        filtered = filtered.filter((i) => {
          const iComp = (i.companyId || (i as any).company || "tech").toLowerCase().trim()
          return iComp === userComp || (userComp === "tech" && !i.companyId)
        })
      }
      if (targetBranch && targetBranch !== "all") {
        filtered = filtered.filter((i) => checkBranch(i))
      }
    }
    return filtered
  }, [invoices, isClientRole, clientEmailNorm, clientNameNorm, activeCompanyId, activeBranchId, branches, user?.companyId, user?.branchId])

  // Summary Metrics based on displayed invoices
  const totalInvoicedNum = displayedInvoices.reduce((sum, i) => sum + (parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0), 0)
  const totalReceivedNum = displayedInvoices.reduce((sum, i) => {
    const inv = parseInt((i.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
    const rec = parseInt((i.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
    return sum + Math.min(rec, inv)
  }, 0)
  const totalDueNum = displayedInvoices.reduce((sum, i) => sum + (parseInt((i.due || "0").replace(/[^0-9]/g, "")) || 0), 0)
  const pendingCount = displayedInvoices.filter(i => i.status === "Not paid" || i.status === "Payment Pending" || i.status === "Partially paid").length

  const columns: ColumnDef<InvoiceItem>[] = [
    {
      accessorKey: "id",
      header: "Invoice ID",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => {
            setSelectedInvoice(row.original)
            setIsInvoiceModalOpen(true)
          }}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
        >
          {row.getValue("id")}
        </button>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.getValue("client")}</div>
          <div className="text-[11px] text-zinc-400 font-normal">{row.original.clientEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => <div className="text-zinc-600 dark:text-zinc-400 truncate max-w-[180px] font-medium">{row.getValue("project")}</div>,
    },
    {
      accessorKey: "billDate",
      header: "Bill date",
      cell: ({ row }) => <div className="text-zinc-500 text-xs font-mono">{row.getValue("billDate")}</div>,
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => <div className="text-red-600 dark:text-red-400 text-xs font-mono font-bold">{row.getValue("dueDate")}</div>,
    },
    {
      accessorKey: "totalInvoiced",
      header: "Total Invoiced",
      cell: ({ row }) => <div className="font-bold text-zinc-900 dark:text-zinc-100">{row.getValue("totalInvoiced")}</div>,
    },
    {
      accessorKey: "paymentReceived",
      header: "Paid",
      cell: ({ row }) => {
        const inv = parseInt((row.original.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
        const rec = parseInt((row.original.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
        const capped = Math.min(rec, inv)
        return <div className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{capped.toLocaleString("en-IN")}</div>
      },
    },
    {
      accessorKey: "due",
      header: "Due",
      cell: ({ row }) => {
        const dueVal = row.getValue("due") as string
        const hasDue = dueVal && dueVal !== "₹0"
        return <div className={`font-semibold ${hasDue ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>{dueVal || "₹0"}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as InvoiceStatus
        let colorClass = "bg-zinc-100 text-zinc-600 border-zinc-200"
        if (status === "Fully paid") colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
        if (status === "Not paid") colorClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
        if (status === "Partially paid" || status === "Payment Pending") colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
        
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {status}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original
        const isUnpaid = inv.status !== "Fully paid" && inv.status !== "Credited"

        return (
          <div className="flex items-center gap-1.5">
            {/* Client View: "Pay Now" Button */}
            {isClientRole && isUnpaid && (
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(inv)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                title="Pay Invoice Online"
              >
                <DollarSign size={13} />
                <span>Pay Now</span>
              </button>
            )}

            {/* Admin View: Payment Reminder */}
            {!isClientRole && isUnpaid && (
              <button
                type="button"
                onClick={() => handleSendReminder(inv)}
                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 border border-amber-200/80 dark:border-amber-800"
                title={inv.lastReminderSent ? `Last sent: ${inv.lastReminderSent}` : "Send Payment Reminder to client"}
              >
                <BellRing size={12} className="text-amber-600" />
                <span>Send Reminder</span>
              </button>
            )}

            {/* Admin View: Mark Payment Completed */}
            {!isClientRole && isUnpaid && (
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(inv)}
                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200/80 dark:border-emerald-800"
                title="Mark Payment Completed & sync to Payments"
              >
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Mark Paid</span>
              </button>
            )}

            {canEditInvoice && (
              <button
                type="button"
                onClick={() => handleOpenEditInvoice(inv)}
                className="p-1 text-zinc-500 hover:text-amber-600 transition-colors cursor-pointer"
                title="Edit Invoice (Services, Rates, Client)"
              >
                <Pencil size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedInvoice(inv)
                setIsInvoiceModalOpen(true)
              }}
              className="p-1 text-zinc-500 hover:text-blue-600 transition-colors cursor-pointer"
              title="View Invoice"
            >
              <Eye size={14} />
            </button>

            {canDeleteInvoice && (
              <button
                type="button"
                onClick={() => handleDeleteInvoice(inv.id)}
                className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Invoice"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )
      },
    }
  ]

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

      {/* ---------------- TOP HEADER BAR ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            <span>{isClientRole ? "My Invoices & Billing" : "Tax Invoices"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClientRole 
              ? "View and download your official tax invoices and complete secure online payments."
              : "Generate official tax invoices, dispatch payment reminders, and track settlements"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Tax_Invoices",
                title: "Tax Invoices Report",
                subtitle: "Official Billing",
                headers: ["#", "Invoice #", "Client Name", "Total Invoiced", "Bill Date", "Due Date", "Status"],
                rows: invoices.map((inv, idx) => [
                  idx + 1,
                  inv.id,
                  inv.client,
                  inv.totalInvoiced,
                  inv.billDate,
                  inv.dueDate,
                  inv.status,
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
                title: "Tax Invoices Summary Report",
                subtitle: "Official Invoices",
                headers: ["#", "Invoice #", "Client Name", "Total Invoiced", "Bill Date", "Due Date", "Status"],
                rows: invoices.map((inv, idx) => [
                  idx + 1,
                  inv.id,
                  inv.client,
                  inv.totalInvoiced,
                  inv.billDate,
                  inv.dueDate,
                  inv.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAddInvoice && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">{isClientRole ? "My Total Invoiced" : "Total Invoiced"}</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">₹{totalInvoicedNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Payments Received</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalReceivedNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Pending Collections</p>
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">₹{totalDueNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Unpaid Invoices</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- TABLE CONTAINER ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 shadow-2xs">
        {isLoading ? (
          <ThreeDotLoader text="Loading tax invoices & payments..." fullScreen={false} />
        ) : (
          <DataTable 
            columns={columns} 
            data={displayedInvoices} 
            searchKey="client"
          />
        )}
      </div>

      {/* ---------------- IMMERSIVE TAX INVOICE MODAL ---------------- */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setSelectedInvoice(null)
        }}
        onEditInvoice={canEditInvoice ? (inv) => handleOpenEditInvoice(inv) : undefined}
      />

      {/* ---------------- RECORD PAYMENT / MARK PAID MODAL ---------------- */}
      <AnimatePresence>
        {paymentModalInvoice && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Record Payment: {paymentModalInvoice.id}
                  </h3>
                </div>
                <button type="button" onClick={() => setPaymentModalInvoice(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Client:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{paymentModalInvoice.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Invoiced:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{paymentModalInvoice.totalInvoiced}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Outstanding Due:</span>
                    <span className="font-bold text-rose-600">{paymentModalInvoice.due}</span>
                  </div>
                </div>

                {/* Payment Option: Full vs Part Payment */}
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Settlement Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentTypeOption("full")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        paymentTypeOption === "full"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      Full Due Settlement ({paymentModalInvoice.due})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTypeOption("part")
                        const dueNum = parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0
                        if (customPartPaymentAmount === 0) setCustomPartPaymentAmount(Math.round(dueNum / 2))
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        paymentTypeOption === "part"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      Partial Installment
                    </button>
                  </div>
                </div>

                {paymentTypeOption === "part" && (
                  <div className="space-y-1">
                    <label className="block text-zinc-500 font-medium">Installment Amount Paid Now (₹) *</label>
                    <input
                      type="number"
                      min={1}
                      max={parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 99999999}
                      value={customPartPaymentAmount || ""}
                      onChange={(e) => setCustomPartPaymentAmount(Number(e.target.value))}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {[0.25, 0.5, 0.75].map((pct) => {
                        const dueNum = parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0
                        const amt = Math.round(dueNum * pct)
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setCustomPartPaymentAmount(amt)}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300"
                          >
                            {pct * 100}% (₹{amt.toLocaleString("en-IN")})
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="UPI / Net Banking">UPI / Net Banking</option>
                    <option value="Razorpay">Razorpay / Payment Gateway</option>
                    <option value="Bank Wire Transfer">Bank Wire / NEFT / RTGS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Transaction Ref / UTR / Cheque No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI882390192"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  {paymentTypeOption === "part" ? "Record Partial Payment" : "Confirm Full Settlement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- CREATE INVOICE MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Create Tax Invoice</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
                
                {/* ---------------- 0. INVOICE TYPE & ISSUING COMPANY ---------------- */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1.5 text-xs">
                      <span>🏷️</span>
                      <span>Invoice Scheme & Type *</span>
                    </label>
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">
                      {invoiceType === "nongst" ? "NGINV-DDMMYYYY-XXXX" : "INV-DDMMYYYY-XXXX"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceType("gst")
                        setInvoiceServiceItems(prev => prev.map(s => ({ ...s, gstRate: 18 })))
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                        invoiceType === "gst"
                          ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 font-bold shadow-xs"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-xs">🏢 GST Tax Invoice</span>
                      <span className="text-[10px] font-normal opacity-80">Teal Theme • 18% GST • Shows GSTIN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceType("nongst")
                        setInvoiceServiceItems(prev => prev.map(s => ({ ...s, gstRate: 0 })))
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                        invoiceType === "nongst"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold shadow-xs"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-xs">📄 Non-GST / 0% Invoice</span>
                      <span className="text-[10px] font-normal opacity-80">Blue Theme • 0% GST • Title: INVOICE</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Issuing Company Entity:
                      </label>
                      <select
                        value={invoiceCompanyId || activeCompanyId || "tech"}
                        onChange={(e) => {
                          setInvoiceCompanyId(e.target.value)
                          setInvoiceSubBranchId("")
                          if (!isBranchLocked) setInvoiceBranchId("")
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                      >
                        {(companies as any[]).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.logo || "🏢"} {c.brand_name || c.name} {c.division_name ? `(${c.division_name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Billing Branch / Location */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-amber-500" />
                          <span>Billing Branch / Location:</span>
                        </span>
                        {isBranchLocked && (
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            🔒 Locked
                          </span>
                        )}
                      </label>
                      {isBranchLocked ? (
                        <div className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between">
                          <span>📍 {branches.find(b => b.id === user?.branchId)?.name || user?.branchId || "Your Assigned Branch"}</span>
                          <span className="text-[10px] text-amber-600 font-normal">Fixed</span>
                        </div>
                      ) : (
                        <select
                          value={invoiceBranchId}
                          onChange={(e) => setInvoiceBranchId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                        >
                          <option value="">🏢 Company HQ / Central Office</option>
                          {availableBillingBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              📍 {b.name} {b.city ? `(${b.city})` : ""} {b.code ? `• [${b.code}]` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Branch Attribution (% Share Partner) */}
                {(subBranches || []).length > 0 && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <span>🌿 Sub-Branch Partner Attribution (% Share)</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">Optional Franchise Split</span>
                    </div>
                    <select
                      value={invoiceSubBranchId}
                      onChange={(e) => setInvoiceSubBranchId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-semibold text-foreground focus:outline-hidden"
                    >
                      <option value="">🏢 Company HQ / Direct Operating Branch (100% Company)</option>
                      {(subBranches || []).map((sb) => (
                        <option key={sb.id} value={sb.id}>
                          🌿 {sb.name} — {sb.revenueSharePct}% Partner Share / {100 - (sb.revenueSharePct ?? 30)}% Company
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ---------------- 1. CLIENT SELECTION / CUSTOM NAME ---------------- */}
                <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-600" />
                      <span>Client Details *</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setClientSelectionMode("existing")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          clientSelectionMode === "existing"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientSelectionMode("custom")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          clientSelectionMode === "custom"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        ✍️ Custom Name
                      </button>
                    </div>
                  </div>

                  {clientSelectionMode === "existing" ? (
                    availableClients.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          value={clientName}
                          onChange={(e) => {
                            setClientName(e.target.value)
                            const c = availableClients.find(ac => ac.name === e.target.value)
                            if (c) {
                              setClientEmail(c.email || "")
                              setClientPhone(c.phone || "")
                              setClientAddress(c.address || "")
                              setClientCity(c.city || "")
                              setClientState(c.state || "")
                              setClientGst(c.gstNumber || c.vatNumber || "")
                            }
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                        >
                          {availableClients.map(c => (
                            <option key={c.id || c.name} value={c.name}>{c.name} ({c.email || 'No email'})</option>
                          ))}
                        </select>

                        {/* Prefilled & Editable Client Billing Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Client Email</label>
                            <input
                              type="email"
                              placeholder="client@email.com"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Client Phone</label>
                            <input
                              type="tel"
                              placeholder="+91 9876543210"
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">Billing Address</label>
                            <input
                              type="text"
                              placeholder="Office / Street / Building"
                              value={clientAddress}
                              onChange={(e) => setClientAddress(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">City</label>
                            <input
                              type="text"
                              placeholder="City"
                              value={clientCity}
                              onChange={(e) => setClientCity(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">State</label>
                            <input
                              type="text"
                              placeholder="State"
                              value={clientState}
                              onChange={(e) => setClientState(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">GSTIN / Tax ID</label>
                            <input
                              type="text"
                              placeholder="e.g. 19AAAAA0000A1Z5"
                              value={clientGst}
                              onChange={(e) => setClientGst(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-400 text-[11px]">No registered clients found. Please type custom name below.</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        required={clientSelectionMode === "custom"}
                        placeholder="Enter Client or Company Name *"
                        value={customClientName}
                        onChange={(e) => setCustomClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="Client Email (Optional)"
                          value={customClientEmail}
                          onChange={(e) => setCustomClientEmail(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                        />
                        <input
                          type="tel"
                          placeholder="Phone / Mobile (Optional)"
                          value={customClientPhone}
                          onChange={(e) => setCustomClientPhone(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                        />
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Billing Address (Optional)"
                            value={customClientAddress}
                            onChange={(e) => setCustomClientAddress(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="City (Optional)"
                          value={customClientCity}
                          onChange={(e) => setCustomClientCity(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                        />
                        <input
                          type="text"
                          placeholder="State (Optional)"
                          value={customClientState}
                          onChange={(e) => setCustomClientState(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                        />
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="GSTIN / Tax ID (Optional)"
                            value={customClientGst}
                            onChange={(e) => setCustomClientGst(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ---------------- 2. PROJECT / SERVICE SELECTION ---------------- */}
                <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                      <FolderPlus size={14} className="text-blue-600" />
                      <span>Project / Service Scope *</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setProjectSelectionMode("existing")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          projectSelectionMode === "existing"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        Existing Project
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectSelectionMode("custom")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          projectSelectionMode === "custom"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        ✍️ Custom Service
                      </button>
                    </div>
                  </div>

                  {projectSelectionMode === "existing" ? (
                    availableProjects.length > 0 ? (
                      <select
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                      >
                        {availableProjects.map(p => (
                          <option key={p.title} value={p.title}>{p.title} ({p.client})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-zinc-400 text-[11px]">No active projects found. Please type custom service below.</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        required={projectSelectionMode === "custom"}
                        placeholder="Enter Project / Service Title *"
                        value={customProjectName}
                        onChange={(e) => setCustomProjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                      />
                      <div className="flex flex-wrap gap-1">
                        {["Website Development", "Software Development", "Android/iOS", "Digital Marketing", "Domain & Hosting"].map(svc => (
                          <button
                            key={svc}
                            type="button"
                            onClick={() => setCustomProjectName(svc)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            + {svc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ---------------- 3. MULTI-SERVICE ITEM BUILDER ---------------- */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 dark:border-blue-800/60 pb-2">
                    <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>✨</span> Itemized Services ({invoiceServiceItems.length})
                    </span>

                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-semibold">Quick:</span>
                      {[
                        { name: "Website Development", sac: "998313", gst: 18, unit: "Project" },
                        { name: "Software Development", sac: "998314", gst: 18, unit: "Project" },
                        { name: "Cloud & Domain", sac: "998315", gst: 18, unit: "Month" },
                        { name: "Digital Marketing", sac: "998311", gst: 18, unit: "Month" },
                      ].map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleAddInvService(p.name, p.sac, p.gst, p.unit)}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 text-[9.5px] font-bold text-blue-700 dark:text-blue-300"
                        >
                          + {p.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of services in Add Invoice */}
                  <div className="space-y-3">
                    {invoiceServiceItems.map((item, idx) => {
                      const numR = typeof item.rate === "number" ? item.rate : 0
                      const q = item.qty > 0 ? item.qty : 1
                      const extraC = (item.charges || []).reduce((sum: number, c: any) => sum + (typeof c.amount === "number" ? c.amount : 0), 0)
                      const lineBase = (numR * q) + extraC
                      const lineGst = Math.round(lineBase * ((item.gstRate !== undefined ? item.gstRate : 18) / 100))
                      const lineTot = lineBase + lineGst

                      return (
                        <div key={item.id} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-extrabold text-[9.5px]">
                              ITEM #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-zinc-900 dark:text-zinc-100">
                                Line Total: ₹{lineTot.toLocaleString("en-IN")}
                              </span>
                              {invoiceServiceItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvService(item.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Service Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="Service description"
                                value={item.serviceName}
                                onChange={(e) => handleUpdateInvService(item.id, "serviceName", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Rate (₹) *</label>
                              <input
                                type="number"
                                min="0"
                                required
                                placeholder="Price"
                                value={item.rate}
                                onChange={(e) => {
                                  const val = e.target.value
                                  handleUpdateInvService(item.id, "rate", val === "" ? "" : Math.max(0, Number(val)))
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => handleUpdateInvService(item.id, "qty", Math.max(1, Number(e.target.value)))}
                                className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-center font-bold"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">GST Rate</label>
                              <select
                                value={item.gstRate}
                                onChange={(e) => handleUpdateInvService(item.id, "gstRate", Number(e.target.value))}
                                className="w-full px-1.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                              >
                                <option value={18}>18% (GST)</option>
                                <option value={12}>12% (Print)</option>
                                <option value={5}>5%</option>
                                <option value={0}>0% (Non-GST)</option>
                              </select>
                            </div>
                          </div>
           </div>
                          </div>

                          {/* Extra Charges */}
                          <div className="pt-1 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-bold text-zinc-400 uppercase">Extra Charges ({item.charges?.length || 0})</span>
                              <button
                                type="button"
                                onClick={() => handleAddInvCharge(item.id)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                              >
                                <Plus size={11} /> Add Charge
                              </button>
                            </div>
                            {(item.charges || []).map((chg: any) => (
                              <div key={chg.id} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Charge name (e.g. Server Setup)"
                                  value={chg.name}
                                  onChange={(e) => handleUpdateInvCharge(item.id, chg.id, "name", e.target.value)}
                                  className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-zinc-400 text-[11px]">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Price"
                                    value={chg.amount}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      handleUpdateInvCharge(item.id, chg.id, "amount", val === "" ? "" : Math.max(0, Number(val)))
                                    }}
                                    className="w-20 px-1.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-[11px]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvCharge(item.id, chg.id)}
                                  className="p-0.5 text-zinc-400 hover:text-rose-600"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddInvService()}
                    className="w-full py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-dashed border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Plus size={13} /> Add Another Service
                  </button>
                </div>

                {/* ---------------- 4. NAMED MULTI-DISCOUNTS ---------------- */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1">
                      <Tag size={12} className="text-amber-600" />
                      <span>Promotional Discounts ({invoiceDiscounts.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddInvDiscount}
                      className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    >
                      <Plus size={11} /> Add Discount
                    </button>
                  </div>

                  {invoiceDiscounts.length > 0 && (
                    <div className="space-y-1.5">
                      {invoiceDiscounts.map(disc => (
                        <div key={disc.id} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <input
                            type="text"
                            placeholder="Discount name (e.g. Launch Offer)"
                            value={disc.name}
                            onChange={(e) => handleUpdateInvDiscount(disc.id, "name", e.target.value)}
                            className="flex-1 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-rose-500 font-bold text-xs">(-) ₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Amount"
                              value={disc.amount}
                              onChange={(e) => {
                                const val = e.target.value
                                handleUpdateInvDiscount(disc.id, "amount", val === "" ? "" : Math.max(0, Number(val)))
                              }}
                              className="w-24 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-xs text-rose-600"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveInvDiscount(disc.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ---------------- 5. LIVE COMPUTATION SUMMARY ---------------- */}
                {(() => {
                  const itemCalcs = invoiceServiceItems.map((item) => {
                    const numR = typeof item.rate === "number" ? item.rate : 0
                    const q = item.qty > 0 ? item.qty : 1
                    const extraC = (item.charges || []).reduce((sum: number, c: any) => sum + (typeof c.amount === "number" ? c.amount : 0), 0)
                    const lineBase = (numR * q) + extraC
                    const lineGst = Math.round(lineBase * ((item.gstRate !== undefined ? item.gstRate : 18) / 100))
                    return { lineBase, lineGst, numR, q, extraC }
                  })

                  const totBase = itemCalcs.reduce((sum, it) => sum + (it.numR * it.q), 0)
                  const totCharges = itemCalcs.reduce((sum, it) => sum + it.extraC, 0)
                  const totDisc = invoiceDiscounts.reduce((sum, d) => sum + (typeof d.amount === "number" ? d.amount : 0), 0)
                  const taxBase = Math.max(0, (totBase + totCharges) - totDisc)
                  const totGst = itemCalcs.reduce((sum, it) => sum + it.lineGst, 0)
                  const grandTot = taxBase + totGst

                  return (
                    <div className="p-3 rounded-xl bg-zinc-900 text-white space-y-1.5 text-xs shadow-md">
                      <div className="flex justify-between text-zinc-300 text-[11px]">
                        <span>Total Services Base:</span>
                        <span className="font-mono font-bold text-white">₹{totBase.toLocaleString("en-IN")}</span>
                      </div>
                      {totCharges > 0 && (
                        <div className="flex justify-between text-blue-300 text-[11px]">
                          <span>Total Extra Charges:</span>
                          <span className="font-mono font-bold">₹{totCharges.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {totDisc > 0 && (
                        <div className="flex justify-between text-rose-400 text-[11px]">
                          <span>Total Discounts:</span>
                          <span className="font-mono font-bold">(-) ₹{totDisc.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-400 text-[11px]">
                        <span>Total GST Taxes:</span>
                        <span className="font-mono font-bold text-blue-400">₹{totGst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-zinc-700 font-bold text-emerald-400 text-sm">
                        <span>Grand Total (Net Payable):</span>
                        <span className="font-mono text-base font-black">₹{grandTot.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )
                })()}

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Invoice Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                {/* ---------------- 4. SEPARATED PAYMENT TERMS BOX ---------------- */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calculator size={14} />
                      <span>Payment Structure</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                      <button
                        type="button"
                        onClick={() => setPaymentPlanMode("advance")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          paymentPlanMode === "advance"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        🪙 Advance
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlanMode("part")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          paymentPlanMode === "part"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        🔄 Part Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentPlanMode("full")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          paymentPlanMode === "full"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        💳 Full (100%)
                      </button>
                    </div>
                  </div>

                  {/* Option 1: Advance */}
                  {paymentPlanMode === "advance" && (
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Coins size={13} /> Advance Down Payment (₹)
                        </label>
                        <div className="flex items-center gap-1">
                          {[0.25, 0.40, 0.50].map((pct) => {
                            const curBase = typeof baseAmount === "number" ? baseAmount : 0
                            const total = curBase + Math.round(curBase * (gstRate / 100))
                            const amt = Math.round(total * pct)
                            return (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setAdvanceAmountInput(amt)}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9px] font-bold"
                              >
                                {pct * 100}%
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={typeof baseAmount === "number" ? baseAmount + Math.round(baseAmount * (gstRate / 100)) : undefined}
                        placeholder="Enter advance amount"
                        value={advanceAmountInput}
                        onChange={(e) => {
                          const val = e.target.value
                          setAdvanceAmountInput(val === "" ? "" : Math.max(0, Number(val)))
                        }}
                        className="w-full px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-900 dark:text-emerald-200 font-bold"
                      />
                    </div>
                  )}

                  {/* Option 2: Part Payment */}
                  {paymentPlanMode === "part" && (
                    <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-blue-300 dark:border-blue-800 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                            Initial Deposit (₹)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={partInitialPayment}
                            onChange={(e) => {
                              const val = e.target.value
                              setPartInitialPayment(val === "" ? "" : Math.max(0, Number(val)))
                            }}
                            placeholder="₹0"
                            className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                            Parts
                          </label>
                          <select
                            value={installmentsCount}
                            onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                          >
                            <option value={2}>2 Installments</option>
                            <option value={3}>3 Installments</option>
                            <option value={4}>4 Installments</option>
                            <option value={6}>6 Installments</option>
                            <option value={12}>12 Installments</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                            Cycle
                          </label>
                          <select
                            value={billingCycle}
                            onChange={(e) => setBillingCycle(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <RefreshCw size={13} className="text-blue-600 animate-spin-slow shrink-0" />
                          <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                            {(() => {
                              const curBase = typeof baseAmount === "number" ? baseAmount : 0
                              const curDeposit = typeof partInitialPayment === "number" ? partInitialPayment : 0
                              const total = curBase + Math.round(curBase * (gstRate / 100))
                              const rem = Math.max(0, total - curDeposit)
                              return `₹${Math.round(rem / installmentsCount).toLocaleString("en-IN")} / ${billingCycle.toLowerCase()}`
                            })()}
                          </span>
                        </div>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-blue-900 dark:text-blue-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoCreateSubscription}
                            onChange={(e) => setAutoCreateSubscription(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Add to Subscriptions</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Full */}
                  {paymentPlanMode === "full" && (
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Full Settlement Status:
                      </span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold text-zinc-800 dark:text-zinc-200"
                      >
                        <option value="Not paid">Payment Pending</option>
                        <option value="Fully paid">Fully Paid Upfront</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* ---------------- 5. LIVE TOTALS BREAKDOWN ---------------- */}
                {(() => {
                  const curBase = typeof baseAmount === "number" ? baseAmount : 0
                  const curAdv = typeof advanceAmountInput === "number" ? advanceAmountInput : 0
                  const curDeposit = typeof partInitialPayment === "number" ? partInitialPayment : 0

                  const total = curBase + Math.round(curBase * (gstRate / 100))
                  let adv = 0
                  if (paymentPlanMode === "full") adv = status === "Fully paid" ? total : 0
                  else if (paymentPlanMode === "advance") adv = Math.min(curAdv, total)
                  else if (paymentPlanMode === "part") adv = Math.min(curDeposit, total)
                  const due = Math.max(0, total - adv)

                  return (
                    <div className="bg-zinc-900 text-white p-3.5 rounded-xl space-y-1 text-xs shadow-inner">
                      <div className="flex justify-between text-zinc-400">
                        <span>Total Payable (Base + GST):</span>
                        <span className="font-bold text-white">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      {adv > 0 && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>{paymentPlanMode === "advance" ? "Advance Down Payment:" : "Initial Paid:"}</span>
                          <span>- ₹{adv.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-extrabold border-t border-zinc-700 pt-1.5 mt-1">
                        <span>Balance Due:</span>
                        <span className={due > 0 ? "text-amber-400" : "text-emerald-400"}>
                          ₹{due.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- EDIT INVOICE MODAL ---------------- */}
      <AnimatePresence>
        {isEditModalOpen && editingInvoice && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Pencil size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Edit Invoice:</span>
                      <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-800 dark:text-zinc-200 font-bold">
                        {editingInvoice.id}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Modify services, unit prices, billing dates, client details, and payment settlement.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEditInvoice} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                {/* 0. Invoice Type & Company */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/70 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1.5 text-xs">
                      <span>🏷️</span>
                      <span>Invoice Scheme & Type *</span>
                    </label>
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">
                      {editInvoiceType === "nongst" ? "Non-GST / 0% Tax" : "Standard GST Tax"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditInvoiceType("gst")
                        setEditServiceItems(prev => prev.map(s => ({ ...s, gstRate: 18 })))
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer ${
                        editInvoiceType === "gst"
                          ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200 ring-2 ring-teal-500/20 font-bold"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-xs">🏢 GST Tax Invoice</span>
                      <span className="text-[9.5px] opacity-75">Teal Theme • 18% GST</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditInvoiceType("nongst")
                        setEditServiceItems(prev => prev.map(s => ({ ...s, gstRate: 0 })))
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center gap-0.5 transition-all cursor-pointer ${
                        editInvoiceType === "nongst"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20 font-bold"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="text-xs">📄 Non-GST / 0% Invoice</span>
                      <span className="text-[9.5px] opacity-75">Blue Theme • 0% GST</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Issuing Company Entity:
                      </label>
                      <select
                        value={editCompanyId || activeCompanyId || "tech"}
                        onChange={(e) => {
                          setEditCompanyId(e.target.value)
                          if (!isBranchLocked) setEditBranchId("")
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                      >
                        {(companies as any[]).map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.logo || "🏢"} {c.brand_name || c.name} {c.division_name ? `(${c.division_name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Billing Branch / Location */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-amber-500" />
                          <span>Billing Branch / Location:</span>
                        </span>
                        {isBranchLocked && (
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            🔒 Locked
                          </span>
                        )}
                      </label>
                      {isBranchLocked ? (
                        <div className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between">
                          <span>📍 {branches.find(b => b.id === user?.branchId)?.name || user?.branchId || "Your Assigned Branch"}</span>
                          <span className="text-[10px] text-amber-600 font-normal">Fixed</span>
                        </div>
                      ) : (
                        <select
                          value={editBranchId}
                          onChange={(e) => {
                            setEditBranchId(e.target.value);
                            setEditSubBranchId("");
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                        >
                          <option value="">🏢 Company HQ / Central Office</option>
                          {availableEditBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              📍 {b.name} {b.city ? `(${b.city})` : ""} {b.code ? `• [${b.code}]` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Sub-Branch Selector in Edit */}
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1 flex items-center justify-between">
                        <span>🌿 Partner Sub-Branch (% Share)</span>
                        <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                      </label>
                      <select
                        value={editSubBranchId}
                        onChange={(e) => setEditSubBranchId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                      >
                        <option value="">None (Main Branch Direct Bill)</option>
                        {(subBranches || [])
                          .filter(sb => !editBranchId || sb.parentBranchId === editBranchId)
                          .map((sb) => (
                            <option key={sb.id} value={sb.id}>
                              🌿 {sb.name} {sb.code ? `• [${sb.code}]` : ""} ({sb.revenueSharePct}% Share)
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 1. Client & Project Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Client / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Client Email Address
                    </label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Project / Contract Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      placeholder="e.g. Enterprise Portal Development"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="text"
                      value={editBillDate}
                      onChange={(e) => setEditBillDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Payment Due Date
                    </label>
                    <input
                      type="text"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* 2. Services & Line Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Tag size={13} className="text-blue-600" />
                      <span>Itemized Services & Deliverables ({editServiceItems.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditService}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add Service Item</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editServiceItems.map((svc, idx) => {
                      const numRate = typeof svc.rate === "number" ? svc.rate : parseFloat(String(svc.rate || "0")) || 0
                      const numQty = svc.qty > 0 ? svc.qty : 1
                      const chargesTotal = (svc.charges || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0)
                      const itemBase = (numRate * numQty) + chargesTotal
                      const itemGst = Math.round(itemBase * ((Number(svc.gstRate) || 0) / 100))
                      const itemGross = itemBase + itemGst

                      return (
                        <div
                          key={svc.id}
                          className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                              Item #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                Total: ₹{itemGross.toLocaleString("en-IN")}
                              </span>
                              {editServiceItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditService(svc.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  title="Remove Service"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                                Service Name / Description *
                              </label>
                              <input
                                type="text"
                                required
                                value={svc.serviceName}
                                onChange={(e) => handleUpdateEditService(svc.id, "serviceName", e.target.value)}
                                placeholder="e.g. Website UI/UX Design"
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                                SAC / HSN
                              </label>
                              <input
                                type="text"
                                value={svc.sacCode || ""}
                                onChange={(e) => handleUpdateEditService(svc.id, "sacCode", e.target.value)}
                                placeholder="998313"
                                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-mono text-center"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                                Qty
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={svc.qty}
                                onChange={(e) => handleUpdateEditService(svc.id, "qty", Number(e.target.value))}
                                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 text-center font-bold"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                                Unit Rate (₹) *
                              </label>
                              <input
                                type="number"
                                required
                                min={0}
                                value={svc.rate}
                                onChange={(e) => handleUpdateEditService(svc.id, "rate", e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="50000"
                                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold text-center"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-[10.5px] font-semibold text-zinc-500">GST Rate:</label>
                              <select
                                value={svc.gstRate !== undefined ? svc.gstRate : 18}
                                onChange={(e) => handleUpdateEditService(svc.id, "gstRate", Number(e.target.value))}
                                className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]"
                              >
                                <option value={0}>0% (Tax Exempt / SEZ)</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18% (Standard Services)</option>
                                <option value={28}>28%</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddEditCharge(svc.id)}
                              className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              + Add Setup / Additional Fee
                            </button>
                          </div>

                          {/* Extra Charges for this Service */}
                          {svc.charges && svc.charges.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                              {svc.charges.map((chg: any) => (
                                <div key={chg.id} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Fee description (e.g. Hosting, Domain, SSL)"
                                    value={chg.name}
                                    onChange={(e) => handleUpdateEditCharge(svc.id, chg.id, "name", e.target.value)}
                                    className="flex-1 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px]"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Amount (₹)"
                                    value={chg.amount}
                                    onChange={(e) => handleUpdateEditCharge(svc.id, chg.id, "amount", e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-24 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-mono font-bold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditCharge(svc.id, chg.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Discounts Section */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Discounts & Concessions ({editDiscounts.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditDiscount}
                      className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                    >
                      + Add Discount
                    </button>
                  </div>

                  {editDiscounts.length > 0 && (
                    <div className="space-y-1.5">
                      {editDiscounts.map((disc) => (
                        <div key={disc.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Discount label (e.g. Promotional Rebate)"
                            value={disc.name}
                            onChange={(e) => handleUpdateEditDiscount(disc.id, "name", e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px]"
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="Discount (₹)"
                            value={disc.amount}
                            onChange={(e) => handleUpdateEditDiscount(disc.id, "amount", e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-28 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-emerald-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditDiscount(disc.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Payment Settlement & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Payment Received (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPaymentReceived}
                      onChange={(e) => setEditPaymentReceived(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">
                      Invoice Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-semibold"
                    >
                      <option value="Not paid">Not paid (Payment Pending)</option>
                      <option value="Partially paid">Partially paid</option>
                      <option value="Fully paid">Fully paid</option>
                      <option value="Draft">Draft</option>
                      <option value="Credited">Credited</option>
                    </select>
                  </div>
                </div>

                {/* 5. Live Summary Totals */}
                {(() => {
                  const finalItems = editServiceItems.map(it => {
                    const rate = typeof it.rate === "number" ? it.rate : parseFloat(String(it.rate || "0")) || 0
                    const qty = it.qty > 0 ? it.qty : 1
                    const chargesSum = (it.charges || []).reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                    const rowBase = (rate * qty) + chargesSum
                    const rowGst = Math.round(rowBase * ((Number(it.gstRate) || 0) / 100))
                    return { rowBase, rowGst, total: rowBase + rowGst }
                  })

                  const baseSum = finalItems.reduce((s, it) => s + it.rowBase, 0)
                  const discountsSum = editDiscounts.reduce((s, d) => s + (Number(d.amount) || 0), 0)
                  const taxable = Math.max(0, baseSum - discountsSum)
                  const totalGst = finalItems.reduce((s, it) => s + it.rowGst, 0)
                  const grandTotal = taxable + totalGst

                  const recNum = typeof editPaymentReceived === "number" ? editPaymentReceived : parseFloat(String(editPaymentReceived || "0")) || 0
                  const dueBalance = Math.max(0, grandTotal - recNum)

                  return (
                    <div className="bg-zinc-900 text-white p-3.5 rounded-2xl space-y-1.5 text-xs shadow-inner">
                      <div className="flex justify-between text-zinc-400">
                        <span>Services Subtotal:</span>
                        <span className="font-semibold text-white">₹{baseSum.toLocaleString("en-IN")}</span>
                      </div>
                      {discountsSum > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Applied Discounts:</span>
                          <span className="font-semibold">- ₹{discountsSum.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-400">
                        <span>Applicable GST:</span>
                        <span className="font-semibold text-white">₹{totalGst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-white border-t border-zinc-800 pt-1.5">
                        <span>Grand Total Payable:</span>
                        <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-emerald-400">
                        <span>Amount Received:</span>
                        <span>₹{recNum.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold border-t border-zinc-700 pt-1.5">
                        <span>Balance Due:</span>
                        <span className={dueBalance > 0 ? "text-amber-400" : "text-emerald-400"}>
                          ₹{dueBalance.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Changes & Update Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


export default function InvoicesPage() {
  return (
    <React.Suspense fallback={
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-500">Loading Invoices...</p>
      </div>
    }>
      <InvoicesPageContent />
    </React.Suspense>
  )
}
