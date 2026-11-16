"use client"

import * as React from "react"
import { 
  X, CheckCircle2, ShieldCheck, Mail, Calendar, AlertTriangle, Sparkles, Clock, Globe
} from "lucide-react"
import { Project } from "../types"
import { getClients } from "@/app/feature/clients/service/clientService"

interface ProjectCompletionModalProps {
  isOpen: boolean
  project: Project | null
  onClose: () => void
  onConfirmComplete: (completedData: {
    planType: string
    planDuration: string
    countdownStartDate: string
    countdownEndDate: string
    firstPostDate?: string
    clientEmail: string
    notifyClient: boolean
    completionNotes?: string
  }) => Promise<void>
}

export function ProjectCompletionModal({
  isOpen,
  project,
  onClose,
  onConfirmComplete,
}: ProjectCompletionModalProps) {
  if (!isOpen || !project) return null

  const isMarketing = 
    project.projectType === "Digital Marketing Campaign" || 
    String(project.title || "").toLowerCase().includes("marketing") ||
    String(project.description || "").toLowerCase().includes("marketing") ||
    (project.labels || []).some(l => l.toLowerCase().includes("marketing"))

  const isHosting = 
    String(project.title || "").toLowerCase().includes("hosting") ||
    String(project.title || "").toLowerCase().includes("cloud") ||
    String(project.title || "").toLowerCase().includes("server") ||
    String(project.description || "").toLowerCase().includes("hosting")

  const todayStr = new Date().toISOString().split("T")[0]

  // Form State
  const [planType, setPlanType] = React.useState<string>(isMarketing ? "digital_marketing" : isHosting ? "hosting" : "general")
  const [durationPreset, setDurationPreset] = React.useState<string>(
    isMarketing ? "3_months" : "1_year"
  )
  const [firstPostDate, setFirstPostDate] = React.useState<string>((project as any).firstPostDate || "")
  const [firstPostLaunched, setFirstPostLaunched] = React.useState<boolean>(Boolean((project as any).firstPostDate))
  const [clientEmail, setClientEmail] = React.useState<string>((project as any).clientEmail || "")
  const [notifyClient, setNotifyClient] = React.useState<boolean>(true)
  const [notes, setNotes] = React.useState<string>("")

  // Dual Confirmation States
  const [checkDeliverables, setCheckDeliverables] = React.useState<boolean>(false)
  const [checkCountdown, setCheckCountdown] = React.useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  // Fetch client email if not present
  React.useEffect(() => {
    let active = true
    if (!clientEmail) {
      getClients().then(clients => {
        if (!active) return
        const matched = (clients || []).find(c => 
          (c.id && project.clientId && String(c.id) === String(project.clientId)) ||
          (c.name && project.client && c.name.toLowerCase().trim() === project.client.toLowerCase().trim())
        )
        if (matched && matched.email) {
          setClientEmail(matched.email)
        }
      }).catch(() => {})
    }
    return () => { active = false }
  }, [project, clientEmail])

  // Calculate start & end dates
  const { startDate, endDate, durationLabel } = React.useMemo(() => {
    let months = 12
    let label = "1 Year Service & Maintenance"

    if (durationPreset === "1_month") {
      months = 1
      label = isMarketing ? "1 Month Digital Marketing Retainer" : "1 Month Service Plan"
    } else if (durationPreset === "2_months") {
      months = 2
      label = isMarketing ? "2 Months Retainer" : "2 Months Plan"
    } else if (durationPreset === "3_months") {
      months = 3
      label = isMarketing ? "3 Months Retainer Plan" : "3 Months Plan"
    } else if (durationPreset === "6_months") {
      months = 6
      label = isMarketing ? "6 Months Retainer Plan" : "6 Months Plan"
    } else if (durationPreset === "1_year") {
      months = 12
      label = isHosting ? "1 Year Cloud Hosting & Maintenance" : "1 Year Annual Maintenance (AMC)"
    } else if (durationPreset === "2_years") {
      months = 24
      label = "2 Years Enterprise Hosting"
    }

    if (isMarketing) {
      if (!firstPostLaunched || !firstPostDate) {
        return {
          startDate: "Pending 1st Post",
          endDate: "Pending Launch",
          durationLabel: label,
        }
      }
      const s = new Date(firstPostDate)
      const e = new Date(s)
      e.setMonth(e.getMonth() + months)
      return {
        startDate: firstPostDate,
        endDate: e.toISOString().split("T")[0],
        durationLabel: label,
      }
    } else {
      const s = new Date()
      const e = new Date(s)
      e.setMonth(e.getMonth() + months)
      return {
        startDate: todayStr,
        endDate: e.toISOString().split("T")[0],
        durationLabel: label,
      }
    }
  }, [isMarketing, isHosting, durationPreset, firstPostLaunched, firstPostDate, todayStr])

  const canConfirm = checkDeliverables && checkCountdown && !isSubmitting

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsSubmitting(true)
    try {
      await onConfirmComplete({
        planType,
        planDuration: durationLabel,
        countdownStartDate: startDate === "Pending 1st Post" ? "" : startDate,
        countdownEndDate: endDate === "Pending Launch" ? "" : endDate,
        firstPostDate: isMarketing && firstPostLaunched ? firstPostDate : undefined,
        clientEmail: clientEmail.trim(),
        notifyClient,
        completionNotes: notes.trim(),
      })
      onClose()
    } catch (err: any) {
      alert("Failed to confirm project completion: " + (err?.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  DUAL CONFIRMATION GATEWAY
                </span>
                <span className="text-[10px] font-bold text-white/80">SAAMPARK CRM</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                Confirm Project Completion &amp; Launch Countdown
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Project Info Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Project</span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{project.title}</span>
              <span className="text-xs text-zinc-500 block">Client: <strong>{project.client}</strong></span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {isMarketing ? "Digital Marketing" : isHosting ? "Cloud Hosting" : "Engineering"}
            </span>
          </div>

          {/* Service / Plan Duration Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
              Service Plan &amp; Countdown Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(isMarketing ? [
                { id: "1_month", label: "1 Month Retainer" },
                { id: "2_months", label: "2 Months Retainer" },
                { id: "3_months", label: "3 Months Retainer" },
                { id: "6_months", label: "6 Months Retainer" },
                { id: "1_year", label: "1 Year Retainer" },
              ] : [
                { id: "1_year", label: "1 Year Hosting & AMC" },
                { id: "6_months", label: "6 Months Hosting" },
                { id: "3_months", label: "90 Days Warranty" },
                { id: "2_years", label: "2 Years Enterprise" },
                { id: "1_month", label: "1 Month Trial" },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDurationPreset(opt.id)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                    durationPreset === opt.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Timeline Rule Explanation */}
          {isMarketing ? (
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-purple-950 dark:text-purple-200 uppercase tracking-wide">
                    Digital Marketing Countdown Rule
                  </h4>
                  <p className="text-xs text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                    For Digital Marketing Retainers, the campaign countdown starts <strong>strictly from the 1st live published post / creative release date</strong>, NOT from the invoice or project sign-off date!
                  </p>
                </div>
              </div>

              {/* First Post Date Input Toggle */}
              <div className="pt-2 border-t border-purple-200/70 dark:border-purple-800/60">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firstPostLaunched}
                    onChange={(e) => {
                      setFirstPostLaunched(e.target.checked)
                      if (e.target.checked && !firstPostDate) setFirstPostDate(todayStr)
                    }}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                  <span>Has the 1st social media creative/post already been published?</span>
                </label>

                {firstPostLaunched && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500">1st Post Date:</span>
                    <input
                      type="date"
                      value={firstPostDate}
                      onChange={(e) => setFirstPostDate(e.target.value)}
                      className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 rounded-lg outline-none"
                    />
                  </div>
                )}
                {!firstPostLaunched && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    ⏳ Retainer countdown will be marked <strong>Paused / Awaiting 1st Post</strong> and will automatically start when the first campaign post is logged.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 flex items-start gap-2.5">
              <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                  Service &amp; Hosting Countdown Rule
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                  The service, hosting, and warranty timer starts <strong>TODAY upon completion ({todayStr})</strong> and remains active continuously until <strong>{endDate}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Computed Timeline Summary Badge */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Countdown Timeline:</span>
              <span className="font-extrabold text-blue-400">{durationLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Active Start Date:</span>
              <span className="font-mono font-bold text-emerald-400">{startDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Scheduled Expiry Date:</span>
              <span className="font-mono font-bold text-amber-400">{endDate}</span>
            </div>
          </div>

          {/* Client Notification Configuration */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" />
                <span>Send Official Project Completion &amp; Handover Email to Client</span>
              </span>
            </label>

            {notifyClient && (
              <div className="pl-6 space-y-1">
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-zinc-400 block">
                  The client will receive official completion sign-off, live credentials link, and countdown start confirmation.
                </span>
              </div>
            )}
          </div>

          {/* DUAL CONFIRMATION CHECKBOXES */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Dual Step Verification (Required)
              </span>
            </div>

            {/* Checkbox 1 */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkDeliverables}
                onChange={(e) => setCheckDeliverables(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                1. I confirm that all engineering milestones, deliverables, quality tests, and specifications have been 100% completed and fulfilled.
              </span>
            </label>

            {/* Checkbox 2 */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkCountdown}
                onChange={(e) => setCheckCountdown(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                2. I confirm launching the service countdown timeline and officially locking completion sign-off.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Completing Project...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Confirm Completion &amp; Launch Countdown →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

