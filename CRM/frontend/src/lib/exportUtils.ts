"use client"

export interface ExcelExportOptions {
  filename: string
  title: string
  subtitle?: string
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
}

export interface PDFPrintOptions {
  title: string
  subtitle?: string
  metaItems?: { label: string; value: string | number }[]
  headers: string[]
  rows: Array<(string | number | null | undefined)[]>
  landscape?: boolean
}

/**
 * Exports data to a premium styled Excel (.xls) file with colors, banners, and borders.
 */
export function exportToExcel({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: ExcelExportOptions) {
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
            SAAMPARK GROUP • ${title.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td colspan="${colSpan}" style="background-color: #F1F5F9; color: #475569; font-size: 11px; padding: 8px 12px; border-bottom: 2px solid #CBD5E1;">
            <strong>Subtitle:</strong> ${subtitle || "All Records"} &nbsp;|&nbsp; <strong>Total Records:</strong> ${rows.length} &nbsp;|&nbsp; <strong>Exported:</strong> ${dateStr}
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
  link.href = url
  link.download = `${filename.replace(/\s+/g, "_")}_${Date.now()}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates an executive A4 PDF Print report with official SAAMPARK branding.
 */
export function printPDFReport({
  title,
  subtitle,
  metaItems = [],
  headers,
  rows,
  landscape = true,
}: PDFPrintOptions) {
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
    subtitle ? `<div><strong>Scope:</strong> ${subtitle}</div>` : "",
    `<div><strong>Total Records:</strong> ${rows.length}</div>`,
    `<div><strong>Date:</strong> ${dateStr}</div>`,
    ...metaItems.map((m) => `<div><strong>${m.label}:</strong> ${m.value}</div>`),
  ]
    .filter(Boolean)
    .join("")

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SAAMPARK - ${title}</title>
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
        .title { font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #64748B; margin-top: 2px; }
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
        <div>
          <div class="title">SAAMPARK GROUP</div>
          <div class="subtitle">${title}</div>
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
        <span>Generated by SAAMPARK CRM Platform</span>
        <span>Confidential • Internal Use Only</span>
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
