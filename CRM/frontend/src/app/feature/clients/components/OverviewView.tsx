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
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">4</span>
          </div>
          <p className="text-xs text-slate-400">8% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "8%" }} />
          </div>
        </div>

        {/* Partially Paid Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has partially paid invoices</h4>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">5</span>
          </div>
          <p className="text-xs text-slate-400">10% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "10%" }} />
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has overdue invoices</h4>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">4</span>
          </div>
          <p className="text-xs text-slate-400">8% of total clients</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: "8%" }} />
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
              <span className="font-semibold text-blue-500">18</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has completed projects
              </span>
              <span className="font-semibold text-emerald-500">4</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <PauseCircle size={16} className="text-slate-400" />
                Clients has hold projects
              </span>
              <span className="font-semibold text-amber-500">0</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <XCircle size={16} className="text-slate-400" />
                Clients has canceled projects
              </span>
              <span className="font-semibold text-rose-500">0</span>
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
              <span className="font-semibold text-amber-500">5</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has accepted estimates
              </span>
              <span className="font-semibold text-emerald-500">10</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Clients has new estimate requests
              </span>
              <span className="font-semibold text-blue-500">1</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Clients has estimate requests in progress
              </span>
              <span className="font-semibold text-slate-500">1</span>
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
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">39</span>
            </div>
            <p className="text-xs text-slate-400">78% of total clients</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: "78%" }} />
            </div>
          </div>

          {/* New Orders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Clients has new orders</h4>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">6</span>
            </div>
            <p className="text-xs text-slate-400">12% of total clients</p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "12%" }} />
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
              <span className="font-semibold text-amber-500">2</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                Clients has accepted proposals
              </span>
              <span className="font-semibold text-emerald-500">10</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2">
                <XCircle size={16} className="text-slate-400" />
                Clients has rejected proposals
              </span>
              <span className="font-semibold text-rose-500">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
