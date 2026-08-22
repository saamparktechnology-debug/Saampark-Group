"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Printer, 
  ShoppingBag, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  X,
  Check,
  Calendar,
  Building2,
  Receipt,
  BellRing,
  FileText
} from "lucide-react"
import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"
import { useAuthStore } from "@/store/useAuthStore"
import { addInvoice } from "../invoices/services/invoiceService"
import { addPayment, sendPaymentReminderNotification } from "../payments/services/paymentService"
import { getStoredClients } from "@/app/feature/clients/services/clientService"
import { getProjects } from "@/app/feature/projects/services/projectService"

type OrderStatus = "Pending" | "Processing" | "Completed" | "Cancelled"
type PaymentStatus = "Paid" | "Partially paid" | "Unpaid"

interface OrderItem {
  id: string
  orderNumber: string
  client: string
  clientEmail?: string
  project: string
  orderDate: string
  deliveryDate: string
  itemsCount: number
  totalAmount: string
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes?: string
  lastReminderSent?: string
}

const INITIAL_ORDERS: OrderItem[] = []

export default function OrderListPage() {
  const { user } = useAuthStore()
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [orders, setOrders] = React.useState<OrderItem[]>([])
  const [activeTab, setActiveTab] = React.useState<"all" | OrderStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<OrderItem | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Form states for new order
  const [client, setClient] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [project, setProject] = React.useState("")
  const [totalAmount, setTotalAmount] = React.useState("")
  const [deliveryDate, setDeliveryDate] = React.useState("")
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>("Unpaid")
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus>("Pending")
  const [notes, setNotes] = React.useState("")

  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])
  const [availableProjects, setAvailableProjects] = React.useState<{ title: string; client: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadOrders = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<OrderItem[]>("orders", [])
    setOrders(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [])

  React.useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 4000)
    return () => clearInterval(interval)
  }, [loadOrders])

  React.useEffect(() => {
    if (isAddModalOpen) {
      const clients = getStoredClients()
      setAvailableClients(clients.map(c => ({ name: c.name, email: c.email || "" })))
      if (clients.length > 0) {
        setClient(clients[0].name)
        setClientEmail(clients[0].email || "")
      }

      getProjects().then(projs => {
        setAvailableProjects(projs.map(p => ({ title: p.title, client: p.client })))
        if (projs.length > 0) setProject(projs[0].title)
      })
    }
  }, [isAddModalOpen])

  const displayedOrders = React.useMemo(() => {
    if (!isClientRole) return orders
    return orders.filter((o) => {
      const oEmail = (o.clientEmail || "").toLowerCase().trim()
      const oName = (o.client || "").toLowerCase().trim()
      return (
        (clientEmailNorm && oEmail === clientEmailNorm) ||
        (clientNameNorm && oName === clientNameNorm) ||
        (clientNameNorm && (oName.includes(clientNameNorm) || clientNameNorm.includes(oName)))
      )
    })
  }, [orders, isClientRole, clientEmailNorm, clientNameNorm])

  const filteredOrders = React.useMemo(() => {
    return displayedOrders.filter((ord) => {
      const matchesSearch =
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.totalAmount.toLowerCase().includes(searchQuery.toLowerCase())

      if (activeTab === "all") return matchesSearch
      return matchesSearch && ord.status === activeTab
    })
  }, [displayedOrders, searchQuery, activeTab])

  const handleDeleteOrder = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      const strId = String(id).toLowerCase().trim()
      await markGlobalItemDeleted(strId, "orders")
      const updated = orders.filter((o) => String(o.id).toLowerCase().trim() !== strId)
      setOrders(updated)
      await saveModuleDataToDB("orders", updated)
      showToast("Order removed.")
    }
  }

  const handleSendReminder = async (ord: OrderItem) => {
    const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    const updated = orders.map(o => o.id === ord.id ? { ...o, lastReminderSent: now } : o)
    setOrders(updated)
    await saveModuleDataToDB("orders", updated)

    if (ord.clientEmail) {
      await sendPaymentReminderNotification(
        ord.clientEmail,
        ord.client,
        ord.orderNumber,
        ord.totalAmount,
        ord.deliveryDate
      )
    }

    showToast(`🔔 Payment reminder sent to ${ord.client} for ${ord.totalAmount}!`)
  }

  const handleMarkPaymentCompleted = async (ord: OrderItem) => {
    const updated = orders.map(o => o.id === ord.id ? { ...o, paymentStatus: "Paid" as PaymentStatus, status: "Completed" as OrderStatus } : o)
    setOrders(updated)
    await saveModuleDataToDB("orders", updated)

    const numAmount = parseInt(ord.totalAmount.replace(/[^0-9]/g, "")) || 0
    await addPayment({
      invoiceId: ord.orderNumber,
      client: ord.client,
      clientEmail: ord.clientEmail,
      project: ord.project,
      paymentDate: new Date().toLocaleDateString("en-GB"),
      paymentMethod: "UPI / Net Banking",
      transactionRef: `ORD_PAY_${Date.now()}`,
      note: `Payment settlement for ${ord.orderNumber}`,
      amount: ord.totalAmount,
      amountNum: numAmount,
      status: "Completed"
    })

    showToast(`✅ Payment completed for ${ord.orderNumber}! Synced to Payments.`)
  }

  const handleGenerateInvoice = async (ord: OrderItem) => {
    const baseAmt = parseInt(ord.totalAmount.replace(/[^0-9]/g, "")) || 10000
    const inv = await addInvoice({
      client: ord.client,
      clientEmail: ord.clientEmail,
      project: ord.project,
      billDate: new Date().toLocaleDateString("en-GB"),
      dueDate: ord.deliveryDate,
      baseAmount: baseAmt,
      gstRate: 18,
      gstAmount: Math.round(baseAmt * 0.18),
      totalInvoiced: ord.totalAmount,
      paymentReceived: ord.paymentStatus === "Paid" ? ord.totalAmount : "₹0",
      due: ord.paymentStatus === "Paid" ? "₹0" : ord.totalAmount,
      status: ord.paymentStatus === "Paid" ? "Fully paid" : "Not paid",
      billedBy: "Admin"
    })

    showToast(`📄 Tax Invoice ${inv.id} generated for ${ord.client}!`)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client.trim() || !project.trim() || !totalAmount.trim()) {
      alert("Please fill in client, project, and total amount fields.")
      return
    }

    const nextId = `ord_${Date.now()}`
    const orderNumber = `ORD #${Math.floor(1000 + Math.random() * 9000)}`
    const formattedAmount = totalAmount.startsWith("₹") ? totalAmount : `₹${totalAmount}`

    const newOrder: OrderItem = {
      id: nextId,
      orderNumber,
      client,
      clientEmail: clientEmail || `${client.toLowerCase().replace(/\s+/g, '')}@example.com`,
      project,
      orderDate: new Date().toLocaleDateString("en-GB"),
      deliveryDate: deliveryDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-GB"),
      itemsCount: 1,
      totalAmount: formattedAmount,
      paymentStatus,
      status: orderStatus,
      notes: notes || `Order generated for ${client}.`
    }

    const updated = [newOrder, ...orders]
    setOrders(updated)
    await saveModuleDataToDB("orders", updated)

    showToast(`✅ Order ${orderNumber} created successfully!`)
    setClient("")
    setClientEmail("")
    setProject("")
    setTotalAmount("")
    setDeliveryDate("")
    setNotes("")
    setIsAddModalOpen(false)
  }

  const handleExportCSV = () => {
    const headers = ["Order Number,Client,Project,Order Date,Delivery Date,Total Amount,Payment Status,Order Status"]
    const rows = filteredOrders.map(
      (o) => `"${o.orderNumber}","${o.client}","${o.project}",${o.orderDate},${o.deliveryDate},"${o.totalAmount}",${o.paymentStatus},${o.status}`
    )
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `orders_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalValue = displayedOrders.reduce((sum, o) => {
    const num = parseInt(o.totalAmount.replace(/[^0-9]/g, "")) || 0
    return sum + num
  }, 0)

  const completedCount = displayedOrders.filter(o => o.status === "Completed").length
  const pendingCount = displayedOrders.filter(o => o.status === "Pending" || o.status === "Processing").length

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
            <ShoppingBag className="text-blue-600 dark:text-blue-400" size={24} />
            <span>{isClientRole ? "My Orders & Deliverables" : "Order List"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClientRole
              ? "Track your ongoing project milestones, order scopes, and estimated delivery dates."
              : "Manage real client orders, fulfillment timelines, payment reminders, and invoicing"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <Download size={13} className="text-zinc-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {!isClientRole && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Add Order</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">{isClientRole ? "My Total Orders" : "Total Orders"}</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{displayedOrders.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Processing / Pending</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Completed</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Value</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">₹{totalValue.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- FILTER TABS & SEARCH BAR ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(["all", "Pending", "Processing", "Completed", "Cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab === "all" ? "All Orders" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search orders, clients, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-zinc-400" />
        </div>
      </div>

      {/* ---------------- ORDERS TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Project / Service</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {filteredOrders.map((ord) => {
                let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                if (ord.status === "Completed") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                if (ord.status === "Processing") statusBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                if (ord.status === "Pending") statusBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                if (ord.status === "Cancelled") statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"

                let paymentBadge = "bg-zinc-100 text-zinc-700"
                if (ord.paymentStatus === "Paid") paymentBadge = "bg-emerald-50 text-emerald-600 font-semibold"
                if (ord.paymentStatus === "Partially paid") paymentBadge = "bg-blue-50 text-blue-600 font-semibold"
                if (ord.paymentStatus === "Unpaid") paymentBadge = "bg-rose-50 text-rose-600 font-semibold"

                const isUnpaid = ord.paymentStatus !== "Paid"

                return (
                  <tr 
                    key={ord.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(ord)
                          setIsDetailModalOpen(true)
                        }}
                        className="hover:underline cursor-pointer"
                      >
                        {ord.orderNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div>{ord.client}</div>
                      <div className="text-[11px] text-zinc-400 font-normal">{ord.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                      {ord.project}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {ord.orderDate}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {ord.deliveryDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {ord.totalAmount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${paymentBadge}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${statusBadge}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isClientRole && isUnpaid && (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(ord)}
                            className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-semibold flex items-center gap-1 border border-amber-200"
                            title="Send payment reminder to client"
                          >
                            <BellRing size={11} className="text-amber-600" />
                            <span>Remind</span>
                          </button>
                        )}

                        {!isClientRole && isUnpaid && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaymentCompleted(ord)}
                            className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-semibold flex items-center gap-1 border border-emerald-200"
                            title="Mark payment as completed"
                          >
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Paid</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleGenerateInvoice(ord)}
                          className="p-1 hover:text-blue-600 transition-colors"
                          title="Generate / View Tax Invoice"
                        >
                          <FileText size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord)
                            setIsDetailModalOpen(true)
                          }}
                          className="p-1 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {!isClientRole && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-zinc-400">
                    No orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- ORDER DETAILS MODAL ---------------- */}
      <AnimatePresence>
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-600" />
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {selectedOrder.orderNumber} Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-400 font-medium">Client</span>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedOrder.client}</p>
                    <p className="text-[11px] text-zinc-500">{selectedOrder.clientEmail}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Total Amount</span>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">{selectedOrder.totalAmount}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Order Date</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedOrder.orderDate}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Delivery Date</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">{selectedOrder.deliveryDate}</p>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 font-medium">Project / Scope</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-1">{selectedOrder.project}</p>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <span className="text-zinc-400 font-medium">Notes & Instructions</span>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Payment Status</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedOrder.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Fulfillment Status</span>
                    <span className="font-bold text-blue-600">{selectedOrder.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- ADD ORDER MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Create New Order</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Client Name *</label>
                  {availableClients.length > 0 ? (
                    <select
                      value={client}
                      onChange={(e) => {
                        setClient(e.target.value)
                        const c = availableClients.find(ac => ac.name === e.target.value)
                        if (c) setClientEmail(c.email)
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      {availableClients.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Project / Ordered Services *</label>
                  {availableProjects.length > 0 ? (
                    <select
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      {availableProjects.map(p => (
                        <option key={p.title} value={p.title}>{p.title} ({p.client})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Custom Web App Development"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Total Amount (₹) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50,000"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially paid">Partially paid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Order Status</label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Specific delivery notes or requirements"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Save Order
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
