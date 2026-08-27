"use client"

import * as React from "react"
import { MapPin } from "lucide-react"
import { InvoiceItem, InvoiceLineItem } from "../services/invoiceService"
import { CompanyPaymentSettings } from "@/app/feature/settings/services/companyPaymentService"
import { ClientItem } from "@/app/feature/clients/types"

interface OfficialInvoiceDocumentProps {
  invoice: InvoiceItem
  clientDetails?: ClientItem | null
  paySettings?: CompanyPaymentSettings
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return "Zero Rupees Only"
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    const digit = n % 10
    return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "")
  }

  const str = ("000000000" + num).substr(-9)
  const crore = parseInt(str.substr(0, 2), 10)
  const lakh = parseInt(str.substr(2, 2), 10)
  const thousand = parseInt(str.substr(4, 2), 10)
  const hundred = parseInt(str.substr(6, 1), 10)
  const rest = parseInt(str.substr(7, 2), 10)

  let res = ""
  if (crore > 0) res += inWords(crore) + " Crore "
  if (lakh > 0) res += inWords(lakh) + " Lakh "
  if (thousand > 0) res += inWords(thousand) + " Thousand "
  if (hundred > 0) res += inWords(hundred) + " Hundred "
  if (rest > 0) {
    if (res !== "") res += "and "
    res += inWords(rest) + " "
  }

  return res.trim() + " Rupees Only"
}

export function OfficialInvoiceDocument({
  invoice,
  clientDetails,
  paySettings = {
    upiId: "saampark@sbi",
    accountHolderName: "Saampark Technology & Research Pvt. Ltd.",
    bankName: "State Bank of India",
    accountNumber: "40912384759",
    ifscCode: "SBIN0001234",
    branch: "Balichak Station Road",
    qrCodeUrl: "",
  },
}: OfficialInvoiceDocumentProps) {
  // 1. Determine if GST (>0%) or Non-GST / 0% GST Bill
  const hasItemGst = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items.some(it => (Number(it.gstRate) || 0) > 0 || (Number(it.gstAmount) || 0) > 0)
    : false

  const isGstInvoice = Boolean(
    hasItemGst ||
    (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
    (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0)
  )

  // Theme configuration based on GST vs Non-GST
  const theme = isGstInvoice
    ? {
        name: "gst-teal",
        headerGradient: "bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99]",
        cardHeaderGradient: "bg-gradient-to-br from-[#005f69] via-[#007380] to-[#008a99]",
        primaryBg: "bg-[#005f69]",
        primaryText: "text-[#005f69]",
        lightBg: "bg-cyan-50/60 dark:bg-cyan-950/30",
        lightBorder: "border-cyan-200/80 dark:border-cyan-800/60",
        tableHeaderBg: "bg-[#005f69] text-white",
        tableSubtotalBg: "bg-[#e0f7fa] text-[#005f69] dark:bg-[#005f69]/40 dark:text-cyan-300",
        grandTotalBg: "bg-[#005f69] text-white",
        badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-300",
        accentRing: "ring-[#005f69]",
        sealColor: "text-[#005f69] border-[#005f69]",
        invoiceTypeLabel: "TAX INVOICE",
      }
    : {
        name: "non-gst-light-blue",
        headerGradient: "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
        cardHeaderGradient: "bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
        primaryBg: "bg-[#0284c7]",
        primaryText: "text-[#0284c7]",
        lightBg: "bg-sky-50/70 dark:bg-sky-950/30",
        lightBorder: "border-sky-200/80 dark:border-sky-800/60",
        tableHeaderBg: "bg-[#0284c7] text-white",
        tableSubtotalBg: "bg-[#e0f2fe] text-[#0284c7] dark:bg-[#0284c7]/40 dark:text-sky-300",
        grandTotalBg: "bg-[#0284c7] text-white",
        badgeBg: "bg-sky-50 text-sky-800 border-sky-300",
        accentRing: "ring-[#0284c7]",
        sealColor: "text-[#0284c7] border-[#0284c7]",
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

  const gstAmt = isGstInvoice && taxableBase > 0
    ? (invoice.gstAmount !== undefined ? invoice.gstAmount : Math.round(taxableBase * (gstRate / 100)))
    : 0

  const cgstAmt = Math.round(gstAmt / 2)
  const sgstAmt = gstAmt - cgstAmt
  const totalVal = taxableBase + gstAmt

  const rawReceived = parseInt((invoice.paymentReceived || "0").replace(/[^0-9]/g, "")) || 0
  const parsedReceived = Math.min(rawReceived, totalVal)
  const parsedDue = invoice.due !== undefined 
    ? Math.min(parseInt(String(invoice.due).replace(/[^0-9]/g, "")) || 0, Math.max(0, totalVal - parsedReceived))
    : Math.max(0, totalVal - parsedReceived)

  const isFullyPaid = invoice.status === "Fully paid" || invoice.status === "Credited" || (parsedDue === 0 && parsedReceived > 0)
  const isPartPaid = invoice.status === "Partially paid" || (parsedReceived > 0 && parsedDue > 0)

  const statusBadgeText = isFullyPaid 
    ? "PAID IN FULL" 
    : isPartPaid 
    ? "PART PAID" 
    : "NOT PAID"

  // URLs and Direct-View QR Code
  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://saamparktechnology.com"
  const verifyInvoiceUrl = `${originUrl}/public/invoice?id=${encodeURIComponent(invoice.id)}`
  const verifyQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(verifyInvoiceUrl)}&margin=6&format=png`
  
  const customPaymentQrUrl = paySettings.qrCodeUrl && paySettings.qrCodeUrl.trim().length > 0
    ? paySettings.qrCodeUrl
    : null

  // Line items
  const finalRenderedRows = (invoice.items && invoice.items.length > 0)
    ? invoice.items.map((it, idx) => {
        const itemRate = typeof it.rate === "number" ? it.rate : 0
        const itemQty = it.qty > 0 ? it.qty : 1
        const itemCharges = it.charges ? it.charges.reduce((sum, c) => sum + (c.amount || 0), 0) : 0
        const rowBase = (itemRate * itemQty) + itemCharges
        const rowTax = isGstInvoice ? Math.round(rowBase * ((it.gstRate || gstRate) / 100)) : 0
        const rowTotal = it.totalAmount || (rowBase + rowTax)
        return {
          ...it,
          id: it.id || `row_${idx}`,
          serviceName: it.serviceName || invoice.project || "Enterprise Solutions",
          itemRate,
          itemQty,
          itemCharges,
          rowBase,
          rowTax,
          rowTotal,
        }
      })
    : [
        {
          id: "row_single_service",
          serviceName: invoice.project || "Custom Enterprise Consulting & Development",
          itemRate: baseNum,
          itemQty: 1,
          unit: "Project",
          itemCharges: setupCharge,
          charges: setupCharge > 0 ? [{ id: "c1", name: "Platform / Setup Fee", amount: setupCharge }] : [],
          gstRate: isGstInvoice ? gstRate : 0,
          rowBase: baseNum + setupCharge,
          rowTax: gstAmt,
          rowTotal: totalVal,
        }
      ]

  const totalTableQty = finalRenderedRows.reduce((sum, it) => sum + it.itemQty, 0)
  const totalTableBase = finalRenderedRows.reduce((sum, it) => sum + (it.itemRate * it.itemQty) + it.itemCharges, 0)
  const totalTableGst = finalRenderedRows.reduce((sum, it) => sum + it.rowTax, 0)
  const totalTableGross = finalRenderedRows.reduce((sum, it) => sum + it.rowTotal, 0)

  const isMultiPage = finalRenderedRows.length > 5
  const page1Items = isMultiPage ? finalRenderedRows.slice(0, 5) : finalRenderedRows
  const page2Items = isMultiPage ? finalRenderedRows.slice(5) : []

  const hasDue = parsedDue > 0

  const renderTopHeader = (pageNumber?: number) => (
    <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 border-b border-zinc-200 pb-3">
      {/* Left: Saampark Brand & Company Info with Large Crest Logo Badge */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={`w-28 h-24 p-2 rounded-tl-2xl rounded-tr-xs rounded-br-[32px] rounded-bl-xs ${theme.cardHeaderGradient} text-white flex items-center justify-center text-center shadow-md shrink-0 border border-white/20`}>
          <img 
            src="/saampark-logo.png" 
            alt="Saampark Logo" 
            className="w-20 h-20 object-contain drop-shadow-md brightness-110" 
          />
        </div>

        {/* Title, Subtitle, Legal IDs & Registered Office Coordinates */}
        <div className="space-y-1 flex-1 min-w-0 pt-0.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 leading-none">
              SAAMPARK TECHNOLOGY
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-700 tracking-wider uppercase mt-1">
              AND RESEARCH PRIVATE LIMITED
            </h2>
          </div>

          <p className="text-[10px] font-semibold text-zinc-600 font-mono pt-0.5">
            CIN: <span className="text-zinc-800 font-bold">U72900WB2024PTC271234</span>
            {isGstInvoice && (
              <> | GSTIN: <span className="text-zinc-900 font-black">19ABFCS1234D1ZS</span></>
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-zinc-700 pt-1">
            <div className="flex items-start gap-1.5">
              <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[8px] shrink-0 mt-0.5`}>📍</span>
              <div className="leading-snug">
                <strong className="text-zinc-900 block text-[9.5px]">Registered Office:</strong>
                <span className="text-zinc-600 text-[9px]">Madinipur, Kolkata, Durgapur, West Bengal, India - 721101</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[7px] shrink-0`}>📞</span>
                <span className="font-mono text-zinc-800 font-semibold text-[9px]">+91 9901518567 / +91 9901518569</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[7px] shrink-0`}>🌐</span>
                <span className="text-zinc-700 text-[9px]">www.saamparktechnology.com</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[7px] shrink-0`}>✉️</span>
                <span className="text-zinc-700 text-[9px]">info@saamparktechnology.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Curved Header Card with Status Badge & Details */}
      <div className={`w-full sm:w-56 rounded-2xl ${theme.cardHeaderGradient} text-white p-3 shadow-md shrink-0 flex flex-col justify-between`}>
        <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
          <span className="font-black text-xs tracking-wider uppercase">
            {theme.invoiceTypeLabel} {pageNumber ? `(P.${pageNumber}/2)` : ''}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
            isFullyPaid 
              ? "bg-white text-emerald-800" 
              : isPartPaid 
              ? "bg-white text-amber-800" 
              : "bg-white text-rose-800"
          }`}>
            {statusBadgeText}
          </span>
        </div>

        <div className="space-y-1.5 pt-2 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-white/80 flex items-center gap-1">
              <span>📄</span> INVOICE NO.
            </span>
            <strong className="font-mono text-white text-[11px]">{invoice.id}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 flex items-center gap-1">
              <span>📅</span> INVOICE DATE & TIME
            </span>
            <strong className="text-white font-mono text-[9.5px]">
              {invoice.billDate} {invoice.billTime ? `• ${invoice.billTime}` : (invoice.createdAt ? `• ${new Date(invoice.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}` : "")}
            </strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80 flex items-center gap-1">
              <span>📅</span> NEXT DUE DATE
            </span>
            <strong className="text-white font-mono">{hasDue ? (invoice.dueDate || "-") : "-"}</strong>
          </div>
        </div>
      </div>
    </div>
  )

  const renderInfoCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
      {/* Box 1: BILL TO (5 cols) */}
      <div className={`sm:col-span-5 p-3 rounded-2xl ${theme.lightBg} border ${theme.lightBorder} space-y-1 shadow-2xs`}>
        <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-zinc-700">
          <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[8px]`}>👤</span>
          <span>BILL TO</span>
        </div>
        <p className="font-black text-xs text-zinc-900 leading-tight">{invoice.client}</p>
        <p className="text-[10px] text-zinc-600 leading-tight">
          <strong>Address:</strong> {clientDetails?.address || (invoice.clientEmail ? `${clientDetails?.address || 'Corporate Center'}` : 'Head Office')}
        </p>
        <p className="text-[10px] text-zinc-600">
          <strong>State:</strong> {clientDetails?.state || 'West Bengal - 721101'}
        </p>
        {isGstInvoice && clientDetails?.gstNumber && (
          <p className="text-[9.5px] font-mono font-bold text-zinc-800">
            GSTIN: {clientDetails.gstNumber}
          </p>
        )}
        {invoice.project && (
          <div className="pt-1 border-t border-zinc-200/70 mt-1">
            <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
              <span>📁</span>
              <span>Project: {invoice.project}</span>
            </p>
          </div>
        )}
      </div>

      {/* Box 2: PLACE OF SUPPLY (4 cols) */}
      <div className={`sm:col-span-4 p-3 rounded-2xl ${theme.lightBg} border ${theme.lightBorder} space-y-1 shadow-2xs`}>
        <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-zinc-700">
          <span className={`w-4 h-4 rounded-full ${theme.primaryBg} text-white flex items-center justify-center text-[8px]`}>📍</span>
          <span>PLACE OF SUPPLY</span>
        </div>
        <p className="text-[10px] text-zinc-700">
          <strong>Ph No:</strong> {clientDetails?.phone || '+91 9901518567'}
        </p>
        <p className="text-[10px] text-zinc-600 leading-snug">
          Madinipur, Kolkata, Durgapur, West Bengal, India
        </p>
        <p className="text-[9.5px] font-semibold text-zinc-700">
          West Bengal (State Code: 19)
        </p>
      </div>

      {/* Box 3: SCAN TO DIRECTLY VIEW INVOICE (3 cols) */}
      <div className={`sm:col-span-3 p-2 rounded-2xl ${theme.lightBg} border ${theme.lightBorder} flex flex-col items-center justify-center text-center space-y-1 shadow-2xs`}>
        <span className="text-[9px] font-black tracking-wider uppercase text-zinc-700">
          SCAN TO VERIFY
        </span>
        <a 
          href={verifyInvoiceUrl} 
          target="_blank" 
          rel="noreferrer"
          className="cursor-pointer hover:opacity-90 transition-opacity p-0.5 bg-white border border-zinc-300 shadow-xs flex items-center justify-center"
          title="Scan to open digital invoice"
        >
          <img 
            src={verifyQrCodeUrl} 
            alt={`QR code for invoice ${invoice.id}`} 
            className="w-16 h-16 object-contain block bg-white" 
          />
        </a>
        <span className="text-[8.5px] font-mono font-bold text-zinc-600 truncate max-w-full">
          {invoice.id}
        </span>
      </div>
    </div>
  )

  const renderTable = (itemsList: typeof finalRenderedRows, startIndex: number, showSubtotal: boolean) => (
    <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className={`${theme.tableHeaderBg} font-bold text-[10.5px]`}>
            <th className="py-2 px-3 w-9 text-center">NO.</th>
            <th className="py-2 px-3">SERVICES / PRODUCT NAME</th>
            <th className="py-2 px-2.5 text-center">QTY</th>
            <th className="py-2 px-2.5 text-center">UNIT</th>
            <th className="py-2 px-3 text-right">RATE (₹)</th>
            <th className="py-2 px-3 text-right">TAX (₹)</th>
            <th className="py-2 px-3 text-right">AMOUNT (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white font-medium text-zinc-800">
          {itemsList.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-2.5 px-3 text-center font-bold text-zinc-500">{startIndex + idx + 1}</td>
              <td className="py-2.5 px-3">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-zinc-900 text-xs leading-tight">{item.serviceName}</p>
                  {item.charges && item.charges.length > 0 && (
                    <div className="space-y-0.5 pt-0.5">
                      {item.charges.map((chg: any) => (
                        <p key={chg.id} className="text-[9px] text-zinc-500 flex items-center gap-1">
                          <span>+ {chg.name}:</span>
                          <strong className="font-mono text-zinc-700">₹{(chg.amount || 0).toLocaleString("en-IN")}</strong>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-2.5 text-center font-mono text-[11px]">{item.itemQty}</td>
              <td className="py-2.5 px-2.5 text-center text-zinc-600 text-[11px]">{item.unit || "Service"}</td>
              <td className="py-2.5 px-3 text-right font-mono font-semibold">
                ₹{item.itemRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                {item.gstRate > 0 && item.rowTax > 0 ? (
                  <div>
                    <span>₹{item.rowTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span className="text-[8.5px] text-zinc-500 block">({item.gstRate}%)</span>
                  </div>
                ) : (
                  <span>₹0.00</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-black text-zinc-900">
                ₹{item.rowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
        {showSubtotal && (
          <tfoot>
            <tr className={`${theme.tableSubtotalBg} font-bold text-[10.5px] border-t border-zinc-200`}>
              <td colSpan={2} className="py-2 px-3 uppercase tracking-wider">
                SUBTOTAL SERVICES & BASE AMOUNT
              </td>
              <td className="py-2 px-2.5 text-center font-mono">{totalTableQty}</td>
              <td className="py-2 px-2.5 text-center">Items</td>
              <td className="py-2 px-3 text-right font-mono">
                ₹{totalTableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono">
                ₹{totalTableGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 text-right font-mono font-black">
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
      {/* TOTAL AMOUNT IN WORDS + TERMS & CONDITIONS (LEFT) & FINANCIAL BREAKDOWN (RIGHT) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
        {/* Left 6 Columns: Amount in Words & Terms */}
        <div className="sm:col-span-6 space-y-2">
          <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
            <span className="font-black text-[9.5px] uppercase tracking-wider text-zinc-600 flex items-center gap-1">
              <span>📝</span> TOTAL AMOUNT IN WORDS
            </span>
            <p className="font-bold text-zinc-900 italic text-[10.5px] leading-tight">
              {numberToIndianWords(totalVal)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1 shadow-2xs">
            <span className="font-black text-[10px] uppercase tracking-wider text-zinc-700 block border-b border-zinc-200 pb-1">
              TERMS & CONDITIONS
            </span>
            <ul className="space-y-1 text-[9px] text-zinc-700 font-medium leading-tight">
              <li className="flex items-start gap-1.5">
                <span className={`${theme.primaryText} font-bold`}>✔</span>
                <span>1. E.& O.E.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className={`${theme.primaryText} font-bold`}>✔</span>
                <span>2. Total payment due to be paid within due date to avoid suspension/cancellation.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className={`${theme.primaryText} font-bold`}>✔</span>
                <span>3. Please include the invoice number in your payment notes.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className={`${theme.primaryText} font-bold`}>✔</span>
                <span>4. All disputes are subject to Paschim Medinipur jurisdiction only.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className={`${theme.primaryText} font-bold`}>✔</span>
                <span>5. For payment & refund related queries, read our Refund & Return Policy on website.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right 6 Columns: Financial Computation Matrix */}
        <div className="sm:col-span-6 space-y-1 text-[10.5px]">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5 text-zinc-700 shadow-2xs">
            <div className="flex justify-between py-0.5">
              <span>Total Services Value</span>
              <span className="font-mono font-semibold">₹{baseNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Platform / Setup Charge</span>
              <span className="font-mono">₹{setupCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {invoice.discountsList && invoice.discountsList.length > 0 ? (
              invoice.discountsList.map((d: any) => (
                <div key={d.id} className="flex justify-between py-0.5 text-zinc-500">
                  <span>Less: {d.name}</span>
                  <span className="font-mono">(-) ₹{(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between py-0.5 text-zinc-500">
                <span>Less: Promotional Discount</span>
                <span className="font-mono">(-) ₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-t border-zinc-200 font-bold text-zinc-900">
              <span>Taxable Base Amount</span>
              <span className="font-mono">₹{taxableBase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {isGstInvoice && (
              <>
                <div className="flex justify-between py-0.5 text-zinc-600">
                  <span>CGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">₹{cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-0.5 text-zinc-600">
                  <span>SGST ({(gstRate / 2).toFixed(1)}%)</span>
                  <span className="font-mono">₹{sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}

            <div className={`flex justify-between p-2 rounded-lg ${theme.grandTotalBg} font-black text-xs tracking-wide my-1 shadow-xs`}>
              <span>GRAND TOTAL (NET PAYABLE)</span>
              <span className="font-mono text-sm">₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between py-0.5 text-emerald-700 font-bold">
              <span>Received Amount</span>
              <span className="font-mono">₹{parsedReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between py-0.5 text-zinc-500">
              <span>Previous Balance</span>
              <span className="font-mono">₹0.00</span>
            </div>

            <div className="flex justify-between py-1 border-t border-zinc-200 font-black text-[11px] text-rose-600">
              <span>Current Balance (Total Due)</span>
              <span className="font-mono">₹{parsedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between pt-0.5 text-[9.5px] text-zinc-500">
              <span>Next Due Date</span>
              <span className="font-mono font-bold text-zinc-800">{hasDue ? (invoice.dueDate || "-") : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT & BANK TRANSFER DETAILS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-1 shadow-2xs`}>
          <div className="flex items-center justify-between">
            <span className="font-black text-[10px] uppercase tracking-wider text-zinc-800 flex items-center gap-1">
              <span>📱</span> UPI & DIGITAL PAYMENT
            </span>
            <span className="text-[8.5px] font-bold text-emerald-700">Instant Settlement</span>
          </div>

          <div className="flex items-center gap-2.5">
            {customPaymentQrUrl ? (
              <img 
                src={customPaymentQrUrl} 
                alt="Payment QR Code" 
                className="w-14 h-14 bg-white p-1 border border-zinc-300 shrink-0 object-contain shadow-xs" 
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-white border border-zinc-200 flex flex-col items-center justify-center text-center p-0.5 shrink-0 text-zinc-500">
                <span className="text-sm">⚡</span>
                <span className="text-[7.5px] font-bold">UPI PAY</span>
              </div>
            )}
            
            <div className="space-y-0.5 text-[9px] flex-1">
              <div className="flex justify-between">
                <span className="text-zinc-600">UPI ID:</span>
                <strong className="font-mono text-zinc-900 font-bold">{paySettings.upiId || "saampark@sbi"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Account Holder:</span>
                <strong className="text-zinc-900 font-bold truncate max-w-[130px]">{paySettings.accountHolderName || "Saampark Technology Pvt. Ltd."}</strong>
              </div>
              <div className="flex items-center gap-1 flex-wrap pt-0.5 font-bold text-zinc-600 text-[8px]">
                <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">GPay</span>
                <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">PhonePe</span>
                <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">Paytm</span>
                <span className="px-1.5 py-0.2 rounded bg-white border border-zinc-200">BHIM UPI</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-xl ${theme.lightBg} border ${theme.lightBorder} space-y-0.5 shadow-2xs`}>
          <span className="font-black text-[10px] uppercase tracking-wider text-zinc-800 flex items-center gap-1">
            <span>🏛️</span> BANK DETAILS
          </span>
          <div className="space-y-0.5 text-[9px] text-zinc-700">
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

      {/* SIGNATURES & OFFICIAL SEAL ROW */}
      <div className="flex flex-row justify-between items-center gap-3 pt-2 border-t border-zinc-200">
        <div className="text-center space-y-0.5">
          <div className="h-6 flex items-end justify-center">
            <span className="font-serif italic text-zinc-500 text-xs">Customer Signature</span>
          </div>
          <div className="w-32 border-t border-zinc-400 pt-0.5">
            <p className="text-[8px] font-black uppercase text-zinc-600">CUSTOMER SIGNATURE</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-xl ${theme.lightBg} border ${theme.lightBorder} text-center space-y-0.5`}>
          <p className="font-extrabold text-[10.5px] text-zinc-900">
            💬 Thank you for your business!
          </p>
          <p className="text-[9px] text-zinc-500">
            We look forward to serving you again.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-center space-y-0.5">
            <div className="h-6 flex items-end justify-center">
              <span className="font-serif italic text-zinc-700 text-xs font-bold">Saampark Authorised</span>
            </div>
            <div className="w-32 border-t border-zinc-400 pt-0.5">
              <p className="text-[8px] font-black uppercase text-zinc-700">AUTHORISED SIGNATORY</p>
            </div>
          </div>

          <div className={`w-12 h-12 rounded-full border-2 border-dashed ${theme.sealColor} flex flex-col items-center justify-center text-center p-0.5 shadow-2xs shrink-0 select-none`}>
            <span className="text-[4.5px] font-black tracking-tighter uppercase leading-none">
              SAAMPARK TECH
            </span>
            <span className="text-[5.5px] font-black my-0.2">★ SEAL ★</span>
            <span className="text-[4.5px] font-bold tracking-tighter uppercase leading-none">
              AUTHORISED
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM BANNER */}
      <div className={`rounded-xl ${theme.headerGradient} text-white p-1.5 text-[8.5px] font-medium flex flex-wrap items-center justify-between gap-1 shadow-xs`}>
        <p className="flex items-center gap-1">
          <MapPin size={10} />
          <span>Madinipur • Kolkata • Durgapur • West Bengal (19)</span>
        </p>
        <p>
          For digital payment support: billing@saampark.in | +91 9901518567
        </p>
      </div>
    </>
  )

  return (
    <div id="printable-invoice" className="bg-white text-zinc-900 font-sans p-4 sm:p-5 text-xs shadow-xl border border-zinc-200 rounded-2xl w-full max-w-[840px] mx-auto print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none">
      {!isMultiPage ? (
        <div className="space-y-2.5">
          {renderTopHeader()}
          {renderInfoCards()}
          {renderTable(page1Items, 0, true)}
          {renderFinancialsAndFooter()}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2.5 page-break-after">
            {renderTopHeader(1)}
            {renderInfoCards()}
            {renderTable(page1Items, 0, false)}
          </div>
          <div className="space-y-2.5 pt-4">
            {renderTopHeader(2)}
            {renderTable(page2Items, 5, true)}
            {renderFinancialsAndFooter()}
          </div>
        </div>
      )}
    </div>
  )
}
