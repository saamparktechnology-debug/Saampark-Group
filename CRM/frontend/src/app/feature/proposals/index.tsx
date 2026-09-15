"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, Download, File, Search, CheckCircle2, XCircle, 
  Clock, Eye, Trash2, Check, ArrowRight, Printer, X, Send 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { getClients } from "@/app/feature/clients/services/clientService"
import { addProject } from "@/app/feature/projects/services/projectService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
import { addOrder } from "@/app/feature/sales/orders/services/orderService"
import { exportToExcel, printPDFReport } from "@/lib/exportUtils"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"
import { confirmTwoStepDelete } from "@/lib/confirmDialog"

export interface ProposalItem {
  id: string
  proposalNumber: string
  title: string
  client: string
  clientEmail?: string
  proposalDate: string
  validUntil: string
  amount: string
  amountNum: number
  deliverables: string[]
  description: string
  status: "Draft" | "Sent" | "Accepted" | "Declined"
}

export default function ProposalsMain() {
  const { user, activeCompanyId, activeBranchId, branches } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddProposal = canPerformAction(user, "Proposals", "add")
  const canEditProposal = canPerformAction(user, "Proposals", "edit")
  const canDeleteProposal = canPerformAction(user, "Proposals", "delete")

  const targetComp = activeCompanyId || user?.companyId || "tech"

  const isClientRole = user?.role === "Clients"
  const clientEmailNorm = (user?.email || "").toLowerCase().trim()
  const clientNameNorm = (user?.name || "").toLowerCase().trim()

  const [proposals, setProposals] = React.useState<ProposalItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")
  const [selectedProposal, setSelectedProposal] = React.useState<ProposalItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Form states
  const [title, setTitle] = React.useState("")
  const [client, setClient] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [validUntil, setValidUntil] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [deliverablesInput, setDeliverablesInput] = React.useState("Architecture & Planning, High-Fidelity Design, Frontend & API Integration, QA & Launch")
  const [availableClients, setAvailableClients] = React.useState<{ name: string; email: string }[]>([])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadProposals = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<ProposalItem[]>("proposals", [], targetComp)
    setProposals(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [targetComp])

  React.useEffect(() => {
    loadProposals()
    window.addEventListener("storage", loadProposals)
    window.addEventListener("saampark_data_synced", loadProposals)
    window.addEventListener("saampark_company_switched", loadProposals)
    window.addEventListener("saampark_branch_switched", loadProposals)
    return () => {
      window.removeEventListener("storage", loadProposals)
      window.removeEventListener("saampark_data_synced", loadProposals)
      window.removeEventListener("saampark_company_switched", loadProposals)
      window.removeEventListener("saampark_branch_switched", loadProposals)
    }
  }, [loadProposals])

  React.useEffect(() => {
    if (isCreateModalOpen) {
      getClients().then((cList) => {
        setAvailableClients(cList.map(c => ({ name: c.name, email: c.email || "" })))
        if (cList.length > 0) {
          setClient(cList[0].name)
          setClientEmail(cList[0].email || "")
        }
      }).catch(() => {})
    }
  }, [isCreateModalOpen])

  // Filter by company, branch, and role
  const displayedProposals = React.useMemo(() => {
    const { activeCompanyId: freshComp, activeBranchId: freshBranch, branches: freshBranches } = useAuthStore.getState()
    const userComp = (freshComp || user?.companyId || "").toLowerCase().trim()
    const targetBranch = freshBranch
    const branchObj = freshBranches.find(b => b.id === targetBranch || b.name.toLowerCase() === (targetBranch || "").toLowerCase())
    const targetBranchId = String(branchObj?.id || targetBranch || "").toLowerCase().trim()
    const targetBranchName = branchObj?.name?.toLowerCase().trim() || ""

    return proposals.filter((p) => {
      // Company filter
      if (userComp && userComp !== "all") {
        const pComp = ((p as any).companyId || "").toLowerCase().trim()
        if (pComp && pComp !== userComp) return false
        if (!pComp && userComp !== "tech") return false
      }
      // Branch filter (strict)
      if (targetBranch && targetBranch !== "all") {
        const pBranch = String((p as any).branchId || "").toLowerCase().trim()
        if (!pBranch) return false
        const match = pBranch === targetBranchId || (targetBranchName && pBranch === targetBranchName)
        if (!match) return false
      }
      // Client role: only their own proposals
      if (isClientRole) return isRecordAssignedToClient(p, user)
      return true
    })
  }, [proposals, isClientRole, user, activeCompanyId, activeBranchId, branches])

  const filteredProposals = React.useMemo(() => {
    return displayedProposals.filter((p) => {
      const matchSearch =
        p.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.amount.toLowerCase().includes(searchQuery.toLowerCase())

      if (selectedStatus === "all") return matchSearch
      return matchSearch && p.status === selectedStatus
    })
  }, [displayedProposals, searchQuery, selectedStatus])

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !client.trim() || !amount.trim()) {
      alert("Please fill in title, client, and amount.")
      return
    }

    const numAmount = parseInt(amount.replace(/[^0-9]/g, "")) || 0
    const formattedAmount = `₹${numAmount.toLocaleString("en-IN")}`
    const maxNum = proposals.reduce((max, p) => {
      const num = parseInt(String(p.proposalNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 100)

    const newProp: ProposalItem = {
      id: `prop_${Date.now()}`,
      proposalNumber: `PROP #${maxNum + 1}`,
      title,
      client,
      clientEmail: clientEmail || `${client.toLowerCase().replace(/\s+/g, "")}@example.com`,
      proposalDate: new Date().toLocaleDateString("en-GB"),
      validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB"),
      amount: formattedAmount,
      amountNum: numAmount,
      deliverables: deliverablesInput.split(",").map(d => d.trim()).filter(Boolean),
      description: description || "Comprehensive project proposal outlining solution architecture, roadmap, and pricing.",
      status: "Sent",
    }

    const updated = [newProp, ...proposals]
    setProposals(updated)
    await saveModuleDataToDB("proposals", updated, targetComp)
    showToast(`✅ Proposal ${newProp.proposalNumber} dispatched to ${client}!`)
    setIsCreateModalOpen(false)
    setTitle("")
    setAmount("")
    setDescription("")
  }

  const handleClientAccept = async (prop: ProposalItem) => {
    const updated = proposals.map(p => p.id === prop.id ? { ...p, status: "Accepted" as const } : p)
    setProposals(updated)
    await saveModuleDataToDB("proposals", updated, targetComp)
    showToast(`🎉 Accepted Proposal ${prop.proposalNumber}!`)
    setSelectedProposal(null)
  }

  const handleClientDecline = async (prop: ProposalItem) => {
    const updated = proposals.map(p => p.id === prop.id ? { ...p, status: "Declined" as const } : p)
    setProposals(updated)
    await saveModuleDataToDB("proposals", updated, targetComp)
    showToast(`Proposal ${prop.proposalNumber} marked as declined.`)
    setSelectedProposal(null)
  }

  const handleConvertToProject = async (prop: ProposalItem) => {
    try {
      const baseAmount = Math.round(prop.amountNum / 1.18)
      const gstAmount = prop.amountNum - baseAmount
      const pTitle = prop.title

      await addProject({
        title: pTitle,
        client: prop.client,
        price: prop.amount,
        projectType: "Client Project",
        progress: 0,
        startDate: new Date().toLocaleDateString("en-GB"),
        deadline: prop.validUntil,
        status: "In Progress",
        members: [{ id: "1", name: "Admin", role: "Manager", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Admin" }],
        labels: ["From Proposal", prop.proposalNumber],
        description: prop.description,
        baseAmount,
        gstRate: 18,
        gstAmount,
        totalAmount: prop.amountNum,
      })

      const invoiceId = `INV #${Math.floor(100 + Math.random() * 900)}`
      await addInvoice({
        id: invoiceId,
        client: prop.client,
        clientEmail: prop.clientEmail,
        project: pTitle,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: prop.validUntil,
        baseAmount,
        gstRate: 18,
        gstAmount,
        totalInvoiced: prop.amount,
        paymentReceived: "₹0",
        due: prop.amount,
        status: "Not paid",
        billedBy: user?.name || "Admin",
      })

      await addOrder({
        client: prop.client,
        clientEmail: prop.clientEmail,
        project: pTitle,
        orderDate: new Date().toLocaleDateString("en-GB"),
        deliveryDate: prop.validUntil,
        itemsCount: prop.deliverables.length || 1,
        totalAmount: prop.amount,
        paymentStatus: "Unpaid",
        status: "Processing",
        notes: `Converted from Proposal ${prop.proposalNumber}`,
        invoiceId,
      })

      showToast(`🚀 Converted into active Project, Tax Invoice (${invoiceId}), and Order!`)
      setSelectedProposal(null)
      loadProposals()
    } catch (err: any) {
      alert(`Error converting: ${err.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    const prop = proposals.find(p => p.id === id)
    const label = prop?.title || id
    if (await confirmTwoStepDelete(label, "proposal")) {
      await markGlobalItemDeleted(id, "proposals")
      const updated = proposals.filter(p => p.id !== id)
      setProposals(updated)
      await saveModuleDataToDB("proposals", updated)
      showToast("Proposal removed.")
    }
  }

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
            <File className="text-blue-600 dark:text-blue-400" size={24} />
            <span>{isClientRole ? "My Project Proposals" : "Business Proposals"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isClientRole 
              ? "Review custom project proposals, scope roadmaps, and formal pricing terms."
              : "Draft comprehensive proposals, outline deliverable roadmaps, and track client approvals"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              exportToExcel({
                filename: "SAAMPARK_Proposals",
                title: "Business Proposals Report",
                subtitle: selectedStatus === "all" ? "All Proposals" : selectedStatus,
                headers: ["#", "Proposal #", "Title", "Client", "Amount (₹)", "Proposal Date", "Valid Until", "Status"],
                rows: filteredProposals.map((p, idx) => [
                  idx + 1,
                  p.proposalNumber,
                  p.title,
                  p.client,
                  `₹${p.amountNum.toLocaleString("en-IN")}`,
                  p.proposalDate,
                  p.validUntil,
                  p.status,
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
                title: "Business Proposals Report",
                subtitle: selectedStatus === "all" ? "All Proposals" : selectedStatus,
                headers: ["#", "Proposal #", "Title", "Client", "Amount", "Date", "Valid Until", "Status"],
                rows: filteredProposals.map((p, idx) => [
                  idx + 1,
                  p.proposalNumber,
                  p.title,
                  p.client,
                  `₹${p.amountNum.toLocaleString("en-IN")}`,
                  p.proposalDate,
                  p.validUntil,
                  p.status,
                ]),
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs cursor-pointer"
          >
            <Printer size={13} className="text-zinc-500" />
            <span>Print</span>
          </button>

          {canAddProposal && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>Create Proposal</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- FILTER & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search proposals, client, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "Sent", "Accepted", "Draft", "Declined"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedStatus === st 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- PROPOSALS TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Proposal Number</th>
              <th className="py-3 px-4">Scope / Title</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Proposal Date</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {filteredProposals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  No proposals found. Click "+ Create Proposal" to draft a new quote.
                </td>
              </tr>
            ) : (
              filteredProposals.map((p) => {
                let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                if (p.status === "Accepted") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                if (p.status === "Sent") statusBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                if (p.status === "Declined") statusBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"

                return (
                  <tr key={p.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedProposal(p)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {p.proposalNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                      {p.title}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.client}</div>
                      <div className="text-[10px] text-zinc-400">{p.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{p.proposalDate}</td>
                    <td className="py-3 px-4 text-red-600 dark:text-red-400 font-bold font-mono text-[11px]">{p.validUntil}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{p.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {isClientRole && p.status === "Sent" && (
                          <button
                            type="button"
                            onClick={() => handleClientAccept(p)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                            title="Accept Proposal"
                          >
                            <Check size={12} />
                            <span>Accept</span>
                          </button>
                        )}

                        {!isClientRole && p.status === "Accepted" && (
                          <button
                            type="button"
                            onClick={() => handleConvertToProject(p)}
                            className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold flex items-center gap-1"
                            title="Convert to Project & Invoice"
                          >
                            <ArrowRight size={12} />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedProposal(p)}
                          className="p-1 hover:text-blue-600 transition-colors"
                          title="View Proposal"
                        >
                          <Eye size={14} />
                        </button>

                        {canDeleteProposal && (
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Delete Proposal"
                          >
                            <Trash2 size={14} />
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

      {/* ---------------- PROPOSAL PREVIEW MODAL ---------------- */}
      <AnimatePresence>
        {selectedProposal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2">
                  <File className="text-blue-600" size={20} />
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedProposal.proposalNumber} — Proposal</h3>
                    <p className="text-[11px] text-zinc-400">{selectedProposal.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProposal(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Client</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedProposal.client}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Date</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedProposal.proposalDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Valid Until</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedProposal.validUntil}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Amount</span>
                    <span className="font-bold text-blue-600 text-sm">{selectedProposal.amount}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] mb-1">Scope & Roadmap</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg">
                    {selectedProposal.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] mb-2">Key Deliverables</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProposal.deliverables?.map((d, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50"
                >
                  <Printer size={13} />
                  <span>Print Document</span>
                </button>

                <div className="flex items-center gap-2">
                  {isClientRole && selectedProposal.status === "Sent" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleClientDecline(selectedProposal)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientAccept(selectedProposal)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Accept Proposal</span>
                      </button>
                    </>
                  )}

                  {!isClientRole && selectedProposal.status === "Accepted" && (
                    <button
                      type="button"
                      onClick={() => handleConvertToProject(selectedProposal)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm flex items-center gap-1"
                    >
                      <ArrowRight size={13} />
                      <span>Convert to Project & Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- CREATE PROPOSAL MODAL ---------------- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <File size={18} className="text-blue-600" />
                  <span>Draft Business Proposal</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Proposal Title / Project Scope *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud ERP Migration & Custom Portal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Target Client *</label>
                    <select
                      value={client}
                      onChange={(e) => {
                        setClient(e.target.value)
                        const c = availableClients.find(item => item.name === e.target.value)
                        if (c) setClientEmail(c.email)
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                    >
                      {availableClients.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Total Pricing (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Deliverables (comma separated)</label>
                  <input
                    type="text"
                    value={deliverablesInput}
                    onChange={(e) => setDeliverablesInput(e.target.value)}
                    placeholder="e.g. System Design, Mobile App, Cloud Setup, 1-Year Support"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Proposal Overview & Terms</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide background, execution strategy, and milestone timelines..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1"
                  >
                    <Send size={13} />
                    <span>Send Proposal to Client</span>
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
