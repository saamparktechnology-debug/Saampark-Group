"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  HeadphonesIcon, Plus, Search, CheckCircle2, AlertCircle, 
  Clock, ShieldAlert, Check, X, ArrowRight, Eye, Trash2,
  FileText, MessageSquare, Send, User, ExternalLink, Paperclip,
  Image as ImageIcon, Loader2, Download
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { uploadToImgBB } from "@/lib/imgbbUpload"

export type TicketPriority = "Low" | "Normal" | "High" | "Critical"
export type TicketStatus = "New" | "Open" | "In Progress" | "Under Review" | "Resolved" | "Closed"

export interface TicketAttachment {
  name: string
  url: string
  size?: string
}

export interface DisputeTicket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  description: string
  attachments?: TicketAttachment[]
  createdBy: string
  creatorEmail: string
  creatorRole: string
  companyId?: string
  branchId?: string
  createdAt: string
  assignedTo?: string
  raisedTo?: string
  resolutionNote?: string
  resolutionAttachments?: TicketAttachment[]
  resolvedAt?: string
  resolvedBy?: string
}

export default function TicketsMain() {
  const { user, activeCompanyId, activeBranchId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddTicket = canPerformAction(user, "Tickets", "add")
  const canEditTicket = canPerformAction(user, "Tickets", "edit")
  const canDeleteTicket = canPerformAction(user, "Tickets", "delete")

  const isSuperAdmin = user?.role === "Super Admin"
  const isCompanyAdmin = user?.role === "Admin"
  const isAdmin = isSuperAdmin || isCompanyAdmin
  const currentUserEmail = (user?.email || "").toLowerCase().trim()
  const currentUserName = user?.name || "User"
  const targetComp = activeCompanyId || user?.companyId || "tech"

  const [tickets, setTickets] = React.useState<DisputeTicket[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStatusTab, setSelectedStatusTab] = React.useState<string>("all")
  const [selectedTicket, setSelectedTicket] = React.useState<DisputeTicket | null>(null)
  const [isRaiseModalOpen, setIsRaiseModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Raise Ticket Form
  const [subject, setSubject] = React.useState("")
  const [category, setCategory] = React.useState("Project Deliverable & Scope")
  const [priority, setPriority] = React.useState<TicketPriority>("High")
  const [description, setDescription] = React.useState("")
  const [attachments, setAttachments] = React.useState<TicketAttachment[]>([])
  const [isUploadingFile, setIsUploadingFile] = React.useState(false)
  const ticketFileInputRef = React.useRef<HTMLInputElement>(null)

  // Admin Resolution State
  const [newStatus, setNewStatus] = React.useState<TicketStatus>("In Progress")
  const [resolutionInput, setResolutionInput] = React.useState("")
  const [resolutionAttachments, setResolutionAttachments] = React.useState<TicketAttachment[]>([])
  const [isUploadingResFile, setIsUploadingResFile] = React.useState(false)
  const resFileInputRef = React.useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Handle ImgBB file upload for Ticket Evidence
  const handleUploadTicketFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFile(true)
    try {
      const uploadedList: TicketAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await uploadToImgBB(file, `tkt_doc_${Date.now()}_${file.name}`)
        if (res.url) {
          uploadedList.push({
            name: file.name,
            url: res.url,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          })
        }
      }
      setAttachments((prev) => [...prev, ...uploadedList])
      showToast(`✅ ${uploadedList.length} file(s) uploaded via ImgBB!`)
    } catch (err) {
      alert("Failed to upload file to ImgBB. Please check connection.")
    } finally {
      setIsUploadingFile(false)
      if (ticketFileInputRef.current) ticketFileInputRef.current.value = ""
    }
  }

  // Handle ImgBB file upload for Admin Resolution
  const handleUploadResolutionFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingResFile(true)
    try {
      const uploadedList: TicketAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const res = await uploadToImgBB(file, `res_doc_${Date.now()}_${file.name}`)
        if (res.url) {
          uploadedList.push({
            name: file.name,
            url: res.url,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          })
        }
      }
      setResolutionAttachments((prev) => [...prev, ...uploadedList])
      showToast(`✅ ${uploadedList.length} resolution attachment(s) uploaded!`)
    } catch (err) {
      alert("Failed to upload resolution document to ImgBB.")
    } finally {
      setIsUploadingResFile(false)
      if (resFileInputRef.current) resFileInputRef.current.value = ""
    }
  }

  const loadTickets = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<DisputeTicket[]>("tickets", [], targetComp)
    setTickets(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [targetComp])

  React.useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 4000)
    window.addEventListener("saampark_company_switched", loadTickets)
    window.addEventListener("saampark_branch_switched", loadTickets)
    return () => {
      clearInterval(interval)
      window.removeEventListener("saampark_company_switched", loadTickets)
      window.removeEventListener("saampark_branch_switched", loadTickets)
    }
  }, [loadTickets])

  // Strict Access Control:
  // 1. Super Admin sees all tickets
  // 2. Company Admin sees all tickets belonging to their company
  // 3. Client or Team Member can ONLY see tickets raised by themselves (no other user can see them)
  const accessibleTickets = React.useMemo(() => {
    if (isSuperAdmin) return tickets
    if (isCompanyAdmin) {
      const allowedCompIds = user?.companyIds || (user?.companyId ? [user.companyId] : ["tech"])
      return tickets.filter(t => {
        const tComp = t.companyId || "tech"
        return allowedCompIds.includes(tComp)
      })
    }
    return tickets.filter(t => {
      const cEmail = (t.creatorEmail || "").toLowerCase().trim()
      const cName = (t.createdBy || "").toLowerCase().trim()
      return cEmail === currentUserEmail || (currentUserEmail && cEmail.includes(currentUserEmail)) || cName === currentUserName.toLowerCase().trim()
    })
  }, [tickets, isSuperAdmin, isCompanyAdmin, user, currentUserEmail, currentUserName])

  const filteredTickets = React.useMemo(() => {
    return accessibleTickets.filter(t => {
      const matchSearch =
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.createdBy.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false
      if (selectedStatusTab === "all") return true
      return t.status === selectedStatusTab
    })
  }, [accessibleTickets, searchQuery, selectedStatusTab])

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      alert("Please provide ticket subject and detailed description.")
      return
    }

    const maxNum = tickets.reduce((max, t) => {
      const num = parseInt(String(t.ticketNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 100)

    const newTicket: DisputeTicket = {
      id: `tkt_${Date.now()}`,
      ticketNumber: `TKT #${maxNum + 1}`,
      subject,
      category,
      priority,
      status: "New",
      description,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdBy: currentUserName,
      creatorEmail: currentUserEmail,
      creatorRole: user?.role || "User",
      companyId: targetComp,
      branchId: activeBranchId || user?.branchId || undefined,
      createdAt: new Date().toLocaleDateString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      assignedTo: "Company Admin & Super Admin",
      raisedTo: "Company Admin & Super Admin",
    }

    const updated = [newTicket, ...tickets]
    setTickets(updated)
    await saveModuleDataToDB("tickets", updated, targetComp)
    showToast(`✅ Dispute Ticket ${newTicket.ticketNumber} submitted with ${attachments.length} attachment(s)!`)
    setIsRaiseModalOpen(false)
    setSubject("")
    setDescription("")
    setAttachments([])
  }

  const handleSaveResolution = async () => {
    if (!selectedTicket) return

    const isResolved = newStatus === "Resolved" || newStatus === "Closed"
    const updated = tickets.map(t => {
      if (t.id !== selectedTicket.id) return t
      return {
        ...t,
        status: newStatus,
        resolutionNote: resolutionInput || t.resolutionNote,
        resolutionAttachments: resolutionAttachments.length > 0 ? resolutionAttachments : t.resolutionAttachments,
        resolvedAt: isResolved ? new Date().toLocaleString("en-IN") : t.resolvedAt,
        resolvedBy: isResolved ? currentUserName : t.resolvedBy,
      }
    })

    setTickets(updated)
    await saveModuleDataToDB("tickets", updated, targetComp)
    showToast(`✅ Ticket ${selectedTicket.ticketNumber} updated to ${newStatus}! Confirmation recorded.`)
    setSelectedTicket(null)
    setResolutionInput("")
    setResolutionAttachments([])
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this ticket?")) {
      await markGlobalItemDeleted(id, "tickets")
      const updated = tickets.filter(t => t.id !== id)
      setTickets(updated)
      await saveModuleDataToDB("tickets", updated, targetComp)
      showToast("Ticket deleted.")
      if (selectedTicket?.id === id) setSelectedTicket(null)
    }
  }

  // Summary counts
  const newCount = accessibleTickets.filter(t => t.status === "New").length
  const progressCount = accessibleTickets.filter(t => t.status === "In Progress" || t.status === "Under Review" || t.status === "Open").length
  const resolvedCount = accessibleTickets.filter(t => t.status === "Resolved" || t.status === "Closed").length

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
            <HeadphonesIcon className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Support & Dispute Tickets</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isAdmin 
              ? "Analyze raised disputes, investigate technical & billing inquiries, and dispatch official resolution confirmations"
              : "Raise inquiries or dispute deliverables with dedicated management resolution and status tracking"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAddTicket && (
            <button
              type="button"
              onClick={() => setIsRaiseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Raise Dispute / Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">New Inquiries</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{newCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Under Investigation</p>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{progressCount}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Resolved & Confirmed</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{resolvedCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* ---------------- FILTER & SEARCH BAR ---------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tickets, subject, creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "New", "In Progress", "Under Review", "Resolved", "Closed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatusTab(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedStatusTab === st 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- TICKETS TABLE ---------------- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Ticket ID</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Raised By</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  No tickets found. Click "+ Raise Dispute / Ticket" to report an issue.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                let priorityBadge = "bg-zinc-100 text-zinc-700"
                if (t.priority === "Critical") priorityBadge = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold"
                if (t.priority === "High") priorityBadge = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold"
                if (t.priority === "Normal") priorityBadge = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"

                let statusBadge = "bg-zinc-100 text-zinc-700 border-zinc-200"
                if (t.status === "New") statusBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                if (t.status === "In Progress" || t.status === "Under Review") statusBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                if (t.status === "Resolved" || t.status === "Closed") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"

                return (
                  <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(t)
                          setNewStatus(t.status)
                          setResolutionInput(t.resolutionNote || "")
                        }}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {t.ticketNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[220px] truncate">
                      {t.subject}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                      {t.category}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t.createdBy}</div>
                      <div className="text-[10px] text-zinc-400">{t.creatorRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${priorityBadge}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{t.createdAt}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(t)
                            setNewStatus(t.status)
                            setResolutionInput(t.resolutionNote || "")
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>{isAdmin ? "Analyze & Resolve" : "View Status"}</span>
                        </button>

                        {canDeleteTicket && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="p-1 hover:text-rose-600 text-zinc-400 transition-colors"
                            title="Delete Ticket"
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

      {/* ---------------- DISPUTE ANALYSIS & RESOLUTION MODAL ---------------- */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2">
                  <HeadphonesIcon className="text-blue-600" size={20} />
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedTicket.ticketNumber} — Dispute Dossier</h3>
                    <p className="text-[11px] text-zinc-400">{selectedTicket.subject}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Raised By</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedTicket.createdBy}</span>
                    <span className="text-zinc-400 block text-[10px]">{selectedTicket.creatorRole}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Priority</span>
                    <span className="font-bold text-rose-600 uppercase">{selectedTicket.priority}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Current Status</span>
                    <span className="font-bold text-blue-600 uppercase">{selectedTicket.status}</span>
                  </div>
                </div>

                {/* Dispute description */}
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] mb-1">Dispute Statement / Description</h4>
                  <p className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Evidence Attachments Display */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Paperclip size={13} className="text-blue-600" />
                      <span>Attached Evidence & Files ({selectedTicket.attachments.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedTicket.attachments.map((att, idx) => {
                        const isImage = att.url.match(/\.(jpeg|jpg|gif|png|webp)/i) || att.name.match(/\.(jpeg|jpg|gif|png|webp)/i)
                        return (
                          <div key={idx} className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-3">
                            {isImage ? (
                              <img src={att.url} alt={att.name} className="w-12 h-12 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText size={20} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">{att.name}</p>
                              {att.size && <span className="text-[10px] text-zinc-400">{att.size}</span>}
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                              >
                                View in Full <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Resolution confirmation block */}
                {selectedTicket.resolutionNote && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                      <CheckCircle2 size={14} />
                      <span>Official Resolution & Action Taken Confirmation</span>
                    </div>
                    <p className="text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed">
                      {selectedTicket.resolutionNote}
                    </p>
                    {selectedTicket.resolutionAttachments && selectedTicket.resolutionAttachments.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Resolution Documents:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedTicket.resolutionAttachments.map((rAtt, rIdx) => (
                            <a
                              key={rIdx}
                              href={rAtt.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                            >
                              <Paperclip size={11} /> {rAtt.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 pt-1">
                      Confirmed by: <span className="font-semibold">{selectedTicket.resolvedBy || "Admin"}</span> • {selectedTicket.resolvedAt || "Resolved"}
                    </div>
                  </div>
                )}

                {/* Admin Resolution Input Box */}
                {isAdmin && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-blue-600" />
                      <span>Admin Investigation & Status Resolution</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Update Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                        >
                          <option value="New">New</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Resolved">Resolved (Confirm & Close)</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Official Resolution Confirmation Message</label>
                      <textarea
                        rows={3}
                        value={resolutionInput}
                        onChange={(e) => setResolutionInput(e.target.value)}
                        placeholder="Detail actions taken, bug patches, milestone corrections, or refunds..."
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                      />
                    </div>

                    {/* Admin ImgBB Resolution Attachments */}
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Attach Proof / Receipt Documents (ImgBB)</label>
                      <input
                        type="file"
                        multiple
                        ref={resFileInputRef}
                        onChange={handleUploadResolutionFiles}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => resFileInputRef.current?.click()}
                        disabled={isUploadingResFile}
                        className="px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                      >
                        {isUploadingResFile ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                        <span>{isUploadingResFile ? "Uploading to ImgBB..." : "Attach Resolution Document"}</span>
                      </button>

                      {resolutionAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {resolutionAttachments.map((f, fi) => (
                            <span key={fi} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold flex items-center gap-1.5">
                              <span>📄 {f.name}</span>
                              <button
                                type="button"
                                onClick={() => setResolutionAttachments(resolutionAttachments.filter((_, idx) => idx !== fi))}
                                className="text-zinc-400 hover:text-rose-500"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                >
                  Close
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleSaveResolution}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Confirm & Update Ticket</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- RAISE DISPUTE MODAL (WITH IMGBB ATTACHMENTS) ---------------- */}
      <AnimatePresence>
        {isRaiseModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <HeadphonesIcon size={18} className="text-blue-600" />
                  <span>Raise Support Dispute / Inquiry</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRaiseTicket} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Subject / Issue Summary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scope discrepancy in Milestone 2 or Invoice calculation issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                      <option value="Project Deliverable & Scope">Project Deliverable & Scope</option>
                      <option value="Billing & Invoicing Dispute">Billing & Invoicing Dispute</option>
                      <option value="Technical Issue / Bug">Technical Issue / Bug</option>
                      <option value="Account & Permissions">Account & Permissions</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TicketPriority)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-bold"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical 🔥</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Detailed Description & Evidence *</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full context, affected project/invoice IDs, and expectations..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                {/* ImgBB File & Screenshot Attachment Field */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Attach Screenshots / Documents (ImgBB Cloud)</label>
                  <input
                    type="file"
                    multiple
                    ref={ticketFileInputRef}
                    onChange={handleUploadTicketFiles}
                    className="hidden"
                  />
                  <div
                    onClick={() => ticketFileInputRef.current?.click()}
                    className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {isUploadingFile ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold py-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading files to ImgBB Free Cloud...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold">
                          <Paperclip size={14} className="text-blue-600" />
                          <span>Click to Upload Screenshots / Files</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">Supported: PNG, JPG, WEBP, GIF, PDF</p>
                      </div>
                    )}
                  </div>

                  {/* Attachment Thumbnails & Files List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Attached Files ({attachments.length}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-base">📎</span>
                              <div className="truncate">
                                <p className="font-semibold text-[11px] text-zinc-800 dark:text-zinc-200 truncate">{att.name}</p>
                                {att.size && <p className="text-[9px] text-zinc-400">{att.size}</p>}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              title="Remove file"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confidential Routing Notice */}
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5">
                  <span className="text-sm">🛡️</span>
                  <div className="text-[11px] text-blue-900 dark:text-blue-300 leading-snug">
                    <p className="font-bold">Confidential Direct Routing</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                      This ticket and uploaded evidence will be routed <strong>strictly to the Company Admin and Super Admin only</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsRaiseModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingFile}
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>Submit Dispute Ticket</span>
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
