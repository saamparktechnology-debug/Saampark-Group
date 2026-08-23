"use client"

import * as React from "react"
import { X, Check, DollarSign, Calculator, UserCheck, Calendar, Briefcase, FileText } from "lucide-react"
import { ClientItem } from "../types"
import { getUsers } from "@/app/feature/users/services/userService"
import { addProject } from "@/app/feature/projects/services/projectService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
import { addOrder } from "@/app/feature/sales/orders/services/orderService"
import { addPayment } from "@/app/feature/sales/payments/services/paymentService"
import { taskService } from "@/app/feature/tasks/services/taskService"
import { saveStoredClient, getStoredClients } from "../services/clientService"

import { useAuthStore } from "@/store/useAuthStore"

interface AddClientProjectModalProps {
  isOpen: boolean
  client: ClientItem | null
  onClose: () => void
  onProjectCreated: () => void
  onInvoiceCreated?: (invoice: any) => void
}

export function AddClientProjectModal({
  isOpen,
  client,
  onClose,
  onProjectCreated,
  onInvoiceCreated,
}: AddClientProjectModalProps) {
  const { user } = useAuthStore()

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
  
  const [baseAmount, setBaseAmount] = React.useState<number>(50000)
  const [gstRate, setGstRate] = React.useState<number>(18)
  const [paymentStatus, setPaymentStatus] = React.useState<"Payment Pending" | "Paid">("Payment Pending")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [adminsList, setAdminsList] = React.useState<{ id: string; name: string }[]>([])
  const [teamsList, setTeamsList] = React.useState<{ id: string; name: string; role?: string }[]>([])

  React.useEffect(() => {
    if (isOpen) {
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
          .filter(u => (u.role === "Teams" || u.role === "Admin" || u.role === "Super Admin") && u.status !== "Inactive")
          .map(u => ({ id: u.id, name: u.name, role: u.role }))
        
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
  }, [isOpen, user])

  if (!isOpen || !client) return null

  const gstAmount = Math.round(baseAmount * (gstRate / 100))
  const totalAmount = baseAmount + gstAmount

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

    setIsSubmitting(true)
    try {
      const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`
      const formattedBase = `₹${baseAmount.toLocaleString("en-IN")}`
      const formattedGst = `₹${gstAmount.toLocaleString("en-IN")}`

      // 1. Add Project
      const projectMembers = assignedMembers.map(m => ({
        id: `mem_${m}`,
        name: m,
        role: "Specialist",
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${m}`,
      }))

      const createdProject = await addProject({
        title: projectTitle,
        client: client.name,
        projectType: "Client Project",
        price: formattedTotal,
        startDate,
        deadline,
        progress: paymentStatus === "Paid" ? 10 : 0,
        status: paymentStatus === "Paid" ? "In Progress" : "Payment Pending",
        paymentStatus,
        baseAmount,
        gstRate,
        gstAmount,
        totalAmount,
        billedBy: billedByAdmin,
        labels: [category, paymentStatus],
        description: description || `Client Project for ${client.name}. Billed by ${billedByAdmin}.`,
        members: projectMembers,
      })

      // 2. Generate Invoice
      const invoiceId = `INV #${Math.floor(100 + Math.random() * 900)}`
      const createdInvoice = await addInvoice({
        id: invoiceId,
        client: client.name,
        clientEmail: client.email,
        project: projectTitle,
        billDate: startDate,
        dueDate: deadline,
        baseAmount,
        gstRate,
        gstAmount,
        totalInvoiced: formattedTotal,
        paymentReceived: paymentStatus === "Paid" ? formattedTotal : "₹0",
        due: paymentStatus === "Paid" ? "₹0" : formattedTotal,
        status: paymentStatus === "Paid" ? "Fully paid" : "Not paid",
        billedBy: billedByAdmin,
      })

      // 3. Automatically create Order in Sales Order List
      await addOrder({
        client: client.name,
        clientEmail: client.email,
        project: projectTitle,
        orderDate: startDate || new Date().toISOString().split("T")[0],
        deliveryDate: deadline || "30-06-2026",
        itemsCount: 1,
        totalAmount: formattedTotal,
        paymentStatus: paymentStatus === "Paid" ? "Paid" : "Unpaid",
        status: paymentStatus === "Paid" ? "Completed" : "Processing",
        notes: description || `Order generated for project: ${projectTitle} (${category})`,
        invoiceId: invoiceId,
      })

      // 4. Automatically record Payment if settled
      if (paymentStatus === "Paid") {
        await addPayment({
          invoiceId: invoiceId,
          client: client.name,
          clientEmail: client.email,
          project: projectTitle,
          paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"),
          paymentMethod: "Bank Transfer / UPI",
          transactionRef: `TXN-${Date.now().toString().slice(-6)}`,
          note: `Upfront full invoice payment for ${projectTitle}`,
          amount: formattedTotal,
          amountNum: totalAmount,
          status: "Completed",
        })
      }

      // 5. Update Client Stats
      const storedClients = getStoredClients()
      const existingIdx = storedClients.findIndex(c => c.id === client.id || c.email === client.email)
      const currentInvoicedNum = parseInt((client.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      const currentDueNum = parseInt((client.due || "0").replace(/[^0-9]/g, "")) || 0
      const currentPaidNum = parseInt((client.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0

      const updatedClient: ClientItem = {
        ...client,
        projectsCount: (client.projectsCount || 0) + 1,
        totalInvoiced: `₹${(currentInvoicedNum + totalAmount).toLocaleString("en-IN")}`,
        due: paymentStatus === "Paid" ? `₹${currentDueNum.toLocaleString("en-IN")}` : `₹${(currentDueNum + totalAmount).toLocaleString("en-IN")}`,
        paymentReceived: paymentStatus === "Paid" ? `₹${(currentPaidNum + totalAmount).toLocaleString("en-IN")}` : `₹${currentPaidNum.toLocaleString("en-IN")}`,
      }

      saveStoredClient(updatedClient)

      // 4. Automatically create Task(s) in Tasks section for assigned team member(s)
      const membersToAssign = assignedMembers.length > 0 ? assignedMembers : ["Unassigned"]
      const tasksToCreate = membersToAssign.map((memberName) => ({
        title: `${projectTitle} - Initial Setup & Execution`,
        description: `Deliverable for client ${client.name}. Project: ${projectTitle}. Billed: ${formattedTotal}. Scope: ${description || projectTitle}`,
        relatedTo: projectTitle,
        points: "3 Points",
        assignedTo: memberName,
        assignedToAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${memberName.replace(/\s/g, "")}`,
        collaborators: assignedMembers.filter((m) => m !== memberName).join(", ") || "-",
        status: "To do" as const,
        priority: "High" as const,
        priorityIcon: "up" as const,
        labels: [category, "Client Project"],
        startDate: startDate || "-",
        deadline: deadline || "30-06-2026",
        milestone: "Beta Release",
        isRecurring: false,
      }))
      await taskService.addTasks(tasksToCreate)

      // 5. Notify Client
      if (typeof window !== "undefined") {
        try {
          const notifKey = `saampark_notifications_${(client.email || "").toLowerCase().trim()}`
          const prevNotifsRaw = localStorage.getItem(notifKey)
          const prevNotifs = prevNotifsRaw ? JSON.parse(prevNotifsRaw) : []
          const newNotif = {
            id: Date.now(),
            title: `New Project & Invoice Generated`,
            message: `Project '${projectTitle}' created with ${invoiceId} for ${formattedTotal}. Status: ${paymentStatus}.`,
            timestamp: new Date().toLocaleString(),
            read: false,
          }
          localStorage.setItem(notifKey, JSON.stringify([newNotif, ...prevNotifs]))
        } catch {}
      }

      onProjectCreated()
      onClose()
      if (onInvoiceCreated) {
        onInvoiceCreated(createdInvoice)
      }
    } catch (err) {
      console.error(err)
      alert("Error creating project and invoice.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Add Project & Invoice for {client.name}</h2>
              <p className="text-xs text-zinc-500">Configure project scope, billing GST breakdown, and team assignment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. E-Commerce Platform & Mobile App"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Service Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Website Development">Website Development</option>
                <option value="Google Ads Campaign">Google Ads Campaign</option>
                <option value="Google My Business (GMB)">Google My Business (GMB)</option>
                <option value="VR Experience Design">VR Experience Design</option>
                <option value="Branding & Packaging">Branding & Packaging</option>
                <option value="SEO & Social Media">SEO & Social Media</option>
                <option value="Custom ERP/CRM">Custom ERP/CRM</option>
              </select>
            </div>
          </div>

          {/* Row 2: Billed By Admin & Team Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Billed By (Admin)
              </label>
              <select
                value={billedByAdmin}
                onChange={(e) => setBilledByAdmin(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {adminsList.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Assigned Team Members
              </label>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 max-h-28 overflow-y-auto space-y-1">
                {teamsList.length === 0 ? (
                  <p className="text-zinc-400 text-[11px]">No team members found.</p>
                ) : (
                  teamsList.map(t => {
                    const isChecked = assignedMembers.includes(t.name)
                    return (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(t.name)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar size={13} /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar size={13} /> Target Release / Due Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Financial GST Breakdown Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <Calculator size={15} /> Financial & GST Billing Calculation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Base Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 font-bold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  GST Rate (%)
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 font-bold text-zinc-900 dark:text-zinc-100"
                >
                  <option value={0}>0% (Exempted)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard GST)</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-lg font-bold border ${
                    paymentStatus === "Payment Pending"
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Paid">Paid / Received</option>
                </select>
              </div>
            </div>

            {/* Calculated Summary */}
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-600 dark:text-zinc-400">
                GST Tax ({gstRate}%): <strong className="text-zinc-900 dark:text-zinc-100">₹{gstAmount.toLocaleString("en-IN")}</strong>
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-extrabold">
                Total Invoiced Amount: ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Billing Remarks & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add project specifications or payment terms..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSubmitting ? "Generating..." : "Generate Project & Invoice"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
