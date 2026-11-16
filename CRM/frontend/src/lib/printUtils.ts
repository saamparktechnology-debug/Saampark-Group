"use client"

/**
 * Universal A4 Document Print Engine for SAAMPARK CRM
 * Provides 100% full-width, unscaled, unclipped A4 printable documents for
 * Invoices, Quotations, Estimates, Form No. 9, Offer Letters, ID Cards, and Receipts.
 */
export function printDocument(elementId: string, title?: string) {
  if (typeof window === "undefined") return

  const targetEl = document.getElementById(elementId)
  if (!targetEl) {
    window.print()
    return
  }

  const prevTitle = document.title
  if (title) {
    document.title = title
  }

  // 1. Gather all compiled style tags and stylesheet links from document.head
  const headElements = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
    .map(node => node.outerHTML)
    .join("\n")

  // 2. Manage clean invisible print iframe
  let iframe = document.getElementById("saampark-universal-print-frame") as HTMLIFrameElement | null
  if (!iframe) {
    iframe = document.createElement("iframe")
    iframe.id = "saampark-universal-print-frame"
    iframe.style.position = "fixed"
    iframe.style.left = "-9999px"
    iframe.style.top = "-9999px"
    iframe.style.width = "794px"
    iframe.style.height = "1123px"
    iframe.style.border = "none"
    iframe.style.visibility = "hidden"
    iframe.style.zIndex = "-9999"
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentWindow?.document
  if (!doc) {
    window.print()
    if (title) document.title = prevTitle
    return
  }

  const docTitle = title || "Official_Document"

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${docTitle}</title>
      ${headElements}
      <style>
        @page {
          size: A4 portrait;
          margin: 4mm 6mm;
        }
        *, *::before, *::after {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 100% !important;
          min-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #09090b !important;
        }
        .no-print, [data-no-print], button {
          display: none !important;
        }
        #${elementId}, .printable-root, .a4-page, .quotation-a4-card, [id^="printable-"] {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
          margin: 0 auto !important;
          padding: 3mm 4mm !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          color: #09090b !important;
          min-height: auto !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          display: block !important;
        }
        .print-doc-header-row {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          width: 100% !important;
          flex-wrap: nowrap !important;
          gap: 12px !important;
        }
        .print-doc-header-logo {
          width: 115px !important;
          min-width: 115px !important;
          max-width: 115px !important;
          height: 115px !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .print-doc-header-center {
          flex: 1 1 auto !important;
          min-width: 280px !important;
          text-align: center !important;
        }
        .print-doc-header-card {
          width: 200px !important;
          min-width: 200px !important;
          max-width: 200px !important;
          flex-shrink: 0 !important;
        }
        .relative {
          position: relative !important;
        }
        .avoid-break, .break-inside-avoid, tr, table {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .quotation-page-1, .break-after-page, .page-break-after {
          page-break-after: always !important;
          break-after: page !important;
          display: block !important;
        }
        .quotation-middle-pages {
          page-break-after: always !important;
          break-after: page !important;
          display: block !important;
        }
        .quotation-final-page, .break-before-page, .page-break-before {
          page-break-before: always !important;
          break-before: page !important;
          display: block !important;
        }
      </style>
    </head>
    <body class="bg-white text-zinc-900 font-sans">
      <div style="width: 100%; max-width: 100%; margin: 0 auto;">
        ${targetEl.outerHTML}
      </div>
    </body>
    </html>
  `)
  doc.close()

  // Wait for all resources (images, SVGs, stylesheets) in the iframe to finish loading before triggering print
  const triggerIframePrint = () => {
    try {
      const images = Array.from(doc.images || [])
      const imagePromises = images.map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          setTimeout(resolve, 800) // Fallback timeout so print never hangs
        })
      })

      Promise.all(imagePromises).then(() => {
        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus()
            iframe?.contentWindow?.print()
            if (title) document.title = prevTitle
          } catch (err) {
            console.warn("Universal iframe print notice, running window.print():", err)
            window.print()
            if (title) document.title = prevTitle
          }
        }, 150)
      })
    } catch {
      iframe?.contentWindow?.focus()
      iframe?.contentWindow?.print()
      if (title) document.title = prevTitle
    }
  }

  if (iframe.contentWindow) {
    if (doc.readyState === "complete") {
      setTimeout(triggerIframePrint, 200)
    } else {
      iframe.contentWindow.onload = () => {
        setTimeout(triggerIframePrint, 150)
      }
      setTimeout(triggerIframePrint, 1000)
    }
  } else {
    setTimeout(triggerIframePrint, 400)
  }
}
