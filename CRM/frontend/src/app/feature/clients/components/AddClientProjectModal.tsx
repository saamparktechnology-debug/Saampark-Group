"use client"

import * as React from "react"
import { X, Check, DollarSign, Calculator, UserCheck, Calendar, Briefcase, FileText, Coins, RefreshCw, Layers, CreditCard } from "lucide-react"
import { ClientItem } from "../types"
import { getUsers } from "@/app/feature/users/services/userService"
import { addProject } from "@/app/feature/projects/services/projectService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
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
  const [paymentModel, setPaymentModel] = React.useState<"advance" | "full">("advance")
  const [advanceAmount, setAdvanceAmount] = React.useState<number>(20000)
  const [installmentsCount, setInstallmentsCount] = React.useState<number>(3)
  const [billingCycle, setBillingCycle] = React.useState<"Monthly" | "Quarterly">("Monthly")
  const [autoCreateSubscription, setAutoCreateSubscription] = React.useState<boolean>(true)
  const [paymentStatus, setPaymentStatus] = React.useState<"Payment Pending" | "Paid">("Paid")
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
          .filter(u => {
            const role = (u.role || "").toLowerCase().trim()
            const isTeam = role === "teams" || role === "team" || role === "employee" || role === "developer" || role === "staff"
            const isAdminOrClient = role.includes("admin") || role.includes("client")
            return isTeam && !isAdminOrClient && u.status !== "Inactive"
          })
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
  const effectiveAdvance = paymentModel === "full" 
    ? (paymentStatus === "Paid" ? totalAmount : 0) 
    : Math.min(advanceAmount, totalAmount)
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

    setIsSubmitting(true)
    try {
      const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`
      const formattedAdvance = `₹${effectiveAdvance.toLocaleString("en-IN")}`
      const formattedDue = `₹${remainingDue.toLocaleString("en-IN")}`

      // 1. Add Project
      const projectMembers = assignedMembers.map(m => ({
        id: `mem_${m}`,
        name: m,
        role: "Specialist",
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${m}`,
      }))

      const computedProjectStatus = remainingDue === 0 
        ? "In Progress" 
        : effectiveAdvance > 0 
          ? "In Progress" 
          : "Payment Pending"

      const computedPaymentStatus = remainingDue === 0 
        ? "Paid" 
        : effectiveAdvance > 0 
          ? "Advance Received" 
          : "Payment Pending"

      const createdProject = await addProject({
        title: projectTitle,
        client: client.name,
        projectType: "Client Project",
        price: formattedTotal,
        startDate,
        deadline,
        progress: effectiveAdvance > 0 ? 15 : 0,
        status: computedProjectStatus,
        paymentStatus: computedPaymentStatus as any,
        paymentStructure: paymentModel === "advance" ? "Advance + Part Payment" : "Full",
        advanceAmount: effectiveAdvance,
        dueAmount: remainingDue,
        installmentsCount: paymentModel === "advance" ? installmentsCount : undefined,
        installmentAmount: paymentModel === "advance" ? perInstallment : undefined,
        baseAmount,
        gstRate,
        gstAmount,
        totalAmount,
        billedBy: billedByAdmin,
        labels: [category, computedPaymentStatus],
        description: description || `Client Project for ${client.name}. Billed by ${billedByAdmin}. ${paymentModel === "advance" ? `Advance Paid: ${formattedAdvance}, Balance Due: ${formattedDue} in ${installmentsCount} installments.` : ''}`,
        members: projectMembers,
      })

      // 2. Generate Invoice
      const invoiceId = `INV #${Math.floor(100 + Math.random() * 900)}`
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
        baseAmount,
        gstRate,
        gstAmount,
        totalInvoiced: formattedTotal,
        paymentReceived: formattedAdvance,
        due: formattedDue,
        status: invoiceStatus,
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
        paymentStatus: remainingDue === 0 ? "Paid" : effectiveAdvance > 0 ? "Partially paid" : "Unpaid",
        status: effectiveAdvance > 0 ? "Processing" : "Pending",
        notes: description || `Order generated for project: ${projectTitle} (${category}). ${paymentModel === "advance" ? `Advance Paid: ${formattedAdvance}, Balance: ${formattedDue}.` : ''}`,
        invoiceId: invoiceId,
      })

      // 4. Automatically record Upfront / Advance Payment if paid
      if (effectiveAdvance > 0) {
        await addPayment({
          invoiceId: invoiceId,
          client: client.name,
          clientEmail: client.email,
          project: projectTitle,
          paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-"),
          paymentMethod: "Bank Transfer / UPI",
          transactionRef: `TXN-${Date.now().toString().slice(-6)}`,
          note: paymentModel === "advance" ? `Advance / Down Payment received for ${projectTitle}` : `Full invoice payment for ${projectTitle}`,
          amount: formattedAdvance,
          amountNum: effectiveAdvance,
          status: "Completed",
        })
      }

      // 5. Automatically create Recurring Part Payment Subscription if enabled
      if (paymentModel === "advance" && autoCreateSubscription && remainingDue > 0) {
        await addSubscription({
          clientName: client.name,
          planName: `${projectTitle} (Part Payment Plan)`,
          status: "Active",
          amount: `₹${perInstallment.toLocaleString("en-IN")}`,
          billingCycle: billingCycle as any,
          nextBillingDate: deadline,
        })
      }

      // 6. Update Client Stats in Ledger
      const storedClients = await getClients()
      const currentInvoicedNum = parseInt((client.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0
      const currentDueNum = parseInt((client.due || "0").replace(/[^0-9]/g, "")) || 0
      const currentPaidNum = parseInt((client.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0

      const updatedClient: ClientItem = {
        ...client,
        projectsCount: (client.projectsCount || 0) + 1,
        totalInvoiced: `₹${(currentInvoicedNum + totalAmount).toLocaleString("en-IN")}`,
        due: `₹${(currentDueNum + remainingDue).toLocaleString("en-IN")}`,
        paymentReceived: `₹${(currentPaidNum + effectiveAdvance).toLocaleString("en-IN")}`,
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
                <option value="Software Development">Software Development</option>
                <option value="Android/iOS">Android/iOS</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Domain & Hosting">Domain & Hosting</option>
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

          {/* Financial GST & Advance / Part Payment Breakdown Box */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-4">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-bold text-xs">
              <div className="flex items-center gap-2">
                <Calculator size={15} />
                <span>Financial & Payment Terms</span>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                <button
                  type="button"
                  onClick={() => setPaymentModel("advance")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    paymentModel === "advance"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  🪙 Advance + Part Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModel("full")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    paymentModel === "full"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  💳 Full (100%) Upfront
                </button>
              </div>
            </div>

            {/* Base Amount & GST Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Base Deal Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={baseAmount}
                  onChange={(e) => {
                    const newBase = Number(e.target.value)
                    setBaseAmount(newBase)
                    const newTotal = newBase + Math.round(newBase * (gstRate / 100))
                    if (advanceAmount > newTotal) setAdvanceAmount(Math.round(newTotal * 0.4))
                  }}
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
            </div>

            {/* Advance & Part Payment Detailed Section */}
            {paymentModel === "advance" ? (
              <div className="p-3.5 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Coins size={13} /> Advance Down Payment (₹)
                      </label>
                      <div className="flex items-center gap-1">
                        {[25, 40, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setAdvanceAmount(Math.round(totalAmount * (pct / 100)))}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
                      Remaining Balance Due (₹)
                    </label>
                    <div className="w-full px-3 py-1.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 font-bold text-amber-800 dark:text-amber-200 flex items-center justify-between">
                      <span>₹{remainingDue.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">To be split in parts</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Part Payment Configuration */}
                {remainingDue > 0 && (
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                          Part Installments
                        </label>
                        <select
                          value={installmentsCount}
                          onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                          className="w-full px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
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
                          Billing Frequency
                        </label>
                        <select
                          value={billingCycle}
                          onChange={(e) => setBillingCycle(e.target.value as any)}
                          className="w-full px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                        >
                          <option value="Monthly">Monthly Cycle</option>
                          <option value="Quarterly">Quarterly Cycle</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={14} className="text-blue-600 animate-spin-slow shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                            ₹{perInstallment.toLocaleString("en-IN")} / {billingCycle.toLowerCase()}
                          </p>
                          <p className="text-[9px] text-blue-700 dark:text-blue-400">
                            {installmentsCount} recurring installments of ₹{perInstallment.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-blue-900 dark:text-blue-200">
                        <input
                          type="checkbox"
                          checked={autoCreateSubscription}
                          onChange={(e) => setAutoCreateSubscription(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Auto-Add to Subscriptions</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block">
                    Full Upfront Payment Status
                  </span>
                  <span className="text-[10px] text-zinc-400">Entire amount settled in single invoice</span>
                </div>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className={`px-3 py-1 rounded-lg font-bold border text-xs ${
                    paymentStatus === "Payment Pending"
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  <option value="Paid">Paid / Received in Full</option>
                  <option value="Payment Pending">Full Payment Pending</option>
                </select>
              </div>
            )}

            {/* Calculated Summary */}
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-600 dark:text-zinc-400">
                Tax: <strong>₹{gstAmount.toLocaleString("en-IN")}</strong> ({gstRate}%)
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-extrabold">
                Total Deal: ₹{totalAmount.toLocaleString("en-IN")}
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
