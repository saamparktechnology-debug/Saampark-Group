"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calculator, Plus, Search, Download, Trash2, CheckCircle2, 
  Clock, XCircle, FileText, Printer, X, Check, DollarSign 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"

export interface ExpenseItem {
  id: string
  expenseNumber: string
  title: string
  amount: string
  amountNum: number
  category: string
  date: string
  member: string
  receiptUrl?: string
  status: "Approved" | "Pending" | "Rejected"
  notes?: string
}

export default function ExpensesMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()
  
  const targetComp = activeCompanyId || user?.companyId || "tech"
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"
  const canAddExpense = canPerformAction(user, "Expenses", "add")
  const canEditExpense = canPerformAction(user, "Expenses", "edit")
  const canDeleteExpense = canPerformAction(user, "Expenses", "delete")

  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Form State
  const [title, setTitle] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [category, setCategory] = React.useState("Cloud & Server Infrastructure")
  const [member, setMember] = React.useState(user?.name || "Admin")
  const [receiptUrl, setReceiptUrl] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadExpenses = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<ExpenseItem[]>("expenses", [], targetComp)
    setExpenses(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [targetComp])

  React.useEffect(() => {
    loadExpenses()
    const interval = setInterval(loadExpenses, 4000)
    window.addEventListener("saampark_company_switched", loadExpenses)
    return () => {
      clearInterval(interval)
      window.removeEventListener("saampark_company_switched", loadExpenses)
    }
  }, [loadExpenses])

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.amount.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false
      if (selectedCategory === "all") return true
      return e.category === selectedCategory
    })
  }, [expenses, searchQuery, selectedCategory])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount.trim()) {
      alert("Please fill in title and amount.")
      return
    }

    const numAmount = parseInt(amount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`
    const maxNum = expenses.reduce((max, exp) => {
      const num = parseInt(String(exp.expenseNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 100)

    const newExp: ExpenseItem = {
      id: `exp_${Date.now()}`,
      expenseNumber: `EXP #${maxNum + 1}`,
      title,
      amount: formattedAmount,
      amountNum: numAmount,
      category,
      date: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      member: member || user?.name || "Admin",
      receiptUrl,
      status: isAdmin ? "Approved" : "Pending",
      notes,
    }

    const updated = [newExp, ...expenses]
    setExpenses(updated)
    await saveModuleDataToDB("expenses", updated, targetComp)
    showToast(`✅ Expense ${newExp.expenseNumber} recorded!`)
    setIsAddModalOpen(false)
    setTitle("")
    setAmount("")
    setNotes("")
  }

  const handleUpdateStatus = async (id: string, status: ExpenseItem["status"]) => {
    const updated = expenses.map(e => e.id === id ? { ...e, status } : e)
    setExpenses(updated)
    await saveModuleDataToDB("expenses", updated, targetComp)
    showToast(`Expense updated to ${status}.`)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this expense record?")) {
      await markGlobalItemDeleted(id, "expenses")
      const updated = expenses.filter(e => e.id !== id)
      setExpenses(updated)
      await saveModuleDataToDB("expenses", updated, targetComp)
      showToast("Expense removed.")
    }
  }

  const totalExpenseNum = expenses.reduce((sum, e) => sum + (e.amountNum || 0), 0)
  const approvedNum = expenses.filter(e => e.status === "Approved").reduce((sum, e) => sum + (e.amountNum || 0), 0)
  const pendingCount = expenses.filter(e => e.status === "Pending").length

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
            <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Operational Expenses</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track business operating costs, cloud infrastructure, subcontracting fees, and vendor receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Operational_Expenses",
                title: "Operational Expenses Report",
                subtitle: selectedCategory === "all" ? "All Expenses" : selectedCategory,
                headers: ["#", "Expense #", "Title", "Category", "Amount (₹)", "Date", "Recorded By", "Status"],
                rows: filteredExpenses.map((exp, idx) => [
                  idx + 1,
                  exp.expenseNumber,
                  exp.title,
                  exp.category,
                  `₹${exp.amountNum.toLocaleString("en-IN")}`,
                  exp.date,
                  exp.member,
                  exp.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
          >
            <Download size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              printPDFReport({
                title: "Operational Expenses Report",
                subtitle: selectedCategory === "all" ? "All Expenses" : selectedCategory,
                headers: ["#", "Expense #", "Title", "Category", "Amount", "Date", "Recorded By", "Status"],
                rows: filteredExpenses.map((exp, idx) => [
                  idx + 1,
                  exp.expenseNumber,
                  exp.title,
                  exp.category,
                  `₹${exp.amountNum.toLocaleString("en-IN")}`,
                  exp.date,
                  exp.member,
                  exp.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAddExpense && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Total Expenses Incurred</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">₹{totalExpenseNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
            <Calculator size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Approved & Settled</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{approvedNum.toLocaleString("en-IN")}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Pending Approval</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount} Expenses</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- EXPENSES TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Ref #</th>
              <th className="py-3 px-4">Expense Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Paid By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  No expense records found. Click "+ Add Expense" to log business costs.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                if (exp.status === "Approved") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                if (exp.status === "Pending") statusBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                if (exp.status === "Rejected") statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"

                return (
                  <tr key={exp.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {exp.title}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                      {exp.category}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {exp.amount}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{exp.date}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">{exp.member}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEditExpense && exp.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(exp.id, "Approved")}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              title="Approve Expense"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(exp.id, "Rejected")}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              title="Reject Expense"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}

                        {canDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id)}
                            className="p-1 hover:text-rose-600 text-zinc-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- ADD EXPENSE MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calculator size={18} className="text-blue-600" />
                  <span>Record Operational Expense</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Expense Title / Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud Hosting Server or Figma Enterprise Subscription"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    >
                      <option value="Cloud & Server Infrastructure">Cloud & Server Infrastructure</option>
                      <option value="SaaS & Software Subscriptions">SaaS & Software Subscriptions</option>
                      <option value="Subcontractor & Freelancer Fees">Subcontractor & Freelancer Fees</option>
                      <option value="Office & Operational Utilities">Office & Operational Utilities</option>
                      <option value="Marketing & Lead Acquisition">Marketing & Lead Acquisition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 18500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Paid By / Team Member</label>
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => setMember(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Receipt / Invoice Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Record Expense
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
