"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LifeBuoy, Search, BookOpen, ChevronRight, ChevronDown, 
  ThumbsUp, ThumbsDown, Plus, Sparkles, CheckCircle2, HelpCircle, X, ExternalLink
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  tags: string[]
  helpfulCount: number
  readTime: string
  createdAt: string
}

const DEFAULT_ARTICLES: KnowledgeArticle[] = [
  {
    id: "kb_1",
    title: "How to Generate GST Tax Invoices & Settle Payments Online",
    category: "Billing & Sales",
    excerpt: "Step-by-step guide on creating itemized 18% GST invoices and making online settlements via UPI or Net Banking.",
    content: `### 1. Generating Invoices\nAdmins can generate official tax invoices from the Client Section or under Sales -> Invoices.\n- Ensure base amount and GST are calculated.\n- Designate billing admin and due dates.\n\n### 2. Client Online Settlement\nClients can navigate to their 'My Invoices' tab and click **Pay Now** to settle their dues instantly.\nPayment confirmations are automatically generated in the Payments ledger with a transaction receipt ID.`,
    tags: ["Invoices", "GST", "Payments", "Billing"],
    helpfulCount: 42,
    readTime: "3 min",
    createdAt: "15 Aug 2026",
  },
  {
    id: "kb_2",
    title: "Client Project Deliverables, Orders & Milestones Overview",
    category: "Project Management",
    excerpt: "Learn how active projects automatically sync deliverables to the team tasks section and order list.",
    content: `### Deliverable Lifecycle\nWhen a project is created for a client:\n1. It generates a registered **Order Item** under Sales -> Order List.\n2. Work packages are assigned to team members under **Tasks**.\n3. Team member workload automatically transitions from **Free** to **Assigned**.\n4. Deliverable milestones can be tracked until final acceptance.`,
    tags: ["Projects", "Tasks", "Milestones"],
    helpfulCount: 38,
    readTime: "4 min",
    createdAt: "18 Aug 2026",
  },
  {
    id: "kb_3",
    title: "Raising Support Dispute Tickets & Resolution Confirmation",
    category: "Support & Disputes",
    excerpt: "Understanding the dispute escalation procedure, priority levels, and administrative confirmation timeline.",
    content: `### How to Dispute a Deliverable\n1. Go to **Tickets** in the sidebar.\n2. Click **Raise Dispute / Ticket**.\n3. Choose Category (e.g. Milestone Deliverable Discrepancy or Billing Issue) and select Priority.\n4. Admin management investigates the issue, updates status to **Under Review**, and posts an official confirmation with action taken.`,
    tags: ["Tickets", "Support", "Disputes"],
    helpfulCount: 29,
    readTime: "2 min",
    createdAt: "20 Aug 2026",
  },
  {
    id: "kb_4",
    title: "Direct 1-on-1 Real-Time Chat & Document Sharing",
    category: "Communication",
    excerpt: "How to use the internal messenger to contact clients, assigned developers, or management.",
    content: `### Real-Time Messenger\nNavigate to **Messages** to view all registered users, clients, and technical leads.\n- Messages are stored directly in the database for persistence.\n- Live speech bubbles indicate outgoing vs incoming messages with timestamps.\n- File attachments and Google Drive links can be shared directly in chat.`,
    tags: ["Chat", "Messages", "Collaboration"],
    helpfulCount: 31,
    readTime: "3 min",
    createdAt: "21 Aug 2026",
  },
]

export default function KnowledgeBasePage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin"

  const [articles, setArticles] = React.useState<KnowledgeArticle[]>(DEFAULT_ARTICLES)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [selectedArticle, setSelectedArticle] = React.useState<KnowledgeArticle | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Add Article Form
  const [title, setTitle] = React.useState("")
  const [category, setCategory] = React.useState("Billing & Sales")
  const [excerpt, setExcerpt] = React.useState("")
  const [content, setContent] = React.useState("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  React.useEffect(() => {
    fetchModuleDataFromDB<KnowledgeArticle[]>("kb_articles", DEFAULT_ARTICLES).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setArticles(filterGlobalDeletedItems(data))
      }
    })
  }, [])

  const filteredArticles = React.useMemo(() => {
    return articles.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchSearch) return false
      if (selectedCategory === "all") return true
      return a.category === selectedCategory
    })
  }, [articles, searchQuery, selectedCategory])

  const handleHelpful = async (art: KnowledgeArticle) => {
    const updated = articles.map(a => a.id === art.id ? { ...a, helpfulCount: a.helpfulCount + 1 } : a)
    setArticles(updated)
    await saveModuleDataToDB("kb_articles", updated)
    showToast("🎉 Thank you for your feedback!")
    if (selectedArticle?.id === art.id) {
      setSelectedArticle({ ...art, helpfulCount: art.helpfulCount + 1 })
    }
  }

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert("Please fill in article title and content.")
      return
    }

    const newArt: KnowledgeArticle = {
      id: `kb_${Date.now()}`,
      title,
      category,
      excerpt: excerpt || title,
      content,
      tags: [category, "Guide"],
      helpfulCount: 1,
      readTime: "3 min",
      createdAt: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
    }

    const updated = [newArt, ...articles]
    setArticles(updated)
    await saveModuleDataToDB("kb_articles", updated)
    showToast(`✅ Knowledge Article published!`)
    setIsAddModalOpen(false)
    setTitle("")
    setExcerpt("")
    setContent("")
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

      {/* ---------------- TOP HERO BANNER ---------------- */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <LifeBuoy size={14} />
            <span>Help & Knowledge Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm">
            Explore guides, billing tutorials, deliverable procedures, and technical documentation.
          </p>

          <div className="relative pt-2">
            <Search size={16} className="absolute left-4 top-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search guides, GST invoices, project tasks, tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white text-zinc-900 placeholder-zinc-400 rounded-xl text-xs font-medium shadow-md focus:outline-hidden focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* ---------------- CATEGORY TABS & ADMIN ACTIONS ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Articles" },
            { id: "Billing & Sales", label: "Billing & Invoices" },
            { id: "Project Management", label: "Projects & Tasks" },
            { id: "Support & Disputes", label: "Dispute Tickets" },
            { id: "Communication", label: "Messenger & Chat" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Publish Article</span>
          </button>
        )}
      </div>

      {/* ---------------- ARTICLES GRID ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((art) => (
          <motion.div
            key={art.id}
            whileHover={{ y: -3 }}
            onClick={() => setSelectedArticle(art)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                  {art.category}
                </span>
                <span className="text-[11px] text-zinc-400">{art.readTime} read</span>
              </div>

              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2 leading-snug">
                {art.title}
              </h3>

              <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                {art.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1">
                <ThumbsUp size={12} className="text-emerald-500" />
                <span>{art.helpfulCount} people found helpful</span>
              </div>
              <span className="font-bold text-blue-600 flex items-center gap-0.5">
                <span>Read</span>
                <ChevronRight size={14} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ---------------- READ ARTICLE MODAL ---------------- */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={20} />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">{selectedArticle.category}</span>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedArticle.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 border-l-4 border-blue-500">
                  {selectedArticle.excerpt}
                </div>

                <div className="space-y-3 whitespace-pre-line">
                  {selectedArticle.content}
                </div>

                {/* Helpful Rating */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between mt-6">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Was this article helpful to you?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleHelpful(selectedArticle)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ThumbsUp size={13} />
                      <span>Yes ({selectedArticle.helpfulCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast("Thanks for the feedback! We'll improve this guide.")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ThumbsDown size={13} />
                      <span>No</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg"
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- PUBLISH ARTICLE MODAL ---------------- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <LifeBuoy size={18} className="text-blue-600" />
                  <span>Publish Knowledge Base Guide</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddArticle} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Guide Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How to Approve Estimate Quotes & Initiate Project Setup"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Billing & Sales">Billing & Sales</option>
                    <option value="Project Management">Project Management</option>
                    <option value="Support & Disputes">Support & Disputes</option>
                    <option value="Communication">Communication</option>
                    <option value="Getting Started">Getting Started</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Short Excerpt</label>
                  <input
                    type="text"
                    placeholder="Brief 1-line summary..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Full Article Guide & Instructions *</label>
                  <textarea
                    rows={6}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write detailed instructions, step 1, step 2..."
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
                    Publish to Knowledge Base
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
