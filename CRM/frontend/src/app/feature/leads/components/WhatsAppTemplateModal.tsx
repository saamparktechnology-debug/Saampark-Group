"use client"

import * as React from "react"
import { X, Send, Copy, Check, MessageSquare, Sparkles, User, Phone } from "lucide-react"
import { Lead } from "../types"

interface WhatsAppTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead | null
}

interface TemplateOption {
  id: string
  title: string
  category: string
  emoji: string
  template: (name: string, company: string, service: string) => string
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "intro",
    title: "Introduction & Welcome",
    category: "New Leads",
    emoji: "🌟",
    template: (name, company, service) =>
      `Hi ${name || "there"}, thank you for reaching out to SAAMPARK! 🚀\n\nWe specialize in end-to-end ${service || "Digital Solutions & Technology"} to help businesses like ${company || "yours"} scale rapidly.\n\nWhen would be a convenient time for a brief 5-minute discussion?`,
  },
  {
    id: "followup",
    title: "Follow-up & Discussion",
    category: "Follow-up",
    emoji: "📞",
    template: (name, company, service) =>
      `Hello ${name || "Sir/Ma'am"}, following up on our recent conversation regarding ${service || "our services"} for ${company || "your business"}.\n\nPlease let me know if you have any questions or if you'd like to schedule a quick demonstration.\n\nBest regards,\nSAAMPARK Team`,
  },
  {
    id: "visit_invite",
    title: "Office / Store Visit Invite",
    category: "Meetings",
    emoji: "🏢",
    template: (name, company, service) =>
      `Hi ${name || "there"}, we would love to invite you to our SAAMPARK office to showcase our live client portfolio and explore tailored strategies for ${company || "your company"}.\n\nCould you let us know which day suits you best this week?`,
  },
  {
    id: "proposal_sent",
    title: "Proposal / Pricing Shared",
    category: "Proposals",
    emoji: "📄",
    template: (name, company, service) =>
      `Dear ${name || "Sir/Ma'am"}, we have prepared and sent across the detailed proposal and quotation for ${service || "your project"}.\n\nPlease review it at your convenience. We are happy to adjust any specifications to match your exact goals!`,
  },
  {
    id: "payment_reminder",
    title: "Invoice & Payment Due",
    category: "Billing",
    emoji: "💳",
    template: (name, company, service) =>
      `Hello ${name || "there"}, gentle reminder regarding the pending invoice / milestone payment for ${service || "your project"} with SAAMPARK.\n\nPlease let us know once initiated so our accounts team can share the official tax receipt. Thank you!`,
  },
]

export function WhatsAppTemplateModal({ isOpen, onClose, lead }: WhatsAppTemplateModalProps) {
  const [selectedRecipient, setSelectedRecipient] = React.useState<"primary" | "secondary">("primary")
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("intro")
  const [customMessage, setCustomMessage] = React.useState<string>("")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (lead) {
      const tpl = TEMPLATES.find((t) => t.id === selectedTemplateId)
      if (tpl) {
        const contactName =
          selectedRecipient === "secondary" && lead.secondaryContact
            ? lead.secondaryContact
            : lead.primaryContact || lead.name
        const compName = lead.name || "your company"
        const srvName = lead.service || "Technology Services"
        setCustomMessage(tpl.template(contactName, compName, srvName))
      }
    }
  }, [lead, selectedTemplateId, selectedRecipient])

  if (!isOpen || !lead) return null

  const targetPhone =
    selectedRecipient === "secondary" && lead.secondaryPhone
      ? lead.secondaryPhone
      : lead.phone

  const cleanPhone = targetPhone ? targetPhone.replace(/[^0-9]/g, "") : ""

  const handleSend = () => {
    if (!cleanPhone) {
      alert("No phone number found for this contact.")
      return
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`
    window.open(url, "_blank")
    onClose()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>WhatsApp Message Generator</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  1-Click Send
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Lead: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lead.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Recipient Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Select Recipient
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecipient("primary")}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedRecipient === "primary"
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <User size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{lead.primaryContact || lead.name}</p>
                  <p className="text-[11px] font-mono text-zinc-500">{lead.phone || "No Phone"}</p>
                </div>
              </button>

              {lead.secondaryPhone ? (
                <button
                  type="button"
                  onClick={() => setSelectedRecipient("secondary")}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    selectedRecipient === "secondary"
                      ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{lead.secondaryContact || "Manager"}</p>
                    <p className="text-[11px] font-mono text-zinc-500">{lead.secondaryPhone}</p>
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                  No secondary manager phone
                </div>
              )}
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Choose Template</span>
              <span className="text-[10px] text-zinc-400 font-normal">Click to load</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="text-base shrink-0">{tpl.emoji}</span>
                    <span className="text-xs truncate">{tpl.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Message Preview & Edit
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 leading-relaxed shadow-inner"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send size={14} />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
