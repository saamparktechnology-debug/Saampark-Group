"use client"

import * as React from "react"
import { X, Printer, Send, Edit, CheckCircle2, AlertCircle, Building2, Phone, Mail, Globe, MapPin, ShieldCheck, QrCode } from "lucide-react"
import { InvoiceItem } from "../services/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings, DEFAULT_COMPANY_PAYMENT_SETTINGS } from "@/app/feature/settings/services/companyPaymentService"
import { getProjects } from "@/app/feature/projects/services/projectService"
import { Project } from "@/app/feature/projects/types"

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
  const [paySettings, setPaySettings] = React.useState<CompanyPaymentSettings>(DEFAULT_COMPANY_PAYMENT_SETTINGS)
  const [linkedProject, setLinkedProject] = React.useState<Project | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      getCompanyPaymentSettings().then((res) => {
        if (res) setPaySettings(res)
      }).catch(() => {})

      if (invoice) {
        getProjects().then((projs) => {
          const match = projs.find(
            (p) =>
              p.title.toLowerCase().trim() === invoice.project.toLowerCase().trim() ||
              (invoice.client && p.client.toLowerCase().trim() === invoice.client.toLowerCase().trim())
          )
          setLinkedProject(match || null)
        }).catch(() => {})
      }
    }
  }, [isOpen, invoice])

  if (!isOpen || !invoice) return null

  // Calculate numbers accurately
  const baseNum = invoice.baseAmount || 50000
  const gstRate = invoice.gstRate || 18
  const gstAmt = invoice.gstAmount || Math.round(baseNum * (gstRate / 100))
  const totalVal = baseNum + gstAmt

  const handlePrint = () => {
    window.print()
  }

  const handleSend = () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      setSentSuccess(true)
      if (onSendToClient) onSendToClient(invoice)
      setTimeout(() => setSentSuccess(false), 3000)
    }, 1000)
  }

  const isPaid = invoice.status === "Fully paid" || invoice.status === "Credited"

  return (
    <div className="fixed inset-0 top-14 sm:top-0 z-[99999] flex items-start sm:items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 15px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[86vh] sm:max-h-[95vh] my-auto print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Action Header Bar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
              Official Tax Invoice
            </span>
            <span className="text-xs text-zinc-500 font-mono font-bold">{invoice.id}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Send size={14} />
              <span>{isSending ? "Sending..." : sentSuccess ? "Dispatched ✓" : "Send to Client"}</span>
            </button>

            {onEditInvoice && (
              <button
                type="button"
                onClick={() => onEditInvoice(invoice)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <Printer size={14} />
              <span>Print / Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-white text-zinc-900 font-sans leading-relaxed">
          
          {/* Top Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-zinc-900 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                <img src="/logo.png" alt="Saampark Logo" className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-900 shadow-md shrink-0" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 uppercase">
                    Saampark Technology & Research Pvt. Ltd.
                  </h1>
                  <p className="text-xs font-extrabold text-blue-600 tracking-widest uppercase">
                    — Designing Tomorrow —
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] sm:text-xs text-zinc-600 space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  <MapPin size={13} className="text-blue-600 shrink-0" />
                  Balichak Station Road, Medinipur 721124, West Bengal, India
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <Phone size={13} className="text-blue-600 shrink-0" />
                  +91 9091518567 / 9091518569 / 03222-464688
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <Mail size={13} className="text-blue-600 shrink-0" />
                  saamparktechnologyresearch@gmail.com
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <Globe size={13} className="text-blue-600 shrink-0" />
                  www.saamparktechnologyresearch.in | www.saampark.com
                </p>
              </div>
            </div>

            {/* Tax Invoice Stamp Box */}
            <div className="text-left sm:text-right space-y-2 shrink-0">
              <div className="inline-block px-4 py-1.5 rounded-xl bg-zinc-900 text-white font-black text-xs uppercase tracking-widest shadow-sm">
                TAX INVOICE
              </div>
              <p className="text-base font-extrabold text-zinc-900 font-mono">{invoice.id}</p>
              
              {/* Payment Status Badge Stamp */}
              <div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-400 font-black text-xs uppercase tracking-wider shadow-xs">
                    <CheckCircle2 size={14} /> PAID IN FULL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-400 font-black text-xs uppercase tracking-wider shadow-xs">
                    <AlertCircle size={14} /> PAYMENT PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billed To & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-zinc-200 pb-6">
            <div className="space-y-1.5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <span className="font-black uppercase tracking-wider text-blue-600 text-[10px]">BILLED TO CLIENT</span>
              <h2 className="text-base font-bold text-zinc-900">{invoice.client}</h2>
              <p className="text-zinc-600 font-medium">Primary Contact: {invoice.client}</p>
              {invoice.clientEmail && <p className="text-zinc-600 font-medium">Email: {invoice.clientEmail}</p>}
              <p className="text-zinc-600 font-medium">GSTIN: 19ABCDE1234F1Z5</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 sm:text-right">
              <span className="font-black uppercase tracking-wider text-blue-600 text-[10px]">INVOICE METADATA</span>
              <p className="text-zinc-700 font-medium">Bill Date: <strong className="text-zinc-900 font-bold">{invoice.billDate}</strong></p>
              <p className="text-zinc-700 font-medium">Due Date: <strong className="text-zinc-900 font-bold">{invoice.dueDate}</strong></p>
              <p className="text-zinc-700 font-medium">Billed By: <strong className="text-zinc-900 font-bold">{invoice.billedBy || "System Admin"}</strong></p>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">ITEMIZED SCOPE & SERVICES</h3>
            
            <div className="overflow-x-auto rounded-2xl border border-zinc-300 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Service Description</th>
                    <th className="py-3.5 px-4 text-right">Base Amount (₹)</th>
                    <th className="py-3.5 px-4 text-right">GST Rate</th>
                    <th className="py-3.5 px-4 text-right">GST Tax Amount (₹)</th>
                    <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium text-zinc-800 bg-white">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-bold text-zinc-900 text-sm">{invoice.project}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Enterprise Technology Solution, Media Setup & Support</p>
                      {linkedProject?.members && linkedProject.members.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-zinc-400 font-semibold">Assigned Team:</span>
                          {linkedProject.members.map((m) => (
                            <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                              👤 {m.name} ({m.role || "Dev"})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">₹{baseNum.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-4 text-right">{gstRate}%</td>
                    <td className="py-4 px-4 text-right">₹{gstAmt.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-4 text-right font-extrabold text-zinc-900">₹{totalVal.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Live Developer Delivery Checkpoints */}
            {linkedProject?.milestones && linkedProject.milestones.length > 0 && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                    Live Project Delivery Checkpoints & Milestones:
                  </span>
                  <span className="text-[10px] font-bold text-blue-700">
                    Progress: {linkedProject.progress}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {linkedProject.milestones.map((ms) => (
                    <div key={ms.id} className="p-2 rounded-lg bg-white border border-zinc-200 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-800">{ms.title}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          ms.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {ms.status}
                        </span>
                      </div>
                      {ms.notes && <p className="text-[10px] text-zinc-500 truncate">{ms.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Totals & Bank Details Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-t border-zinc-200 pt-6">
            
            {/* Bank Payment Information & QR Code */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs w-full lg:flex-1">
              <div className="flex items-center justify-between">
                <p className="font-black text-blue-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-700" /> OFFICIAL BANK & PAYMENT DETAILS
                </p>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Scan / Transfer
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Payment QR Code Box */}
                {paySettings.qrCodeUrl ? (
                  <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-blue-200 shadow-2xs shrink-0">
                    <img 
                      src={paySettings.qrCodeUrl} 
                      alt="UPI Payment QR Code" 
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-lg"
                    />
                    <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-tighter flex items-center gap-0.5">
                      <QrCode size={10} /> Scan & Pay UPI
                    </span>
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-blue-100/60 border border-dashed border-blue-300 flex flex-col items-center justify-center text-center p-2 shrink-0 text-blue-500">
                    <QrCode size={24} className="mb-1 opacity-70" />
                    <span className="text-[9px] font-semibold leading-tight">UPI QR Code Configured in Settings</span>
                  </div>
                )}

                {/* Bank Account Fields */}
                <div className="space-y-1.5 text-blue-950 font-medium text-[11px] flex-1">
                  <p>Bank: <strong className="text-blue-900 font-bold">{paySettings.bankName || "State Bank of India"}</strong></p>
                  <p>Account Name: <strong className="text-blue-900 font-bold">{paySettings.accountHolderName || "Saampark Technology & Research Pvt. Ltd."}</strong></p>
                  <p className="font-mono">Account No: <strong className="text-blue-900 font-bold tracking-wider text-xs">{paySettings.accountNumber || "40912384759"}</strong></p>
                  <p className="font-mono">IFSC Code: <strong className="text-blue-900 font-bold tracking-wider text-xs">{paySettings.ifscCode || "SBIN0001234"}</strong></p>
                  <p className="font-mono">UPI ID: <strong className="text-blue-700 font-bold text-xs bg-white px-1.5 py-0.5 rounded border border-blue-200">{paySettings.upiId || "saampark@sbi"}</strong></p>
                  {paySettings.branch && <p className="text-[10px] text-blue-800/80">Branch: {paySettings.branch}</p>}
                </div>
              </div>

              {paySettings.notes && (
                <p className="text-[10px] text-blue-800/70 border-t border-blue-200/60 pt-2 italic">
                  💡 {paySettings.notes}
                </p>
              )}
            </div>

            {/* Total Summary Box with Advance/Received & Due Breakdown */}
            <div className="w-full lg:w-84 p-4 rounded-2xl bg-zinc-900 text-white space-y-2 text-xs shadow-md shrink-0">
              <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
                <span>Subtotal Base:</span>
                <span className="font-bold text-white">₹{baseNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800 text-zinc-400">
                <span>Integrated GST ({gstRate}%):</span>
                <span className="font-bold text-white">₹{gstAmt.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold text-white border-b border-zinc-800">
                <span>Total Invoice Amount:</span>
                <span>₹{totalVal.toLocaleString("en-IN")}</span>
              </div>
              
              {/* Advance / Paid Amount */}
              <div className="flex justify-between py-1 text-emerald-400 font-semibold border-b border-zinc-800">
                <span>Advance / Received:</span>
                <span>{invoice.paymentReceived || (isPaid ? `₹${totalVal.toLocaleString("en-IN")}` : "₹0")}</span>
              </div>

              {/* Net Balance Due */}
              <div className="flex justify-between py-2 text-base font-black text-amber-400 border-t border-zinc-700">
                <span>Balance Due:</span>
                <span>{invoice.due || (isPaid ? "₹0" : `₹${totalVal.toLocaleString("en-IN")}`)}</span>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-400">
                <span>Payment Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  isPaid ? "bg-emerald-500/20 text-emerald-300" : invoice.status === "Partially paid" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="pt-8 border-t-2 border-zinc-900 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-zinc-600">
            <div className="space-y-1 max-w-md">
              <p className="font-bold text-zinc-900 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-600" /> Terms & Digital Certification
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-500">
                This document is a certified digital tax invoice issued by Saampark Technology & Research Pvt. Ltd. Payment is due within 15 days of issuance.
              </p>
            </div>

            <div className="text-center space-y-2 shrink-0">
              <div className="w-40 border-b border-zinc-900 pb-8 text-zinc-400 italic text-[10px]">
                Authorized Stamp & Signature
              </div>
              <p className="font-black text-zinc-900 text-xs">Saampark Technology & Research</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
