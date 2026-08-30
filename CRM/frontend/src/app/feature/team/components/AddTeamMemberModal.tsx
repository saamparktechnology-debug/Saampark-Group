"use client"

import * as React from "react"
import { X, Check, User, Mail, Phone, Briefcase, Building2, Layers, DollarSign, CreditCard } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { createTeamMember } from "@/app/feature/users/services/userService"
import { updateMemberBankingDetails } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTeamMemberModalProps) {
  const { branches, subBranches, activeCompanyId } = useAuthStore()
  
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [jobTitle, setJobTitle] = React.useState("Developer")
  const [department, setDepartment] = React.useState("Engineering & Delivery")
  const [branchId, setBranchId] = React.useState("")
  const [subBranchId, setSubBranchId] = React.useState("")
  const [baseSalary, setBaseSalary] = React.useState<number | "">("")
  const [bankName, setBankName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifscCode, setIfscCode] = React.useState("")
  const [upiId, setUpiId] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  if (!isOpen) return null

  // Available sub-branches matching branch
  const availableSubBranches = branchId
    ? subBranches.filter(sb => sb.parentBranchId === branchId)
    : subBranches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert("Please enter team member name.")
      return
    }

    setIsSaving(true)
    try {
      const selectedBranch = branches.find(b => b.id === branchId)

      const created = await createTeamMember({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: (jobTitle.trim() as any),
        department: department.trim(),
        branchId: branchId || undefined,
        branchName: selectedBranch?.name || undefined,
        companyId: activeCompanyId || "tech",
        status: "Active",
      }, activeCompanyId || "tech")

      if (created && (baseSalary !== "" || bankName || accountNumber || upiId)) {
        await updateMemberBankingDetails(created.id, {
          baseSalary: typeof baseSalary === "number" ? baseSalary : 0,
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          ifscCode: ifscCode.trim() || undefined,
          accountHolderName: name.trim(),
          upiId: upiId.trim() || undefined,
        }, activeCompanyId || "tech")
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error creating member:", err)
      alert("Failed to create team member.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Add New Team Member
              </h2>
              <p className="text-[11px] text-zinc-500">
                Onboard new staff member with role, branch, and banking profile.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Role / Designation *</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering & Delivery"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="rahul@saampark.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Office Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
              >
                <option value="">🏢 Central Office / HQ</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>📍 {b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Sub-Branch / Satellite</label>
              <select
                value={subBranchId}
                onChange={(e) => setSubBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium"
              >
                <option value="">None / Main Office</option>
                {availableSubBranches.map(sb => (
                  <option key={sb.id} value={sb.id}>🏢 {sb.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Base Salary & Banking */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Compensation & Banking (Optional)
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Base Monthly Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 35000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">UPI ID (e.g. rahul@okhdfc)</label>
                <input
                  type="text"
                  placeholder="rahul@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSaving} leftIcon={<Check size={14} />}>
              Create Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
