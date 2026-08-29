"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useUIStore } from "@/store/useUIStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { LeadService, CustomerService, TaskService, TicketService } from "@/services/apiServices"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

// ── Reusable Modal Wrapper ──────────────────────────────────────────────────
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}) {
  React.useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative w-full ${maxW} bg-surface border border-border shadow-2xl rounded-xl overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({ options, ...props }: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
    >
      <option value="">-- Select --</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function useToast() {
  const [toasts, setToasts] = React.useState<{ id: number; msg: string }[]>([])
  const show = (msg: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, msg }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }
  const ToastContainer = (
    <div className="fixed bottom-6 right-6 z-[300] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-surface border border-border shadow-lg rounded-lg px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2 pointer-events-auto"
          >
            <span className="w-2 h-2 bg-success rounded-full" />
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
  return { show, ToastContainer }
}

export function GlobalModals() {
  const store = useUIStore()
  const { show, ToastContainer } = useToast()

  const close = (name: string) => () => store.closeModal(name)

  // State for Add Lead
  const [leadName, setLeadName] = React.useState("")
  const [leadContact, setLeadContact] = React.useState("")
  const [leadEmail, setLeadEmail] = React.useState("")
  const [leadPhone, setLeadPhone] = React.useState("")
  const [isSubmittingLead, setIsSubmittingLead] = React.useState(false)

  // State for Add Client
  const [clientCompany, setClientCompany] = React.useState("")
  const [clientContact, setClientContact] = React.useState("")
  const [clientEmail, setClientEmail] = React.useState("")
  const [clientPhone, setClientPhone] = React.useState("")
  const [isSubmittingClient, setIsSubmittingClient] = React.useState(false)

  // State for Add Task
  const [taskTitle, setTaskTitle] = React.useState("")
  const [taskPriority, setTaskPriority] = React.useState("high")
  const [isSubmittingTask, setIsSubmittingTask] = React.useState(false)

  // State for Add Ticket
  const [ticketSubject, setTicketSubject] = React.useState("")
  const [ticketDesc, setTicketDesc] = React.useState("")
  const [ticketPriority, setTicketPriority] = React.useState("medium")
  const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false)

  const handleSaveLead = async () => {
    const newLeadObj = {
      first_name: leadContact || leadName || "Lead",
      last_name: "Contact",
      company_name: leadName || "Company",
      email: leadEmail || "lead@example.com",
      phone: leadPhone || "+15550001122",
      industry: "Tech",
      source_id: 1,
      assigned_to: 1,
      lead_score: 75,
    }

    setIsSubmittingLead(true)
    await executeWithFeedback(async () => {
      await LeadService.addLead(newLeadObj)
      window.dispatchEvent(new CustomEvent("lead_created", { detail: newLeadObj }))
      setLeadName("")
      setLeadContact("")
      setLeadEmail("")
      setLeadPhone("")
      store.closeModal("isAddLeadModalOpen")
    }, {
      actionType: "create",
      loadingTitle: "Creating Lead...",
      loadingMsg: `Saving lead "${leadName || leadContact}"...`,
      successTitle: "Lead Created Successfully!",
      successMsg: `Lead "${leadName || leadContact}" has been added.`,
      errorTitle: "Lead Creation Failed",
    })
    setIsSubmittingLead(false)
  }

  const handleSaveClient = async () => {
    const newClientObj = {
      company_name: clientCompany || "New Client Corp",
      primary_contact_name: clientContact || "Contact",
      email: clientEmail || "client@company.com",
      phone: clientPhone || "+15553334444",
      industry: "Tech",
    }

    setIsSubmittingClient(true)
    await executeWithFeedback(async () => {
      await CustomerService.createCustomer(newClientObj)
      window.dispatchEvent(new CustomEvent("client_created", { detail: newClientObj }))
      setClientCompany("")
      setClientContact("")
      setClientEmail("")
      setClientPhone("")
      store.closeModal("isAddClientModalOpen")
    }, {
      actionType: "create",
      loadingTitle: "Registering Client...",
      loadingMsg: `Adding client "${clientCompany || clientContact}"...`,
      successTitle: "Client Created Successfully!",
      successMsg: `Client "${clientCompany || clientContact}" was created.`,
      errorTitle: "Client Creation Failed",
    })
    setIsSubmittingClient(false)
  }

  const handleSaveTask = async () => {
    const newTaskObj = {
      title: taskTitle || "New Task",
      description: "Task description",
      priority: taskPriority as any,
      assigned_to: 1,
      customer_id: 1,
    }

    setIsSubmittingTask(true)
    await executeWithFeedback(async () => {
      await TaskService.createTask(newTaskObj)
      window.dispatchEvent(new CustomEvent("task_created", { detail: newTaskObj }))
      setTaskTitle("")
      store.closeModal("isAddTaskModalOpen")
    }, {
      actionType: "create",
      loadingTitle: "Creating Task...",
      loadingMsg: `Adding "${taskTitle}"...`,
      successTitle: "Task Created Successfully!",
      successMsg: `Task "${taskTitle}" was added.`,
      errorTitle: "Task Creation Failed",
    })
    setIsSubmittingTask(false)
  }

  const handleSaveTicket = async () => {
    const newTicketObj = {
      customer_id: 1,
      subject: ticketSubject || "Support Issue",
      description: ticketDesc || "Issue details",
      priority: ticketPriority as any,
    }

    setIsSubmittingTicket(true)
    await executeWithFeedback(async () => {
      await TicketService.createTicket(newTicketObj)
      window.dispatchEvent(new CustomEvent("ticket_created", { detail: newTicketObj }))
      setTicketSubject("")
      setTicketDesc("")
      store.closeModal("isAddTicketModalOpen")
    }, {
      actionType: "create",
      loadingTitle: "Creating Support Ticket...",
      loadingMsg: `Submitting "${ticketSubject}"...`,
      successTitle: "Ticket Created!",
      successMsg: `Support Ticket "${ticketSubject}" dispatched.`,
      errorTitle: "Ticket Submission Failed",
    })
    setIsSubmittingTicket(false)
  }

  return (
    <>
      {ToastContainer}

      {/* ── Add Client Modal ── */}
      <Modal isOpen={store.isAddClientModalOpen} onClose={close("isAddClientModalOpen")} title="Add Client" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name">
              <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Acme Corp" autoFocus />
            </Field>
            <Field label="Contact Person">
              <Input value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="Jane Smith" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="jane@acme.com" />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddClientModalOpen")}>Cancel</Button>
            <Button variant="primary" disabled={isSubmittingClient} onClick={handleSaveClient}>
              {isSubmittingClient ? "Saving..." : "Save Client (Live API)"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Task Modal ── */}
      <Modal isOpen={store.isAddTaskModalOpen} onClose={close("isAddTaskModalOpen")} title="Add Task" size="md">
        <div className="space-y-4">
          <Field label="Task Title">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Optimize API flow" autoFocus />
          </Field>
          <Field label="Priority">
            <Select options={["low", "medium", "high", "urgent"]} value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddTaskModalOpen")}>Cancel</Button>
            <Button variant="primary" disabled={isSubmittingTask} onClick={handleSaveTask}>
              {isSubmittingTask ? "Saving..." : "Create Task (Live API)"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Lead Modal ── */}
      <Modal isOpen={store.isAddLeadModalOpen} onClose={close("isAddLeadModalOpen")} title="Add New Lead" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company / Lead Name">
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Acme Corp" autoFocus />
            </Field>
            <Field label="Primary Contact">
              <Input value={leadContact} onChange={(e) => setLeadContact(e.target.value)} placeholder="Jane Smith" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="jane@acme.com" />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddLeadModalOpen")}>Cancel</Button>
            <Button variant="primary" disabled={isSubmittingLead} onClick={handleSaveLead}>
              {isSubmittingLead ? "Saving..." : "Save Lead (Live API)"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Ticket Modal ── */}
      <Modal isOpen={store.isAddTicketModalOpen} onClose={close("isAddTicketModalOpen")} title="New Support Ticket" size="md">
        <div className="space-y-4">
          <Field label="Subject">
            <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="e.g. Cannot login to dashboard" autoFocus />
          </Field>
          <Field label="Priority">
            <Select options={["low", "medium", "high", "urgent"]} value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              className="w-full h-28 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
              placeholder="Describe the issue in detail..."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddTicketModalOpen")}>Cancel</Button>
            <Button variant="primary" disabled={isSubmittingTicket} onClick={handleSaveTicket}>
              {isSubmittingTicket ? "Submitting..." : "Submit Ticket (Live API)"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
