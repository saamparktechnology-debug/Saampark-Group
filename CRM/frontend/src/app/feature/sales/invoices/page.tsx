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
  Building2
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { 
  getInvoices, 
  addInvoice, 
  deleteInvoice, 
  markPaymentCompleted, 
  sendPaymentReminder, 
  InvoiceItem, 
  InvoiceStatus 
} from "./services/invoiceService"
import { useAuthStore } from "@/store/useAuthStore"
import { InvoiceModal } from "./components/InvoiceModal"
import { getStoredClients } from "@/app/feature/clients/services/clientService"
import { getProjects } from "@/app/feature/projects/services/projectService"

export default function InvoicesPage() {
  const { user } = useAuthStore()
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [activeTab, setActiveTab] = React.useState("invoices")
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Payment Recording / Pay Now Modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = React.useState<InvoiceItem | null>(null)
  const [paymentMethod, setPaymentMethod] = React.useState("UPI / Net Banking")
  const [paymentRef, setPaymentRef] = React.useState("")

  // Add Invoice Form state
  const [clientName, setClientName] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [projectName, setProjectName] = React.useState("")
  const [baseAmount, setBaseAmount] = React.useState<number>(50000)
  const [gstRate, setGstRate] = React.useState<number>(18)
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<InvoiceStatus>("Not paid")

  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])
  const [availableProjects, setAvailableProjects] = React.useState<{ title: string; client: string }[]>([])

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
    return () => clearInterval(interval)
  }, [loadInvoices])

  React.useEffect(() => {
    if (isAddModalOpen) {
      const clients = getStoredClients()
      setAvailableClients(clients.map(c => ({ name: c.name, email: c.email || "" })))
      if (clients.length > 0) {
        setClientName(clients[0].name)
        setClientEmail(clients[0].email || "")
      }

      getProjects().then(projs => {
        setAvailableProjects(projs.map(p => ({ title: p.title, client: p.client })))
        if (projs.length > 0) setProjectName(projs[0].title)
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
    const updated = await markPaymentCompleted(paymentModalInvoice.id, paymentMethod, paymentRef)
    if (updated) {
      showToast(`✅ Payment completed! Invoice ${paymentModalInvoice.id} is now Fully Paid and synced to Payments.`)
      setPaymentModalInvoice(null)
      setPaymentRef("")
      loadInvoices()
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
    if (!clientName || !projectName) {
      alert("Please select client and project.")
      return
    }

    const gstAmount = Math.round(baseAmount * (gstRate / 100))
    const totalAmount = baseAmount + gstAmount
    const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`
    const isPaid = status === "Fully paid"

    await addInvoice({
      client: clientName,
      clientEmail: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      project: projectName,
      billDate: new Date().toLocaleDateString("en-GB"),
      dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-GB"),
      baseAmount,
      gstRate,
      gstAmount,
      totalInvoiced: formattedTotal,
      paymentReceived: isPaid ? formattedTotal : "₹0",
      due: isPaid ? "₹0" : formattedTotal,
      status,
      billedBy: "Admin",
    })

    showToast(`✅ Invoice created successfully for ${clientName}!`)
    setIsAddModalOpen(false)
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
  const totalInvoicedNum = displayedInvoices.reduce((sum, i) => sum + (parseInt(i.totalInvoiced.replace(/[^0-9]/g, "")) || 0), 0)
  const totalReceivedNum = displayedInvoices.reduce((sum, i) => sum + (parseInt(i.paymentReceived.replace(/[^0-9]/g, "")) || 0), 0)
  const totalDueNum = displayedInvoices.reduce((sum, i) => sum + (parseInt(i.due.replace(/[^0-9]/g, "")) || 0), 0)
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
      cell: ({ row }) => <div className="text-emerald-600 dark:text-emerald-400 font-semibold">{row.getValue("paymentReceived")}</div>,
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
                  Confirm Settlement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- CREATE INVOICE MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Create Tax Invoice</h3>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Client Name *</label>
                  {availableClients.length > 0 ? (
                    <select
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value)
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
                      placeholder="Client Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Project / Service *</label>
                  {availableProjects.length > 0 ? (
                    <select
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
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
                      placeholder="Project Title"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Base Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={baseAmount}
                      onChange={(e) => setBaseAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">GST Rate (%)</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18% (Standard GST)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="Not paid">Not paid</option>
                      <option value="Fully paid">Fully paid</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-xs flex justify-between font-bold text-blue-900 dark:text-blue-200">
                  <span>Total Payable:</span>
                  <span>₹{(baseAmount + Math.round(baseAmount * (gstRate / 100))).toLocaleString("en-IN")}</span>
                </div>

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
