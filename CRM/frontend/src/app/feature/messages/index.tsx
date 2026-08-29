"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Send, MessageSquare, User, Shield, UserCheck, 
  Briefcase, CheckCheck, Paperclip, Smile, MoreVertical, Trash2, Phone, Video, Lock,
  ChevronLeft, X, ArrowDown
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { getLeads } from "@/app/feature/leads/services/leadService"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"

export interface ChatMessage {
  id: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  text: string
  timestamp: string
  read?: boolean
}

export interface ChatContact {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  status?: "Online" | "Away" | "Offline"
  lastMessage?: string
  lastTime?: string
  unreadCount?: number
  companyName?: string
}

export default function MessagesMain() {
  const { user, activeCompanyId } = useAuthStore()
  const { canPerformAction, isModuleAllowed } = usePermissionStore()

  const currentUserEmail = (user?.email || "").toLowerCase().trim()
  const currentUserName = user?.name || "User"
  const currentUserRole = user?.role || "Teams"

  const canView = isModuleAllowed(user, "Messages")
  const canSend = canPerformAction(user, "Messages", "add")
  const canDelete = canPerformAction(user, "Messages", "delete")

  const [contacts, setContacts] = React.useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = React.useState<ChatContact | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [inputText, setInputText] = React.useState("")
  const [searchContact, setSearchContact] = React.useState("")
  const [mobileView, setMobileView] = React.useState<"contacts" | "chat">("contacts")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchMessageQuery, setSearchMessageQuery] = React.useState("")

  const messagesContainerRef = React.useRef<HTMLDivElement>(null)
  const prevCountRef = React.useRef<number>(0)
  const activeContactRef = React.useRef<string>("")

  // 1. Load users & clients into contacts list with strict company and role scoping
  React.useEffect(() => {
    if (!user) return

    const loadDirectory = async () => {
      try {
        const targetComp = activeCompanyId || user.companyId || "tech"
        const targetNorm = targetComp.toLowerCase().trim()

        const [userList, clientList, leadList, projectList] = await Promise.all([
          getUsers(targetComp).catch(() => []),
          getClients(targetComp).catch(() => []),
          getLeads(targetComp).catch(() => []),
          getProjects(targetComp).catch(() => []),
        ])

        const contactMap = new Map<string, ChatContact>()

        const isSuperAdmin = currentUserRole === "Super Admin"
        const isCompanyAdmin = currentUserRole === "Admin"
        const isTeamMember = currentUserRole === "Teams"
        const isClient = currentUserRole === "Clients"

        // Helper to verify user belongs to the active company workspace
        const userBelongsToCompany = (u: any) => {
          if (!targetComp || targetComp === "all") return true
          if (u.role === "Super Admin") return true
          if (u.companyIds && Array.isArray(u.companyIds) && u.companyIds.length > 0) {
            const normIds = u.companyIds.map((id: any) => String(id).toLowerCase().trim())
            if (normIds.includes(targetNorm)) return true
          }
          const uComp = String(u.companyId || "tech").toLowerCase().trim()
          return uComp === targetNorm || (targetNorm === "tech" && !u.companyId)
        }

        // Helper to verify client belongs to the active company workspace
        const clientBelongsToCompany = (c: any) => {
          if (!targetComp || targetComp === "all") return true
          const cComp = String(c.companyId || (c as any).company || "tech").toLowerCase().trim()
          return cComp === targetNorm || (targetNorm === "tech" && !c.companyId)
        }

        // ── Team Member: Find assigned clients from leads & projects ───────
        const assignedClientEmails = new Set<string>()
        const assignedClientNames = new Set<string>()

        if (isTeamMember) {
          const normName = currentUserName.toLowerCase().trim()
          leadList.forEach((l) => {
            const caller = (l.caller || "").toLowerCase().trim()
            const owner = (l.owner || "").toLowerCase().trim()
            const assigned = (l.assignedTo || "").toLowerCase().trim()
            if (caller === normName || owner === normName || assigned === normName || caller.includes(normName)) {
              if (l.email) assignedClientEmails.add(l.email.toLowerCase().trim())
              if (l.name) assignedClientNames.add(l.name.toLowerCase().trim())
            }
          })
          projectList.forEach((p) => {
            const members = p.members || []
            const isMember = members.some((m) => {
              const mName = (m.name || "").toLowerCase().trim()
              const mEmail = (m.email || "").toLowerCase().trim()
              return mName === normName || mEmail === currentUserEmail || (normName && mName.includes(normName))
            })
            if (isMember && p.client) {
              assignedClientNames.add(p.client.toLowerCase().trim())
            }
          })
        }

        // ── Client: Find assigned team members from leads & projects ───────
        const assignedTeamEmails = new Set<string>()
        const assignedTeamNames = new Set<string>()

        if (isClient) {
          const normClientName = currentUserName.toLowerCase().trim()
          leadList.forEach((l) => {
            const lEmail = (l.email || "").toLowerCase().trim()
            const lName = (l.name || "").toLowerCase().trim()
            if (lEmail === currentUserEmail || lName === normClientName || (normClientName && lName.includes(normClientName))) {
              if (l.caller && l.caller !== "None") assignedTeamNames.add(l.caller.toLowerCase().trim())
              if (l.owner && l.owner !== "None") assignedTeamNames.add(l.owner.toLowerCase().trim())
              if (l.assignedTo && l.assignedTo !== "None") assignedTeamNames.add(l.assignedTo.toLowerCase().trim())
            }
          })
          projectList.forEach((p) => {
            const pClient = (p.client || "").toLowerCase().trim()
            if (pClient === normClientName || (normClientName && pClient.includes(normClientName))) {
              (p.members || []).forEach((m) => {
                if (m.email) assignedTeamEmails.add(m.email.toLowerCase().trim())
                if (m.name) assignedTeamNames.add(m.name.toLowerCase().trim())
              })
            }
          })
        }

        // ── Process System Users Filtered by Active Company ───────────────
        userList.filter(userBelongsToCompany).forEach((u: any) => {
          const uEmail = (u.email || "").toLowerCase().trim()
          const uName = (u.name || "").toLowerCase().trim()
          if (!uEmail || uEmail === currentUserEmail) return

          const uRole = u.role || "Teams"

          // Super Admin can message everyone in the active company
          if (isSuperAdmin) {
            contactMap.set(uEmail, {
              id: String(u.id || uEmail),
              name: u.name || "User",
              email: uEmail,
              role: uRole,
              companyName: u.companyName || "SAAMPARK Group",
              avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "user"}`,
              status: "Online",
            })
            return
          }

          // Company Admin can message Super Admin, fellow Admins, and their company Team/Client members
          if (isCompanyAdmin) {
            contactMap.set(uEmail, {
              id: String(u.id || uEmail),
              name: u.name || "User",
              email: uEmail,
              role: uRole,
              companyName: u.companyName || "SAAMPARK Group",
              avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "user"}`,
              status: "Online",
            })
            return
          }

          // Team Member can message: Super Admin, Company Admin, peer Team members, and assigned clients
          if (isTeamMember) {
            if (uRole === "Super Admin" || uRole === "Admin" || uRole === "Teams") {
              contactMap.set(uEmail, {
                id: String(u.id || uEmail),
                name: u.name || "Colleague",
                email: uEmail,
                role: uRole,
                companyName: u.companyName || "SAAMPARK",
                avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "user"}`,
                status: "Online",
              })
            } else if (uRole === "Clients") {
              // Only message if client is assigned to this team member's leads or projects
              if (assignedClientEmails.has(uEmail) || assignedClientNames.has(uName)) {
                contactMap.set(uEmail, {
                  id: String(u.id || uEmail),
                  name: u.name || "Client",
                  email: uEmail,
                  role: "Clients",
                  companyName: u.companyName || "Client Account",
                  avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || "client"}`,
                  status: "Online",
                })
              }
            }
            return
          }

          // Client can message: Super Admin, Company Admin, and team members assigned to their projects/leads
          if (isClient) {
            if (uRole === "Super Admin" || uRole === "Admin") {
              contactMap.set(uEmail, {
                id: String(u.id || uEmail),
                name: u.name || "Support Administrator",
                email: uEmail,
                role: uRole,
                companyName: u.companyName || "Management",
                avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "admin"}`,
                status: "Online",
              })
            } else if (uRole === "Teams") {
              if (assignedTeamEmails.has(uEmail) || assignedTeamNames.has(uName) || assignedTeamNames.size === 0) {
                contactMap.set(uEmail, {
                  id: String(u.id || uEmail),
                  name: u.name || "Project Specialist",
                  email: uEmail,
                  role: "Teams",
                  companyName: u.companyName || "SAAMPARK Team",
                  avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "team"}`,
                  status: "Online",
                })
              }
            }
          }
        })

        // ── Process External Clients Filtered by Active Company ───────────
        clientList.filter(clientBelongsToCompany).forEach((c: any) => {
          const cEmail = (c.email || "").toLowerCase().trim()
          const cName = (c.name || "").toLowerCase().trim()
          if (!cEmail || cEmail === currentUserEmail) return

          // Super Admin and Company Admin can message all clients of this company
          if (isSuperAdmin || isCompanyAdmin) {
            if (!contactMap.has(cEmail)) {
              contactMap.set(cEmail, {
                id: String(c.id || cEmail),
                name: c.name || "Client",
                email: cEmail,
                role: "Clients",
                companyName: c.name || "Client Account",
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.name || "client"}`,
                status: "Online",
              })
            }
          } else if (isTeamMember) {
            // Team member can ONLY message clients assigned to their leads or projects
            if (assignedClientEmails.has(cEmail) || assignedClientNames.has(cName)) {
              if (!contactMap.has(cEmail)) {
                contactMap.set(cEmail, {
                  id: String(c.id || cEmail),
                  name: c.name || "Assigned Client",
                  email: cEmail,
                  role: "Clients",
                  companyName: c.name || "Client Account",
                  avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.name || "client"}`,
                  status: "Online",
                })
              }
            }
          }
        })

        const arr = Array.from(contactMap.values())
        setContacts(arr)
        if (arr.length > 0) {
          setSelectedContact((prev) => {
            if (!prev) return arr[0]
            const stillExists = arr.find((c) => c.email.toLowerCase() === prev.email.toLowerCase())
            return stillExists || arr[0]
          })
        } else {
          setSelectedContact(null)
        }
      } catch (err) {
        console.warn("Messages directory load error:", err)
      }
    }

    loadDirectory()
    window.addEventListener("storage", loadDirectory)
    window.addEventListener("saampark_data_synced", loadDirectory)
    window.addEventListener("saampark_company_switched", loadDirectory)
    return () => {
      window.removeEventListener("storage", loadDirectory)
      window.removeEventListener("saampark_data_synced", loadDirectory)
      window.removeEventListener("saampark_company_switched", loadDirectory)
    }
  }, [currentUserEmail, currentUserRole, currentUserName, activeCompanyId, user])

  // 2. Load and poll chat messages scoped by active company
  const targetComp = activeCompanyId || user?.companyId || "tech"

  const loadChat = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<ChatMessage[]>("chat_messages", [], targetComp)
    setMessages(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [targetComp])

  React.useEffect(() => {
    loadChat()
    window.addEventListener("storage", loadChat)
    window.addEventListener("saampark_data_synced", loadChat)
    window.addEventListener("saampark_company_switched", loadChat)
    return () => {
      window.removeEventListener("storage", loadChat)
      window.removeEventListener("saampark_data_synced", loadChat)
      window.removeEventListener("saampark_company_switched", loadChat)
    }
  }, [loadChat])

  // Safe, isolated auto scroll for messages container (does NOT scroll outer window on mobile)
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (!messagesContainerRef.current) return
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    })
  }, [])

  // Filter messages between current user and selected contact
  const currentThread = React.useMemo(() => {
    if (!selectedContact) return []
    const contactEmailNorm = selectedContact.email.toLowerCase().trim()

    return messages.filter((m) => {
      const s = (m.senderEmail || "").toLowerCase().trim()
      const r = (m.recipientEmail || "").toLowerCase().trim()
      return (
        (s === currentUserEmail && r === contactEmailNorm) ||
        (s === contactEmailNorm && r === currentUserEmail)
      )
    })
  }, [messages, selectedContact, currentUserEmail])

  // Filtered by in-chat search query if user is searching
  const displayedThread = React.useMemo(() => {
    if (!searchMessageQuery.trim()) return currentThread
    const q = searchMessageQuery.toLowerCase().trim()
    return currentThread.filter((m) => m.text.toLowerCase().includes(q))
  }, [currentThread, searchMessageQuery])

  // Auto scroll only when switching contact or sending new message
  React.useEffect(() => {
    if (!messagesContainerRef.current) return
    const isContactSwitched = activeContactRef.current !== selectedContact?.email
    const isNewMessageAdded = currentThread.length > prevCountRef.current

    if (isContactSwitched) {
      // Instant jump to bottom for new contact
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    } else if (isNewMessageAdded) {
      // Smooth scroll to bottom on new message
      scrollToBottom(true)
    }

    activeContactRef.current = selectedContact?.email || ""
    prevCountRef.current = currentThread.length
  }, [currentThread.length, selectedContact?.email, scrollToBottom])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedContact || !canSend) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      recipientEmail: selectedContact.email,
      recipientName: selectedContact.name,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    }

    const updated = [...messages, newMsg]
    setMessages(updated)
    setInputText("")
    await saveModuleDataToDB("chat_messages", updated, targetComp)
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!canDelete) return
    const filtered = messages.filter((m) => m.id !== msgId)
    setMessages(filtered)
    await markGlobalItemDeleted(msgId, "chat_messages")
    await saveModuleDataToDB("chat_messages", filtered, targetComp)
  }

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.email.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.role.toLowerCase().includes(searchContact.toLowerCase())
  )

  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-12">
        <div className="glass-panel p-10 rounded-3xl border border-border shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mx-auto">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You do not have permission to view or participate in Messages. Please contact your System Administrator if you require access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-2 sm:p-4 md:p-6 h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6.5rem)] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <MessageSquare className="text-blue-600" size={22} />
          <span>Real-Time Messenger</span>
        </h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Live Synchronized with Database</span>
          <span className="sm:hidden">Live</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-0 md:gap-4 mt-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* ---------------- LEFT CONTACTS SIDEBAR ---------------- */}
        <div className={`col-span-12 md:col-span-4 lg:col-span-3 border-r border-zinc-200/80 dark:border-zinc-800 flex-col h-full bg-zinc-50/40 dark:bg-zinc-900 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}>
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search users, clients, admins..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1.5 space-y-1 overscroll-contain">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                {currentUserRole === "Teams"
                  ? "No assigned clients or team members found."
                  : "No contacts found."}
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = selectedContact?.email === c.email
                let roleColor = "bg-zinc-100 text-zinc-600"
                if (c.role === "Super Admin" || c.role === "Admin") roleColor = "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                if (c.role === "Clients") roleColor = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                if (c.role === "Teams") roleColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"

                return (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => {
                      setSelectedContact(c)
                      setMobileView("chat")
                      setIsSearchOpen(false)
                      setSearchMessageQuery("")
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${roleColor}`}>
                          {c.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{c.companyName || c.email}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ---------------- RIGHT CHAT CONVERSATION ---------------- */}
        <div className={`col-span-12 md:col-span-8 lg:col-span-9 flex-col h-full bg-white dark:bg-zinc-900 ${
          mobileView === "contacts" ? "hidden md:flex" : "flex"
        }`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back to Contacts Button */}
                  <button
                    type="button"
                    onClick={() => setMobileView("contacts")}
                    className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-0.5 cursor-pointer transition-colors"
                    title="Back to contacts list"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="relative shrink-0">
                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                      <span className="truncate">{selectedContact.name}</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                        {selectedContact.role}
                      </span>
                    </h2>
                    <p className="text-[10.5px] text-zinc-400 truncate">{selectedContact.companyName || selectedContact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-zinc-400 shrink-0">
                  {/* In-Chat Search Button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen)
                      if (isSearchOpen) setSearchMessageQuery("")
                    }}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isSearchOpen
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                        : "hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                    title="Search messages in this conversation"
                  >
                    <Search size={16} />
                  </button>
                  <button className="p-2 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer">
                    <Video size={16} />
                  </button>
                </div>
              </div>

              {/* In-Chat Search Bar */}
              {isSearchOpen && (
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/30 flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
                  <Search size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <input
                    type="text"
                    value={searchMessageQuery}
                    onChange={(e) => setSearchMessageQuery(e.target.value)}
                    placeholder="Search messages in this conversation..."
                    autoFocus
                    className="w-full text-xs bg-transparent border-none focus:outline-hidden text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                  {searchMessageQuery.trim() && (
                    <span className="text-[10.5px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 whitespace-nowrap">
                      {displayedThread.length} {displayedThread.length === 1 ? "match" : "matches"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchMessageQuery("")
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Chat Messages Area (Isolated smooth scrolling, no page jumps) */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20 overscroll-contain"
              >
                {displayedThread.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 text-xs space-y-2">
                    <MessageSquare size={36} className="text-zinc-300 dark:text-zinc-700" />
                    {searchMessageQuery.trim() ? (
                      <>
                        <p className="font-semibold text-zinc-600 dark:text-zinc-400">No messages found matching &ldquo;{searchMessageQuery}&rdquo;</p>
                        <p className="text-[11px]">Try searching with a different word or clear the search.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-zinc-600 dark:text-zinc-400">Direct Chat with {selectedContact.name}</p>
                        <p className="text-[11px]">Send a message below to start your conversation.</p>
                      </>
                    )}
                  </div>
                ) : (
                  displayedThread.map((msg) => {
                    const isMe = msg.senderEmail.toLowerCase().trim() === currentUserEmail
                    const isHighlight = searchMessageQuery.trim().length > 0

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} group relative`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[65%] space-y-1 ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                          <div className="flex items-center gap-1.5">
                            {isMe && canDelete && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <div
                              className={`p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                                isMe
                                  ? "bg-blue-600 text-white rounded-tr-none"
                                  : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-none"
                              } ${isHighlight ? "ring-2 ring-amber-400/80" : ""}`}
                            >
                              {msg.text}
                            </div>
                            {!isMe && canDelete && currentUserRole === "Super Admin" && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 px-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck size={12} className="text-blue-500" />}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => alert("Attachment functionality ready")}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder={canSend ? `Message ${selectedContact.name}...` : "Message sending is disabled for your account."}
                  value={inputText}
                  disabled={!canSend}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || !canSend}
                  className="p-2 sm:p-2.5 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <span className="hidden sm:inline">Send</span>
                  <Send size={13} />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-zinc-400 text-xs">
              Select a contact to begin chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
