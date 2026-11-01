"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { 
  Building2, ShieldCheck, 
  Printer, AlertCircle, Share2,
  CheckCircle2
} from "lucide-react"
import { getEstimates, updateEstimateStatus, EstimateItem } from "@/app/feature/estimates/services/estimateService"
import { OfficialEstimateDocument } from "@/app/feature/estimates/components/OfficialEstimateDocument"
import { fetchModuleDataFromDB } from "@/lib/storageSync"
import { Company, DEFAULT_COMPANIES } from "@/store/useAuthStore"

function PublicEstimateContent() {
  const searchParams = useSearchParams()
  const rawParam = searchParams.get("id") || searchParams.get("num") || searchParams.get("number") || searchParams.get("estimateNumber") || searchParams.get("view") || ""
  const estimateQuery = rawParam.replace(/^#/, "").trim()

  const [estimate, setEstimate] = React.useState<EstimateItem | null>(null)
  const [resolvedCompany, setResolvedCompany] = React.useState<Company | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCopied, setIsCopied] = React.useState(false)
  const [isAccepting, setIsAccepting] = React.useState(false)
  const [acceptSuccess, setAcceptSuccess] = React.useState(false)

  const handleAcceptEstimate = async () => {
    if (!estimate || isAccepting) return
    setIsAccepting(true)
    try {
      const now = new Date().toISOString()
      const clientName = estimate.client || "Client"
      const updated = await updateEstimateStatus(
        estimate.id, 
        "Accepted", 
        {
          clientAccepted: true,
          acceptedAt: now,
          acceptedBy: clientName,
          clientAcceptNotes: "Accepted via digital portal"
        },
        estimate.companyId
      )
      setEstimate(updated)
      setAcceptSuccess(true)
      setTimeout(() => setAcceptSuccess(false), 5000)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_data_synced", { detail: { module: "estimates" } }))
      }
    } catch (err) {
      console.error("Accept estimate failed:", err)
    } finally {
      setIsAccepting(false)
    }
  }

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [allEstimates, allCompanies] = await Promise.all([
          getEstimates("all").catch(() => []),
          fetchModuleDataFromDB<Company[]>("companies", DEFAULT_COMPANIES, "all").catch(() => DEFAULT_COMPANIES),
        ])

        if (estimateQuery) {
          const queryNorm = estimateQuery.toLowerCase()
          const target = allEstimates.find((e: EstimateItem) => {
            const idNorm = (e.id || "").toLowerCase()
            const numNorm = (e.estimateNumber || "").toLowerCase()
            return idNorm === queryNorm || numNorm === queryNorm || idNorm.endsWith(queryNorm) || numNorm.endsWith(queryNorm)
          })

          if (target) {
            setEstimate(target)

            const targetCompId = String(target.companyId || "tech").toLowerCase().trim()
            const compList = Array.isArray(allCompanies) && allCompanies.length > 0 ? allCompanies : DEFAULT_COMPANIES
            const matchedComp = compList.find(c => {
              const cId = c.id.toLowerCase().trim()
              const cSlug = (c.slug || "").toLowerCase().trim()
              const cName = c.name.toLowerCase().trim()
              return cId === targetCompId || cSlug === targetCompId || cName === targetCompId
            }) || compList[0] || DEFAULT_COMPANIES[0]
            setResolvedCompany(matchedComp)
          }
        }
      } catch (err) {
        console.error("Failed to load estimate:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [estimateQuery])

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
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Verifying and loading estimate...</p>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4 shadow-md">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Estimate Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          The requested estimate identifier <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">{estimateQuery || "EMPTY"}</code> could not be found or has expired.
        </p>
      </div>
    )
  }

  const isAccepted = estimate.status === "Accepted" || estimate.clientAccepted

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-6 px-3 sm:px-6 flex flex-col items-center print:p-0 print:bg-white">
      {/* Top Action Toolbar */}
      <div className="w-full max-w-[840px] flex items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm text-lg overflow-hidden">
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
              <span>Official Estimate Verified</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAccepted ? (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Accepted</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAcceptEstimate}
              disabled={isAccepting}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Formally accept and confirm this estimate"
            >
              <CheckCircle2 size={14} />
              <span>{isAccepting ? "Accepting..." : acceptSuccess ? "Accepted ✓" : "Accept Estimate"}</span>
            </button>
          )}

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
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Acceptance Status Banner */}
      {isAccepted ? (
        <div className="w-full max-w-[840px] mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200 print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                Digital Estimate Formally Accepted by Client
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                Confirmed by {estimate.acceptedBy || estimate.client || "Client"}
                {estimate.acceptedAt ? ` on ${new Date(estimate.acceptedAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ""}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
            ✓ Verified
          </span>
        </div>
      ) : (
        <div className="w-full max-w-[840px] mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Review the cost estimate and terms below. Click <strong>Accept Estimate</strong> to confirm.</span>
          </div>
          <button
            type="button"
            onClick={handleAcceptEstimate}
            disabled={isAccepting}
            className="self-end sm:self-auto px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>Accept Now</span>
          </button>
        </div>
      )}

      {/* Official Estimate Document */}
      <OfficialEstimateDocument 
        estimate={estimate} 
        isClientRole={true}
        onAccept={handleAcceptEstimate}
      />
    </div>
  )
}

export default function PublicEstimatePage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Loading estimate portal...</p>
      </div>
    }>
      <PublicEstimateContent />
    </React.Suspense>
  )
}
