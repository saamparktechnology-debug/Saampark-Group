"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Phone, Building2, MapPin, Shield, Calendar, 
  CheckCircle2, Clock, AlertCircle, XCircle, FileText, ExternalLink, 
  CreditCard, Landmark, Eye, Check, RefreshCw, Lock
} from "lucide-react"
import { UserItem, KycStatus } from "../types"
import { recordUserAccount } from "../services/userService"
import { saveModuleDataToDB } from "@/lib/storageSync"
import { useAuthStore } from "@/store/useAuthStore"

interface UserOverviewModalProps {
  isOpen: boolean
  user: UserItem | null
  onClose: () => void
  onEdit?: (user: UserItem) => void
  onUserUpdated?: (updatedUser: UserItem) => void
}

const KYC_BADGE_CONFIG: Record<KycStatus, { label: string; bg: string; text: string; icon: any }> = {
  Pending: {
    label: "KYC Pending",
    bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  Processing: {
    label: "KYC Under Review",
    bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: RefreshCw,
  },
  Verified: {
    label: "KYC Verified (Done)",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "KYC Rejected",
    bg: "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
}

export function UserOverviewModal({
  isOpen,
  user,
  onClose,
  onEdit,
  onUserUpdated,
}: UserOverviewModalProps) {
  const currentUser = useAuthStore((state) => state.user)
  const isSuperAdminOrAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Admin"

  const [previewDocUrl, setPreviewDocUrl] = React.useState<string | null>(null)
  const [isProcessingAction, setIsProcessingAction] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [showRejectInput, setShowRejectInput] = React.useState(false)

  if (!isOpen || !user) return null

  const kycStatus: KycStatus = user.kycStatus || (user.kycData?.docNumber ? "Processing" : "Pending")
  const kycConfig = KYC_BADGE_CONFIG[kycStatus] || KYC_BADGE_CONFIG.Pending
  const KycIcon = kycConfig.icon
  const kyc = user.kycData

  const handleApproveKyc = async () => {
    if (!confirm(`Are you sure you want to approve and mark KYC as Verified for ${user.name}?`)) {
      return
    }

    setIsProcessingAction(true)
    const updated: UserItem = {
      ...user,
      kycStatus: "Verified",
      kycData: {
        ...(user.kycData || { fullName: user.name, docType: "Aadhaar Card", docNumber: "N/A" }),
        verifiedAt: new Date().toISOString(),
        verifiedBy: currentUser?.name || "Administrator",
        rejectionReason: undefined,
      },
    }

    recordUserAccount(updated)
    onUserUpdated?.(updated)
    setIsProcessingAction(false)
  }

  const handleRejectKyc = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejecting this KYC application.")
      return
    }

    setIsProcessingAction(true)
    const updated: UserItem = {
      ...user,
      kycStatus: "Rejected",
      kycData: {
        ...(user.kycData || { fullName: user.name, docType: "Aadhaar Card", docNumber: "N/A" }),
        rejectionReason: rejectReason.trim(),
      },
    }

    recordUserAccount(updated)
    onUserUpdated?.(updated)
    setShowRejectInput(false)
    setIsProcessingAction(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border/60 bg-surface-hover/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${
                user.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${kycConfig.bg} ${kycConfig.text}`}>
                  <KycIcon size={12} className={kycStatus === "Processing" ? "animate-spin" : ""} />
                  <span>{kycConfig.label}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => { onClose(); onEdit(user) }}
                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors cursor-pointer"
              >
                Edit Account
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Organization & Location Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-surface-hover/20 border border-border/60 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                <Building2 size={14} className="text-primary" />
                <span>Assigned Company</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {user.companyName || (user.companyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology")}
              </p>
              {user.companyIds && user.companyIds.length > 1 && (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {user.companyIds.map((cId) => (
                    <span key={cId} className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface-pressed border border-border text-muted-foreground">
                      {cId}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-hover/20 border border-border/60 space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                <MapPin size={14} className="text-primary" />
                <span>Sub-Branch / Location Hub</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {user.branchName || (user.branchId ? `Branch (${user.branchId})` : "Headquarters / All Branches")}
              </p>
              <p className="text-[11px] text-muted-foreground">Unit: {user.department || "General Administration"}</p>
            </div>
          </div>

          {/* Contact & Meta Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-surface-hover/20 border border-border/60">
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Phone Number</span>
              <p className="font-semibold text-foreground mt-0.5">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Account Created</span>
              <p className="font-semibold text-foreground mt-0.5">{user.joinedDate || "Recent"}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-semibold">Last Active</span>
              <p className="font-semibold text-foreground mt-0.5">{user.lastLogin || "Active"}</p>
            </div>
          </div>

          {/* ── KYC VERIFICATION & BANK DETAILS ────────────────────────────── */}
          <div className="p-5 rounded-3xl bg-surface-hover/30 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <h4 className="font-bold text-sm text-foreground">KYC Identity & Banking Details</h4>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${kycConfig.bg} ${kycConfig.text}`}>
                <KycIcon size={12} className={kycStatus === "Processing" ? "animate-spin" : ""} />
                <span>{kycConfig.label}</span>
              </span>
            </div>

            {kyc ? (
              <div className="space-y-4">
                {/* ID Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-muted-foreground font-semibold">Legal Full Name</span>
                    <p className="font-bold text-foreground mt-0.5">{kyc.fullName || user.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {kyc.docType || "Identity Document"} Number
                    </span>
                    <p className="font-mono font-bold text-foreground mt-0.5">{kyc.docNumber || "N/A"}</p>
                  </div>
                </div>

                {/* Document Previews */}
                {(kyc.docFrontUrl || kyc.docBackUrl) && (
                  <div>
                    <span className="block text-[11px] text-muted-foreground font-semibold mb-2">
                      Uploaded Identification Documents
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {kyc.docFrontUrl && (
                        <div className="relative group border border-border rounded-2xl overflow-hidden bg-surface p-2 space-y-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Front Photo / Page</p>
                          <img
                            src={kyc.docFrontUrl}
                            alt="Front Document"
                            className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewDocUrl(kyc.docFrontUrl || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl(kyc.docFrontUrl || null)}
                            className="w-full py-1 text-center text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> Click to View Full Size
                          </button>
                        </div>
                      )}

                      {kyc.docBackUrl && (
                        <div className="relative group border border-border rounded-2xl overflow-hidden bg-surface p-2 space-y-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Back Photo / Address</p>
                          <img
                            src={kyc.docBackUrl}
                            alt="Back Document"
                            className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewDocUrl(kyc.docBackUrl || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl(kyc.docBackUrl || null)}
                            className="w-full py-1 text-center text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1"
                          >
                            <Eye size={12} /> Click to View Full Size
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank & UPI Details */}
                {(kyc.bankName || kyc.accountNumber || kyc.upiId) && (
                  <div className="p-3.5 rounded-2xl bg-surface border border-border/80 space-y-2">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Landmark size={14} className="text-primary" /> Bank & Payout Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {kyc.bankName && (
                        <div>
                          <span className="text-muted-foreground text-[10px]">Bank Name:</span>
                          <p className="font-semibold text-foreground">{kyc.bankName}</p>
                        </div>
                      )}
                      {kyc.accountNumber && (
                        <div>
                          <span className="text-muted-foreground text-[10px]">Account Number:</span>
                          <p className="font-mono font-semibold text-foreground">{kyc.accountNumber}</p>
                        </div>
                      )}
                      {kyc.ifscCode && (
                        <div>
                          <span className="text-muted-foreground text-[10px]">IFSC Code:</span>
                          <p className="font-mono font-semibold text-foreground">{kyc.ifscCode}</p>
                        </div>
                      )}
                      {kyc.accountHolderName && (
                        <div>
                          <span className="text-muted-foreground text-[10px]">A/C Holder Name:</span>
                          <p className="font-semibold text-foreground">{kyc.accountHolderName}</p>
                        </div>
                      )}
                      {kyc.upiId && (
                        <div className="col-span-1 sm:col-span-2">
                          <span className="text-muted-foreground text-[10px]">UPI / VPA ID:</span>
                          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{kyc.upiId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Note if Rejected */}
                {kycStatus === "Rejected" && kyc.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
                    <span className="font-bold">Rejection Note:</span>
                    <p>{kyc.rejectionReason}</p>
                  </div>
                )}

                {/* Verification Metadata if Verified */}
                {kycStatus === "Verified" && kyc.verifiedAt && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✅ Verified on {new Date(kyc.verifiedAt).toLocaleDateString()} by {kyc.verifiedBy || "Super Admin"}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No KYC documents or bank details submitted yet.</p>
              </div>
            )}

            {/* ── SUPER ADMIN / ADMIN KYC DECISION BUTTONS ──────────────────── */}
            {isSuperAdminOrAdmin && kycStatus !== "Verified" && (
              <div className="pt-3 border-t border-border/50 space-y-2">
                {!showRejectInput ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(true)}
                      disabled={isProcessingAction}
                      className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Reject KYC
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveKyc}
                      disabled={isProcessingAction}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Approve & Verify KYC (KYC Done)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 bg-surface p-3.5 rounded-2xl border border-rose-300 dark:border-rose-800">
                    <label className="block text-xs font-semibold text-foreground">
                      Reason for Rejection:
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Document image is blurry or expired. Please re-upload a clear photo."
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs focus:outline-hidden focus:border-rose-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectKyc}
                        disabled={isProcessingAction}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-surface-hover/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-hover border border-border text-foreground font-semibold text-xs hover:bg-surface-pressed transition-colors"
          >
            Close Overview
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Document Preview Lightbox */}
      <AnimatePresence>
        {previewDocUrl && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewDocUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X size={20} />
              </button>
              <img
                src={previewDocUrl}
                alt="Document Full Preview"
                className="max-h-[80vh] w-auto object-contain rounded-xl mx-auto"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
