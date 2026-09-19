"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Check, DollarSign, Calculator, UserCheck, Users, Calendar, Briefcase, FileText, 
  Coins, RefreshCw, Layers, CreditCard, Building2, Mail, Phone, MapPin, 
  Plus, Trash2, Tag, ChevronDown, ChevronUp, Sparkles, Search, Receipt,
  ShieldCheck, AlertCircle, Eye, Landmark, QrCode, Award, Clock, CheckCircle2, ListChecks
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
import { numberToIndianWords } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

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
  { name: "Enterprise Consultation", sac: "998319", gst: 18, unit: "Nos", rate: 10000 },
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

  // Tab State depending on mode:
  // Quotation: "q_setup" (1. Project & Client), "q_scope" (2. Scope & Milestones), "q_commercial" (3. Pricing & Payment Terms)
  // Estimate: "e_setup" (1. Estimate & Client), "e_pricing" (2. Services & Notes)
  // Invoice: "inv_entity" (1. Entity & Tax Scheme), "inv_client" (2. Client & Dates), "inv_items" (3. Line Items & Tax)
  const [currentStep, setCurrentStep] = React.useState<number>(1)
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

  // Team Member Attribution (For Invoices)
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
    d.setDate(d.getDate() + (mode === "quotation" ? 30 : 15))
    return d.toISOString().split("T")[0]
  })

  // Quotation Specific Fields
  const [projectTitle, setProjectTitle] = React.useState(initialData?.project || "Custom Enterprise Software & Cloud Infrastructure")
  const [projectOverview, setProjectOverview] = React.useState(
    initialData?.overview || 
    "Comprehensive end-to-end software architecture, development, deployment, and ongoing support tailored to accelerate operational efficiency and digital transformation."
  )
  const [projectTimeline, setProjectTimeline] = React.useState(initialData?.timeline || "6 to 8 Weeks / 3 Sprints")
  const [turnaroundTime, setTurnaroundTime] = React.useState(initialData?.turnaroundTime || "5 Business Days")
  
  // Deliverables Breakdown (For Quotation)
  const [deliverables, setDeliverables] = React.useState<Array<{ id: string; title: string; description: string; duration: string }>>([
    {
      id: "del_1",
      title: "UI/UX Experience Design & Interactive Wireframing",
      description: "High-fidelity Figma prototypes, design system tokens, and client design sign-off.",
      duration: "1-2 Weeks"
    },
    {
      id: "del_2",
      title: "Core Platform Development & Database Architecture",
      description: "High-performance backend services, database schema design, and secure REST/GraphQL APIs.",
      duration: "3-4 Weeks"
    },
    {
      id: "del_3",
      title: "Quality Assurance, Security Audits & Handover",
      description: "Automated test suites, end-to-end penetration testing, cloud deployment, and team onboarding.",
      duration: "1-2 Weeks"
    }
  ])

  // Scope Inclusions & Exclusions (For Quotation)
  const [scopeInclusions, setScopeInclusions] = React.useState(
    "• Complete source code ownership & documentation\n• 60 days of complimentary post-deployment warranty support\n• Production cloud deployment & DNS configuration\n• Admin dashboard and role-based access controls"
  )
  const [scopeExclusions, setScopeExclusions] = React.useState(
    "• 3rd party API subscription fees (e.g. AWS, Twilio, OpenAI)\n• Domain name registration costs\n• Scope additions outside the agreed sprint backlog"
  )

  // Milestone Payment Terms Schedule (For Quotation)
  const [paymentMilestones, setPaymentMilestones] = React.useState<Array<{ milestone: string; percentage: number; stage: string }>>([
    { milestone: "Milestone 1: Project Kickoff & Advance", percentage: 50, stage: "Upon agreement signing & kickoff" },
    { milestone: "Milestone 2: Prototype & Functional Demo", percentage: 30, stage: "Upon successful staging demo" },
    { milestone: "Milestone 3: Final Production Handover", percentage: 20, stage: "Upon final sign-off & code handover" }
  ])

  // 4. Line Items
  const [items, setItems] = React.useState<InvoiceLineItem[]>([
    {
      id: `item_${Date.now()}`,
      serviceName: mode === "quotation" ? "Enterprise Software Design & Cloud Architecture" : "Custom Enterprise Consulting & Development",
      sacCode: mode === "invoice" ? "998313" : "",
      qty: 1,
      unit: "Project",
      rate: mode === "quotation" ? 45000 : 25000,
      gstRate: mode === "invoice" && docScheme === "gst" ? 18 : 0,
      gstAmount: 0,
      charges: [],
      totalAmount: mode === "quotation" ? 45000 : 25000
    }
  ])

  // 5. Financial adjustments
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = React.useState<number | "">("")
  const [setupCharge, setSetupCharge] = React.useState<number | "">("")
  
  // Notes & Terms
  const [notes, setNotes] = React.useState(
    mode === "invoice" 
      ? (activeCompany?.invoice_notes || "Thank you for partnering with Saampark. Please make payment to our verified bank account.")
      : (activeCompany?.quotation_notes || "Quotation valid for 30 calendar days from issue. 50% mobilization advance required upon kickoff.")
  )
  const [terms, setTerms] = React.useState(
    activeCompany?.terms_conditions || 
    "1. Payment is due within statutory terms.\n2. Goods & Services once delivered are subject to project sign-off.\n3. Disputed items must be notified within 7 days."
  )

  // Load clients, branches, team members & initialize document numbers
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
        generateDocNumber(mode === "invoice" ? docScheme : "nongst")
      }
    }
  }, [isOpen, prefilledClient])

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
    const isGstActive = mode === "invoice" && docScheme === "gst"
    const newItem: InvoiceLineItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      serviceName: preset?.name || "",
      sacCode: preset?.sac || (isGstActive ? "998313" : ""),
      qty: 1,
      unit: preset?.unit || "Project",
      rate: preset?.rate || 10000,
      gstRate: isGstActive ? (preset?.gst !== undefined ? preset.gst : 18) : 0,
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
      const isGstActive = mode === "invoice" && docScheme === "gst"
      const gst = isGstActive ? (typeof updated.gstRate === "number" ? updated.gstRate : 18) : 0
      updated.totalAmount = base + Math.round(base * (gst / 100))
      return updated
    }))
  }

  // Deliverables Handlers (Quotation)
  const handleAddDeliverable = () => {
    setDeliverables(prev => [
      ...prev,
      {
        id: `del_${Date.now()}`,
        title: "New Scope Module / Milestone",
        description: "Specify deliverables, functionality, and handover criteria.",
        duration: "1-2 Weeks"
      }
    ])
  }

  const handleUpdateDeliverable = (id: string, field: string, val: string) => {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d))
  }

  const handleRemoveDeliverable = (id: string) => {
    if (deliverables.length <= 1) return
    setDeliverables(prev => prev.filter(d => d.id !== id))
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
    if (mode !== "invoice" || docScheme === "nongst") return 0
    return items.reduce((sum, it) => {
      const base = (it.rate || 0) * (it.qty || 1)
      const rate = it.gstRate !== undefined ? it.gstRate : 18
      return sum + Math.round(base * (rate / 100))
    }, 0)
  }, [items, docScheme, mode])

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
        overview: projectOverview,
        timeline: projectTimeline,
        turnaroundTime: turnaroundTime,
        deliverables: deliverables,
        scopeInclusions: scopeInclusions,
        scopeExclusions: scopeExclusions,
        paymentMilestones: paymentMilestones,
        billDate: issueDate,
        invoiceDate: issueDate,
        date: issueDate,
        dueDate: dueDate,
        validTill: dueDate,
        baseAmount: taxableBase,
        subtotal: taxableBase,
        discount: calculatedDiscount,
        setupCharge: numSetupCharge,
        gstRate: mode === "invoice" && docScheme === "gst" ? 18 : 0,
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
          project: projectTitle,
          overview: projectOverview,
          timeline: projectTimeline,
          deliverables: deliverables,
          scopeInclusions: scopeInclusions,
          scopeExclusions: scopeExclusions,
          paymentMilestones: paymentMilestones,
          date: issueDate,
          validTill: dueDate,
          notes: notes,
          terms: terms,
          subtotal: taxableBase,
          tax: 0,
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
          project: projectTitle,
          turnaroundTime: turnaroundTime,
          date: issueDate,
          validTill: dueDate,
          notes: notes,
          terms: terms,
          subtotal: taxableBase,
          tax: 0,
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
    ? "Create Commercial Project Quotation & Tender"
    : "Create Project Cost Estimate"

  const totalSteps = mode === "estimate" ? 2 : 3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-1.5 sm:p-5 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden text-xs"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/80 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-xl ${mode === "invoice" ? (docScheme === "gst" ? "bg-teal-600 text-white" : "bg-sky-600 text-white") : mode === "quotation" ? "bg-indigo-600 text-white" : "bg-amber-600 text-white"} shadow-md shrink-0`}>
              {mode === "invoice" ? <Receipt size={18} /> : mode === "quotation" ? <FileText size={18} /> : <Calculator size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">{modalTitle}</h2>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                  mode === "quotation" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" :
                  mode === "estimate" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                  docScheme === "gst" ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                }`}>
                  {mode === "quotation" ? "Proposal" : mode === "estimate" ? "Estimate" : docScheme === "gst" ? "GST Invoice" : "Non-GST"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono font-bold mt-0.5 truncate">
                Ref: {docNumber} • {activeCompany?.brand_name || activeCompany?.name}
              </p>
            </div>
          </div>

          {/* Quick Live Totals Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none">Subtotal</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">₹{taxableBase.toLocaleString("en-IN")}</span>
              </div>
              {mode === "invoice" && docScheme === "gst" && (
                <div>
                  <span className="text-[10px] text-zinc-400 block leading-none">GST Tax</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">+₹{calculatedGst.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-l border-zinc-200 dark:border-zinc-700 pl-3">
                <span className="text-[10px] text-zinc-400 block leading-none font-bold">
                  {mode === "quotation" ? "Value" : "Total"}
                </span>
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

        {/* ── CLEAN TAB BAR TAILORED BY DOCUMENT TYPE (Fully Mobile Scrollable) ── */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-center font-bold shrink-0 overflow-x-auto">
          {mode === "quotation" && (
            <div className="flex sm:grid sm:grid-cols-3 min-w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 1 ? "border-indigo-600 text-indigo-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                1. Project &amp; Client Overview
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 2 ? "border-indigo-600 text-indigo-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                2. Scope &amp; Deliverables
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 3 ? "border-indigo-600 text-indigo-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                3. Commercial Value &amp; Milestones
              </button>
            </div>
          )}

          {mode === "estimate" && (
            <div className="flex sm:grid sm:grid-cols-2 min-w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 1 ? "border-amber-600 text-amber-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                1. Estimate &amp; Client Details
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 2 ? "border-amber-600 text-amber-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                2. Estimated Services &amp; Notes
              </button>
            </div>
          )}

          {mode === "invoice" && (
            <div className="flex sm:grid sm:grid-cols-3 min-w-full">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 1 ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                1. Entity &amp; Scheme
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 2 ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                2. Client &amp; Dates
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`py-2.5 sm:py-3 px-3.5 border-b-2 text-[11px] sm:text-xs transition-all cursor-pointer whitespace-nowrap flex-1 ${
                  currentStep === 3 ? "border-teal-600 text-teal-600 bg-white dark:bg-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                3. Items &amp; Calculation
              </button>
            </div>
          )}
        </div>

        {/* ── MODAL BODY ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Centralized Inheritance Notice Bar across all modes */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Landmark size={15} className="text-blue-600 shrink-0" />
              <span>
                Issuing under <strong>{activeCompany?.brand_name || activeCompany?.name}</strong>. Banking, UPI QR, Signatory &amp; Seal are automatically inherited.
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
              Signatory: {activeCompany?.signatory_name || "Authorized Signatory"}
            </span>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              MODE: QUOTATION (COMMERCIAL PROJECT PROPOSAL)
             ════════════════════════════════════════════════════════════════ */}
          {mode === "quotation" && (
            <>
              {/* Step 1: Project & Client Overview */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Project Proposal Overview &amp; Timeline
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Issuing Company Entity *</label>
                        <select
                          value={companyId}
                          onChange={(e) => setCompanyId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        >
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Project Proposal Title *</label>
                        <Input 
                          value={projectTitle} 
                          onChange={e => setProjectTitle(e.target.value)} 
                          placeholder="e.g. Enterprise Cloud ERP Implementation"
                          className="font-bold text-indigo-950 dark:text-indigo-200" 
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Project Summary / Executive Statement</label>
                        <textarea
                          rows={2}
                          value={projectOverview}
                          onChange={e => setProjectOverview(e.target.value)}
                          placeholder="Summary of project goals, technical strategy, and business outcomes..."
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Quotation Number *</label>
                        <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="font-mono font-bold" />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Estimated Project Timeline / Turnaround</label>
                        <Input 
                          value={projectTimeline} 
                          onChange={e => setProjectTimeline(e.target.value)} 
                          placeholder="e.g. 6 to 8 Weeks / 3 Sprints" 
                          className="font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Proposal Issue Date *</label>
                        <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Quotation Valid Till</label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <UserCheck size={15} className="text-indigo-600" />
                        <span>Client / Prospect Organization</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setClientMode("select")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            clientMode === "select" ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
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
                            clientMode === "custom" ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          + Custom Prospect
                        </button>
                      </div>
                    </div>

                    {clientMode === "select" && (
                      <div className="relative">
                        <div
                          onClick={() => setIsClientSearchOpen(!isClientSearchOpen)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between cursor-pointer hover:border-indigo-500"
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
                              placeholder="Search client..."
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
                                    className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer rounded-lg flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                                      <div className="text-[10.5px] text-zinc-400">{c.email || c.phone || "No contact"}</div>
                                    </div>
                                    <span className="text-[10.5px] text-indigo-600 font-bold">Select</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Organization / Client Name *</label>
                        <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Innovations Ltd" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Contact Email</label>
                        <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="contact@acme.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Contact Phone</label>
                        <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+91 98765 43210" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Address</label>
                        <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Full street address" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">City &amp; State</label>
                        <Input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="City, State" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Scope of Work & Deliverables */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Modules / Deliverables */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <ListChecks size={15} className="text-indigo-600" />
                        <span>Deliverables &amp; Functional Scope Breakdown</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddDeliverable}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> + Add Deliverable
                      </button>
                    </div>

                    <div className="space-y-3">
                      {deliverables.map((del, idx) => (
                        <div key={del.id} className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300 text-xs">Module #{idx + 1}</span>
                            {deliverables.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDeliverable(del.id)}
                                className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Module / Deliverable Title</label>
                              <Input
                                value={del.title}
                                onChange={e => handleUpdateDeliverable(del.id, "title", e.target.value)}
                                placeholder="Module title..."
                                className="font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Estimated Duration / Sprint</label>
                              <Input
                                value={del.duration}
                                onChange={e => handleUpdateDeliverable(del.id, "duration", e.target.value)}
                                placeholder="e.g. 2 Weeks"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Scope Description &amp; Technical Criteria</label>
                              <Input
                                value={del.description}
                                onChange={e => handleUpdateDeliverable(del.id, "description", e.target.value)}
                                placeholder="Key functionality, APIs, and deliverables included in this module..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Scope Inclusions (What&apos;s Covered)
                      </span>
                      <textarea
                        rows={4}
                        value={scopeInclusions}
                        onChange={e => setScopeInclusions(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10 space-y-2">
                      <span className="font-bold text-rose-900 dark:text-rose-300 text-xs flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" />
                        Scope Exclusions (Out of Scope)
                      </span>
                      <textarea
                        rows={4}
                        value={scopeExclusions}
                        onChange={e => setScopeExclusions(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 rounded-xl text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Commercial Pricing & Payment Terms */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  {/* Commercial Line Items */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Coins size={15} className="text-indigo-600" />
                        <span>Commercial Quotation Breakdown</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> + Add Item
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {items.map((item, index) => (
                        <div key={item.id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-6">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Service / Component Description *</label>
                            <Input
                              value={item.serviceName}
                              onChange={e => handleUpdateItem(item.id, "serviceName", e.target.value)}
                              placeholder="e.g. Platform Architecture & Backend API"
                              className="font-bold"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Unit</label>
                            <Input
                              value={item.unit || "Project"}
                              onChange={e => handleUpdateItem(item.id, "unit", e.target.value)}
                              placeholder="Project / Sprint"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Commercial Value (₹) *</label>
                            <Input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={e => handleUpdateItem(item.id, "rate", Math.max(0, Number(e.target.value)))}
                              placeholder="30000"
                              className="font-bold text-emerald-600 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Total Commercial Project Value:</span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Milestone Payment Terms */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Milestone Payment Terms Schedule
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {paymentMilestones.map((pm, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200">
                            <span>{pm.milestone}</span>
                            <span className="text-indigo-600 font-mono">{pm.percentage}%</span>
                          </div>
                          <p className="text-[10.5px] text-zinc-400">{pm.stage}</p>
                          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 font-mono font-bold text-emerald-600 text-xs">
                            ₹{Math.round(grandTotal * (pm.percentage / 100)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commercial Terms */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">
                      Terms &amp; Conditions
                    </span>
                    <textarea
                      rows={3}
                      value={terms}
                      onChange={e => setTerms(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              MODE: ESTIMATE (FAST PROJECT COST ESTIMATE)
             ════════════════════════════════════════════════════════════════ */}
          {mode === "estimate" && (
            <>
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Estimate Identity &amp; Client Overview
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Company Entity *</label>
                        <select
                          value={companyId}
                          onChange={(e) => setCompanyId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        >
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Estimate Number *</label>
                        <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="font-mono font-bold" />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Estimate Subject / Project Reference *</label>
                        <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. Website Overhaul & Performance Tuning" className="font-bold" />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Estimate Date</label>
                        <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Estimated Turnaround Time</label>
                        <Input value={turnaroundTime} onChange={e => setTurnaroundTime(e.target.value)} placeholder="e.g. 5 Business Days" />
                      </div>
                    </div>
                  </div>

                  {/* Client Select */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Client Contact
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client Name *</label>
                        <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client Email</label>
                        <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@client.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client Phone</label>
                        <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+91 98765 43210" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Estimated Services */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">Estimated Services &amp; Rates</span>
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> + Add Service
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {items.map(item => (
                        <div key={item.id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Service Name *</label>
                            <Input value={item.serviceName} onChange={e => handleUpdateItem(item.id, "serviceName", e.target.value)} placeholder="Service description..." className="font-bold" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Hours / Qty</label>
                            <Input type="number" min="1" value={item.qty} onChange={e => handleUpdateItem(item.id, "qty", Math.max(1, Number(e.target.value)))} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Rate (₹)</label>
                            <Input type="number" min="0" value={item.rate} onChange={e => handleUpdateItem(item.id, "rate", Math.max(0, Number(e.target.value)))} className="font-bold font-mono" />
                          </div>
                          <div className="sm:col-span-2 font-mono font-bold text-emerald-600 text-xs">
                            ₹{(item.rate * item.qty).toLocaleString("en-IN")}
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            {items.length > 1 && (
                              <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 p-1 rounded cursor-pointer"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">Total Estimated Cost:</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">Scope Notes &amp; Assumptions</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              MODE: INVOICE (GST OR NON-GST BILLING)
             ════════════════════════════════════════════════════════════════ */}
          {mode === "invoice" && (
            <>
              {/* Step 1: Entity, Scheme & Attribution */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Scheme Switcher */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Invoicing Scheme &amp; Tax Mode
                    </span>

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
                          <div className="text-[11px] text-zinc-500 mt-0.5">Includes HSN/SAC codes, CGST/SGST/IGST breakdown, and Company GSTIN.</div>
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
                          <div className="text-[11px] text-zinc-500 mt-0.5">No tax added to line items. Links Non-GST bank profile automatically.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company & Branch */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Issuing Company Entity &amp; Branch Location
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
                        <label className="block text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Sub-Branch Partner</label>
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

                  {/* Team Member Attribution */}
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                      <span className="font-extrabold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                        <Users size={15} className="text-indigo-600" />
                        <span>Sales Rep &amp; Team Member Revenue Attribution</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAssignedMember}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> + Add Member
                      </button>
                    </div>

                    {assignedMembers.length === 0 ? (
                      <div className="py-3 text-center text-zinc-400 text-xs">
                        No team members assigned yet. Click &quot;+ Add Member&quot; to attribute revenue share.
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
                                {m.payoutType === "percentage" ? "Share (%)" : "Amount (₹)"}
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
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
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

              {/* Step 2: Client & Dates */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <UserCheck size={15} className="text-teal-600" />
                        <span>Client Billing Details</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setClientMode("select")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            clientMode === "select" ? "bg-teal-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
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
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            clientMode === "custom" ? "bg-teal-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          + Custom Client
                        </button>
                      </div>
                    </div>

                    {clientMode === "select" && (
                      <div className="relative">
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
                              placeholder="Search client..."
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client / Organization Name *</label>
                        <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" />
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
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Client GSTIN (if applicable)</label>
                        <Input value={clientGst} onChange={e => setClientGst(e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="19AAAAA0000A1Z5" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Street Address</label>
                        <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Street address" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Identification */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-200 dark:border-zinc-700/60 pb-2 text-xs">
                      Invoice Reference &amp; Dates
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Invoice Number *</label>
                        <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Bill Date *</label>
                        <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Due Date</label>
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Project Reference / Job</label>
                        <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="e.g. ERP System Development" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Line Items & Calculation */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  {/* Service Presets */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                      ⚡ Quick Service Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SERVICE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddItem(preset)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-50 hover:text-teal-700 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          + {preset.name} (₹{preset.rate.toLocaleString("en-IN")})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Line Items &amp; Services ({items.length})</span>
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                              <span className="font-black text-zinc-800 dark:text-zinc-200 text-xs">#{index + 1} Item</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                                  Total: ₹{rowTotal.toLocaleString("en-IN")} {docScheme === "gst" ? `(incl. ₹${rowTax} tax)` : ''}
                                </span>
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-5">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Service Description *</label>
                                <Input value={item.serviceName} onChange={e => handleUpdateItem(item.id, "serviceName", e.target.value)} className="font-bold" />
                              </div>
                              {docScheme === "gst" && (
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">SAC/HSN</label>
                                  <Input value={item.sacCode} onChange={e => handleUpdateItem(item.id, "sacCode", e.target.value)} className="font-mono" />
                                </div>
                              )}
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Qty</label>
                                <Input type="number" min="1" value={item.qty} onChange={e => handleUpdateItem(item.id, "qty", Math.max(1, Number(e.target.value)))} />
                              </div>
                              <div className={docScheme === "gst" ? "sm:col-span-3" : "sm:col-span-5"}>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-0.5">Rate (₹) *</label>
                                <Input type="number" min="0" value={item.rate} onChange={e => handleUpdateItem(item.id, "rate", Math.max(0, Number(e.target.value)))} className="font-bold text-emerald-600" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Calculations Summary */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Discount Amount (₹)</label>
                        <Input
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={e => setDiscountValue(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 1000"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Platform / Setup Charge (₹)</label>
                        <Input
                          type="number"
                          min="0"
                          value={setupCharge}
                          onChange={e => setSetupCharge(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 1500"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-zinc-600 text-xs">
                        <span>Subtotal:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">₹{calculatedSubtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {docScheme === "gst" && (
                        <div className="flex items-center justify-between text-teal-600 text-xs">
                          <span>Statutory GST (18%):</span>
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

                  {/* Notes & Terms */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Invoice Notes</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mb-0.5">Invoice Terms &amp; Conditions</label>
                      <textarea
                        rows={2}
                        value={terms}
                        onChange={e => setTerms(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── FOOTER (Responsive on Mobile) ── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 shrink-0 gap-2.5">
          <div className="text-zinc-400 text-xs font-medium text-center sm:text-left">
            Step {currentStep} of {totalSteps}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                Previous Step
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDocument}
                className="px-4 sm:px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={15} />
                <span>{isSubmitting ? "Saving..." : (initialData?.id ? "Update Document" : "Save & Generate Document")}</span>
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  )
}
