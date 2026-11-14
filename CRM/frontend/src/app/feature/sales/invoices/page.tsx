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
  MapPin,
  User,
  Receipt,
  QrCode,
  Copy,
  ShieldCheck
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
  sendPaymentReminder,
  submitClientPaymentProof,
  verifyAndConfirmPayment,
  parseCurrencyNumber,
  isInvoiceOverdue,
  getInvoiceDaysOverdue,
  checkAndSendOverdueReminders
} from "./services/invoiceService"
import { isMatchingCompany } from "@/store/useAuthStore"
import { InvoiceModal } from "./components/InvoiceModal"
import { DocumentStudioModal } from "@/components/documents/DocumentStudioModal"
import { AddClientProjectModal } from "@/app/feature/clients/components/AddClientProjectModal"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { UserService } from "@/services/apiServices"
import { addPayment } from "../payments/services/paymentService"
import { addSubscription } from "@/app/feature/subscriptions/services/subscriptionService"
import { addOrder } from "../orders/services/orderService"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { printPDFReport, exportToExcel } from "@/lib/exportUtils"
import { executeWithFeedback, useActionFeedbackStore } from "@/store/useActionFeedbackStore"
import { isRecordAssignedToClient, isRecordAssignedToTeamMember } from "@/lib/clientScopeUtils"
import { confirmTwoStepDelete } from "@/lib/confirmDialog"
import { formatDisplayDate } from "@/lib/utils"
import { ensureClientUserAccount } from "@/app/feature/users/services/userService"

function InvoicesPageContent() {
  const { user, activeCompanyId, activeBranchId, branches, subBranches, companies } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const isClientRole = user?.role === "Clients" || user?.role?.toLowerCase().includes("client")
  const canViewInvoice = canPerformAction(user, "Invoices", "view")
  const canAddInvoice = !isClientRole && canPerformAction(user, "Invoices", "add")
  const canEditInvoice = !isClientRole && canPerformAction(user, "Invoices", "edit")
  const canDeleteInvoice = !isClientRole && canPerformAction(user, "Invoices", "delete")
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [activeTab, setActiveTab] = React.useState<"all" | InvoiceStatus | "overdue">("all")
  const [moduleCategoryFilter, setModuleCategoryFilter] = React.useState<"all" | "software" | "marketing">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [addModalInitialData, setAddModalInitialData] = React.useState<any>(null)
  const [isMarketingInvoiceMode, setIsMarketingInvoiceMode] = React.useState(false)
  const [isAddClientProjectModalOpen, setIsAddClientProjectModalOpen] = React.useState(false)

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

  // Dedicated Client Pay Now Modal state (with dynamic UPI QR & mandatory UTR)
  const [clientPayNowInvoice, setClientPayNowInvoice] = React.useState<InvoiceItem | null>(null)
  const [clientUtr, setClientUtr] = React.useState("")
  const [clientPayMethod, setClientPayMethod] = React.useState("UPI / PhonePe / GPay")
  const [clientPayNotes, setClientPayNotes] = React.useState("")
  const [clientPayError, setClientPayError] = React.useState<string | null>(null)
  const [isCopied, setIsCopied] = React.useState<string | null>(null)
  const [isSubmittingProof, setIsSubmittingProof] = React.useState(false)

  // Dedicated Admin Verify UTR Modal state
  const [verifyingInvoice, setVerifyingInvoice] = React.useState<InvoiceItem | null>(null)
  const [adminVerifyNotes, setAdminVerifyNotes] = React.useState("")
  const [isVerifyingProof, setIsVerifyingProof] = React.useState(false)

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
  const [invoiceBranchId, setInvoiceBranchId] = React.useState<string>(activeBranchId || user?.branchId || "")
  const [invoiceSubBranchId, setInvoiceSubBranchId] = React.useState<string>("")
  const [subBranchPayoutType, setSubBranchPayoutType] = React.useState<"percentage" | "fixed">("percentage")
  const [subBranchShareCustomVal, setSubBranchShareCustomVal] = React.useState<number | "">("")

  // Team Member / Commission Attribution for Add Modal
  const [teamMembers, setTeamMembers] = React.useState<any[]>([])
  const [assignedMemberId, setAssignedMemberId] = React.useState<string>("")
  const [memberPayoutType, setMemberPayoutType] = React.useState<"percentage" | "fixed">("percentage")
  const [memberPayoutValue, setMemberPayoutValue] = React.useState<number | "">(10)

  const [editInvoiceType, setEditInvoiceType] = React.useState<"gst" | "nongst">("gst")
  const [editCompanyId, setEditCompanyId] = React.useState<string>("tech")
  const [editBranchId, setEditBranchId] = React.useState<string>("")
  const [editSubBranchId, setEditSubBranchId] = React.useState<string>("")
  const [editSubBranchPayoutType, setEditSubBranchPayoutType] = React.useState<"percentage" | "fixed">("percentage")
  const [editSubBranchShareCustomVal, setEditSubBranchShareCustomVal] = React.useState<number | "">("")
  const [editAssignedMemberId, setEditAssignedMemberId] = React.useState<string>("")
  const [editMemberPayoutType, setEditMemberPayoutType] = React.useState<"percentage" | "fixed">("percentage")
  const [editMemberPayoutValue, setEditMemberPayoutValue] = React.useState<number | "">(10)
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
    
    const recNum = parseCurrencyNumber(inv.paymentReceived)
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
      const baseNum = inv.baseAmount || parseCurrencyNumber(inv.totalInvoiced)
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

    setEditAssignedMemberId(inv.assignedMemberId || "")
    setEditMemberPayoutType(inv.memberPayoutType || "percentage")
    setEditMemberPayoutValue(inv.memberPayoutValue !== undefined ? inv.memberPayoutValue : (inv.memberSharePct !== undefined ? inv.memberSharePct : 10))
    setEditSubBranchPayoutType(inv.subBranchPayoutType || "percentage")
    setEditSubBranchShareCustomVal(inv.subBranchShareAmount !== undefined ? inv.subBranchShareAmount : (inv.subBranchSharePct !== undefined ? inv.subBranchSharePct : ""))

    if (teamMembers.length === 0) {
      UserService.getTeamMembers().then(users => {
        if (Array.isArray(users)) {
          const nonAdmins = users.filter((u: any) => {
            const r = (u.role || u.role_name || "").toLowerCase().trim()
            const e = String(u.email || "").toLowerCase().trim()
            return !r.includes("client") && !r.includes("admin") && !r.includes("super") && !e.includes("superadmin") && e !== "saampark.official@gmail.com"
          })
          setTeamMembers(nonAdmins.map((u: any) => ({
            ...u,
            name: u.name || u.full_name || u.fullName || u.username || u.email || "Team Member",
            role: u.role || u.role_name || u.roleName || "Teams"
          })))
        }
      }).catch(() => {})
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
      subBranchSharePct: typeof editSubBranchShareCustomVal === "number" && editSubBranchPayoutType === "percentage"
        ? editSubBranchShareCustomVal
        : ((subBranches || []).find(sb => sb.id === (editSubBranchId || editingInvoice.subBranchId))?.revenueSharePct || editingInvoice.subBranchSharePct || undefined),
      subBranchPayoutType: editSubBranchPayoutType,
      subBranchShareAmount: typeof editSubBranchShareCustomVal === "number" && editSubBranchPayoutType === "fixed"
        ? editSubBranchShareCustomVal
        : undefined,
      assignedMemberId: editAssignedMemberId || undefined,
      assignedMemberName: teamMembers.find(m => String(m.id || m._id) === String(editAssignedMemberId))?.name || (editAssignedMemberId ? editingInvoice.assignedMemberName : undefined),
      assignedMemberRole: teamMembers.find(m => String(m.id || m._id) === String(editAssignedMemberId))?.role || (editAssignedMemberId ? editingInvoice.assignedMemberRole : undefined),
      assignedMemberAvatar: teamMembers.find(m => String(m.id || m._id) === String(editAssignedMemberId))?.avatar || (editAssignedMemberId ? editingInvoice.assignedMemberAvatar : undefined),
      memberPayoutType: editAssignedMemberId ? editMemberPayoutType : undefined,
      memberPayoutValue: editAssignedMemberId && typeof editMemberPayoutValue === "number" ? editMemberPayoutValue : undefined,
      memberPayoutAmount: editAssignedMemberId ? (
        editMemberPayoutType === "fixed" 
          ? (typeof editMemberPayoutValue === "number" ? editMemberPayoutValue : 0)
          : Math.round((grandTotal * (typeof editMemberPayoutValue === "number" ? editMemberPayoutValue : 10)) / 100)
      ) : undefined,
      memberSharePct: editAssignedMemberId ? (
        editMemberPayoutType === "fixed" && grandTotal > 0
          ? Number((((typeof editMemberPayoutValue === "number" ? editMemberPayoutValue : 0) / grandTotal) * 100).toFixed(1))
          : (typeof editMemberPayoutValue === "number" ? editMemberPayoutValue : 10)
      ) : undefined,
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
      const isClient = freshUser?.role === "Clients" || (freshUser?.role as string) === "Client"
      const targetComp = isClient ? "all" : (freshCompanyId || freshUser?.companyId || "tech")
      
      // Strict safety timeout so invoice page NEVER hangs indefinitely on loading
      const dataPromise = getInvoices(targetComp)
      const timeoutPromise = new Promise<InvoiceItem[]>((resolve) => setTimeout(() => resolve([]), 6000))
      const data = await Promise.race([dataPromise, timeoutPromise])
      setInvoices(data || [])
    } catch (err) {
      console.warn("loadInvoices fallback:", err)
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadInvoicesRef = React.useRef(loadInvoices)
  React.useEffect(() => {
    loadInvoicesRef.current = loadInvoices
  }, [loadInvoices])

  React.useEffect(() => {
    loadInvoicesRef.current(true)

    let reloadTimer: any = null
    const handleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer)
      reloadTimer = setTimeout(() => {
        loadInvoicesRef.current(false)
      }, 120)
    }

    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_invoices_updated", handleReload)

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer)
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_invoices_updated", handleReload)
    }
  }, [activeCompanyId, activeBranchId])

  const [isSendingOverdueBatch, setIsSendingOverdueBatch] = React.useState(false)
  const handleBatchOverdueReminders = async () => {
    setIsSendingOverdueBatch(true)
    await executeWithFeedback(async () => {
      const res = await checkAndSendOverdueReminders(activeCompanyId || "all")
      await loadInvoices(false)
      return res
    }, {
      actionType: "process",
      loadingTitle: "Checking & Sending Overdue Reminders...",
      loadingMsg: "Scanning ledger and dispatching urgent payment notifications...",
      successTitle: "Overdue Reminders Processed",
      successMsg: "Payment notifications and reminders dispatched to overdue clients.",
      errorTitle: "Reminder Failed",
    })
    setIsSendingOverdueBatch(false)
  }


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
      setClientName("")
      setClientEmail("")
      setClientPhone("")
      setClientAddress("")
      setClientCity("")
      setClientState("")
      setClientGst("")
      getClients().then((clients) => {
        setAvailableClients(clients)
      }).catch(() => {})

      getProjects().then(projs => {
        setAvailableProjects(projs.map(p => ({ title: p.title, client: p.client })))
        if (projs.length > 0) {
          setProjectName(projs[0].title)
        } else {
          setProjectSelectionMode("custom")
        }
      })

      UserService.getTeamMembers().then(users => {
        if (Array.isArray(users)) {
          const nonAdmins = users.filter((u: any) => {
            const r = (u.role || u.role_name || "").toLowerCase().trim()
            const e = String(u.email || "").toLowerCase().trim()
            return !r.includes("client") && !r.includes("admin") && !r.includes("super") && !e.includes("superadmin") && e !== "saampark.official@gmail.com"
          })
          setTeamMembers(nonAdmins.map((u: any) => ({
            ...u,
            name: u.name || u.full_name || u.fullName || u.username || u.email || "Team Member",
            role: u.role || u.role_name || u.roleName || "Teams"
          })))
        }
      }).catch(() => {})
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
    const dueNum = parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0
    const isOverpaid = isPart && customPartPaymentAmount > dueNum

    await executeWithFeedback(async () => {
      if (isPart) {
        const updated = await recordPartialPayment(
          invId,
          customPartPaymentAmount,
          paymentMethod,
          paymentRef
        )
        if (!updated) throw new Error("Could not record payment.")
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
      successTitle: isOverpaid ? "Payment & Credit Note Created!" : "Payment Recorded!",
      successMsg: isOverpaid 
        ? `Invoice #${invId} settled in full! Overpayment of ₹${(customPartPaymentAmount - dueNum).toLocaleString("en-IN")} has been credited to ${paymentModalInvoice.client}'s Credit Notes.`
        : `Payment for ${invId} has been successfully recorded and synced.`,
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

    const inv = invoices.find(i => String(i.id).toLowerCase().trim() === String(id).toLowerCase().trim())
    const label = inv ? `${inv.id} (${inv.client || 'Invoice'})` : id
    const confirmed = await confirmTwoStepDelete(label, "invoice")
    if (!confirmed) return

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
      const effectiveCompanyName = matchedCompObj?.name || (matchedCompObj?.brand_name ? `${matchedCompObj.brand_name} ${matchedCompObj.division_name || ''}`.trim() : null) || (targetComp === "print" ? "Print Space India" : "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED")

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
        companyName: effectiveCompanyName,
        branchId: effectiveBranchId,
        branchName: effectiveBranchName,
        branchCode: effectiveBranchCode,
        subBranchId: selectedSb?.id,
        subBranchName: selectedSb?.name,
        subBranchCode: selectedSb?.code,
        subBranchSharePct: typeof subBranchShareCustomVal === "number" && subBranchPayoutType === "percentage"
          ? subBranchShareCustomVal
          : selectedSb?.revenueSharePct,
        subBranchPayoutType: subBranchPayoutType,
        subBranchShareAmount: typeof subBranchShareCustomVal === "number" && subBranchPayoutType === "fixed"
          ? subBranchShareCustomVal
          : undefined,
        assignedMemberId: assignedMemberId || undefined,
        assignedMemberName: teamMembers.find(m => String(m.id || m._id) === String(assignedMemberId))?.name,
        assignedMemberRole: teamMembers.find(m => String(m.id || m._id) === String(assignedMemberId))?.role,
        assignedMemberAvatar: teamMembers.find(m => String(m.id || m._id) === String(assignedMemberId))?.avatar,
        memberPayoutType: assignedMemberId ? memberPayoutType : undefined,
        memberPayoutValue: assignedMemberId && typeof memberPayoutValue === "number" ? memberPayoutValue : undefined,
        memberPayoutAmount: assignedMemberId ? (
          memberPayoutType === "fixed"
            ? (typeof memberPayoutValue === "number" ? memberPayoutValue : 0)
            : Math.round((totalAmount * (typeof memberPayoutValue === "number" ? memberPayoutValue : 10)) / 100)
        ) : undefined,
        memberSharePct: assignedMemberId ? (
          memberPayoutType === "fixed" && totalAmount > 0
            ? Number((((typeof memberPayoutValue === "number" ? memberPayoutValue : 0) / totalAmount) * 100).toFixed(1))
            : (typeof memberPayoutValue === "number" ? memberPayoutValue : 10)
        ) : undefined,
        items: finalInvoiceItems,
        discountsList: finalDiscounts,
      }, targetComp)

      // 3. Concurrently execute secondary records (Sales Order, Payment, Subscription, Client Account)
      // Non-blocking so invoice creation is instant and never hangs or times out!
      const backgroundSecondaryTasks: Promise<any>[] = []

      backgroundSecondaryTasks.push(
        addOrder({
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
        }, targetComp).catch(err => console.warn("Order auto-creation warning:", err))
      )

      if (finalClientEmail) {
        backgroundSecondaryTasks.push(
          ensureClientUserAccount({
            email: finalClientEmail,
            name: finalClientName,
            phone: clientSelectionMode === "custom" ? customClientPhone : clientPhone,
            companyId: targetComp,
          }).catch(err => console.warn("Client account ensure warning:", err))
        )
      }

      if (receivedNum > 0) {
        backgroundSecondaryTasks.push(
          addPayment({
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
          }, targetComp).catch(err => console.warn("Payment entry warning:", err))
        )
      }

      if (paymentPlanMode === "part" && autoCreateSubscription && dueNum > 0) {
        const perPart = Math.round(dueNum / installmentsCount)
        backgroundSecondaryTasks.push(
          addSubscription({
            clientName: finalClientName,
            planName: `${finalProjectName} (Part Payment Plan)`,
            status: "Active",
            amount: `₹${perPart.toLocaleString("en-IN")}`,
            billingCycle: billingCycle as any,
            nextBillingDate: calculatedDueDate,
            companyId: targetComp,
          }, targetComp).catch(err => console.warn("Subscription entry warning:", err))
        )
      }

      Promise.allSettled(backgroundSecondaryTasks).catch(() => {})

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
    const targetBranch = activeBranchId || (user?.role !== "Super Admin" && user?.role !== "Admin" ? user?.branchId : null)

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
      filtered = filtered.filter((i) => isRecordAssignedToClient(i, user))
    } else {
      if (user?.role === "Teams" || (user?.role as string) === "Team") {
        filtered = filtered.filter((i) => isRecordAssignedToTeamMember(i, user))
      }
      if (userComp && userComp !== "all") {
        filtered = filtered.filter((i) => {
          const iComp = (i.companyId || (i as any).company || "tech").toLowerCase().trim()
          return isMatchingCompany({ id: iComp, slug: iComp } as any, userComp)
        })
      }
      if (targetBranch && targetBranch !== "all") {
        filtered = filtered.filter((i) => checkBranch(i))
      }
    }

    if (activeTab === "overdue") {
      filtered = filtered.filter(isInvoiceOverdue)
    } else if (activeTab !== "all") {
      filtered = filtered.filter((i) => i.status === activeTab)
    }

    // Separate Digital Marketing invoices from standard Software/Project invoices
    const isMkt = (i: InvoiceItem) => {
      if (i.primaryCategory === "Digital Marketing") return true
      if (Boolean((i as any)?.marketingPackage?.enabled || (i as any)?.marketingPackage?.planName)) return true
      const p = (i.project || "").toLowerCase()
      if (p.includes("marketing") || p.includes("retainer") || p.includes("social media") || p.includes("poster") || p.includes("reel")) return true
      return (i.items || []).some(it => {
        const name = (it.serviceName || "").toLowerCase()
        return name.includes("marketing") || name.includes("poster") || name.includes("video") || name.includes("reel") || name.includes("social")
      })
    }

    if (moduleCategoryFilter === "software") {
      filtered = filtered.filter(i => !isMkt(i))
    } else if (moduleCategoryFilter === "marketing") {
      filtered = filtered.filter(i => isMkt(i))
    }

    return filtered
  }, [invoices, isClientRole, clientEmailNorm, clientNameNorm, activeCompanyId, activeBranchId, branches, user?.companyId, user?.branchId, activeTab, moduleCategoryFilter])

  // Summary Metrics based on displayed invoices
  const totalInvoicedNum = displayedInvoices.reduce((sum, i) => sum + parseCurrencyNumber(i.totalInvoiced), 0)
  const totalReceivedNum = displayedInvoices.reduce((sum, i) => {
    const inv = parseCurrencyNumber(i.totalInvoiced)
    const rec = parseCurrencyNumber(i.paymentReceived)
    return sum + Math.min(rec, inv)
  }, 0)
  const totalDueNum = displayedInvoices.reduce((sum, i) => sum + parseCurrencyNumber(i.due), 0)
  const pendingCount = displayedInvoices.filter(i => i.status === "Not paid" || i.status === "Payment Pending" || i.status === "Partially paid").length
  const overdueCount = React.useMemo(() => {
    return invoices.filter(isInvoiceOverdue).length
  }, [invoices])

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
      cell: ({ row }) => {
        const isMarketing = Boolean(
          row.original.primaryCategory === "Digital Marketing" || 
          (row.original as any)?.marketingPackage?.enabled || 
          row.original.project?.toLowerCase().includes("marketing") || 
          row.original.project?.toLowerCase().includes("retainer") ||
          (row.original.items || []).some(it => (it.serviceName || '').toLowerCase().includes("marketing") || (it.serviceName || '').toLowerCase().includes("poster"))
        )
        return (
          <div>
            <div className="text-zinc-700 dark:text-zinc-300 truncate max-w-[180px] font-semibold">{row.getValue("project")}</div>
            {isMarketing && (
              <a
                href={`/feature/marketing?client=${encodeURIComponent(row.original.client)}&invoice=${encodeURIComponent(row.original.id)}`}
                className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900 border border-purple-300 dark:border-purple-800 transition-colors shadow-2xs"
                title="Direct link to Digital Marketing Retainer Hub for this client"
              >
                <span>📱 Marketing Hub →</span>
              </a>
            )}
            {row.original.assignedMemberName && (
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                <User size={10} />
                <span>{row.original.assignedMemberName}</span>
                {row.original.memberPayoutType === "fixed" && row.original.memberPayoutAmount ? (
                  <span>(₹{row.original.memberPayoutAmount.toLocaleString("en-IN")})</span>
                ) : row.original.memberSharePct ? (
                  <span>({row.original.memberSharePct}%)</span>
                ) : null}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "billDate",
      header: "Bill date",
      cell: ({ row }) => <div className="text-zinc-500 text-xs font-mono">{formatDisplayDate(row.getValue("billDate"))}</div>,
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => {
        const inv = row.original
        const overdue = isInvoiceOverdue(inv)
        const days = overdue ? getInvoiceDaysOverdue(inv.dueDate) : 0
        return (
          <div className="space-y-0.5">
            <div className={`text-xs font-mono font-bold ${overdue ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-400"}`}>
              {formatDisplayDate(inv.dueDate)}
            </div>
            {overdue && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                Overdue ({days}d)
              </span>
            )}
          </div>
        )
      },
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
        const inv = parseCurrencyNumber(row.original.totalInvoiced)
        const rec = parseCurrencyNumber(row.original.paymentReceived)
        const capped = Math.min(rec, inv)
        return <div className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{capped.toLocaleString("en-IN")}</div>
      },
    },
    {
      accessorKey: "due",
      header: "Due",
      cell: ({ row }) => {
        const dueNum = parseCurrencyNumber(row.original.due)
        const hasDue = dueNum > 0
        return <div className={`font-semibold ${hasDue ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>{hasDue ? `₹${dueNum.toLocaleString("en-IN")}` : "₹0"}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const inv = row.original
        const status = row.getValue("status") as InvoiceStatus
        const overdue = isInvoiceOverdue(inv)
        let colorClass = "bg-zinc-100 text-zinc-600 border-zinc-200"
        if (status === "Fully paid") colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
        if (status === "Not paid") colorClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
        if (status === "Partially paid" || status === "Payment Pending") colorClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
        if (status === "Pending Verification") colorClass = "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700"
        
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass} flex items-center gap-1`}>
              {status === "Pending Verification" && <Clock size={10} className="animate-spin text-purple-600" />}
              {status}
            </span>
            {inv.paymentProofUtr && (
              <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[9.5px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-0.5" title={`Submitted UTR: ${inv.paymentProofUtr}`}>
                UTR: {inv.paymentProofUtr}
              </span>
            )}
            {inv.clientAccepted && (
              <span 
                className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5" 
                title={`Accepted by client: ${inv.acceptedBy || inv.client || 'Client'}${inv.acceptedAt ? ` on ${new Date(Number(inv.acceptedAt) || inv.acceptedAt).toLocaleDateString('en-IN')}` : ''}`}
              >
                ✓ Client Accepted
              </span>
            )}
            {overdue && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                Overdue
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original
        const isUnpaid = inv.status !== "Fully paid" && inv.status !== "Credited"
        const isPendingVerification = inv.status === "Pending Verification"

        return (
          <div className="flex items-center gap-1.5">
            {/* Client View: "Pay Now" Button (UPI QR + Mandatory UTR) */}
            {isClientRole && isUnpaid && !isPendingVerification && (
              <button
                type="button"
                onClick={() => {
                  setClientPayNowInvoice(inv)
                  setClientUtr("")
                  setClientPayNotes("")
                  setClientPayError(null)
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title="Pay Invoice Online via UPI QR"
              >
                <DollarSign size={13} />
                <span>Pay Now</span>
              </button>
            )}

            {/* Client View: UTR Submitted Status Badge */}
            {isClientRole && isPendingVerification && (
              <span className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 border border-purple-300 dark:border-purple-800">
                <Clock size={11} className="animate-spin" />
                <span>Verification Pending</span>
              </span>
            )}

            {/* Admin View: Verify UTR Button (when client submitted proof) */}
            {!isClientRole && isPendingVerification && (
              <button
                type="button"
                onClick={() => {
                  setVerifyingInvoice(inv)
                  setAdminVerifyNotes("")
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer animate-pulse"
                title="Verify Client's Submitted UTR and Confirm Payment"
              >
                <ShieldCheck size={13} />
                <span>Verify UTR</span>
              </button>
            )}

            {/* Admin View: Payment Reminder */}
            {!isClientRole && isUnpaid && !isPendingVerification && (
              <button
                type="button"
                onClick={() => handleSendReminder(inv)}
                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 border border-amber-200/80 dark:border-amber-800 cursor-pointer"
                title={inv.lastReminderSent ? `Last sent: ${inv.lastReminderSent}` : "Send Payment Reminder to client"}
              >
                <BellRing size={12} className="text-amber-600" />
                <span>Send Reminder</span>
              </button>
            )}

            {/* Admin View: Mark Payment Completed */}
            {!isClientRole && isUnpaid && !isPendingVerification && (
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(inv)}
                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200/80 dark:border-emerald-800 cursor-pointer"
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

          {!isClientRole && overdueCount > 0 && (
            <button
              type="button"
              disabled={isSendingOverdueBatch}
              onClick={handleBatchOverdueReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer animate-pulse"
              title="Automatically dispatch payment reminders to all clients with overdue balances"
            >
              <BellRing size={13} className="text-rose-600" />
              <span>Auto Remind Overdue ({overdueCount})</span>
            </button>
          )}

          {canAddInvoice && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMarketingInvoiceMode(true)
                  setAddModalInitialData({
                    primaryCategory: "Digital Marketing",
                    category: "Digital Marketing",
                    isMarketingRetainer: true,
                    project: "Digital Marketing Growth Retainer",
                    companyId: "consultancy",
                    marketingPackage: {
                      enabled: true,
                      planName: "Grow - 2",
                      packageDuration: "Monthly Retainer",
                      postersCount: 20,
                      videosCount: 15,
                      hasRealModelShoot: true,
                      packagePrice: 15000,
                      specialNote: "Monthly social media and digital marketing deliverables retainer"
                    }
                  })
                  setIsAddModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                title="Create Dedicated Digital Marketing Retainer Invoice"
              >
                <Sparkles size={14} />
                <span>+ Digital Marketing Retainer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMarketingInvoiceMode(false)
                  setAddModalInitialData(null)
                  setIsAddModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                title="Create Official Tax Invoice (Software & Standard Projects)"
              >
                <Plus size={15} />
                <span>+ Create Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- KPI SUMMARY CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card-premium flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">{isClientRole ? "My Total Invoiced" : "Total Invoiced"}</p>
            <h3 className="text-2xl font-black text-foreground mt-0.5">₹{totalInvoicedNum.toLocaleString("en-IN")}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
              <span>●</span> {displayedInvoices.length} invoices generated
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl">
            <FileText size={22} />
          </div>
        </div>

        <div className="kpi-card-premium flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Payments Received</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalReceivedNum.toLocaleString("en-IN")}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <span>✓</span> Real-time reconciled
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="kpi-card-premium flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Pending Collections</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">₹{totalDueNum.toLocaleString("en-IN")}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
              <span>!</span> Outstanding ledger
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="kpi-card-premium flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Unpaid Invoices</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
              <span>⏱</span> Awaiting settlement
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* ---------------- TABLE CONTAINER ---------------- */}
      <div className="table-3d-wrapper p-6 space-y-4">
        {/* Module Separation Buttons: Software vs Digital Marketing */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setModuleCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                moduleCategoryFilter === "all"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All Invoices
            </button>
            <button
              type="button"
              onClick={() => setModuleCategoryFilter("software")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                moduleCategoryFilter === "software"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-blue-600"
              }`}
            >
              <span>💻 Software &amp; Client Projects</span>
            </button>
            <button
              type="button"
              onClick={() => setModuleCategoryFilter("marketing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                moduleCategoryFilter === "marketing"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                  : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              }`}
            >
              <span>📱 Digital Marketing Retainers</span>
            </button>
          </div>

          <a
            href="/feature/marketing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <span>Open Marketing Retainer Hub →</span>
          </a>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "all" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Fully paid")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "Fully paid" ? "bg-emerald-600 text-white shadow-2xs" : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"}`}
          >
            Fully Paid ({invoices.filter(i => i.status === "Fully paid").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Partially paid")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "Partially paid" ? "bg-amber-600 text-white shadow-2xs" : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"}`}
          >
            Partially Paid ({invoices.filter(i => i.status === "Partially paid").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Not paid")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "Not paid" ? "bg-rose-600 text-white shadow-2xs" : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"}`}
          >
            Unpaid ({invoices.filter(i => i.status === "Not paid" || i.status === "Payment Pending").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overdue")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === "overdue" ? "bg-rose-700 text-white shadow-2xs" : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"}`}
          >
            <span>Overdue</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === "overdue" ? "bg-white text-rose-800" : "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-200"}`}>
              {overdueCount}
            </span>
          </button>
        </div>

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
                      Exact Due ({paymentModalInvoice.due})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTypeOption("part")
                        const dueNum = parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0
                        if (customPartPaymentAmount === 0) setCustomPartPaymentAmount(dueNum)
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        paymentTypeOption === "part"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      Custom / Overpayment Amount
                    </button>
                  </div>
                </div>

                {paymentTypeOption === "part" && (
                  <div className="space-y-1.5">
                    <label className="block text-zinc-500 font-medium">Amount Paid Now (₹) *</label>
                    <input
                      type="number"
                      min={1}
                      value={customPartPaymentAmount || ""}
                      onChange={(e) => setCustomPartPaymentAmount(Number(e.target.value))}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                    />

                    {/* Overpayment banner */}
                    {customPartPaymentAmount > (parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0) && (
                      <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 flex items-start gap-2">
                        <span className="text-teal-600 font-bold text-base leading-none">💰</span>
                        <div>
                          <span className="font-bold">
                            Overpayment of ₹{(customPartPaymentAmount - (parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0)).toLocaleString("en-IN")} detected!
                          </span>
                          <p className="text-[10px] text-teal-700 dark:text-teal-400 mt-0.5">
                            This invoice will be marked Fully Paid, and the excess ₹{(customPartPaymentAmount - (parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0)).toLocaleString("en-IN")} will be automatically added as a Credit Note for {paymentModalInvoice.client}.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      {[0.25, 0.5, 0.75, 1.0].map((pct) => {
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
                  {paymentTypeOption === "part" && customPartPaymentAmount > (parseInt(paymentModalInvoice.due.replace(/[^0-9]/g, "")) || 0)
                    ? "Confirm Settlement & Issue Credit Note"
                    : paymentTypeOption === "part"
                      ? "Record Partial Payment"
                      : "Confirm Full Settlement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ── CLIENT PROJECT & INVOICE BUILDER (LINKED) ── */}
      <AddClientProjectModal
        isOpen={isAddClientProjectModalOpen}
        client={null}
        initialMode="project_and_invoice"
        onClose={() => setIsAddClientProjectModalOpen(false)}
        onProjectCreated={loadInvoices}
        onInvoiceCreated={(inv) => {
          setIsAddClientProjectModalOpen(false)
          setSelectedInvoice(inv)
          setIsInvoiceModalOpen(true)
          loadInvoices()
        }}
      />

      {/* ── INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (INVOICE ADD) ── */}
      <DocumentStudioModal
        isOpen={isAddModalOpen}
        mode="invoice"
        initialData={addModalInitialData}
        isMarketingMode={isMarketingInvoiceMode}
        onClose={() => {
          setIsAddModalOpen(false)
          setAddModalInitialData(null)
          setIsMarketingInvoiceMode(false)
        }}
        onSaveSuccess={(inv) => {
          setIsAddModalOpen(false)
          setAddModalInitialData(null)
          setIsMarketingInvoiceMode(false)
          setSelectedInvoice(inv)
          setIsInvoiceModalOpen(true)
          loadInvoices()
        }}
      />

      {/* ── INTERACTIVE SPLIT-SCREEN DOCUMENT STUDIO (INVOICE EDIT) ── */}
      <DocumentStudioModal
        isOpen={isEditModalOpen}
        mode="invoice"
        initialData={editingInvoice}
        isMarketingMode={Boolean(editingInvoice?.category === "Digital Marketing" || editingInvoice?.primaryCategory === "Digital Marketing" || (editingInvoice as any)?.isMarketingRetainer || (editingInvoice as any)?.marketingPackage?.enabled)}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingInvoice(null)
        }}
        onSaveSuccess={(inv) => {
          setIsEditModalOpen(false)
          setEditingInvoice(null)
          setSelectedInvoice(inv)
          setIsInvoiceModalOpen(true)
          loadInvoices()
        }}
      />

      {/* ── CLIENT PAY NOW MODAL (UPI QR + MANDATORY UTR) ── */}
      <AnimatePresence>
        {clientPayNowInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-xs my-4"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Pay Invoice #{clientPayNowInvoice.id}</h3>
                    <p className="text-[11px] text-emerald-100 font-medium">Scan UPI QR &amp; Enter Transaction UTR</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClientPayNowInvoice(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Amount Due Card */}
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300 block">Total Due Amount</span>
                    <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">{clientPayNowInvoice.project || "Invoice Settlement"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      ₹{(parseCurrencyNumber(clientPayNowInvoice.due) || parseCurrencyNumber(clientPayNowInvoice.totalInvoiced)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* QR Code Container */}
                {(() => {
                  const activeCompObj = companies.find(c => c.id === clientPayNowInvoice.companyId || c.slug === clientPayNowInvoice.companyId) || companies[0]
                  const upiId = activeCompObj?.nongst_upi_id || activeCompObj?.gst_upi_id || activeCompObj?.upi_id || "saampark@sbi"
                  const upiHolder = activeCompObj?.brand_name || activeCompObj?.name || "SAAMPARK TECHNOLOGY"
                  const dueAmt = parseCurrencyNumber(clientPayNowInvoice.due) || parseCurrencyNumber(clientPayNowInvoice.totalInvoiced)
                  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiHolder)}&am=${dueAmt}&cu=INR&tn=Invoice%20${encodeURIComponent(clientPayNowInvoice.id)}`
                  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&ecc=M&data=${encodeURIComponent(upiString)}`

                  const handleCopy = (text: string, key: string) => {
                    navigator.clipboard.writeText(text)
                    setIsCopied(key)
                    setTimeout(() => setIsCopied(null), 2000)
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="bg-white p-2.5 rounded-xl shadow-xs border border-zinc-200 shrink-0">
                          <img
                            src={qrCodeUrl}
                            alt="Payment UPI QR"
                            className="w-36 h-36 object-contain rounded"
                          />
                        </div>
                        <div className="space-y-2 flex-1 text-left w-full">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                            <span>📲 Instant UPI Scan &amp; Pay</span>
                          </div>
                          <p className="text-[10.5px] text-zinc-500 leading-snug">
                            Scan with Google Pay, PhonePe, Paytm, BHIM, Cred or any banking UPI app.
                          </p>
                          <div className="pt-1">
                            <span className="text-[10px] text-zinc-400 font-bold block">Verified Merchant UPI ID:</span>
                            <div className="flex items-center justify-between gap-1 mt-0.5 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                              <span>{upiId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(upiId, "upi")}
                                className="text-blue-600 hover:text-blue-700 p-0.5 cursor-pointer"
                                title="Copy UPI ID"
                              >
                                {isCopied === "upi" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details Strip */}
                      {(activeCompObj?.gst_account_number || activeCompObj?.nongst_account_number || activeCompObj?.account_number) && (
                        <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px] space-y-1">
                          <div className="flex justify-between text-zinc-500">
                            <span>Bank Account:</span>
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              {activeCompObj.gst_account_number || activeCompObj.nongst_account_number || activeCompObj.account_number}
                            </span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>IFSC Code:</span>
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              {activeCompObj.gst_ifsc_code || activeCompObj.nongst_ifsc_code || activeCompObj.ifsc_code}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Form: Mandatory UTR */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!clientUtr.trim()) {
                      setClientPayError("UTR / Transaction Reference Number is mandatory to verify payment.")
                      return
                    }
                    setClientPayError(null)
                    setIsSubmittingProof(true)
                    try {
                      const dueAmt = parseCurrencyNumber(clientPayNowInvoice.due) || parseCurrencyNumber(clientPayNowInvoice.totalInvoiced)
                      await submitClientPaymentProof(
                        clientPayNowInvoice.id,
                        clientUtr.trim(),
                        dueAmt,
                        clientPayMethod,
                        clientPayNotes,
                        user?.name || clientPayNowInvoice.client
                      )
                      setToastMessage(`Payment proof with UTR ${clientUtr.trim()} submitted! Admin has been notified for verification.`)
                      setTimeout(() => setToastMessage(null), 5000)
                      setClientPayNowInvoice(null)
                      loadInvoices()
                    } catch (err: any) {
                      setClientPayError(err?.message || "Failed to submit payment proof.")
                    } finally {
                      setIsSubmittingProof(false)
                    }
                  }}
                  className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Transaction UTR / Reference No. (12 Digits) <span className="text-rose-600 font-black">* Mandatory</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 430291847192 (from GPay / PhonePe / Bank SMS)"
                      value={clientUtr}
                      onChange={(e) => {
                        setClientUtr(e.target.value)
                        if (clientPayError) setClientPayError(null)
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border-2 border-emerald-500/80 rounded-xl font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      📌 Enter the 12-digit UPI Transaction ID or Bank UTR shown in your payment confirmation screen.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Payment App / Channel
                      </label>
                      <select
                        value={clientPayMethod}
                        onChange={(e) => setClientPayMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-medium"
                      >
                        <option value="Google Pay">Google Pay (GPay)</option>
                        <option value="PhonePe">PhonePe</option>
                        <option value="Paytm">Paytm UPI</option>
                        <option value="BHIM UPI">BHIM UPI</option>
                        <option value="Bank IMPS/NEFT">Bank IMPS / NEFT / RTGS</option>
                        <option value="Other UPI">Other UPI App</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Remarks / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid from HDFC account"
                        value={clientPayNotes}
                        onChange={(e) => setClientPayNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {clientPayError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{clientPayError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setClientPayNowInvoice(null)}
                      className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProof || !clientUtr.trim()}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingProof ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Proof...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Submit UTR &amp; Payment Proof</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADMIN VERIFY UTR & CONFIRM PAYMENT MODAL ── */}
      <AnimatePresence>
        {verifyingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-xs my-4"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Verify Payment UTR</h3>
                    <p className="text-[11px] text-purple-100 font-medium">Invoice #{verifyingInvoice.id} • {verifyingInvoice.client}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyingInvoice(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* UTR Showcase Card */}
                <div className="p-4 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-purple-900 dark:text-purple-300">
                      Submitted Transaction UTR Number:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (verifyingInvoice.paymentProofUtr) {
                          navigator.clipboard.writeText(verifyingInvoice.paymentProofUtr)
                          setToastMessage("UTR copied to clipboard!")
                          setTimeout(() => setToastMessage(null), 2000)
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-300"
                    >
                      <Copy size={11} /> Copy UTR
                    </button>
                  </div>
                  <div className="font-mono text-base font-black text-purple-950 dark:text-purple-100 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 tracking-wider">
                    {verifyingInvoice.paymentProofUtr || "No UTR Entered"}
                  </div>
                </div>

                {/* Proof Details Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Client / Payer</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{verifyingInvoice.paymentProofSubmittedBy || verifyingInvoice.client}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Claimed Amount</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                      ₹{(verifyingInvoice.paymentProofAmount || parseCurrencyNumber(verifyingInvoice.due)).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Payment Method</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{verifyingInvoice.paymentProofMethod || "UPI"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Submitted Date &amp; Time</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[10.5px]">
                      {verifyingInvoice.paymentProofDate ? formatDisplayDate(verifyingInvoice.paymentProofDate) : "Recent"}
                    </span>
                  </div>
                  {verifyingInvoice.paymentProofNotes && (
                    <div className="col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="text-zinc-400 block text-[10px]">Client Remarks</span>
                      <span className="text-zinc-700 dark:text-zinc-300 italic">"{verifyingInvoice.paymentProofNotes}"</span>
                    </div>
                  )}
                </div>

                {/* Admin Verification Decision */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Admin Notes / Rejection Reason (if rejecting)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR verified in bank statement / UTR not found"
                    value={adminVerifyNotes}
                    onChange={(e) => setAdminVerifyNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={isVerifyingProof}
                    onClick={async () => {
                      if (!confirm("Are you sure you want to reject this payment proof? Invoice will return to Not Paid status.")) return
                      setIsVerifyingProof(true)
                      try {
                        await verifyAndConfirmPayment(verifyingInvoice.id, false, adminVerifyNotes)
                        setToastMessage(`Payment proof for #${verifyingInvoice.id} was rejected.`)
                        setTimeout(() => setToastMessage(null), 4000)
                        setVerifyingInvoice(null)
                        loadInvoices()
                      } catch (err: any) {
                        alert(err?.message || "Error rejecting proof.")
                      } finally {
                        setIsVerifyingProof(false)
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl cursor-pointer"
                  >
                    ✕ Reject / Invalid UTR
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingProof}
                    onClick={async () => {
                      setIsVerifyingProof(true)
                      try {
                        await verifyAndConfirmPayment(verifyingInvoice.id, true, adminVerifyNotes)
                        setToastMessage(`Payment for #${verifyingInvoice.id} verified and confirmed successfully!`)
                        setTimeout(() => setToastMessage(null), 4000)
                        setVerifyingInvoice(null)
                        loadInvoices()
                      } catch (err: any) {
                        alert(err?.message || "Error confirming payment.")
                      } finally {
                        setIsVerifyingProof(false)
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isVerifyingProof ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>✓ Confirm &amp; Mark Paid</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
