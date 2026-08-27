"use client"

import * as React from "react"
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
  Tag
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { 
  InvoiceItem, 
  InvoiceLineItem,
  AppliedDiscount,
  InvoiceStatus, 
  getInvoices, 
  generateInvoiceNumber,
  addInvoice, 
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

export default function InvoicesPage() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddInvoice = canPerformAction(user, "Sales", "add")
  const canDeleteInvoice = canPerformAction(user, "Sales", "delete")
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [activeTab, setActiveTab] = React.useState<"all" | InvoiceStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
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

  // Dynamic Multi-Services State for Invoices
  const [invoiceServiceItems, setInvoiceServiceItems] = React.useState<any[]>([
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

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadInvoices = React.useCallback(async () => {
    const data = await getInvoices()
    setInvoices(data)
  }, [])

  React.useEffect(() => {
    loadInvoices()
    const interval = setInterval(loadInvoices, 4000)
    window.addEventListener("storage", loadInvoices)
    window.addEventListener("saampark_data_synced", loadInvoices)
    window.addEventListener("saampark_company_switched", loadInvoices)
    window.addEventListener("saampark_invoices_updated", loadInvoices)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", loadInvoices)
      window.removeEventListener("saampark_data_synced", loadInvoices)
      window.removeEventListener("saampark_company_switched", loadInvoices)
      window.removeEventListener("saampark_invoices_updated", loadInvoices)
    }
  }, [loadInvoices, useAuthStore.getState().activeCompanyId])


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
      setBaseAmount("")
      setSetupCharge("")
      setDiscount("")
      setInvoiceServiceItems([
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
      setCustomProjectName("")
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
    const res = await sendPaymentReminder(invoice.id)
    if (res.success) {
      showToast(`🔔 Payment reminder dispatched to ${invoice.client} for ${invoice.due || invoice.totalInvoiced}!`)
      loadInvoices()
    } else {
      showToast(`⚠️ ${res.message}`)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentModalInvoice) return
    if (paymentTypeOption === "part" && customPartPaymentAmount > 0) {
      const updated = await recordPartialPayment(
        paymentModalInvoice.id,
        customPartPaymentAmount,
        paymentMethod,
        paymentRef
      )
      if (updated) {
        showToast(`✅ Partial installment of ₹${customPartPaymentAmount.toLocaleString("en-IN")} recorded for ${paymentModalInvoice.id}!`)
        setPaymentModalInvoice(null)
        setPaymentRef("")
        setCustomPartPaymentAmount(0)
        loadInvoices()
      }
    } else {
      const updated = await markPaymentCompleted(paymentModalInvoice.id, paymentMethod, paymentRef)
      if (updated) {
        showToast(`✅ Payment completed! Invoice ${paymentModalInvoice.id} is now Fully Paid and synced to Payments.`)
        setPaymentModalInvoice(null)
        setPaymentRef("")
        loadInvoices()
      }
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      await deleteInvoice(id)
      setInvoices(prev => prev.filter(i => i.id !== id))
      showToast("Invoice deleted.")
    }
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
    const itemCalculations = invoiceServiceItems.map((item) => {
      const numRate = typeof item.rate === "number" ? item.rate : 0
      const qty = item.qty > 0 ? item.qty : 1
      const itemCharges = (item.charges || []).reduce((sum: number, c: any) => sum + (typeof c.amount === "number" ? c.amount : 0), 0)
      const itemBase = (numRate * qty) + itemCharges
      const itemGst = Math.round(itemBase * ((item.gstRate !== undefined ? item.gstRate : 18) / 100))
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
    const totalDiscounts = invoiceDiscounts.reduce((sum, d) => sum + (typeof d.amount === "number" ? d.amount : 0), 0)
    const taxableBase = Math.max(0, totalGross - totalDiscounts)
    const discountRatio = totalGross > 0 ? taxableBase / totalGross : 1

    const finalItemCalculations = itemCalculations.map((item) => {
      const lineTaxable = Math.round(item.itemBase * discountRatio)
      const lineGst = Math.round(lineTaxable * ((item.gstRate !== undefined ? item.gstRate : 18) / 100))
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
    const invoiceId = generateInvoiceNumber(allInvoices)
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
        })
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
          })
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
      gstRate: itemCalculations[0]?.gstRate || 18,
      gstAmount: totalGstAmount,
      totalInvoiced: formattedTotal,
      paymentReceived: formattedReceived,
      due: formattedDue,
      status: finalStatus,
      billedBy: user?.name || "Admin",
      items: finalInvoiceItems,
      discountsList: finalDiscounts,
    })

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
      })
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
        })
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
        })
      } catch (err) {
        console.warn("Error creating subscription for part payment:", err)
      }
    }

    showToast(`✅ Tax Invoice ${invoiceId} created successfully for ${finalClientName}!`)
    setIsAddModalOpen(false)
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
    if (!isClientRole) return invoices
    return invoices.filter((i) => {
      const iEmail = (i.clientEmail || "").toLowerCase().trim()
      const iName = (i.client || "").toLowerCase().trim()
      return (
        (clientEmailNorm && iEmail === clientEmailNorm) ||
        (clientNameNorm && iName === clientNameNorm) ||
        (clientNameNorm && (iName.includes(clientNameNorm) || clientNameNorm.includes(iName)))
      )
    })
  }, [invoices, isClientRole, clientEmailNorm, clientNameNorm])

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
      cell: ({ row }) => <div className="text-zinc-500 text-xs font-mono">{row.getValue("dueDate")}</div>,
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

            <button
              type="button"
              onClick={() => {
                setSelectedInvoice(inv)
                setIsInvoiceModalOpen(true)
              }}
              className="p-1 text-zinc-500 hover:text-blue-600 transition-colors"
              title="View Invoice"
            >
              <Eye size={14} />
            </button>

            {!isClientRole && (
              <button
                type="button"
                onClick={() => handleDeleteInvoice(inv.id)}
                className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
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

          {!isClientRole && (
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
        <DataTable 
          columns={columns} 
          data={displayedInvoices} 
          searchKey="client"
        />
      </div>

      {/* ---------------- IMMERSIVE TAX INVOICE MODAL ---------------- */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={selectedInvoice}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setSelectedInvoice(null)
        }}
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
    </motion.div>
  )
}
