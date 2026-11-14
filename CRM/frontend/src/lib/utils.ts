import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Universal date formatter ensuring DD-MM-YYYY format across all tables, cards, and documents.
 * Handles ISO (YYYY-MM-DD), timestamps, text months, and avoids timezone shift.
 */
export function formatDisplayDate(val?: string | number | Date | null): string {
  if (!val) return "-"
  const str = String(val).trim()
  if (!str || str === "-" || str.toLowerCase() === "none" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return "-"
  }

  // Already DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, "0")}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[3]}`
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, "0")}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[1]}`
  }

  // Parse text date like "28 Aug 2026" or ISO timestamp
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }

  return str
}

