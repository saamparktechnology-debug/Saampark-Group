"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Mail, Send, Edit, Trash2, Reply, X } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useUIStore } from "@/store/useUIStore"

const MOCK_MESSAGES = [
  { id: 1, from: "Emily Smith", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", subject: "Project update needed", preview: "Hi, can you send me the latest update on...", time: "Today at 10:12 am", unread: true },
  { id: 2, from: "John Doe", avatar: "https://i.pravatar.cc/150?u=2", subject: "Meeting tomorrow at 3pm", preview: "Just confirming our meeting for tomorrow...", time: "Yesterday at 5:45 pm", unread: false },
  { id: 3, from: "Sara Ann", avatar: "https://i.pravatar.cc/150?u=5", subject: "Design files ready", preview: "I've uploaded all the Figma files to the...", time: "Jul 30 at 2:00 pm", unread: true },
]

export default function MessagesMain() {
  const [activeTab, setActiveTab] = React.useState("inbox")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selected, setSelected] = React.useState<typeof MOCK_MESSAGES[0] | null>(null)
  const { openModal } = useUIStore()

  const filtered = MOCK_MESSAGES.filter(m =>
    m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-80 shrink-0 flex flex-col bg-surface border border-border shadow-soft rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border space-y-3">
            <Button variant="primary" className="w-full" leftIcon={<Edit size={16} />} onClick={() => openModal("isComposeMessageOpen")}>
              Compose
            </Button>
            <div className="flex items-center gap-3 border-b border-border/50 pb-3">
              {["inbox", "sent"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 text-sm font-medium pb-1 border-b-2 transition-colors capitalize ${
                    activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "inbox" ? <Mail size={14} /> : <Send size={14} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-9 bg-background" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${
                  selected?.id === msg.id ? "bg-primary/10" : "hover:bg-surface-hover"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {msg.unread && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                    <img src={msg.avatar} alt={msg.from} className="w-6 h-6 rounded-full" />
                    <span className={`text-sm ${msg.unread ? "font-semibold" : "font-medium"}`}>{msg.from}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.time}</span>
                </div>
                <p className="text-xs font-medium truncate ml-8">{msg.subject}</p>
                <p className="text-xs text-muted-foreground truncate ml-8">{msg.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 bg-surface border border-border shadow-soft rounded-xl flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.subject}</h2>
                    <p className="text-sm text-muted-foreground">From: {selected.from} · {selected.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Reply size={14} />} onClick={() => openModal("isComposeMessageOpen")}>Reply</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => setSelected(null)}><Trash2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(null)}><X size={14} /></Button>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={selected.avatar} alt={selected.from} className="w-10 h-10 rounded-full border border-border" />
                    <div>
                      <p className="font-medium">{selected.from}</p>
                      <p className="text-xs text-muted-foreground">{selected.time}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {selected.preview} This is a demo message. In the full system, the complete message body would appear here with all formatting and attachments.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 mb-4 rounded-full bg-background flex items-center justify-center border border-border/50">
                  <Mail size={36} className="text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">Select a message to view</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">Click any message from the list to read it here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}


