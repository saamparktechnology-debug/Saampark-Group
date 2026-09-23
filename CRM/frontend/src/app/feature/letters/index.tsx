"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mail, Plus, Search, Trash2, Eye, Printer, Users, Building2, 
  Calendar, CheckCircle, Clock, FileText, AlertTriangle, Sparkles, Filter 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { getLetters, deleteLetter } from "./services/letterService"
import { LetterRecord, LetterType } from "./types"
import { LetterComposerModal } from "./components/LetterComposerModal"
import { LetterViewModal } from "./components/LetterViewModal"

export default function LettersMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const roleLower = (user?.role || "").toLowerCase().trim()
  const isSuperAdmin = roleLower.includes("super")
  const isAdmin = isSuperAdmin || roleLower.includes("admin")
  const canAddLetter = isAdmin || canPerformAction(user, "HR", "add")
  const canDeleteLetter = isAdmin || canPerformAction(user, "HR", "delete")

  const [letters, setLetters] = React.useState<LetterRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [isLoading, setIsLoading] = React.useState(true)

  // Modals
  const [isComposerOpen, setIsComposerOpen] = React.useState(false)
  const [viewingLetter, setViewingLetter] = React.useState<LetterRecord | null>(null)
  const [deletingLetter, setDeletingLetter] = React.useState<LetterRecord | null>(null)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getLetters(activeCompanyId || "all")
      setLetters(data)
    } catch (err) {
      console.warn("Failed to load letters:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeCompanyId])

  React.useEffect(() => {
    loadData()
    window.addEventListener("saampark_letter_created", loadData)
    window.addEventListener("saampark_data_synced", loadData)
    return () => {
      window.removeEventListener("saampark_letter_created", loadData)
      window.removeEventListener("saampark_data_synced", loadData)
    }
  }, [loadData])

  const handleDelete = async () => {
    if (!deletingLetter) return
    try {
      await deleteLetter(deletingLetter.id, activeCompanyId || "all")
      setDeletingLetter(null)
      loadData()
    } catch (err) {
      console.error("Failed to delete letter:", err)
      alert("Failed to delete letter.")
    }
  }

  const filteredLetters = letters.filter(l => {
    if (typeFilter !== "all" && l.templateType !== typeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const match = (l.title || "").toLowerCase().includes(q) ||
        (l.referenceNumber || "").toLowerCase().includes(q) ||
        (l.subject || "").toLowerCase().includes(q) ||
        l.recipients.some(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })

  // Metrics
  const totalSent = letters.length
  const totalOffers = letters.filter(l => l.templateType === "offer_letter").length
  const totalClosure = letters.filter(l => l.templateType === "office_close").length
  const totalReach = letters.reduce((sum, l) => sum + (l.recipients?.length || 0), 0)

  const getTypeBadge = (type: LetterType) => {
    switch (type) {
      case "offer_letter":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Offer Letter</span>
      case "office_close":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Office Close Notice</span>
      case "appointment":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Appointment</span>
      case "experience":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Experience Letter</span>
      case "warning":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Warning Notice</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">Announcement</span>
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Mail size={18} />
            </div>
            <span>Letters & Official Notices Hub</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Issue, circulate, print, and track official offer letters, holiday/office close notices, experience certificates, and corporate circulars.
          </p>
        </div>

        {canAddLetter && (
          <button
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>Compose New Letter</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Total Letters Issued</div>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{totalSent}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Dispatched letters in record</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Offer Letters</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{totalOffers}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Candidates offered</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Closure & Holiday Notices</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{totalClosure}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Office circulars sent</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Total Recipients Reached</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{totalReach}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Team & client impressions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search letters by title, ref, recipient..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Letter Types</option>
            <option value="offer_letter">Offer Letters</option>
            <option value="office_close">Office Close Notices</option>
            <option value="appointment">Appointment Letters</option>
            <option value="experience">Experience Letters</option>
            <option value="warning">Warning Notices</option>
            <option value="announcement">Announcements</option>
            <option value="custom">Custom Letters</option>
          </select>
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 text-xs">Loading letters...</div>
        ) : filteredLetters.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto text-xl">
              ✉️
            </div>
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">No letters found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Click "Compose New Letter" to issue an offer letter, office closure notice, or company circular to your team and clients.
            </p>
            {canAddLetter && (
              <button
                onClick={() => setIsComposerOpen(true)}
                className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Compose First Letter
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Letter Title & Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Date Issued</th>
                <th className="py-3 px-4">Issued By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {filteredLetters.map(letter => {
                const recCount = letter.recipients?.length || 0
                return (
                  <tr key={letter.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 cursor-pointer" onClick={() => setViewingLetter(letter)}>
                        {letter.title}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                        {letter.referenceNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getTypeBadge(letter.templateType)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {recCount} {recCount === 1 ? "Recipient" : "Recipients"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 max-w-[200px] truncate">
                        {letter.recipients.slice(0, 3).map(r => r.name).join(", ")}
                        {recCount > 3 ? ` + ${recCount - 3} more` : ""}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                      {new Date(letter.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>

                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {letter.createdBy || "Admin"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingLetter(letter)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                          title="View & Print Official Letterhead"
                        >
                          <Printer size={15} />
                        </button>
                        {canDeleteLetter && (
                          <button
                            type="button"
                            onClick={() => setDeletingLetter(letter)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title="Delete Letter"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <LetterComposerModal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Document View & Print Modal */}
      {viewingLetter && (
        <LetterViewModal
          letter={viewingLetter}
          onClose={() => setViewingLetter(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingLetter && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs"
            >
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Delete Letter Record</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Are you sure you want to delete the letter <strong>"{deletingLetter.title}"</strong> (Ref: {deletingLetter.referenceNumber})? This will permanently remove it from the sent letters history.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeletingLetter(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-sm"
                >
                  Delete Letter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
