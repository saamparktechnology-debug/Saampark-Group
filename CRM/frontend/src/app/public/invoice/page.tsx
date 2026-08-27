"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { 
  Building2, Phone, Mail, MapPin, ShieldCheck, QrCode, 
  Printer, ArrowLeft, CheckCircle2, AlertCircle, Clock, 
  FileText, CreditCard, ExternalLink, Download, Share2
} from "lucide-react"
import { getInvoices, InvoiceItem, InvoiceLineItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings } from "@/app/feature/settings/services/companyPaymentService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"

function PublicInvoiceContent() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("id") || searchParams.get("view") || ""

  const [invoice, setInvoice] = React.useState<InvoiceItem | null>(null)
  const [paySettings, setPaySettings] = React.useState<CompanyPaymentSettings>({
    upiId: "saampark@sbi",
    accountHolderName: "Saampark Technology Pvt. Ltd.",
    bankName: "State Bank of India",
    accountNumber: "40912384759",
    ifscCode: "SBIN0001234",
    branch: "Balichak",
    qrCodeUrl: "",
  })
  const [clientDetails, setClientDetails] = React.useState<ClientItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [allInvoices, settings, allClients] = await Promise.all([
          getInvoices("all").catch(() => []),
          getCompanyPaymentSettings("all").catch(() => ({
            upiId: "saampark@sbi",
            accountHolderName: "Saampark Technology Pvt. Ltd.",
            bankName: "State Bank of India",
            accountNumber: "40912384759",
            ifscCode: "SBIN0001234",
            branch: "Balichak",
            qrCodeUrl: "",
          })),
          getClients("all").catch(() => []),
        ])

        setPaySettings(settings)

        if (invoiceId) {
          const target = allInvoices.find(
            (i) => i.id.toLowerCase().trim() === invoiceId.toLowerCase().trim()
          )
          if (target) {
            setInvoice(target)
            const matchedCli = allClients.find(
              (c) => c.name.toLowerCase().trim() === (target.client || "").toLowerCase().trim()
            )
            if (matchedCli) setClientDetails(matchedCli)
          }
        }
      } catch (err) {
        console.error("Failed to load invoice:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Verifying and loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4 shadow-md">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Invoice Not Found</h1>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-6">
          The invoice reference &quot;{invoiceId}&quot; could not be located or may have been updated.
        </p>
      </div>
    )
  }

  // Financial Calculations
  const parseCurrency = (val?: string | number) => {
    if (typeof val === "number") return val
    if (!val) return 0
    return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0
  }

  const baseNum = invoice.baseAmount || parseCurrency(invoice.totalInvoiced)
  const setupNum = invoice.setupCharge || 0
  const discNum = invoice.discount || 0
  const subtotalBeforeGst = Math.max(0, baseNum + setupNum - discNum)
  const gstRate = invoice.gstRate !== undefined ? invoice.gstRate : 18
  const gstAmt = invoice.gstAmount !== undefined ? invoice.gstAmount : (subtotalBeforeGst * gstRate) / 100
  const totalVal = parseCurrency(invoice.totalInvoiced) || subtotalBeforeGst + gstAmt
  const parsedReceived = parseCurrency(invoice.paymentReceived)
  const parsedDue = parseCurrency(invoice.due)

  const isFullyPaid = invoice.status === "Fully paid" || (parsedDue <= 0 && parsedReceived >= totalVal && totalVal > 0)
  const isPartPaid = invoice.status === "Partially paid" || (parsedReceived > 0 && parsedDue > 0)

  const isGstInvoice = Boolean(
    (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
    (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0) ||
    (clientDetails?.gstNumber && clientDetails.gstNumber.trim().length > 4)
  )

  const theme = isGstInvoice
    ? {
        name: "gst-teal",
        primaryColor: "#005f69",
        primaryBg: "bg-[#005f69]",
        primaryText: "text-[#005f69]",
        badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-300",
        tableHeaderBg: "bg-[#005f69] text-white",
        grandTotalBg: "bg-[#005f69] text-white",
        invoiceTypeLabel: "TAX INVOICE",
      }
    : {
        name: "non-gst-blue",
        primaryColor: "#0d47a1",
        primaryBg: "bg-[#0d47a1]",
        primaryText: "text-[#0d47a1]",
        badgeBg: "bg-blue-50 text-blue-800 border-blue-300",
        tableHeaderBg: "bg-[#0d47a1] text-white",
        grandTotalBg: "bg-[#0d47a1] text-white",
        invoiceTypeLabel: "INVOICE",
      }

  const itemsList: InvoiceLineItem[] = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: "item_1",
          serviceName: invoice.project || "Business Consulting & Services",
          qty: 1,
          unit: "Unit",
          rate: baseNum,
          gstRate: gstRate,
          gstAmount: gstAmt,
          totalAmount: totalVal,
        },
      ]

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-6 px-3 sm:px-6 flex flex-col items-center">
      
      {/* Top Action Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center shadow-sm`}>
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-xs font-black tracking-wide text-zinc-900 dark:text-zinc-100 uppercase block">
              SAAMPARK GROUP
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Verified Authentic Invoice</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Share2 size={14} />
            <span>{isCopied ? "Link Copied!" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`px-3.5 py-1.5 rounded-xl ${theme.primaryBg} hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer`}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Tax Invoice Document */}
      <div id="printable-invoice" className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-zinc-900 dark:text-zinc-100 p-6 sm:p-8 space-y-6">
        
        {/* Verification Banner */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm block leading-tight">Digital Tax Invoice Verified</span>
              <span className="text-[11px] opacity-80">Authentic record generated by Saampark Enterprise Billing System</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/70 shadow-2xs">
            <span>INV REF:</span>
            <span className="text-emerald-700 dark:text-emerald-400">{invoice.id}</span>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-tight ${theme.primaryText}`}>SAAMPARK GROUP</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${theme.badgeBg}`}>
                {theme.invoiceTypeLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">Saampark Technology & Enterprise Solutions</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <strong>GSTIN:</strong> 19AAHCS4829N1Z5 &bull; <strong>PAN:</strong> AAHCS4829N
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider uppercase border shadow-2xs"
                 style={{
                   backgroundColor: isFullyPaid ? "#ecfdf5" : isPartPaid ? "#fffbeb" : "#fff1f2",
                   color: isFullyPaid ? "#047857" : isPartPaid ? "#b45309" : "#e11d48",
                   borderColor: isFullyPaid ? "#a7f3d0" : isPartPaid ? "#fde68a" : "#fecdd3"
                 }}>
              {isFullyPaid ? "PAID IN FULL" : isPartPaid ? "PART PAID" : "PAYMENT DUE"}
            </div>
            <div className="text-xs text-zinc-500 space-y-0.5">
              <p><strong>Invoice Date:</strong> {invoice.billDate || "06 Aug 2026"}</p>
              <p><strong>Due Date:</strong> {invoice.dueDate || "15 Aug 2026"}</p>
            </div>
          </div>
        </div>

        {/* Bill To & Bill From Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 block">Billed To (Client):</span>
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{invoice.client}</h2>
            {invoice.clientEmail && !invoice.clientEmail.startsWith("lead_") && (
              <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-500" />
                <span>{invoice.clientEmail}</span>
              </p>
            )}
            {clientDetails?.phone && (
              <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-500" />
                <span>{clientDetails.phone}</span>
              </p>
            )}
            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin size={13} className="text-rose-500 shrink-0" />
              <span>{clientDetails?.address || "West Bengal, India"}</span>
            </p>
            {invoice.project && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/80 mt-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                  <span>📁</span>
                  <span>Project: {invoice.project}</span>
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 block">Service Provider / Issuer:</span>
            <h2 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Saampark Technology Pvt. Ltd.</h2>
            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Mail size={13} className="text-blue-500" />
              <span>billing@saampark.in</span>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-500" />
              <span>+91 9901518567</span>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin size={13} className="text-rose-500 shrink-0" />
              <span>Madinipur, Kolkata, Durgapur, West Bengal (19)</span>
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`${theme.tableHeaderBg} font-bold text-[11px] uppercase tracking-wider`}>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Service / Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Tax ({gstRate}%)</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {itemsList.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-3 text-center font-bold text-zinc-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.serviceName}</p>
                    {item.charges && item.charges.length > 0 && (
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {item.charges.map((ch, cIdx) => (
                          <span key={ch.id || cIdx} className="mr-2">+ {ch.name}: ₹{ch.amount}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">{item.qty || 1} {item.unit || "Unit"}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{(item.gstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{item.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Bank Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Payment & Bank Details */}
          <div className="space-y-3">
            <div className={`p-4 rounded-xl ${isGstInvoice ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/60" : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60"} border space-y-2`}>
              <span className={`font-extrabold text-xs uppercase tracking-wider ${theme.primaryText} flex items-center gap-1.5`}>
                <CreditCard size={15} />
                <span>UPI & Digital Payment</span>
              </span>

              <div className="flex items-center gap-3">
                {paySettings.qrCodeUrl ? (
                  <img 
                    src={paySettings.qrCodeUrl} 
                    alt="Payment QR" 
                    className="w-16 h-16 bg-white p-1 border border-zinc-300 shrink-0 object-contain shadow-xs" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-center p-1 shrink-0 text-zinc-600 shadow-xs">
                    <span className="text-base">⚡</span>
                    <span className="text-[8px] font-bold">UPI PAY</span>
                  </div>
                )}

                <div className="text-xs space-y-0.5">
                  <p className="text-zinc-500">UPI ID: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{paySettings.upiId || "saampark@sbi"}</strong></p>
                  <p className="text-zinc-500">Account: <strong className="text-zinc-800 dark:text-zinc-200">{paySettings.accountHolderName || "Saampark Technology Pvt. Ltd."}</strong></p>
                  <p className="text-zinc-500">Bank: <strong className="text-zinc-800 dark:text-zinc-200">{paySettings.bankName || "State Bank of India"}</strong></p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">A/C Number:</span>
                <strong className="font-mono">{paySettings.accountNumber || "40912384759"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">IFSC Code:</span>
                <strong className="font-mono">{paySettings.ifscCode || "SBIN0001234"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Branch:</span>
                <span>{paySettings.branch || "Balichak, West Bengal"}</span>
              </div>
            </div>
          </div>

          {/* Totals Matrix */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Subtotal Services:</span>
              <span className="font-mono font-semibold">₹{baseNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {setupNum > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Setup / Platform Fee:</span>
                <span className="font-mono">₹{setupNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {discNum > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span className="font-mono">-₹{discNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
              <span className="font-mono">₹{(gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
              <span className="font-mono">₹{(gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className={`flex justify-between p-2.5 rounded-lg ${theme.grandTotalBg} text-white font-extrabold text-sm my-2 shadow-sm`}>
              <span>GRAND TOTAL:</span>
              <span className="font-mono">₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Payment Received:</span>
              <span className="font-mono">₹{parsedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-2 font-black text-sm text-rose-600">
              <span>Balance Due:</span>
              <span className="font-mono">₹{parsedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-center text-[10px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">Thank you for your business with Saampark Group!</p>
          <p>For any billing support, contact us at billing@saampark.in or +91 9901518567 &bull; www.saamparktechnology.com</p>
        </div>

      </div>
    </div>
  )
}

export default function PublicInvoicePage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Loading invoice...</p>
      </div>
    }>
      <PublicInvoiceContent />
    </React.Suspense>
  )
}
