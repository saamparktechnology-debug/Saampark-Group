"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, User, Mail, Phone, Briefcase, Building2, Layers, DollarSign, CreditCard } from "lucide-react"
import { TeamMember } from "../members/page"
import { useAuthStore } from "@/store/useAuthStore"
import { updateUser } from "@/app/feature/users/services/userService"
import { updateMemberBankingDetails } from "../services/teamPaymentService"
import { Button } from "@/components/ui/Button"

interface EditTeamMemberModalProps {
  isOpen: boolean
  member: TeamMember | null
  onClose: () => void
  onSuccess: () => void
}

export function EditTeamMemberModal({
  isOpen,
  member,
  onClose,
  onSuccess,
}: EditTeamMemberModalProps) {
  const { branches, subBranches, activeCompanyId } = useAuthStore()
  
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [jobTitle, setJobTitle] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [branchId, setBranchId] = React.useState("")
  const [subBranchId, setSubBranchId] = React.useState("")
  const [baseSalary, setBaseSalary] = React.useState<number | "">("")
  const [status, setStatus] = React.useState<"Online" | "Offline">("Online")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (member) {
      setName(member.name || "")
      setEmail(member.email || "")
      setPhone(member.phone || "")
      setJobTitle(member.jobTitle || "")
      setDepartment(member.department || "Engineering & Delivery")
      setBranchId(member.branchId || "")
      setSubBranchId(member.subBranchId || "")
      setStatus(member.status || "Online")
    }
  }, [member])

  if (!isOpen || !member) return null

  // Available sub-branches matching branch
  const availableSubBranches = branchId
    ? subBranches.filter(sb => sb.parentBranchId === branchId)
    : subBranches

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert("Name is required.")
      return
    }

    setIsSaving(true)
    try {
      const selectedBranch = branches.find(b => b.id === branchId)
      const selectedSubBranch = subBranches.find(sb => sb.id === subBranchId)

      await updateUser(member.id || member.email, {
        name,
        email,
        phone,
        role: (jobTitle as any),
        department,
        branchId: branchId || undefined,
        branchName: selectedBranch?.name || undefined,
        status: status === "Online" ? "Active" : "Active",
      }, activeCompanyId || "tech")

      if (typeof baseSalary === "number" && baseSalary >= 0) {
        await updateMemberBankingDetails(member.id, {
          baseSalary,
        }, activeCompanyId || "tech")
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error updating member:", err)
      alert("Failed to update team member.")
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
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Edit Team Member Profile
              </h2>
              <p className="text-[11px] text-zinc-500">
                Update staff role, department, branch assignment & contact info.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Role / Designation</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Lead Designer"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
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

          <div>
            <label className="text-zinc-600 dark:text-zinc-400 font-semibold block mb-1">Availability Status</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="member_status"
                  checked={status === "Online"}
                  onChange={() => setStatus("Online")}
                />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">🟢 Online & Active</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="member_status"
                  checked={status === "Offline"}
                  onChange={() => setStatus("Offline")}
                />
                <span className="font-semibold text-zinc-500">⚪ Offline / On Leave</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSaving} leftIcon={<Check size={14} />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
