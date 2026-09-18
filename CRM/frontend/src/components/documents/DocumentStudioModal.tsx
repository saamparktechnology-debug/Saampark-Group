"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Check, DollarSign, Calculator, UserCheck, Users, Calendar, Briefcase, FileText, 
  Coins, RefreshCw, Layers, CreditCard, Building2, Mail, Phone, MapPin, 
  Plus, Trash2, Tag, ChevronDown, ChevronUp, Sparkles, Search, Receipt,
  ZoomIn, ZoomOut, Maximize2, Move, Stamp, Printer, Download, ArrowRight,
  ShieldCheck, AlertCircle, Eye, UploadCloud, Edit3, Landmark, QrCode
} from "lucide-react"

import { useAuthStore, Company, Branch, SubBranch, getCompanyLogoUrl, getCanonicalCompanyId } from "@/store/useAuthStore"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { 
  InvoiceItem, 
  InvoiceLineItem, 
  AppliedDiscount,
  addInvoice, 
  updateInvoice, 
  generateInvoiceNumber 
} from "@/app/feature/sales/invoices/services/invoiceService"
import { UserService } from "@/services/apiServices"
import { QuotationService, EstimateService } from "@/services/salesService"
import { OfficialInvoiceDocument, CustomTextStamp } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"
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

const STAMP_PRESETS = [
  { text: "ORIGINAL FOR RECIPIENT", color: "#005f69" },
  { text: "TAX INVOICE", color: "#008a99" },
  { text: "OFFICIALLY APPROVED", color: "#16a34a" },
  { text: "CONFIDENTIAL", color: "#dc2626" },
  { text: "DUPLICATE FOR TRANSPORTER", color: "#0284c7" },
  { text: "SUBJECT TO KOLKATA JURISDICTION", color: "#4f46e5" },
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
    return subBranches.filter(sb => String((sb as any).branch_id || (sb as any).branchId) === String(branchId))
  }, [subBranches, branchId])

  // Team Member Attribution State
  const [availableTeamMembers, setAvailableTeamMembers] = React.useState<any[]>([])
  const [assignedMemberId, setAssignedMemberId] = React.useState<string>(initialData?.assignedMemberId || "")
  const [assignedMemberName, setAssignedMemberName] = React.useState<string>(initialData?.assignedMemberName || "")
  const [assignedMemberRole, setAssignedMemberRole] = React.useState<string>(initialData?.assignedMemberRole || "")
  const [memberPayoutType, setMemberPayoutType] = React.useState<"percentage" | "fixed">(initialData?.memberPayoutType || "percentage")
  const [memberPayoutValue, setMemberPayoutValue] = React.useState<number | "">(
    initialData?.memberPayoutValue !== undefined 
      ? initialData.memberPayoutValue 
      : (initialData?.memberSharePct !== undefined ? initialData.memberSharePct : 50)
  )

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
  const [issueDate, setIssueDate] = React.useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = React.useState(() => {
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

  // 7. Interactive Draggable Canvas Controls
  const [logoUrlOverride, setLogoUrlOverride] = React.useState("")
  const [signatureUrlOverride, setSignatureUrlOverride] = React.useState("")
  const [stampUrlOverride, setStampUrlOverride] = React.useState("")
  
  const [logoPosition, setLogoPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [signaturePosition, setSignaturePosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [customStamps, setCustomStamps] = React.useState<CustomTextStamp[]>([
    { id: "stamp_orig", text: "ORIGINAL FOR RECIPIENT", color: "#005f69", fontSize: 11, x: 10, y: 5 }
  ])

  // Custom text stamp creator
  const [newStampText, setNewStampText] = React.useState("")
  const [newStampColor, setNewStampColor] = React.useState("#005f69")
  const [newStampFontSize, setNewStampFontSize] = React.useState(11)

  // Canvas zoom
  const [canvasZoom, setCanvasZoom] = React.useState<number>(95)
  const [activeLeftTab, setActiveLeftTab] = React.useState<"entity" | "client" | "items" | "customization">("entity")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
  }, [activeCompany, docScheme])

  // Generate document number
  const generateDocNumber = (scheme: "gst" | "nongst") => {
    const d = new Date()
    const datePart = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`
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

  // Stamp operations
  const handleAddCustomStamp = () => {
    if (!newStampText.trim()) return
    const newStamp: CustomTextStamp = {
      id: `stamp_${Date.now()}`,
      text: newStampText.trim().toUpperCase(),
      color: newStampColor,
      fontSize: newStampFontSize,
      x: Math.floor(Math.random() * 40) - 20,
      y: Math.floor(Math.random() * 40) - 20
    }
    setCustomStamps(prev => [...prev, newStamp])
    setNewStampText("")
  }

  const handleRemoveCustomStamp = (id: string) => {
    setCustomStamps(prev => prev.filter(s => s.id !== id))
  }

  const handleResetPositions = () => {
    setLogoPosition({ x: 0, y: 0 })
    setSignaturePosition({ x: 0, y: 0 })
    setCustomStamps([
      { id: "stamp_orig", text: "ORIGINAL FOR RECIPIENT", color: "#005f69", fontSize: 11, x: 0, y: 0 }
    ])
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
    if (docScheme !== "gst") return 0
    return items.reduce((sum, it) => {
      const itBase = (it.rate || 0) * (it.qty || 1)
      const itGst = (it.gstRate !== undefined ? it.gstRate : 18) / 100
      return sum + Math.round(itBase * itGst)
    }, 0)
  }, [items, docScheme])

  const grandTotal = taxableBase + calculatedGst

  // Live Invoice object for preview
  const livePreviewInvoice: InvoiceItem = React.useMemo(() => {
    const curBranch = branches.find(b => b.id === branchId)
    const curSubBranch = subBranches.find(sb => sb.id === subBranchId)

    return {
      id: docNumber || "INV-PREVIEW",
      client: clientName || selectedClient?.name || "Sample Client Enterprise",
      clientEmail: clientEmail || selectedClient?.email || "client@example.com",
      clientPhone: clientPhone || selectedClient?.phone || "+91 98765 43210",
      clientAddress: clientAddress || selectedClient?.address || "123 Business Boulevard",
      clientCity: clientCity || selectedClient?.city || "Kolkata",
      clientState: clientState || selectedClient?.state || "West Bengal",
      clientGstin: clientGst || selectedClient?.gstNumber || selectedClient?.vatNumber || "",
      project: projectTitle || "Custom Solution Project",
      invoiceDate: issueDate,
      billDate: issueDate,
      dueDate: dueDate,
      totalInvoiced: `₹${grandTotal.toLocaleString("en-IN")}`,
      paymentReceived: "₹0",
      due: `₹${grandTotal.toLocaleString("en-IN")}`,
      status: "Not paid",
      invoiceType: docScheme,
      companyId: companyId,
      companyName: activeCompany?.brand_name || activeCompany?.name || "SAAMPARK",
      branchId: branchId || undefined,
      branchName: curBranch?.name || undefined,
      subBranchId: subBranchId || undefined,
      subBranchName: curSubBranch?.name || undefined,
      baseAmount: taxableBase,
      gstAmount: calculatedGst,
      gstRate: docScheme === "gst" ? 18 : 0,
      discount: calculatedDiscount,
      setupCharge: numSetupCharge,
      items: items,
      notes: notes,
      terms: terms,
      assignedMemberId: assignedMemberId || undefined,
      assignedMemberName: assignedMemberName || undefined,
      assignedMemberRole: assignedMemberRole || undefined,
      memberPayoutType: memberPayoutType,
      memberPayoutValue: typeof memberPayoutValue === "number" ? memberPayoutValue : undefined,
      memberSharePct: memberPayoutType === "percentage" ? (typeof memberPayoutValue === "number" ? memberPayoutValue : 50) : undefined,
      memberPayoutAmount: memberPayoutType === "fixed" ? (typeof memberPayoutValue === "number" ? memberPayoutValue : undefined) : undefined,
    }
  }, [
    docNumber, clientName, selectedClient, clientEmail, clientPhone, clientAddress,
    clientCity, clientState, clientGst, projectTitle, issueDate, dueDate, grandTotal,
    docScheme, companyId, activeCompany, branchId, subBranchId, branches, subBranches,
    taxableBase, calculatedGst, calculatedDiscount, numSetupCharge, items, notes, terms,
    assignedMemberId, assignedMemberName, assignedMemberRole, memberPayoutType, memberPayoutValue
  ])

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
      const finalDocPayload: InvoiceItem = {
        ...livePreviewInvoice,
        client: String(clientName || selectedClient?.name || "Client"),
        clientEmail: clientEmail || selectedClient?.email,
        clientPhone: clientPhone || selectedClient?.phone,
        clientAddress: clientAddress || selectedClient?.address,
        clientCity: clientCity || selectedClient?.city,
        clientState: clientState || selectedClient?.state,
        clientGstin: clientGst || selectedClient?.gstNumber,
        companyDetails: activeCompany,
        assignedMemberId: assignedMemberId || undefined,
        assignedMemberName: assignedMemberName || undefined,
        assignedMemberRole: assignedMemberRole || undefined,
        memberPayoutType: memberPayoutType,
        memberPayoutValue: typeof memberPayoutValue === "number" ? memberPayoutValue : undefined,
        memberSharePct: memberPayoutType === "percentage" ? (typeof memberPayoutValue === "number" ? memberPayoutValue : 50) : undefined,
        memberPayoutAmount: memberPayoutType === "fixed" ? (typeof memberPayoutValue === "number" ? memberPayoutValue : undefined) : undefined,
        overrideBankDetails: {
          bankName: bankNameOverride,
          accountHolder: accountHolderOverride,
          accountNumber: accountNumberOverride,
          ifscCode: ifscCodeOverride,
          bankBranch: bankBranchOverride,
          upiId: upiIdOverride,
          paymentQrUrl: paymentQrUrlOverride,
        },
        overrideLogoUrl: logoUrlOverride || undefined,
        overrideSignatureUrl: signatureUrlOverride || undefined,
        overrideStampUrl: stampUrlOverride || undefined,
        logoPosition,
        signaturePosition,
        customStamps,
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
          items: items
        }
        const saved = await EstimateService.create(estimatePayload)
        onSaveSuccess?.(saved || estimatePayload)
      }

      onClose()
    } catch (err: any) {
      console.error("Error saving in Document Studio:", err)
      alert(`Failed to save: ${err?.message || "Please check connection"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-[1700px] h-[95vh] flex flex-col bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ── TOP HEADER / TOOLBAR ────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Interactive Document Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200">
                  {mode === "invoice" ? "Invoice Engine" : mode === "quotation" ? "Quotation Engine" : "Estimate Engine"}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400">
                  [{docNumber || "DRAFT"}]
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 flex items-center gap-2">
                <span>Hold & drag logo, signature & badges on the live document preview</span>
                <span>•</span>
                <span className="text-teal-600 font-semibold">Dual GST & Non-GST Profile Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* GST vs Non-GST Selector in Top Header */}
            <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleSchemeChange("gst")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  docScheme === "gst"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <span>🏢 GST Bill (18%)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSchemeChange("nongst")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  docScheme === "nongst"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <span>📄 Non-GST (0%)</span>
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-9">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDocument} 
              disabled={isSubmitting} 
              className="text-xs font-bold h-9 bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-md cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save & Issue {mode === "invoice" ? "Invoice" : mode === "quotation" ? "Quotation" : "Estimate"}</span>
            </Button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── SPLIT MAIN BODY ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ════ LEFT PANEL: FORM INPUTS (48% WIDTH) ════ */}
          <div className="w-full lg:w-[46%] xl:w-[44%] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
            
            {/* Form Section Navigation Tabs */}
            <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center font-bold text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setActiveLeftTab("entity")}
                className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeLeftTab === "entity" 
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-zinc-900" 
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>🏢 Entity & Bank</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab("client")}
                className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeLeftTab === "client" 
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-zinc-900" 
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>👤 Client & Meta</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab("items")}
                className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeLeftTab === "items" 
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-zinc-900" 
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>📦 Line Items ({items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab("customization")}
                className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeLeftTab === "customization" 
                    ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-zinc-900" 
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>✨ Badges & Sign</span>
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              
              {/* ──────────────── TAB 1: ISSUING ENTITY & DUAL BANKING ──────────────── */}
              {activeLeftTab === "entity" && (
                <div className="space-y-4">
                  {/* Entity Selection */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Building2 size={14} className="text-teal-600" />
                        <span>Issuing Organization Scope</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-semibold">Auto-binds entity details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Company Entity *
                        </label>
                        <select
                          value={companyId}
                          onChange={(e) => {
                            setCompanyId(e.target.value)
                            setBranchId("")
                            setSubBranchId("")
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        >
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Operational Branch (Optional)
                        </label>
                        <select
                          value={branchId}
                          onChange={(e) => {
                            setBranchId(e.target.value)
                            setSubBranchId("")
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">Head Office / Default</option>
                          {companyBranches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {branchId && branchSubBranches.length > 0 && (
                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Partner Sub-Branch (Optional)
                        </label>
                        <select
                          value={subBranchId}
                          onChange={(e) => setSubBranchId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">None (Standard Branch Bill)</option>
                          {branchSubBranches.map(sb => (
                            <option key={sb.id} value={sb.id}>
                              {sb.name} ({sb.revenueSharePct || (sb as any).revenue_share_pct || 0}% Partner)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Team Member Attribution & Commission (Optional) */}
                  <div className="p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-800/40 pb-2">
                      <span className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                        <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Team Member Attribution (Optional)</span>
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold">
                        Auto-links payments to Team Payroll
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Assign Team Member
                        </label>
                        <select
                          value={assignedMemberId}
                          onChange={(e) => {
                            const val = e.target.value
                            setAssignedMemberId(val)
                            const matched = availableTeamMembers.find(m => String(m.id) === String(val))
                            if (matched) {
                              setAssignedMemberName(matched.name)
                              setAssignedMemberRole(matched.role)
                            } else {
                              setAssignedMemberName("")
                              setAssignedMemberRole("")
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="">None / Direct Company Revenue</option>
                          {availableTeamMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role || "Team"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {assignedMemberId && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-indigo-100 dark:border-indigo-900/40 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                              Commission Type
                            </label>
                            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => setMemberPayoutType("percentage")}
                                className={`flex-1 py-1 text-center transition-all cursor-pointer ${
                                  memberPayoutType === "percentage"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                % Percent
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberPayoutType("fixed")}
                                className={`flex-1 py-1 text-center transition-all cursor-pointer ${
                                  memberPayoutType === "fixed"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                              >
                                ₹ Fixed
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                              {memberPayoutType === "percentage" ? "Share Percentage (%)" : "Payout Amount (₹)"}
                            </label>
                            <Input
                              type="number"
                              value={memberPayoutValue}
                              onChange={(e) => setMemberPayoutValue(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder={memberPayoutType === "percentage" ? "e.g. 50" : "e.g. 1000"}
                              className="text-xs h-8"
                            />
                          </div>

                          <div className="col-span-2 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                            ℹ️ When client makes partial payment (e.g. ₹1,000), {memberPayoutType === "percentage" ? `${memberPayoutValue || 50}% (₹${Math.round((1000 * (Number(memberPayoutValue) || 50)) / 100)})` : `proportional share`} will be reflected in payroll. When full payment is completed, full share is added.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dual Bank & QR Settings */}
                  <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-teal-500/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Landmark size={15} className="text-teal-700" />
                        <span className="font-extrabold text-teal-900 dark:text-teal-200 text-xs">
                          Bank & Payment QR Configuration
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-bold">
                        {bankProfile === "gst" ? "🏢 GST Profile Linked" : "📄 Non-GST Profile Linked"}
                      </span>
                    </div>

                    {/* Bank Profile Switcher */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBankProfile("gst")
                          if (activeCompany) {
                            setBankNameOverride(activeCompany.gst_bank_name || activeCompany.bank_name || "")
                            setAccountHolderOverride(activeCompany.gst_account_holder || activeCompany.account_holder || "")
                            setAccountNumberOverride(activeCompany.gst_account_number || activeCompany.account_number || "")
                            setIfscCodeOverride(activeCompany.gst_ifsc_code || activeCompany.ifsc_code || "")
                            setBankBranchOverride(activeCompany.gst_bank_branch || activeCompany.bank_branch || "")
                            setUpiIdOverride(activeCompany.gst_upi_id || activeCompany.upi_id || "")
                            setPaymentQrUrlOverride(activeCompany.gst_payment_qr_url || activeCompany.payment_qr_url || "")
                          }
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          bankProfile === "gst"
                            ? "bg-teal-600 text-white border-teal-600 font-bold shadow-xs"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600"
                        }`}
                      >
                        <div className="font-bold">🏢 Company GST Bank & QR</div>
                        <div className="text-[9.5px] opacity-80">Official Current A/C</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBankProfile("nongst")
                          if (activeCompany) {
                            setBankNameOverride(activeCompany.nongst_bank_name || activeCompany.bank_name || "")
                            setAccountHolderOverride(activeCompany.nongst_account_holder || activeCompany.account_holder || "")
                            setAccountNumberOverride(activeCompany.nongst_account_number || activeCompany.account_number || "")
                            setIfscCodeOverride(activeCompany.nongst_ifsc_code || activeCompany.ifsc_code || "")
                            setBankBranchOverride(activeCompany.nongst_bank_branch || activeCompany.bank_branch || "")
                            setUpiIdOverride(activeCompany.nongst_upi_id || activeCompany.upi_id || "")
                            setPaymentQrUrlOverride(activeCompany.nongst_payment_qr_url || activeCompany.payment_qr_url || "")
                          }
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          bankProfile === "nongst"
                            ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600"
                        }`}
                      >
                        <div className="font-bold">📄 Company Non-GST Bank & QR</div>
                        <div className="text-[9.5px] opacity-80">0% Invoicing A/C</div>
                      </button>
                    </div>

                    {/* Editable Bank Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Bank Name</label>
                        <Input value={bankNameOverride} onChange={e => setBankNameOverride(e.target.value)} placeholder="e.g. HDFC Bank" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Account Holder Name</label>
                        <Input value={accountHolderOverride} onChange={e => setAccountHolderOverride(e.target.value)} placeholder="A/C Holder" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Account Number</label>
                        <Input value={accountNumberOverride} onChange={e => setAccountNumberOverride(e.target.value)} className="font-mono" placeholder="Account No" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">IFSC Code</label>
                        <Input value={ifscCodeOverride} onChange={e => setIfscCodeOverride(e.target.value.toUpperCase())} className="font-mono" placeholder="IFSC" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Bank Branch Location</label>
                        <Input value={bankBranchOverride} onChange={e => setBankBranchOverride(e.target.value)} placeholder="Branch location" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">UPI ID</label>
                        <Input value={upiIdOverride} onChange={e => setUpiIdOverride(e.target.value)} className="font-mono" placeholder="upi@bank" />
                      </div>
                    </div>

                    {/* QR Code Upload / Link */}
                    <div className="pt-2">
                      <ImageUploadField
                        label="Payment Scanner / QR Code URL"
                        value={paymentQrUrlOverride}
                        onChange={url => setPaymentQrUrlOverride(url)}
                        uploadNamePrefix="doc_payment_qr"
                        helperText="Scan-to-pay QR code displayed in the payment footer of this document."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 2: CLIENT & METADATA ──────────────── */}
              {activeLeftTab === "client" && (
                <div className="space-y-4">
                  {/* Client Selector & Mode */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <UserCheck size={14} className="text-teal-600" />
                        <span>Client Information</span>
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setClientMode("select")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            clientMode === "select" ? "bg-teal-600 text-white" : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          Select Client
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClientMode("custom")
                            setSelectedClient(null)
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            clientMode === "custom" ? "bg-teal-600 text-white" : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          + New / Custom
                        </button>
                      </div>
                    </div>

                    {clientMode === "select" ? (
                      <div className="relative">
                        <label className="block text-[10.5px] font-bold text-zinc-600 mb-1">
                          Choose From CRM Clients ({allClients.length} Registered)
                        </label>
                        <div
                          onClick={() => setIsClientSearchOpen(!isClientSearchOpen)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between cursor-pointer hover:border-teal-500"
                        >
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {selectedClient ? selectedClient.name : "Click to select client..."}
                          </span>
                          <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                        </div>

                        {isClientSearchOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden p-2 space-y-2">
                            <input
                              type="text"
                              placeholder="Search client by name, email, phone..."
                              value={clientSearchQuery}
                              onChange={(e) => setClientSearchQuery(e.target.value)}
                              className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                              autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                              {allClients
                                .filter(c => !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                                .map(c => (
                                  <div
                                    key={c.id}
                                    onClick={() => handleSelectClient(c)}
                                    className="p-2 hover:bg-teal-50 dark:hover:bg-teal-950/30 cursor-pointer rounded-lg flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                                      <div className="text-[10px] text-zinc-400">{c.email || c.phone || "No contact"}</div>
                                    </div>
                                    <span className="text-[10px] text-teal-600 font-bold">Select</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Editable Client Details Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Client / Business Name *</label>
                        <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Client Email</label>
                        <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@domain.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Client Phone</label>
                        <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+91 ..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Client GSTIN</label>
                        <Input value={clientGst} onChange={e => setClientGst(e.target.value.toUpperCase())} className="font-mono" placeholder="GSTIN (if applicable)" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Client Street Address</label>
                        <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Billing address" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">City</label>
                        <Input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="City" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">State</label>
                        <Input value={clientState} onChange={e => setClientState(e.target.value)} placeholder="State" />
                      </div>
                    </div>
                  </div>

                  {/* Document Metadata (Number, Dates, Project) */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <Receipt size={14} className="text-teal-600" />
                      <span>Document Number & Dates</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Document Number *</label>
                        <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Issue Date</label>
                        <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Due Date / Valid Till</label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Project / Subject Reference</label>
                        <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. Enterprise Cloud ERP Development" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 3: LINE ITEMS & COMPUTATIONS ──────────────── */}
              {activeLeftTab === "items" && (
                <div className="space-y-4">
                  {/* Presets Bar */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      ⚡ Quick Presets (Click to insert item):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SERVICE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddItem(preset)}
                          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-50 hover:text-teal-700 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          + {preset.name} (₹{preset.rate.toLocaleString()})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2.5">
                    {items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-zinc-700 dark:text-zinc-300">
                            #{index + 1} Line Item
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Item / Service Description *</label>
                          <Input
                            value={item.serviceName}
                            onChange={(e) => handleUpdateItem(item.id, "serviceName", e.target.value)}
                            placeholder="e.g. Website Development, Server Hosting..."
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 mb-0.5">SAC / HSN</label>
                            <Input
                              value={item.sacCode || ""}
                              onChange={(e) => handleUpdateItem(item.id, "sacCode", e.target.value)}
                              className="font-mono text-[11px]"
                              placeholder="998313"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 mb-0.5">Qty</label>
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(item.id, "qty", parseInt(e.target.value) || 1)}
                              className="text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 mb-0.5">Unit Rate (₹)</label>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                              className="font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-zinc-600 mb-0.5">GST %</label>
                            <select
                              value={docScheme === "gst" ? item.gstRate : 0}
                              onChange={(e) => handleUpdateItem(item.id, "gstRate", parseInt(e.target.value) || 0)}
                              disabled={docScheme === "nongst"}
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                            >
                              <option value={18}>18% GST</option>
                              <option value={12}>12% GST</option>
                              <option value={5}>5% GST</option>
                              <option value={0}>0% (Non-GST)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem()}
                      className="w-full text-xs font-bold border-dashed border-teal-500/40 text-teal-700 hover:bg-teal-50 cursor-pointer"
                    >
                      + Add Another Line Item
                    </Button>
                  </div>

                  {/* Adjustments: Discount & Setup Fee */}
                  <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 pb-1.5 text-xs">
                      Discounts & Additional Charges
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Discount</label>
                        <div className="flex gap-1">
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as any)}
                            className="px-2 py-1 rounded-lg border border-zinc-200 text-xs bg-white dark:bg-zinc-900"
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">₹</option>
                          </select>
                          <Input
                            type="number"
                            value={discountValue}
                            onChange={e => setDiscountValue(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            placeholder={discountType === "percentage" ? "10%" : "₹1000"}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Setup / Delivery Charge (₹)</label>
                        <Input
                          type="number"
                          value={setupCharge}
                          onChange={e => setSetupCharge(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          placeholder="₹0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Computation Summary */}
                  <div className="p-3.5 rounded-2xl bg-teal-900 text-white space-y-1.5 shadow-md">
                    <div className="flex justify-between text-xs opacity-90">
                      <span>Subtotal Base:</span>
                      <span className="font-mono">₹{calculatedSubtotal.toLocaleString("en-IN")}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between text-xs text-teal-200">
                        <span>Discount:</span>
                        <span className="font-mono">-₹{calculatedDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {docScheme === "gst" && (
                      <div className="flex justify-between text-xs text-teal-200">
                        <span>Total GST (CGST 9% + SGST 9%):</span>
                        <span className="font-mono">+₹{calculatedGst.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black pt-1.5 border-t border-teal-700/60">
                      <span>Grand Total Invoiced:</span>
                      <span className="font-mono text-base text-teal-300">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 4: BADGES, SIGNATURE & OVERRIDES ──────────────── */}
              {activeLeftTab === "customization" && (
                <div className="space-y-4">
                  {/* Draggable Custom Badges Creator */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Stamp size={15} className="text-emerald-600" />
                        <span className="font-extrabold text-emerald-950 dark:text-emerald-200 text-xs">
                          Custom Draggable Badges & Stamps
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPositions}
                        className="text-[10px] text-zinc-500 hover:text-zinc-800 font-bold underline cursor-pointer"
                      >
                        Reset All Positions
                      </button>
                    </div>

                    <p className="text-[10.5px] text-zinc-500">
                      Create movable badges that you can hold and drag to any location on the document canvas.
                    </p>

                    {/* Quick Preset Stamps */}
                    <div className="flex flex-wrap gap-1.5">
                      {STAMP_PRESETS.map((st, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomStamps(prev => [
                              ...prev,
                              { id: `stamp_${Date.now()}_${idx}`, text: st.text, color: st.color, fontSize: 11, x: 0, y: 0 }
                            ])
                          }}
                          className="px-2 py-1 rounded-md text-[9.5px] font-bold border transition-all cursor-pointer"
                          style={{ borderColor: st.color, color: st.color, backgroundColor: 'rgba(255,255,255,0.8)' }}
                        >
                          + {st.text}
                        </button>
                      ))}
                    </div>

                    {/* Custom Stamp Creator */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={newStampText}
                        onChange={e => setNewStampText(e.target.value)}
                        placeholder="Enter custom stamp text (e.g. APPROVED)..."
                        className="text-xs"
                      />
                      <input
                        type="color"
                        value={newStampColor}
                        onChange={e => setNewStampColor(e.target.value)}
                        className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer shrink-0"
                        title="Choose badge color"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomStamp}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Add Stamp
                      </Button>
                    </div>

                    {/* List of active custom stamps */}
                    {customStamps.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-500/10">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Active Movable Stamps:</span>
                        <div className="flex flex-wrap gap-2">
                          {customStamps.map(s => (
                            <span 
                              key={s.id}
                              className="px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1.5 bg-white shadow-2xs"
                              style={{ borderColor: s.color, color: s.color }}
                            >
                              <span>{s.text}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomStamp(s.id)}
                                className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logo & Signature Image Overrides */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 pb-1.5 text-xs">
                      Document Logo & Signatory Overrides
                    </span>
                    <div className="space-y-3">
                      <div>
                        <ImageUploadField
                          label="Logo Override (Overrides Company Logo on this Document)"
                          value={logoUrlOverride}
                          onChange={url => setLogoUrlOverride(url)}
                          uploadNamePrefix="doc_logo_override"
                          helperText="Uploaded to ImgBB or paste direct image URL. Leave empty to use company default logo."
                        />
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] flex-wrap">
                          <span className="font-bold text-zinc-500">Quick Test Logos:</span>
                          <button
                            type="button"
                            onClick={() => setLogoUrlOverride("https://cdn-icons-png.flaticon.com/512/3135/3135715.png")}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-bold hover:bg-teal-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            Tech Emblem
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoUrlOverride("https://cdn-icons-png.flaticon.com/512/3063/3063822.png")}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            Corporate Crest
                          </button>
                          {logoUrlOverride && (
                            <button
                              type="button"
                              onClick={() => setLogoUrlOverride("")}
                              className="text-rose-500 hover:text-rose-700 font-bold underline cursor-pointer ml-auto"
                            >
                              Reset to Default Logo
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <ImageUploadField
                          label="Authorized Signature Override"
                          value={signatureUrlOverride}
                          onChange={url => setSignatureUrlOverride(url)}
                          uploadNamePrefix="doc_sig_override"
                          aspectRatio="signature"
                          helperText="Uploaded to ImgBB or paste direct image URL. Leave empty to use company default signature."
                        />
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] flex-wrap">
                          <span className="font-bold text-zinc-500">Quick Test Signatures:</span>
                          <button
                            type="button"
                            onClick={() => setSignatureUrlOverride("https://upload.wikimedia.org/wikipedia/commons/f/fa/Signature_sample.png")}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-bold hover:bg-teal-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            Formal Signature
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatureUrlOverride("https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch_Signature.png")}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-50 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            Director Signature
                          </button>
                          {signatureUrlOverride && (
                            <button
                              type="button"
                              onClick={() => setSignatureUrlOverride("")}
                              className="text-rose-500 hover:text-rose-700 font-bold underline cursor-pointer ml-auto"
                            >
                              Reset to Default Signature
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 pb-1.5 text-xs">
                      Notes & Terms of Service
                    </span>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Notes to Customer</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Terms & Conditions</label>
                      <textarea
                        rows={3}
                        value={terms}
                        onChange={e => setTerms(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ════ RIGHT PANEL: LIVE WYSIWYG DOCUMENT CANVAS (54% WIDTH) ════ */}
          <div className="flex-1 bg-zinc-200/70 dark:bg-zinc-950/80 flex flex-col overflow-hidden relative">
            
            {/* Top Canvas Bar with Zoom & Instructions */}
            <div className="px-4 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                  Live WYSIWYG Document Canvas
                </span>
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  • Real-time updates as you type on the left
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Drag info helper badge */}
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                  <Move size={12} />
                  <span>Hold & drag logo / signature / badges to position</span>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => setCanvasZoom(z => Math.max(65, z - 10))}
                    className="p-1 text-zinc-600 hover:text-zinc-900 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="px-1.5 text-[10.5px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {canvasZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setCanvasZoom(z => Math.min(120, z + 10))}
                    className="p-1 text-zinc-600 hover:text-zinc-900 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPositions}
                  className="text-xs h-7 px-2 font-bold cursor-pointer"
                  title="Reset positions of logo, signature and stamps"
                >
                  <RefreshCw size={12} className="mr-1" /> Reset Drag
                </Button>
              </div>
            </div>

            {/* Canvas Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
              <div 
                style={{ 
                  transform: `scale(${canvasZoom / 100})`, 
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease-out"
                }}
                className="w-full max-w-[840px] drop-shadow-2xl select-text"
              >
                {/* Real-time Interactive Official Invoice / Quotation / Estimate Document */}
                <OfficialInvoiceDocument
                  invoice={livePreviewInvoice}
                  clientDetails={selectedClient}
                  companyDetails={activeCompany}
                  interactive={true}
                  logoPosition={logoPosition}
                  onLogoPositionChange={pos => setLogoPosition(pos)}
                  signaturePosition={signaturePosition}
                  onSignaturePositionChange={pos => setSignaturePosition(pos)}
                  customStamps={customStamps}
                  onCustomStampMove={(id, pos) => {
                    setCustomStamps(prev => prev.map(s => s.id === id ? { ...s, x: pos.x, y: pos.y } : s))
                  }}
                  onRemoveCustomStamp={id => handleRemoveCustomStamp(id)}
                  overrideLogoUrl={logoUrlOverride || undefined}
                  overrideSignatureUrl={signatureUrlOverride || undefined}
                  overrideStampUrl={stampUrlOverride || undefined}
                  overrideBankDetails={{
                    bankName: bankNameOverride,
                    accountHolder: accountHolderOverride,
                    accountNumber: accountNumberOverride,
                    ifscCode: ifscCodeOverride,
                    bankBranch: bankBranchOverride,
                    upiId: upiIdOverride,
                    paymentQrUrl: paymentQrUrlOverride,
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  )
}
