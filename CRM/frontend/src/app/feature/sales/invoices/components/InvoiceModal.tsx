"use client"

import * as React from "react"
import { 
  X, Printer, Send, Edit, ExternalLink, Check
} from "lucide-react"
import { InvoiceItem } from "../services/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings, DEFAULT_COMPANY_PAYMENT_SETTINGS } from "@/app/feature/settings/services/companyPaymentService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { sendInvoiceDetailsEmailNotification } from "@/services/emailNotificationService"
import { OfficialInvoiceDocument } from "./OfficialInvoiceDocument"
import { useAuthStore } from "@/store/useAuthStore"

interface InvoiceModalProps {
  isOpen: boolean
  invoice: InvoiceItem | null
  onClose: () => void
  onSendToClient?: (invoice: InvoiceItem) => void
  onEditInvoice?: (invoice: InvoiceItem) => void
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

  const { companies } = useAuthStore()

  React.useEffect(() => {
    if (isOpen && invoice) {
      getCompanyPaymentSettings(invoice.companyId).then((res) => {
        if (res) setPaySettings(res)
      }).catch(() => {})

      getClients("all").then((clients) => {
        const match = clients.find(
          (c) => c.name.toLowerCase().trim() === invoice.client.toLowerCase().trim()
        )
        setClientDetails(match || null)
      }).catch(() => {})
    }
  }, [isOpen, invoice])

  if (!isOpen || !invoice) return null

  const resolvedCompany = companies.find(c => 
    c.id.toLowerCase() === (invoice.companyId || "").toLowerCase() ||
    (c.slug && c.slug.toLowerCase() === (invoice.companyId || "").toLowerCase()) ||
    c.name.toLowerCase() === (invoice.companyId || "").toLowerCase()
  ) || companies.find(c => c.id.toLowerCase() === (useAuthStore.getState().activeCompanyId || "").toLowerCase()) || companies[0] || null

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
    } catch (e) {
      console.error("Failed to send invoice:", e)
    } finally {
      setIsSending(false)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById("printable-invoice")
    if (!printContent) {
      window.print()
      return
    }

    try {
      const printWin = window.open("", "_blank", "width=850,height=1100")
      if (printWin) {
        printWin.document.open()
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax_Invoice_${invoice.id}</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              ${document.head.innerHTML}
              <style>
                @page { size: A4 portrait; margin: 4mm 4mm; }
                html, body {
                  background: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 4px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
              </style>
            </head>
            <body>
              ${printContent.outerHTML}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                    window.close();
                  }, 350);
                };
              </script>
            </body>
          </html>
        `)
        printWin.document.close()
        return
      }
    } catch (e) {
      console.warn("Print window open failed, fallback to direct print:", e)
    }

    window.print()
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-900/40">
          <OfficialInvoiceDocument 
            invoice={invoice}
            clientDetails={clientDetails}
            companyDetails={resolvedCompany}
            paySettings={paySettings}
          />
        </div>
      </div>
    </div>
  )
}
