"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, MoreVertical, Clock, Search, Book, Globe, Lock, 
  Trash2, Eye, Pin, Star, CheckCircle2, X 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"

export type NoteColor = "pink" | "orange" | "blue" | "green" | "yellow" | "purple"
export type NoteVisibility = "public" | "private"

export interface NoteItem {
  id: string
  title: string
  content: string
  category: string
  color: NoteColor
  visibility: NoteVisibility
  isImportant?: boolean
  createdAt: string
  createdBy: string
  createdRole: string
}

const colorMap: Record<NoteColor, string> = {
  pink: "bg-pink-50/80 border-pink-200/80 hover:shadow-pink-100 dark:bg-pink-950/20 dark:border-pink-900/30",
  orange: "bg-amber-50/80 border-amber-200/80 hover:shadow-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30",
  blue: "bg-blue-50/80 border-blue-200/80 hover:shadow-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30",
  green: "bg-emerald-50/80 border-emerald-200/80 hover:shadow-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30",
  yellow: "bg-yellow-50/80 border-yellow-200/80 hover:shadow-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900/30",
  purple: "bg-purple-50/80 border-purple-200/80 hover:shadow-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30",
}

export default function NotesMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddNote = canPerformAction(user, "Notes", "add")
  const canEditNote = canPerformAction(user, "Notes", "edit")
  const canDeleteNote = canPerformAction(user, "Notes", "delete")

  const [notes, setNotes] = React.useState<NoteItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "public" | "private" | "important">("all")
  const [selectedNote, setSelectedNote] = React.useState<NoteItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Form State
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [category, setCategory] = React.useState("General Announcement")
  const [color, setColor] = React.useState<NoteColor>("blue")
  const [visibility, setVisibility] = React.useState<NoteVisibility>("public")
  const [isImportant, setIsImportant] = React.useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadNotes = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<NoteItem[]>("notes", [])
    setNotes(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [])

  React.useEffect(() => {
    loadNotes()
    const interval = setInterval(loadNotes, 4000)
    return () => clearInterval(interval)
  }, [loadNotes])

  // Filter notes: Public notes are shown to EVERYONE (Clients, Teams, Admins). Private notes only to creator/admin.
  const userEmailNorm = (user?.email || "").toLowerCase().trim()
  const userNameNorm = (user?.name || "").toLowerCase().trim()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const accessibleNotes = React.useMemo(() => {
    return notes.filter((n) => {
      if (n.visibility === "public") return true
      if (isAdmin) return true
      const cBy = (n.createdBy || "").toLowerCase().trim()
      return cBy === userEmailNorm || cBy === userNameNorm
    })
  }, [notes, isAdmin, userEmailNorm, userNameNorm])

  const filteredNotes = React.useMemo(() => {
    return accessibleNotes.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false
      if (selectedFilter === "public") return n.visibility === "public"
      if (selectedFilter === "private") return n.visibility === "private"
      if (selectedFilter === "important") return n.isImportant
      return true
    })
  }, [accessibleNotes, searchQuery, selectedFilter])

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert("Please fill in note title and content.")
      return
    }

    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title,
      content,
      category,
      color,
      visibility,
      isImportant,
      createdAt: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      createdBy: user?.name || user?.email || "Admin",
      createdRole: user?.role || "Admin",
    }

    const updated = [newNote, ...notes]
    setNotes(updated)
    await saveModuleDataToDB("notes", updated)
    showToast(`✅ Note created as ${visibility.toUpperCase()}!`)
    setIsAddModalOpen(false)
    setTitle("")
    setContent("")
  }

  const handleDeleteNote = async (id: string) => {
    if (confirm("Delete this note?")) {
      await markGlobalItemDeleted(id, "notes")
      const updated = notes.filter((n) => n.id !== id)
      setNotes(updated)
      await saveModuleDataToDB("notes", updated)
      showToast("Note removed.")
      if (selectedNote?.id === id) setSelectedNote(null)
    }
  }

  const handleToggleImportant = async (note: NoteItem) => {
    const updated = notes.map((n) => n.id === note.id ? { ...n, isImportant: !n.isImportant } : n)
    setNotes(updated)
    await saveModuleDataToDB("notes", updated)
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
            <Book className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Company Notes & Broadcasts</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Global notices visible to all teams & clients, plus personal private workspace scratchpads
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAddNote && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Note</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- SEARCH & FILTER TABS ---------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search notes, announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All Notes" },
            { id: "public", label: "Public Broadcasts (All Users)" },
            { id: "private", label: "Private (Only Me)" },
            { id: "important", label: "Important Pin" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- NOTES GRID ---------------- */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-400 text-xs">
          No notes match your criteria. Click "+ Add Note" to create an announcement or personal note.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-2xl border transition-all duration-200 shadow-2xs flex flex-col min-h-[220px] relative ${colorMap[note.color] || colorMap.blue}`}
            >
              {/* Note Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2 leading-snug">
                  {note.title}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleImportant(note)}
                    className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                      note.isImportant ? "text-amber-500" : "text-zinc-400"
                    }`}
                    title={note.isImportant ? "Unpin note" : "Pin as Important"}
                  >
                    <Star size={14} fill={note.isImportant ? "currentColor" : "none"} />
                  </button>

                  {canDeleteNote && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Note Date & Author */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>{note.createdAt}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  {note.visibility === "public" ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                      <Globe size={11} />
                      <span>All Users</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-500 font-semibold">
                      <Lock size={11} />
                      <span>Private</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Note Content Excerpt */}
              <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-5 flex-1 mb-4 leading-relaxed whitespace-pre-line">
                {note.content}
              </p>

              {/* Note Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 mt-auto text-[11px]">
                <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300">
                  {note.category}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedNote(note)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Eye size={12} />
                  <span>Read full</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ---------------- READ NOTE MODAL ---------------- */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedNote.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                    <span>{selectedNote.createdAt}</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-600">{selectedNote.category}</span>
                    <span>•</span>
                    <span>By: {selectedNote.createdBy}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
                {selectedNote.content}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- CREATE NOTE MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Book size={18} className="text-blue-600" />
                  <span>Create Note / Broadcast</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateNote} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Note Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Deliverables Timeline or System Maintenance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                    >
                      <option value="General Announcement">General Announcement</option>
                      <option value="Project Deliverable">Project Deliverable</option>
                      <option value="Client Notice">Client Notice</option>
                      <option value="Internal Protocol">Internal Protocol</option>
                      <option value="Personal Scratchpad">Personal Scratchpad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Visibility *</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-bold"
                    >
                      <option value="public">🌐 All Users (Clients, Teams, Admins)</option>
                      <option value="private">🔒 Private (Only Me)</option>
                    </select>
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1.5">Card Color Accent</label>
                  <div className="flex items-center gap-2">
                    {(["blue", "green", "yellow", "pink", "orange", "purple"] as NoteColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === c ? "scale-125 border-zinc-900 dark:border-white ring-2 ring-blue-400" : "border-transparent"
                        } ${c === "blue" ? "bg-blue-400" : c === "green" ? "bg-emerald-400" : c === "yellow" ? "bg-yellow-400" : c === "pink" ? "bg-pink-400" : c === "orange" ? "bg-orange-400" : "bg-purple-400"}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Note Content *</label>
                  <textarea
                    rows={5}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note, notice, or guidelines here..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="impCheck"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="impCheck" className="text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer">
                    Pin as Important Note ⭐
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    Publish Note
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
