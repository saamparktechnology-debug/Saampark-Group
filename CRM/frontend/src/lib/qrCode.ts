import QRCode from "qrcode"

/**
 * Universal ISO/IEC 18004 Standard QR Code Generator for SAAMPARK CRM
 * Powered by standard `qrcode` engine for 100% camera readability across all devices.
 */

/**
 * Generate standard compliant QR Code SVG string.
 * Guaranteed ISO/IEC 18004 compliance with quiet zone margin = 4 and Medium (M) error correction.
 */
export function generateQrCodeSvg(text: string, size: number = 300, margin: number = 4): string {
  if (!text || !text.trim()) return ""
  try {
    const qr = QRCode.create(text.trim(), {
      errorCorrectionLevel: "M",
    })
    const modSize = qr.modules.size
    const totalSize = modSize + margin * 2
    const parts: string[] = []

    for (let y = 0; y < modSize; y++) {
      for (let x = 0; x < modSize; x++) {
        if (qr.modules.get(x, y)) {
          parts.push(`<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="#000000"/>`)
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges" style="background:#ffffff;display:block;"><rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>${parts.join("")}</svg>`
  } catch (err) {
    console.warn("QR code generation fallback error:", err)
    return ""
  }
}

/**
 * Generate base64 Data URI suitable for direct <img src="..." /> binding.
 * Base64 SVG is universally supported by desktop and mobile browsers, webviews, and print renderers.
 */
export function getQrCodeDataUri(text: string, size: number = 300, margin: number = 4): string {
  const svg = generateQrCodeSvg(text, size, margin)
  if (!svg) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&ecc=M&data=${encodeURIComponent(text)}`
  }
  
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
  }
  
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  } catch {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }
}
