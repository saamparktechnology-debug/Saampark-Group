"use client"

import * as React from "react"
import { 
  X, Printer, Send, Edit, ExternalLink, Check, Megaphone, Clock
} from "lucide-react"
import { InvoiceItem } from "../service/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings, DEFAULT_COMPANY_PAYMENT_SETTINGS } from "@/app/feature/settings/service/companyPaymentService"
import { getClients } from "@/app/feature/clients/service/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { sendInvoiceDetailsEmailNotification } from "@/services/emailNotificationService"
import { OfficialInvoiceDocument } from "./OfficialInvoiceDocument"
import { useAuthStore, isMatchingCompany } from "@/store/useAuthStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { printDocument } from "@/lib/printUtils"

interface InvoiceModalProps {
  isOpen: boolean
  invoice: InvoiceItem | null
  onClose: () => void
  onSendToClient?: (invoice: InvoiceItem) => void
  onEditInvoice?: (invoice: InvoiceItem) => void
}

class InvoiceDocumentErrorBoundary extends React.Component<
  { children: React.ReactNode; invoiceId?: string; onRetry?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Invoice Preview Error:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Document Preview Recovered
          </h3>
          <p className="text-xs text-zinc-500">
            A minor data inconsistency occurred while rendering invoice #{this.props.invoiceId || ""}. You can reload or print directly.
          </p>
          {this.state.error?.message && (
            <div className="text-[10px] font-mono text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-xl text-left overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-colors"
            >
              Reload Document
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function InvoiceModal({
  isOpen,
  invoice,
  onClose,
  onSendToClient,
  onEditInvoice,
}: InvoiceModalProps) {
  const [isSending, setIsSending] = React.useState(false)
  const [sentSuccess, setSentSuccess] = React.useState(false)
  const [copiedLink, setCopiedLink] = React.useState(false)
  const [paySettings, setPaySettings] = React.useState<CompanyPaymentSettings>(DEFAULT_COMPANY_PAYMENT_SETTINGS)
  const [clientDetails, setClientDetails] = React.useState<ClientItem | null>(null)

  const [logoPosition, setLogoPosition] = React.useState<{ x: number; y: number } | undefined>(undefined)
  const [logoScale, setLogoScale] = React.useState<number | undefined>(undefined)
  const [stampPosition, setStampPosition] = React.useState<{ x: number; y: number } | undefined>(undefined)
  const [stampScale, setStampScale] = React.useState<number | undefined>(undefined)
  const [sigPosition, setSigPosition] = React.useState<{ x: number; y: number } | undefined>(undefined)
  const [sigScale, setSigScale] = React.useState<number | undefined>(undefined)

  const { companies } = useAuthStore()

  const targetCompId = String(invoice?.companyId || (invoice as any)?.company || "").toLowerCase().trim()
  const activeCompId = String(useAuthStore.getState().activeCompanyId || "").toLowerCase().trim()

  const resolvedCompany = React.useMemo(() => {
    return (
      (targetCompId ? companies.find(c => isMatchingCompany(c, targetCompId)) : null) ||
      (targetCompId ? companies.find(c => 
        (targetCompId && String(c.id || "").toLowerCase() === targetCompId) ||
        (targetCompId && c.slug && String(c.slug).toLowerCase() === targetCompId) ||
        (targetCompId && String((c as any).numeric_id || "").toLowerCase() === targetCompId) ||
        (targetCompId && String(c.name || "").toLowerCase() === targetCompId)
      ) : null) ||
      (activeCompId ? companies.find(c => isMatchingCompany(c, activeCompId)) : null) ||
      companies[0] || 
      null
    )
  }, [companies, targetCompId, activeCompId])

  React.useEffect(() => {
    if (isOpen && invoice) {
      getCompanyPaymentSettings(invoice.companyId).then((res) => {
        if (res) setPaySettings(res)
      }).catch(() => {})

      getClients("all").then((clients) => {
        const clientTarget = String(invoice.client || (invoice as any).clientName || "").toLowerCase().trim()
        const match = clients.find(
          (c) => String(c.name || "").toLowerCase().trim() === clientTarget
        )
        setClientDetails(match || null)
      }).catch(() => {})
    }
  }, [isOpen, invoice])

  React.useEffect(() => {
    if (resolvedCompany) {
      setLogoPosition(resolvedCompany.logo_position || { x: 0, y: 0 })
      setLogoScale(resolvedCompany.logo_scale ?? 1)
      setStampPosition(resolvedCompany.stamp_position || { x: 0, y: 0 })
      setStampScale(resolvedCompany.stamp_scale ?? 1)
      setSigPosition(resolvedCompany.signature_position || { x: 0, y: 0 })
      setSigScale(resolvedCompany.signature_scale ?? 1)
    }
  }, [resolvedCompany?.id, resolvedCompany?.logo_position, resolvedCompany?.logo_scale])

  if (!isOpen || !invoice) return null

  const handleLogoPositionChange = (pos: { x: number; y: number }) => {
    setLogoPosition(pos)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { logo_position: pos }).catch(() => {})
    }
  }

  const handleLogoScaleChange = (scale: number) => {
    setLogoScale(scale)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { logo_scale: scale }).catch(() => {})
    }
  }

  const handleStampPositionChange = (pos: { x: number; y: number }) => {
    setStampPosition(pos)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { stamp_position: pos }).catch(() => {})
    }
  }

  const handleStampScaleChange = (scale: number) => {
    setStampScale(scale)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { stamp_scale: scale }).catch(() => {})
    }
  }

  const handleSignaturePositionChange = (pos: { x: number; y: number }) => {
    setSigPosition(pos)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { signature_position: pos }).catch(() => {})
    }
  }

  const handleSignatureScaleChange = (scale: number) => {
    setSigScale(scale)
    if (resolvedCompany) {
      useAuthStore.getState().updateCompany(resolvedCompany.id, { signature_scale: scale }).catch(() => {})
    }
  }

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://saamparktechnology.com"
  const publicShareUrl = `${originUrl}/public/invoice?id=${encodeURIComponent(invoice.id)}`

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(publicShareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleSend = async () => {
    setIsSending(true)
    try {
      await executeWithFeedback(async () => {
        if (onSendToClient) {
          await onSendToClient(invoice)
        } else {
          await sendInvoiceDetailsEmailNotification(
            invoice,
            invoice.clientEmail || clientDetails?.email
          )
        }
        setSentSuccess(true)
        setTimeout(() => setSentSuccess(false), 3000)
      }, {
        actionType: "sync",
        loadingTitle: "Dispatching Invoice Email...",
        loadingMsg: `Sending official invoice #${invoice.id} with download link to ${invoice.clientEmail || clientDetails?.email || "recipient"}...`,
        successTitle: "Invoice Delivered Successfully!",
        successMsg: `Official invoice #${invoice.id} has been dispatched to client's email inbox.`,
        minLoadingMs: 650,
      })
    } catch (e) {
      console.error("Failed to send invoice:", e)
    } finally {
      setIsSending(false)
    }
  }

  const handlePrint = () => {
    printDocument("printable-invoice", `Tax_Invoice_${invoice.id}`)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[96vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg">
              {invoice.id}
            </span>
            <span className="text-xs text-zinc-500 font-semibold hidden sm:inline">
              • {invoice.client}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy public link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <ExternalLink size={14} />}
              <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              <span>{isSending ? "Sending..." : sentSuccess ? "Sent ✓" : "Send Email"}</span>
            </button>

            {Boolean(
              (invoice as any)?.marketingPackage?.enabled || 
              (invoice as any)?.marketingPackage?.planName || 
              (invoice as any)?.primaryCategory === "Digital Marketing" || 
              (invoice as any)?.category === "Digital Marketing" ||
              String(invoice.project || "").toLowerCase().includes("marketing") || 
              String(invoice.project || "").toLowerCase().includes("retainer")
            ) && (
              <button
                type="button"
                onClick={async () => {
                  setIsSending(true)
                  try {
                    const { sendRetainerExpiryReminder } = await import("../service/invoiceService")
                    const res = await sendRetainerExpiryReminder(invoice.id)
                    alert(res.message || "Retainer expiry alert dispatched successfully!")
                  } catch (err: any) {
                    alert("Failed to send retainer expiry alert.")
                  } finally {
                    setIsSending(false)
                  }
                }}
                disabled={isSending}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                title="Send Monthly Retainer Expiry & Campaign Renewal alert to client"
              >
                <Clock size={14} />
                <span>Send Retainer Expiry Alert</span>
              </button>
            )}

            {Boolean(
              (invoice as any)?.marketingPackage?.enabled || 
              (invoice as any)?.marketingPackage?.planName || 
              (invoice as any)?.primaryCategory === "Digital Marketing" || 
              String(invoice.project || "").toLowerCase().includes("marketing") || 
              String(invoice.project || "").toLowerCase().includes("retainer")
            ) && (
              <a
                href={`/feature/marketing?client=${encodeURIComponent(invoice.client || "")}&invoice=${encodeURIComponent(invoice.id || "")}`}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                title="Direct link to open Marketing Retainer Hub for this client"
              >
                <Megaphone size={14} />
                <span>Open Marketing Hub →</span>
              </a>
            )}

            {onEditInvoice && (
              <button
                type="button"
                onClick={() => onEditInvoice(invoice)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-900/40 flex justify-center items-start">
          <div className="w-full max-w-[820px] shadow-2xl rounded-2xl bg-white transition-all">
            <InvoiceDocumentErrorBoundary invoiceId={invoice.id}>
              <OfficialInvoiceDocument 
                invoice={invoice}
                clientDetails={clientDetails}
                companyDetails={resolvedCompany}
                paySettings={paySettings}
                interactive={true}
                logoPosition={logoPosition}
                onLogoPositionChange={handleLogoPositionChange}
                logoScale={logoScale}
                onLogoScaleChange={handleLogoScaleChange}
                stampPosition={stampPosition}
                onStampPositionChange={handleStampPositionChange}
                stampScale={stampScale}
                onStampScaleChange={handleStampScaleChange}
                signaturePosition={sigPosition}
                onSignaturePositionChange={handleSignaturePositionChange}
                signatureScale={sigScale}
                onSignatureScaleChange={handleSignatureScaleChange}
              />
            </InvoiceDocumentErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}
