"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShieldCheck, Clock, AlertCircle, XCircle, CheckCircle2, 
  FileText, Upload, Building2, MapPin, Phone, Mail, User, 
  CreditCard, Landmark, RefreshCw, LogOut, Sparkles, Check, 
  ChevronRight, ArrowRight, Eye, ShieldAlert, Award, Camera,
  Users, Home, HelpCircle, X
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { updateUser, getUsers } from "@/app/feature/users/services/userService"
import { api } from "@/lib/api"
import { uploadToImgBB } from "@/lib/imgbbUpload"
import { createNotification } from "@/services/notificationService"

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Guardian",
  "Friend",
  "Relative",
  "Other",
]

function checkIsVerified(u: any): boolean {
  if (!u) return false
  const s = String(u.kycStatus || u.kyc_status || "").trim().toLowerCase()
  return s === "verified" || s === "approved" || u.isKycVerified === true
}

export function EmployeeKycGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const isEmployeeRole = user?.role === "Teams"
  
  // Real-time verification status state
  const [isVerifiedLive, setIsVerifiedLive] = React.useState<boolean>(() => checkIsVerified(user))

  // Active sync on mount & periodic polling to ensure approved status immediately unlocks
  React.useEffect(() => {
    if (!user || !isEmployeeRole) return

    let isMounted = true

    const syncLatestStatus = async () => {
      const idOrEmail = user.id || user.email
      if (!idOrEmail) return
      try {
        const res: any = await api.get(`/users/${encodeURIComponent(idOrEmail)}`)
        const fresh = res?.data || res
        if (fresh && isMounted) {
          if (checkIsVerified(fresh)) {
            // KYC has been verified by Admin!
            const emailOrId = (user.email || user.id || "").toLowerCase().trim()
            try {
              localStorage.removeItem(`saampark_kyc_submission_${emailOrId}`)
            } catch {}

            let parsedKyc = fresh.kyc_data || fresh.kycData
            if (typeof parsedKyc === "string") {
              try { parsedKyc = JSON.parse(parsedKyc) } catch {}
            }

            const updated = {
              ...user,
              ...fresh,
              kycStatus: "Verified" as const,
              kyc_status: "Verified",
              kycData: parsedKyc || user.kycData,
            }

            useAuthStore.setState({ user: updated })
            try {
              const raw = localStorage.getItem("saampark-auth-v3")
              if (raw) {
                const parsed = JSON.parse(raw)
                if (parsed?.state) {
                  parsed.state.user = updated
                  localStorage.setItem("saampark-auth-v3", JSON.stringify(parsed))
                }
              }
            } catch {}

            setIsVerifiedLive(true)
          }
        }
      } catch (err) {
        // Fallback silently if offline
      }
    }

    // Run immediately on mount
    syncLatestStatus()

    // Listen to window focus (when employee switches back to CRM tab after admin approves)
    window.addEventListener("focus", syncLatestStatus)
    window.addEventListener("saampark_kyc_updated", syncLatestStatus)
    window.addEventListener("storage", syncLatestStatus)

    // Periodic poll every 15 seconds if not yet verified
    const interval = setInterval(() => {
      if (!isVerifiedLive) {
        syncLatestStatus()
      }
    }, 15000)

    return () => {
      isMounted = false
      window.removeEventListener("focus", syncLatestStatus)
      window.removeEventListener("saampark_kyc_updated", syncLatestStatus)
      window.removeEventListener("storage", syncLatestStatus)
      clearInterval(interval)
    }
  }, [user, isEmployeeRole, isVerifiedLive])

  // If user is Super Admin, Admin, Clients, or already Verified, show normal app
  if (!user || !isEmployeeRole || isVerifiedLive || checkIsVerified(user)) {
    return <>{children}</>
  }

  return <EmployeeKycGateContent user={user} logout={logout} onVerified={() => setIsVerifiedLive(true)} />
}

interface ContentProps {
  user: any
  logout: () => void
  onVerified: () => void
}

function EmployeeKycGateContent({ user, logout, onVerified }: ContentProps) {
  const storeUser = useAuthStore((s) => s.user)

  // Dedicated backup localStorage lookup for this employee
  const getKycBackup = React.useCallback(() => {
    try {
      const emailOrId = (user?.email || user?.id || "").toLowerCase().trim()
      if (!emailOrId) return null
      const key = `saampark_kyc_submission_${emailOrId}`
      const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }, [user?.email, user?.id])

  const [localUser, setLocalUser] = React.useState<any>(() => {
    const backup = getKycBackup()
    const base = storeUser || user
    if (backup && (!base?.kycData || !base?.kycData?.docNumber)) {
      return {
        ...base,
        kycStatus: backup.kycStatus || "Processing",
        kycData: backup.kycData || backup,
      }
    }
    return base
  })

  // Track if this user has already submitted KYC
  const [isSubmittedLocally, setIsSubmittedLocally] = React.useState<boolean>(() => {
    if (user?.kycStatus === "Processing" || user?.kycData?.docNumber) return true
    return Boolean(getKycBackup())
  })

  React.useEffect(() => {
    if (storeUser) {
      if (checkIsVerified(storeUser)) {
        onVerified()
        return
      }
      setLocalUser((prev: any) => {
        const backup = getKycBackup()
        const resolvedKycStatus = storeUser.kycStatus || backup?.kycStatus || prev?.kycStatus || "Pending"
        const resolvedKycData = storeUser.kycData || backup?.kycData || prev?.kycData
        return {
          ...prev,
          ...storeUser,
          kycStatus: resolvedKycStatus,
          kycData: resolvedKycData,
        }
      })
    }
  }, [storeUser, getKycBackup, onVerified])

  const effectiveUser = localUser || storeUser || user
  const backupData = getKycBackup()
  const rawKyc = effectiveUser?.kycData || backupData?.kycData || backupData || {}
  const kycStatus = effectiveUser?.kycStatus || backupData?.kycStatus || (rawKyc?.docNumber ? "Processing" : "Pending")
  
  const hasSubmittedKyc = Boolean(
    isSubmittedLocally ||
    rawKyc?.docNumber || 
    effectiveUser?.kycStatus === "Processing" || 
    effectiveUser?.kycStatus === "Verified" ||
    Boolean(backupData?.docNumber || backupData?.kycData?.docNumber)
  )

  const [isReuploading, setIsReuploading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  // ── 1. PERSONAL INFORMATION STATE ───────────────────────────────────────────
  const [fullName, setFullName] = React.useState(rawKyc?.fullName || effectiveUser?.name || "")
  const [fatherOrGuardianName, setFatherOrGuardianName] = React.useState(rawKyc?.fatherOrGuardianName || "")
  const [dob, setDob] = React.useState(rawKyc?.dob || "")
  const [gender, setGender] = React.useState(rawKyc?.gender || "Male")
  const [maritalStatus, setMaritalStatus] = React.useState(rawKyc?.maritalStatus || "Single")
  const [bloodGroup, setBloodGroup] = React.useState(rawKyc?.bloodGroup || effectiveUser?.bloodGroup || "O+")
  const [phone, setPhone] = React.useState(effectiveUser?.phone || "")
  const [passportPhotoUrl, setPassportPhotoUrl] = React.useState<string>(rawKyc?.passportPhotoUrl || effectiveUser?.avatarUrl || "")

  // ── 2. EMERGENCY CONTACTS STATE (CONTACT 1 & CONTACT 2) ─────────────────────
  // Contact 1
  const [ec1Name, setEc1Name] = React.useState(rawKyc?.emergencyContact1?.name || effectiveUser?.emergencyContactName || "")
  const [ec1Relation, setEc1Relation] = React.useState(rawKyc?.emergencyContact1?.relation || "Father")
  const [ec1CustomRelation, setEc1CustomRelation] = React.useState(rawKyc?.emergencyContact1?.customRelation || "")
  const [ec1Phone, setEc1Phone] = React.useState(rawKyc?.emergencyContact1?.phone || effectiveUser?.emergencyContact || "")

  // Contact 2 (Explicitly requested by user!)
  const [ec2Name, setEc2Name] = React.useState(rawKyc?.emergencyContact2?.name || "")
  const [ec2Relation, setEc2Relation] = React.useState(rawKyc?.emergencyContact2?.relation || "Mother")
  const [ec2CustomRelation, setEc2CustomRelation] = React.useState(rawKyc?.emergencyContact2?.customRelation || "")
  const [ec2Phone, setEc2Phone] = React.useState(rawKyc?.emergencyContact2?.phone || "")

  // ── 3. ADDRESS WITH INDIA POSTAL PIN CODE API STATE ────────────────────────
  const [pincode, setPincode] = React.useState(rawKyc?.currentAddress?.pincode || "")
  const [pinLookupStatus, setPinLookupStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [pinLookupMsg, setPinLookupMsg] = React.useState<string | null>(null)
  const [availablePostOffices, setAvailablePostOffices] = React.useState<string[]>([])
  const [selectedPostOffice, setSelectedPostOffice] = React.useState(rawKyc?.currentAddress?.postOffice || "")
  const [district, setDistrict] = React.useState(rawKyc?.currentAddress?.district || "")
  const [state, setState] = React.useState(rawKyc?.currentAddress?.state || "")
  const [city, setCity] = React.useState(rawKyc?.currentAddress?.city || "")
  const [streetAddress, setStreetAddress] = React.useState(rawKyc?.currentAddress?.streetAddress || effectiveUser?.address || "")
  const [landmark, setLandmark] = React.useState(rawKyc?.currentAddress?.landmark || "")

  // PIN Code Lookup Handler
  const handlePincodeLookup = React.useCallback(async (pin: string) => {
    const cleanPin = pin.trim().replace(/\D/g, "")
    setPincode(cleanPin)

    if (cleanPin.length !== 6) {
      setPinLookupStatus("idle")
      setPinLookupMsg(null)
      return
    }

    setPinLookupStatus("loading")
    setPinLookupMsg("Looking up postal records for " + cleanPin + "...")

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
      const data = await res.json()

      if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const poList = data[0].PostOffice
        const first = poList[0]

        const stateFound = first.State || ""
        const districtFound = first.District || ""
        const cityFound = first.Block || first.Division || first.District || ""
        const poNames = Array.from(new Set(poList.map((p: any) => p.Name).filter(Boolean))) as string[]

        setState(stateFound)
        setDistrict(districtFound)
        setCity(cityFound)
        setAvailablePostOffices(poNames)
        if (poNames.length > 0 && (!selectedPostOffice || !poNames.includes(selectedPostOffice))) {
          setSelectedPostOffice(poNames[0])
        }

        setPinLookupStatus("success")
        setPinLookupMsg(`Found ${poNames.length} Post Office(s) in ${districtFound}, ${stateFound}`)
      } else {
        setPinLookupStatus("error")
        setPinLookupMsg("Pincode not found in Postal registry. You can still enter details manually.")
      }
    } catch (err) {
      setPinLookupStatus("error")
      setPinLookupMsg("Could not connect to Postal PIN API. Please enter location manually.")
    }
  }, [selectedPostOffice])

  // Trigger PIN lookup if pincode was prefilled
  React.useEffect(() => {
    if (pincode && pincode.length === 6 && pinLookupStatus === "idle") {
      handlePincodeLookup(pincode)
    }
  }, [])

  // ── 4. IDENTITY DOCUMENTS STATE ─────────────────────────────────────────────
  const [docType, setDocType] = React.useState<string>(rawKyc?.docType || "Aadhaar Card")
  const [docNumber, setDocNumber] = React.useState(rawKyc?.docNumber || "")
  const [docFrontUrl, setDocFrontUrl] = React.useState(rawKyc?.docFrontUrl || "")
  const [docBackUrl, setDocBackUrl] = React.useState(rawKyc?.docBackUrl || "")

  // Optional PAN card upload if primary doc is not PAN
  const [panNumber, setPanNumber] = React.useState(rawKyc?.panNumber || (rawKyc?.docType === "PAN Card" ? rawKyc?.docNumber : ""))
  const [panDocUrl, setPanDocUrl] = React.useState(rawKyc?.panDocUrl || "")

  // ── 5. BANK REMITTANCE & PASSBOOK/STATEMENT STATE ───────────────────────────
  const [bankName, setBankName] = React.useState(rawKyc?.bankName || "")
  const [accountHolderName, setAccountHolderName] = React.useState(rawKyc?.accountHolderName || effectiveUser?.name || "")
  const [accountNumber, setAccountNumber] = React.useState(rawKyc?.accountNumber || "")
  const [confirmAccountNumber, setConfirmAccountNumber] = React.useState(rawKyc?.accountNumber || "")
  const [ifscCode, setIfscCode] = React.useState(rawKyc?.ifscCode || "")
  const [bankBranch, setBankBranch] = React.useState(rawKyc?.bankBranch || "")
  const [upiId, setUpiId] = React.useState(rawKyc?.upiId || "")
  const [bankProofUrl, setBankProofUrl] = React.useState(rawKyc?.bankProofUrl || "") // Passbook / Statement

  // Declaration & errors
  const [declarationAccepted, setDeclarationAccepted] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Uploading flags
  const [uploadingPassport, setUploadingPassport] = React.useState(false)
  const [uploadingFront, setUploadingFront] = React.useState(false)
  const [uploadingBack, setUploadingBack] = React.useState(false)
  const [uploadingPan, setUploadingPan] = React.useState(false)
  const [uploadingBankProof, setUploadingBankProof] = React.useState(false)

  // Universal File Upload Handler
  const handleFileUpload = async (
    file: File, 
    target: "passport" | "front" | "back" | "pan" | "bankProof"
  ) => {
    if (!file) return

    const setterMap = {
      passport: { setUploading: setUploadingPassport, setUrl: setPassportPhotoUrl },
      front: { setUploading: setUploadingFront, setUrl: setDocFrontUrl },
      back: { setUploading: setUploadingBack, setUrl: setDocBackUrl },
      pan: { setUploading: setUploadingPan, setUrl: setPanDocUrl },
      bankProof: { setUploading: setUploadingBankProof, setUrl: setBankProofUrl },
    }

    const { setUploading, setUrl } = setterMap[target]
    setUploading(true)
    setFormError(null)

    try {
      const res = await uploadToImgBB(file, `${effectiveUser?.name || "employee"}_kyc_${target}`, 1200)
      if (res && res.url) {
        setUrl(res.url)
      } else {
        // Fallback: Read as base64 data URL
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) setUrl(String(e.target.result))
        }
        reader.readAsDataURL(file)
      }
    } catch (err: any) {
      console.warn("Upload error, using local data URL fallback:", err)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) setUrl(String(e.target.result))
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  // Refresh status check against database
  const handleCheckStatus = async () => {
    setIsRefreshing(true)
    setStatusMessage(null)
    try {
      const userIdOrEmail = effectiveUser?.id || effectiveUser?.email
      let freshUser: any = null
      if (userIdOrEmail) {
        try {
          const res: any = await api.get(`/users/${encodeURIComponent(userIdOrEmail)}`)
          freshUser = res?.data || res
        } catch {}
      }

      if (!freshUser || !freshUser.id) {
        try {
          const allUsers = await getUsers("all")
          freshUser = allUsers.find(
            (u) =>
              String(u.id) === String(effectiveUser?.id) ||
              (u.email && u.email.toLowerCase().trim() === effectiveUser?.email?.toLowerCase().trim())
          )
        } catch {}
      }

      if (freshUser) {
        const isNowVerified = checkIsVerified(freshUser)
        let freshKyc = freshUser.kyc_status || freshUser.kycStatus
        let freshKycData = freshUser.kyc_data || freshUser.kycData
        if (typeof freshKycData === "string") {
          try { freshKycData = JSON.parse(freshKycData) } catch {}
        }

        if (isNowVerified) {
          const emailOrId = (effectiveUser?.email || effectiveUser?.id || "").toLowerCase().trim()
          try {
            localStorage.removeItem(`saampark_kyc_submission_${emailOrId}`)
          } catch {}

          const merged = {
            ...effectiveUser,
            ...freshUser,
            kycStatus: "Verified" as const,
            kyc_status: "Verified",
            kycData: freshKycData || effectiveUser?.kycData,
          }
          useAuthStore.setState({ user: merged })
          try {
            const raw = localStorage.getItem("saampark-auth-v3")
            if (raw) {
              const parsed = JSON.parse(raw)
              if (parsed?.state) {
                parsed.state.user = merged
                localStorage.setItem("saampark-auth-v3", JSON.stringify(parsed))
              }
            }
          } catch {}

          setStatusMessage("✅ KYC Verification Approved! Unlocking your workspace...")
          setTimeout(() => {
            onVerified()
          }, 600)
          return
        }

        if (!freshKyc || freshKyc === "Pending") {
          freshKyc = (freshKycData?.docNumber || isSubmittedLocally) ? "Processing" : "Pending"
        }

        const merged = {
          ...effectiveUser,
          ...freshUser,
          kycStatus: freshKyc,
          kycData: freshKycData || effectiveUser?.kycData,
        }
        setLocalUser(merged)
        useAuthStore.setState({ user: merged })
        setIsSubmittedLocally(freshKyc === "Processing" || freshKyc === "Verified" || Boolean(merged.kycData?.docNumber))

        setStatusMessage(`Current Status: Under Review by Management (${freshKyc})`)
      } else {
        setStatusMessage("Documents are currently under review by Branch Management.")
      }
    } catch {
      setStatusMessage("Verification status: Under review.")
    } finally {
      setIsRefreshing(false)
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  // Form Submit
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!fullName.trim()) {
      setFormError("Please enter your full legal name.")
      return
    }
    if (!phone.trim()) {
      setFormError("Please enter your active mobile phone number.")
      return
    }
    if (!ec1Name.trim() || !ec1Phone.trim()) {
      setFormError("Please provide Emergency Contact 1 details (Name and Phone).")
      return
    }
    if (!ec2Name.trim() || !ec2Phone.trim()) {
      setFormError("Please provide Emergency Contact 2 details (Name and Phone).")
      return
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setFormError("Please enter a valid 6-digit Indian PIN Code.")
      return
    }
    if (!streetAddress.trim()) {
      setFormError("Please enter your street address / flat / house number.")
      return
    }
    if (!docNumber.trim()) {
      setFormError(`Please enter your valid ${docType} identification number.`)
      return
    }
    if (!docFrontUrl) {
      setFormError(`Please upload the front photo of your ${docType}.`)
      return
    }
    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setFormError("Please provide complete bank account details for salary remittance.")
      return
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      setFormError("Bank account numbers do not match. Please verify carefully.")
      return
    }
    if (!bankProofUrl) {
      setFormError("Please upload a photo of your Bank Passbook or Bank Statement or Cancelled Cheque.")
      return
    }
    if (!declarationAccepted) {
      setFormError("Please accept the legal affirmation declaration before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      const fullAddrComputed = [
        streetAddress.trim(),
        landmark.trim() ? `Near ${landmark.trim()}` : "",
        selectedPostOffice ? `PO: ${selectedPostOffice}` : "",
        city.trim(),
        district.trim(),
        state.trim(),
        `PIN: ${pincode.trim()}`,
        "India"
      ].filter(Boolean).join(", ")

      const kycDataPayload = {
        fullName: fullName.trim(),
        fatherOrGuardianName: fatherOrGuardianName.trim() || undefined,
        dob: dob || undefined,
        gender,
        maritalStatus,
        bloodGroup,
        passportPhotoUrl: passportPhotoUrl || undefined,

        // Emergency Contacts
        emergencyContact1: {
          name: ec1Name.trim(),
          relation: ec1Relation === "Other" && ec1CustomRelation.trim() ? ec1CustomRelation.trim() : ec1Relation,
          customRelation: ec1Relation === "Other" ? ec1CustomRelation.trim() : undefined,
          phone: ec1Phone.trim(),
        },
        emergencyContact2: {
          name: ec2Name.trim(),
          relation: ec2Relation === "Other" && ec2CustomRelation.trim() ? ec2CustomRelation.trim() : ec2Relation,
          customRelation: ec2Relation === "Other" ? ec2CustomRelation.trim() : undefined,
          phone: ec2Phone.trim(),
        },

        // Address
        currentAddress: {
          pincode: pincode.trim(),
          state: state.trim(),
          district: district.trim(),
          city: city.trim(),
          postOffice: selectedPostOffice || undefined,
          streetAddress: streetAddress.trim(),
          landmark: landmark.trim() || undefined,
          fullAddress: fullAddrComputed,
        },

        // Government IDs
        docType,
        docNumber: docNumber.trim().toUpperCase(),
        docFrontUrl,
        docBackUrl: docBackUrl || undefined,
        panNumber: panNumber.trim().toUpperCase() || undefined,
        panDocUrl: panDocUrl || undefined,

        // Bank Remittance
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim() || fullName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankBranch: bankBranch.trim() || undefined,
        upiId: upiId.trim() || undefined,
        bankProofUrl,

        submittedAt: new Date().toISOString(),
        rejectionReason: undefined,
      }

      const updatedUser = {
        ...effectiveUser,
        phone: phone.trim() || effectiveUser?.phone,
        bloodGroup,
        emergencyContact: ec1Phone.trim() || (effectiveUser as any)?.emergencyContact,
        emergencyContactName: ec1Name.trim(),
        address: fullAddrComputed,
        avatarUrl: passportPhotoUrl || effectiveUser?.avatarUrl,
        avatar: passportPhotoUrl || effectiveUser?.avatar,
        kycStatus: "Processing" as const,
        kyc_status: "Processing",
        kycData: kycDataPayload,
      }

      // 1. Lock submitted state in component UI
      setIsSubmittedLocally(true)
      setIsReuploading(false)
      setLocalUser(updatedUser)

      // 2. Save dedicated backup key to localStorage
      try {
        const emailOrId = (effectiveUser?.email || effectiveUser?.id || "").toLowerCase().trim()
        if (emailOrId) {
          const key = `saampark_kyc_submission_${emailOrId}`
          localStorage.setItem(key, JSON.stringify({
            kycStatus: "Processing",
            kycData: kycDataPayload,
            docNumber: kycDataPayload.docNumber,
            submittedAt: new Date().toISOString(),
          }))
        }
      } catch {}

      // 3. Immediately update global auth store
      useAuthStore.setState({ user: updatedUser })

      // 4. Update zustand persistent storage (saampark-auth-v3)
      try {
        const raw = localStorage.getItem("saampark-auth-v3")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.state) {
            parsed.state.user = updatedUser
            localStorage.setItem("saampark-auth-v3", JSON.stringify(parsed))
          }
        }
      } catch {}

      // 5. Update live MySQL database & backend API
      try {
        await updateUser(effectiveUser?.id || effectiveUser?.email, updatedUser)
        await api.put(`/users/${encodeURIComponent(effectiveUser?.id || effectiveUser?.email)}`, {
          kyc_status: "Processing",
          kycStatus: "Processing",
          kyc_data: kycDataPayload,
          kycData: kycDataPayload,
          phone: phone.trim() || undefined,
          avatar_url: passportPhotoUrl || undefined,
        }).catch(err => console.warn("Direct /users KYC put warning:", err))
      } catch (saveErr) {
        console.warn("Background updateUser warning:", saveErr)
      }

      // 6. Notify Super Admin / Branch Admin
      createNotification({
        title: `New Team KYC Submitted: ${fullName.trim()}`,
        message: `${fullName.trim()} (${effectiveUser?.branchName || "Branch"}) has submitted full onboarding credentials & bank details awaiting review.`,
        type: "system",
        targetUserId: "admin",
      }).catch(() => {})

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("saampark_kyc_updated", { detail: updatedUser }))
        window.dispatchEvent(new Event("storage"))
      }
    } catch (err: any) {
      console.error("KYC submit error:", err)
      setFormError(err?.message || "Failed to submit KYC documents. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine whether to show the submission form or the pending review screen
  const showForm = isReuploading || (!hasSubmittedKyc && kycStatus !== "Processing")

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-2 sm:px-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>SAAMPARK Group • Team Member Onboarding &amp; Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {showForm ? "Complete Team Member Onboarding" : "KYC Documents Under Review"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {showForm
                ? "Please fill out your official profile, emergency contacts, address with PIN Code, identity documents, and salary remittance bank passbook."
                : "Your onboarding credentials have been submitted safely and are currently under verification by management."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {isReuploading && (
              <button
                type="button"
                onClick={() => setIsReuploading(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:text-white bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Back to Status</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* ─── CASE A: PENDING REVIEW SCREEN ─────────────────────────────────── */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 text-zinc-900 dark:text-zinc-100"
          >
            {/* Status Hero */}
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                  <Clock size={38} className="animate-pulse" />
                </div>
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-[11px] font-bold">
                  !
                </span>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <Clock size={12} />
                  <span>Verification Pending Approval</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">Documents Under Review by Management</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                  Your KYC credentials, emergency contacts, and bank passbook details have been submitted. An Administrator or your Branch Lead ({effectiveUser?.branchName || "Main Office"}) will verify and approve your account shortly.
                </p>
              </div>
            </div>

            {/* Submitted Summary Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Profile Photo & Personal */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Identity Profile:
                </span>
                <div className="flex items-center gap-3">
                  {rawKyc?.passportPhotoUrl ? (
                    <img src={rawKyc.passportPhotoUrl} alt="Passport" className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {fullName.substring(0, 2).toUpperCase() || "SP"}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{rawKyc?.fullName || fullName || effectiveUser?.name}</h4>
                    <p className="text-[10px] text-zinc-500">Blood Group: {rawKyc?.bloodGroup || bloodGroup}</p>
                    <p className="text-[10px] text-zinc-500">{phone || effectiveUser?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Govt Identity Document */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Government Identity:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-500" />
                    <span>{rawKyc?.docType || docType}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {rawKyc?.docNumber ? `•••• •••• ${String(rawKyc.docNumber).slice(-4)}` : "Submitted"}
                  </span>
                </div>
                {rawKyc?.submittedAt && (
                  <p className="text-[10px] text-zinc-500">
                    Submitted: {new Date(rawKyc.submittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                )}
              </div>

              {/* Bank Passbook & Account */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Salary Bank Remittance:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Landmark size={14} className="text-emerald-500" />
                    <span>{rawKyc?.bankName || bankName || "Bank"}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {rawKyc?.accountNumber ? `•••• ${String(rawKyc.accountNumber).slice(-4)}` : "Uploaded"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  IFSC: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{rawKyc?.ifscCode || ifscCode || "N/A"}</strong>
                  {rawKyc?.bankProofUrl && " • Passbook Uploaded"}
                </p>
              </div>
            </div>

            {/* Emergency Contacts Summary Card */}
            {(rawKyc?.emergencyContact1?.name || rawKyc?.emergencyContact2?.name) && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Registered Emergency Contacts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rawKyc?.emergencyContact1?.name && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Contact 1 ({rawKyc.emergencyContact1.relation || "Emergency"})</span>
                      <p className="font-bold text-foreground mt-0.5">{rawKyc.emergencyContact1.name}</p>
                      <p className="font-mono text-[11px] text-primary">{rawKyc.emergencyContact1.phone}</p>
                    </div>
                  )}
                  {rawKyc?.emergencyContact2?.name && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Contact 2 ({rawKyc.emergencyContact2.relation || "Emergency"})</span>
                      <p className="font-bold text-foreground mt-0.5">{rawKyc.emergencyContact2.name}</p>
                      <p className="font-mono text-[11px] text-primary">{rawKyc.emergencyContact2.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Notification Notice */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <Mail size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Instant Activation upon Management Approval:</strong>
                <span>
                  Once verified by management, you will receive an official approval email at <strong>{effectiveUser?.email}</strong> and your CRM portal will unlock automatically in this window.
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-center text-xs font-bold text-blue-700 dark:text-blue-300">
                {statusMessage}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsReuploading(true)}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Edit or Re-upload Information
              </button>

              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isRefreshing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "Checking Server..." : "Check Verification Status"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── CASE B: KYC SUBMISSION FORM ───────────────────────────────────── */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-zinc-900 dark:text-zinc-100"
          >
            {kycStatus === "Rejected" && user.kycData?.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 mb-6 flex items-start gap-3 text-xs">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Verification Correction Required:</strong>
                  <span>{user.kycData.rejectionReason}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="space-y-8">
              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 1: PERSONAL IDENTITY & PASSPORT PHOTO
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Personal Identity &amp; Passport Photo
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {/* Passport Photo Upload Box */}
                  <div className="md:col-span-1 p-3.5 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-center space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Passport Size Photo *
                    </span>
                    {passportPhotoUrl ? (
                      <div className="relative mx-auto w-28 h-32 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md">
                        <img src={passportPhotoUrl} alt="Passport Photo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPassportPhotoUrl("")}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer min-h-[120px]">
                        <Camera size={26} className="text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Photo</span>
                        <span className="text-[9px] text-zinc-400 mt-0.5">Passport Headshot (JPG/PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "passport")}
                          className="hidden"
                          disabled={uploadingPassport}
                        />
                      </label>
                    )}
                    {uploadingPassport && <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Uploading Photo...</p>}
                  </div>

                  {/* Personal Inputs Grid */}
                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As shown in Government ID"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Father&apos;s / Guardian&apos;s Name *</label>
                      <input
                        type="text"
                        value={fatherOrGuardianName}
                        onChange={(e) => setFatherOrGuardianName(e.target.value)}
                        placeholder="Father or Legal Guardian"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Date of Birth (DOB) *</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Primary Mobile Phone *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Marital Status</label>
                        <select
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 2: EMERGENCY CONTACTS (CONTACT 1 & CONTACT 2)
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Emergency Contacts (Contact 1 &amp; Contact 2)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Emergency Contact 1 Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Phone size={14} />
                      <span>Emergency Contact 1 (Primary) *</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        value={ec1Name}
                        onChange={(e) => setEc1Name(e.target.value)}
                        placeholder="e.g. Ramesh Ghosh"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Relationship *</label>
                        <select
                          value={ec1Relation}
                          onChange={(e) => setEc1Relation(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          {RELATIONSHIP_OPTIONS.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      </div>

                      {ec1Relation === "Other" ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Specify Relation *</label>
                          <input
                            type="text"
                            value={ec1CustomRelation}
                            onChange={(e) => setEc1CustomRelation(e.target.value)}
                            placeholder="e.g. Uncle / Roommate"
                            required
                            className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Relationship Type</label>
                          <span className="block px-2.5 py-1.5 text-xs text-muted-foreground bg-muted/40 rounded-xl border border-border/50">
                            {ec1Relation}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={ec1Phone}
                        onChange={(e) => setEc1Phone(e.target.value)}
                        placeholder="+91 98765 00001"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact 2 Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Phone size={14} />
                      <span>Emergency Contact 2 (Secondary) *</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        value={ec2Name}
                        onChange={(e) => setEc2Name(e.target.value)}
                        placeholder="e.g. Sunita Ghosh"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Relationship *</label>
                        <select
                          value={ec2Relation}
                          onChange={(e) => setEc2Relation(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          {RELATIONSHIP_OPTIONS.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      </div>

                      {ec2Relation === "Other" ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Specify Relation *</label>
                          <input
                            type="text"
                            value={ec2CustomRelation}
                            onChange={(e) => setEc2CustomRelation(e.target.value)}
                            placeholder="e.g. Cousin / Neighbor"
                            required
                            className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Relationship Type</label>
                          <span className="block px-2.5 py-1.5 text-xs text-muted-foreground bg-muted/40 rounded-xl border border-border/50">
                            {ec2Relation}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={ec2Phone}
                        onChange={(e) => setEc2Phone(e.target.value)}
                        placeholder="+91 98765 00002"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 3: RESIDENTIAL ADDRESS WITH PIN CODE API (PIN FIRST)
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">3</div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                      Residential Address (Fill PIN Code First)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    ⚡ India Postal API Integrated
                  </span>
                </div>

                {/* Step 3.1: PIN CODE INPUT FIRST */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                        1. Enter 6-Digit Indian PIN Code *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => handlePincodeLookup(e.target.value)}
                          placeholder="e.g. 700001 or 721139"
                          required
                          className="w-full px-3 py-2 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                        {pinLookupStatus === "loading" && (
                          <div className="absolute right-3 top-2.5">
                            <RefreshCw size={14} className="animate-spin text-indigo-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground block">
                        Postal API Lookup Feedback:
                      </span>
                      {pinLookupMsg ? (
                        <div className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                          pinLookupStatus === "success" 
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : pinLookupStatus === "loading"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        }`}>
                          {pinLookupStatus === "success" ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
                          <span>{pinLookupMsg}</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          Type your 6-digit postal code above to auto-detect your State, District, and Post Office area.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Auto-populated Location Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    {/* Select Post Office */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        Post Office / Area *
                      </label>
                      {availablePostOffices.length > 0 ? (
                        <select
                          value={selectedPostOffice}
                          onChange={(e) => setSelectedPostOffice(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          {availablePostOffices.map((po) => (
                            <option key={po} value={po}>{po}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedPostOffice}
                          onChange={(e) => setSelectedPostOffice(e.target.value)}
                          placeholder="e.g. Balichak PO"
                          className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      )}
                    </div>

                    {/* City / Block */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        City / Town / Block *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        District *
                      </label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="District"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        required
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3.2: STREET & HOUSE DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      2. House No. / Flat / Building / Street Address *
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Flat 3B, Sunshine Heights, Station Road"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near SBI Balichak Branch"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Full Address Preview */}
                {(streetAddress || city || pincode) && (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-muted-foreground flex items-start gap-2">
                    <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Computed Full Address: </strong>
                      <span>
                        {[streetAddress, landmark ? `Near ${landmark}` : "", selectedPostOffice ? `PO: ${selectedPostOffice}` : "", city, district, state, pincode ? `PIN: ${pincode}` : "", "India"].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 4: GOVERNMENT IDENTITY PROOF
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">4</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Government Identification Document
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Primary Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card (12 Digits)</option>
                      <option value="PAN Card">PAN Card (10 Characters)</option>
                      <option value="Voter ID">Voter ID / EPIC Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Document Identification Number *</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                      placeholder={docType === "Aadhaar Card" ? "XXXX XXXX XXXX" : docType === "PAN Card" ? "ABCDE1234F" : "Document Number"}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                {/* Upload Photos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Photo */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-3">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {docType} Front Photo *
                    </span>
                    {docFrontUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36 mx-auto bg-black/10">
                        <img src={docFrontUrl} alt="Document Front" className="w-full h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => setDocFrontUrl("")}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-[10px] cursor-pointer shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
                        <Upload size={22} className="text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Front Side</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "front")}
                          className="hidden"
                          disabled={uploadingFront}
                        />
                      </label>
                    )}
                    {uploadingFront && <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Uploading Front Photo...</p>}
                  </div>

                  {/* Back Photo */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-center space-y-3">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                      {docType} Back Side Photo (Address Side)
                    </span>
                    {docBackUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36 mx-auto bg-black/10">
                        <img src={docBackUrl} alt="Document Back" className="w-full h-32 object-contain" />
                        <button
                          type="button"
                          onClick={() => setDocBackUrl("")}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-[10px] cursor-pointer shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer">
                        <Upload size={22} className="text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Back Side</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "back")}
                          className="hidden"
                          disabled={uploadingBack}
                        />
                      </label>
                    )}
                    {uploadingBack && <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Uploading Back Photo...</p>}
                  </div>
                </div>

                {/* Additional PAN Card if primary is Aadhaar/Voter */}
                {docType !== "PAN Card" && (
                  <div className="p-3.5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">PAN Card (For Tax &amp; Payroll Compliance)</span>
                      <span className="text-[10px] text-muted-foreground">Recommended</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        placeholder="Permanent Account Number (e.g. ABCDE1234F)"
                        maxLength={10}
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs font-mono uppercase"
                      />
                      <div className="flex items-center gap-2">
                        {panDocUrl ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                            <CheckCircle2 size={16} />
                            <span>PAN Document Uploaded</span>
                            <button type="button" onClick={() => setPanDocUrl("")} className="text-rose-500 text-xs ml-1 hover:underline cursor-pointer">Remove</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-surface text-xs font-semibold hover:bg-surface-hover cursor-pointer">
                            <Upload size={13} className="text-indigo-500" />
                            <span>{uploadingPan ? "Uploading..." : "Upload PAN Card Photo"}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "pan")}
                              className="hidden"
                              disabled={uploadingPan}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 5: SALARY BANK REMITTANCE & PASSBOOK UPLOAD
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Salary Remittance Bank Details &amp; Passbook Upload
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, HDFC, ICICI"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as printed in Bank Passbook"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Bank Branch Name</label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Balichak Branch / Kolkata Main"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Account Number *</label>
                    <input
                      type="password"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                      placeholder="Enter Bank Account Number"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Confirm Account Number *</label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))}
                      placeholder="Re-enter Account Number"
                      required
                      className={`w-full px-3 py-2 rounded-xl border ${confirmAccountNumber && confirmAccountNumber !== accountNumber ? "border-rose-500 bg-rose-50/20" : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"} text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">Bank IFSC Code *</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">UPI VPA ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Bank Passbook / Statement Upload Box (Explicitly Requested by User!) */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Landmark size={15} />
                      <span>Bank Passbook / Statement / Cancelled Cheque Document *</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Required for Salary Remittance</span>
                  </div>

                  {bankProofUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-700 max-h-48 mx-auto bg-black/10 p-2">
                      <img src={bankProofUrl} alt="Bank Passbook / Statement" className="w-full h-40 object-contain rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setBankProofUrl("")}
                        className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 text-xs shadow-md cursor-pointer transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer">
                      <Upload size={28} className="text-emerald-600 mb-2" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Upload Bank Passbook (Front Page) or Bank Statement
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                        Ensure Account Number, IFSC Code, and Name are clearly visible (JPG, PNG, PDF up to 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "bankProof")}
                        className="hidden"
                        disabled={uploadingBankProof}
                      />
                    </label>
                  )}
                  {uploadingBankProof && <p className="text-[10px] text-emerald-600 font-bold animate-pulse">Uploading Bank Document...</p>}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION 6: LEGAL AFFIRMATION & SUBMIT
                 ═══════════════════════════════════════════════════════════════ */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    I solemnly declare that all personal information, emergency contacts, residential address verified via India Postal PIN Code, government identity documents, and salary bank passbook details provided above are authentic, accurate, and complete. I authorize SAAMPARK Group to verify these credentials for operational onboarding and payroll remittance.
                  </span>
                </label>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  {rawKyc?.docNumber && (
                    <button
                      type="button"
                      onClick={() => setIsReuploading(false)}
                      className="text-xs font-bold text-zinc-500 hover:text-zinc-700 cursor-pointer"
                    >
                      ← Cancel &amp; Return to Review Status
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !declarationAccepted}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 ml-auto"
                  >
                    <span>{isSubmitting ? "Submitting Onboarding Credentials..." : "Submit All Credentials for Verification"}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}
