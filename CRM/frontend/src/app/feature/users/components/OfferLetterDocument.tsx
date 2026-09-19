"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Building2, MapPin, Calendar, Mail, Phone, ShieldCheck, 
  Award, FileText, Download, Printer, Send, Sparkles, Check, 
  UserCheck, Briefcase, DollarSign, Clock, Shield, Globe
} from "lucide-react"
import { UserItem } from "../types"
import { Company, Branch, SubBranch } from "@/app/feature/companies/types"
import { EditableText } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"

interface OfferLetterDocumentProps {
  user: UserItem
  company?: any
  branch?: any
  subBranch?: any
  interactive?: boolean
  joiningDate?: string
  onJoiningDateChange?: (date: string) => void
  designation?: string
  onDesignationChange?: (desig: string) => void
  ctc?: string
  onCtcChange?: (ctc: string) => void
  onSendEmail?: () => void
  isSendingEmail?: boolean
  onFieldChange?: (field: string, val: string) => void
}

export function OfferLetterDocument({
  user,
  company,
  branch,
  subBranch,
  interactive = false,
  joiningDate: controlledJoiningDate,
  onJoiningDateChange,
  designation: controlledDesignation,
  onDesignationChange,
  ctc: controlledCtc,
  onCtcChange,
  onSendEmail,
  isSendingEmail = false,
  onFieldChange,
}: OfferLetterDocumentProps) {
  const [localJoiningDate, setLocalJoiningDate] = React.useState(controlledJoiningDate || user.joinedDate || "2024-06-15")
  const [localDesignation, setLocalDesignation] = React.useState(controlledDesignation || user.designation || user.role || "Technical Specialist")
  const [localCtc, setLocalCtc] = React.useState(controlledCtc || user.ctc || "₹4,80,000 per Annum (INR 4.8 LPA)")
  const [stampScale, setStampScale] = React.useState(1)
  const [stampPos, setStampPos] = React.useState({ x: 0, y: 0 })
  const [signatureScale, setSignatureScale] = React.useState(1)
  const [signaturePos, setSignaturePos] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    if (controlledJoiningDate) setLocalJoiningDate(controlledJoiningDate)
  }, [controlledJoiningDate])

  React.useEffect(() => {
    if (controlledDesignation) setLocalDesignation(controlledDesignation)
  }, [controlledDesignation])

  React.useEffect(() => {
    if (controlledCtc) setLocalCtc(controlledCtc)
  }, [controlledCtc])

  const empId = user.employeeId || `SP-EMP-${String(user.id).replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "1024"}`
  const fullCompanyName = company?.name || user.companyName || "SAAMPARK TECHNOLOGY PRIVATE LIMITED"
  const brandName = company?.brand_name || "SAAMPARK"
  const divisionName = company?.division_name || "TECHNOLOGY"
  const logoUrl = company?.logo_url || "/logo.png"
  const cin = company?.cin || "U72900WB2021PTC248901"
  const gstin = company?.gstin || "19ABCS1649D1ZY"
  const pan = company?.pan || "ABCS1649D"
  const companyAddress = company?.address || "Corporate Campus, Kolkata, West Bengal, India"
  const companyPhone = company?.phone || "+91 90915 18567"
  const companyEmail = company?.email || "careers@saampark.com"
  const companyWebsite = company?.website || "www.saampark.com"
  const isoCert = company?.iso_certification || "An ISO 9001:2015 Certified Company"

  const branchName = branch?.name || user.branchName || "Regional Operational Branch"
  const branchCity = branch?.city || branch?.state || "West Bengal"
  const subBranchName = subBranch?.name || user.subBranchName || user.sub_branch_name
  const partnerName = subBranch?.partner_name || (subBranch as any)?.partnerName

  const signatureUrl = company?.signature_image_url || branch?.signature_image_url
  const stampUrl = company?.stamp_image_url || branch?.stamp_image_url
  const signatoryName = company?.signatory_name || "Authorized Signatory"
  const signatoryDesignation = company?.signatory_designation || "Director & Head of Human Resources"

  const refNumber = `SP/HR/OL/${new Date().getFullYear()}/${empId}`
  const issueDateFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Top Action Bar (Hides in Print) */}
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <FileText size={15} className="text-primary" />
          <span>Official Executive Offer &amp; Appointment Letter</span>
        </div>

        {/* Quick Joining Date & CTC Editor */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface-hover px-2.5 py-1 rounded-xl border border-border text-xs">
            <Calendar size={13} className="text-primary" />
            <span className="text-muted-foreground text-[11px] font-semibold">Joining Date:</span>
            <input
              type="date"
              value={localJoiningDate}
              onChange={(e) => {
                setLocalJoiningDate(e.target.value)
                onJoiningDateChange?.(e.target.value)
              }}
              className="bg-surface px-2 py-0.5 rounded text-xs font-bold text-foreground border border-border focus:outline-hidden cursor-pointer"
            />
          </div>

          {onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={isSendingEmail}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send size={13} className={isSendingEmail ? "animate-spin" : ""} />
              <span>{isSendingEmail ? "Dispatching..." : "Send Offer via Email"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer size={13} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Letterhead Document Container */}
      <div 
        id="printable-offer-letter"
        className="a4-page bg-white text-zinc-900 font-sans p-7 sm:p-9 shadow-2xl border border-zinc-200/90 rounded-2xl w-full max-w-[800px] min-h-[1100px] mx-auto relative flex flex-col justify-between gap-4 select-text print:w-[210mm] print:max-w-[210mm] print:p-[10mm_12mm] print:shadow-none print:border-none print:rounded-none page-break-after"
      >
        {/* TOP CORPORATE HEADER */}
        <div className="border-b-2 border-teal-800 pb-3 flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Company Brand & Legal Details */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 bg-white p-1.5 shadow-xs shrink-0 flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#005f69] to-[#008a99] text-white font-black text-xl flex items-center justify-center rounded-xl">
                  {brandName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 uppercase font-sans leading-tight">
                {fullCompanyName}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[8.5px] font-black uppercase tracking-wider">
                <Award size={10} className="text-amber-600" />
                <span>{isoCert}</span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 pt-0.5">
                CIN: <strong>{cin}</strong> | GSTIN: <strong>{gstin}</strong> | PAN: <strong>{pan}</strong>
              </p>
              <p className="text-[8.5px] text-zinc-600 leading-tight">
                {companyAddress} • Tel: {companyPhone} • Web: {companyWebsite}
              </p>
            </div>
          </div>

          {/* Reference & Date Card */}
          <div className="text-right shrink-0 bg-teal-50/70 p-2.5 rounded-xl border border-teal-200/80 text-[9px] space-y-0.5">
            <div>
              <span className="text-zinc-500 font-semibold">Ref No:</span>{" "}
              <strong className="font-mono text-teal-950 font-bold">{refNumber}</strong>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold">Issue Date:</span>{" "}
              <strong className="font-mono text-zinc-900">{issueDateFormatted}</strong>
            </div>
            <div className="pt-0.5 text-[8px] font-bold text-teal-700 uppercase">
              CONFIDENTIAL / PRIVATE
            </div>
          </div>
        </div>

        {/* CANDIDATE ADDRESS BLOCK & SUBJECT */}
        <div className="space-y-3 pt-1">
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[10px] space-y-0.5">
            <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 block">TO:</span>
            <h2 className="text-sm font-black text-zinc-950 uppercase">{user.name}</h2>
            <p className="text-zinc-600">
              <strong>Employee ID:</strong> <span className="font-mono font-bold text-zinc-800">{empId}</span> | 
              <strong> Email:</strong> {user.email} {user.phone ? `| Tel: ${user.phone}` : ""}
            </p>
            {user.address && (
              <p className="text-zinc-600"><strong>Address:</strong> {user.address}</p>
            )}
          </div>

          {/* Subject Banner */}
          <div className="bg-gradient-to-r from-[#005f69] to-[#008a99] text-white p-2 rounded-xl text-center shadow-xs">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
              SUBJECT: FORMAL OFFER OF EMPLOYMENT &amp; APPOINTMENT LETTER
            </h3>
          </div>
        </div>

        {/* LETTER BODY */}
        <div className="space-y-3 text-[10.5px] sm:text-[11px] text-zinc-800 leading-relaxed">
          <p>
            Dear <strong>{user.name}</strong>,
          </p>
          <p>
            On behalf of <strong>{fullCompanyName}</strong>, we are delighted to offer you the position of{" "}
            <strong className="text-teal-900 underline font-black">{localDesignation}</strong> in our{" "}
            <strong>{user.department || "Enterprise Solutions"}</strong> department.
          </p>
          <p>
            Your scheduled commencement and formal date of joining is confirmed as{" "}
            <strong className="font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-teal-950 font-bold">
              {localJoiningDate}
            </strong>
            . You will be operating from our{" "}
            <strong>{branchName}</strong>
            {subBranchName ? ` (${subBranchName} Franchise Unit)` : ""} location.
          </p>

          {/* COMPENSATION & BENEFITS MATRIX */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-2xs my-2">
            <div className="bg-teal-900 text-white px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider flex items-center justify-between">
              <span>COMPENSATION &amp; REMUNERATION STRUCTURE</span>
              <span className="font-mono text-teal-200">{empId}</span>
            </div>
            <table className="w-full text-left text-[10px] border-collapse bg-white">
              <tbody className="divide-y divide-zinc-200">
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700 w-1/2">Total Annual Cost to Company (CTC)</td>
                  <td className="py-2 px-3 font-bold font-mono text-teal-950 text-right">{localCtc}</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Probationary Term</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">3 Months from Date of Joining</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Operating Branch Hub</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">{branchName}</td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Performance &amp; Increment Review</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">Annual Performance Appraisal Cycle</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CORE TERMS & CONDITIONS */}
          <div className="space-y-1.5 text-[9.5px] text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <h4 className="font-black text-zinc-900 uppercase text-[9.5px] tracking-wider">
              KEY TERMS OF ENGAGEMENT &amp; EMPLOYMENT:
            </h4>
            <ul className="list-disc pl-4 space-y-1 leading-snug">
              <li>
                <strong>Confidentiality &amp; NDA:</strong> You agree to maintain strict confidentiality regarding all proprietary software, client records, business data, and financial transactions of Saampark Group.
              </li>
              <li>
                <strong>Intellectual Property:</strong> All inventions, source code, designs, and content created during the tenure of employment shall remain the sole property of {fullCompanyName}.
              </li>
              <li>
                <strong>Notice Period:</strong> Following successful probation, either party may terminate employment with thirty (30) days written notice or salary in lieu thereof.
              </li>
              <li>
                <strong>Code of Conduct:</strong> Compliance with enterprise policies, workplace guidelines, and standard operating protocols is mandatory.
              </li>
            </ul>
          </div>

          <p>
            Please sign and return the duplicate copy of this letter as formal confirmation of your acceptance of this offer.
            We look forward to welcoming you to the Saampark Group family!
          </p>
        </div>

        {/* SIGNATURES & OFFICIAL SEAL SECTION */}
        <div className="pt-3 border-t border-zinc-200 flex flex-row items-end justify-between gap-4 mt-auto">
          {/* Left: Company Authorized Signatory */}
          <div className="text-left space-y-1 min-w-[180px]">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">
              FOR {fullCompanyName}
            </p>
            <div className="h-12 flex items-center justify-start">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" className="max-h-12 max-w-[150px] object-contain pointer-events-none" />
              ) : (
                <span className="font-serif italic font-extrabold text-base text-zinc-900">
                  {signatoryName}
                </span>
              )}
            </div>
            <div className="border-t-2 border-zinc-400 pt-0.5">
              <strong className="text-[9px] font-black uppercase text-zinc-900 block">{signatoryName}</strong>
              <span className="text-[7.5px] text-zinc-500 font-medium block">{signatoryDesignation}</span>
            </div>
          </div>

          {/* Center: Corporate Seal / Stamp */}
          <div className="shrink-0 text-center">
            {stampUrl ? (
              <div className="w-20 h-20 flex items-center justify-center p-0.5">
                <img src={stampUrl} alt="Official Stamp" className="max-h-20 max-w-20 object-contain drop-shadow-xs" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-teal-700 flex flex-col items-center justify-center p-1 text-center bg-white shadow-2xs rotate-[-6deg]">
                <div className="text-[6.5px] font-black uppercase text-zinc-900 truncate max-w-[55px]">{brandName}</div>
                <div className="w-full border-t border-zinc-300 my-0.5" />
                <div className="text-[5.5px] font-black text-teal-800 tracking-wider">★ OFFICIAL SEAL ★</div>
                <div className="text-[4.5px] font-bold text-zinc-500 mt-0.5">VERIFIED</div>
              </div>
            )}
          </div>

          {/* Right: Candidate Acceptance Signature */}
          <div className="text-right space-y-1 min-w-[180px]">
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">
              CANDIDATE ACCEPTANCE
            </p>
            <div className="h-12 flex items-end justify-end">
              {/* Space for physical or digital signing */}
            </div>
            <div className="border-t-2 border-zinc-400 pt-0.5">
              <strong className="text-[9px] font-black uppercase text-zinc-900 block">{user.name}</strong>
              <span className="text-[7.5px] text-zinc-500 font-medium block">Signature &amp; Date</span>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BANNER */}
        <div className="bg-gradient-to-r from-[#005f69] to-[#008a99] text-white p-2 rounded-xl text-[8px] font-medium flex items-center justify-between shadow-xs">
          <p className="flex items-center gap-1">
            <Building2 size={10} />
            <span>{fullCompanyName} • Corporate HR Division</span>
          </p>
          <span className="font-mono text-teal-200">
            Regd Office: Kolkata • West Bengal • India
          </span>
        </div>
      </div>
    </div>
  )
}
