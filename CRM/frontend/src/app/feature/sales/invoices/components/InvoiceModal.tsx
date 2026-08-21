"use client"

import * as React from "react"
import { X, Printer, Send, Edit, CheckCircle2, AlertCircle, Building2, Phone, Mail, Globe, MapPin, FileText } from "lucide-react"
import { InvoiceItem } from "../services/invoiceService"

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

  if (!isOpen || !invoice) return null

  // Calculate numbers
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
  const isPending = invoice.status === "Payment Pending" || invoice.status === "Not paid"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <style flex-grow-0>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Action Header Bar (Hidden during print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Tax Invoice Preview
            </span>
            <span className="text-xs text-zinc-500 font-mono font-medium">{invoice.id}</span>
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
                <span>Edit Invoice</span>
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
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 bg-white text-zinc-900 font-sans leading-relaxed">
          
          {/* Top Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-zinc-900 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Company Logo" className="w-12 h-12 rounded-full object-cover border border-zinc-200 shadow-xs shrink-0" />
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 uppercase">
                    Saampark Technology & Research Pvt. Ltd.
                  </h1>
                  <p className="text-xs font-semibold text-blue-600 italic tracking-wider">
                    — Designing Tomorrow —
                  </p>
                </div>
              </div>

              <div className="pt-2 text-xs text-zinc-600 space-y-1">
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin size={13} className="text-zinc-500 shrink-0" />
                  Balichak Station Road, Medinipur 721124, West Bengal, India
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Phone size={13} className="text-zinc-500 shrink-0" />
                  +91 9091518567 / 9091518569 / 03222-464688
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Mail size={13} className="text-zinc-500 shrink-0" />
                  saamparktechnologyresearch@gmail.com
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Globe size={13} className="text-zinc-500 shrink-0" />
                  www.saamparktechnologyresearch.in | www.saampark.com
                </p>
              </div>
            </div>

            {/* Invoice Stamp Box */}
            <div className="text-right space-y-2 min-w-[200px]">
              <div className="inline-block px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-extrabold text-sm uppercase tracking-widest">
                TAX INVOICE
              </div>
              <p className="text-sm font-bold text-zinc-900">{invoice.id}</p>
              
              {/* Payment Status Badge Stamp */}
              <div className="pt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={14} /> PAID IN FULL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs uppercase tracking-wider">
                    <AlertCircle size={14} /> PAYMENT PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billed To & Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs border-b border-zinc-200 pb-6">
            <div className="space-y-1">
              <span className="font-extrabold uppercase tracking-wider text-zinc-400 text-[10px]">BILLED TO CLIENT</span>
              <h2 className="text-base font-bold text-zinc-900">{invoice.client}</h2>
              <p className="text-zinc-600 font-medium">Contact: {invoice.client}</p>
              {invoice.clientEmail && <p className="text-zinc-600 font-medium">Email: {invoice.clientEmail}</p>}
              <p className="text-zinc-600 font-medium">GSTIN: 19ABCDE1234F1Z5 (Client GST)</p>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="font-extrabold uppercase tracking-wider text-zinc-400 text-[10px]">INVOICE DETAILS</span>
              <p className="text-zinc-700 font-medium">Invoice Date: <strong className="text-zinc-900">{invoice.billDate}</strong></p>
              <p className="text-zinc-700 font-medium">Due Date: <strong className="text-zinc-900">{invoice.dueDate}</strong></p>
              <p className="text-zinc-700 font-medium">Billed By: <strong className="text-zinc-900">{invoice.billedBy || "System Admin"}</strong></p>
            </div>
          </div>

          {/* Financial Particulars Item Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">SERVICES & BREAKDOWN</h3>
            
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-y border-zinc-300 text-zinc-800 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Item Description / Service Scope</th>
                  <th className="py-3 px-4 text-right">Base Amount (₹)</th>
                  <th className="py-3 px-4 text-right">GST Rate</th>
                  <th className="py-3 px-4 text-right">GST Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium text-zinc-800">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-zinc-900 text-sm">{invoice.project}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Professional Technology Implementation, Software & Media Setup</p>
                  </td>
                  <td className="py-4 px-4 text-right">₹{baseNum.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-4 text-right">{gstRate}%</td>
                  <td className="py-4 px-4 text-right">₹{gstAmt.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-4 text-right font-bold">₹{totalVal.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Totals Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-zinc-200 pt-6">
            
            {/* Bank Details */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs max-w-sm">
              <p className="font-bold text-zinc-900 uppercase text-[11px] tracking-wider flex items-center gap-1">
                <Building2 size={13} /> BANK PAYMENT INFORMATION
              </p>
              <p className="text-zinc-700">Bank: <strong>State Bank of India</strong></p>
              <p className="text-zinc-700">Account Name: <strong>Saampark Technology & Research Pvt. Ltd.</strong></p>
              <p className="text-zinc-700 font-mono">Account No: <strong>40912384759</strong></p>
              <p className="text-zinc-700 font-mono">IFSC Code: <strong>SBIN0001234</strong></p>
            </div>

            {/* Total Sum Box */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-600">
                <span>Subtotal (Base):</span>
                <span className="font-semibold text-zinc-900">₹{baseNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-600">
                <span>Integrated GST ({gstRate}%):</span>
                <span className="font-semibold text-zinc-900">₹{gstAmt.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-extrabold text-blue-900 border-b-2 border-zinc-900">
                <span>Total Amount Due:</span>
                <span>₹{totalVal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature & Seal */}
          <div className="pt-8 border-t border-zinc-200 flex justify-between items-end text-xs text-zinc-500">
            <div>
              <p className="font-semibold text-zinc-700">Terms & Conditions:</p>
              <p className="text-[11px]">Payment due within 15 days of invoice date. Computer generated document, no physical signature required.</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-32 border-b border-zinc-400 mx-auto pb-6 text-zinc-400 italic text-[11px]">
                Authorized Signatory
              </div>
              <p className="font-bold text-zinc-800 text-[11px]">SAAMPARK Pvt. Ltd.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
