"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Download, CreditCard, RefreshCw, X, Send, 
  CheckCircle2, DollarSign, Clock, AlertCircle, Sparkles, 
  Calendar, Layers, FileText, ChevronRight, Package, Check,
  QrCode, Building2, ShieldCheck, ArrowUpRight
} from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { 
  Subscription, 
  BillingCycle, 
  SubscriptionKPIs, 
  SubscriptionType, 
  PRESET_PACKAGE_TIERS,
  PackageTier 
} from "./types"
import { 
  getSubscriptions, 
  addSubscription, 
  deleteSubscription, 
  renewSubscription, 
  sendSubscriptionReminder, 
  updateSubscription,
  calculateNextCycleDate 
} from "./services/subscriptionService"
import { SubscriptionList } from "./components/SubscriptionList"
import { RenewSubscriptionModal } from "./components/RenewSubscriptionModal"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"

export default function SubscriptionsMain() {
  const { activeCompanyId, activeBranchId, branches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super") || roleLower === "super admin"
  const isAdmin = !isSuperAdmin && (
    roleLower.includes("admin") || 
    roleLower.includes("owner") || 
    roleLower.includes("manager") ||
    roleLower === "admin"
  )
  const isClient = roleLower.includes("client")

  const canAddSubscription = canPerformAction(user, "Subscriptions", "add") || isSuperAdmin || isAdmin
  const canEditSubscription = canPerformAction(user, "Subscriptions", "edit") || isSuperAdmin || isAdmin
  const canDeleteSubscription = canPerformAction(user, "Subscriptions", "delete") || isSuperAdmin || isAdmin

  // Active View Tab: "all" | "package" | "regular" | "emi"
  const [activeTab, setActiveTab] = React.useState<"all" | "package" | "regular" | "emi">("all")

  // Data States
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Modals
  const [isAddSubModalOpen, setIsAddSubModalOpen] = React.useState(false)
  const [selectedSubModelTab, setSelectedSubModelTab] = React.useState<SubscriptionType>("package")
  const [renewingSubscription, setRenewingSubscription] = React.useState<Subscription | null>(null)

  // Client Pay / Renew Modal
  const [clientPayingSub, setClientPayingSub] = React.useState<Subscription | null>(null)
  const [clientPayMethod, setClientPayMethod] = React.useState<"upi" | "card" | "bank">("upi")
  const [isClientPayProcessing, setIsClientPayProcessing] = React.useState(false)

  // Form State: Client & Commons
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string; phone?: string; company?: string }[]>([])
  const [newClientName, setNewClientName] = React.useState("")
  const [isCustomClient, setIsCustomClient] = React.useState(false)
  const [customClientEmail, setCustomClientEmail] = React.useState("")
  const [customClientPhone, setCustomClientPhone] = React.useState("")
  const [customClientCompany, setCustomClientCompany] = React.useState("")

  // Form State: Package Wise
  const [selectedPackageId, setSelectedPackageId] = React.useState<string>("pkg_growth_erp")
  const [isCustomPackage, setIsCustomPackage] = React.useState(false)
  const [customPackageName, setCustomPackageName] = React.useState("")
  const [customPackagePrice, setCustomPackagePrice] = React.useState("30000")
  const [customPackageCycle, setCustomPackageCycle] = React.useState<BillingCycle>("Monthly")
  const [customDeliverablesText, setCustomDeliverablesText] = React.useState(
    "Custom Software Maintenance\nDedicated Support Desk\nMonthly Database Backups\nSecurity Patches"
  )

  // Form State: Regular Subscription
  const [regularPlanName, setRegularPlanName] = React.useState("Cloud Infrastructure Retainer")
  const [regularAmount, setRegularAmount] = React.useState("25000")
  const [regularCycle, setRegularCycle] = React.useState<BillingCycle>("Monthly")
  const [customDaysCount, setCustomDaysCount] = React.useState<number>(30)
  const [regularStartDate, setRegularStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [regularNextDate, setRegularNextDate] = React.useState("")

  // Form State: EMI Subscription
  const [emiPlanName, setEmiPlanName] = React.useState("Enterprise Custom SaaS on EMI")
  const [emiTotalAmount, setEmiTotalAmount] = React.useState("120000")
  const [emiDownPayment, setEmiDownPayment] = React.useState("20000")
  const [emiTenureMonths, setEmiTenureMonths] = React.useState<number>(6)
  const [emiStartDate, setEmiStartDate] = React.useState(new Date().toISOString().split("T")[0])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Load subscriptions fresh from store
  const loadData = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const { activeCompanyId: freshCompanyId } = useAuthStore.getState()
      const subData = await getSubscriptions(freshCompanyId || "tech")
      setSubscriptions(subData || [])
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData(true)
    const handleReload = () => loadData(false)
    window.addEventListener("storage", handleReload)
    window.addEventListener("saampark_company_switched", handleReload)
    window.addEventListener("saampark_branch_switched", handleReload)
    window.addEventListener("saampark_data_synced", handleReload)

    return () => {
      window.removeEventListener("storage", handleReload)
      window.removeEventListener("saampark_company_switched", handleReload)
      window.removeEventListener("saampark_branch_switched", handleReload)
      window.removeEventListener("saampark_data_synced", handleReload)
    }
  }, [loadData])

  // Populate client list on modal open
  React.useEffect(() => {
    if (isAddSubModalOpen) {
      getClients().then((cList) => {
        const mapped = cList.map(c => ({
          name: c.name,
          email: c.email || "",
          phone: c.phone || "",
          company: c.companyName || c.name,
        }))
        setAvailableClients(mapped)
        if (mapped.length > 0 && !newClientName) {
          setNewClientName(mapped[0].name)
        }
      }).catch(() => {})
    }
  }, [isAddSubModalOpen, newClientName])

  // Recalculate next billing date when regular subscription cycle changes
  React.useEffect(() => {
    if (regularStartDate) {
      const nextD = calculateNextCycleDate(regularStartDate, regularCycle, customDaysCount)
      setRegularNextDate(nextD)
    }
  }, [regularStartDate, regularCycle, customDaysCount])

  // ── Role Scoped Subscriptions ──
  const visibleSubscriptions = React.useMemo(() => {
    if (!user) return []

    const { activeCompanyId: freshCompId, activeBranchId: freshBranchId, branches: freshBranches, user: freshUser } = useAuthStore.getState()
    const userComp = (freshCompId || freshUser?.companyId || "").toLowerCase().trim()
    const targetBranch = freshBranchId

    const checkCompany = (sub: Subscription) => {
      if (!userComp || userComp === "all") return true
      const comp = (sub.companyId || "tech").toLowerCase().trim()
      return comp === userComp || (userComp === "tech" && !sub.companyId)
    }

    const checkBranch = (sub: Subscription) => {
      if (!targetBranch) return true
      const bId = String(sub.branchId || "").toLowerCase().trim()
      const bName = String(sub.branchName || "").toLowerCase().trim()
      const target = String(targetBranch).toLowerCase().trim()
      return bId === target || bName === target
    }

    // 1. Super Admin & Company Admin
    if (isSuperAdmin || isAdmin) {
      return subscriptions.filter(sub => checkCompany(sub) && checkBranch(sub))
    }

    const normName = (user.name || "").toLowerCase().trim()
    const normEmail = (user.email || "").toLowerCase().trim()
    const uId = String(user.id || "").toLowerCase().trim()

    // 2. Client role: strictly their own subscriptions
    if (isClient) {
      return subscriptions.filter((sub) => {
        if (!checkBranch(sub)) return false
        return isRecordAssignedToClient(sub, user)
      })
    }

    // 3. Team Member: assigned to them
    return subscriptions.filter((sub) => {
      if (!checkBranch(sub)) return false
      const assigned = (sub.assignedMembers || []).map(m => m.toLowerCase().trim())
      const assignedEmails = (sub.assignedMemberEmails || []).map(e => e.toLowerCase().trim())
      const billedBy = (sub.billedBy || "").toLowerCase().trim()
      const createdById = String(sub.createdById || "").toLowerCase().trim()

      if (uId && createdById === uId) return true
      if (normName && billedBy === normName) return true
      if (assigned.some(m => m === normName || (normName && m.includes(normName)) || (normName && normName.includes(m)))) return true
      if (normEmail && assignedEmails.some(e => e === normEmail)) return true

      return false
    })
  }, [subscriptions, user, isSuperAdmin, isAdmin, isClient, activeCompanyId, activeBranchId, branches])

  // Filtered by Option Tab (All vs Package vs Regular vs EMI)
  const tabFilteredSubscriptions = React.useMemo(() => {
    if (activeTab === "all") return visibleSubscriptions
    return visibleSubscriptions.filter(s => (s.subscriptionType || "regular") === activeTab)
  }, [visibleSubscriptions, activeTab])

  // Compute Subscription KPIs
  const kpis: SubscriptionKPIs = React.useMemo(() => {
    const activeSubs = visibleSubscriptions.filter(s => s.status === "Active")
    let totalMRR = 0
    let totalCollected = 0
    let renewalsDueCount = 0
    let renewalsDueAmount = 0
    let pkgCount = 0
    let regCount = 0
    let emiCount = 0

    visibleSubscriptions.forEach((s) => {
      const type = s.subscriptionType || "regular"
      if (type === "package") pkgCount++
      else if (type === "emi") emiCount++
      else regCount++

      let monthlyVal = s.numericAmount || parseInt(String(s.amount).replace(/[^0-9]/g, "")) || 0
      if (type === "emi") {
        monthlyVal = s.emiPerCycle || (s.totalTenureMonths ? Math.round(monthlyVal / s.totalTenureMonths) : monthlyVal)
      } else if (s.billingCycle === "Annually") {
        monthlyVal = Math.round(monthlyVal / 12)
      } else if (s.billingCycle === "Quarterly") {
        monthlyVal = Math.round(monthlyVal / 3)
      } else if (s.billingCycle === "Weekly") {
        monthlyVal = Math.round(monthlyVal * 4.33)
      } else if (s.billingCycle === "Daily") {
        monthlyVal = Math.round(monthlyVal * 30)
      }

      if (s.status === "Active") {
        totalMRR += monthlyVal
      }

      totalCollected += s.firstPaymentAmount ? Number(s.firstPaymentAmount) : (s.numericAmount || 0)

      if (s.status === "Expiring Soon" || s.status === "Past Due") {
        renewalsDueCount++
        renewalsDueAmount += (s.numericAmount || 0)
      }
    })

    return {
      totalMRR,
      totalARR: totalMRR * 12,
      activeSubscriptionsCount: activeSubs.length,
      packageSubscriptionsCount: pkgCount,
      regularSubscriptionsCount: regCount,
      emiSubscriptionsCount: emiCount,
      renewalsDueThisMonthCount: renewalsDueCount,
      renewalsDueThisMonthAmount: renewalsDueAmount,
      totalCollectedThisMonth: totalCollected,
    }
  }, [visibleSubscriptions])

  // ── Actions ──

  const handleCreateSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let clientName = newClientName
    let clientEmail = ""
    let clientPhone = ""
    let clientCompany = ""

    if (isCustomClient) {
      clientName = newClientName || "Custom Client"
      clientEmail = customClientEmail
      clientPhone = customClientPhone
      clientCompany = customClientCompany || clientName
    } else {
      const found = availableClients.find(c => c.name.toLowerCase().trim() === newClientName.toLowerCase().trim())
      clientEmail = found?.email || ""
      clientPhone = found?.phone || ""
      clientCompany = found?.company || clientName
    }

    if (!clientName.trim()) {
      alert("Please select or enter a client name.")
      return
    }

    // 1. Package Wise Subscription
    if (selectedSubModelTab === "package") {
      let planTitle = ""
      let numAmt = 0
      let cycle: BillingCycle = "Monthly"
      let deliverablesList: string[] = []

      if (isCustomPackage) {
        if (!customPackageName.trim()) {
          alert("Please enter a custom package title.")
          return
        }
        planTitle = customPackageName
        numAmt = parseInt(customPackagePrice.replace(/[^0-9]/g, "")) || 0
        cycle = customPackageCycle
        deliverablesList = customDeliverablesText.split("\n").map(s => s.trim()).filter(Boolean)
      } else {
        const pkg = PRESET_PACKAGE_TIERS.find(p => p.id === selectedPackageId) || PRESET_PACKAGE_TIERS[0]
        planTitle = pkg.name
        numAmt = pkg.price
        cycle = pkg.billingCycle
        deliverablesList = pkg.deliverables
      }

      const formattedAmount = `₹${numAmt.toLocaleString("en-IN")}`
      const startDate = new Date().toISOString().split("T")[0]
      const nextDate = calculateNextCycleDate(startDate, cycle)

      await addSubscription({
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        planName: planTitle,
        status: "Active",
        amount: formattedAmount,
        numericAmount: numAmt,
        billingCycle: cycle,
        startDate,
        firstPaymentDate: startDate,
        firstPaymentAmount: numAmt,
        nextBillingDate: nextDate,
        autoRenew: true,
        subscriptionType: "package",
        deliverables: deliverablesList,
      }, activeCompanyId || "tech")

      showToast(`✅ Package Subscription "${planTitle}" assigned to ${clientName}!`)
    }

    // 2. Regular Retainer Subscription
    else if (selectedSubModelTab === "regular") {
      if (!regularPlanName.trim()) {
        alert("Please enter plan title.")
        return
      }
      const numAmt = parseInt(regularAmount.replace(/[^0-9]/g, "")) || 0
      const formattedAmount = `₹${numAmt.toLocaleString("en-IN")}`
      const finalNextDate = regularNextDate || calculateNextCycleDate(regularStartDate, regularCycle, customDaysCount)

      await addSubscription({
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        planName: regularPlanName,
        status: "Active",
        amount: formattedAmount,
        numericAmount: numAmt,
        billingCycle: regularCycle,
        customDaysCount: regularCycle === "Custom Days" ? customDaysCount : undefined,
        startDate: regularStartDate,
        firstPaymentDate: regularStartDate,
        firstPaymentAmount: numAmt,
        nextBillingDate: finalNextDate,
        autoRenew: true,
        subscriptionType: "regular",
      }, activeCompanyId || "tech")

      showToast(`✅ Regular Subscription "${regularPlanName}" created for ${clientName}!`)
    }

    // 3. EMI Subscription
    else if (selectedSubModelTab === "emi") {
      if (!emiPlanName.trim()) {
        alert("Please enter subscription plan title.")
        return
      }
      const totalVal = parseInt(emiTotalAmount.replace(/[^0-9]/g, "")) || 0
      const downPay = parseInt(emiDownPayment.replace(/[^0-9]/g, "")) || 0
      const tenure = Math.max(1, emiTenureMonths)
      const balance = Math.max(0, totalVal - downPay)
      const monthlyEmi = Math.round(balance / tenure)

      const formattedAmount = `₹${totalVal.toLocaleString("en-IN")}`
      const nextDate = calculateNextCycleDate(emiStartDate, "Monthly")

      await addSubscription({
        clientName,
        clientEmail,
        clientPhone,
        clientCompany,
        planName: `${emiPlanName} (${tenure}M EMI)`,
        status: "Active",
        amount: formattedAmount,
        numericAmount: totalVal,
        billingCycle: "Monthly",
        startDate: emiStartDate,
        firstPaymentDate: emiStartDate,
        firstPaymentAmount: downPay > 0 ? downPay : monthlyEmi,
        nextBillingDate: nextDate,
        autoRenew: false,
        subscriptionType: "emi",
        totalTenureMonths: tenure,
        emiPerCycle: monthlyEmi,
        downPayment: downPay,
        paidInstallmentsCount: downPay > 0 ? 1 : 0,
        totalInstallmentsCount: tenure,
      }, activeCompanyId || "tech")

      showToast(`✅ EMI Subscription (${tenure} Months @ ₹${monthlyEmi.toLocaleString("en-IN")}/mo) created for ${clientName}!`)
    }

    setIsAddSubModalOpen(false)
    loadData(false)
  }

  const handleDeleteSubscription = async (id: string) => {
    if (confirm("Cancel and delete this subscription?")) {
      await deleteSubscription(id, activeCompanyId || "tech")
      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
      showToast("Subscription removed.")
    }
  }

  const handleToggleAutoRenew = async (sub: Subscription) => {
    const updated = await updateSubscription(sub.id, { autoRenew: !sub.autoRenew }, activeCompanyId || "tech")
    if (updated) {
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? updated : s))
      showToast(`Auto-renewal ${updated.autoRenew ? "enabled" : "disabled"} for ${sub.clientName}.`)
    }
  }

  const handleSendReminder = async (id: string) => {
    const ok = await sendSubscriptionReminder(id, activeCompanyId || "tech")
    if (ok) {
      showToast("📧 Renewal reminder email dispatched to client.")
      loadData(false)
    } else {
      alert("Could not send reminder. Please verify client email in settings.")
    }
  }

  const handleRenewSubscriptionConfirm = async (
    id: string,
    nextDate: string,
    generateInvoice: boolean
  ) => {
    const res = await renewSubscription(id, nextDate, generateInvoice, activeCompanyId || "tech")
    if (res) {
      showToast(`🎉 Contract renewed until ${nextDate}! ${generateInvoice ? "Tax Invoice generated." : ""}`)
      loadData(false)
    }
  }

  // Client Pay Now Simulation & Record
  const handleClientPaySubscription = async () => {
    if (!clientPayingSub) return
    setIsClientPayProcessing(true)
    try {
      const nextDate = calculateNextCycleDate(clientPayingSub.nextBillingDate, clientPayingSub.billingCycle, clientPayingSub.customDaysCount)
      const res = await renewSubscription(clientPayingSub.id, nextDate, true, activeCompanyId || "tech")
      if (res) {
        showToast(`🎉 Payment of ${clientPayingSub.amount} received! Subscription renewed until ${nextDate}.`)
        setClientPayingSub(null)
        loadData(false)
      }
    } catch (err) {
      alert("Payment failed. Please try again.")
    } finally {
      setIsClientPayProcessing(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[99999] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 border border-zinc-700"
          >
            <Sparkles size={16} className="text-teal-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CreditCard size={20} />
            </div>
            <span>{isClient ? "My Recurring Subscriptions" : "Recurring Subscription Hub"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClient
              ? "View and manage your active service retainers, monthly packages, and renew subscriptions online."
              : `Manage Package Wise subscriptions, Regular retainers, and EMI subscriptions for ${activeCompanyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={() => window.print()}>
            Print / Export
          </Button>

          {canAddSubscription && !isClient && (
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAddSubModalOpen(true)}>
              New Subscription
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Monthly MRR</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{kpis.totalMRR.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
              {kpis.activeSubscriptionsCount} Active Subscriptions
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <RefreshCw size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Annualized ARR</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              ₹{kpis.totalARR.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              Recurring Run Rate
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Model Breakdown</div>
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1 space-y-0.5">
              <div>📦 {kpis.packageSubscriptionsCount} Packages</div>
              <div>🔁 {kpis.regularSubscriptionsCount} Regular • 💳 {kpis.emiSubscriptionsCount} EMI</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Upcoming Renewals</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₹{kpis.renewalsDueThisMonthAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              {kpis.renewalsDueThisMonthCount} Subscriptions Due
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 3 Options Navigation Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-full sm:w-fit border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs overflow-x-auto">
        {/* Option 1: All Subscriptions */}
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "all"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>All Subscriptions</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
            {visibleSubscriptions.length}
          </span>
        </button>

        {/* Option 2: Package Wise */}
        <button
          type="button"
          onClick={() => setActiveTab("package")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "package"
              ? "bg-white dark:bg-zinc-900 text-purple-800 dark:text-purple-300 shadow-sm border border-purple-500/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>📦 Package Wise</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "package"
              ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}>
            {kpis.packageSubscriptionsCount}
          </span>
        </button>

        {/* Option 3: Regular Subscriptions */}
        <button
          type="button"
          onClick={() => setActiveTab("regular")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "regular"
              ? "bg-white dark:bg-zinc-900 text-blue-800 dark:text-blue-300 shadow-sm border border-blue-500/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>🔁 Regular</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "regular"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}>
            {kpis.regularSubscriptionsCount}
          </span>
        </button>

        {/* Option 4: EMI Subscriptions */}
        <button
          type="button"
          onClick={() => setActiveTab("emi")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "emi"
              ? "bg-white dark:bg-zinc-900 text-teal-800 dark:text-teal-300 shadow-sm border border-teal-500/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <span>💳 EMI Subscription</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === "emi"
              ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          }`}>
            {kpis.emiSubscriptionsCount}
          </span>
        </button>
      </div>

      {/* Package Tier Showcase Banner when "Package" tab is selected */}
      {activeTab === "package" && !isClient && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Available Pre-Configured Packages (Click to assign):
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedSubModelTab("package")
                setIsCustomPackage(true)
                setIsAddSubModalOpen(true)
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              + Create Custom Package Entry
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_PACKAGE_TIERS.map((pkg) => (
              <div
                key={pkg.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {pkg.category}
                    </span>
                    {pkg.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
                    {pkg.name}
                  </h4>
                  <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1.5">
                    ₹{pkg.price.toLocaleString("en-IN")}
                    <span className="text-xs text-zinc-400 font-normal"> / {pkg.billingCycle.toLowerCase()}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                    {pkg.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {pkg.deliverables.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10.5px] text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{d}</span>
                    </div>
                  ))}
                  {pkg.deliverables.length > 3 && (
                    <div className="text-[10px] text-zinc-400 font-semibold pl-4">
                      +{pkg.deliverables.length - 3} more deliverables
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs font-bold"
                  onClick={() => {
                    setSelectedSubModelTab("package")
                    setSelectedPackageId(pkg.id)
                    setIsCustomPackage(false)
                    setIsAddSubModalOpen(true)
                  }}
                >
                  Assign to Client
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Subscriptions List Component */}
      {isLoading ? (
        <ThreeDotLoader text="Loading subscriptions..." fullScreen={false} />
      ) : (
        <SubscriptionList
          subscriptions={tabFilteredSubscriptions}
          onDelete={handleDeleteSubscription}
          onOpenRenewModal={(sub) => setRenewingSubscription(sub)}
          onSendReminder={handleSendReminder}
          onToggleAutoRenew={handleToggleAutoRenew}
          onClientPayNow={(sub) => setClientPayingSub(sub)}
        />
      )}

      {/* ── MODAL 1: RENEW SUBSCRIPTION MODAL (ADMIN / STAFF) ── */}
      <RenewSubscriptionModal
        isOpen={Boolean(renewingSubscription)}
        subscription={renewingSubscription}
        onClose={() => setRenewingSubscription(null)}
        onConfirm={handleRenewSubscriptionConfirm}
      />

      {/* ── MODAL 2: CLIENT "PAY NOW / RENEW" INTERACTIVE MODAL ── */}
      <AnimatePresence>
        {clientPayingSub && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    🔄
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Renew Subscription Online</h3>
                    <p className="text-[11px] text-blue-100 truncate max-w-[280px]">
                      {clientPayingSub.planName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClientPayingSub(null)}
                  className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Amount Due Card */}
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                    Renewal Amount Due
                  </div>
                  <div className="text-3xl font-black text-blue-900 dark:text-blue-100 mt-1">
                    {clientPayingSub.amount}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Renewal Interval: {clientPayingSub.billingCycle} • Due on {clientPayingSub.nextBillingDate}
                  </div>
                </div>

                {/* Select Payment Method */}
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setClientPayMethod("upi")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "upi"
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <QrCode size={18} />
                      <span className="text-[10.5px]">UPI QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientPayMethod("card")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "card"
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <CreditCard size={18} />
                      <span className="text-[10.5px]">Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientPayMethod("bank")}
                      className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        clientPayMethod === "bank"
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Building2 size={18} />
                      <span className="text-[10.5px]">Bank IMPS</span>
                    </button>
                  </div>
                </div>

                {/* Method Display */}
                {clientPayMethod === "upi" && (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-2">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-xs border border-zinc-200 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=saamparktechnology@icici%26pn=SAAMPARK%20GROUP%26am=${clientPayingSub.numericAmount || 25000}%26cu=INR`} 
                        alt="UPI QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Scan with any UPI App (GPay, PhonePe, Paytm)
                    </div>
                  </div>
                )}

                {clientPayMethod === "bank" && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Bank:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">ICICI Bank Ltd.</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">A/C Name:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">SAAMPARK TECHNOLOGY PVT LTD</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">A/C Number:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono">002105023910</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">IFSC:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono">ICIC0000021</strong>
                    </div>
                  </div>
                )}

                {clientPayMethod === "card" && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <input
                      type="text"
                      placeholder="Card Number"
                      defaultValue="4532 •••• •••• 8892"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="12/28"
                        className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        defaultValue="•••"
                        className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPayingSub(null)}
                    className="px-4 py-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleClientPaySubscription}
                    isLoading={isClientPayProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <ShieldCheck size={14} className="mr-1.5" />
                    Pay & Renew ({clientPayingSub.amount})
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: CREATE NEW SUBSCRIPTION (3 OPTIONS + CUSTOM ENTRY) ── */}
      <AnimatePresence>
        {isAddSubModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-teal-900/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Create New Subscription Plan
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Choose between Package Wise, Regular Retainer, or EMI Subscription
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 3 Model Selector Tabs inside Modal */}
              <div className="px-6 pt-4 pb-2 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubModelTab("package")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedSubModelTab === "package"
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                        : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="text-xs">📦 Option 1</div>
                    <div className="text-[11px] opacity-90">Package Wise</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSubModelTab("regular")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedSubModelTab === "regular"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                        : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="text-xs">🔁 Option 2</div>
                    <div className="text-[11px] opacity-90">Regular Retainer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSubModelTab("emi")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedSubModelTab === "emi"
                        ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                        : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="text-xs">💳 Option 3</div>
                    <div className="text-[11px] opacity-90">EMI Subscription</div>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubscriptionSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                {/* Client Selection (Shared for all 3) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-600 dark:text-zinc-400 font-semibold">
                      Subscriber Client *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomClient(!isCustomClient)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      {isCustomClient ? "Select Existing Client" : "+ Custom Client Entry"}
                    </button>
                  </div>

                  {!isCustomClient ? (
                    <select
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-medium"
                    >
                      {availableClients.map(c => (
                        <option key={c.name} value={c.name}>{c.name} ({c.company || 'Client'})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <input
                        type="text"
                        required
                        placeholder="Client Full Name *"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="Client Email"
                          value={customClientEmail}
                          onChange={(e) => setCustomClientEmail(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="Client Phone"
                          value={customClientPhone}
                          onChange={(e) => setCustomClientPhone(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Company / Business Name"
                        value={customClientCompany}
                        onChange={(e) => setCustomClientCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* ── TAB A: PACKAGE WISE FORM ── */}
                {selectedSubModelTab === "package" && (
                  <div className="space-y-3 p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                        Package Selection & Deliverables
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsCustomPackage(!isCustomPackage)}
                        className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                      >
                        {isCustomPackage ? "Choose Ready Preset" : "+ Custom Package Entry"}
                      </button>
                    </div>

                    {!isCustomPackage ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Select Pre-Configured Package:
                        </label>
                        <select
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        >
                          {PRESET_PACKAGE_TIERS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₹{p.price.toLocaleString("en-IN")}/{p.billingCycle.toLowerCase()} ({p.category})
                            </option>
                          ))}
                        </select>

                        {/* Deliverables preview */}
                        {(() => {
                          const p = PRESET_PACKAGE_TIERS.find(t => t.id === selectedPackageId) || PRESET_PACKAGE_TIERS[0]
                          return (
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                              <div className="font-bold text-zinc-700 dark:text-zinc-300 text-[11px]">
                                Included Inclusions & Deliverables:
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {p.deliverables.map((d, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[10.5px] text-zinc-600 dark:text-zinc-400">
                                    <Check size={11} className="text-emerald-500 shrink-0" />
                                    <span className="truncate">{d}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Custom Package Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. VIP Dedicated Engineering & Cloud Retainer"
                            value={customPackageName}
                            onChange={(e) => setCustomPackageName(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                              Package Price (₹) *
                            </label>
                            <input
                              type="number"
                              required
                              value={customPackagePrice}
                              onChange={(e) => setCustomPackagePrice(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                              Billing Interval
                            </label>
                            <select
                              value={customPackageCycle}
                              onChange={(e) => setCustomPackageCycle(e.target.value as BillingCycle)}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                            >
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Half-Yearly">Half-Yearly</option>
                              <option value="Annually">Annually</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                            Deliverables Checklist (1 item per line):
                          </label>
                          <textarea
                            rows={3}
                            value={customDeliverablesText}
                            onChange={(e) => setCustomDeliverablesText(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB B: REGULAR RETAINER FORM ── */}
                {selectedSubModelTab === "regular" && (
                  <div className="space-y-3 p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                    <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                      Regular Recurring Retainer Details
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Subscription / Retainer Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AWS Cloud Server & ERP Maintenance Retainer"
                        value={regularPlanName}
                        onChange={(e) => setRegularPlanName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Recurring Amount (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={regularAmount}
                          onChange={(e) => setRegularAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Billing Interval
                        </label>
                        <select
                          value={regularCycle}
                          onChange={(e) => setRegularCycle(e.target.value as BillingCycle)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly (Every 7 Days)</option>
                          <option value="Monthly">Monthly Retainer</option>
                          <option value="Quarterly">Quarterly (Every 3 Months)</option>
                          <option value="Half-Yearly">Half-Yearly (Every 6 Months)</option>
                          <option value="Annually">Annual Contract (Yearly)</option>
                          <option value="Custom Days">Custom Interval (Days)</option>
                        </select>
                      </div>
                    </div>

                    {regularCycle === "Custom Days" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Interval Duration in Days
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={customDaysCount}
                          onChange={(e) => setCustomDaysCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          1st Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={regularStartDate}
                          onChange={(e) => setRegularStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Next Billing Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={regularNextDate}
                          onChange={(e) => setRegularNextDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB C: EMI SUBSCRIPTION FORM ── */}
                {selectedSubModelTab === "emi" && (
                  <div className="space-y-3 p-4 bg-teal-50/40 dark:bg-teal-950/20 rounded-2xl border border-teal-200/60 dark:border-teal-900/40">
                    <h4 className="font-bold text-teal-900 dark:text-teal-200 text-xs">
                      EMI Subscription Tenure & Breakdown
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        Subscription Product / Service Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Enterprise Full-Stack ERP on 6M EMI"
                        value={emiPlanName}
                        onChange={(e) => setEmiPlanName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Total Value (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={emiTotalAmount}
                          onChange={(e) => setEmiTotalAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Down Payment (₹)
                        </label>
                        <input
                          type="number"
                          value={emiDownPayment}
                          onChange={(e) => setEmiDownPayment(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          Tenure (Months)
                        </label>
                        <select
                          value={emiTenureMonths}
                          onChange={(e) => setEmiTenureMonths(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                        >
                          {[3, 4, 6, 8, 9, 12, 18, 24].map(n => (
                            <option key={n} value={n}>{n} Months</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculated EMI Preview Card */}
                    {(() => {
                      const total = parseInt(emiTotalAmount.replace(/[^0-9]/g, "")) || 0
                      const down = parseInt(emiDownPayment.replace(/[^0-9]/g, "")) || 0
                      const bal = Math.max(0, total - down)
                      const monthly = Math.round(bal / Math.max(1, emiTenureMonths))
                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-[10px] text-zinc-400 font-bold uppercase">Computed Monthly EMI</div>
                            <div className="text-base font-black text-teal-600 dark:text-teal-400">
                              ₹{monthly.toLocaleString("en-IN")} / month
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-zinc-500">
                            <div>Tenure: <strong>{emiTenureMonths} Installments</strong></div>
                            <div>Financed Balance: <strong>₹{bal.toLocaleString("en-IN")}</strong></div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddSubModalOpen(false)}
                    className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <CreditCard size={14} className="mr-1.5" />
                    Create Subscription
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
