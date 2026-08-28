"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { 
  Building2, ShieldCheck, 
  Printer, AlertCircle, Share2
} from "lucide-react"
import { getInvoices, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { getCompanyPaymentSettings, CompanyPaymentSettings } from "@/app/feature/settings/services/companyPaymentService"
import { getClients } from "@/app/feature/clients/services/clientService"
import { ClientItem } from "@/app/feature/clients/types"
import { OfficialInvoiceDocument } from "@/app/feature/sales/invoices/components/OfficialInvoiceDocument"
import { fetchModuleDataFromDB } from "@/lib/storageSync"
import { Company, DEFAULT_COMPANIES } from "@/store/useAuthStore"

function PublicInvoiceContent() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("id") || searchParams.get("view") || ""

  const [invoice, setInvoice] = React.useState<InvoiceItem | null>(null)
  const [paySettings, setPaySettings] = React.useState<CompanyPaymentSettings>({
    upiId: "saampark@sbi",
    accountHolderName: "Saampark Technology & Research Pvt. Ltd.",
    bankName: "State Bank of India",
    accountNumber: "40912384759",
    ifscCode: "SBIN0001234",
    branch: "Balichak Station Road",
    qrCodeUrl: "",
  })
  const [clientDetails, setClientDetails] = React.useState<ClientItem | null>(null)
  const [resolvedCompany, setResolvedCompany] = React.useState<Company | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [allInvoices, settings, allClients, allCompanies] = await Promise.all([
          getInvoices("all").catch(() => []),
          getCompanyPaymentSettings("all").catch(() => ({
            upiId: "saampark@sbi",
            accountHolderName: "Saampark Technology & Research Pvt. Ltd.",
            bankName: "State Bank of India",
            accountNumber: "40912384759",
            ifscCode: "SBIN0001234",
            branch: "Balichak Station Road",
            qrCodeUrl: "",
          })),
          getClients("all").catch(() => []),
          fetchModuleDataFromDB<Company[]>("companies", DEFAULT_COMPANIES, "all").catch(() => DEFAULT_COMPANIES),
        ])

        setPaySettings(settings)

        if (invoiceId) {
          const target = allInvoices.find(
            (i) => i.id.toLowerCase().trim() === invoiceId.toLowerCase().trim()
          )
          if (target) {
            setInvoice(target)
            const matchedCli = allClients.find(
              (c) => c.name.toLowerCase().trim() === (target.client || "").toLowerCase().trim()
            )
            if (matchedCli) setClientDetails(matchedCli)

            const targetCompId = String(target.companyId || (target as any).company || "tech").toLowerCase().trim()
            const compList = Array.isArray(allCompanies) && allCompanies.length > 0 ? allCompanies : DEFAULT_COMPANIES
            const matchedComp = compList.find(c => 
              c.id.toLowerCase().trim() === targetCompId || 
              (c.slug && c.slug.toLowerCase().trim() === targetCompId) ||
              c.name.toLowerCase().trim() === targetCompId
            ) || compList[0] || DEFAULT_COMPANIES[0]
            setResolvedCompany(matchedComp)
          }
        }
      } catch (err) {
        console.error("Failed to load invoice:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#005f69] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Verifying and loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4 shadow-md">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Invoice Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          The requested invoice identifier <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">{invoiceId || "EMPTY"}</code> could not be found or has expired.
        </p>
      </div>
    )
  }

  const isGstInvoice = Boolean(
    (Array.isArray(invoice.items) && invoice.items.some(it => (Number(it.gstRate) || 0) > 0 || (Number(it.gstAmount) || 0) > 0)) ||
    (typeof invoice.gstRate === "number" && invoice.gstRate > 0) ||
    (typeof invoice.gstAmount === "number" && invoice.gstAmount > 0)
  )

  const theme = isGstInvoice
    ? {
        primaryBg: "bg-[#005f69]",
        primaryText: "text-[#005f69]",
        headerGradient: "bg-gradient-to-r from-[#005f69] via-[#007380] to-[#008a99]",
      }
    : {
        primaryBg: "bg-[#0284c7]",
        primaryText: "text-[#0284c7]",
        headerGradient: "bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]",
      }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-6 px-3 sm:px-6 flex flex-col items-center print:p-0 print:bg-white">
      {/* Top Action Toolbar */}
      <div className="w-full max-w-[840px] flex items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl ${theme.primaryBg} text-white flex items-center justify-center shadow-sm text-lg overflow-hidden`}>
            {resolvedCompany?.logo_url ? (
              <img src={resolvedCompany.logo_url} alt={resolvedCompany.name} className="w-7 h-7 object-contain" />
            ) : (
              resolvedCompany?.logo || <Building2 size={18} />
            )}
          </div>
          <div>
            <span className="text-xs font-black tracking-wide text-zinc-900 dark:text-zinc-100 uppercase block">
              {resolvedCompany?.name || "SAAMPARK GROUP"}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>{isGstInvoice ? "Digital Tax Invoice Verified" : "Digital Invoice Verified"}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Share2 size={14} />
            <span>{isCopied ? "Link Copied!" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className={`px-3.5 py-1.5 rounded-xl ${theme.primaryBg} hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer`}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Verified Official Document */}
      <OfficialInvoiceDocument 
        invoice={invoice}
        clientDetails={clientDetails}
        companyDetails={resolvedCompany}
        paySettings={paySettings}
      />
    </div>
  )
}

export default function PublicInvoicePage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#005f69] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Verifying security certificate...</p>
      </div>
    }>
      <PublicInvoiceContent />
    </React.Suspense>
  )
}
