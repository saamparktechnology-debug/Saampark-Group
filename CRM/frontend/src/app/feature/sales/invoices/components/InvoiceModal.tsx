"use client"

import * as React from "react"
import { 
  X, Printer, Send, Edit, CheckCircle2, AlertCircle, Building2, Phone, Mail, Globe, 
  MapPin, ShieldCheck, QrCode, CreditCard, ExternalLink, Check, Copy
} from "lucide-react"
import { InvoiceItem } from "../services/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings, DEFAULT_COMPANY_PAYMENT_SETTINGS } from "@/app/feature/settings/services/companyPaymentService"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { Project } from "@/app/feature/projects/types"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"

interface InvoiceModalProps {
  isOpen: boolean
  invoice: InvoiceItem | null
  onClose: () => void
  onSendToClient?: (invoice: InvoiceItem) => void
  onEditInvoice?: (invoice: InvoiceItem) => void
}

// Convert numbers into Indian Currency Words
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only"
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function inWords(n: number): string {
    if (n === 0) return ""
    if (n < 20) return a[n] + " "
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "") + " "
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100)
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000)
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000)
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000)
  }

  const result = inWords(Math.floor(num)).trim()
  return (result ? result + " Rupees Only" : "Zero Rupees Only").replace(/\s+/g, " ")
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
  const [linkedProject, setLinkedProject] = React.useState<Project | null>(null)
  const [clientDetails, setClientDetails] = React.useState<ClientItem | null>(null)

  React.useEffect(() => {
    if (isOpen && invoice) {
      getCompanyPaymentSettings().then((res) => {
        if (res) setPaySettings(res)
      }).catch(() => {})

      getProjects().then((projs) => {
        const match = projs.find(
          (p) =>
            p.title.toLowerCase().trim() === invoice.project.toLowerCase().trim() ||
            (invoice.client && p.client.toLowerCase().trim() === invoice.client.toLowerCase().trim())
        )
        setLinkedProject(match || null)
      }).catch(() => {})

      getClients().then((clients) => {
        const match = clients.find(
          (c) => c.name.toLowerCase().trim() === invoice.client.toLowerCase().trim()
        )
        setClientDetails(match || null)
      }).catch(() => {})
    }
  }, [isOpen, invoice])

  if (!isOpen || !invoice) return null

  // 1. Determine if GST or Non-GST Bill
  const hasItemGst = invoice.items && invoice.items.length > 0
    ? invoice.items.some(it => it.gstRate > 0 || it.gstAmount > 0)
    : false

  const isGstInvoice = Boolean(
    hasItemGst ||
    (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
    (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0) ||
    (clientDetails?.gstNumber && clientDetails.gstNumber.trim().length > 4)
  )

  // Theme configuration based on GST vs Non-GST
  // Green Theme for GST Bills, Blue Theme for Non-GST Bills
  const theme = isGstInvoice
    ? {
        name: "gst-green",
        headerGradient: "bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#00796b]",
        cardHeaderGradient: "bg-gradient-to-br from-[#004d40] via-[#00695c] to-[#00796b]",
        primaryBg: "bg-[#004d40]",
        primaryText: "text-[#004d40]",
        lightBg: "bg-emerald-50/60 dark:bg-emerald-950/30",
        lightBorder: "border-emerald-200/80 dark:border-emerald-800/60",
        tableHeaderBg: "bg-[#004d40] text-white",
        tableSubtotalBg: "bg-[#e0f2f1] text-[#004d40] dark:bg-[#004d40]/40 dark:text-emerald-300",
        grandTotalBg: "bg-[#004d40] text-white",
        badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        accentRing: "ring-emerald-500",
        sealColor: "text-[#004d40] border-[#004d40]",
        invoiceTypeLabel: "TAX INVOICE",
      }
    : {
        name: "non-gst-blue",
        headerGradient: "bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#1976d2]",
        cardHeaderGradient: "bg-gradient-to-br from-[#0d47a1] via-[#1565c0] to-[#1976d2]",
        primaryBg: "bg-[#0d47a1]",
        primaryText: "text-[#0d47a1]",
        lightBg: "bg-blue-50/60 dark:bg-blue-950/30",
        lightBorder: "border-blue-200/80 dark:border-blue-800/60",
        tableHeaderBg: "bg-[#0d47a1] text-white",
        tableSubtotalBg: "bg-[#e3f2fd] text-[#0d47a1] dark:bg-[#0d47a1]/40 dark:text-blue-300",
        grandTotalBg: "bg-[#0d47a1] text-white",
        badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
        accentRing: "ring-blue-500",
        sealColor: "text-[#0d47a1] border-[#0d47a1]",
        invoiceTypeLabel: "INVOICE",
      }

  // 2. Financial Computations
  const gstRate = isGstInvoice ? (invoice.gstRate !== undefined && invoice.gstRate > 0 ? invoice.gstRate : 18) : 0
  const setupCharge = typeof invoice.setupCharge === "number" ? invoice.setupCharge : 0
  const discount = typeof invoice.discount === "number" 
    ? invoice.discount 
    : (invoice.discountsList ? invoice.discountsList.reduce((sum, d) => sum + (d.amount || 0), 0) : 0)
  
  const parsedInvoiced = parseInt((invoice.totalInvoiced || "0").replace(/[^0-9]/g, "")) || 0

  const baseNum = invoice.baseAmount !== undefined && invoice.baseAmount > 0
    ? invoice.baseAmount
    : (parsedInvoiced > 0 && isGstInvoice ? Math.round(parsedInvoiced / (1 + gstRate / 100)) : parsedInvoiced)
  
  const taxableBase = Math.max(0, baseNum + setupCharge - discount)

  // GST must strictly be calculated on the net taxable base after discount
  const gstAmt = isGstInvoice && taxableBase > 0
    ? Math.round(taxableBase * (gstRate / 100))
    : 0

  const cgstAmt = Math.round(gstAmt / 2)
  const sgstAmt = gstAmt - cgstAmt
  const totalVal = taxableBase + gstAmt

  // Received amount can NEVER exceed total value of invoice
  const rawReceived = parseInt((invoice.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
  const parsedReceived = Math.min(rawReceived, totalVal)
  const parsedDue = invoice.due !== undefined 
    ? Math.min(parseInt(String(invoice.due).replace(/[^0-9]/g, "")) || 0, Math.max(0, totalVal - parsedReceived))
    : Math.max(0, totalVal - parsedReceived)

  const isFullyPaid = invoice.status === "Fully paid" || invoice.status === "Credited" || (parsedDue === 0 && parsedReceived > 0)
  const isPartPaid = invoice.status === "Partially paid" || (parsedReceived > 0 && parsedDue > 0)

  // Status Badge Label
  const statusBadgeText = isFullyPaid 
    ? "PAID IN FULL" 
    : isPartPaid 
    ? "PART PAID" 
    : "NOT PAID"

  // 3. URLs and Direct-View QR Code (For scanning & opening invoice)
  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://saamparktechnology.com"
  const verifyInvoiceUrl = `${originUrl}/feature/sales/invoices?view=${encodeURIComponent(invoice.id)}`
  const verifyQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyInvoiceUrl)}&margin=2`
  
  // Custom Payment QR: Only rendered if saved by admin in Settings
  const customPaymentQrUrl = paySettings.qrCodeUrl && paySettings.qrCodeUrl.trim().length > 0
    ? paySettings.qrCodeUrl
    : null

  const handlePrint = () => {
    const invoiceEl = document.getElementById("printable-invoice")
    if (!invoiceEl) {
      window.print()
      return
    }

    // 1. Try dedicated high-resolution popup print window
    try {
      const printWin = window.open("", "_blank", "width=850,height=950")
      if (printWin) {
        const headHtml = document.head.innerHTML
        printWin.document.open()
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax_Invoice_${invoice.id}</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              ${headHtml}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 4mm 4mm;
                }
                html, body {
                  background: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 4px !important;
                  overflow: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print {
                  display: none !important;
                }
              </style>
            </head>
            <body class="bg-white text-zinc-900">
              <div style="width: 100%; max-width: 800px; margin: 0 auto;">
                ${invoiceEl.outerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 300);
                };
              </script>
            </body>
          </html>
        `)
        printWin.document.close()
        return
      }
    } catch (e) {
      console.warn("Popup print fallback to iframe:", e)
    }

    // 2. Iframe print with full layout dimensions (avoids 0x0 clipping)
    const oldFrame = document.getElementById("saampark-print-frame")
    if (oldFrame) oldFrame.remove()

    const printFrame = document.createElement("iframe")
    printFrame.id = "saampark-print-frame"
    printFrame.style.position = "fixed"
    printFrame.style.left = "0"
    printFrame.style.top = "0"
    printFrame.style.width = "820px"
    printFrame.style.height = "1160px"
    printFrame.style.opacity = "0"
    printFrame.style.pointerEvents = "none"
    printFrame.style.zIndex = "-999"
    document.body.appendChild(printFrame)

    const doc = printFrame.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    doc.open()
    doc.write(`
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
        <body class="bg-white text-zinc-900">
          <div style="width: 100%; max-width: 800px; margin: 0 auto;">
            ${invoiceEl.outerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
      } catch (err) {
        window.print()
      }
      setTimeout(() => {
        printFrame.remove()
      }, 5000)
    }, 400)
  }

  const handleSend = () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setSentSuccess(true)
      if (onSendToClient) onSendToClient(invoice)
      setTimeout(() => setSentSuccess(false), 3000)
    }, 800)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyInvoiceUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div className="fixed inset-0 top-14 sm:top-0 z-[99999] flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[96vh] my-auto print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Floating Action Header Bar (No Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs ${theme.primaryBg}`}>
              {isGstInvoice ? "GST Tax Invoice (Green Theme)" : "Non-GST Invoice (Blue Theme)"}
            </span>
            <span className="text-xs text-zinc-500 font-mono font-bold">{invoice.id}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy link that opens this invoice on scan"
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
              <span>{isSending ? "Sending..." : sentSuccess ? "Sent ✓" : "Send Invoice"}</span>
            </button>

            {onEditInvoice && (
              <button
                type="button"
                onClick={() => onEditInvoice(invoice)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>        {/* ── PRINTABLE INVOICE CANVAS ────────────────────────────────────── */}
        <div 
          id="printable-invoice" 
          className="flex-1 overflow-y-auto p-3 sm:p-5 bg-white text-zinc-900 font-sans text-xs leading-normal select-text"
        >
          {(() => {
            const rawItems: any[] = (invoice.items && invoice.items.length > 0)
              ? invoice.items
              : [
                  {
                    id: 'def_1',
                    serviceName: invoice.project,
                    sacCode: isGstInvoice ? "998313" : "998314",
                    qty: 1,
                    unit: "Service",
                    rate: baseNum,
                    charges: setupCharge > 0 ? [{ id: 'chg_1', name: "Platform Setup", amount: setupCharge }] : [],
                    gstRate: gstRate,
                    gstAmount: gstAmt,
                    totalAmount: totalVal,
                  }
                ]

            const grossSum = rawItems.reduce((sum, it) => {
              const r = typeof it.rate === "number" ? it.rate : 0
              const q = it.qty || 1
              const extra = (it.charges || []).reduce((s: number, c: any) => s + (c.amount || 0), 0)
              return sum + (r * q) + extra
            }, 0)

            const discountRatio = grossSum > 0 ? taxableBase / grossSum : 1

            const finalRenderedRows = rawItems.map(item => {
              const itemRate = typeof item.rate === "number" ? item.rate : 0
              const itemQty = item.qty || 1
              const itemCharges = (item.charges || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
              const rowGross = (itemRate * itemQty) + itemCharges
              const rowTaxable = Math.round(rowGross * discountRatio)
              const rowTax = item.gstRate > 0 && rowTaxable > 0 ? Math.round(rowTaxable * (item.gstRate / 100)) : 0
              const rowTotal = rowTaxable + rowTax
              return {
                ...item,
                itemRate,
                itemQty,
                itemCharges,
                rowGross,
                rowTaxable,
                rowTax,
                rowTotal,
              }
            })

            const totalTableQty = finalRenderedRows.reduce((sum, it) => sum + it.itemQty, 0)
            const totalTableBase = finalRenderedRows.reduce((sum, it) => sum + (it.itemRate * it.itemQty) + it.itemCharges, 0)
            const totalTableGst = finalRenderedRows.reduce((sum, it) => sum + it.rowTax, 0)
            const totalTableGross = finalRenderedRows.reduce((sum, it) => sum + it.rowTotal, 0)

            const isMultiPage = finalRenderedRows.length > 5
            const page1Items = isMultiPage ? finalRenderedRows.slice(0, 5) : finalRenderedRows
            const page2Items = isMultiPage ? finalRenderedRows.slice(5) : []

            const renderTopHeader = (pageNumber?: number) => (
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-zinc-200 pb-2.5">
                {/* Left: Saampark Brand & Company Info */}
                <div className="flex items-start gap-2.5 flex-1">
                  <img 
                    src="/saampark-logo.png" 
                    alt="Saampark Logo" 
                    className="w-12 h-12 rounded-xl object-contain p-0.5 shadow-xs shrink-0 bg-white border border-zinc-200" 
                  />

                  <div className="space-y-0.5">
                    <div>
                      <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 leading-none">
                        SAAMPARK
                      </h1>
                      <h2 className="text-[11px] font-bold text-zinc-700 tracking-wide uppercase">
                        TECHNOLOGY & RESEARCH PRIVATE LIMITED
                      </h2>
                    </div>

                    <p className="text-[9px] font-semibold text-zinc-500 font-mono">
                      CIN: <span className="text-zinc-700">U72900WB2024PTC271234</span>
                      {isGstInvoice && (
                        <> | GSTIN: <span className="text-zinc-800 font-bold">19ABFCS1234D1ZS</span></>
                      )}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.2 text-[9px] text-zinc-600">
                      <p className="flex items-center gap-1">
                        <MapPin size={9} className={`${theme.primaryText} shrink-0`} />
                        <span>Madinipur, Kolkata, Durgapur, WB - 721101</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone size={9} className={`${theme.primaryText} shrink-0`} />
                        <span>+91 9901518567 / +91 9901518569</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Globe size={9} className={`${theme.primaryText} shrink-0`} />
                        <span>www.saamparktechnology.com</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Mail size={9} className={`${theme.primaryText} shrink-0`} />
                        <span>info@saamparktechnology.com</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Header Card with Gradient */}
                <div className={`w-full sm:w-52 rounded-xl ${theme.cardHeaderGradient} text-white p-2.5 shadow-xs shrink-0 flex flex-col justify-between`}>
                  <div className="flex items-center justify-between border-b border-white/20 pb-1">
                    <span className="font-black text-[11px] tracking-wider uppercase">
                      {theme.invoiceTypeLabel} {pageNumber ? `(P.${pageNumber}/2)` : ''}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black tracking-wider uppercase ${
                      isFullyPaid 
                        ? "bg-white text-emerald-800" 
                        : isPartPaid 
                        ? "bg-white text-amber-800" 
                        : "bg-white text-rose-800"
                    }`}>
                      {statusBadgeText}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1.5 text-[9.5px]">
                    <div className="flex justify-between">
                      <span className="text-white/80">INVOICE NO.</span>
                      <strong className="font-mono text-white text-[10px]">{invoice.id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">INVOICE DATE</span>
                      <strong className="text-white font-mono">{invoice.billDate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">DUE DATE</span>
                      <strong className="text-white font-mono">{invoice.dueDate || "-"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )

            const renderInfoCards = () => (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-0.5">
                {/* Box 1: BILL TO (5 cols) */}
                <div className={`sm:col-span-5 p-2 rounded-lg ${theme.lightBg} border ${theme.lightBorder} space-y-0.5`}>
                  <div className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-zinc-700">
                    <span className={theme.primaryText}>👤</span>
                    <span>BILL TO</span>
                  </div>
                  <p className="font-extrabold text-[11px] text-zinc-900 leading-tight">{invoice.client}</p>
                  <p className="text-[9.5px] text-zinc-600">
                    <strong>Address:</strong> {clientDetails?.address || (invoice.clientEmail ? `${clientDetails?.address || 'Corporate Center'}` : 'Head Office')}
                  </p>
                  <p className="text-[9.5px] text-zinc-600">
                    <strong>State:</strong> {clientDetails?.state || 'West Bengal - 721101'}
                  </p>
                  {isGstInvoice && clientDetails?.gstNumber && (
                    <p className="text-[9px] font-mono font-bold text-zinc-800">
                      GSTIN: {clientDetails.gstNumber}
                    </p>
                  )}
                </div>

                {/* Box 2: PLACE OF SUPPLY (4 cols) */}
                <div className={`sm:col-span-4 p-2 rounded-lg ${theme.lightBg} border ${theme.lightBorder} space-y-0.5`}>
                  <div className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider text-zinc-700">
                    <span className={theme.primaryText}>📍</span>
                    <span>PLACE OF SUPPLY</span>
                  </div>
                  <p className="text-[9.5px] text-zinc-700">
                    <strong>Ph No:</strong> {clientDetails?.phone || (invoice.billedBy ? `${clientDetails?.phone || '+91 9901518567'}` : '+91 9901518567')}
                  </p>
                  <p className="text-[9.5px] text-zinc-600 leading-tight">
                    Madinipur, Kolkata, Durgapur, West Bengal, India
                  </p>
                  <p className="text-[9px] font-semibold text-zinc-700">
                    West Bengal (State Code: 19)
                  </p>
                </div>

                {/* Box 3: SCAN TO DIRECTLY VIEW INVOICE (3 cols) */}
                <div className={`sm:col-span-3 p-1.5 rounded-lg ${theme.lightBg} border ${theme.lightBorder} flex flex-col items-center justify-center text-center space-y-0.5`}>
                  <span className="text-[8.5px] font-black tracking-wider uppercase text-zinc-700">
                    SCAN TO VERIFY
                  </span>
                  <a 
                    href={verifyInvoiceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    title="Scan to open digital invoice"
                  >
                    <img 
                      src={verifyQrCodeUrl} 
                      alt={`QR code for invoice ${invoice.id}`} 
                      className="w-12 h-12 object-contain rounded bg-white p-0.5 border border-zinc-200 shadow-2xs" 
                    />
                  </a>
                  <span className="text-[8px] font-mono font-bold text-zinc-600 truncate max-w-full">
                    {invoice.id}
                  </span>
                </div>
              </div>
            )

            const renderTable = (itemsList: typeof finalRenderedRows, startIndex: number, showSubtotal: boolean) => (
              <div className="rounded-lg overflow-hidden border border-zinc-200 shadow-2xs">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className={`${theme.tableHeaderBg} font-bold text-[9.5px]`}>
                      <th className="py-1.5 px-2.5 w-8 text-center">NO.</th>
                      <th className="py-1.5 px-2.5">SERVICES / PRODUCT NAME</th>
                      <th className="py-1.5 px-2 text-center">QTY</th>
                      <th className="py-1.5 px-2 text-center">UNIT</th>
                      <th className="py-1.5 px-2.5 text-right">RATE (₹)</th>
                      <th className="py-1.5 px-2.5 text-right">TAX (₹)</th>
                      <th className="py-1.5 px-2.5 text-right">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white font-medium text-zinc-800">
                    {itemsList.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-1.5 px-2 text-center font-bold text-zinc-500">{startIndex + idx + 1}</td>
                        <td className="py-1.5 px-2.5">
                          <div className="space-y-0.2">
                            <p className="font-bold text-zinc-900 text-[10.5px] leading-tight">{item.serviceName}</p>
                            {item.charges && item.charges.length > 0 && (
                              <div className="space-y-0.2">
                                {item.charges.map((chg: any) => (
                                  <p key={chg.id} className="text-[8.5px] text-zinc-500 flex items-center gap-1">
                                    <span>+ {chg.name}:</span>
                                    <strong className="font-mono text-zinc-700">₹{(chg.amount || 0).toLocaleString("en-IN")}</strong>
                                  </p>
                                ))}
                              </div>
                            )}
                            {invoice.billedBy && idx === 0 && startIndex === 0 && (
                              <p className="text-[8px] text-zinc-400 font-mono">Billed By: {invoice.billedBy}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-[10px]">{item.itemQty}</td>
                        <td className="py-1.5 px-2 text-center text-zinc-600 text-[10px]">{item.unit || "Service"}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-semibold">
                          ₹{item.itemRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-zinc-700">
                          {item.gstRate > 0 && item.rowTax > 0 ? (
                            <div>
                              <span>₹{item.rowTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                              <span className="text-[8px] text-zinc-500 block">({item.gstRate}%)</span>
                            </div>
                          ) : (
                            <span>₹0.00</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-black text-zinc-900">
                          ₹{item.rowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {showSubtotal && (
                    <tfoot>
                      <tr className={`${theme.tableSubtotalBg} font-bold text-[10px] border-t border-zinc-200`}>
                        <td colSpan={2} className="py-1.5 px-2.5 uppercase tracking-wider">
                          SUBTOTAL SERVICES & BASE AMOUNT
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono">{totalTableQty}</td>
                        <td className="py-1.5 px-2 text-center">Items</td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          ₹{totalTableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          ₹{totalTableGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-black">
                          ₹{totalTableGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )

            const renderFinancialsAndFooter = () => (
              <>
                {/* 4. TOTAL AMOUNT IN WORDS + TERMS & CONDITIONS (LEFT) & FINANCIAL BREAKDOWN (RIGHT) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-0.5">
                  {/* Left 6 Columns: Amount in Words & Terms */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <div className={`p-2 rounded-lg ${theme.lightBg} border ${theme.lightBorder} space-y-0.2`}>
                      <span className="font-black text-[9px] uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                        <span>📝</span> TOTAL AMOUNT IN WORDS
                      </span>
                      <p className="font-bold text-zinc-900 italic text-[10px] leading-tight">
                        {numberToIndianWords(totalVal)}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5">
                      <span className="font-black text-[9px] uppercase tracking-wider text-zinc-700 block border-b border-zinc-200 pb-0.2">
                        TERMS & CONDITIONS
                      </span>
                      <ol className="space-y-0.2 text-[8px] text-zinc-700 font-medium leading-tight list-decimal list-inside">
                        <li>E.& O.E.</li>
                        <li>Total payment due to be paid within due date to avoid suspension/cancellation.</li>
                        <li>Please include the invoice number in your payment notes.</li>
                        <li>All disputes are subject to Paschim Medinipur jurisdiction only.</li>
                        <li>For payment & refund related queries, read our Refund & Return Policy on website.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Right 6 Columns: Financial Computation Matrix */}
                  <div className="sm:col-span-6 space-y-0.5 text-[9.5px]">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 space-y-0.5 text-zinc-700">
                      <div className="flex justify-between py-0.1">
                        <span>Total Services Value</span>
                        <span className="font-mono font-semibold">₹{baseNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between py-0.1">
                        <span>Platform / Setup Charge</span>
                        <span className="font-mono">₹{setupCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      {invoice.discountsList && invoice.discountsList.length > 0 ? (
                        invoice.discountsList.map((d: any) => (
                          <div key={d.id} className="flex justify-between py-0.1 text-zinc-500">
                            <span>Less: {d.name}</span>
                            <span className="font-mono">(-) ₹{(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between py-0.1 text-zinc-500">
                          <span>Less: Promotional Discount</span>
                          <span className="font-mono">(-) ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-0.2 border-t border-zinc-200 font-bold text-zinc-900">
                        <span>Taxable Base Amount</span>
                        <span className="font-mono">₹{taxableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      {isGstInvoice && (
                        <>
                          <div className="flex justify-between py-0.1 text-zinc-600">
                            <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                            <span className="font-mono">₹{cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between py-0.1 text-zinc-600">
                            <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                            <span className="font-mono">₹{sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      <div className={`flex justify-between p-1.5 rounded ${theme.grandTotalBg} font-black text-[11px] tracking-wide my-0.5 shadow-xs`}>
                        <span>GRAND TOTAL (NET PAYABLE)</span>
                        <span className="font-mono text-xs">₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between py-0.2 text-emerald-700 font-bold">
                        <span>Received Amount</span>
                        <span className="font-mono">₹{parsedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between py-0.1 text-zinc-500">
                        <span>Previous Balance</span>
                        <span className="font-mono">₹0.00</span>
                      </div>

                      <div className="flex justify-between py-0.2 border-t border-zinc-200 font-black text-[10px] text-rose-600">
                        <span>Current Balance (Total Due)</span>
                        <span className="font-mono">₹{parsedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between pt-0.1 text-[8.5px] text-zinc-500">
                        <span>Next Due Date</span>
                        <span className="font-mono font-bold text-zinc-800">{invoice.dueDate || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. PAYMENT & BANK TRANSFER DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div className={`p-2 rounded-lg ${theme.lightBg} border ${theme.lightBorder} space-y-0.5`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[9px] uppercase tracking-wider text-zinc-800 flex items-center gap-1">
                        <span>📱</span> UPI & DIGITAL PAYMENT
                      </span>
                      <span className="text-[8px] font-bold text-emerald-700">Instant Settlement</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {customPaymentQrUrl ? (
                        <img 
                          src={customPaymentQrUrl} 
                          alt="Payment QR Code" 
                          className="w-11 h-11 rounded bg-white p-0.5 border border-zinc-200 shrink-0 object-contain" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-white border border-zinc-200 flex flex-col items-center justify-center text-center p-0.5 shrink-0 text-zinc-500">
                          <span className="text-xs">⚡</span>
                          <span className="text-[6.5px] font-bold">UPI PAY</span>
                        </div>
                      )}
                      
                      <div className="space-y-0.2 text-[8px] flex-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-600">UPI ID:</span>
                          <strong className="font-mono text-zinc-900 font-bold">{paySettings.upiId || "saampark@sbi"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Account Holder:</span>
                          <strong className="text-zinc-900 font-bold truncate max-w-[120px]">{paySettings.accountHolderName || "Saampark Technology Pvt. Ltd."}</strong>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap pt-0.1 font-bold text-zinc-600 text-[7.5px]">
                          <span className="px-1 py-0.1 rounded bg-white border border-zinc-200">GPay</span>
                          <span className="px-1 py-0.1 rounded bg-white border border-zinc-200">PhonePe</span>
                          <span className="px-1 py-0.1 rounded bg-white border border-zinc-200">Paytm</span>
                          <span className="px-1 py-0.1 rounded bg-white border border-zinc-200">BHIM UPI</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg ${theme.lightBg} border ${theme.lightBorder} space-y-0.2`}>
                    <span className="font-black text-[9px] uppercase tracking-wider text-zinc-800 flex items-center gap-1">
                      <span>🏛️</span> BANK TRANSFER (NEFT / RTGS / IMPS)
                    </span>
                    <div className="space-y-0.1 text-[8px] text-zinc-700">
                      <div className="flex justify-between">
                        <span>Bank Name:</span>
                        <strong className="text-zinc-900 font-bold">{paySettings.bankName || "State Bank of India"}</strong>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>A/C No.:</span>
                        <strong className="text-zinc-900 font-bold">{paySettings.accountNumber || "40912384759"}</strong>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>IFSC Code:</span>
                        <strong className="text-zinc-900 font-bold">{paySettings.ifscCode || "SBIN0001234"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Branch:</span>
                        <strong className="text-zinc-900">{paySettings.branch || "Balichak"}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. SIGNATURES & OFFICIAL SEAL ROW */}
                <div className="flex flex-row justify-between items-center gap-2 pt-1 border-t border-zinc-200">
                  <div className="text-center space-y-0.2">
                    <div className="h-5 flex items-end justify-center">
                      <span className="font-serif italic text-zinc-500 text-[10px]">Customer Signature</span>
                    </div>
                    <div className="w-28 border-t border-zinc-400 pt-0.1">
                      <p className="text-[7.5px] font-black uppercase text-zinc-600">CUSTOMER SIGNATURE</p>
                    </div>
                  </div>

                  <div className={`px-2.5 py-0.5 rounded-lg ${theme.lightBg} border ${theme.lightBorder} text-center space-y-0.1`}>
                    <p className="font-extrabold text-[9.5px] text-zinc-900">
                      💬 Thank you for your business!
                    </p>
                    <p className="text-[8px] text-zinc-500">
                      We look forward to serving you again.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-center space-y-0.2">
                      <div className="h-5 flex items-end justify-center">
                        <span className="font-serif italic text-zinc-700 text-[10px] font-bold">Saampark Authorised</span>
                      </div>
                      <div className="w-28 border-t border-zinc-400 pt-0.1">
                        <p className="text-[7.5px] font-black uppercase text-zinc-700">AUTHORISED SIGNATORY</p>
                      </div>
                    </div>

                    <div className={`w-10 h-10 rounded-full border-2 border-dashed ${theme.sealColor} flex flex-col items-center justify-center text-center p-0.1 shadow-2xs shrink-0 select-none`}>
                      <span className="text-[4px] font-black tracking-tighter uppercase leading-none">
                        SAAMPARK TECH
                      </span>
                      <span className="text-[5px] font-black my-0.1">★ SEAL ★</span>
                      <span className="text-[4px] font-bold tracking-tighter uppercase leading-none">
                        AUTHORISED
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. BOTTOM BANNER */}
                <div className={`rounded-lg ${theme.headerGradient} text-white p-1 text-[8px] font-medium flex flex-wrap items-center justify-between gap-1 shadow-xs`}>
                  <p className="flex items-center gap-1">
                    <MapPin size={8} />
                    <span>Madinipur, Kolkata, Durgapur, West Bengal, India - 721101</span>
                  </p>
                  <p className="flex items-center gap-1 font-mono">
                    <Phone size={8} />
                    <span>+91 9901518567, +91 9901518569</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <Globe size={8} />
                    <span>www.saamparktechnology.com</span>
                  </p>
                </div>
              </>
            )

            if (!isMultiPage) {
              // ── SINGLE PAGE LAYOUT (1 to 5 services, strictly fits on 1 A4 page) ──
              return (
                <div className="space-y-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {renderTopHeader()}
                  {renderInfoCards()}
                  {renderTable(page1Items, 0, true)}
                  {renderFinancialsAndFooter()}
                </div>
              )
            } else {
              // ── MULTI-PAGE LAYOUT (> 5 services) ──
              return (
                <div className="space-y-6">
                  {/* PAGE 1: First 5 services */}
                  <div className="space-y-3 pb-4" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                    {renderTopHeader(1)}
                    {renderInfoCards()}
                    {renderTable(page1Items, 0, false)}
                    <div className="p-2 rounded bg-zinc-100 text-center font-bold text-[9.5px] text-zinc-600 border border-zinc-200">
                      Page 1 of 2 — (Services 1 to 5) — Remaining services and payment details continued on Page 2 ➔
                    </div>
                  </div>

                  {/* PAGE 2: Services 6+ and complete financial settlement */}
                  <div className="space-y-2 pt-2" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                    {renderTopHeader(2)}
                    {renderTable(page2Items, 5, true)}
                    {renderFinancialsAndFooter()}
                  </div>
                </div>
              )
            }
          })()}
        </div>
      </div>
    </div>
  )
}
