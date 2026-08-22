"use client"

import * as React from "react"
import { Briefcase, Users, CheckSquare, Layers, FileText, CheckCircle2, PauseCircle, XCircle, Box, Clock, MessageSquare, ShoppingCart } from "lucide-react"

interface OverviewViewProps {
  totalClients?: number
  totalContacts?: number
}

export function OverviewView({ totalClients = 0, totalContacts = 0 }: OverviewViewProps) {
  const loggedInToday = totalContacts > 0 ? Math.min(2, totalContacts) : 0
  const loggedIn7Days = totalContacts > 0 ? Math.min(6, totalContacts) : 0

  const [metrics, setMetrics] = React.useState({
    unpaidInvoices: 0,
    partiallyPaidInvoices: 0,
    overdueInvoices: 0,
    openProjects: 0,
    completedProjects: 0,
    holdProjects: 0,
    canceledProjects: 0,
    openTickets: 0,
    newOrders: 0,
    openEstimates: 0,
    acceptedEstimates: 0,
    newEstimateRequests: 0,
    inProgressEstimates: 0,
    openProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0,
  })

  React.useEffect(() => {
    const loadRealMetrics = async () => {
      try {
        const { getInvoices } = await import("@/app/feature/sales/invoices/services/invoiceService")
        const { getProjects } = await import("@/app/feature/projects/services/projectService")

        const [invoicesList, projectsList] = await Promise.all([
          getInvoices().catch(() => []),
          getProjects().catch(() => []),
        ])

        const unpaid = invoicesList.filter(i => i.status === "Not paid" || i.status === "Payment Pending" || i.status === "Draft").length
        const partiallyPaid = invoicesList.filter(i => i.status === "Partially paid").length
        const overdue = invoicesList.filter(i => i.due !== "₹0" && i.due !== "₹0.00" && i.status !== "Fully paid").length

        const openProj = projectsList.filter(p => p.status === "In Progress" || p.status === "Open").length
        const completedProj = projectsList.filter(p => p.status === "Completed" || p.status === "Finished").length
        const holdProj = projectsList.filter(p => p.status === "Hold").length
        const canceledProj = projectsList.filter(p => p.status === "Cancelled").length

        setMetrics({
          unpaidInvoices: unpaid,
          partiallyPaidInvoices: partiallyPaid,
          overdueInvoices: overdue,
          openProjects: openProj,
          completedProjects: completedProj,
          holdProjects: holdProj,
          canceledProjects: canceledProj,
          openTickets: 0,
          newOrders: 0,
          openEstimates: 0,
          acceptedEstimates: 0,
          newEstimateRequests: 0,
          inProgressEstimates: 0,
          openProposals: 0,
          acceptedProposals: 0,
          rejectedProposals: 0,
        })
      } catch (err) {
        console.warn("Error loading overview metrics:", err)
      }
    }

    loadRealMetrics()
  }, [])

  const calcPct = (cnt: number) => {
    if (!totalClients || totalClients === 0) return 0
    return Math.min(100, Math.round((cnt / totalClients) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total clients */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
            <Briefcase size={22} />
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalClients}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total clients</p>
          </div>
        </div>

        {/* Total contacts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Users size={22} />
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalContacts}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total contacts</p>
          </div>
        </div>

        {/* Contacts logged in today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
            <CheckSquare size={22} />
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{loggedInToday}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Contacts logged in today</p>
          </div>
        </div>

        {/* Contacts logged in last 7 days */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
            <CheckSquare size={22} />
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{loggedIn7Days}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Contacts logged in last 7 days</p>
          </div>
        </div>
      </div>

      {/* Row 2: Invoices Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unpaid Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has unpaid invoices</h4>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.unpaidInvoices}</span>
          </div>
          <p className="text-xs text-slate-400">{calcPct(metrics.unpaidInvoices)}% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${calcPct(metrics.unpaidInvoices)}%` }} />
          </div>
        </div>

        {/* Partially Paid Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has partially paid invoices</h4>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.partiallyPaidInvoices}</span>
          </div>
          <p className="text-xs text-slate-400">{calcPct(metrics.partiallyPaidInvoices)}% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${calcPct(metrics.partiallyPaidInvoices)}%` }} />
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has overdue invoices</h4>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.overdueInvoices}</span>
          </div>
          <p className="text-xs text-slate-400">{calcPct(metrics.overdueInvoices)}% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${calcPct(metrics.overdueInvoices)}%` }} />
          </div>
        </div>
      </div>

      {/* Row 3: Projects & Estimates Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            Projects
          </h4>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Layers size={16} className="text-slate-400" />
                Clients has open projects
              </span>
              <span className="font-semibold text-blue-500">{metrics.openProjects}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has completed projects
              </span>
              <span className="font-semibold text-emerald-500">{metrics.completedProjects}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <PauseCircle size={16} className="text-slate-400" />
                Clients has hold projects
              </span>
              <span className="font-semibold text-amber-500">{metrics.holdProjects}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <XCircle size={16} className="text-slate-400" />
                Clients has canceled projects
              </span>
              <span className="font-semibold text-rose-500">{metrics.canceledProjects}</span>
            </div>
          </div>
        </div>

        {/* Estimates Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            Estimates
          </h4>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Box size={16} className="text-slate-400" />
                Client has open estimates
              </span>
              <span className="font-semibold text-amber-500">{metrics.openEstimates}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has accepted estimates
              </span>
              <span className="font-semibold text-emerald-500">{metrics.acceptedEstimates}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Clients has new estimate requests
              </span>
              <span className="font-semibold text-blue-500">{metrics.newEstimateRequests}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Clients has estimate requests in progress
              </span>
              <span className="font-semibold text-slate-500">{metrics.inProgressEstimates}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Tickets/Orders & Proposals Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tickets & Orders Card */}
        <div className="space-y-4">
          {/* Open Tickets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has open tickets</h4>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.openTickets}</span>
            </div>
            <p className="text-xs text-slate-400">{calcPct(metrics.openTickets)}% of total clients</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${calcPct(metrics.openTickets)}%` }} />
            </div>
          </div>

          {/* New Orders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has new orders</h4>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.newOrders}</span>
            </div>
            <p className="text-xs text-slate-400">{calcPct(metrics.newOrders)}% of total clients</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${calcPct(metrics.newOrders)}%` }} />
            </div>
          </div>
        </div>

        {/* Proposals Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
            Proposals
          </h4>

          <div className="space-y-4 text-sm pt-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Clients has open proposals
              </span>
              <span className="font-semibold text-amber-500">{metrics.openProposals}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has accepted proposals
              </span>
              <span className="font-semibold text-emerald-500">{metrics.acceptedProposals}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <XCircle size={16} className="text-slate-400" />
                Clients has rejected proposals
              </span>
              <span className="font-semibold text-rose-500">{metrics.rejectedProposals}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
