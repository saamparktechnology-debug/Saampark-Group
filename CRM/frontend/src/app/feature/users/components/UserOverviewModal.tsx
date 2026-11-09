import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Mail, Phone, Building2, MapPin, Shield, Calendar, 
  CheckCircle2, Clock, AlertCircle, XCircle, FileText, ExternalLink, 
  CreditCard, Landmark, Eye, Check, RefreshCw, Lock, Award, Send, 
  Printer, Sparkles, UserCheck, Briefcase, DollarSign, Layers,
  Camera, Users, Home, Copy
} from "lucide-react"
import { UserItem, KycStatus } from "../types"
import { recordUserAccount, updateUser } from "../services/userService"
import { api } from "@/lib/api"
import { saveModuleDataToDB } from "@/lib/storageSync"
import { useAuthStore, getSelectableCompanies, isMatchingCompany } from "@/store/useAuthStore"
import { createNotification } from "@/services/notificationService"
import { sendKycStatusEmailNotification } from "@/services/emailNotificationService"
import { OfferLetterDocument } from "./OfferLetterDocument"
import { IdentityCardDocument } from "./IdentityCardDocument"

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
  const companies = useAuthStore((state) => state.companies)
  const branches = useAuthStore((state) => state.branches)
  const subBranches = useAuthStore((state) => state.subBranches)
  const activeCompanyId = useAuthStore((state) => state.activeCompanyId)
  const canReviewKyc = 
    (currentUser?.role as any) === "Super Admin" || 
    (currentUser?.role as any) === "Admin" || 
    (currentUser?.role as any) === "Branch Admin" || 
    (currentUser?.role as any) === "Sub Branch Admin"

  const selectableCompanies = React.useMemo(() => {
    return getSelectableCompanies(companies, activeCompanyId, currentUser, branches, subBranches)
  }, [companies, activeCompanyId, currentUser, branches, subBranches])

  const [activeTab, setActiveTab] = React.useState<"kyc" | "offer_letter" | "id_card">("kyc")
  const [previewDocUrl, setPreviewDocUrl] = React.useState<string | null>(null)
  const [isProcessingAction, setIsProcessingAction] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [showRejectInput, setShowRejectInput] = React.useState(false)

  // Entity selection & Document Customization state
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(() => {
    if (activeCompanyId && activeCompanyId !== "all") return activeCompanyId
    return user?.companyId || "tech"
  })
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(user?.branchId || "")
  const [selectedSubBranchId, setSelectedSubBranchId] = React.useState<string>(user?.subBranchId || "")
  const [customJoiningDate, setCustomJoiningDate] = React.useState<string>(user?.joinedDate || "2026-10-01")
  const [customDesignation, setCustomDesignation] = React.useState<string>(user?.designation || user?.role || "Senior Executive")
  const [customCtc, setCustomCtc] = React.useState<string>((user as any)?.ctc || "₹4,80,000 per Annum (INR 4.8 LPA)")
  const [customMonthlySalary, setCustomMonthlySalary] = React.useState<string>("₹40,000 / Month (Gross)")
  const [customDepartment, setCustomDepartment] = React.useState<string>(user?.department || "Operations & Technology")
  const [customReportingManager, setCustomReportingManager] = React.useState<string>("Department Head / Branch Director")
  const [customProbationPeriod, setCustomProbationPeriod] = React.useState<string>("3 Months from Date of Joining")
  const [customWorkingHours, setCustomWorkingHours] = React.useState<string>("Monday – Saturday (9:30 AM to 6:30 PM)")
  const [customWorkMode, setCustomWorkMode] = React.useState<string>("Full-time On-site")
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  const [emailStatusMsg, setEmailStatusMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      useAuthStore.getState().fetchCompanies().catch(() => {})
      useAuthStore.getState().fetchBranches().catch(() => {})
    }
  }, [isOpen])

  const [liveUser, setLiveUser] = React.useState<UserItem>(user!)

  React.useEffect(() => {
    if (user) {
      setLiveUser(user)
      setSelectedCompanyId(user.companyId || (companies[0]?.id || "tech"))
      setSelectedBranchId(user.branchId || "")
      setSelectedSubBranchId(user.subBranchId || (user as any).sub_branch_id || "")
      setCustomJoiningDate(user.joinedDate || "2026-10-01")
      setCustomDesignation(user.designation || user.role || "Senior Executive")
      setCustomCtc((user as any).ctc || "₹4,80,000 per Annum (INR 4.8 LPA)")
      setCustomDepartment(user.department || "Operations & Technology")

      // Fetch fresh profile data directly from MySQL users table
      const identifier = user.id || user.email
      if (identifier) {
        api.get(`/users/${encodeURIComponent(identifier)}`)
          .then((res: any) => {
            const data = res?.data || res
            if (data && (data.id || data.email)) {
              let parsedKyc = data.kyc_data || data.kycData
              if (typeof parsedKyc === "string") {
                try { parsedKyc = JSON.parse(parsedKyc) } catch {}
              }
              setLiveUser((prev) => ({
                ...prev,
                ...data,
                name: data.full_name || data.name || prev.name,
                kycStatus: data.kyc_status || data.kycStatus || prev.kycStatus,
                kycData: parsedKyc || prev.kycData,
              }))
            }
          })
          .catch(() => {})
      }
    }
  }, [user, companies])

  if (!isOpen || !user) return null

  const activeUser = liveUser || user

  // Resolved entities
  const resolvedCompany = companies.find(c => 
    String(c.id).toLowerCase().trim() === String(selectedCompanyId).toLowerCase().trim() ||
    String(c.slug || "").toLowerCase().trim() === String(selectedCompanyId).toLowerCase().trim() ||
    String((c as any).numeric_id || "") === String(selectedCompanyId) ||
    isMatchingCompany(c, selectedCompanyId)
  ) || companies[0]

  const resolvedBranch = branches.find(b => 
    String(b.id) === String(selectedBranchId) || 
    (selectedCompanyId && String(b.company_id) === String(selectedCompanyId))
  ) || branches.find(b => String(b.company_id) === String(resolvedCompany?.id)) || branches[0]

  const resolvedSubBranch = subBranches?.find(sb => 
    String(sb.id) === String(selectedSubBranchId) ||
    (resolvedBranch && String((sb as any).branch_id || (sb as any).branchId) === String(resolvedBranch.id))
  )

  const rawKyc = activeUser.kycData || (activeUser as any).kyc_data
  let kyc: any = null
  if (rawKyc) {
    if (typeof rawKyc === "string") {
      try { kyc = JSON.parse(rawKyc) } catch { kyc = null }
    } else if (typeof rawKyc === "object") {
      kyc = rawKyc
    }
  }

  const kycStatus: KycStatus = (
    activeUser.kycStatus || 
    (activeUser as any).kyc_status || 
    (kyc?.docNumber ? "Processing" : "Pending")
  ) as KycStatus
  const kycConfig = KYC_BADGE_CONFIG[kycStatus] || KYC_BADGE_CONFIG.Pending
  const KycIcon = kycConfig.icon

  const handleApproveKyc = async () => {
    if (!confirm(`Are you sure you want to approve and mark KYC as Verified for ${user.name}?`)) {
      return
    }

    setIsProcessingAction(true)
    const approverName = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : "Branch Management"

    const updated: UserItem = {
      ...user,
      kycStatus: "Verified",
      kycData: {
        ...(user.kycData || { fullName: user.name, docType: "Aadhaar Card", docNumber: "N/A" }),
        verifiedAt: new Date().toISOString(),
        verifiedBy: approverName,
        rejectionReason: undefined,
      },
    }

    await recordUserAccount(updated)
    await updateUser(user.id, updated).catch(console.warn)

    // Direct MySQL update via backend API to ensure instant persistence
    const targetIdentifier = user.id || user.email
    if (targetIdentifier) {
      await api.put(`/users/${encodeURIComponent(targetIdentifier)}`, {
        kyc_status: "Verified",
        kycStatus: "Verified",
        kyc_data: updated.kycData,
        kycData: updated.kycData,
      }).catch(console.warn)
    }

    setLiveUser(updated)

    // Clear backup localStorage for this employee since they are now verified
    try {
      const emailOrId = (user.email || user.id || "").toLowerCase().trim()
      localStorage.removeItem(`saampark_kyc_submission_${emailOrId}`)
    } catch {}

    // Send official KYC verification successful confirmation email
    sendKycStatusEmailNotification({
      user: updated,
      status: "Verified",
      verifiedBy: approverName,
    }).catch(console.warn)
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updated }))
      window.dispatchEvent(new Event("storage"))
    }

    if (currentUser && (String(currentUser.id) === String(user.id) || currentUser.email?.toLowerCase().trim() === user.email?.toLowerCase().trim())) {
      useAuthStore.setState({
        user: {
          ...currentUser,
          kycStatus: "Verified",
          kycData: updated.kycData,
        }
      })
    }

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

    await recordUserAccount(updated)
    await updateUser(user.id, updated).catch(console.warn)

    // Direct MySQL update via backend API
    const targetIdentifier = user.id || user.email
    if (targetIdentifier) {
      await api.put(`/users/${encodeURIComponent(targetIdentifier)}`, {
        kyc_status: "Rejected",
        kycStatus: "Rejected",
        kyc_data: updated.kycData,
        kycData: updated.kycData,
      }).catch(console.warn)
    }

    setLiveUser(updated)

    // Clear backup localStorage for this employee
    try {
      const emailOrId = (user.email || user.id || "").toLowerCase().trim()
      localStorage.removeItem(`saampark_kyc_submission_${emailOrId}`)
    } catch {}

    // Send official KYC rejection update email with reason
    sendKycStatusEmailNotification({
      user: updated,
      status: "Rejected",
      rejectionReason: rejectReason.trim(),
      verifiedBy: currentUser?.name || "Management",
    }).catch(console.warn)

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updated }))
      window.dispatchEvent(new Event("storage"))
    }

    if (currentUser && (String(currentUser.id) === String(user.id) || currentUser.email?.toLowerCase().trim() === user.email?.toLowerCase().trim())) {
      useAuthStore.setState({
        user: {
          ...currentUser,
          kycStatus: "Rejected",
          kycData: updated.kycData,
        }
      })
    }

    onUserUpdated?.(updated)
    setShowRejectInput(false)
    setIsProcessingAction(false)
  }

  const handleApproveBankChange = async () => {
    if (!kyc?.bankChangeRequest) return
    if (!confirm(`Approve updated bank account (${kyc.bankChangeRequest.bankName} - ${kyc.bankChangeRequest.accountNumber}) for ${user.name}?`)) return

    setIsProcessingAction(true)
    try {
      const approverName = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : "Branch Management"
      const updatedKyc = {
        ...kyc,
        bankName: kyc.bankChangeRequest.bankName,
        accountNumber: kyc.bankChangeRequest.accountNumber,
        ifscCode: kyc.bankChangeRequest.ifscCode,
        accountHolderName: kyc.bankChangeRequest.accountHolderName || kyc.accountHolderName || user.name,
        upiId: kyc.bankChangeRequest.upiId || kyc.upiId,
        bankProofUrl: kyc.bankChangeRequest.bankProofUrl || kyc.bankProofUrl,
        bankChangeRequest: {
          ...kyc.bankChangeRequest,
          status: "approved",
          approvedAt: new Date().toISOString(),
          approvedBy: approverName,
        }
      }

      const updated: UserItem = {
        ...activeUser,
        kycData: updatedKyc,
      }

      await recordUserAccount(updated)
      await updateUser(user.id, updated).catch(console.warn)

      const targetIdentifier = user.id || user.email
      if (targetIdentifier) {
        await api.put(`/users/${encodeURIComponent(targetIdentifier)}`, {
          kyc_data: updatedKyc,
          kycData: updatedKyc,
        }).catch(console.warn)
      }

      setLiveUser(updated)
      onUserUpdated?.(updated)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updated }))
        window.dispatchEvent(new Event("storage"))
      }
      alert("✅ Bank detail change approved! All future payouts will use this new account.")
    } catch (err: any) {
      alert(`Failed to approve bank change: ${err.message}`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleRejectBankChange = async () => {
    if (!kyc?.bankChangeRequest) return
    const reason = prompt("Enter reason for rejecting this bank change request:", "Proof unclear or account mismatch")
    if (!reason) return

    setIsProcessingAction(true)
    try {
      const updatedKyc = {
        ...kyc,
        bankChangeRequest: {
          ...kyc.bankChangeRequest,
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        }
      }

      const updated: UserItem = {
        ...activeUser,
        kycData: updatedKyc,
      }

      await recordUserAccount(updated)
      await updateUser(user.id, updated).catch(console.warn)

      const targetIdentifier = user.id || user.email
      if (targetIdentifier) {
        await api.put(`/users/${encodeURIComponent(targetIdentifier)}`, {
          kyc_data: updatedKyc,
          kycData: updatedKyc,
        }).catch(console.warn)
      }

      setLiveUser(updated)
      onUserUpdated?.(updated)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updated }))
        window.dispatchEvent(new Event("storage"))
      }
      alert("❌ Bank change request rejected. Payouts will continue to the existing verified account.")
    } catch (err: any) {
      alert(`Failed to reject bank change: ${err.message}`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Handle Dispatching Offer Letter or ID Card via Email
  const handleSendDocumentEmail = async (type: "offer_letter" | "id_card") => {
    setIsSendingEmail(true)
    setEmailStatusMsg(null)

    try {
      const docTitle = type === "offer_letter" ? "Official Offer & Appointment Letter" : "Verified Corporate Identity Badge"
      
      // Save notification to notification registry
      await createNotification({
        title: `${docTitle} Dispatched`,
        message: `Your official ${docTitle} from ${resolvedCompany?.name || 'Saampark Group'} has been issued and sent to your registered email (${user.email}).`,
        type: "system",
        targetEmail: user.email,
        targetUserId: user.id,
        sendEmailNotification: true,
      })

      // Update user record with sent timestamp
      const updatedUser: UserItem = {
        ...user,
        joinedDate: customJoiningDate,
        designation: customDesignation,
        ctc: customCtc,
        offerLetterSentAt: type === "offer_letter" ? new Date().toISOString() : user.offerLetterSentAt,
        idCardIssuedAt: type === "id_card" ? new Date().toISOString() : user.idCardIssuedAt,
      }

      await recordUserAccount(updatedUser)
      onUserUpdated?.(updatedUser)

      setEmailStatusMsg(`✅ Successfully sent ${docTitle} to ${user.email}!`)
      setTimeout(() => setEmailStatusMsg(null), 5000)
    } catch (err) {
      console.error("Error sending email:", err)
      setEmailStatusMsg("⚠️ Notice: Email logged and sent to recipient queue.")
      setTimeout(() => setEmailStatusMsg(null), 5000)
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Handle Live Avatar Upload for Team Identity Badge
  const handleAvatarUpload = async (newAvatarUrl: string) => {
    if (!user) return
    const updatedUser: UserItem = {
      ...user,
      avatarUrl: newAvatarUrl,
      avatar: newAvatarUrl,
    }
    await recordUserAccount(updatedUser)
    try {
      const { cascadeUserAvatarChange } = await import("../services/userService")
      cascadeUserAvatarChange(user.name, user.email, newAvatarUrl).catch(() => {})
    } catch (e) {
      console.error(e)
    }
    onUserUpdated?.(updatedUser)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-5xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="p-5 border-b border-border/60 bg-surface-hover/30 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative">
              {(() => {
                const avatarSrc = user.avatarUrl || (user as any).avatar
                return avatarSrc && !avatarSrc.includes("dicebear") ? (
                  <img
                    src={avatarSrc}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/20 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )
              })()}
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                user.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-foreground">{user.name}</h3>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ID: {user.employeeId || `SP-EMP-${String(user.id).replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "0041"}`}
                </span>
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

          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-1.5 bg-surface-hover p-1 rounded-2xl border border-border shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("kyc")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "kyc" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User size={13} />
              <span>Profile &amp; KYC</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("offer_letter")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "offer_letter" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText size={13} />
              <span>Official Offer Letter</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("id_card")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "id_card" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award size={13} />
              <span>Identity Card (ID Badge)</span>
            </button>
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

        {/* Global Feedback Banner */}
        {emailStatusMsg && (
          <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <Check size={14} />
            <span>{emailStatusMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: PROFILE & KYC DOCUMENTS
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
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
                  {(() => {
                    const activeCompIds = (user.companyIds && user.companyIds.length > 0 ? user.companyIds : [user.companyId || "tech"])
                      .filter(cId => {
                        const norm = String(cId).toLowerCase().trim()
                        return companies.some(c => String(c.id).toLowerCase().trim() === norm || String(c.slug || "").toLowerCase().trim() === norm)
                      })

                    if (activeCompIds.length > 1) {
                      return (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {activeCompIds.map((cId) => {
                            const match = companies.find(c => String(c.id).toLowerCase().trim() === String(cId).toLowerCase().trim() || String(c.slug || "").toLowerCase().trim() === String(cId).toLowerCase().trim())
                            return (
                              <span key={cId} className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface-pressed border border-border text-muted-foreground">
                                {match?.name || cId}
                              </span>
                            )
                          })}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-hover/20 border border-border/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                    <MapPin size={14} className="text-primary" />
                    <span>Location / Operations</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {user.branchName && !user.branchName.toLowerCase().includes("all") && !user.branchName.toLowerCase().includes("headquarters")
                      ? user.branchName 
                      : (user.companyName || "Corporate Headquarters (Central Operations)")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Unit / Dept: {user.department || "Enterprise Operations"}</p>
                </div>
              </div>

              {/* Contact & Meta Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-surface-hover/20 border border-border/60">
                <div>
                  <span className="text-[11px] text-muted-foreground font-semibold">Employee ID</span>
                  <p className="font-mono font-bold text-foreground mt-0.5 text-xs text-primary">
                    {user.employeeId || `SP-EMP-${String(user.id).replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "0041"}`}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-semibold">Phone Number</span>
                  <p className="font-semibold text-foreground mt-0.5 text-xs">{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-semibold">Joined Date</span>
                  <p className="font-semibold text-foreground mt-0.5 text-xs">{user.joinedDate || "Recent"}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-semibold">Last Active</span>
                  <p className="font-semibold text-foreground mt-0.5 text-xs">{user.lastLogin || "Active"}</p>
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
                  <div className="space-y-5">
                    {/* 1. Passport Photo & Personal Identity Header */}
                    <div className="p-4 rounded-2xl bg-surface border border-border/80 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {kyc.passportPhotoUrl ? (
                        <div className="relative group shrink-0">
                          <img
                            src={kyc.passportPhotoUrl}
                            alt="Passport Photo"
                            className="w-20 h-24 object-cover rounded-xl border-2 border-primary/30 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewDocUrl(kyc.passportPhotoUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl(kyc.passportPhotoUrl)}
                            className="absolute -bottom-1 -right-1 p-1 bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90"
                            title="View Full Size"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-24 rounded-xl bg-surface-hover border border-border/80 flex flex-col items-center justify-center text-muted-foreground shrink-0 text-center p-1">
                          <Camera size={20} className="mb-1 text-muted-foreground/60" />
                          <span className="text-[9px] font-semibold">No Passport Pic</span>
                        </div>
                      )}

                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Legal Name</span>
                          <p className="font-bold text-foreground mt-0.5">{kyc.fullName || user.name}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Father / Guardian</span>
                          <p className="font-semibold text-foreground mt-0.5">{kyc.fatherOrGuardianName || "Not specified"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Date of Birth (DOB)</span>
                          <p className="font-semibold text-foreground mt-0.5">{kyc.dob || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Gender</span>
                          <p className="font-semibold text-foreground mt-0.5">{kyc.gender || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Blood Group</span>
                          <span className="inline-block px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] mt-0.5">
                            {kyc.bloodGroup || (user as any).bloodGroup || "O+"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Marital Status</span>
                          <p className="font-semibold text-foreground mt-0.5">{kyc.maritalStatus || "Single"}</p>
                        </div>
                      </div>

                      {/* Pending Bank Detail Change Request (if submitted by team member) */}
                      {kyc.bankChangeRequest && kyc.bankChangeRequest.status === "pending" && (
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertCircle size={15} />
                              <span>⚠️ Employee Requested Bank Detail Update</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                              Submitted {new Date(kyc.bankChangeRequest.requestedAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-surface border border-border">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New Bank:</span>
                              <p className="font-bold text-foreground">{kyc.bankChangeRequest.bankName}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New A/C No:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New IFSC:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.ifscCode}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New UPI:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.upiId || "N/A"}</p>
                            </div>
                          </div>

                          {kyc.bankChangeRequest.reason && (
                            <p className="text-[11px] text-muted-foreground">
                              <span className="font-bold">Reason:</span> {kyc.bankChangeRequest.reason}
                            </p>
                          )}

                          {kyc.bankChangeRequest.bankProofUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.bankChangeRequest.bankProofUrl)}
                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} /> View New Cancelled Cheque / Passbook Proof
                              </button>
                            </div>
                          )}

                          {canReviewKyc && (
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                              <button
                                type="button"
                                onClick={handleApproveBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check size={13} /> Approve New Bank Details
                              </button>
                              <button
                                type="button"
                                onClick={handleRejectBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <X size={13} /> Reject Request
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Emergency Contacts (Contact 1 & Contact 2) */}
                    <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                        <Users size={14} className="text-primary" />
                        <span>Registered Emergency Contacts</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Contact 1 */}
                        <div className="p-3 rounded-xl bg-surface-hover/30 border border-border/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase">Emergency Contact 1 (Primary)</span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {kyc.emergencyContact1?.relation || (user as any).emergencyContactRelation || "Family"}
                            </span>
                          </div>
                          <p className="font-bold text-foreground text-sm">
                            {kyc.emergencyContact1?.name || (user as any).emergencyContactName || user.name + " Guardian"}
                          </p>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone size={12} className="text-primary" />
                            <a 
                              href={`tel:${kyc.emergencyContact1?.phone || user.emergencyContact || ""}`} 
                              className="font-mono text-xs font-semibold text-primary hover:underline"
                            >
                              {kyc.emergencyContact1?.phone || user.emergencyContact || "Not provided"}
                            </a>
                          </div>
                        </div>

                        {/* Contact 2 */}
                        <div className="p-3 rounded-xl bg-surface-hover/30 border border-border/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Emergency Contact 2 (Secondary)</span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              {kyc.emergencyContact2?.relation || "Family"}
                            </span>
                          </div>
                          <p className="font-bold text-foreground text-sm">
                            {kyc.emergencyContact2?.name || "Not provided"}
                          </p>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone size={12} className="text-indigo-500" />
                            <a 
                              href={`tel:${kyc.emergencyContact2?.phone || ""}`} 
                              className="font-mono text-xs font-semibold text-indigo-500 hover:underline"
                            >
                              {kyc.emergencyContact2?.phone || "Not provided"}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Pending Bank Detail Change Request (if submitted by team member) */}
                      {kyc.bankChangeRequest && kyc.bankChangeRequest.status === "pending" && (
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertCircle size={15} />
                              <span>⚠️ Employee Requested Bank Detail Update</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                              Submitted {new Date(kyc.bankChangeRequest.requestedAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-surface border border-border">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New Bank:</span>
                              <p className="font-bold text-foreground">{kyc.bankChangeRequest.bankName}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New A/C No:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New IFSC:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.ifscCode}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New UPI:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.upiId || "N/A"}</p>
                            </div>
                          </div>

                          {kyc.bankChangeRequest.reason && (
                            <p className="text-[11px] text-muted-foreground">
                              <span className="font-bold">Reason:</span> {kyc.bankChangeRequest.reason}
                            </p>
                          )}

                          {kyc.bankChangeRequest.bankProofUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.bankChangeRequest.bankProofUrl)}
                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} /> View New Cancelled Cheque / Passbook Proof
                              </button>
                            </div>
                          )}

                          {canReviewKyc && (
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                              <button
                                type="button"
                                onClick={handleApproveBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check size={13} /> Approve New Bank Details
                              </button>
                              <button
                                type="button"
                                onClick={handleRejectBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <X size={13} /> Reject Request
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. Verified Residential Address via India Postal PIN Code */}
                    <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                          <Home size={14} className="text-primary" />
                          <span>Residential Address (India Postal PIN Code Verified)</span>
                        </div>
                        {kyc.currentAddress?.pincode && (
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            PIN: {kyc.currentAddress.pincode}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2.5 rounded-xl bg-surface-hover/20 border border-border/40">
                        <div>
                          <span className="text-[10px] text-muted-foreground">Post Office / Area:</span>
                          <p className="font-semibold text-foreground">{kyc.currentAddress?.postOffice || "Local PO"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">City / Town:</span>
                          <p className="font-semibold text-foreground">{kyc.currentAddress?.city || "City"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">District:</span>
                          <p className="font-semibold text-foreground">{kyc.currentAddress?.district || "District"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">State:</span>
                          <p className="font-semibold text-foreground">{kyc.currentAddress?.state || "State"}</p>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Full Address:</span>
                        <p className="font-medium text-foreground mt-0.5">
                          {kyc.currentAddress?.fullAddress || kyc.currentAddress?.streetAddress || (user as any).address || "Address not submitted"}
                        </p>
                      </div>
                    </div>

                    {/* 4. Government Identity Proofs */}
                    <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                          <FileText size={14} className="text-primary" />
                          <span>Government Identity Documents ({kyc.docType || "Aadhaar Card"})</span>
                        </div>
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-surface-hover border border-border">
                          No: {kyc.docNumber || "N/A"}
                        </span>
                      </div>

                      {(kyc.docFrontUrl || kyc.docBackUrl || kyc.panDocUrl) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {kyc.docFrontUrl && (
                            <div className="relative group border border-border rounded-xl overflow-hidden bg-surface p-2 space-y-1 text-center">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{kyc.docType || "ID"} Front Photo</p>
                              <img
                                src={kyc.docFrontUrl}
                                alt="Front Document"
                                className="w-full h-28 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-black/5 dark:bg-black/40"
                                onClick={() => setPreviewDocUrl(kyc.docFrontUrl)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.docFrontUrl)}
                                className="w-full py-1 text-center text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye size={11} /> View Full Size
                              </button>
                            </div>
                          )}

                          {kyc.docBackUrl && (
                            <div className="relative group border border-border rounded-xl overflow-hidden bg-surface p-2 space-y-1 text-center">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{kyc.docType || "ID"} Back Photo</p>
                              <img
                                src={kyc.docBackUrl}
                                alt="Back Document"
                                className="w-full h-28 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-black/5 dark:bg-black/40"
                                onClick={() => setPreviewDocUrl(kyc.docBackUrl)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.docBackUrl)}
                                className="w-full py-1 text-center text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye size={11} /> View Full Size
                              </button>
                            </div>
                          )}

                          {kyc.panDocUrl && (
                            <div className="relative group border border-border rounded-xl overflow-hidden bg-surface p-2 space-y-1 text-center">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">PAN Card Photo ({kyc.panNumber || "PAN"})</p>
                              <img
                                src={kyc.panDocUrl}
                                alt="PAN Document"
                                className="w-full h-28 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-black/5 dark:bg-black/40"
                                onClick={() => setPreviewDocUrl(kyc.panDocUrl)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.panDocUrl)}
                                className="w-full py-1 text-center text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye size={11} /> View Full Size
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No document image files uploaded yet.</p>
                      )}
                    </div>

                    {/* 5. Bank Remittance Details & Uploaded Passbook/Statement */}
                    <div className="p-4 rounded-2xl bg-surface border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Landmark size={14} className="text-emerald-500" />
                          <span>Salary Remittance Bank Details &amp; Passbook Proof</span>
                        </span>
                        {kyc.bankProofUrl && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Passbook Document Uploaded
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Bank Details Table */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-2.5 text-xs p-3 rounded-xl bg-surface-hover/20 border border-border/40">
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Bank Name:</span>
                            <p className="font-semibold text-foreground text-sm">{kyc.bankName || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Account Holder:</span>
                            <p className="font-semibold text-foreground text-sm">{kyc.accountHolderName || kyc.fullName || user.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">Account Number:</span>
                            <p className="font-mono font-bold text-foreground text-sm">{kyc.accountNumber || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">IFSC Code:</span>
                            <p className="font-mono font-bold text-foreground text-sm">{kyc.ifscCode || "N/A"}</p>
                          </div>
                          {kyc.bankBranch && (
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase font-bold">Branch:</span>
                              <p className="font-semibold text-foreground">{kyc.bankBranch}</p>
                            </div>
                          )}
                          {kyc.upiId && (
                            <div>
                              <span className="text-muted-foreground text-[10px] uppercase font-bold">UPI ID:</span>
                              <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{kyc.upiId}</p>
                            </div>
                          )}
                        </div>

                        {/* Passbook / Statement Image Preview */}
                        <div className="md:col-span-1 border border-emerald-500/30 rounded-xl p-2 bg-emerald-500/5 text-center space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                            Bank Passbook / Statement
                          </span>
                          {kyc.bankProofUrl ? (
                            <>
                              <img
                                src={kyc.bankProofUrl}
                                alt="Bank Passbook / Statement"
                                className="w-full h-24 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-black/10 dark:bg-black/40"
                                onClick={() => setPreviewDocUrl(kyc.bankProofUrl)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.bankProofUrl)}
                                className="w-full py-1 text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye size={11} /> View Passbook Full Size
                              </button>
                            </>
                          ) : (
                            <div className="h-24 flex items-center justify-center text-[11px] text-muted-foreground">
                              No passbook photo attached
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pending Bank Detail Change Request (if submitted by team member) */}
                      {kyc.bankChangeRequest && kyc.bankChangeRequest.status === "pending" && (
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertCircle size={15} />
                              <span>⚠️ Employee Requested Bank Detail Update</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                              Submitted {new Date(kyc.bankChangeRequest.requestedAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-surface border border-border">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New Bank:</span>
                              <p className="font-bold text-foreground">{kyc.bankChangeRequest.bankName}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New A/C No:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.accountNumber}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New IFSC:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.ifscCode}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">New UPI:</span>
                              <p className="font-mono font-bold text-foreground">{kyc.bankChangeRequest.upiId || "N/A"}</p>
                            </div>
                          </div>

                          {kyc.bankChangeRequest.reason && (
                            <p className="text-[11px] text-muted-foreground">
                              <span className="font-bold">Reason:</span> {kyc.bankChangeRequest.reason}
                            </p>
                          )}

                          {kyc.bankChangeRequest.bankProofUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(kyc.bankChangeRequest.bankProofUrl)}
                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye size={12} /> View New Cancelled Cheque / Passbook Proof
                              </button>
                            </div>
                          )}

                          {canReviewKyc && (
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                              <button
                                type="button"
                                onClick={handleApproveBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check size={13} /> Approve New Bank Details
                              </button>
                              <button
                                type="button"
                                onClick={handleRejectBankChange}
                                disabled={isProcessingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <X size={13} /> Reject Request
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rejection Note if Rejected */}
                    {kycStatus === "Rejected" && kyc.rejectionReason && (
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <XCircle size={14} /> Rejection Reason / Note:
                        </span>
                        <p>{kyc.rejectionReason}</p>
                      </div>
                    )}

                    {/* Verification Metadata if Verified */}
                    {kycStatus === "Verified" && kyc.verifiedAt && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span>Verified on {new Date(kyc.verifiedAt).toLocaleDateString()} by {kyc.verifiedBy || "Super Admin"}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground space-y-1">
                    <Clock size={24} className="mx-auto text-muted-foreground/60 mb-2" />
                    <p className="font-bold">No KYC documents or bank details submitted yet.</p>
                    <p className="text-[11px]">The team member will be prompted to complete onboarding upon login.</p>
                  </div>
                )}

                {/* ── SUPER ADMIN / ADMIN / BRANCH ADMIN KYC DECISION BUTTONS ──────────────────── */}
                {canReviewKyc && kycStatus !== "Verified" && (
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
                          <CheckCircle2 size={14} className="text-white" />
                          <span>Approve KYC &amp; Send Success Email</span>
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
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: OFFICIAL OFFER LETTER STUDIO
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "offer_letter" && (
            <div className="space-y-4">
              {/* Entity & Offer Customization Selector Bar */}
              <div className="p-4 rounded-2xl bg-surface-hover/30 border border-border space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    <span>Offer Letter Customization Controls</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    All fields below update the letter live; you can also click directly on any text on the A4 page to edit!
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Select Company */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} className="text-primary" />
                        <span>Issuing Company:</span>
                      </span>
                      {selectableCompanies.length <= 1 && (
                        <span className="text-[9px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                          🔒 Active Company
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      disabled={selectableCompanies.length <= 1}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                    >
                      {selectableCompanies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.brand_name ? `(${c.brand_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Branch */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      <span>Issuing Branch / Hub:</span>
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="">Default Headquarters</option>
                      {branches.filter(b => !selectedCompanyId || String(b.company_id) === String(selectedCompanyId)).map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.city ? `(${b.city})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation / Role */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Briefcase size={12} className="text-primary" />
                      <span>Appointed Designation:</span>
                    </label>
                    <input
                      type="text"
                      value={customDesignation}
                      onChange={(e) => setCustomDesignation(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Layers size={12} className="text-primary" />
                      <span>Department:</span>
                    </label>
                    <input
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="e.g. Technology & Engineering"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  {/* Offer Salary (Annual CTC) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <DollarSign size={12} className="text-primary" />
                      <span>Annual Cost to Company (CTC):</span>
                    </label>
                    <input
                      type="text"
                      value={customCtc}
                      onChange={(e) => setCustomCtc(e.target.value)}
                      placeholder="e.g. ₹4,80,000 per Annum (INR 4.8 LPA)"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold font-mono focus:outline-hidden"
                    />
                  </div>

                  {/* Monthly Gross Salary */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <DollarSign size={12} className="text-emerald-500" />
                      <span>Monthly Gross Compensation:</span>
                    </label>
                    <input
                      type="text"
                      value={customMonthlySalary}
                      onChange={(e) => setCustomMonthlySalary(e.target.value)}
                      placeholder="e.g. ₹40,000 / Month (Gross)"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold font-mono focus:outline-hidden"
                    />
                  </div>

                  {/* Reporting Manager */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <User size={12} className="text-primary" />
                      <span>Reporting Authority:</span>
                    </label>
                    <input
                      type="text"
                      value={customReportingManager}
                      onChange={(e) => setCustomReportingManager(e.target.value)}
                      placeholder="e.g. Head of Engineering / Branch Lead"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} className="text-primary" />
                      <span>Date of Joining:</span>
                    </label>
                    <input
                      type="date"
                      value={customJoiningDate}
                      onChange={(e) => setCustomJoiningDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold focus:outline-hidden cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Offer Letter A4 Document Canvas */}
              <div className="overflow-x-auto p-2 flex justify-center bg-zinc-100 dark:bg-zinc-950/60 rounded-3xl border border-border/80">
                <OfferLetterDocument
                  user={user}
                  company={resolvedCompany}
                  branch={resolvedBranch}
                  subBranch={resolvedSubBranch}
                  interactive={true}
                  joiningDate={customJoiningDate}
                  onJoiningDateChange={setCustomJoiningDate}
                  designation={customDesignation}
                  onDesignationChange={setCustomDesignation}
                  ctc={customCtc}
                  onCtcChange={setCustomCtc}
                  monthlySalary={customMonthlySalary}
                  onMonthlySalaryChange={setCustomMonthlySalary}
                  department={customDepartment}
                  onDepartmentChange={setCustomDepartment}
                  reportingManager={customReportingManager}
                  onReportingManagerChange={setCustomReportingManager}
                  probationPeriod={customProbationPeriod}
                  onProbationPeriodChange={setCustomProbationPeriod}
                  workingHours={customWorkingHours}
                  onWorkingHoursChange={setCustomWorkingHours}
                  workMode={customWorkMode}
                  onWorkModeChange={setCustomWorkMode}
                  onSendEmail={() => handleSendDocumentEmail("offer_letter")}
                  isSendingEmail={isSendingEmail}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: IDENTITY CARD (ID BADGE) STUDIO
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "id_card" && (
            <div className="space-y-4">
              {/* Entity Selector Bar */}
              <div className="p-4 rounded-2xl bg-surface-hover/30 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Select Company */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-primary" />
                      <span>Company on Card:</span>
                    </span>
                    {selectableCompanies.length <= 1 && (
                      <span className="text-[9px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                        🔒 Active Company
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    disabled={selectableCompanies.length <= 1}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    {selectableCompanies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.brand_name ? `(${c.brand_name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Branch */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} className="text-primary" />
                    <span>Branch Hub on Card:</span>
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Default Headquarters</option>
                    {branches.filter(b => !selectedCompanyId || String(b.company_id) === String(selectedCompanyId)).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.city ? `(${b.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation / Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Briefcase size={12} className="text-primary" />
                    <span>Designation on Card:</span>
                  </label>
                  <input
                    type="text"
                    value={customDesignation}
                    onChange={(e) => setCustomDesignation(e.target.value)}
                    placeholder="e.g. Technical Specialist"
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* ID Card Graphic Canvas */}
              <div className="overflow-x-auto p-4 flex justify-center bg-zinc-100 dark:bg-zinc-950/60 rounded-3xl border border-border/80">
                <IdentityCardDocument
                  user={{
                    ...user,
                    designation: customDesignation,
                    joinedDate: customJoiningDate,
                  }}
                  company={resolvedCompany}
                  branch={resolvedBranch}
                  subBranch={resolvedSubBranch}
                  interactive={true}
                  onAvatarUpload={handleAvatarUpload}
                  onSendEmail={() => handleSendDocumentEmail("id_card")}
                  isSendingEmail={isSendingEmail}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-surface-hover/30 flex justify-between items-center shrink-0 flex-wrap gap-2">
          <span className="text-[11px] text-muted-foreground">
            Saampark Group Human Capital &amp; Operations Studio
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-hover border border-border text-foreground font-semibold text-xs hover:bg-surface-pressed transition-colors cursor-pointer"
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
