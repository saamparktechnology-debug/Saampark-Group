"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Check, DollarSign, Calculator, UserCheck, Users, Calendar, Briefcase, FileText, 
  Coins, RefreshCw, Layers, CreditCard, Building2, Mail, Phone, MapPin, 
  Plus, Trash2, Tag, ChevronDown, ChevronUp, Sparkles, Search, Receipt,
  ShieldCheck, AlertCircle, Eye, UploadCloud, Edit3, Landmark, QrCode, Award
} from "lucide-react"

import { useAuthStore, Company, Branch, SubBranch, getCompanyLogoUrl, getCanonicalCompanyId } from "@/store/useAuthStore"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { 
  InvoiceItem, 
  InvoiceLineItem, 
  AppliedDiscount,
  AssignedMemberAttribution,
  addInvoice, 
  updateInvoice, 
  generateInvoiceNumber 
} from "@/app/feature/sales/invoices/services/invoiceService"
import { UserService } from "@/services/apiServices"
import { QuotationService, EstimateService } from "@/services/salesService"
import { CustomTextStamp, numberToIndianWords } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ImageUploadField } from "@/components/ui/ImageUploadField"

export interface DocumentStudioModalProps {
  isOpen: boolean
  mode?: "invoice" | "quotation" | "estimate"
  initialData?: any
  prefilledClient?: ClientItem | null
  onClose: () => void
  onSaveSuccess?: (savedData: any) => void
}

const SERVICE_PRESETS = [
  { name: "Website Development", sac: "998313", gst: 18, unit: "Project", rate: 25000 },
  { name: "Custom Software Application", sac: "998314", gst: 18, unit: "Project", rate: 45000 },
  { name: "Android / iOS Mobile App", sac: "998314", gst: 18, unit: "Project", rate: 55000 },
  { name: "Cloud Infrastructure & Hosting", sac: "998315", gst: 18, unit: "Month", rate: 3500 },
  { name: "UI/UX & Brand Identity", sac: "998312", gst: 18, unit: "Design", rate: 15000 },
  { name: "Digital Marketing & SEO Management", sac: "998311", gst: 18, unit: "Month", rate: 12000 },
  { name: "Printing & Media Collateral", sac: "998912", gst: 12, unit: "Job", rate: 8000 },
  { name: "General Consulting (Non-GST)", sac: "998319", gst: 0, unit: "Nos", rate: 10000 },
]

export function DocumentStudioModal({
  isOpen,
  mode = "invoice",
  initialData,
  prefilledClient,
  onClose,
  onSaveSuccess,
}: DocumentStudioModalProps) {
  const { 
    user, 
    companies, 
    branches, 
    subBranches, 
    activeCompanyId, 
    activeBranchId,
    fetchCompanies,
    fetchBranches,
    fetchSubBranches
  } = useAuthStore()

  // 1. Core Document Setup
  const [docScheme, setDocScheme] = React.useState<"gst" | "nongst">("gst")
  const [companyId, setCompanyId] = React.useState<string>(activeCompanyId || "tech")
  const [branchId, setBranchId] = React.useState<string>(activeBranchId || "")
  const [subBranchId, setSubBranchId] = React.useState<string>("")

  // Active Tab: entity, client, items, bank, terms
  const [activeTab, setActiveTab] = React.useState<"entity" | "client" | "items" | "bank" | "terms">("entity")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resolve selected company & issuing branch
  const activeCompany = React.useMemo(() => {
    const canonTarget = getCanonicalCompanyId(companyId || activeCompanyId || "tech")
    return companies.find(c => {
      const canonC = getCanonicalCompanyId(c.id || c.slug)
      return (canonTarget && canonC && canonTarget === canonC) || c.id === companyId || c.slug === companyId
    }) || companies[0]
  }, [companies, companyId, activeCompanyId])

  const companyBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return []
    const canonTarget = getCanonicalCompanyId(companyId || activeCompanyId || "tech")
    const filtered = branches.filter(b => {
      const bComp = String((b as any).companyId || (b as any).company_id || "").toLowerCase().trim()
      const canonB = getCanonicalCompanyId(bComp)
      if (canonTarget && canonB) return canonTarget === canonB
      return bComp === canonTarget || (!bComp && canonTarget === "tech")
    })
    return filtered.length > 0 ? filtered : branches
  }, [branches, companyId, activeCompanyId])

  const branchSubBranches = React.useMemo(() => {
    return subBranches.filter(sb => String((sb as any).branch_id || (sb as any).branchId || (sb as any).parentBranchId) === String(branchId))
  }, [subBranches, branchId])

  // Multiple Team Member Attribution State
  const [availableTeamMembers, setAvailableTeamMembers] = React.useState<any[]>([])
  const [assignedMembers, setAssignedMembers] = React.useState<AssignedMemberAttribution[]>(() => {
    if (initialData?.assignedMembers && Array.isArray(initialData.assignedMembers) && initialData.assignedMembers.length > 0) {
      return initialData.assignedMembers
    }
    if (initialData?.assignedMemberId) {
      return [{
        memberId: initialData.assignedMemberId,
        memberName: initialData.assignedMemberName || "Team Member",
        memberRole: initialData.assignedMemberRole || "Team Member",
        memberAvatar: initialData.assignedMemberAvatar,
        payoutType: initialData.memberPayoutType || "percentage",
        payoutValue: initialData.memberPayoutValue !== undefined ? initialData.memberPayoutValue : (initialData.memberSharePct !== undefined ? initialData.memberSharePct : 50),
      }]
    }
    return []
  })

  const handleAddAssignedMember = () => {
    const unassigned = availableTeamMembers.find(m => !assignedMembers.some(am => String(am.memberId) === String(m.id))) || availableTeamMembers[0]
    if (!unassigned) return
    setAssignedMembers(prev => [
      ...prev,
      {
        memberId: String(unassigned.id),
        memberName: unassigned.name,
        memberRole: unassigned.role,
        memberAvatar: unassigned.avatar,
        payoutType: "percentage",
        payoutValue: prev.length === 0 ? 50 : 25,
      }
    ])
  }

  const handleUpdateAssignedMember = (index: number, field: keyof AssignedMemberAttribution, value: any) => {
    setAssignedMembers(prev => prev.map((m, idx) => {
      if (idx !== index) return m
      if (field === "memberId") {
        const matched = availableTeamMembers.find(tm => String(tm.id) === String(value))
        return {
          ...m,
          memberId: String(value),
          memberName: matched?.name || m.memberName,
          memberRole: matched?.role || m.memberRole,
          memberAvatar: matched?.avatar || m.memberAvatar,
        }
      }
      return { ...m, [field]: value }
    }))
  }

  const handleRemoveAssignedMember = (index: number) => {
    setAssignedMembers(prev => prev.filter((_, idx) => idx !== index))
  }

  // 2. Client Setup
  const [allClients, setAllClients] = React.useState<ClientItem[]>([])
  const [clientMode, setClientMode] = React.useState<"select" | "custom">("select")
  const [selectedClient, setSelectedClient] = React.useState<ClientItem | null>(prefilledClient || null)
  const [clientSearchQuery, setClientSearchQuery] = React.useState("")
  const [isClientSearchOpen, setIsClientSearchOpen] = React.useState(false)

  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [clientAddress, setClientAddress] = React.useState("")
  const [clientCity, setClientCity] = React.useState("")
  const [clientState, setClientState] = React.useState("")
  const [clientGst, setClientGst] = React.useState("")

  // 3. Document Identification
  const [docNumber, setDocNumber] = React.useState("")
  const [issueDate, setIssueDate] = React.useState<string>(() => {
    if (initialData?.invoiceDate) {
      const s = String(initialData.invoiceDate).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    }
    if (initialData?.billDate) {
      const s = String(initialData.billDate).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    }
    return new Date().toISOString().split("T")[0]
  })
  const [dueDate, setDueDate] = React.useState(() => {
    if (initialData?.dueDate) {
      const s = String(initialData.dueDate).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    }
    const d = new Date()
    d.setDate(d.getDate() + 15)
    return d.toISOString().split("T")[0]
  })
  const [projectTitle, setProjectTitle] = React.useState("Custom Solution Project")

  // 4. Line Items
  const [items, setItems] = React.useState<InvoiceLineItem[]>([
    {
      id: `item_${Date.now()}`,
      serviceName: "Custom Enterprise Consulting & Development",
      sacCode: "998313",
      qty: 1,
      unit: "Project",
      rate: 15000,
      gstRate: 18,
      gstAmount: 2700,
      charges: [],
      totalAmount: 17700
    }
  ])

  // 5. Financial adjustments
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = React.useState<number | "">("")
  const [setupCharge, setSetupCharge] = React.useState<number | "">("")
  const [notes, setNotes] = React.useState(
    mode === "invoice" 
      ? "Thank you for partnering with Saampark. Please make payment to our verified bank account or UPI QR code."
      : "Quotation valid for 30 calendar days from issue. 50% mobilization advance required."
  )
  const [terms, setTerms] = React.useState(
    "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days."
  )

  // 6. Dual Banking & QR Profile Binding
  const [bankProfile, setBankProfile] = React.useState<"gst" | "nongst" | "custom">("gst")
  const [bankNameOverride, setBankNameOverride] = React.useState("")
  const [accountHolderOverride, setAccountHolderOverride] = React.useState("")
  const [accountNumberOverride, setAccountNumberOverride] = React.useState("")
  const [ifscCodeOverride, setIfscCodeOverride] = React.useState("")
  const [bankBranchOverride, setBankBranchOverride] = React.useState("")
  const [upiIdOverride, setUpiIdOverride] = React.useState("")
  const [paymentQrUrlOverride, setPaymentQrUrlOverride] = React.useState("")

  // Signatory & Stamp
  const [signatoryName, setSignatoryName] = React.useState("Authorized Signatory")
  const [signatoryDesignation, setSignatoryDesignation] = React.useState("Managing Director")
  const [signatureUrlOverride, setSignatureUrlOverride] = React.useState("")
  const [stampUrlOverride, setStampUrlOverride] = React.useState("")

  // Load clients, branches, team members & initialize default company & document numbers
  React.useEffect(() => {
    if (isOpen) {
      fetchCompanies?.()
      fetchBranches?.()
      fetchSubBranches?.()

      UserService.getTeamMembers().then(users => {
        if (Array.isArray(users)) {
          const nonClients = users.filter((u: any) => !((u.role || u.role_name || "").toLowerCase().includes("client")))
          setAvailableTeamMembers(nonClients.map((u: any) => ({
            ...u,
            name: u.name || u.full_name || u.fullName || u.username || u.email || "Team Member",
            role: u.role || u.role_name || u.roleName || "Team Member"
          })))
        }
      }).catch(() => {})

      getClients("all").then(cl => {
        setAllClients(cl)
        if (prefilledClient) {
          handleSelectClient(prefilledClient)
        } else if (cl.length > 0 && !selectedClient) {
          handleSelectClient(cl[0])
        }
      }).catch(() => {})

      if (!docNumber) {
        generateDocNumber("gst")
      }
    }
  }, [isOpen, prefilledClient])

  // Sync bank details when company or docScheme changes
  React.useEffect(() => {
    if (!activeCompany) return
    const isGst = docScheme === "gst"
    setBankProfile(isGst ? "gst" : "nongst")
    
    if (isGst) {
      setBankNameOverride(activeCompany.gst_bank_name || activeCompany.bank_name || "")
      setAccountHolderOverride(activeCompany.gst_account_holder || activeCompany.account_holder || "")
      setAccountNumberOverride(activeCompany.gst_account_number || activeCompany.account_number || "")
      setIfscCodeOverride(activeCompany.gst_ifsc_code || activeCompany.ifsc_code || "")
      setBankBranchOverride(activeCompany.gst_bank_branch || activeCompany.bank_branch || "")
      setUpiIdOverride(activeCompany.gst_upi_id || activeCompany.upi_id || "")
      setPaymentQrUrlOverride(activeCompany.gst_payment_qr_url || activeCompany.payment_qr_url || "")
    } else {
      setBankNameOverride(activeCompany.nongst_bank_name || activeCompany.bank_name || "")
      setAccountHolderOverride(activeCompany.nongst_account_holder || activeCompany.account_holder || "")
      setAccountNumberOverride(activeCompany.nongst_account_number || activeCompany.account_number || "")
      setIfscCodeOverride(activeCompany.nongst_ifsc_code || activeCompany.ifsc_code || "")
      setBankBranchOverride(activeCompany.nongst_bank_branch || activeCompany.bank_branch || "")
      setUpiIdOverride(activeCompany.nongst_upi_id || activeCompany.upi_id || "")
      setPaymentQrUrlOverride(activeCompany.nongst_payment_qr_url || activeCompany.payment_qr_url || "")
    }

    setSignatoryName(activeCompany.signatory_name || "Authorized Signatory")
    setSignatoryDesignation(activeCompany.signatory_designation || "Managing Director")
    setSignatureUrlOverride(activeCompany.signature_image_url || "")
    setStampUrlOverride(activeCompany.stamp_image_url || "")
  }, [activeCompany, docScheme])

  // Generate document number
  const generateDocNumber = (scheme: "gst" | "nongst", targetDate?: string) => {
    const rawD = targetDate || issueDate
    const d = rawD ? new Date(rawD) : new Date()
    const validD = isNaN(d.getTime()) ? new Date() : d
    const datePart = `${String(validD.getDate()).padStart(2, "0")}${String(validD.getMonth() + 1).padStart(2, "0")}${validD.getFullYear()}`
    const randPart = Math.floor(1000 + Math.random() * 9000)
    
    let prefix = "INV"
    if (mode === "quotation") prefix = "QT"
    else if (mode === "estimate") prefix = "EST"
    else if (scheme === "nongst") prefix = "NGINV"
    
    setDocNumber(`${prefix}-${datePart}-${randPart}`)
  }

  const handleSchemeChange = (scheme: "gst" | "nongst") => {
    setDocScheme(scheme)
    generateDocNumber(scheme)
    setItems(prev => prev.map(it => ({
      ...it,
      gstRate: scheme === "gst" ? 18 : 0,
      totalAmount: scheme === "gst" ? Math.round((it.rate * (it.qty || 1)) * 1.18) : (it.rate * (it.qty || 1))
    })))
  }

  const handleSelectClient = (c: ClientItem) => {
    setSelectedClient(c)
    setClientName(c.name || "")
    setClientEmail(c.email || "")
    setClientPhone(c.phone || "")
    setClientAddress(c.address || "")
    setClientCity(c.city || "")
    setClientState(c.state || "")
    setClientGst(c.gstNumber || c.vatNumber || "")
    setIsClientSearchOpen(false)
  }

  // Add line item
  const handleAddItem = (preset?: typeof SERVICE_PRESETS[0]) => {
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      serviceName: preset?.name || "",
      sacCode: preset?.sac || (docScheme === "gst" ? "998313" : ""),
      qty: 1,
      unit: preset?.unit || "Project",
      rate: preset?.rate || 10000,
      gstRate: docScheme === "gst" ? (preset?.gst !== undefined ? preset.gst : 18) : 0,
      gstAmount: 0,
      charges: [],
      totalAmount: 0
    }
    const base = newItem.rate * newItem.qty
    const tax = Math.round(base * (newItem.gstRate / 100))
    newItem.gstAmount = tax
    newItem.totalAmount = base + tax
    setItems(prev => [...prev, newItem])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof InvoiceLineItem, val: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      const updated = { ...it, [field]: val }
      const rate = typeof updated.rate === "number" ? updated.rate : 0
      const qty = updated.qty > 0 ? updated.qty : 1
      const base = rate * qty
      const gst = docScheme === "gst" ? (typeof updated.gstRate === "number" ? updated.gstRate : 18) : 0
      updated.totalAmount = base + Math.round(base * (gst / 100))
      return updated
    }))
  }

  // Financial Calculations
  const calculatedSubtotal = React.useMemo(() => {
    return items.reduce((sum, it) => sum + ((it.rate || 0) * (it.qty || 1)), 0)
  }, [items])

  const calculatedDiscount = React.useMemo(() => {
    if (!discountValue || Number(discountValue) <= 0) return 0
    if (discountType === "percentage") {
      return Math.round(calculatedSubtotal * (Number(discountValue) / 100))
    }
    return Number(discountValue)
  }, [calculatedSubtotal, discountType, discountValue])

  const numSetupCharge = Number(setupCharge) || 0
  const taxableBase = Math.max(0, calculatedSubtotal - calculatedDiscount + numSetupCharge)

  const calculatedGst = React.useMemo(() => {
    if (docScheme === "nongst") return 0
    return items.reduce((sum, it) => {
      const base = (it.rate || 0) * (it.qty || 1)
      const rate = it.gstRate !== undefined ? it.gstRate : 18
      return sum + Math.round(base * (rate / 100))
    }, 0)
  }, [items, docScheme])

  const grandTotal = taxableBase + calculatedGst

  // Save Document handler
  const handleSaveDocument = async () => {
    if (!clientName.trim() && !selectedClient?.name) {
      alert("Please specify a client name.")
      return
    }
    if (items.length === 0 || !items[0].serviceName.trim()) {
      alert("Please add at least one line item with a service description.")
      return
    }

    setIsSubmitting(true)
    try {
      const finalDocPayload: any = {
        id: docNumber,
        invoiceNumber: docNumber,
        number: docNumber,
        client: String(clientName || selectedClient?.name || "Client"),
        clientEmail: clientEmail || selectedClient?.email,
        clientPhone: clientPhone || selectedClient?.phone,
        clientAddress: clientAddress || selectedClient?.address,
        clientCity: clientCity || selectedClient?.city,
        clientState: clientState || selectedClient?.state,
        clientGstin: clientGst || selectedClient?.gstNumber,
        project: projectTitle,
        billDate: issueDate,
        invoiceDate: issueDate,
        date: issueDate,
        dueDate: dueDate,
        validTill: dueDate,
        baseAmount: taxableBase,
        subtotal: taxableBase,
        discount: calculatedDiscount,
        setupCharge: numSetupCharge,
        gstRate: docScheme === "gst" ? 18 : 0,
        gstAmount: calculatedGst,
        tax: calculatedGst,
        totalInvoiced: `₹${grandTotal.toLocaleString("en-IN")}`,
        total: grandTotal,
        paymentReceived: "₹0",
        due: grandTotal,
        status: "Draft",
        companyId: companyId,
        branchId: branchId || undefined,
        subBranchId: subBranchId || undefined,
        companyDetails: activeCompany,
        items: items,
        notes: notes,
        terms: terms,
        assignedMembers: assignedMembers.length > 0 ? assignedMembers : undefined,
        assignedMemberId: assignedMembers.length > 0 ? assignedMembers[0].memberId : undefined,
        assignedMemberName: assignedMembers.length > 0 ? assignedMembers[0].memberName : undefined,
        assignedMemberRole: assignedMembers.length > 0 ? assignedMembers[0].memberRole : undefined,
        memberPayoutType: assignedMembers.length > 0 ? assignedMembers[0].payoutType : undefined,
        memberPayoutValue: assignedMembers.length > 0 ? assignedMembers[0].payoutValue : undefined,
        overrideBankDetails: {
          bankName: bankNameOverride,
          accountHolder: accountHolderOverride,
          accountNumber: accountNumberOverride,
          ifscCode: ifscCodeOverride,
          bankBranch: bankBranchOverride,
          upiId: upiIdOverride,
          paymentQrUrl: paymentQrUrlOverride,
        },
        signatory_name: signatoryName,
        signatory_designation: signatoryDesignation,
        overrideSignatureUrl: signatureUrlOverride || undefined,
        overrideStampUrl: stampUrlOverride || undefined,
      }

      if (mode === "invoice") {
        let saved
        if (initialData?.id) {
          saved = await updateInvoice(finalDocPayload)
        } else {
          saved = await addInvoice(finalDocPayload)
        }
        onSaveSuccess?.(saved || finalDocPayload)
      } else if (mode === "quotation") {
        const quotationPayload = {
          number: docNumber,
          customer: String(clientName || selectedClient?.name || "Client"),
          customerEmail: clientEmail,
          customerPhone: clientPhone,
          customerAddress: clientAddress,
          clientGstin: clientGst,
          date: issueDate,
          validTill: dueDate,
          notes: notes,
          terms: terms,
          subtotal: taxableBase,
          tax: calculatedGst,
          total: grandTotal,
          status: "Draft",
          companyId: companyId,
          branchId: branchId,
          subBranchId: subBranchId,
          items: items.map(it => ({
            id: it.id,
            name: it.serviceName,
            sac: it.sacCode,
            quantity: it.qty,
            unitPrice: it.rate,
            total: it.totalAmount || (it.rate * it.qty)
          }))
        }
        const saved = await QuotationService.create(quotationPayload)
        onSaveSuccess?.(saved || quotationPayload)
      } else if (mode === "estimate") {
        const estimatePayload = {
          number: docNumber,
          customer: String(clientName || selectedClient?.name || "Client"),
          customerEmail: clientEmail,
          customerPhone: clientPhone,
          customerAddress: clientAddress,
          clientGstin: clientGst,
          date: issueDate,
          validTill: dueDate,
          notes: notes,
          terms: terms,
          subtotal: taxableBase,
          tax: calculatedGst,
          total: grandTotal,
          status: "Draft",
          companyId: companyId,
          branchId: branchId,
          subBranchId: subBranchId,
          items: items.map(it => ({
            id: it.id,
            name: it.serviceName,
            sac: it.sacCode,
            quantity: it.qty,
            unitPrice: it.rate,
            total: it.totalAmount || (it.rate * it.qty)
          }))
        }
        const saved = await EstimateService.create(estimatePayload)
        onSaveSuccess?.(saved || estimatePayload)
      }
      onClose()
    } catch (err: any) {
      console.error("Save Document error:", err)
      alert("Error saving document: " + (err?.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modalTitle = mode === "invoice" 
    ? (docScheme === "gst" ? "Create Official GST Tax Invoice" : "Create Commercial Non-GST Invoice")
    : mode === "quotation"
    ? "Create Commercial Quotation & Tender"
    : "Create Project Cost Estimate"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-xs"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/80 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${docScheme === "gst" ? "bg-teal-600 text-white" : "bg-sky-600 text-white"} shadow-md`}>
              {mode === "invoice" ? <Receipt size={18} /> : mode === "quotation" ? <FileText size={18} /> : <Calculator size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{modalTitle}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  docScheme === "gst" ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                }`}>
                  {docScheme === "gst" ? "GST 18%" : "Non-GST 0%"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono font-bold mt-0.5">
                Ref: {docNumber} • {activeCompany?.brand_name || activeCompany?.name}
              </p>
            </div>
          </div>

          {/* Quick Live Totals Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none">Subtotal</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">₹{taxableBase.toLocaleString("en-IN")}</span>
              </div>
              {docScheme === "gst" && (
                <div>
                  <span className="text-[10px] text-zinc-400 block leading-none">GST Tax</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">+₹{calculatedGst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-l border-zinc-200 dark:border-zinc-700 pl-3">
                <span className="text-[10px] text-zinc-400 block leading-none font-bold">Grand Total</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={onClose} 
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 5-STEP TAB NAVIGATION ── */}
        <div className="grid grid-cols-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("entity")}
            className={`py-3 border-b-2 text-xs transition-all cursor-pointer ${
              activeTab === "entity" ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            1. Entity &amp; Attribution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("client")}
            className={`py-3 border-b-2 text-xs transition-all cursor-pointer ${
              activeTab === "client" ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            2. Client &amp; Dates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`py-3 border-b-2 text-xs transition-all cursor-pointer ${
              activeTab === "items" ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            3. Line Items &amp; Pricing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-3 border-b-2 text-xs transition-all cursor-pointer ${
              activeTab === "bank" ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            4. Bank &amp; Payment QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`py-3 border-b-2 text-xs transition-all cursor-pointer ${
              activeTab === "terms" ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            5. Notes &amp; Signatory
          </button>
        </div>

        {/* ── MODAL BODY: FULL WIDTH FORMS ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ════ TAB 1: ENTITY, TAX SCHEME & ATTRIBUTION ════ */}
          {activeTab === "entity" && (
            <div className="space-y-5">
              {/* GST vs Non-GST Tax Scheme Switcher */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Receipt size={15} className="text-teal-600" />
                    <span>Invoicing Tax Scheme &amp; GST Mode</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">Select whether to issue a GST Tax Document or Non-GST Document</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleSchemeChange("gst")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      docScheme === "gst" 
                        ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs" 
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${docScheme === "gst" ? "bg-teal-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">GST Tax Invoicing (Standard 18%)</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">Includes HSN/SAC codes, CGST/SGST/IGST breakdown, and Company GSTIN on the bill.</div>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSchemeChange("nongst")}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      docScheme === "nongst" 
                        ? "border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 shadow-xs" 
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${docScheme === "nongst" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                      <Receipt size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">Non-GST / Commercial Billing (0% Tax)</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">No tax added to the line items. Uses Non-GST banking and payment details.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Branch Hierarchy */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                  Issuing Entity &amp; Branch Location
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Company Entity *</label>
                    <select
                      value={companyId}
                      onChange={(e) => {
                        setCompanyId(e.target.value)
                        setBranchId("")
                        setSubBranchId("")
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Issuing Branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => {
                        setBranchId(e.target.value)
                        setSubBranchId("")
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
                    >
                      <option value="">🏢 Company HQ / Central Office</option>
                      {companyBranches.map(b => (
                        <option key={b.id} value={b.id}>📍 {b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Sub-Branch / Partner</label>
                    <select
                      value={subBranchId}
                      disabled={!branchId || branchSubBranches.length === 0}
                      onChange={(e) => setSubBranchId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium disabled:opacity-50"
                    >
                      <option value="">None (Direct Branch Billing)</option>
                      {branchSubBranches.map(sb => (
                        <option key={sb.id} value={sb.id}>🤝 {sb.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Team Member / Sales Attribution */}
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={15} className="text-indigo-600" />
                    <span className="font-extrabold text-indigo-900 dark:text-indigo-200 text-xs">
                      Assigned Team Members &amp; Commission Attribution
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAssignedMember}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> + Add Member
                  </button>
                </div>

                {assignedMembers.length === 0 ? (
                  <div className="py-4 text-center text-zinc-400 text-xs">
                    No team members assigned yet. Click "+ Add Member" to assign sales reps or engineers.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignedMembers.map((m, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/60 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Team Member</label>
                          <select
                            value={m.memberId}
                            onChange={(e) => handleUpdateAssignedMember(idx, "memberId", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold"
                          >
                            {availableTeamMembers.map(tm => (
                              <option key={tm.id} value={tm.id}>{tm.name} ({tm.role})</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Payout Mode</label>
                          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateAssignedMember(idx, "payoutType", "percentage")}
                              className={`flex-1 py-1 text-center font-bold ${m.payoutType === "percentage" ? "bg-indigo-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600"}`}
                            >
                              % Share
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateAssignedMember(idx, "payoutType", "fixed")}
                              className={`flex-1 py-1 text-center font-bold ${m.payoutType === "fixed" ? "bg-indigo-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600"}`}
                            >
                              ₹ Fixed
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">
                            {m.payoutType === "percentage" ? "Share Percentage (%)" : "Fixed Amount (₹)"}
                          </label>
                          <Input
                            type="number"
                            value={m.payoutValue}
                            onChange={(e) => handleUpdateAssignedMember(idx, "payoutValue", Number(e.target.value))}
                            placeholder={m.payoutType === "percentage" ? "30" : "5000"}
                            className="font-bold"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignedMember(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ TAB 2: CLIENT & METADATA ════ */}
          {activeTab === "client" && (
            <div className="space-y-5">
              {/* Client Selection */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <UserCheck size={15} className="text-teal-600" />
                    <span>Client / Organization Information</span>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setClientMode("select")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        clientMode === "select" ? "bg-teal-600 text-white shadow-xs" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      Select Existing Client
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClientMode("custom")
                        setSelectedClient(null)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        clientMode === "custom" ? "bg-teal-600 text-white shadow-xs" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      + New / Custom Client
                    </button>
                  </div>
                </div>

                {clientMode === "select" && (
                  <div className="relative">
                    <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Choose from CRM Clients ({allClients.length} Registered)
                    </label>
                    <div
                      onClick={() => setIsClientSearchOpen(!isClientSearchOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between cursor-pointer hover:border-teal-500"
                    >
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedClient ? `${selectedClient.name} (${selectedClient.email || selectedClient.phone || 'No contact'})` : "Click to select a client..."}
                      </span>
                      <ChevronDown size={16} className="text-zinc-400 shrink-0" />
                    </div>

                    {isClientSearchOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden p-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Search client by name, email, phone..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                          autoFocus
                        />
                        <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                          {allClients
                            .filter(c => !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                            .map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleSelectClient(c)}
                                className="p-2.5 hover:bg-teal-50 dark:hover:bg-teal-950/30 cursor-pointer rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                                  <div className="text-[10.5px] text-zinc-400">{c.email || c.phone || "No contact"}</div>
                                </div>
                                <span className="text-[10.5px] text-teal-600 font-bold">Select</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Client Editable Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client / Organization Name *</label>
                    <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client Email</label>
                    <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@company.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client Phone</label>
                    <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client GSTIN</label>
                    <Input value={clientGst} onChange={e => setClientGst(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="19AAAAA0000A1Z5" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Billing Street Address</label>
                    <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Full street address..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">City</label>
                    <Input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">State</label>
                    <Input value={clientState} onChange={e => setClientState(e.target.value)} placeholder="State" />
                  </div>
                </div>
              </div>

              {/* Document Identification & Dates */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                  Document Number, Dates &amp; Project Reference
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Document Number *</label>
                    <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="font-mono font-bold" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Issue Date *</label>
                    <Input 
                      type="date" 
                      value={issueDate} 
                      onChange={e => {
                        setIssueDate(e.target.value)
                        generateDocNumber(docScheme, e.target.value)
                      }} 
                      className="font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Due Date / Valid Till</label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="font-medium" />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Project / Subject Reference</label>
                    <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. Enterprise Cloud ERP Implementation" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 3: LINE ITEMS & PRICING ════ */}
          {activeTab === "items" && (
            <div className="space-y-5">
              {/* Service Presets */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  ⚡ Quick Service Presets (Click to insert):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddItem(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/40 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + {preset.name} (₹{preset.rate.toLocaleString("en-IN")})
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Table / Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Line Items &amp; Services ({items.length})</span>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => {
                    const rowBase = (item.rate || 0) * (item.qty || 1)
                    const rowTax = docScheme === "gst" ? Math.round(rowBase * ((item.gstRate !== undefined ? item.gstRate : 18) / 100)) : 0
                    const rowTotal = rowBase + rowTax

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-zinc-800 dark:text-zinc-200 text-xs">#{index + 1} Line Item</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                              Row Total: ₹{rowTotal.toLocaleString("en-IN")} {docScheme === "gst" ? `(incl. ₹${rowTax} tax)` : ''}
                            </span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                title="Remove Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Service / Product Name *</label>
                            <Input
                              value={item.serviceName}
                              onChange={e => handleUpdateItem(item.id, "serviceName", e.target.value)}
                              placeholder="e.g. Website Development"
                              className="font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">SAC / HSN Code</label>
                            <Input
                              value={item.sacCode}
                              onChange={e => handleUpdateItem(item.id, "sacCode", e.target.value)}
                              placeholder="998313"
                              className="font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Quantity</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => handleUpdateItem(item.id, "qty", Math.max(1, Number(e.target.value)))}
                              className="font-bold"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Unit</label>
                            <Input
                              value={item.unit || "Project"}
                              onChange={e => handleUpdateItem(item.id, "unit", e.target.value)}
                              placeholder="Project / Nos / Hr"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Rate / Price (₹) *</label>
                            <Input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={e => handleUpdateItem(item.id, "rate", Math.max(0, Number(e.target.value)))}
                              placeholder="10000"
                              className="font-bold text-emerald-600"
                            />
                          </div>

                          {docScheme === "gst" && (
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">GST Rate (%)</label>
                              <select
                                value={item.gstRate !== undefined ? item.gstRate : 18}
                                onChange={e => handleUpdateItem(item.id, "gstRate", Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold"
                              >
                                <option value={0}>0% (Exempt)</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18% (Standard)</option>
                                <option value={28}>28%</option>
                              </select>
                            </div>
                          )}

                          <div className={docScheme === "gst" ? "sm:col-span-9" : "sm:col-span-12"}>
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Description / Deliverables Scope</label>
                            <Input
                              value={item.description || ""}
                              onChange={e => handleUpdateItem(item.id, "description", e.target.value)}
                              placeholder="Brief deliverables summary..."
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Financial Adjustments Card */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                  Financial Adjustments, Setup Charges &amp; Discounts
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Platform / Setup Fee (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={setupCharge}
                      onChange={e => setSetupCharge(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                      placeholder="e.g. 2000"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                    >
                      <option value="percentage">% Percentage Discount</option>
                      <option value="fixed">₹ Fixed Amount Discount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">
                      {discountType === "percentage" ? "Discount (%)" : "Discount Amount (₹)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                      placeholder={discountType === "percentage" ? "10" : "1500"}
                    />
                  </div>
                </div>

                {/* Final Calculation Summary */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                    <span>Subtotal Base Amount:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">₹{calculatedSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {numSetupCharge > 0 && (
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                      <span>Platform / Setup Fee:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">+₹{numSetupCharge.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {calculatedDiscount > 0 && (
                    <div className="flex items-center justify-between text-rose-600 text-xs">
                      <span>Discount Applied:</span>
                      <span className="font-mono font-bold">-₹{calculatedDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {docScheme === "gst" && (
                    <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 text-xs">
                      <span>GST (18% Statutory):</span>
                      <span className="font-mono font-bold">+₹{calculatedGst.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex items-center justify-between text-sm">
                    <span className="font-black text-zinc-900 dark:text-zinc-100">Grand Total Payable:</span>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium italic">
                    Amount in words: {numberToIndianWords(grandTotal)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 4: BANK, UPI & PAYMENT QR ════ */}
          {activeTab === "bank" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 space-y-3">
                <div className="flex items-center justify-between border-b border-teal-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Landmark size={16} className="text-teal-700" />
                    <span className="font-extrabold text-teal-900 dark:text-teal-200 text-xs">
                      Bank Account &amp; UPI Payment QR Code
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-bold">
                    {docScheme === "gst" ? "🏢 Linked with Company GST Bank Profile" : "📄 Linked with Company Non-GST Bank Profile"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Bank Name</label>
                    <Input value={bankNameOverride} onChange={e => setBankNameOverride(e.target.value)} placeholder="e.g. HDFC Bank Ltd" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Account Holder Name</label>
                    <Input value={accountHolderOverride} onChange={e => setAccountHolderOverride(e.target.value)} placeholder="A/C Holder Name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Account Number</label>
                    <Input value={accountNumberOverride} onChange={e => setAccountNumberOverride(e.target.value)} className="font-mono" placeholder="502000..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">IFSC Code</label>
                    <Input value={ifscCodeOverride} onChange={e => setIfscCodeOverride(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="HDFC0001234" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Bank Branch Location</label>
                    <Input value={bankBranchOverride} onChange={e => setBankBranchOverride(e.target.value)} placeholder="Branch location" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">UPI ID / VPA</label>
                    <Input value={upiIdOverride} onChange={e => setUpiIdOverride(e.target.value)} className="font-mono" placeholder="saampark@hdfcbank" />
                  </div>
                </div>

                <div className="pt-2">
                  <ImageUploadField
                    label="Payment QR Code Image URL / Upload"
                    value={paymentQrUrlOverride}
                    onChange={url => setPaymentQrUrlOverride(url)}
                    uploadNamePrefix="doc_payment_qr"
                    helperText="Scan-to-pay QR code displayed in the payment footer of this document."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 5: NOTES, TERMS & SIGNATORY ════ */}
          {activeTab === "terms" && (
            <div className="space-y-5">
              {/* Signatory Details */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                  Authorized Signatory &amp; Official Seal
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Signatory Name</label>
                    <Input value={signatoryName} onChange={e => setSignatoryName(e.target.value)} placeholder="Authorized Signatory Name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Designation</label>
                    <Input value={signatoryDesignation} onChange={e => setSignatoryDesignation(e.target.value)} placeholder="e.g. Managing Director" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <ImageUploadField
                    label="Authorized Signature Image"
                    value={signatureUrlOverride}
                    onChange={url => setSignatureUrlOverride(url)}
                    uploadNamePrefix="doc_sig_override"
                    aspectRatio="signature"
                    helperText="Upload official signature image."
                  />
                  <ImageUploadField
                    label="Official Company Seal / Stamp"
                    value={stampUrlOverride}
                    onChange={url => setStampUrlOverride(url)}
                    uploadNamePrefix="doc_stamp_override"
                    aspectRatio="square"
                    helperText="Upload official company seal."
                  />
                </div>
              </div>

              {/* Notes & Terms of Service */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                  Notes &amp; Terms of Service
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Notes to Customer</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Terms &amp; Conditions</label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 shrink-0">
          <div className="text-zinc-400 text-xs font-medium">
            Step {activeTab === "entity" ? "1" : activeTab === "client" ? "2" : activeTab === "items" ? "3" : activeTab === "bank" ? "4" : "5"} of 5
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            {activeTab !== "entity" && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<"entity" | "client" | "items" | "bank" | "terms"> = ["entity", "client", "items", "bank", "terms"]
                  const currIdx = tabs.indexOf(activeTab)
                  if (currIdx > 0) setActiveTab(tabs[currIdx - 1])
                }}
                className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                Previous Step
              </button>
            )}

            {activeTab !== "terms" ? (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<"entity" | "client" | "items" | "bank" | "terms"> = ["entity", "client", "items", "bank", "terms"]
                  const currIdx = tabs.indexOf(activeTab)
                  if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1])
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDocument}
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={15} />
                <span>{isSubmitting ? "Saving Document..." : (initialData?.id ? "Update Document" : "Save & Generate Document")}</span>
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  )
}
