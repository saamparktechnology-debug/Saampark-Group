"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Folder, Plus, Search, ExternalLink, Download, Copy, 
  Trash2, FileText, Globe, Cloud, HardDrive, Filter, X, Check, Eye 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { isRecordAssignedToClient } from "@/lib/clientScopeUtils"

export interface CloudFileItem {
  id: string
  name: string
  category: string
  linkType: "Google Drive" | "Dropbox" | "OneDrive" | "Cloud Link" | "Direct Upload"
  url: string
  fileSize?: string
  fileExtension?: string
  uploadedBy: string
  uploadedRole: string
  createdAt: string
  notes?: string
}

export default function FilesPage() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddFile = canPerformAction(user, "Files", "add")
  const canDeleteFile = canPerformAction(user, "Files", "delete")

  const targetComp = activeCompanyId || user?.companyId || "tech"
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [files, setFiles] = React.useState<CloudFileItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Add File Form State
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState("Project Deliverables")
  const [linkType, setLinkType] = React.useState<CloudFileItem["linkType"]>("Google Drive")
  const [url, setUrl] = React.useState("")
  const [fileSize, setFileSize] = React.useState("12.4 MB")
  const [fileExtension, setFileExtension] = React.useState("G-Drive / Folder")
  const [notes, setNotes] = React.useState("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadFiles = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<CloudFileItem[]>("cloud_files", [], targetComp)
    setFiles(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [targetComp])

  React.useEffect(() => {
    loadFiles()
    window.addEventListener("storage", loadFiles)
    window.addEventListener("saampark_data_synced", loadFiles)
    window.addEventListener("saampark_company_switched", loadFiles)
    return () => {
      window.removeEventListener("storage", loadFiles)
      window.removeEventListener("saampark_data_synced", loadFiles)
      window.removeEventListener("saampark_company_switched", loadFiles)
    }
  }, [loadFiles])

  const filteredFiles = React.useMemo(() => {
    let list = files
    if (user?.role === "Clients" || (user?.role as string) === "Client") {
      list = list.filter(f => isRecordAssignedToClient(f, user) || (f.uploadedBy && f.uploadedBy.toLowerCase() === (user?.name || "").toLowerCase()))
    }
    return list.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchSearch) return false
      if (selectedCategory === "all") return true
      return f.category === selectedCategory
    })
  }, [files, searchQuery, selectedCategory, user])

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      alert("Please provide File Name and Google Drive / Cloud URL link.")
      return
    }

    const newFile: CloudFileItem = {
      id: `file_${Date.now()}`,
      name,
      category,
      linkType,
      url,
      fileSize: fileSize || "Drive Link",
      fileExtension: fileExtension || "Link",
      uploadedBy: user?.name || "Admin",
      uploadedRole: user?.role || "Admin",
      createdAt: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      notes,
    }

    const updated = [newFile, ...files]
    setFiles(updated)
    await saveModuleDataToDB("cloud_files", updated, targetComp)
    showToast(`✅ File "${name}" registered with ${linkType} link!`)
    setIsAddModalOpen(false)
    setName("")
    setUrl("")
    setNotes("")
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this file link?")) {
      await markGlobalItemDeleted(id, "cloud_files")
      const updated = files.filter(f => f.id !== id)
      setFiles(updated)
      await saveModuleDataToDB("cloud_files", updated, targetComp)
      showToast("File link removed.")
    }
  }

  const handleCopyLink = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl)
    showToast("📋 Link copied to clipboard!")
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
            <Folder className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Files & Cloud Drive Links</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Centralized document hub: attach Google Drive folders, contracts, Figma design assets, and client deliverables
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAddFile && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add File / Drive Link</span>
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
            placeholder="Search file name, category, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "All Files" },
            { id: "Contracts & Legal", label: "Contracts" },
            { id: "Designs & Assets", label: "Designs / Figma" },
            { id: "Project Deliverables", label: "Deliverables" },
            { id: "Technical Specs", label: "Tech Specs" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- FILES GRID ---------------- */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-400 text-xs">
          No files or cloud links added yet. Click "+ Add File / Drive Link" to upload a document link.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <motion.div
              key={file.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
                    <Cloud size={20} />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {file.linkType}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2 leading-snug">
                    {file.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{file.category}</p>
                </div>

                {file.notes && (
                  <p className="text-xs text-zinc-500 line-clamp-2 bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg">
                    {file.notes}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>By: {file.uploadedBy}</span>
                  <span>{file.createdAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Open Link</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(file.url)}
                    className="p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Copy Link"
                  >
                    <Copy size={13} />
                  </button>

                  {canDeleteFile && (
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id)}
                      className="p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ---------------- ADD FILE MODAL ---------------- */}
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
                  <Cloud size={18} className="text-blue-600" />
                  <span>Attach Cloud File or Google Drive Link</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddFile} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">File Name / Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Service Agreement & Scope Matrix"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Storage Provider</label>
                    <select
                      value={linkType}
                      onChange={(e) => setLinkType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden font-semibold"
                    >
                      <option value="Google Drive">Google Drive Link</option>
                      <option value="Dropbox">Dropbox Folder</option>
                      <option value="OneDrive">OneDrive Document</option>
                      <option value="Cloud Link">Figma / External Cloud URL</option>
                      <option value="Direct Upload">Direct File Upload</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                    >
                      <option value="Project Deliverables">Project Deliverables</option>
                      <option value="Contracts & Legal">Contracts & Legal</option>
                      <option value="Designs & Assets">Designs & Assets</option>
                      <option value="Technical Specs">Technical Specs</option>
                      <option value="Invoices & Finance">Invoices & Finance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Google Drive / Cloud Shareable URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Notes / Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Permissions note, folder structure overview..."
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
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
                    Save File Link
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
