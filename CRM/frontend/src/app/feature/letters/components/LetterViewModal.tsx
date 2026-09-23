"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { X, Printer, Download, Mail, Building2, Calendar, Shield, Users } from "lucide-react"
import { LetterRecord } from "../types"
import { useAuthStore, getCompanyLogoUrl, getCompanyFullName } from "@/store/useAuthStore"

interface LetterViewModalProps {
  letter: LetterRecord | null
  onClose: () => void
}

export function LetterViewModal({ letter, onClose }: LetterViewModalProps) {
  const { companies } = useAuthStore()

  if (!letter) return null

  const comp = companies.find(c => c.id === letter.companyId)
  const logoUrl = getCompanyLogoUrl(comp) || letter.companyName
  const companyFullName = comp ? getCompanyFullName(comp) : (letter.companyName || "SAAMPARK GROUP")

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
      >
        {/* Modal Toolbar - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{letter.title}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {letter.referenceNumber}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Document Container */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 print:p-0 print:bg-white print:text-black">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {comp?.logo_url ? (
                <img src={comp.logo_url} alt={companyFullName} className="h-14 max-w-[150px] object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xl print:text-black print:border">
                  🏢
                </div>
              )}
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 print:text-black">
                  {companyFullName}
                </h1>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 print:text-zinc-700 max-w-md">
                  {comp?.address || "Official Corporate Headquarters, West Bengal, India"}
                </p>
                {comp?.gstin && (
                  <p className="text-[10px] text-zinc-500 font-mono">GSTIN: {comp.gstin} {comp.cin ? `| CIN: ${comp.cin}` : ""}</p>
                )}
              </div>
            </div>

            <div className="text-right text-xs space-y-1">
              <p className="font-bold">
                Date: {new Date(letter.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="font-mono text-zinc-500">Ref: {letter.referenceNumber}</p>
            </div>
          </div>

          {/* Letter Title & Subject */}
          <div className="mt-8 space-y-2">
            <h2 className="text-base font-black text-center uppercase underline tracking-wider text-zinc-900 dark:text-zinc-100 print:text-black">
              {letter.title}
            </h2>
            <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200 print:text-zinc-900">
              Subject: {letter.subject}
            </p>
          </div>

          {/* Body */}
          <div className="mt-6 whitespace-pre-line text-xs leading-relaxed font-serif text-zinc-800 dark:text-zinc-200 print:text-black space-y-4">
            {letter.body}
          </div>

          {/* Recipient Roster Tag (Printed in brief) */}
          {letter.recipients && letter.recipients.length > 0 && (
            <div className="mt-8 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
              <span className="font-bold">Circulated to ({letter.recipients.length} recipients): </span>
              <span>{letter.recipients.slice(0, 6).map(r => r.name).join(", ")}{letter.recipients.length > 6 ? ` + ${letter.recipients.length - 6} more` : ""}</span>
            </div>
          )}

          {/* Signatures & Stamp */}
          <div className="mt-12 pt-8 flex items-end justify-between">
            <div>
              {comp?.stamp_image_url || letter.stampUrl ? (
                <img src={comp?.stamp_image_url || letter.stampUrl} alt="Official Stamp" className="w-24 h-24 object-contain opacity-85" />
              ) : (
                <div className="w-20 h-20 rounded-full border border-dashed border-zinc-400 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase text-center p-1">
                  Official Seal
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              {(comp?.signature_image_url || letter.signatureUrl) && (
                <img src={comp?.signature_image_url || letter.signatureUrl} alt="Authorized Signature" className="h-12 max-w-[140px] object-contain ml-auto" />
              )}
              <div className="border-t border-zinc-400 dark:border-zinc-600 pt-1.5">
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 print:text-black">
                  {letter.signatoryName || comp?.signatory_name || "Authorized Signatory"}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {letter.signatoryDesignation || comp?.signatory_designation || "Managing Director"}
                </p>
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 print:text-black">
                  {companyFullName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
