"use client"

import * as React from "react"
import { 
  X, Check, DollarSign, Calculator, UserCheck, Calendar, Briefcase, FileText, 
  Coins, RefreshCw, Layers, CreditCard, Building2, Mail, Phone, MapPin, 
  Plus, Trash2, Tag, ChevronDown, Sparkles
} from "lucide-react"
import { ClientItem } from "../types"
import { getUsers } from "@/app/feature/users/services/userService"
import { addProject } from "@/app/feature/projects/services/projectService"
import { addInvoice, getInvoices, generateInvoiceNumber, InvoiceLineItem, AppliedDiscount } from "@/app/feature/sales/invoices/services/invoiceService"
import { addOrder } from "@/app/feature/sales/orders/services/orderService"
import { addPayment } from "@/app/feature/sales/payments/services/paymentService"
import { addSubscription } from "@/app/feature/subscriptions/services/subscriptionService"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { saveStoredClient, getClients } from "../services/clientService"
import { useAuthStore } from "@/store/useAuthStore"

interface AddClientProjectModalProps {
  isOpen: boolean
  client: ClientItem | null
  onClose: () => void
  onProjectCreated: () => void
  onInvoiceCreated?: (invoice: any) => void
}

export interface ServiceFormItem {
  id: string
  serviceName: string
  sacCode: string
  qty: number
  unit: string
  rate: number | ""
  charges: { id: string; name: string; amount: number | "" }[]
  gstRate: number
}

export interface FormDiscountItem {
  id: string
  name: string
  amount: number | ""
}

const SERVICE_PRESETS = [
  { name: "Website Development", sac: "998313", gst: 18, unit: "Project" },
  { name: "Software Development", sac: "998314", gst: 18, unit: "Project" },
  { name: "Android / iOS App", sac: "998314", gst: 18, unit: "Project" },
  { name: "Cloud & Domain Hosting", sac: "998315", gst: 18, unit: "Month" },
  { name: "UI/UX & Graphics", sac: "998312", gst: 18, unit: "Design" },
  { name: "Digital Marketing & SEO", sac: "998311", gst: 18, unit: "Month" },
  { name: "Print & Media Works", sac: "998912", gst: 12, unit: "Job" },
  { name: "General Consulting (Non-GST)", sac: "998319", gst: 0, unit: "Nos" },
]

export function AddClientProjectModal({
  isOpen,
  client,
  onClose,
  onProjectCreated,
  onInvoiceCreated,
}: AddClientProjectModalProps) {
  const { user, activeCompanyId } = useAuthStore()
  const targetCompany = activeCompanyId || user?.companyId || "tech"

  const [creationMode, setCreationMode] = React.useState<"project_and_invoice" | "invoice_only">("project_and_invoice")
  const [projectTitle, setProjectTitle] = React.useState("")
  const [category, setCategory] = React.useState("Website Development")
  const [billedByAdmin, setBilledByAdmin] = React.useState(user?.name || "Admin")
  const [assignedMembers, setAssignedMembers] = React.useState<string[]>([])
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [deadline, setDeadline] = React.useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().split("T")[0]
  })

  // 1. Dynamic Multi-Services State
  const [serviceItems, setServiceItems] = React.useState<ServiceFormItem[]>([
    {
      id: `svc_${Date.now()}`,
      serviceName: "Website Development",
      sacCode: "998313",
      qty: 1,
      unit: "Project",
      rate: "",
      charges: [],
      gstRate: 18,
    }
  ])

  // 2. Named Multi-Discounts State
  const [discountsList, setDiscountsList] = React.useState<FormDiscountItem[]>([])

  // 3. Payment Structure State
  const [paymentModel, setPaymentModel] = React.useState<"advance" | "part" | "full">("advance")
  const [advanceAmount, setAdvanceAmount] = React.useState<number | "">("")
  const [partInitialPayment, setPartInitialPayment] = React.useState<number | "">("")
  const [installmentsCount, setInstallmentsCount] = React.useState<number>(3)
  const [billingCycle, setBillingCycle] = React.useState<"Monthly" | "Quarterly">("Monthly")
  const [autoCreateSubscription, setAutoCreateSubscription] = React.useState<boolean>(true)
  const [paymentStatus, setPaymentStatus] = React.useState<"Payment Pending" | "Paid">("Paid")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Client Details State (Prefilled & Editable)
  const [clientEmail, setClientEmail] = React.useState(client?.email || "")
  const [clientPhone, setClientPhone] = React.useState(client?.phone || "")
  const [clientAddress, setClientAddress] = React.useState(client?.address || "")
  const [clientCity, setClientCity] = React.useState(client?.city || "")
  const [clientState, setClientState] = React.useState(client?.state || "")
  const [clientGst, setClientGst] = React.useState(client?.gstNumber || client?.vatNumber || "")

  const [adminsList, setAdminsList] = React.useState<{ id: string; name: string }[]>([])
  const [teamsList, setTeamsList] = React.useState<{ id: string; name: string; role?: string }[]>([])

  React.useEffect(() => {
    if (isOpen && client) {
      setCreationMode("project_and_invoice")
      setServiceItems([
        {
          id: `svc_${Date.now()}`,
          serviceName: "Website Development",
          sacCode: "998313",
          qty: 1,
          unit: "Project",
          rate: "",
          charges: [],
          gstRate: 18,
        }
      ])
      setDiscountsList([])
      setAdvanceAmount("")
      setPartInitialPayment("")
      setPaymentModel("advance")
      setClientEmail(client.email || "")
      setClientPhone(client.phone || "")
      setClientAddress(client.address || "")
      setClientCity(client.city || "")
      setClientState(client.state || "")
      setClientGst(client.gstNumber || client.vatNumber || "")
      if (user?.name) {
        setBilledByAdmin(user.name)
      }
      getUsers("all").then((users) => {
        let admins = users
          .filter(u => (u.role === "Super Admin" || u.role === "Admin") && u.status !== "Inactive")
          .map(u => ({ id: u.id, name: u.name }))
        
        if (user?.name && !admins.some(a => a.name.toLowerCase().trim() === user.name.toLowerCase().trim())) {
          admins.unshift({ id: String(user.id || 'curr'), name: user.name })
        }

        const teams = users
          .filter(u => {
            const role = (u.role || "").toLowerCase().trim()
            const isTeam = role === "teams" || role === "team" || role === "employee" || role === "developer" || role === "staff"
            const isAdminOrClient = role.includes("admin") || role.includes("client")
            return isTeam && !isAdminOrClient && u.status !== "Inactive"
          })
          .map(u => ({ id: u.id, name: u.name, role: u.department || "Developer" }))

        setAdminsList(admins)
        setTeamsList(teams)

        if (!billedByAdmin && admins.length > 0) {
          setBilledByAdmin(user?.name || admins[0].name)
        }
        if (assignedMembers.length === 0 && teams.length > 0) {
          setAssignedMembers([teams[0].name])
        }
      })
    }
  }, [isOpen, user, client])

  const handleModeChange = (mode: "project_and_invoice" | "invoice_only") => {
    setCreationMode(mode)
    if (mode === "invoice_only") {
      setAssignedMembers([])
    } else if (assignedMembers.length === 0 && teamsList.length > 0) {
      setAssignedMembers([teamsList[0].name])
    }
  }

  // --- Dynamic Service Management ---
  const handleAddService = (preset?: typeof SERVICE_PRESETS[0]) => {
    const newItem: ServiceFormItem = {
      id: `svc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      serviceName: preset?.name || "",
      sacCode: preset?.sac || "998313",
      qty: 1,
      unit: preset?.unit || "Project",
      rate: "",
      charges: [],
      gstRate: preset !== undefined ? preset.gst : 18,
    }
    setServiceItems(prev => [...prev, newItem])
  }

  const handleRemoveService = (id: string) => {
    if (serviceItems.length <= 1) {
      alert("At least one service is required.")
      return
    }
    setServiceItems(prev => prev.filter(s => s.id !== id))
  }

  const handleUpdateService = (id: string, field: keyof ServiceFormItem, value: any) => {
    setServiceItems(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const handleAddCharge = (serviceId: string) => {
    const newCharge = {
      id: `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      amount: "" as number | "",
    }
    setServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, charges: [...s.charges, newCharge] }
      }
      return s
    }))
  }

  const handleRemoveCharge = (serviceId: string, chargeId: string) => {
    setServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, charges: s.charges.filter(c => c.id !== chargeId) }
      }
      return s
    }))
  }

  const handleUpdateCharge = (serviceId: string, chargeId: string, field: "name" | "amount", value: any) => {
    setServiceItems(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          charges: s.charges.map(c => c.id === chargeId ? { ...c, [field]: value } : c)
        }
      }
      return s
    }))
  }

  // --- Dynamic Named Discounts Management ---
  const handleAddDiscount = () => {
    const newDisc: FormDiscountItem = {
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "Promotional Discount",
      amount: "",
    }
    setDiscountsList(prev => [...prev, newDisc])
  }

  const handleRemoveDiscount = (id: string) => {
    setDiscountsList(prev => prev.filter(d => d.id !== id))
  }

  const handleUpdateDiscount = (id: string, field: keyof FormDiscountItem, value: any) => {
    setDiscountsList(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  if (!isOpen || !client) return null

  // --- Combined Mathematical Calculations ---
  const itemCalculations = serviceItems.map((item) => {
    const numRate = typeof item.rate === "number" ? item.rate : 0
    const qty = item.qty > 0 ? item.qty : 1
    const itemCharges = item.charges.reduce((sum, c) => sum + (typeof c.amount === "number" ? c.amount : 0), 0)
    const itemBase = (numRate * qty) + itemCharges
    const itemGst = Math.round(itemBase * (item.gstRate / 100))
    const itemTotal = itemBase + itemGst
    return {
      ...item,
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
  const totalDiscounts = discountsList.reduce((sum, d) => sum + (typeof d.amount === "number" ? d.amount : 0), 0)
  const taxableBase = Math.max(0, totalGross - totalDiscounts)
  const discountRatio = totalGross > 0 ? taxableBase / totalGross : 1

  const finalItemCalculations = itemCalculations.map((item) => {
    const lineTaxable = Math.round(item.itemBase * discountRatio)
    const lineGst = Math.round(lineTaxable * (item.gstRate / 100))
    const lineTotal = lineTaxable + lineGst
    return {
      ...item,
      lineTaxable,
      itemGst: lineGst,
      itemTotal: lineTotal,
    }
  })

  const totalGstAmount = taxableBase > 0 ? finalItemCalculations.reduce((sum, it) => sum + it.itemGst, 0) : 0
  const totalAmount = taxableBase + totalGstAmount

  const numAdvance = typeof advanceAmount === "number" ? advanceAmount : 0
  const numPartInitial = typeof partInitialPayment === "number" ? partInitialPayment : 0

  // Distinct calculations per payment structure
  let effectiveAdvance = 0
  if (paymentModel === "full") {
    effectiveAdvance = paymentStatus === "Paid" ? totalAmount : 0
  } else if (paymentModel === "advance") {
    effectiveAdvance = Math.min(numAdvance, totalAmount)
  } else if (paymentModel === "part") {
    effectiveAdvance = Math.min(numPartInitial, totalAmount)
  }

  const remainingDue = Math.max(0, totalAmount - effectiveAdvance)
  const perInstallment = installmentsCount > 0 && remainingDue > 0 
    ? Math.round(remainingDue / installmentsCount) 
    : remainingDue

  const handleToggleMember = (name: string) => {
    setAssignedMembers(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectTitle.trim()) {
      alert("Please enter a project title.")
      return
    }

    if (serviceItems.some(s => !s.serviceName.trim())) {
      alert("Please ensure every service has a valid name.")
      return
    }

    setIsSubmitting(true)
    try {
      const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`
      const formattedAdvance = `₹${effectiveAdvance.toLocaleString("en-IN")}`
      const formattedDue = `₹${remainingDue.toLocaleString("en-IN")}`

      // Prepared structured line items for invoice & project
      const finalInvoiceItems: InvoiceLineItem[] = itemCalculations.map(it => ({
        id: it.id,
        serviceName: it.serviceName.trim(),
        sacCode: it.sacCode || "998313",
        qty: it.qty,
        unit: it.unit,
        rate: it.numRate,
        charges: it.charges.map(c => ({
          id: c.id,
          name: c.name.trim() || "Additional Setup",
          amount: typeof c.amount === "number" ? c.amount : 0,
        })),
        gstRate: it.gstRate,
        gstAmount: it.itemGst,
        totalAmount: it.itemTotal,
      }))

      const finalDiscounts: AppliedDiscount[] = discountsList
        .filter(d => (typeof d.amount === "number" && d.amount > 0))
        .map(d => ({
          id: d.id,
          name: d.name.trim() || "Discount",
          amount: Number(d.amount),
        }))

      // 1. Add Project (Only in Project & Invoice mode)
      let createdProject: any = null
      if (creationMode === "project_and_invoice") {
        const projectMembers = assignedMembers.map(m => {
          const matched = teamsList.find(t => t.name.toLowerCase().trim() === m.toLowerCase().trim())
          return {
            id: matched?.id ? String(matched.id) : `mem_${m}`,
            name: m,
            role: matched?.role || "Specialist",
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${m}`,
          }
        })

        const computedProjectStatus = remainingDue === 0 
          ? "In Progress" 
          : effectiveAdvance > 0 
            ? "In Progress" 
            : "Payment Pending"

        const computedPaymentStatus = remainingDue === 0 
          ? "Paid" 
          : effectiveAdvance > 0 
            ? (paymentModel === "advance" ? "Advance Received" : "Partially Paid") 
            : "Payment Pending"

        const paymentStructureLabel = paymentModel === "advance"
          ? "Advance Payment"
          : paymentModel === "part"
            ? "Part Payment (Subscription)"
            : "Full Payment"

        const starterMilestones: any[] = [
          {
            id: `ms_fe_${Date.now()}`,
            title: "Phase 1: Architecture & UI Setup",
            stage: "Frontend",
            status: effectiveAdvance > 0 ? "Completed" : "Pending",
            notes: `Project scope initiated. Advance status: ${paymentStatus}.`,
            updatedBy: projectMembers[0]?.name || billedByAdmin,
            updatedAt: new Date().toISOString(),
          },
          {
            id: `ms_be_${Date.now() + 1}`,
            title: "Phase 2: Core Development & Integration",
            stage: "Backend",
            status: "Pending",
            notes: "Development in progress",
            updatedBy: projectMembers[0]?.name || billedByAdmin,
            updatedAt: new Date().toISOString(),
          }
        ]

        createdProject = await addProject({
          title: projectTitle,
          client: client.name,
          clientId: client.id,
          projectType: "Client Project",
          price: formattedTotal,
          startDate,
          deadline,
          progress: effectiveAdvance > 0 ? 15 : 0,
          status: computedProjectStatus as any,
          paymentStatus: computedPaymentStatus as any,
          paymentStructure: paymentStructureLabel as any,
          advanceAmount: effectiveAdvance,
          dueAmount: remainingDue,
          installmentsCount: paymentModel === "part" ? installmentsCount : undefined,
          installmentAmount: paymentModel === "part" ? perInstallment : undefined,
          baseAmount: totalServicesBase,
          setupCharge: totalPlatformCharges,
          discount: totalDiscounts,
          gstRate: itemCalculations[0]?.gstRate || 18,
          gstAmount: totalGstAmount,
          totalAmount,
          items: finalInvoiceItems,
          discountsList: finalDiscounts,
          billedBy: billedByAdmin,
          createdById: user?.id ? String(user.id) : undefined,
          createdByEmail: user?.email,
          labels: [category, computedPaymentStatus],
          description: description || `Client Project for ${client.name}. ${serviceItems.map(s => s.serviceName).join(", ")}. Billed by ${billedByAdmin}.`,
          members: projectMembers,
          milestones: starterMilestones,
        }, targetCompany)
      }

      // 2. Generate Invoice with globally unique ascending number INV(DATE)0001-0002...
      const existingInvoices = await getInvoices("all")
      const invoiceId = generateInvoiceNumber(existingInvoices, new Date(startDate || Date.now()))
      const invoiceStatus = remainingDue === 0 
        ? "Fully paid" 
        : effectiveAdvance > 0 
          ? "Partially paid" 
          : "Not paid"

      const createdInvoice = await addInvoice({
        id: invoiceId,
        client: client.name,
        clientEmail: client.email,
        project: projectTitle,
        billDate: startDate,
        dueDate: deadline,
        baseAmount: totalServicesBase,
        setupCharge: totalPlatformCharges,
        discount: totalDiscounts,
        gstRate: itemCalculations[0]?.gstRate || 18,
        gstAmount: totalGstAmount,
        totalInvoiced: formattedTotal,
        paymentReceived: formattedAdvance,
        due: formattedDue,
        status: invoiceStatus,
        billedBy: billedByAdmin,
        items: finalInvoiceItems,
        discountsList: finalDiscounts,
      }, targetCompany)

      // 3. Automatically create Order in Sales Order List
      await addOrder({
        client: client.name,
        clientEmail: client.email,
        project: projectTitle,
        orderDate: startDate || new Date().toISOString().split("T")[0],
        deliveryDate: deadline || "30-06-2026",
        itemsCount: serviceItems.length,
        totalAmount: formattedTotal,
        paymentStatus: remainingDue === 0 ? "Paid" : effectiveAdvance > 0 ? "Partially paid" : "Unpaid",
        status: effectiveAdvance > 0 ? "Processing" : "Pending",
        notes: description || `Order for: ${projectTitle}. Services: ${serviceItems.map(s => s.serviceName).join(", ")}.`,
        invoiceId: invoiceId,
      }, targetCompany)

      // 4. Record Initial Payment (if advance paid)
      if (effectiveAdvance > 0) {
        await addPayment({
          invoiceId: invoiceId,
          client: client.name,
          clientEmail: client.email,
          project: projectTitle,
          paymentDate: startDate,
          paymentMethod: paymentModel === "advance" ? "Advance (Initial Deposit)" : "Initial Milestone / Part Payment",
          transactionRef: `REC_${Date.now().toString().slice(-6)}`,
          note: `Initial payment for ${projectTitle} (${serviceItems.length} services)`,
          amount: formattedAdvance,
          amountNum: effectiveAdvance,
          status: "Completed",
          companyId: targetCompany,
        })
      }

      // 5. Update Stored Client Record with Latest Contact Info
      try {
        const allClients = await getClients()
        const currentStored = allClients.find(c => c.name.toLowerCase().trim() === client.name.toLowerCase().trim())
        if (currentStored) {
          const currentTotal = parseInt(currentStored.totalInvoiced.replace(/[^0-9]/g, "")) || 0
          const currentPaid = parseInt(currentStored.paymentReceived.replace(/[^0-9]/g, "")) || 0
          const currentDue = parseInt(currentStored.due.replace(/[^0-9]/g, "")) || 0

          await saveStoredClient({
            ...currentStored,
            email: clientEmail.trim() || currentStored.email,
            phone: clientPhone.trim() || currentStored.phone,
            address: clientAddress.trim() || currentStored.address,
            city: clientCity.trim() || currentStored.city,
            state: clientState.trim() || currentStored.state,
            gstNumber: clientGst.trim() || currentStored.gstNumber,
            totalInvoiced: `₹${(currentTotal + totalAmount).toLocaleString("en-IN")}`,
            paymentReceived: `₹${(currentPaid + effectiveAdvance).toLocaleString("en-IN")}`,
            due: `₹${(currentDue + remainingDue).toLocaleString("en-IN")}`,
            projectsCount: (currentStored.projectsCount || 0) + (creationMode === "project_and_invoice" ? 1 : 0),
          })
        }
      } catch (err) {
        console.warn("Could not sync client record:", err)
      }

      onProjectCreated()
      if (onInvoiceCreated) onInvoiceCreated(createdInvoice)
      onClose()
    } catch (err) {
      console.error(err)
      alert("An error occurred while creating the project and invoice.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={18} />
              <span>Multi-Service Project & Billing Setup</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Add multiple custom services, line-level charges, independent GST rates & discounts for <strong>{client.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Creation Mode Toggle */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">Creation Scope</span>
                <span className="text-[11px] text-zinc-500">Choose whether to initialize developer project workspace or tax invoice only</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
              <button
                type="button"
                onClick={() => handleModeChange("project_and_invoice")}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  creationMode === "project_and_invoice"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                🚀 Project & Invoice
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("invoice_only")}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  creationMode === "invoice_only"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                📄 Only Invoice
              </button>
            </div>
          </div>

          {/* Project Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Project / Order Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Complete Digital Transformation Suite"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Website Development">Website Development</option>
                <option value="Software Development">Software Development</option>
                <option value="Android/iOS">Android/iOS</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Domain & Hosting">Domain & Hosting</option>
              </select>
            </div>
          </div>

          {/* Dates & Billed By */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Billed By (Admin)
              </label>
              <select
                value={billedByAdmin}
                onChange={(e) => setBilledByAdmin(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {adminsList.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar size={13} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar size={13} /> Due / Delivery Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>
          </div>

          {/* ---------------- MULTI-SERVICE ITEM BUILDER ---------------- */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 dark:border-blue-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider">
                  Itemized Services & Pricing ({serviceItems.length} {serviceItems.length === 1 ? 'Service' : 'Services'})
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-semibold">Quick Add:</span>
                {SERVICE_PRESETS.slice(0, 4).map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleAddService(preset)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 text-[10px] font-bold text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                  >
                    + {preset.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Dynamic Service Cards */}
            <div className="space-y-3">
              {serviceItems.map((item, index) => {
                const itemCalc = itemCalculations[index]
                return (
                  <div 
                    key={item.id} 
                    className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs space-y-3 relative group"
                  >
                    {/* Header of Item Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-extrabold text-[10px]">
                        SERVICE #{index + 1}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-zinc-900 dark:text-zinc-100">
                          Line Total: ₹{itemCalc?.itemTotal.toLocaleString("en-IN") || 0}
                        </span>
                        {serviceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveService(item.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove this service"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Service Row Fields: Name, Rate, Qty & Unit, GST */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5">
                        <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Custom Service Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Custom React Application"
                          value={item.serviceName}
                          onChange={(e) => handleUpdateService(item.id, "serviceName", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Base Rate (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="e.g. 35000"
                          value={item.rate}
                          onChange={(e) => {
                            const val = e.target.value
                            handleUpdateService(item.id, "rate", val === "" ? "" : Math.max(0, Number(val)))
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Qty & Unit
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleUpdateService(item.id, "qty", Math.max(1, Number(e.target.value)))}
                            className="w-12 px-1.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-center font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => handleUpdateService(item.id, "unit", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          GST Rate
                        </label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleUpdateService(item.id, "gstRate", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100"
                        >
                          <option value={18}>18% (GST)</option>
                          <option value={12}>12% (Print)</option>
                          <option value={5}>5%</option>
                          <option value={0}>0% (Non-GST)</option>
                        </select>
                      </div>
                    </div>

                    {/* Inline Item-Specific Extra Charges */}
                    <div className="pt-1 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                          Item-Level Extra Charges / Add-ons ({item.charges.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddCharge(item.id)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Add Specific Charge</span>
                        </button>
                      </div>

                      {item.charges.length > 0 && (
                        <div className="space-y-1.5 pl-2 border-l-2 border-blue-300 dark:border-blue-700">
                          {item.charges.map((chg) => (
                            <div key={chg.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Charge name (e.g. Dedicated Server Setup)"
                                value={chg.name}
                                onChange={(e) => handleUpdateCharge(item.id, chg.id, "name", e.target.value)}
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
                                    handleUpdateCharge(item.id, chg.id, "amount", val === "" ? "" : Math.max(0, Number(val)))
                                  }}
                                  className="w-24 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-[11px]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCharge(item.id, chg.id)}
                                className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Another Service Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleAddService()}
                className="w-full py-2 rounded-xl bg-white dark:bg-zinc-900 border border-dashed border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Another Service / Product</span>
              </button>
            </div>
          </div>

          {/* ---------------- NAMED MULTI-DISCOUNTS SECTION ---------------- */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                <Tag size={13} className="text-amber-600" />
                <span>Promotional Discounts & Rebates ({discountsList.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddDiscount}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Discount</span>
              </button>
            </div>

            {discountsList.length === 0 ? (
              <p className="text-[11px] text-zinc-400 italic">No discounts applied. Click &quot;Add Discount&quot; to apply custom promotional rebates.</p>
            ) : (
              <div className="space-y-1.5">
                {discountsList.map((disc) => (
                  <div key={disc.id} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <input
                      type="text"
                      placeholder="Discount Title (e.g. Festival Offer / Referral 10%)"
                      value={disc.name}
                      onChange={(e) => handleUpdateDiscount(disc.id, "name", e.target.value)}
                      className="flex-1 px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium"
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
                          handleUpdateDiscount(disc.id, "amount", val === "" ? "" : Math.max(0, Number(val)))
                        }}
                        className="w-28 px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-xs text-rose-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiscount(disc.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------------- LIVE FINANCIAL SUMMARY LEDGER ---------------- */}
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white space-y-2 text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-zinc-400 text-[10px]">
                Consolidated Financial Summary
              </span>
              <span className="font-bold text-zinc-300 text-[11px]">
                {serviceItems.length} Services Itemized
              </span>
            </div>

            <div className="space-y-1 text-zinc-300 text-[11px]">
              <div className="flex justify-between">
                <span>Total Services Base Value:</span>
                <span className="font-mono font-bold text-white">₹{totalServicesBase.toLocaleString("en-IN")}</span>
              </div>

              {totalPlatformCharges > 0 && (
                <div className="flex justify-between text-blue-300">
                  <span>Total Additional / Setup Charges:</span>
                  <span className="font-mono font-bold">₹{totalPlatformCharges.toLocaleString("en-IN")}</span>
                </div>
              )}

              {totalDiscounts > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Total Discounts Applied:</span>
                  <span className="font-mono font-bold">(-) ₹{totalDiscounts.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-t border-zinc-800 font-bold text-white">
                <span>Taxable Base Value:</span>
                <span className="font-mono">₹{taxableBase.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Total GST Taxes:</span>
                <span className="font-mono font-bold text-blue-400">₹{totalGstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between py-1.5 text-base font-black text-emerald-400 border-t border-zinc-700">
                <span>Grand Total (Net Payable):</span>
                <span className="font-mono">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* ---------------- PAYMENT TERMS & DOWNPAYMENT ---------------- */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
              <div className="flex items-center gap-1.5">
                <Calculator size={14} className="text-blue-600" />
                <span>Payment Plan & Settlement Structure</span>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setPaymentModel("advance")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    paymentModel === "advance"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  🪙 Advance
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModel("part")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    paymentModel === "part"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  🔄 Part Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModel("full")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    paymentModel === "full"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  💳 Full (100%)
                </button>
              </div>
            </div>

            {/* Advance Option */}
            {paymentModel === "advance" && (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Coins size={13} /> Advance Down Payment (₹)
                  </label>
                  <div className="flex items-center gap-1">
                    {[0.25, 0.40, 0.50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAdvanceAmount(Math.round(totalAmount * pct))}
                        className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[9px] font-bold cursor-pointer"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter initial advance (e.g. 20000)"
                  value={advanceAmount}
                  onChange={(e) => {
                    const val = e.target.value
                    setAdvanceAmount(val === "" ? "" : Math.max(0, Number(val)))
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-zinc-900 dark:text-zinc-100"
                />
                <div className="flex justify-between text-[10.5px] pt-1">
                  <span className="text-zinc-500">Initial Paid: <strong className="text-emerald-600 font-mono">₹{effectiveAdvance.toLocaleString("en-IN")}</strong></span>
                  <span className="text-zinc-500">Balance Due on Delivery: <strong className="text-rose-600 font-mono">₹{remainingDue.toLocaleString("en-IN")}</strong></span>
                </div>
              </div>
            )}

            {/* Part Payment (Subscription) Option */}
            {paymentModel === "part" && (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-blue-300 dark:border-blue-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block mb-1">
                      Initial Deposit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={partInitialPayment}
                      onChange={(e) => {
                        const val = e.target.value
                        setPartInitialPayment(val === "" ? "" : Math.max(0, Number(val)))
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold"
                      placeholder="Initial payment"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block mb-1">
                      Installments Count
                    </label>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold"
                    >
                      <option value={2}>2 Installments</option>
                      <option value={3}>3 Installments</option>
                      <option value={4}>4 Installments</option>
                      <option value={6}>6 Installments</option>
                      <option value={12}>12 Installments</option>
                    </select>
                  </div>
                </div>
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 text-[10.5px] text-blue-900 dark:text-blue-200 font-medium">
                  💡 Balance of <strong className="font-mono">₹{remainingDue.toLocaleString("en-IN")}</strong> split into <strong className="font-mono">{installmentsCount}</strong> {billingCycle.toLowerCase()} parts of <strong className="font-mono">₹{perInstallment.toLocaleString("en-IN")}</strong> each.
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>{isSubmitting ? "Generating Setup..." : creationMode === "project_and_invoice" ? "Create Project & Generate Invoice" : "Generate Invoice Only"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
