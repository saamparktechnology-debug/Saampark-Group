"use client"

import * as React from "react"
import { X, Briefcase, FileText, CheckCircle2, Clock, Calendar, AlertCircle, Eye, FolderPlus } from "lucide-react"
import { ClientItem } from "../types"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { Project } from "@/app/feature/projects/types"
import { getInvoices, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"

interface ClientHistoryModalProps {
  isOpen: boolean
  client: ClientItem | null
  onClose: () => void
  onSelectInvoice?: (invoice: InvoiceItem) => void
  onAddProjectForClient?: (client: ClientItem) => void
}

export function ClientHistoryModal({
  isOpen,
  client,
  onClose,
  onSelectInvoice,
  onAddProjectForClient,
}: ClientHistoryModalProps) {
  const [activeTab, setActiveTab] = React.useState<"projects" | "invoices">("projects")
  const [clientProjects, setClientProjects] = React.useState<Project[]>([])
  const [clientInvoices, setClientInvoices] = React.useState<InvoiceItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && client) {
      setIsLoading(true)
      Promise.all([
        getProjects().catch(() => []),
        getInvoices().catch(() => []),
      ]).then(([allProjects, allInvoices]) => {
        const cName = (client.name || "").toLowerCase().trim()
        const cEmail = (client.email || "").toLowerCase().trim()

        const filteredProj = allProjects.filter((p) => {
          const pClient = (p.client || "").toLowerCase().trim()
          return pClient === cName || (cEmail && pClient.includes(cEmail))
        })

        const filteredInv = allInvoices.filter((i) => {
          const iClient = (i.client || "").toLowerCase().trim()
          const iEmail = (i.clientEmail || "").toLowerCase().trim()
          return iClient === cName || (cEmail && iEmail === cEmail)
        })

        setClientProjects(filteredProj)
        setClientInvoices(filteredInv)
      }).finally(() => setIsLoading(false))
    }
  }, [isOpen, client])

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 top-14 sm:top-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">{client.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {client.group || "VIP Client"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Contact: {client.primaryContact || client.name} • {client.email || "No Email"} • {client.phone || "No Phone"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddProjectForClient && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onAddProjectForClient(client)
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <FolderPlus size={14} />
                <span>+ Add New Project</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-xs py-3 px-6">
          <div className="text-center">
            <span className="text-zinc-500 block text-[11px]">Total Projects</span>
            <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{clientProjects.length}</strong>
          </div>
          <div className="text-center">
            <span className="text-zinc-500 block text-[11px]">Total Invoiced</span>
            <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">{client.totalInvoiced || "₹0"}</strong>
          </div>
          <div className="text-center">
            <span className="text-zinc-500 block text-[11px]">Balance Due</span>
            <strong className="text-sm font-bold text-rose-600">{client.due || "₹0"}</strong>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Briefcase size={14} />
            <span>Projects History ({clientProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText size={14} />
            <span>Invoices & Billing ({clientInvoices.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          
          {isLoading ? (
            <div className="py-12 text-center text-zinc-400">Loading client history...</div>
          ) : activeTab === "projects" ? (
            clientProjects.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 space-y-3">
                <p>No projects found for {client.name}.</p>
                {onAddProjectForClient && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onAddProjectForClient(client)
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                  >
                    + Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Project Title</th>
                      <th className="py-3 px-4">Price / Invoiced</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Target Release</th>
                      <th className="py-3 px-4">Completion</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                          {p.title}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{p.price}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{p.startDate}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{p.deadline}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{p.progress}%</span>
                            <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.status === "Completed" || p.status === "Finished" ? "bg-emerald-500" : "bg-blue-600"}`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            p.status === "Payment Pending" || p.paymentStatus === "Payment Pending"
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : p.status === "Completed" || p.status === "Finished"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            clientInvoices.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">No invoices generated for {client.name} yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Bill Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium text-zinc-800 dark:text-zinc-200">
                    {clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">{inv.id}</td>
                        <td className="py-3.5 px-4 truncate max-w-[180px]">{inv.project}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{inv.billDate}</td>
                        <td className="py-3.5 px-4 text-zinc-500">{inv.dueDate}</td>
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">{inv.totalInvoiced}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inv.status === "Fully paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectInvoice) onSelectInvoice(inv)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 text-[11px] ml-auto border border-blue-200/60"
                          >
                            <Eye size={13} />
                            <span>View Tax Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  )
}
