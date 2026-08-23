"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Download, 
  CreditCard, 
  Search, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Trash2, 
  X, 
  Send, 
  Eye,
  TrendingUp,
  Receipt
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { useAuthStore } from "@/store/useAuthStore"
import { getPayments, addPayment, deletePayment, PaymentItem } from "./services/paymentService"
import { getInvoices, InvoiceItem } from "../invoices/services/invoiceService"
import { getStoredClients } from "@/app/feature/clients/services/clientService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [activeTab, setActiveTab] = React.useState("list")
  const [payments, setPayments] = React.useState<PaymentItem[]>([])
  const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentItem | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Add Payment form state
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string>("")
  const [client, setClient] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [project, setProject] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("UPI / Net Banking")
  const [transactionRef, setTransactionRef] = React.useState("")
  const [paymentDate, setPaymentDate] = React.useState("")
  const [note, setNote] = React.useState("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadData = React.useCallback(async () => {
    const [pList, invList] = await Promise.all([
      getPayments(),
      getInvoices()
    ])
    setPayments(pList)
    setInvoices(invList)
  }, [])

  React.useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId)
    const target = invoices.find(i => i.id === invId)
    if (target) {
      setClient(target.client)
      setClientEmail(target.clientEmail || "")
      setProject(target.project)
      const dueVal = target.due && target.due !== "₹0" ? target.due : target.totalInvoiced
      setAmount(dueVal.replace(/[^0-9]/g, ""))
    }
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !amount) {
      alert("Please provide client and amount.")
      return
    }

    const numAmount = parseInt(amount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`

    await addPayment({
      invoiceId: selectedInvoiceId || "Custom Payment",
      client,
      clientEmail: clientEmail || `${client.toLowerCase().replace(/\s+/g, '')}@example.com`,
      project: project || "Consulting & Services",
      paymentDate: paymentDate || new Date().toLocaleDateString("en-GB"),
      paymentMethod,
      transactionRef: transactionRef || `TXN${Date.now()}`,
      note: note || `Payment received for ${client}`,
      amount: formattedAmount,
      amountNum: numAmount,
      status: "Completed"
    })

    showToast(`✅ Payment of ${formattedAmount} recorded successfully!`)
    setIsAddPaymentModalOpen(false)
    // reset
    setSelectedInvoiceId("")
    setClient("")
    setClientEmail("")
    setProject("")
    setAmount("")
    setTransactionRef("")
    setNote("")
    loadData()
  }

  const handleDeletePayment = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      await deletePayment(id)
      setPayments(prev => prev.filter(p => p.id !== id))
      showToast("Payment record removed.")
    }
  }

  const displayedPayments = React.useMemo(() => {
    if (!isClientRole) return payments
    return payments.filter((p) => {
      const pEmail = (p.clientEmail || "").toLowerCase().trim()
      const pName = (p.client || "").toLowerCase().trim()
      return (
        (clientEmailNorm && pEmail === clientEmailNorm) ||
        (clientNameNorm && pName === clientNameNorm) ||
        (clientNameNorm && (pName.includes(clientNameNorm) || clientNameNorm.includes(pName)))
      )
    })
  }, [payments, isClientRole, clientEmailNorm, clientNameNorm])

  const totalAmountNum = displayedPayments.reduce((sum, p) => sum + (p.amountNum || (parseInt(p.amount.replace(/[^0-9]/g, "")) || 0)), 0)
  const totalTransactions = displayedPayments.length
  const avgPayment = totalTransactions > 0 ? Math.round(totalAmountNum / totalTransactions) : 0

  const columns: ColumnDef<PaymentItem>[] = [
    {
      accessorKey: "invoiceId",
      header: "Invoice / Ref ID",
      cell: ({ row }) => (
        <div className="font-bold text-blue-600 dark:text-blue-400">
          {row.getValue("invoiceId")}
        </div>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.getValue("client")}</div>
          <div className="text-[11px] text-zinc-400">{row.original.clientEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <div className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
          {row.getValue("project")}
        </div>
      ),
    },
    {
      accessorKey: "paymentDate",
      header: "Payment date",
      cell: ({ row }) => <div className="text-zinc-500 font-mono text-xs">{row.getValue("paymentDate")}</div>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
          <CreditCard size={13} className="text-zinc-400" />
          <span>{row.getValue("paymentMethod")}</span>
        </div>
      ),
    },
    {
      accessorKey: "transactionRef",
      header: "Transaction Ref",
      cell: ({ row }) => (
        <div className="text-zinc-500 font-mono text-[11px]">
          {row.getValue("transactionRef") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <div className="font-bold text-emerald-600 dark:text-emerald-400">{row.getValue("amount")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedPayment(row.original)}
            className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
            title="View Receipt"
          >
            <Receipt size={14} />
          </button>
          {!isClientRole && (
            <button
              type="button"
              onClick={() => handleDeletePayment(row.original.id)}
              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
              title="Delete Payment"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
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

      {/* ---------------- TOP HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={24} />
            <span>{isClientRole ? "My Payment Receipts & Ledger" : "Payments Received"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClientRole
              ? "Review your confirmed payment settlements and download official tax receipts."
              : "Real-time settlement history, transaction references, and payment receipts"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Payment_Receipts",
                title: "Payments Received Report",
                subtitle: "Settlement Ledger",
                headers: ["#", "Payment ID", "Invoice #", "Client Name", "Amount", "Payment Method", "Payment Date", "Transaction Ref", "Status"],
                rows: payments.map((p, idx) => [
                  idx + 1,
                  p.id,
                  p.invoiceId,
                  p.client,
                  p.amount,
                  p.paymentMethod,
                  p.paymentDate,
                  p.transactionRef || "-",
                  p.status,
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
                title: "Payments Received Report",
                subtitle: "Settlement Ledger",
                headers: ["#", "Payment ID", "Invoice #", "Client Name", "Amount", "Method", "Date", "Transaction Ref", "Status"],
                rows: payments.map((p, idx) => [
                  idx + 1,
                  p.id,
                  p.invoiceId,
                  p.client,
                  p.amount,
                  p.paymentMethod,
                  p.paymentDate,
                  p.transactionRef || "-",
                  p.status,
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
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">{isClientRole ? "Total Amount Paid" : "Total Collections"}</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{totalAmountNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Transactions</p>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{totalTransactions}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <Receipt size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Average Ticket Size</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">₹{avgPayment.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- TABS & TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 shadow-2xs">
        <Tabs 
          tabs={[{ id: 'list', label: 'List View' }, { id: 'chart', label: 'Analytics Chart' }]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        {activeTab === 'list' ? (
          <>
            <DataTable 
              columns={columns} 
              data={displayedPayments} 
              searchKey="client"
            />
            {/* Summary Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-4 flex justify-end gap-12 pr-8 text-xs">
              <div className="text-zinc-500 font-semibold">{isClientRole ? "My Total Paid:" : "Total Settlements Received:"}</div>
              <div className="font-bold text-emerald-600 text-sm">₹{totalAmountNum.toLocaleString("en-IN")}</div>
            </div>
          </>
        ) : (
          <div className="py-8 space-y-6">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Payment Collections Breakdown</h3>
            <div className="space-y-3 max-w-xl">
              {displayedPayments.map((p) => {
                const percentage = totalAmountNum > 0 ? Math.round(((p.amountNum || 0) / totalAmountNum) * 100) : 0
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700 dark:text-zinc-300">{p.client} ({p.paymentMethod})</span>
                      <span className="text-emerald-600">{p.amount} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- RECORD PAYMENT MODAL ---------------- */}
      <AnimatePresence>
        {isAddPaymentModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Record New Payment</h3>
                <button type="button" onClick={() => setIsAddPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Link to Tax Invoice (Optional)</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">-- Direct Payment (No Invoice) --</option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} - {inv.client} (Total: {inv.totalInvoiced}, Due: {inv.due})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Client Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Client Email</label>
                    <input
                      type="email"
                      placeholder="client@acme.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Project / Purpose</label>
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Amount Received (₹) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25,000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-bold"
                    />
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Transaction Ref / UTR</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR891238491"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Milestone clearance notes"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- RECEIPT VIEW MODAL ---------------- */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Payment Receipt #{selectedPayment.id}
                  </h3>
                </div>
                <button type="button" onClick={() => setSelectedPayment(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-3 text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold block text-[11px]">Payment Received</span>
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedPayment.amount}</h2>
                  <span className="text-[10px] text-emerald-600/80 font-mono mt-0.5 block">Status: Completed</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400 pt-2">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Client:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedPayment.client}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Payment Date:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedPayment.paymentDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Method:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedPayment.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Ref / UTR:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedPayment.transactionRef || "N/A"}</span>
                  </div>
                </div>

                {selectedPayment.note && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[11px]">Notes:</span>
                    <p className="text-zinc-600 dark:text-zinc-300">{selectedPayment.note}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
