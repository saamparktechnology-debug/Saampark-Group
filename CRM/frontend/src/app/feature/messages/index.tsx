"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Send, MessageSquare, User, Shield, UserCheck, 
  Briefcase, CheckCheck, Paperclip, Smile, MoreVertical, Trash2, Phone, Video
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { getStoredClients } from "@/app/feature/clients/services/clientService"
import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"

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
}

export default function MessagesMain() {
  const { user } = useAuthStore()
  const currentUserEmail = (user?.email || "admin@saampark.com").toLowerCase().trim()
  const currentUserName = user?.name || "Admin"

  const [contacts, setContacts] = React.useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = React.useState<ChatContact | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [inputText, setInputText] = React.useState("")
  const [searchContact, setSearchContact] = React.useState("")
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // 1. Load users & clients into contacts list
  React.useEffect(() => {
    const loadDirectory = async () => {
      try {
        const [userList, clientList] = await Promise.all([
          getUsers().catch(() => []),
          Promise.resolve(getStoredClients()),
        ])

        const contactMap = new Map<string, ChatContact>()

        // System broadcast / Admin account
        contactMap.set("admin@saampark.com", {
          id: "sys_admin",
          name: "SAAMPARK Central Admin",
          email: "admin@saampark.com",
          role: "Super Admin",
          avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Admin",
          status: "Online"
        })

        userList.forEach((u: any) => {
          if (u.email && u.email.toLowerCase() !== currentUserEmail) {
            contactMap.set(u.email.toLowerCase(), {
              id: String(u.id || u.email),
              name: u.name || "Team Member",
              email: u.email.toLowerCase(),
              role: u.role || "Teams",
              avatar: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.name || "user"}`,
              status: "Online"
            })
          }
        })

        clientList.forEach((c: any) => {
          if (c.email && c.email.toLowerCase() !== currentUserEmail) {
            contactMap.set(c.email.toLowerCase(), {
              id: String(c.id || c.email),
              name: c.name || "Client",
              email: c.email.toLowerCase(),
              role: "Clients",
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${c.name || "client"}`,
              status: "Online"
            })
          }
        })

        const arr = Array.from(contactMap.values())
        setContacts(arr)
        if (arr.length > 0 && !selectedContact) {
          setSelectedContact(arr[0])
        }
      } catch {}
    }

    loadDirectory()
  }, [currentUserEmail])

  // 2. Load and poll chat messages
  const loadChat = React.useCallback(async () => {
    const data = await fetchModuleDataFromDB<ChatMessage[]>("chat_messages", [])
    setMessages(Array.isArray(data) ? filterGlobalDeletedItems(data) : [])
  }, [])

  React.useEffect(() => {
    loadChat()
    const interval = setInterval(loadChat, 2500)
    return () => clearInterval(interval)
  }, [loadChat])

  // Auto scroll chat to bottom
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, selectedContact])

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedContact) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
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
    await saveModuleDataToDB("chat_messages", updated)
  }

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.email.toLowerCase().includes(searchContact.toLowerCase()) ||
    c.role.toLowerCase().includes(searchContact.toLowerCase())
  )

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 h-[calc(100vh-6.5rem)] flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <MessageSquare className="text-blue-600" size={24} />
          <span>Real-Time Messenger</span>
        </h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Synchronized with Database</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 mt-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* ---------------- LEFT CONTACTS SIDEBAR ---------------- */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col h-full bg-zinc-50/40 dark:bg-zinc-900">
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
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

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1.5 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                No users found.
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
                    onClick={() => setSelectedContact(c)}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-colors text-left ${
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
                      <span className="text-[11px] text-zinc-400 truncate block mt-0.5">{c.email}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ---------------- RIGHT CHAT STREAM ---------------- */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col h-full bg-white dark:bg-zinc-900">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-800/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedContact.name}</h3>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span>{selectedContact.email}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active now</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Phone size={16} />
                  </button>
                  <button type="button" className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Video size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/20">
                {currentThread.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 text-xs space-y-2">
                    <MessageSquare size={36} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">Direct Chat with {selectedContact.name}</p>
                    <p className="text-[11px]">Send a message below to start your conversation.</p>
                  </div>
                ) : (
                  currentThread.map((msg) => {
                    const isMe = msg.senderEmail.toLowerCase().trim() === currentUserEmail

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[75%] sm:max-w-[60%] space-y-1 ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                              isMe
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-none"
                            }`}
                          >
                            {msg.text}
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
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert("File attachment ready")}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${selectedContact.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Send</span>
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
