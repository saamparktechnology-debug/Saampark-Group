"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Printer, Send, CheckCircle2, Building2, CreditCard, 
  ShieldCheck, RefreshCw, Calendar, FileText, QrCode, Landmark, Stamp, Sparkles
} from "lucide-react"
import { useAuthStore, getCompanyLogoUrl, DEFAULT_COMPANIES } from "@/store/useAuthStore"
import { numberToIndianWords } from "@/app/feature/quotations/components/OfficialQuotationDocument"

export interface RenewReceiptData {
  receiptNumber: string
  date: string
  subscriptionId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  planName: string
  billingCycle: string
  periodStart: string
  periodEnd: string
  baseAmount: number
  taxAmount: number
  totalAmount: number
  isNonGst?: boolean
  paymentMethod: string
  transactionRef?: string
  companyId?: string
}

interface RenewReceiptModalProps {
  isOpen: boolean
  receipt: RenewReceiptData | null
  onClose: () => void
  onSendEmail?: (receipt: RenewReceiptData) => Promise<void>
}

export function RenewReceiptModal({
  isOpen,
  receipt,
  onClose,
  onSendEmail,
}: RenewReceiptModalProps) {
  const { companies, branches, activeCompanyId } = useAuthStore()
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null)

  // Resolve issuing company
  const activeCompany = React.useMemo(() => {
    if (!receipt) return companies[0] || DEFAULT_COMPANIES[0]
    const targetCompId = String(receipt.companyId || activeCompanyId || "tech").toLowerCase().trim()
    const matched = companies.find(c => {
      const cId = c.id.toLowerCase().trim()
      const cSlug = (c.slug || "").toLowerCase().trim()
      return cId === targetCompId || cSlug === targetCompId
    })
    return matched || companies[0] || DEFAULT_COMPANIES[0]
  }, [receipt, activeCompanyId, companies])

  if (!isOpen || !receipt) return null

  const brandName = activeCompany?.brand_name || activeCompany?.name || "SAAMPARK GROUP"
  const logoUrl = getCompanyLogoUrl(activeCompany) || activeCompany?.logo_url

  const handlePrint = () => {
    window.print()
  }

  const handleSend = async () => {
    if (!onSendEmail) return
    setIsSendingEmail(true)
    setEmailStatus(null)
    try {
      await onSendEmail(receipt)
      setEmailStatus("✅ Receipt email dispatched to client successfully!")
    } catch (err: any) {
      setEmailStatus("❌ Failed to send receipt: " + (err?.message || "Unknown error"))
    } finally {
      setIsSendingEmail(false)
    }
  }

  const qrData = `SAAMPARK-RENEWAL-RECEIPT:${receipt.receiptNumber}|CLIENT:${receipt.clientName}|AMOUNT:INR${receipt.totalAmount}|DATE:${receipt.date}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&ecc=M&data=${encodeURIComponent(qrData)}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-4 sm:my-8 print:border-none print:shadow-none print:my-0 print:max-w-none print:w-full print:rounded-none"
        >
          {/* Action Header (Hidden in Print) */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <RefreshCw size={16} />
              </div>
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">Official Renewal Receipt</span>
                <span className="font-mono text-[11px] text-teal-300 font-bold">{receipt.receiptNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>

              {onSendEmail && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSendingEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{isSendingEmail ? "Sending..." : "Send to Client"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {emailStatus && (
            <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold print:hidden">
              {emailStatus}
            </div>
          )}

          {/* Printable Receipt Paper */}
          <div className="p-6 sm:p-10 space-y-6 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 print:p-6 print:text-black">
            
            {/* 1. Header: Brand, Legal IDs, Receipt Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-zinc-900 pb-5">
              <div className="flex items-start gap-3.5">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-16 max-w-[140px] object-contain shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shrink-0">
                    🏢
                  </div>
                )}
                <div className="space-y-0.5">
                  <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white print:text-black">
                    {brandName}
                  </h1>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    {activeCompany?.division_name || "Enterprise Digital Solutions & Subscriptions"}
                  </p>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 print:text-zinc-700 max-w-sm leading-tight">
                    {activeCompany?.address || "Corporate Office, West Bengal, India"}
                  </p>
                  {(activeCompany?.gstin || activeCompany?.pan) && (
                    <p className="text-[9.5px] font-mono font-bold text-zinc-500 pt-0.5">
                      {activeCompany.gstin && <span>GSTIN: <strong>{activeCompany.gstin}</strong> </span>}
                      {activeCompany.pan && <span>| PAN: <strong>{activeCompany.pan}</strong></span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Receipt Status Badge & Meta */}
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>PAYMENT RECEIVED &amp; RENEWED</span>
                </div>
                <div className="pt-1">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">RECEIPT NUMBER</span>
                  <span className="font-mono font-black text-sm text-zinc-900 dark:text-zinc-100 print:text-black">{receipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">RECEIPT DATE</span>
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 print:text-black font-semibold">{receipt.date}</span>
                </div>
              </div>
            </div>

            {/* 2. Customer & Payment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Info */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Subscriber / Client</span>
                <h3 className="font-black text-sm text-zinc-950 dark:text-white print:text-black">{receipt.clientName}</h3>
                {receipt.clientEmail && <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{receipt.clientEmail}</p>}
                {receipt.clientPhone && <p className="text-xs text-zinc-500">{receipt.clientPhone}</p>}
                {receipt.clientAddress && <p className="text-[11px] text-zinc-500 leading-snug">{receipt.clientAddress}</p>}
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">Payment Summary</span>
                <div className="flex justify-between"><span className="text-zinc-500">Payment Mode:</span> <strong className="text-zinc-900 dark:text-zinc-100 print:text-black">{receipt.paymentMethod}</strong></div>
                {receipt.transactionRef && (
                  <div className="flex justify-between"><span className="text-zinc-500">Txn / Ref ID:</span> <strong className="font-mono text-zinc-900 dark:text-zinc-100 print:text-black">{receipt.transactionRef}</strong></div>
                )}
                <div className="flex justify-between"><span className="text-zinc-500">Billing Cycle:</span> <strong className="text-zinc-900 dark:text-zinc-100 print:text-black">{receipt.billingCycle}</strong></div>
                <div className="flex justify-between"><span className="text-zinc-500">Renewal Term:</span> <strong className="font-mono text-teal-700 dark:text-teal-400 print:text-black">{receipt.periodStart} to {receipt.periodEnd}</strong></div>
              </div>
            </div>

            {/* 3. Subscription Line Items Table */}
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-800 text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-4">Subscription Plan &amp; Service Coverage</th>
                    <th className="py-2.5 px-3 text-center">Cycle</th>
                    <th className="py-2.5 px-3 text-right">Tax Scheme</th>
                    <th className="py-2.5 px-4 text-right">Paid Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200 print:text-black">
                  <tr>
                    <td className="py-3 px-3 text-center font-mono text-zinc-400">1</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-950 dark:text-white print:text-black">{receipt.planName}</div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Contract renewal period: <strong>{receipt.periodStart}</strong> to <strong>{receipt.periodEnd}</strong>
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{receipt.billingCycle}</td>
                    <td className="py-3 px-3 text-right font-medium">
                      {receipt.isNonGst ? (
                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 text-[10px] font-bold">Commercial 0%</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 text-[10px] font-bold">GST 18%</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-950 dark:text-white print:text-black">
                      ₹{receipt.totalAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Words & Calculations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-1">
              <div className="sm:col-span-7 space-y-3">
                {/* Words */}
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 block mb-0.5">
                    Amount Received in Words:
                  </span>
                  <p className="font-serif italic font-bold text-teal-950 dark:text-teal-200 print:text-black text-sm">
                    {numberToIndianWords(receipt.totalAmount)}
                  </p>
                </div>

                {/* Verification QR */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                  <img src={qrUrl} alt="Verify QR" className="w-16 h-16 border border-zinc-200 rounded p-1 bg-white shrink-0" />
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block uppercase">Digitally Certified Receipt</span>
                    <span>Scan with any QR scanner to verify authentic receipt generation under Saampark Group Centralized Billing Registry.</span>
                  </div>
                </div>
              </div>

              {/* Calculations Right Column */}
              <div className="sm:col-span-5 space-y-2 text-xs">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Base Amount:</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">₹{receipt.baseAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {!receipt.isNonGst && (
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>GST (18%):</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">₹{receipt.taxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-teal-600 pt-2 flex justify-between items-center text-sm font-black text-zinc-950 dark:text-white print:text-black">
                    <span className="uppercase text-xs tracking-wide">Net Paid:</span>
                    <span className="text-base text-teal-700 dark:text-teal-400 font-mono font-black print:text-black">₹{receipt.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Official Stamp & Signatory Box */}
            <div className="pt-6 border-t-2 border-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div className="text-[10px] text-zinc-500 space-y-1">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">Terms &amp; Certification</span>
                <p>1. This official computer-generated receipt confirms renewal payment for the specified contract term.</p>
                <p>2. Subscription services will continue without interruption through {receipt.periodEnd}.</p>
                <p>3. Queries regarding this receipt can be directed to corporate accounts at {activeCompany?.email || "info@saamparktechnology.com"}.</p>
              </div>

              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 flex flex-col items-center justify-center text-center">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 mb-2">
                  For {brandName}
                </div>
                {activeCompany?.signature_image_url ? (
                  <img src={activeCompany.signature_image_url} alt="Signature" className="h-12 object-contain my-1" />
                ) : (
                  <div className="h-10 flex items-center justify-center italic font-serif text-zinc-400 text-xs">
                    [Digitally Authorized &amp; Stamped]
                  </div>
                )}
                <div className="border-t border-zinc-300 dark:border-zinc-700 pt-1 w-full text-center">
                  <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 print:text-black">{activeCompany?.signatory_name || "Authorized Signatory"}</p>
                  <p className="text-[9.5px] text-zinc-500">{activeCompany?.signatory_designation || "Managing Director"}</p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
