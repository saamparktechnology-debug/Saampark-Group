"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { useUIStore } from "@/store/useUIStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

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
  // Close on Escape key
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

// ── Field Helper ────────────────────────────────────────────────────────────
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

// ── Select Helper ───────────────────────────────────────────────────────────
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

// ── Toast Notification ──────────────────────────────────────────────────────
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

// ── Timer Hook ──────────────────────────────────────────────────────────────
function useTimer() {
  const [running, setRunning] = React.useState(false)
  const [seconds, setSeconds] = React.useState(0)
  React.useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [running])
  const formatted = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  return { running, setRunning, formatted, reset: () => setSeconds(0) }
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL GLOBAL MODALS
// ══════════════════════════════════════════════════════════════════════════════
export function GlobalModals() {
  const store = useUIStore()
  const { show, ToastContainer } = useToast()
  const timer = useTimer()

  const close = (name: string) => () => store.closeModal(name)
  const saveAndClose = (name: string, msg: string) => () => {
    store.closeModal(name)
    show(msg)
  }

  return (
    <>
      {ToastContainer}

      {/* ── Todo Quick Modal ── */}
      <Modal isOpen={store.isTodoModalOpen} onClose={close("isTodoModalOpen")} title="Quick To-Do" size="sm">
        <div className="space-y-4">
          <Field label="Task">
            <Input autoFocus placeholder="What do you need to do?" />
          </Field>
          <Field label="Priority">
            <Select options={["Low", "Normal", "High", "Urgent"]} defaultValue="Normal" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isTodoModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isTodoModalOpen", "To-do added!")}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* ── Clock In / Timer Modal ── */}
      <Modal isOpen={store.isTimerModalOpen} onClose={close("isTimerModalOpen")} title="Clock In / Timer" size="sm">
        <div className="space-y-6 text-center">
          <div className="text-5xl font-mono font-bold text-primary tracking-wider">{timer.formatted}</div>
          <Field label="Note (optional)">
            <Input placeholder="What are you working on?" />
          </Field>
          <div className="flex justify-center gap-3 pt-2">
            {!timer.running ? (
              <Button variant="primary" className="w-full" onClick={() => timer.setRunning(true)}>
                ▶ Start Timer
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => timer.setRunning(false)}>⏸ Pause</Button>
                <Button variant="danger" onClick={() => { timer.setRunning(false); timer.reset(); saveAndClose("isTimerModalOpen", "Time logged successfully!")() }}>⏹ Stop & Log</Button>
              </>
            )}
          </div>
          {!timer.running && (
            <Button variant="ghost" className="w-full text-xs" onClick={close("isTimerModalOpen")}>Cancel</Button>
          )}
        </div>
      </Modal>

      {/* ── Add Client Modal ── */}
      <Modal isOpen={store.isAddClientModalOpen} onClose={close("isAddClientModalOpen")} title="Add Client" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name"><Input placeholder="Acme Corp" autoFocus /></Field>
            <Field label="Contact Person"><Input placeholder="Jane Smith" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" placeholder="jane@acme.com" /></Field>
            <Field label="Phone"><Input type="tel" placeholder="+1 555 000 0000" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website"><Input placeholder="https://acme.com" /></Field>
            <Field label="Status"><Select options={["Active", "Inactive", "Lead"]} /></Field>
          </div>
          <Field label="Address"><Input placeholder="123 Business St, City" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddClientModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddClientModalOpen", "Client added!")}>Save Client</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Project Modal ── */}
      <Modal isOpen={store.isAddProjectModalOpen} onClose={close("isAddProjectModalOpen")} title="New Project" size="md">
        <div className="space-y-4">
          <Field label="Project Name"><Input placeholder="e.g. Website Redesign" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client"><Select options={["Acme Corp", "TechNova", "Wayne Tech", "Stark Enterprises"]} /></Field>
            <Field label="Status"><Select options={["Planning", "In Progress", "Review", "Completed"]} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date"><Input type="date" /></Field>
            <Field label="Deadline"><Input type="date" /></Field>
          </div>
          <Field label="Description">
            <textarea className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary" placeholder="Describe the project..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddProjectModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddProjectModalOpen", "Project created!")}>Create Project</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Task Modal ── */}
      <Modal isOpen={store.isAddTaskModalOpen} onClose={close("isAddTaskModalOpen")} title="Add Task" size="md">
        <div className="space-y-4">
          <Field label="Task Title"><Input placeholder="e.g. Design the login page" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project"><Select options={["Website Redesign", "Mobile App V2", "Marketing Campaign"]} /></Field>
            <Field label="Assign To"><Select options={["John Doe", "Sara Ann", "Mark Thomas", "Richard Gray"]} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority"><Select options={["Low", "Normal", "High", "Urgent"]} /></Field>
            <Field label="Status"><Select options={["To do", "In Progress", "Review", "Done"]} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date"><Input type="date" /></Field>
            <Field label="Due Date"><Input type="date" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddTaskModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddTaskModalOpen", "Task created!")}>Create Task</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Team Member Modal ── */}
      <Modal isOpen={store.isAddMemberModalOpen} onClose={close("isAddMemberModalOpen")} title="Add Team Member" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name"><Input placeholder="John" autoFocus /></Field>
            <Field label="Last Name"><Input placeholder="Doe" /></Field>
          </div>
          <Field label="Email"><Input type="email" placeholder="john.doe@company.com" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Job Title"><Input placeholder="e.g. Developer" /></Field>
            <Field label="Phone"><Input type="tel" placeholder="+1 555 000 0000" /></Field>
          </div>
          <Field label="Role"><Select options={["Admin", "Manager", "Developer", "Designer", "Support"]} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddMemberModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddMemberModalOpen", "Member added! Invitation sent.")}>Add & Invite</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Lead Modal ── */}
      <Modal isOpen={store.isAddLeadModalOpen} onClose={close("isAddLeadModalOpen")} title="Add New Lead" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company / Lead Name"><Input placeholder="Acme Corp" autoFocus /></Field>
            <Field label="Primary Contact"><Input placeholder="Jane Smith" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" placeholder="jane@acme.com" /></Field>
            <Field label="Phone"><Input type="tel" placeholder="+1 555 000 0000" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Owner"><Select options={["John Doe", "Sara Ann", "Richard Gray"]} /></Field>
            <Field label="Status"><Select options={["New", "Discussion", "Negotiation", "Qualified", "Won", "Lost"]} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddLeadModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddLeadModalOpen", "Lead added!")}>Save Lead</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Ticket Modal ── */}
      <Modal isOpen={store.isAddTicketModalOpen} onClose={close("isAddTicketModalOpen")} title="New Support Ticket" size="md">
        <div className="space-y-4">
          <Field label="Subject"><Input placeholder="e.g. Cannot login to dashboard" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority"><Select options={["Low", "Normal", "High", "Critical"]} /></Field>
            <Field label="Category"><Select options={["General Support", "Bug Report", "Sales Inquiry", "Billing"]} /></Field>
          </div>
          <Field label="Description">
            <textarea className="w-full h-28 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary" placeholder="Describe the issue in detail..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddTicketModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddTicketModalOpen", "Ticket submitted!")}>Submit Ticket</Button>
          </div>
        </div>
      </Modal>

      {/* ── Compose Message Modal ── */}
      <Modal isOpen={store.isComposeMessageOpen} onClose={close("isComposeMessageOpen")} title="Compose Message" size="lg">
        <div className="space-y-4">
          <Field label="To"><Select options={["John Doe", "Sara Ann", "Mark Thomas", "Richard Gray", "Emily Smith"]} /></Field>
          <Field label="Subject"><Input placeholder="Message subject..." autoFocus /></Field>
          <Field label="Message">
            <textarea className="w-full h-40 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary" placeholder="Write your message here..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isComposeMessageOpen")}>Discard</Button>
            <Button variant="primary" onClick={saveAndClose("isComposeMessageOpen", "Message sent!")}>Send Message</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Note Modal ── */}
      <Modal isOpen={store.isAddNoteModalOpen} onClose={close("isAddNoteModalOpen")} title="Add Note" size="md">
        <div className="space-y-4">
          <Field label="Title"><Input placeholder="Note title..." autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color">
              <Select options={["Yellow", "Blue", "Pink", "Green", "Purple"]} />
            </Field>
            <Field label="Visibility">
              <Select options={["Private", "Team"]} />
            </Field>
          </div>
          <Field label="Content">
            <textarea className="w-full h-32 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary" placeholder="Write your note..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddNoteModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddNoteModalOpen", "Note saved!")}>Save Note</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Expense Modal ── */}
      <Modal isOpen={store.isAddExpenseModalOpen} onClose={close("isAddExpenseModalOpen")} title="Add Expense" size="md">
        <div className="space-y-4">
          <Field label="Title"><Input placeholder="e.g. Office Supplies" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount"><Input type="number" placeholder="0.00" /></Field>
            <Field label="Currency"><Select options={["USD", "EUR", "GBP", "PKR"]} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><Input type="date" /></Field>
            <Field label="Category"><Select options={["Software", "Hardware", "Travel", "Marketing", "Other"]} /></Field>
          </div>
          <Field label="Notes">
            <textarea className="w-full h-20 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-primary" placeholder="Optional notes..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddExpenseModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddExpenseModalOpen", "Expense logged!")}>Save Expense</Button>
          </div>
        </div>
      </Modal>

      {/* ── Send Invitation Modal ── */}
      <Modal isOpen={store.isSendInvitationOpen} onClose={close("isSendInvitationOpen")} title="Send Team Invitation" size="sm">
        <div className="space-y-4">
          <Field label="Email Address"><Input type="email" placeholder="colleague@company.com" autoFocus /></Field>
          <Field label="Role"><Select options={["Admin", "Manager", "Developer", "Designer", "Support"]} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isSendInvitationOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isSendInvitationOpen", "Invitation sent!")}>Send Invitation</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Proposal Modal ── */}
      <Modal isOpen={store.isAddProposalModalOpen} onClose={close("isAddProposalModalOpen")} title="Create Proposal" size="md">
        <div className="space-y-4">
          <Field label="Proposal Title"><Input placeholder="e.g. Website Development Proposal" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client"><Select options={["Acme Corp", "TechNova", "Wayne Tech", "Stark Enterprises"]} /></Field>
            <Field label="Value"><Input type="number" placeholder="0.00" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valid Until"><Input type="date" /></Field>
            <Field label="Status"><Select options={["Draft", "Sent", "Accepted", "Declined"]} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddProposalModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddProposalModalOpen", "Proposal created!")}>Create Proposal</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Estimate Modal ── */}
      <Modal isOpen={store.isAddEstimateModalOpen} onClose={close("isAddEstimateModalOpen")} title="Create Estimate" size="md">
        <div className="space-y-4">
          <Field label="Estimate Title"><Input placeholder="e.g. Q3 Development Work" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client"><Select options={["Acme Corp", "TechNova", "Wayne Tech"]} /></Field>
            <Field label="Currency"><Select options={["USD", "EUR", "GBP"]} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issue Date"><Input type="date" /></Field>
            <Field label="Expiry Date"><Input type="date" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close("isAddEstimateModalOpen")}>Cancel</Button>
            <Button variant="primary" onClick={saveAndClose("isAddEstimateModalOpen", "Estimate created!")}>Create Estimate</Button>
          </div>
        </div>
      </Modal>

      {/* ── Global Search Modal ── */}
      <AnimatePresence>
        {store.isGlobalSearchOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close("isGlobalSearchOpen")}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="relative w-full max-w-xl bg-surface border border-border shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <span className="text-muted-foreground">🔍</span>
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground text-base"
                  placeholder="Search clients, projects, tasks, members..."
                />
                <kbd className="text-xs bg-surface-hover border border-border rounded px-2 py-0.5 text-muted-foreground">ESC</kbd>
              </div>
              <div className="p-4 space-y-1">
                {["Dashboard", "Events / Calendar", "Team Members", "Leads", "Projects", "Clients", "Messages"].map(item => (
                  <button
                    key={item}
                    onClick={close("isGlobalSearchOpen")}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
