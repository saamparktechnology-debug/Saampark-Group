"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Building2, MapPin, Calendar, Mail, Phone, ShieldCheck, 
  Award, FileText, Download, Printer, Send, Sparkles, Check, 
  UserCheck, Briefcase, DollarSign, Clock, Shield, Globe, Plus, Trash2,
  Layers, ChevronRight, User, AlertCircle
} from "lucide-react"
import { UserItem } from "../types"
import { Company, Branch, SubBranch } from "@/app/feature/companies/types"

export const DEFAULT_ROLE_RESPONSIBILITIES: Record<string, string[]> = {
  "Software Engineer": [
    "Design, develop, test, and deploy high-performance web and enterprise applications.",
    "Collaborate with product designers and backend architects to deliver responsive user experiences.",
    "Maintain high code quality, test coverage, and participate in agile sprint reviews.",
    "Troubleshoot production incidents, optimize databases, and implement secure REST APIs."
  ],
  "Frontend Developer": [
    "Build responsive, modern web interfaces using React, Next.js, and TypeScript.",
    "Collaborate with UI/UX designers to translate wireframes into interactive, accessible components.",
    "Ensure cross-browser compatibility and maximize application rendering performance."
  ],
  "Backend Developer": [
    "Architect scalable microservices, RESTful APIs, and database schemas.",
    "Implement enterprise security protocols, JWT/OAuth authentication, and caching layers.",
    "Integrate payment gateways, third-party webhooks, and automated background workers."
  ],
  "UI/UX Designer": [
    "Create intuitive UI/UX design systems, wireframes, vector assets, and interactive prototypes.",
    "Produce high-impact marketing creatives, digital branding materials, and client collateral.",
    "Maintain consistent visual brand guidelines across all web, mobile, and print touchpoints."
  ],
  "Sales Manager": [
    "Identify, qualify, and convert enterprise client leads into long-term commercial contracts.",
    "Conduct solution demonstrations, prepare quotation proposals, and negotiate contract terms.",
    "Achieve monthly and quarterly revenue targets while managing the sales pipeline CRM."
  ],
  "Sales Executive": [
    "Engage prospective clients, generate outbound leads, and execute product walkthroughs.",
    "Prepare client estimates, follow up on pending invoices, and assist in customer onboarding.",
    "Maintain client relationship records and achieve assigned monthly conversion KPIs."
  ],
  "Operations Executive": [
    "Manage day-to-day administrative and branch operations in coordination with regional hubs.",
    "Ensure SLA adherence for customer deliverables and streamline operational workflows.",
    "Coordinate with procurement, vendors, and logistics to ensure seamless execution."
  ],
  "Accountant": [
    "Maintain general ledger accounts, process GST filings, reconciliation, and audit documentation.",
    "Generate accurate client tax invoices, track accounts receivable, and oversee vendor disbursements.",
    "Prepare monthly balance sheets, profit & loss summaries, and statutory compliance filings."
  ],
  "Branch Manager": [
    "Lead branch operations, team productivity, customer satisfaction, and revenue targets.",
    "Ensure full statutory and regulatory compliance with corporate policies and ISO standards.",
    "Supervise regional customer onboarding, key account management, and team performance appraisals."
  ],
  "Customer Support": [
    "Provide prompt, empathetic technical and billing support to enterprise clients.",
    "Log, escalate, and resolve customer tickets within defined service level agreements.",
    "Gather client feedback to help product teams improve system functionality and usability."
  ],
  "Digital Marketing Specialist": [
    "Execute SEO, SEM, social media, and multi-channel performance marketing campaigns.",
    "Analyze website traffic and lead acquisition metrics to optimize conversion rates.",
    "Create engaging content, email newsletters, and promotional campaigns for target audiences."
  ]
}

export function getPresetResponsibilities(designation?: string): string[] {
  if (!designation) return [
    "Execute assigned technical, operational, and commercial objectives in alignment with company goals.",
    "Collaborate across cross-functional teams to ensure high-quality, timely project deliverables.",
    "Adhere to organizational security protocols, coding guidelines, and standard operating procedures.",
    "Participate in team meetings, technical evaluations, and ongoing professional development."
  ]
  
  const lower = designation.toLowerCase()
  for (const [key, list] of Object.entries(DEFAULT_ROLE_RESPONSIBILITIES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return list
    }
  }

  if (lower.includes("develop") || lower.includes("program") || lower.includes("tech")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["Software Engineer"]
  }
  if (lower.includes("sale") || lower.includes("business") || lower.includes("bd")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["Sales Manager"]
  }
  if (lower.includes("design") || lower.includes("art") || lower.includes("ui") || lower.includes("ux")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["UI/UX Designer"]
  }
  if (lower.includes("account") || lower.includes("tax") || lower.includes("finance")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["Accountant"]
  }
  if (lower.includes("operat") || lower.includes("admin")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["Operations Executive"]
  }
  if (lower.includes("market")) {
    return DEFAULT_ROLE_RESPONSIBILITIES["Digital Marketing Specialist"]
  }

  return [
    `Execute core functions and responsibilities associated with the role of ${designation}.`,
    "Collaborate with senior management and team members to deliver exceptional business outcomes.",
    "Maintain strict adherence to quality standards, project milestones, and company operational policies.",
    "Represent the organization with professionalism, ethical integrity, and technical excellence."
  ]
}

export function EditableOfferText({
  value,
  onChange,
  className = "",
  placeholder = "",
  as = "span",
  interactive = true,
  multiline = false
}: {
  value?: string | null
  onChange?: (val: string) => void
  className?: string
  placeholder?: string
  as?: any
  interactive?: boolean
  multiline?: boolean
}) {
  const [internalVal, setInternalVal] = React.useState(value ?? "")

  React.useEffect(() => {
    setInternalVal(value ?? "")
  }, [value])

  if (!interactive) {
    const Component = as || "span"
    return <Component className={className}>{internalVal || placeholder}</Component>
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText.trim()
    setInternalVal(text)
    onChange?.(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const Component = as || "span"

  return (
    <Component
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-hidden transition-all duration-150 hover:bg-amber-100/60 focus:bg-amber-100 focus:ring-1 focus:ring-amber-500 rounded px-1 -mx-1 cursor-text ${className}`}
      title="Click to edit text directly"
    >
      {internalVal || placeholder}
    </Component>
  )
}

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
  monthlySalary?: string
  onMonthlySalaryChange?: (sal: string) => void
  department?: string
  onDepartmentChange?: (dept: string) => void
  reportingManager?: string
  onReportingManagerChange?: (mgr: string) => void
  probationPeriod?: string
  onProbationPeriodChange?: (prob: string) => void
  workingHours?: string
  onWorkingHoursChange?: (hrs: string) => void
  workMode?: string
  onWorkModeChange?: (mode: string) => void
  responsibilities?: string[]
  onResponsibilitiesChange?: (res: string[]) => void
  terms?: string[]
  onTermsChange?: (terms: string[]) => void
  onSendEmail?: () => void
  isSendingEmail?: boolean
  onFieldChange?: (field: string, val: string) => void
}

export function OfferLetterDocument({
  user,
  company,
  branch,
  subBranch,
  interactive = true,
  joiningDate: controlledJoiningDate,
  onJoiningDateChange,
  designation: controlledDesignation,
  onDesignationChange,
  ctc: controlledCtc,
  onCtcChange,
  monthlySalary: controlledMonthlySalary,
  onMonthlySalaryChange,
  department: controlledDepartment,
  onDepartmentChange,
  reportingManager: controlledReportingManager,
  onReportingManagerChange,
  probationPeriod: controlledProbationPeriod,
  onProbationPeriodChange,
  workingHours: controlledWorkingHours,
  onWorkingHoursChange,
  workMode: controlledWorkMode,
  onWorkModeChange,
  responsibilities: controlledResponsibilities,
  onResponsibilitiesChange,
  terms: controlledTerms,
  onTermsChange,
  onSendEmail,
  isSendingEmail = false,
  onFieldChange,
}: OfferLetterDocumentProps) {
  // Local Editable States
  const [localJoiningDate, setLocalJoiningDate] = React.useState(controlledJoiningDate || user.joinedDate || "2026-10-01")
  const [localDesignation, setLocalDesignation] = React.useState(controlledDesignation || user.designation || user.role || "Senior Executive")
  const [localCtc, setLocalCtc] = React.useState(controlledCtc || (user as any).ctc || "₹4,80,000 per Annum (INR 4.8 LPA)")
  const [localMonthlySalary, setLocalMonthlySalary] = React.useState(controlledMonthlySalary || "₹40,000 / Month (Gross)")
  const [localDepartment, setLocalDepartment] = React.useState(controlledDepartment || user.department || "Operations & Technology")
  const [localReportingManager, setLocalReportingManager] = React.useState(controlledReportingManager || "Department Head / Branch Director")
  const [localProbationPeriod, setLocalProbationPeriod] = React.useState(controlledProbationPeriod || "3 Months from Date of Joining")
  const [localWorkingHours, setLocalWorkingHours] = React.useState(controlledWorkingHours || "Monday – Saturday (9:30 AM to 6:30 PM)")
  const [localWorkMode, setLocalWorkMode] = React.useState(controlledWorkMode || "Full-time On-site")
  const [localResponsibilities, setLocalResponsibilities] = React.useState<string[]>(
    controlledResponsibilities || getPresetResponsibilities(controlledDesignation || user.designation || user.role)
  )
  const [localTerms, setLocalTerms] = React.useState<string[]>(
    controlledTerms || [
      "Confidentiality & Non-Disclosure: You agree to maintain strict confidentiality regarding all proprietary systems, client records, and commercial data of Saampark Group.",
      "Intellectual Property: All inventions, code, designs, documentation, and materials produced during your tenure shall remain the sole exclusive property of the company.",
      "Notice Period: Post confirmation of probation, either party may terminate this employment with thirty (30) days written notice or gross salary in lieu thereof.",
      "Code of Conduct & Compliance: Compliance with workplace policies, security protocols, and operational guidelines is a mandatory condition of employment."
    ]
  )

  // Synchronize when controlled props change
  React.useEffect(() => {
    if (controlledJoiningDate) setLocalJoiningDate(controlledJoiningDate)
  }, [controlledJoiningDate])

  React.useEffect(() => {
    if (controlledDesignation) {
      setLocalDesignation(controlledDesignation)
      if (!controlledResponsibilities) {
        setLocalResponsibilities(getPresetResponsibilities(controlledDesignation))
      }
    }
  }, [controlledDesignation])

  React.useEffect(() => {
    if (controlledCtc) setLocalCtc(controlledCtc)
  }, [controlledCtc])

  React.useEffect(() => {
    if (controlledMonthlySalary) setLocalMonthlySalary(controlledMonthlySalary)
  }, [controlledMonthlySalary])

  React.useEffect(() => {
    if (controlledDepartment) setLocalDepartment(controlledDepartment)
  }, [controlledDepartment])

  React.useEffect(() => {
    if (controlledResponsibilities) setLocalResponsibilities(controlledResponsibilities)
  }, [controlledResponsibilities])

  const empId = user.employeeId || `SP-EMP-${String(user.id).replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "1024"}`
  const fullCompanyName = company?.name || user.companyName || "SAAMPARK TECHNOLOGY PRIVATE LIMITED"
  const brandName = company?.brand_name || "SAAMPARK"
  const logoUrl = company?.logo_url || "/logo.png"
  const cin = company?.cin || "U72900WB2021PTC248901"
  const gstin = company?.gstin || "19ABCS1649D1ZY"
  const pan = company?.pan || "ABCS1649D"
  const companyAddress = company?.address || "Corporate Campus, Kolkata, West Bengal, India"
  const companyPhone = company?.phone || "+91 90915 18567"
  const companyEmail = company?.email || "careers@saampark.com"
  const companyWebsite = company?.website || "www.saampark.com"
  const isoCert = company?.iso_certification || "An ISO 9001:2015 Certified Company"

  const branchName = branch?.name || user.branchName || "Regional Operations Hub"
  const branchCity = branch?.city || branch?.state || "Kolkata"
  const subBranchName = subBranch?.name || user.subBranchName || (user as any).sub_branch_name

  const signatureUrl = company?.signature_image_url || branch?.signature_image_url
  const stampUrl = company?.stamp_image_url || branch?.stamp_image_url
  const signatoryName = company?.signatory_name || "Authorized Signatory"
  const signatoryDesignation = company?.signatory_designation || "Director & Head of Human Resources"

  const refNumber = `SP/HR/OL/${new Date().getFullYear()}/${empId}`
  const issueDateFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  // Handlers for dynamic Responsibilities
  const handleAddResponsibility = () => {
    const updated = [...localResponsibilities, "New assigned responsibility and project deliverable."]
    setLocalResponsibilities(updated)
    onResponsibilitiesChange?.(updated)
  }

  const handleUpdateResponsibility = (idx: number, text: string) => {
    const updated = [...localResponsibilities]
    updated[idx] = text
    setLocalResponsibilities(updated)
    onResponsibilitiesChange?.(updated)
  }

  const handleRemoveResponsibility = (idx: number) => {
    const updated = localResponsibilities.filter((_, i) => i !== idx)
    setLocalResponsibilities(updated)
    onResponsibilitiesChange?.(updated)
  }

  // Handlers for dynamic Terms
  const handleAddTerm = () => {
    const updated = [...localTerms, "Additional organizational clause or special incentive agreement."]
    setLocalTerms(updated)
    onTermsChange?.(updated)
  }

  const handleUpdateTerm = (idx: number, text: string) => {
    const updated = [...localTerms]
    updated[idx] = text
    setLocalTerms(updated)
    onTermsChange?.(updated)
  }

  const handleRemoveTerm = (idx: number) => {
    const updated = localTerms.filter((_, i) => i !== idx)
    setLocalTerms(updated)
    onTermsChange?.(updated)
  }

  const handleResetResponsibilitiesToPreset = () => {
    const preset = getPresetResponsibilities(localDesignation)
    setLocalResponsibilities(preset)
    onResponsibilitiesChange?.(preset)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Top Action Bar (Hides in Print) */}
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <FileText size={16} className="text-primary" />
          <span>Interactive Offer Letter Studio</span>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200">
            Click any text on the letter to edit live
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleResetResponsibilitiesToPreset}
            className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Auto-fill responsibilities based on designation"
          >
            <Sparkles size={12} className="text-amber-500" />
            <span>Load Role Presets</span>
          </button>

          {onSendEmail && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={isSendingEmail}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send size={13} className={isSendingEmail ? "animate-spin" : ""} />
              <span>{isSendingEmail ? "Dispatching..." : "Send Offer in Email"}</span>
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
        className="a4-page bg-white text-zinc-900 font-sans p-7 sm:p-9 shadow-2xl border border-zinc-200/90 rounded-2xl w-full max-w-[800px] min-h-[1120px] mx-auto relative flex flex-col justify-between gap-4 select-text print:w-[210mm] print:max-w-[210mm] print:p-[10mm_12mm] print:shadow-none print:border-none print:rounded-none page-break-after"
      >
        {/* TOP CORPORATE HEADER */}
        <div className="border-b-2 border-teal-800 pb-3 flex flex-col sm:flex-row justify-between items-start gap-4">
          {/* Company Brand & Legal Details */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-0.5 bg-transparent border-0 shadow-none">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="max-w-full max-h-full object-contain pointer-events-none bg-transparent" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#005f69] to-[#008a99] text-white font-black text-xl flex items-center justify-center rounded-xl">
                  {brandName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 uppercase font-sans leading-tight">
                <EditableOfferText
                  value={fullCompanyName}
                  onChange={(val) => onFieldChange?.("company_name", val)}
                  interactive={interactive}
                />
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[8.5px] font-black uppercase tracking-wider">
                <Award size={10} className="text-amber-600" />
                <EditableOfferText
                  value={isoCert}
                  onChange={(val) => onFieldChange?.("iso_cert", val)}
                  interactive={interactive}
                />
              </div>
              <p className="text-[9px] font-mono text-zinc-500 pt-0.5">
                CIN: <strong>{cin}</strong> | GSTIN: <strong>{gstin}</strong> | PAN: <strong>{pan}</strong>
              </p>
              <p className="text-[8.5px] text-zinc-600 leading-tight">
                <EditableOfferText
                  value={`${companyAddress} • Tel: ${companyPhone} • Web: ${companyWebsite}`}
                  interactive={interactive}
                />
              </p>
            </div>
          </div>

          {/* Reference & Date Card */}
          <div className="text-right shrink-0 bg-teal-50/70 p-2.5 rounded-xl border border-teal-200/80 text-[9px] space-y-0.5">
            <div>
              <span className="text-zinc-500 font-semibold">Ref No:</span>{" "}
              <strong className="font-mono text-teal-950 font-bold">
                <EditableOfferText value={refNumber} interactive={interactive} />
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold">Issue Date:</span>{" "}
              <strong className="font-mono text-zinc-900">
                <EditableOfferText value={issueDateFormatted} interactive={interactive} />
              </strong>
            </div>
            <div className="pt-0.5 text-[8px] font-bold text-teal-700 uppercase">
              CONFIDENTIAL / PRIVATE
            </div>
          </div>
        </div>

        {/* CANDIDATE ADDRESS BLOCK & SUBJECT */}
        <div className="space-y-2.5 pt-1">
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[10px] space-y-0.5">
            <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 block">TO:</span>
            <h2 className="text-sm font-black text-zinc-950 uppercase">
              <EditableOfferText
                value={user.name}
                onChange={(val) => onFieldChange?.("name", val)}
                interactive={interactive}
              />
            </h2>
            <p className="text-zinc-600">
              <strong>Employee ID:</strong> <span className="font-mono font-bold text-zinc-800">{empId}</span> | 
              <strong> Email:</strong> {user.email} {user.phone ? `| Tel: ${user.phone}` : ""}
            </p>
            {user.address && (
              <p className="text-zinc-600">
                <strong>Address:</strong>{" "}
                <EditableOfferText
                  value={user.address}
                  onChange={(val) => onFieldChange?.("address", val)}
                  interactive={interactive}
                />
              </p>
            )}
          </div>

          {/* Subject Banner */}
          <div className="bg-gradient-to-r from-[#005f69] to-[#008a99] text-white p-2 rounded-xl text-center shadow-xs">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
              <EditableOfferText
                value="SUBJECT: FORMAL OFFER OF EMPLOYMENT & APPOINTMENT LETTER"
                interactive={interactive}
              />
            </h3>
          </div>
        </div>

        {/* LETTER BODY */}
        <div className="space-y-3 text-[10.5px] sm:text-[11px] text-zinc-800 leading-relaxed">
          <p>
            Dear{" "}
            <strong>
              <EditableOfferText value={user.name} interactive={interactive} />
            </strong>
            ,
          </p>
          <p>
            On behalf of <strong>{fullCompanyName}</strong>, we are delighted to offer you the position of{" "}
            <strong className="text-teal-900 underline font-black">
              <EditableOfferText
                value={localDesignation}
                onChange={(val) => {
                  setLocalDesignation(val)
                  onDesignationChange?.(val)
                }}
                interactive={interactive}
              />
            </strong>{" "}
            in our{" "}
            <strong>
              <EditableOfferText
                value={localDepartment}
                onChange={(val) => {
                  setLocalDepartment(val)
                  onDepartmentChange?.(val)
                }}
                interactive={interactive}
              />
            </strong>{" "}
            department.
          </p>
          <p>
            Your scheduled commencement and formal date of joining is confirmed as{" "}
            <strong className="font-mono bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-teal-950 font-bold">
              <EditableOfferText
                value={localJoiningDate}
                onChange={(val) => {
                  setLocalJoiningDate(val)
                  onJoiningDateChange?.(val)
                }}
                interactive={interactive}
              />
            </strong>
            . You will be operating from our{" "}
            <strong>
              <EditableOfferText
                value={`${branchName}${subBranchName ? ` (${subBranchName} Franchise Unit)` : ""} - ${branchCity}`}
                interactive={interactive}
              />
            </strong>
            .
          </p>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1: APPOINTMENT & OFFER SALARY DETAILS
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-2xs my-2">
            <div className="bg-teal-900 text-white px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider flex items-center justify-between">
              <span>POSITION &amp; OFFER SALARY DETAILS</span>
              <span className="font-mono text-teal-200">{empId}</span>
            </div>
            <table className="w-full text-left text-[10px] border-collapse bg-white">
              <tbody className="divide-y divide-zinc-200">
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700 w-1/2">Appointed Designation &amp; Role</td>
                  <td className="py-2 px-3 font-bold text-zinc-950 text-right">
                    <EditableOfferText
                      value={localDesignation}
                      onChange={(val) => {
                        setLocalDesignation(val)
                        onDesignationChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Total Annual Cost to Company (CTC)</td>
                  <td className="py-2 px-3 font-bold font-mono text-teal-950 text-right">
                    <EditableOfferText
                      value={localCtc}
                      onChange={(val) => {
                        setLocalCtc(val)
                        onCtcChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Monthly Compensation (Gross)</td>
                  <td className="py-2 px-3 font-medium font-mono text-zinc-900 text-right">
                    <EditableOfferText
                      value={localMonthlySalary}
                      onChange={(val) => {
                        setLocalMonthlySalary(val)
                        onMonthlySalaryChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Reporting Authority &amp; Lead</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">
                    <EditableOfferText
                      value={localReportingManager}
                      onChange={(val) => {
                        setLocalReportingManager(val)
                        onReportingManagerChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Probationary Period</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">
                    <EditableOfferText
                      value={localProbationPeriod}
                      onChange={(val) => {
                        setLocalProbationPeriod(val)
                        onProbationPeriodChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Work Mode &amp; Operating Hub</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">
                    <EditableOfferText
                      value={`${localWorkMode} (${branchName})`}
                      onChange={(val) => {
                        setLocalWorkMode(val)
                        onWorkModeChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3 font-semibold text-zinc-700">Working Hours &amp; Schedule</td>
                  <td className="py-2 px-3 font-medium text-zinc-900 text-right">
                    <EditableOfferText
                      value={localWorkingHours}
                      onChange={(val) => {
                        setLocalWorkingHours(val)
                        onWorkingHoursChange?.(val)
                      }}
                      interactive={interactive}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: KEY ROLES & RESPONSIBILITIES AS PER DESIGNATION
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-1.5 text-[9.5px] text-zinc-800 bg-teal-50/40 p-3 rounded-xl border border-teal-200/70">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-teal-950 uppercase text-[9.5px] tracking-wider flex items-center gap-1.5">
                <Briefcase size={12} className="text-teal-700" />
                <span>KEY ROLES &amp; RESPONSIBILITIES ({localDesignation.toUpperCase()}):</span>
              </h4>
              {interactive && (
                <button
                  type="button"
                  onClick={handleAddResponsibility}
                  className="print:hidden text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-300 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus size={10} /> Add Duty
                </button>
              )}
            </div>
            <ul className="space-y-1.5 pt-1">
              {localResponsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-700 shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <EditableOfferText
                      value={resp}
                      onChange={(val) => handleUpdateResponsibility(idx, val)}
                      interactive={interactive}
                      multiline
                    />
                  </div>
                  {interactive && localResponsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(idx)}
                      className="print:hidden opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition-opacity"
                      title="Remove item"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 3: CORE TERMS & CONDITIONS
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-1.5 text-[9.5px] text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-zinc-900 uppercase text-[9.5px] tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-zinc-600" />
                <span>KEY TERMS OF ENGAGEMENT &amp; EMPLOYMENT:</span>
              </h4>
              {interactive && (
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="print:hidden text-[9px] font-bold text-zinc-600 hover:text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-300 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus size={10} /> Add Clause
                </button>
              )}
            </div>
            <ul className="space-y-1.5 pt-1">
              {localTerms.map((clause, idx) => (
                <li key={idx} className="flex items-start gap-2 group leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0 mt-1.5" />
                  <div className="flex-1">
                    <EditableOfferText
                      value={clause}
                      onChange={(val) => handleUpdateTerm(idx, val)}
                      interactive={interactive}
                      multiline
                    />
                  </div>
                  {interactive && localTerms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="print:hidden opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition-opacity"
                      title="Remove clause"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <p className="pt-1">
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
              <strong className="text-[9px] font-black uppercase text-zinc-900 block">
                <EditableOfferText value={signatoryName} interactive={interactive} />
              </strong>
              <span className="text-[7.5px] text-zinc-500 font-medium block">
                <EditableOfferText value={signatoryDesignation} interactive={interactive} />
              </span>
            </div>
          </div>

          {/* Center: Corporate Seal / Stamp (Only shown when stamp image is provided) */}
          <div className="shrink-0 text-center">
            {stampUrl ? (
              <div className="w-20 h-20 flex items-center justify-center p-0.5 bg-transparent border-0 shadow-none">
                <img src={stampUrl} alt="Official Stamp" className="max-h-20 max-w-20 object-contain drop-shadow-xs bg-transparent" />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 pointer-events-none" />
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
              <strong className="text-[9px] font-black uppercase text-zinc-900 block">
                <EditableOfferText value={user.name} interactive={interactive} />
              </strong>
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
