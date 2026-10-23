"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, Check, X, Eye, Clock, AlertTriangle, Search, Filter, 
  FileText, ShoppingCart, CreditCard, User, Building2, Calendar, 
  ArrowRight, ShieldAlert, Sparkles, RefreshCw, Trash2, CheckCircle2,
  XCircle, ChevronRight, Info
} from "lucide-react"

import { useAuthStore } from "@/store/useAuthStore"
import { 
  getApprovalRequests, 
  approveApprovalRequest, 
  rejectApprovalRequest, 
  deleteApprovalRequest,
  ApprovalRequest, 
  ApprovalType, 
  ApprovalStatus 
} from "@/services/approvalService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

export default function ApprovalsPage() {
  const { user, activeCompanyId } = useAuthStore()
  const isSuperOrAdmin = user && (user.role === "Super Admin" || user.role === "Admin")

  const [requests, setRequests] = React.useState<ApprovalRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  
  // Inspection & Rejection Modals
  const [inspectItem, setInspectItem] = React.useState<ApprovalRequest | null>(null)
  const [rejectItem, setRejectItem] = React.useState<ApprovalRequest | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")

  const loadRequests = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getApprovalRequests(activeCompanyId || "all")
      setRequests(data)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [activeCompanyId])

  React.useEffect(() => {
    loadRequests()
    const handleUpdate = () => loadRequests()
    window.addEventListener("saampark_approvals_updated", handleUpdate)
    window.addEventListener("saampark_data_synced", handleUpdate)
    return () => {
      window.removeEventListener("saampark_approvals_updated", handleUpdate)
      window.removeEventListener("saampark_data_synced", handleUpdate)
    }
  }, [loadRequests])

  // Non-admin block
  if (!user || !isSuperOrAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface border border-border shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-foreground">Admin Access Restricted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Approvals Center is strictly reserved for Administrators. All bills, quotations, and subscriptions created by team members are reviewed here.
          </p>
        </div>
      </div>
    )
  }

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    if (typeFilter !== "all" && r.type !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchDoc = (r.documentNumber || "").toLowerCase().includes(q)
      const matchClient = (r.clientName || "").toLowerCase().includes(q)
      const matchSubmitter = (r.submittedBy?.name || "").toLowerCase().includes(q)
      const matchTitle = (r.title || "").toLowerCase().includes(q)
      if (!matchDoc && !matchClient && !matchSubmitter && !matchTitle) return false
    }
    return true
  })

  // KPI stats
  const pendingRequests = requests.filter(r => r.status === "pending")
  const pendingCount = pendingRequests.length
  const pendingAmount = pendingRequests.reduce((sum, r) => sum + (r.amount || 0), 0)
  const approvedCount = requests.filter(r => r.status === "approved").length
  const rejectedCount = requests.filter(r => r.status === "rejected").length

  const handleApprove = async (req: ApprovalRequest) => {
    await executeWithFeedback(async () => {
      await approveApprovalRequest(req.id, {
        id: String(user.id || ""),
        name: user.name || "Administrator",
        email: user.email || "",
        role: user.role || "Admin",
      })
      await loadRequests()
    }, {
      actionType: "process",
      loadingTitle: "Approving Submission...",
      loadingMsg: `Approving ${req.type.toUpperCase()} #${req.documentNumber}...`,
      successTitle: "Approved Successfully!",
      successMsg: `${req.title} is now officially approved and activated.`,
    })
  }

  const handleRejectSubmit = async () => {
    if (!rejectItem) return
    const reason = rejectionReason.trim() || "Declined by administrator."

    await executeWithFeedback(async () => {
      await rejectApprovalRequest(rejectItem.id, {
        id: String(user.id || ""),
        name: user.name || "Administrator",
        email: user.email || "",
        role: user.role || "Admin",
      }, reason)
      setRejectItem(null)
      setRejectionReason("")
      await loadRequests()
    }, {
      actionType: "process",
      loadingTitle: "Rejecting Submission...",
      loadingMsg: `Declining ${rejectItem.type.toUpperCase()} #${rejectItem.documentNumber}...`,
      successTitle: "Submission Rejected",
      successMsg: `${rejectItem.title} has been rejected. Notification sent to ${rejectItem.submittedBy.name}.`,
    })
  }

  const handleDelete = async (req: ApprovalRequest) => {
    if (!window.confirm(`Are you sure you want to remove approval record ${req.documentNumber}?`)) return
    await deleteApprovalRequest(req.id)
    await loadRequests()
  }

  const getTypeIcon = (type: ApprovalType) => {
    switch (type) {
      case "invoice":
        return <FileText size={16} className="text-blue-500" />
      case "quotation":
        return <ShoppingCart size={16} className="text-emerald-500" />
      case "subscription":
        return <CreditCard size={16} className="text-purple-500" />
      default:
        return <FileText size={16} className="text-amber-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                Admin Approvals Center
                {pendingCount > 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Review, approve, or reject bills, quotations, and subscriptions created by operational team members.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-surface hover:bg-surface-hover text-foreground transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Awaiting Approval</p>
            <p className="text-2xl font-black text-foreground mt-1">{pendingCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Action required by Admin</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={22} className="animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pending Value</p>
            <p className="text-2xl font-black text-foreground mt-1">₹{pendingAmount.toLocaleString("en-IN")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total unapproved pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved Items</p>
            <p className="text-2xl font-black text-foreground mt-1">{approvedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Processed & activated</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Rejected Items</p>
            <p className="text-2xl font-black text-foreground mt-1">{rejectedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Declined with feedback</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          {[
            { id: "all", label: "All Requests", count: requests.length },
            { id: "pending", label: "Pending", count: pendingCount, highlight: true },
            { id: "approved", label: "Approved", count: approvedCount },
            { id: "rejected", label: "Rejected", count: rejectedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-hover/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === tab.id
                  ? "bg-white/20 text-white"
                  : tab.highlight && tab.count > 0 ? "bg-amber-500 text-slate-950" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by doc #, client, or team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-hover border border-border text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-surface-hover border border-border text-foreground font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="invoice">Bills / Invoices</option>
            <option value="quotation">Quotations</option>
            <option value="subscription">Subscriptions</option>
          </select>
        </div>
      </div>

      {/* APPROVALS TABLE */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">No submissions found</p>
            <p className="text-xs text-muted-foreground">
              {statusFilter === "pending" ? "Great job! All team submissions have been reviewed." : "No records match the current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Document / Type</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Client / Entity</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRequests.map((req) => {
                  const isPending = req.status === "pending"
                  const isApproved = req.status === "approved"
                  const isRejected = req.status === "rejected"

                  return (
                    <tr key={req.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Document info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-surface-hover border border-border shrink-0">
                            {getTypeIcon(req.type)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{req.documentNumber}</span>
                              <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                                {req.type}
                              </span>
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                              {req.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Submitter */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <User size={12} className="text-primary" />
                            <span>{req.submittedBy?.name || "Team Member"}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">{req.submittedBy?.email}</p>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-foreground">{req.clientName}</p>
                          {req.branchName && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Building2 size={10} /> {req.branchName}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-foreground">
                        {req.formattedAmount || `₹${(req.amount || 0).toLocaleString("en-IN")}`}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(req.submittedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Check size={11} strokeWidth={3} />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <X size={11} strokeWidth={3} />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectItem(req)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye size={15} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title="Approve this item"
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectItem(req)
                                  setRejectionReason("")
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-rose-600/30"
                                title="Reject this item"
                              >
                                <X size={13} strokeWidth={2.5} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(req)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      <AnimatePresence>
        {inspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    {getTypeIcon(inspectItem.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{inspectItem.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{inspectItem.documentNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Submitter</p>
                    <p className="font-bold text-foreground mt-0.5">{inspectItem.submittedBy?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{inspectItem.submittedBy?.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Client / Target</p>
                    <p className="font-bold text-foreground mt-0.5">{inspectItem.clientName}</p>
                    <p className="text-[11px] text-muted-foreground">{inspectItem.clientEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Monetary Value</p>
                    <p className="font-black text-foreground text-sm mt-0.5">{inspectItem.formattedAmount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Approval Status</p>
                    <p className="font-black mt-0.5 uppercase tracking-wider text-[11px] text-amber-500">
                      {inspectItem.status}
                    </p>
                  </div>
                </div>

                {inspectItem.rejectionReason && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <XCircle size={14} /> Rejection Note:
                    </p>
                    <p className="text-[11px] mt-1">{inspectItem.rejectionReason}</p>
                  </div>
                )}

                {inspectItem.dataSnapshot && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground text-xs">Payload Snapshot Breakdown</p>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border max-h-48 overflow-y-auto font-mono text-[11px] text-muted-foreground">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(inspectItem.dataSnapshot, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setInspectItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover text-foreground cursor-pointer"
                >
                  Close
                </button>
                {inspectItem.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = inspectItem
                      setInspectItem(null)
                      handleApprove(item)
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Check size={14} /> Approve Now
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {rejectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">Reject Submission</h3>
                  <p className="text-xs text-muted-foreground">{rejectItem.documentNumber} ({rejectItem.title})</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide feedback for <strong>{rejectItem.submittedBy.name}</strong> explaining why this {rejectItem.type} cannot be approved.
              </p>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Rejection Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incorrect tax rate applied, or client details need verification..."
                  className="w-full p-3 text-xs rounded-xl bg-surface-hover border border-border text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <X size={14} /> Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
