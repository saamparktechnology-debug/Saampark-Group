"use client"

import { useAuthStore, Company, Branch, SubBranch } from "@/store/useAuthStore"

export interface ExportScopeInfo {
  // Company
  name: string
  brandName?: string
  divisionName?: string
  subtitle?: string
  logoUrl?: string
  logo?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  gstin?: string
  cin?: string
  pan?: string
  currency?: string
  currencySymbol?: string

  // Branch
  branchId?: string
  branchName?: string
  branchCode?: string
  branchCity?: string
  branchAddress?: string
  branchPhone?: string
  branchEmail?: string
  branchManager?: string
  branchGstin?: string
  branchPan?: string
  branchBankName?: string
  branchAccountNumber?: string
  branchIfsc?: string
  branchUpiId?: string

  // Sub-Branch
  subBranchId?: string
  subBranchName?: string
  subBranchCode?: string
  subBranchPartner?: string
  subBranchPhone?: string
  subBranchEmail?: string
  subBranchCity?: string
  subBranchAddress?: string
  subBranchPartnerType?: string
  subBranchRevenueSharePct?: number

  // Scoped formatted summaries
  companyDisplay: string
  branchDisplay?: string
  subBranchDisplay?: string
}

export interface ExcelExportOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  company?: Partial<Company> | string
  branch?: Partial<Branch> | string
  subBranch?: Partial<SubBranch> | string
}

export interface PDFPrintOptions {
  title: string
  subtitle?: string
  metaItems?: { label: string; value: string | number }[]
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  landscape?: boolean
  company?: Partial<Company> | string
  branch?: Partial<Branch> | string
  subBranch?: Partial<SubBranch> | string
}

export interface CSVExportOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  company?: Partial<Company> | string
  branch?: Partial<Branch> | string
  subBranch?: Partial<SubBranch> | string
}

/**
 * Dynamically resolves active Company, Branch, and Sub-Branch information from useAuthStore or overrides.
 */
export function resolveExportScope(
  customCompany?: Partial<Company> | string,
  customBranch?: Partial<Branch> | string,
  customSubBranch?: Partial<SubBranch> | string
): ExportScopeInfo {
  let matchedComp: Company | undefined
  let matchedBranch: Branch | undefined
  let matchedSubBranch: SubBranch | undefined

  try {
    const store = useAuthStore.getState()
    const activeCompanyId = store.activeCompanyId
    const companies = store.companies || []
    const activeBranchId = store.activeBranchId
    const branches = store.branches || []
    const activeSubBranchId = store.activeSubBranchId
    const subBranches = store.subBranches || []
    const user = store.user

    // 1. Resolve Company
    if (customCompany && typeof customCompany === "object") {
      matchedComp = customCompany as Company
    } else if (typeof customCompany === "string" && customCompany.trim() && customCompany !== "all") {
      const q = customCompany.toLowerCase().trim()
      matchedComp = companies.find(
        (c) =>
          String(c.id).toLowerCase() === q ||
          String(c.slug || "").toLowerCase() === q ||
          String(c.name).toLowerCase() === q
      )
    }

    if (!matchedComp && activeCompanyId && activeCompanyId !== "all") {
      const q = String(activeCompanyId).toLowerCase().trim()
      matchedComp = companies.find(
        (c) => String(c.id).toLowerCase() === q || String(c.slug || "").toLowerCase() === q
      )
    }

    if (!matchedComp && companies.length > 0) {
      matchedComp = companies[0]
    }

    // 2. Resolve Branch
    if (customBranch && typeof customBranch === "object") {
      matchedBranch = customBranch as Branch
    } else if (typeof customBranch === "string" && customBranch.trim() && customBranch !== "all") {
      const q = customBranch.toLowerCase().trim()
      matchedBranch = branches.find(
        (b) =>
          String(b.id).toLowerCase() === q ||
          String(b.code || "").toLowerCase() === q ||
          String(b.name).toLowerCase() === q
      )
    }

    if (!matchedBranch && activeBranchId && activeBranchId !== "all") {
      const q = String(activeBranchId).toLowerCase().trim()
      matchedBranch = branches.find(
        (b) => String(b.id).toLowerCase() === q || String(b.code || "").toLowerCase() === q
      )
    }

    // Fallback to user assigned branch if available
    if (!matchedBranch && user?.branchId) {
      const q = String(user.branchId).toLowerCase().trim()
      matchedBranch = branches.find(
        (b) => String(b.id).toLowerCase() === q || String(b.code || "").toLowerCase() === q
      )
    }

    // 3. Resolve Sub-Branch
    if (customSubBranch && typeof customSubBranch === "object") {
      matchedSubBranch = customSubBranch as SubBranch
    } else if (typeof customSubBranch === "string" && customSubBranch.trim() && customSubBranch !== "all") {
      const q = customSubBranch.toLowerCase().trim()
      matchedSubBranch = subBranches.find(
        (sb) =>
          String(sb.id).toLowerCase() === q ||
          String(sb.code || "").toLowerCase() === q ||
          String(sb.name).toLowerCase() === q
      )
    }

    if (!matchedSubBranch && activeSubBranchId && activeSubBranchId !== "all") {
      const q = String(activeSubBranchId).toLowerCase().trim()
      matchedSubBranch = subBranches.find(
        (sb) => String(sb.id).toLowerCase() === q || String(sb.code || "").toLowerCase() === q
      )
    }
  } catch {}

  const brand = matchedComp?.brand_name || (matchedComp?.name ? matchedComp.name.split(" ")[0] : "SAAMPARK")
  const division = matchedComp?.division_name || (matchedComp?.name ? matchedComp.name.split(" ").slice(1).join(" ") : "")
  
  const fullAddress = [
    matchedComp?.address,
    matchedComp?.city,
    matchedComp?.state ? `${matchedComp.state}${matchedComp.zip ? ` - ${matchedComp.zip}` : ""}` : matchedComp?.zip,
    matchedComp?.country,
  ]
    .filter(Boolean)
    .join(", ")

  const compName = matchedComp?.name || [brand, division].filter(Boolean).join(" ") || "SAAMPARK GROUP"

  let branchDisplay: string | undefined
  if (matchedBranch) {
    const bCode = matchedBranch.code ? ` (${matchedBranch.code})` : ""
    const bCity = matchedBranch.city ? ` • ${matchedBranch.city}` : ""
    const bManager = matchedBranch.managerName ? ` • Manager: ${matchedBranch.managerName}` : ""
    branchDisplay = `📍 Operating Branch: ${matchedBranch.name}${bCode}${bCity}${bManager}`
  }

  let subBranchDisplay: string | undefined
  if (matchedSubBranch) {
    const sbCode = matchedSubBranch.code ? ` (${matchedSubBranch.code})` : ""
    const sbPartner = matchedSubBranch.partnerName ? ` • Partner: ${matchedSubBranch.partnerName}` : ""
    const sbPhone = matchedSubBranch.partnerPhone ? ` (${matchedSubBranch.partnerPhone})` : ""
    const sbShare = matchedSubBranch.revenueSharePct ? ` • ${matchedSubBranch.revenueSharePct}% Rev Share` : ""
    subBranchDisplay = `🌿 Sub-Branch Partner: ${matchedSubBranch.name}${sbCode}${sbPartner}${sbPhone}${sbShare}`
  }

  return {
    name: compName,
    brandName: brand,
    divisionName: division,
    subtitle: matchedComp?.subtitle,
    logoUrl: matchedComp?.logo_url,
    logo: matchedComp?.logo || "🏢",
    address: fullAddress || matchedComp?.address,
    city: matchedComp?.city,
    state: matchedComp?.state,
    zip: matchedComp?.zip,
    country: matchedComp?.country,
    phone: matchedComp?.phone,
    email: matchedComp?.email,
    website: matchedComp?.website,
    gstin: matchedComp?.gstin,
    cin: matchedComp?.cin,
    pan: matchedComp?.pan,
    currency: matchedComp?.currency || "INR",
    currencySymbol: matchedComp?.currency_symbol || "₹",

    // Branch
    branchId: matchedBranch?.id,
    branchName: matchedBranch?.name,
    branchCode: matchedBranch?.code,
    branchCity: matchedBranch?.city,
    branchAddress: matchedBranch?.address,
    branchPhone: matchedBranch?.phone,
    branchEmail: matchedBranch?.email,
    branchManager: matchedBranch?.managerName,
    branchGstin: (matchedBranch as any)?.gstin,
    branchPan: (matchedBranch as any)?.pan,
    branchBankName: (matchedBranch as any)?.bank_name,
    branchAccountNumber: (matchedBranch as any)?.account_number,
    branchIfsc: (matchedBranch as any)?.ifsc_code,
    branchUpiId: (matchedBranch as any)?.upi_id,

    // Sub-Branch
    subBranchId: matchedSubBranch?.id,
    subBranchName: matchedSubBranch?.name,
    subBranchCode: matchedSubBranch?.code,
    subBranchPartner: matchedSubBranch?.partnerName,
    subBranchPhone: matchedSubBranch?.partnerPhone,
    subBranchEmail: matchedSubBranch?.partnerEmail,
    subBranchCity: matchedSubBranch?.city,
    subBranchAddress: matchedSubBranch?.address,
    subBranchPartnerType: matchedSubBranch?.partnerType,
    subBranchRevenueSharePct: matchedSubBranch?.revenueSharePct,

    // Display
    companyDisplay: compName,
    branchDisplay,
    subBranchDisplay,
  }
}

/** Backward-compatibility alias */
export const resolveExportCompany = resolveExportScope

/**
 * Exports data to a premium styled Excel (.xls) file with full Company, Branch, and Sub-Branch headings.
 */
export function exportToExcel({
  filename,
  title,
  subtitle,
  headers,
  rows,
  company,
  branch,
  subBranch,
}: ExcelExportOptions) {
  const scope = resolveExportScope(company, branch, subBranch)
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const rowsHtml = rows
    .map((row, index) => {
      const isEven = index % 2 === 0
      const rowBg = isEven ? "#FFFFFF" : "#F8FAFC"

      const cells = row
        .map((val, cIdx) => {
          const strVal = val !== null && val !== undefined ? String(val) : "-"
          const isNum = typeof val === "number"
          const isStatus =
            strVal.toLowerCase() === "won" ||
            strVal.toLowerCase() === "active" ||
            strVal.toLowerCase() === "completed" ||
            strVal.toLowerCase() === "paid" ||
            strVal.toLowerCase() === "lost" ||
            strVal.toLowerCase() === "unpaid" ||
            strVal.toLowerCase() === "overdue" ||
            strVal.toLowerCase() === "in progress" ||
            strVal.toLowerCase() === "open"

          let statusStyle = ""
          if (isStatus) {
            const s = strVal.toLowerCase()
            if (s === "won" || s === "active" || s === "completed" || s === "paid") {
              statusStyle = "background-color: #DCFCE7; color: #166534; font-weight: bold; border-radius: 4px; padding: 2px 6px;"
            } else if (s === "lost" || s === "unpaid" || s === "overdue") {
              statusStyle = "background-color: #FEE2E2; color: #991B1B; font-weight: bold; border-radius: 4px; padding: 2px 6px;"
            } else {
              statusStyle = "background-color: #DBEAFE; color: #1E40AF; font-weight: bold; border-radius: 4px; padding: 2px 6px;"
            }
          }

          const isFirst = cIdx === 0
          return `
            <td style="padding: 8px 12px; border: 1px solid #E2E8F0; text-align: ${isFirst ? "center" : isNum ? "right" : "left"}; ${isFirst ? "font-weight: bold; color: #0F172A;" : "color: #334155;"}">
              ${statusStyle ? `<span style="${statusStyle}">${strVal}</span>` : strVal}
            </td>
          `
        })
        .join("")

      return `<tr style="background-color: ${rowBg};">${cells}</tr>`
    })
    .join("")

  const thHtml = headers
    .map(
      (h, idx) =>
        `<th style="background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; padding: 10px 12px; border: 1px solid #1E40AF; text-align: ${idx === 0 ? "center" : "left"};">${h}</th>`
    )
    .join("")

  const colSpan = Math.max(headers.length, 1)

  const branchRowHtml = scope.branchDisplay
    ? `<tr>
        <td colspan="${colSpan}" style="background-color: #EFF6FF; color: #1E40AF; font-size: 11px; font-weight: bold; padding: 6px 12px; border-bottom: 1px solid #BFDBFE;">
          ${scope.branchDisplay}
          ${scope.branchPhone ? `&nbsp;|&nbsp; <strong>Phone:</strong> ${scope.branchPhone}` : ""}
          ${scope.branchGstin ? `&nbsp;|&nbsp; <strong>Branch GSTIN:</strong> ${scope.branchGstin}` : ""}
        </td>
      </tr>`
    : ""

  const subBranchRowHtml = scope.subBranchDisplay
    ? `<tr>
        <td colspan="${colSpan}" style="background-color: #F0FDF4; color: #166534; font-size: 11px; font-weight: bold; padding: 6px 12px; border-bottom: 1px solid #BBF7D0;">
          ${scope.subBranchDisplay}
          ${scope.subBranchCity ? `&nbsp;|&nbsp; <strong>Location:</strong> ${scope.subBranchCity}` : ""}
        </td>
      </tr>`
    : ""

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <table>
        <!-- Header Banner: Corporate Brand & Title -->
        <tr>
          <td colspan="${colSpan}" style="background-color: #1E3A8A; color: #FFFFFF; font-size: 15px; font-weight: bold; padding: 14px; text-align: center;">
            ${scope.name.toUpperCase()} • ${title.toUpperCase()}
          </td>
        </tr>

        <!-- Company Legal, Tax & Contacts -->
        <tr>
          <td colspan="${colSpan}" style="background-color: #F8FAFC; color: #334155; font-size: 11px; padding: 6px 12px; border-bottom: 1px solid #E2E8F0;">
            <strong>Company:</strong> ${scope.name} 
            ${scope.gstin ? `&nbsp;|&nbsp; <strong>GSTIN:</strong> ${scope.gstin}` : ""} 
            ${scope.cin ? `&nbsp;|&nbsp; <strong>CIN:</strong> ${scope.cin}` : ""}
            ${scope.pan ? `&nbsp;|&nbsp; <strong>PAN:</strong> ${scope.pan}` : ""}
            ${scope.address ? `&nbsp;|&nbsp; <strong>Address:</strong> ${scope.address}` : ""}
            ${scope.phone ? `&nbsp;|&nbsp; <strong>Phone:</strong> ${scope.phone}` : ""}
          </td>
        </tr>

        <!-- Operating Branch Banner (if applicable) -->
        ${branchRowHtml}

        <!-- Sub-Branch Partner Banner (if applicable) -->
        ${subBranchRowHtml}

        <!-- Scope & Date -->
        <tr>
          <td colspan="${colSpan}" style="background-color: #F1F5F9; color: #475569; font-size: 11px; padding: 8px 12px; border-bottom: 2px solid #CBD5E1;">
            <strong>Report Scope:</strong> ${subtitle || "All Records"} &nbsp;|&nbsp; <strong>Total Records:</strong> ${rows.length} &nbsp;|&nbsp; <strong>Generated On:</strong> ${dateStr}
          </td>
        </tr>

        <!-- Table Columns Header -->
        <tr>
          ${thHtml}
        </tr>

        <!-- Data Rows -->
        ${rowsHtml}
      </table>
    </body>
    </html>
  `

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  const cleanCompName = scope.name.replace(/[^a-zA-Z0-9_-]/g, "_")
  link.href = url
  link.download = `${cleanCompName}_${filename.replace(/\s+/g, "_")}_${Date.now()}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates an executive A4 PDF Print report with Company, Branch, and Sub-Branch headings.
 */
export function printPDFReport({
  title,
  subtitle,
  metaItems = [],
  headers,
  rows,
  landscape = true,
  company,
  branch,
  subBranch,
}: PDFPrintOptions) {
  const scope = resolveExportScope(company, branch, subBranch)
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const printWindow = window.open("", "_blank", "width=1150,height=850")
  if (!printWindow) {
    window.print()
    return
  }

  const thHtml = headers
    .map(
      (h, idx) =>
        `<th style="text-align: ${idx === 0 ? "center" : "left"};">${h}</th>`
    )
    .join("")

  const rowsHtml = rows
    .map((row) => {
      const cells = row
        .map((val, cIdx) => {
          const strVal = val !== null && val !== undefined ? String(val) : "-"
          const isFirst = cIdx === 0
          return `
            <td style="text-align: ${isFirst ? "center" : "left"}; ${isFirst ? "color: #64748B; font-weight: bold;" : ""}">
              ${strVal}
            </td>
          `
        })
        .join("")

      return `<tr>${cells}</tr>`
    })
    .join("")

  const metaHtml = [
    `<div><strong>Company:</strong> ${scope.name}</div>`,
    scope.branchDisplay ? `<div style="color: #1D4ED8;"><strong>Branch:</strong> ${scope.branchName || "Operating Hub"}${scope.branchCode ? ` (${scope.branchCode})` : ""}</div>` : "",
    scope.subBranchDisplay ? `<div style="color: #047857;"><strong>Sub-Branch:</strong> ${scope.subBranchName || "Partner Hub"}${scope.subBranchCode ? ` (${scope.subBranchCode})` : ""}</div>` : "",
    scope.gstin ? `<div><strong>GSTIN:</strong> ${scope.gstin}</div>` : "",
    scope.cin ? `<div><strong>CIN:</strong> ${scope.cin}</div>` : "",
    subtitle ? `<div><strong>Scope:</strong> ${subtitle}</div>` : "",
    `<div><strong>Total Records:</strong> ${rows.length}</div>`,
    `<div><strong>Generated:</strong> ${dateStr}</div>`,
    ...metaItems.map((m) => `<div><strong>${m.label}:</strong> ${m.value}</div>`),
  ]
    .filter(Boolean)
    .join("")

  const logoHtml = scope.logoUrl
    ? `<img src="${scope.logoUrl}" alt="${scope.name}" style="height: 42px; max-width: 140px; object-fit: contain; margin-right: 14px;" />`
    : ""

  const addressContact = [scope.address, scope.phone, scope.email].filter(Boolean).join(" • ")

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${scope.name} - ${title}</title>
      <style>
        @page { size: ${landscape ? "A4 landscape" : "A4 portrait"}; margin: 10mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          margin: 0;
          padding: 14px;
          color: #0F172A;
          background: #FFF;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0F172A;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .header-brand {
          display: flex;
          align-items: center;
        }
        .title { font-size: 18px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; font-weight: 700; color: #1E3A8A; margin-top: 2px; }
        .comp-contact { font-size: 10px; color: #64748B; margin-top: 3px; max-width: 550px; }
        .meta { font-size: 10.5px; color: #334155; text-align: right; line-height: 1.5; }
        
        .scope-banner {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 10px;
          margin-bottom: 10px;
          font-size: 10.5px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .branch-badge {
          background-color: #EFF6FF;
          color: #1D4ED8;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 700;
          border: 1px solid #BFDBFE;
        }
        .subbranch-badge {
          background-color: #F0FDF4;
          color: #047857;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 700;
          border: 1px solid #BBF7D0;
        }

        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th {
          background-color: #0F172A;
          color: #FFF;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9.5px;
          letter-spacing: 0.5px;
          padding: 8px 10px;
        }
        td {
          padding: 7px 10px;
          border-bottom: 1px solid #E2E8F0;
          vertical-align: middle;
        }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          color: #94A3B8;
          font-size: 9.5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-brand">
          ${logoHtml}
          <div>
            <div class="title">
              <span style="color: #2563EB;">${scope.brandName || "SAAMPARK"}</span> ${scope.divisionName || ""}
            </div>
            <div class="subtitle">${title}</div>
            ${scope.subtitle ? `<div style="font-size: 10px; font-weight: 600; color: #475569;">${scope.subtitle}</div>` : ""}
            ${addressContact ? `<div class="comp-contact">${addressContact}</div>` : ""}
          </div>
        </div>
        <div class="meta">
          ${metaHtml}
        </div>
      </div>

      ${(scope.branchDisplay || scope.subBranchDisplay) ? `
        <div class="scope-banner">
          ${scope.branchDisplay ? `<span class="branch-badge">${scope.branchDisplay}</span>` : ""}
          ${scope.subBranchDisplay ? `<span class="subbranch-badge">${scope.subBranchDisplay}</span>` : ""}
        </div>
      ` : ""}

      <table>
        <thead>
          <tr>
            ${thHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>${scope.name} • Official Enterprise CRM System</span>
        <span>Confidential • Internal & Branch Audit Records</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

/**
 * Universal CSV Export with Company, Branch, and Sub-Branch Header Metadata.
 */
export function exportToCSV({
  filename,
  title,
  subtitle,
  headers,
  rows,
  company,
  branch,
  subBranch,
}: CSVExportOptions) {
  const scope = resolveExportScope(company, branch, subBranch)
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const headerMetaLines = [
    `"${scope.name.toUpperCase()} - ${title.toUpperCase()}"`,
    `"Company: ${scope.name} | GSTIN: ${scope.gstin || 'N/A'} | CIN: ${scope.cin || 'N/A'}"`,
    scope.branchDisplay ? `"${scope.branchDisplay}"` : null,
    scope.subBranchDisplay ? `"${scope.subBranchDisplay}"` : null,
    `"Report Scope: ${subtitle || 'All Records'} | Total Records: ${rows.length} | Generated On: ${dateStr}"`,
    `""`, // blank line separating metadata from table columns
  ].filter(Boolean) as string[]

  const tableHeadersLine = headers.map((h) => `"${h}"`).join(",")
  const tableRowsLines = rows.map((r) =>
    r.map((val) => `"${val !== null && val !== undefined ? String(val).replace(/"/g, '""') : ''}"`).join(",")
  )

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [...headerMetaLines, tableHeadersLine, ...tableRowsLines].join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  const cleanCompName = scope.name.replace(/[^a-zA-Z0-9_-]/g, "_")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `${cleanCompName}_${filename.replace(/\s+/g, "_")}_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

