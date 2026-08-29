"use client"

import { useAuthStore, Company } from "@/store/useAuthStore"

export interface ExportCompanyInfo {
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
}

export interface ExcelExportOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  company?: Partial<Company> | string
}

export interface PDFPrintOptions {
  title: string
  subtitle?: string
  metaItems?: { label: string; value: string | number }[]
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  landscape?: boolean
  company?: Partial<Company> | string
}

/**
 * Dynamically resolves active company info from useAuthStore or optional override.
 */
export function resolveExportCompany(custom?: Partial<Company> | string): ExportCompanyInfo {
  try {
    const store = useAuthStore.getState()
    const activeCompanyId = store.activeCompanyId
    const companies = store.companies || []

    let matched: Company | undefined

    if (custom && typeof custom === "object") {
      matched = custom as Company
    } else if (typeof custom === "string" && custom.trim()) {
      const q = custom.toLowerCase().trim()
      matched = companies.find(c => 
        String(c.id).toLowerCase() === q || 
        String(c.slug || "").toLowerCase() === q || 
        String(c.name).toLowerCase() === q
      )
    }

    if (!matched && activeCompanyId) {
      const q = String(activeCompanyId).toLowerCase().trim()
      matched = companies.find(c => 
        String(c.id).toLowerCase() === q || 
        String(c.slug || "").toLowerCase() === q
      )
    }

    if (!matched && companies.length > 0) {
      matched = companies[0]
    }

    if (matched) {
      const brand = matched.brand_name || (matched.name ? matched.name.split(" ")[0] : "SAAMPARK")
      const division = matched.division_name || (matched.name ? matched.name.split(" ").slice(1).join(" ") : "")
      
      const fullAddress = [
        matched.address,
        matched.city,
        matched.state ? `${matched.state}${matched.zip ? ` - ${matched.zip}` : ""}` : matched.zip,
        matched.country
      ].filter(Boolean).join(", ")

      return {
        name: matched.name || [brand, division].filter(Boolean).join(" ") || "SAAMPARK GROUP",
        brandName: brand,
        divisionName: division,
        subtitle: matched.subtitle,
        logoUrl: matched.logo_url,
        logo: matched.logo || "🏢",
        address: fullAddress || matched.address,
        city: matched.city,
        state: matched.state,
        zip: matched.zip,
        country: matched.country,
        phone: matched.phone,
        email: matched.email,
        website: matched.website,
        gstin: matched.gstin,
        cin: matched.cin,
        pan: matched.pan,
        currency: matched.currency || "INR",
        currencySymbol: matched.currency_symbol || "₹",
      }
    }
  } catch {}

  return {
    name: "SAAMPARK GROUP",
    brandName: "SAAMPARK",
    divisionName: "GROUP",
    subtitle: "Enterprise Business Management",
    currency: "INR",
    currencySymbol: "₹",
  }
}

/**
 * Exports data to a premium styled Excel (.xls) file with company headers, branding, and borders.
 */
export function exportToExcel({
  filename,
  title,
  subtitle,
  headers,
  rows,
  company,
}: ExcelExportOptions) {
  const comp = resolveExportCompany(company)
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

  const colSpan = headers.length

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
        <tr>
          <td colspan="${colSpan}" style="background-color: #1E3A8A; color: #FFFFFF; font-size: 16px; font-weight: bold; padding: 14px; text-align: center;">
            ${comp.name.toUpperCase()} • ${title.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td colspan="${colSpan}" style="background-color: #F8FAFC; color: #334155; font-size: 11px; padding: 6px 12px; border-bottom: 1px solid #E2E8F0;">
            <strong>Company:</strong> ${comp.name} 
            ${comp.gstin ? `&nbsp;|&nbsp; <strong>GSTIN:</strong> ${comp.gstin}` : ""} 
            ${comp.cin ? `&nbsp;|&nbsp; <strong>CIN:</strong> ${comp.cin}` : ""}
            ${comp.address ? `&nbsp;|&nbsp; <strong>Address:</strong> ${comp.address}` : ""}
          </td>
        </tr>
        <tr>
          <td colspan="${colSpan}" style="background-color: #F1F5F9; color: #475569; font-size: 11px; padding: 8px 12px; border-bottom: 2px solid #CBD5E1;">
            <strong>Scope:</strong> ${subtitle || "All Records"} &nbsp;|&nbsp; <strong>Total Records:</strong> ${rows.length} &nbsp;|&nbsp; <strong>Exported:</strong> ${dateStr}
          </td>
        </tr>
        <tr>
          ${thHtml}
        </tr>
        ${rowsHtml}
      </table>
    </body>
    </html>
  `

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  const cleanCompName = comp.name.replace(/[^a-zA-Z0-9_-]/g, "_")
  link.href = url
  link.download = `${cleanCompName}_${filename.replace(/\s+/g, "_")}_${Date.now()}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates an executive A4 PDF Print report with dynamic company branding and headers.
 */
export function printPDFReport({
  title,
  subtitle,
  metaItems = [],
  headers,
  rows,
  landscape = true,
  company,
}: PDFPrintOptions) {
  const comp = resolveExportCompany(company)
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const printWindow = window.open("", "_blank", "width=1100,height=850")
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
    .map((row, index) => {
      const cells = row
        .map((val, cIdx) => {
          const strVal = val !== null && val !== undefined ? String(val) : "-"
          const isFirst = cIdx === 0
          return `
            <td style="text-align: ${isFirst ? "center" : "left"}; ${isFirst ? "color: #64748B;" : ""}">
              ${strVal}
            </td>
          `
        })
        .join("")

      return `<tr>${cells}</tr>`
    })
    .join("")

  const metaHtml = [
    `<div><strong>Company:</strong> ${comp.name}</div>`,
    comp.gstin ? `<div><strong>GSTIN:</strong> ${comp.gstin}</div>` : "",
    comp.cin ? `<div><strong>CIN:</strong> ${comp.cin}</div>` : "",
    subtitle ? `<div><strong>Scope:</strong> ${subtitle}</div>` : "",
    `<div><strong>Total Records:</strong> ${rows.length}</div>`,
    `<div><strong>Date:</strong> ${dateStr}</div>`,
    ...metaItems.map((m) => `<div><strong>${m.label}:</strong> ${m.value}</div>`),
  ]
    .filter(Boolean)
    .join("")

  const logoHtml = comp.logoUrl
    ? `<img src="${comp.logoUrl}" alt="${comp.name}" style="height: 38px; max-width: 140px; object-fit: contain; margin-right: 12px;" />`
    : ""

  const addressContact = [comp.address, comp.phone, comp.email].filter(Boolean).join(" • ")

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${comp.name} - ${title}</title>
      <style>
        @page { size: ${landscape ? "A4 landscape" : "A4 portrait"}; margin: 12mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0F172A;
          background: #FFF;
          font-size: 11px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0F172A;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .header-brand {
          display: flex;
          align-items: center;
        }
        .title { font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
        .subtitle { font-size: 13px; font-weight: 700; color: #1E3A8A; margin-top: 2px; }
        .comp-contact { font-size: 10px; color: #64748B; margin-top: 3px; max-width: 550px; }
        .meta { font-size: 11px; color: #334155; text-align: right; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th {
          background-color: #0F172A;
          color: #FFF;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
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
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-brand">
          ${logoHtml}
          <div>
            <div class="title">
              <span style="color: #2563EB;">${comp.brandName || "SAAMPARK"}</span> ${comp.divisionName || ""}
            </div>
            <div class="subtitle">${title}</div>
            ${comp.subtitle ? `<div style="font-size: 10px; font-weight: 600; color: #475569;">${comp.subtitle}</div>` : ""}
            ${addressContact ? `<div class="comp-contact">${addressContact}</div>` : ""}
          </div>
        </div>
        <div class="meta">
          ${metaHtml}
        </div>
      </div>

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
        <span>${comp.name} • Official Enterprise CRM System</span>
        <span>Confidential • Internal & Client Records</span>
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
